import { h as T, kv } from '../../core.js';

// Metode US Navy (Hodgdon & Beckett, 1984): persen lemak dari lingkar tubuh
// dan tinggi badan. Pria: leher + pinggang. Wanita: leher + pinggang + pinggul.
// Kategori: standar American Council on Exercise (ACE) — batas atas tiap
// kategori (inklusif): pria 5/13/17/24, wanita 13/20/24/31.
// HARUS SAMA dengan kategoriLemak() di js/tools/sehari/bmi.js.
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

export const KAT_PRIA = [
  [5, 'Lemak esensial', 'Di bawah 6% hanya untuk atlet elit. Terlalu rendah bisa ganggu hormon dan daya tahan tubuh.'],
  [13, 'Atlet', 'Rentang yang umum pada atlet.'],
  [17, 'Bugar', 'Tubuh bugar, lemak dalam rentang sehat untuk orang yang aktif.'],
  [24, 'Rata-rata', 'Rentang umum orang dewasa. Masih tergolong sehat.'],
  [100, 'Di atas rata-rata', 'Lemak tubuh di atas rentang umum. Pola makan dan olahraga teratur bisa bantu menurunkannya.'],
];
export const KAT_WANITA = [
  [13, 'Lemak esensial', 'Di bawah 14% hanya untuk atlet elit. Terlalu rendah bisa ganggu siklus haid dan hormon.'],
  [20, 'Atlet', 'Rentang yang umum pada atlet.'],
  [24, 'Bugar', 'Tubuh bugar, lemak dalam rentang sehat untuk orang yang aktif.'],
  [31, 'Rata-rata', 'Rentang umum orang dewasa. Masih tergolong sehat.'],
  [100, 'Di atas rata-rata', 'Lemak tubuh di atas rentang umum. Pola makan dan olahraga teratur bisa bantu menurunkannya.'],
];

// Kadar lemak metode US Navy (Hodgdon & Beckett, 1984) — bentuk linear
// resmi (DoDI 1308.3), satuan inci (cm dibagi 2,54), logaritma basis 10.
// Pria: 86,010 x log10(pinggang-leher) - 70,041 x log10(tinggi) + 36,76
// Wanita: 163,205 x log10(pinggang+pinggul-leher) - 97,684 x log10(tinggi) - 78,387
// RUMUS INI HARUS SAMA PERSIS dengan utils.bodyFatNavy di js/tools/sehari/bmi.js
// (modul tool dimuat terpisah, jadi rumusnya ditulis di kedua file; ubah di
// satu tempat = ubah di keduanya, supaya input yang sama tidak memberi hasil
// beda). Bentuk densitas lama (495/(...)-450) diganti karena memberi hasil
// sedikit berbeda dari bentuk linear ini.
export function hitungLemakNavy(pria, tinggiCm, leherCm, pinggangCm, pinggulCm) {
  const h = Number(tinggiCm) / 2.54;
  const le = Number(leherCm) / 2.54;
  const pg = Number(pinggangCm) / 2.54;
  if (!(h > 0) || !(le > 0) || !(pg > le)) return NaN;
  if (pria) {
    return 86.010 * Math.log10(pg - le) - 70.041 * Math.log10(h) + 36.76;
  }
  const pu = Number(pinggulCm) / 2.54;
  if (!(pu > 0) || !(pg + pu - le > 0)) return NaN;
  return 163.205 * Math.log10(pg + pu - le) - 97.684 * Math.log10(h) - 78.387;
}

export function kategori(persen, pria) {
  const tabel = pria ? KAT_PRIA : KAT_WANITA;
  for (const [batas, nama, jelas] of tabel) {
    if (persen <= batas) return { nama, jelas };
  }
  return { nama: tabel[tabel.length - 1][1], jelas: tabel[tabel.length - 1][2] };
}

// Metode RFM — Relative Fat Mass (Woolcott & Bergman, 2018, Scientific
// Reports). Diserap verbatim dari kalkulator-rfm.js (v6.21.0); angka
// rumus JANGAN diubah.
// pria:   RFM = 64 - (20 x tinggi / lingkar pinggang)
// wanita: RFM = 76 - (20 x tinggi / lingkar pinggang)
// Tinggi dan pinggang dalam satuan yang sama (cm). Batas obesitas 30%
// pria / 40% wanita dari studi LANJUTAN Woolcott & Bergman 2020 (Int J
// Obes 44:1301-1310, ambang mortalitas NHANES) — BUKAN dari paper 2018
// (paper 2018 hanya menurunkan rumusnya; atribusi lama "studi yang sama"
// dikoreksi Q5 v6.21.0, nilainya sendiri sudah benar).
export function rfm(tinggiCm, pinggangCm, wanita) {
  const rasio = tinggiCm / pinggangCm;
  return (wanita ? 76 : 64) - 20 * rasio;
}

export function batasObesitasRfm(wanita) {
  return wanita ? 40 : 30;
}

export function statusRfm(nilai, wanita) {
  const batas = batasObesitasRfm(wanita);
  if (nilai >= batas) return ['Di atas batas obesitas', 'Nilaimu melewati batas obesitas untuk ' + (wanita ? 'wanita' : 'pria') + ' (' + batas + '%). Sebaiknya diskusikan dengan dokter.', 'err'];
  if (nilai >= batas - 5) return ['Mendekati batas obesitas', 'Nilaimu tinggal sedikit lagi menyentuh batas obesitas (' + batas + '%). Jaga pola makan dan gerak harianmu.', 'warn'];
  return ['Di bawah batas obesitas', 'Nilaimu masih di bawah batas obesitas untuk ' + (wanita ? 'wanita' : 'pria') + ' (' + batas + '%).', 'ok'];
}

export const meta = {"id": "lemak-tubuh", "name": "Persen Lemak Tubuh", "cat": "sehari", "icon": "📏", "desc": "Persen lemak tubuh metode US Navy atau RFM, dari lingkar tubuh dan tinggi badan.", "keywords": "lemak tubuh,body fat,us navy,lingkar pinggang,komposisi tubuh,rfm,relative fat mass,obesitas,woolcott", "since": "6.11.0"};
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
    const metode = T.select([
      ['navy', 'US Navy (leher + pinggang + pinggul)'],
      ['rfm', 'RFM (tinggi + pinggang saja)'],
    ], 'navy');
    const box = T.out();
    const leherField = T.field('Lingkar leher (cm)', leher);
    const pinggulField = T.field('Lingkar pinggul (cm)', pinggul, 'Ukur di bagian pinggul terlebar.');

    const togglePinggul = () => {
      const isRfm = metode.value === 'rfm';
      leherField.style.display = isRfm ? 'none' : '';
      pinggulField.style.display = (isRfm || gender.value !== 'wanita') ? 'none' : '';
    };
    gender.addEventListener('change', togglePinggul);
    metode.addEventListener('change', togglePinggul);

    const calc = () => {
      const b = T.num(berat.value), h = T.num(tinggi.value);
      const le = T.num(leher.value), pi = T.num(pinggang.value), pg = T.num(pinggul.value);
      const pria = gender.value === 'pria';
      if (metode.value === 'rfm') {
        if (!(b > 0) || !(h >= 100 && h <= 250) || !(pi >= 40 && pi <= 200)) {
          T.show(box, '<span class="err">Isi berat badan, tinggi badan (100 sampai 250 cm), dan lingkar pinggang (40 sampai 200 cm) dengan angka yang benar.</span>');
          return;
        }
        const nilai = rfm(h, pi, !pria);
        const st = statusRfm(nilai, !pria);
        const massaLemak = b * nilai / 100;
        const massaTanpaLemak = b - massaLemak;
        T.show(box,
          '<div class="center"><div class="dim">Perkiraan lemak tubuh (RFM)</div>' +
          '<div class="big">' + nilai.toFixed(1) + '%</div>' +
          '<div class="' + st[2] + '"><b>' + st[0] + '</b></div></div>' +
          kv('Batas obesitas untuk ' + (pria ? 'pria' : 'wanita'), batasObesitasRfm(!pria) + '%') +
          kv('Artinya', st[1]) +
          kv('Massa lemak', massaLemak.toFixed(1) + ' kg') +
          kv('Massa tanpa lemak (otot, tulang, organ)', massaTanpaLemak.toFixed(1) + ' kg') +
          '<p class="hint">Dihitung dengan rumus Relative Fat Mass (RFM, Woolcott &amp; Bergman, 2018) dari tinggi badan dan lingkar pinggang saja. ' +
          'Cara ukur pinggang: pita meteran di sekeliling perut setinggi pusar, sejajar lantai, setelah buang napas biasa. ' +
          'RFM adalah perkiraan, BUKAN diagnosis dan bukan pengukuran lemak langsung seperti DEXA. ' +
          'Hasil bisa meleset untuk atlet berotot besar, ibu hamil, atau orang dengan kondisi perut tertentu. ' +
          'Bila nilaimu di atas batas obesitas, konsultasi ke dokter untuk penilaian yang lebih lengkap.</p>' +
          NOTE);
        return;
      }
      if (!(b > 0) || !(h > 0) || !(le > 0) || !(pi > 0) || (!pria && !(pg > 0))) {
        T.show(box, '<span class="err">Isi semua ukuran dengan angka yang benar.</span>');
        return;
      }
      if (pi <= le) {
        T.show(box, '<span class="err">Lingkar pinggang harus lebih besar dari lingkar leher. Cek lagi ukurannya.</span>');
        return;
      }
      if (!pria && pi + pg <= le) {
        T.show(box, '<span class="err">Pinggang + pinggul harus lebih besar dari leher. Cek lagi ukurannya.</span>');
        return;
      }
      const persen = hitungLemakNavy(pria, h, le, pi, pg);
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

    root.appendChild(T.el('<p class="note">Cukup ukur lingkar tubuh pakai pita meteran. Metode US Navy dipakai angkatan laut Amerika untuk memperkirakan lemak tubuh tanpa alat khusus; metode RFM hanya butuh tinggi badan dan lingkar pinggang.</p>'));
    root.appendChild(T.field('Metode hitung', metode, 'RFM lebih cepat karena cuma butuh dua ukuran.'));
    root.appendChild(T.grid2(
      T.field('Berat badan (kg)', berat),
      T.field('Tinggi badan (cm)', tinggi),
      T.field('Jenis kelamin', gender),
      leherField,
      T.field('Lingkar pinggang (cm)', pinggang),
      pinggulField,
    ));
    root.appendChild(T.btn('Hitung', calc, true));
    root.appendChild(box);
    togglePinggul();

    // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik / ganti pilihan.
    [berat, tinggi, leher, pinggang, pinggul].forEach((i) => i.addEventListener('input', calc));
    gender.addEventListener('change', calc);
    metode.addEventListener('change', calc);
    calc();

}
