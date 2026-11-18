import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-z-score', name: 'Kalkulator Z-Score', cat: 'pelajar', icon: '🎯', desc: 'Seberapa jauh nilaimu dari rata-rata, dalam satuan simpangan baku, plus persentilnya.', keywords: 'z-score,nilai z,standarisasi,persentil,distribusi normal,standar deviasi', since: '6.17.0' };

// CDF normal standar via erf (Abramowitz-Stegun 7.1.26).
// Φ(x) = 0.5 * (1 + erf(x / √2)) — pembagi √2 wajib ada.
export function normalCDF(x) {
  const z = x / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return 0.5 * (1 + (z >= 0 ? erf : -erf));
}

export function hitungZ(nilai, mean, sd) {
  const z = (nilai - mean) / sd;
  return { z, persentil: normalCDF(z) * 100 };
}

function fmtNum(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const r = Math.round(v * Math.pow(10, des == null ? 3 : des)) / Math.pow(10, des == null ? 3 : des);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Z-score bilang seberapa jauh sebuah nilai dari rata-rata. Z-score 1 artinya nilainya 1 simpangan baku di atas rata-rata.</p>'));

  const nilaiI = T.input('number', 'mis. 85', '85');
  const meanI = T.input('number', 'mis. 70', '70');
  const sdI = T.input('number', 'mis. 10', '10');
  const box = T.out();

  function gambarKurva(z) {
    // Kurva lonceng normal standar, area di kiri z diwarnai.
    const W = 340, H = 150, P = 14;
    const f = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    const sx = (x) => P + (x + 4) / 8 * (W - 2 * P);
    const sy = (y) => H - P - y / f(0) * (H - 2 * P - 10);
    let path = '';
    let area = 'M ' + sx(-4) + ' ' + sy(0);
    for (let x = -4; x <= 4; x += 0.1) {
      path += (path ? ' L ' : 'M ') + sx(x).toFixed(1) + ' ' + sy(f(x)).toFixed(1);
      if (x <= z) area += ' L ' + sx(x).toFixed(1) + ' ' + sy(f(x)).toFixed(1);
    }
    const zc = Math.max(-4, Math.min(4, z));
    area += ' L ' + sx(zc).toFixed(1) + ' ' + sy(0) + ' Z';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:420px;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin-top:12px" role="img" aria-label="Kurva normal dengan posisi z-score">' +
      '<path d="' + area + '" fill="#ff6f61" opacity="0.35" />' +
      '<path d="' + path + '" fill="none" stroke="#e8ded0" stroke-width="2" />' +
      '<line x1="' + sx(zc) + '" y1="' + P + '" x2="' + sx(zc) + '" y2="' + (H - P) + '" stroke="#ff6f61" stroke-width="2" stroke-dasharray="4 3" />' +
      '<text x="' + sx(0) + '" y="' + (H - 2) + '" fill="#a89c88" font-size="10" text-anchor="middle">rata-rata (z = 0)</text>' +
      '<text x="' + sx(zc) + '" y="' + (P + 2) + '" fill="#ff6f61" font-size="11" text-anchor="middle">z = ' + fmtNum(z, 2) + '</text>' +
      '</svg>';
  }

  function hitung() {
    const nilai = T.num(nilaiI.value), mean = T.num(meanI.value), sd = T.num(sdI.value);
    if (!isFinite(nilai)) { T.toast('Isi nilainya dulu'); return; }
    if (!isFinite(mean)) { T.toast('Isi rata-ratanya dulu'); return; }
    if (!(sd > 0)) { T.toast('Simpangan bakunya harus lebih dari 0'); return; }
    const h = hitungZ(nilai, mean, sd);
    const posisi = h.z === 0 ? 'tepat di rata-rata' : h.z > 0 ? fmtNum(Math.abs(h.z)) + ' simpangan baku di atas rata-rata' : fmtNum(Math.abs(h.z)) + ' simpangan baku di bawah rata-rata';
    const persenBawah = h.persentil;
    T.show(box,
      '<p class="big">Z-score: ' + fmtNum(h.z) + '</p>' +
      '<p>Nilaimu ' + posisi + '.</p>' +
      '<p>Persentil ke-' + fmtNum(persenBawah, 1) + ': sekitar ' + fmtNum(persenBawah, 1) + '% nilai lain berada di bawah nilaimu, dan ' + fmtNum(100 - persenBawah, 1) + '% berada di atasnya.</p>' +
      '<p class="hint">Cara hitungnya: (' + fmtNum(nilai) + ' − ' + fmtNum(mean) + ') ÷ ' + fmtNum(sd) + ' = ' + fmtNum(h.z) + '.</p>' +
      gambarKurva(h.z));
  }

  root.append(
    T.field('Nilai yang dicek', nilaiI),
    T.field('Rata-rata kelompok', meanI),
    T.field('Simpangan baku', sdI, 'Seberapa menyebar nilai-nilai di kelompok itu.'),
    T.btn('Hitung z-score', hitung, true),
    box,
  );
}
