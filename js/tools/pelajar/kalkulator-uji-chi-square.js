import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-uji-chi-square', name: 'Kalkulator Uji Chi-Square', cat: 'pelajar', icon: '🎲', desc: 'Bandingkan angka yang kamu amati dengan angka yang kamu harapkan, atau cek ada tidaknya hubungan dua hal dari tabel. Hitung nilai chi-square, derajat kebebasan, dan nilai p.', keywords: 'chi-square,uji chi-square,kecocokan,kebebasan,tabel kontingensi,statistik,derajat kebebasan,nilai p', since: '6.18.0' };

// ---- Distribusi chi-square ----
// gammp + chi2CDF kanonis tinggal di utils (core.js).

// Nilai p uji chi-square (ekor kanan): peluang mendapat chi-square sebesar ini
// atau lebih besar kalau sebenarnya tidak ada beda atau hubungan apa-apa.
export function chiSquarePValue(x, df) {
  if (!isFinite(x) || !isFinite(df) || x < 0 || df < 1) return null;
  const p = 1 - utils.chi2CDF(x, df);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

// Uji kecocokan: apakah angka yang diamati cocok dengan angka harapan?
// diamati dan diharapkan harus sama panjangnya, minimal 2 kategori.
export function hitungChiSquareKecocokan(diamati, diharapkan) {
  if (!Array.isArray(diamati) || !Array.isArray(diharapkan) || diamati.length !== diharapkan.length || diamati.length < 2) return null;
  let chi2 = 0, total = 0, minHarapan = Infinity;
  const rincian = [];
  for (let i = 0; i < diamati.length; i++) {
    const o = diamati[i], e = diharapkan[i];
    if (!isFinite(o) || !isFinite(e) || o < 0 || e <= 0) return null;
    const s = (o - e) * (o - e) / e;
    chi2 += s;
    total += o;
    if (e < minHarapan) minHarapan = e;
    rincian.push({ o, e, sumbangan: s });
  }
  if (total <= 0) return null;
  const df = diamati.length - 1;
  return { chi2, df, p: chiSquarePValue(chi2, df), total, k: diamati.length, rincian, minHarapan };
}

// Uji kebebasan: apakah dua hal dalam tabel berhubungan?
// tabel = larik baris, tiap baris larik angka dengan panjang yang sama (min 2x2).
// opts.yates: koreksi Yates, hanya berlaku untuk tabel 2x2.
export function hitungChiSquareKebebasan(tabel, opts) {
  if (!Array.isArray(tabel) || tabel.length < 2) return null;
  const cols = tabel[0] && tabel[0].length;
  if (!cols || cols < 2) return null;
  const baris = tabel.length;
  const totalBaris = [], totalKolom = new Array(cols).fill(0);
  let n = 0;
  for (let i = 0; i < baris; i++) {
    if (!Array.isArray(tabel[i]) || tabel[i].length !== cols) return null;
    let s = 0;
    for (let j = 0; j < cols; j++) {
      const v = tabel[i][j];
      if (!isFinite(v) || v < 0) return null;
      s += v;
      totalKolom[j] += v;
      n += v;
    }
    totalBaris.push(s);
  }
  if (n <= 0) return null;
  const yates = !!(opts && opts.yates) && baris === 2 && cols === 2;
  const diharapkan = [];
  let chi2 = 0, minHarapan = Infinity;
  for (let i = 0; i < baris; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      const e = totalBaris[i] * totalKolom[j] / n;
      if (e <= 0) return null;
      row.push(e);
      if (e < minHarapan) minHarapan = e;
      const d = Math.abs(tabel[i][j] - e);
      const dd = yates ? Math.max(0, d - 0.5) : d;
      chi2 += dd * dd / e;
    }
    diharapkan.push(row);
  }
  const df = (baris - 1) * (cols - 1);
  const k = Math.min(baris, cols) - 1;
  return { chi2, df, p: chiSquarePValue(chi2, df), n, baris, kolom: cols, diharapkan, totalBaris, totalKolom, yates, minHarapan, cramerV: k > 0 ? Math.sqrt(chi2 / (n * k)) : 0 };
}

function fmtDes(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const d = des == null ? 4 : des;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(Object.is(r, -0) ? 0 : r).replace('.', ',');
}

function fmtP(p) {
  if (!isFinite(p)) return 'di luar jangkauan';
  if (p === 0) return 'hampir 0';
  if (p < 0.0001) return p.toExponential(2).replace('.', ',');
  return fmtDes(p, 4);
}

// bacaDeret kanonis tinggal di utils (core.js).

// Deret bilangan bulat (jumlah yang diamati harus bulat, bukan pecahan).
function bacaDeretBulat(ta) {
  const nums = utils.bacaDeret(ta);
  if (!nums) return null;
  for (const v of nums) if (!Number.isInteger(v) || v < 0) return null;
  return nums;
}

// Deret desimal: pisahkan dengan spasi atau titik koma, karena koma dipakai
// untuk desimal (312,75). Koma pemisah di ujung token ikut dibuang supaya
// "312.75, 104.25" juga terbaca benar.
function bacaDeretDesimal(ta) {
  const tokens = String(ta.value).split(/[;\s]+/).map((s) => s.trim().replace(/,+$/, '')).filter(Boolean);
  const nums = [];
  for (const t of tokens) {
    const v = T.num(t);
    if (!isFinite(v)) return null;
    nums.push(v);
  }
  return nums;
}

// Tabel: satu baris per baris, angka dipisah koma, spasi, atau titik koma.
function bacaTabel(ta) {
  const rows = [];
  for (const line of String(ta.value).split('\n')) {
    const tokens = line.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
    if (!tokens.length) continue;
    const row = [];
    for (const t of tokens) {
      const v = T.num(t);
      if (!isFinite(v) || !Number.isInteger(v) || v < 0) return null;
      row.push(v);
    }
    rows.push(row);
  }
  return rows;
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Uji chi-square membandingkan angka yang kamu amati dengan angka yang kamu harapkan. Kalau bedanya terlalu jauh untuk dibilang kebetulan, nilai p-nya kecil.</p>'));

  const mode = T.select([
    ['cocok', 'Cocok tidaknya dengan dugaan (satu kelompok)'],
    ['bebas', 'Ada tidaknya hubungan dua hal (tabel)'],
  ], 'cocok');
  const amatiI = T.ta(3, 'cth: 12, 8, 10, 9, 11, 10', '12, 8, 10, 9, 11, 10');
  const caraI = T.select([
    ['rata', 'Sama rata untuk semua'],
    ['rasio', 'Perbandingan yang saya isi'],
    ['isi', 'Angka harapan yang saya isi'],
  ], 'rata');
  const harapI = T.ta(3, 'cth: 9, 3, 3, 1', '');
  const harapHint = T.el('<div class="hint"></div>');
  const tabelI = T.ta(4, 'cth:\n20, 10\n15, 25', '20, 10\n15, 25');
  const yatesI = T.select([['tidak', 'Tidak pakai'], ['ya', 'Pakai']], 'tidak');
  const alpha = T.select([['0.05', '0,05 (paling umum)'], ['0.01', '0,01'], ['0.1', '0,1']], '0.05');
  const box = T.out();

  const wrapCocok = T.el('<div></div>');
  wrapCocok.append(
    T.field('Angka yang kamu amati', amatiI, 'Pisahkan dengan koma. Contoh: dadu dilempar 60 kali, sisi 1 muncul 12 kali, sisi 2 muncul 8 kali, dan seterusnya.'),
    T.field('Angka harapan', caraI),
  );
  const wrapHarap = T.el('<div></div>');
  wrapHarap.appendChild(T.field('Perbandingan atau angka harapan', harapI));
  wrapHarap.appendChild(harapHint);
  wrapCocok.appendChild(wrapHarap);

  const wrapBebas = T.el('<div></div>');
  wrapBebas.append(
    T.field('Isi tabel', tabelI, 'Satu baris per baris tabel, angka dipisah koma. Baris pertama 20 dan 10, baris kedua 15 dan 25, begitu seterusnya.'),
    T.field('Koreksi Yates', yatesI, 'Hanya berpengaruh untuk tabel 2x2. Koreksi ini membuat hasilnya lebih hati-hati.'),
  );

  function aturTampil() {
    const bebas = mode.value === 'bebas';
    wrapCocok.hidden = bebas;
    wrapBebas.hidden = !bebas;
    const cara = caraI.value;
    wrapHarap.hidden = cara === 'rata';
    if (cara === 'rasio') {
      harapI.placeholder = 'cth: 9, 3, 3, 1';
      harapHint.textContent = 'Perbandingan yang kamu harapkan, pisahkan dengan koma. Contoh 9, 3, 3, 1 untuk percobaan Mendel.';
    } else if (cara === 'isi') {
      harapI.placeholder = 'cth: 312,75 104,25 104,25 34,75';
      harapHint.textContent = 'Pisahkan dengan spasi atau titik koma. Jumlahnya harus sama dengan jumlah angka yang kamu amati.';
    }
  }
  mode.addEventListener('change', aturTampil);
  caraI.addEventListener('change', aturTampil);
  aturTampil();

  function kesimpulan(p, a, cocok) {
    if (p < a) return cocok
      ? 'Nilai p di bawah ' + fmtDes(a, 2) + ': angka yang kamu amati beda dari dugaanmu, bedanya cukup kuat untuk dianggap nyata.'
      : 'Nilai p di bawah ' + fmtDes(a, 2) + ': kedua hal dalam tabel berhubungan, hubungannya cukup kuat untuk dianggap nyata.';
    return cocok
      ? 'Nilai p di atas ' + fmtDes(a, 2) + ': belum cukup bukti bahwa angka yang kamu amati beda dari dugaanmu.'
      : 'Nilai p di atas ' + fmtDes(a, 2) + ': belum cukup bukti bahwa kedua hal dalam tabel berhubungan.';
  }

  function peringatan(h) {
    return h.minHarapan < 5
      ? '<p class="hint">Ada angka harapan di bawah 5, jadi hasil uji ini kurang bisa dipercaya. Coba gabung beberapa kategori atau tambah data.</p>'
      : '';
  }

  function hitung() {
    const a = parseFloat(alpha.value);
    if (mode.value === 'cocok') {
      const diamati = bacaDeretBulat(amatiI);
      if (!diamati || diamati.length < 2) { T.toast('Isi angka yang kamu amati dulu, minimal 2 angka bulat'); return; }
      const total = diamati.reduce((s, v) => s + v, 0);
      if (total <= 0) { T.toast('Jumlah angka yang kamu amati harus lebih dari 0'); return; }
      let diharapkan;
      if (caraI.value === 'rata') {
        diharapkan = diamati.map(() => total / diamati.length);
      } else if (caraI.value === 'rasio') {
        const rasio = utils.bacaDeret(harapI);
        if (!rasio || rasio.length !== diamati.length) { T.toast('Isi perbandingannya sebanyak angka yang kamu amati (' + diamati.length + ' angka)'); return; }
        if (rasio.some((v) => !(v > 0))) { T.toast('Perbandingannya harus angka di atas 0'); return; }
        const sRasio = rasio.reduce((s, v) => s + v, 0);
        diharapkan = rasio.map((v) => total * v / sRasio);
      } else {
        const isi = bacaDeretDesimal(harapI);
        if (!isi || isi.length !== diamati.length) { T.toast('Isi angka harapannya sebanyak angka yang kamu amati (' + diamati.length + ' angka)'); return; }
        const sIsi = isi.reduce((s, v) => s + v, 0);
        if (Math.abs(sIsi - total) > Math.max(1e-6, total * 1e-9)) { T.toast('Jumlah angka harapan (' + fmtDes(sIsi) + ') harus sama dengan jumlah angka yang kamu amati (' + total + ')'); return; }
        diharapkan = isi;
      }
      const h = hitungChiSquareKecocokan(diamati, diharapkan);
      if (!h) { T.toast('Angka harapan harus di atas 0'); return; }
      let tabelHtml = '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Kategori</th><th>Diamati</th><th>Diharapkan</th><th>Sumbangan</th></tr></thead><tbody>';
      h.rincian.forEach((r, i) => {
        tabelHtml += '<tr><td>' + (i + 1) + '</td><td>' + fmtDes(r.o, 0) + '</td><td>' + fmtDes(r.e) + '</td><td>' + fmtDes(r.sumbangan) + '</td></tr>';
      });
      tabelHtml += '</tbody></table></div>';
      T.show(box,
        '<p class="big">χ² = ' + fmtDes(h.chi2) + ' · p = ' + fmtP(h.p) + '</p>' +
        '<p>Dari ' + h.k + ' kategori dan ' + h.total + ' pengamatan, derajat kebebasan ' + h.df + '. ' + kesimpulan(h.p, a, true) + '</p>' +
        peringatan(h) +
        tabelHtml);
      return;
    }
    const tabel = bacaTabel(tabelI);
    if (!tabel || tabel.length < 2) { T.toast('Isi tabelnya dulu, minimal 2 baris dan 2 kolom'); return; }
    if (tabel.some((r) => r.length !== tabel[0].length || r.length < 2)) { T.toast('Tiap baris tabel harus punya jumlah angka yang sama, minimal 2 angka'); return; }
    const h = hitungChiSquareKebebasan(tabel, { yates: yatesI.value === 'ya' });
    if (!h) { T.toast('Ada baris atau kolom yang jumlahnya 0, jadi uji tidak bisa dihitung'); return; }
    let tabelHtml = '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th></th>';
    for (let j = 0; j < h.kolom; j++) tabelHtml += '<th>Kolom ' + (j + 1) + '</th>';
    tabelHtml += '</tr></thead><tbody>';
    h.diharapkan.forEach((row, i) => {
      tabelHtml += '<tr><td>Baris ' + (i + 1) + '</td>';
      row.forEach((e) => { tabelHtml += '<td>' + fmtDes(e) + '</td>'; });
      tabelHtml += '</tr>';
    });
    tabelHtml += '</tbody></table></div>';
    T.show(box,
      '<p class="big">χ² = ' + fmtDes(h.chi2) + ' · p = ' + fmtP(h.p) + '</p>' +
      '<p>Tabel ' + h.baris + 'x' + h.kolom + ' dengan ' + h.n + ' pengamatan, derajat kebebasan ' + h.df + (h.yates ? ' (dengan koreksi Yates)' : '') + '. ' + kesimpulan(h.p, a, false) + '</p>' +
      '<p>Kekuatan hubungannya (V) = ' + fmtDes(h.cramerV) + '. V mendekati 0 berarti hubungannya lemah, mendekati 1 berarti kuat.</p>' +
      peringatan(h) +
      '<p class="hint">Angka harapan kalau kedua hal itu tidak berhubungan:</p>' +
      tabelHtml);
  }

  root.append(
    T.field('Jenis uji', mode),
    wrapCocok,
    wrapBebas,
    T.field('Batas signifikansi', alpha, 'Nilai p di bawah batas ini dianggap signifikan.'),
    T.btn('Hitung uji chi-square', hitung, true),
    box,
  );
}
