import { h as T } from '../../core.js';

export const meta = {"id": "teka-teki-logika-harian", "name": "Teka-teki Logika Harian", "cat": "fun", "icon": "🧩", "desc": "Satu teka-teki logika baru tiap hari, sama untuk semua orang. Jawab, cek, dan lihat penjelasannya.", "keywords": "teka-teki,logika,harian,puzzle,otak,urutan angka,deduksi", "since": "6.19.0"};

// Bank 30 teka-teki logika, ditulis sendiri untuk tool ini. Tiap entri:
// q = soal, a = jawaban utama, ak = jawaban lain yang diterima,
// p = petunjuk, j = penjelasan. Jawaban selalu pendek (angka atau kata)
// supaya bisa dicek otomatis.
export const TEKA_TEKI = [
  { q: 'Urutan angka: 2, 6, 12, 20, 30, ... Angka berikutnya?', a: '42', ak: [], p: 'Selisihnya bertambah 2 tiap langkah: 4, 6, 8, 10, lalu?', j: 'Selisih antar angka: 4, 6, 8, 10, jadi selisih berikutnya 12. 30 + 12 = 42.' },
  { q: 'Ayah 3 kali umur anaknya. Sepuluh tahun lagi, ayah 2 kali umur anaknya. Berapa umur anak sekarang?', a: '10', ak: ['10 tahun'], p: 'Misalkan umur anak sekarang x. Umur ayah 3x. Sepuluh tahun lagi: 3x + 10 = 2(x + 10).', j: '3x + 10 = 2x + 20, jadi x = 10. Anak 10 tahun, ayah 30 tahun. Sepuluh tahun lagi: 20 dan 40.' },
  { q: 'Sebuah toko menjual 3 pensil seharga Rp6.000. Berapa harga 7 pensil yang sama?', a: '14000', ak: ['rp14000', 'rp 14000', '14.000', '14 ribu'], p: 'Cari dulu harga 1 pensil.', j: 'Satu pensil Rp2.000, jadi 7 pensil Rp14.000.' },
  { q: 'Kereta melaju 60 km per jam dan berangkat pukul 08.00 untuk jarak 150 km. Pukul berapa kereta tiba?', a: '10.30', ak: ['10:30', '10.30 wib', 'setengah sebelas', '10.30 pagi'], p: 'Waktu = jarak dibagi kecepatan.', j: '150 dibagi 60 = 2,5 jam. Berangkat 08.00, tiba 10.30.' },
  { q: 'Urutan angka: 1, 1, 2, 3, 5, 8, 13, ... Angka berikutnya?', a: '21', ak: [], p: 'Tiap angka adalah jumlah dua angka sebelumnya.', j: '8 + 13 = 21. Ini urutan Fibonacci.' },
  { q: 'Ada 12 apel di meja. Kamu mengambil 4 apel. Berapa apel yang kamu punya sekarang?', a: '4', ak: ['4 apel'], p: 'Yang ditanya apel yang kamu punya, bukan yang tersisa di meja.', j: 'Kamu mengambil 4, jadi kamu punya 4 apel. Di meja tersisa 8.' },
  { q: 'Jika 5 mesin membuat 5 barang dalam 5 menit, berapa menit yang dibutuhkan 100 mesin untuk membuat 100 barang?', a: '5', ak: ['5 menit'], p: 'Tiap mesin membuat 1 barang dalam 5 menit.', j: 'Satu mesin membuat 1 barang dalam 5 menit. Seratus mesin membuat 100 barang dalam waktu yang sama: 5 menit.' },
  { q: 'Sebuah buku Rp10.000 lebih mahal dari sebuah pensil. Harga keduanya Rp11.000. Berapa harga pensilnya?', a: '500', ak: ['rp500', 'rp 500', '500 rupiah'], p: 'Kalau pensil Rp1.000, bukunya Rp11.000 dan totalnya Rp12.000. Terlalu mahal.', j: 'Pensil Rp500, buku Rp10.500. Selisihnya Rp10.000 dan totalnya Rp11.000.' },
  { q: 'Urutan angka: 3, 9, 27, 81, ... Angka berikutnya?', a: '243', ak: [], p: 'Tiap angka dikali angka yang sama.', j: 'Tiap angka dikali 3. 81 x 3 = 243.' },
  { q: 'Seorang petani punya 17 domba. Semuanya mati kecuali 9. Berapa domba yang masih hidup?', a: '9', ak: ['9 ekor'], p: 'Baca soalnya pelan-pelan.', j: 'Semua mati kecuali 9, jadi yang hidup 9 ekor.' },
  { q: 'Dalam 1 jam, jarum pendek jam dinding bergerak berapa derajat?', a: '30', ak: ['30 derajat'], p: 'Satu putaran penuh 360 derajat ditempuh dalam 12 jam.', j: '360 dibagi 12 = 30 derajat per jam.' },
  { q: 'Dua ayah dan dua anak makan 3 telur, masing-masing makan 1 telur. Bagaimana bisa?', a: 'kakek, ayah, dan anak', ak: ['kakek ayah anak', 'kakek, ayah, anak', '3 orang', 'kakek ayah dan anak'], p: 'Satu orang bisa jadi ayah sekaligus anak.', j: 'Mereka hanya 3 orang: kakek, ayahnya (anak kakek), dan anaknya. Kakek dan ayah adalah dua ayah, ayah dan anak adalah dua anak.' },
  { q: 'Sebuah angka dikali 2 lalu ditambah 10 hasilnya 30. Angka itu?', a: '10', ak: [], p: 'Kerjakan mundur dari hasil akhir.', j: '30 dikurangi 10 = 20, lalu 20 dibagi 2 = 10.' },
  { q: 'Urutan angka: 1, 4, 9, 16, 25, ... Angka berikutnya?', a: '36', ak: [], p: 'Ini angka kuadrat.', j: '1, 4, 9, 16, 25 adalah 1 kuadrat sampai 5 kuadrat. Berikutnya 6 kuadrat = 36.' },
  { q: 'Cari bilangan terkecil yang: dibagi 2 sisa 1, dibagi 3 sisa 2, dibagi 4 sisa 3, dan dibagi 5 habis.', a: '35', ak: [], p: 'Bilangan itu 1 kurang dari kelipatan 12, dan kelipatan 5.', j: 'Bilangan + 1 harus kelipatan 2, 3, dan 4, jadi kelipatan 12. 35 + 1 = 36, dan 35 habis dibagi 5.' },
  { q: 'Urutan angka: 0, 1, 1, 2, 4, 7, 13, ... Angka berikutnya?', a: '24', ak: [], p: 'Tiap angka adalah jumlah tiga angka sebelumnya.', j: '4 + 7 + 13 = 24.' },
  { q: 'Jika hari ini hari Rabu, hari apa 100 hari lagi?', a: 'Jumat', ak: ['jumat'], p: 'Satu minggu ada 7 hari. 100 dibagi 7 sisa berapa?', j: '100 dibagi 7 = 14 minggu sisa 2 hari. Rabu ditambah 2 hari = Jumat.' },
  { q: 'Sebuah kolam terisi setengah dalam 48 menit karena airnya berlipat tiap menit. Kapan kolam penuh?', a: '49', ak: ['49 menit', 'menit ke-49', 'menit 49'], p: 'Air berlipat tiap menit, jadi semenit kemudian isinya dua kali lipat.', j: 'Setengah kolam berlipat sekali jadi penuh. Jadi penuh di menit ke-49, bukan 96.' },
  { q: 'Berapa banyak angka 9 di antara angka 1 sampai 100?', a: '20', ak: ['20 kali'], p: 'Hitung angka 9 di satuan dan di puluhan. Angka 99 punya dua.', j: 'Di satuan: 9, 19, 29, sampai 99 = 10 kali. Di puluhan: 90 sampai 99 = 10 kali. Total 20.' },
  { q: 'Urutan angka: 2, 3, 5, 7, 11, 13, ... Angka berikutnya?', a: '17', ak: [], p: 'Ini bilangan prima.', j: 'Bilangan prima setelah 13 adalah 17.' },
  { q: 'Sebuah tangga punya 10 anak tangga. Kamu naik 3, turun 1, naik 3, lalu turun 1. Kamu di anak tangga ke berapa?', a: '4', ak: ['anak tangga ke-4', 'tangga ke-4'], p: 'Hitung naik dan turunnya satu per satu.', j: '0 + 3 - 1 + 3 - 1 = 4.' },
  { q: 'Dua tahun lalu, Ani 3 kali umur Budi. Sekarang Ani 14 tahun. Berapa umur Budi sekarang?', a: '6', ak: ['6 tahun'], p: 'Dua tahun lalu Ani 12 tahun.', j: 'Dua tahun lalu Ani 12, jadi Budi 4. Sekarang Budi 6 tahun.' },
  { q: 'Urutan angka: 1, 2, 4, 8, 16, ... Angka berikutnya?', a: '32', ak: [], p: 'Tiap angka dua kali angka sebelumnya.', j: '16 x 2 = 32.' },
  { q: 'Sebuah toko memberi diskon 20%, lalu diskon lagi 20% dari harga sesudah diskon pertama. Berapa total diskonnya?', a: '36%', ak: ['36', '36 persen'], p: 'Diskon kedua dihitung dari harga yang sudah didiskon, bukan harga awal.', j: 'Harga awal 100 jadi 80, lalu 80 dikurangi 20% jadi 64. Total berkurang 36 dari 100, jadi 36%.' },
  { q: 'Pukul 03.00 tepat, berapa derajat sudut antara jarum jam pendek dan jarum jam panjang?', a: '90', ak: ['90 derajat'], p: 'Jarum pendek di angka 3, jarum panjang di angka 12.', j: 'Jaraknya 3 angka jam. Satu angka jam = 30 derajat, jadi 3 x 30 = 90 derajat.' },
  { q: 'Budi punya Rp50.000. Ia membeli 3 buku seharga Rp12.000 per buku. Berapa sisa uang Budi?', a: '14000', ak: ['rp14000', 'rp 14000', '14.000', '14 ribu'], p: 'Kalikan dulu harga buku dengan jumlahnya.', j: '3 x Rp12.000 = Rp36.000. Rp50.000 - Rp36.000 = Rp14.000.' },
  { q: 'Urutan huruf: A, C, F, J, O, ... Huruf berikutnya?', a: 'U', ak: ['u'], p: 'Lompatannya bertambah 1 tiap langkah: 2, 3, 4, 5, lalu?', j: 'A lompat 2 ke C, lompat 3 ke F, lompat 4 ke J, lompat 5 ke O, lompat 6 ke U.' },
  { q: 'Jika 1 = 5, 2 = 25, 3 = 325, dan 4 = 4325, maka 5 = ?', a: '1', ak: [], p: 'Lihat baris pertama lagi.', j: 'Baris pertama sudah bilang 1 = 5, jadi 5 = 1.' },
  { q: 'Sebuah persegi dipotong satu sudutnya. Berapa sudut yang dimiliki bangun itu sekarang?', a: '5', ak: ['5 sudut'], p: 'Memotong satu sudut menghasilkan dua sudut baru.', j: 'Satu sudut hilang, dua sudut baru muncul. 4 - 1 + 2 = 5 sudut.' },
  { q: 'Urutan angka: 0, 5, 10, 15, ... Berapa suku ke-20?', a: '95', ak: [], p: 'Suku ke-n adalah 5 x (n - 1).', j: 'Suku ke-20 = 5 x 19 = 95.' },
];

// Hash tanggal (YYYY-MM-DD) ke indeks bank. FNV-1a + finalizer
// splitmix supaya tanggal berurutan tersebar merata ke seluruh bank.
// Sama untuk semua orang di hari yang sama, dan berubah tiap hari.
export function indeksUntukTanggal(iso) {
  let h = 2166136261;
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) % TEKA_TEKI.length;
}

export function tekaTekiUntukTanggal(iso) {
  return TEKA_TEKI[indeksUntukTanggal(iso)];
}

export function normalisasiJawaban(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function cekJawaban(masukan, teka) {
  const m = normalisasiJawaban(masukan);
  if (!m) return false;
  if (m === normalisasiJawaban(teka.a)) return true;
  return (teka.ak || []).some((alt) => m === normalisasiJawaban(alt));
}

export function tanggalHariIniISO() {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}

export function render(root) {
  const tglI = T.input('date', '', tanggalHariIniISO());
  const jawabI = T.input('text', 'Tulis jawabanmu di sini', '');
  const box = T.out();
  const hasilBox = T.out();
  let sudahJawab = false;

  const tampilkan = () => {
    const iso = tglI.value || tanggalHariIniISO();
    const teka = tekaTekiUntukTanggal(iso);
    const hariIni = iso === tanggalHariIniISO();
    sudahJawab = false;
    jawabI.value = '';
    T.show(box, '<p class="hint">' + (hariIni ? 'Teka-teki hari ini' : 'Teka-teki tanggal ' + T.esc(iso)) + ' (nomor ' + (indeksUntukTanggal(iso) + 1) + ' dari ' + TEKA_TEKI.length + ').</p>' +
      '<p style="font-size:17px;line-height:1.6;margin:12px 0">' + T.esc(teka.q) + '</p>');
    T.show(hasilBox, '');
  };

  const cek = () => {
    const iso = tglI.value || tanggalHariIniISO();
    const teka = tekaTekiUntukTanggal(iso);
    if (cekJawaban(jawabI.value, teka)) {
      sudahJawab = true;
      T.show(hasilBox, '<p class="big">🎉 Benar!</p><p class="hint">' + T.esc(teka.j) + '</p>');
      T.toast('Jawabanmu benar');
    } else {
      T.show(hasilBox, '<div class="err">Belum tepat. Coba lagi, atau tekan "Petunjuk" kalau mentok.</div>');
    }
  };
  const petunjuk = () => {
    const iso = tglI.value || tanggalHariIniISO();
    const teka = tekaTekiUntukTanggal(iso);
    T.show(hasilBox, '<p class="hint">Petunjuk: ' + T.esc(teka.p) + '</p>');
  };
  const lihatJawaban = () => {
    const iso = tglI.value || tanggalHariIniISO();
    const teka = tekaTekiUntukTanggal(iso);
    sudahJawab = true;
    T.show(hasilBox, '<p class="hint">Jawabannya: <b>' + T.esc(teka.a) + '</b></p><p class="hint">' + T.esc(teka.j) + '</p>');
  };

  jawabI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); cek(); } });
  tglI.addEventListener('change', tampilkan);

  root.appendChild(T.el('<p class="hint">Satu teka-teki baru tiap hari, sama untuk semua orang. Bank berisi 30 teka-teki logika yang berputar berdasarkan tanggal.</p>'));
  root.appendChild(T.field('Tanggal', tglI, 'Ganti tanggal untuk melihat teka-teki hari lain.'));
  root.appendChild(box);
  root.appendChild(T.field('Jawabanmu', jawabI));
  root.appendChild(T.row(T.btn('Cek jawaban', cek, true), T.btn('Petunjuk', petunjuk), T.btn('Lihat jawaban', lihatJawaban)));
  root.appendChild(hasilBox);
  tampilkan();
}
