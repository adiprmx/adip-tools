import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "plot-fungsi", "name": "Plot Fungsi", "cat": "pelajar", "icon": "📉", "desc": "Gambar grafik f(x) + tabel nilai x dari -10 sampai 10.", "keywords": "fungsi,grafik,plot,matematika,kurva,fx"};

/** Parser aman: hanya angka, x, operator, dan sin/cos/tan/sqrt. Balikin fungsi x => y. */
export function compileFx(src) {
  let s = String(src == null ? '' : src).trim().toLowerCase();
  if (!s) throw new Error('Tulis dulu rumusnya — contoh: x*x+2*x');
  const words = s.match(/[a-z]+/g) || [];
  for (const w of words) {
    if (w !== 'x' && w !== 'sin' && w !== 'cos' && w !== 'tan' && w !== 'sqrt')
      throw new Error('"' + w + '" nggak boleh dipakai. Yang boleh cuma: x, sin, cos, tan, sqrt.');
  }
  const bare = s.replace(/sin|cos|tan|sqrt|x/g, ' ');
  if (/[^0-9+\-*/^().\s]/.test(bare))
    throw new Error('Ada karakter asing. Boleh pakai: angka, x, + - * / ^ ( ), spasi.');
  let js = s
    .replace(/\bsin\b/g, 'Math.sin').replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan').replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/(\d|\))x/g, '$1*x').replace(/x(\d|\()/g, 'x*$1').replace(/\)(\d|\()/g, ')*$1')
    .replace(/(\d|\))Math/g, '$1*Math')
    .replace(/\^/g, '**');
  let fn;
  try { fn = new Function('x', '"use strict"; return (' + js + ');'); }
  catch (e) { throw new Error('Rumusnya nggak valid — cek lagi tanda kurungnya.'); }
  try { for (const p of [0, 1, -1, 2.5]) fn(p); }
  catch (e) { throw new Error('Rumusnya error pas dihitung — cek lagi ya.'); }
  return fn;
}

export function render(root) {
  const inp = T.input('text', 'mis. x*x+2*x', 'x*x');
  inp.setAttribute('spellcheck', 'false');
  inp.setAttribute('autocapitalize', 'off');
  const errBox = T.out();
  const wrap = T.el('<div style="margin:12px 0"></div>');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:320px;display:block;border:1px solid var(--line);border-radius:12px;background:var(--deep)';
  wrap.appendChild(canvas);
  const tblBox = T.out();

  const chips = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"></div>');
  ['x*x', 'x*x+2*x', 'x^3-3*x', 'sin(x)', 'sqrt(x)'].forEach((c) => {
    const b = T.el('<button type="button" class="btn" style="font-size:12px;padding:6px 10px">' + T.esc(c) + '</button>');
    b.addEventListener('click', () => { inp.value = c; gambar(); });
    chips.appendChild(b);
  });

  const fmtY = (y) => {
    if (typeof y !== 'number' || !isFinite(y)) return '–';
    if (Math.abs(y) >= 1e9 || (Math.abs(y) < 1e-6 && y !== 0)) return y.toExponential(2);
    return String(Math.round(y * 10000) / 10000);
  };

  const gambar = () => {
    T.hide(errBox); T.hide(tblBox);
    let fn;
    try { fn = compileFx(inp.value); }
    catch (e) { T.show(errBox, '<p style="color:var(--err);font-size:13px">' + T.esc(e.message) + '</p>'); return; }
    const N = 400, xs = [], ys = [];
    for (let i = 0; i <= N; i++) {
      const x = -10 + (20 * i) / N;
      let y;
      try { y = fn(x); } catch (e) { y = NaN; }
      xs.push(x); ys.push(y);
    }
    const fin = ys.filter((v) => typeof v === 'number' && isFinite(v));
    if (!fin.length) {
      T.show(errBox, '<p style="color:var(--err);font-size:13px">Nggak ada titik yang bisa digambar di rentang x -10 sampai 10. Coba rumus lain.</p>');
      return;
    }
    let ymin = Math.min.apply(null, fin), ymax = Math.max.apply(null, fin);
    if (ymin === ymax) { ymin -= 1; ymax += 1; }
    const pad = (ymax - ymin) * 0.08; ymin -= pad; ymax += pad;

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const W = wrap.clientWidth || 600, H = 320;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const X = (x) => ((x + 10) / 20) * W;
    const Y = (y) => H - ((y - ymin) / (ymax - ymin)) * H;

    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.fillStyle = '#9d9078'; ctx.font = '10px system-ui,sans-serif';
    for (let gx = -10; gx <= 10; gx++) {
      ctx.beginPath(); ctx.moveTo(X(gx), 0); ctx.lineTo(X(gx), H); ctx.stroke();
      if (gx % 2 === 0) ctx.fillText(String(gx), X(gx) + 3, H - 6);
    }
    const span = ymax - ymin;
    const base = Math.pow(10, Math.floor(Math.log10(span / 5)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * base).filter((st) => span / st <= 7)[0] || base * 10;
    for (let gy = Math.ceil(ymin / step) * step; gy <= ymax; gy += step) {
      ctx.beginPath(); ctx.moveTo(0, Y(gy)); ctx.lineTo(W, Y(gy)); ctx.stroke();
      ctx.fillText(fmtY(gy), 4, Y(gy) - 3);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke();

    ctx.strokeStyle = '#ff6f61'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= N; i++) {
      const y = ys[i];
      if (typeof y !== 'number' || !isFinite(y)) { pen = false; continue; }
      const px = X(xs[i]), py = Y(y);
      if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();

    let rows = '';
    for (let x = -10; x <= 10; x++) {
      let y; try { y = fn(x); } catch (e) { y = NaN; }
      rows += '<tr><td style="padding:6px 8px;border-bottom:1px solid var(--line-soft);text-align:center;color:var(--mut)">x = ' + x + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid var(--line-soft);text-align:center;font-family:monospace">f(x) = ' + T.esc(fmtY(y)) + '</td></tr>';
    }
    T.show(tblBox, '<h3 style="font-size:14px;margin:4px 0 8px">Tabel nilai</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' + rows + '</table>');
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') gambar(); });
  root.appendChild(T.field('Rumus f(x)', inp, 'Boleh pakai: angka, x, + − * / ^ ( ), dan sin cos tan sqrt'));
  root.appendChild(chips);
  root.appendChild(T.row(T.btn('Gambar Grafiknya', gambar, true)));
  root.appendChild(errBox);
  root.appendChild(wrap);
  root.appendChild(tblBox);
  gambar();
}
