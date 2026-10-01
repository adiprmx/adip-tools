import { h as T, kvRows } from '../../core.js?v=6.6.0';

export const meta = {"id":"statistika-dasar","name":"Statistika Dasar","cat":"pelajar","icon":"📈","desc":"Mean, median, modus, range & standar deviasi dari deret angka.","keywords":"statistika,mean,median,modus,range,standar deviasi,rata-rata,pelajar"};

function r4(v) {
  const r = Math.round(v * 1e4) / 1e4;
  return String(Object.is(r, -0) ? 0 : r);
}

export function render(root) {
  const out = T.out();
  const taInp = T.ta(5, 'mis.\n7, 8, 9, 6, 10\natau pisahkan dengan spasi / enter', '');

  const hitung = () => {
    const tokens = String(taInp.value).split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
    const nums = [];
    let buang = 0;
    tokens.forEach((t) => {
      const v = Number(String(t).replace(',', '.'));
      if (isNaN(v)) buang++; else nums.push(v);
    });
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
    langkah += '<p class="hint" style="margin:0 0 4px">Data diurutkan dulu: ' + T.esc(urut.slice(0, 200).map(r4).join(', ')) + (n > 200 ? ', … (' + T.fmt(n) + ' data)' : '') + '</p>';
    langkah += '<p class="hint" style="margin:0">Median = ' + (n % 2 === 1
      ? 'data ke-' + ((n + 1) / 2) + ' dari ' + n + ' data → <b>' + r4(median) + '</b>'
      : 'rata-rata data ke-' + (n / 2) + ' dan ke-' + (n / 2 + 1) + ' → (' + r4(urut[n / 2 - 1]) + ' + ' + r4(urut[n / 2]) + ') / 2 = <b>' + r4(median) + '</b>') + '</p>';

    T.show(out, kvRows([
      ['Jumlah data (n)', T.fmt(n)],
      ['Mean (rata-rata)', r4(mean)],
      ['Median (nilai tengah)', r4(median)],
      ['Modus', String(modus)],
      ['Range (max − min)', r4(range)],
      ['Standar deviasi (populasi)', r4(sd)],
    ]) + langkah + (buang > 0 ? '<p class="hint">Catatan: ' + buang + ' potong teks bukan angka, jadi diabaikan.</p>' : ''));
  };

  root.appendChild(T.el('<p class="hint">Tempel deret angkamu di bawah — koma, spasi, atau enter, bebas. Nanti dihitung mean, median, modus, range, sampai standar deviasinya.</p>'));
  root.appendChild(T.field('Deret angka', taInp));
  root.appendChild(T.row(T.btn('Hitung', hitung, true), T.btn('Contoh', () => { taInp.value = '1, 2, 3, 4, 5'; hitung(); })));
  root.appendChild(out);
}
