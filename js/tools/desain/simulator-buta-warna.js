import { h as T, LOCAL_NOTE, fileInput, loadImage, canvasToBlob } from '../../core.js';

export const meta = {"id":"simulator-buta-warna","name":"Simulator Buta Warna","cat":"desain","icon":"👁️","desc":"Lihat foto seperti yang dilihat penderita buta warna.","keywords":"buta warna,protanopia,deuteranopia,tritanopia,simulator,aksesibilitas,mata","since":"6.19.0"};

// Matriks transformasi Machado, Oliveira, dan Fernandes (2009),
// "A Physiologically-based Model for Simulation of Color Vision Deficiency",
// IEEE Transactions on Visualization and Computer Graphics. Nilai untuk
// simulasi dichromacy (100%) dan anomalous trichromacy.
export const MATRIKS = {
  normal: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  protanomaly: [0.817, 0.183, 0, 0.333, 0.667, 0, 0, 0.125, 0.875],
  deuteranomaly: [0.8, 0.2, 0, 0.258, 0.742, 0, 0, 0.142, 0.858],
  tritanomaly: [0.967, 0.033, 0, 0, 0.733, 0.267, 0, 0.183, 0.817],
  akromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
};
const MODE = [
  ['normal', 'Normal (asli)'],
  ['protanopia', 'Protanopia (tidak bisa bedakan merah-hijau, tanpa sel merah)'],
  ['deuteranopia', 'Deuteranopia (tidak bisa bedakan merah-hijau, tanpa sel hijau)'],
  ['tritanopia', 'Tritanopia (tidak bisa bedakan biru-kuning)'],
  ['protanomaly', 'Protanomaly (lemah menangkap merah)'],
  ['deuteranomaly', 'Deuteranomaly (lemah menangkap hijau)'],
  ['tritanomaly', 'Tritanomaly (lemah menangkap biru)'],
  ['akromatopsia', 'Akromatopsia (hanya hitam putih)'],
];

// Terapkan matriks 3x3 ke data piksel RGBA (diubah di tempat). Fungsi murni.
export function terapkanMatriks(data, m) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i] = Math.max(0, Math.min(255, Math.round(m[0] * r + m[1] * g + m[2] * b)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(m[3] * r + m[4] * g + m[5] * b)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(m[6] * r + m[7] * g + m[8] * b)));
  }
  return data;
}

export function render(root) {
  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pilih foto, lalu lihat tampilannya untuk tiap jenis buta warna. Perhitungannya memakai matriks Machado (2009), model yang umum dipakai untuk simulasi ini. Hasilnya perkiraan, bukan pengganti tes mata.</p>'));

  const fileI = fileInput('image/*');
  const modeSel = T.select(MODE, 'deuteranopia');
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.field('Jenis buta warna', modeSel));

  const canvasAsli = document.createElement('canvas');
  const canvasSim = document.createElement('canvas');
  [canvasAsli, canvasSim].forEach((c) => { c.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block'; });
  const box = T.out();
  let imgObj = null, imgW = 0, imgH = 0, contoh = false;

  function gambarKeCanvas(c, sim) {
    const maks = 900;
    const skala = Math.min(1, maks / Math.max(imgW, imgH));
    const w = Math.max(1, Math.round(imgW * skala));
    const h = Math.max(1, Math.round(imgH * skala));
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(imgObj, 0, 0, w, h);
    if (sim) {
      const m = MATRIKS[modeSel.value] || MATRIKS.normal;
      const d = ctx.getImageData(0, 0, w, h);
      terapkanMatriks(d.data, m);
      ctx.putImageData(d, 0, 0);
    }
    return true;
  }

  function tampil() {
    if (!imgObj) return;
    if (!gambarKeCanvas(canvasAsli, false) || !gambarKeCanvas(canvasSim, true)) {
      T.toast('Gambar tidak bisa diproses di perangkat ini');
      return;
    }
    const labelMode = (MODE.find(([v]) => v === modeSel.value) || [])[1] || '';
    T.show(box, '');
    const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
    const k1 = T.el('<div><div class="hint" style="margin-bottom:6px">Asli</div></div>');
    const k2 = T.el('<div><div class="hint" style="margin-bottom:6px">' + T.esc(labelMode) + '</div></div>');
    k1.appendChild(canvasAsli);
    k2.appendChild(canvasSim);
    grid.appendChild(k1);
    grid.appendChild(k2);
    box.appendChild(grid);
  }

  function buatContoh() {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 300;
    const ctx = c.getContext('2d');
    if (!ctx) { T.toast('Gambar tidak bisa dibuat di perangkat ini'); return; }
    const warna = ['#e6194B', '#f58231', '#ffe119', '#3cb44b', '#42d4f4', '#4363d8', '#911eb4', '#f032e6'];
    warna.forEach((w, i) => { ctx.fillStyle = w; ctx.fillRect(i * 60, 0, 60, 150); });
    const grad = ctx.createLinearGradient(0, 150, 480, 150);
    grad.addColorStop(0, '#ff0000'); grad.addColorStop(0.33, '#00ff00'); grad.addColorStop(0.66, '#0000ff'); grad.addColorStop(1, '#ffff00');
    ctx.fillStyle = grad; ctx.fillRect(0, 150, 480, 150);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Merah Hijau Biru Kuning', 60, 240);
    const img = new Image();
    img.onload = () => { imgObj = img; imgW = img.naturalWidth; imgH = img.naturalHeight; contoh = true; tampil(); };
    img.src = c.toDataURL('image/png');
  }

  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try {
      const img = await loadImage(fileI.files[0]);
      imgObj = img; imgW = img.naturalWidth; imgH = img.naturalHeight; contoh = false;
      tampil();
    } catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); }
  });
  modeSel.addEventListener('change', tampil);

  const dlB = T.btn('Unduh Hasil Simulasi', async () => {
    if (!imgObj) { T.toast('Pilih foto atau pakai contoh dulu'); return; }
    try {
      const blob = await canvasToBlob(canvasSim, 'image/png');
      if (!blob) { T.toast('Gambarnya tidak bisa dibuat. Coba lagi.'); return; }
      T.dl('simulasi-' + modeSel.value + '.png', blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) { T.toast('Gambarnya tidak bisa diunduh. Coba lagi.'); }
  }, true);

  root.appendChild(T.row(T.btn('Pakai Gambar Contoh', buatContoh), dlB));
  root.appendChild(box);
  T.show(box, '<div class="dim center" style="padding:14px 0">Pilih foto atau pakai gambar contoh untuk melihat simulasinya.</div>');
  T.onLeave(() => { imgObj = null; });
}
