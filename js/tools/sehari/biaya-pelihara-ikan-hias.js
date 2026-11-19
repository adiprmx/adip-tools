import { h as T, kv, utils } from '../../core.js';

// Biaya listrik akuarium: watt x jam nyala per hari x 30 hari / 1000 x tarif.
// Tarif awal Rp1.444,70 per kWh (tarif PLN rumah tangga 1.300 VA); pengguna
// bisa mengubahnya sesuai tarif di rumahnya.
export function listrikAkuarium(watt, jamPerHari, tarif) {
  const w = Number(watt) || 0, j = Number(jamPerHari) || 0, t = Number(tarif) || 0;
  if (w < 0 || j < 0 || j > 24 || t < 0) return null;
  const kwh = w * j * 30 / 1000;
  return { kwh, rupiah: Math.round(kwh * t) };
}

// Total biaya bulanan pelihara ikan hias. Semua angka bisa diubah, angka
// awal hanya contoh yang bisa disesuaikan dengan harga di tempatmu.
export function biayaIkanHias(pakan, listrik, air, obat, tahunan) {
  const vals = [pakan, listrik, air, obat, tahunan].map((v) => Number(v) || 0);
  if (vals.some((v) => v < 0)) return null;
  const perBulan = vals[0] + vals[1] + vals[2] + vals[3] + vals[4] / 12;
  return { perBulan: Math.round(perBulan), perTahun: Math.round(perBulan * 12), tahunanPerBulan: Math.round(vals[4] / 12) };
}
utils.biayaIkanHias = biayaIkanHias;
utils.listrikAkuarium = listrikAkuarium;

export const meta = {"id": "biaya-pelihara-ikan-hias", "name": "Biaya Pelihara Ikan Hias", "cat": "sehari", "icon": "🐟", "desc": "Perkiraan biaya bulanan pelihara ikan hias, termasuk listrik akuarium. Semua angkanya bisa diubah.", "keywords": "ikan hias,akuarium,biaya,bulanan,pakan,listrik,filter,aquascape", "since": "6.19.0"};
export function render(root) {
  const pakan = T.input('text', 'Rp per bulan', '75000');
  pakan.inputMode = 'decimal';
  const watt = T.input('text', 'Total watt pompa dan lampu', '50');
  watt.inputMode = 'decimal';
  const jam = T.input('text', 'Jam nyala per hari', '24');
  jam.inputMode = 'decimal';
  const tarif = T.input('text', 'Rp per kWh', '1444,7');
  tarif.inputMode = 'decimal';
  const air = T.input('text', 'Rp per bulan', '30000');
  air.inputMode = 'decimal';
  const obat = T.input('text', 'Rp per bulan', '25000');
  obat.inputMode = 'decimal';
  const tahunan = T.input('text', 'Rp per tahun', '300000');
  tahunan.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const l = listrikAkuarium(T.num(watt.value), T.num(jam.value), T.num(tarif.value));
    const vals = [T.num(pakan.value), T.num(air.value), T.num(obat.value), T.num(tahunan.value)];
    if (!l || vals.some((v) => isNaN(v) || v < 0)) { T.show(box, '<span class="err">Isi semua kolom dengan angka 0 atau lebih. Jam nyala maksimal 24 per hari. Kosongkan dengan 0 kalau tidak ada biayanya.</span>'); return; }
    const r = biayaIkanHias(vals[0], l.rupiah, vals[1], vals[2], vals[3]);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan biaya per bulan</div>' +
      '<div class="big">' + T.rp(r.perBulan) + '</div>' +
      '<div class="dim">Sekitar ' + T.rp(r.perTahun) + ' per tahun</div></div>' +
      kv('Pakan', T.rp(vals[0]) + ' / bulan') +
      kv('Listrik akuarium', T.rp(l.rupiah) + ' / bulan (' + utils.fmtDes(l.kwh, 1) + ' kWh)') +
      kv('Air dan garam', T.rp(vals[1]) + ' / bulan') +
      kv('Obat dan vitamin', T.rp(vals[2]) + ' / bulan') +
      kv('Filter dan lampu baru', T.rp(r.tahunanPerBulan) + ' / bulan (' + T.rp(vals[3]) + ' per tahun)') +
      '<p class="hint">Ini perkiraan, bukan harga pasti. Angka awal hanya contoh, sesuaikan dengan harga di tempatmu. Biaya awal beli akuarium, filter, dan ikan belum dihitung di sini. Ikan sakit atau akuarium bocor bisa menambah biaya, jadi sisakan dana darurat.</p>');
  };

  root.appendChild(T.el('<p class="note">Masukkan pengeluaran rutin akuariummu. Listrik dihitung dari total watt pompa dan lampu yang menyala tiap hari.</p>'));
  root.appendChild(T.grid2(
    T.field('Pakan (Rp per bulan)', pakan),
    T.field('Air dan garam (Rp per bulan)', air),
    T.field('Obat dan vitamin (Rp per bulan)', obat),
    T.field('Filter dan lampu baru (Rp per tahun)', tahunan),
  ));
  root.appendChild(T.field('Total watt pompa dan lampu', watt, 'Cek label di pompa, filter, dan lampu, lalu jumlahkan.'));
  root.appendChild(T.grid2(
    T.field('Jam nyala per hari', jam, 'Pompa biasanya menyala 24 jam.'),
    T.field('Tarif listrik (Rp per kWh)', tarif, 'Tarif PLN rumah 1.300 VA Rp1.444,70. Ubah sesuai tarifmu.'),
  ));
  root.appendChild(T.btn('Hitung Biaya', hitung, true));
  root.appendChild(box);
  T.show(box, '<p class="hint">Ubah angka sesuai pengeluaranmu, lalu tekan Hitung Biaya.</p>');
}
