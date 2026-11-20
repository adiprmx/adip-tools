import { h as T, kvRows, utils } from '../../core.js';

export const meta = {"id":"statistika-dasar","name":"Statistika Dasar","cat":"pelajar","icon":"📈","desc":"Mean, median, modus, range & standar deviasi dari deret angka.","keywords":"statistika,mean,median,modus,range,standar deviasi,rata-rata,pelajar"};

// r4 kanonis tinggal di utils (core.js).

// Urai deret angka ala Indonesia: koma di dalam angka adalah desimal
// ("7,5" = 7,5), pemisah antar angka adalah spasi / enter / titik koma.
// Koma ganda tanpa spasi ("1,2,3") tetap dibaca tiga angka. Pola yang sama
// dengan bacaDeretDesimal di kalkulator-uji-chi-square.
export function bacaDeret(teks) {
  const nums = [];
  let buang = 0;
  String(teks || '').split(/[\s;]+/).forEach((tok) => {
    const t = tok.trim().replace(/,+$/, '');
    if (!t) return;
    const koma = (t.match(/,/g) || []).length;
    if (koma > 1) {
      t.split(',').forEach((p) => { const v = T.num(p); if (isFinite(v)) nums.push(v); else buang++; });
    } else {
      const v = T.num(t);
      if (isFinite(v)) nums.push(v); else buang++;
    }
  });
  return { nums, buang };
}

export function render(root) {
  const out = T.out();
  const taInp = T.ta(5, 'mis.\n7, 8, 9, 6, 10\natau pisahkan dengan spasi / enter', '');

  const hitung = () => {
    const { nums, buang } = bacaDeret(taInp.value);
    if (!nums.length) { T.show(out, '<p class="err">Belum ada angka yang valid. Coba isi deret angkanya dulu.</p>'); return; }

    const n = nums.length;
    const urut = nums.slice().sort((a, b) => a - b);
    const sum = nums.reduce((s, v) => s + v, 0);
    const mean = sum / n;
    const median = n % 2 === 1
      ? urut[(n - 1) / 2]
      : (urut[n / 2 - 1] + urut[n / 2]) / 2;

    const frek = {};
    urut.forEach((v) => { const k = String(v); frek[k] = (frek[k] || 0) + 1; });
    const maks = Math.max.apply(null, Object.keys(frek).map((k) => frek[k]));
    const modus = maks === 1
      ? 'tidak ada (semua angka muncul sekali)'
      : Object.keys(frek).filter((k) => frek[k] === maks).map(Number).sort((a, b) => a - b).join(', ');

    const range = urut[n - 1] - urut[0];
    const varian = nums.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
    const sd = Math.sqrt(varian);

    let langkah = '<p class="hint" style="margin:10px 0 4px"><b>Langkah singkat:</b></p>';
    langkah += '<p class="hint" style="margin:0 0 4px">Data diurutkan dulu: ' + T.esc(urut.slice(0, 200).map(utils.r4).join(', ')) + (n > 200 ? ', … (' + T.fmt(n) + ' data)' : '') + '</p>';
    langkah += '<p class="hint" style="margin:0">Median = ' + (n % 2 === 1
      ? 'data ke-' + ((n + 1) / 2) + ' dari ' + n + ' data → <b>' + utils.r4(median) + '</b>'
      : 'rata-rata data ke-' + (n / 2) + ' dan ke-' + (n / 2 + 1) + ' → (' + utils.r4(urut[n / 2 - 1]) + ' + ' + utils.r4(urut[n / 2]) + ') / 2 = <b>' + utils.r4(median) + '</b>') + '</p>';

    T.show(out, kvRows([
      ['Jumlah data (n)', T.fmt(n)],
      ['Mean (rata-rata)', utils.r4(mean)],
      ['Median (nilai tengah)', utils.r4(median)],
      ['Modus', String(modus)],
      ['Range (max − min)', utils.r4(range)],
      ['Standar deviasi (populasi)', utils.r4(sd)],
    ]) + langkah + (buang > 0 ? '<p class="hint">Catatan: ' + buang + ' potong teks bukan angka, jadi diabaikan.</p>' : ''));
  };

  root.appendChild(T.el('<p class="hint">Tempel deret angkamu di bawah — pisahkan dengan koma, spasi, atau enter. Angka desimal pakai koma, contoh: 7,5.</p>'));
  root.appendChild(T.field('Deret angka', taInp));
  root.appendChild(T.row(T.btn('Hitung', hitung, true), T.btn('Contoh', () => { taInp.value = '1, 2, 3, 4, 5'; hitung(); })));
  root.appendChild(out);
}
