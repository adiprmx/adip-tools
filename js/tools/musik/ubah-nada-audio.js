import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "ubah-nada-audio", "name": "Ubah Nada Audio", "cat": "musik", "icon": "🎵", "desc": "Naik atau turunkan nada lagu tanpa mengubah kecepatannya.", "keywords": "audio,nada,pitch,tinggi,rendah,naik turun,suara", "since": "6.17.0"};

/* Pitch-shift pakai SoundTouchJS 0.3.0 (port JS dari SoundTouch,
   algoritma time-stretch + resample; LGPL-2.1). Dimuat lewat dynamic
   import ESM dari CDN karena paketnya hanya menyediakan build ESM
   (tidak ada UMD/global). Konsekuensi: SRI tidak bisa dipasang pada
   dynamic import (keterbatasan browser, didokumentasi di core.js).
   Sebagai gantinya, isi file diverifikasi identik dari dua CDN
   (jsDelivr + unpkg) pada 18 Nov 2026:
   sha384-qazuEaJu2f8AH9iKshcLqTi9xTVhQI65Engc5sF88sQl2GcDxJOzpkyTDLdYxdUo
   Akurasi teruji di Node: +12 seminada 440 Hz -> 879,6 Hz (harap 880),
   -12 -> 219,5 Hz (harap 220), +3 -> 522,8 Hz (harap 523).
   PENTING: fillOutputBuffer() SoundTouchJS berhenti memproses saat
   sisa input < 16384 frame, jadi ekor lagu terpotong (teruji: -12
   seminada kehilangan 34% klip 1 detik, ekornya hening total).
   Perbaikan: tambah hening 1 detik di akhir input sebelum diproses,
   lalu potong hasil ke panjang asli. Teruji: ekor selamat (RMS 0,53
   dari sebelumnya 0,00). */
const ST_URLS = [
  'https://cdn.jsdelivr.net/npm/soundtouchjs@0.3.0/dist/soundtouch.js',
  'https://unpkg.com/soundtouchjs@0.3.0/dist/soundtouch.js',
];
let cachedLib = null;

async function loadSoundTouch() {
  if (cachedLib) return cachedLib;
  let lastErr = null;
  for (const u of ST_URLS) {
    try {
      const mod = await Promise.race([
        import(/* @vite-ignore */ u),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Waktu habis saat mengunduh pustaka nada.')), 30000)),
      ]);
      if (mod && mod.SoundTouch && mod.SimpleFilter && mod.WebAudioBufferSource) {
        cachedLib = mod;
        return mod;
      }
      throw new Error('Pustaka nada tidak lengkap.');
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Pustaka nada gagal dimuat.');
}

/* Geser nada satu buffer (AudioBuffer atau objek sejenis dengan
   getChannelData/numberOfChannels/length). Mengembalikan sampel stereo
   terjalin sepanjang buffer asli. Fungsi murni terhadap lib (diuji di
   Node dengan lib asli yang dimuat dari CDN). */
export async function pitchShiftBuffer(buffer, semitones, lib, onProgress) {
  const st = new lib.SoundTouch();
  st.pitchSemitones = semitones;
  const src = new lib.WebAudioBufferSource(buffer);
  const filter = new lib.SimpleFilter(src, st);
  const chunks = [];
  const tmp = new Float32Array(4096 * 2);
  let total = 0;
  let guard = 0;
  const maxIter = Math.ceil(buffer.length / 4096) * 4 + 100;
  for (;;) {
    const n = filter.extract(tmp, 4096);
    if (n > 0) { chunks.push(tmp.slice(0, n * 2)); total += n; }
    guard++;
    if (onProgress && guard % 25 === 0) {
      onProgress(Math.min(1, filter.sourcePosition / Math.max(1, buffer.length)));
      await new Promise((r) => setTimeout(r, 0));
    }
    if ((n === 0 && filter.sourcePosition >= buffer.length) || guard > maxIter) break;
  }
  const out = new Float32Array(total * 2);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
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
  const barWrap = T.el('<div style="margin:12px 0" hidden></div>');
  const barFill = T.el('<div style="height:8px;width:0%;background:#ff6f61;border-radius:99px;transition:width .2s"></div>');
  const barTrack = T.el('<div style="height:8px;background:#27272a;border-radius:99px;overflow:hidden"></div>');
  barTrack.appendChild(barFill);
  const barLabel = T.el('<p class="dim" style="font-size:13px;margin:8px 0 0"></p>');
  barWrap.appendChild(barTrack);
  barWrap.appendChild(barLabel);

  const pitchRow = T.el('<div style="margin:10px 0"></div>');
  const pitchHead = T.el('<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>Tinggi nada</span><span class="dim">Tidak berubah</span></div>');
  const pitchVal = pitchHead.querySelectorAll('span')[1];
  const pitchInp = document.createElement('input');
  pitchInp.type = 'range';
  pitchInp.min = '-12'; pitchInp.max = '12'; pitchInp.step = '1'; pitchInp.value = '0';
  pitchInp.style.width = '100%';
  pitchInp.style.accentColor = '#ff6f61';
  const paintPitch = () => {
    const v = parseInt(pitchInp.value, 10);
    pitchVal.textContent = v === 0 ? 'Tidak berubah' : v > 0 ? 'Naik ' + v + ' langkah' : 'Turun ' + Math.abs(v) + ' langkah';
  };
  pitchInp.addEventListener('input', paintPitch);
  paintPitch();
  pitchRow.appendChild(pitchHead);
  pitchRow.appendChild(pitchInp);
  pitchRow.appendChild(T.el('<div class="hint">Geser ke kanan supaya nadanya lebih tinggi, ke kiri supaya lebih rendah. Kecepatan lagunya tetap sama.</div>'));

  let fileObj = null, decoded = null, busy = false, lastUrl = null;
  const setStage = (label, pct) => {
    barWrap.hidden = false;
    barLabel.textContent = label;
    barFill.style.width = Math.max(0, Math.min(100, pct || 0)) + '%';
  };

  const goBtn = T.btn('Ubah nadanya', async () => {
    if (busy) return;
    if (!decoded) { T.show(outBox, errBox('Pilih dulu file audionya.')); return; }
    const semi = parseInt(pitchInp.value, 10);
    if (semi === 0) { T.show(outBox, errBox('Geser dulu pengatur nadanya, sekarang masih di posisi tidak berubah.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.hide(outBox);
    T.hide(prevBox);
    try {
      setStage('Mengunduh pustaka nada…', 0);
      const lib = await loadSoundTouch();
      setStage('Mengubah nada… 0%', 0);
      const ctx = T.actx();
      // Hening 1 detik di akhir supaya ekor ikut terproses (lihat catatan
      // di atas), lalu hasil dipotong kembali ke panjang asli.
      const padFrames = Math.max(decoded.sampleRate, 20000);
      const padded = ctx.createBuffer(decoded.numberOfChannels, decoded.length + padFrames, decoded.sampleRate);
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        padded.getChannelData(c).set(decoded.getChannelData(c));
      }
      const interleaved = await pitchShiftBuffer(padded, semi, lib, (p) => {
        const pct = Math.round(p * 100);
        setStage('Mengubah nada… ' + pct + '%', pct);
      });
      const numCh = decoded.numberOfChannels;
      const channels = [];
      for (let c = 0; c < numCh; c++) {
        const ch = new Float32Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) ch[i] = interleaved[i * 2 + (numCh === 1 ? 0 : c)] || 0;
        channels.push(ch);
      }
      const blob = encodeWav(channels, decoded.sampleRate);
      const base = (fileObj ? fileObj.name : 'audio').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'audio';
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = lastUrl;
      audio.style.width = '100%';
      T.show(prevBox, '<p class="hint" style="margin-bottom:8px">Dengarkan dulu hasilnya di sini:</p>');
      prevBox.appendChild(audio);
      T.show(outBox, '<span class="ok">Selesai. Nadanya sudah berubah, kecepatannya tetap.</span>' +
        kv('Perubahan', pitchVal.textContent) +
        kv('Durasi', decoded.duration.toFixed(1) + ' detik') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      outBox.appendChild(T.row(T.btn('Unduh hasil (WAV)', () => T.dl(base + '-nada.wav', blob, 'audio/wav'), true)));
      T.toast('Audio siap');
    } catch (e) {
      const msg = (e && e.message) || '';
      T.show(outBox, errBox(/unduh|timeout|Waktu habis|gagal dimuat/i.test(msg)
        ? 'Pustaka nada tidak bisa diunduh. Cek koneksi internet lalu coba lagi.'
        : 'Proses gagal. Coba file yang lebih kecil atau muat ulang halaman.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
      barWrap.hidden = true;
      barFill.style.width = '0%';
    }
  }, true);

  file.addEventListener('change', async () => {
    fileObj = file.files && file.files[0] ? file.files[0] : null;
    decoded = null;
    T.hide(outBox);
    T.hide(prevBox);
    if (!fileObj) { T.hide(infoBox); return; }
    T.show(infoBox, '<span class="dim">Membaca file…</span>');
    try {
      const ab = await fileObj.arrayBuffer();
      decoded = await T.actx().decodeAudioData(ab);
      T.show(infoBox,
        kv('File', T.esc(fileObj.name)) +
        kv('Durasi', decoded.duration.toFixed(1) + ' detik') +
        kv('Ukuran', fmtBytes(fileObj.size)));
    } catch (e) {
      T.show(infoBox, errBox('File ini tidak bisa dibaca sebagai audio. Coba file MP3, WAV, atau M4A lain.'));
    }
  });

  T.onLeave(() => { if (lastUrl) URL.revokeObjectURL(lastUrl); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Cocok untuk menyesuaikan lagu dengan jangkauan suaramu, atau membuat versi lagu yang nadanya lebih tinggi atau lebih rendah. Perubahan besar (di ujung geseran) bisa membuat suara terdengar sedikit tidak wajar, itu batas wajar cara kerja ini.</p>'));
  root.appendChild(T.field('Pilih file audio', file, 'MP3, WAV, FLAC, OGG, M4A, dan format audio umum lainnya'));
  root.appendChild(infoBox);
  root.appendChild(pitchRow);
  root.appendChild(T.row(goBtn));
  root.appendChild(barWrap);
  root.appendChild(prevBox);
  root.appendChild(outBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Audionya tidak diunggah ke mana-mana. Hasilnya format WAV, jadi ukurannya lebih besar dari MP3. Pustaka nada diunduh sekali dari internet saat pertama dipakai.</p>'));
}
