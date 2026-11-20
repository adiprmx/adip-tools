import { h as T, kv, fmtBytes, errBox, utils } from '../../core.js';

export const meta = {"id": "balik-audio", "name": "Balik Audio", "cat": "musik", "icon": "⏪", "desc": "Putar balik isi file audio, dari akhir ke awal.", "keywords": "audio,balik,reverse,terbalik,putar balik", "since": "6.17.0"};

/* Balik urutan sampel tiap kanal. Fungsi murni (diuji di Node). */
export function reverseChannels(channels) {
  return channels.map((ch) => {
    const out = new Float32Array(ch.length);
    for (let i = 0, j = ch.length - 1; i < ch.length; i++, j--) out[i] = ch[j];
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
  let fileObj = null, duration = 0, busy = false, lastUrl = null;

  const goBtn = T.btn('Balik audionya', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    T.hide(prevBox);
    T.show(outBox, '<span class="dim">Sedang membalik…</span>');
    try {
      const ab = await fileObj.arrayBuffer();
      const decoded = await T.actx().decodeAudioData(ab);
      const channels = [];
      for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c));
      const reversed = reverseChannels(channels);
      const blob = utils.encodeWav(reversed, decoded.sampleRate);
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = lastUrl;
      audio.style.width = '100%';
      T.show(prevBox, '<p class="hint" style="margin-bottom:8px">Dengarkan dulu hasilnya di sini:</p>');
      prevBox.appendChild(audio);
      T.show(outBox, '<span class="ok">Selesai. Audionya sudah terbalik.</span>' +
        kv('Durasi', decoded.duration.toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      outBox.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl(base + '-terbalik.wav', blob, 'audio/wav'), true)));
      T.toast('Audio terbalik siap');
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
    const fDipilih = fileObj;
    a.onloadedmetadata = async () => {
      const d = await utils.resolveDurasi(a);
      if (fileObj !== fDipilih) { URL.revokeObjectURL(url); return; }
      duration = d;
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Hasilnya lagu atau rekaman yang bunyinya berjalan mundur, dari akhir ke awal. Cocok untuk efek suara atau mendengar lagu dari arah sebaliknya.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(T.row(goBtn));
  root.appendChild(prevBox);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Hasilnya format WAV, jadi ukurannya lebih besar dari MP3.</p>'));
}
