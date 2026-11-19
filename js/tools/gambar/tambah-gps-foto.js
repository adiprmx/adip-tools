import { h as T, LOCAL_NOTE, fileInput, fmtBytes, utils } from '../../core.js';

// Tambah Lokasi GPS ke Foto: sisipkan koordinat lintang/bujur ke dalam
// data EXIF foto (JPEG) atau chunk eXIf (PNG). Piksel tidak digambar ulang,
// jadi kualitas foto tidak berubah sama sekali. Data EXIF lain yang sudah
// ada (kamera, tanggal) dipertahankan; lokasi lama, bila ada, diganti.
export const meta = {"id": "tambah-gps-foto", "name": "Tambah Lokasi GPS ke Foto", "cat": "gambar", "icon": "📍", "desc": "Tempel titik lokasi GPS ke foto JPG atau PNG tanpa mengubah pikselnya.", "keywords": "gps,lokasi,koordinat,exif,lintang,bujur,peta,foto", "since": "6.19.0"};

// ---------- util TIFF (selalu ditulis little-endian) ----------
const UKURAN_TIPE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

function bacaU16(t, o, le) { return le ? t[o] | (t[o + 1] << 8) : (t[o] << 8) | t[o + 1]; }
function bacaU32(t, o, le) {
  return le
    ? (t[o] | (t[o + 1] << 8) | (t[o + 2] << 16) | (t[o + 3] << 24)) >>> 0
    : ((t[o] << 24) | (t[o + 1] << 16) | (t[o + 2] << 8) | t[o + 3]) >>> 0;
}

// Baca satu IFD: [{tag, tipe, jumlah, nilai}]. Nilai dinormalisasi:
// ASCII/BYTE/UNDEFINED -> Uint8Array mentah; SHORT/LONG/dll -> [angka];
// RATIONAL/SRATIONAL -> [[pembilang, penyebut], ...]. Pointer (Exif/GPS/
// Interop/thumbnail) dikembalikan apa adanya sebagai angka offset.
function bacaIfd(t, off, le) {
  if (off + 2 > t.length) return { entri: [], berikut: 0 };
  const n = bacaU16(t, off, le);
  const entri = [];
  for (let k = 0; k < n; k++) {
    const eo = off + 2 + k * 12;
    if (eo + 12 > t.length) break;
    const tag = bacaU16(t, eo, le);
    const tipe = bacaU16(t, eo + 2, le);
    const jumlah = bacaU32(t, eo + 4, le);
    const ukuran = UKURAN_TIPE[tipe] || 0;
    if (!ukuran || jumlah > 1000000) continue;
    const total = jumlah * ukuran;
    let awal;
    if (total <= 4) awal = eo + 8;
    else { awal = bacaU32(t, eo + 8, le); if (awal + total > t.length) continue; }
    let nilai;
    if (tipe === 2 || tipe === 1 || tipe === 7 || tipe === 6) {
      nilai = t.slice(awal, awal + total);
    } else if (tipe === 3 || tipe === 8) {
      nilai = []; for (let i = 0; i < jumlah; i++) nilai.push(bacaU16(t, awal + i * 2, le));
    } else if (tipe === 4 || tipe === 9) {
      nilai = []; for (let i = 0; i < jumlah; i++) nilai.push(bacaU32(t, awal + i * 4, le));
    } else if (tipe === 5 || tipe === 10) {
      nilai = [];
      for (let i = 0; i < jumlah; i++) {
        const a = bacaU32(t, awal + i * 8, le);
        const b = bacaU32(t, awal + i * 8 + 4, le);
        nilai.push([a, b]);
      }
    } else if (tipe === 11 || tipe === 12) {
      nilai = t.slice(awal, awal + total); // float/double: salin mentah
    } else nilai = t.slice(awal, awal + total);
    entri.push({ tag, tipe, jumlah, nilai });
  }
  const berikut = off + 2 + n * 12 + 4 <= t.length ? bacaU32(t, off + 2 + n * 12, le) : 0;
  return { entri, berikut };
}

function cariEntri(entri, tag) { return entri.find((e) => e.tag === tag) || null; }
function nilaiPointer(e) { return e && Array.isArray(e.nilai) ? e.nilai[0] : 0; }

// Ubah derajat desimal jadi [derajat, menit, detik] rasional.
// Dihitung dari total milidetik busur supaya tidak ada galat pecahan
// (106,8 langsung dikali 60 memberi 47,9999... bukan 48).
export function derajatKeRasional(desimal) {
  const totalMs = Math.round(Math.abs(desimal) * 3600000);
  const d = Math.floor(totalMs / 3600000);
  const sisa1 = totalMs - d * 3600000;
  const m = Math.floor(sisa1 / 60000);
  const detikMs = sisa1 - m * 60000;
  return [[d, 1], [m, 1], [detikMs, 1000]];
}

function rasionalKeDesimal(rasional, refNegatif) {
  if (!rasional || rasional.length < 3) return null;
  const bagi = (p) => (p[1] === 0 ? 0 : p[0] / p[1]);
  const v = bagi(rasional[0]) + bagi(rasional[1]) / 60 + bagi(rasional[2]) / 3600;
  return refNegatif ? -v : v;
}

// Baca GPS dari byte TIFF mentah. Fungsi murni.
export function bacaGpsDariTiff(t) {
  if (!t || t.length < 8) return null;
  const le = t[0] === 0x49 && t[1] === 0x49;
  if (!le && !(t[0] === 0x4D && t[1] === 0x4D)) return null;
  if (bacaU16(t, 2, le) !== 42) return null;
  const ifd0 = bacaIfd(t, bacaU32(t, 4, le), le);
  const gpsPtr = cariEntri(ifd0.entri, 0x8825);
  if (!gpsPtr) return null;
  const gps = bacaIfd(t, nilaiPointer(gpsPtr), le);
  const lat = cariEntri(gps.entri, 0x0002);
  const latRef = cariEntri(gps.entri, 0x0001);
  const lon = cariEntri(gps.entri, 0x0004);
  const lonRef = cariEntri(gps.entri, 0x0003);
  if (!lat || !lon) return null;
  const refLat = latRef && latRef.nilai[0] === 0x53; // 'S'
  const refLon = lonRef && lonRef.nilai[0] === 0x57; // 'W'
  const la = rasionalKeDesimal(lat.nilai, refLat);
  const lo = rasionalKeDesimal(lon.nilai, refLon);
  if (la === null || lo === null) return null;
  return { lat: la, lon: lo };
}

// Bangun byte TIFF baru (little-endian) berisi GPS, dengan mempertahankan
// entri IFD0/Exif/Interop/IFD1 dari TIFF lama bila ada. Thumbnail (IFD1)
// ikut disalin. Fungsi murni.
export function bangunTiffGps(tiffLama, lat, lon) {
  let lama = null;
  if (tiffLama && tiffLama.length >= 8) {
    const le = tiffLama[0] === 0x49 && tiffLama[1] === 0x49;
    const be = tiffLama[0] === 0x4D && tiffLama[1] === 0x4D;
    if ((le || be) && bacaU16(tiffLama, 2, le) === 42) {
      const ifd0 = bacaIfd(tiffLama, bacaU32(tiffLama, 4, le), le);
      const exifPtr = cariEntri(ifd0.entri, 0x8769);
      const interopPtr = cariEntri(ifd0.entri, 0xA005);
      lama = {
        le, ifd0: ifd0.entri,
        exif: exifPtr ? bacaIfd(tiffLama, nilaiPointer(exifPtr), le).entri : null,
        interop: null, ifd1: null, thumb: null,
      };
      if (lama.exif) {
        const ip = cariEntri(lama.exif, 0xA005);
        if (ip) lama.interop = bacaIfd(tiffLama, nilaiPointer(ip), le).entri;
      } else if (interopPtr) {
        lama.interop = bacaIfd(tiffLama, nilaiPointer(interopPtr), le).entri;
      }
      if (ifd0.berikut) {
        const d1 = bacaIfd(tiffLama, ifd0.berikut, le);
        lama.ifd1 = d1.entri;
        const fmt = cariEntri(d1.entri, 0x0201);
        const len = cariEntri(d1.entri, 0x0202);
        if (fmt && len) {
          const o = nilaiPointer(fmt); const n = nilaiPointer(len);
          if (o + n <= tiffLama.length) lama.thumb = tiffLama.slice(o, o + n);
        }
      }
    }
  }

  // Susun daftar IFD yang akan ditulis.
  const gpsEntri = [
    { tag: 0x0000, tipe: 1, jumlah: 4, nilai: new Uint8Array([2, 3, 0, 0]) },
    { tag: 0x0001, tipe: 2, jumlah: 2, nilai: new Uint8Array([lat < 0 ? 0x53 : 0x4E, 0]) },
    { tag: 0x0002, tipe: 5, jumlah: 3, nilai: derajatKeRasional(lat) },
    { tag: 0x0003, tipe: 2, jumlah: 2, nilai: new Uint8Array([lon < 0 ? 0x57 : 0x45, 0]) },
    { tag: 0x0004, tipe: 5, jumlah: 3, nilai: derajatKeRasional(lon) },
  ];
  const adaExif = lama && lama.exif && lama.exif.length;
  const adaInterop = lama && lama.interop && lama.interop.length;
  const adaIfd1 = lama && lama.ifd1 && lama.ifd1.length;
  // Buang pointer lama yang targetnya tidak ikut disalin, supaya tidak
  // ada offset basi yang menunjuk ke tempat yang salah di TIFF baru.
  const ifd0Baru = lama ? lama.ifd0.filter((e) => {
    if (e.tag === 0x8825) return false;
    if (e.tag === 0x8769 && !adaExif) return false;
    if (e.tag === 0xA005 && !adaInterop) return false;
    return true;
  }) : [];
  // Pointer ditulis belakangan (offset belum tahu); tandai dengan nilai null.
  ifd0Baru.push({ tag: 0x8825, tipe: 4, jumlah: 1, nilai: null, ptr: 'gps' });
  ifd0Baru.sort((a, b) => a.tag - b.tag);

  const ifds = [{ nama: 'ifd0', entri: ifd0Baru, berikut: adaIfd1 ? 'ifd1' : 0 }];
  if (adaExif) {
    const ex = lama.exif.filter((e) => e.tag !== 0xA005);
    if (adaInterop) ex.push({ tag: 0xA005, tipe: 4, jumlah: 1, nilai: null, ptr: 'interop' });
    ex.sort((a, b) => a.tag - b.tag);
    ifds.push({ nama: 'exif', entri: ex, berikut: 0 });
  }
  if (adaInterop) ifds.push({ nama: 'interop', entri: lama.interop, berikut: 0 });
  ifds.push({ nama: 'gps', entri: gpsEntri, berikut: 0 });
  if (adaIfd1) {
    const d1 = lama.ifd1.map((e) => (e.tag === 0x0201 && lama.thumb ? { ...e, nilai: null, ptr: 'thumb' } : e));
    ifds.push({ nama: 'ifd1', entri: d1, berikut: 0 });
  }

  // Tata letak: header 8 byte, lalu IFD berurutan, lalu area data.
  const posisi = {};
  let cursor = 8;
  for (const d of ifds) { posisi[d.nama] = cursor; cursor += 2 + d.entri.length * 12 + 4; }
  const tulis16 = (arr, o, v) => { arr[o] = v & 255; arr[o + 1] = (v >> 8) & 255; };
  const tulis32 = (arr, o, v) => { arr[o] = v & 255; arr[o + 1] = (v >> 8) & 255; arr[o + 2] = (v >> 16) & 255; arr[o + 3] = (v >> 24) & 255; };

  // Kumpulkan blob data (nilai > 4 byte + thumbnail), beri offset.
  const blob = []; // {data: Uint8Array, offset}
  const alokasi = new Map(); // entri -> offset data
  for (const d of ifds) {
    for (const e of d.entri) {
      if (e.ptr === 'thumb') { alokasi.set(e, cursor); blob.push({ data: lama.thumb, offset: cursor }); cursor += lama.thumb.length; if (cursor % 2) cursor++; continue; }
      if (e.nilai === null) continue; // pointer IFD, inline
      const ukuran = (UKURAN_TIPE[e.tipe] || 1) * e.jumlah;
      if (ukuran <= 4) continue;
      alokasi.set(e, cursor);
      blob.push({ data: nilaiKeByte(e), offset: cursor });
      cursor += ukuran; if (cursor % 2) cursor++;
    }
  }
  const total = cursor;
  const keluar = new Uint8Array(total);
  keluar[0] = 0x49; keluar[1] = 0x49; tulis16(keluar, 2, 42); tulis32(keluar, 4, 8);

  // Tulis tiap IFD.
  for (const d of ifds) {
    const o = posisi[d.nama];
    tulis16(keluar, o, d.entri.length);
    d.entri.forEach((e, i) => {
      const eo = o + 2 + i * 12;
      tulis16(keluar, eo, e.tag);
      tulis16(keluar, eo + 2, e.tipe);
      tulis32(keluar, eo + 4, e.jumlah);
      if (e.ptr) {
        tulis32(keluar, eo + 8, e.ptr === 'thumb' ? alokasi.get(e) : posisi[e.ptr]);
      } else if (e.tag === 0x8769 && adaExif) {
        tulis32(keluar, eo + 8, posisi.exif);
      } else if (e.tag === 0xA005 && adaInterop && d.nama === 'ifd0') {
        tulis32(keluar, eo + 8, posisi.interop);
      } else {
        const b = nilaiKeByte(e);
        if (b.length <= 4) keluar.set(b, eo + 8);
        else tulis32(keluar, eo + 8, alokasi.get(e));
      }
    });
    tulis32(keluar, o + 2 + d.entri.length * 12, d.berikut ? posisi[d.berikut] : 0);
  }
  for (const b of blob) keluar.set(b.data, b.offset);
  return keluar;
}

function nilaiKeByte(e) {
  const n = e.jumlah;
  if (e.nilai instanceof Uint8Array) return e.nilai;
  const ukuran = UKURAN_TIPE[e.tipe] || 1;
  const out = new Uint8Array(n * ukuran);
  const dv = new DataView(out.buffer);
  if (e.tipe === 3 || e.tipe === 8) e.nilai.forEach((v, i) => dv.setUint16(i * 2, v, true));
  else if (e.tipe === 4 || e.tipe === 9) e.nilai.forEach((v, i) => dv.setUint32(i * 4, v >>> 0, true));
  else if (e.tipe === 5 || e.tipe === 10) e.nilai.forEach((p, i) => { dv.setUint32(i * 8, p[0] >>> 0, true); dv.setUint32(i * 8 + 4, p[1] >>> 0, true); });
  return out;
}

// ---------- JPEG ----------
function cariSegmen(b, markerCari, awalan) {
  let i = 2;
  while (i + 1 < b.length) {
    if (b[i] !== 0xFF) return null;
    let j = i + 1;
    while (j < b.length && b[j] === 0xFF) j++;
    if (j >= b.length) return null;
    const marker = b[j];
    if (marker === 0xD9 || marker === 0xDA) return null;
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i = j + 1; continue; }
    if (j + 2 >= b.length) return null;
    const len = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + len;
    if (len < 2 || segEnd > b.length) return null;
    if (marker === markerCari) {
      if (!awalan) return { awal: i, akhir: segEnd };
      let cocok = true;
      for (let k = 0; k < awalan.length; k++) if (b[j + 3 + k] !== awalan[k]) { cocok = false; break; }
      if (cocok) return { awal: i, akhir: segEnd, isiAwal: j + 3 + awalan.length };
    }
    i = segEnd;
  }
  return null;
}

const EXIF_AWALAN = [0x45, 0x78, 0x69, 0x66, 0, 0]; // "Exif\0\0"

export function tambahGpsKeJpeg(bytes, lat, lon) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) throw new Error('Bukan file JPEG.');
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('Lintang harus -90 sampai 90.');
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error('Bujur harus -180 sampai 180.');
  const seg = cariSegmen(b, 0xE1, EXIF_AWALAN);
  const tiffLama = seg ? b.subarray(seg.isiAwal, seg.akhir) : null;
  const tiff = bangunTiffGps(tiffLama, lat, lon);
  const segBaru = new Uint8Array(2 + 2 + 6 + tiff.length);
  segBaru[0] = 0xFF; segBaru[1] = 0xE1;
  const len = 6 + tiff.length + 2;
  segBaru[2] = (len >> 8) & 255; segBaru[3] = len & 255;
  segBaru.set(EXIF_AWALAN, 4);
  segBaru.set(tiff, 10);
  let keluar;
  if (seg) {
    keluar = new Uint8Array(b.length - (seg.akhir - seg.awal) + segBaru.length);
    keluar.set(b.subarray(0, seg.awal), 0);
    keluar.set(segBaru, seg.awal);
    keluar.set(b.subarray(seg.akhir), seg.awal + segBaru.length);
  } else {
    keluar = new Uint8Array(2 + segBaru.length + (b.length - 2));
    keluar.set(b.subarray(0, 2), 0);
    keluar.set(segBaru, 2);
    keluar.set(b.subarray(2), 2 + segBaru.length);
  }
  return keluar;
}

export function bacaGpsDariJpeg(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  const seg = cariSegmen(b, 0xE1, EXIF_AWALAN);
  if (!seg) return null;
  return bacaGpsDariTiff(b.subarray(seg.isiAwal, seg.akhir));
}

// ---------- PNG (chunk eXIf) ----------
// CRC32 PNG memakai crc32() core (polinomial 0xEDB88320, sama persis);
// chunk PNG memakai utils.buatChunkPng (kanonis, G4 C1G4-R).
export { crc32 } from '../../core.js';


function cariChunkPng(b, tipeCari) {
  let i = 8;
  while (i + 8 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const tipe = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    if (tipe === tipeCari) return { awal: i, akhir: i + 12 + len, dataAwal: i + 8, dataAkhir: i + 8 + len };
    if (i + 12 + len > b.length) return null;
    i += 12 + len;
  }
  return null;
}

export function tambahGpsKePng(bytes, lat, lon) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 8 || b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4E || b[3] !== 0x47) throw new Error('Bukan file PNG.');
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('Lintang harus -90 sampai 90.');
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error('Bujur harus -180 sampai 180.');
  const lama = cariChunkPng(b, 'eXIf');
  const tiffLama = lama && lama.dataAwal !== undefined ? b.subarray(lama.dataAwal, lama.dataAkhir) : null;
  const tiff = bangunTiffGps(tiffLama, lat, lon);
  const chunk = utils.buatChunkPng('eXIf', tiff);
  if (lama && lama.awal !== undefined) {
    const keluar = new Uint8Array(b.length - (lama.akhir - lama.awal) + chunk.length);
    keluar.set(b.subarray(0, lama.awal), 0);
    keluar.set(chunk, lama.awal);
    keluar.set(b.subarray(lama.akhir), lama.awal + chunk.length);
    return keluar;
  }
  const idat = cariChunkPng(b, 'IDAT');
  const pos = idat ? idat.awal : b.length;
  const keluar = new Uint8Array(b.length + chunk.length);
  keluar.set(b.subarray(0, pos), 0);
  keluar.set(chunk, pos);
  keluar.set(b.subarray(pos), pos + chunk.length);
  return keluar;
}

export function bacaGpsDariPng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 8 || b[0] !== 0x89) return null;
  const c = cariChunkPng(b, 'eXIf');
  if (!c || c.dataAwal === undefined) return null;
  return bacaGpsDariTiff(b.subarray(c.dataAwal, c.dataAkhir));
}

export function render(root) {
  const fi = fileInput('image/jpeg,image/png,.jpg,.jpeg,.png');
  const latIn = T.input('text', '-6,2', '');
  latIn.inputMode = 'decimal';
  const lonIn = T.input('text', '106,8', '');
  lonIn.inputMode = 'decimal';
  const infoBox = T.out();
  const hasilBox = T.out();
  const statusBox = T.out();
  let fileObj = null, nama = 'foto', jenis = '';

  const lokasiB = T.btn('Pakai lokasi saya sekarang', () => {
    if (!navigator.geolocation) { T.toast('Perangkat ini tidak bisa membaca lokasi.'); return; }
    T.show(statusBox, '<span class="dim">Membaca lokasi…</span>');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        latIn.value = String(p.coords.latitude).replace('.', ',');
        lonIn.value = String(p.coords.longitude).replace('.', ',');
        T.hide(statusBox);
        T.toast('Lokasi terisi dari GPS perangkat.');
      },
      () => { T.show(statusBox, '<div class="err">Lokasi tidak bisa dibaca. Periksa izin lokasi di HP lalu coba lagi.</div>'); },
      { timeout: 15000 },
    );
  });

  const prosesB = T.btn('Simpan lokasi ke foto', async () => {
    if (!fileObj) { T.toast('Pilih dulu fotonya.'); return; }
    const lat = utils.parseNum(latIn.value, NaN);
    const lon = utils.parseNum(lonIn.value, NaN);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      T.show(hasilBox, '<div class="err">Isi lintang dan bujur dulu. Contoh: lintang -6,2 dan bujur 106,8 untuk Jakarta.</div>');
      return;
    }
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Menulis lokasi…</span>');
    try {
      const buf = new Uint8Array(await fileObj.arrayBuffer());
      const hasil = jenis === 'png' ? tambahGpsKePng(buf, lat, lon) : tambahGpsKeJpeg(buf, lat, lon);
      const cek = jenis === 'png' ? bacaGpsDariPng(hasil) : bacaGpsDariJpeg(hasil);
      T.hide(statusBox);
      const ok = cek && Math.abs(cek.lat - lat) < 0.0001 && Math.abs(cek.lon - lon) < 0.0001;
      T.show(hasilBox, '');
      const info = T.el(`<p style="margin:0 0 8px">${ok ? 'Lokasi tersimpan di foto. Peta di HP akan membaca titik ini.' : 'Lokasi ditulis, tapi pengecekan ulang gagal. Unduh dan cek manual di galeri.'}</p>`);
      const dlB = T.btn(`Unduh foto (${fmtBytes(hasil.length)})`, () => {
        T.dl(nama + '-gps.' + jenis, hasil, jenis === 'png' ? 'image/png' : 'image/jpeg');
      }, true);
      hasilBox.appendChild(info); hasilBox.appendChild(dlB);
    } catch (e) {
      T.hide(statusBox);
      T.show(hasilBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'Gagal menulis lokasi.') + '</div>');
    }
    prosesB.disabled = false;
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox); T.hide(infoBox);
    const namaF = (f.name || '').toLowerCase();
    jenis = namaF.endsWith('.png') || f.type === 'image/png' ? 'png' : 'jpg';
    nama = (f.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'foto';
    fileObj = f;
    T.show(statusBox, '<span class="dim">Membaca foto…</span>');
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const lama = jenis === 'png' ? bacaGpsDariPng(buf) : bacaGpsDariJpeg(buf);
      T.hide(statusBox);
      if (lama) {
        const fmt = (v) => v.toFixed(5).replace('.', ',');
        T.show(infoBox, `<p class="dim" style="font-size:13px">Foto ini sudah punya lokasi: ${fmt(lama.lat)}, ${fmt(lama.lon)}. Lokasi baru akan menggantikannya.</p>`);
        latIn.value = String(lama.lat).replace('.', ',');
        lonIn.value = String(lama.lon).replace('.', ',');
      } else {
        T.show(infoBox, '<p class="dim" style="font-size:13px">Foto ini belum punya lokasi. Isi koordinatnya di bawah.</p>');
      }
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibaca.</div>');
    }
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel titik lokasi ke foto JPG atau PNG. Fotonya sendiri tidak diubah, hanya data lokasinya yang ditulis. Berguna untuk foto lama yang lokasinya hilang, atau foto hasil tangkapan layar.</p>'));
  root.appendChild(T.field('Pilih foto (JPG atau PNG)', fi));
  root.appendChild(infoBox);
  root.appendChild(T.field('Lintang (latitude)', latIn, 'Angka -90 sampai 90. Negatif = selatan. Jakarta sekitar -6,2.'));
  root.appendChild(T.field('Bujur (longitude)', lonIn, 'Angka -180 sampai 180. Negatif = barat. Jakarta sekitar 106,8.'));
  root.appendChild(lokasiB);
  root.appendChild(statusBox);
  root.appendChild(prosesB);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + ' Foto dengan lokasi bisa membocorkan tempat tinggalmu bila dibagikan sembarangan.</p>'));
}
