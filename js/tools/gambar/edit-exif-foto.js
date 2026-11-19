import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Edit EXIF Foto: ubah data yang tersimpan di dalam foto JPEG (keterangan,
// tanggal jepret, arah foto, kamera, fotografer, aplikasi). Piksel foto
// tidak disentuh sama sekali, hanya segmen datanya yang ditulis ulang.
// Parser dan penulis TIFF ditulis sendiri, tanpa pustaka luar, mengikuti
// pola byte-level yang sudah ada di exif-clean dan lihat-data-foto.
// Batasan jujur: hanya JPEG; huruf di luar A-Z/angka/tanda baca dasar
// disimpan sebagai tanda tanya karena format EXIF ASCII hanya 7-bit;
// mengubah arah foto hanya mengubah penandanya, bukan memutar pikselnya.
export const meta = {"id": "edit-exif-foto", "name": "Edit EXIF Foto", "cat": "gambar", "icon": "🏷️", "desc": "Ubah data di dalam foto: keterangan, tanggal, arah, kamera. Pikselnya tidak berubah.", "keywords": "exif,edit metadata,tanggal foto,keterangan foto,orientasi,foto", "since": "6.19.0"};

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

// Cari segmen APP1 berisi "Exif\0\0". Kembalikan {awal, akhir, isiAwal}
// atau null. isiAwal = posisi awal byte TIFF.
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
        return { awal: i, akhir: segEnd, isiAwal: isiAwal + 6 };
      }
    }
    i = segEnd;
  }
  return null;
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
      if (en.teks != null) tulis32(eo + 8, en.offData);
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

// Tulis EXIF baru ke byte JPEG. Segmen EXIF lama diganti, segmen lain
// (termasuk data gambar) disalin apa adanya.
// Kembalikan {ok:true, bytes} atau {ok:false, alasan}.
export function tulisExifJpeg(bytes, edit) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return { ok: false, alasan: 'File ini bukan JPEG.' };
  const tiff = bangunTiff(edit);
  const segLen = 2 + 6 + tiff.length;
  if (segLen > 65535) return { ok: false, alasan: 'Datanya terlalu panjang untuk disimpan di foto (maksimal sekitar 65 ribu karakter).' };
  const segBaru = new Uint8Array(2 + segLen);
  segBaru[0] = 0xFF; segBaru[1] = 0xE1;
  segBaru[2] = (segLen >> 8) & 255; segBaru[3] = segLen & 255;
  segBaru[4] = 0x45; segBaru[5] = 0x78; segBaru[6] = 0x69; segBaru[7] = 0x66; segBaru[8] = 0; segBaru[9] = 0;
  segBaru.set(tiff, 10);
  const segLama = cariSegmenExif(b);
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

export function render(root) {
  const fi = fileInput('image/jpeg');
  const deskripsiI = T.ta('Tulis keterangan foto di sini', '');
  deskripsiI.maxLength = 500;
  const tglI = T.input('datetime-local', '');
  const arahSel = T.select(ARAH, '1');
  const pembuatI = T.input('text', 'Contoh: Canon, Samsung, Xiaomi', '');
  const modelI = T.input('text', 'Contoh: EOS 2000D, Galaxy A54', '');
  const artisI = T.input('text', 'Nama fotografer', '');
  const softwareI = T.input('text', 'Contoh: Adobe Lightroom', '');
  const statusBox = T.out();
  const box = T.out();
  const infoBox = T.out();

  let bytesAsli = null;
  let namaFile = 'foto';
  let exifLama = null;

  function isiForm(ex) {
    deskripsiI.value = ex.deskripsi || '';
    tglI.value = exifKeIso(ex.tanggalJepret || ex.tanggal || '');
    arahSel.value = String(ex.orientasi || 1);
    pembuatI.value = ex.pembuat || '';
    modelI.value = ex.model || '';
    artisI.value = ex.artis || '';
    softwareI.value = ex.software || '';
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membaca data foto…</span>');
    try {
      const buf = await f.arrayBuffer();
      bytesAsli = new Uint8Array(buf);
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      exifLama = bacaExifEdit(bytesAsli);
      if (exifLama === null) {
        bytesAsli = null;
        T.show(statusBox, '<div class="err">File ini bukan JPEG. Tool ini hanya bisa mengubah data foto JPEG.</div>');
        simpanB.disabled = true;
        return;
      }
      isiForm(exifLama);
      T.hide(statusBox);
      if (exifLama.adaExif) {
        T.show(infoBox, '<span class="dim">Data lama sudah terisi di bawah. Ubah yang perlu, lalu simpan.</span>');
      } else {
        T.show(infoBox, '<span class="dim">Foto ini belum punya data EXIF. Isi di bawah, datanya akan ditambahkan ke foto.</span>');
      }
      T.show(box, '');
      simpanB.disabled = false;
    } catch (e) {
      bytesAsli = null;
      T.show(statusBox, '<div class="err">File tidak bisa dibaca. Coba foto lain.</div>');
      simpanB.disabled = true;
    }
  });

  function simpan() {
    if (!bytesAsli) { T.toast('Pilih foto JPEG dulu'); return; }
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
    const hasil = tulisExifJpeg(bytesAsli, edit);
    if (!hasil.ok) { T.toast(hasil.alasan); return; }
    const blob = new Blob([hasil.bytes], { type: 'image/jpeg' });
    T.dl(namaFile + '-exif.jpg', blob, 'image/jpeg');
    T.show(infoBox, '<span class="ok">Data tersimpan.</span> <span class="dim">Ukuran file ' + fmtBytes(blob.size) + '. Piksel foto tidak berubah.</span>');
    T.toast('Berhasil diunduh');
  }

  const simpanB = T.btn('Simpan & Unduh Foto', simpan, true, true);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto JPEG', fi, 'Hanya JPEG yang bisa diubah datanya. PNG dan WebP tidak memakai format EXIF yang sama.'));
  root.appendChild(T.field('Keterangan foto', deskripsiI, 'Maksimal 500 karakter. Huruf di luar huruf biasa dan angka disimpan sebagai tanda tanya.'));
  root.appendChild(T.grid2(T.field('Tanggal jepret', tglI), T.field('Arah foto', arahSel)));
  root.appendChild(T.grid2(T.field('Merk kamera', pembuatI), T.field('Model kamera', modelI)));
  root.appendChild(T.grid2(T.field('Fotografer', artisI), T.field('Aplikasi pengolah', softwareI)));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(T.row(simpanB));
  root.appendChild(T.el('<p class="hint">Mengubah arah foto hanya mengubah penandanya di dalam file, bukan memutar gambarnya. Piksel foto tidak pernah diubah, jadi kualitasnya tetap sama.</p>'));
}
