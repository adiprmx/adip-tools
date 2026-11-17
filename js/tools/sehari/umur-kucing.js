import { h as T, kv, utils } from '../../core.js';

// Umur kucing ke umur manusia, bagan AAHA/AAFP: tahun pertama 15,
// tahun kedua tambah 9, setelah itu tambah 4 per tahun.
utils.umurKucing = function (tahun) {
  const t = Number(tahun);
  if (!(t >= 0)) return null;
  let manusia;
  if (t < 1) manusia = t * 15;
  else if (t < 2) manusia = 15 + (t - 1) * 9;
  else manusia = 24 + (t - 2) * 4;
  manusia = Math.round(manusia * 10) / 10;
  let tahap;
  if (t < 1) tahap = 'Anak kucing';
  else if (t < 3) tahap = 'Kucing muda';
  else if (t < 7) tahap = 'Dewasa';
  else if (t < 11) tahap = 'Paruh baya';
  else if (t < 15) tahap = 'Senior';
  else tahap = 'Lansia';
  return { manusia, tahap };
};

export const meta = {"id": "umur-kucing", "name": "Umur Kucing ke Umur Manusia", "cat": "sehari", "icon": "🐱", "desc": "Umur kucing diubah ke umur manusia, lengkap dengan tahap hidupnya.", "keywords": "kucing,umur,usia,manusia,tahun,kucing", "since": "6.11.0"};
export function render(root) {
  const umur = T.input('text', 'Contoh: 3 atau 2,5', '3');
  umur.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const t = T.num(umur.value);
    if (!(t > 0)) { T.show(box, '<span class="err">Isi umur kucing dengan angka, contoh: 3 atau 2,5 untuk 2 tahun 6 bulan.</span>'); return; }
    if (t > 40) { T.show(box, '<span class="err">Umur kucing paling lama sekitar 30-an tahun. Cek lagi angkanya.</span>'); return; }
    const r = utils.umurKucing(t);
    T.show(box,
      '<div class="center"><div class="dim">Setara umur manusia</div>' +
      '<div class="big">' + T.fmt(r.manusia) + ' tahun</div>' +
      '<div><b>' + r.tahap + '</b></div></div>' +
      kv('Umur kucing', T.fmt(t) + ' tahun') +
      kv('Tahap hidup', r.tahap) +
      '<p class="hint">Hitungan mengikuti bagan AAHA/AAFP: tahun pertama 15 tahun manusia, tahun kedua tambah 9, setelah itu tambah 4 tiap tahun. Umur di bawah 1 tahun dihitung sebanding. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.field('Umur kucing (tahun)', umur, 'Isi 0,5 untuk 6 bulan, 2,5 untuk 2 tahun 6 bulan.'));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Isi umur kucing, lalu tekan Hitung.</p>');
}
