import { h as T, utils, fileInput, loadImage, canvasToBlob, LOCAL_NOTE } from '../../core.js?v=6.12.2';

// Logika murni (bisa di-test di Node): dithering Floyd-Steinberg pada array abu-abu.
// data: Uint8ClampedArray nilai 0-255, w x h. level: jumlah tingkat (2 = 1-bit).
utils.dither = function (data, w, h, level) {
  const out = new Uint8ClampedArray(data.length);
  const buf = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) buf[i] = data[i];
  const langkah = 255 / (level - 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const lama = buf[i];
      const baru = Math.round(lama / langkah) * langkah;
      out[i] = baru;
      const err = lama - baru;
      if (x + 1 < w) buf[i + 1] += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0) buf[i + w - 1] += err * 3 / 16;
        buf[i + w] += err * 5 / 16;
        if (x + 1 < w) buf[i + w + 1] += err * 1 / 16;
      }
    }
  }
  return out;
};
utils.PALET_DITHER = {
  '1bit': { nama: 'Hitam putih 1-bit', warna: [[0, 0, 0], [255, 255, 255]] },
  gameboy: { nama: 'Game Boy (4 hijau)', warna: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]] },
  sepia: { nama: 'Sepia 4 tingkat', warna: [[43, 30, 18], [111, 78, 55], [181, 140, 100], [240, 220, 190]] }
};

export const meta = {"id": "efek-dithering", "name": "Efek Dithering Foto", "cat": "gambar", "icon": "👾", "desc": "Ubah foto jadi gaya retro 1-bit atau Game Boy.", "keywords": "dithering,retro,game boy,1-bit,pixel,foto,efek", "since": "6.11.0"};

export function render(root) {
  const fileI = fileInput('image/*');
  const palet = T.select(Object.keys(utils.PALET_DITHER).map((k) => [k, utils.PALET_DITHER[k].nama]), '1bit');
  const skala = document.createElement('input');
  skala.type = 'range'; skala.min = '25'; skala.max = '100'; skala.value = '50';
  skala.style.cssText = 'width:100%';
  const labelSkala = T.el('<div style="font-size:13px;color:#a1a1aa;margin-top:4px">Ukuran detail: 50% (semakin kecil, semakin kasar titiknya)</div>');
  const box = T.out();
  const kanvas = document.createElement('canvas');
  kanvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:8px;margin-top:12px;image-rendering:pixelated';
  let imgAsli = null;

  skala.addEventListener('input', () => {
    labelSkala.textContent = 'Ukuran detail: ' + skala.value + '% (semakin kecil, semakin kasar titiknya)';
    if (imgAsli) proses();
  });
  palet.addEventListener('change', () => { if (imgAsli) proses(); });

  async function proses() {
    if (!imgAsli) return;
    const persen = Number(skala.value) / 100;
    const w = Math.max(8, Math.round(imgAsli.naturalWidth * persen));
    const h = Math.max(8, Math.round(imgAsli.naturalHeight * persen));
    const kecil = document.createElement('canvas');
    kecil.width = w; kecil.height = h;
    const kctx = kecil.getContext('2d');
    kctx.drawImage(imgAsli, 0, 0, w, h);
    const dataImg = kctx.getImageData(0, 0, w, h);
    const abu = new Uint8ClampedArray(w * h);
    for (let i = 0; i < w * h; i++) {
      const r = dataImg.data[i * 4], g = dataImg.data[i * 4 + 1], b = dataImg.data[i * 4 + 2];
      abu[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    const warna = utils.PALET_DITHER[palet.value].warna;
    const hasil = utils.dither(abu, w, h, warna.length);
    kanvas.width = imgAsli.naturalWidth;
    kanvas.height = imgAsli.naturalHeight;
    const ctx = kanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    const outImg = tctx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const idx = Math.round((hasil[i] / 255) * (warna.length - 1));
      const c = warna[idx];
      outImg.data[i * 4] = c[0]; outImg.data[i * 4 + 1] = c[1]; outImg.data[i * 4 + 2] = c[2]; outImg.data[i * 4 + 3] = 255;
    }
    tctx.putImageData(outImg, 0, 0);
    ctx.drawImage(tmp, 0, 0, kanvas.width, kanvas.height);
    T.show(box, '<div class="hint">Selesai. Ubah palet atau ukuran detail untuk mencoba gaya lain.</div>');
  }

  fileI.addEventListener('change', async () => {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    try { imgAsli = await loadImage(f); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    proses();
  });

  root.appendChild(T.el(`<p class="note">${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.field('Palet warna', palet));
  root.appendChild(T.field('Ukuran detail', skala));
  root.appendChild(labelSkala);
  root.appendChild(T.row(
    T.btn('Unduh hasil', async () => {
      if (!kanvas.width) { T.toast('Pilih foto dulu'); return; }
      const blob = await canvasToBlob(kanvas, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('foto-dithering.png', blob, 'image/png');
      T.toast('Gambar berhasil diunduh');
    }, true)
  ));
  root.appendChild(box);
  root.appendChild(kanvas);
}
