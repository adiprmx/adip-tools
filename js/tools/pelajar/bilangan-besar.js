import { h as T } from '../../core.js';

export const meta = { id: 'bilangan-besar', name: 'Kalkulator Bilangan Besar', cat: 'pelajar', icon: '🔢', desc: 'Hitung tambah kurang kali bagi dan pangkat untuk bilangan raksasa sampai ribuan digit, hasilnya persis tanpa pembulatan.', keywords: 'bilangan besar,big number,bigint,angka raksasa,perkalian besar,matematika', since: '6.19.0' };

// Parse bilangan bulat besar dari teks (boleh pakai titik pemisah ribuan).
// Titik hanya sah sebagai pemisah ribuan (kelompok 3 digit): '1.234' = 1234,
// tapi '1.5' DITOLAK (bukan ribuan yang valid, dan ini kalkulator bilangan
// bulat — desimal tidak berlaku). Batas 5000 digit per bilangan.
export function parseBesar(teks) {
  const s = String(teks || '').trim().replace(/\s/g, '');
  const inti = s.replace(/^[+-]/, '');
  if (inti.includes('.') && !/^\d{1,3}(\.\d{3})+$/.test(inti)) return null;
  const bersih = s.replace(/\./g, '');
  if (!/^[+-]?\d+$/.test(bersih)) return null;
  const digit = bersih.replace(/^[+-]/, '').replace(/^0+/, '') || '0';
  if (digit.length > 5000) return null;
  try { return BigInt(bersih); } catch (e) { return null; }
}

// Operasi BigInt: + - * / (bagi bulat + sisa) ^ (pangkat, eksponen maks 10000).
export function hitungBesar(a, b, op) {
  if (a == null || b == null) return null;
  if (op === '+') return { hasil: a + b };
  if (op === '-') return { hasil: a - b };
  if (op === '*') return { hasil: a * b };
  if (op === '/') {
    if (b === 0n) return { error: 'Tidak bisa dibagi 0.' };
    return { hasil: a / b, sisa: a % b };
  }
  if (op === '^') {
    if (b < 0n || b > 10000n) return { error: 'Pangkatnya 0 sampai 10000.' };
    if (a !== 0n && a !== 1n && a !== -1n) {
      const digitHasil = Number(b) * a.toString().replace('-', '').length;
      if (digitHasil > 100000) return { error: 'Hasilnya lebih dari 100.000 digit, terlalu besar.' };
    }
    return { hasil: a ** b };
  }
  return null;
}

const fmtBesar = (b) => {
  const s = b.toString();
  const neg = s.startsWith('-');
  const d = neg ? s.slice(1) : s;
  if (d.length <= 30) return (neg ? '-' : '') + d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-' : '') + d.slice(0, 15) + '…' + d.slice(-10) + ' <span class="mut">(' + d.length + ' digit)</span>';
};

export function render(root) {
  root.appendChild(T.el('<p class="hint">Kalkulator biasa membulatkan bilangan besar. Tool ini memakai hitungan bilangan bulat persis, jadi hasilnya akurat sampai ribuan digit. Tulis angkanya tanpa koma desimal.</p>'));

  const aI = T.input('text', 'cth: 12345678901234567890', '12345678901234567890');
  const bI = T.input('text', 'cth: 98765432109876543210', '98765432109876543210');
  const opS = T.select([
    ['+', 'Tambah (+)'],
    ['-', 'Kurang (−)'],
    ['*', 'Kali (×)'],
    ['/', 'Bagi (÷, hasil bulat + sisa)'],
    ['^', 'Pangkat (^)'],
  ], '*');
  const box = T.out();

  function hitung() {
    const a = parseBesar(aI.value);
    const b = parseBesar(bI.value);
    if (a == null || b == null) {
      T.show(box, '<p class="dim">Isi dua bilangan bulat (tanpa koma desimal), masing-masing maksimal 5000 digit.</p>');
      return;
    }
    const r = hitungBesar(a, b, opS.value);
    if (!r || r.error) {
      T.show(box, '<p>' + (r && r.error ? r.error : 'Tidak bisa dihitung.') + '</p>');
      return;
    }
    const simbol = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' }[opS.value];
    const digitA = a.toString().replace(/^-/, '').replace(/^0+/, '').length || 1;
    const digitB = b.toString().replace(/^-/, '').replace(/^0+/, '').length || 1;
    const digitHasil = r.hasil.toString().replace(/^-/, '').replace(/^0+/, '').length || 1;
    T.show(box,
      '<p class="big">' + fmtBesar(r.hasil) + '</p>' +
      '<p class="hint">' + fmtBesar(a) + ' ' + simbol + ' ' + fmtBesar(b) + '</p>' +
      (r.sisa !== undefined ? '<p>Sisa pembagian: <b>' + fmtBesar(r.sisa) + '</b></p>' : '') +
      '<p class="hint">Bilangan pertama ' + T.fmt(digitA) + ' digit, kedua ' + T.fmt(digitB) + ' digit, hasil ' + T.fmt(digitHasil) + ' digit. Hasilnya persis, tanpa pembulatan.</p>');
  }

  root.append(
    T.field('Bilangan pertama', aI),
    T.field('Operasi', opS),
    T.field('Bilangan kedua', bI, 'Untuk pangkat, isi pangkatnya (0 sampai 10000).'),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
