import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-uji-t', name: 'Kalkulator Uji-t', cat: 'pelajar', icon: '⚖️', desc: 'Bandingkan rata-rata satu kelompok dengan nilai patokan, atau rata-rata dua kelompok, dan lihat apakah bedanya nyata atau cuma kebetulan.', keywords: 'uji t,t-test,uji hipotesis,rata-rata,statistik,signifikansi,welch', since: '6.18.0' };

// Rata-rata dan simpangan baku sampel (pembagi n-1).
function ringkas(data) {
  const n = data.length;
  const mean = data.reduce((s, v) => s + v, 0) / n;
  let ss = 0;
  for (const v of data) ss += (v - mean) * (v - mean);
  return { n, mean, sd: n > 1 ? Math.sqrt(ss / (n - 1)) : 0 };
}

// Uji-t satu sampel: apakah rata-rata data beda dari nilai patokan mu0?
// p-value dua sisi via utils.tCDF (kanonis, core.js).
export function ujiTSatuSampel(data, mu0) {
  if (!Array.isArray(data) || data.length < 2) return null;
  const r = ringkas(data);
  if (r.sd === 0) return null;
  const se = r.sd / Math.sqrt(r.n);
  const t = (r.mean - mu0) / se;
  const df = r.n - 1;
  const p = 2 * (1 - utils.tCDF(Math.abs(t), df));
  return { ...r, mu0, t, df, p, d: (r.mean - mu0) / r.sd };
}

// Uji-t dua sampel independen. Welch (varians boleh beda) adalah bawaan;
// pooled (varians dianggap sama) bila opts.pooled true.
export function ujiTDuaSampel(a, b, opts) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return null;
  const ra = ringkas(a), rb = ringkas(b);
  if (ra.sd === 0 && rb.sd === 0) return null;
  const pooled = opts && opts.pooled;
  let t, df, se;
  if (pooled) {
    const sp2 = ((ra.n - 1) * ra.sd * ra.sd + (rb.n - 1) * rb.sd * rb.sd) / (ra.n + rb.n - 2);
    se = Math.sqrt(sp2 * (1 / ra.n + 1 / rb.n));
    t = (ra.mean - rb.mean) / se;
    df = ra.n + rb.n - 2;
  } else {
    const va = ra.sd * ra.sd / ra.n, vb = rb.sd * rb.sd / rb.n;
    se = Math.sqrt(va + vb);
    t = (ra.mean - rb.mean) / se;
    df = (va + vb) * (va + vb) / (va * va / (ra.n - 1) + vb * vb / (rb.n - 1));
  }
  if (!isFinite(t) || se === 0) return null;
  const p = 2 * (1 - utils.tCDF(Math.abs(t), df));
  const sp = Math.sqrt(((ra.n - 1) * ra.sd * ra.sd + (rb.n - 1) * rb.sd * rb.sd) / (ra.n + rb.n - 2));
  return { a: ra, b: rb, t, df, p, se, d: sp === 0 ? 0 : (ra.mean - rb.mean) / sp, pooled: !!pooled };
}

// fmtDes/fmtP/bacaDeret kanonis tinggal di utils (core.js).

export function render(root) {
  root.appendChild(T.el('<p class="hint">Uji-t menjawab: beda rata-rata yang kamu lihat itu nyata, atau bisa jadi cuma kebetulan dari sampel yang kecil? Nilai p di bawah 0,05 biasanya dianggap cukup bukti bahwa bedanya nyata.</p>'));

  const mode = T.select([
    ['satu', 'Satu kelompok lawan nilai patokan'],
    ['dua', 'Dua kelompok dibandingkan'],
  ], 'satu');
  const aI = T.ta(4, 'cth:\n7, 8, 9, 6, 10', '7, 8, 9, 6, 10, 8, 9, 7, 8, 9');
  const bI = T.ta(4, 'cth:\n5, 6, 5, 7, 6', '5, 6, 5, 7, 6, 5, 6, 7, 5, 6');
  const muI = T.input('text', 'cth: 7', '7'); muI.inputMode = 'decimal';
  const varian = T.select([['welch', 'Welch (sebaran dua kelompok boleh beda, disarankan)'], ['pooled', 'Gabungan (sebaran dua kelompok dianggap sama)']], 'welch');
  const box = T.out();

  const wrapMu = T.el('<div></div>');
  wrapMu.appendChild(T.field('Nilai patokan yang dibandingkan', muI, 'Contoh: rata-rata kelas lain, atau target nilai.'));
  const wrapB = T.el('<div></div>');
  wrapB.appendChild(T.field('Data kelompok kedua', bI));
  const wrapV = T.el('<div></div>');
  wrapV.appendChild(T.field('Cara hitung', varian));

  function aturTampil() {
    const dua = mode.value === 'dua';
    wrapMu.hidden = dua;
    wrapB.hidden = !dua;
    wrapV.hidden = !dua;
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function kesimpulan(p) {
    return p < 0.05
      ? 'Nilai p di bawah 0,05: bedanya cukup kuat untuk dianggap nyata.'
      : 'Nilai p di atas 0,05: belum cukup bukti bahwa bedanya nyata, bisa jadi cuma kebetulan.';
  }

  function hitung() {
    const a = utils.bacaDeret(aI);
    if (!a || a.length < 2) { T.toast('Isi data kelompok pertama dulu, minimal 2 angka'); return; }
    if (mode.value === 'satu') {
      const mu0 = T.num(muI.value);
      if (!isFinite(mu0)) { T.toast('Isi nilai patokannya dulu'); return; }
      const h = ujiTSatuSampel(a, mu0);
      if (!h) { T.toast('Semua angka sama, jadi uji-t tidak bisa dihitung'); return; }
      T.show(box,
        '<p class="big">t = ' + utils.fmtDes(h.t) + ' · p = ' + utils.fmtP(h.p) + '</p>' +
        '<p>Rata-rata data ' + utils.fmtDes(h.mean) + ' (n = ' + h.n + ', simpangan baku ' + utils.fmtDes(h.sd) + '), dibandingkan dengan patokan ' + utils.fmtDes(mu0) + '. Selisihnya ' + utils.fmtDes(h.mean - mu0) + '.</p>' +
        '<p>' + kesimpulan(h.p) + ' Derajat kebebasan ' + h.df + '. Besar efek (d) = ' + utils.fmtDes(h.d) + '.</p>');
      return;
    }
    const b = utils.bacaDeret(bI);
    if (!b || b.length < 2) { T.toast('Isi data kelompok kedua dulu, minimal 2 angka'); return; }
    const h = ujiTDuaSampel(a, b, { pooled: varian.value === 'pooled' });
    if (!h) { T.toast('Kedua kelompok tidak berubah sama sekali, jadi uji-t tidak bisa dihitung'); return; }
    T.show(box,
      '<p class="big">t = ' + utils.fmtDes(h.t) + ' · p = ' + utils.fmtP(h.p) + '</p>' +
      '<p>Rata-rata kelompok pertama ' + utils.fmtDes(h.a.mean) + ' (n = ' + h.a.n + '), kelompok kedua ' + utils.fmtDes(h.b.mean) + ' (n = ' + h.b.n + '). Selisih rata-rata ' + utils.fmtDes(h.a.mean - h.b.mean) + '.</p>' +
      '<p>' + kesimpulan(h.p) + ' Derajat kebebasan ' + utils.fmtDes(h.df, 2) + ' (' + (h.pooled ? 'gabungan' : 'Welch') + '). Besar efek (d) = ' + utils.fmtDes(h.d) + '.</p>');
  }

  root.append(
    T.field('Jenis uji', mode),
    T.field('Data kelompok pertama', aI),
    wrapMu,
    wrapB,
    wrapV,
    T.btn('Hitung uji-t', hitung, true),
    box,
  );
}
