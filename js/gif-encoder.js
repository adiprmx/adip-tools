// Encoder GIF89a animasi + LZW tulis-sendiri: modul bersama
// (kanonis, G4 C1G4-R). Dikonsolidasi dari gambar/gif-3d-wigglegram.js
// (G4 B20) + produktivitas/pdf-ke-gif.js (G4 B10): buatPalet,
// buatPencariPalet, dan lzwKompres byte-identik; GifEncoder identik
// kecuali tunda default (wigglegram 200 mdtk, pdf-ke-gif 1000 mdtk).
// Kanon memakai default 200 (nilai umum untuk GIF animasi); default
// 1000 milik pdf-ke-gif dipertahankan di call-site-nya
// (`tundaMs: parseInt(...) || 1000`), sehingga perilaku kedua tool
// tidak berubah. Kedua call-site selalu mengirim tundaMs eksplisit;
// default hanya terjangkau bila konstruktor dipanggil tanpa opsi.
export function buatPalet() {
  const palet = [];
  const tingkat = [0, 51, 102, 153, 204, 255];
  for (const r of tingkat) for (const g of tingkat) for (const b of tingkat) palet.push([r, g, b]);
  for (let i = 0; i < 40; i++) {
    const v = Math.round((i * 255) / 39);
    palet.push([v, v, v]);
  }
  return palet;
}

// Cari indeks warna palet terdekat (jarak kuadrat RGB), cache per
// RGB terkuantisasi 5 bit per kanal. Murni.
export function buatPencariPalet(palet) {
  const cache = new Map();
  return function (r, g, b) {
    const kunci = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const ketemu = cache.get(kunci);
    if (ketemu !== undefined) return ketemu;
    let terbaik = 0, jarakTerbaik = Infinity;
    for (let i = 0; i < palet.length; i++) {
      const p = palet[i];
      const dr = r - p[0], dg = g - p[1], db = b - p[2];
      const d = dr * dr + dg * dg + db * db;
      if (d < jarakTerbaik) { jarakTerbaik = d; terbaik = i; }
    }
    cache.set(kunci, terbaik);
    return terbaik;
  };
}

// Kompresi LZW ala GIF: kode dikemas LSB-first, ukuran kode mulai
// 9 bit naik sampai 12 bit, kode clear di awal dan saat kamus
// penuh. Murni.
export function lzwKompres(indeks, ukuranKodeMin) {
  const min = ukuranKodeMin || 8;
  const clear = 1 << min;
  const eoi = clear + 1;
  const keluar = [];
  let akumulator = 0, bitTerisi = 0;
  let ukuranKode = min + 1;
  const tulis = (kode) => {
    akumulator |= kode << bitTerisi;
    bitTerisi += ukuranKode;
    while (bitTerisi >= 8) {
      keluar.push(akumulator & 0xff);
      akumulator >>= 8;
      bitTerisi -= 8;
    }
  };
  let kamus = new Map();
  let kodeBerikut = eoi + 1;
  const reset = () => { kamus = new Map(); kodeBerikut = eoi + 1; ukuranKode = min + 1; };
  reset();
  tulis(clear);
  if (!indeks.length) { tulis(eoi); }
  else {
    let awalan = indeks[0];
    for (let i = 1; i < indeks.length; i++) {
      const k = indeks[i];
      const kunci = awalan * 256 + k;
      const ada = kamus.get(kunci);
      if (ada !== undefined) { awalan = ada; continue; }
      tulis(awalan);
      if (kodeBerikut < 4096) {
        kamus.set(kunci, kodeBerikut);
        kodeBerikut++;
        if (kodeBerikut > (1 << ukuranKode) && ukuranKode < 12) ukuranKode++;
      } else {
        tulis(clear);
        reset();
      }
      awalan = k;
    }
    tulis(awalan);
    tulis(eoi);
  }
  if (bitTerisi > 0) keluar.push(akumulator & 0xff);
  return new Uint8Array(keluar);
}

// Encoder GIF89a animasi. frame: {data: Uint8ClampedArray RGBA,
// lebar, tinggi} per tambahFrame. Murni (tanpa DOM), bisa diuji di Node.
export class GifEncoder {
  constructor(lebar, tinggi, opsi) {
    this.lebar = lebar;
    this.tinggi = tinggi;
    this.tunda = (opsi && opsi.tundaMs) || 200;
    this.putar = opsi && opsi.putar === false ? 1 : 0; // 0 = putar selamanya
    this.palet = buatPalet();
    this.cari = buatPencariPalet(this.palet);
    this.frame = [];
  }

  tambahFrame(data, lebar, tinggi) {
    const indeks = new Uint8Array(lebar * tinggi);
    for (let i = 0; i < lebar * tinggi; i++) {
      indeks[i] = this.cari(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    }
    this.frame.push(indeks);
  }

  selesai() {
    const byte = [];
    const tulisStr = (s) => { for (let i = 0; i < s.length; i++) byte.push(s.charCodeAt(i)); };
    const tulis16 = (n) => { byte.push(n & 0xff, (n >> 8) & 0xff); };
    tulisStr('GIF89a');
    tulis16(this.lebar); tulis16(this.tinggi);
    byte.push(0xf7, 0, 0); // GCT 256 warna, tanpa warna latar
    for (const p of this.palet) byte.push(p[0], p[1], p[2]);
    // Ekstensi pengulangan NETSCAPE2.0.
    tulisStr('\x21\xff\x0bNETSCAPE2.0\x03\x01');
    tulis16(this.putar);
    byte.push(0);
    const tunda100 = Math.max(2, Math.round(this.tunda / 10));
    for (const indeks of this.frame) {
      // Graphic Control Extension (tunda per frame).
      byte.push(0x21, 0xf9, 0x04, 0x00);
      tulis16(tunda100);
      byte.push(0, 0);
      // Image Descriptor.
      byte.push(0x2c);
      tulis16(0); tulis16(0); tulis16(this.lebar); tulis16(this.tinggi);
      byte.push(0);
      byte.push(8); // ukuran kode LZW minimum
      const lzw = lzwKompres(indeks, 8);
      for (let i = 0; i < lzw.length; i += 255) {
        const potong = lzw.slice(i, i + 255);
        byte.push(potong.length);
        for (const b of potong) byte.push(b);
      }
      byte.push(0); // terminator blok
    }
    byte.push(0x3b); // trailer
    return new Uint8Array(byte);
  }
}
