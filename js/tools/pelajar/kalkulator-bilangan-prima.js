import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-bilangan-prima', name: 'Kalkulator Bilangan Prima', cat: 'pelajar', icon: '🔍', desc: 'Cek apakah sebuah bilangan prima, cari prima berikutnya, dan daftar semua bilangan prima di rentang yang kamu tentukan.', keywords: 'bilangan prima,prime,prima,cek prima,daftar prima,matematika', since: '6.18.0' };

// Uji prima Miller-Rabin deterministik (basis 2,3,5,7,11,13,17 pasti benar
// untuk n < 341.550.071.728.321). Aritmetika modular pakai BigInt agar tepat
// untuk bilangan sampai 10^15.
function modPow(basis, pangkat, mod) {
  let hasil = 1n, b = basis % mod, p = pangkat;
  while (p > 0n) {
    if (p & 1n) hasil = (hasil * b) % mod;
    b = (b * b) % mod;
    p >>= 1n;
  }
  return hasil;
}

export function isPrima(n) {
  if (!Number.isSafeInteger(n) || n < 2) return false;
  const kecil = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
  for (const p of kecil) {
    if (n === p) return true;
    if (n % p === 0) return false;
  }
  const bn = BigInt(n);
  let d = bn - 1n, r = 0n;
  while ((d & 1n) === 0n) { d >>= 1n; r++; }
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n]) {
    if (a >= bn) continue;
    let x = modPow(a, d, bn);
    if (x === 1n || x === bn - 1n) continue;
    let lanjut = false;
    for (let i = 1n; i < r; i++) {
      x = (x * x) % bn;
      if (x === bn - 1n) { lanjut = true; break; }
    }
    if (!lanjut) return false;
  }
  return true;
}

// Faktor terkecil yang membagi n (untuk menjelaskan kenapa bukan prima).
export function faktorTerkecil(n) {
  if (n % 2 === 0) return 2;
  for (let d = 3; d * d <= n; d += 2) {
    if (n % d === 0) return d;
  }
  return n;
}

// Daftar prima dari a sampai b (saringan Eratosthenes). Batas: b maks 10 juta.
export function daftarPrima(a, b) {
  const lo = Math.max(2, Math.ceil(a)), hi = Math.floor(b);
  if (hi < lo || hi > 10000000) return null;
  const saring = new Uint8Array(hi + 1).fill(1);
  saring[0] = 0; saring[1] = 0;
  for (let i = 2; i * i <= hi; i++) {
    if (saring[i]) for (let j = i * i; j <= hi; j += i) saring[j] = 0;
  }
  const hasil = [];
  for (let i = lo; i <= hi; i++) if (saring[i]) hasil.push(i);
  return hasil;
}

export function primaBerikutnya(n) {
  let c = Math.max(2, Math.floor(n) + 1);
  if (c === 2) return 2;
  if (c % 2 === 0) c++;
  while (!isPrima(c)) c += 2;
  return c;
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Bilangan prima itu bilangan yang hanya bisa dibagi 1 dan dirinya sendiri. Bilangan 1 bukan prima, dan 2 adalah satu-satunya bilangan prima yang genap.</p>'));

  const mode = T.select([
    ['cek', 'Cek satu bilangan'],
    ['rentang', 'Daftar prima di rentang'],
    ['berikut', 'Prima berikutnya'],
  ], 'cek');
  const aI = T.input('number', 'cth: 97', '97');
  const bI = T.input('number', 'cth: 100', '100');
  const box = T.out();

  const wrapB = T.el('<div></div>');
  wrapB.appendChild(T.field('Sampai', bI, 'Rentang paling jauh 10 juta.'));

  function aturTampil() {
    wrapB.hidden = mode.value !== 'rentang';
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function hitung() {
    const a = T.num(aI.value);
    if (!Number.isSafeInteger(a) || a < 0 || a > 1000000000000000) { T.toast('Isi bilangan bulat 0 sampai 1.000.000.000.000.000'); return; }
    if (mode.value === 'cek') {
      if (a < 2) {
        T.show(box, '<p class="big">' + T.fmt(a) + ' bukan bilangan prima</p><p>Bilangan prima mulai dari 2. Angka 0 dan 1 bukan prima.</p>');
        return;
      }
      if (isPrima(a)) {
        T.show(box, '<p class="big">' + T.fmt(a) + ' adalah bilangan prima</p><p>' + T.fmt(a) + ' hanya bisa dibagi 1 dan ' + T.fmt(a) + ' sendiri.</p>');
      } else {
        const f = faktorTerkecil(a);
        T.show(box, '<p class="big">' + T.fmt(a) + ' bukan bilangan prima</p><p>' + T.fmt(a) + ' bisa dibagi ' + T.fmt(f) + ' (' + T.fmt(a) + ' ÷ ' + T.fmt(f) + ' = ' + T.fmt(a / f) + ').</p>');
      }
      return;
    }
    if (mode.value === 'berikut') {
      const p = primaBerikutnya(a);
      T.show(box, '<p class="big">' + T.fmt(p) + '</p><p>Bilangan prima pertama setelah ' + T.fmt(a) + ' adalah ' + T.fmt(p) + '.</p>');
      return;
    }
    const b = T.num(bI.value);
    if (!Number.isSafeInteger(b) || b < 0 || b > 10000000) { T.toast('Batas atasnya bilangan bulat sampai 10.000.000'); return; }
    if (b < a) { T.toast('Batas atas harus lebih besar dari batas bawah'); return; }
    const daftar = daftarPrima(a, b);
    if (!daftar) { T.toast('Rentangnya terlalu besar'); return; }
    if (daftar.length === 0) {
      T.show(box, '<p class="big">Tidak ada bilangan prima</p><p>Di antara ' + T.fmt(a) + ' dan ' + T.fmt(b) + ' tidak ada bilangan prima.</p>');
      return;
    }
    const tampil = daftar.slice(0, 1000);
    T.show(box,
      '<p class="big">' + T.fmt(daftar.length) + ' bilangan prima</p>' +
      '<p>Dari ' + T.fmt(a) + ' sampai ' + T.fmt(b) + '.</p>' +
      '<p style="word-break:break-all;line-height:1.9">' + tampil.map((x) => T.fmt(x)).join(', ') + (daftar.length > 1000 ? ', … (menampilkan 1.000 pertama dari ' + T.fmt(daftar.length) + ')' : '') + '</p>');
  }

  root.append(
    T.field('Yang mau dihitung', mode),
    T.field('Bilangan', aI),
    wrapB,
    T.btn('Hitung', hitung, true),
    box,
  );
}
