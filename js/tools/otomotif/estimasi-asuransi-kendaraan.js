import { h as T, utils, money, kv } from '../../core.js';

// Estimasi premi asuransi kendaraan dari tarif acuan OJK
// (Surat Edaran OJK No. 6/SEOJK.05/2017). Premi dasar = tarif (%) x harga
// kendaraan. Tarif All Risk mobil dibedakan per kelompok harga dan wilayah;
// TLO mobil satu tarif per wilayah; motor All Risk 3,18-3,50% semua wilayah,
// TLO motor per wilayah. Kendaraan di atas 5 tahun umumnya dikenakan
// tambahan 5% per tahun di atas tarif (loading usia).
// Tarif di bawah ini rentang batas bawah-atas OJK, BUKAN harga pasti:
// perusahaan asuransi menentukan angka di dalam rentang itu, dan premi
// sebenarnya bisa berbeda karena diskon, perluasan jaminan, dan riwayat klaim.
const MOBIL_AR = [
  [125e6, [[3.82, 4.20], [3.26, 3.59], [2.53, 2.78]]],
  [200e6, [[2.67, 2.94], [2.47, 2.72], [2.69, 2.96]]],
  [400e6, [[2.18, 2.40], [2.08, 2.29], [1.79, 1.97]]],
  [800e6, [[1.20, 1.32], [1.20, 1.32], [1.14, 1.25]]],
  [Infinity, [[1.05, 1.16], [1.05, 1.16], [1.05, 1.16]]],
];
const MOBIL_TLO = [[0.47, 0.56], [0.38, 0.46], [0.41, 0.49]];
const MOTOR_AR = [[3.18, 3.50], [3.18, 3.50], [3.18, 3.50]];
const MOTOR_TLO = [[1.76, 2.11], [1.80, 2.16], [0.67, 0.80]];

export function hitungAsuransi(o) {
  const harga = Math.max(0, Number(o.harga) || 0);
  const w = [0, 1, 2].includes(Number(o.wilayah)) ? Number(o.wilayah) : 1;
  const usia = Math.max(0, Number(o.usia) || 0);
  const motor = o.jenis === 'motor';
  let tarifAR, tarifTLO;
  if (motor) { tarifAR = MOTOR_AR[w]; tarifTLO = MOTOR_TLO[w]; }
  else {
    tarifTLO = MOBIL_TLO[w];
    tarifAR = MOBIL_AR.find(([batas]) => harga <= batas)[1][w];
  }
  const loading = usia > 5 ? 1 + 0.05 * (usia - 5) : 1;
  const premi = ([lo, hi]) => ({ min: harga * lo / 100 * loading, maks: harga * hi / 100 * loading, tengah: harga * (lo + hi) / 2 / 100 * loading });
  return { tarifAR, tarifTLO, loading, allRisk: premi(tarifAR), tlo: premi(tarifTLO) };
}
utils.estimasiAsuransi = hitungAsuransi;

export const meta = {"id": "estimasi-asuransi-kendaraan", "name": "Estimasi Asuransi Kendaraan", "cat": "otomotif", "icon": "🛡️", "desc": "Perkiraan premi All Risk dan TLO per tahun dari harga kendaraan, pakai tarif acuan OJK. Estimasi, bukan harga pasti.", "keywords": "asuransi,premi,all risk,tlo,mobil,motor,ojk,total loss", "since": "6.19.0"};
export function render(root) {
  const jenisSel = T.select([['mobil', 'Mobil'], ['motor', 'Motor']], 'mobil');
  const wilSel = T.select([
    ['0', 'Wilayah 1: Sumatera & sekitarnya'],
    ['1', 'Wilayah 2: DKI Jakarta, Jawa Barat, Banten'],
    ['2', 'Wilayah 3: Jawa Tengah, Jawa Timur, dan lainnya'],
  ], '1');
  const hargaI = money(null, 'cth: 250000000', '250000000');
  const usiaI = T.input('text', 'cth: 3', '3'); usiaI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const harga = T.num(hargaI.value) || 0;
    if (!(harga > 0)) { T.hide(box); return; }
    const r = hitungAsuransi({ harga, jenis: jenisSel.value, wilayah: Number(wilSel.value), usia: T.num(usiaI.value) });
    const pct = ([lo, hi]) => T.fmt(lo) + '%–' + T.fmt(hi) + '%';
    T.show(box,
      '<div class="big">All Risk: ' + T.rp(Math.round(r.allRisk.tengah)) + ' / thn</div>' +
      '<p class="center mut">Estimasi tengah dari rentang tarif OJK. Angka sebenarnya ditentukan perusahaan asuransi.</p>' +
      kv('All Risk (rentang OJK)', T.rp(Math.round(r.allRisk.min)) + ' – ' + T.rp(Math.round(r.allRisk.maks)) + ' / thn') +
      kv('Tarif All Risk OJK', pct(r.tarifAR)) +
      kv('All Risk per bulan (tengah)', T.rp(Math.round(r.allRisk.tengah / 12))) +
      kv('TLO (rentang OJK)', T.rp(Math.round(r.tlo.min)) + ' – ' + T.rp(Math.round(r.tlo.maks)) + ' / thn') +
      kv('Tarif TLO OJK', pct(r.tarifTLO)) +
      kv('TLO per bulan (tengah)', T.rp(Math.round(r.tlo.tengah / 12))) +
      (r.loading > 1 ? kv('Tambahan usia kendaraan', 'x' + T.fmt(Math.round(r.loading * 100) / 100) + ' (usia di atas 5 tahun)') : '') +
      '<p class="hint">Dasar hitung: tarif acuan OJK No. 6/SEOJK.05/2017 (tarif x harga kendaraan). Ini ESTIMASI, bukan penawaran: perusahaan asuransi boleh memakai angka mana pun di dalam rentang OJK, dan premi akhir dipengaruhi diskon, riwayat klaim, serta perluasan jaminan (banjir, kerusuhan, tanggung jawab pihak ketiga). Belum termasuk biaya polis/admin. All Risk menanggung semua kerusakan; TLO hanya menanggung kerugian di atas 75% atau kehilangan total.</p>');
  };
  [jenisSel, wilSel, hargaI, usiaI].forEach((i) => i.addEventListener('input', hitung));
  [jenisSel, wilSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Kira-kira berapa premi asuransi kendaraanmu setahun? Pilih jenis kendaraan dan wilayah, masukkan harga dan usianya.</p>'));
  root.appendChild(T.grid2(
    T.field('Jenis kendaraan', jenisSel),
    T.field('Wilayah plat nomor', wilSel)
  ));
  root.appendChild(T.field('Harga kendaraan saat ini (Rp)', hargaI, 'Harga pasar, bukan harga baru dulu'));
  root.appendChild(T.field('Usia kendaraan (tahun)', usiaI, 'Di atas 5 tahun biasanya kena tambahan 5% per tahun'));
  root.appendChild(box);
  hitung();
}
