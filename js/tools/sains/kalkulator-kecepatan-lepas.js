import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-kecepatan-lepas', name: 'Kalkulator Kecepatan Lepas', cat: 'sains', icon: '🚀', desc: 'Kecepatan minimum untuk lepas dari gravitasi sebuah planet atau benda langit, tanpa dorongan lagi sesudahnya.', keywords: 'kecepatan lepas,escape velocity,gravitasi,planet,bumi,bulan,roket,orbit', since: '6.19.0' };

export const G = 6.674e-11; // tetapan gravitasi, m^3 kg^-1 s^-2
const SUARA = 343; // kecepatan suara di udara 20 C, m/s

// Kecepatan lepas (m/s): v = sqrt(2 G M / R). M kg, R meter.
export function kecepatanLepas(M, R) {
  if (!(M > 0) || !(R > 0)) return NaN;
  return Math.sqrt((2 * G * M) / R);
}

// Massa (kg) dan jari-jari (m) benda langit umum.
export const BENDA = {
  bumi: [5.972e24, 6371000],
  bulan: [7.35e22, 1737000],
  mars: [6.42e23, 3390000],
  venus: [4.87e24, 6052000],
  merkurius: [3.30e23, 2440000],
  jupiter: [1.90e27, 71492000],
  saturnus: [5.68e26, 60268000],
  matahari: [1.99e30, 696000000],
};

export function render(root) {
  root.appendChild(T.el('<p class="hint">Kecepatan lepas adalah kecepatan minimum yang dibutuhkan sebuah benda untuk kabur dari tarikan gravitasi sebuah planet dan tidak pernah kembali, tanpa mesin yang terus menyala.</p>'));

  const bendaSel = T.select([
    ['bumi', 'Bumi'],
    ['bulan', 'Bulan'],
    ['mars', 'Mars'],
    ['venus', 'Venus'],
    ['merkurius', 'Merkurius'],
    ['jupiter', 'Jupiter'],
    ['saturnus', 'Saturnus'],
    ['matahari', 'Matahari'],
    ['bebas', 'Isi sendiri'],
  ], 'bumi');
  const mI = T.input('text', 'mis. 5,97e24', '5.972e24');
  const rI = T.input('text', 'mis. 6371000', '6371000');
  const box = T.out();

  bendaSel.addEventListener('change', () => {
    const b = BENDA[bendaSel.value];
    if (b) { mI.value = String(b[0]); rI.value = String(b[1]); hitung(); }
  });

  function bacaIlmiah(s) {
    const t = String(s || '').trim().replace(',', '.').replace(/×\s*10\^?/i, 'e').replace(/\s+/g, '');
    return Number(t);
  }

  function hitung() {
    const M = bacaIlmiah(mI.value), R = bacaIlmiah(rI.value);
    if (!(M > 0)) { T.toast('Massanya harus lebih dari 0'); return; }
    if (!(R > 0)) { T.toast('Jari-jarinya harus lebih dari 0'); return; }
    const v = kecepatanLepas(M, R);
    const nama = bendaSel.options[bendaSel.selectedIndex].textContent;
    T.show(box,
      '<p class="big">Kecepatan lepas ' + T.esc(nama) + ': ' + utils.fmtDes(v / 1000, 2) + ' km/detik</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">' +
      '<div class="kv"><span class="k">Dalam m/detik</span><span class="v">' + utils.fmtDes(v, 0) + ' m/s</span></div>' +
      '<div class="kv"><span class="k">Dalam km/jam</span><span class="v">' + utils.fmtDes(v * 3.6, 0) + ' km/jam</span></div>' +
      '<div class="kv"><span class="k">Dibanding kecepatan suara</span><span class="v">Mach ' + utils.fmtDes(v / SUARA, 1) + '</span></div>' +
      '<div class="kv"><span class="k">Waktu ke Jakarta-Bandung (150 km)</span><span class="v">' + utils.fmtDes(150000 / v, 1) + ' detik</span></div>' +
      '</div>' +
      '<p class="hint">Rumusnya: v = √(2 × G × M ÷ R). Roket sungguhan tidak langsung melesat secepat ini dari landasan; ia mempercepat bertahap sambil naik, dan angka ini mengabaikan hambatan udara.</p>');
  }

  root.append(
    T.field('Benda langit', bendaSel),
    T.field('Massa (kg, boleh notasi ilmiah seperti 5,97e24)', mI),
    T.field('Jari-jari (meter)', rI),
    T.btn('Hitung kecepatan lepasnya', hitung, true),
    box,
  );
}
