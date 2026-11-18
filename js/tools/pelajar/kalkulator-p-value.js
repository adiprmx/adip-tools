import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-p-value', name: 'Kalkulator P-Value', cat: 'pelajar', icon: '🧪', desc: 'Nilai p dari skor z, t, atau chi-square. Dihitung dari distribusi yang benar, bukan tabel perkiraan.', keywords: 'p-value,nilai p,uji hipotesis,signifikansi,z,t,chi-square,statistik', since: '6.17.0' };

// ---- Distribusi (implementasi standar, tanpa pustaka) ----
export function lgamma(z) {
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < 9; i++) x += p[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function betainc(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  const betacf = (aa, bb, xx) => {
    const MAX = 200, EPS = 3e-14, FPMIN = 1e-300;
    const qab = aa + bb, qap = aa + 1, qam = aa - 1;
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

// CDF normal standar via erf (Abramowitz-Stegun 7.1.26).
// Φ(x) = 0.5 * (1 + erf(x / √2)) — pembagi √2 wajib ada.
export function normalCDF(x) {
  const z = x / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * Math.abs(z));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return 0.5 * (1 + (z >= 0 ? erf : -erf));
}

export function tCDF(t, df) {
  const x = df / (df + t * t);
  const ib = betainc(df / 2, 0.5, x);
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

// Gamma tak lengkap ternormalisasi P(a,x) (deret + pecahan lanjut, Numerical Recipes).
export function gammp(a, x) {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 1; n <= 1000; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i <= 1000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

export function chi2CDF(x, df) { return gammp(df / 2, x / 2); }

// p-value. sisi: 'dua' | 'kanan' | 'kiri'. Untuk chi-square selalu ekor kanan.
export function pValue(jenis, skor, df, sisi) {
  if (jenis === 'z') {
    if (sisi === 'dua') return 2 * (1 - normalCDF(Math.abs(skor)));
    if (sisi === 'kanan') return 1 - normalCDF(skor);
    return normalCDF(skor);
  }
  if (jenis === 't') {
    if (sisi === 'dua') return 2 * (1 - tCDF(Math.abs(skor), df));
    if (sisi === 'kanan') return 1 - tCDF(skor, df);
    return tCDF(skor, df);
  }
  return 1 - chi2CDF(skor, df);
}

function fmtP(p) {
  if (!isFinite(p)) return 'di luar jangkauan';
  if (p === 0) return 'hampir 0 (di bawah 0,0000000001)';
  if (p < 0.0001) return p.toExponential(2).replace('.', ',');
  return String(Math.round(p * 10000) / 10000).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Nilai p itu peluang mendapat hasil seekstrem ini kalau sebenarnya tidak ada efek apa-apa. Makin kecil nilainya, makin kuat bukti adanya efek.</p>'));

  const jenis = T.select([['z', 'Skor z (distribusi normal)'], ['t', 'Skor t (uji t)'], ['chi2', 'Chi-square (uji kecocokan/kebebasan)']], 'z');
  const skorI = T.input('number', 'mis. 1,96', '1.96');
  const dfI = T.input('number', 'mis. 20', '20');
  const sisi = T.select([['dua', 'Dua sisi (hasilnya beda, arah apa saja)'], ['kanan', 'Satu sisi kanan (hasilnya lebih besar)'], ['kiri', 'Satu sisi kiri (hasilnya lebih kecil)']], 'dua');
  const alpha = T.select([['0.05', '0,05 (paling umum)'], ['0.01', '0,01'], ['0.1', '0,1']], '0.05');

  const wrapDf = T.el('<div></div>');
  wrapDf.appendChild(T.field('Derajat kebebasan', dfI, 'Untuk uji t: jumlah data dikurangi 1. Untuk chi-square: (baris - 1) x (kolom - 1).'));
  const wrapSisi = T.el('<div></div>');
  wrapSisi.appendChild(T.field('Sisi pengujian', sisi));

  function aturTampil() {
    wrapDf.hidden = jenis.value === 'z';
    wrapSisi.hidden = jenis.value === 'chi2';
  }
  jenis.addEventListener('change', aturTampil);
  aturTampil();

  const box = T.out();

  function hitung() {
    const skor = T.num(skorI.value);
    const df = T.num(dfI.value);
    const a = parseFloat(alpha.value);
    if (!isFinite(skor)) { T.toast('Isi skornya dulu'); return; }
    if (jenis.value !== 'z' && (!Number.isInteger(df) || df < 1)) { T.toast('Derajat kebebasannya harus bilangan bulat 1 atau lebih'); return; }
    if (jenis.value === 'chi2' && skor < 0) { T.toast('Nilai chi-square tidak boleh negatif'); return; }
    const p = pValue(jenis.value, skor, df, sisi.value);
    const signifikan = p < a;
    const namaSkor = jenis.value === 'z' ? 'z' : jenis.value === 't' ? 't' : 'chi-square';
    T.show(box,
      '<p class="big">p = ' + fmtP(p) + '</p>' +
      '<p>' + (signifikan
        ? 'Hasilnya signifikan pada batas ' + String(a).replace('.', ',') + ': bukti cukup kuat bahwa ada efek atau perbedaan yang nyata.'
        : 'Hasilnya belum signifikan pada batas ' + String(a).replace('.', ',') + ': bukti belum cukup kuat untuk menyimpulkan ada efek.') + '</p>' +
      '<p class="hint">Dari skor ' + namaSkor + ' ' + String(skor).replace('.', ',') +
      (jenis.value === 'z' ? '' : ' dengan derajat kebebasan ' + df) +
      (jenis.value === 'chi2' ? ' (ekor kanan).' : sisi.value === 'dua' ? ' (dua sisi).' : sisi.value === 'kanan' ? ' (satu sisi kanan).' : ' (satu sisi kiri).') + '</p>');
  }

  root.append(
    T.field('Jenis skor', jenis),
    T.field('Nilai skor', skorI),
    wrapDf,
    wrapSisi,
    T.field('Batas signifikansi', alpha, 'Nilai p di bawah batas ini dianggap signifikan.'),
    T.btn('Hitung nilai p', hitung, true),
    box,
  );
}
