import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "hapus-noise-audio", "name": "Hapus Noise Audio", "cat": "musik", "icon": "🔇", "desc": "Kurangi dengung dan desah latar di rekaman suara.", "keywords": "noise,dengung,desah,bersihkan audio,rekaman,suara bersih", "since": "6.17.0"};

/* Pembersih dua lapis, tanpa AI:
   1. Saringan lolos-atas satu kutub (~90 Hz) memotong dengung rendah.
   2. Gerbang derau: lantai derau diukur dari 10% jendela paling pelan,
      jendela di bawah ambang dilemahkan (bukan dibungkam total, supaya
      tidak terdengar putus-putus). Penguatan dihaluskan antar jendela
      (buka cepat, tutup pelan) supaya awal kata tidak terpotong.
   Fungsi murni, diuji di Node. */
export function denoiseChannels(channels, sampleRate, strength) {
  const mult = strength === 'kuat' ? 7 : strength === 'ringan' ? 2.5 : 4;
  // 1. Saringan lolos-atas satu kutub, fc ~90 Hz.
  const a = Math.exp(-2 * Math.PI * 90 / sampleRate);
  const hp = channels.map((ch) => {
    const out = new Float32Array(ch.length);
    let prevIn = 0, prevOut = 0;
    for (let i = 0; i < ch.length; i++) {
      const y = a * (prevOut + ch[i] - prevIn);
      out[i] = y;
      prevIn = ch[i];
      prevOut = y;
    }
    return out;
  });
  // 2. Gerbang derau per jendela 10 ms.
  const win = Math.max(1, Math.floor(sampleRate * 0.01));
  const numWin = Math.ceil(hp[0].length / win);
  const rmsList = [];
  for (let w = 0; w < numWin; w++) {
    const start = w * win;
    const end = Math.min(hp[0].length, start + win);
    let sum = 0;
    let n = 0;
    for (let c = 0; c < hp.length; c++) {
      const ch = hp[c];
      for (let i = start; i < end; i++) { sum += ch[i] * ch[i]; n++; }
    }
    rmsList.push(Math.sqrt(sum / Math.max(1, n)));
  }
  const sorted = [...rmsList].sort((x, y) => x - y);
  const floor = sorted[Math.max(0, Math.floor(sorted.length * 0.1))] || 0;
  const threshold = floor * mult;
  // Penguatan per jendela, dihaluskan (buka cepat 0,6 / tutup pelan 0,08).
  const gains = new Float32Array(numWin + 1);
  let g = 1;
  for (let w = 0; w < numWin; w++) {
    const target = rmsList[w] < threshold ? 0.12 : 1;
    g += (target - g) * (target > g ? 0.6 : 0.08);
    gains[w] = g;
  }
  gains[numWin] = g;
  return hp.map((ch) => {
    const out = new Float32Array(ch.length);
    for (let w = 0; w < numWin; w++) {
      const start = w * win;
      const end = Math.min(ch.length, start + win);
      const g0 = gains[w], g1 = gains[w + 1];
      for (let i = start; i < end; i++) {
        const t = (i - start) / Math.max(1, end - start);
        out[i] = ch[i] * (g0 + (g1 - g0) * t);
      }
    }
    return out;
  });
}

// encodeWav kanonis tinggal di utils (core.js).

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const prevBox = T.out();
  const levelSel = T.select([
    ['ringan', 'Ringan (suara asli paling aman)'],
    ['sedang', 'Sedang (disarankan)'],
    ['kuat', 'Kuat (dengung paling banyak hilang)'],
  ], 'sedang');
  let fileObj = null, duration = 0, busy = false, lastUrl = null;

  const goBtn = T.btn('Bersihkan audionya', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    T.hide(prevBox);
    T.show(outBox, '<span class="dim">Sedang membersihkan…</span>');
    try {
      const ab = await fileObj.arrayBuffer();
      const decoded = await T.actx().decodeAudioData(ab);
      const channels = [];
      for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c));
      const clean = denoiseChannels(channels, decoded.sampleRate, levelSel.value);
      const blob = utils.encodeWav(clean, decoded.sampleRate);
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = lastUrl;
      audio.style.width = '100%';
      T.show(prevBox, '<p class="hint" style="margin-bottom:8px">Dengarkan dulu hasilnya di sini:</p>');
      prevBox.appendChild(audio);
      T.show(outBox, '<span class="ok">Selesai. Dengung latarnya sudah dikurangi.</span>' +
        kv('Durasi', decoded.duration.toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      outBox.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl(base + '-bersih.wav', blob, 'audio/wav'), true)));
      T.toast('Audio bersih siap');
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cocok untuk rekaman suara yang ada dengung kipas, desah, atau bunyi latar pelan. Hasilnya tergantung rekamanmu: dengung yang pelan dan merata paling gampang hilang, sementara suara berisik yang keras dan berubah-ubah sulit dibersihkan. Suara pelan yang tercampur dengung bisa ikut melemah.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.field('Seberapa kuat dibersihkan', levelSel, 'Kalau suara utama ikut hilang, coba pilihan yang lebih ringan.'));
  root.appendChild(T.row(goBtn));
  root.appendChild(prevBox);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Hasilnya format WAV, jadi ukurannya lebih besar dari MP3.</p>'));
}
