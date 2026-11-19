import { h as T, LOCAL_NOTE, fileInput, fmtBytes, utils } from '../../core.js';

// Ubah DPI Foto: ubah angka DPI (titik per inci) yang tersimpan di file
// JPG atau PNG. DPI hanya memengaruhi ukuran cetak, bukan jumlah piksel:
// foto 3000×2000 px di 300 DPI tercetak 25,4×16,9 cm, di 72 DPI tercetak
// 105,8×70,6 cm. Piksel tidak digambar ulang.
// JPG: angka ditulis ke segmen JFIF (APP0). PNG: ditulis ke chunk pHYs.
export const meta = {"id": "ubah-dpi-foto", "name": "Ubah DPI Foto", "cat": "gambar", "icon": "🖨️", "desc": "Ubah DPI foto untuk keperluan cetak, tanpa mengubah pikselnya.", "keywords": "dpi,resolusi,cetak,print,ppi,jpg,png", "since": "6.19.0"};

// DPI -> piksel per meter (PNG pHYs memakai satuan ini). Fungsi murni.
export function dpiKePikselPerMeter(dpi) { return Math.round(dpi * 100 / 2.54); }
export function pikselPerMeterKeDpi(ppm) { return ppm * 2.54 / 100; }

// Ukuran cetak dalam cm dari piksel dan DPI. Fungsi murni.
export function ukuranCetakCm(piksel, dpi) { return piksel / dpi * 2.54; }

// CRC32 PNG memakai crc32() core (polinomial 0xEDB88320, sama persis);
// chunk PNG memakai utils.buatChunkPng (kanonis, G4 C1G4-R).
export { crc32 } from '../../core.js';

// ---------- JPEG (JFIF APP0) ----------
function pindaiSegmenJpeg(b) {
  // Kembalikan daftar segmen sebelum SOS: [{marker, awal, akhir}].
  const daftar = [];
  let i = 2;
  while (i + 1 < b.length) {
    if (b[i] !== 0xFF) break;
    let j = i + 1;
    while (j < b.length && b[j] === 0xFF) j++;
    if (j >= b.length) break;
    const marker = b[j];
    if (marker === 0xD9 || marker === 0xDA) break;
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i = j + 1; continue; }
    if (j + 2 >= b.length) break;
    const len = (b[j + 1] << 8) | b[j + 2];
    const segEnd = j + 1 + len;
    if (len < 2 || segEnd > b.length) break;
    daftar.push({ marker, awal: i, akhir: segEnd, dataAwal: j + 3 });
    i = segEnd;
  }
  return daftar;
}

function bacaJfif(b) {
  for (const s of pindaiSegmenJpeg(b)) {
    if (s.marker !== 0xE0) continue;
    const d = s.dataAwal;
    if (b[d] === 0x4A && b[d + 1] === 0x46 && b[d + 2] === 0x49 && b[d + 3] === 0x46 && b[d + 4] === 0) {
      return { seg: s, satuan: b[d + 7], x: (b[d + 8] << 8) | b[d + 9], y: (b[d + 10] << 8) | b[d + 11] };
    }
  }
  return null;
}

export function ubahDpiJpeg(bytes, dpi) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) throw new Error('Bukan file JPEG.');
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  if (!Number.isFinite(d)) throw new Error('DPI tidak valid.');
  const jfif = bacaJfif(b);
  if (jfif) {
    const salin = new Uint8Array(b);
    const dd = jfif.seg.dataAwal;
    salin[dd + 7] = 1; // satuan: titik per inci
    salin[dd + 8] = (d >> 8) & 255; salin[dd + 9] = d & 255;
    salin[dd + 10] = (d >> 8) & 255; salin[dd + 11] = d & 255;
    return salin;
  }
  // Tidak ada segmen JFIF: sisipkan APP0 baru persis setelah SOI.
  const app0 = new Uint8Array([0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, (d >> 8) & 255, d & 255, (d >> 8) & 255, d & 255, 0x00, 0x00]);
  const keluar = new Uint8Array(b.length + app0.length);
  keluar.set(b.subarray(0, 2), 0);
  keluar.set(app0, 2);
  keluar.set(b.subarray(2), 2 + app0.length);
  return keluar;
}

export function bacaDpiJpeg(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8) return null;
  const jfif = bacaJfif(b);
  if (!jfif || jfif.x === 0) return null;
  if (jfif.satuan === 1) return jfif.x; // titik per inci
  if (jfif.satuan === 2) return Math.round(jfif.x * 2.54); // titik per cm -> DPI
  return null; // satuan 0: tanpa satuan, bukan DPI
}

// ---------- PNG (chunk pHYs) ----------
function pindaiChunkPng(b) {
  const daftar = [];
  let i = 8;
  while (i + 8 <= b.length) {
    const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const tipe = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
    if (i + 12 + len > b.length) break;
    daftar.push({ tipe, awal: i, akhir: i + 12 + len, dataAwal: i + 8, panjang: len });
    i += 12 + len;
  }
  return daftar;
}


export function ubahDpiPng(bytes, dpi) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 8 || b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4E || b[3] !== 0x47) throw new Error('Bukan file PNG.');
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  if (!Number.isFinite(d)) throw new Error('DPI tidak valid.');
  const ppm = dpiKePikselPerMeter(d);
  const data = new Uint8Array(9);
  const dv = new DataView(data.buffer);
  dv.setUint32(0, ppm);
  dv.setUint32(4, ppm);
  data[8] = 1; // satuan meter
  const chunk = utils.buatChunkPng('pHYs', data);
  const daftar = pindaiChunkPng(b);
  const lama = daftar.find((c) => c.tipe === 'pHYs');
  if (lama) {
    const keluar = new Uint8Array(b.length - (lama.akhir - lama.awal) + chunk.length);
    keluar.set(b.subarray(0, lama.awal), 0);
    keluar.set(chunk, lama.awal);
    keluar.set(b.subarray(lama.akhir), lama.awal + chunk.length);
    return keluar;
  }
  const idat = daftar.find((c) => c.tipe === 'IDAT');
  const pos = idat ? idat.awal : b.length;
  const keluar = new Uint8Array(b.length + chunk.length);
  keluar.set(b.subarray(0, pos), 0);
  keluar.set(chunk, pos);
  keluar.set(b.subarray(pos), pos + chunk.length);
  return keluar;
}

export function bacaDpiPng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 8 || b[0] !== 0x89) return null;
  const daftar = pindaiChunkPng(b);
  const c = daftar.find((x) => x.tipe === 'pHYs');
  if (!c || c.panjang < 9) return null;
  if (b[c.dataAwal + 8] !== 1) return null; // satuan bukan meter
  const ppm = ((b[c.dataAwal] << 24) | (b[c.dataAwal + 1] << 16) | (b[c.dataAwal + 2] << 8) | b[c.dataAwal + 3]) >>> 0;
  if (!ppm) return null;
  return Math.round(pikselPerMeterKeDpi(ppm));
}

// Baca ukuran piksel PNG (chunk IHDR) tanpa decode penuh. Fungsi murni.
export function bacaUkuranPng(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 24 || b[0] !== 0x89) return null;
  const w = ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0;
  const h = ((b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]) >>> 0;
  return { lebar: w, tinggi: h };
}

export function render(root) {
  const fi = fileInput('image/jpeg,image/png,.jpg,.jpeg,.png');
  const dpiSel = T.select([['72', '72 DPI (layar)'], ['150', '150 DPI (cetak biasa)'], ['300', '300 DPI (cetak bagus)'], ['600', '600 DPI (cetak sangat halus)'], ['kustom', 'Angka sendiri…']], '300');
  const dpiIn = T.input('text', '300', '300');
  dpiIn.inputMode = 'numeric';
  dpiIn.style.display = 'none';
  const infoBox = T.out();
  const hasilBox = T.out();
  const statusBox = T.out();
  let fileObj = null, nama = 'foto', jenis = '', ukuran = null, dpiLama = null;

  dpiSel.addEventListener('change', () => { dpiIn.style.display = dpiSel.value === 'kustom' ? '' : 'none'; });

  const prosesB = T.btn('Ubah DPI', async () => {
    if (!fileObj) { T.toast('Pilih dulu fotonya.'); return; }
    const dpi = dpiSel.value === 'kustom' ? utils.parseNum(dpiIn.value, NaN) : parseInt(dpiSel.value, 10);
    if (!Number.isFinite(dpi) || dpi < 1 || dpi > 10000) {
      T.show(hasilBox, '<div class="err">DPI harus angka 1 sampai 10000.</div>');
      return;
    }
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Menulis DPI…</span>');
    try {
      const buf = new Uint8Array(await fileObj.arrayBuffer());
      const hasil = jenis === 'png' ? ubahDpiPng(buf, dpi) : ubahDpiJpeg(buf, dpi);
      const cek = jenis === 'png' ? bacaDpiPng(hasil) : bacaDpiJpeg(hasil);
      T.hide(statusBox);
      const fmtCm = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
      const cetak = ukuran ? ` Ukuran cetaknya sekarang ${fmtCm(ukuranCetakCm(ukuran.lebar, dpi))} × ${fmtCm(ukuranCetakCm(ukuran.tinggi, dpi))} cm.` : '';
      T.show(hasilBox, '');
      const info = T.el(`<p style="margin:0 0 8px">DPI foto sekarang ${cek === null ? dpi : cek}.${cetak}</p>`);
      const dlB = T.btn(`Unduh foto (${fmtBytes(hasil.length)})`, () => {
        T.dl(`${nama}-${dpi}dpi.${jenis}`, hasil, jenis === 'png' ? 'image/png' : 'image/jpeg');
      }, true);
      hasilBox.appendChild(info); hasilBox.appendChild(dlB);
    } catch (e) {
      T.hide(statusBox);
      T.show(hasilBox, '<div class="err">' + T.esc(e && e.message ? e.message : 'Gagal mengubah DPI.') + '</div>');
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
      dpiLama = jenis === 'png' ? bacaDpiPng(buf) : bacaDpiJpeg(buf);
      ukuran = jenis === 'png' ? bacaUkuranPng(buf) : null;
      if (!ukuran) {
        const img = await new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = () => rej(new Error('gagal'));
          im.src = URL.createObjectURL(f);
        });
        ukuran = { lebar: img.naturalWidth, tinggi: img.naturalHeight };
      }
      T.hide(statusBox);
      const fmtCm = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
      const cetakLama = dpiLama ? ` Ukuran cetaknya sekarang ${fmtCm(ukuranCetakCm(ukuran.lebar, dpiLama))} × ${fmtCm(ukuranCetakCm(ukuran.tinggi, dpiLama))} cm.` : '';
      T.show(infoBox, `<p class="dim" style="font-size:13px">Foto ${ukuran.lebar}×${ukuran.tinggi} px. DPI sekarang: ${dpiLama === null ? 'tidak tertulis di file' : dpiLama + ' DPI'}.${cetakLama}</p>`);
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibaca.</div>');
    }
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">DPI menentukan seberapa besar foto tercetak di kertas. Mengubah DPI tidak menambah atau mengurangi piksel, jadi kualitas foto tetap sama. Percetakan biasanya minta 300 DPI.</p>'));
  root.appendChild(T.field('Pilih foto (JPG atau PNG)', fi));
  root.appendChild(infoBox);
  root.appendChild(T.field('DPI baru', dpiSel));
  root.appendChild(T.field('DPI sendiri', dpiIn, 'Hanya dipakai bila pilihan di atas "Angka sendiri".'));
  root.appendChild(statusBox);
  root.appendChild(prosesB);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + '</p>'));
}
