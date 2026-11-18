import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "hapus-vokal-karaoke", "name": "Hapus Vokal (Karaoke)", "cat": "musik", "icon": "🎤", "desc": "Hilangkan suara penyanyi dari lagu stereo supaya tinggal musiknya.", "keywords": "vokal,karaoke,hapus vokal,penyanyi,musik saja,instrumental", "since": "6.17.0"};

/* Teknik kanal tengah (OOPS): suara yang sama persis di kiri dan kanan
   (biasanya vokal) saling menghapus saat kiri dikurangi kanan. Sisanya
   adalah selisih kedua kanal, jadi hasilnya mono. Fungsi murni, diuji
   di Node: sinyal tengah yang identik di kedua kanal menghasilkan nol
   persis. Bukan pemisah AI: hasil bervariasi per lagu, dan bunyi lain
   yang juga di tengah (mis. bass, drum) ikut berkurang. */
export function removeCenterVocals(left, right) {
  const len = Math.min(left.length, right.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = (left[i] - right[i]) * 0.5;
  return out;
}

/* Enkode PCM 16-bit jadi file WAV (salinan per tool, lihat balik-audio). */
export function encodeWav(channels, sampleRate) {
  const numCh = channels.length;
  const len = channels[0].length;
  const blockAlign = numCh * 2;
  const dataSize = len * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const wstr = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * blockAlign, true); v.setUint16(32, blockAlign, true);
  v.setUint16(34, 16, true); wstr(36, 'data'); v.setUint32(40, dataSize, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const s = Math.max(-1, Math.min(1, channels[ch][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: 'audio/wav' });
}

export function render(root) {
  const file = T.input('file');
  file.accept = 'audio/*';
  const infoBox = T.out();
  const outBox = T.out();
  const prevBox = T.out();
  let fileObj = null, duration = 0, busy = false, lastUrl = null;

  const goBtn = T.btn('Hapus vokalnya', async () => {
    if (busy) return;
    if (!fileObj) { T.show(outBox, errBox('Pilih dulu file lagunya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    T.hide(prevBox);
    T.show(outBox, '<span class="dim">Sedang memisahkan…</span>');
    try {
      const ab = await fileObj.arrayBuffer();
      const decoded = await T.actx().decodeAudioData(ab);
      if (decoded.numberOfChannels < 2) {
        T.show(outBox, errBox('File ini hanya satu kanal suara, jadi vokalnya tidak bisa dipisah dengan cara ini. Coba lagu stereo (dua kanal).'));
        return;
      }
      const karaoke = removeCenterVocals(decoded.getChannelData(0), decoded.getChannelData(1));
      const blob = encodeWav([karaoke], decoded.sampleRate);
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = lastUrl;
      audio.style.width = '100%';
      T.show(prevBox, '<p class="hint" style="margin-bottom:8px">Dengarkan dulu hasilnya di sini:</p>');
      prevBox.appendChild(audio);
      T.show(outBox, '<span class="ok">Selesai. Hasilnya musik tanpa vokal (satu kanal suara).</span>' +
        kv('Durasi', decoded.duration.toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      outBox.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl(base + '-karaoke.wav', blob, 'audio/wav'), true)));
      T.toast('Versi karaoke siap');
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cara kerjanya sederhana: suara penyanyi biasanya direkam sama persis di kiri dan kanan, jadi tool ini mengurangi kanal kiri dengan kanan sampai suara tengahnya hilang. Hasilnya beda-beda tiap lagu, dan bunyi lain yang juga di tengah (seperti bass atau drum) bisa ikut berkurang. Ini bukan pemisah AI, jadi jangan berharap vokalnya hilang total di semua lagu.</p>'));
  root.appendChild(T.field('Pilih file lagu (stereo)', file, 'MP3, WAV, FLAC, OGG, M4A. Lagunya harus stereo, dua kanal suara.'));
  root.appendChild(infoBox);
  root.appendChild(T.row(goBtn));
  root.appendChild(prevBox);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Lagunya tidak diunggah ke mana-mana. Hasilnya format WAV satu kanal, jadi ukurannya lebih besar dari MP3.</p>'));
}
