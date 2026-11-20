import { h as T, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// JXL ke JPG/PNG: ubah file JPEG XL jadi JPG atau PNG.
// CARA KERJA: decoder bawaan browser dicoba dulu (Chrome 155+, Safari
// 17+, Firefox 158+) — gratis dan cepat. Bila browser belum bisa,
// dipakai mesin JXL tambahan (@jsquash/jxl 1.3.0, WASM libjxl) yang
// diunduh sekali dari internet. File tetap diperiksa keasliannya
// (tanda tangan + daftar kotak) sebelum dibuka.
// GERBANG (F10, 20 Nov 2026): jalur WASM BELUM teruji live (egress
// mati) — gelombang 4 WAJIB membuktikan modul + file .wasm-nya
// benar-benar termuat dari kedua CDN sebelum fitur ini diklaim live.
// SRI tidak berlaku untuk dynamic import (keterbatasan browser, sudah
// didokumentasi di core.js); pengaman di sini adalah pin versi 1.3.0.
export const meta = {"id": "jxl-ke-jpg-png", "name": "JXL ke JPG/PNG", "cat": "gambar", "icon": "🖼️", "desc": "Ubah file JXL jadi JPG atau PNG.", "keywords": "jxl,jpeg xl,konversi,jpg,png,gambar", "since": "6.19.0"};

// Sampel JXL asli 8x6 piksel (94 byte, dibuat ffmpeg + libjxl) untuk
// mengecek apakah browser ini bisa membuka JXL.
export const SAMPEL_JXL_B64 = '/woosAEAEogCAEgB1eQSAAAVKqOMG7yc6/nyQ4fFtI3rDG21bWFJosg4NkkncEgSi8DGFWMADACYuSSMC6WSREoCb3RbqyKRPPz58/u67dWzJRoAVMzrq/ogoh5USg==';

const TANDA_CODESTREAM = [0xff, 0x0a];
const TANDA_CONTAINER = [0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a];

// Periksa apakah byte adalah file JXL (murni). format: 'codestream'
// (tanda FF 0A) atau 'container' (tanda kotak JXL).
export function deteksiJxl(bytes) {
  if (!bytes || bytes.length < 2) return { valid: false, format: null };
  if (bytes[0] === TANDA_CODESTREAM[0] && bytes[1] === TANDA_CODESTREAM[1]) {
    return { valid: true, format: 'codestream' };
  }
  if (bytes.length >= 12) {
    let cocok = true;
    for (let i = 0; i < 12; i++) {
      if (bytes[i] !== TANDA_CONTAINER[i]) { cocok = false; break; }
    }
    if (cocok) return { valid: true, format: 'container' };
  }
  return { valid: false, format: null };
}

// Baca daftar kotak (box) file JXL container (murni). Tiap kotak:
// ukuran 4 byte big-endian + tipe 4 huruf. Ukuran 1 = ukuran besar
// 8 byte sesudah tipe; ukuran 0 = sampai akhir file.
export function bacaKotakJxl(bytes) {
  const kotak = [];
  if (!bytes || bytes.length < 12) return kotak;
  let p = 12;
  while (p + 8 <= bytes.length && kotak.length < 64) {
    const ukuran32 = (bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3];
    const tipe = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    let ukuran = ukuran32 >>> 0;
    let kepala = 8;
    if (ukuran === 1) {
      if (p + 16 > bytes.length) break;
      let besar = 0;
      for (let i = 0; i < 8; i++) besar = besar * 256 + bytes[p + 8 + i];
      ukuran = besar;
      kepala = 16;
    } else if (ukuran === 0) {
      ukuran = bytes.length - p;
    }
    if (ukuran < kepala) break;
    kotak.push({ tipe, ukuran });
    p += ukuran;
  }
  return kotak;
}

// Cek dukungan JXL bawaan browser dengan sampel kecil (async).
export async function browserBisaJxl() {
  return new Promise((selesai) => {
    const img = new Image();
    img.onload = () => selesai(img.naturalWidth > 0);
    img.onerror = () => selesai(false);
    img.src = 'data:image/jxl;base64,' + SAMPEL_JXL_B64;
  });
}

// ---- Mesin JXL tambahan (@jsquash/jxl 1.3.0, WASM libjxl) ----
// Dipakai dua arah: decode (fallback di tool ini) dan encode (tool
// gambar-ke-jxl.js mengimpor muatJxl dari sini). Paket ini ESM-only
// (tidak ada build UMD), jadi TIDAK BISA lewat loadLibOnce (itu
// untuk script klasik) — dimuat via dynamic import dengan pola yang
// sama seperti ag-psd (psd-ke-png.js): fallback 2-CDN + timeout
// 30 dtk per URL (pola race ubah-nada-audio.js). Hanya sukses yang
// di-cache; gagal bisa dicoba lagi.
const JXL_ESM_CDNS = [
  'https://esm.sh/@jsquash/jxl@1.3.0',
  'https://cdn.jsdelivr.net/npm/@jsquash/jxl@1.3.0/+esm',
];
let _jxlModul = null;
export async function muatJxl() {
  if (_jxlModul) return _jxlModul;
  let gagalTerakhir = null;
  for (const u of JXL_ESM_CDNS) {
    try {
      const m = await imporDenganBatas(u, 30000);
      if (m && typeof m.decode === 'function' && typeof m.encode === 'function') {
        _jxlModul = m;
        return m;
      }
      gagalTerakhir = new Error('modul JXL tidak lengkap');
    } catch (e) { gagalTerakhir = e; }
  }
  throw gagalTerakhir || new Error('Mesin JXL gagal dimuat dari internet.');
}
function imporDenganBatas(url, ms) {
  let timer = null;
  const batas = new Promise((_, tolak) => { timer = setTimeout(() => tolak(new Error('Waktu habis saat mengunduh mesin JXL.')), ms); });
  return Promise.race([import(/* @vite-ignore */ url), batas])
    .finally(() => { if (timer) clearTimeout(timer); });
}

// Decode byte JXL jadi ImageData lewat modul WASM. Modul di-inject
// sebagai parameter supaya bisa diuji di Node dengan modul tiruan.
export async function decodeJxlWasm(jxl, bytes) {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const imageData = await jxl.decode(buf);
  if (!imageData || !imageData.width || !imageData.height || !imageData.data) {
    throw new Error('Hasil decode JXL tidak lengkap.');
  }
  return imageData;
}

export function render(root) {
  const fi = fileInput('.jxl,image/jxl');
  const formatSel = T.select([['png', 'PNG (tanpa rugi)'], ['jpeg', 'JPG (lebih kecil)']], 'png');
  const kualitasR = T.el('<input type="range" min="50" max="100" value="92" class="inp">');
  const kualitasV = T.el('<span class="hint" style="min-width:44px;text-align:right">92%</span>');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let blobHasil = null, namaDasar = 'gambar', dukungan = null;

  async function onPick() {
    T.hide(infoBox); T.hide(box);
    blobHasil = null;
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file JXL dulu'); return; }
    let bytes;
    try { bytes = new Uint8Array(await f.arrayBuffer()); }
    catch (e) { T.show(infoBox, '<p class="err">File tidak bisa dibaca.</p>'); return; }
    const cek = deteksiJxl(bytes);
    namaDasar = (f.name || 'gambar').replace(/\.[^.]*$/, '');
    if (!cek.valid) {
      T.show(infoBox, '<p class="err">File ini bukan JXL. Tanda awal file tidak cocok dengan format JPEG XL.</p>' +
        '<p class="hint">Pastikan file berekstensi .jxl dan tidak rusak.</p>');
      return;
    }
    const kotak = cek.format === 'container' ? bacaKotakJxl(bytes) : [];
    let info = '<div class="kv"><span>File</span><b>' + T.esc(f.name) + ' (' + fmtBytes(f.size) + ')</b></div>' +
      '<div class="kv"><span>Format JXL</span><b>' + (cek.format === 'container' ? 'Container (dengan kotak)' : 'Codestream mentah') + '</b></div>';
    if (kotak.length) {
      info += '<div class="kv"><span>Kotak di dalam file</span><b>' + kotak.map((k) => T.esc(k.tipe) + ' (' + fmtBytes(k.ukuran) + ')').join(', ') + '</b></div>';
    }
    T.show(infoBox, info + '<p class="hint">Lagi mengecek apakah browser ini bisa membuka JXL...</p>');
    if (dukungan === null) dukungan = await browserBisaJxl();
    let lewatWasm = false;
    if (dukungan) {
      let bmp;
      try {
        bmp = await createImageBitmap(new Blob([bytes.buffer], { type: 'image/jxl' }));
      } catch (e) {
        T.show(infoBox, info + '<p class="err">File JXL valid, tapi gambarnya gagal dibuka di browser ini. File mungkin rusak di bagian dalam.</p>');
        return;
      }
      cv.width = bmp.width; cv.height = bmp.height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
    } else {
      // Browser belum bisa JXL native → mesin JXL tambahan (WASM).
      T.show(infoBox, info + '<p class="hint">Browser ini belum bisa membuka JXL, jadi dipakai mesin JXL tambahan (diunduh sekali, perlu internet)...</p>');
      let imageData;
      try {
        imageData = await decodeJxlWasm(await muatJxl(), bytes);
      } catch (e) {
        T.show(infoBox, info +
          '<p class="err">Browser ini belum bisa membuka JXL, dan mesin JXL tambahannya juga gagal dimuat. Cek koneksi internetmu lalu coba lagi.</p>' +
          '<p class="hint">Yang bisa dilakukan: buka halaman ini di Chrome 155 ke atas, Safari 17 ke atas, atau Firefox 158 ke atas. Atau ubah lewat komputer dengan perintah <b>djxl ' + T.esc(f.name) + ' ' + T.esc(namaDasar) + '.png</b> (alat djxl dari libjxl).</p>');
        return;
      }
      cv.width = imageData.width; cv.height = imageData.height;
      cv.getContext('2d').putImageData(imageData, 0, 0);
      lewatWasm = true;
    }
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, info + '<div class="kv"><span>Ukuran gambar</span><b>' + cv.width + 'x' + cv.height + ' px</b></div>' +
      '<p class="hint">Gambar berhasil dibuka' + (lewatWasm ? ' dengan mesin JXL tambahan' : '') + '. Pilih format lalu unduh.</p>');
    T.toast('JXL berhasil dibuka!');
  }

  const dlB = T.btn('Unduh hasil', async () => {
    if (!fi.files[0]) { T.toast('Pilih file JXL dulu'); return; }
    if (!cv.width) { T.toast('File belum berhasil dibuka'); return; }
    const fmt = formatSel.value;
    const blob = await canvasToBlob(cv, fmt === 'jpeg' ? 'image/jpeg' : 'image/png', fmt === 'jpeg' ? +kualitasR.value / 100 : undefined);
    if (!blob) { T.toast('Gagal membuat file'); return; }
    blobHasil = blob;
    T.dl(namaDasar + '.' + (fmt === 'jpeg' ? 'jpg' : 'png'), blob, blob.type);
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  formatSel.addEventListener('change', () => {
    kualitasR.disabled = formatSel.value !== 'jpeg';
    kualitasV.style.opacity = formatSel.value === 'jpeg' ? '1' : '0.4';
  });
  kualitasR.addEventListener('input', () => { kualitasV.textContent = kualitasR.value + '%'; });
  kualitasR.disabled = true;
  kualitasV.style.opacity = '0.4';

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih file .jxl. File diperiksa dulu keasliannya, lalu dibuka — pakai decoder bawaan browser bila ada, atau mesin JXL tambahan bila browser belum bisa — dan disimpan jadi JPG atau PNG.</p>'));
  root.appendChild(T.field('Pilih file JXL', fi, 'Hanya file .jxl.'));
  root.appendChild(T.grid2(T.field('Format hasil', formatSel), T.field('Kualitas JPG', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(kualitasR); w.appendChild(kualitasV); return w; })(), 'Hanya berlaku untuk JPG.')));
  root.appendChild(T.row(T.btn('Buka dan ubah', onPick, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', onPick);
}
