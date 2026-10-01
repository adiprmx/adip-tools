import { h as T, utils } from '../../core.js?v=6.8.0';

/* Tangga ukuran font harmonis: base px × ratio modular scale → h1–h6, p, small. */

const RATIOS = [
  ['1.2', '1.200 — Minor Third'],
  ['1.25', '1.250 — Major Third'],
  ['1.333', '1.333 — Perfect Fourth'],
  ['1.5', '1.500 — Perfect Fifth'],
];

// [label, eksponen, contoh teks]
const STEPS = [
  ['h1', 5, 'Judul Utama'],
  ['h2', 4, 'Sub Judul'],
  ['h3', 3, 'Bagian Penting'],
  ['h4', 2, 'Sub Bagian'],
  ['h5', 1, 'Judul Kecil'],
  ['h6', 0, 'Label'],
  ['p', 0, 'Paragraf isi — teks berjalan normal seperti artikel atau deskripsi produk.'],
  ['small', -1, 'Keterangan kecil, mis. catatan kaki atau caption.'],
];

const LS_KEY = 'skala-tipografi:v1';
function saveState(s) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* abaikan */ }
}
function loadState() {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? JSON.parse(v) : {};
  } catch (e) { return {}; }
}

const px = (base, ratio, exp) => +(base * Math.pow(ratio, exp)).toFixed(2);
const rem = (v) => +(v / 16).toFixed(3);

export const meta = {"id": "skala-tipografi", "name": "Skala Tipografi", "cat": "desain", "icon": "🔠", "desc": "Skala ukuran font harmonis h1–h6.", "keywords": "tipografi,skala,font,h1,css"};
export function render(root) {

  const saved = loadState();
  let base = Math.min(32, Math.max(8, +saved.base || 16));
  let ratio = RATIOS.some(([v]) => v === String(saved.ratio)) ? +saved.ratio : 1.333;

  const baseIn = T.input('number', 'Ukuran dasar (px)', String(base));
  baseIn.min = '8';
  baseIn.max = '32';
  const ratioSel = T.select(RATIOS, String(ratio));

  const list = T.el('<div style="margin:14px 0"></div>');
  const out = T.out();
  let lastCSS = '';

  function cssText() {
    const lines = [':root {'];
    STEPS.forEach(([label, exp]) => {
      const v = px(base, ratio, exp);
      lines.push('  --fs-' + label + ': ' + v + 'px; /* ' + rem(v) + 'rem */');
    });
    lines.push('}', '');
    STEPS.forEach(([label]) => {
      lines.push(label + ' { font-size: var(--fs-' + label + '); }');
    });
    return lines.join('\n');
  }

  function paint() {
    list.innerHTML = '';
    STEPS.forEach(([label, exp, sample]) => {
      const v = px(base, ratio, exp);
      const row = T.el('<div style="display:flex;gap:12px;align-items:baseline;padding:10px 0;border-bottom:1px solid #27272a"></div>');
      const chip = T.el('<span class="hint" style="min-width:44px;font-weight:700;color:#fff"></span>');
      chip.textContent = label;
      const prev = T.el('<div style="flex:1;min-width:0;line-height:1.25;word-break:break-word"></div>');
      prev.textContent = sample;
      prev.style.fontSize = v + 'px';
      const size = T.el('<span class="hint" style="white-space:nowrap"></span>');
      size.textContent = v + 'px · ' + rem(v) + 'rem';
      row.appendChild(chip);
      row.appendChild(prev);
      row.appendChild(size);
      list.appendChild(row);
    });
    lastCSS = cssText();
    T.show(out, '<pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.5;margin:0">' + T.esc(lastCSS) + '</pre>');
    saveState({ base, ratio });
  }

  function onBase() {
    const v = +baseIn.value;
    if (v >= 8 && v <= 32) { base = v; paint(); }
  }
  function onRatio() { ratio = +ratioSel.value; paint(); }
  baseIn.addEventListener('input', onBase);
  ratioSel.addEventListener('change', onRatio);
  T.onLeave(() => {
    baseIn.removeEventListener('input', onBase);
    ratioSel.removeEventListener('change', onRatio);
  });

  root.appendChild(T.grid2(
    T.field('Ukuran dasar (px)', baseIn, 'Ukuran teks isi / paragraf.'),
    T.field('Rasio skala', ratioSel, 'Semakin besar, lompatan antar level makin dramatis.')
  ));
  root.appendChild(list);
  root.appendChild(T.el('<div class="hint" style="margin:4px 0">CSS siap pakai:</div>'));
  root.appendChild(out);
  root.appendChild(T.row(T.copyBtn(() => lastCSS, 'Salin CSS')));
  root.appendChild(T.el('<div class="hint" style="margin-top:10px">Rumusnya simpel: ukuran = base × ratio<sup>langkah</sup>. Ganti base atau ratio, seluruh tangga ngikut otomatis — harmonis tanpa nebak-nebak.</div>'));

  paint();

}
