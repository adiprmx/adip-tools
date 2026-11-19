import { h as T, kv, errBox } from '../../core.js';

// Beban glikemik (GL) = indeks glikemik (GI) x karbohidrat (gram) / 100.
// Nilai GI dari Atkinson dkk., "International tables of glycemic index and
// glycemic load values: 2008", Diabetes Care 31(12):2281-2283. Karbohidrat
// bersih per sajian dari USDA FoodData Central (karbohidrat total dikurangi
// serat). Batas: GI rendah 55 ke bawah, sedang 56-69, tinggi 70 ke atas;
// GL rendah 10 ke bawah, sedang 11-19, tinggi 20 ke atas.
// [nama, GI, karbohidrat bersih per sajian (gram), keterangan sajian]
export const MAKANAN_GI = [
  ['Nasi putih', 73, 44, '1 mangkuk (158 g)'],
  ['Nasi merah', 68, 41, '1 mangkuk (195 g)'],
  ['Roti putih', 75, 13, '1 lembar (30 g)'],
  ['Roti gandum', 74, 12, '1 lembar (30 g)'],
  ['Spageti', 49, 40, '1 mangkuk (140 g)'],
  ['Bubur nasi', 78, 28, '1 mangkuk (240 g)'],
  ['Oatmeal', 55, 24, '1 mangkuk (234 g)'],
  ['Kentang rebus', 78, 27, '1 buah sedang (150 g)'],
  ['Ubi jalar rebus', 63, 27, '1 buah sedang (150 g)'],
  ['Jagung rebus', 52, 24, '1 mangkuk (154 g)'],
  ['Apel', 36, 21, '1 buah sedang (182 g)'],
  ['Pisang', 51, 24, '1 buah sedang (118 g)'],
  ['Jeruk', 43, 15, '1 buah sedang (154 g)'],
  ['Mangga', 51, 22, '1 buah (165 g)'],
  ['Kacang merah', 24, 27, '1 mangkuk (177 g)'],
  ['Lentil', 32, 24, '1 mangkuk (198 g)'],
];

export function hitungGL(gi, karboGram) {
  if (!(gi >= 0) || !(karboGram >= 0)) return null;
  return (gi * karboGram) / 100;
}

export function bandGI(gi) {
  if (gi <= 55) return 'Rendah';
  if (gi <= 69) return 'Sedang';
  return 'Tinggi';
}

export function bandGL(gl) {
  if (gl <= 10) return 'Rendah';
  if (gl <= 19) return 'Sedang';
  return 'Tinggi';
}

export const meta = { "id": "kalkulator-beban-glikemik", "name": "Kalkulator Beban Glikemik", "cat": "kesehatan", "icon": "🍚", "desc": "Hitung beban glikemik makanan dari indeks glikemik dan karbohidratnya.", "keywords": "beban glikemik,glycemic load,indeks glikemik,gi,gl,gula darah,karbohidrat", "since": "6.18.0" };

export function render(root) {
  const pilih = T.select(MAKANAN_GI.map((m, i) => [String(i), m[0] + ' (' + m[3] + ')']).concat([['manual', 'Isi sendiri']]), '0');
  const porsi = T.input('number', 'Jumlah sajian', '1');
  const giManual = T.input('number', 'Indeks glikemik (0-100)', '70');
  const karboManual = T.input('number', 'Karbohidrat per sajian (gram)', '30');
  const boxManual = T.el('<div></div>');
  const box = T.out();
  boxManual.appendChild(T.grid2(
    T.field('Indeks glikemik (0-100)', giManual),
    T.field('Karbohidrat per sajian (gram)', karboManual),
  ));
  boxManual.style.display = 'none';

  pilih.addEventListener('change', () => {
    boxManual.style.display = pilih.value === 'manual' ? '' : 'none';
  });

  const hitung = () => {
    const n = T.num(porsi.value);
    if (!(n > 0 && n <= 20)) {
      T.show(box, errBox('Isi jumlah sajian antara 0,1 sampai 20.'));
      return;
    }
    let gi, karbo, nama;
    if (pilih.value === 'manual') {
      gi = T.num(giManual.value);
      karbo = T.num(karboManual.value);
      nama = 'Makananmu';
      if (!(gi >= 0 && gi <= 110)) {
        T.show(box, errBox('Isi indeks glikemik antara 0 sampai 110.'));
        return;
      }
      if (!(karbo >= 0 && karbo <= 500)) {
        T.show(box, errBox('Isi karbohidrat antara 0 sampai 500 gram.'));
        return;
      }
    } else {
      const m = MAKANAN_GI[Number(pilih.value)];
      gi = m[1];
      karbo = m[2];
      nama = m[0] + ' (' + m[3] + ')';
    }
    const gl = hitungGL(gi, karbo * n);
    const bGL = bandGL(gl);
    const pesan = bGL === 'Rendah'
      ? 'Beban glikemiknya rendah, pengaruhnya ke gula darah relatif kecil untuk porsi ini.'
      : (bGL === 'Sedang'
        ? 'Beban glikemiknya sedang. Pasangkan dengan sayur dan protein supaya gula darah naik lebih pelan.'
        : 'Beban glikemiknya tinggi untuk porsi ini. Bila perlu, kurangi porsinya atau bagi ke dua kali makan.');
    T.show(box,
      '<div class="center"><div class="dim">Beban glikemik ' + T.esc(nama) + '</div>' +
      '<div class="big">' + gl.toFixed(1).replace('.', ',') + '</div>' +
      '<div class="dim">' + bGL + ' (rendah 10 ke bawah, sedang 11-19, tinggi 20 ke atas)</div></div>' +
      kv('Indeks glikemik (GI)', gi + ' (' + bandGI(gi) + ')') +
      kv('Karbohidrat', (karbo * n).toFixed(0) + ' gram untuk ' + n + ' sajian') +
      '<p class="hint">' + T.esc(pesan) + '</p>' +
      '<p class="hint">Rumus: beban glikemik = GI x karbohidrat (gram) / 100. Nilai GI dari Atkinson dkk., Diabetes Care 2008. ' +
      'Karbohidrat bersih per sajian dari USDA FoodData Central. Ini alat bantu umum, bukan saran medis. ' +
      'Bila punya diabetes, ikuti anjuran dokter atau ahli gizimu.</p>');
  };

  root.appendChild(T.field('Makanan', pilih));
  root.appendChild(boxManual);
  root.appendChild(T.field('Jumlah sajian', porsi, 'Misal 2 berarti dua kali porsi yang tertulis.'));
  root.appendChild(T.btn('Hitung beban glikemik', hitung, true));
  root.appendChild(box);
  hitung();
}
