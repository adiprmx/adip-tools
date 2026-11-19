import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-massa-jenis', name: 'Kalkulator Massa Jenis', cat: 'sains', icon: '⚖️', desc: 'Cari massa jenis, massa, atau volume dari dua yang sudah diketahui. Lengkap dengan daftar massa jenis bahan sehari-hari.', keywords: 'massa jenis,densitas,kerapatan,massa,volume,bahan,kg/m3', since: '6.19.0' };

// Selesaikan dua nilai yang diketahui -> ketiganya.
// input: { rho (kg/m3), m (kg), V (m3) } dengan tepat dua terisi (> 0).
// Kembalikan { rho, m, V } atau null bila kombinasi tidak valid.
export function selesaikanMassaJenis(input) {
  const k = Object.keys(input).filter((x) => typeof input[x] === 'number' && isFinite(input[x]) && input[x] > 0);
  if (k.length !== 2) return null;
  let { rho, m, V } = input;
  if (rho != null && m != null) V = m / rho;
  else if (rho != null && V != null) m = rho * V;
  else if (m != null && V != null) rho = m / V;
  if (![rho, m, V].every((x) => isFinite(x) && x > 0)) return null;
  return { rho, m, V };
}

// Massa jenis bahan umum (kg/m3), nilai patokan suhu ruang.
export const BAHAN = {
  air: 1000,
  'air-laut': 1025,
  es: 917,
  'minyak-goreng': 920,
  bensin: 737,
  'kayu-jati': 650,
  'kayu-pinus': 500,
  kaca: 2500,
  aluminium: 2700,
  besi: 7870,
  tembaga: 8960,
  perak: 10500,
  emas: 19320,
  raksa: 13546,
  udara: 1.225,
};

export function render(root) {
  root.appendChild(T.el('<p class="hint">Isi dua nilai yang kamu tahu, nilai ketiganya ketahuan. Rumusnya: massa jenis = massa ÷ volume.</p>'));

  const rhoI = T.input('number', 'kg/m³');
  const mI = T.input('number', 'kg');
  const vI = T.input('number', 'liter');
  const bahanSel = T.select([
    ['bebas', 'Isi sendiri'],
    ['air', 'Air: 1.000 kg/m³'],
    ['air-laut', 'Air laut: 1.025 kg/m³'],
    ['es', 'Es: 917 kg/m³'],
    ['minyak-goreng', 'Minyak goreng: 920 kg/m³'],
    ['bensin', 'Bensin: 737 kg/m³'],
    ['kayu-jati', 'Kayu jati: 650 kg/m³'],
    ['kayu-pinus', 'Kayu pinus: 500 kg/m³'],
    ['kaca', 'Kaca: 2.500 kg/m³'],
    ['aluminium', 'Aluminium: 2.700 kg/m³'],
    ['besi', 'Besi: 7.870 kg/m³'],
    ['tembaga', 'Tembaga: 8.960 kg/m³'],
    ['perak', 'Perak: 10.500 kg/m³'],
    ['emas', 'Emas: 19.320 kg/m³'],
    ['raksa', 'Raksa: 13.546 kg/m³'],
    ['udara', 'Udara: 1,225 kg/m³'],
  ], 'bebas');
  const box = T.out();

  bahanSel.addEventListener('change', () => {
    const b = BAHAN[bahanSel.value];
    if (b != null) { rhoI.value = String(b).replace('.', ','); }
  });

  function hitung() {
    const input = {};
    const rho = T.num(rhoI.value), m = T.num(mI.value), vLiter = T.num(vI.value);
    if (isFinite(rho) && rho !== 0) input.rho = rho;
    if (isFinite(m) && m !== 0) input.m = m;
    if (isFinite(vLiter) && vLiter !== 0) input.V = vLiter / 1000; // liter ke m3
    const terisi = Object.keys(input).length;
    if (terisi < 2) { T.toast('Isi dua nilai dulu, ya'); return; }
    if (terisi > 2) { T.toast('Isi tepat dua nilai saja. Kosongkan satu sisanya.'); return; }
    if (Object.values(input).some((x) => x <= 0)) { T.toast('Nilainya harus lebih dari 0'); return; }
    const h = selesaikanMassaJenis(input);
    if (!h) { T.toast('Kombinasi ini tidak bisa dihitung. Cek lagi angkanya.'); return; }
    const mengapung = h.rho < 1000;
    T.show(box,
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Massa jenis</span><span class="v">' + utils.fmtDes(h.rho, 3) + ' kg/m³</span></div>' +
      '<div class="kv"><span class="k">Massa</span><span class="v">' + utils.fmtDes(h.m, 3) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Volume</span><span class="v">' + utils.fmtDes(h.V * 1000, 3) + ' liter</span></div>' +
      '<div class="kv"><span class="k">Di air</span><span class="v">' + (mengapung ? 'Mengapung' : 'Tenggelam') + '</span></div>' +
      '</div>' +
      '<p class="hint">Cek silang: ' + utils.fmtDes(h.m, 3) + ' kg ÷ ' + utils.fmtDes(h.V, 4) + ' m³ = ' + utils.fmtDes(h.rho, 3) + ' kg/m³. Bahan yang massa jenisnya di bawah air (1.000 kg/m³) mengapung, di atas itu tenggelam.</p>');
  }

  root.append(
    T.field('Bahan (opsional, mengisi massa jenis)', bahanSel),
    T.grid2(T.field('Massa jenis (kg/m³)', rhoI), T.field('Massa (kg)', mI)),
    T.field('Volume (liter)', vI),
    T.btn('Hitung nilai ketiganya', hitung, true),
    box,
  );
}
