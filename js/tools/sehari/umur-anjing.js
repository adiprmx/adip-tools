import { h as T, kv, utils } from '../../core.js?v=6.12.1';

// Umur anjing ke umur manusia, aturan AVMA/AKC: tahun pertama 15,
// tahun kedua tambah 9, setelah itu tambah 4-7 per tahun menurut ukuran ras.
const LAJU = { kecil: 4, sedang: 5, besar: 6, raksasa: 7 };
const SENIOR = { kecil: 10, sedang: 8, besar: 7, raksasa: 6 };
utils.umurAnjing = function (tahun, ukuran) {
  const t = Number(tahun);
  const laju = LAJU[ukuran] || 5;
  if (!(t >= 0)) return null;
  let manusia;
  if (t < 1) manusia = t * 15;
  else if (t < 2) manusia = 15 + (t - 1) * 9;
  else manusia = 24 + (t - 2) * laju;
  manusia = Math.round(manusia * 10) / 10;
  let tahap;
  if (t < 1) tahap = 'Anak anjing';
  else if (t < 3) tahap = 'Anjing muda';
  else if (t < (SENIOR[ukuran] || 8)) tahap = 'Dewasa';
  else tahap = 'Senior';
  return { manusia, tahap, laju };
};

export const meta = {"id": "umur-anjing", "name": "Umur Anjing ke Umur Manusia", "cat": "sehari", "icon": "🐶", "desc": "Umur anjing diubah ke umur manusia, disesuaikan ukuran rasnya.", "keywords": "anjing,umur,usia,manusia,tahun,ras,ukuran", "since": "6.11.0"};
export function render(root) {
  const umur = T.input('text', 'Contoh: 5 atau 1,5', '5');
  umur.inputMode = 'decimal';
  const ukuran = T.select([
    ['kecil', 'Kecil (sampai 9 kg, contoh: Chihuahua, Pomeranian)'],
    ['sedang', 'Sedang (9-23 kg, contoh: Beagle, Corgi)'],
    ['besar', 'Besar (23-45 kg, contoh: Labrador, Golden)'],
    ['raksasa', 'Sangat besar (di atas 45 kg, contoh: Great Dane)'],
  ], 'sedang');
  const box = T.out();

  const hitung = () => {
    const t = T.num(umur.value);
    if (!(t > 0)) { T.show(box, '<span class="err">Isi umur anjing dengan angka, contoh: 5 atau 1,5 untuk 1 tahun 6 bulan.</span>'); return; }
    if (t > 30) { T.show(box, '<span class="err">Umur anjing paling lama sekitar 20-an tahun. Cek lagi angkanya.</span>'); return; }
    const r = utils.umurAnjing(t, ukuran.value);
    T.show(box,
      '<div class="center"><div class="dim">Setara umur manusia</div>' +
      '<div class="big">' + T.fmt(r.manusia) + ' tahun</div>' +
      '<div><b>' + r.tahap + '</b></div></div>' +
      kv('Umur anjing', T.fmt(t) + ' tahun') +
      kv('Laju penuaan', 'Tambah ' + r.laju + ' tahun manusia tiap tahun setelah umur 2 tahun') +
      '<p class="hint">Hitungan mengikuti aturan AVMA/AKC: tahun pertama 15 tahun manusia, tahun kedua tambah 9, setelah itu tambah 4 tahun untuk ras kecil, 5 untuk sedang, 6 untuk besar, dan 7 untuk sangat besar. Anjing besar menua lebih cepat. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Umur anjing (tahun)', umur, 'Isi 0,5 untuk 6 bulan.'),
    T.field('Ukuran ras', ukuran),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Isi umur dan ukuran ras anjing, lalu tekan Hitung.</p>');
}
