/* ============================================================
   ADIP Tools v6.14.0 — catalog.js (P0-C)
   Data katalog kurasi + aksesornya, dipindah verbatim dari app.js
   (v6.13.0) tanpa satu pun perubahan isi. Modul ini MURNI data:
   tanpa DOM, tanpa localStorage — bisa diimpor di Node untuk tes.

   ISI:
   - SEARCH_DENY : id tool yang disembunyikan dari pencarian
                   (satu-satunya sumber; duplikatnya di beranda.js
                   sudah dicabut).
   - CATS / CAT_ICON / catLabel : daftar + label + ikon kategori.
   - COLLECTIONS / collectionById : koleksi berdasarkan masalah.
   - NEXT : rantai antar-tool ("Lanjut ke").
   - METHOD / METHOD_IDS : rumus & asumsi kalkulator (Metodologi).
   - byId / visibleTools / isNew : aksesor atas manifest.
   ============================================================ */
import { manifest, VERSION } from './manifest.js';

const SEARCH_DENY = ['muse-test'];

const CATS = [
  ['semua','Semua'],['keamanan','Keamanan'],['converter','Converter'],['developer','Dev & Web'],
  ['desain','Desain'],['indonesia','Indonesia'],['musik','Musik'],['gambar','Gambar'],
  ['teks','Teks'],['bisnis','Bisnis'],['sehari','Sehari-hari'],['fun','Fun'],
  ['produktivitas','Produktivitas'],['pelajar','Pelajar'],['liveapi','Live API'],
  ['fakesos','Fake Sosmed'],
  ['kesehatan','Kesehatan'],['kreator','Kreator'],['masak','Masak'],['travel','Travel'],
];
const CAT_ICON = {
  keamanan: '🔐', converter: '🔁', developer: '🧑‍💻', desain: '🎨', indonesia: '🇮🇩',
  musik: '🎧', gambar: '🖼️', teks: '🔤', bisnis: '💼', sehari: '🏠',
  fun: '🎲', produktivitas: '⚡', pelajar: '📚', liveapi: '🌐', semua: '🧰',
  fakesos: '🎭',
  kesehatan: '🩺', kreator: '🎬', masak: '🍳', travel: '✈️',
};
const catLabel = (id) => (CATS.find((c) => c[0] === id) || ['?','Lainnya'])[1];
const byId = (id) => manifest.find((m) => m.id === id);
const visibleTools = () => manifest.filter((m) => !SEARCH_DENY.includes(m.id));
/* tool baru = field `since` di meta-nya sama dengan versi saat ini */
const isNew = (m) => Boolean(m.since) && m.since === VERSION;

/* ---------------- koleksi berdasarkan masalah (v6.12.0, ide UX #8) ----------------
   Koleksi mengelompokkan tool lintas kategori berdasarkan masalah yang mau
   diselesaikan user, bukan kategori teknis. ID tool di bawah diverifikasi
   ada di manifest; collectionPage() tetap memfilter yang hilang. */
const COLLECTIONS = [
  { id: 'lamaran-kerja', icon: '💼', name: 'Buat lamaran kerja', desc: 'CV, surat lamaran, pas foto, sampai semua berkas jadi satu PDF.', tools: ['pembuat-cv', 'surat-lamaran', 'crop-pas-foto', 'image-compress', 'ubah-ukuran-foto', 'pdflab', 'tanda-tangan', 'cek-privasi-tempel'] },
  { id: 'jualan-online', icon: '🛍️', name: 'Buat jualan online', desc: 'Hitung harga jual, diskon, fee marketplace, sampai invoice rapi.', tools: ['daftar-harga', 'margin-markup', 'kalkulator-hpp', 'food-cost', 'fee-lazada', 'diskon-aman', 'harga-coret', 'harga-bundling', 'harga-grosir', 'buat-invoice', 'generator-hashtag', 'komisi-reseller'] },
  { id: 'tugas-sekolah', icon: '📚', name: 'Buat tugas sekolah', desc: 'Sitasi, flashcard, kuis, jadwal belajar, sampai hitung nilai.', tools: ['citation', 'flashcard', 'kuis-maker', 'jadwal-belajar', 'pomodoro', 'hitung-mundur-ujian', 'ipk', 'nilai-akhir', 'konversi-nilai', 'kalkulator-umum', 'word-counter', 'glosarium', 'kuis-matematika-cepat', 'trivia-umum', 'benar-atau-salah', 'tebak-tahun'] },
  { id: 'berkas-cpns', icon: '🏛️', name: 'Siapin berkas CPNS', desc: 'Pas foto sesuai syarat, berkas pas ukuran, plus latihan SKD.', tools: ['crop-pas-foto', 'image-compress', 'ubah-ukuran-foto', 'pdflab', 'tanda-tangan', 'nilai-skd-cpns', 'simulasi-skd-cpns', 'latihan-deret-angka'] },
];
const collectionById = (id) => COLLECTIONS.find((c) => c.id === id);

/* ---------------- rantai antar-tool (v6.12.0, ide UX #7) ----------------
   Langkah berikut yang relevan setelah memakai satu tool. Ditampilkan shell
   di bawah kotak tool (tanpa mengubah file tool). Tool yang mau menaruh
   rantai di dalam area hasilnya bisa pakai T.nextSteps() di core.js. */
const NEXT = {
  'image-compress': ['ubah-ukuran-foto', 'image-convert', 'removebg'],
  'ubah-ukuran-foto': ['image-compress', 'crop-pas-foto', 'image-convert'],
  'image-convert': ['image-compress', 'ubah-ukuran-foto', 'pdflab'],
  'crop-pas-foto': ['image-compress', 'ubah-ukuran-foto', 'pdflab'],
  'removebg': ['image-convert', 'kolase-foto', 'ubah-ukuran-foto'],
  'kolase-foto': ['image-compress', 'ubah-ukuran-foto'],
  'pdflab': ['tanda-tangan', 'image-compress', 'image-convert'],
  'pembuat-cv': ['surat-lamaran', 'crop-pas-foto', 'pdflab'],
  'surat-lamaran': ['pembuat-cv', 'tanda-tangan', 'pdflab'],
  'tanda-tangan': ['pdflab', 'surat-pernyataan'],
  'surat-resign': ['surat-pernyataan', 'kalkulator-pesangon', 'gaji-prorata'],
  'kalkulator-pesangon': ['gaji-prorata', 'cuti-prorata'],
  'gaji-prorata': ['cuti-prorata', 'hitung-lembur'],
  'cuti-prorata': ['gaji-prorata', 'kalkulator-pesangon'],
  'hitung-lembur': ['gaji-prorata', 'kalkulator-gaji-bersih'],
  'kalkulator-gaji-bersih': ['pph21', 'thr', 'banding-gaji'],
  'pph21': ['kalkulator-gaji-bersih', 'denda-pajak'],
  'thr': ['kalkulator-gaji-bersih', 'gaji-prorata'],
  'banding-gaji': ['konverter-gaji', 'kalkulator-gaji-bersih'],
  'konverter-gaji': ['banding-gaji', 'gaji-prorata'],
  'kpr': ['cicilan', 'kalkulator-tabungan', 'beli-vs-sewa'],
  'cicilan': ['biaya-paylater', 'kpr', 'beli-vs-sewa'],
  'beli-vs-sewa': ['kpr', 'cicilan'],
  'biaya-paylater': ['cicilan', 'kalkulator-dana-darurat'],
  'kalkulator-tabungan': ['kalkulator-dana-darurat', 'anggaran-50-30-20'],
  'kalkulator-dana-darurat': ['anggaran-50-30-20', 'kalkulator-tabungan'],
  'anggaran-50-30-20': ['kalkulator-dana-darurat', 'kalkulator-tabungan'],
  'zakat': ['kalkulator-emas'],
  'kalkulator-emas': ['zakat', 'kalkulator-tabungan'],
  'pbb': ['pph23', 'denda-pajak'],
  'pph23': ['pbb', 'denda-pajak'],
  'denda-pajak': ['pph21', 'pph23'],
  'margin-markup': ['kalkulator-hpp', 'diskon-aman', 'harga-coret'],
  'kalkulator-hpp': ['food-cost', 'margin-markup', 'bep-umkm'],
  'food-cost': ['margin-markup', 'kalkulator-hpp'],
  'fee-lazada': ['margin-markup', 'komisi-reseller', 'diskon-aman'],
  'diskon-aman': ['harga-coret', 'margin-markup'],
  'harga-coret': ['diskon-aman', 'harga-bundling'],
  'harga-bundling': ['harga-coret', 'diskon-aman'],
  'harga-grosir': ['harga-bundling', 'komisi-reseller'],
  'komisi-reseller': ['fee-lazada', 'target-omzet'],
  'bep-umkm': ['estimasi-modal-usaha', 'target-omzet'],
  'estimasi-modal-usaha': ['bep-umkm', 'target-omzet'],
  'target-omzet': ['reorder-point', 'komisi-reseller'],
  'reorder-point': ['target-omzet', 'harga-grosir'],
  'buat-invoice': ['daftar-harga', 'margin-markup', 'fee-lazada'],
  'date-duration': ['age-calc', 'hitung-hpl'],
  'age-calc': ['date-duration', 'hitung-hpl'],
  'hitung-hpl': ['age-calc', 'date-duration'],
  'kalender-jawa': ['hijriah'],
  'nilai-skd-cpns': ['simulasi-skd-cpns'],
  'simulasi-skd-cpns': ['nilai-skd-cpns', 'flashcard'],
  'latihan-deret-angka': ['simulasi-skd-cpns', 'kalkulator-umum'],
  'ipk': ['nilai-akhir', 'konversi-nilai'],
  'nilai-akhir': ['ipk', 'konversi-nilai'],
  'flashcard': ['kuis-maker', 'jadwal-belajar', 'pomodoro'],
  'kuis-maker': ['flashcard', 'glosarium'],
  'glosarium': ['flashcard', 'kuis-maker'],
  'jadwal-belajar': ['pomodoro', 'flashcard', 'hitung-mundur-ujian'],
  'pomodoro': ['jadwal-belajar', 'hitung-mundur-ujian'],
  'hitung-mundur-ujian': ['jadwal-belajar', 'pomodoro'],
  'citation': ['word-counter', 'kuis-maker'],
  'kalkulator-umum': ['kalkulator-pecahan', 'kalkulator-logaritma', 'kalkulator-trigonometri'],
  'kalkulator-pecahan': ['kalkulator-umum', 'persamaan-kuadrat'],
  'persamaan-kuadrat': ['kalkulator-umum', 'matriks-kalkulator'],
  'matriks-kalkulator': ['kalkulator-umum', 'statistika-dasar'],
  'statistika-dasar': ['sample-size', 'matriks-kalkulator'],
  'sample-size': ['statistika-dasar'],
  'kalkulator-logaritma': ['rumus-eksponen', 'kalkulator-umum'],
  'rumus-eksponen': ['kalkulator-logaritma'],
  'kalkulator-trigonometri': ['plot-fungsi', 'kalkulator-umum'],
  'plot-fungsi': ['kalkulator-trigonometri', 'rumus-fisika'],
  'rumus-fisika': ['bangun-datar', 'plot-fungsi'],
  'bangun-datar': ['rumus-fisika', 'rumus-saku'],
  'rumus-saku': ['tabel-periodik', 'bangun-datar'],
  'tabel-periodik': ['rumus-saku'],
  'fpb-kpk': ['kalkulator-pecahan', 'tabel-perkalian'],
  'tabel-perkalian': ['fpb-kpk'],
  'kombinasi-permutasi': ['statistika-dasar', 'kalkulator-umum'],
  'typing-test': ['baca-cepat-bionik'],
  'baca-cepat-bionik': ['typing-test'],
  /* --- tool baru v6.12.0 --- */
  'fake-chat-tele': ['fake-chat-messenger', 'fake-dm-discord', 'fake-dm-ig'],
  'fake-chat-messenger': ['fake-chat-tele', 'fake-dm-discord', 'fake-dm-ig'],
  'fake-dm-discord': ['fake-chat-tele', 'fake-chat-messenger', 'fake-dm-ig'],
  'fake-reddit-post': ['fake-threads-post', 'fake-tweet', 'fake-post-ig'],
  'fake-threads-post': ['fake-reddit-post', 'fake-tweet', 'fake-post-ig'],
  'fake-notes-iphone': ['fake-call-history-iphone', 'fake-notif-hp'],
  'fake-call-history-iphone': ['fake-notes-iphone', 'fake-call'],
  'tebak-angka': ['kuis-matematika-cepat', 'trivia-umum', 'tebak-tahun'],
  'kuis-matematika-cepat': ['tebak-angka', 'trivia-umum', 'benar-atau-salah'],
  'trivia-umum': ['benar-atau-salah', 'tebak-tahun', 'tebak-tebakan'],
  'benar-atau-salah': ['trivia-umum', 'tebak-tahun', 'tebak-tebakan'],
  'tebak-tahun': ['trivia-umum', 'benar-atau-salah', 'tebak-tebakan'],
  'tebak-tebakan': ['trivia-umum', 'benar-atau-salah', 'tebak-tahun'],
  'resep-makanan': ['food-cost', 'kalkulator-hpp', 'kalori-makanan'],
  'kamus-inggris': ['tebak-kata', 'word-counter', 'glosarium'],
  'wilayah-indonesia': ['data-indonesia', 'kalender-jawa'],
  'data-indonesia': ['wilayah-indonesia', 'ump-provinsi', 'kalkulator-emas'],
  'lirik-lagu': ['tebak-chord', 'piano', 'metronome'],
  'bantuan': ['beri-masukan'],
  'beri-masukan': ['bantuan'],
};

/* ---------------- metodologi (v6.12.0, ide UX #13) ----------------
   Rumus & asumsi tiap kalkulator — ditulis dari kode tool-nya sendiri
   (bukan dari ingatan). Tool di halaman tool mendapat tautan "Cara hitungnya"
   bila id-nya ada di sini. */
const METHOD = [
  { id: 'thr', rumus: 'Masa kerja 12 bulan atau lebih → THR 1× gaji sebulan. Kurang dari 12 bulan → (masa kerja ÷ 12) × gaji.', batas: 'Gaji yang dipakai adalah gaji pokok + tunjangan tetap yang kamu isi. Aturan THR Keagamaan: pekerja dengan masa kerja 1 bulan ke atas berhak THR; kebijakan kantormu bisa berbeda. Tanya HRD.' },
  { id: 'pph21', rumus: 'Januari-November: PPh 21 = bruto sebulan × TER (Tarif Efektif Rata-rata, PP 58/2023), tanpa mengurangi biaya jabatan atau PTKP dulu. Desember: dihitung ulang setahun penuh dengan tarif progresif 5%-35% atas Penghasilan Kena Pajak (bruto − biaya jabatan 5%, maks Rp500rb/bulan − iuran pensiun − PTKP), dikurangi pajak yang sudah dibayar. PTKP TK/0 Rp54 juta/tahun (PMK 101/2016).', batas: 'Hanya untuk pegawai tetap. Bonus, THR, dan penghasilan lain di bulan itu ikut menambah bruto. Bukan pengganti perhitungan resmi kantor pajak.' },
  { id: 'kalkulator-gaji-bersih', rumus: 'Gaji bersih = bruto − BPJS Kesehatan 1% − JHT 2% − PPh 21 (TER) − potongan lain. Persentase BPJS/JHT bisa diubah dan tersimpan di perangkatmu. Mode gross-up mencari bruto lewat iterasi sampai hasil bersihnya sama dengan target yang kamu mau.', batas: 'Persentase BPJS/JHT default mengikuti aturan umum; cek slip gajimu bila kantormu memakai tarif berbeda. TER berlaku untuk pegawai tetap.' },
  { id: 'kpr', rumus: 'Anuitas: cicilan = pokok × r ÷ (1 − (1+r)^−n), dengan r = bunga tahunan ÷ 12. Bunga tiap bulan dihitung dari sisa pokok, jadi porsi pokok membesar seiring waktu. Flat: total bunga = pokok × bunga% × tahun, cicilan = (pokok + total bunga) ÷ bulan. Pembayaran ekstra diasumsikan langsung memotong pokok.', batas: 'Simulasi bunga tetap. Bank biasanya memakai bunga fixed beberapa tahun pertama lalu floating, jadi cicilan aktual bisa berubah. Belum termasuk denda pelunasan dipercepat; cek ketentuan bankmu.' },
  { id: 'cicilan', rumus: 'Sama seperti Simulasi KPR: anuitas memakai cicilan = pokok × r ÷ (1 − (1+r)^−n), r = bunga tahunan ÷ 12; flat memakai total bunga = pokok × bunga% × (bulan ÷ 12). Pembayaran ekstra masuk ke pokok sehingga tenor memendek dan total bunga berkurang.', batas: 'Bunga tetap selama tenor. Biaya admin, provisi, dan asuransi tidak dihitung.' },
  { id: 'kalkulator-pesangon', rumus: 'Versi sederhana PP 35/2021. UP (Uang Pesangon): 1-9× upah sesuai masa kerja (di bawah 1 tahun 1×, 8 tahun ke atas 9×). UPMK (Uang Penghargaan Masa Kerja): 0-10× upah, mulai dari masa kerja 3 tahun. UPH (Uang Penggantian Hak): 15% × (UP + UPMK). Pengali UP menurut alasan: PHK biasa 1×, efisiensi 0,5×, pensiun 1,75×, meninggal 2×.', batas: 'Ilustrasi saja. UPH di dunia nyata juga mencakup cuti yang belum diambil dan ongkos pulang. Konsultasikan ke HRD atau serikat pekerja untuk angka pastinya.' },
  { id: 'hitung-lembur', rumus: 'Upah per jam = gaji ÷ 173. Hari kerja: jam ke-1 dibayar 1,5× upah per jam, jam berikutnya 2×. Hari libur: 7 jam pertama 2×, jam ke-8 3×, jam ke-9 ke atas 4×.', batas: 'Rumus umum; ketentuan lembur di hari libur dan detailnya bisa beda per perusahaan. Cek PP/PKB tempatmu kerja.' },
  { id: 'gaji-prorata', rumus: 'Upah harian = gaji ÷ 21 (sistem 5 hari kerja) atau ÷ 25 (sistem 6 hari kerja), sesuai PP 36/2021 Pasal 17. Gaji prorata = upah harian × jumlah hari kerja dalam periode itu, dihitung dari kalender bulan berjalan.', batas: 'Libur nasional belum dikurangi dari hitungan hari kerja. Bila kantormu memakai cara lain (mis. gaji ÷ 30 hari kalender), hasilnya bisa beda.' },
  { id: 'kalkulator-hpp', rumus: 'HPP per unit = (biaya material + tenaga kerja + overhead) ÷ jumlah unit. Saran harga jual = HPP ÷ (1 − margin%). Margin dihitung dari harga jual, bukan dari modal.', batas: 'Hanya menghitung biaya yang kamu isi. Biaya tak terduga, susut, dan pajak belum masuk. Tambahkan sendiri ke overhead bila perlu.' },
  { id: 'bmi', rumus: 'BMI = berat (kg) ÷ tinggi (m)². Kategori memakai standar WHO untuk Asia: di bawah 18,5 kurus; 18,5-22,9 normal; 23-24,9 kelebihan berat; 25-29,9 obesitas I; 30 ke atas obesitas II. BMR memakai rumus Mifflin-St Jeor; TDEE = BMR × faktor aktivitas (1,2-1,9). Target turun berat memakai defisit 500 kkal/hari (sekitar 0,5 kg/minggu).', batas: 'BMI tidak membedakan otot dan lemak, jadi orang berotot bisa terbaca "kelebihan berat" padahal sehat. BMR/TDEE adalah perkiraan; konsultasikan ke tenaga kesehatan untuk target yang personal.' },
  { id: 'hitung-hpl', rumus: 'Tiga mode. Dari HPHT memakai rumus Naegele: HPHT + 7 hari − 3 bulan + 1 tahun. Dari USG: tanggal USG + sisa hari sampai 40 minggu (280 hari). Dari transfer embrio IVF: tanggal transfer + (280 − 14 − umur embrio) hari. Perkembangan janin per minggu memakai perkiraan rata-rata umum.', batas: 'HPL adalah perkiraan. Hanya sebagian kecil persalinan yang tepat di tanggal HPL. Usia kehamilan dari USG trimester awal lebih akurat daripada dari HPHT bila siklus haid tidak teratur.' },
  { id: 'zakat', rumus: 'Nisab zakat maal = 85 gram emas × harga emas per gram yang kamu isi. Bila total harta mencapai nisab, zakatnya 2,5% dari harta. Zakat fitrah = 2,5 kg beras per jiwa × harga beras.', batas: 'Harga emas default Rp2.517.000/gram (harga Antam 15 Nov 2026). Harga emas berubah tiap hari, cek harga saat ini agar nisabnya akurat. Harta yang dihitung adalah yang sudah dimiliki setahun (haul); konsultasikan ke lembaga zakat bila ragu.' },
];
const METHOD_IDS = new Set(METHOD.map((x) => x.id));

export {
  SEARCH_DENY, CATS, CAT_ICON, catLabel, byId, visibleTools, isNew,
  COLLECTIONS, collectionById, NEXT, METHOD, METHOD_IDS,
};
