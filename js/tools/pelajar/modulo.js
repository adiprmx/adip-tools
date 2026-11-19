import { h as T, utils } from '../../core.js';

export const meta = { id: 'modulo', name: 'Kalkulator Modulo', cat: 'pelajar', icon: '➗', desc: 'Hitung sisa pembagian (modulo) dengan langkahnya, termasuk bilangan negatif dan cek kongruen.', keywords: 'modulo,mod,sisa bagi,sisa pembagian,kongruen,matematika,aritmetika modular', since: '6.19.0' };

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// Sisa pembagian ala matematika (hasil selalu 0 sampai |b|-1, walau a negatif).
// Beda dari operator % di JavaScript yang mengikuti tanda pembilang.
export function mod(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return n0(((a % b) + Math.abs(b)) % Math.abs(b));
}

// Pembagian lengkap: hasil bagi (dibulatkan ke bawah) + sisa.
export function bagiSisa(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  const bagi = Math.floor(a / b);
  const sisa = n0(a - bagi * b);
  return { bagi, sisa };
}

// Cek kongruen: a ≡ c (mod b) bila selisihnya habis dibagi b.
export function kongruen(a, c, b) {
  if (!Number.isFinite(a) || !Number.isFinite(c) || !Number.isFinite(b) || b === 0) return null;
  return mod(a - c, b) === 0;
}

const f = (x) => utils.fmtDes(x, 4);

export function render(root) {
  root.appendChild(T.el('<p class="hint">Modulo adalah sisa pembagian. Contoh: 17 mod 5 = 2, karena 17 = 3 × 5 + 2. Dipakai di jam (13 mod 12 = 1), hari, dan kriptografi.</p>'));

  const aI = T.input('number', 'cth: 17', '17');
  const bI = T.input('number', 'cth: 5', '5');
  const cI = T.input('number', 'cth: 2', '2');
  const box = T.out();

  function hitung() {
    const a = T.num(aI.value), b = T.num(bI.value), c = T.num(cI.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      T.show(box, '<p class="dim">Isi bilangan yang dibagi dan pembaginya.</p>');
      return;
    }
    if (b === 0) {
      T.show(box, '<p>Pembagi tidak boleh 0. Pembagian dengan 0 tidak ada hasilnya.</p>');
      return;
    }
    const hasil = mod(a, b);
    const { bagi, sisa } = bagiSisa(a, b);
    let cek = '';
    if (Number.isFinite(c)) {
      const sama = kongruen(a, c, b);
      cek = '<p>' + f(a) + ' ≡ ' + f(c) + ' (mod ' + f(b) + ')? <b>' + (sama ? 'Ya, kongruen' : 'Tidak') + '</b>' +
        (sama ? ' karena selisihnya ' + f(a - c) + ' habis dibagi ' + f(b) + '.' : ' karena selisihnya ' + f(a - c) + ' tidak habis dibagi ' + f(b) + '.') + '</p>';
    }
    T.show(box,
      '<p class="big">' + f(a) + ' mod ' + f(b) + ' = ' + f(hasil) + '</p>' +
      '<p class="hint"><b>Langkah:</b> ' + f(a) + ' ÷ ' + f(b) + ' = ' + f(bagi) + ' sisa ' + f(sisa) +
      '<br>' + f(a) + ' = ' + f(bagi) + ' × ' + f(b) + ' + ' + f(sisa) + '</p>' +
      '<p class="hint">Sisa selalu 0 sampai ' + f(Math.abs(b) - 1) + ', walau bilangan yang dibagi negatif (aturan matematika, bukan aturan tombol % di kalkulator biasa).</p>' +
      cek);
  }

  root.append(
    T.grid2(T.field('Bilangan yang dibagi', aI), T.field('Pembagi', bI)),
    T.field('Cek kongruen dengan (boleh kosong)', cI, 'Misal: apakah 17 kongruen dengan 2 modulo 5?'),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
