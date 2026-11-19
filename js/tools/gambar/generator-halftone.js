import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Generator Halftone: ubah foto jadi titik-titik seperti cetakan
// koran jadul. Tiap sel foto diukur terangnya, lalu diganti satu
// titik: makin gelap makin besar titiknya. BEDA dari Efek Dithering
// (efek-dithering.js) yang menyebar piksel hitam-putih pola
// Floyd-Steinberg; halftone memakai titik bundar berukuran beda.
export const meta = {"id": "generator-halftone", "name": "Generator Halftone", "cat": "gambar", "icon": "⚫", "desc": "Ubah foto jadi titik-titik halftone ala cetakan koran jadul.", "keywords": "halftone,titik,foto,cetakan,koran,retro,efek", "since": "6.19.0"};

// Hitung daftar titik dari data piksel RGBA (murni, bisa diuji tanpa
// DOM). mode: 'bw' = titik hitam di latar putih, 'warna' = titik
// berwarna rata-rata sel, 'cmyk' = empat titik kecil per sel
// (cyan, magenta, yellow, hitam) yang digeser sedikit.
export function hitungHalftone(data, lebar, tinggi, ukuranSel, mode) {
  const sel = Math.max(2, Math.round(ukuranSel) || 8);
  const titik = [];
  const maksR = sel * 0.72;
  for (let y0 = 0; y0 < tinggi; y0 += sel) {
    for (let x0 = 0; x0 < lebar; x0 += sel) {
      let r = 0, g = 0, b = 0, n = 0;
      const y1 = Math.min(tinggi, y0 + sel), x1 = Math.min(lebar, x0 + sel);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * lebar + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
      }
      if (!n) continue;
      r /= n; g /= n; b /= n;
      const cx = x0 + (x1 - x0) / 2, cy = y0 + (y1 - y0) / 2;
      if (mode === 'warna') {
        const terang = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const rad = Math.max(0, (1 - terang) * maksR);
        if (rad > 0.4) titik.push({ x: cx, y: cy, r: rad, warna: [Math.round(r), Math.round(g), Math.round(b)] });
      } else if (mode === 'cmyk') {
        const c = 1 - r / 255, m = 1 - g / 255, yv = 1 - b / 255;
        const k = Math.min(c, m, yv);
        const geser = sel * 0.18;
        const kanal = [
          [c - k, [0, 174, 239], -geser, -geser],
          [m - k, [236, 0, 140], geser, -geser],
          [yv - k, [255, 242, 0], -geser, geser],
          [k, [0, 0, 0], geser, geser],
        ];
        for (const [nilai, warna, dx, dy] of kanal) {
          const rad = Math.max(0, nilai * sel * 0.42);
          if (rad > 0.4) titik.push({ x: cx + dx, y: cy + dy, r: rad, warna });
        }
      } else {
        const terang = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const rad = Math.max(0, (1 - terang) * maksR);
        if (rad > 0.4) titik.push({ x: cx, y: cy, r: rad, warna: [0, 0, 0] });
      }
    }
  }
  return titik;
}

export function render(root) {
  const fi = fileInput('image/*');
  const modeSel = T.select([
    ['bw', 'Hitam putih'],
    ['warna', 'Warna'],
    ['cmyk', 'CMYK (warna cetak)'],
  ], 'bw');
  const selR = T.el('<input type="range" min="4" max="24" value="10" class="inp">');
  const selV = T.el('<span class="hint" style="min-width:44px;text-align:right">10px</span>');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let img = null;

  function make() {
    T.hide(infoBox); T.hide(box);
    if (!img) return;
    const maksSisi = 1600;
    const s = Math.min(1, maksSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tx = tmp.getContext('2d');
    tx.drawImage(img, 0, 0, w, h);
    const data = tx.getImageData(0, 0, w, h).data;
    const titik = hitungHalftone(data, w, h, +selR.value, modeSel.value);
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    for (const t of titik) {
      ctx.fillStyle = 'rgb(' + t.warna[0] + ',' + t.warna[1] + ',' + t.warna[2] + ')';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
    }
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + w + 'x' + h + ' px</b></div>' +
      '<div class="kv"><span>Jumlah titik</span><b>' + titik.length.toLocaleString('id-ID') + '</b></div>');
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Halftone jadi!');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-halftone.png', blob, 'image/png');
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  modeSel.addEventListener('change', make);
  selR.addEventListener('input', () => { selV.textContent = selR.value + 'px'; make(); });

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Foto diubah jadi titik-titik bundar. Bagian gelap jadi titik besar, bagian terang jadi titik kecil atau kosong.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Gaya', modeSel), T.field('Ukuran sel', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(selR); w.appendChild(selV); return w; })(), 'Sel kecil = detail lebih kelihatan.')));
  root.appendChild(T.row(T.btn('Buat Halftone', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
