import { h as T } from '../../core.js';

export const meta = { id: 'faktorial', name: 'Kalkulator Faktorial', cat: 'pelajar', icon: '❗', desc: 'Hitung n! dengan angka pasti sampai n = 1000, lengkap dengan jumlah digit, nol di belakang, dan langkahnya.', keywords: 'faktorial,n!,perkalian,matematika,kombinasi,permutasi,silap', since: '6.19.0' };

// n! dengan BigInt (angka pasti, tanpa pembulatan). Batas n = 1000.
export function faktorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 1000) return null;
  let hasil = 1n;
  for (let i = 2n; i <= BigInt(n); i++) hasil *= i;
  return hasil;
}

// Jumlah nol di belakang n! (rumus Legendre: n/5 + n/25 + ...).
export function nolBelakang(n) {
  let total = 0;
  let bagi = 5;
  while (bagi <= n) { total += Math.floor(n / bagi); bagi *= 5; }
  return total;
}

// Perkiraan Stirling: n! kira-kira sqrt(2*pi*n) × (n/e)^n.
export function stirling(n) {
  if (n <= 0) return 1;
  return Math.sqrt(2 * Math.PI * n) * Math.pow(n / Math.E, n);
}

const fmtBig = (b) => {
  const s = b.toString();
  if (s.length <= 15) return T.fmt(Number(b));
  // Di atas 15 digit, Number kehilangan ketelitian: kelompokkan dari string.
  if (s.length <= 30) return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return s.slice(0, 15) + '…' + s.slice(-10) + ' <span class="mut">(' + s.length + ' digit)</span>';
};

export function render(root) {
  root.appendChild(T.el('<p class="hint">Faktorial artinya mengalikan semua bilangan dari 1 sampai n. Contoh: 5! = 1 × 2 × 3 × 4 × 5 = 120. Dipakai di kombinasi, permutasi, dan peluang.</p>'));

  const nI = T.input('number', 'cth: 20', '20');
  const box = T.out();

  function hitung() {
    const n = T.num(nI.value);
    if (!Number.isInteger(n) || n < 0 || n > 1000) {
      T.show(box, '<p class="dim">Isi bilangan bulat 0 sampai 1000.</p>');
      return;
    }
    const hasil = faktorial(n);
    const digit = hasil.toString().length;
    const nol = nolBelakang(n);
    let langkah = '';
    if (n <= 1) langkah = n + '! = 1 (sudah ketentuan: 0! dan 1! sama dengan 1).';
    else if (n <= 10) {
      const suku = [];
      for (let i = 1; i <= n; i++) suku.push(i);
      langkah = n + '! = ' + suku.join(' × ') + ' = ' + T.fmt(Number(hasil));
    } else {
      langkah = n + '! = 1 × 2 × … × ' + n + ' (dihitung persis dengan angka besar, tanpa pembulatan).';
    }
    const kira = n >= 10 ? '<p class="hint">Perkiraan Stirling: ' + T.fmt(Math.round(stirling(n))) + ' (rumus cepat yang mendekati nilai aslinya).</p>' : '';
    T.show(box,
      '<p class="big">' + n + '! = ' + fmtBig(hasil) + '</p>' +
      '<p>Jumlah digit: <b>' + T.fmt(digit) + '</b> &nbsp;·&nbsp; Nol di belakang: <b>' + T.fmt(nol) + '</b></p>' +
      '<p class="hint">' + langkah + '</p>' + kira);
  }

  root.append(
    T.field('Bilangan (n)', nI, '0 sampai 1000. Hasilnya angka pasti, bukan perkiraan.'),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
