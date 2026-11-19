import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "potong-hening-audio", "name": "Potong Hening Audio", "cat": "musik", "icon": "✂️", "desc": "Buang bagian hening di awal, tengah, dan akhir audio.", "keywords": "audio,hening,diam,potong,sunyi,trim,silence", "since": "6.17.0"};

/* Deteksi hening per jendela 10 ms (RMS), gabungkan bagian bersuara yang
   jaraknya kurang dari 200 ms, beri jeda 100 ms di tiap sisi supaya awal
   kata tidak terpotong. Fungsi murni, diuji di Node. */
export function trimSilenceChannels(channels, sampleRate, thresholdDb) {
  const len = channels[0].length;
  const win = Math.max(1, Math.floor(sampleRate * 0.01));
  const threshold = Math.pow(10, thresholdDb / 20);
  const numWin = Math.ceil(len / win);
  const loud = new Array(numWin).fill(false);
  for (let w = 0; w < numWin; w++) {
    const start = w * win;
    const end = Math.min(len, start + win);
    let sum = 0;
    let n = 0;
    for (let c = 0; c < channels.length; c++) {
      const ch = channels[c];
      for (let i = start; i < end; i++) { sum += ch[i] * ch[i]; n++; }
    }
    const rms = Math.sqrt(sum / Math.max(1, n));
    loud[w] = rms > threshold;
  }
  // Gabung jendela bersuara yang jaraknya < 200 ms (jeda napas tetap dipertahankan).
  const mergeGap = Math.ceil(0.2 / 0.01);
  const regions = [];
  let s = -1, lastLoud = -1;
  for (let w = 0; w < numWin; w++) {
    if (loud[w]) {
      if (s < 0) { s = w; lastLoud = w; }
      else if (w - lastLoud <= mergeGap) { lastLoud = w; }
      else { regions.push([s, lastLoud]); s = w; lastLoud = w; }
    }
  }
  if (s >= 0) regions.push([s, lastLoud]);
  // Jeda 100 ms di tiap sisi region.
  const pad = Math.ceil(0.1 / 0.01);
  const spans = regions.map(([a, b]) => [
    Math.max(0, (a - pad) * win),
    Math.min(len, (b + 1 + pad) * win),
  ]);
  const kept = spans.reduce((t, [a, b]) => t + (b - a), 0);
  const out = channels.map(() => new Float32Array(kept));
  let off = 0;
  for (const [a, b] of spans) {
    for (let c = 0; c < channels.length; c++) out[c].set(channels[c].subarray(a, b), off);
    off += b - a;
  }
  return {
    channels: out,
    keptFrames: kept,
    removedFrames: len - kept,
    regions: spans.length,
    totalFrames: len,
  };
}

// encodeWav kanonis tinggal di utils (core.js).

export function render(root) {
  const LEVELS = [
    ['-50', 'Hanya yang benar-benar hening'],
    ['-40', 'Hening biasa (disarankan)'],
    ['-30', 'Termasuk yang agak pelan'],
  ];
  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const prevBox = T.out();
  const levelSel = T.select(LEVELS, '-40');
  let fileObj = null, duration = 0, busy = false, lastUrl = null;

  const goBtn = T.btn('Potong bagian hening', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    T.hide(prevBox);
    T.show(outBox, '<span class="dim">Sedang mencari bagian hening…</span>');
    try {
      const ab = await fileObj.arrayBuffer();
      const decoded = await T.actx().decodeAudioData(ab);
      const channels = [];
      for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c));
      const res = trimSilenceChannels(channels, decoded.sampleRate, parseFloat(levelSel.value));
      if (res.keptFrames <= 0) {
        T.show(outBox, errBox('Seluruh audio terbaca hening pada pilihan ini. Coba pilihan yang lebih peka, atau cek apakah file-nya memang berisi suara.'));
        return;
      }
      const blob = utils.encodeWav(res.channels, decoded.sampleRate);
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = lastUrl;
      audio.style.width = '100%';
      T.show(prevBox, '<p class="hint" style="margin-bottom:8px">Dengarkan dulu hasilnya di sini:</p>');
      prevBox.appendChild(audio);
      const before = decoded.duration;
      const after = res.keptFrames / decoded.sampleRate;
      T.show(outBox, '<span class="ok">Selesai. Bagian hening sudah dipotong.</span>' +
        kv('Durasi awal', before.toFixed(1) + ' detik') +
        kv('Durasi hasil', after.toFixed(1) + ' detik') +
        kv('Yang dipotong', (before - after).toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      outBox.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl(base + '-rapat.wav', blob, 'audio/wav'), true)));
      T.toast('Audio rapat siap');
    } catch (e) {
      T.show(outBox, errBox('File ini tidak bisa dibaca sebagai audio. Coba file MP3, WAV, atau M4A lain.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  file.addEventListener('change', () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    T.hide(outBox);
    T.hide(prevBox);
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

  T.onLeave(() => { if (lastUrl) URL.revokeObjectURL(lastUrl); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cocok untuk rekaman suara atau podcast yang jedanya kepanjangan. Bagian bersuara disambung rapat, dengan jeda napas singkat tetap dipertahankan supaya tidak terdengar terpotong.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Seberapa hening yang dipotong', levelSel, 'Kalau suara pelan ikut hilang, coba pilihan yang lebih peka.'));
  root.appendChild(T.row(goBtn));
  root.appendChild(prevBox);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Hasilnya format WAV, jadi ukurannya lebih besar dari MP3.</p>'));
}
