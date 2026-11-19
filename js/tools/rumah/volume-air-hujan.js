import { h as T, utils, kv } from '../../core.js';

// Volume air hujan yang bisa ditampung: V (liter) = luas atap (m2) x
// curah hujan (mm) x koefisien limpasan x efisiensi saringan. 1 mm hujan di
// atas 1 m2 = 1 liter. Koefisien limpasan (fraksi air yang sampai ke talang):
// seng/logam 0,95; genteng 0,90; sirap/aspal 0,85; dak beton 0,80.
// Efisiensi saringan 0,90 (sekitar 10% hilang di saringan dan pembuangan
// awal/first flush). Patokan pakai air rumah: 120 liter per orang per hari.
const ATAP = {
  'seng': { nama: 'Seng / logam', koef: 0.95 },
  'genteng': { nama: 'Genteng', koef: 0.90 },
  'sirap': { nama: 'Sirap / aspal', koef: 0.85 },
  'beton': { nama: 'Dak beton', koef: 0.80 },
};
const TOREN = [250, 500, 650, 1000, 2000, 5000];
export function hitungAirHujan(o) {
  const luas = Math.max(0, Number(o.luas) || 0);
  const hujan = Math.max(0, Number(o.hujan) || 0);
  const koef = Math.max(0, Math.min(1, Number(o.koef) || 0));
  const ef = Math.max(0, Math.min(1, Number(o.efisiensi) == null ? 0.9 : Number(o.efisiensi)));
  const liter = luas * hujan * koef * ef;
  const hari = o.periode === 'tahun' ? 365 : 30;
  const perHari = liter / hari;
  const orang = perHari / 120;
  const toren = TOREN.find((t) => t >= liter) || null;
  return { liter, perHari, orang, toren, koef };
}
utils.volumeAirHujan = hitungAirHujan;

export const meta = {"id": "volume-air-hujan", "name": "Volume Air Hujan", "cat": "rumah", "icon": "🌧️", "desc": "Berapa liter air hujan yang bisa ditampung dari atap rumahmu, dan cukup untuk berapa orang.", "keywords": "air hujan,atap,tampung,toren,panen hujan,rainwater,liter,curah hujan", "since": "6.19.0"};
export function render(root) {
  const luasI = T.input('text', 'cth: 60', '60'); luasI.inputMode = 'decimal';
  const hujanI = T.input('text', 'cth: 200', '200'); hujanI.inputMode = 'decimal';
  const periodeSel = T.select([['bulan', 'per bulan'], ['tahun', 'per tahun']], 'bulan');
  const atapSel = T.select(Object.keys(ATAP).map((k) => [k, ATAP[k].nama]), 'genteng');
  const box = T.out();

  const hitung = () => {
    const luas = T.num(luasI.value) || 0;
    const hujan = T.num(hujanI.value) || 0;
    if (!(luas > 0) || !(hujan > 0)) { T.hide(box); return; }
    const r = hitungAirHujan({
      luas, hujan, koef: ATAP[atapSel.value].koef, efisiensi: 0.9,
      periode: periodeSel.value,
    });
    const per = periodeSel.value === 'tahun' ? 'tahun' : 'bulan';
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(r.liter)) + ' liter / ' + per + '</div>' +
      '<p class="center mut">Air hujan yang bisa ditampung dari atap ini.</p>' +
      kv('Rata-rata per hari', T.fmt(Math.round(r.perHari)) + ' liter') +
      kv('Cukup untuk', T.fmt(Math.round(r.orang * 10) / 10) + ' orang (120 liter/orang/hari)') +
      (r.toren ? kv('Ukuran toren yang pas', T.fmt(r.toren) + ' liter (menampung satu ' + per + ' penuh)') : kv('Ukuran toren', 'Di atas 5.000 liter, perlu toren besar atau beberapa toren')) +
      '<p class="hint">Hitungan memakai koefisien limpasan atap ' + ATAP[atapSel.value].nama.toLowerCase() + ' (' + T.fmt(r.koef * 100) + '%) dan efisiensi saringan 90%: sekitar 10% air hilang di saringan dan pembuangan awal. Curah hujan bulanan di Indonesia umumnya 100–400 mm di musim hujan. Air hujan tampungan cocok untuk siram tanaman, cuci, dan flush; untuk minum harus disaring dan dimasak dulu.</p>');
  };
  [luasI, hujanI, periodeSel, atapSel].forEach((i) => i.addEventListener('input', hitung));
  [periodeSel, atapSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Atap rumahmu bisa jadi sumber air. Masukkan luas atap dan curah hujan di daerahmu.</p>'));
  root.appendChild(T.field('Luas atap (m²)', luasI, 'Luas atap yang airnya mengalir ke talang'));
  root.appendChild(T.grid2(
    T.field('Curah hujan (mm)', hujanI, 'Cek BMKG untuk daerahmu'),
    T.field('Periode hujan', periodeSel)
  ));
  root.appendChild(T.field('Jenis atap', atapSel));
  root.appendChild(box);
  hitung();
}
