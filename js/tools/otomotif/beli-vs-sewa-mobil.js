import { h as T, utils, money, kv } from '../../core.js';

// Beli vs sewa mobil. Sisi beli: uang muka + cicilan anuitas (bunga per
// bulan i, tenor n bulan: cicilan = P*i/(1-(1+i)^-n)) + biaya tahunan
// (pajak + asuransi + servis) selama tenor, dikurangi nilai jual kembali
// di akhir tenor. Sisi sewa: sewa bulanan x tenor (sewa jangka panjang
// umumnya sudah termasuk servis dan asuransi, jadi tidak ditambah lagi).
// Titik impas: bulan ke-n saat biaya kumulatif beli menyamai sewa,
// dihitung tanpa nilai jual (nilai jual baru terasa di akhir tenor).
export function hitungBeliVsSewaMobil(o) {
  const harga = Math.max(0, Number(o.harga) || 0);
  const tenor = Math.max(0, Number(o.tenor) || 0);
  const dp = harga * Math.max(0, Math.min(100, Number(o.dpPersen) || 0)) / 100;
  const pokok = harga - dp;
  const n = Math.round(tenor * 12);
  const i = Math.max(0, Number(o.bunga) || 0) / 100 / 12;
  const cicilan = n > 0 ? (i > 0 ? pokok * i / (1 - Math.pow(1 + i, -n)) : pokok / n) : 0;
  const biayaTahunan = Math.max(0, Number(o.biayaTahunan) || 0);
  const nilaiJual = harga * Math.max(0, Math.min(100, Number(o.nilaiJualPersen) || 0)) / 100;
  const sewa = Math.max(0, Number(o.sewaBulanan) || 0);
  const totalBeli = dp + cicilan * n + biayaTahunan * tenor - nilaiJual;
  const totalSewa = sewa * n;
  const perBulanBeli = n > 0 ? totalBeli / n : 0;
  // Titik impas: DP + (cicilan + biaya/bln) * m = sewa * m.
  const jalanBeli = cicilan + biayaTahunan / 12;
  const impas = (sewa > jalanBeli && dp > 0) ? Math.ceil(dp / (sewa - jalanBeli)) : null;
  return { dp, cicilan, totalCicilan: cicilan * n, nilaiJual, totalBeli, totalSewa, selisih: totalBeli - totalSewa, perBulanBeli, impas, n };
}
utils.beliVsSewaMobil = hitungBeliVsSewaMobil;

export const meta = {"id": "beli-vs-sewa-mobil", "name": "Beli vs Sewa Mobil", "cat": "otomotif", "icon": "🚗", "desc": "Lebih hemat beli kredit atau sewa jangka panjang? Hitung total biaya keduanya sampai titik impasnya.", "keywords": "beli,sewa,mobil,kredit,dp,cicilan,impas,leasing,rental", "since": "6.19.0"};
export function render(root) {
  const hargaI = money(null, 'cth: 250000000', '250000000');
  const dpI = T.input('text', 'cth: 20', '20'); dpI.inputMode = 'decimal';
  const tenorI = T.input('text', 'cth: 5', '5'); tenorI.inputMode = 'decimal';
  const bungaI = T.input('text', 'cth: 6', '6'); bungaI.inputMode = 'decimal';
  const biayaI = money(null, 'cth: 12000000', '12000000');
  const jualI = T.input('text', 'cth: 50', '50'); jualI.inputMode = 'decimal';
  const sewaI = money(null, 'cth: 5000000', '5000000');
  const box = T.out();

  const hitung = () => {
    const harga = T.num(hargaI.value) || 0;
    const tenor = T.num(tenorI.value) || 0;
    if (!(harga > 0) || !(tenor > 0)) { T.hide(box); return; }
    const r = hitungBeliVsSewaMobil({
      harga, dpPersen: T.num(dpI.value), tenor, bunga: T.num(bungaI.value),
      biayaTahunan: T.num(biayaI.value), nilaiJualPersen: T.num(jualI.value),
      sewaBulanan: T.num(sewaI.value),
    });
    const menang = r.totalBeli <= r.totalSewa ? 'beli' : 'sewa';
    const hemat = Math.abs(Math.round(r.selisih));
    const impasTeks = r.impas == null
      ? 'Tidak ada: biaya jalan beli per bulan sudah sama atau lebih mahal dari sewa.'
      : 'Bulan ke-' + T.fmt(r.impas) + ' (' + T.fmt(Math.floor(r.impas / 12)) + ' tahun ' + (r.impas % 12) + ' bulan).';
    T.show(box,
      '<div class="big">' + (menang === 'beli' ? 'Beli lebih hemat' : 'Sewa lebih hemat') + '</div>' +
      '<p class="center mut">Selisih ' + T.rp(hemat) + ' selama ' + T.fmt(tenor) + ' tahun.</p>' +
      kv('Total biaya beli', T.rp(Math.round(r.totalBeli))) +
      kv('Total biaya sewa', T.rp(Math.round(r.totalSewa))) +
      kv('Uang muka', T.rp(Math.round(r.dp))) +
      kv('Cicilan per bulan', T.rp(Math.round(r.cicilan))) +
      kv('Total cicilan (' + r.n + ' bulan)', T.rp(Math.round(r.totalCicilan))) +
      kv('Nilai jual kembali (akhir tenor)', '− ' + T.rp(Math.round(r.nilaiJual))) +
      kv('Biaya beli per bulan (rata-rata)', T.rp(Math.round(r.perBulanBeli))) +
      kv('Titik impas', impasTeks) +
      '<p class="hint">Asumsi: cicilan anuitas (bunga tetap selama tenor), biaya tahunan sudah termasuk pajak, asuransi, dan servis. Sewa jangka panjang umumnya sudah termasuk servis dan asuransi, jadi tidak ditambah lagi. Nilai jual kembali hanya perkiraan, mobil yang sama bisa laku lebih tinggi atau lebih rendah. Titik impas dihitung tanpa nilai jual, karena nilai jual baru terasa saat mobil dijual di akhir tenor.</p>');
  };
  [hargaI, dpI, tenorI, bungaI, biayaI, jualI, sewaI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau punya mobil: beli kredit atau sewa bulanan saja? Masukkan angka-angkanya, hasilnya langsung keluar.</p>'));
  root.appendChild(T.field('Harga mobil (Rp)', hargaI));
  root.appendChild(T.grid2(
    T.field('Uang muka (%)', dpI, 'Dari harga mobil'),
    T.field('Tenor kredit (tahun)', tenorI)
  ));
  root.appendChild(T.grid2(
    T.field('Bunga kredit (% per tahun)', bungaI),
    T.field('Perkiraan nilai jual akhir (%)', jualI, 'Dari harga beli, saat tenor habis')
  ));
  root.appendChild(T.field('Biaya pajak + asuransi + servis (Rp per tahun)', biayaI));
  root.appendChild(T.field('Harga sewa (Rp per bulan)', sewaI, 'Sewa jangka panjang, biasanya sudah termasuk servis dan asuransi'));
  root.appendChild(box);
  hitung();
}
