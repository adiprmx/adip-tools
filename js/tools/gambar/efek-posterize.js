import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Efek Posterize: kurangi jumlah warna foto jadi beberapa tingkat saja,
// hasilnya mirip poster cetak. Tiap kanal warna dibulatkan ke tingkat
// terdekat. Dithering Bayer opsional menghaluskan peralihan warna.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "efek-posterize", "name": "Efek Posterize", "cat": "gambar", "icon": "🎨", "desc": "Kurangi warna foto jadi beberapa tingkat saja, hasilnya mirip poster.", "keywords": "posterize,poster,warna,level,efek foto", "since": "6.19.0"};

// Matriks Bayer 4x4 untuk dithering teratur (nilai 0..15).
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

// Posterize pada data piksel RGBA. Kembalikan array baru.
// level 2..16: jumlah tingkat warna per kanal.
// dither true = tambah pola Bayer supaya peralihan warna lebih halus.
export function efekPosterize(data, w, h, level, dither) {
  const lv = Math.max(2, Math.min(16, Math.round(level == null ? 4 : level)));
  const langkah = 255 / (lv - 1);
  const keluar = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const geser = dither ? ((BAYER4[y & 3][x & 3] + 0.5) / 16 - 0.5) * langkah : 0;
      for (let c = 0; c < 3; c++) {
        keluar[j + c] = Math.round(Math.round((data[j + c] + geser) / langkah) * langkah);
      }
      keluar[j + 3] = data[j + 3];
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const ditherSel = T.select([['ya', 'Ya, haluskan'], ['tidak', 'Tidak, tegas saja']], 'tidak');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const levelR = T.input('range');
  levelR.min = '2'; levelR.max = '16'; levelR.value = '4';
  const levelV = T.el('<b>4 tingkat</b>');
  const levelWrap = T.el('<div class="row" style="align-items:center"></div>');
  levelWrap.appendChild(levelR); levelWrap.appendChild(levelV);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let tampilAsli = false;
  let raf = 0;

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    if (tampilAsli) {
      pratinjauCtx.putImageData(dataAsli, 0, 0);
      return;
    }
    const hasil = efekPosterize(dataAsli.data, dataAsli.width, dataAsli.height, parseInt(levelR.value, 10), ditherSel.value === 'ya');
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  function kembaliKeHasil() {
    if (tampilAsli) { tampilAsli = false; lihatB.textContent = 'Lihat foto asli'; }
  }
  levelR.addEventListener('input', () => { levelV.textContent = levelR.value + ' tingkat'; kembaliKeHasil(); jadwalPratinjau(); });
  ditherSel.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      const skala = Math.min(1, 800 / Math.max(nw, nh));
      const w = Math.max(1, Math.round(nw * skala));
      const h = Math.max(1, Math.round(nh * skala));
      pratinjau = document.createElement('canvas');
      pratinjau.width = w; pratinjau.height = h;
      pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      pratinjauCtx = pratinjau.getContext('2d', { willReadFrequently: true });
      pratinjauCtx.drawImage(img, 0, 0, w, h);
      dataAsli = pratinjauCtx.getImageData(0, 0, w, h);
      tampilAsli = false;
      lihatB.textContent = 'Lihat foto asli';
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(pratinjau);
      unduhB.disabled = false;
      lihatB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
      lihatB.disabled = true;
    }
  });

  async function unduh() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    unduhB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan hasil…</span>');
    try {
      const c = document.createElement('canvas');
      c.width = nw; c.height = nh;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, nw, nh);
      const data = ctx.getImageData(0, 0, nw, nh);
      const hasil = efekPosterize(data.data, nw, nh, parseInt(levelR.value, 10), ditherSel.value === 'ya');
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      // JPEG tidak punya transparansi: timpa di atas latar putih supaya
      // bagian tembus pandang tidak jadi hitam (pola banding-foto).
      let sumber = c;
      if (mime === 'image/jpeg') {
        const putih = document.createElement('canvas');
        putih.width = c.width; putih.height = c.height;
        const px = putih.getContext('2d');
        px.fillStyle = '#ffffff'; px.fillRect(0, 0, c.width, c.height);
        px.drawImage(c, 0, 0);
        sumber = putih;
      }
      const blob = await canvasToBlob(sumber, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(namaFile + '-posterize.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const lihatB = T.btn('Lihat foto asli', () => {
    if (!img) return;
    tampilAsli = !tampilAsli;
    lihatB.textContent = tampilAsli ? 'Lihat hasil' : 'Lihat foto asli';
    gambarPratinjau();
  }, false, true);
  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Jumlah tingkat warna', levelWrap, 'Makin sedikit tingkatnya, makin tegas gaya posternya. 2 tingkat paling berani, 16 tingkat hampir seperti foto biasa.'));
  root.appendChild(T.field('Haluskan peralihan warna (dithering)', ditherSel, 'Pola titik halus supaya warna yang berdekatan tidak terlihat belang.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
