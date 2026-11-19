import { h as T, kv, utils } from '../../core.js';

// Biaya tahun pertama bayi: biaya sekali beli (perlengkapan) + biaya bulanan
// x 12 bulan. Semua angka bisa diubah, angka awal hanya contoh.
export function biayaBayi(sekali, bulanan) {
  const s = Number(sekali) || 0, b = Number(bulanan) || 0;
  if (s < 0 || b < 0) return null;
  const total = s + b * 12;
  return { total: Math.round(total), perBulan: Math.round(total / 12), sekali: Math.round(s), rutinSetahun: Math.round(b * 12) };
}
utils.biayaBayi = biayaBayi;

export const meta = {"id": "kalkulator-biaya-punya-bayi", "name": "Kalkulator Biaya Punya Bayi", "cat": "sehari", "icon": "👶", "desc": "Perkiraan biaya tahun pertama bayi: perlengkapan sekali beli plus pengeluaran bulanan. Semua angkanya bisa diubah.", "keywords": "bayi,biaya bayi,tahun pertama,popok,susu,perlengkapan bayi,kehamilan,anak", "since": "6.19.0"};
export function render(root) {
  const perlengkapan = T.input('text', 'Rp sekali beli', '5000000');
  perlengkapan.inputMode = 'decimal';
  const popok = T.input('text', 'Rp per bulan', '600000');
  popok.inputMode = 'decimal';
  const susu = T.input('text', 'Rp per bulan', '500000');
  susu.inputMode = 'decimal';
  const makan = T.input('text', 'Rp per bulan', '200000');
  makan.inputMode = 'decimal';
  const dokter = T.input('text', 'Rp per bulan', '300000');
  dokter.inputMode = 'decimal';
  const lain = T.input('text', 'Rp per bulan', '200000');
  lain.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const vals = [perlengkapan, popok, susu, makan, dokter, lain].map((i) => T.num(i.value));
    if (vals.some((v) => isNaN(v) || v < 0)) { T.show(box, '<span class="err">Isi semua kolom dengan angka 0 atau lebih. Kosongkan dengan 0 kalau tidak ada biayanya.</span>'); return; }
    const bulanan = vals[1] + vals[2] + vals[3] + vals[4] + vals[5];
    const r = biayaBayi(vals[0], bulanan);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan biaya tahun pertama</div>' +
      '<div class="big">' + T.rp(r.total) + '</div>' +
      '<div class="dim">Sekitar ' + T.rp(r.perBulan) + ' per bulan bila diratakan</div></div>' +
      kv('Perlengkapan sekali beli', T.rp(vals[0])) +
      kv('Popok', T.rp(vals[1]) + ' / bulan') +
      kv('Susu formula', T.rp(vals[2]) + ' / bulan') +
      kv('Makanan dan MPASI', T.rp(vals[3]) + ' / bulan') +
      kv('Dokter dan vaksin', T.rp(vals[4]) + ' / bulan') +
      kv('Baju dan lain-lain', T.rp(vals[5]) + ' / bulan') +
      kv('Total biaya rutin setahun', T.rp(r.rutinSetahun)) +
      '<p class="hint">Ini perkiraan, bukan harga pasti. Angka awal hanya contoh, sesuaikan dengan harga di tempatmu. Biaya persalinan dan rawat inap belum dihitung di sini. ASI eksklusif bisa memangkas biaya susu formula sampai nol. Biaya bisa sangat berbeda tergantung merek dan kota.</p>');
  };

  root.appendChild(T.el('<p class="note">Hitung biaya tahun pertama bayi: perlengkapan yang dibeli sekali, ditambah pengeluaran yang keluar tiap bulan selama 12 bulan.</p>'));
  root.appendChild(T.field('Perlengkapan sekali beli (Rp)', perlengkapan, 'Boks bayi, stroller, bak mandi, baju awal, dan sejenisnya.'));
  root.appendChild(T.grid2(
    T.field('Popok (Rp per bulan)', popok),
    T.field('Susu formula (Rp per bulan)', susu, 'Isi 0 kalau ASI eksklusif.'),
    T.field('Makanan dan MPASI (Rp per bulan)', makan),
    T.field('Dokter dan vaksin (Rp per bulan)', dokter),
    T.field('Baju dan lain-lain (Rp per bulan)', lain),
  ));
  root.appendChild(T.btn('Hitung Biaya', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Ubah angka sesuai rencanamu, lalu tekan Hitung Biaya.</p>');
}
