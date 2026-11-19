import { h as T, utils } from '../../core.js';

export const meta = { id: 'margin-of-error', name: 'Kalkulator Margin of Error', cat: 'pelajar', icon: '📊', desc: 'Hitung margin of error survei dari jumlah responden dan tingkat kepercayaan, plus berapa responden yang dibutuhkan.', keywords: 'margin of error,margin error,survei,sampel,responden,statistik,skripsi,penelitian', since: '6.19.0' };

// Nilai z untuk tingkat kepercayaan umum (distribusi normal).
export const Z_TABEL = { '90': 1.645, '95': 1.96, '99': 2.576 };

// Margin of error proporsi: z × sqrt(p(1-p)/n), p dalam 0..1.
// Koreksi populasi terbatas (bila populasi diketahui): × sqrt((N-n)/(N-1)).
export function marginError(n, kepercayaan, p, populasi) {
  if (!Number.isInteger(n) || n < 1) return null;
  const z = Z_TABEL[String(kepercayaan)];
  if (z == null) return null;
  const prop = p == null ? 0.5 : p;
  if (prop < 0 || prop > 1) return null;
  let moe = z * Math.sqrt((prop * (1 - prop)) / n);
  if (populasi != null && Number.isFinite(populasi) && populasi > n) {
    moe *= Math.sqrt((populasi - n) / (populasi - 1));
  }
  return moe;
}

// Responden yang dibutuhkan untuk margin of error target (Cochran).
export function sampelDibutuhkan(moe, kepercayaan, p) {
  const z = Z_TABEL[String(kepercayaan)];
  if (z == null || !(moe > 0) || moe >= 1) return null;
  const prop = p == null ? 0.5 : p;
  return Math.ceil((z * z * prop * (1 - prop)) / (moe * moe));
}

const f = (x) => utils.fmtDes(x, 2);

export function render(root) {
  root.appendChild(T.el('<p class="hint">Margin of error adalah seberapa jauh hasil survei bisa meleset dari keadaan sebenarnya. Makin banyak responden, makin kecil margin of error-nya. Proporsi 50% dipakai kalau belum tahu perkiraan hasilnya, karena itu memberi margin terbesar (paling aman).</p>'));

  const nI = T.input('number', 'cth: 400', '400');
  const tingkat = T.select([
    ['90', '90%'],
    ['95', '95%'],
    ['99', '99%'],
  ], '95');
  const pI = T.input('number', 'cth: 50', '50');
  const popI = T.input('number', 'Kosongkan kalau tidak tahu', '');
  const box = T.out();

  function hitung() {
    const n = T.num(nI.value);
    const p = T.num(pI.value) / 100;
    const popRaw = popI.value.trim();
    const pop = popRaw === '' ? null : T.num(popRaw);
    if (!Number.isInteger(n) || n < 1 || n > 100000000) {
      T.show(box, '<p class="dim">Isi jumlah responden (bilangan bulat, minimal 1).</p>');
      return;
    }
    if (!(p >= 0 && p <= 1)) {
      T.show(box, '<p class="dim">Proporsi diisi 0 sampai 100 persen.</p>');
      return;
    }
    if (pop != null && (!Number.isInteger(pop) || pop <= n)) {
      T.show(box, '<p class="dim">Populasi harus bilangan bulat dan lebih besar dari jumlah responden.</p>');
      return;
    }
    const moe = marginError(n, tingkat.value, p, pop);
    const persen = moe * 100;
    const butuh5 = sampelDibutuhkan(0.05, tingkat.value, p);
    const butuh3 = sampelDibutuhkan(0.03, tingkat.value, p);
    const z = Z_TABEL[tingkat.value];
    T.show(box,
      '<p class="big">±' + f(persen) + '%</p>' +
      '<p>Dengan ' + T.fmt(n) + ' responden dan tingkat kepercayaan ' + tingkat.value + '%, hasil survei bisa meleset sampai ' + f(persen) + ' poin persen dari keadaan sebenarnya.</p>' +
      '<p class="hint"><b>Langkah:</b> z = ' + String(z).replace('.', ',') + ', p = ' + f(p * 100) + '%<br>' +
      'Margin = ' + String(z).replace('.', ',') + ' × √(' + f(p) + ' × ' + f(1 - p) + ' ÷ ' + T.fmt(n) + ')' +
      (pop != null ? ' × koreksi populasi ' + T.fmt(pop) : '') + ' = ' + f(persen) + '%</p>' +
      '<p class="hint">Biar margin of error jadi ±5% butuh <b>' + T.fmt(butuh5) + ' responden</b>; biar ±3% butuh <b>' + T.fmt(butuh3) + ' responden</b> (tingkat kepercayaan sama).</p>');
  }

  root.append(
    T.field('Jumlah responden', nI),
    T.grid2(
      T.field('Tingkat kepercayaan', tingkat),
      T.field('Proporsi jawaban (%)', pI, '50% kalau belum tahu.'),
    ),
    T.field('Jumlah populasi (boleh kosong)', popI, 'Isi kalau populasinya diketahui, misal jumlah siswa sekolah.'),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
