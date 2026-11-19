import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-interval-kepercayaan', name: 'Kalkulator Interval Kepercayaan', cat: 'pelajar', icon: '📊', desc: 'Rentang nilai yang paling mungkin dari rata-rata atau proporsi, dengan tingkat keyakinan 90, 95, atau 99 persen.', keywords: 'interval kepercayaan,confidence interval,ci,margin of error,rata-rata,proporsi,statistik,z,t', since: '6.17.0' };

// ---- Matematika distribusi ----
// lgamma, betainc, tCDF, normalCDF, zKritis kanonis tinggal di utils (core.js).

// Kuantil t dua sisi: nilai kritis t* untuk tingkat keyakinan (mis. 0.95) dan df.
export function tKritis(tingkat, df) {
  const target = (1 + tingkat) / 2;
  let lo = 0, hi = 100;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (utils.tCDF(mid, df) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// Interval kepercayaan rata-rata. metode: 't' | 'z'.
export function ciRataRata(mean, sd, n, tingkat, metode) {
  const k = metode === 'z' ? utils.zKritis(tingkat) : tKritis(tingkat, n - 1);
  const se = sd / Math.sqrt(n);
  const moe = k * se;
  return { bawah: mean - moe, atas: mean + moe, moe, k, se };
}

// Interval kepercayaan proporsi (Wilson score, akurat untuk n kecil juga).
export function ciProporsi(x, n, tingkat) {
  const z = utils.zKritis(tingkat);
  const p = x / n;
  const d = 1 + z * z / n;
  const tengah = (p + z * z / (2 * n)) / d;
  const sebar = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / d;
  return { bawah: Math.max(0, tengah - sebar), atas: Math.min(1, tengah + sebar), p, moe: sebar, k: z };
}

// fmtDes kanonis tinggal di utils (core.js). Catatan: fmtNum lokal lama
// memakai `des || 4` (des=0 dibaca 4); kanon memakai `des == null`.
// Tidak ada call-site yang mengirim des=0, jadi perilaku tidak berubah.

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
        '<p class="big">' + utils.fmtDes(h.bawah) + ' sampai ' + utils.fmtDes(h.atas) + '</p>' +
        '<p>Kami ' + persen + '% yakin nilai rata-rata sebenarnya ada di antara ' + utils.fmtDes(h.bawah) + ' dan ' + utils.fmtDes(h.atas) + '.</p>' +
        '<p class="hint">Nilai tengah: ' + utils.fmtDes(mean) + '. Lebar simpangan: ±' + utils.fmtDes(h.moe) + '. Angka pengali (' + (metode.value === 'z' ? 'z' : 't') + '): ' + utils.fmtDes(h.k) + '.</p>');
    } else {
      const x = T.num(xI.value), n = T.num(n2I.value);
      if (!Number.isInteger(x) || x < 0) { T.toast('Jumlah yang cocok harus bilangan bulat 0 atau lebih'); return; }
      if (!Number.isInteger(n) || n <= 0) { T.toast('Jumlah total harus bilangan bulat lebih dari 0'); return; }
      if (x > n) { T.toast('Jumlah yang cocok tidak boleh lebih dari jumlah total'); return; }
      const h = ciProporsi(x, n, lvl);
      T.show(box,
        '<p class="big">' + utils.fmtDes(h.bawah * 100, 2) + '% sampai ' + utils.fmtDes(h.atas * 100, 2) + '%</p>' +
        '<p>Kami ' + persen + '% yakin proporsi sebenarnya ada di antara ' + utils.fmtDes(h.bawah * 100, 2) + '% dan ' + utils.fmtDes(h.atas * 100, 2) + '% (dari hasil sampel ' + utils.fmtDes(h.p * 100, 2) + '%).</p>' +
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
