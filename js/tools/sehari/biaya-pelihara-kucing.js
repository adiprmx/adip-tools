import { h as T, kv, utils } from '../../core.js?v=6.11.5';

// Total biaya bulanan pelihara kucing. Semua angka bisa diubah, angka
// awal hanya contoh yang bisa disesuaikan dengan harga di tempatmu.
utils.biayaKucing = function (makanan, pasir, mainan, lain, tahunan) {
  const m = Number(makanan) || 0, p = Number(pasir) || 0, n = Number(mainan) || 0, l = Number(lain) || 0, t = Number(tahunan) || 0;
  if (m < 0 || p < 0 || n < 0 || l < 0 || t < 0) return null;
  const perBulan = m + p + n + l + t / 12;
  return { perBulan: Math.round(perBulan), perTahun: Math.round(perBulan * 12), dokterPerBulan: Math.round(t / 12) };
};

export const meta = {"id": "biaya-pelihara-kucing", "name": "Biaya Pelihara Kucing", "cat": "sehari", "icon": "💰", "desc": "Perkiraan biaya bulanan pelihara kucing, semua angkanya bisa diubah.", "keywords": "kucing,biaya,bulanan,makan,pasir,vaksin,dokter,hewan", "since": "6.11.0"};
export function render(root) {
  const makanan = T.input('text', 'Rp per bulan', '300000');
  makanan.inputMode = 'decimal';
  const pasir = T.input('text', 'Rp per bulan', '100000');
  pasir.inputMode = 'decimal';
  const mainan = T.input('text', 'Rp per bulan', '50000');
  mainan.inputMode = 'decimal';
  const lain = T.input('text', 'Rp per bulan', '50000');
  lain.inputMode = 'decimal';
  const tahunan = T.input('text', 'Rp per tahun', '600000');
  tahunan.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const vals = [makanan, pasir, mainan, lain, tahunan].map((i) => T.num(i.value));
    if (vals.some((v) => isNaN(v) || v < 0)) { T.show(box, '<span class="err">Isi semua kolom dengan angka 0 atau lebih. Kosongkan dengan 0 kalau tidak ada biayanya.</span>'); return; }
    const r = utils.biayaKucing(vals[0], vals[1], vals[2], vals[3], vals[4]);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan biaya per bulan</div>' +
      '<div class="big">' + T.rp(r.perBulan) + '</div>' +
      '<div class="dim">Sekitar ' + T.rp(r.perTahun) + ' per tahun</div></div>' +
      kv('Makanan', T.rp(vals[0]) + ' / bulan') +
      kv('Pasir', T.rp(vals[1]) + ' / bulan') +
      kv('Mainan dan perawatan', T.rp(vals[2]) + ' / bulan') +
      kv('Lain-lain', T.rp(vals[3]) + ' / bulan') +
      kv('Vaksin dan dokter', T.rp(r.dokterPerBulan) + ' / bulan (' + T.rp(vals[4]) + ' per tahun)') +
      '<p class="hint">Angka awal di atas hanya contoh, sesuaikan dengan harga di tempatmu. Biaya dokter bisa naik kalau kucing sakit atau butuh operasi, jadi sisakan dana darurat. Ini panduan umum. Untuk keputusan medis, konsultasikan ke dokter hewan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Makanan (Rp per bulan)', makanan),
    T.field('Pasir (Rp per bulan)', pasir),
    T.field('Mainan dan perawatan (Rp per bulan)', mainan),
    T.field('Lain-lain (Rp per bulan)', lain),
  ));
  root.appendChild(T.field('Vaksin dan dokter (Rp per tahun)', tahunan, 'Dibagi 12 untuk hitungan bulanan.'));
  root.appendChild(T.btn('Hitung Biaya', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Ubah angka sesuai pengeluaranmu, lalu tekan Hitung Biaya.</p>');
}
