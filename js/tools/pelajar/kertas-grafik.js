import { h as T, dl } from '../../core.js';

export const meta = { id: 'kertas-grafik', name: 'Generator Kertas Grafik', cat: 'pelajar', icon: '📐', desc: 'Buat kertas kotak, titik, garis, isometrik, heksagon, dan polar siap cetak ukuran A4, unduh sebagai SVG, PNG, atau PDF.', keywords: 'kertas grafik,graph paper,kotak-kotak,grid,isometrik,heksagon,polar,cetak,matematika', since: '6.19.0' };

// Kertas A4: 210 × 297 mm, margin 10 mm. Geometri dihitung dalam mm, lalu
// diubah ke SVG (1 unit = 1 mm) dan PDF (1 mm = 2,83465 pt).
const LEBAR = 210, TINGGI = 297, MARGIN = 10;
const MM_PT = 2.834645669;
const WARNA = { abu: '#9ca3af', biru: '#3b82f6', hitam: '#111111' };

// Hasilkan primitif gambar: garis [x1,y1,x2,y2], lingkaran [cx,cy,r],
// titik [x,y]. Semua dalam mm, origin kiri atas.
export function geometri(jenis, spasi) {
  const garis = [], lingkaran = [], titik = [];
  const s = Math.max(2, Math.min(30, spasi));
  const x0 = MARGIN, x1 = LEBAR - MARGIN, y0 = MARGIN, y1 = TINGGI - MARGIN;
  if (jenis === 'kotak') {
    for (let x = x0; x <= x1 + 0.001; x += s) garis.push([x, y0, x, y1]);
    for (let y = y0; y <= y1 + 0.001; y += s) garis.push([x0, y, x1, y]);
  } else if (jenis === 'titik') {
    for (let x = x0; x <= x1 + 0.001; x += s)
      for (let y = y0; y <= y1 + 0.001; y += s) titik.push([x, y]);
  } else if (jenis === 'garis') {
    for (let y = y0; y <= y1 + 0.001; y += s) garis.push([x0, y, x1, y]);
  } else if (jenis === 'isometrik') {
    const h = s * Math.sqrt(3) / 2;
    for (let y = y0; y <= y1 + 0.001; y += h) garis.push([x0, y, x1, y]);
    // Diagonal naik dan turun, digambar panjang lalu dipotong di tepi (clip).
    for (let k = -Math.ceil((y1 - y0) / h) - 2; k <= Math.ceil((x1 - x0) / s) + 2; k++) {
      const xA = x0 + k * s;
      garis.push([xA, y1, xA + (y1 - y0) / Math.sqrt(3), y0]);
      garis.push([xA, y0, xA + (y1 - y0) / Math.sqrt(3), y1]);
    }
  } else if (jenis === 'heksagon') {
    const r = s / 2;
    const dx = Math.sqrt(3) * r, dy = 1.5 * r;
    let baris = 0;
    for (let cy = y0; cy <= y1 + r; cy += dy, baris++) {
      for (let cx = x0 + (baris % 2 ? dx / 2 : 0); cx <= x1 + r; cx += dx) {
        const sudut = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          sudut.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
        for (let i = 0; i < 6; i++) {
          const p = sudut[i], q = sudut[(i + 1) % 6];
          garis.push([p[0], p[1], q[0], q[1]]);
        }
      }
    }
  } else if (jenis === 'polar') {
    const cx = LEBAR / 2, cy = TINGGI / 2;
    const maks = Math.min(cx - MARGIN, cy - MARGIN);
    for (let r = s; r <= maks + 0.001; r += s) lingkaran.push([cx, cy, r]);
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI / 6) * i;
      garis.push([cx, cy, cx + maks * Math.cos(a), cy + maks * Math.sin(a)]);
    }
  }
  return { garis, lingkaran, titik };
}

export function buatSvg(jenis, spasi, warna) {
  const g = geometri(jenis, spasi);
  const c = WARNA[warna] || WARNA.abu;
  const tebal = 0.25;
  let isi = '';
  g.garis.forEach(([x1, y1, x2, y2]) => {
    isi += '<line x1="' + x1.toFixed(2) + '" y1="' + y1.toFixed(2) + '" x2="' + x2.toFixed(2) + '" y2="' + y2.toFixed(2) + '" stroke="' + c + '" stroke-width="' + tebal + '"/>';
  });
  g.lingkaran.forEach(([cx, cy, r]) => {
    isi += '<circle cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="' + r.toFixed(2) + '" fill="none" stroke="' + c + '" stroke-width="' + tebal + '"/>';
  });
  g.titik.forEach(([x, y]) => {
    isi += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="0.5" fill="' + c + '"/>';
  });
  isi += '<rect x="' + MARGIN + '" y="' + MARGIN + '" width="' + (LEBAR - 2 * MARGIN) + '" height="' + (TINGGI - 2 * MARGIN) + '" fill="none" stroke="' + c + '" stroke-width="0.5"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297">' +
    '<defs><clipPath id="p"><rect x="' + MARGIN + '" y="' + MARGIN + '" width="' + (LEBAR - 2 * MARGIN) + '" height="' + (TINGGI - 2 * MARGIN) + '"/></clipPath></defs>' +
    '<rect width="210" height="297" fill="#ffffff"/><g clip-path="url(#p)">' + isi + '</g></svg>';
}

// PDF vektor minimal (tanpa pustaka): garis dan lingkaran sebagai operator
// vektor, tabel xref dihitung dari panjang string (semua karakter ASCII).
export function buatPdf(jenis, spasi, warna) {
  const g = geometri(jenis, spasi);
  const c = WARNA[warna] || WARNA.abu;
  const r = parseInt(c.slice(1, 3), 16) / 255;
  const gg = parseInt(c.slice(3, 5), 16) / 255;
  const b = parseInt(c.slice(5, 7), 16) / 255;
  const X = (mm) => (mm * MM_PT).toFixed(2);
  const Y = (mm) => ((TINGGI - mm) * MM_PT).toFixed(2);
  const op = [];
  op.push(r.toFixed(3) + ' ' + gg.toFixed(3) + ' ' + b.toFixed(3) + ' RG');
  op.push(r.toFixed(3) + ' ' + gg.toFixed(3) + ' ' + b.toFixed(3) + ' rg');
  op.push('0.5 w');
  op.push('q ' + X(MARGIN) + ' ' + Y(TINGGI - MARGIN) + ' ' + X(LEBAR - 2 * MARGIN) + ' ' + X(TINGGI - 2 * MARGIN) + ' re W n');
  g.garis.forEach(([x1, y1, x2, y2]) => {
    op.push(X(x1) + ' ' + Y(y1) + ' m ' + X(x2) + ' ' + Y(y2) + ' l S');
  });
  // Lingkaran di PDF digambar dengan 4 kurva Bezier (kappa 0,5523).
  const K = 0.5522847498;
  g.lingkaran.forEach(([cx, cy, rr]) => {
    const x = cx * MM_PT, y = (TINGGI - cy) * MM_PT, rad = rr * MM_PT, k = rad * K;
    const n = (v) => v.toFixed(2);
    op.push(n(x + rad) + ' ' + n(y) + ' m ' +
      n(x + rad) + ' ' + n(y + k) + ' ' + n(x + k) + ' ' + n(y + rad) + ' ' + n(x) + ' ' + n(y + rad) + ' c ' +
      n(x - k) + ' ' + n(y + rad) + ' ' + n(x - rad) + ' ' + n(y + k) + ' ' + n(x - rad) + ' ' + n(y) + ' c ' +
      n(x - rad) + ' ' + n(y - k) + ' ' + n(x - k) + ' ' + n(y - rad) + ' ' + n(x) + ' ' + n(y - rad) + ' c ' +
      n(x + k) + ' ' + n(y - rad) + ' ' + n(x + rad) + ' ' + n(y - k) + ' ' + n(x + rad) + ' ' + n(y) + ' c S');
  });
  g.titik.forEach(([x, y]) => {
    op.push(X(x - 0.35) + ' ' + Y(y + 0.35) + ' 2.00 2.00 re f');
  });
  op.push('Q');
  op.push('1 w ' + X(MARGIN) + ' ' + Y(TINGGI - MARGIN) + ' ' + X(LEBAR - 2 * MARGIN) + ' ' + X(TINGGI - 2 * MARGIN) + ' re S');
  const stream = op.join('\n');
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream\nendobj\n';
  let pdf = '%PDF-1.4\n';
  const offset = [];
  [obj1, obj2, obj3, obj4].forEach((o) => { offset.push(pdf.length); pdf += o; });
  const xrefPos = pdf.length;
  pdf += 'xref\n0 5\n0000000000 65535 f \n';
  offset.forEach((o) => { pdf += String(o).padStart(10, '0') + ' 00000 n \n'; });
  pdf += 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';
  return pdf;
}

const NAMA_JENIS = { kotak: 'kotak', titik: 'titik', garis: 'garis', isometrik: 'isometrik', heksagon: 'heksagon', polar: 'polar' };

export function render(root) {
  root.appendChild(T.el('<p class="hint">Pilih jenis kertas dan jaraknya. Pratinjau di bawah ini sesuai ukuran A4. Unduh sebagai SVG (vektor), PNG (gambar), atau PDF (vektor siap cetak).</p>'));

  const jenisS = T.select([
    ['kotak', 'Kertas kotak (grid)'],
    ['titik', 'Kertas titik (dot grid)'],
    ['garis', 'Kertas bergaris'],
    ['isometrik', 'Kertas isometrik'],
    ['heksagon', 'Kertas heksagon'],
    ['polar', 'Kertas polar'],
  ], 'kotak');
  const spasiS = T.select([
    ['5', 'Rapat (5 mm)'],
    ['7', 'Sedang (7 mm)'],
    ['10', 'Renggang (10 mm)'],
  ], '5');
  const warnaS = T.select([
    ['abu', 'Abu-abu'],
    ['biru', 'Biru'],
    ['hitam', 'Hitam'],
  ], 'abu');
  const pratinjau = T.el('<div style="margin-top:12px;border:1px solid rgba(255,255,255,.15);border-radius:8px;overflow:hidden;max-width:420px"></div>');

  function namaFile(ekst) {
    return 'kertas-' + NAMA_JENIS[jenisS.value] + '-' + spasiS.value + 'mm.' + ekst;
  }

  function gambar() {
    const svg = buatSvg(jenisS.value, Number(spasiS.value), warnaS.value);
    pratinjau.innerHTML = svg;
    const elSvg = pratinjau.querySelector('svg');
    if (elSvg) { elSvg.style.width = '100%'; elSvg.style.height = 'auto'; elSvg.style.display = 'block'; }
  }

  function unduhSvg() {
    dl(namaFile('svg'), buatSvg(jenisS.value, Number(spasiS.value), warnaS.value), 'image/svg+xml');
  }

  function unduhPdf() {
    dl(namaFile('pdf'), buatPdf(jenisS.value, Number(spasiS.value), warnaS.value), 'application/pdf');
  }

  function unduhPng() {
    const svg = buatSvg(jenisS.value, Number(spasiS.value), warnaS.value);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const kanvas = document.createElement('canvas');
      kanvas.width = 1240; kanvas.height = 1754;
      const ctx = kanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, kanvas.width, kanvas.height);
      ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
      URL.revokeObjectURL(url);
      kanvas.toBlob((blob) => { if (blob) dl(namaFile('png'), blob, 'image/png'); else T.toast('Gagal membuat PNG.'); }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); T.toast('Gagal membuat PNG.'); };
    img.src = url;
  }

  [jenisS, spasiS, warnaS].forEach((el) => el.addEventListener('change', gambar));
  root.append(
    T.grid2(T.field('Jenis kertas', jenisS), T.field('Jarak', spasiS)),
    T.field('Warna garis', warnaS),
    T.row(T.btn('Unduh SVG', unduhSvg), T.btn('Unduh PNG', unduhPng), T.btn('Unduh PDF', unduhPdf, true)),
    pratinjau,
  );
  gambar();
}
