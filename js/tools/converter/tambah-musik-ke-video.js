import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "tambah-musik-ke-video", "name": "Tambah Musik ke Video", "cat": "converter", "icon": "🎵", "desc": "Tempel lagu sebagai musik latar video.", "keywords": "video,musik,audio,lagu,latar,backsound", "since": "6.17.0", "online": true};

export function render(root) {
  const fileVideo = T.input('file');
  fileVideo.accept = 'video/*';
  const fileAudio = T.input('file');
  fileAudio.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const modeSel = T.select([
    ['ganti', 'Ganti suara asli dengan lagu'],
    ['campur', 'Campur lagu dengan suara asli'],
  ], 'ganti');
  const volSel = T.select([
    ['0.5', 'Pelan (setengah)'],
    ['1', 'Normal'],
    ['1.5', 'Keras'],
  ], '1');

  let videoObj = null, audioObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  fileVideo.addEventListener('change', () => {
    videoObj = fileVideo.files && fileVideo.files[0] ? fileVideo.files[0] : null;
    T.hide(outBox);
    if (!videoObj) { T.hide(infoBox); return; }
    const url = URL.createObjectURL(videoObj);
    const v = document.createElement('video');
    const vDipilih = videoObj;
    v.preload = 'metadata';
    v.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(v);
      if (videoObj !== vDipilih) { URL.revokeObjectURL(url); return; }
      duration = d;
      T.show(infoBox,
        kv('Video', T.esc(videoObj.name)) +
        kv('Durasi video', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca'));
      URL.revokeObjectURL(url);
    };
    v.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('Video', T.esc(videoObj.name)));
      URL.revokeObjectURL(url);
    };
    v.src = url;
  });
  fileAudio.addEventListener('change', () => {
    audioObj = fileAudio.files && fileAudio.files[0] ? fileAudio.files[0] : null;
    T.hide(outBox);
  });

  const goBtn = T.btn('Tempel musik ke video', async () => {
    if (busy) return;
    if (!videoObj) { T.show(outBox, errBox('Pilih dulu file videonya.')); return; }
    if (!audioObj) { T.show(outBox, errBox('Pilih dulu file lagunya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const extV = (videoObj.name.match(/\.[a-z0-9]+$/i) || ['.mp4'])[0].toLowerCase();
    const extA = (audioObj.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
    const inV = 'input' + extV;
    const inA = 'musik' + extA;
    const base = videoObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'video';
    const vol = volSel.value;
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin video dan lagu ke mesin…', 0);
      await ffmpeg.writeFile(inV, await fetchFile(videoObj));
      await ffmpeg.writeFile(inA, await fetchFile(audioObj));
      // Lagu diulang otomatis bila lebih pendek dari video, supaya musik
      // mengisi seluruh durasi video.
      const ganti = ['-i', inV, '-stream_loop', '-1', '-i', inA, '-map', '0:v:0', '-map', '1:a:0', '-af', 'volume=' + vol, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', 'output.mp4'];
      const campur = ['-i', inV, '-stream_loop', '-1', '-i', inA, '-filter_complex', '[1:a]volume=' + vol + '[musik];[0:a][musik]amix=inputs=2:duration=first:dropout_transition=0[aout]', '-map', '0:v:0', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', 'output.mp4'];
      setStage('Menempel musik… 0%', 0);
      const prog = (p) => { const pct = Math.round(p * 100); setStage('Menempel musik… ' + pct + '%', pct); };
      if (modeSel.value === 'campur') {
        try {
          await runFFmpeg(ffmpeg, campur, prog);
        } catch (e) {
          if (isCancelled(e)) throw e;
          // Video tanpa suara asli tidak bisa dicampur: ganti saja.
          await cleanupFFmpeg(ffmpeg, ['output.mp4']);
          setStage('Video ini tidak bersuara, memakai lagu saja… 0%', 0);
          await runFFmpeg(ffmpeg, ganti, prog);
        }
      } else {
        await runFFmpeg(ffmpeg, ganti, prog);
      }
      const data = await ffmpeg.readFile('output.mp4');
      await cleanupFFmpeg(ffmpeg, [inV, inA, 'output.mp4']);
      const blob = new Blob([data], { type: 'video/mp4' });
      T.dl(base + '-musik.mp4', blob, 'video/mp4');
      T.show(outBox, '<span class="ok">Selesai. Video dengan musik terunduh.</span>' +
        kv('Lagu', T.esc(audioObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : '-') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Video terunduh');
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else {
        T.show(outBox, errBox(friendlyError(e)));
        const retry = T.btn('Coba lagi', () => goBtn.click());
        outBox.appendChild(retry);
      }
    } finally {
      busy = false;
      goBtn.disabled = false;
      cancelBtn.hidden = true;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  }, true);
  const cancelBtn = T.btn('Batalkan', () => { cancelFFmpeg(); });
  cancelBtn.hidden = true;

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel lagu ke video. Lagunya bisa menggantikan suara asli, atau dicampur dengan suara asli. Bila lagunya lebih pendek dari video, lagunya diulang otomatis sampai videonya selesai.</p>'));
  root.appendChild(T.field('Pilih video', fileVideo, 'MP4, MOV, MKV, WebM, dan format video umum lainnya'));
  root.appendChild(T.field('Pilih lagu', fileAudio, 'MP3, WAV, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Cara menempel', modeSel), T.field('Kerasnya lagu', volSel)));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Videomu tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
