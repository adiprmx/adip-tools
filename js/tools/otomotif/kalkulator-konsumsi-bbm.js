import { h as T, utils, money, kv } from '../../core.js';

// Konsumsi BBM: km/liter = jarak / liter yang diisi. Liter/100 km adalah
// kebalikannya (100 / km-per-liter). Biaya per km = harga per liter /
// km-per-liter. Cara ukur yang paling gampang: isi penuh, catat kilometer,
// pakai sampai hampir habis, isi penuh lagi, bagi jarak dengan liter isi
// kedua. Harga default Pertalite Rp10.000/liter (berlaku sejak 2 September
// 2026, Pertamina), bisa diubah.
export function hitungKonsumsi(jarak, liter, harga) {
  const j = Math.max(0, Number(jarak) || 0);
  const l = Math.max(0, Number(liter) || 0);
  const h = Math.max(0, Number(harga) || 0);
  const kml = l > 0 ? j / l : 0;
  return {
    kml,
    literPer100: kml > 0 ? 100 / kml : 0,
    biayaPerKm: kml > 0 ? h / kml : 0,
    biayaPer100: kml > 0 ? h / kml * 100 : 0,
    totalBiaya: l * h,
  };
}
utils.konsumsiBbm = hitungKonsumsi;

export const meta = {"id": "kalkulator-konsumsi-bbm", "name": "Kalkulator Konsumsi BBM (km/liter)", "cat": "otomotif", "icon": "⛽", "desc": "Seberapa irit kendaraanmu: km per liter dari jarak dan liter yang diisi, plus biaya per km.", "keywords": "bbm,bensin,konsumsi,km liter,irit,kendaraan,motor,mobil,solar", "since": "6.17.0"};
export function render(root) {
  const jarakI = T.input('text', 'cth: 450', ''); jarakI.inputMode = 'decimal';
  const literI = T.input('text', 'cth: 30', ''); literI.inputMode = 'decimal';
  const hargaI = money(null, 'cth: 10000', '10000');
  const box = T.out();

  const hitung = () => {
    const jarak = T.num(jarakI.value) || 0;
    const liter = T.num(literI.value) || 0;
    if (!(jarak > 0) || !(liter > 0)) { T.hide(box); return; }
    const r = hitungKonsumsi(jarak, liter, T.num(hargaI.value));
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(r.kml * 100) / 100) + ' km/liter</div>' +
      '<p class="center mut">Konsumsi kendaraanmu.</p>' +
      kv('Jarak yang ditempuh', T.fmt(Math.round(jarak * 10) / 10) + ' km') +
      kv('BBM yang diisi', T.fmt(Math.round(liter * 100) / 100) + ' liter') +
      kv('Konsumsi (liter per 100 km)', T.fmt(Math.round(r.literPer100 * 100) / 100) + ' liter') +
      kv('Biaya per km', T.rp(Math.round(r.biayaPerKm))) +
      kv('Biaya per 100 km', T.rp(Math.round(r.biayaPer100))) +
      kv('Total biaya BBM ini', T.rp(Math.round(r.totalBiaya))) +
      '<p class="hint">Cara ukur: isi penuh dan catat kilometer, pakai seperti biasa, lalu isi penuh lagi. Jarak dibagi liter isi kedua adalah konsumsi aslimu. Harga default Pertalite Rp10.000/liter (berlaku sejak 2 September 2026), sesuaikan dengan BBM yang kamu pakai.</p>');
  };
  [jarakI, literI, hargaI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Irit atau boros, angkanya yang bicara. Masukkan jarak yang ditempuh dan liter BBM yang diisi.</p>'));
  root.appendChild(T.field('Jarak yang ditempuh (km)', jarakI, 'Dari odometer atau trip meter'));
  root.appendChild(T.field('BBM yang diisi (liter)', literI, 'Liter pada pengisian penuh kedua'));
  root.appendChild(T.field('Harga BBM (Rp/liter)', hargaI));
  root.appendChild(box);
  hitung();
}
