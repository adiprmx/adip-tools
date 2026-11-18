import { h as T, esc } from '../../core.js';

// Kemungkinan golongan darah ABO anak dari golongan darah kedua orang tua
// (pewarisan Mendel: tiap orang tua menurunkan satu alel A, B, atau O).
// Kunci dibaca dua arah: "A,B" sama dengan "B,A".
const ABO = {
  'O,O': ['O'],
  'O,A': ['O', 'A'],
  'O,B': ['O', 'B'],
  'O,AB': ['A', 'B'],
  'A,A': ['O', 'A'],
  'A,B': ['O', 'A', 'B', 'AB'],
  'A,AB': ['A', 'B', 'AB'],
  'B,B': ['O', 'B'],
  'B,AB': ['A', 'B', 'AB'],
  'AB,AB': ['A', 'B', 'AB'],
};

function kemungkinanABO(a, b) {
  return ABO[a + ',' + b] || ABO[b + ',' + a] || [];
}

export const meta = {"id": "kalkulator-golongan-darah-anak", "name": "Kalkulator Golongan Darah Anak", "cat": "kesehatan", "icon": "🩸", "desc": "Golongan darah apa saja yang mungkin dimiliki anakmu, dari golongan darah ayah dan ibu.", "keywords": "golongan darah,anak,abo,rhesus,warisan,genetik,darah", "since": "6.17.0"};
export function render(root) {
  const gol = [['O', 'O'], ['A', 'A'], ['B', 'B'], ['AB', 'AB']];
  const rh = [['+', 'Positif (+)'], ['-', 'Negatif (-)']];
  const ayahGol = T.select(gol, 'A');
  const ayahRh = T.select(rh, '+');
  const ibuGol = T.select(gol, 'B');
  const ibuRh = T.select(rh, '-');
  const box = T.out();

  const hitung = () => {
    const abo = kemungkinanABO(ayahGol.value, ibuGol.value);
    // Rhesus: dua orang tua negatif pasti menurunkan negatif. Bila salah
    // satu positif, anak bisa positif atau negatif, tergantung gen yang
    // dibawa orang tua positif itu (tidak terlihat dari golongan darah saja).
    const rhAnak = (ayahRh.value === '-' && ibuRh.value === '-') ? ['Negatif (-)'] : ['Positif (+)', 'Negatif (-)'];
    const daftar = [];
    abo.forEach((g) => rhAnak.forEach((r) => daftar.push(g + ' ' + r)));
    T.show(box,
      '<div class="center"><div class="dim">Golongan darah yang mungkin dimiliki anak</div>' +
      '<div class="big" style="font-size:26px">' + daftar.map(esc).join(', ') + '</div></div>' +
      '<div class="kv"><span class="k">Golongan ABO</span><span class="v">' + abo.map(esc).join(', ') + '</span></div>' +
      '<div class="kv"><span class="k">Rhesus</span><span class="v">' + rhAnak.map(esc).join(' atau ') + '</span></div>' +
      '<p class="hint">Ini kemungkinan berdasarkan pewarisan gen, bukan kepastian. Tiap anak bisa dapat kombinasi yang beda, dan ada kasus langka (misal golongan Bombay) yang tidak ikut tabel ini. ' +
      'Satu-satunya cara tahu pasti adalah tes golongan darah langsung. Hasil ini untuk belajar saja, bukan untuk memastikan hubungan orang tua dan anak. ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Buat keputusan medis, konsultasikan ke tenaga kesehatan.</p>');
  };

  root.appendChild(T.el('<p class="mut" style="margin:4px 0 6px;font-weight:600">Ayah</p>'));
  root.appendChild(T.grid2(
    T.field('Golongan darah ayah', ayahGol),
    T.field('Rhesus ayah', ayahRh),
  ));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Ibu</p>'));
  root.appendChild(T.grid2(
    T.field('Golongan darah ibu', ibuGol),
    T.field('Rhesus ibu', ibuRh),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
