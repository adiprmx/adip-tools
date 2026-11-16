import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id": "tes-touchscreen", "name": "Tes Layar Sentuh", "cat": "sehari", "icon": "👆", "desc": "Gambar jejak sentuhan, cek area layar yang mati dan sentuhan banyak jari.", "keywords": "touchscreen,layar sentuh,sentuh,multi touch,dead spot", "since": "6.11.0"};

const COLS = 8, ROWS_N = 5;

export function render(root) {
  const info = T.el('<p class="mut" style="font-size:13px">Usap seluruh kotak dengan jari. Kotak yang tersentuh terisi putih. Area yang tetap kosong setelah diusap kemungkinan tidak merespons sentuhan.</p>');

  const wrap = T.el('<div style="position:relative;border:1px solid rgba(255,255,255,.16);border-radius:12px;height:300px;overflow:hidden;background:rgba(255,255,255,.03);touch-action:none"></div>');
  const grid = T.el('<div style="position:absolute;inset:0;display:grid;grid-template-columns:repeat(' + COLS + ',1fr);grid-template-rows:repeat(' + ROWS_N + ',1fr)"></div>');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  wrap.appendChild(grid);
  wrap.appendChild(canvas);

  const cells = [];
  for (let i = 0; i < COLS * ROWS_N; i++) {
    const c = T.el('<div style="border:1px solid rgba(255,255,255,.07)"></div>');
    cells.push(c);
    grid.appendChild(c);
  }

  const statBox = T.out();
  let active = new Map();
  let maxTouch = 0;
  let filled = new Set();

  const paintStats = () => {
    T.show(statBox,
      kv('Jari yang menyentuh sekarang', active.size) +
      kv('Jari terbanyak sekaligus', maxTouch) +
      kv('Kotak yang sudah tersentuh', filled.size + ' dari ' + (COLS * ROWS_N)));
  };

  const fillCell = (x, y) => {
    const r = wrap.getBoundingClientRect();
    const cx = Math.min(COLS - 1, Math.max(0, Math.floor((x - r.left) / r.width * COLS)));
    const cy = Math.min(ROWS_N - 1, Math.max(0, Math.floor((y - r.top) / r.height * ROWS_N)));
    const idx = cy * COLS + cx;
    if (!filled.has(idx)) {
      filled.add(idx);
      cells[idx].style.background = 'rgba(255,255,255,.85)';
    }
  };

  const drawDot = (x, y, color) => {
    const r = wrap.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (canvas.width !== Math.round(r.width)) { canvas.width = Math.round(r.width); canvas.height = Math.round(r.height); }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x - r.left, y - r.top, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  const onDown = (e) => {
    e.preventDefault();
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (active.size > maxTouch) maxTouch = active.size;
    fillCell(e.clientX, e.clientY);
    drawDot(e.clientX, e.clientY, '#fff');
    paintStats();
  };
  const onMove = (e) => {
    if (!active.has(e.pointerId)) return;
    e.preventDefault();
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    fillCell(e.clientX, e.clientY);
    drawDot(e.clientX, e.clientY, 'rgba(255,255,255,.6)');
    paintStats();
  };
  const onUp = (e) => {
    active.delete(e.pointerId);
    paintStats();
  };

  wrap.addEventListener('pointerdown', onDown);
  wrap.addEventListener('pointermove', onMove);
  wrap.addEventListener('pointerup', onUp);
  wrap.addEventListener('pointercancel', onUp);

  const reset = () => {
    active.clear();
    maxTouch = 0;
    filled.clear();
    cells.forEach((c) => { c.style.background = ''; });
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintStats();
  };

  T.onLeave(() => {
    wrap.removeEventListener('pointerdown', onDown);
    wrap.removeEventListener('pointermove', onMove);
    wrap.removeEventListener('pointerup', onUp);
    wrap.removeEventListener('pointercancel', onUp);
  });

  root.appendChild(info);
  root.appendChild(wrap);
  root.appendChild(statBox);
  root.appendChild(T.row(T.btn('↺ Bersihkan', reset)));
  root.appendChild(T.el('<p class="mut" style="font-size:12px">Di laptop tanpa layar sentuh, klik dan seret dengan mouse juga menggambar jejak, tapi tes sesungguhnya tetap pakai jari di layar sentuh. Diproses di browser.</p>'));
  paintStats();
}
