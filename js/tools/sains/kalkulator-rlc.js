import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-rlc', name: 'Kalkulator RLC', cat: 'sains', icon: '📻', desc: 'Resonansi, impedansi, dan reaktansi rangkaian RLC seri. Lihat frekuensi resonansinya dan sifat rangkaiannya pada frekuensi yang kamu pilih.', keywords: 'rlc,resonansi,impedansi,reaktansi,induktansi,kapasitansi,frekuensi,rangkaian', since: '6.19.0' };

// Frekuensi resonansi (Hz): f0 = 1 / (2 pi sqrt(L C)). L henry, C farad.
export function frekuensiResonansi(L, C) {
  if (!(L > 0) || !(C > 0)) return NaN;
  return 1 / (2 * Math.PI * Math.sqrt(L * C));
}

// Reaktansi induktif dan kapasitif (ohm) pada frekuensi f (Hz).
export function reaktansi(f, L, C) {
  if (!(f > 0) || !(L > 0) || !(C > 0)) return { XL: NaN, XC: NaN };
  return { XL: 2 * Math.PI * f * L, XC: 1 / (2 * Math.PI * f * C) };
}

// Impedansi rangkaian seri (ohm): Z = sqrt(R^2 + (XL - XC)^2).
export function impedansi(R, XL, XC) {
  if (![R, XL, XC].every((x) => isFinite(x) && x >= 0)) return NaN;
  return Math.sqrt(R * R + (XL - XC) * (XL - XC));
}

// Sudut fasa (derajat): positif = tegangan mendahului arus (induktif).
export function sudutFasa(R, XL, XC) {
  if (![R, XL, XC].every((x) => isFinite(x))) return NaN;
  return (Math.atan2(XL - XC, R) * 180) / Math.PI;
}

// Faktor kualitas rangkaian seri: Q = (1/R) sqrt(L/C).
export function faktorQ(R, L, C) {
  if (!(R > 0) || !(L > 0) || !(C > 0)) return NaN;
  return (1 / R) * Math.sqrt(L / C);
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Rangkaian RLC seri punya satu frekuensi istimewa, frekuensi resonansi, tempat reaktansi kumparan dan kapasitor saling meniadakan sehingga impedansinya paling kecil, sama dengan hambatannya saja.</p>'));

  const rI = T.input('number', 'mis. 10', '10');
  const lI = T.input('number', 'mis. 100', '100');
  const cI = T.input('number', 'mis. 100', '100');
  const fI = T.input('number', 'kosongkan = frekuensi resonansi', '');
  const box = T.out();

  function hitung() {
    const R = T.num(rI.value);
    const L = T.num(lI.value) / 1000; // mH ke H
    const C = T.num(cI.value) * 1e-6; // uF ke F
    if (!isFinite(R) || R < 0) { T.toast('Hambatannya harus 0 atau lebih'); return; }
    if (!(L > 0)) { T.toast('Induktansinya harus lebih dari 0'); return; }
    if (!(C > 0)) { T.toast('Kapasitansinya harus lebih dari 0'); return; }
    const f0 = frekuensiResonansi(L, C);
    let f = T.num(fI.value);
    if (!isFinite(f) || f <= 0) f = f0;
    const { XL, XC } = reaktansi(f, L, C);
    const Z = impedansi(R, XL, XC);
    const sudut = sudutFasa(R, XL, XC);
    const Q = faktorQ(R, L, C);
    const lebarPita = R > 0 ? f0 / Q : NaN; // Hz
    const sifat = Math.abs(XL - XC) < 0.01 * Math.max(XL, XC)
      ? 'Resonansi (XL dan XC hampir sama)'
      : XL > XC ? 'Induktif (XL lebih besar dari XC)' : 'Kapasitif (XC lebih besar dari XL)';
    T.show(box,
      '<p class="big">Frekuensi resonansi: ' + utils.fmtDes(f0, 2) + ' Hz</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Reaktansi induktif XL</span><span class="v">' + utils.fmtDes(XL, 2) + ' Ω</span></div>' +
      '<div class="kv"><span class="k">Reaktansi kapasitif XC</span><span class="v">' + utils.fmtDes(XC, 2) + ' Ω</span></div>' +
      '<div class="kv"><span class="k">Impedansi Z di ' + utils.fmtDes(f, 1) + ' Hz</span><span class="v">' + utils.fmtDes(Z, 2) + ' Ω</span></div>' +
      '<div class="kv"><span class="k">Sudut fasa</span><span class="v">' + utils.fmtDes(sudut, 2) + '°</span></div>' +
      '<div class="kv"><span class="k">Faktor kualitas Q</span><span class="v">' + utils.fmtDes(Q, 3) + '</span></div>' +
      '<div class="kv"><span class="k">Lebar pita</span><span class="v">' + (isFinite(lebarPita) ? utils.fmtDes(lebarPita, 2) + ' Hz' : 'tidak terhitung') + '</span></div>' +
      '</div>' +
      '<p class="hint">Sifat rangkaian pada ' + utils.fmtDes(f, 1) + ' Hz: ' + sifat + '. Q yang besar berarti resonansinya tajam: rangkaiannya sangat selektif di sekitar frekuensi resonansi.</p>');
  }

  root.append(
    T.grid2(T.field('Hambatan R (ohm)', rI), T.field('Induktansi L (mH)', lI)),
    T.grid2(T.field('Kapasitansi C (µF)', cI), T.field('Frekuensi uji (Hz, opsional)', fI)),
    T.btn('Hitung rangkaiannya', hitung, true),
    box,
  );
}
