import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.13.0';

/* ============ Fungsi murni byte-level (bisa diuji di Node, tanpa DOM) ============ */

// JPEG: buang segmen APPn/COM yang kodenya ada di `buang` (mis. 0xE1=APP1,
// 0xED=APP13, 0xFE=COM). Segmen setelah SOS (data gambar) disalin apa adanya.
// Mengembalikan Uint8Array baru, atau null bila bukan JPEG.
export function buangSegmenJpeg(bytes, buang) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  const out = [0xFF, 0xD8];
  const n = b.length;
  let i = 2;
  while (i + 1 < n) {
    if (b[i] !== 0xFF) { for (; i < n; i++) out.push(b[i]); break; }
    let j = i + 1;
    while (j < n && b[j] === 0xFF) j++;
    if (j >= n) break;
    const marker = b[j];
    if (marker === 0xD9) { out.push(0xFF, 0xD9); break; }
    if (marker === 0xDA) { for (let k = i; k < n; k++) out.push(b[k]); break; }
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { out.push(0xFF, marker); i = j + 1; continue; }
    if (j + 2 >= n) break;
    const len = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + len;
    if (len < 2 || segEnd > n) break;
    if (!buang.has(marker)) for (let k = i; k < segEnd; k++) out.push(b[k]);
    i = segEnd;
  }
  return new Uint8Array(out);
}

// Cari segmen APP1 berisi "Exif\0\0" pertama. Kembalikan {awal, akhir, isi}
// (isi = byte TIFF, tanpa header "Exif\0\0"), atau null.
function cariSegmenExif(b) {
  const n = b.length;
  let i = 2;
  while (i + 1 < n) {
    if (b[i] !== 0xFF) return null;
    let j = i + 1;
    while (j < n && b[j] === 0xFF) j++;
    if (j >= n) return null;
    const marker = b[j];
    if (marker === 0xD9 || marker === 0xDA) return null;
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i = j + 1; continue; }
    if (j + 2 >= n) return null;
    const len = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + len;
    if (len < 2 || segEnd > n) return null;
    if (marker === 0xE1) {
      const isiAwal = j + 3;
      if (b[isiAwal] === 0x45 && b[isiAwal + 1] === 0x78 && b[isiAwal + 2] === 0x69 && b[isiAwal + 3] === 0x66 && b[isiAwal + 4] === 0 && b[isiAwal + 5] === 0) {
        return { awal: i, akhir: segEnd, isi: b.subarray(isiAwal + 6, segEnd), isiAwal: isiAwal + 6 };
      }
    }
    i = segEnd;
  }
  return null;
}

// Baca angka dari TIFF dengan endianness-nya.
function tiffU16(t, off, le) { return le ? t[off] | (t[off + 1] << 8) : (t[off] << 8) | t[off + 1]; }
function tiffU32(t, off, le) {
  return le
    ? t[off] | (t[off + 1] << 8) | (t[off + 2] << 16) | (t[off + 3] << 24)
    : (t[off] << 24) | (t[off + 1] << 16) | (t[off + 2] << 8) | t[off + 3];
}

// JPEG: hapus lokasi (GPS) SAJA dengan MENCABUT entri pointer IFD GPS
// (tag 0x8825) dari IFD0 dan menolkan isi GPS IFD yatim (termasuk data
// rasional koordinat). Data lain (kamera, tanggal, hak cipta) tetap utuh.
// Gambar tidak digambar ulang, jadi kualitas piksel tidak berubah sama sekali.
// Kembalikan { bytes, ketemu } — ketemu=true bila entri GPS memang ada.
export function hapusGpsDariJpeg(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const salin = new Uint8Array(b);
  const seg = cariSegmenExif(salin);
  if (!seg) return { bytes: salin, ketemu: false };
  const t = seg.isi;
  if (t.length < 8) return { bytes: salin, ketemu: false };
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4D && t[1] === 0x4D)) return { bytes: salin, ketemu: false };
  if (tiffU16(t, 2, le) !== 42) return { bytes: salin, ketemu: false };
  const ifd0 = tiffU32(t, 4, le) >>> 0;
  if (ifd0 + 2 > t.length) return { bytes: salin, ketemu: false };
  const jumlah = tiffU16(t, ifd0, le);
  const tulis16 = (off, v) => { if (le) { t[off] = v & 255; t[off + 1] = (v >> 8) & 255; } else { t[off] = (v >> 8) & 255; t[off + 1] = v & 255; } };
  for (let k = 0; k < jumlah; k++) {
    const eo = ifd0 + 2 + k * 12;
    if (eo + 12 > t.length) break;
    if (tiffU16(t, eo, le) === 0x8825) {
      const gpsOff = tiffU32(t, eo + 8, le) >>> 0;
      // Nilai 0 = pointer sudah pernah dinolkan (file hasil versi lama).
      if (gpsOff === 0) return { bytes: salin, ketemu: false };
      // 1) Nol-kan isi GPS IFD yatim (termasuk data rasional koordinat)
      //    supaya koordinat tidak bisa digali dari sisa byte.
      //    Tanpa batas jumlah entri: batas lama (<=64) membuat koordinat
      //    tertinggal sebagai byte yatim bila IFD GPS punya >64 entri.
      //    Loop tetap dibatasi panjang file, jadi entri korup tidak bisa
      //    membuat loop liar.
      if (gpsOff + 2 <= t.length) {
        const jGps = tiffU16(t, gpsOff, le);
        const maksEntri = Math.min(jGps, Math.floor((t.length - (gpsOff + 2)) / 12));
        for (let g = 0; g < maksEntri; g++) {
          const ge = gpsOff + 2 + g * 12;
          const tipe = tiffU16(t, ge + 2, le);
          const cnt = tiffU32(t, ge + 4, le) >>> 0;
          const ukuran = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }[tipe] || 0;
          if (ukuran && cnt * ukuran > 4) {
            const vo = tiffU32(t, ge + 8, le) >>> 0;
            if (vo + cnt * ukuran <= t.length) t.fill(0, vo, vo + cnt * ukuran);
          }
        }
        t.fill(0, gpsOff, Math.min(t.length, gpsOff + 2 + maksEntri * 12 + 4));
      }
      // 2) Cabut entri 0x8825 dari IFD0: geser entri sesudahnya naik 12 byte,
      //    pindahkan pointer IFD berikut, nol-kan 12 byte yang menganggur.
      //    (Sekadar menolkan pointer TIDAK cukup: pembaca EXIF masih melihat
      //    tag GPSInfo bernilai 0 dan mengira lokasi masih ada.)
      const sisaEntri = jumlah - k - 1;
      if (sisaEntri > 0) t.copyWithin(eo, eo + 12, eo + 12 + sisaEntri * 12);
      const nextLama = ifd0 + 2 + jumlah * 12;
      const nextBaru = ifd0 + 2 + (jumlah - 1) * 12;
      for (let q = 0; q < 4; q++) t[nextBaru + q] = t[nextLama + q];
      t.fill(0, nextBaru + 4, nextLama + 4);
      tulis16(ifd0, jumlah - 1);
      return { bytes: salin, ketemu: true };
    }
  }
  return { bytes: salin, ketemu: false };
}

// Ambil nilai tag ASCII (mis. Copyright 0x8298) dari IFD0 EXIF. Null bila tak ada.
function nilaiTagAsciiExif(bytes, tagCari) {
  const seg = cariSegmenExif(bytes);
  if (!seg) return null;
  const t = seg.isi;
  if (t.length < 8) return null;
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4D && t[1] === 0x4D)) return null;
  if (tiffU16(t, 2, le) !== 42) return null;
  const ifd0 = tiffU32(t, 4, le) >>> 0;
  if (ifd0 + 2 > t.length) return null;
  const jumlah = tiffU16(t, ifd0, le);
  for (let k = 0; k < jumlah; k++) {
    const eo = ifd0 + 2 + k * 12;
    if (eo + 12 > t.length) break;
    if (tiffU16(t, eo, le) !== tagCari) continue;
    const tipe = tiffU16(t, eo + 2, le);
    const cnt = tiffU32(t, eo + 4, le) >>> 0;
    if (tipe !== 2 || !cnt || cnt > 1000) return null;
    let awal;
    if (cnt <= 4) awal = eo + 8;
    else {
      awal = tiffU32(t, eo + 8, le) >>> 0;
      if (awal + cnt > t.length) return null;
    }
    let s = '';
    for (let i = 0; i < cnt; i++) {
      const c = t[awal + i];
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s;
  }
  return null;
}

// JPEG: bangun ulang EXIF hanya dengan tag Hak Cipta (0x8298). Bila tidak ada
// hak cipta, segmen EXIF dibuang seluruhnya. Kembalikan { bytes, adaHakCipta }.
export function exifHanyaHakCipta(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const hak = nilaiTagAsciiExif(b, 0x8298);
  const tanpaApp1 = buangSegmenJpeg(b, new Set([0xE1, 0xED, 0xFE]));
  if (tanpaApp1 == null) return { bytes: b, adaHakCipta: false };
  if (!hak) return { bytes: tanpaApp1, adaHakCipta: false };
  const teks = hak.replace(/\0/g, '');
  const valLen = teks.length + 1; // + NUL
  // TIFF little-endian: header 8 + count 2 + entri 12 + next 4 = 26; nilai
  // ditaruh setelahnya bila tidak muat inline (4 byte).
  const inline = valLen <= 4;
  const tiffLen = inline ? 26 : 26 + valLen;
  const app1Len = 6 + tiffLen + 2; // "Exif\0\0" + TIFF + 2 byte panjang
  const app1 = new Uint8Array(2 + app1Len);
  let p = 0;
  app1[p++] = 0xFF; app1[p++] = 0xE1;
  app1[p++] = (app1Len >> 8) & 0xFF; app1[p++] = app1Len & 0xFF;
  app1[p++] = 0x45; app1[p++] = 0x78; app1[p++] = 0x69; app1[p++] = 0x66; app1[p++] = 0; app1[p++] = 0;
  app1[p++] = 0x49; app1[p++] = 0x49; // II
  app1[p++] = 42; app1[p++] = 0;
  app1[p++] = 8; app1[p++] = 0; app1[p++] = 0; app1[p++] = 0; // IFD0 di offset 8
  app1[p++] = 1; app1[p++] = 0; // 1 entri
  app1[p++] = 0x98; app1[p++] = 0x82; // tag 0x8298
  app1[p++] = 2; app1[p++] = 0; // ASCII
  app1[p++] = valLen & 0xFF; app1[p++] = (valLen >> 8) & 0xFF; app1[p++] = 0; app1[p++] = 0;
  if (inline) {
    for (let i = 0; i < 4; i++) app1[p++] = i < teks.length ? teks.charCodeAt(i) & 0xFF : 0;
  } else {
    app1[p++] = 26; app1[p++] = 0; app1[p++] = 0; app1[p++] = 0; // offset nilai
  }
  app1[p++] = 0; app1[p++] = 0; app1[p++] = 0; app1[p++] = 0; // IFD berikut: tidak ada
  if (!inline) {
    for (let i = 0; i < teks.length; i++) app1[p++] = teks.charCodeAt(i) & 0xFF;
    app1[p++] = 0;
  }
  const out = new Uint8Array(2 + app1.length + (tanpaApp1.length - 2));
  out.set(tanpaApp1.subarray(0, 2), 0);
  out.set(app1, 2);
  out.set(tanpaApp1.subarray(2), 2 + app1.length);
  return { bytes: out, adaHakCipta: true };
}

// PNG: saring chunk. keepFn(tipe, data) -> true bila chunk dipertahankan.
// Chunk kritis (IHDR/PLTE/IDAT/IEND) selalu dipertahankan.
// Kembalikan Uint8Array baru, atau null bila bukan PNG.
export function saringChunkPng(bytes, keepFn) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (b.length < 8 || !sig.every((v, i) => b[i] === v)) return null;
  const KRITIS = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND']);
  const potong = [b.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const tipe = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const akhir = i + 12 + len;
    if (akhir > b.length) break;
    const data = b.subarray(i + 8, i + 8 + len);
    if (KRITIS.has(tipe) || keepFn(tipe, data)) potong.push(b.subarray(i, akhir));
    i = akhir;
    if (tipe === 'IEND') break;
  }
  const total = potong.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of potong) { out.set(c, o); o += c.length; }
  return out;
}

// Kata kunci chunk teks PNG (sebelum byte NUL pertama).
function kataKunciChunkTeks(data) {
  let s = '';
  for (let i = 0; i < data.length; i++) {
    if (data[i] === 0) break;
    s += String.fromCharCode(data[i]);
  }
  return s.trim().toLowerCase();
}

// Apakah chunk PNG ini membawa lokasi (GPS)? Dipakai mode "hapus lokasi
// saja": eXIf selalu dibuang; chunk teks XMP (iTXt/tEXt) dibuang bila
// kata kuncinya XMP atau isinya menyebut GPS. zTXt terkompresi SELALU
// dianggap membawa lokasi (P-02): isinya tidak bisa diperiksa tanpa
// dekompresi, jadi TIDAK PERNAH bisa dipastikan bebas GPS — mode gps
// membuang semua zTXt dan klaim "terhapus" pun jadi jujur.
export function chunkPngBawaGps(tipe, data) {
  if (tipe === 'eXIf') return true;
  if (tipe === 'zTXt') return true;
  if (tipe === 'iTXt' || tipe === 'tEXt') {
    if (kataKunciChunkTeks(data) === 'xml:com.adobe.xmp') return true;
    let isi = '';
    try { isi = new TextDecoder('latin1').decode(data).toLowerCase(); } catch (e) {}
    if (isi.includes('gpslatitude') || isi.includes('gpslongitude') || isi.includes('exif:gps')) return true;
  }
  return false;
}

// Daftar tipe chunk yang ada di file PNG (hanya baca header, tanpa salin
// isi). Dipakai verifikasi jujur mode gps: chunk terkompresi (zTXt) yang
// masih tersisa berarti lokasi "tidak bisa dipastikan", bukan "terhapus".
export function tipeChunkPng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  const out = new Set();
  if (b.length < 8 || !sig.every((v, i) => b[i] === v)) return out;
  let i = 8;
  while (i + 12 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const tipe = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    const akhir = i + 12 + len;
    if (akhir > b.length) break;
    out.add(tipe);
    i = akhir;
    if (tipe === 'IEND') break;
  }
  return out;
}

// Ratakan objek tag ExifReader jadi daftar [{nama, nilai}] terurut nama.
// Tag biner/file dilewati; nilai dipotong 200 karakter.
export function daftarSemuaTag(tags) {
  const LEWATI = new Set(['FileType', 'MimeType', 'Thumbnail']);
  const out = [];
  for (const nama of Object.keys(tags || {}).sort()) {
    if (LEWATI.has(nama)) continue;
    const t = tags[nama];
    let nilai = '';
    if (t == null) continue;
    if (typeof t === 'object' && t.description != null) nilai = String(t.description);
    else if (typeof t === 'object' && t.value != null) {
      const v = t.value;
      if (v instanceof ArrayBuffer || (typeof Uint8Array !== 'undefined' && v instanceof Uint8Array)) nilai = '(data biner, ' + v.byteLength + ' byte)';
      else if (Array.isArray(v)) nilai = v.map((x) => (x && typeof x === 'object' && 'numerator' in x) ? (x.numerator + '/' + x.denominator) : String(x)).join(', ');
      else nilai = String(v);
    } else if (typeof t !== 'object') nilai = String(t);
    else continue;
    if (nilai.length > 200) nilai = nilai.slice(0, 200) + '…';
    out.push({ nama, nilai });
  }
  return out;
}

/* ============ Akhir fungsi murni ============ */

export const meta = {"id": "exif-clean", "name": "Hapus EXIF", "cat": "gambar", "icon": "🧹", "desc": "Lihat dulu datanya, baru bersihkan metadata sebelum dishare.", "keywords": "exif,metadata,bersih,privasi,gps"};
export function render(root) {

      /* Penampil EXIF sebelum menghapus: baca metadata pakai ExifReader
         (CDN, pin versi) begitu foto dipilih, tampilkan isinya, baru hapus. */
      const EXIF_CDN = 'https://cdn.jsdelivr.net/npm/exifreader@4.23.5/dist/exif-reader.js';
      const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
      const MAKS_JUMLAH = 20;
      let exifSiap = null, zipSiap = null;
      const loadExif = () => {
        if (!exifSiap) exifSiap = T.loadScript(EXIF_CDN).then((ok) => ok && !!window.ExifReader);
        return exifSiap;
      };
      const pastZip = () => {
        if (!zipSiap) zipSiap = T.loadScript(ZIP_CDN).then((ok) => ok && typeof window.JSZip === 'function');
        return zipSiap;
      };
      const tagStr = (tags, name) => {
        const t = tags && tags[name];
        if (t == null) return '';
        if (typeof t === 'object' && t.description != null) return String(t.description);
        if (typeof t === 'object' && t.value != null) return String(t.value);
        return String(t);
      };
      const gpsDec = (tags, latName, refName) => {
        const t = tags && tags[latName];
        if (!t || t.value == null) return null;
        const v = t.value;
        let dec = null;
        if (Array.isArray(v) && v.length >= 3) {
          const n = (x) => (typeof x === 'object' && x !== null && 'numerator' in x)
            ? (x.denominator ? x.numerator / x.denominator : 0) : Number(x);
          dec = n(v[0]) + n(v[1]) / 60 + n(v[2]) / 3600;
        } else if (typeof v === 'number') dec = v;
        if ((dec == null || Number.isNaN(dec)) && t.description != null) {
          const d = parseFloat(String(t.description));
          if (!Number.isNaN(d)) dec = Math.abs(d);
        }
        if (dec == null) return null;
        const ref = tagStr(tags, refName).toUpperCase();
        if (ref === 'S' || ref === 'W') dec = -Math.abs(dec);
        return dec;
      };
      const punyaGpsDi = (tags) => gpsDec(tags, 'GPSLatitude', 'GPSLatitudeRef') != null && gpsDec(tags, 'GPSLongitude', 'GPSLongitudeRef') != null;

      const fileI = fileInput('image/*');
      fileI.multiple = true;
      const fmtSel = T.select([['jpeg', 'JPEG (.jpg)'], ['png', 'PNG (transparansi tetap ada)']], 'jpeg');
      const hapusSel = T.select([
        ['semua', 'Hapus semua data (gambar digambar ulang)'],
        ['lossless', 'Hapus semua data tanpa gambar ulang (kualitas piksel utuh)'],
        ['gps', 'Hapus lokasi (GPS) saja — data lain tetap ada'],
        ['hakcipta', 'Hapus semua kecuali hak cipta'],
      ], 'semua');
      const box = T.out();
      const lihatBox = T.out();
      const daftarBox = T.out();
      const statusBox = T.out();
      let files = [];
      let pilihIdx = 0;
      let cacheTag = new Map(); // idx -> tags ExifReader (atau null bila gagal)
      let hasilBatch = [];

      const jenisFile = (f) => {
        const n = (f.name || '').toLowerCase();
        const t = (f.type || '').toLowerCase();
        if (t === 'image/jpeg' || n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'jpeg';
        if (t === 'image/png' || n.endsWith('.png')) return 'png';
        return 'lain';
      };

      function gambarDaftar() {
        if (!files.length) { T.hide(daftarBox); return; }
        T.show(daftarBox, '');
        const list = T.el('<div style="display:grid;gap:6px;margin-top:8px"></div>');
        files.forEach((f, i) => {
          const row = T.el('<button type="button" class="btn" style="text-align:left;justify-content:space-between;display:flex;gap:8px;' + (i === pilihIdx ? 'border-color:var(--acc)' : '') + '"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + T.esc(f.name || ('foto ' + (i + 1))) + '</span><span class="dim" style="flex-shrink:0">' + fmtBytes(f.size) + '</span></button>');
          row.addEventListener('click', () => { pilihIdx = i; gambarDaftar(); lihatData(); });
          list.appendChild(row);
        });
        daftarBox.appendChild(list);
        if (files.length > 1) daftarBox.appendChild(T.el('<p class="hint">Ketuk nama file untuk melihat datanya. Tombol Bersihkan memproses semua ' + files.length + ' foto sekaligus.</p>'));
      }

      function gambarTabelTag(tags, cari) {
        const semua = daftarSemuaTag(tags);
        const q = (cari || '').toLowerCase();
        const tampil = q ? semua.filter((r) => r.nama.toLowerCase().includes(q) || r.nilai.toLowerCase().includes(q)) : semua;
        const lat = gpsDec(tags, 'GPSLatitude', 'GPSLatitudeRef');
        const lon = gpsDec(tags, 'GPSLongitude', 'GPSLongitudeRef');
        const punyaGps = lat != null && lon != null;
        let html = '<h3 style="font-size:13px;margin:4px 0 6px;color:var(--txt)">Data yang tersimpan di foto ini (' + semua.length + ' data)</h3>';
        if (punyaGps) {
          html += '<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.4);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.6;margin-bottom:8px"><b style="color:var(--err)">Foto ini menyimpan lokasi pengambilan (' + lat.toFixed(6) + ', ' + lon.toFixed(6) + ').</b> Siapa pun yang menerima foto ini bisa tahu di mana foto ini diambil.</div>';
        }
        html += '<input type="text" id="exif-cari" placeholder="Cari data, misal: kamera, lokasi, tanggal…" style="width:100%;margin-bottom:8px" value="' + T.esc(cari || '') + '">';
        if (!tampil.length) {
          html += '<p class="hint">' + (q ? 'Tidak ada data yang cocok dengan pencarian.' : 'Foto ini tidak menyimpan data tambahan.') + '</p>';
        } else {
          html += '<div style="max-height:280px;overflow:auto;border:1px solid #ffffff14;border-radius:8px"><table style="border-collapse:collapse;width:100%;font-size:12.5px">' +
            tampil.map((r) => {
              const isGps = r.nama.indexOf('GPS') === 0;
              return '<tr style="' + (isGps ? 'background:rgba(239,68,68,.08)' : '') + '"><td style="border-bottom:1px solid #ffffff10;padding:6px 8px;white-space:nowrap;color:var(--mut);vertical-align:top">' + T.esc(r.nama) + '</td><td style="border-bottom:1px solid #ffffff10;padding:6px 8px;word-break:break-word">' + T.esc(r.nilai) + '</td></tr>';
            }).join('') + '</table></div>';
        }
        html += '<p class="hint" style="margin-top:8px">Mau lihat semua datanya lebih lengkap? <a href="#/t/lihat-data-foto">Buka Lihat Data Foto</a>.</p>';
        T.show(lihatBox, html);
        const cariInp = lihatBox.querySelector('#exif-cari');
        if (cariInp) {
          cariInp.addEventListener('input', () => gambarTabelTag(tags, cariInp.value));
          // jaga fokus & kursor saat mengetik (tabel digambar ulang tiap ketik)
          const pos = cariInp.value.length;
          cariInp.focus();
          try { cariInp.setSelectionRange(pos, pos); } catch (e) {}
        }
      }

      async function lihatData() {
        T.hide(lihatBox);
        const f = files[pilihIdx];
        if (!f) return;
        T.show(lihatBox, '<p class="center mut">Membaca data foto...</p>');
        const ok = await loadExif();
        if (!ok) {
          T.show(lihatBox, '<p class="hint">Data foto tidak bisa dibaca (pembaca gagal dimuat, cek koneksi). Foto tetap bisa dibersihkan seperti biasa.</p>');
          return;
        }
        let tags = {};
        try { tags = window.ExifReader.load(await f.arrayBuffer()) || {}; }
        catch (e) { tags = {}; }
        cacheTag.set(pilihIdx, tags);
        gambarTabelTag(tags, '');
      }

      // Gambar ulang via canvas (mode "semua"): JPEG = latar putih, PNG = transparan.
      async function gambarUlang(file, fmt) {
        const img = await loadImage(file);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        if (fmt === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0);
        const blob = await canvasToBlob(c, fmt === 'png' ? 'image/png' : 'image/jpeg', fmt === 'png' ? undefined : 0.92);
        if (!blob) throw new Error('gagal');
        return blob;
      }

      // Bersihkan SATU file sesuai mode. Kembalikan {blob, name, catatan}.
      async function bersihkanSatu(file, mode, fmt) {
        const base = (file.name || 'gambar').replace(/\.[^.]*$/, '');
        const jenis = jenisFile(file);
        if (mode === 'semua') {
          const blob = await gambarUlang(file, fmt);
          return { blob, name: base + '-bersih.' + (fmt === 'png' ? 'png' : 'jpg'), catatan: '' };
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (mode === 'lossless') {
          if (jenis === 'jpeg') {
            const out = buangSegmenJpeg(bytes, new Set([0xE1, 0xED, 0xFE]));
            if (out) return { blob: new Blob([out], { type: 'image/jpeg' }), name: base + '-bersih.jpg', catatan: 'tanpa gambar ulang' };
          } else if (jenis === 'png') {
            const out = saringChunkPng(bytes, (t) => !['eXIf', 'tEXt', 'iTXt', 'zTXt'].includes(t));
            if (out) return { blob: new Blob([out], { type: 'image/png' }), name: base + '-bersih.png', catatan: 'tanpa gambar ulang' };
          }
          const blob = await gambarUlang(file, fmt);
          return { blob, name: base + '-bersih.' + (fmt === 'png' ? 'png' : 'jpg'), catatan: 'format ini tidak bisa tanpa gambar ulang, jadi digambar ulang' };
        }
        if (mode === 'gps') {
          if (jenis === 'jpeg') {
            const r = hapusGpsDariJpeg(bytes);
            // Lokasi juga bisa tersimpan di segmen XMP (APP1 lain) — cek saja,
            // tidak dihapus di mode ini karena data XMP lain harus dipertahankan.
            let xmpGps = false;
            try {
              const teksAwal = new TextDecoder('latin1').decode(r.bytes.subarray(0, Math.min(r.bytes.length, 200000)));
              xmpGps = teksAwal.includes('GPSLatitude') || teksAwal.includes('exif:GPS');
            } catch (e) {}
            return {
              blob: new Blob([r.bytes], { type: 'image/jpeg' }),
              name: base + '-tanpa-lokasi.jpg',
              catatan: (r.ketemu ? 'lokasi terhapus, data lain tetap ada' : 'foto ini memang tidak menyimpan lokasi') +
                (xmpGps ? ' · tapi lokasi di XMP masih ada (pakai mode hapus semua bila mau hilang total)' : ''),
            };
          }
          if (jenis === 'png') {
            // Lokasi juga bisa tersimpan di chunk teks XMP (iTXt/tEXt) —
            // cabang ini dulu hanya membuang eXIf sehingga GPS di XMP
            // bertahan sementara UI mengklaim "lokasi terhapus ✓".
            // Chunk teks yang kata kuncinya XMP, atau isinya menyebut GPS,
            // ikut dibuang. zTXt terkompresi (isinya tidak bisa diperiksa
            // tanpa dekompresi) SELALU dibuang (P-02) — tidak ada chunk
            // tak terperiksa yang tersisa untuk diklaim "terhapus".
            let adaExif = false, adaXmpGps = false, adaZtxt = false;
            const buangXmpGps = (t, d) => {
              if (!chunkPngBawaGps(t, d)) return true;
              if (t === 'eXIf') adaExif = true;
              else if (t === 'zTXt') adaZtxt = true;
              else adaXmpGps = true;
              return false;
            };
            const out = saringChunkPng(bytes, buangXmpGps);
            if (out) return {
              blob: new Blob([out], { type: 'image/png' }),
              name: base + '-tanpa-lokasi.png',
              catatan: (adaExif || adaXmpGps || adaZtxt)
                ? 'lokasi terhapus' + (adaXmpGps ? ' (termasuk lokasi di data XMP)' : adaZtxt ? ' (termasuk teks terkompresi yang tidak bisa diperiksa isinya)' : ' (data foto lain dihapus bersama blok EXIF PNG)')
                : 'foto ini memang tidak menyimpan lokasi',
            };
          }
          const blob = await gambarUlang(file, fmt);
          return { blob, name: base + '-bersih.' + (fmt === 'png' ? 'png' : 'jpg'), catatan: 'format ini tidak bisa hapus lokasi saja, jadi semua data dihapus' };
        }
        // mode hakcipta
        if (jenis === 'jpeg') {
          const r = exifHanyaHakCipta(bytes);
          return {
            blob: new Blob([r.bytes], { type: 'image/jpeg' }),
            name: base + '-bersih.jpg',
            catatan: r.adaHakCipta ? 'hak cipta dipertahankan, data lain dihapus' : 'tidak ada hak cipta di foto ini, semua data dihapus',
          };
        }
        if (jenis === 'png') {
          const out = saringChunkPng(bytes, (t, d) => {
            if (t === 'eXIf' || t === 'zTXt') return false;
            if (t === 'tEXt' || t === 'iTXt') return kataKunciChunkTeks(d) === 'copyright';
            return true;
          });
          if (out) return { blob: new Blob([out], { type: 'image/png' }), name: base + '-bersih.png', catatan: 'tulisan hak cipta (bila ada) dipertahankan' };
        }
        const blob = await gambarUlang(file, fmt);
        return { blob, name: base + '-bersih.' + (fmt === 'png' ? 'png' : 'jpg'), catatan: 'format ini tidak bisa mempertahankan hak cipta, jadi semua data dihapus' };
      }

      async function process() {
        T.hide(box); T.hide(statusBox);
        if (!files.length) { T.toast('Pilih gambar dulu'); return; }
        const mode = hapusSel.value, fmt = fmtSel.value;
        hasilBatch = [];
        dlB.disabled = true; // belum ada hasil baru (P2-2)
        const gagal = [];
        const okExif = await loadExif();
        for (let i = 0; i < files.length; i++) {
          if (files.length > 1) T.show(statusBox, '<span class="dim">Membersihkan ' + (i + 1) + ' dari ' + files.length + ': ' + T.esc(files[i].name || '') + '…</span>');
          try {
            const r = await bersihkanSatu(files[i], mode, fmt);
            // Verifikasi jujur: baca ulang hasil, pastikan lokasi benar-benar hilang bila modenya begitu.
            // ExifReader tidak membaca GPS dari XMP, jadi mode gps selalu
            // ditambah pemeriksaan byte hasil (jalan walau ExifReader gagal
            // dimuat) supaya klaim "lokasi terhapus ✓" jujur.
            let verifikasi = '';
            if (mode === 'gps' || mode === 'semua' || mode === 'lossless' || mode === 'hakcipta') {
              try {
                let masihAdaGps = false;
                if (okExif) {
                  const tagsHasil = window.ExifReader.load(await r.blob.arrayBuffer()) || {};
                  masihAdaGps = punyaGpsDi(tagsHasil);
                  if (mode !== 'gps' && mode !== 'hakcipta') verifikasi = Object.keys(tagsHasil).filter((k) => !['FileType', 'MimeType'].includes(k)).length === 0 ? ' · tidak ada data tersisa ✓' : '';
                }
                if (mode === 'gps') {
                  // P-02: chunk terkompresi (zTXt) tidak bisa diperiksa
                  // isinya lewat pindai byte — bila masih tersisa di hasil,
                  // klaimnya "tidak bisa dipastikan", bukan "terhapus ✓".
                  let adaTakTerperiksa = false;
                  if (!masihAdaGps) {
                    try {
                      const bufHasil = new Uint8Array(await r.blob.arrayBuffer());
                      const teksHasil = new TextDecoder('latin1').decode(bufHasil.subarray(0, Math.min(bufHasil.length, 1000000))).toLowerCase();
                      masihAdaGps = teksHasil.includes('gpslatitude') || teksHasil.includes('gpslongitude');
                      if (jenisFile(files[i]) === 'png') adaTakTerperiksa = tipeChunkPng(bufHasil).has('zTXt');
                    } catch (e) {}
                  }
                  verifikasi = masihAdaGps ? ' · lokasi MASIH ADA (coba mode hapus semua)'
                    : adaTakTerperiksa ? ' · lokasi tidak bisa dipastikan (ada data terkompresi yang tidak bisa diperiksa — coba mode hapus semua)'
                    : ' · lokasi terhapus ✓';
                }
              } catch (e) { /* hasil tidak terbaca = tidak ada EXIF yang bisa dibaca */ }
            }
            hasilBatch.push({ blob: r.blob, name: r.name, asal: files[i].name, orig: files[i].size, catatan: r.catatan + verifikasi });
          } catch (e) {
            gagal.push((files[i].name || 'foto ' + (i + 1)) + ' (tidak bisa diproses)');
          }
        }
        T.hide(statusBox);
        if (!hasilBatch.length) { T.toast('Tidak ada foto yang berhasil dibersihkan'); return; }
        dlB.disabled = false; // hasil sudah ada, tombol Unduh aktif (P2-2)
        T.show(box, '');
        if (hasilBatch.length === 1) {
          const r = hasilBatch[0];
          box.appendChild(T.el(
            '<div><div class="kv"><span>Ukuran asli</span><b>' + fmtBytes(r.orig) + '</b></div>' +
            '<div class="kv"><span>Ukuran bersih</span><b>' + fmtBytes(r.blob.size) + '</b></div>' +
            (r.catatan ? '<p class="hint">' + T.esc(r.catatan) + '</p>' : '') + '</div>'));
          const url = URL.createObjectURL(r.blob);
          box.appendChild(imgEl(url, 'Hasil bersih EXIF'));
          T.onLeave(() => URL.revokeObjectURL(url));
        } else {
          box.appendChild(T.el('<div class="kv"><span>Berhasil</span><b>' + hasilBatch.length + ' dari ' + files.length + ' foto</b></div>'));
          hasilBatch.forEach((r) => {
            const row = T.el('<div class="row" style="align-items:center;justify-content:space-between"></div>');
            row.appendChild(T.el('<div style="word-break:break-word"><b>' + T.esc(r.name) + '</b><div class="dim" style="font-size:12px">' + fmtBytes(r.orig) + ' → ' + fmtBytes(r.blob.size) + (r.catatan ? ' · ' + T.esc(r.catatan) : '') + '</div></div>'));
            row.appendChild(T.btn('Unduh', () => { T.dl(r.name, r.blob, r.blob.type); }, true));
            box.appendChild(row);
          });
          const zipB = T.btn('Unduh semua (ZIP)', async () => {
            T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
            if (!(await pastZip())) { T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi, atau unduh satu per satu.</span>'); return; }
            try {
              const zip = new window.JSZip();
              const pakaiNama = new Set();
              const namaUnik = (nama) => {
                if (!pakaiNama.has(nama)) { pakaiNama.add(nama); return nama; }
                const i = nama.lastIndexOf('.');
                const dasar = i > 0 ? nama.slice(0, i) : nama;
                const ext = i > 0 ? nama.slice(i) : '';
                let k = 2, coba;
                do { coba = dasar + ' (' + k + ')' + ext; k++; } while (pakaiNama.has(coba));
                pakaiNama.add(coba);
                return coba;
              };
              hasilBatch.forEach((r) => zip.file(namaUnik(r.name), r.blob));
              const blob = await zip.generateAsync({ type: 'blob' });
              T.dl('foto-bersih.zip', blob, 'application/zip');
              T.hide(statusBox);
              T.toast('ZIP berhasil diunduh');
            } catch (e) {
              T.show(statusBox, '<span class="dim">Gagal membuat ZIP. Unduh fotonya satu per satu.</span>');
            }
          }, true);
          box.appendChild(T.row(zipB));
        }
        if (gagal.length) box.appendChild(T.el('<p class="dim" style="font-size:12px">Gagal: ' + T.esc(gagal.join('; ')) + '</p>'));
        T.scrollToPreview(box);
      }

      hapusSel.addEventListener('change', () => {
        // Format keluar hanya berlaku untuk mode gambar ulang.
        fmtSel.parentNode.style.display = hapusSel.value === 'semua' ? '' : 'none';
      });

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.el('<p class="note">ℹ️ Gambar digambar ulang lewat canvas, jadi metadata EXIF standar (lokasi GPS, info kamera, tanggal jepret) ikut terbuang. Jujur aja: ini tidak menghapus watermark atau tulisan yang sudah nempel di piksel gambar.</p>'));
      root.appendChild(T.field('Pilih gambar (bisa banyak sekaligus)', fileI, 'Maksimal ' + MAKS_JUMLAH + ' foto.'));
      root.appendChild(daftarBox);
      root.appendChild(lihatBox);
      root.appendChild(T.field('Yang dihapus', hapusSel, '“Tanpa gambar ulang” menjaga kualitas piksel tetap utuh (hanya untuk JPG/PNG). “Lokasi saja” menjaga data lain seperti kamera & tanggal.'));
      root.appendChild(T.field('Format hasil', fmtSel, 'PNG menjaga latar transparan tetap transparan. Hanya berlaku bila mode “gambar digambar ulang” dipilih.'));
      // "Unduh Hasil" sekunder + nonaktif sampai hasil benar-benar ada (P2-2).
      const dlB = T.btn('Unduh Hasil', () => {
        if (!hasilBatch.length) { T.toast('Bersihkan dulu gambarnya'); return; }
        const r = hasilBatch[0];
        T.dl(r.name, r.blob, r.blob.type);
        T.toast('Berhasil diunduh');
      }, false, true);
      root.appendChild(T.row(
        T.btn('Bersihkan EXIF', process, true),
        dlB
      ));
      root.appendChild(statusBox);
      root.appendChild(box);
      fileI.addEventListener('change', () => {
        files = [...(fileI.files || [])].slice(0, MAKS_JUMLAH);
        pilihIdx = 0;
        cacheTag = new Map();
        hasilBatch = [];
        dlB.disabled = true; // file baru dipilih, hasil lama tidak berlaku (P2-2)
        T.hide(box);
        gambarDaftar();
        lihatData();
      });
    
}
