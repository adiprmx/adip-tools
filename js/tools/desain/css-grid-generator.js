import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id":"css-grid-generator","name":"CSS Grid Generator","cat":"desain","icon":"🔳","desc":"Rancang layout grid, salin CSS-nya.","keywords":"grid,css,layout,kolom,baris,gap"};

export function render(root) {
  const numInp = (val, min, max) => {
    const i = T.input('number', '', String(val));
    i.min = String(min); i.max = String(max);
    return i;
  };
  const fKolom = numInp(4, 1, 12);
  const fBaris = numInp(3, 1, 12);
  const gapR = T.input('range'); gapR.min = '0'; gapR.max = '64'; gapR.value = '12';
  const gapV = T.el('<b>12px</b>');
  const modeSel = T.select([
    ['fr', 'Kolom tetap — repeat(N, 1fr)'],
    ['auto', 'Otomatis isi — auto-fit + minmax()'],
  ], 'fr');
  const minW = T.input('number', 'cth: 180', '180'); minW.inputMode = 'numeric';

  const preview = T.el('<div style="display:grid;gap:12px;margin:14px 0;padding:14px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden"></div>');
  const codeBox = T.out();

  const clampN = (i, dflt) => {
    let n = parseInt(i.value, 10);
    if (!Number.isFinite(n)) n = dflt;
    n = Math.max(parseInt(i.min, 10), Math.min(parseInt(i.max, 10), n));
    return n;
  };

  const cssText = () => {
    const g = gapR.value + 'px';
    if (modeSel.value === 'auto') {
      const mw = Math.max(80, parseInt(minW.value, 10) || 180);
      return '.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(' + mw + 'px, 1fr));\n  gap: ' + g + ';\n}';
    }
    const k = clampN(fKolom, 4), b = clampN(fBaris, 3);
    return '.grid {\n  display: grid;\n  grid-template-columns: repeat(' + k + ', 1fr);\n  grid-template-rows: repeat(' + b + ', auto);\n  gap: ' + g + ';\n}';
  };

  const paint = () => {
    const k = clampN(fKolom, 4), b = clampN(fBaris, 3), g = gapR.value + 'px';
    gapV.textContent = g;
    preview.style.gap = g;
    preview.innerHTML = '';
    const cols = modeSel.value === 'auto'
      ? 'repeat(auto-fit, minmax(' + Math.max(80, parseInt(minW.value, 10) || 180) + 'px, 1fr))'
      : 'repeat(' + k + ', 1fr)';
    preview.style.gridTemplateColumns = cols;
    const cells = modeSel.value === 'auto' ? 8 : Math.min(k * b, 144);
    for (let i = 0; i < cells; i++) {
      const d = document.createElement('div');
      d.style.cssText = 'background:#27272a;border:1px solid #3f3f46;border-radius:8px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#a1a1aa';
      d.textContent = i + 1;
      preview.appendChild(d);
    }
    T.show(codeBox, '<pre class="mono" style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;overflow-x:auto">' + T.esc(cssText()) + '</pre>' + (modeSel.value === 'auto' ? '<div class="hint" style="margin-top:8px">Mode auto-fit: jumlah kolom ngikutin lebar layar, baris nambah sendiri sesuai isi.</div>' : ''));
  };

  [fKolom, fBaris].forEach((i) => i.addEventListener('input', paint));
  gapR.addEventListener('input', paint);
  modeSel.addEventListener('change', () => {
    fBaris.closest('.fld').style.display = modeSel.value === 'auto' ? 'none' : '';
    paint();
  });
  minW.addEventListener('input', paint);

  const gapRow = T.el('<div style="display:flex;gap:10px;align-items:center"></div>');
  gapRow.appendChild(gapR); gapRow.appendChild(gapV);

  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Atur-atur dulu, lihat langsung jadinya di bawah, terus salin CSS-nya. Nggak usah nebak-nebak angka lagi.</p>'));
  root.appendChild(T.grid2(
    T.field('Jumlah kolom', fKolom, 'Maksimal 12.'),
    T.field('Jumlah baris', fBaris, 'Buat preview & grid-template-rows.')
  ));
  root.appendChild(T.field('Mode kolom', modeSel));
  root.appendChild(T.field('Lebar minimum tiap kolom (px)', minW, 'Hanya dipakai di mode otomatis isi.'));
  root.appendChild(T.field('Jarak antar sel (gap)', gapRow));
  root.appendChild(preview);
  root.appendChild(codeBox);
  root.appendChild(T.row(T.copyBtn(cssText, 'Salin CSS')));
  paint();
}
