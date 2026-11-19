import { h as T } from '../../core.js';

export const meta = { id: 'faktorisasi-prima', name: 'Kalkulator Faktorisasi Prima', cat: 'pelajar', icon: '🌳', desc: 'Uraikan satu bilangan jadi perkalian bilangan prima, dengan pohon faktor bercabang, bentuk pangkat, dan semua faktornya.', keywords: 'faktorisasi,prima,pohon faktor,faktor prima,pangkat,matematika,sd,smp', since: '6.19.0' };

// Beda dari FPB & KPK (fpb-kpk.js): tool itu butuh minimal 2 bilangan dan
// faktorisasi di sana hanya langkah menuju FPB/KPK. Tool ini khusus SATU
// bilangan: pohon faktor bercabang, bentuk pangkat, cek prima, dan daftar
// semua faktor.

// Faktorisasi prima n jadi daftar [prima, pangkat], urut naik.
export function faktorisasi(n) {
  if (!Number.isSafeInteger(n) || n < 2 || n > 1000000000000) return null;
  const hasil = [];
  let sisa = n;
  let p = 2;
  while (p * p <= sisa) {
    if (sisa % p === 0) {
      let pangkat = 0;
      while (sisa % p === 0) { sisa /= p; pangkat++; }
      hasil.push([p, pangkat]);
    }
    p += p === 2 ? 1 : 2;
  }
  if (sisa > 1) hasil.push([sisa, 1]);
  return hasil;
}

const SUPER = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const pangkatStr = (e) => String(e).split('').map((c) => SUPER[c] || c).join('');

// Bentuk pangkat: 360 -> "2³ × 3² × 5".
export function bentukPangkat(faktor) {
  return faktor.map(([p, e]) => e > 1 ? p + pangkatStr(e) : String(p)).join(' × ');
}

// Pohon faktor bercabang (teks): tiap baris memecah satu bilangan jadi
// prima × sisa, dengan indentasi yang menunjukkan cabangnya.
export function pohonFaktor(n) {
  const faktor = faktorisasi(n);
  if (!faktor) return null;
  if (faktor.length === 1 && faktor[0][1] === 1) return [String(n) + ' adalah bilangan prima, jadi tidak bisa dipecah lagi.'];
  const baris = [];
  let sisa = n;
  let indent = 0;
  const daftar = [];
  faktor.forEach(([p, e]) => { for (let i = 0; i < e; i++) daftar.push(p); });
  for (let i = 0; i < daftar.length - 1; i++) {
    const p = daftar[i];
    const bagi = sisa / p;
    baris.push(' '.repeat(indent) + sisa + ' → ' + p + ' × ' + bagi);
    sisa = bagi;
    indent += 2;
  }
  baris.push(' '.repeat(indent) + '└─ ' + sisa + ' (prima)');
  return baris;
}

export function semuaFaktorDari(n) {
  const kecil = [], besar = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d === 0) { kecil.push(d); if (d * d !== n) besar.push(n / d); }
  }
  return kecil.concat(besar.reverse());
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Faktorisasi prima artinya memecah bilangan jadi perkalian bilangan-bilangan prima. Contoh: 360 = 2³ × 3² × 5. Masukkan satu bilangan saja.</p>'));

  const nI = T.input('number', 'cth: 360', '360');
  const box = T.out();

  function hitung() {
    const n = T.num(nI.value);
    if (!Number.isSafeInteger(n) || n < 2 || n > 1000000000000) {
      T.show(box, '<p class="dim">Isi bilangan bulat 2 sampai 1.000.000.000.000.</p>');
      return;
    }
    const faktor = faktorisasi(n);
    const prima = faktor.length === 1 && faktor[0][1] === 1;
    const daftar = semuaFaktorDari(n);
    const pohon = pohonFaktor(n);
    T.show(box,
      '<p class="big">' + T.fmt(n) + ' = ' + bentukPangkat(faktor) + '</p>' +
      '<p class="hint">Faktor prima yang dipakai: ' + faktor.map(([p]) => T.fmt(p)).join(', ') + '</p>' +
      '<p><b>Pohon faktor</b></p>' +
      '<pre style="margin:6px 0;font-size:13px;line-height:1.7;white-space:pre-wrap">' + pohon.join('\n') + '</pre>' +
      '<p>Semua faktor ' + T.fmt(n) + ' (' + T.fmt(daftar.length) + ' buah): ' + daftar.slice(0, 200).map((x) => T.fmt(x)).join(', ') + (daftar.length > 200 ? ', …' : '') + '</p>' +
      '<p class="hint">' + (prima
        ? T.fmt(n) + ' adalah bilangan prima: hanya bisa dibagi 1 dan dirinya sendiri.'
        : 'Cara bacanya: mulai dari ' + T.fmt(n) + ', bagi dengan bilangan prima terkecil yang bisa membagi habis, ulangi sampai sisanya prima.') + '</p>');
  }

  root.append(
    T.field('Bilangan', nI, 'Satu bilangan, maksimal 1 triliun.'),
    T.btn('Uraikan', hitung, true),
    box,
  );
  hitung();
}
