import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-dilatasi-waktu', name: 'Kalkulator Dilatasi Waktu', cat: 'sains', icon: '⏳', desc: 'Efek relativitas Einstein: waktu berjalan lebih lambat pada kecepatan tinggi. Cek seberapa besar selisihnya untuk pesawat, satelit, sampai pesawat antarbintang.', keywords: 'dilatasi waktu,relativitas,einstein,gamma,kecepatan cahaya,waktu,relativistik', since: '6.19.0' };

export const C = 299792458; // kecepatan cahaya, m/s

// Faktor Lorentz gamma = 1 / sqrt(1 - v^2/c^2). v dalam m/s.
export function faktorGamma(v) {
  if (!(v >= 0) || v >= C) return NaN;
  return 1 / Math.sqrt(1 - (v * v) / (C * C));
}

// Waktu yang berlalu di Bumi saat durasiDetik berlalu di kendaraan.
export function waktuDiBumi(durasiDetik, v) {
  const g = faktorGamma(v);
  if (!isFinite(g)) return NaN;
  return durasiDetik * g;
}

// Selisih waktu (detik): seberapa lambat jam di kendaraan dibanding jam di Bumi.
export function selisihWaktu(durasiDetik, v) {
  const g = faktorGamma(v);
  if (!isFinite(g)) return NaN;
  return durasiDetik * (g - 1);
}

// Format selisih kecil dengan satuan yang enak dibaca.
export function fmtSelisih(detik) {
  if (!isFinite(detik)) return 'di luar jangkauan';
  if (detik === 0) return '0';
  const abs = Math.abs(detik);
  if (abs >= 31557600) return utils.fmtDes(detik / 31557600, 3) + ' tahun';
  if (abs >= 86400) return utils.fmtDes(detik / 86400, 3) + ' hari';
  if (abs >= 3600) return utils.fmtDes(detik / 3600, 3) + ' jam';
  if (abs >= 60) return utils.fmtDes(detik / 60, 3) + ' menit';
  if (abs >= 1) return utils.fmtDes(detik, 3) + ' detik';
  if (abs >= 0.001) return utils.fmtDes(detik * 1000, 3) + ' milidetik';
  if (abs >= 0.000001) return utils.fmtDes(detik * 1e6, 3) + ' mikrodetik';
  return utils.fmtDes(detik * 1e9, 3) + ' nanodetik';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Menurut relativitas khusus Einstein, jam di kendaraan yang bergerak cepat berdetak lebih lambat dibanding jam yang diam. Efeknya baru terasa di kecepatan mendekati kecepatan cahaya.</p>'));

  const kecI = T.input('number', 'mis. 90', '90');
  const satuanSel = T.select([
    ['persen-c', '% kecepatan cahaya'],
    ['km-jam', 'km/jam'],
    ['km-detik', 'km/detik'],
    ['m-detik', 'm/detik'],
  ], 'persen-c');
  const durasiI = T.input('number', 'mis. 10', '10');
  const presetSel = T.select([
    ['bebas', 'Isi sendiri'],
    ['pesawat', 'Pesawat jet: 900 km/jam'],
    ['iss', 'Stasiun luar angkasa ISS: 7,66 km/detik'],
    ['setengah-c', 'Setengah kecepatan cahaya'],
    ['sembilan-puluh', '90% kecepatan cahaya'],
    ['sembilan-sembilan', '99% kecepatan cahaya'],
  ], 'bebas');
  const box = T.out();

  const PRESET = {
    pesawat: ['900', 'km-jam'],
    iss: ['7.66', 'km-detik'],
    'setengah-c': ['50', 'persen-c'],
    'sembilan-puluh': ['90', 'persen-c'],
    'sembilan-sembilan': ['99', 'persen-c'],
  };
  presetSel.addEventListener('change', () => {
    const c = PRESET[presetSel.value];
    if (c) { kecI.value = c[0]; satuanSel.value = c[1]; hitung(); }
  });

  function keMeterPerDetik(nilai, satuan) {
    if (satuan === 'persen-c') return (nilai / 100) * C;
    if (satuan === 'km-jam') return nilai / 3.6;
    if (satuan === 'km-detik') return nilai * 1000;
    return nilai;
  }

  function hitung() {
    const nilai = T.num(kecI.value);
    const tahun = T.num(durasiI.value);
    if (!isFinite(nilai) || nilai < 0) { T.toast('Kecepatannya harus 0 atau lebih'); return; }
    if (!isFinite(tahun) || tahun <= 0) { T.toast('Durasinya harus lebih dari 0 tahun'); return; }
    const v = keMeterPerDetik(nilai, satuanSel.value);
    if (v >= C) { T.toast('Tidak ada benda bermassa yang bisa mencapai kecepatan cahaya'); return; }
    const g = faktorGamma(v);
    const durasiDetik = tahun * 31557600; // 1 tahun Julian
    const bumi = waktuDiBumi(durasiDetik, v);
    const selisih = selisihWaktu(durasiDetik, v);
    T.show(box,
      '<p class="big">Di Bumi berlalu ' + utils.fmtDes(bumi / 31557600, 4) + ' tahun, di kendaraan ' + utils.fmtDes(tahun, 2) + ' tahun</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Faktor gamma</span><span class="v">' + utils.fmtDes(g, 6) + '</span></div>' +
      '<div class="kv"><span class="k">Jam kendaraan tertinggal</span><span class="v">' + fmtSelisih(selisih) + '</span></div>' +
      '</div>' +
      '<p class="hint">Kecepatanmu: ' + utils.fmtDes(v / C * 100, 6) + '% kecepatan cahaya (' + utils.fmtDes(v, 0) + ' m/detik). Efek ini nyata dan sudah terukur: jam atom di pesawat terbang memang berdetak lebih lambat dari jam di darat.</p>');
  }

  root.append(
    T.field('Contoh siap pakai', presetSel),
    T.grid2(T.field('Kecepatan', kecI), T.field('Satuan', satuanSel)),
    T.field('Durasi perjalanan (tahun, dihitung dari jam kendaraan)', durasiI),
    T.btn('Hitung selisih waktunya', hitung, true),
    box,
  );
}
