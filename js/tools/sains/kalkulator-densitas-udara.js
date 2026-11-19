import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-densitas-udara', name: 'Kalkulator Densitas Udara', cat: 'sains', icon: '🌬️', desc: 'Massa jenis udara dari suhu, tekanan, dan kelembapan. Udara panas dan lembap lebih ringan dari udara dingin dan kering.', keywords: 'densitas udara,massa jenis udara,kerapatan udara,suhu,tekanan,kelembapan,ISA', since: '6.19.0' };

// Tetapan gas: udara kering 287,05 J/(kg K), uap air 461,5 J/(kg K).
const RD = 287.05;
const RV = 461.5;

// Tekanan uap jenuh (hPa) dari suhu, rumus Magnus.
export function tekananUapJenuh(tC) {
  return 6.112 * Math.exp((17.67 * tC) / (tC + 243.5));
}

// Densitas udara lembap (kg/m3) dari suhu (C), tekanan (hPa), kelembapan (%).
// Rumus: rho = p_d/(R_d T) + p_v/(R_v T), p_v dari kelembapan x tekanan jenuh.
export function densitasUdara(tC, pHpa, rh) {
  const T = tC + 273.15;
  if (!(T > 0) || !(pHpa > 0) || !(rh >= 0) || rh > 100) return NaN;
  const e = tekananUapJenuh(tC) * (rh / 100); // hPa
  const p = pHpa * 100, pe = e * 100; // Pa
  const pd = p - pe;
  if (pd <= 0) return NaN;
  return pd / (RD * T) + pe / (RV * T);
}

// Densitas udara kering (kg/m3), tanpa uap air.
export function densitasUdaraKering(tC, pHpa) {
  const T = tC + 273.15;
  if (!(T > 0) || !(pHpa > 0)) return NaN;
  return (pHpa * 100) / (RD * T);
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Densitas udara berubah mengikuti suhu, tekanan, dan kelembapan. Makin panas atau makin lembap, udara makin ringan, dan itu terasa di performa mesin dan pesawat.</p>'));

  const suhuI = T.input('number', 'mis. 25', '25');
  const tekanI = T.input('number', 'mis. 1013', '1013');
  const lembapI = T.input('number', 'mis. 60', '60');
  const presetSel = T.select([
    ['bebas', 'Isi sendiri'],
    ['standar', 'Standar ISA: 15°C, 1013,25 hPa, kering'],
    ['tropis', 'Siang tropis: 30°C, 1010 hPa, 70%'],
    ['pegunungan', 'Pegunungan: 20°C, 800 hPa, 40%'],
    ['dingin', 'Pagi dingin: 5°C, 1020 hPa, 80%'],
  ], 'bebas');
  const box = T.out();

  const PRESET = {
    standar: ['15', '1013.25', '0'],
    tropis: ['30', '1010', '70'],
    pegunungan: ['20', '800', '40'],
    dingin: ['5', '1020', '80'],
  };
  presetSel.addEventListener('change', () => {
    const c = PRESET[presetSel.value];
    if (c) { suhuI.value = c[0]; tekanI.value = c[1]; lembapI.value = c[2]; hitung(); }
  });

  function hitung() {
    const t = T.num(suhuI.value), p = T.num(tekanI.value), rh = T.num(lembapI.value);
    if (!isFinite(t) || t < -273.15) { T.toast('Suhunya tidak masuk akal, cek lagi'); return; }
    if (!isFinite(p) || p <= 0) { T.toast('Tekanannya harus lebih dari 0'); return; }
    if (!isFinite(rh) || rh < 0 || rh > 100) { T.toast('Kelembapan diisi 0 sampai 100'); return; }
    const rho = densitasUdara(t, p, rh);
    const kering = densitasUdaraKering(t, p);
    if (!isFinite(rho)) { T.toast('Kombinasi ini tidak bisa dihitung'); return; }
    const selisih = kering - rho;
    T.show(box,
      '<p class="big">Densitas udaranya: ' + utils.fmtDes(rho, 3) + ' kg/m³</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Kalau kering total</span><span class="v">' + utils.fmtDes(kering, 3) + ' kg/m³</span></div>' +
      '<div class="kv"><span class="k">Uap air meringankan</span><span class="v">' + utils.fmtDes(selisih, 3) + ' kg/m³</span></div>' +
      '</div>' +
      '<p class="hint">Patokan: udara standar di permukaan laut (15°C, 1013,25 hPa, kering) densitasnya 1,225 kg/m³. Uap air lebih ringan dari udara kering, jadi udara lembap selalu lebih ringan dari udara kering pada suhu dan tekanan yang sama.</p>');
  }

  root.append(
    T.field('Contoh siap pakai', presetSel),
    T.grid2(T.field('Suhu (°C)', suhuI), T.field('Tekanan (hPa)', tekanI)),
    T.field('Kelembapan relatif (%)', lembapI),
    T.btn('Hitung densitasnya', hitung, true),
    box,
  );
}
