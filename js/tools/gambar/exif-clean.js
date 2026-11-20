import { h as T, utils, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage, kvRows, tabs } from '../../core.js';

/* Data & EXIF Foto — hasil gabung v6.21.0 (B7):
   Tab 1 "Lihat data": tampilan kurasi (kamera, tanggal, bukaan, ISO,
   lokasi + tautan peta) dari Lihat Data Foto + daftar semua tag EXIF.
   Tab 2 "Bersihkan data": mesin Hapus EXIF (4 mode, massal, ZIP).
   Tab 3 "Ubah data": ubah 6 kelompok data (keterangan, tanggal, arah,
   merk/model kamera, fotografer, aplikasi) dari Edit EXIF Foto, JPEG
   saja. Data lain di foto DIPERTAHANKAN (perbaikan gelombang 2, F5). */

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

/* ============ Parser EXIF kurasi (dari Lihat Data Foto) ============ */

// Parser EXIF JPEG minimal, ditulis sendiri (tanpa pustaka luar).
// Membaca IFD0 + ExifIFD + GPS IFD. Mengembalikan null bila tidak ada EXIF.
export function parseExif(buf) {
  const view = buf instanceof DataView ? buf : new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return null;
  let off = 2, exifStart = -1;
  while (off + 4 <= view.byteLength) {
    if (view.getUint8(off) !== 0xFF) break;
    const marker = view.getUint8(off + 1);
    if (marker === 0xDA || marker === 0xD9) break;
    const len = view.getUint16(off + 2);
    if (marker === 0xE1 && off + 10 <= view.byteLength &&
        view.getUint32(off + 4) === 0x45786966 && view.getUint16(off + 8) === 0) {
      exifStart = off + 10;
      break;
    }
    off += 2 + len;
  }
  if (exifStart < 0) return null;
  const tiff = exifStart;
  const le = view.getUint16(tiff) === 0x4949;
  if (view.getUint16(tiff + 2, le) !== 42) return null;
  const get16 = (o) => view.getUint16(tiff + o, le);
  const get32 = (o) => view.getUint32(tiff + o, le);
  const ukuranTipe = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  function bacaNilai(tipe, jumlah, offNilai) {
    const ukuran = (ukuranTipe[tipe] || 1) * jumlah;
    const pos = ukuran <= 4 ? offNilai : get32(offNilai);
    if (tipe === 2) {
      let s = '';
      for (let i = 0; i < jumlah; i++) {
        const c = view.getUint8(tiff + pos + i);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s.trim();
    }
    if (tipe === 3) {
      const arr = [];
      for (let i = 0; i < jumlah; i++) arr.push(get16(pos + i * 2));
      return jumlah === 1 ? arr[0] : arr;
    }
    if (tipe === 4 || tipe === 9) {
      const arr = [];
      for (let i = 0; i < jumlah; i++) arr.push(get32(pos + i * 4));
      return jumlah === 1 ? arr[0] : arr;
    }
    if (tipe === 5 || tipe === 10) {
      const arr = [];
      for (let i = 0; i < jumlah; i++) {
        const a = get32(pos + i * 8), b = get32(pos + i * 8 + 4);
        arr.push(b === 0 ? 0 : a / b);
      }
      return jumlah === 1 ? arr[0] : arr;
    }
    return null;
  }
  function bacaIfd(offIfd) {
    const out = {};
    if (offIfd <= 0 || tiff + offIfd + 2 > view.byteLength) return out;
    const n = get16(offIfd);
    for (let i = 0; i < n; i++) {
      const e = offIfd + 2 + i * 12;
      if (tiff + e + 12 > view.byteLength) break;
      const tag = get16(e), tipe = get16(e + 2), jumlah = get32(e + 4);
      out[tag] = bacaNilai(tipe, jumlah, e + 8);
    }
    return out;
  }
  const ifd0 = bacaIfd(get32(4));
  const hasil = {
    kamera: [ifd0[0x010F], ifd0[0x0110]].filter(Boolean).join(' ') || null,
    tanggal: ifd0[0x0132] || null,
    deskripsi: ifd0[0x010E] || null,
    software: ifd0[0x0131] || null,
    artis: ifd0[0x013B] || null
  };
  if (ifd0[0x8769]) {
    const ex = bacaIfd(ifd0[0x8769]);
    hasil.tanggalJepret = ex[0x9003] || ex[0x9004] || null;
    hasil.exposure = typeof ex[0x829A] === 'number' && ex[0x829A] > 0
      ? (ex[0x829A] >= 1 ? ex[0x829A] + ' detik' : '1/' + Math.round(1 / ex[0x829A]) + ' detik') : null;
    hasil.bukaan = typeof ex[0x829D] === 'number' ? 'f/' + (Math.round(ex[0x829D] * 10) / 10) : null;
    hasil.iso = ex[0x8827] || null;
    hasil.focal = typeof ex[0x920A] === 'number' ? ex[0x920A] + ' mm' : null;
    hasil.dimensi = (ex[0xA002] && ex[0xA003]) ? ex[0xA002] + ' x ' + ex[0xA003] : null;
  }
  if (ifd0[0x8825]) {
    const g = bacaIfd(ifd0[0x8825]);
    const keDerajat = (arr) => (Array.isArray(arr) && arr.length >= 3) ? arr[0] + arr[1] / 60 + arr[2] / 3600 : null;
    const lat = keDerajat(g[0x0002]), lon = keDerajat(g[0x0004]);
    if (lat !== null && lon !== null) {
      hasil.gps = {
        lat: (g[0x0001] === 'S' ? -lat : lat),
        lon: (g[0x0003] === 'W' ? -lon : lon)
      };
    }
  }
  return hasil;
}
// Kompatibilitas: parser yang sama juga tersedia lewat utils (dulu
// didaftarkan tool Lihat Data Foto; tidak ada tool lain yang memakainya).
utils.parseExif = parseExif;

/* ============ Ubah EXIF (dari Edit EXIF Foto) ============ */

// "2026:11:19 10:30:00" (format EXIF) -> "2026-11-19T10:30" (input tanggal).
export function exifKeIso(s) {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec((s || '').trim());
  if (!m) return '';
  return m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5];
}

// "2026-11-19T10:30" -> "2026:11:19 10:30:00" (format EXIF).
export function isoKeExif(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec((s || '').trim());
  if (!m) return '';
  return m[1] + ':' + m[2] + ':' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + (m[6] || '00');
}

function asciiBersih(s) {
  let keluar = '';
  for (let i = 0; i < s.length; i++) {
    const kode = s.charCodeAt(i);
    keluar += (kode >= 32 && kode <= 126) ? s[i] : '?';
  }
  return keluar;
}

// Baca field EXIF yang bisa diedit dari byte JPEG.
// Kembalikan null bila bukan JPEG; {adaExif:false} bila JPEG tanpa EXIF.
export function bacaExifEdit(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  const seg = cariSegmenExif(b);
  if (!seg) return { adaExif: false };
  const t = b.subarray(seg.isiAwal, seg.akhir);
  if (t.length < 8) return { adaExif: false };
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4D && t[1] === 0x4D)) return { adaExif: false };
  const u16 = (o) => le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1];
  const u32 = (o) => le
    ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) >>> 0
    : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3]) >>> 0;
  if (u16(2) !== 42) return { adaExif: false };
  const ukuranTipe = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  function bacaNilai(tipe, jumlah, offNilai) {
    const ukuran = (ukuranTipe[tipe] || 1) * jumlah;
    const pos = ukuran <= 4 ? offNilai : u32(offNilai);
    if (pos + ukuran > t.length) return null;
    if (tipe === 2) {
      let s = '';
      for (let i = 0; i < jumlah; i++) {
        const c = t[pos + i];
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      return s.trim();
    }
    if (tipe === 3) return jumlah === 1 ? u16(pos) : null;
    if (tipe === 4) return jumlah === 1 ? u32(pos) : null;
    return null;
  }
  function bacaIfd(offIfd) {
    const out = {};
    if (offIfd <= 0 || offIfd + 2 > t.length) return out;
    const n = u16(offIfd);
    for (let i = 0; i < n; i++) {
      const e = offIfd + 2 + i * 12;
      if (e + 12 > t.length) break;
      out[u16(e)] = bacaNilai(u16(e + 2), u32(e + 4), e + 8);
    }
    return out;
  }
  const ifd0 = bacaIfd(u32(4));
  const hasil = {
    adaExif: true,
    deskripsi: ifd0[0x010E] || '',
    pembuat: ifd0[0x010F] || '',
    model: ifd0[0x0110] || '',
    orientasi: ifd0[0x0112] || 1,
    software: ifd0[0x0131] || '',
    tanggal: ifd0[0x0132] || '',
    artis: ifd0[0x013B] || '',
    tanggalJepret: ''
  };
  if (ifd0[0x8769]) {
    const ex = bacaIfd(ifd0[0x8769]);
    hasil.tanggalJepret = ex[0x9003] || ex[0x9004] || '';
  }
  return hasil;
}

// Bangun byte TIFF (little-endian) dari field yang diisi.
// edit: {deskripsi, pembuat, model, orientasi, software, tanggal,
// tanggalJepret, artis}. Field kosong dilewati.
export function bangunTiff(edit) {
  const e = edit || {};
  const teks = [];
  const entri0 = [];
  function tambahTeks(tag, nilai) {
    if (!nilai) return;
    const bersih = asciiBersih(String(nilai));
    if (!bersih) return;
    teks.push({ tag, data: bersih });
    entri0.push({ tag, tipe: 2, jumlah: bersih.length + 1, teks: bersih });
  }
  tambahTeks(0x010E, e.deskripsi);
  tambahTeks(0x010F, e.pembuat);
  tambahTeks(0x0110, e.model);
  const orientasi = Math.max(1, Math.min(8, Math.round(e.orientasi == null ? 1 : e.orientasi)));
  entri0.push({ tag: 0x0112, tipe: 3, jumlah: 1, nilai: orientasi });
  tambahTeks(0x0131, e.software);
  tambahTeks(0x0132, e.tanggal);
  tambahTeks(0x013B, e.artis);
  const punyaExif = Boolean(e.tanggalJepret);
  if (punyaExif) entri0.push({ tag: 0x8769, tipe: 4, jumlah: 1, pointerExif: true });
  entri0.sort((a, b) => a.tag - b.tag);
  const entriEx = [];
  if (punyaExif) {
    const bersih = asciiBersih(String(e.tanggalJepret));
    entriEx.push({ tag: 0x9003, tipe: 2, jumlah: bersih.length + 1, teks: bersih });
    entriEx.push({ tag: 0x9004, tipe: 2, jumlah: bersih.length + 1, teks: bersih });
  }
  const ukuranIfd0 = 2 + entri0.length * 12 + 4;
  const ukuranIfdEx = punyaExif ? 2 + entriEx.length * 12 + 4 : 0;
  const offIfd0 = 8;
  const offIfdEx = offIfd0 + ukuranIfd0;
  let offData = offIfdEx + ukuranIfdEx;
  const semuaTeks = entri0.concat(entriEx).filter((en) => en.teks != null);
  semuaTeks.forEach((en) => { en.offData = offData; offData += en.jumlah; });
  const total = offData;
  const out = new Uint8Array(total);
  out[0] = 0x49; out[1] = 0x49; out[2] = 42; out[3] = 0;
  out[4] = offIfd0 & 255; out[5] = (offIfd0 >> 8) & 255; out[6] = 0; out[7] = 0;
  const tulis16 = (o, v) => { out[o] = v & 255; out[o + 1] = (v >> 8) & 255; };
  const tulis32 = (o, v) => { out[o] = v & 255; out[o + 1] = (v >> 8) & 255; out[o + 2] = (v >> 16) & 255; out[o + 3] = (v >> 24) & 255; };
  function tulisIfd(off, daftar) {
    tulis16(off, daftar.length);
    daftar.forEach((en, i) => {
      const eo = off + 2 + i * 12;
      tulis16(eo, en.tag);
      tulis16(eo + 2, en.tipe);
      tulis32(eo + 4, en.jumlah);
      if (en.teks != null) {
        if (en.jumlah <= 4) {
          // Nilai pendek (<= 4 byte) wajib disimpan INLINE di field nilai
          // (spesifikasi TIFF): pembaca mengabaikan offset bila ukurannya
          // <= 4 byte — menulis offset di sini membuat nilai terbaca
          // sebagai byte offset itu sendiri (mis. deskripsi 'X' terbaca 'P').
          for (let j = 0; j < 4; j++) out[eo + 8 + j] = j < en.teks.length ? en.teks.charCodeAt(j) : 0;
        } else tulis32(eo + 8, en.offData);
      }
      else if (en.nilai != null) { tulis16(eo + 8, en.nilai); tulis16(eo + 10, 0); }
      else if (en.pointerExif) tulis32(eo + 8, offIfdEx);
    });
    tulis32(off + 2 + daftar.length * 12, 0);
  }
  tulisIfd(offIfd0, entri0);
  if (punyaExif) tulisIfd(offIfdEx, entriEx);
  semuaTeks.forEach((en) => {
    for (let i = 0; i < en.teks.length; i++) out[en.offData + i] = en.teks.charCodeAt(i);
    out[en.offData + en.teks.length] = 0;
  });
  return out;
}

// ---------- Pertahankan EXIF lain (pola tambah-gps-foto) ----------
// Baca satu IFD jadi [{tag, tipe, jumlah, nilai}] dengan nilai yang
// dinormalisasi: ASCII/BYTE/UNDEFINED -> Uint8Array mentah; SHORT/LONG ->
// [angka]; RATIONAL -> [[pembilang, penyebut], ...].
const UKURAN_TIPE_GABUNG = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
function bacaU16G(t, o, le) { return le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]; }
function bacaU32G(t, o, le) {
  return le
    ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) >>> 0
    : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3]) >>> 0;
}
function bacaIfdMentah(t, off, le) {
  if (off + 2 > t.length) return { entri: [], berikut: 0 };
  const n = bacaU16G(t, off, le);
  const entri = [];
  for (let k = 0; k < n; k++) {
    const eo = off + 2 + k * 12;
    if (eo + 12 > t.length) break;
    const tag = bacaU16G(t, eo, le);
    const tipe = bacaU16G(t, eo + 2, le);
    const jumlah = bacaU32G(t, eo + 4, le);
    const ukuran = UKURAN_TIPE_GABUNG[tipe] || 0;
    if (!ukuran || jumlah > 1000000) continue;
    const total = jumlah * ukuran;
    let awal;
    if (total <= 4) awal = eo + 8;
    else { awal = bacaU32G(t, eo + 8, le); if (awal + total > t.length) continue; }
    let nilai;
    if (tipe === 2 || tipe === 1 || tipe === 7 || tipe === 6 || tipe === 11 || tipe === 12) {
      nilai = t.slice(awal, awal + total);
    } else if (tipe === 3 || tipe === 8) {
      nilai = []; for (let i = 0; i < jumlah; i++) nilai.push(bacaU16G(t, awal + i * 2, le));
    } else if (tipe === 4 || tipe === 9) {
      nilai = []; for (let i = 0; i < jumlah; i++) nilai.push(bacaU32G(t, awal + i * 4, le));
    } else if (tipe === 5 || tipe === 10) {
      nilai = [];
      for (let i = 0; i < jumlah; i++) nilai.push([bacaU32G(t, awal + i * 8, le), bacaU32G(t, awal + i * 8 + 4, le)]);
    } else nilai = t.slice(awal, awal + total);
    entri.push({ tag, tipe, jumlah, nilai });
  }
  const berikut = off + 2 + n * 12 + 4 <= t.length ? bacaU32G(t, off + 2 + n * 12, le) : 0;
  return { entri, berikut };
}
function cariEntriG(entri, tag) { return (entri || []).find((e) => e.tag === tag) || null; }
function nilaiPointerG(e) { return e && Array.isArray(e.nilai) ? e.nilai[0] : 0; }
function nilaiKeByteG(e) {
  if (e.nilai instanceof Uint8Array) return e.nilai;
  const n = e.jumlah;
  const ukuran = UKURAN_TIPE_GABUNG[e.tipe] || 1;
  const out = new Uint8Array(n * ukuran);
  const dv = new DataView(out.buffer);
  if (e.tipe === 3 || e.tipe === 8) e.nilai.forEach((v, i) => dv.setUint16(i * 2, v, true));
  else if (e.tipe === 4 || e.tipe === 9) e.nilai.forEach((v, i) => dv.setUint32(i * 4, v >>> 0, true));
  else if (e.tipe === 5 || e.tipe === 10) e.nilai.forEach((p, i) => { dv.setUint32(i * 8, p[0] >>> 0, true); dv.setUint32(i * 8 + 4, p[1] >>> 0, true); });
  return out;
}
function entriTeksG(tag, nilai) {
  if (nilai == null || nilai === '') return null;
  const bersih = asciiBersih(String(nilai));
  if (!bersih) return null;
  const data = new Uint8Array(bersih.length + 1);
  for (let i = 0; i < bersih.length; i++) data[i] = bersih.charCodeAt(i);
  return { tag, tipe: 2, jumlah: bersih.length + 1, nilai: data };
}

// Bangun byte TIFF baru (little-endian) dari field yang diedit, dengan
// MEMPERTAHANKAN semua entri TIFF lama (GPS, exposure, lensa, Interop,
// pratinjau/IFD1) — hanya 7 field IFD0 + 2 field tanggal jepret yang
// diganti/dihapus sesuai isi form. Field kosong = tag-nya dihapus (sama
// seperti bangunTiff). Bila TIFF lama tidak bisa dibaca, jatuh ke
// bangunTiff (bangun dari nol). Fungsi murni, bisa diuji.
export function bangunTiffGabung(tiffLama, edit) {
  const e = edit || {};
  let lama = null;
  if (tiffLama && tiffLama.length >= 8) {
    const le = tiffLama[0] === 0x49 && tiffLama[1] === 0x49;
    const be = tiffLama[0] === 0x4D && tiffLama[1] === 0x4D;
    if ((le || be) && bacaU16G(tiffLama, 2, le) === 42) {
      const ifd0 = bacaIfdMentah(tiffLama, bacaU32G(tiffLama, 4, le), le);
      const exifPtr = cariEntriG(ifd0.entri, 0x8769);
      const gpsPtr = cariEntriG(ifd0.entri, 0x8825);
      const interopPtr0 = cariEntriG(ifd0.entri, 0xA005);
      lama = { le, ifd0: ifd0.entri, exif: null, gps: null, interop: null, interopDiIfd0: false, ifd1: null, thumb: null };
      if (exifPtr) lama.exif = bacaIfdMentah(tiffLama, nilaiPointerG(exifPtr), le).entri;
      if (gpsPtr) lama.gps = bacaIfdMentah(tiffLama, nilaiPointerG(gpsPtr), le).entri;
      if (lama.exif) {
        const ip = cariEntriG(lama.exif, 0xA005);
        if (ip) lama.interop = bacaIfdMentah(tiffLama, nilaiPointerG(ip), le).entri;
      }
      if (!lama.interop && interopPtr0) {
        lama.interop = bacaIfdMentah(tiffLama, nilaiPointerG(interopPtr0), le).entri;
        lama.interopDiIfd0 = true;
      }
      if (ifd0.berikut) {
        const d1 = bacaIfdMentah(tiffLama, ifd0.berikut, le);
        const fmt = cariEntriG(d1.entri, 0x0201);
        const len = cariEntriG(d1.entri, 0x0202);
        if (fmt && len) {
          const o = nilaiPointerG(fmt), n = nilaiPointerG(len);
          // Pratinjau hanya dipertahankan bila byte-nya bisa dibaca utuh;
          // kalau tidak, IFD1 dibuang supaya tidak ada pointer basi.
          if (o + n <= tiffLama.length) { lama.ifd1 = d1.entri; lama.thumb = tiffLama.slice(o, o + n); }
        } else lama.ifd1 = d1.entri;
      }
    }
  }
  if (!lama) return bangunTiff(edit);

  const EDIT_IFD0 = [0x010E, 0x010F, 0x0110, 0x0112, 0x0131, 0x0132, 0x013B];
  const POINTER_IFD0 = [0x8769, 0x8825, 0xA005];
  const ifd0Baru = lama.ifd0.filter((en) => !EDIT_IFD0.includes(en.tag) && !POINTER_IFD0.includes(en.tag));
  const tambah = (tag, nilai) => { const en = entriTeksG(tag, nilai); if (en) ifd0Baru.push(en); };
  tambah(0x010E, e.deskripsi);
  tambah(0x010F, e.pembuat);
  tambah(0x0110, e.model);
  const orientasi = Math.max(1, Math.min(8, Math.round(e.orientasi == null ? 1 : e.orientasi)));
  ifd0Baru.push({ tag: 0x0112, tipe: 3, jumlah: 1, nilai: [orientasi] });
  tambah(0x0131, e.software);
  tambah(0x0132, e.tanggal);
  tambah(0x013B, e.artis);

  const exifBaru = (lama.exif || []).filter((en) => en.tag !== 0x9003 && en.tag !== 0x9004 && en.tag !== 0xA005);
  if (e.tanggalJepret) {
    const t3 = entriTeksG(0x9003, e.tanggalJepret);
    const t4 = entriTeksG(0x9004, e.tanggalJepret);
    if (t3) exifBaru.push(t3);
    if (t4) exifBaru.push(t4);
  }
  const adaExif = exifBaru.length > 0;
  const adaGps = lama.gps && lama.gps.length > 0;
  const adaInterop = lama.interop && lama.interop.length > 0;
  const adaIfd1 = lama.ifd1 && lama.ifd1.length > 0;
  if (adaExif) ifd0Baru.push({ tag: 0x8769, tipe: 4, jumlah: 1, nilai: null, ptr: 'exif' });
  if (adaGps) ifd0Baru.push({ tag: 0x8825, tipe: 4, jumlah: 1, nilai: null, ptr: 'gps' });
  if (adaInterop && lama.interopDiIfd0) ifd0Baru.push({ tag: 0xA005, tipe: 4, jumlah: 1, nilai: null, ptr: 'interop' });
  ifd0Baru.sort((a, b) => a.tag - b.tag);

  const ifds = [{ nama: 'ifd0', entri: ifd0Baru, berikut: adaIfd1 ? 'ifd1' : 0 }];
  if (adaExif) {
    if (adaInterop && !lama.interopDiIfd0) exifBaru.push({ tag: 0xA005, tipe: 4, jumlah: 1, nilai: null, ptr: 'interop' });
    exifBaru.sort((a, b) => a.tag - b.tag);
    ifds.push({ nama: 'exif', entri: exifBaru, berikut: 0 });
  }
  if (adaInterop) ifds.push({ nama: 'interop', entri: lama.interop, berikut: 0 });
  if (adaGps) ifds.push({ nama: 'gps', entri: lama.gps, berikut: 0 });
  if (adaIfd1) {
    const d1 = lama.ifd1.map((en) => (en.tag === 0x0201 && lama.thumb ? { ...en, nilai: null, ptr: 'thumb' } : en));
    ifds.push({ nama: 'ifd1', entri: d1, berikut: 0 });
  }

  const posisi = {};
  let cursor = 8;
  for (const d of ifds) { posisi[d.nama] = cursor; cursor += 2 + d.entri.length * 12 + 4; }
  const tulis16 = (arr, o, v) => { arr[o] = v & 255; arr[o + 1] = (v >> 8) & 255; };
  const tulis32 = (arr, o, v) => { arr[o] = v & 255; arr[o + 1] = (v >> 8) & 255; arr[o + 2] = (v >> 16) & 255; arr[o + 3] = (v >> 24) & 255; };
  const blob = [];
  const alokasi = new Map();
  for (const d of ifds) {
    for (const en of d.entri) {
      if (en.ptr === 'thumb') { alokasi.set(en, cursor); blob.push({ data: lama.thumb, offset: cursor }); cursor += lama.thumb.length; if (cursor % 2) cursor++; continue; }
      if (en.nilai === null) continue;
      const ukuran = (UKURAN_TIPE_GABUNG[en.tipe] || 1) * en.jumlah;
      if (ukuran <= 4) continue;
      alokasi.set(en, cursor);
      blob.push({ data: nilaiKeByteG(en), offset: cursor });
      cursor += ukuran; if (cursor % 2) cursor++;
    }
  }
  const keluar = new Uint8Array(cursor);
  keluar[0] = 0x49; keluar[1] = 0x49; tulis16(keluar, 2, 42); tulis32(keluar, 4, 8);
  for (const d of ifds) {
    const o = posisi[d.nama];
    tulis16(keluar, o, d.entri.length);
    d.entri.forEach((en, i) => {
      const eo = o + 2 + i * 12;
      tulis16(keluar, eo, en.tag);
      tulis16(keluar, eo + 2, en.tipe);
      tulis32(keluar, eo + 4, en.jumlah);
      if (en.ptr) {
        tulis32(keluar, eo + 8, en.ptr === 'thumb' ? alokasi.get(en) : posisi[en.ptr]);
      } else {
        const b = nilaiKeByteG(en);
        if (b.length <= 4) keluar.set(b, eo + 8);
        else tulis32(keluar, eo + 8, alokasi.get(en));
      }
    });
    tulis32(keluar, o + 2 + d.entri.length * 12, d.berikut ? posisi[d.berikut] : 0);
  }
  for (const b of blob) keluar.set(b.data, b.offset);
  return keluar;
}

// Tulis EXIF baru ke byte JPEG. Segmen EXIF lama diganti, segmen lain
// (termasuk data gambar) disalin apa adanya. Bila foto sudah punya EXIF,
// data lain di dalamnya (GPS, exposure, lensa, pratinjau) dipertahankan
// lewat bangunTiffGabung; hanya field yang diedit yang berubah.
// Kembalikan {ok:true, bytes} atau {ok:false, alasan}.
export function tulisExifJpeg(bytes, edit) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return { ok: false, alasan: 'File ini bukan JPEG.' };
  const segLamaAwal = cariSegmenExif(b);
  const tiffLama = segLamaAwal ? b.subarray(segLamaAwal.isiAwal, segLamaAwal.akhir) : null;
  const tiff = tiffLama ? bangunTiffGabung(tiffLama, edit) : bangunTiff(edit);
  const segLen = 2 + 6 + tiff.length;
  if (segLen > 65535) return { ok: false, alasan: 'Datanya terlalu panjang untuk disimpan di foto (maksimal sekitar 65 ribu karakter).' };
  const segBaru = new Uint8Array(2 + segLen);
  segBaru[0] = 0xFF; segBaru[1] = 0xE1;
  segBaru[2] = (segLen >> 8) & 255; segBaru[3] = segLen & 255;
  segBaru[4] = 0x45; segBaru[5] = 0x78; segBaru[6] = 0x69; segBaru[7] = 0x66; segBaru[8] = 0; segBaru[9] = 0;
  segBaru.set(tiff, 10);
  const segLama = segLamaAwal;
  const keluar = [0xFF, 0xD8];
  for (let i = 0; i < segBaru.length; i++) keluar.push(segBaru[i]);
  const n = b.length;
  let i = 2;
  while (i + 1 < n) {
    if (b[i] !== 0xFF) { for (; i < n; i++) keluar.push(b[i]); break; }
    let j = i + 1;
    while (j < n && b[j] === 0xFF) j++;
    if (j >= n) break;
    const marker = b[j];
    if (marker === 0xD9) { keluar.push(0xFF, 0xD9); break; }
    if (marker === 0xDA) { for (let k = i; k < n; k++) keluar.push(b[k]); break; }
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { keluar.push(0xFF, marker); i = j + 1; continue; }
    if (j + 2 >= n) break;
    const len = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + len;
    if (len < 2 || segEnd > n) break;
    const iniExifLama = segLama && i === segLama.awal;
    if (!iniExifLama) for (let k = i; k < segEnd; k++) keluar.push(b[k]);
    i = segEnd;
  }
  return { ok: true, bytes: new Uint8Array(keluar) };
}

const ARAH = [
  ['1', 'Normal (tidak diputar)'],
  ['2', 'Cermin kiri-kanan'],
  ['3', 'Putar 180 derajat'],
  ['4', 'Cermin atas-bawah'],
  ['5', 'Cermin lalu putar 90 derajat searah jarum jam'],
  ['6', 'Putar 90 derajat searah jarum jam'],
  ['7', 'Cermin lalu putar 90 derajat berlawanan jarum jam'],
  ['8', 'Putar 90 derajat berlawanan jarum jam']
];

/* ============ Akhir fungsi murni ============ */

export const meta = {"id": "exif-clean", "name": "Data & EXIF Foto", "cat": "gambar", "icon": "🧹", "desc": "Lihat data di dalam foto (kamera, tanggal, lokasi), ubah datanya, atau bersihkan sebelum dibagikan.", "keywords": "exif,metadata,bersih,privasi,gps,foto,kamera,lokasi,lihat data foto,edit exif,ubah exif,tanggal foto,keterangan foto,orientasi"};

export function render(root) {
      /* Penampil EXIF sebelum menghapus: baca metadata pakai ExifReader
         (CDN, pin versi) begitu foto dipilih, tampilkan isinya, baru hapus. */
      const EXIF_CDN = 'https://cdn.jsdelivr.net/npm/exifreader@4.23.5/dist/exif-reader.js';
      const ZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js';
      const MAKS_JUMLAH = 20;
      // Loader library kanonis: utils.loadLibOnce (core.js).
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
        ['gps', 'Hapus lokasi (GPS) saja, data lain tetap ada'],
        ['hakcipta', 'Hapus semua kecuali hak cipta'],
      ], 'semua');
      const box = T.out();
      const lihatBox = T.out();
      const daftarBox = T.out();
      const statusBox = T.out();
      // --- Tab Ubah data ---
      const deskripsiI = T.ta(3, 'Tulis keterangan foto di sini', '');
      deskripsiI.maxLength = 500;
      const tglI = T.input('datetime-local', '');
      const arahSel = T.select(ARAH, '1');
      const pembuatI = T.input('text', 'Contoh: Canon, Samsung, Xiaomi', '');
      const modelI = T.input('text', 'Contoh: EOS 2000D, Galaxy A54', '');
      const artisI = T.input('text', 'Nama fotografer', '');
      const softwareI = T.input('text', 'Contoh: Adobe Lightroom', '');
      const editStatusBox = T.out();
      const editInfoBox = T.out();
      let files = [];
      let pilihIdx = 0;
      let cacheTag = new Map(); // idx -> tags ExifReader (atau null bila gagal)
      let hasilBatch = [];
      let kurasiHtmlAktif = '';
      let bytesEdit = null;
      let namaEdit = 'foto';
      let exifLamaEdit = null;

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
          row.addEventListener('click', () => { pilihIdx = i; gambarDaftar(); lihatData(); muatEdit(); });
          list.appendChild(row);
        });
        daftarBox.appendChild(list);
        if (files.length > 1) daftarBox.appendChild(T.el('<p class="hint">Ketuk nama file untuk melihat datanya. Tombol Bersihkan memproses semua ' + files.length + ' foto sekaligus. Tab Ubah memakai foto yang dipilih di sini.</p>'));
      }

      // Ringkasan kurasi dari parser sendiri (tanpa internet): kamera,
      // tanggal, bukaan, ISO, lokasi + tautan peta.
      function kartuKurasi(f, ex) {
        const kosong = '<p class="hint">Foto ini tidak menyimpan data EXIF. Bisa karena sudah dibersihkan, hasil screenshot, atau diunduh dari aplikasi yang menghapus datanya.</p>';
        if (!ex) return kosong;
        const baris = [];
        let adaData = false;
        if (ex.kamera) { baris.push(['Kamera', ex.kamera]); adaData = true; }
        if (ex.tanggalJepret || ex.tanggal) { baris.push(['Tanggal jepret', ex.tanggalJepret || ex.tanggal]); adaData = true; }
        if (ex.dimensi) { baris.push(['Ukuran foto', ex.dimensi + ' piksel']); adaData = true; }
        if (ex.bukaan) { baris.push(['Bukaan lensa', ex.bukaan]); adaData = true; }
        if (ex.exposure) { baris.push(['Waktu pajanan', ex.exposure]); adaData = true; }
        if (ex.iso) { baris.push(['ISO', String(ex.iso)]); adaData = true; }
        if (ex.focal) { baris.push(['Panjang fokus', ex.focal]); adaData = true; }
        if (ex.software) { baris.push(['Aplikasi pengolah', ex.software]); adaData = true; }
        if (ex.artis) { baris.push(['Fotografer', ex.artis]); adaData = true; }
        if (ex.deskripsi) { baris.push(['Keterangan', ex.deskripsi]); adaData = true; }
        let gpsHtml = '';
        if (ex.gps) {
          adaData = true;
          const lat = ex.gps.lat.toFixed(6), lon = ex.gps.lon.toFixed(6);
          const urlPeta = 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon + '#map=15/' + lat + '/' + lon;
          gpsHtml = '<div class="kv"><span>Lokasi foto (GPS)</span><b>' + lat + ', ' + lon + '</b></div>' +
            '<p style="font-size:13px"><a href="' + urlPeta + '" target="_blank" rel="noopener">Lihat lokasi ini di peta</a></p>';
        }
        if (!adaData) return kosong;
        return '<h3 style="font-size:13px;margin:4px 0 6px;color:var(--txt)">Ringkasan data foto</h3>' +
          kvRows(baris) + gpsHtml +
          '<div class="note" style="border-color:#facc15">Foto ini menyimpan data di atas. Lokasi GPS dan tanggal jepret bisa dilihat siapa pun yang menerima fotonya. Hapus datanya dulu sebelum dibagikan ke orang yang tidak dikenal.</div>';
      }

      function gambarTabelTag(tags, cari) {
        const semua = daftarSemuaTag(tags);
        const q = (cari || '').toLowerCase();
        const tampil = q ? semua.filter((r) => r.nama.toLowerCase().includes(q) || r.nilai.toLowerCase().includes(q)) : semua;
        const lat = gpsDec(tags, 'GPSLatitude', 'GPSLatitudeRef');
        const lon = gpsDec(tags, 'GPSLongitude', 'GPSLongitudeRef');
        const punyaGps = lat != null && lon != null;
        let html = kurasiHtmlAktif;
        html += '<h3 style="font-size:13px;margin:12px 0 6px;color:var(--txt)">Semua data yang tersimpan di foto ini (' + semua.length + ' data)</h3>';
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
        let buf = null;
        try { buf = await f.arrayBuffer(); } catch (e) { buf = null; }
        kurasiHtmlAktif = '';
        if (buf) {
          try { kurasiHtmlAktif = kartuKurasi(f, parseExif(buf)); } catch (e) { kurasiHtmlAktif = ''; }
        }
        const ok = await utils.loadLibOnce(EXIF_CDN, () => !!window.ExifReader);
        if (!ok) {
          T.show(lihatBox, kurasiHtmlAktif + '<p class="hint">Daftar lengkap tidak bisa dibaca (pembaca gagal dimuat, cek koneksi). Foto tetap bisa dibersihkan seperti biasa.</p>');
          return;
        }
        let tags = {};
        try { tags = window.ExifReader.load(buf || await f.arrayBuffer()) || {}; }
        catch (e) { tags = {}; }
        cacheTag.set(pilihIdx, tags);
        gambarTabelTag(tags, '');
      }

      // --- Tab Ubah data: isi form dari foto terpilih ---
      function isiFormEdit(ex) {
        deskripsiI.value = ex.deskripsi || '';
        tglI.value = exifKeIso(ex.tanggalJepret || ex.tanggal || '');
        arahSel.value = String(ex.orientasi || 1);
        pembuatI.value = ex.pembuat || '';
        modelI.value = ex.model || '';
        artisI.value = ex.artis || '';
        softwareI.value = ex.software || '';
      }

      async function muatEdit() {
        const f = files[pilihIdx];
        if (!f) return;
        bytesEdit = null;
        T.hide(editInfoBox);
        T.show(editStatusBox, '<span class="dim">Membaca data foto…</span>');
        try {
          const buf = await f.arrayBuffer();
          bytesEdit = new Uint8Array(buf);
          namaEdit = (f.name || 'foto').replace(/\.[^.]*$/, '');
          exifLamaEdit = bacaExifEdit(bytesEdit);
          if (exifLamaEdit === null) {
            bytesEdit = null;
            T.show(editStatusBox, '<div class="err">File ini bukan JPEG. Tab ini hanya bisa mengubah data foto JPEG.</div>');
            simpanB.disabled = true;
            return;
          }
          isiFormEdit(exifLamaEdit);
          T.hide(editStatusBox);
          if (exifLamaEdit.adaExif) {
            T.show(editInfoBox, '<span class="dim">Data lama sudah terisi di bawah. Ubah yang perlu, lalu simpan.</span>');
          } else {
            T.show(editInfoBox, '<span class="dim">Foto ini belum punya data EXIF. Isi di bawah, datanya akan ditambahkan ke foto.</span>');
          }
          simpanB.disabled = false;
        } catch (e) {
          bytesEdit = null;
          T.show(editStatusBox, '<div class="err">File tidak bisa dibaca. Coba foto lain.</div>');
          simpanB.disabled = true;
        }
      }

      function simpanEdit() {
        if (!bytesEdit) { T.toast('Pilih foto JPEG dulu'); return; }
        const tanggalExif = isoKeExif(tglI.value);
        if (tglI.value && !tanggalExif) { T.toast('Tanggalnya tidak valid'); return; }
        const edit = {
          deskripsi: deskripsiI.value.trim(),
          pembuat: pembuatI.value.trim(),
          model: modelI.value.trim(),
          orientasi: parseInt(arahSel.value, 10),
          software: softwareI.value.trim(),
          tanggal: tanggalExif,
          tanggalJepret: tanggalExif,
          artis: artisI.value.trim()
        };
        const hasil = tulisExifJpeg(bytesEdit, edit);
        if (!hasil.ok) { T.toast(hasil.alasan); return; }
        const blob = new Blob([hasil.bytes], { type: 'image/jpeg' });
        T.dl(namaEdit + '-exif.jpg', blob, 'image/jpeg');
        T.show(editInfoBox, '<span class="ok">Data tersimpan.</span> <span class="dim">Ukuran file ' + fmtBytes(blob.size) + '. Piksel foto tidak berubah, data lain di foto (lokasi, pengaturan kamera) tetap ada.</span>');
        T.toast('Berhasil diunduh');
      }

      const simpanB = T.btn('Simpan & Unduh Foto', simpanEdit, true, true);

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
        const okExif = await utils.loadLibOnce(EXIF_CDN, () => !!window.ExifReader);
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
                    : adaTakTerperiksa ? ' · lokasi tidak bisa dipastikan (ada data terkompresi yang tidak bisa diperiksa, coba mode hapus semua)'
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
            if (!(await utils.loadLibOnce(ZIP_CDN, () => typeof window.JSZip === 'function'))) { T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi, atau unduh satu per satu.</span>'); return; }
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

      // "Unduh Hasil" sekunder + nonaktif sampai hasil benar-benar ada (P2-2).
      const dlB = T.btn('Unduh Hasil', () => {
        if (!hasilBatch.length) { T.toast('Bersihkan dulu gambarnya'); return; }
        const r = hasilBatch[0];
        T.dl(r.name, r.blob, r.blob.type);
        T.toast('Berhasil diunduh');
      }, false, true);

      // --- Halaman tab ---
      const lihatPage = T.el('<div></div>');
      lihatPage.appendChild(lihatBox);
      const bersihPage = T.el('<div hidden></div>');
      bersihPage.appendChild(T.el('<p class="note">ℹ️ Gambar digambar ulang lewat canvas, jadi metadata EXIF standar (lokasi GPS, info kamera, tanggal jepret) ikut terbuang. Jujur aja: ini tidak menghapus watermark atau tulisan yang sudah nempel di piksel gambar.</p>'));
      bersihPage.appendChild(T.field('Yang dihapus', hapusSel, '“Tanpa gambar ulang” menjaga kualitas piksel tetap utuh (hanya untuk JPG/PNG). “Lokasi saja” menjaga data lain seperti kamera & tanggal.'));
      bersihPage.appendChild(T.field('Format hasil', fmtSel, 'PNG menjaga latar transparan tetap transparan. Hanya berlaku bila mode “gambar digambar ulang” dipilih.'));
      bersihPage.appendChild(T.row(
        T.btn('Bersihkan EXIF', process, true),
        dlB
      ));
      bersihPage.appendChild(statusBox);
      bersihPage.appendChild(box);
      const ubahPage = T.el('<div hidden></div>');
      ubahPage.appendChild(T.field('Keterangan foto', deskripsiI, 'Maksimal 500 karakter. Huruf di luar huruf biasa dan angka disimpan sebagai tanda tanya.'));
      ubahPage.appendChild(T.grid2(T.field('Tanggal jepret', tglI), T.field('Arah foto', arahSel)));
      ubahPage.appendChild(T.grid2(T.field('Merk kamera', pembuatI), T.field('Model kamera', modelI)));
      ubahPage.appendChild(T.grid2(T.field('Fotografer', artisI), T.field('Aplikasi pengolah', softwareI)));
      ubahPage.appendChild(editStatusBox);
      ubahPage.appendChild(editInfoBox);
      ubahPage.appendChild(T.row(simpanB));
      ubahPage.appendChild(T.el('<p class="hint">Mengubah arah foto hanya mengubah penandanya di dalam file, bukan memutar gambarnya. Piksel foto tidak pernah diubah, jadi kualitasnya tetap sama. Data lain yang sudah ada di foto (lokasi, pengaturan kamera, lensa) ikut dipertahankan. Hanya JPEG yang bisa diubah datanya.</p>'));

      root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
      root.appendChild(T.field('Pilih gambar (bisa banyak sekaligus)', fileI, 'Maksimal ' + MAKS_JUMLAH + ' foto.'));
      root.appendChild(daftarBox);
      root.appendChild(tabs([['Lihat data', 0], ['Bersihkan data', 1], ['Ubah data', 2]], [lihatPage, bersihPage, ubahPage]));
      root.appendChild(lihatPage);
      root.appendChild(bersihPage);
      root.appendChild(ubahPage);
      fileI.addEventListener('change', () => {
        files = [...(fileI.files || [])].slice(0, MAKS_JUMLAH);
        pilihIdx = 0;
        cacheTag = new Map();
        hasilBatch = [];
        dlB.disabled = true; // file baru dipilih, hasil lama tidak berlaku (P2-2)
        T.hide(box);
        gambarDaftar();
        lihatData();
        muatEdit();
      });
}
