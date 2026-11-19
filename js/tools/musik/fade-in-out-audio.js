import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "fade-in-out-audio", "name": "Fade In/Out Audio", "cat": "musik", "icon": "🌅", "desc": "Buat awal audio muncul perlahan dan akhirnya menghilang perlahan.", "keywords": "audio,fade,masuk,keluar,halus,awal,akhir", "since": "6.17.0"};

/* Susun filter afade ffmpeg. Fade dijaga supaya totalnya tidak melebihi
   durasi (tiap fade maksimal setengah durasi). Fungsi murni, diuji di Node. */
export function buildFadeFilter(duration, fadeIn, fadeOut) {
  const dur = Math.max(0, duration || 0);
  const fi = Math.max(0, Math.min(fadeIn || 0, dur / 2));
  const fo = Math.max(0, Math.min(fadeOut || 0, dur / 2));
  const parts = [];
  if (fi > 0) parts.push('afade=t=in:st=0:d=' + fi);
  if (fo > 0) parts.push('afade=t=out:st=' + Math.max(0, dur - fo) + ':d=' + fo);
  return parts.join(',');
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const fadeInSel = T.select([
    ['0', 'Tidak ada'],
    ['1', '1 detik'],
    ['2', '2 detik'],
    ['3', '3 detik'],
    ['5', '5 detik'],
    ['10', '10 detik'],
  ], '2');
  const fadeOutSel = T.select([
    ['0', 'Tidak ada'],
    ['1', '1 detik'],
    ['2', '2 detik'],
    ['3', '3 detik'],
    ['5', '5 detik'],
    ['10', '10 detik'],
  ], '2');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // measureDur kanonis tinggal di utils (core.js) — panggil utils.measureDur(blob, 'audio').
  // Durasi dari metadata <audio>; bila tidak terbaca, ukur lewat decode.
  const ensureDuration = async () => {
    if (duration > 0) return duration;
    try {
      const ab = await fileObj.arrayBuffer();
      const decoded = await T.actx().decodeAudioData(ab);
      duration = decoded.duration || 0;
    } catch (e) { duration = 0; }
    return duration;
  };

  const goBtn = T.btn('Tambah fade', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    const fadeIn = parseFloat(fadeInSel.value);
    const fadeOut = parseFloat(fadeOutSel.value);
    if (fadeIn <= 0 && fadeOut <= 0) { T.show(outBox, errBox('Pilih dulu fade masuk atau fade keluarnya, minimal satu.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    try {
      setStage('Mengukur durasi…', 0);
      const dur = await ensureDuration();
      if (dur <= 0) throw new Error('Durasi audio tidak bisa dibaca, jadi fade keluar tidak bisa dipasang.');
      const af = buildFadeFilter(dur, fadeIn, fadeOut);
      if (!af) throw new Error('Fade tidak bisa dipasang pada audio ini.');
      const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
      const inName = 'input' + ext;
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin audio ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = ['-i', inName, '-vn', '-af', af, '-c:a', 'libmp3lame', '-b:a', '192k', 'output.mp3'];
      setStage('Menambah fade… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Menambah fade… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp3');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp3']);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      T.dl(base + '-fade.mp3', blob, 'audio/mpeg');
      const outDur = await utils.measureDur(blob, 'audio');
      T.show(outBox, '<span class="ok">Selesai. Audio terunduh.</span>' +
        kv('Fade masuk', fadeIn > 0 ? fadeIn + ' detik' : 'Tidak ada') +
        kv('Fade keluar', fadeOut > 0 ? fadeOut + ' detik' : 'Tidak ada') +
        kv('Durasi', (outDur || dur).toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.toast('Audio terunduh');
    } catch (e) {
      if (isCancelled(e)) { T.show(outBox, '<span class="dim">Dibatalkan.</span>'); }
      else T.show(outBox, errBox(friendlyError(e)));
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

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox);
    if (!fileObj) { T.hide(infoBox); return; }
    const url = URL.createObjectURL(fileObj);
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      duration = a.duration || 0;
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', duration ? duration.toFixed(1) + ' detik' : 'tidak terbaca') +
        kv('Ukuran', fmtBytes(fileObj.size)));
      URL.revokeObjectURL(url);
    };
    a.onerror = () => {
      duration = 0;
      T.show(infoBox, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)) + '<p class="dim" style="font-size:13px;margin:8px 0 0">Durasi tidak terbaca, tapi proses tetap bisa dicoba.</p>');
      URL.revokeObjectURL(url);
    };
    a.src = url;
  });

  T.onLeave(() => { if (busy) cancelFFmpeg(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Awal lagu yang muncul perlahan terdengar lebih halus, begitu juga akhir yang menghilang pelan-pelan. Cocok untuk intro podcast, backsound video, atau lagu yang mau dipakai sebagai pengiring.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Fade masuk (awal)', fadeInSel), T.field('Fade keluar (akhir)', fadeOutSel)));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
