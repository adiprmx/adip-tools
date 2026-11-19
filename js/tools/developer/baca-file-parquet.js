import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Baca file data Parquet langsung di browser: baca metadata footer
// (Thrift compact protocol, ditulis sendiri — tanpa pustaka), tampilkan
// skema + info kolom, dan baca isi baris untuk kolom yang didukung.
// Yang didukung: encoding PLAIN dan kamus (PLAIN_DICTIONARY /
// RLE_DICTIONARY), kompresi tanpa kompresi, Snappy, dan Gzip, halaman
// data v1 dan v2, kolom wajib dan opsional (bukan kolom berulang/list).
// Kolom di luar itu tetap tampil di skema, dengan alasan kenapa isinya
// tidak dibaca — tidak pernah pura-pura terbaca.

export const meta = { id: 'baca-file-parquet', name: 'Baca File Parquet', cat: 'developer', icon: '📦', desc: 'Buka file data .parquet: lihat skema, info kolom, dan isi barisnya tanpa memasang apa pun.', keywords: 'parquet,data,tabel,kolom,skema,baca file,arrow', since: '6.19.0' };

export const NAMA_TIPE = { 0: 'BOOLEAN', 1: 'INT32', 2: 'INT64', 3: 'INT96', 4: 'FLOAT', 5: 'DOUBLE', 6: 'BYTE_ARRAY', 7: 'FIXED_LEN_BYTE_ARRAY' };
export const NAMA_KODEC = { 0: 'tanpa kompresi', 1: 'Snappy', 2: 'Gzip', 3: 'LZO', 4: 'Brotli', 5: 'LZ4', 6: 'Zstd', 7: 'LZ4 mentah' };
export const NAMA_ENCODING = { 0: 'PLAIN', 2: 'PLAIN_DICTIONARY', 3: 'RLE', 4: 'BIT_PACKED', 5: 'DELTA_BINARY_PACKED', 6: 'DELTA_LENGTH_BYTE_ARRAY', 7: 'DELTA_BYTE_ARRAY', 8: 'RLE_DICTIONARY', 9: 'BYTE_STREAM_SPLIT' };
const NAMA_REPETISI = { 0: 'wajib', 1: 'opsional', 2: 'berulang' };

// ---------- Pembaca Thrift compact protocol (tanpa pustaka) ----------
// Batas keamanan (G4 Blue R1, RED-06/07/15; Blue R2, RED2-01): semua
// ukuran di footer Parquet adalah KLAIM penyerang — tidak ada
// alokasi/loop yang boleh percaya klaim itu mentah-mentah. MAKS_ELEMEN
// 1 juta jauh di atas footer nyata (skema/kolom ribuan entri);
// MAKS_DALAM 100 jauh di atas sarang struct nyata; MAKS_DEKOMPRES
// 64 MB jauh di atas halaman nyata (halaman Parquet umumnya <= 1 MB).
// MAKS_TOTAL_ELEMEN 500 ribu adalah anggaran KUMULATIF per parse: cap
// per-daftar saja bisa diakali lewat banyak field saudara (footer 263
// byte -> 50 juta elemen), jadi total elemen yang dialokasikan selama
// satu parse juga dibatasi. 500 ribu masih ~100x di atas footer nyata
// (skema/kolom ribuan entri) — dan karena batas total DI BAWAH batas
// per-daftar (1 juta), daftar tunggal yang mengklaim >500 ribu elemen
// ditolak SEBELUM alokasi apa pun, bukan sesudah 2 juta elemen
// teralokasi. File sah yang ekstrem ditolak dengan pesan jujur, bukan
// dibaca — trade-off keamanan vs cakupan yang disengaja.
const MAKS_ELEMEN_THRIFT = 1000000;
const MAKS_TOTAL_ELEMEN_THRIFT = 500000;
const MAKS_DALAM_THRIFT = 100;
const MAKS_NILAI_PARQUET = 1000000;
const MAKS_DEKOMPRES = 64 * 1024 * 1024;
class Compact {
  constructor(b, pos) { this.b = b; this.p = pos || 0; this.dalam = 0; this.totalElemen = 0; }
  byte() { if (this.p >= this.b.length) throw new Error('Data Thrift terpotong.'); return this.b[this.p++]; }
  varint() {
    let r = 0n, s = 0n;
    for (let i = 0; i < 10; i++) {
      const x = this.byte();
      r |= BigInt(x & 0x7f) << s;
      if (!(x & 0x80)) return r;
      s += 7n;
    }
    throw new Error('Varint terlalu panjang.');
  }
  zigzag() { const n = this.varint(); return (n >> 1n) ^ -(n & 1n); }
  i32() { return Number(this.zigzag()); }
  i64() { return this.zigzag(); }
  dbl() {
    if (this.p + 8 > this.b.length) throw new Error('Data Thrift terpotong.');
    const v = new DataView(this.b.buffer, this.b.byteOffset + this.p, 8).getFloat64(0, true);
    this.p += 8;
    return v;
  }
  bin() {
    const n = Number(this.varint());
    if (n < 0 || this.p + n > this.b.length) throw new Error('Data Thrift terpotong.');
    const s = this.b.slice(this.p, this.p + n);
    this.p += n;
    return s;
  }
  str() { return new TextDecoder().decode(this.bin()); }
  nilai(tipe) {
    switch (tipe) {
      case 1: return true;
      case 2: return false;
      case 3: { const v = this.byte(); return v > 127 ? v - 256 : v; }
      case 4: return this.i32();
      case 5: return this.i32();
      case 6: return this.i64();
      case 7: return this.dbl();
      case 8: return this.bin();
      case 9: case 10: return this.daftar();
      case 11: return this.peta();
      case 12: return this.struktur();
      default: throw new Error('Tipe Thrift tidak dikenal: ' + tipe);
    }
  }
  daftar() {
    if (++this.dalam > MAKS_DALAM_THRIFT) throw new Error('Struktur Thrift terlalu dalam.');
    try {
      const h = this.byte();
      let n = h >> 4;
      const tipeElemen = h & 0x0f;
      if (n === 15) n = Number(this.varint());
      // RED-06: bool (tipe 1/2) tidak mengonsumsi byte — tanpa batas,
      // klaim 10 juta elemen dari footer 9 byte mengalokasi array raksasa.
      // Batas absolut 1 juta untuk semua tipe; untuk tipe yang mengonsumsi
      // byte, n juga tidak boleh melebihi sisa byte (tiap elemen >= 1 byte).
      if (!Number.isFinite(n) || n < 0 || n > MAKS_ELEMEN_THRIFT) throw new Error('Daftar Thrift terlalu besar.');
      if (tipeElemen !== 1 && tipeElemen !== 2 && n > this.b.length - this.p) throw new Error('Daftar Thrift melebihi sisa data.');
      // RED2-01: anggaran kumulatif per parse, dicek SEBELUM alokasi.
      // Daftar bersarang ikut terhitung karena daftar() dipanggil lewat
      // nilai() untuk tiap elemen struct. Karena batas total (500 ribu)
      // di bawah batas per-daftar (1 juta), klaim 1 juta elemen melempar
      // di sini tanpa mengalokasi apa pun.
      this.totalElemen += n;
      if (this.totalElemen > MAKS_TOTAL_ELEMEN_THRIFT) throw new Error('Total elemen Thrift terlalu besar.');
      const hasil = [];
      for (let i = 0; i < n; i++) hasil.push(this.nilai(tipeElemen));
      return hasil;
    } finally {
      this.dalam--;
    }
  }
  peta() {
    if (++this.dalam > MAKS_DALAM_THRIFT) throw new Error('Struktur Thrift terlalu dalam.');
    try {
      const n = Number(this.varint());
      if (n === 0) return [];
      if (!Number.isFinite(n) || n < 0 || n > MAKS_ELEMEN_THRIFT) throw new Error('Peta Thrift terlalu besar.');
      const h = this.byte();
      // Sama seperti daftar(): bila kunci atau nilai mengonsumsi byte,
      // n tidak boleh melebihi sisa byte.
      const kunciBool = (h >> 4) === 1 || (h >> 4) === 2;
      const nilaiBool = (h & 0x0f) === 1 || (h & 0x0f) === 2;
      if ((!kunciBool || !nilaiBool) && n > this.b.length - this.p) throw new Error('Peta Thrift melebihi sisa data.');
      // RED2-01: pasangan peta ikut menghabiskan anggaran yang sama.
      this.totalElemen += n;
      if (this.totalElemen > MAKS_TOTAL_ELEMEN_THRIFT) throw new Error('Total elemen Thrift terlalu besar.');
      const hasil = [];
      for (let i = 0; i < n; i++) hasil.push([this.nilai(h >> 4), this.nilai(h & 0x0f)]);
      return hasil;
    } finally {
      this.dalam--;
    }
  }
  struktur() {
    if (++this.dalam > MAKS_DALAM_THRIFT) throw new Error('Struktur Thrift terlalu dalam.');
    try {
      const hasil = {};
      let idTerakhir = 0;
      for (;;) {
        const h = this.byte();
        if (h === 0) return hasil;
        const delta = h >> 4;
        const tipe = h & 0x0f;
        const id = delta === 0 ? this.i32() : idTerakhir + delta;
        idTerakhir = id;
        hasil[id] = this.nilai(tipe);
      }
    } finally {
      this.dalam--;
    }
  }
}

function angka(v) {
  if (typeof v === 'bigint') return v <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(v) : v.toString();
  return v == null ? 0 : Number(v);
}
function teks(b) {
  if (b instanceof Uint8Array) return new TextDecoder().decode(b);
  return b == null ? '' : String(b);
}

// ---------- Dekompresi ----------
// Snappy mentah (format blok): literal + salinan 1/2/4 byte offset.
export function snappyDecompress(masuk, panjangHarap) {
  const r = new Compact(masuk);
  const panjang = Number(r.varint());
  if (panjangHarap != null && panjang !== panjangHarap) throw new Error('Panjang Snappy tidak cocok.');
  // RED-07: panjang adalah klaim dari varint penyerang — validasi SEBELUM
  // alokasi, jangan sesudah. 64 MB jauh di atas halaman Parquet nyata.
  if (!Number.isFinite(panjang) || panjang < 0 || panjang > MAKS_DEKOMPRES) throw new Error('Ukuran hasil Snappy tidak masuk akal.');
  const keluar = new Uint8Array(panjang);
  let o = 0;
  while (r.p < masuk.length) {
    const tag = r.byte();
    const jenis = tag & 3;
    if (jenis === 0) {
      let n = tag >> 2;
      if (n < 60) n += 1;
      else {
        const ekstra = n - 59;
        n = 0;
        for (let i = 0; i < ekstra; i++) n |= r.byte() << (8 * i);
        n += 1;
      }
      if (r.p + n > masuk.length || o + n > panjang) throw new Error('Blok Snappy rusak.');
      keluar.set(masuk.subarray(r.p, r.p + n), o);
      r.p += n;
      o += n;
    } else {
      let n, off;
      if (jenis === 1) { n = ((tag >> 2) & 7) + 4; off = ((tag >> 5) << 8) | r.byte(); }
      else if (jenis === 2) { n = (tag >> 2) + 1; off = r.byte() | (r.byte() << 8); }
      else { n = (tag >> 2) + 1; off = r.byte() | (r.byte() << 8) | (r.byte() << 16) | (r.byte() << 24); }
      if (off <= 0 || off > o || o + n > panjang) throw new Error('Blok Snappy rusak.');
      for (let i = 0; i < n; i++) { keluar[o] = keluar[o - off]; o++; }
    }
  }
  if (o !== panjang) throw new Error('Blok Snappy tidak lengkap.');
  return keluar;
}

async function dekompres(data, codec, panjangHarap) {
  if (codec === 0) return data;
  if (codec === 1) return snappyDecompress(data, panjangHarap);
  if (codec === 2) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Gzip tidak didukung browser ini.');
    // RED-07: output gzip dibaca per chunk dengan batas 64 MB (zip bomb:
    // entri kecil terkompres bisa mengembang ribuan kali). Stream
    // dibatalkan begitu batas lewat, bukan setelah seluruh output menumpuk.
    const aliran = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    const reader = aliran.getReader();
    const potong = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAKS_DEKOMPRES) { try { await reader.cancel(); } catch (e) { /* abaikan */ } throw new Error('Hasil dekompresi Gzip terlalu besar.'); }
      potong.push(value);
    }
    const keluar = new Uint8Array(total);
    let o = 0;
    for (const c of potong) { keluar.set(c, o); o += c.byteLength; }
    return keluar;
  }
  throw new Error('Kompresi ' + (NAMA_KODEC[codec] || codec) + ' belum didukung.');
}

// ---------- RLE / bit-packed hybrid (level definisi + indeks kamus) ----------
export function bacaRleHybrid(data, lebarBit, jumlah) {
  // RED-07: jumlah adalah klaim header halaman — validasi SEBELUM
  // alokasi array. 1 juta nilai jauh di atas yang pernah dibaca tool ini
  // (pratinjau dibatasi 100 baris + target internal 1.124).
  if (!Number.isFinite(jumlah) || jumlah < 0 || jumlah > MAKS_NILAI_PARQUET) throw new Error('Jumlah nilai RLE terlalu besar.');
  const hasil = new Array(jumlah).fill(0);
  if (lebarBit === 0) return hasil;
  let p = 0, o = 0;
  const byteLebar = Math.ceil(lebarBit / 8);
  while (o < jumlah && p < data.length) {
    let header = 0, geser = 0;
    for (;;) {
      const x = data[p++];
      header |= (x & 0x7f) << geser;
      if (!(x & 0x80)) break;
      geser += 7;
      if (geser > 28) throw new Error('Header RLE rusak.');
    }
    if ((header & 1) === 0) {
      const hitung = header >>> 1;
      let nilai = 0;
      for (let i = 0; i < byteLebar; i++) nilai |= data[p++] << (8 * i);
      for (let i = 0; i < hitung && o < jumlah; i++) hasil[o++] = nilai;
    } else {
      const grup = header >>> 1;
      const totalBit = grup * 8 * lebarBit;
      const totalByte = Math.ceil(totalBit / 8);
      for (let i = 0; i < grup * 8 && o < jumlah; i++) {
        const bitAwal = i * lebarBit;
        const byteAwal = bitAwal >> 3;
        const bitDalam = bitAwal & 7;
        let nilai = 0;
        for (let k = 0; k < byteLebar + 1 && byteAwal + k < p + totalByte; k++) nilai |= data[p + byteAwal + k] << (8 * k);
        hasil[o++] = (nilai >>> bitDalam) & ((1 << lebarBit) - 1);
      }
      p += totalByte;
    }
  }
  if (o < jumlah) throw new Error('Data RLE tidak lengkap.');
  return hasil;
}

function lebarBitUntuk(maks) {
  let w = 0;
  while ((1 << w) <= maks) w++;
  return w;
}

// ---------- Dekode nilai PLAIN ----------
function int96KeTanggal(b, off) {
  const dv = new DataView(b.buffer, b.byteOffset + off, 12);
  const nano = dv.getBigUint64(0, true);
  const hariJulian = dv.getUint32(8, true);
  const ms = (BigInt(hariJulian - 2440588) * 86400000n) + (nano / 1000000n);
  const d = new Date(Number(ms));
  return isNaN(d.getTime()) ? 'INT96' : d.toISOString();
}

function desimalDariBytes(b, skala) {
  let n = 0n;
  for (let i = 0; i < b.length; i++) n = (n << 8n) | BigInt(b[i]);
  if (b.length && (b[0] & 0x80)) n -= 1n << BigInt(b.length * 8);
  const s = (skala || 0);
  if (s === 0) return n.toString();
  const negatif = n < 0n;
  const digit = (negatif ? -n : n).toString().padStart(s + 1, '0');
  return (negatif ? '-' : '') + digit.slice(0, -s) + '.' + digit.slice(-s);
}

export function dekodePlain(data, tipe, jumlah, panjangTetap, logis) {
  // RED-07: jumlah adalah klaim header — batasi sebelum loop.
  if (!Number.isFinite(jumlah) || jumlah < 0 || jumlah > MAKS_NILAI_PARQUET) throw new Error('Jumlah nilai terlalu besar.');
  const hasil = [];
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let p = 0;
  for (let i = 0; i < jumlah; i++) {
    switch (tipe) {
      case 0: {
        const byteIdx = (p >> 3);
        // RED-07: data[byteIdx] di luar batas mengembalikan undefined
        // (bukan throw) — tanpa cek ini loop berjalan penuh dengan data
        // sampah. Lempar error jujur bila data habis.
        if (byteIdx >= data.length) throw new Error('Data bool terpotong.');
        hasil.push(((data[byteIdx] >> (p & 7)) & 1) === 1);
        p++;
        break;
      }
      case 1: hasil.push(dv.getInt32(p, true)); p += 4; break;
      case 2: {
        const v = dv.getBigInt64(p, true);
        hasil.push(v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(v) : v.toString());
        p += 8;
        break;
      }
      case 3: hasil.push(int96KeTanggal(data, p)); p += 12; break;
      case 4: hasil.push(dv.getFloat32(p, true)); p += 4; break;
      case 5: hasil.push(dv.getFloat64(p, true)); p += 8; break;
      case 6: {
        const n = dv.getUint32(p, true);
        p += 4;
        if (n < 0 || p + n > data.length) throw new Error('Data byte array terpotong.');
        const potong = data.slice(p, p + n);
        p += n;
        if (logis && logis.decimal) hasil.push(desimalDariBytes(potong, logis.skala));
        else if (logis && logis.biner) hasil.push('0x' + Array.from(potong.slice(0, 16)).map((x) => x.toString(16).padStart(2, '0')).join('') + (potong.length > 16 ? '…' : ''));
        else hasil.push(new TextDecoder().decode(potong));
        break;
      }
      case 7: {
        if (p + panjangTetap > data.length) throw new Error('Data panjang-tetap terpotong.');
        const potong = data.slice(p, p + panjangTetap);
        p += panjangTetap;
        if (logis && logis.decimal) hasil.push(desimalDariBytes(potong, logis.skala));
        else hasil.push('0x' + Array.from(potong).map((x) => x.toString(16).padStart(2, '0')).join(''));
        break;
      }
      default: throw new Error('Tipe fisik tidak dikenal: ' + tipe);
    }
  }
  return hasil;
}

// ---------- Metadata footer ----------
function bangunSkema(daftar) {
  // Daftar SchemaElement urutan pre-order; num_children menentukan sarang.
  // RED-15: kedalaman dibatasi 100 tingkat (skema nyata belasan tingkat)
  // supaya num_children yang dibuat-buat tidak membuat stack overflow.
  let idx = 0;
  function jalan(atas, dalam) {
    if (dalam > 100) throw new Error('Skema Parquet terlalu dalam.');
    const el = daftar[idx++];
    const simpul = {
      nama: teks(el[4]),
      tipe: el[1] == null ? null : angka(el[1]),
      panjangTetap: el[2] == null ? null : angka(el[2]),
      repetisi: el[3] == null ? 0 : angka(el[3]),
      anak: [],
      atas,
    };
    const nAnak = el[5] == null ? 0 : angka(el[5]);
    for (let i = 0; i < nAnak; i++) simpul.anak.push(jalan(simpul, dalam + 1));
    if (el[10]) {
      const l = el[10];
      if (l[1] != null) simpul.logis = { utf8: true };
      if (l[5] != null) simpul.logis = { decimal: true, skala: angka(l[5][1]), presisi: angka(l[5][2]) };
      if (l[10] != null) simpul.logis = { integer: true };
      if (l[6] != null) simpul.logis = { date: true };
      if (l[8] != null) simpul.logis = { timestamp: true };
    }
    if (el[6] != null && angka(el[6]) === 0) simpul.logis = { utf8: true };
    if (el[6] != null && angka(el[6]) === 4) simpul.logis = { decimal: true, skala: angka(el[7]), presisi: angka(el[8]) };
    return simpul;
  }
  const akar = jalan(null, 0);
  const daun = [];
  (function kumpul(s, jalur, maksDef, maksRep) {
    const d = maksDef + (s.repetisi === 1 || s.repetisi === 2 ? 1 : 0);
    const r = maksRep + (s.repetisi === 2 ? 1 : 0);
    if (!s.anak.length) {
      if (s.tipe != null) daun.push({ simpul: s, jalur, maksDef: d, maksRep: r });
      return;
    }
    s.anak.forEach((a) => kumpul(a, jalur.concat([a.nama]), d, r));
  })(akar, [], 0, 0);
  return { akar, daun };
}

export function parseParquetFooter(u8) {
  if (!(u8 instanceof Uint8Array)) u8 = new Uint8Array(u8);
  if (u8.length < 12) throw new Error('File terlalu kecil untuk Parquet.');
  const awal = new TextDecoder().decode(u8.slice(0, 4));
  const akhir = new TextDecoder().decode(u8.slice(u8.length - 4));
  if (awal !== 'PAR1' || akhir !== 'PAR1') throw new Error('File ini bukan Parquet (tanda PAR1 tidak ketemu di awal/akhir).');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const panjangMeta = dv.getUint32(u8.length - 8, true);
  if (panjangMeta <= 0 || panjangMeta > u8.length - 12) throw new Error('Panjang metadata footer tidak masuk akal.');
  const awalMeta = u8.length - 8 - panjangMeta;
  const meta = new Compact(u8, awalMeta).struktur();
  const daftarSkema = meta[2] || [];
  if (!daftarSkema.length) throw new Error('Skema tidak ketemu di footer.');
  const skema = bangunSkema(daftarSkema);
  const grupBaris = (meta[4] || []).map((g) => ({
    jumlahBaris: angka(g[3]),
    totalByte: angka(g[2]),
    totalTerkompres: angka(g[6]),
    ordinal: g[7] == null ? null : angka(g[7]),
    kolom: (g[1] || []).map((c) => {
      const m = c[3] || {};
      return {
        offsetFile: angka(c[2]),
        tipe: m[1] == null ? null : angka(m[1]),
        encoding: (m[2] || []).map(angka),
        jalur: (m[3] || []).map(teks),
        codec: m[4] == null ? 0 : angka(m[4]),
        jumlahNilai: angka(m[5]),
        ukuranAsli: angka(m[6]),
        ukuranTerkompres: angka(m[7]),
        offsetData: angka(m[9]),
        offsetKamus: m[11] == null ? null : angka(m[11]),
        nullCount: m[12] && m[12][3] != null ? angka(m[12][3]) : null,
      };
    }),
  }));
  return {
    versi: meta[1] == null ? null : angka(meta[1]),
    dibuatOleh: meta[6] == null ? null : teks(meta[6]),
    jumlahBaris: angka(meta[3]),
    skema,
    grupBaris,
    panjangMeta,
  };
}

// ---------- Baca isi baris ----------
async function bacaHalaman(u8, offset) {
  const r = new Compact(u8, offset);
  const h = r.struktur();
  const panjangHeader = r.p - offset;
  return { header: h, panjangHeader };
}

async function bacaKolom(u8, kolom, daun, maksBaris) {
  const tipe = kolom.tipe;
  const maksDef = daun.maksDef;
  const maksRep = daun.maksRep;
  if (maksRep > 0) return { nilai: null, alasan: 'kolom berulang (list) belum didukung' };
  let offset = kolom.offsetKamus != null ? kolom.offsetKamus : kolom.offsetData;
  let kamus = null;
  let nilai = [];
  let dibaca = 0;
  const target = Math.min(kolom.jumlahNilai, maksBaris + 1024);
  while (dibaca < kolom.jumlahNilai && nilai.length < target && offset < u8.length) {
    const { header, panjangHeader } = await bacaHalaman(u8, offset);
    const jenisHalaman = angka(header[1]);
    const ukuranAsli = angka(header[2]);
    const ukuranKompres = angka(header[3]);
    const awalData = offset + panjangHeader;
    const dataKompres = u8.slice(awalData, awalData + ukuranKompres);
    offset = awalData + ukuranKompres;
    if (jenisHalaman === 2) {
      const dh = header[7] || {};
      const jumlahKamus = angka(dh[1]);
      const encKamus = angka(dh[2]);
      if (encKamus !== 0) return { nilai: null, alasan: 'halaman kamus bukan PLAIN' };
      const data = await dekompres(dataKompres, kolom.codec, ukuranAsli);
      kamus = dekodePlain(data, tipe, jumlahKamus, daun.simpul.panjangTetap, daun.simpul.logis);
      continue;
    }
    if (jenisHalaman !== 0 && jenisHalaman !== 3) {
      return { nilai: null, alasan: 'jenis halaman ' + jenisHalaman + ' belum didukung' };
    }
    const data = await dekompres(dataKompres, kolom.codec, ukuranAsli);
    let defLevel = null;
    let nilaiHalaman;
    let p = 0;
    if (jenisHalaman === 0) {
      const dph = header[5] || {};
      const jumlahNilai = angka(dph[1]);
      const encoding = angka(dph[2]);
      if (maksDef > 0) {
        const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const panjangRle = dv.getUint32(0, true);
        defLevel = bacaRleHybrid(data.slice(4, 4 + panjangRle), lebarBitUntuk(maksDef), jumlahNilai);
        p = 4 + panjangRle;
      }
      const jumlahAda = defLevel ? defLevel.filter((d) => d === maksDef).length : jumlahNilai;
      if (encoding === 0) {
        nilaiHalaman = dekodePlain(data.slice(p), tipe, jumlahAda, daun.simpul.panjangTetap, daun.simpul.logis);
      } else if (encoding === 2 || encoding === 8) {
        if (!kamus) return { nilai: null, alasan: 'halaman kamus tidak ketemu' };
        const lebar = data[p];
        const indeks = bacaRleHybrid(data.slice(p + 1), lebar, jumlahAda);
        nilaiHalaman = indeks.map((i) => kamus[i]);
      } else {
        return { nilai: null, alasan: 'encoding ' + (NAMA_ENCODING[encoding] || encoding) + ' belum didukung' };
      }
      dibaca += jumlahNilai;
    } else {
      const dph = header[8] || {};
      const jumlahNilai = angka(dph[1]);
      const encoding = angka(dph[4]);
      const panjangDef = angka(dph[5]);
      const panjangRep = angka(dph[6]);
      p = panjangRep;
      if (maksDef > 0) {
        defLevel = bacaRleHybrid(data.slice(p, p + panjangDef), lebarBitUntuk(maksDef), jumlahNilai);
        p += panjangDef;
      }
      const jumlahAda = defLevel ? defLevel.filter((d) => d === maksDef).length : jumlahNilai;
      if (encoding === 0) {
        nilaiHalaman = dekodePlain(data.slice(p), tipe, jumlahAda, daun.simpul.panjangTetap, daun.simpul.logis);
      } else if (encoding === 2 || encoding === 8) {
        if (!kamus) return { nilai: null, alasan: 'halaman kamus tidak ketemu' };
        const lebar = data[p];
        const indeks = bacaRleHybrid(data.slice(p + 1), lebar, jumlahAda);
        nilaiHalaman = indeks.map((i) => kamus[i]);
      } else {
        return { nilai: null, alasan: 'encoding ' + (NAMA_ENCODING[encoding] || encoding) + ' belum didukung' };
      }
      dibaca += jumlahNilai;
    }
    // Kembalikan null untuk baris yang level definisinya kurang.
    if (defLevel) {
      let k = 0;
      for (const d of defLevel) {
        if (nilai.length >= target) break;
        nilai.push(d === maksDef ? nilaiHalaman[k++] : null);
      }
    } else {
      for (const v of nilaiHalaman) {
        if (nilai.length >= target) break;
        nilai.push(v);
      }
    }
  }
  return { nilai, alasan: null };
}

export async function decodePreview(u8, meta, maksBaris) {
  const maks = Math.max(1, Math.min(100, maksBaris || 20));
  const daun = meta.skema.daun;
  const namaKolom = daun.map((d) => d.jalur.join('.'));
  const kolomNilai = [];
  const dilewati = [];
  for (let ci = 0; ci < daun.length; ci++) {
    const d = daun[ci];
    let gabung = [];
    let alasan = null;
    for (const g of meta.grupBaris) {
      if (gabung.length >= maks) break;
      const kolom = g.kolom[ci];
      if (!kolom) { alasan = 'kolom tidak ada di grup baris ini'; break; }
      try {
        const hasil = await bacaKolom(u8, kolom, d, maks - gabung.length);
        if (hasil.nilai == null) { alasan = hasil.alasan; break; }
        gabung = gabung.concat(hasil.nilai);
      } catch (e) {
        alasan = 'gagal dibaca: ' + (e.message || 'error');
        break;
      }
    }
    if (alasan) dilewati.push({ kolom: namaKolom[ci], alasan });
    kolomNilai.push(gabung);
  }
  const jumlahBaris = Math.max(0, ...kolomNilai.map((k) => k.length));
  const baris = [];
  for (let r = 0; r < Math.min(jumlahBaris, maks); r++) {
    baris.push(kolomNilai.map((k) => (r < k.length ? k[r] : null)));
  }
  return { kolom: namaKolom, baris, dilewati, jumlahBaris, totalBaris: meta.jumlahBaris };
}

export function formatSel(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return utils.r6(v);
  return String(v);
}

export function barisKeCsv(kolom, baris) {
  const escCsv = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [kolom.map(escCsv).join(',')].concat(baris.map((r) => r.map(escCsv).join(','))).join('\n');
}

// ---------- Antarmuka ----------
export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.pq-tabel{width:100%;border-collapse:collapse;font-size:13px;margin:10px 0}' +
    '.pq-tabel th,.pq-tabel td{border:1px solid var(--line-soft);padding:6px 8px;text-align:left;vertical-align:top;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.pq-tabel th{background:var(--surface-2);font-weight:700}' +
    '.pq-wrap{overflow-x:auto}' +
    '.pq-pohon{font-family:ui-monospace,monospace;font-size:13px;line-height:1.7;white-space:pre-wrap;word-break:break-word}' +
    '.pq-null{color:var(--faint)}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Buka file data .parquet dan lihat skema serta isinya. ' + T.esc(LOCAL_NOTE) + ' Format yang didukung: kolom PLAIN dan kamus, kompresi tanpa kompresi, Snappy, dan Gzip.</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.parquet';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const infoEl = T.el('<div></div>');
  const skemaEl = T.el('<div></div>');
  const kolomEl = T.el('<div></div>');
  const pratinjauEl = T.el('<div></div>');
  const aksiEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');

  let metaAktif = null, u8Aktif = null, namaDasar = 'data';
  let hasilPratinjau = null;
  const jumlahSel = T.select([['20', '20 baris'], ['50', '50 baris'], ['100', '100 baris']], '20');

  function pohonHtml(s, dalam) {
    let h = ' '.repeat(dalam * 2);
    h += s.tipe == null ? '▸ ' : '• ';
    h += s.nama;
    if (s.tipe != null) h += ' : ' + (NAMA_TIPE[s.tipe] || s.tipe);
    if (s.logis && s.logis.decimal) h += ' (desimal ' + s.logis.presisi + ',' + s.logis.skala + ')';
    if (s.logis && s.logis.utf8) h += ' (teks)';
    h += ' [' + (NAMA_REPETISI[s.repetisi] || s.repetisi) + ']';
    let keluar = T.esc(h) + '\n';
    s.anak.forEach((a) => { keluar += pohonHtml(a, dalam + 1); });
    return keluar;
  }

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Membaca file...';
    infoEl.innerHTML = ''; skemaEl.innerHTML = ''; kolomEl.innerHTML = ''; pratinjauEl.innerHTML = ''; aksiEl.innerHTML = '';
    hasilPratinjau = null;
    try {
      const buf = await f.arrayBuffer();
      u8Aktif = new Uint8Array(buf);
      metaAktif = parseParquetFooter(u8Aktif);
      namaDasar = f.name.replace(/\.parquet$/i, '') || 'data';
      statusEl.textContent = '';
      infoEl.innerHTML =
        '<div class="card">' +
        kv('File', T.esc(f.name) + ' (' + fmtBytes(f.size) + ')') +
        kv('Versi format', metaAktif.versi == null ? '-' : T.esc(String(metaAktif.versi))) +
        (metaAktif.dibuatOleh ? kv('Dibuat oleh', T.esc(metaAktif.dibuatOleh)) : '') +
        kv('Total baris', T.fmt(metaAktif.jumlahBaris)) +
        kv('Grup baris', T.fmt(metaAktif.grupBaris.length)) +
        kv('Kolom', T.fmt(metaAktif.skema.daun.length)) +
        '</div>';
      skemaEl.innerHTML = '<h3 style="margin:14px 0 4px">Skema</h3><div class="pq-pohon">' + pohonHtml(metaAktif.skema.akar, 0) + '</div>';
      let tabelKolom = '<h3 style="margin:14px 0 4px">Kolom</h3><div class="pq-wrap"><table class="pq-tabel"><thead><tr><th>Kolom</th><th>Tipe</th><th>Kompresi</th><th>Nilai</th><th>Ukuran</th><th>Kosong</th></tr></thead><tbody>';
      metaAktif.skema.daun.forEach((d, i) => {
        const k0 = metaAktif.grupBaris[0] && metaAktif.grupBaris[0].kolom[i];
        tabelKolom += '<tr><td>' + T.esc(d.jalur.join('.')) + '</td><td>' + T.esc(NAMA_TIPE[d.simpul.tipe] || '-') + '</td><td>' +
          T.esc(k0 ? (NAMA_KODEC[k0.codec] || k0.codec) : '-') + '</td><td>' + T.fmt(k0 ? k0.jumlahNilai : 0) + '</td><td>' +
          fmtBytes(k0 ? k0.ukuranTerkompres : 0) + '</td><td>' + (k0 && k0.nullCount != null ? T.fmt(k0.nullCount) : '-') + '</td></tr>';
      });
      tabelKolom += '</tbody></table></div>';
      kolomEl.innerHTML = tabelKolom;
      const kontrol = T.el('<div class="row" style="flex-wrap:wrap;align-items:flex-end"></div>');
      kontrol.append(T.field('Baris yang ditampilkan', jumlahSel), T.btn('Muat isi baris', muatPratinjau, true));
      pratinjauEl.appendChild(kontrol);
      await muatPratinjau();
    } catch (e) {
      statusEl.textContent = '';
      infoEl.innerHTML = '<p style="color:var(--err)">' + T.esc(e.message || 'File tidak bisa dibaca.') + '</p>';
      metaAktif = null;
    }
  }

  async function muatPratinjau() {
    if (!metaAktif || !u8Aktif) return;
    const maks = parseInt(jumlahSel.value, 10) || 20;
    const lama = pratinjauEl.querySelector('.pq-hasil');
    if (lama) lama.remove();
    aksiEl.innerHTML = '';
    const wadah = T.el('<div class="pq-hasil"><p class="hint">Membaca isi baris...</p></div>');
    pratinjauEl.appendChild(wadah);
    try {
      hasilPratinjau = await decodePreview(u8Aktif, metaAktif, maks);
      let h = '';
      if (hasilPratinjau.dilewati.length) {
        h += '<p class="hint">Kolom yang isinya tidak dibaca: ' + hasilPratinjau.dilewati.map((d) => T.esc(d.kolom) + ' (' + T.esc(d.alasan) + ')').join('; ') + '.</p>';
      }
      if (!hasilPratinjau.baris.length) {
        h += '<p class="hint">Tidak ada baris yang bisa ditampilkan dari file ini.</p>';
      } else {
        h += '<p class="hint">Menampilkan ' + T.fmt(hasilPratinjau.baris.length) + ' dari ' + T.fmt(hasilPratinjau.totalBaris) + ' baris.</p>' +
          '<div class="pq-wrap"><table class="pq-tabel"><thead><tr>' +
          hasilPratinjau.kolom.map((c) => '<th>' + T.esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
          hasilPratinjau.baris.map((r) => '<tr>' + r.map((v) => '<td' + (v === null ? ' class="pq-null"' : '') + '>' + T.esc(formatSel(v)) + '</td>').join('') + '</tr>').join('') +
          '</tbody></table></div>';
        aksiEl.append(T.btn('Unduh CSV (' + hasilPratinjau.baris.length + ' baris)', () => {
          T.dl(namaDasar + '-pratinjau.csv', '\ufeff' + barisKeCsv(hasilPratinjau.kolom, hasilPratinjau.baris), 'text/csv;charset=utf-8');
        }));
      }
      wadah.innerHTML = h;
    } catch (e) {
      wadah.innerHTML = '<p style="color:var(--err)">Isi baris gagal dibaca: ' + T.esc(e.message || 'error tidak diketahui') + '. Metadata di atas tetap tampil.</p>';
    }
  }

  fileI.addEventListener('change', bukaFile);
  root.append(
    T.field('Pilih file Parquet', fileI, 'Contoh: data.parquet. Belum punya file? Coba unduh contoh dari dokumentasi Apache Parquet.'),
    statusEl,
    infoEl,
    skemaEl,
    kolomEl,
    pratinjauEl,
    aksiEl,
  );
}
