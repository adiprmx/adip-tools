import { h as T, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// JXL ke JPG/PNG: ubah file JPEG XL jadi JPG atau PNG.
// CARA KERJA JUJUR: tool ini memakai decoder JXL bawaan browser
// (Chrome 155+, Safari 17+, Firefox 158+). Bila browser belum bisa
// buka JXL, file tetap diperiksa keasliannya (tanda tangan + daftar
// kotak) dan pengguna diberi panduan, bukan hasil palsu. Decoder
// WASM (@jsquash/jxl) belum dibundel karena belum bisa diuji dari
// VM ini (egress mati, hash SRI tidak bisa diukur). Lihat laporan
// tim B20.
export const meta = {"id": "jxl-ke-jpg-png", "name": "JXL ke JPG/PNG", "cat": "gambar", "icon": "🖼️", "desc": "Ubah file JXL jadi JPG atau PNG lewat decoder bawaan browser.", "keywords": "jxl,jpeg xl,konversi,jpg,png,gambar", "since": "6.19.0"};

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
    if (!dukungan) {
      T.show(infoBox, info +
        '<p class="err">Browser ini belum bisa membuka JXL, jadi file belum bisa diubah di sini.</p>' +
        '<p class="hint">Yang bisa dilakukan: buka halaman ini di Chrome 155 ke atas, Safari 17 ke atas, atau Firefox 158 ke atas. Atau ubah lewat komputer dengan perintah <b>djxl ' + T.esc(f.name) + ' ' + T.esc(namaDasar) + '.png</b> (alat djxl dari libjxl).</p>');
      return;
    }
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
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, info + '<div class="kv"><span>Ukuran gambar</span><b>' + cv.width + 'x' + cv.height + ' px</b></div>' +
      '<p class="hint">Gambar berhasil dibuka. Pilih format lalu unduh.</p>');
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
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih file .jxl. File diperiksa dulu keasliannya, lalu dibuka dengan decoder bawaan browser dan disimpan jadi JPG atau PNG.</p>'));
  root.appendChild(T.field('Pilih file JXL', fi, 'Hanya file .jxl.'));
  root.appendChild(T.grid2(T.field('Format hasil', formatSel), T.field('Kualitas JPG', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(kualitasR); w.appendChild(kualitasV); return w; })(), 'Hanya berlaku untuk JPG.')));
  root.appendChild(T.row(T.btn('Buka dan ubah', onPick, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', onPick);
}
