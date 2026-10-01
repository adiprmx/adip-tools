import { h as T, utils } from '../../core.js?v=6.3.0';

export const meta = {"id":"clip-path-generator","name":"Clip-Path Generator","cat":"desain","icon":"✂️","desc":"Potong bentuk pakai clip-path CSS.","keywords":"clip-path,polygon,css,bentuk,potong"};

export function render(root) {
  const PRESETS = {
    'Segitiga': [[50, 0], [100, 100], [0, 100]],
    'Lingkaran': Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
      return [Math.round((50 + 50 * Math.cos(a)) * 10) / 10, Math.round((50 + 50 * Math.sin(a)) * 10) / 10];
    }),
    'Diamond': [[50, 0], [100, 50], [50, 100], [0, 50]],
    'Panah kanan': [[0, 20], [55, 20], [55, 0], [100, 50], [55, 100], [55, 80], [0, 80]],
    'Hexagon': [[25, 5], [75, 5], [100, 50], [75, 95], [25, 95], [0, 50]],
    'Trapesium': [[20, 0], [80, 0], [100, 100], [0, 100]],
  };

  let pts = PRESETS['Segitiga'].map((p) => p.slice());

  const previewBox = T.el('<div style="display:flex;justify-content:center;padding:24px 16px;background:#18181b;border:1px solid #27272a;border-radius:12px;margin:12px 0"></div>');
  const shape = T.el('<div style="width:220px;height:220px;background:linear-gradient(135deg,#fb7185,#f97316 55%,#facc15);transition:clip-path .25s"></div>');
  previewBox.appendChild(shape);
  const listBox = T.el('<div style="display:flex;flex-direction:column;gap:8px;margin:10px 0"></div>');
  const codeBox = T.out();

  const cssText = () => 'clip-path: polygon(' + pts.map((p) => p[0] + '% ' + p[1] + '%').join(', ') + ');';

  const paint = () => {
    shape.style.clipPath = 'polygon(' + pts.map((p) => p[0] + '% ' + p[1] + '%').join(', ') + ')';
    T.show(codeBox, '<pre class="mono" style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;overflow-x:auto">' + T.esc(cssText()) + '</pre>');
    renderList();
  };

  const numCell = (val, idx, axis) => {
    const wrap = T.el('<div style="display:flex;gap:6px;align-items:center"></div>');
    const inp = T.input('number', axis === 0 ? 'X' : 'Y', String(val));
    inp.min = '0'; inp.max = '100'; inp.step = '1';
    inp.style.width = '76px';
    inp.addEventListener('input', () => {
      let v = parseFloat(inp.value);
      if (!Number.isFinite(v)) v = 0;
      pts[idx][axis] = Math.max(0, Math.min(100, Math.round(v * 10) / 10));
      shape.style.clipPath = 'polygon(' + pts.map((p) => p[0] + '% ' + p[1] + '%').join(', ') + ')';
      T.show(codeBox, '<pre class="mono" style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;overflow-x:auto">' + T.esc(cssText()) + '</pre>');
    });
    wrap.appendChild(T.el('<span class="hint" style="min-width:14px">' + (axis === 0 ? 'X' : 'Y') + '</span>'));
    wrap.appendChild(inp);
    wrap.appendChild(T.el('<span class="hint">%</span>'));
    return wrap;
  };

  function renderList() {
    listBox.innerHTML = '';
    pts.forEach((p, i) => {
      const row = T.el('<div style="display:flex;gap:10px;align-items:center;background:#18181b;border:1px solid #27272a;border-radius:10px;padding:8px 10px"></div>');
      row.appendChild(T.el('<b style="min-width:26px;font-size:13px">' + (i + 1) + '</b>'));
      row.appendChild(numCell(p[0], i, 0));
      row.appendChild(numCell(p[1], i, 1));
      const del = T.el('<button type="button" class="btn" style="margin-left:auto;padding:6px 10px">✕</button>');
      del.addEventListener('click', () => {
        if (pts.length <= 3) { T.toast('Minimal 3 titik biar jadi bentuk'); return; }
        pts.splice(i, 1);
        paint();
      });
      row.appendChild(del);
      listBox.appendChild(row);
    });
  }

  const presetRow = T.el('<div class="row" style="flex-wrap:wrap"></div>');
  Object.keys(PRESETS).forEach((name) => {
    const b = T.btn(name, () => { pts = PRESETS[name].map((p) => p.slice()); paint(); });
    presetRow.appendChild(b);
  });

  const addBtn = T.btn('＋ Tambah titik', () => {
    if (pts.length >= 24) { T.toast('Kebanyakan titik, 24 cukup'); return; }
    const last = pts[pts.length - 1];
    pts.push([Math.min(100, last[0] + 10), Math.min(100, last[1] + 10)]);
    paint();
  });

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih bentuk jadi, terus geser titiknya sesukamu — angka X/Y-nya bisa diketik manual. Preview-nya live, CSS-nya siap salin.</p>'));
  root.appendChild(T.el('<div class="fld"><label>Bentuk siap pakai</label></div>'));
  root.appendChild(presetRow);
  root.appendChild(previewBox);
  root.appendChild(T.el('<div class="fld"><label>Titik-titik polygon</label></div>'));
  root.appendChild(listBox);
  root.appendChild(T.row(addBtn));
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(cssText, 'Salin CSS')));
  paint();
}
