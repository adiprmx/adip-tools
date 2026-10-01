import { h as T, preHtml } from '../../core.js?v=6.5.0';

export const meta = {"id":"matriks-kalkulator","name":"Kalkulator Matriks","cat":"pelajar","icon":"🔢","desc":"Matriks 2×2 & 3×3: determinan, invers, transpos + langkahnya.","keywords":"matriks,determinan,invers,transpos,2x2,3x3,aljabar,linear,matematika"};

function fmtN(v) {
  if (!isFinite(v)) return '–';
  const r = Math.round(v * 10000) / 10000;
  return String(Object.is(r, -0) ? 0 : r);
}
function det2(m) { return m[0][0] * m[1][1] - m[0][1] * m[1][0]; }
function det3(m) {
  const a = m[0][0], b = m[0][1], c = m[0][2];
  const d = m[1][0], e = m[1][1], f = m[1][2];
  const g = m[2][0], h = m[2][1], i = m[2][2];
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}
function inv2(m) {
  const d = det2(m);
  if (Math.abs(d) < 1e-12) return null;
  return [[m[1][1] / d, -m[0][1] / d], [-m[1][0] / d, m[0][0] / d]];
}
function inv3(m) {
  const det = det3(m);
  if (Math.abs(det) < 1e-12) return null;
  const kof = (r, c) => {
    const rs = [0, 1, 2].filter((x) => x !== r);
    const cs = [0, 1, 2].filter((x) => x !== c);
    const minor = m[rs[0]][cs[0]] * m[rs[1]][cs[1]] - m[rs[0]][cs[1]] * m[rs[1]][cs[0]];
    return ((r + c) % 2 ? -minor : minor);
  };
  const adj = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) adj[c][r] = kof(r, c) / det; // adjoin = transpos kofaktor
  return adj;
}
function transpose(m) { return m[0].map((_, c) => m.map((r) => r[c])); }
function matStr(m) { return m.map((r) => '[' + r.map(fmtN).join('  ') + ']').join('\n'); }

export function render(root) {
  const DEFAULTS = { '2': [[1, 2], [3, 4]], '3': [[1, 2, 3], [0, 1, 4], [5, 6, 0]] };
  let size = '2';
  const inputs = [];
  const gridBox = T.el('<div></div>');
  const out = T.out();

  const build = () => {
    gridBox.innerHTML = '';
    inputs.length = 0;
    const n = +size;
    const def = DEFAULTS[size];
    const g = T.el('<div style="display:grid;grid-template-columns:repeat(' + n + ',64px);gap:6px;justify-content:center;margin:12px 0"></div>');
    for (let r = 0; r < n; r++) {
      inputs[r] = [];
      for (let c = 0; c < n; c++) {
        const inp = T.input('number', '', def[r][c]);
        inp.style.width = '64px';
        inp.style.textAlign = 'center';
        inp.setAttribute('aria-label', 'Elemen baris ' + (r + 1) + ' kolom ' + (c + 1));
        inputs[r][c] = inp;
        g.appendChild(inp);
      }
    }
    gridBox.appendChild(g);
  };

  const hitung = () => {
    const n = +size;
    const m = [];
    for (let r = 0; r < n; r++) {
      m[r] = [];
      for (let c = 0; c < n; c++) {
        const v = T.num(inputs[r][c].value);
        if (isNaN(v)) { T.show(out, '<p class="err">Semua elemen harus angka. Yang kosong isi 0 ya.</p>'); return; }
        m[r][c] = v;
      }
    }
    const det = n === 2 ? det2(m) : det3(m);
    const inv = n === 2 ? inv2(m) : inv3(m);
    let langkah;
    if (n === 2) {
      const a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1];
      langkah = 'det = (a × d) − (b × c)\n' +
        '    = (' + fmtN(a) + ' × ' + fmtN(d) + ') − (' + fmtN(b) + ' × ' + fmtN(c) + ')\n' +
        '    = ' + fmtN(a * d) + ' − ' + fmtN(b * c) + '\n' +
        '    = ' + fmtN(det);
    } else {
      const a = m[0][0], b = m[0][1], c = m[0][2];
      const d = m[1][0], e = m[1][1], f = m[1][2];
      const g = m[2][0], h = m[2][1], i = m[2][2];
      const t1 = e * i - f * h, t2 = d * i - f * g, t3 = d * h - e * g;
      langkah = 'det = a(ei − fh) − b(di − fg) + c(dh − eg)\n' +
        '    = ' + fmtN(a) + '(' + fmtN(e * i) + ' − ' + fmtN(f * h) + ') − ' + fmtN(b) + '(' + fmtN(d * i) + ' − ' + fmtN(f * g) + ') + ' + fmtN(c) + '(' + fmtN(d * h) + ' − ' + fmtN(e * g) + ')\n' +
        '    = ' + fmtN(a) + '(' + fmtN(t1) + ') − ' + fmtN(b) + '(' + fmtN(t2) + ') + ' + fmtN(c) + '(' + fmtN(t3) + ')\n' +
        '    = ' + fmtN(a * t1) + ' − ' + fmtN(b * t2) + ' + ' + fmtN(c * t3) + '\n' +
        '    = ' + fmtN(det);
    }
    let html = '<p style="font-size:15px;margin:0 0 8px">Determinan = <strong>' + fmtN(det) + '</strong></p>';
    html += preHtml(langkah);
    html += '<p class="mut" style="font-size:12px;margin:10px 0 4px">Invers' + (inv ? '' : ' — nggak ada, determinannya nol') + '</p>';
    if (inv) html += preHtml(matStr(inv));
    html += '<p class="mut" style="font-size:12px;margin:10px 0 4px">Transpos</p>';
    html += preHtml(matStr(transpose(m)));
    T.show(out, html);
  };

  const sizeSel = T.select([['2', '2 × 2'], ['3', '3 × 3']], '2');
  sizeSel.addEventListener('change', () => { size = sizeSel.value; build(); hitung(); });

  root.appendChild(T.el('<p class="hint">Isi elemen matriksnya, tekan hitung — determinan, invers, transpos, plus langkahnya biar bisa buat contekan belajar.</p>'));
  root.appendChild(T.field('Ukuran matriks', sizeSel));
  root.appendChild(gridBox);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(out);
  build();
  hitung();
}
