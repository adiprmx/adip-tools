import { h as T, utils, fmtBytes, errBox } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "audio-trimmer", "name": "Audio Trimmer", "cat": "musik", "icon": "✂️", "desc": "Potong audio di browser, export WAV, MP3, M4A, atau OGG, dengan fade. Bisa ekstrak audio dari video.", "keywords": "audio,potong,mp3,m4a,ogg,wav,trim,fade,video,ekstrak"};
export function render(root) {

    const file = T.input('file');
    file.accept = 'audio/*,video/*';
    const wrap = T.el('<div></div>');
    let buf = null, srcNode = null, origFile = null, busy = false, dariVideo = false;
    T.onLeave(() => { try { srcNode && srcNode.stop(); } catch (e) {} if (busy) cancelFFmpeg(); });
    const stopPrev = () => { try { srcNode && srcNode.stop(); } catch (e) {} srcNode = null; };
    // parseNum kanonis tinggal di utils (core.js).

    const drawWave = (canvas, s0, s1, fi, fo) => {
      const W = canvas.width = Math.min(720, canvas.clientWidth * 2 || 640), H = canvas.height = 160;
      const g = canvas.getContext('2d');
      const ch = buf.getChannelData(0), len = buf.length;
      g.fillStyle = '#18181b'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8b8b93';
      const step = Math.max(1, Math.floor(len / W));
      for (let x = 0; x < W; x++) {
        let mn = 1, mx = -1;
        for (let i = x * step; i < (x + 1) * step && i < len; i += 4) {
          const v = ch[i];
          if (v < mn) mn = v; if (v > mx) mx = v;
        }
        const y1 = (1 - (mx + 1) / 2) * H, y2 = (1 - (mn + 1) / 2) * H;
        g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
      }
      // area potongan
      const x0 = (s0 / buf.duration) * W, x1 = (s1 / buf.duration) * W;
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0, 0, x0, H); g.fillRect(x1, 0, W - x1, H);
      // zona fade di dalam potongan
      if (fi > 0) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x0, 0, (fi / buf.duration) * W, H); }
      if (fo > 0) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x1 - (fo / buf.duration) * W, 0, (fo / buf.duration) * W, H); }
      g.fillStyle = '#fff'; g.fillRect(x0 - 1, 0, 2, H); g.fillRect(x1 - 1, 0, 2, H);
    };

    const encodeWav = (s0, s1, fi, fo) => {
      const sr = buf.sampleRate, nCh = buf.numberOfChannels;
      const a = Math.max(0, Math.floor(s0 * sr)), b = Math.min(buf.length, Math.floor(s1 * sr));
      const frames = Math.max(0, b - a);
      const segDur = frames / sr;
      const ab = new ArrayBuffer(44 + frames * nCh * 2), v = new DataView(ab);
      const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      ws(0, 'RIFF'); v.setUint32(4, ab.byteLength - 8, true); ws(8, 'WAVE');
      ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
      v.setUint16(22, nCh, true); v.setUint32(24, sr, true);
      v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true); v.setUint16(34, 16, true);
      ws(36, 'data'); v.setUint32(40, frames * nCh * 2, true);
      const chans = [];
      for (let c = 0; c < nCh; c++) chans.push(buf.getChannelData(c));
      let o = 44;
      for (let i = a; i < b; i++) for (let c = 0; c < nCh; c++) {
        const t = (i - a) / sr;
        let gain = 1;
        if (fi > 0 && t < fi) gain = Math.min(gain, t / fi);
        if (fo > 0 && t > segDur - fo) gain = Math.min(gain, Math.max(0, (segDur - t) / fo));
        const x = Math.max(-1, Math.min(1, chans[c][i] * gain));
        v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2;
      }
      return new Blob([ab], { type: 'audio/wav' });
    };

    // Ekstrak trek audio dari file video (MP4/WebM/dll) jadi WAV lewat
    // ffmpeg, supaya bisa dipotong seperti file audio biasa.
    // Bila gagal, penyebabnya dibedakan: video tanpa trek audio (kode
    // TANPA_AUDIO, dibuktikan lewat probe stream) vs mesin tidak didukung
    // (kode NO_FFMPEG) vs gagal umum — supaya pesan ke pengguna tepat,
    // bukan tebakan dari teks log (baris log terakhir ffmpeg tidak andal:
    // untuk video tanpa suara ia berakhir "Invalid argument", sama seperti
    // file rusak).
    const ekstrakDariVideo = async (f, onTahap) => {
      const sup = supportsFFmpeg();
      if (!sup.ok) { const e = new Error(sup.reason); e.code = 'NO_FFMPEG'; throw e; }
      busy = true;
      try {
        const { ffmpeg, fetchFile } = await loadFFmpeg((st) => { if (onTahap) onTahap(st.label, st.pct || 0); });
        const ext = (f.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
        const inName = 'video' + ext;
        const outName = 'audio.wav';
        if (onTahap) onTahap('Menyalin video ke mesin…', 0);
        await ffmpeg.writeFile(inName, await fetchFile(f));
        if (onTahap) onTahap('Mengekstrak audio dari video…', 0);
        try {
          await runFFmpeg(ffmpeg, ['-i', inName, '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', outName], (p) => {
            if (onTahap) onTahap('Mengekstrak audio dari video… ' + Math.round(p * 100) + '%', Math.round(p * 100));
          });
        } catch (err) {
          if (isCancelled(err)) throw err;
          // Ekstrak gagal: cek apakah videonya memang tidak punya trek
          // audio. Probe singkat (0,1 dtk, hanya kode keluar): stream
          // video bisa dibaca tapi stream audio tidak ada/tidak bisa
          // dibaca = video tanpa suara. File rusak gagal di kedua probe.
          const probeOk = async (map) => {
            try { await runFFmpeg(ffmpeg, ['-i', inName, '-map', map, '-t', '0.1', '-f', 'null', '/dev/null']); return true; }
            catch (e2) { return false; }
          };
          const adaVideo = await probeOk('0:v');
          const adaAudio = await probeOk('0:a');
          await cleanupFFmpeg(ffmpeg, [inName, outName]);
          if (adaVideo && !adaAudio) { const e3 = new Error('Video ini tidak punya trek audio.'); e3.code = 'TANPA_AUDIO'; throw e3; }
          throw err;
        }
        const data = await ffmpeg.readFile(outName);
        await cleanupFFmpeg(ffmpeg, [inName, outName]);
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } finally { busy = false; }
    };

    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      stopPrev();
      origFile = f;
      const isVideo = /^video\//i.test(f.type || '') || /\.(mp4|webm|mov|mkv|avi|3gp)$/i.test(f.name || '');
      dariVideo = isVideo;
      wrap.innerHTML = '';
      try {
        const c = T.actx();
        if (isVideo) {
          const statusEl = T.el('<p class="dim" style="font-size:13px">Mengekstrak audio dari video…</p>');
          wrap.appendChild(statusEl);
          const wavBuf = await ekstrakDariVideo(f, (label) => { statusEl.textContent = label; });
          buf = await c.decodeAudioData(wavBuf);
          wrap.innerHTML = '';
        } else {
          buf = await c.decodeAudioData(await f.arrayBuffer());
        }
      } catch (e) {
        if (isVideo && e && e.code === 'TANPA_AUDIO') {
          wrap.innerHTML = '<p class="err">Video ini tidak punya suara — tidak ada trek audio yang bisa diekstrak. Coba video lain yang ada suaranya.</p>';
        } else if (isVideo && e && e.code === 'NO_FFMPEG') {
          wrap.innerHTML = errBox(e.message);
        } else {
          wrap.innerHTML = '<p class="err">' + (isVideo ? 'Gagal mengekstrak audio dari video. Coba file MP4/WebM lain, atau pastikan mesin ffmpeg bisa dimuat.' : 'Gagal membaca file audio. Coba file MP3/WAV/OGG lain.') + '</p>';
        }
        return;
      }
      wrap.innerHTML = '';
      const info = T.el('<p class="mut" style="font-size:13px"></p>');
      const canvas = T.el('<canvas class="prev" style="width:100%;cursor:pointer"></canvas>');
      // Input desimal pakai text + inputMode, bukan number, supaya koma
      // desimal Indonesia tidak bermasalah.
      const sIn = T.input('text', '0', '0'); sIn.inputMode = 'decimal';
      const eIn = T.input('text', '', buf.duration.toFixed(2)); eIn.inputMode = 'decimal';
      const fiIn = T.input('text', '0', '0'); fiIn.inputMode = 'decimal';
      const foIn = T.input('text', '0', '0'); foIn.inputMode = 'decimal';
      const fmtSel = T.select([['wav', 'WAV (tanpa kompresi)'], ['mp3', 'MP3'], ['m4a', 'M4A'], ['ogg', 'OGG Vorbis']], 'wav');
      const bitSel = T.select([['128', '128 kbps (hemat)'], ['192', '192 kbps (seimbang)'], ['320', '320 kbps (kualitas tinggi)']], '192');
      const fBitrate = T.field('Kualitas suara (bitrate)', bitSel, 'Makin tinggi makin bagus, tapi ukuran file makin besar.');
      fBitrate.hidden = true;
      const clickSel = T.select([['mulai', 'Titik mulai'], ['selesai', 'Titik selesai']], 'mulai');
      const outBox = T.out();
      const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
      const barFill = T.el('<div style="height:8px;width:0%;background:#fff;border-radius:99px;transition:width .2s"></div>');
      const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
      barTrack.appendChild(barFill);
      const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
      barWrap.appendChild(barTrack);
      barWrap.appendChild(barLabel);
      const setStage = (label, pct) => {
        barWrap.hidden = false;
        barLabel.textContent = label;
        barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
      };
      const getRange = () => {
        let s = Math.max(0, utils.parseNum(sIn.value, 0)), e = Math.min(buf.duration, utils.parseNum(eIn.value, buf.duration));
        if (e <= s) e = Math.min(buf.duration, s + 1);
        return [s, e];
      };
      const getFades = () => {
        const [s, e] = getRange();
        const seg = Math.max(0.1, e - s);
        let fi = Math.min(5, Math.max(0, utils.parseNum(fiIn.value, 0)));
        let fo = Math.min(5, Math.max(0, utils.parseNum(foIn.value, 0)));
        if (fi + fo >= seg) { const k = (seg * 0.9) / (fi + fo || 1); fi *= k; fo *= k; }
        return [fi, fo];
      };
      const refresh = () => {
        const [s, e] = getRange();
        const [fi, fo] = getFades();
        info.textContent = 'Durasi ' + (dariVideo ? 'audio dari video' : 'file') + ' ' + buf.duration.toFixed(2) + ' dtk · potongan ' + (e - s).toFixed(2) + ' dtk' + (fi > 0 || fo > 0 ? ' · fade ' + fi.toFixed(1) + ' dtk / ' + fo.toFixed(1) + ' dtk' : '');
        drawWave(canvas, s, e, fi, fo);
        dlBtn.textContent = 'Export ' + fmtSel.value.toUpperCase();
      };
      canvas.addEventListener('click', (ev) => {
        const r = canvas.getBoundingClientRect();
        const t = Math.max(0, Math.min(buf.duration, ((ev.clientX - r.left) / r.width) * buf.duration));
        if (clickSel.value === 'mulai') sIn.value = t.toFixed(2);
        else eIn.value = t.toFixed(2);
        refresh();
      });
      const playBtn = T.btn('Putar potongan', () => {
        stopPrev();
        let c;
        try { c = T.actx(); } catch (e) { T.toast('Audio tidak tersedia di browser ini'); return; }
        const [s, e] = getRange();
        const [fi, fo] = getFades();
        const seg = e - s;
        srcNode = c.createBufferSource();
        srcNode.buffer = buf;
        const g = c.createGain();
        const now = c.currentTime;
        if (fi > 0) { g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + fi); }
        if (fo > 0) { g.gain.setValueAtTime(1, now + Math.max(fi, seg - fo)); g.gain.linearRampToValueAtTime(0, now + seg); }
        srcNode.connect(g); g.connect(c.destination);
        srcNode.start(0, s, seg);
        T.toast('Memutar ' + seg.toFixed(1) + ' detik');
      }, true);
      const stopBtn = T.btn('Stop', stopPrev);
      const exportFfmpeg = async (fmt) => {
        const sup = supportsFFmpeg();
        if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
        busy = true;
        dlBtn.disabled = true;
        cancelBtn.hidden = false;
        T.hide(outBox);
        const [s, e] = getRange();
        const [fi, fo] = getFades();
        const seg = e - s;
        const ext = (origFile.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
        const inName = 'input' + ext;
        const outName = 'output.' + fmt;
        const base = origFile.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
        try {
          const { ffmpeg, fetchFile } = await loadFFmpeg((st) => {
            if (st.stage === 'unduh') setStage(st.label, st.pct);
            else setStage(st.label, st.stage === 'siap' ? 100 : 0);
          });
          setStage('Menyalin audio ke mesin…', 0);
          await ffmpeg.writeFile(inName, await fetchFile(origFile));
          const args = ['-ss', String(s), '-t', String(seg), '-i', inName, '-vn'];
          const fades = [];
          if (fi > 0) fades.push('afade=t=in:st=0:d=' + fi.toFixed(3));
          if (fo > 0) fades.push('afade=t=out:st=' + Math.max(0, seg - fo).toFixed(3) + ':d=' + fo.toFixed(3));
          if (fades.length) args.push('-af', fades.join(','));
          const bitrate = (bitSel.value || '192') + 'k';
          if (fmt === 'mp3') args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
          else if (fmt === 'ogg') args.push('-c:a', 'libvorbis', '-b:a', bitrate);
          else args.push('-c:a', 'aac', '-b:a', bitrate);
          args.push(outName);
          setStage('Mengekspor ' + fmt.toUpperCase() + '… 0%', 0);
          await runFFmpeg(ffmpeg, args, (p) => {
            const pct = Math.round(p * 100);
            setStage('Mengekspor ' + fmt.toUpperCase() + '… ' + pct + '%', pct);
          });
          const data = await ffmpeg.readFile(outName);
          await cleanupFFmpeg(ffmpeg, [inName, outName]);
          const mime = fmt === 'mp3' ? 'audio/mpeg' : fmt === 'ogg' ? 'audio/ogg' : 'audio/mp4';
          const blob = new Blob([data], { type: mime });
          T.dl(base + '-potongan.' + fmt, blob, blob.type);
          T.show(outBox, '<span class="ok">' + fmt.toUpperCase() + ' terunduh (' + fmtBytes(blob.size) + ').</span>');
          T.toast(fmt.toUpperCase() + ' terunduh');
        } catch (err) {
          if (isCancelled(err)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
          else T.show(outBox, errBox(friendlyError(err)));
        } finally {
          busy = false;
          dlBtn.disabled = false;
          cancelBtn.hidden = true;
          barWrap.hidden = true;
          barFill.style.width = '0%';
        }
      };
      const dlBtn = T.btn('Export WAV', () => {
        const fmt = fmtSel.value;
        if (fmt === 'wav') {
          const [s, e] = getRange();
          const [fi, fo] = getFades();
          T.dl('potongan-' + Math.round(s) + '-' + Math.round(e) + 's.wav', encodeWav(s, e, fi, fo), 'audio/wav');
          T.show(outBox, '<span class="ok">WAV terunduh.</span>');
          T.toast('WAV diunduh');
          return;
        }
        exportFfmpeg(fmt);
      });
      const cancelBtn = T.btn('Batalkan', () => { cancelFFmpeg(); });
      cancelBtn.hidden = true;
      [sIn, eIn, fiIn, foIn].forEach((i) => i.addEventListener('input', refresh));
      fmtSel.addEventListener('change', () => { fBitrate.hidden = fmtSel.value === 'wav'; refresh(); });
      wrap.appendChild(info);
      wrap.appendChild(canvas);
      wrap.appendChild(T.field('Ketuk gelombang untuk mengatur', clickSel, 'Ketuk di mana saja pada gelombang untuk memindah titik mulai atau titik selesai.'));
      wrap.appendChild(T.grid2(T.field('Mulai (detik)', sIn), T.field('Selesai (detik)', eIn)));
      wrap.appendChild(T.grid2(T.field('Fade masuk (detik, 0-5)', fiIn, 'Suara muncul pelan dari hening.'), T.field('Fade keluar (detik, 0-5)', foIn, 'Suara menghilang pelan di akhir.')));
      wrap.appendChild(T.field('Format hasil', fmtSel, 'MP3, M4A, dan OGG memakai mesin unduhan ' + CORE_SIZE_LABEL + ' sekali di awal. Mau konversi saja tanpa potong? Biarkan titik mulai 0 dan titik selesai di ujung.'));
      wrap.appendChild(fBitrate);
      wrap.appendChild(T.row(playBtn, stopBtn, dlBtn, cancelBtn));
      wrap.appendChild(barWrap);
      wrap.appendChild(outBox);
      wrap.appendChild(T.el('<p class="hint">Semua proses jalan lokal di browser, file tidak di-upload ke mana pun. Export WAV menghasilkan WAV 16-bit dan langsung jadi tanpa mesin tambahan. File video (MP4/WebM) diekstrak dulu audionya, lalu bisa dipotong seperti biasa.</p>'));
      requestAnimationFrame(refresh);
    });
    root.appendChild(T.field('Pilih file audio atau video', file, 'Audio: MP3, WAV, OGG, M4A… Video: MP4, WebM, MOV — audionya diekstrak otomatis.'));
    root.appendChild(wrap);
  
}
