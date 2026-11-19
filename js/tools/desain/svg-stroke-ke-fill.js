import { h as T, fileInput } from '../../core.js';

export const meta = {"id":"svg-stroke-ke-fill","name":"SVG Stroke ke Fill","cat":"desain","icon":"✏️","desc":"Ubah garis (stroke) SVG menjadi bentuk isi (fill).","keywords":"svg,stroke,fill,garis,outline,konversi,vektor","since":"6.19.0"};

// Ubah bentuk dasar SVG menjadi path d (fungsi murni, bisa diuji tanpa DOM).
export function bentukDasarKeD(tag, a) {
  const n = (v, fb) => { const x = parseFloat(v); return Number.isFinite(x) ? x : fb; };
  if (tag === 'line') return 'M' + n(a.x1, 0) + ' ' + n(a.y1, 0) + ' L' + n(a.x2, 0) + ' ' + n(a.y2, 0);
  if (tag === 'polyline' || tag === 'polygon') {
    const pts = (a.points || '').trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
    if (pts.length < 4) return '';
    let d = 'M' + pts[0] + ' ' + pts[1];
    for (let i = 2; i + 1 < pts.length; i += 2) d += ' L' + pts[i] + ' ' + pts[i + 1];
    if (tag === 'polygon') d += ' Z';
    return d;
  }
  if (tag === 'rect') {
    const x = n(a.x, 0), y = n(a.y, 0), w = n(a.width, 0), h = n(a.height, 0);
    return 'M' + x + ' ' + y + ' H' + (x + w) + ' V' + (y + h) + ' H' + x + ' Z';
  }
  if (tag === 'circle') {
    const cx = n(a.cx, 0), cy = n(a.cy, 0), r = n(a.r, 0);
    return 'M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + ' Z';
  }
  if (tag === 'ellipse') {
    const cx = n(a.cx, 0), cy = n(a.cy, 0), rx = n(a.rx, 0), ry = n(a.ry, 0);
    return 'M' + (cx - rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 0 ' + (cx + rx) + ' ' + cy + ' A' + rx + ' ' + ry + ' 0 1 0 ' + (cx - rx) + ' ' + cy + ' Z';
  }
  return '';
}

// Garis tengah (titik-titik) menjadi outline fill: sisi kiri + sisi kanan
// dibalik, dengan tutup ujung (butt/round/square). Fungsi murni.
export function offsetGaris(pts, setengah, tutup, tertutup) {
  if (!pts || pts.length < 2) return '';
  const kiri = [], kanan = [];
  const normal = (i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    return { x: -dy, y: dx };
  };
  pts.forEach((p, i) => {
    const nrm = normal(i);
    kiri.push({ x: p.x + nrm.x * setengah, y: p.y + nrm.y * setengah });
    kanan.push({ x: p.x - nrm.x * setengah, y: p.y - nrm.y * setengah });
  });
  const fmt = (p) => Math.round(p.x * 100) / 100 + ' ' + Math.round(p.y * 100) / 100;
  let d = 'M' + kiri.map(fmt).join(' L');
  if (tertutup) {
    d += ' L' + kanan.slice().reverse().map(fmt).join(' L') + ' Z';
    return d;
  }
  const awal = pts[0], akhir = pts[pts.length - 1];
  const arahAkhir = (() => { const a = pts[pts.length - 2]; const dx = akhir.x - a.x, dy = akhir.y - a.y; const l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; })();
  const arahAwal = (() => { const b = pts[1]; const dx = awal.x - b.x, dy = awal.y - b.y; const l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; })();
  // Sisi kiri sudah digambar sampai ujung akhir; lanjut ke tutup akhir,
  // lalu sisi kanan dibalik, lalu tutup awal.
  const nAkhir = normal(pts.length - 1);
  const capAkhir = tutup === 'round'
    ? (() => { const busur = []; for (let k = 1; k <= 8; k++) { const a = Math.PI * k / 8; busur.push({ x: akhir.x + (nAkhir.x * Math.cos(a) + arahAkhir.x * Math.sin(a)) * setengah, y: akhir.y + (nAkhir.y * Math.cos(a) + arahAkhir.y * Math.sin(a)) * setengah }); } return busur; })()
    : tutup === 'square'
      ? [{ x: akhir.x + (nAkhir.x + arahAkhir.x) * setengah, y: akhir.y + (nAkhir.y + arahAkhir.y) * setengah }, { x: akhir.x + (-nAkhir.x + arahAkhir.x) * setengah, y: akhir.y + (-nAkhir.y + arahAkhir.y) * setengah }]
      : [];
  capAkhir.forEach((p) => { d += ' L' + fmt(p); });
  d += ' L' + kanan.slice().reverse().map(fmt).join(' L');
  const nAwal = normal(0);
  const capAwal = tutup === 'round'
    ? (() => { const busur = []; for (let k = 1; k <= 8; k++) { const a = Math.PI * k / 8; busur.push({ x: awal.x + (-nAwal.x * Math.cos(a) + arahAwal.x * Math.sin(a)) * setengah, y: awal.y + (-nAwal.y * Math.cos(a) + arahAwal.y * Math.sin(a)) * setengah }); } return busur; })()
    : tutup === 'square'
      ? [{ x: awal.x + (-nAwal.x + arahAwal.x) * setengah, y: awal.y + (-nAwal.y + arahAwal.y) * setengah }, { x: awal.x + (nAwal.x + arahAwal.x) * setengah, y: awal.y + (nAwal.y + arahAwal.y) * setengah }]
      : [];
  capAwal.forEach((p) => { d += ' L' + fmt(p); });
  d += ' Z';
  return d;
}

// Sampling titik sepanjang path memakai getPointAtLength (butuh DOM).
function sampelPath(pathEl, langkah) {
  const total = pathEl.getTotalLength();
  if (!Number.isFinite(total) || total <= 0) return [];
  const n = Math.max(2, Math.min(2000, Math.ceil(total / (langkah || 2))));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = pathEl.getPointAtLength(total * i / n);
    pts.push({ x: p.x, y: p.y });
  }
  return pts;
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Tempel kode SVG atau unggah file .svg. Setiap garis (stroke) diubah menjadi bentuk isi (fill) berwarna sama, supaya tampil konsisten di semua platform. Hasilnya pendekatan dari titik sampel, jadi kurva yang sangat rapat bisa sedikit menyimpang.</p>'));

  const ta = T.ta(8, 'Tempel kode SVG di sini…\nContoh:\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 50 L90 50" stroke="#ff6f61" stroke-width="6" fill="none"/></svg>');
  root.appendChild(T.field('Kode SVG', ta));
  const fileI = fileInput('.svg,image/svg+xml');
  root.appendChild(T.field('Atau unggah file .svg', fileI));
  const tutupSel = T.select([['butt', 'Ujung rata (butt)'], ['round', 'Ujung bulat (round)'], ['square', 'Ujung kotak (square)']], 'butt');
  root.appendChild(T.field('Bentuk ujung garis', tutupSel));

  const statusBox = T.el('<div class="dim" style="font-size:12.5px;margin:8px 0;min-height:18px" role="status" aria-live="polite"></div>');
  const out = T.out();
  const prevBox = T.out();
  let hasilSvg = '';

  fileI.addEventListener('change', () => {
    const f = fileI.files[0];
    if (!f) return;
    const baca = new FileReader();
    baca.onload = () => { ta.value = String(baca.result || ''); statusBox.textContent = 'File dimuat. Tekan tombol ubah.'; };
    baca.onerror = () => { statusBox.innerHTML = '<span class="err">File tidak bisa dibaca.</span>'; };
    baca.readAsText(f);
  });

  function ubah() {
    const teks = ta.value.trim();
    if (!teks) { statusBox.innerHTML = '<span class="err">Tempel kode SVG dulu atau unggah file.</span>'; return; }
    let doc;
    try {
      doc = new DOMParser().parseFromString(teks, 'image/svg+xml');
    } catch (e) {
      statusBox.innerHTML = '<span class="err">Kode SVG tidak bisa dibaca.</span>';
      return;
    }
    if (doc.querySelector('parsererror')) {
      statusBox.innerHTML = '<span class="err">Kode SVG tidak valid.</span>';
      return;
    }
    const svg = doc.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') {
      statusBox.innerHTML = '<span class="err">Kode ini bukan SVG. Pastikan diawali tag &lt;svg&gt;.</span>';
      return;
    }
    const bentuk = ['path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse'];
    const daftar = [];
    bentuk.forEach((tag) => {
      Array.from(doc.querySelectorAll(tag)).forEach((el) => daftar.push(el));
    });
    if (!daftar.length) {
      statusBox.innerHTML = '<span class="err">Tidak ada bentuk yang bisa diubah di SVG ini.</span>';
      return;
    }
    // Penampung sementara di DOM agar getPointAtLength bekerja.
    const wadah = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wadah.setAttribute('width', '0');
    wadah.setAttribute('height', '0');
    wadah.style.cssText = 'position:absolute;visibility:hidden';
    document.body.appendChild(wadah);
    let diubah = 0, dilewat = 0;
    try {
      daftar.forEach((el) => {
        const stroke = el.getAttribute('stroke');
        const lebar = parseFloat(el.getAttribute('stroke-width') || '1');
        if (!stroke || stroke === 'none' || !Number.isFinite(lebar) || lebar <= 0) { dilewat++; return; }
        const tag = el.tagName.toLowerCase();
        let d = '';
        if (tag === 'path') d = el.getAttribute('d') || '';
        else {
          const a = {};
          Array.from(el.attributes).forEach((at) => { a[at.name] = at.value; });
          d = bentukDasarKeD(tag, a);
        }
        if (!d) { dilewat++; return; }
        const tertutup = /Z\s*$/i.test(d.trim());
        const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tmp.setAttribute('d', d);
        wadah.appendChild(tmp);
        const pts = sampelPath(tmp, 2);
        wadah.removeChild(tmp);
        if (pts.length < 2) { dilewat++; return; }
        const outline = offsetGaris(pts, lebar / 2, el.getAttribute('stroke-linecap') || tutupSel.value, tertutup);
        if (!outline) { dilewat++; return; }
        const baru = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        baru.setAttribute('d', outline);
        baru.setAttribute('fill', stroke);
        const opacity = el.getAttribute('stroke-opacity') || el.getAttribute('opacity');
        if (opacity) baru.setAttribute('fill-opacity', opacity);
        el.parentNode.replaceChild(baru, el);
        diubah++;
      });
    } finally {
      wadah.remove();
    }
    if (!diubah) {
      statusBox.innerHTML = '<span class="err">Tidak ada garis (stroke) yang berhasil diubah. Pastikan bentuknya punya atribut stroke dan stroke-width.</span>';
      return;
    }
    hasilSvg = new XMLSerializer().serializeToString(doc);
    statusBox.textContent = diubah + ' garis diubah menjadi fill' + (dilewat ? ', ' + dilewat + ' bentuk dilewati (tanpa stroke).' : '.');
    T.show(prevBox, '');
    const bungkus = T.el('<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;text-align:center"></div>');
    const img = new Image();
    img.style.cssText = 'max-width:100%;height:auto';
    img.alt = 'Pratinjau SVG hasil';
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hasilSvg);
    bungkus.appendChild(img);
    prevBox.appendChild(bungkus);
    T.show(out, '');
    const pre = document.createElement('pre');
    pre.style.cssText = 'white-space:pre-wrap;word-break:break-all;font-family:var(--font-m);font-size:12.5px;line-height:1.6;margin:0';
    pre.textContent = hasilSvg;
    out.appendChild(pre);
    const row = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"></div>');
    row.appendChild(T.copyBtn(() => hasilSvg, 'Salin SVG'));
    row.appendChild(T.btn('Unduh SVG', () => { T.dl('svg-fill.svg', hasilSvg, 'image/svg+xml'); T.toast('Berhasil diunduh'); }, true));
    out.appendChild(row);
  }

  root.appendChild(T.el('<div style="height:8px"></div>'));
  root.appendChild(T.row(T.btn('Ubah ke Fill', ubah, true)));
  root.appendChild(statusBox);
  root.appendChild(prevBox);
  root.appendChild(out);
}
