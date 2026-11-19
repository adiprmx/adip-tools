import { h as T } from '../../core.js';

export const meta = { id: 'konverter-tahun-cahaya', name: 'Konverter Tahun Cahaya', cat: 'sains', icon: '🌌', desc: 'Tahun cahaya ke kilometer, parsec, AU, dan sebaliknya. Satu tahun cahaya itu jarak yang ditempuh cahaya selama setahun.', keywords: 'tahun cahaya,light year,parsec,AU,astronomi,jarak bintang,kilometer', since: '6.18.0' };

// Faktor konversi ke kilometer (definisi IAU):
// 1 tahun cahaya = kecepatan cahaya x 1 tahun Julian (365,25 hari)
//   = 299.792,458 km/detik x 31.557.600 detik = 9.460.730.472.580,8 km.
// 1 parsec = 3,08567758149137e13 km (definisi IAU 2015).
// 1 AU = 149.597.870,7 km (definisi IAU 2012, nilai pasti).
export const FAKTOR_KM = {
  ly: 9460730472580.8,
  pc: 30856775814913.7,
  au: 149597870.7,
  km: 1,
  mil: 1.609344,
  m: 0.001,
};

export const NAMA_SATUAN = {
  ly: 'tahun cahaya',
  pc: 'parsec',
  au: 'AU (jarak Bumi-Matahari)',
  km: 'kilometer',
  mil: 'mil',
  m: 'meter',
};

export function konversiCahaya(nilai, dari, ke) {
  if (!isFinite(nilai) || !(dari in FAKTOR_KM) || !(ke in FAKTOR_KM)) return null;
  return nilai * FAKTOR_KM[dari] / FAKTOR_KM[ke];
}

function fmtBesar(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  if (v !== 0 && (Math.abs(v) >= 1e15 || Math.abs(v) < 0.0001)) {
    return v.toExponential(3).replace('.', ',');
  }
  return T.fmt(Math.round(v * 10000) / 10000);
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Tahun cahaya itu satuan jarak, bukan waktu: jarak yang ditempuh cahaya dalam setahun, sekitar 9,46 triliun kilometer. Dipakai untuk jarak antar bintang.</p>'));

  const nilaiI = T.input('text', 'cth: 1', '1'); nilaiI.inputMode = 'decimal';
  const dari = T.select([
    ['ly', 'Tahun cahaya'],
    ['pc', 'Parsec'],
    ['au', 'AU (satuan astronomi)'],
    ['km', 'Kilometer'],
    ['mil', 'Mil'],
    ['m', 'Meter'],
  ], 'ly');
  const ke = T.select([
    ['km', 'Kilometer'],
    ['ly', 'Tahun cahaya'],
    ['pc', 'Parsec'],
    ['au', 'AU (satuan astronomi)'],
    ['mil', 'Mil'],
    ['m', 'Meter'],
  ], 'km');
  const box = T.out();

  function hitung() {
    const n = T.num(nilaiI.value);
    if (!isFinite(n) || n < 0) { T.toast('Isi nilainya dulu dengan angka 0 atau lebih'); return; }
    const hasil = konversiCahaya(n, dari.value, ke.value);
    const urutan = ['ly', 'pc', 'au', 'km', 'mil', 'm'];
    const baris = urutan.map((u) =>
      '<tr' + (u === ke.value ? ' style="background:rgba(255,111,97,.12)"' : '') + '><td style="padding:5px 8px">' + T.esc(NAMA_SATUAN[u]) + '</td><td style="text-align:right;padding:5px 8px">' + fmtBesar(konversiCahaya(n, dari.value, u)) + '</td></tr>').join('');
    T.show(box,
      '<p class="big">' + fmtBesar(n) + ' ' + T.esc(NAMA_SATUAN[dari.value]) + ' = ' + fmtBesar(hasil) + ' ' + T.esc(NAMA_SATUAN[ke.value]) + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Satuan</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Nilai</th></tr></thead><tbody>' + baris + '</tbody></table>' +
      '<p class="hint">Definisi IAU: 1 tahun cahaya = 9.460.730.472.580,8 km. 1 parsec = 3,26 tahun cahaya. 1 AU = jarak rata-rata Bumi ke Matahari.</p>');
  }

  root.append(
    T.field('Nilai', nilaiI),
    T.grid2(T.field('Dari', dari), T.field('Ke', ke)),
    T.btn('Konversi', hitung, true),
    box,
  );
}
