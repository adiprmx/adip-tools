import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-titik-embun', name: 'Kalkulator Titik Embun', cat: 'sains', icon: '💧', desc: 'Titik embun dari suhu dan kelembapan relatif. Di bawah suhu ini, uap air mulai mengembun jadi titik air di permukaan yang dingin.', keywords: 'titik embun,dew point,embun,kelembapan,suhu,gerah,kondensasi', since: '6.19.0' };

// Titik embun (C) dari suhu (C) dan kelembapan relatif (%), rumus Magnus.
export function titikEmbun(tC, rh) {
  if (!isFinite(tC) || !(rh > 0) || rh > 100) return NaN;
  const a = 17.27, b = 237.7;
  const alpha = ((a * tC) / (b + tC)) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

// Kelembapan mutlak (g/m3): massa uap air per meter kubik udara.
export function kelembapanMutlak(tC, rh) {
  if (!isFinite(tC) || !(rh >= 0) || rh > 100) return NaN;
  const es = 6.112 * Math.exp((17.27 * tC) / (tC + 237.7)); // hPa
  const e = (es * rh) / 100;
  return (216.7 * e) / (tC + 273.15);
}

// Patokan umum rasa gerah dari titik embun (bukan aturan medis).
export function rasaGerah(td) {
  if (td < 10) return 'Udara terasa kering';
  if (td < 16) return 'Nyaman';
  if (td < 18) return 'Mulai terasa lembap';
  if (td < 21) return 'Agak gerah';
  if (td < 24) return 'Gerah';
  return 'Sangat gerah';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Titik embun adalah suhu tempat udara sudah jenuh uap air. Bila ada permukaan yang lebih dingin dari titik embun, uap air menempel jadi titik embun, seperti di gelas es atau kaca mobil pagi hari.</p>'));

  const suhuI = T.input('number', 'mis. 30', '30');
  const lembapI = T.input('number', 'mis. 70', '70');
  const presetSel = T.select([
    ['bebas', 'Isi sendiri'],
    ['siang', 'Siang terik: 32°C, 65%'],
    ['pagi', 'Pagi sejuk: 24°C, 90%'],
    ['ruang-ac', 'Ruangan ber-AC: 22°C, 50%'],
    ['hujan', 'Habis hujan: 26°C, 95%'],
  ], 'bebas');
  const box = T.out();

  const PRESET = {
    siang: ['32', '65'],
    pagi: ['24', '90'],
    'ruang-ac': ['22', '50'],
    hujan: ['26', '95'],
  };
  presetSel.addEventListener('change', () => {
    const c = PRESET[presetSel.value];
    if (c) { suhuI.value = c[0]; lembapI.value = c[1]; hitung(); }
  });

  function hitung() {
    const t = T.num(suhuI.value), rh = T.num(lembapI.value);
    if (!isFinite(t) || t < -273.15) { T.toast('Suhunya tidak masuk akal, cek lagi'); return; }
    if (!isFinite(rh) || rh <= 0 || rh > 100) { T.toast('Kelembapan diisi 1 sampai 100'); return; }
    const td = titikEmbun(t, rh);
    const mutlak = kelembapanMutlak(t, rh);
    if (!isFinite(td)) { T.toast('Kombinasi ini tidak bisa dihitung'); return; }
    T.show(box,
      '<p class="big">Titik embunnya: ' + utils.fmtDes(td, 1) + '°C</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Selisih dari suhu udara</span><span class="v">' + utils.fmtDes(t - td, 1) + '°C</span></div>' +
      '<div class="kv"><span class="k">Uap air di udara</span><span class="v">' + utils.fmtDes(mutlak, 2) + ' g/m³</span></div>' +
      '<div class="kv"><span class="k">Rasanya</span><span class="v">' + rasaGerah(td) + '</span></div>' +
      '<div class="kv"><span class="k">Embun mulai terbentuk bila</span><span class="v">Permukaan di bawah ' + utils.fmtDes(td, 1) + '°C</span></div>' +
      '</div>' +
      '<p class="hint">Makin kecil selisih suhu dan titik embun, makin lembap udaranya. Kalau selisihnya 0, udara sudah jenuh: kabut atau hujan bisa terjadi. Rumus Magnus yang dipakai akurat untuk suhu -40 sampai 50°C.</p>');
  }

  root.append(
    T.field('Contoh siap pakai', presetSel),
    T.grid2(T.field('Suhu udara (°C)', suhuI), T.field('Kelembapan relatif (%)', lembapI)),
    T.btn('Hitung titik embunnya', hitung, true),
    box,
  );
}
