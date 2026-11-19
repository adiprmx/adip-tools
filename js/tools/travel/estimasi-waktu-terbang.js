import { h as T, utils, kv } from '../../core.js';
import { jarakHaversine } from '../converter/lihat-jejak-gpx.js';

// Perkiraan lama terbang: jarak dibagi kecepatan jelajah, ditambah waktu
// naik, turun, dan antre di landasan (35 menit). Jarak rute populer
// dihitung dari koordinat bandaranya (haversine), bukan angka hafalan.
// Ini ESTIMASI: angin, rute, dan antrean bisa mengubahnya cukup jauh.
export const KECEPATAN = [
  ['850', 'Pesawat jet (sekitar 850 km/jam)'],
  ['500', 'Turboprop / baling-baling (sekitar 500 km/jam)'],
  ['250', 'Pesawat kecil (sekitar 250 km/jam)'],
];
// [nama rute, lat1, lon1, lat2, lon2], koordinat bandara umum.
export const RUTE = [
  ['Jakarta - Singapura', -6.13, 106.66, 1.36, 103.99],
  ['Jakarta - Kuala Lumpur', -6.13, 106.66, 2.75, 101.71],
  ['Jakarta - Denpasar', -6.13, 106.66, -8.75, 115.17],
  ['Jakarta - Medan', -6.13, 106.66, 3.64, 98.89],
  ['Jakarta - Surabaya', -6.13, 106.66, -7.38, 112.79],
  ['Jakarta - Bangkok', -6.13, 106.66, 13.69, 100.75],
  ['Jakarta - Hong Kong', -6.13, 106.66, 22.31, 113.91],
  ['Jakarta - Tokyo', -6.13, 106.66, 35.55, 139.78],
  ['Jakarta - Sydney', -6.13, 106.66, -33.95, 151.18],
  ['Jakarta - Jeddah', -6.13, 106.66, 21.68, 39.16],
];
export function jarakRute(nama) {
  const r = RUTE.find((x) => x[0] === nama);
  if (!r) return null;
  return Math.round(jarakHaversine(r[1], r[2], r[3], r[4]) / 1000);
}
export function estimasiTerbangMenit(jarakKm, kecepatanKmh, overheadMenit) {
  const j = Number(jarakKm);
  const k = Number(kecepatanKmh);
  const o = Number(overheadMenit) || 0;
  if (!isFinite(j) || !isFinite(k) || j < 0 || k <= 0 || o < 0) return null;
  return j / k * 60 + o;
}
export function fmtDurasi(menit) {
  const total = Math.round(Number(menit) || 0);
  const j = Math.floor(total / 60);
  const m = total % 60;
  if (j <= 0) return total + ' menit';
  if (m === 0) return j + ' jam';
  return j + ' jam ' + m + ' menit';
}
utils.estimasiTerbang = { estimasiTerbangMenit, jarakRute };

export const meta = {"id": "estimasi-waktu-terbang", "name": "Estimasi Waktu Terbang", "cat": "travel", "icon": "✈️", "desc": "Perkirakan lama penerbangan dari jarak dan jenis pesawat, dengan rute populer dari Jakarta.", "keywords": "waktu terbang,lama penerbangan,durasi flight,jarak terbang,pesawat,estimasi flight", "since": "6.19.0"};
export function render(root) {
  const ruteSel = T.select([['', 'Isi jarak sendiri']].concat(RUTE.map((r) => [r[0], r[0]])), '');
  const jarakI = T.input('text', 'cth: 900', ''); jarakI.inputMode = 'decimal';
  const kecepatanSel = T.select(KECEPATAN, '850');
  const box = T.out();

  const hitung = () => {
    let jarak = T.num(jarakI.value);
    if (ruteSel.value) {
      jarak = jarakRute(ruteSel.value);
      jarakI.value = String(jarak);
      jarakI.disabled = true;
    } else {
      jarakI.disabled = false;
    }
    if (!jarakI.value.trim() && !ruteSel.value) { T.hide(box); return; }
    if (!isFinite(jarak) || jarak <= 0 || jarak > 40000) { T.show(box, '<div class="err">Jarak harus angka lebih dari 0 sampai 40.000 km.</div>'); return; }
    const menit = estimasiTerbangMenit(jarak, Number(kecepatanSel.value), 35);
    const udara = estimasiTerbangMenit(jarak, Number(kecepatanSel.value), 0);
    T.show(box,
      '<div class="big">~' + fmtDurasi(menit) + '</div>' +
      '<p class="center mut">Estimasi, bukan jadwal resmi maskapai.</p>' +
      kv('Jarak', T.fmt(jarak) + ' km (garis lurus)') +
      kv('Waktu di udara', '~' + fmtDurasi(udara)) +
      kv('Naik, turun, dan antre', '35 menit') +
      '<p class="hint">Jarak dihitung garis lurus dari koordinat bandara. Rute pesawat asli biasanya sedikit lebih panjang karena mengikuti jalur udara. Angin, cuaca, dan antrean di bandara sibuk bisa menambah waktu. Untuk jadwal pasti, cek ke maskapai atau aplikasi tiket.</p>');
  };
  [ruteSel, jarakI, kecepatanSel].forEach((i) => i.addEventListener('input', hitung));
  [ruteSel, kecepatanSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Pilih rute populer atau isi jaraknya sendiri, langsung ketahuan kira-kira berapa lama di udara.</p>'));
  root.appendChild(T.field('Rute populer', ruteSel, 'Jaraknya dihitung dari koordinat bandara'));
  root.appendChild(T.field('Jarak (km)', jarakI, 'Jarak garis lurus antara dua bandara'));
  root.appendChild(T.field('Jenis pesawat', kecepatanSel));
  root.appendChild(box);
}
