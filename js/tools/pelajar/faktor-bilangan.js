import { h as T } from '../../core.js';

export const meta = { id: 'faktor-bilangan', name: 'Kalkulator Faktor Bilangan', cat: 'pelajar', icon: '✖️', desc: 'Cari semua bilangan yang bisa membagi habis suatu bilangan, lengkap dengan pasangan faktor dan jumlahnya.', keywords: 'faktor,pembagi,divisor,matematika,bilangan,kelipatan', since: '6.19.0' };

// Semua pembagi n, urut naik. Cari sampai akar n lalu pasangkan.
export function semuaFaktor(n) {
  if (!Number.isSafeInteger(n) || n < 1 || n > 1000000000000) return null;
  const kecil = [], besar = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d === 0) {
      kecil.push(d);
      if (d * d !== n) besar.push(n / d);
    }
  }
  return kecil.concat(besar.reverse());
}

export function pasanganFaktor(n) {
  const daftar = semuaFaktor(n);
  if (!daftar) return null;
  const hasil = [];
  for (let i = 0; i < daftar.length; i++) {
    const a = daftar[i], b = n / a;
    if (a > b) break;
    hasil.push([a, b]);
  }
  return hasil;
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Faktor adalah bilangan yang bisa membagi habis. Contoh: faktor dari 12 adalah 1, 2, 3, 4, 6, 12 karena 12 habis dibagi semuanya.</p>'));

  const nI = T.input('number', 'cth: 360', '360');
  const box = T.out();

  function hitung() {
    const n = T.num(nI.value);
    if (!Number.isSafeInteger(n) || n < 1 || n > 1000000000000) {
      T.show(box, '<p class="dim">Isi bilangan bulat 1 sampai 1.000.000.000.000.</p>');
      return;
    }
    const daftar = semuaFaktor(n);
    const pasangan = pasanganFaktor(n);
    const jumlah = daftar.reduce((a, b) => a + b, 0);
    const prima = daftar.length === 2;
    const tampilPasangan = pasangan.slice(0, 200).map(([a, b]) => T.fmt(a) + ' × ' + T.fmt(b)).join(', ');
    T.show(box,
      '<p class="big">' + T.fmt(daftar.length) + ' faktor</p>' +
      '<p style="word-break:break-all;line-height:1.9">' + daftar.slice(0, 500).map((x) => T.fmt(x)).join(', ') + (daftar.length > 500 ? ', …' : '') + '</p>' +
      '<p>Pasangan faktor: ' + tampilPasangan + (pasangan.length > 200 ? ', …' : '') + '</p>' +
      '<p>Jumlah semua faktor: <b>' + T.fmt(jumlah) + '</b></p>' +
      '<p class="hint">' + (prima
        ? T.fmt(n) + ' adalah bilangan prima, jadi faktornya hanya 1 dan dirinya sendiri.'
        : T.fmt(n) + ' bukan bilangan prima.') + ' Faktor dicari dengan mencoba pembagi sampai akar ' + T.fmt(n) + ' (' + T.fmt(Math.floor(Math.sqrt(n))) + '), lalu tiap pembagi dipasangkan dengan hasil baginya.</p>');
  }

  root.append(
    T.field('Bilangan', nI, 'Maksimal 1 triliun.'),
    T.btn('Cari faktor', hitung, true),
    box,
  );
  hitung();
}
