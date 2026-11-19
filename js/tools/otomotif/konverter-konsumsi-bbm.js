import { h as T, utils, kv } from '../../core.js';

// Konversi satuan konsumsi BBM: km/L, L/100km, MPG Amerika (galon US),
// dan MPG Inggris (galon imperial).
// L/100km = 100 / (km/L).
// MPG (US) = 235,2146 / (L/100km); MPG (UK) = 282,4809 / (L/100km).
// Konstanta dari definisi galon: 1 galon US = 3,78541 liter,
// 1 galon UK = 4,54609 liter, 1 mil = 1,609344 km.
export function konversiKonsumsi(nilai, dari) {
  const v = Number(nilai);
  if (!isFinite(v) || v <= 0) return null;
  let kml;
  if (dari === 'kml') kml = v;
  else if (dari === 'l100') kml = 100 / v;
  else if (dari === 'mpgUS') kml = v * 1.609344 / 3.78541;
  else if (dari === 'mpgUK') kml = v * 1.609344 / 4.54609;
  else return null;
  const liter100 = 100 / kml;
  return {
    kml,
    liter100,
    mpgUS: 235.2146 / liter100,
    mpgUK: 282.4809 / liter100,
  };
}
utils.konversiKonsumsi = konversiKonsumsi;

function fmt2(x) {
  return x.toFixed(2).replace('.', ',');
}

export const meta = {"id": "konverter-konsumsi-bbm", "name": "Konverter Konsumsi BBM", "cat": "otomotif", "icon": "🔄", "desc": "Ubah konsumsi BBM antar satuan: km/L, L/100km, MPG Amerika, dan MPG Inggris.", "keywords": "konversi,bbm,konsumsi,km liter,mpg,liter 100km,galon,irit,bensin", "since": "6.18.0"};
export function render(root) {
  const nilaiI = T.input('text', 'cth: 15', ''); nilaiI.inputMode = 'decimal';
  const dariSel = T.select([
    ['kml', 'km/liter (dipakai di Indonesia)'],
    ['l100', 'Liter / 100 km (dipakai di Eropa)'],
    ['mpgUS', 'MPG Amerika (miles per gallon US)'],
    ['mpgUK', 'MPG Inggris (miles per gallon UK)'],
  ], 'kml');
  const box = T.out();

  const hitung = () => {
    const nilai = T.num(nilaiI.value);
    if (!isFinite(nilai) || nilai <= 0) {
      T.show(box, '<div class="err">Nilai konsumsi harus diisi angka lebih dari 0.</div>');
      return;
    }
    const r = konversiKonsumsi(nilai, dariSel.value);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    T.show(box,
      '<div class="big">' + fmt2(r.kml) + ' km/L</div>' +
      '<p class="center mut">Setara dengan nilai di bawah ini.</p>' +
      kv('Liter / 100 km', fmt2(r.liter100) + ' L/100km') +
      kv('MPG Amerika', fmt2(r.mpgUS) + ' mpg') +
      kv('MPG Inggris', fmt2(r.mpgUK) + ' mpg') +
      '<p class="hint">MPG Amerika dan Inggris beda karena galonnya beda ukuran: galon Inggris lebih besar, jadi angka MPG Inggris selalu lebih tinggi untuk konsumsi yang sama. Untuk mengukur konsumsi kendaraanmu sendiri, pakai kalkulator konsumsi BBM.</p>');
  };
  dariSel.addEventListener('change', hitung);
  nilaiI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Brosur mobil luar negeri menulis konsumsi dalam MPG atau L/100km. Masukkan angkanya dan pilih satuannya, dan lihat padanannya dalam km/liter yang biasa dipakai di Indonesia.</p>'));
  root.appendChild(T.field('Nilai konsumsi', nilaiI));
  root.appendChild(T.field('Satuan asal', dariSel));
  root.appendChild(box);
}
