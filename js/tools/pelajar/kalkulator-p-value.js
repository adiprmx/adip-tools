import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-p-value', name: 'Kalkulator P-Value', cat: 'pelajar', icon: '🧪', desc: 'Nilai p dari skor z, t, atau chi-square. Dihitung dari distribusi yang benar, bukan tabel perkiraan.', keywords: 'p-value,nilai p,uji hipotesis,signifikansi,z,t,chi-square,statistik', since: '6.17.0' };

// ---- Distribusi ----
// lgamma, betainc, normalCDF, tCDF, gammp, chi2CDF kanonis tinggal di utils (core.js).

// p-value. sisi: 'dua' | 'kanan' | 'kiri'. Untuk chi-square selalu ekor kanan.
export function pValue(jenis, skor, df, sisi) {
  if (jenis === 'z') {
    if (sisi === 'dua') return 2 * (1 - utils.normalCDF(Math.abs(skor)));
    if (sisi === 'kanan') return 1 - utils.normalCDF(skor);
    return utils.normalCDF(skor);
  }
  if (jenis === 't') {
    if (sisi === 'dua') return 2 * (1 - utils.tCDF(Math.abs(skor), df));
    if (sisi === 'kanan') return 1 - utils.tCDF(skor, df);
    return utils.tCDF(skor, df);
  }
  return 1 - utils.chi2CDF(skor, df);
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
