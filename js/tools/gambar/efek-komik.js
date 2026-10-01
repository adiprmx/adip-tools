import { h as T, utils, beep, actx, onLeave, loadImage, fileInput, canvasToBlob, LOCAL_NOTE, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "efek-komik", "name": "Efek Komik", "cat": "gambar", "icon": "💥", "desc": "Ubah foto jadi gaya komik: kontras tegas + halftone + outline.", "keywords": "komik,halftone,foto,efek,posterize"};

// Matriks Bayer 4x4 untuk dithering halftone ala cetakan komik
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Fungsi murni (bisa diuji tanpa canvas): px = Uint8ClampedArray RGBA.
// 1) naikkan kontras, 2) posterize 4 level per channel + dither Bayer,
// 3) outline hitam dari deteksi tepi luminance.
export function komikize(px, w, h) {
  const out = new Uint8ClampedArray(px.length);
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  const LEV = 4, step = 255 / (LEV - 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      for (let c = 0; c < 3; c++) {
        let v = (px[p + c] - 128) * 1.7 + 128; // kontras tegas
        v = Math.max(0, Math.min(255, v));
        let q = Math.round(v / step) * step;   // posterize
        const t = (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * step * 0.9; // halftone
        out[p + c] = Math.max(0, Math.min(255, q + t));
      }
      out[p + 3] = 255;
      const xr = x < w - 1 ? x + 1 : x, yb = y < h - 1 ? y + 1 : y;
      const g = Math.abs(lum[i] - lum[y * w + xr]) + Math.abs(lum[i] - lum[yb * w + x]);
      if (g > 48) { out[p] = 0; out[p + 1] = 0; out[p + 2] = 0; } // outline tepi
    }
  }
  return out;
}

export function render(root) {
  const fi = fileInput('image/*');
  const box = T.out();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;border-radius:10px;border:1px solid #ffffff20;display:block;margin-top:10px';
  let ada = false;

  const pilihBtn = T.btn('📁 Pilih Gambar', () => fi.click(), true);
  const prosesBtn = T.btn('💥 Jadikan Komik', () => proses(), false, true);
  const dlBtn = T.btn('⬇ Unduh PNG', async () => {
    if (!ada) { T.toast('Pilih gambar dulu'); return; }
    const blob = await canvasToBlob(canvas, 'image/png');
    if (blob) T.dl('efek-komik.png', blob, 'image/png');
  });

  fi.addEventListener('change', () => { if (fi.files[0]) { prosesBtn.disabled = false; proses(); } });

  async function proses() {
    const f = fi.files[0];
    if (!f) { T.toast('Pilih gambar dulu'); return; }
    let img;
    try { img = await loadImage(f); } catch (e) { T.show(box, errBox('File bukan gambar yang valid.')); return; }
    const s = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * s));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * s));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasil = komikize(id.data, canvas.width, canvas.height);
    ctx.putImageData(new ImageData(hasil, canvas.width, canvas.height), 0, 0);
    ada = true;
    T.show(box, '');
    box.appendChild(canvas);
    try { beep(660, 0.08, 'sine'); } catch (e) {}
  }

  root.append(
    T.el('<p class="dim" style="font-size:13px">Upload foto → diproses jadi gaya komik ala cetakan: warna posterize, titik halftone, dan garis outline tebal.</p>'),
    T.row(pilihBtn, prosesBtn, dlBtn),
    box,
    T.el('<p class="dim" style="font-size:12px;margin-top:10px">🔒 ' + T.esc(LOCAL_NOTE) + '</p>')
  );
}
