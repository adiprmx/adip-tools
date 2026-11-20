import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-fibonacci-retracement", "name": "Kalkulator Fibonacci Retracement", "cat": "bisnis", "icon": "📉", "desc": "Level harga Fibonacci (23,6% sampai 78,6%) untuk melihat kemungkinan pantulan harga saham atau kripto.", "keywords": "fibonacci,retracement,trading,saham,kripto,level harga,analisis teknikal,61,8%,38,2%", "since": "6.19.0"};

export const RASIO = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

const fmtH = (x) => {
  const r = Math.round(x * 100) / 100;
  return String(r === 0 ? 0 : r).replace('.', ',');
};

/* Level retracement Fibonacci. Arah 'naik': harga naik dari rendah ke tinggi
   lalu koreksi turun; level = tinggi - rasio x (tinggi - rendah).
   Arah 'turun': kebalikannya. Mengembalikan daftar {rasio, harga}. */
export function hitungFibonacci(rendah, tinggi, arah) {
  const lo = Number(rendah), hi = Number(tinggi);
  if (![lo, hi].every(isFinite) || hi <= lo) return null;
  const jarak = hi - lo;
  return RASIO.map((r) => ({
    rasio: r,
    harga: arah === 'turun' ? lo + r * jarak : hi - r * jarak,
  }));
}
utils.fibonacciRetracement = hitungFibonacci;

export function render(root) {
  const rendahI = T.input('text', 'cth: 1000', '');
  const tinggiI = T.input('text', 'cth: 1500', '');
  const arahS = T.select([['naik', 'Harga naik lalu koreksi turun'], ['turun', 'Harga turun lalu koreksi naik']], 'naik');
  const box = T.out();

  const hitung = () => {
    const rendah = T.num(rendahI.value);
    const tinggi = T.num(tinggiI.value);
    if (!isFinite(rendah) || !isFinite(tinggi)) { T.show(box, '<div class="err">Isi harga terendah dan tertinggi dengan angka.</div>'); return; }
    if (tinggi <= rendah) { T.show(box, '<div class="err">Harga tertinggi harus lebih besar dari harga terendah.</div>'); return; }
    const level = hitungFibonacci(rendah, tinggi, arahS.value);
    if (level === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    // Label ujung mengikuti arah: arah naik 0% = puncak (harga mulai turun dari
    // sana), arah turun 0% = dasar (harga mulai naik dari sana).
    const naik = arahS.value !== 'turun';
    let baris = '';
    level.forEach((l) => {
      const nama = l.rasio === 0 ? '0% (' + (naik ? 'puncak' : 'dasar') + ')' : l.rasio === 1 ? '100% (' + (naik ? 'dasar' : 'puncak') + ')' : String(l.rasio * 100).replace('.', ',') + '%';
      const kunci = l.rasio === 0.618 || l.rasio === 0.382 ? ' <span class="hint">level kunci</span>' : '';
      baris += '<tr><td>' + nama + kunci + '</td><td style="text-align:right"><b>' + fmtH(l.harga) + '</b></td></tr>';
    });
    T.show(box,
      '<div class="big center">' + fmtH(level[4].harga) + '</div>' +
      '<p class="center">level 61,8%, yang paling sering diperhatikan trader</p>' +
      kv('Jarak harga', fmtH(tinggi - rendah)) +
      '<table class="tbl" style="margin-top:10px"><thead><tr><th>Level</th><th style="text-align:right">Harga</th></tr></thead><tbody>' + baris + '</tbody></table>' +
      '<p class="hint">Level Fibonacci adalah garis bantu dari analisis teknikal: harga yang sedang koreksi sering berhenti atau memantul di sekitar level ini. Ini bukan ramalan: harga bisa menembus level mana pun. Jangan jadikan satu-satunya alasan beli atau jual.</p>');
  };

  root.appendChild(T.el('<p class="note">Saat harga saham atau kripto bergerak kencang lalu berbalik sebentar (koreksi), trader memakai level Fibonacci untuk menebak di harga mana koreksi itu berhenti. Masukkan harga terendah dan tertinggi dari gerakan terakhir.</p>'));
  root.appendChild(T.field('Harga terendah', rendahI, 'Harga paling rendah dari gerakan yang mau diukur.'));
  root.appendChild(T.field('Harga tertinggi', tinggiI, 'Harga paling tinggi dari gerakan yang mau diukur.'));
  root.appendChild(T.field('Arah gerakan', arahS, 'Naik artinya harga habis naik lalu mulai turun. Turun artinya sebaliknya.'));
  root.appendChild(T.row(T.btn('Hitung Level Fibonacci', hitung, true)));
  root.appendChild(box);
}
