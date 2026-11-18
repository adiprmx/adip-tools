import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-interval-kepercayaan', name: 'Kalkulator Interval Kepercayaan', cat: 'pelajar', icon: '📊', desc: 'Rentang nilai yang paling mungkin dari rata-rata atau proporsi, dengan tingkat keyakinan 90, 95, atau 99 persen.', keywords: 'interval kepercayaan,confidence interval,ci,margin of error,rata-rata,proporsi,statistik,z,t', since: '6.17.0' };

// ---- Matematika distribusi (implementasi standar, tanpa pustaka) ----
// ln Gamma via pendekatan Lanczos (koefisien g=7, n=9).
export function lgamma(z) {
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < 9; i++) x += p[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Beta tak lengkap ternormalisasi via pecahan lanjut (Numerical Recipes betacf).
export function betainc(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  const betacf = (aa, bb, xx) => {
    const MAX = 200, EPS = 3e-14, FPMIN = 1e-300;
    let qab = aa + bb, qap = aa + 1, qam = aa - 1;
    let c = 1, d = 1 - qab * xx / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAX; m++) {
      const m2 = 2 * m;
      let aa2 = m * (bb - m) * xx / ((qam + m2) * (aa + m2));
      d = 1 + aa2 * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa2 / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa2 = -(aa + m) * (qab + m) * xx / ((aa + m2) * (qap + m2));
      d = 1 + aa2 * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa2 / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  };
  if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
  return 1 - bt * betacf(b, a, 1 - x) / b;
}

// CDF distribusi t Student.
export function tCDF(t, df) {
  const x = df / (df + t * t);
  const ib = betainc(df / 2, 0.5, x);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

// Kuantil t dua sisi: nilai kritis t* untuk tingkat keyakinan (mis. 0.95) dan df.
export function tKritis(tingkat, df) {
  const target = (1 + tingkat) / 2;
  let lo = 0, hi = 100;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (tCDF(mid, df) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// CDF normal standar via erf (Abramowitz-Stegun 7.1.26), untuk pemurnian Newton.
function normalCDF(x) {
  const z = x / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return 0.5 * (1 + (z >= 0 ? erf : -erf));
}

// Kuantil normal standar (Acklam + 2 langkah Newton).
// Rasio Acklam saja galatnya ~2e-4; Newton dengan CDF membawa galat ke ~1e-9.
export function zKritis(tingkat) {
  const p = (1 + tingkat) / 2;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285984469534e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const plow = 0.02425, phigh = 1 - plow;
  let q, r, x;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= phigh) {
    q = p - 0.5; r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // Pemurnian Newton: x -= (Φ(x) - p) / φ(x).
  for (let i = 0; i < 3; i++) {
    const pdf = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    x -= (normalCDF(x) - p) / pdf;
  }
  return x;
}

// Interval kepercayaan rata-rata. metode: 't' | 'z'.
export function ciRataRata(mean, sd, n, tingkat, metode) {
  const k = metode === 'z' ? zKritis(tingkat) : tKritis(tingkat, n - 1);
  const se = sd / Math.sqrt(n);
  const moe = k * se;
  return { bawah: mean - moe, atas: mean + moe, moe, k, se };
}

// Interval kepercayaan proporsi (Wilson score, akurat untuk n kecil juga).
export function ciProporsi(x, n, tingkat) {
  const z = zKritis(tingkat);
  const p = x / n;
  const d = 1 + z * z / n;
  const tengah = (p + z * z / (2 * n)) / d;
  const sebar = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / d;
  return { bawah: Math.max(0, tengah - sebar), atas: Math.min(1, tengah + sebar), p, moe: sebar, k: z };
}

function fmtNum(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const r = Math.round(v * Math.pow(10, des || 4)) / Math.pow(10, des || 4);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Interval kepercayaan itu rentang nilai yang paling mungkin berisi nilai sebenarnya. Makin tinggi tingkat keyakinannya, makin lebar rentangnya.</p>'));

  const mode = T.select([['rata', 'Rata-rata (dari nilai tengah dan sebaran)'], ['proporsi', 'Proporsi (dari jumlah yang cocok)']], 'rata');
  const tingkat = T.select([['0.9', '90%'], ['0.95', '95%'], ['0.99', '99%']], '0.95');
  const metode = T.select([['t', 'Otomatis pakai t (aman untuk sampel kecil)'], ['z', 'Pakai z (sampel besar, di atas 30)']], 't');

  const meanI = T.input('number', 'mis. 75,5');
  const sdI = T.input('number', 'mis. 10');
  const nI = T.input('number', 'mis. 40');
  const xI = T.input('number', 'mis. 120');
  const n2I = T.input('number', 'mis. 200');

  const boxRata = T.el('<div></div>');
  boxRata.append(T.field('Nilai rata-rata', meanI), T.field('Simpangan baku (sebaran nilainya)', sdI, 'Seberapa menyebar datanya. Kalau tidak tahu, pakai simpangan baku dari datamu.'), T.field('Jumlah data', nI), T.field('Cara hitung', metode));
  const boxProp = T.el('<div></div>');
  boxProp.append(T.field('Jumlah yang cocok', xI, 'Misalnya 120 orang dari 200 yang ditanya memilih jawaban itu.'), T.field('Jumlah total yang ditanya', n2I));
  boxProp.hidden = true;

  mode.addEventListener('change', () => {
    const prop = mode.value === 'proporsi';
    boxRata.hidden = prop;
    boxProp.hidden = !prop;
  });

  const box = T.out();

  function hitung() {
    const lvl = parseFloat(tingkat.value);
    const persen = Math.round(lvl * 100);
    if (mode.value === 'rata') {
      const mean = T.num(meanI.value), sd = T.num(sdI.value), n = T.num(nI.value);
      if (!isFinite(mean)) { T.toast('Isi nilai rata-ratanya dulu'); return; }
      if (!(sd > 0)) { T.toast('Simpangan bakunya harus lebih dari 0'); return; }
      if (!(n >= 2) || !Number.isInteger(n)) { T.toast('Jumlah datanya minimal 2 dan harus bilangan bulat'); return; }
      const h = ciRataRata(mean, sd, n, lvl, metode.value);
      T.show(box,
        '<p class="big">' + fmtNum(h.bawah) + ' sampai ' + fmtNum(h.atas) + '</p>' +
        '<p>Kami ' + persen + '% yakin nilai rata-rata sebenarnya ada di antara ' + fmtNum(h.bawah) + ' dan ' + fmtNum(h.atas) + '.</p>' +
        '<p class="hint">Nilai tengah: ' + fmtNum(mean) + '. Lebar simpangan: ±' + fmtNum(h.moe) + '. Angka pengali (' + (metode.value === 'z' ? 'z' : 't') + '): ' + fmtNum(h.k) + '.</p>');
    } else {
      const x = T.num(xI.value), n = T.num(n2I.value);
      if (!Number.isInteger(x) || x < 0) { T.toast('Jumlah yang cocok harus bilangan bulat 0 atau lebih'); return; }
      if (!Number.isInteger(n) || n <= 0) { T.toast('Jumlah total harus bilangan bulat lebih dari 0'); return; }
      if (x > n) { T.toast('Jumlah yang cocok tidak boleh lebih dari jumlah total'); return; }
      const h = ciProporsi(x, n, lvl);
      T.show(box,
        '<p class="big">' + fmtNum(h.bawah * 100, 2) + '% sampai ' + fmtNum(h.atas * 100, 2) + '%</p>' +
        '<p>Kami ' + persen + '% yakin proporsi sebenarnya ada di antara ' + fmtNum(h.bawah * 100, 2) + '% dan ' + fmtNum(h.atas * 100, 2) + '% (dari hasil sampel ' + fmtNum(h.p * 100, 2) + '%).</p>' +
        '<p class="hint">Dihitung dengan metode Wilson, yang tetap akurat walau sampelnya kecil.</p>');
    }
  }

  root.append(
    T.field('Yang mau dihitung', mode),
    T.field('Tingkat keyakinan', tingkat),
    boxRata, boxProp,
    T.btn('Hitung rentangnya', hitung, true),
    box,
  );
}
