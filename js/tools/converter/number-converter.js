import { h as T, utils } from '../../core.js?v=5.0.1';

(function () {
    const TBL = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    utils.toRoman = function (n) {
      n = Math.floor(Number(n));
      if (!Number.isFinite(n) || n < 1 || n > 3999) return '';
      let s = '';
      for (const [v, r] of TBL) while (n >= v) { s += r; n -= v; }
      return s;
    };
    utils.fromRoman = function (s) {
      s = String(s == null ? '' : s).toUpperCase().trim();
      if (!/^[MDCLXVI]+$/.test(s)) return NaN;
      const V = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
      let total = 0, prev = 0;
      for (let i = s.length - 1; i >= 0; i--) {
        const v = V[s[i]];
        if (v < prev) total -= v; else { total += v; prev = v; }
      }
      return utils.toRoman(total) === s ? total : NaN;
    };
  })();

export const meta = {"id": "number-converter", "name": "Konverter Angka", "cat": "converter", "icon": "🔢", "desc": "Biner, oktal, desimal, hex, dan romawi."};

export function render(root) {

    const decInp = T.input('number', 'Angka desimal, misal: 2026', 2026);
    const out = T.out();
    const rInp = T.input('text', 'Romawi, misal: MMXXVI');
    rInp.autocapitalize = 'characters'; rInp.spellcheck = false;
    const dInp2 = T.input('number', 'Desimal, misal: 2026');
    const out2 = T.out();

    const basis = () => {
      const n = Math.floor(Number(decInp.value));
      if (!Number.isFinite(n)) { T.show(out, '<span class="err">Masukkan angka yang valid.</span>'); return; }
      const neg = n < 0, a = Math.abs(n), sgn = neg ? '-' : '';
      T.show(out,
        '<div class="kv"><span class="k">Biner</span><span class="v" class="monoall">' + sgn + a.toString(2) + '</span></div>' +
        '<div class="kv"><span class="k">Oktal</span><span class="v" class="monoall">' + sgn + a.toString(8) + '</span></div>' +
        '<div class="kv"><span class="k">Desimal</span><span class="v" class="monoall">' + T.fmt(n) + '</span></div>' +
        '<div class="kv"><span class="k">Hex</span><span class="v" class="monoall">' + sgn + a.toString(16).toUpperCase() + '</span></div>' +
        '<div class="kv"><span class="k">Romawi</span><span class="v" class="monoall">' + (n >= 1 && n <= 3999 ? utils.toRoman(n) : '<span class="dim">1-3999 saja</span>') + '</span></div>');
    };
    const r2d = () => {
      const v = utils.fromRoman(rInp.value);
      if (Number.isNaN(v)) T.show(out2, '<span class="err">Bukan angka romawi yang valid.</span>');
      else { T.show(out2, '<div class="kv"><span class="k">Desimal</span><span class="v big">' + T.fmt(v) + '</span></div>'); dInp2.value = v; }
    };
    const d2r = () => {
      const n = Math.floor(Number(dInp2.value));
      const r = utils.toRoman(n);
      if (!r) T.show(out2, '<span class="err">Romawi hanya untuk 1-3999.</span>');
      else { T.show(out2, '<div class="kv"><span class="k">Romawi</span><span class="v big" style="font-family:ui-monospace,monospace">' + r + '</span></div>'); rInp.value = r; }
    };
    root.appendChild(T.el('<h3 class="h3">Basis bilangan</h3>'));
    root.appendChild(T.field('Desimal', decInp));
    root.appendChild(T.row(T.btn('Konversi', basis, true)));
    root.appendChild(out);
    root.appendChild(T.el('<hr class="divi">'));
    root.appendChild(T.el('<h3 class="h3">Romawi ↔ Desimal</h3>'));
    root.appendChild(T.grid2(T.field('Romawi', rInp), T.field('Desimal', dInp2)));
    root.appendChild(T.row(T.btn('Romawi → Desimal', r2d), T.btn('Desimal → Romawi', d2r)));
    root.appendChild(out2);
    basis();
  
}
