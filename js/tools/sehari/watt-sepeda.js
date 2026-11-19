import { h as T, utils, kv } from '../../core.js';

// Perkiraan daya gowes (watt) dari kecepatan, berat, tanjakan, dan posisi
// badan. Tiga hambatan: gesekan ban (Crr), gravitasi di tanjakan, dan angin
// (0,5 x rho x CdA x v^3). Rugi-rugi rantai 3%. Angka ini perkiraan,
// kondisi jalan dan angin nyata bisa mengubahnya cukup jauh.
export const POSISI = [
  ['0.45', 'Tegak santai (sepeda kota)'],
  ['0.35', 'Road biasa (tangan di hood)'],
  ['0.28', 'Aero (menunduk / drop bar)'],
];
export const PERMUKAAN = [
  ['0.004', 'Aspal halus'],
  ['0.006', 'Aspal biasa'],
  ['0.01', 'Aspal kasar / beton'],
  ['0.02', 'Tanah / kerikil'],
];
export function wattSepeda(kecepatanKmh, massaKg, gradienPersen, cda, crr) {
  const v = Number(kecepatanKmh) / 3.6;
  const m = Number(massaKg);
  const g = Number(gradienPersen) || 0;
  const A = Number(cda);
  const R = Number(crr);
  if (!isFinite(v) || !isFinite(m) || v < 0 || m <= 0 || !isFinite(A) || !isFinite(R) || A < 0 || R < 0) return null;
  const pGesek = R * m * 9.81 * v;
  const pGravitasi = m * 9.81 * v * Math.sin(Math.atan(g / 100));
  const pAngin = 0.5 * 1.225 * A * v * v * v;
  const total = (pGesek + pGravitasi + pAngin) / 0.97;
  return {
    gesek: Math.round(pGesek * 10) / 10,
    gravitasi: Math.round(pGravitasi * 10) / 10,
    angin: Math.round(pAngin * 10) / 10,
    total: Math.round(total * 10) / 10,
    wattPerKg: Math.round((total / m) * 100) / 100,
  };
}
utils.wattSepeda = wattSepeda;

export const meta = {"id": "watt-sepeda", "name": "Watt Sepeda", "cat": "sehari", "icon": "🚴", "desc": "Perkirakan daya gowesmu dalam watt dari kecepatan, berat, tanjakan, dan posisi badan.", "keywords": "watt sepeda,power sepeda,gowes,daya kayuh,cycling power,ftp", "since": "6.19.0"};
export function render(root) {
  const kecI = T.input('text', 'cth: 25', ''); kecI.inputMode = 'decimal';
  const massaI = T.input('text', 'cth: 80', ''); massaI.inputMode = 'decimal';
  const gradienI = T.input('text', 'cth: 0', '0'); gradienI.inputMode = 'decimal';
  const posisiSel = T.select(POSISI, '0.35');
  const permukaanSel = T.select(PERMUKAAN, '0.004');
  const box = T.out();

  const hitung = () => {
    const kec = T.num(kecI.value);
    const massa = T.num(massaI.value);
    const gradien = T.num(gradienI.value);
    if (!kecI.value.trim() && !massaI.value.trim()) { T.hide(box); return; }
    if (!isFinite(kec) || kec < 0 || kec > 120) { T.show(box, '<div class="err">Kecepatan harus angka 0 sampai 120 km/jam.</div>'); return; }
    if (!isFinite(massa) || massa <= 0 || massa > 300) { T.show(box, '<div class="err">Berat total harus angka lebih dari 0 sampai 300 kg.</div>'); return; }
    if (!isFinite(gradien) || gradien < -30 || gradien > 30) { T.show(box, '<div class="err">Tanjakan harus angka -30 sampai 30 persen.</div>'); return; }
    const r = wattSepeda(kec, massa, gradien, Number(posisiSel.value), Number(permukaanSel.value));
    T.show(box,
      '<div class="big">~' + T.fmt(Math.round(r.total)) + ' watt</div>' +
      '<p class="center mut">Perkiraan daya untuk ' + T.fmt(kec) + ' km/jam' + (gradien ? ' di tanjakan ' + utils.fmtDes(gradien, 1) + '%' : ' di jalan datar') + '.</p>' +
      kv('Hambatan angin', '~' + T.fmt(Math.round(r.angin)) + ' W') +
      kv('Gesekan ban', '~' + T.fmt(Math.round(r.gesek)) + ' W') +
      kv('Tanjakan', '~' + T.fmt(Math.round(r.gravitasi)) + ' W') +
      kv('Watt per kg berat', utils.fmtDes(r.wattPerKg, 2) + ' W/kg') +
      '<p class="hint">Ini perkiraan dari rumus fisika, bukan pengukuran power meter. Angin dari depan, ban kurang angin, dan jalan basah bikin angka aslinya lebih besar. Sebagai patokan kasar: pesepeda santai biasanya 75 sampai 150 watt, pesepeda terlatih 200 sampai 300 watt dalam sejam.</p>');
  };
  [kecI, massaI, gradienI, posisiSel, permukaanSel].forEach((i) => i.addEventListener('input', hitung));
  [posisiSel, permukaanSel].forEach((i) => i.addEventListener('change', hitung));

  root.appendChild(T.el('<p class="note">Penasaran berapa watt gowesmu? Isi kecepatan dan berat, langsung ketahuan perkiraannya.</p>'));
  root.appendChild(T.grid2(
    T.field('Kecepatan (km/jam)', kecI),
    T.field('Berat total (kg)', massaI, 'Berat kamu + sepeda + bawaan')
  ));
  root.appendChild(T.field('Tanjakan (%)', gradienI, '0 untuk jalan datar, negatif untuk turunan'));
  root.appendChild(T.field('Posisi badan', posisiSel));
  root.appendChild(T.field('Permukaan jalan', permukaanSel));
  root.appendChild(box);
}
