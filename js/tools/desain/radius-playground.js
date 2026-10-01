import { h as T, utils } from '../../core.js?v=6.7.0';

/* Atur border-radius tiap sudut secara visual: 4 slider + preview + CSS siap salin. */

const CORNERS = [
  ['tl', 'Kiri atas'],
  ['tr', 'Kanan atas'],
  ['br', 'Kanan bawah'],
  ['bl', 'Kiri bawah'],
];

function compress(vals, unit) {
  const [tl, tr, br, bl] = vals.map((v) => v + unit);
  if (tl === tr && tr === br && br === bl) return tl;
  if (tl === br && tr === bl) return tl + ' ' + tr;
  if (tr === bl) return tl + ' ' + tr + ' ' + br;
  return tl + ' ' + tr + ' ' + br + ' ' + bl;
}

export const meta = {"id": "radius-playground", "name": "Radius Playground", "cat": "desain", "icon": "⬛", "desc": "Atur border-radius tiap sudut secara visual.", "keywords": "border,radius,sudut,css,desain"};
export function render(root) {

  const state = { tl: 24, tr: 24, br: 24, bl: 24, unit: 'px' };
  const maxFor = () => (state.unit === 'px' ? 150 : 50);

  const unitSel = T.select([['px', 'px'], ['%', '%']], 'px');
  const slidersBox = T.el('<div></div>');
  const sliders = {};
  const labels = {};

  const preview = T.el('<div style="position:relative;height:180px;border-radius:12px;border:1px solid #3f3f46;margin:14px 0;background:linear-gradient(135deg,#fafafa,#e7e5e4);transition:border-radius .15s ease"></div>');
  const badges = {};
  CORNERS.forEach(([k]) => {
    const b = T.el('<span style="position:absolute;font-size:11px;font-weight:600;color:#fff;background:#18181b;border-radius:6px;padding:3px 8px;white-space:nowrap"></span>');
    b.style[k === 'tl' ? 'top' : k === 'tr' ? 'top' : 'bottom'] = '8px';
    b.style[k === 'tl' ? 'left' : k === 'bl' ? 'left' : 'right'] = '8px';
    badges[k] = b;
    preview.appendChild(b);
  });

  const out = T.out();
  let lastCSS = '';

  function paint() {
    const vals = CORNERS.map(([k]) => state[k]);
    preview.style.borderRadius = vals.map((v) => v + state.unit).join(' ');
    CORNERS.forEach(([k]) => { badges[k].textContent = state[k] + state.unit; });
    lastCSS = 'border-radius: ' + compress(vals, state.unit) + ';';
    T.show(out, '<pre style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5;margin:0">' + T.esc(lastCSS) + '</pre>');
  }

  CORNERS.forEach(([k, label]) => {
    const wrap = T.el('<div class="fld"><label>' + T.esc(label) + ' <span class="hint"></span></label></div>');
    const lbl = wrap.querySelector('span');
    const s = T.el(`<input type="range" min="0" max="150" value="${state[k]}" class="inp" style="width:100%">`);
    function onIn() {
      state[k] = +s.value;
      lbl.textContent = state[k] + state.unit;
      paint();
    }
    s.addEventListener('input', onIn);
    T.onLeave(() => s.removeEventListener('input', onIn));
    sliders[k] = s;
    labels[k] = lbl;
    lbl.textContent = state[k] + state.unit;
    wrap.appendChild(s);
    slidersBox.appendChild(wrap);
  });

  function syncSliders() {
    CORNERS.forEach(([k]) => {
      sliders[k].max = maxFor();
      sliders[k].value = state[k];
      labels[k].textContent = state[k] + state.unit;
    });
  }

  unitSel.addEventListener('change', () => {
    state.unit = unitSel.value;
    // konversi kasar biar bentuknya mirip saat ganti satuan
    if (state.unit === '%') {
      CORNERS.forEach(([k]) => { state[k] = Math.min(50, Math.round(state[k] / 3)); });
    } else {
      CORNERS.forEach(([k]) => { state[k] = Math.min(150, state[k] * 3); });
    }
    syncSliders();
    paint();
  });

  root.appendChild(T.field('Satuan', unitSel));
  root.appendChild(slidersBox);
  root.appendChild(preview);
  root.appendChild(T.el('<div class="hint" style="margin:4px 0">CSS:</div>'));
  root.appendChild(out);
  root.appendChild(T.row(
    T.copyBtn(() => lastCSS, 'Salin CSS'),
    T.btn('🎲 Acak', () => {
      CORNERS.forEach(([k]) => { state[k] = Math.floor(Math.random() * (maxFor() + 1)); });
      syncSliders();
      paint();
    }),
    T.btn('↺ Reset', () => {
      CORNERS.forEach(([k]) => { state[k] = 24; });
      syncSliders();
      paint();
    })
  ));
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Tips: nilai % dihitung dari lebar & tinggi kotak — 50% di semua sudut bikin lingkaran sempurna.</div>'));

  paint();

}
