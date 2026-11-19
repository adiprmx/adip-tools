import { h as T, kv, errBox } from '../../core.js';

// Patokan umum konversi oven ke air fryer: suhu turun 15 derajat, waktu
// dikali 0,8 (lebih cepat 20%). Berlaku sebaliknya untuk air fryer ke oven.
// Angka ini patokan umum dari panduan memasak, bukan rumus fisika pasti:
// hasil bisa beda menurut ukuran makanan dan merek alat. Selalu cek
// kematangan di dalam, terutama untuk daging dan ayam.
export const TURUN_SUHU = 15;
export const FAKTOR_WAKTU = 0.8;

export function ovenKeAirFryer(suhuC, menit) {
  if (!(suhuC > 0) || !(menit > 0)) return null;
  return { suhu: Math.round(suhuC - TURUN_SUHU), menit: Math.round(menit * FAKTOR_WAKTU) };
}

export function airFryerKeOven(suhuC, menit) {
  if (!(suhuC > 0) || !(menit > 0)) return null;
  return { suhu: Math.round(suhuC + TURUN_SUHU), menit: Math.round(menit / FAKTOR_WAKTU) };
}

export const meta = { "id": "konversi-oven-ke-air-fryer", "name": "Konversi Oven ke Air Fryer", "cat": "masak", "icon": "🍟", "desc": "Ubah suhu dan waktu resep oven jadi air fryer, atau sebaliknya.", "keywords": "air fryer,oven,konversi suhu,memasak,resep,goreng udara", "since": "6.18.0" };

export function render(root) {
  const arah = T.select([['oven-af', 'Oven ke air fryer'], ['af-oven', 'Air fryer ke oven']], 'oven-af');
  const suhu = T.input('number', 'Suhu (°C)', '180');
  const menit = T.input('number', 'Waktu (menit)', '25');
  const box = T.out();

  const hitung = () => {
    const s = T.num(suhu.value);
    const m = T.num(menit.value);
    if (!(s >= 50 && s <= 300)) {
      T.show(box, errBox('Isi suhu antara 50 sampai 300 derajat.'));
      return;
    }
    if (!(m >= 1 && m <= 600)) {
      T.show(box, errBox('Isi waktu antara 1 sampai 600 menit.'));
      return;
    }
    const r = arah.value === 'oven-af' ? ovenKeAirFryer(s, m) : airFryerKeOven(s, m);
    const tujuan = arah.value === 'oven-af' ? 'Air fryer' : 'Oven';
    T.show(box,
      '<div class="center"><div class="dim">' + tujuan + '</div>' +
      '<div class="big">' + r.suhu + '°C, ' + r.menit + ' menit</div>' +
      '<div class="dim">Dari ' + s + '°C selama ' + m + ' menit</div></div>' +
      kv('Suhu ' + tujuan.toLowerCase(), r.suhu + '°C') +
      kv('Waktu ' + tujuan.toLowerCase(), r.menit + ' menit') +
      '<p class="hint">Patokan umum: suhu turun 15 derajat dan waktu lebih cepat 20% saat pindah ke air fryer. ' +
      'Panaskan air fryer 3-5 menit dulu, jangan menumpuk makanan, dan balik atau kocok di tengah waktu supaya matang merata. ' +
      'Cek kematangan di dalam sebelum disajikan, terutama daging dan ayam.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Arah konversi', arah),
    T.field('Suhu (°C)', suhu),
  ));
  root.appendChild(T.field('Waktu (menit)', menit));
  root.appendChild(T.btn('Konversi', hitung, true));
  root.appendChild(box);
  hitung();
}
