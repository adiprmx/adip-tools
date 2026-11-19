import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes } from '../../core.js';

// TGA/PPM ke PNG: buka file gambar TGA (dipakai game dan grafis 3D) dan
// PPM/PGM (format Netpbm sederhana) lalu simpan sebagai PNG. Decoder
// ditulis sendiri di file ini (tanpa pustaka): TGA polos dan RLE,
// kedalaman 8/16/24/32 bit; PPM P3/P6 dan PGM P2/P5.
export const meta = {"id": "tga-ppm-ke-png", "name": "TGA/PPM ke PNG", "cat": "gambar", "icon": "🖼️", "desc": "Ubah file gambar TGA atau PPM/PGM jadi PNG.", "keywords": "tga,ppm,pgm,pnm,netpbm,convert,png,game,3d", "since": "6.19.0"};

// ---------- PPM / PGM (Netpbm) ----------
// Tokenizer header: lewati spasi dan komentar (# sampai akhir baris).
function tokenPnm(teks, pos) {
  const n = teks.length;
  let i = pos;
  while (i < n) {
    const c = teks[i];
    if (c === '#') { while (i < n && teks[i] !== '\n') i++; continue; }
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    break;
  }
  const awal = i;
  while (i < n && !/[ \t\n\r#]/.test(teks[i])) i++;
  return { token: teks.slice(awal, i), posAkhir: i };
}

// Decode PPM (P3/P6) atau PGM (P2/P5). Kembalikan {lebar, tinggi, rgba}.
// Fungsi murni.
export function decodePpm(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 3 || b[0] !== 0x50 /* P */) throw new Error('Bukan file PPM/PGM (harus mulai dengan P).');
  const ajaib = String.fromCharCode(b[0], b[1]);
  if (!['P2', 'P3', 'P5', 'P6'].includes(ajaib)) throw new Error('Jenis ' + ajaib + ' tidak didukung. Pakai P2, P3, P5, atau P6.');
  const biner = ajaib === 'P5' || ajaib === 'P6';
  const abu = ajaib === 'P2' || ajaib === 'P5';
  // Header selalu ASCII dan pendek; baca 4 KB pertama saja sebagai teks
  // (data biner P6 bisa puluhan MB, jangan diubah jadi string).
  let teks = '';
  const batasHeader = Math.min(b.length, 4096);
  for (let i = 0; i < batasHeader; i++) teks += String.fromCharCode(b[i]);
  let pos = 0;
  let t = tokenPnm(teks, pos); pos = t.posAkhir; // P?
  t = tokenPnm(teks, pos); pos = t.posAkhir;
  const lebar = parseInt(t.token, 10);
  t = tokenPnm(teks, pos); pos = t.posAkhir;
  const tinggi = parseInt(t.token, 10);
  t = tokenPnm(teks, pos); pos = t.posAkhir;
  const maxval = parseInt(t.token, 10);
  if (!Number.isFinite(lebar) || !Number.isFinite(tinggi) || lebar < 1 || tinggi < 1 || lebar > 20000 || tinggi > 20000) {
    throw new Error('Ukuran gambar di header tidak valid.');
  }
  if (!Number.isFinite(maxval) || maxval < 1 || maxval > 65535) throw new Error('Nilai maksimal (maxval) tidak valid.');
  const jumlah = lebar * tinggi;
  const rgba = new Uint8ClampedArray(jumlah * 4);
  const skala = (v) => Math.round((v / maxval) * 255);
  if (biner) {
    // Satu karakter whitespace setelah maxval, lalu data biner.
    let dataAwal = pos;
    if (teks[dataAwal] === '\r' && teks[dataAwal + 1] === '\n') dataAwal += 2;
    else if (dataAwal < teks.length) dataAwal += 1;
    const bytePerNilai = maxval > 255 ? 2 : 1;
    const kanal = abu ? 1 : 3;
    const perlu = jumlah * kanal * bytePerNilai;
    if (b.length - dataAwal < perlu) throw new Error('Data gambar terpotong (kurang ' + (perlu - (b.length - dataAwal)) + ' byte).');
    for (let p = 0; p < jumlah; p++) {
      const o = dataAwal + p * kanal * bytePerNilai;
      const baca = (k) => {
        const i = o + k * bytePerNilai;
        return bytePerNilai === 2 ? (b[i] << 8) | b[i + 1] : b[i];
      };
      if (abu) { const v = skala(baca(0)); rgba[p * 4] = v; rgba[p * 4 + 1] = v; rgba[p * 4 + 2] = v; }
      else { rgba[p * 4] = skala(baca(0)); rgba[p * 4 + 1] = skala(baca(1)); rgba[p * 4 + 2] = skala(baca(2)); }
      rgba[p * 4 + 3] = 255;
    }
  } else {
    // ASCII: semua nilai dipisah spasi. Bangun teks penuh di sini saja
    // (file ASCII memang seluruhnya teks).
    let teksPenuh = '';
    for (let i = 0; i < b.length; i++) teksPenuh += String.fromCharCode(b[i]);
    const nilai = [];
    let p = pos;
    while (p < teksPenuh.length) {
      const tk = tokenPnm(teksPenuh, p);
      if (!tk.token) break;
      nilai.push(parseInt(tk.token, 10));
      p = tk.posAkhir;
    }
    const kanal = abu ? 1 : 3;
    if (nilai.length < jumlah * kanal) throw new Error('Data gambar terpotong.');
    for (let px = 0; px < jumlah; px++) {
      if (abu) { const v = skala(nilai[px]); rgba[px * 4] = v; rgba[px * 4 + 1] = v; rgba[px * 4 + 2] = v; }
      else {
        rgba[px * 4] = skala(nilai[px * 3]);
        rgba[px * 4 + 1] = skala(nilai[px * 3 + 1]);
        rgba[px * 4 + 2] = skala(nilai[px * 3 + 2]);
      }
      rgba[px * 4 + 3] = 255;
    }
  }
  return { lebar, tinggi, rgba, format: ajaib };
}

// ---------- TGA (Truevision) ----------
function bacaU16le(b, o) { return b[o] | (b[o + 1] << 8); }

// Decode TGA: tipe 2 (warna polos), 3 (abu polos), 10 (warna RLE),
// 11 (abu RLE). Kedalaman 8/16/24/32 bit. Kembalikan
// {lebar, tinggi, rgba, format}. Fungsi murni.
export function decodeTga(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 18) throw new Error('File TGA terlalu kecil.');
  const idLen = b[0];
  const petaWarna = b[1];
  const tipe = b[2];
  const lebar = bacaU16le(b, 12);
  const tinggi = bacaU16le(b, 14);
  const kedalaman = b[16];
  const deskriptor = b[17];
  if (![2, 3, 10, 11].includes(tipe)) throw new Error('Tipe TGA ' + tipe + ' tidak didukung (peta warna dan tipe lain belum didukung).');
  if (petaWarna !== 0) throw new Error('TGA dengan peta warna (colormap) belum didukung.');
  if (lebar < 1 || tinggi < 1 || lebar > 20000 || tinggi > 20000) throw new Error('Ukuran gambar di header tidak valid.');
  const abu = tipe === 3 || tipe === 11;
  const rle = tipe === 10 || tipe === 11;
  if (abu && kedalaman !== 8) throw new Error('TGA abu-abu hanya mendukung 8 bit.');
  if (!abu && ![16, 24, 32].includes(kedalaman)) throw new Error('Kedalaman warna ' + kedalaman + ' bit tidak didukung.');
  const asalAtas = (deskriptor & 0x20) !== 0;
  const asalKanan = (deskriptor & 0x10) !== 0;
  const bytePerPiksel = abu ? 1 : Math.ceil(kedalaman / 8);
  const jumlah = lebar * tinggi;
  const rgba = new Uint8ClampedArray(jumlah * 4);
  let pos = 18 + idLen;

  const tulisPiksel = (idx, o) => {
    // idx = urutan piksel dalam file; o = offset data piksel.
    const barisFile = Math.floor(idx / lebar);
    const kolomFile = idx % lebar;
    const y = asalAtas ? barisFile : tinggi - 1 - barisFile;
    const x = asalKanan ? lebar - 1 - kolomFile : kolomFile;
    const p = (y * lebar + x) * 4;
    if (abu) {
      const v = b[o];
      rgba[p] = v; rgba[p + 1] = v; rgba[p + 2] = v; rgba[p + 3] = 255;
      return;
    }
    if (kedalaman === 32) { rgba[p] = b[o + 2]; rgba[p + 1] = b[o + 1]; rgba[p + 2] = b[o]; rgba[p + 3] = b[o + 3]; }
    else if (kedalaman === 24) { rgba[p] = b[o + 2]; rgba[p + 1] = b[o + 1]; rgba[p + 2] = b[o]; rgba[p + 3] = 255; }
    else {
      // 16 bit: 1 bit alpha + 5 bit tiap warna (ARGB1555).
      const v = bacaU16le(b, o);
      rgba[p] = Math.round(((v >> 10) & 31) * 255 / 31);
      rgba[p + 1] = Math.round(((v >> 5) & 31) * 255 / 31);
      rgba[p + 2] = Math.round((v & 31) * 255 / 31);
      rgba[p + 3] = (v & 0x8000) ? 255 : 0;
    }
  };

  if (!rle) {
    const perlu = jumlah * bytePerPiksel;
    if (b.length - pos < perlu) throw new Error('Data gambar terpotong.');
    for (let i = 0; i < jumlah; i++) tulisPiksel(i, pos + i * bytePerPiksel);
  } else {
    let i = 0;
    while (i < jumlah) {
      if (pos >= b.length) throw new Error('Data RLE terpotong.');
      const header = b[pos++];
      const hitung = (header & 0x7F) + 1;
      if (header & 0x80) {
        // Paket jalan (run): satu piksel diulang.
        if (pos + bytePerPiksel > b.length) throw new Error('Data RLE terpotong.');
        for (let k = 0; k < hitung && i < jumlah; k++) { tulisPiksel(i, pos); i++; }
        pos += bytePerPiksel;
      } else {
        // Paket mentah: hitung piksel berbeda.
        if (pos + hitung * bytePerPiksel > b.length) throw new Error('Data RLE terpotong.');
        for (let k = 0; k < hitung && i < jumlah; k++) { tulisPiksel(i, pos + k * bytePerPiksel); i++; }
        pos += hitung * bytePerPiksel;
      }
    }
  }
  return { lebar, tinggi, rgba, format: 'TGA tipe ' + tipe + ', ' + kedalaman + ' bit' };
}

export function render(root) {
  const fi = fileInput('.tga,.ppm,.pgm,.pnm');
  fi.multiple = true;
  const infoBox = T.out();
  const hasilBox = T.out();
  const statusBox = T.out();
  const MAKS = 10;

  fi.addEventListener('change', async () => {
    const files = [...(fi.files || [])].slice(0, MAKS);
    if (!files.length) return;
    T.hide(hasilBox); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membaca file…</span>');
    const hasil = [];
    let gagal = 0;
    for (const f of files) {
      try {
        const buf = new Uint8Array(await f.arrayBuffer());
        const nama = (f.name || '').toLowerCase();
        const gambar = nama.endsWith('.tga') ? decodeTga(buf) : decodePpm(buf);
        hasil.push({ file: f, gambar });
      } catch (e) {
        gagal++;
        hasil.push({ file: f, error: e && e.message ? e.message : 'Gagal dibaca.' });
      }
    }
    T.hide(statusBox);
    T.show(hasilBox, '');
    if (gagal) T.show(infoBox, `<p class="dim" style="font-size:13px">${gagal} file tidak bisa dibaca, dilewati. Lihat keterangan di bawah tiap file.</p>`);
    for (const h of hasil) {
      const kartu = T.el('<div style="margin:12px 0"></div>');
      if (h.error) {
        kartu.appendChild(T.el(`<p style="margin:0"><b>${T.esc(h.file.name)}</b></p><div class="err">${T.esc(h.error)}</div>`));
        hasilBox.appendChild(kartu);
        continue;
      }
      const { lebar, tinggi, rgba, format } = h.gambar;
      const c = document.createElement('canvas');
      c.width = lebar; c.height = tinggi;
      const ctx = c.getContext('2d');
      ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), lebar, tinggi), 0, 0);
      c.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block';
      const nama = (h.file.name || 'gambar').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'gambar';
      const dlB = T.btn(`Unduh ${nama}.png`, async () => {
        const blob = await canvasToBlob(c, 'image/png');
        if (!blob) { T.toast('Gagal membuat PNG.'); return; }
        T.dl(`${nama}.png`, blob, 'image/png');
      });
      dlB.classList.add('small');
      kartu.appendChild(T.el(`<p style="margin:0 0 6px"><b>${T.esc(h.file.name)}</b> <span class="dim">(${lebar}×${tinggi}, ${T.esc(format)})</span></p>`));
      kartu.appendChild(c);
      kartu.appendChild(dlB);
      hasilBox.appendChild(kartu);
    }
    if ((fi.files || []).length > MAKS) T.toast(`Hanya ${MAKS} file pertama yang diproses.`);
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">File TGA biasa dipakai di game dan grafis 3D, file PPM/PGM adalah format gambar sederhana. Keduanya diubah jadi PNG yang bisa dibuka di mana saja. Bisa banyak file sekaligus (maksimal 10).</p>'));
  root.appendChild(T.field('Pilih file TGA, PPM, atau PGM', fi));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + ' TGA berpeta warna (colormap) belum didukung.</p>'));
}
