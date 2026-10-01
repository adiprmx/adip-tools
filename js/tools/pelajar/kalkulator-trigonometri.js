import { h as T, kvRows, tabs } from '../../core.js?v=6.8.0';

export const meta = {"id":"kalkulator-trigonometri","name":"Kalkulator Trigonometri","cat":"pelajar","icon":"📐","desc":"Sin cos tan (& kawan-kawan) dari derajat, atau cari sudutnya dari nilai.","keywords":"trigonometri,sin,cos,tan,sudut,derajat,arcsin,arccos,arctan,cosec,sec,cotan"};

const U = 'tak terdefinisi';
function r6(v) {
  const r = Math.round(v * 1e6) / 1e6;
  return String(Object.is(r, -0) ? 0 : r);
}
function r4(v) {
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Mode 1: sudut -> nilai ----
  const out1 = T.out();
  const degInp = T.input('number', 'mis. 30', '');
  const hitung1 = () => {
    const d = T.num(degInp.value);
    if (isNaN(d)) { T.show(out1, '<p class="err">Masukkan sudut dalam derajat dulu.</p>'); return; }
    const rad = d * Math.PI / 180;
    const s = Math.sin(rad), c = Math.cos(rad);
    const cosNol = Math.abs(c) < 1e-12;
    const sinNol = Math.abs(s) < 1e-12;
    const label = r6(d) + '°';
    T.show(out1, kvRows([
      ['sin ' + label, r6(s)],
      ['cos ' + label, r6(c)],
      ['tan ' + label, cosNol ? U : r6(Math.tan(rad))],
      ['cosec ' + label, sinNol ? U : r6(1 / s)],
      ['sec ' + label, cosNol ? U : r6(1 / c)],
      ['cotan ' + label, sinNol ? U : r6(1 / Math.tan(rad))],
    ]) + '<p class="hint" style="margin:8px 0 0">tan &amp; sec nggak ada di 90°, 270°, dst — soalnya cos-nya nol, pembagian dengan nol itu haram. 😄</p>');
  };
  degInp.addEventListener('input', hitung1);

  // ---- Mode 2: nilai -> sudut (invers) ----
  const out2 = T.out();
  const valInp = T.input('number', 'mis. 0.5', '');
  const hitung2 = () => {
    const v = T.num(valInp.value);
    if (isNaN(v)) { T.show(out2, '<p class="err">Masukkan nilainya dulu.</p>'); return; }
    const rows = [];
    if (v >= -1 && v <= 1) {
      rows.push(['arcsin ' + r6(v), r4(Math.asin(v) * 180 / Math.PI) + '°']);
      rows.push(['arccos ' + r6(v), r4(Math.acos(v) * 180 / Math.PI) + '°']);
    } else {
      rows.push(['arcsin / arccos', 'hanya untuk nilai −1 sampai 1']);
    }
    rows.push(['arctan ' + r6(v), r4(Math.atan(v) * 180 / Math.PI) + '°']);
    T.show(out2, kvRows(rows) +
      '<p class="hint" style="margin:8px 0 0">Sudut dalam derajat. arcsin: −90° sampai 90°, arccos: 0° sampai 180°, arctan: −90° sampai 90°.</p>');
  };
  valInp.addEventListener('input', hitung2);

  root.appendChild(T.el('<p class="hint">Mode sudut buat cari nilai sin cos tan-nya; mode invers buat cari sudutnya dari nilai. Semua pakai derajat.</p>'));
  root.appendChild(tabs([['Sudut → nilai', 0], ['Nilai → sudut', 1]], [p1, p2]));

  p1.appendChild(T.field('Sudut (derajat)', degInp));
  p1.appendChild(T.row(T.btn('Hitung', hitung1, true)));
  p1.appendChild(out1);

  p2.appendChild(T.field('Nilai', valInp, '−1 sampai 1 untuk arcsin & arccos; arctan bebas berapa aja.'));
  p2.appendChild(T.row(T.btn('Cari sudut', hitung2, true)));
  p2.appendChild(out2);

  root.appendChild(p1);
  root.appendChild(p2);
}
