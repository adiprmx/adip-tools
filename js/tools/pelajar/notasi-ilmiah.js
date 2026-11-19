import { h as T, utils } from '../../core.js';

export const meta = { id: 'notasi-ilmiah', name: 'Kalkulator Notasi Ilmiah', cat: 'pelajar', icon: '🔬', desc: 'Ubah bilangan biasa ke notasi ilmiah dan sebaliknya, plus tambah kurang kali bagi dalam notasi ilmiah.', keywords: 'notasi ilmiah,scientific notation,eksponen,10 pangkat,matematika,fisika', since: '6.19.0' };

const n0 = (v) => (Object.is(v, -0) ? 0 : v);
const SUPER = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const pangkatStr = (e) => String(e).split('').map((c) => SUPER[c] || c).join('');

// Ubah bilangan ke {mantissa, eksponen}: 12300 -> {1,23, 4}.
export function keNotasiIlmiah(x) {
  if (!Number.isFinite(x)) return null;
  if (x === 0) return { mantissa: 0, eksponen: 0 };
  const eksponen = Math.floor(Math.log10(Math.abs(x)));
  const mantissa = n0(x / Math.pow(10, eksponen));
  return { mantissa, eksponen };
}

// Notasi ilmiah ke bilangan biasa: 1,23 × 10^4 -> 12300.
export function dariNotasiIlmiah(mantissa, eksponen) {
  if (!Number.isFinite(mantissa) || !Number.isInteger(eksponen)) return null;
  return n0(mantissa * Math.pow(10, eksponen));
}

// Operasi dua bilangan dalam notasi ilmiah, hasilnya dalam notasi ilmiah.
export function operasiIlmiah(m1, e1, m2, e2, op) {
  const a = dariNotasiIlmiah(m1, e1);
  const b = dariNotasiIlmiah(m2, e2);
  if (a == null || b == null) return null;
  let hasil;
  if (op === '+') hasil = a + b;
  else if (op === '-') hasil = a - b;
  else if (op === '×') hasil = a * b;
  else if (op === '÷') { if (b === 0) return null; hasil = a / b; }
  else return null;
  return keNotasiIlmiah(hasil);
}

const tampilIlmiah = (m, e) => utils.fmtDes(m, 6) + ' × 10' + pangkatStr(e);
const f = (x) => utils.fmtDes(x, 6);

export function render(root) {
  root.appendChild(T.el('<p class="hint">Notasi ilmiah menulis bilangan besar atau kecil dengan ringkas: 12.300 = 1,23 × 10⁴. Mantissa selalu 1 sampai 10 (kurang dari 10).</p>'));

  const mode = T.select([
    ['ke', 'Bilangan biasa → notasi ilmiah'],
    ['dari', 'Notasi ilmiah → bilangan biasa'],
    ['operasi', 'Hitung dua bilangan notasi ilmiah'],
  ], 'ke');
  const biasaI = T.input('text', 'cth: 12300 atau 0,000045', '12300');
  const m1I = T.input('text', 'cth: 1,23', '1,23');
  const e1I = T.input('number', 'cth: 4', '4');
  const opS = T.select([['+', '+'], ['-', '−'], ['×', '×'], ['÷', '÷']], '×');
  const m2I = T.input('text', 'cth: 2', '2');
  const e2I = T.input('number', 'cth: 3', '3');
  const box = T.out();

  const wrapBiasa = T.el('<div></div>');
  wrapBiasa.appendChild(T.field('Bilangan biasa', biasaI));
  const wrapDari = T.el('<div></div>');
  wrapDari.appendChild(T.grid2(T.field('Mantissa (1 sampai 10)', m1I), T.field('Pangkat 10', e1I)));
  // Satu input tidak bisa ada di dua tempat: mode operasi pakai salinan sendiri.
  const m1b = T.input('text', 'cth: 1,23', '1,23');
  const e1b = T.input('number', 'cth: 4', '4');
  const wrapOp = T.el('<div></div>');
  wrapOp.append(
    T.grid2(T.field('Mantissa pertama', m1b), T.field('Pangkat pertama', e1b)),
    T.field('Operasi', opS),
    T.grid2(T.field('Mantissa kedua', m2I), T.field('Pangkat kedua', e2I)),
  );

  const aturTampil = () => {
    wrapBiasa.hidden = mode.value !== 'ke';
    wrapDari.hidden = mode.value !== 'dari';
    wrapOp.hidden = mode.value !== 'operasi';
  };
  mode.addEventListener('change', () => { aturTampil(); hitung(); });
  aturTampil();

  function hitung() {
    if (mode.value === 'ke') {
      const x = T.num(biasaI.value);
      if (!Number.isFinite(x)) { T.show(box, '<p class="dim">Isi bilangan biasa, misal 12300 atau 0,000045.</p>'); return; }
      const { mantissa, eksponen } = keNotasiIlmiah(x);
      T.show(box,
        '<p class="big">' + tampilIlmiah(mantissa, eksponen) + '</p>' +
        '<p class="hint">Koma digeser ' + T.fmt(Math.abs(eksponen)) + ' tempat ' + (eksponen >= 0 ? 'ke kiri' : 'ke kanan') + ' sampai tersisa satu angka di depan koma.</p>');
      return;
    }
    if (mode.value === 'dari') {
      const m = T.num(m1I.value), e = T.num(e1I.value);
      if (!Number.isFinite(m) || !Number.isInteger(e) || Math.abs(e) > 308) {
        T.show(box, '<p class="dim">Isi mantissa dan pangkat (bilangan bulat, maksimal 308).</p>'); return;
      }
      const hasil = dariNotasiIlmiah(m, e);
      T.show(box,
        '<p class="big">' + T.fmt(hasil) + '</p>' +
        '<p class="hint">' + tampilIlmiah(m, e) + ' = ' + f(m) + ' × 10' + pangkatStr(e) + ' = ' + T.fmt(hasil) + '</p>');
      return;
    }
    const m1 = T.num(m1b.value), e1 = T.num(e1b.value);
    const m2 = T.num(m2I.value), e2 = T.num(e2I.value);
    if (!Number.isFinite(m1) || !Number.isFinite(m2) || !Number.isInteger(e1) || !Number.isInteger(e2) || Math.abs(e1) > 308 || Math.abs(e2) > 308) {
      T.show(box, '<p class="dim">Isi kedua bilangan lengkap: mantissa dan pangkatnya.</p>'); return;
    }
    const hasil = operasiIlmiah(m1, e1, m2, e2, opS.value);
    if (!hasil) { T.show(box, '<p>Tidak bisa dibagi 0.</p>'); return; }
    const biasa = dariNotasiIlmiah(hasil.mantissa, hasil.eksponen);
    T.show(box,
      '<p class="big">' + tampilIlmiah(hasil.mantissa, hasil.eksponen) + '</p>' +
      '<p>Bilangan biasa: ' + T.fmt(biasa) + '</p>' +
      '<p class="hint">' + tampilIlmiah(m1, e1) + ' ' + opS.value + ' ' + tampilIlmiah(m2, e2) + ' = ' + tampilIlmiah(hasil.mantissa, hasil.eksponen) + '</p>');
  }

  root.append(
    T.field('Yang mau dihitung', mode),
    wrapBiasa, wrapDari, wrapOp,
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
