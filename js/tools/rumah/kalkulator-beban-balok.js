import { h as T, utils, kv } from '../../core.js';

// Balok sederhana bertumpu di dua ujung (simply supported beam).
// Reaksi tumpuan: RA = wL/2 + P(L-a)/L; RB = wL/2 + Pa/L, dengan w beban
// merata (kN/m), P beban terpusat (kN) di jarak a dari tumpuan kiri, L bentang.
// Momen di titik x: M(x) = RA*x - w*x^2/2 - P*(x-a) bila x > a.
// Momen maks dan lendutan maks dicari dengan sampling 2.001 titik (cukup
// rapat: galat lokasi < L/2000, galat nilai diabaikan untuk keperluan praktis).
// Lendutan: beban merata d(x) = w*x*(L^3 - 2Lx^2 + x^3)/(24EI); beban terpusat
// d(x) = P*b*x*(L^2 - b^2 - x^2)/(6EIL) untuk x <= a (b = L-a), rumus cermin
// untuk x > a. Satuan kerja: N dan mm (E dalam N/mm^2, I dalam mm^4).
// Batas lendutan umum L/240 (mis. balok lantai). Penampang persegi:
// I = b*h^3/12.
export function hitungBalok(o) {
  const L = Math.max(0, Number(o.bentang) || 0);
  const w = Math.max(0, Number(o.bebanMerata) || 0);
  const P = Math.max(0, Number(o.bebanTitik) || 0);
  const a = Math.max(0, Math.min(L, Number(o.posisiTitik) || 0));
  const E = Math.max(0, Number(o.eGpa) || 0) * 1000; // GPa -> N/mm^2
  const I = Math.max(0, Number(o.iMm4) || 0);
  const Lm = L;
  const Lmm = L * 1000;
  const amm = a * 1000;
  const bmm = Lmm - amm;
  const wNmm = w; // 1 kN/m = 1 N/mm
  const PN = P * 1000;
  const RA = w * Lm / 2 + (Lm > 0 ? P * (Lm - a) / Lm : 0); // kN
  const RB = w * Lm / 2 + (Lm > 0 ? P * a / Lm : 0); // kN
  const RAN = RA * 1000;
  const momen = (x) => RAN * x - wNmm * x * x / 2 - (x > amm ? PN * (x - amm) : 0); // N.mm
  const lendutMerata = (x) => (E > 0 && I > 0)
    ? wNmm * x * (Math.pow(Lmm, 3) - 2 * Lmm * x * x + Math.pow(x, 3)) / (24 * E * I) : 0;
  const lendutTitik = (x) => {
    if (!(E > 0 && I > 0) || !(PN > 0)) return 0;
    if (x <= amm) return PN * bmm * x * (Lmm * Lmm - bmm * bmm - x * x) / (6 * E * I * Lmm);
    const xr = Lmm - x;
    return PN * amm * xr * (Lmm * Lmm - amm * amm - xr * xr) / (6 * E * I * Lmm);
  };
  const N = 2000;
  let mMax = 0; let mX = 0; let dMax = 0; let dX = 0;
  for (let k = 0; k <= N; k++) {
    const x = Lmm * k / N;
    const m = momen(x);
    if (m > mMax) { mMax = m; mX = x; }
    const d = lendutMerata(x) + lendutTitik(x);
    if (d > dMax) { dMax = d; dX = x; }
  }
  const batas = Lmm / 240;
  return {
    RA, RB,
    momenMaks: mMax / 1e6, // N.mm -> kN.m
    momenX: mX / 1000, // mm -> m
    lendutMaks: dMax, // mm
    lendutX: dX / 1000,
    batasLendut: batas,
    lendutOk: E > 0 && I > 0 ? dMax <= batas : null,
  };
}
export function inersiaPersegi(bMm, hMm) {
  const b = Math.max(0, Number(bMm) || 0);
  const h = Math.max(0, Number(hMm) || 0);
  return b * h * h * h / 12;
}
utils.hitungBalok = hitungBalok;

export const meta = {"id": "kalkulator-beban-balok", "name": "Kalkulator Beban Balok (Beam)", "cat": "rumah", "icon": "🏗️", "desc": "Reaksi tumpuan, momen paling besar, dan lendutan balok sederhana dari beban merata atau terpusat.", "keywords": "balok,beam,beban,momen,lendutan,defleksi,tumpuan,struktur,bentang", "since": "6.19.0"};
export function render(root) {
  const bentangI = T.input('text', 'cth: 4', '4'); bentangI.inputMode = 'decimal';
  const merataI = T.input('text', 'cth: 5', '5'); merataI.inputMode = 'decimal';
  const titikI = T.input('text', 'cth: 10', ''); titikI.inputMode = 'decimal';
  const posisiI = T.input('text', 'cth: 2', ''); posisiI.inputMode = 'decimal';
  const bahanSel = T.select([['200', 'Baja (E = 200 GPa)'], ['25', 'Beton (E = 25 GPa)'], ['10', 'Kayu (E = 10 GPa)'], ['custom', 'Lainnya (isi sendiri)']], '25');
  const eI = T.input('text', 'cth: 25', '25'); eI.inputMode = 'decimal';
  const iModeSel = T.select([['persegi', 'Penampang persegi (lebar x tinggi)'], ['langsung', 'Momen inersia (I) langsung']], 'persegi');
  const lebarI = T.input('text', 'cth: 150', '150'); lebarI.inputMode = 'decimal';
  const tinggiI = T.input('text', 'cth: 300', '300'); tinggiI.inputMode = 'decimal';
  const iI = T.input('text', 'cth: 337500000', ''); iI.inputMode = 'decimal';
  const box = T.out();
  const fldE = T.field('Modulus elastisitas E (GPa)', eI);
  fldE.hidden = true;
  const fldLebar = T.field('Lebar balok b (mm)', lebarI);
  const fldTinggi = T.field('Tinggi balok h (mm)', tinggiI);
  const fldI = T.field('Momen inersia I (mm⁴)', iI);
  fldI.hidden = true;

  bahanSel.addEventListener('change', () => { fldE.hidden = bahanSel.value !== 'custom'; if (bahanSel.value !== 'custom') eI.value = bahanSel.value; hitung(); });
  iModeSel.addEventListener('change', () => {
    const langsung = iModeSel.value === 'langsung';
    fldLebar.hidden = langsung; fldTinggi.hidden = langsung; fldI.hidden = !langsung;
    hitung();
  });

  const hitung = () => {
    const L = T.num(bentangI.value) || 0;
    if (!(L > 0)) { T.hide(box); return; }
    const I = iModeSel.value === 'langsung'
      ? (T.num(iI.value) || 0)
      : inersiaPersegi(T.num(lebarI.value), T.num(tinggiI.value));
    const r = hitungBalok({
      bentang: L, bebanMerata: T.num(merataI.value), bebanTitik: T.num(titikI.value),
      posisiTitik: T.num(posisiI.value), eGpa: T.num(eI.value), iMm4: I,
    });
    const f = (x, d) => T.fmt(Math.round(x * Math.pow(10, d || 2)) / Math.pow(10, d || 2));
    const lendutBaris = I > 0
      ? kv('Lendutan paling besar', f(r.lendutMaks, 2) + ' mm (di ' + f(r.lendutX, 2) + ' m dari kiri)') +
        kv('Batas lendutan umum (L/240)', f(r.batasLendut, 2) + ' mm, ' + (r.lendutOk ? 'masih aman' : 'MELEBIHI BATAS, balok terlalu lentur')) : '';
    T.show(box,
      '<div class="big">' + f(r.momenMaks, 2) + ' kN.m</div>' +
      '<p class="center mut">Momen paling besar, di ' + f(r.momenX, 2) + ' m dari tumpuan kiri.</p>' +
      kv('Reaksi tumpuan kiri (RA)', f(r.RA, 2) + ' kN') +
      kv('Reaksi tumpuan kanan (RB)', f(r.RB, 2) + ' kN') +
      kv('Momen inersia I', T.fmt(Math.round(I)) + ' mm⁴') +
      lendutBaris +
      '<p class="hint">Hitungan untuk balok yang bertumpu bebas di dua ujungnya. Batas lendutan L/240 adalah patokan umum untuk balok lantai; balok atap atau yang menopang dinding bata biasanya memakai batas lebih ketat. Hasil ini untuk perkiraan awal saja, ukuran balok bangunan nyata tetap harus dicek ahli struktur.</p>');
  };
  [bentangI, merataI, titikI, posisiI, eI, lebarI, tinggiI, iI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Balok mau menahan beban seberapa besar? Masukkan bentang dan bebannya, lihat reaksi tumpuan, momen, dan lendutannya.</p>'));
  root.appendChild(T.field('Bentang balok L (meter)', bentangI, 'Jarak antar tumpuan'));
  root.appendChild(T.grid2(
    T.field('Beban merata w (kN/m)', merataI, 'Beban yang tersebar sepanjang balok'),
    T.field('Beban terpusat P (kN, opsional)', titikI, 'Beban di satu titik, mis. kolom di atas balok')
  ));
  root.appendChild(T.field('Posisi beban terpusat a (meter dari kiri, opsional)', posisiI, 'Kosongkan = di tengah bentang'));
  root.appendChild(T.grid2(
    T.field('Bahan balok', bahanSel),
    T.field('Cara isi penampang', iModeSel)
  ));
  root.appendChild(fldE);
  root.appendChild(fldLebar);
  root.appendChild(fldTinggi);
  root.appendChild(fldI);
  root.appendChild(box);
  hitung();
}
