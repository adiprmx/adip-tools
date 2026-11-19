import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-korelasi-pearson', name: 'Kalkulator Korelasi Pearson', cat: 'pelajar', icon: '📉', desc: 'Seberapa kuat hubungan lurus antara dua deret angka, lengkap dengan nilai p untuk menguji apakah hubungan itu nyata.', keywords: 'korelasi,pearson,koefisien korelasi,hubungan,statistik,r', since: '6.18.0' };

// Korelasi Pearson r dari dua deret angka berpasangan.
// Mengembalikan null bila datanya tidak bisa dihitung (n < 3, panjang beda,
// atau salah satu deret tidak berubah sama sekali).
export function hitungPearson(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 3) return null;
  const n = x.length;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const meanX = sx / n, meanY = sy / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  const r = sxy / Math.sqrt(sxx * syy);
  const df = n - 2;
  // Uji signifikansi r: t = r * sqrt((n-2)/(1-r^2)), p dua sisi via utils.tCDF.
  const t = Math.abs(r) >= 1 ? (r > 0 ? Infinity : -Infinity) : r * Math.sqrt(df / (1 - r * r));
  const p = Math.abs(r) >= 1 ? 0 : 2 * (1 - utils.tCDF(Math.abs(t), df));
  return { n, r, r2: r * r, t, df, p, meanX, meanY };
}

// Tafsir kekuatan hubungan (patokan umum Cohen, bukan hukum alam).
export function tafsirR(r) {
  const a = Math.abs(r);
  const arah = r > 0 ? 'searah' : r < 0 ? 'berlawanan arah' : '';
  if (a < 0.1) return 'hampir tidak ada hubungan lurus';
  if (a < 0.3) return 'hubungan lurus yang lemah' + (arah ? ' (' + arah + ')' : '');
  if (a < 0.5) return 'hubungan lurus yang sedang' + (arah ? ' (' + arah + ')' : '');
  if (a < 0.7) return 'hubungan lurus yang kuat' + (arah ? ' (' + arah + ')' : '');
  if (a < 0.9) return 'hubungan lurus yang sangat kuat' + (arah ? ' (' + arah + ')' : '');
  return 'hubungan lurus yang hampir sempurna' + (arah ? ' (' + arah + ')' : '');
}

// fmtDes/fmtP/bacaDeret kanonis tinggal di utils (core.js).

export function render(root) {
  root.appendChild(T.el('<p class="hint">Korelasi mengukur seberapa lurus hubungan dua hal. Nilai 1 artinya naik bareng sempurna, -1 artinya satu naik satunya turun sempurna, 0 artinya tidak ada hubungan lurus. Korelasi bukan bukti sebab akibat.</p>'));

  const xI = T.ta(4, 'cth:\n1, 2, 3, 4, 5', '1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  const yI = T.ta(4, 'cth:\n2, 4, 5, 4, 5', '2.1, 3.9, 6.2, 7.8, 10.1, 12.3, 13.9, 16.2, 18.1, 20.0');
  const box = T.out();

  function hitung() {
    const x = utils.bacaDeret(xI), y = utils.bacaDeret(yI);
    if (!x || !x.length) { T.toast('Isi deret X dulu dengan angka (pisahkan dengan koma atau enter)'); return; }
    if (!y || !y.length) { T.toast('Isi deret Y dulu dengan angka (pisahkan dengan koma atau enter)'); return; }
    if (x.length !== y.length) { T.toast('Jumlah angka X dan Y harus sama (' + x.length + ' lawan ' + y.length + ')'); return; }
    if (x.length < 3) { T.toast('Butuh minimal 3 pasang angka'); return; }
    const h = hitungPearson(x, y);
    if (!h) { T.toast('Salah satu deret tidak berubah sama sekali, jadi korelasinya tidak bisa dihitung'); return; }
    T.show(box,
      '<p class="big">r = ' + utils.fmtDes(h.r) + '</p>' +
      '<p>Artinya: ' + tafsirR(h.r) + '. Nilai r² = ' + utils.fmtDes(h.r2) + ': sekitar ' + utils.fmtDes(h.r2 * 100, 1) + '% perubahan Y sejalan dengan perubahan X secara lurus.</p>' +
      '<p>Nilai p = ' + utils.fmtP(h.p) + ' (uji dua sisi, ' + h.df + ' derajat kebebasan). ' + (h.p < 0.05
        ? 'Di bawah 0,05, jadi hubungan ini cukup kuat untuk dianggap nyata, bukan kebetulan semata.'
        : 'Di atas 0,05, jadi belum cukup bukti bahwa hubungan ini nyata di luar data ini.') + '</p>' +
      '<p class="hint">Dari ' + h.n + ' pasang angka. Rata-rata X = ' + utils.fmtDes(h.meanX) + ', rata-rata Y = ' + utils.fmtDes(h.meanY) + '.</p>');
  }

  root.append(
    T.field('Deret X (angka pertama tiap pasangan)', xI),
    T.field('Deret Y (angka kedua tiap pasangan)', yI),
    T.btn('Hitung korelasi', hitung, true),
    box,
  );
}
