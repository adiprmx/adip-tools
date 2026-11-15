import { h as T, kv, canvasToBlob, errBox } from '../../core.js?v=6.12.0';

export const meta = {"id":"chart-maker","name":"Chart Maker","cat":"desain","icon":"📊","desc":"Ubah tabel angka jadi grafik batang, garis, atau pie.","keywords":"grafik,chart,batang,pie,garis,data,tabel","since":"6.11.0"};

/* Chart maker: gambar dengan canvas/SVG murni, tanpa pustaka grafik.
   Satu perhitungan tata letak dipakai bersama untuk pratinjau canvas,
   unduhan PNG, dan unduhan SVG. Warna abu-abu bertingkat dipakai sebagai
   pembeda antar irisan/kategori (fungsi, bukan hiasan). */
const W = 900, H = 520;
const GRAY = ['#fafafa', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#e4e4e7', '#8b8b93', '#3f3f46', '#c9c9cf', '#5c5c64'];
const MAX_ROW = 24;

export function parseData(text) {
  const rows = [];
  const bad = [];
  String(text || '').split(/\n/).forEach((ln, i) => {
    const line = ln.trim();
    if (!line) return;
    /* Bila baris memakai ; / tab / | sebagai pemisah, koma di dalam angka
       desimal (12,5) tidak ikut dibelah. Bila tidak ada pemisah itu, koma
       dipakai sebagai pemisah seperti biasa. */
    const parts = (/[;\t|]/.test(line) ? line.split(/[;\t|]/) : line.split(','))
      .map((p) => p.trim()).filter((p) => p !== '');
    if (parts.length < 2) { bad.push(i + 1); return; }
    const v = T.num(parts[parts.length - 1]);
    if (!isFinite(v)) { bad.push(i + 1); return; }
    rows.push({ label: parts.slice(0, -1).join(' '), value: v });
  });
  return { rows, bad };
}

/* Hitung geometri sekali, dipakai canvas dan SVG. */
function layout(rows, type) {
  const padL = 64, padR = 24, padT = 56, padB = 64;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const geo = { type, padL, padR, padT, padB, plotW, plotH, bars: [], points: [], slices: [], maxV: 0 };
  const vals = rows.map((r) => r.value);
  const maxV = Math.max(0, ...vals);
  const minV = Math.min(0, ...vals);
  geo.maxV = maxV; geo.minV = minV;
  const range = maxV - minV || 1;
  const yOf = (v) => padT + plotH - ((v - minV) / range) * plotH;
  geo.yOf = yOf;
  geo.y0 = yOf(0);
  if (type === 'pie') {
    const total = vals.reduce((a, b) => a + Math.max(0, b), 0);
    let a = -Math.PI / 2;
    const cx = W / 2 - 90, cy = padT + plotH / 2, r = Math.min(plotW, plotH) / 2 - 8;
    rows.forEach((row, i) => {
      const frac = total > 0 ? Math.max(0, row.value) / total : 0;
      const a1 = a + frac * Math.PI * 2;
      geo.slices.push({ a0: a, a1, label: row.label, value: row.value, frac, color: GRAY[i % GRAY.length] });
      a = a1;
    });
    geo.cx = cx; geo.cy = cy; geo.r = r; geo.total = total;
    return geo;
  }
  const n = rows.length;
  const slot = plotW / n;
  rows.forEach((row, i) => {
    const cx = padL + slot * i + slot / 2;
    geo.bars.push({ x: padL + slot * i + slot * 0.18, w: slot * 0.64, y: yOf(Math.max(0, row.value)), h: Math.abs(yOf(row.value) - yOf(0)), label: row.label, value: row.value });
    geo.points.push({ x: cx, y: yOf(row.value), label: row.label, value: row.value });
  });
  return geo;
}

function drawCanvas(canvas, rows, type, title) {
  const x = canvas.getContext('2d');
  if (!x) return null;
  canvas.width = W; canvas.height = H;
  x.fillStyle = '#111111';
  x.fillRect(0, 0, W, H);
  const g = layout(rows, type);
  x.fillStyle = '#fafafa';
  x.font = '700 22px system-ui,sans-serif';
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  if (title) x.fillText(title, g.padL, 32);
  x.font = '13px system-ui,sans-serif';
  x.fillStyle = '#a1a1aa';
  if (type === 'pie') {
    g.slices.forEach((s) => {
      if (s.frac <= 0) return;
      x.beginPath();
      x.moveTo(g.cx, g.cy);
      x.arc(g.cx, g.cy, g.r, s.a0, s.a1);
      x.closePath();
      x.fillStyle = s.color;
      x.fill();
      x.strokeStyle = '#111111'; x.lineWidth = 2; x.stroke();
    });
    const lx = g.cx + g.r + 28;
    let ly = g.cy - g.slices.length * 11 + 6;
    g.slices.forEach((s) => {
      x.fillStyle = s.color;
      x.fillRect(lx, ly - 10, 12, 12);
      x.fillStyle = '#e4e4e7';
      x.fillText(s.label + '  (' + (s.frac * 100).toFixed(1).replace('.', ',') + '%)', lx + 20, ly);
      ly += 24;
    });
    return g;
  }
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = g.minV + (g.maxV - g.minV) * i / ticks;
    const y = g.yOf(v);
    x.strokeStyle = '#27272a'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(g.padL, y); x.lineTo(W - g.padR, y); x.stroke();
    x.fillStyle = '#71717a'; x.textAlign = 'right';
    x.fillText(T.fmt(Math.round(v * 100) / 100), g.padL - 8, y + 4);
  }
  x.textAlign = 'center';
  if (type === 'bar') {
    g.bars.forEach((b) => {
      x.fillStyle = '#fafafa';
      x.fillRect(b.x, b.y, b.w, Math.max(1, b.h));
      x.fillStyle = '#e4e4e7';
      x.fillText(T.fmt(b.value), b.x + b.w / 2, b.y - 6);
      x.fillStyle = '#a1a1aa';
      x.fillText(b.label.length > 12 ? b.label.slice(0, 11) + '…' : b.label, b.x + b.w / 2, H - g.padB + 22);
    });
  } else {
    x.strokeStyle = '#fafafa'; x.lineWidth = 2.5;
    x.beginPath();
    g.points.forEach((p, i) => { if (i === 0) x.moveTo(p.x, p.y); else x.lineTo(p.x, p.y); });
    x.stroke();
    g.points.forEach((p) => {
      x.beginPath(); x.arc(p.x, p.y, 5, 0, Math.PI * 2);
      x.fillStyle = '#111111'; x.fill();
      x.strokeStyle = '#fafafa'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#e4e4e7';
      x.fillText(T.fmt(p.value), p.x, p.y - 12);
      x.fillStyle = '#a1a1aa';
      x.fillText(p.label.length > 12 ? p.label.slice(0, 11) + '…' : p.label, p.x, H - g.padB + 22);
    });
  }
  return g;
}

function buildSvg(rows, type, title) {
  const g = layout(rows, type);
  const esc = T.esc;
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">';
  s += '<rect width="' + W + '" height="' + H + '" fill="#111111"/>';
  if (title) s += '<text x="' + g.padL + '" y="32" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#fafafa">' + esc(title) + '</text>';
  if (type === 'pie') {
    const polar = (a, r) => [g.cx + r * Math.cos(a), g.cy + r * Math.sin(a)];
    g.slices.forEach((sl) => {
      if (sl.frac <= 0) return;
      const [x0, y0] = polar(sl.a0, g.r), [x1, y1] = polar(sl.a1, g.r);
      const large = sl.a1 - sl.a0 > Math.PI ? 1 : 0;
      s += '<path d="M' + g.cx + ' ' + g.cy + ' L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + g.r + ' ' + g.r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z" fill="' + sl.color + '" stroke="#111111" stroke-width="2"/>';
    });
    const lx = g.cx + g.r + 28;
    let ly = g.cy - g.slices.length * 11 + 6;
    g.slices.forEach((sl) => {
      s += '<rect x="' + lx + '" y="' + (ly - 10) + '" width="12" height="12" fill="' + sl.color + '"/>';
      s += '<text x="' + (lx + 20) + '" y="' + ly + '" font-family="system-ui,sans-serif" font-size="13" fill="#e4e4e7">' + esc(sl.label) + ' (' + (sl.frac * 100).toFixed(1).replace('.', ',') + '%)</text>';
      ly += 24;
    });
    return s + '</svg>';
  }
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const v = g.minV + (g.maxV - g.minV) * i / ticks;
    const y = g.yOf(v);
    s += '<line x1="' + g.padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - g.padR) + '" y2="' + y.toFixed(1) + '" stroke="#27272a"/>';
    s += '<text x="' + (g.padL - 8) + '" y="' + (y + 4).toFixed(1) + '" font-family="system-ui,sans-serif" font-size="13" fill="#71717a" text-anchor="end">' + T.fmt(Math.round(v * 100) / 100) + '</text>';
  }
  if (type === 'bar') {
    g.bars.forEach((b) => {
      s += '<rect x="' + b.x.toFixed(1) + '" y="' + b.y.toFixed(1) + '" width="' + b.w.toFixed(1) + '" height="' + Math.max(1, b.h).toFixed(1) + '" fill="#fafafa"/>';
      s += '<text x="' + (b.x + b.w / 2).toFixed(1) + '" y="' + (b.y - 6).toFixed(1) + '" font-family="system-ui,sans-serif" font-size="13" fill="#e4e4e7" text-anchor="middle">' + T.fmt(b.value) + '</text>';
      s += '<text x="' + (b.x + b.w / 2).toFixed(1) + '" y="' + (H - g.padB + 22) + '" font-family="system-ui,sans-serif" font-size="13" fill="#a1a1aa" text-anchor="middle">' + esc(b.label.length > 12 ? b.label.slice(0, 11) + '…' : b.label) + '</text>';
    });
  } else {
    const pts = g.points.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    s += '<polyline points="' + pts + '" fill="none" stroke="#fafafa" stroke-width="2.5"/>';
    g.points.forEach((p) => {
      s += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5" fill="#111111" stroke="#fafafa" stroke-width="2"/>';
      s += '<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 12).toFixed(1) + '" font-family="system-ui,sans-serif" font-size="13" fill="#e4e4e7" text-anchor="middle">' + T.fmt(p.value) + '</text>';
      s += '<text x="' + p.x.toFixed(1) + '" y="' + (H - g.padB + 22) + '" font-family="system-ui,sans-serif" font-size="13" fill="#a1a1aa" text-anchor="middle">' + esc(p.label.length > 12 ? p.label.slice(0, 11) + '…' : p.label) + '</text>';
    });
  }
  return s + '</svg>';
}

export function render(root) {
  const ta = T.ta(7, 'Senin, 12\nSelasa, 19\nRabu, 8\nKamis, 22\nJumat, 15');
  const judulInp = T.input('text', 'Judul grafik (boleh kosong)', '');
  const tipeSel = T.select([['bar', 'Batang'], ['line', 'Garis'], ['pie', 'Pie (lingkaran)']], 'bar');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
  const box = T.out();
  const prevWrap = T.el('<div style="margin-top:12px" hidden></div>');
  prevWrap.appendChild(canvas);
  let curRows = [], curType = 'bar';

  const contohBtn = T.btn('Isi contoh', () => {
    ta.value = 'Senin, 12\nSelasa, 19\nRabu, 8\nKamis, 22\nJumat, 15\nSabtu, 27\nMinggu, 21';
  });

  const buat = () => {
    const { rows, bad } = parseData(ta.value);
    if (!rows.length) {
      T.show(box, errBox('Tidak ada baris data yang bisa dibaca. Tulis satu baris per data, contoh: Senin, 12'));
      prevWrap.hidden = true;
      return;
    }
    if (rows.length < 2 && tipeSel.value !== 'pie') {
      T.show(box, errBox('Butuh minimal 2 baris data untuk grafik batang atau garis.'));
      prevWrap.hidden = true;
      return;
    }
    let used = rows;
    let note = '';
    if (rows.length > MAX_ROW) {
      used = rows.slice(0, MAX_ROW);
      note = '<p class="hint">Hanya ' + MAX_ROW + ' baris pertama yang digambar supaya grafik tetap terbaca.</p>';
    }
    if (bad.length) note += '<p class="hint">Baris ke-' + bad.slice(0, 5).join(', ') + ' dilewati karena angkanya tidak terbaca.</p>';
    if (tipeSel.value === 'pie' && used.every((r) => r.value <= 0)) {
      T.show(box, errBox('Grafik pie butuh angka positif. Periksa lagi datanya.'));
      prevWrap.hidden = true;
      return;
    }
    curRows = used; curType = tipeSel.value;
    const g = drawCanvas(canvas, used, tipeSel.value, judulInp.value.trim());
    if (!g) { T.show(box, errBox('Browser ini tidak mendukung canvas.')); return; }
    prevWrap.hidden = false;
    T.show(box, kv('Baris digambar', used.length + ' baris') + kv('Jenis', tipeSel.value === 'bar' ? 'Batang' : tipeSel.value === 'line' ? 'Garis' : 'Pie') + note);
    box.appendChild(T.row(
      T.btn('Unduh PNG', async () => {
        const blob = await canvasToBlob(canvas, 'image/png');
        if (blob) T.dl('grafik.png', blob, 'image/png');
        else T.toast('PNG tidak bisa dibuat');
      }, true),
      T.btn('Unduh SVG', () => {
        T.dl('grafik.svg', buildSvg(curRows, curType, judulInp.value.trim()), 'image/svg+xml;charset=utf-8');
      })
    ));
    T.scrollToPreview(prevWrap);
  };

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Tulis datanya satu baris per item, label lalu angka dipisah koma. Angka desimal pakai titik atau koma Indonesia (12,5). Untuk angka desimal, pisahkan label dan angka dengan titik koma (;) supaya tidak tertukar.</p>'));
  root.appendChild(T.field('Data', ta, 'Contoh: Senin, 12 (satu baris per item)'));
  root.appendChild(T.row(contohBtn));
  root.appendChild(T.grid2(T.field('Judul grafik', judulInp), T.field('Jenis grafik', tipeSel)));
  root.appendChild(T.row(T.btn('Buat grafik', buat, true)));
  root.appendChild(box);
  root.appendChild(prevWrap);
}
