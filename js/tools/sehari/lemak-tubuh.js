import { h as T, kv } from '../../core.js?v=6.13.0';

// Metode US Navy (Hodgdon & Beckett, 1984): persen lemak dari lingkar tubuh
// dan tinggi badan. Pria: leher + pinggang. Wanita: leher + pinggang + pinggul.
// Kategori: standar American Council on Exercise (ACE).
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

const KAT_PRIA = [
  [5, 'Lemak esensial', 'Di bawah 6% hanya untuk atlet elit. Terlalu rendah bisa ganggu hormon dan daya tahan tubuh.'],
  [13, 'Atlet', 'Rentang yang umum pada atlet.'],
  [17, 'Bugar', 'Tubuh bugar, lemak dalam rentang sehat untuk orang yang aktif.'],
  [24, 'Rata-rata', 'Rentang umum orang dewasa. Masih tergolong sehat.'],
  [100, 'Di atas rata-rata', 'Lemak tubuh di atas rentang umum. Pola makan dan olahraga teratur bisa bantu menurunkannya.'],
];
const KAT_WANITA = [
  [13, 'Lemak esensial', 'Di bawah 14% hanya untuk atlet elit. Terlalu rendah bisa ganggu siklus haid dan hormon.'],
  [20, 'Atlet', 'Rentang yang umum pada atlet.'],
  [24, 'Bugar', 'Tubuh bugar, lemak dalam rentang sehat untuk orang yang aktif.'],
  [31, 'Rata-rata', 'Rentang umum orang dewasa. Masih tergolong sehat.'],
  [100, 'Di atas rata-rata', 'Lemak tubuh di atas rentang umum. Pola makan dan olahraga teratur bisa bantu menurunkannya.'],
];

function kategori(persen, pria) {
  const tabel = pria ? KAT_PRIA : KAT_WANITA;
  for (const [batas, nama, jelas] of tabel) {
    if (persen <= batas) return { nama, jelas };
  }
  return { nama: tabel[tabel.length - 1][1], jelas: tabel[tabel.length - 1][2] };
}

export const meta = {"id": "lemak-tubuh", "name": "Persen Lemak Tubuh", "cat": "sehari", "icon": "📏", "desc": "Persen lemak tubuh metode US Navy dari lingkar leher, pinggang, dan pinggul.", "keywords": "lemak tubuh,body fat,us navy,lingkar pinggang,komposisi tubuh", "since": "6.11.0"};
export function render(root) {

    const berat = T.input('text', 'Berat badan, cth: 70', '70');
    berat.inputMode = 'decimal';
    const tinggi = T.input('text', 'Tinggi badan, cth: 170', '170');
    tinggi.inputMode = 'decimal';
    const leher = T.input('text', 'Lingkar leher, cth: 38', '');
    leher.inputMode = 'decimal';
    const pinggang = T.input('text', 'Lingkar pinggang, cth: 85', '');
    pinggang.inputMode = 'decimal';
    const pinggul = T.input('text', 'Lingkar pinggul, cth: 95', '');
    pinggul.inputMode = 'decimal';
    const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']]);
    const box = T.out();
    const pinggulField = T.field('Lingkar pinggul (cm)', pinggul, 'Ukur di bagian pinggul terlebar.');

    const togglePinggul = () => { pinggulField.style.display = gender.value === 'wanita' ? '' : 'none'; };
    gender.addEventListener('change', togglePinggul);

    const calc = () => {
      const b = T.num(berat.value), h = T.num(tinggi.value);
      const le = T.num(leher.value), pi = T.num(pinggang.value), pg = T.num(pinggul.value);
      const pria = gender.value === 'pria';
      if (!(b > 0) || !(h > 0) || !(le > 0) || !(pi > 0) || (!pria && !(pg > 0))) {
        T.show(box, '<span class="err">Isi semua ukuran dengan angka yang benar.</span>');
        return;
      }
      if (pi <= le) {
        T.show(box, '<span class="err">Lingkar pinggang harus lebih besar dari lingkar leher. Cek lagi ukurannya.</span>');
        return;
      }
      const log10 = (x) => Math.log(x) / Math.LN10;
      let persen;
      if (pria) {
        persen = 495 / (1.0324 - 0.19077 * log10(pi - le) + 0.15456 * log10(h)) - 450;
      } else {
        if (pi + pg <= le) {
          T.show(box, '<span class="err">Pinggang + pinggul harus lebih besar dari leher. Cek lagi ukurannya.</span>');
          return;
        }
        persen = 495 / (1.29579 - 0.35004 * log10(pi + pg - le) + 0.22100 * log10(h)) - 450;
      }
      if (!isFinite(persen) || persen < 2 || persen > 70) {
        T.show(box, '<span class="err">Hasilnya di luar rentang wajar. Cek lagi semua ukuran (satuan cm).</span>');
        return;
      }
      const kat = kategori(persen, pria);
      const massaLemak = b * persen / 100;
      const massaTanpaLemak = b - massaLemak;
      const warna = kat.nama === 'Di atas rata-rata' || kat.nama === 'Lemak esensial' ? 'warn' : 'ok';
      T.show(box,
        '<div class="center"><div class="dim">Persen lemak tubuh</div>' +
        '<div class="big">' + persen.toFixed(1) + '%</div>' +
        '<div class="' + warna + '"><b>' + kat.nama + '</b></div>' +
        '<div class="hint">' + kat.jelas + '</div></div>' +
        kv('Massa lemak', massaLemak.toFixed(1) + ' kg') +
        kv('Massa tanpa lemak (otot, tulang, organ)', massaTanpaLemak.toFixed(1) + ' kg') +
        '<p class="hint">Dihitung dengan metode US Navy (Hodgdon &amp; Beckett, 1984) dari lingkar tubuh dan tinggi badan. ' +
        'Kategori memakai standar American Council on Exercise (ACE). Cara ukur: pita meteran pas di kulit, jangan ditekan. ' +
        'Leher di bawah jakun, pinggang di pusar, pinggul di bagian terlebar. Hasilnya perkiraan, alat ukur khusus (DEXA, bod pod) lebih akurat.</p>' +
        NOTE);
    };

    root.appendChild(T.el('<p class="note">Cukup ukur lingkar tubuh pakai pita meteran. Metode US Navy ini dipakai angkatan laut Amerika untuk memperkirakan lemak tubuh tanpa alat khusus.</p>'));
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Jenis kelamin', gender),
      T.field('Lingkar leher (cm)', leher),
      T.field('Lingkar pinggang (cm)', pinggang),
      pinggulField,
    ));
    root.appendChild(T.btn('Hitung', calc, true));
    root.appendChild(box);
    togglePinggul();
    calc();

}
