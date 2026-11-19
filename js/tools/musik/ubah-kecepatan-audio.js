import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';
import { loadFFmpeg, runFFmpeg, cancelFFmpeg, cleanupFFmpeg, friendlyError, isCancelled, supportsFFmpeg, CORE_SIZE_LABEL } from '../../ffmpeg-loader.js';

export const meta = {"id": "ubah-kecepatan-audio", "name": "Ubah Kecepatan Audio", "cat": "musik", "icon": "⏱️", "desc": "Percepat atau perlambat audio, nada bisa tetap atau ikut berubah.", "keywords": "audio,kecepatan,cepat,lambat,tempo,nada", "since": "6.16.0"};

export function render(root) {
  const SPEEDS = [
    ['0.5', 'Setengah kecepatan (0,5x, lebih lambat)'],
    ['0.75', 'Sedikit lebih lambat (0,75x)'],
    ['1.25', 'Sedikit lebih cepat (1,25x)'],
    ['1.5', 'Satu setengah kali (1,5x)'],
    ['2', 'Dua kali lipat (2x)'],
  ];
  const MODES = [
    ['tetap', 'Nada tetap sama (suara tidak cempreng)'],
    ['ikut', 'Nada ikut berubah (seperti kaset dipercepat)'],
  ];

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

  const speedSel = T.select(SPEEDS, '1.5');
  const modeSel = T.select(MODES, 'tetap');

  let fileObj = null, duration = 0, busy = false;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };
  // Durasi hasil DIUKUR dari file jadi, bukan dihitung dari rumus.
  // measureDur kanonis tinggal di utils (core.js) — panggil utils.measureDur(blob, 'audio').

  const goBtn = T.btn('Ubah kecepatan', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    const sup = supportsFFmpeg();
    if (!sup.ok) { T.show(outBox, errBox(sup.reason)); return; }
    busy = true;
    goBtn.disabled = true;
    cancelBtn.hidden = false;
    T.hide(outBox);
    const speed = parseFloat(speedSel.value);
    // Nada tetap: atempo mengubah tempo tanpa mengubah nada (rentang
    // 0,5 sampai 2, pas dengan pilihan di atas). Nada ikut: asetrate
    // mengubah kecepatan putar mentah lalu aresample mengembalikan ke
    // 44100 Hz, jadi nada naik saat dipercepat dan turun saat diperlambat.
    const af = modeSel.value === 'tetap'
      ? 'atempo=' + speed
      : 'asetrate=' + Math.round(44100 * speed) + ',aresample=44100';
    const ext = (fileObj.name.match(/\.[a-z0-9]+$/i) || ['.mp3'])[0].toLowerCase();
    const inName = 'input' + ext;
    const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
    try {
      const { ffmpeg, fetchFile } = await loadFFmpeg((s) => {
        if (s.stage === 'unduh') setStage(s.label, s.pct);
        else setStage(s.label, s.stage === 'siap' ? 100 : 0);
      });
      setStage('Menyalin audio ke mesin…', 0);
      await ffmpeg.writeFile(inName, await fetchFile(fileObj));
      const args = ['-i', inName, '-vn', '-af', af, '-c:a', 'libmp3lame', '-b:a', '192k', 'output.mp3'];
      setStage('Mengubah kecepatan… 0%', 0);
      await runFFmpeg(ffmpeg, args, (p) => {
        const pct = Math.round(p * 100);
        setStage('Mengubah kecepatan… ' + pct + '%', pct);
      });
      const data = await ffmpeg.readFile('output.mp3');
      await cleanupFFmpeg(ffmpeg, [inName, 'output.mp3']);
      const blob = new Blob([data], { type: 'audio/mpeg' });
      T.dl(base + '-' + speedSel.value.replace('.', 'p') + 'x.mp3', blob, 'audio/mpeg');
      const outDur = await utils.measureDur(blob, 'audio');
      const newDur = outDur || (duration ? duration / speed : 0);
      T.show(outBox, '<span class="ok">Selesai. Audio terunduh.</span>' +
        kv('Kecepatan', speedSel.value.replace('.', ',') + 'x') +
        kv('Nada', modeSel.value === 'tetap' ? 'Tetap sama' : 'Ikut berubah') +
        kv('Durasi baru', newDur ? newDur.toFixed(1) + ' detik' : '-') +
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Percepat rekaman atau podcast yang terlalu lama, atau perlambat lagu untuk dipelajari. Pilih nada tetap supaya suara tidak cempreng, atau nada ikut berubah seperti kaset lama.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.grid2(T.field('Kecepatan baru', speedSel), T.field('Nada suara', modeSel)));
  root.appendChild(T.row(goBtn, cancelBtn));
  root.appendChild(barWrap);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Pertama kali dipakai, mesin ' + CORE_SIZE_LABEL + ' diunduh sekali, lalu dipakai ulang untuk semua tool video dan audio di sini.</p>'));
}
