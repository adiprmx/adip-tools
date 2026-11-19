import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-energi-gempa', name: 'Kalkulator Energi Gempa', cat: 'sains', icon: '🌋', desc: 'Energi yang dilepas gempa dari magnitudonya, lengkap dengan perbandingan antar gempa dan kesetaraan TNT.', keywords: 'energi gempa,magnitudo,gempa,richter,tnt,joule,seismik', since: '6.19.0' };

// 1 ton TNT = 4,184 x 10^9 joule.
export const TON_TNT = 4.184e9;

// Energi gempa (joule) dari magnitudo, Gutenberg-Richter: log10 E = 4,8 + 1,5 M.
export function energiGempa(m) {
  if (!isFinite(m)) return NaN;
  return Math.pow(10, 4.8 + 1.5 * m);
}

// Energi dalam ton TNT.
export function setaraTnt(joule) {
  return joule / TON_TNT;
}

// Berapa kali lipat energi gempa M1 dibanding M2.
export function rasioEnergi(m1, m2) {
  return Math.pow(10, 1.5 * (m1 - m2));
}

// Format joule dengan notasi pangkat 10 yang enak dibaca.
export function fmtJoule(j) {
  if (!isFinite(j)) return 'di luar jangkauan';
  if (j === 0) return '0 joule';
  const abs = Math.abs(j);
  if (abs >= 1e3 && abs < 1e15) {
    const e = j.toExponential(2).split('e');
    return e[0].replace('.', ',') + ' × 10^' + parseInt(e[1], 10) + ' joule';
  }
  if (abs < 1e3) return utils.fmtDes(j, 1) + ' joule';
  const e = j.toExponential(2).split('e');
  return e[0].replace('.', ',') + ' × 10^' + parseInt(e[1], 10) + ' joule';
}

export function fmtTnt(ton) {
  if (!isFinite(ton)) return 'di luar jangkauan';
  if (ton < 1000) return utils.fmtDes(ton, 1) + ' ton TNT';
  if (ton < 1e6) return utils.fmtDes(ton / 1000, 2) + ' kiloton TNT';
  return utils.fmtDes(ton / 1e6, 2) + ' megaton TNT';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Skala magnitudo itu logaritmik: naik 1 magnitudo berarti energinya naik sekitar 31,6 kali lipat, bukan 2 kali lipat. Gempa M7 melepas energi sekitar 1.000 kali gempa M5.</p>'));

  const m1I = T.input('number', 'mis. 7', '7');
  const m2I = T.input('number', 'mis. 5', '5');
  const presetSel = T.select([
    ['bebas', 'Isi sendiri'],
    ['aceh', 'Aceh 2004 (M9,1) vs gempa biasa (M5)'],
    ['lombok', 'Lombok 2018 (M7,0) vs M5'],
    ['cianjur', 'Cianjur 2022 (M5,6) vs M5'],
    ['turki', 'Turki 2023 (M7,8) vs M6'],
  ], 'bebas');
  const box = T.out();

  const PRESET = {
    aceh: ['9.1', '5'],
    lombok: ['7', '5'],
    cianjur: ['5.6', '5'],
    turki: ['7.8', '6'],
  };
  presetSel.addEventListener('change', () => {
    const c = PRESET[presetSel.value];
    if (c) { m1I.value = c[0]; m2I.value = c[1]; hitung(); }
  });

  function hitung() {
    const m1 = T.num(m1I.value), m2 = T.num(m2I.value);
    if (!isFinite(m1)) { T.toast('Magnitudo pertama harus diisi angka'); return; }
    if (!isFinite(m2)) { T.toast('Magnitudo pembanding harus diisi angka'); return; }
    if (m1 < -2 || m1 > 10 || m2 < -2 || m2 > 10) { T.toast('Magnitudo yang masuk akal itu -2 sampai 10'); return; }
    const e1 = energiGempa(m1), e2 = energiGempa(m2);
    const rasio = rasioEnergi(m1, m2);
    const hiroshima = setaraTnt(e1) / 15000; // bom Hiroshima sekitar 15 kiloton
    T.show(box,
      '<p class="big">Gempa M' + utils.fmtDes(m1, 1) + ' melepas ' + fmtJoule(e1) + '</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Setara TNT</span><span class="v">' + fmtTnt(setaraTnt(e1)) + '</span></div>' +
      '<div class="kv"><span class="k">Setara bom Hiroshima</span><span class="v">' + utils.fmtDes(hiroshima, 1) + '×</span></div>' +
      '<div class="kv"><span class="k">Gempa M' + utils.fmtDes(m2, 1) + ' (pembanding)</span><span class="v">' + fmtJoule(e2) + '</span></div>' +
      '<div class="kv"><span class="k">Perbandingan energi</span><span class="v">' + utils.fmtDes(rasio, 1) + '× lipat</span></div>' +
      '</div>' +
      '<p class="hint">Rumusnya: energi = 10^(4,8 + 1,5 × magnitudo) joule. Satu kiloton TNT = 1.000 ton TNT. Bom Hiroshima dipakai sebagai patokan sekitar 15 kiloton.</p>');
  }

  root.append(
    T.field('Contoh siap pakai', presetSel),
    T.grid2(T.field('Magnitudo gempa', m1I), T.field('Magnitudo pembanding', m2I)),
    T.btn('Hitung energinya', hitung, true),
    box,
  );
}
