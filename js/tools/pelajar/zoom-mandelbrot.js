import { h as T, utils } from '../../core.js';

export const meta = {"id": "zoom-mandelbrot", "name": "Zoom Mandelbrot", "cat": "pelajar", "icon": "🌀", "desc": "Jelajahi himpunan Mandelbrot: ketuk untuk memperbesar, lihat pola yang berulang tanpa habis.", "keywords": "mandelbrot,fraktal,zoom,bilangan kompleks,matematika,canvas", "since": "6.19.0"};

// Iterasi z = z^2 + c dari z = 0. Kembalikan iterasi saat |z| > 2,
// atau maks bila tidak pernah lepas (titik di dalam himpunan).
export function iterasiMandelbrot(cx, cy, maks) {
  let zx = 0, zy = 0;
  for (let n = 1; n <= maks; n++) {
    const zx2 = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = zx2;
    if (zx * zx + zy * zy > 4) return n;
  }
  return maks;
}

// Pewarnaan halus (continuous coloring) untuk gradasi mulus.
export function warnaMandelbrot(cx, cy, maks) {
  let zx = 0, zy = 0, n = 0;
  for (; n < maks; n++) {
    const zx2 = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = zx2;
    if (zx * zx + zy * zy > 4) break;
  }
  if (n >= maks) return [18, 16, 13]; // di dalam himpunan: arang
  const logZn = Math.log(zx * zx + zy * zy) / 2;
  const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
  const t = (n + 1 - nu) / maks;
  // FIX D-QA2-01: t bisa NEGATIF saat titik lepas di n=0 dengan |c| besar
  // (nu > 1 -> t < 0 -> seg = -1 -> palet[-1] = undefined -> crash a[0]).
  // Clamp ke [0, 1): palet siklik (palet[0]==palet[3]) jadi clamp kontinu,
  // titik lepas tercepat mendapat warna awal palet. t valid [0,1) tak berubah.
  const tc = Math.min(Math.max(t, 0), 1 - 1e-9);
  // palet arang -> koral -> krem -> biru redup
  const h = tc * 3;
  const seg = Math.floor(h) % 3;
  const f = h - Math.floor(h);
  const palet = [[255, 122, 102], [245, 240, 230], [122, 162, 232], [255, 122, 102]];
  const a = palet[seg], b = palet[seg + 1];
  return [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
}

export function render(root) {
  const LEBAR = 360, TINGGI = 260;
  let cx = -0.5, cy = 0, skala = 3.2; // lebar tampilan dalam satuan kompleks
  let maks = 100;

  const canvas = document.createElement('canvas');
  canvas.width = LEBAR;
  canvas.height = TINGGI;
  canvas.style.cssText = 'width:100%;max-width:360px;height:auto;display:block;background:#12100d;border:1px solid #2e2823;border-radius:8px;cursor:zoom-in;touch-action:manipulation';
  const ctx = canvas.getContext('2d');
  const stat = T.out();
  const iterI = T.select([['50', '50 iterasi (cepat)'], ['100', '100 iterasi'], ['200', '200 iterasi'], ['500', '500 iterasi (detail)']], '100');

  const gambar = () => {
    const t0 = performance.now();
    const img = ctx.createImageData(LEBAR, TINGGI);
    const data = img.data;
    const x0 = cx - skala / 2;
    const y0 = cy - (skala * TINGGI / LEBAR) / 2;
    for (let py = 0; py < TINGGI; py++) {
      const im = y0 + (py / TINGGI) * (skala * TINGGI / LEBAR);
      for (let px = 0; px < LEBAR; px++) {
        const re = x0 + (px / LEBAR) * skala;
        const [r, g, b] = warnaMandelbrot(re, im, maks);
        const i = (py * LEBAR + px) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const ms = Math.round(performance.now() - t0);
    const zoom = (3.2 / skala).toFixed(skala < 0.01 ? 1 : 0);
    T.show(stat, '<p class="dim">Tengah: ' + cx.toFixed(6) + ' + ' + cy.toFixed(6) + 'i · Perbesaran ×' + zoom + ' · ' + maks + ' iterasi · digambar dalam ' + ms + ' ms. Ketuk gambar untuk memperbesar 2× di titik itu.</p>');
  };

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) * (LEBAR / r.width);
    const py = (e.clientY - r.top) * (TINGGI / r.height);
    cx = cx - skala / 2 + (px / LEBAR) * skala;
    cy = cy - (skala * TINGGI / LEBAR) / 2 + (py / TINGGI) * (skala * TINGGI / LEBAR);
    skala /= 2;
    gambar();
  });

  const tombolKeluar = T.btn('Perkecil (½×)', () => { skala *= 2; gambar(); });
  const tombolReset = T.btn('Ulang dari awal', () => { cx = -0.5; cy = 0; skala = 3.2; gambar(); });
  iterI.addEventListener('change', () => { maks = Number(iterI.value); gambar(); });

  root.appendChild(T.el('<p class="note">Setiap titik diwarnai dari seberapa cepat bilangan kompleksnya "lepas" saat diulang z = z² + c. Titik hitam tidak pernah lepas. Itulah himpunan Mandelbrot. Perbesar terus, polanya berulang tanpa habis.</p>'));
  root.appendChild(T.grid2(T.field('Kedalaman iterasi', iterI)));
  root.appendChild(canvas);
  root.appendChild(T.row(tombolKeluar, tombolReset));
  root.appendChild(stat);
  gambar();
}
