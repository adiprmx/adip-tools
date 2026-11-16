import { h as T, kv } from '../../core.js?v=6.12.2';

// Rentang protein gram per kg berat badan per hari, dari panduan umum:
// AKG Kemenkes (0,8 g/kg untuk dewasa sehat), ACSM dan ISSN (1,2-2,2 g/kg
// untuk yang latihan rutin sampai atlet).
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

const LEVEL = [
  ['sehari', 'Sehari-hari (jarang olahraga)', 0.8, 1.0, 'Cukup untuk kebutuhan dasar tubuh orang dewasa sehat.'],
  ['ringan', 'Aktif ringan (olahraga 1-3x/minggu)', 1.0, 1.2, 'Untuk yang mulai rutin bergerak.'],
  ['rutin', 'Latihan rutin (olahraga 3-5x/minggu)', 1.2, 1.6, 'Rentang yang umum disarankan untuk yang latihan teratur.'],
  ['otot', 'Bangun otot / latihan beban berat', 1.6, 2.2, 'Rentang atas untuk yang fokus menambah massa otot.'],
  ['atlet', 'Atlet / latihan intensif', 2.0, 2.2, 'Untuk beban latihan sangat tinggi.'],
];

export const meta = {"id": "kebutuhan-protein", "name": "Kebutuhan Protein Harian", "cat": "sehari", "icon": "🍗", "desc": "Protein harian dalam gram dari berat badan dan seberapa aktif kamu.", "keywords": "protein,gram protein,otot,diet,latihan,gizi", "since": "6.11.0"};
export function render(root) {

    const berat = T.input('text', 'Berat badan, cth: 65', '65');
    berat.inputMode = 'decimal';
    const level = T.select(LEVEL.map(([v, l]) => [v, l]), 'rutin');
    const box = T.out();

    const calc = () => {
      const b = T.num(berat.value);
      if (!(b > 0)) {
        T.show(box, '<span class="err">Isi berat badan dengan angka yang benar.</span>');
        return;
      }
      const row = LEVEL.find(([v]) => v === level.value) || LEVEL[0];
      const rendah = Math.round(b * row[2]);
      const tinggi = Math.round(b * row[3]);
      const perMakan = Math.round(((rendah + tinggi) / 2) / 3);
      T.show(box,
        '<div class="center"><div class="dim">Protein harian yang disarankan</div>' +
        '<div class="big">' + rendah + ' - ' + tinggi + ' g</div>' +
        '<div class="hint">' + row[4] + '</div></div>' +
        kv('Per kilogram berat badan', row[2].toFixed(1) + ' - ' + row[3].toFixed(1) + ' g/kg') +
        kv('Kalau dibagi 3x makan', 'Sekitar ' + perMakan + ' g tiap makan') +
        kv('Kalori dari protein', Math.round(rendah * 4) + ' - ' + Math.round(tinggi * 4) + ' kkal/hari') +
        '<p class="hint">Gambaran isi proteinnya: 1 butir telur sekitar 6 g, 100 g dada ayam sekitar 31 g, 100 g tempe sekitar 19 g, 1 gelas susu sekitar 8 g. ' +
        'Angka ini patokan umum dari AKG Kemenkes, ACSM, dan ISSN. Punya gangguan ginjal atau kondisi khusus? Tanya dokter dulu sebelum menaikkan protein.</p>' +
        NOTE);
    };
    level.addEventListener('change', calc);

    root.appendChild(T.el('<p class="note">Protein yang dibutuhkan tiap orang beda, tergantung berat badan dan seberapa keras latihannya. Masukkan berat badan, pilih level aktivitasmu.</p>'));
    root.appendChild(T.field('Berat badan (kg)', berat));
    root.appendChild(T.field('Level aktivitas / tujuan', level));
    root.appendChild(T.btn('Hitung', calc, true));
    root.appendChild(box);
    calc();

}
