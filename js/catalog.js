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
   - SECONDARY_TAGS / relatedTools : tag sekunder lintas-kategori +
     "Yang mirip" berbasis relevansi (S-U3, v6.22.0).
   - SUBGROUPS / subgroupOf / subgroupsFor : sub-kelompok tampilan
     kategori besar liveapi/bisnis/desain (S-U3, v6.22.0).
   - METHOD / METHOD_IDS : rumus & asumsi kalkulator (Metodologi).
   - byId / visibleTools / isNew / isOnline : aksesor atas manifest.
   ============================================================ */
import { manifest, VERSION } from './manifest.js';
/* S-U5 (v6.22.0, manifest split): versi detail dari manifest-boot.js
   (impor langsung, BUKAN lewat alias './manifest.js' — supaya
   js/manifest.js tetap tak tersentuh). Dipakai relTokens untuk
   membuang cache token begitu keywords ditempel. */
import { manifestDetailsVersion } from './manifest-boot.js';

const SEARCH_DENY = ['muse-test'];

const CATS = [
  ['semua','Semua'],['keamanan','Keamanan'],['converter','Converter'],['developer','Dev & Web'],
  ['desain','Desain'],['indonesia','Indonesia'],['musik','Musik'],['gambar','Gambar'],
  ['teks','Teks'],['bisnis','Bisnis'],['sehari','Sehari-hari'],['fun','Fun'],
  ['produktivitas','Produktivitas'],['pelajar','Pelajar'],['liveapi','Data Langsung'],
  ['fakesos','Sosmed Palsu'],
  ['kesehatan','Kesehatan'],['kreator','Kreator'],['masak','Masak'],['travel','Travel'],
  ['sains','Sains'],['otomotif','Otomotif'],['rumah','Rumah'],
];
const CAT_ICON = {
  keamanan: '🔐', converter: '🔁', developer: '🧑‍💻', desain: '🎨', indonesia: '🇮🇩',
  musik: '🎧', gambar: '🖼️', teks: '🔤', bisnis: '💼', sehari: '🏠',
  fun: '🎲', produktivitas: '⚡', pelajar: '📚', liveapi: '🌐', semua: '🧰',
  fakesos: '🎭',
  kesehatan: '🩺', kreator: '🎬', masak: '🍳', travel: '✈️',
  sains: '🔬', otomotif: '🚗', rumah: '🏡',
};
const catLabel = (id) => (CATS.find((c) => c[0] === id) || ['?','Lainnya'])[1];
const byId = (id) => manifest.find((m) => m.id === id);
const visibleTools = () => manifest.filter((m) => !SEARCH_DENY.includes(m.id));
/* tool baru = field `since` di meta-nya sama dengan versi saat ini */
const isNew = (m) => Boolean(m.since) && m.since === VERSION;
/* S-U2 (v6.22.0): tool butuh internet = field `online` di manifest-nya
   true (kontrak S-U8: S-U8 yang mengisi flagnya, pembaca hanya memakai).
   DEFENSIF: tool tanpa field `online` dianggap bisa offline — flag yang
   belum terisi tidak boleh menyembunyikan tool dari filter offline. */
const isOnline = (m) => m.online === true;

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
   Langkah berikut yang relevan setelah memakai satu tool (442 dari 1.262 tool
   punya rantai sejak v6.22.0; liveapi/bisnis/sehari 100%). Ditampilkan shell
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
  'target-omzet': ['kalkulator-safety-stock', 'komisi-reseller'],
  'kalkulator-safety-stock': ['target-omzet', 'harga-grosir'],
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
  'statistika-dasar': ['margin-of-error', 'matriks-kalkulator'],
  'margin-of-error': ['statistika-dasar'],
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
  /* --- S-U3 (v6.22.0, P1-1): perluasan sistematis — kandidat otomatis dari
     tumpang-tindih keywords + kategori yang sama, lalu KURASI manual: 340 entri
     baru (101 -> 441 dari 1.261 tool). False positive token ("paket", "arsip",
     "simulasi", "jadwal", "biaya", "nama") dipangkas; 17 tool tanpa kandidat
     + pasangan lintas-kategori (QR dkk.) diisi manual. Tiap entri bisa
     dibuktikan dari fungsi tool; cakupan liveapi/bisnis/sehari kini 100%. --- */
  /* bisnis */
  'analisis-swot': ['estimasi-modal-usaha', 'generator-slogan-bisnis', 'nama-brand'],
  'banding-harga': ['banding-gaji', 'daftar-belanja', 'kalkulator-ppn'],
  'berat-volumetrik': ['surat-jalan', 'harga-bundling', 'kalkulator-hpp'],
  'cara-bilang-profesional': ['penulis-cold-email', 'generator-faq', 'generator-copy-landing-page'],
  'daftar-harga': ['margin-markup', 'kalkulator-hpp', 'buat-invoice'],
  'estimasi-penghasilan-kreator': ['kalkulator-engagement', 'generator-ide-video-faceless', 'generator-caption-reels-tiktok'],
  'fee-broker-saham': ['kalkulator-capm-beta', 'kalkulator-dividen', 'kalkulator-sharpe-ratio'],
  'generator-copy-landing-page': ['generator-headline-iklan-fb', 'generator-faq', 'pembuat-landing-page'],
  'generator-deskripsi-properti': ['kalkulator-kenaikan-sewa', 'kalkulator-harga-per-meter-persegi', 'kalkulator-cap-rate-properti'],
  'generator-faq': ['penulis-cold-email', 'generator-copy-landing-page', 'generator-headline-iklan-fb'],
  'generator-headline-iklan-fb': ['generator-copy-landing-page', 'generator-faq', 'penulis-cold-email'],
  'generator-nda': ['generator-rencana-bisnis', 'surat-pernyataan', 'analisis-swot'],
  'generator-press-release': ['generator-copy-landing-page', 'generator-faq', 'penulis-cold-email'],
  'generator-rencana-bisnis': ['bep-umkm', 'estimasi-modal-usaha', 'kalkulator-runway-usaha'],
  'generator-slogan-bisnis': ['nama-brand', 'analisis-swot', 'estimasi-modal-usaha'],
  'harga-jual-delivery': ['harga-jual-marketplace', 'kalkulator-komisi', 'penghasilan-ojol'],
  'harga-jual-marketplace': ['fee-marketplace', 'harga-jual-delivery', 'food-cost'],
  'kalkulator-anuitas': ['kalkulator-nilai-sekarang-present-value', 'kpr', 'simulasi-kur'],
  'kalkulator-aturan-72': ['estimasi-modal-usaha', 'fee-broker-saham', 'kalkulator-biaya-peluang'],
  'kalkulator-biaya-paypal': ['kalkulator-komisi', 'fee-marketplace', 'kalkulator-ppn'],
  'kalkulator-biaya-peluang': ['estimasi-modal-usaha', 'matriks-keputusan', 'banding-gaji'],
  'kalkulator-bunga-efektif-tahunan-ear-apy': ['kalkulator-bunga-sederhana', 'kalkulator-aturan-72', 'simulasi-deposito'],
  'kalkulator-bunga-sederhana': ['kalkulator-bunga-efektif-tahunan-ear-apy', 'kalkulator-anuitas', 'simulasi-deposito'],
  'kalkulator-cac': ['kalkulator-churn-rate', 'kalkulator-nilai-pelanggan', 'kalkulator-conversion-rate'],
  'kalkulator-cagr': ['kalkulator-roi', 'kalkulator-sharpe-ratio', 'estimasi-modal-usaha'],
  'kalkulator-cap-rate-properti': ['kalkulator-sewa-properti', 'kalkulator-cash-on-cash', 'generator-deskripsi-properti'],
  'kalkulator-capm-beta': ['fee-broker-saham', 'kalkulator-dividen', 'kalkulator-sharpe-ratio'],
  'kalkulator-cash-on-cash': ['kalkulator-sewa-properti', 'kalkulator-cap-rate-properti', 'generator-deskripsi-properti'],
  'kalkulator-cashflow': ['kalkulator-dana-darurat', 'anggaran-50-30-20', 'kalkulator-tabungan'],
  'kalkulator-churn-rate': ['kalkulator-cac', 'kalkulator-nilai-pelanggan', 'kalkulator-conversion-rate'],
  'kalkulator-conversion-rate': ['kalkulator-cpc-cpm-iklan', 'roas-iklan', 'uji-signifikansi-ab'],
  'kalkulator-cpc-cpm-iklan': ['roas-iklan', 'generator-headline-iklan-fb', 'generator-copy-landing-page'],
  'kalkulator-ctr': ['generator-copy-landing-page', 'generator-deskripsi-properti', 'generator-headline-iklan-fb'],
  'kalkulator-dana-pendidikan': ['kalkulator-tabungan', 'simulasi-deposito', 'kalkulator-inflasi'],
  'kalkulator-dca': ['kalkulator-fibonacci-retracement', 'kalkulator-rsi', 'fee-broker-saham'],
  'kalkulator-dcf': ['kalkulator-npv-irr', 'kalkulator-margin-of-safety', 'kalkulator-mirr'],
  'kalkulator-dividen': ['fee-broker-saham', 'kalkulator-capm-beta', 'kalkulator-sharpe-ratio'],
  'kalkulator-dscr': ['kalkulator-lunasi-utang', 'kalkulator-rasio-utang-terhadap-pendapatan-dti', 'kpr'],
  'kalkulator-ebitda': ['denda-pajak', 'kalkulator-lunasi-utang', 'laporan-laba-rugi'],
  'kalkulator-engagement': ['kalender-konten', 'estimasi-penghasilan-kreator', 'generator-hook-tiktok'],
  'kalkulator-eoq': ['kalkulator-fifo-lifo', 'kalkulator-safety-stock', 'kalkulator-perputaran-persediaan'],
  'kalkulator-eps-rasio-p-e': ['kalkulator-harga-wajar-saham-graham-number', 'kalkulator-margin-of-safety', 'fee-broker-saham'],
  'kalkulator-fibonacci-retracement': ['kalkulator-rsi', 'kalkulator-dca', 'kalkulator-ukuran-posisi'],
  'kalkulator-fifo-lifo': ['kalkulator-perputaran-persediaan', 'kalkulator-eoq', 'kalkulator-hpp'],
  'kalkulator-fire': ['anggaran-50-30-20', 'estimasi-modal-usaha', 'fee-broker-saham'],
  'kalkulator-gaji-freelance': ['gaji-prorata', 'kalkulator-gaji-bersih', 'konverter-gaji'],
  'kalkulator-harga-per-meter-persegi': ['generator-deskripsi-properti', 'kalkulator-loan-to-value', 'kalkulator-rumah'],
  'kalkulator-harga-wajar-saham-graham-number': ['kalkulator-eps-rasio-p-e', 'kalkulator-margin-of-safety', 'fee-broker-saham'],
  'kalkulator-hitung-uang-tunai': ['kalkulator-uang-kembalian', 'struk-belanja'],
  'kalkulator-impermanent-loss': ['kalkulator-dca', 'kalkulator-fibonacci-retracement', 'harga-crypto'],
  'kalkulator-inflasi': ['kalkulator-cagr', 'kalkulator-dana-pendidikan', 'kalkulator-aturan-72'],
  'kalkulator-kekayaan-bersih-net-worth': ['kalkulator-dscr', 'kalkulator-lunasi-utang', 'kalkulator-wacc'],
  'kalkulator-kenaikan-gaji': ['banding-gaji', 'gaji-prorata', 'kalkulator-gaji-bersih'],
  'kalkulator-kenaikan-sewa': ['kalkulator-sewa-properti', 'kalkulator-pph-4-2-sewa-tanah-bangunan-10', 'generator-deskripsi-properti'],
  'kalkulator-komisi': ['komisi-reseller', 'harga-jual-marketplace', 'kalkulator-gaji-freelance'],
  'kalkulator-loan-to-value': ['kalkulator-rumah', 'generator-deskripsi-properti', 'kalkulator-cash-on-cash'],
  'kalkulator-lunasi-utang': ['kalkulator-dscr', 'biaya-paylater', 'kalkulator-ebitda'],
  'kalkulator-margin-kontribusi': ['margin-markup', 'kalkulator-hpp', 'bep-umkm'],
  'kalkulator-margin-of-safety': ['kalkulator-dcf', 'kalkulator-eps-rasio-p-e', 'kalkulator-harga-wajar-saham-graham-number'],
  'kalkulator-mirr': ['kalkulator-npv-irr', 'estimasi-modal-usaha', 'kalkulator-dcf'],
  'kalkulator-modal-kerja': ['kalkulator-rasio-lancar-cepat', 'kalkulator-siklus-konversi-kas', 'kalkulator-cashflow'],
  'kalkulator-nilai-pelanggan': ['kartu-stempel', 'rate-card-endorse', 'kalkulator-cac'],
  'kalkulator-nilai-sekarang-present-value': ['kalkulator-anuitas', 'kalkulator-dcf', 'kalkulator-npv-irr'],
  'kalkulator-npv-irr': ['kalkulator-mirr', 'kalkulator-dcf', 'kalkulator-roi'],
  'kalkulator-obligasi-yield-ytm': ['kalkulator-dividen', 'kalkulator-dcf', 'kalkulator-roi'],
  'kalkulator-pelunasan-kartu-kredit': ['kalkulator-lunasi-utang', 'biaya-paylater', 'kalkulator-dscr'],
  'kalkulator-penyusutan-aset-depresiasi': ['kalkulator-depresiasi-mobil', 'beli-vs-sewa', 'kalkulator-ebitda'],
  'kalkulator-perputaran-persediaan': ['kalkulator-fifo-lifo', 'kalkulator-siklus-konversi-kas', 'kalkulator-eoq'],
  'kalkulator-ppn': ['buat-invoice', 'denda-pajak', 'kalkulator-ebitda'],
  'kalkulator-preorder': ['margin-markup', 'analisis-swot', 'diskon-aman'],
  'kalkulator-rasio-lancar-cepat': ['kalkulator-modal-kerja', 'kalkulator-siklus-konversi-kas', 'kalkulator-ebitda'],
  'kalkulator-rasio-utang-terhadap-pendapatan-dti': ['kalkulator-dscr', 'kalkulator-lunasi-utang', 'anggaran-50-30-20'],
  'kalkulator-roe-roa': ['kalkulator-wacc', 'kalkulator-ebitda', 'laporan-laba-rugi'],
  'kalkulator-roi': ['kalkulator-npv-irr', 'kalkulator-sewa-properti', 'estimasi-modal-usaha'],
  'kalkulator-rsi': ['kalkulator-fibonacci-retracement', 'kalkulator-dca', 'kalkulator-ukuran-posisi'],
  'kalkulator-rumah': ['kalkulator-loan-to-value', 'kpr', 'cicilan'],
  'kalkulator-runway-usaha': ['bep-umkm', 'generator-rencana-bisnis', 'estimasi-modal-usaha'],
  'kalkulator-sewa-properti': ['kalkulator-kenaikan-sewa', 'kalkulator-cash-on-cash', 'kalkulator-cap-rate-properti'],
  'kalkulator-sharpe-ratio': ['fee-broker-saham', 'kalkulator-cagr', 'kalkulator-capm-beta'],
  'kalkulator-siklus-konversi-kas': ['kalkulator-perputaran-persediaan', 'kalkulator-eoq', 'kalkulator-fifo-lifo'],
  'kalkulator-sinking-fund': ['kalkulator-tabungan', 'kalkulator-dana-darurat', 'anggaran-50-30-20'],
  'kalkulator-stock-split': ['fee-broker-saham', 'kalkulator-capm-beta', 'kalkulator-dca'],
  'kalkulator-ukuran-posisi': ['kalkulator-fibonacci-retracement', 'kalkulator-rsi', 'kalkulator-sharpe-ratio'],
  'kalkulator-wacc': ['anggaran-50-30-20', 'fee-broker-saham', 'generator-rencana-bisnis'],
  'kartu-stempel': ['kalkulator-nilai-pelanggan', 'daftar-harga', 'food-cost'],
  'kwitansi': ['buat-invoice', 'struk-belanja', 'surat-jalan'],
  'laporan-laba-rugi': ['diskon-aman', 'kalkulator-ebitda', 'margin-markup'],
  'nama-brand': ['generator-slogan-bisnis', 'analisis-swot', 'estimasi-modal-usaha'],
  'penghasilan-ojol': ['estimasi-penghasilan-kreator', 'anggaran-50-30-20', 'harga-jual-delivery'],
  'penulis-cold-email': ['generator-faq', 'penulis-artikel-ai', 'penulis-esai-ai'],
  'rate-card-endorse': ['kalkulator-engagement', 'generator-copy-landing-page', 'generator-deskripsi-properti'],
  'roas-iklan': ['kalkulator-cpc-cpm-iklan', 'generator-headline-iklan-fb', 'estimasi-modal-usaha'],
  'simulasi-deposito': ['kalkulator-tabungan', 'simulasi-kur', 'bunga-majemuk'],
  'simulasi-franchise': ['estimasi-modal-usaha', 'analisis-swot', 'bep-umkm'],
  'simulasi-kur': ['kpr', 'simulasi-deposito', 'cicilan'],
  'slip-gaji': ['kalkulator-gaji-bersih', 'kalkulator-gaji-freelance', 'gaji-pns'],
  'struk-belanja': ['kalkulator-uang-kembalian', 'daftar-belanja', 'banding-harga'],
  'surat-jalan': ['buat-invoice', 'kwitansi', 'berat-volumetrik'],
  'uji-signifikansi-ab': ['kalkulator-uji-t', 'generator-copy-landing-page', 'kalkulator-p-value'],
  /* liveapi */
  'akhir-dukungan-software': ['info-cve', 'cek-kerentanan-paket', 'info-paket-npm'],
  'ambil-favicon-situs': ['favicon-generator', 'cari-ikon-svg'],
  'anjing-random': ['foto-acak', 'quotes-random', 'saran-random'],
  'apod-harian': ['arsip-foto-nasa', 'berita-antariksa', 'jarak-voyager-1'],
  'arsip-foto-nasa': ['apod-harian', 'berita-antariksa', 'jadwal-peluncuran-roket'],
  'arsip-library-of-congress': ['arsip-foto-nasa', 'arsip-web', 'data-bisbol-mlb'],
  'arsip-web': ['arsip-foto-nasa', 'arsip-library-of-congress'],
  'artikel-dev-terbaru': ['berita-hacker-news', 'lelucon-geek', 'penulis-artikel-ai'],
  'avatar-inisial': ['karakter-avatar', 'avatarstudio', 'github-profile'],
  'ayat-alkitab': ['baca-quran', 'tafsir-quran'],
  'baca-quran': ['tafsir-quran', 'target-khatam', 'hadits-arbain'],
  'banjir-sungai': ['bencana-alam-global', 'cuaca-arsip', 'cuaca-bmkg'],
  'bencana-alam-global': ['observasi-alam', 'banjir-sungai', 'data-matahari-iklim'],
  'berita-antariksa': ['jadwal-peluncuran-roket', 'apod-harian', 'arsip-foto-nasa'],
  'berita-hacker-news': ['artikel-dev-terbaru', 'lelucon-geek', 'berita-antariksa'],
  'buku-indonesia': ['cari-buku', 'worldclassics', 'data-indonesia'],
  'cari-adegan-anime': ['animegallery', 'animetoreal', 'data-digimon'],
  'cari-aktivitas-acak': ['lelucon-acak', 'lelucon-chuck-norris', 'foto-acak'],
  'cari-buku': ['buku-indonesia', 'novelcover', 'cari-file-duplikat'],
  'cari-foto-gratis-cc': ['apod-harian', 'arsip-foto-nasa', 'foto-acak'],
  'cari-ikon-svg': ['bentuk-blob-svg', 'dxf-ke-svg', 'pola-svg'],
  'cari-jurnal-paper': ['jurnal-medis', 'margin-of-error', 'jurnal-harian'],
  'cari-lagu-film-app': ['lirik-lagu', 'kartu-lirik', 'apple-music-wrapped'],
  'cari-lokasi': ['tambah-gps-foto', 'tes-gps', 'ketinggian-lokasi'],
  'cari-sekolah': ['kalkulator-dana-pendidikan', 'buku-indonesia', 'data-indonesia'],
  'cek-email-bocor': ['cek-email-sekali-pakai', 'kekuatan-pin', 'kuis-phising'],
  'cek-email-sekali-pakai': ['cek-email-bocor', 'penulis-cold-email', 'validator-email-url'],
  'cek-kerentanan-paket': ['info-cve', 'info-paket-npm', 'info-paket-python'],
  'cek-username': ['cek-email-bocor', 'github-profile', 'jejak-digital'],
  'cuaca-antariksa-aurora': ['data-matahari-iklim', 'terbit-terbenam'],
  'cuaca-arsip': ['cuaca-bmkg', 'data-matahari-iklim', 'kurs-cuaca'],
  'cuaca-bmkg': ['cuaca-arsip', 'data-matahari-iklim', 'wilayah-indonesia'],
  'data-bisbol-mlb': ['info-tim-olahraga'],
  'data-blockchain-bitcoin': ['harga-crypto'],
  'data-covid-19-flu': ['info-obat-fda', 'uji-klinis', 'pengingat-obat'],
  'data-digimon': ['data-dnd-5e', 'cari-adegan-anime', 'film-studio-ghibli'],
  'data-dnd-5e': ['data-digimon'],
  'data-dota-2': ['data-valorant', 'diskon-game-pc', 'game-gratis'],
  'data-f1-live': ['info-tim-olahraga', 'data-bisbol-mlb', 'data-dota-2'],
  'data-matahari-iklim': ['cuaca-arsip', 'cuaca-bmkg', 'apod-harian'],
  'data-satelit-tle': ['posisi-iss', 'simulator-gravitasi'],
  'data-spesies-dunia': ['observasi-alam', 'data-digimon'],
  'data-valorant': ['data-dota-2', 'kalkulator-edpi', 'diskon-game-pc'],
  'diskon-game-pc': ['game-gratis', 'generator-achievement-steam', 'game-mengetik'],
  'emoji-github': ['github-profile', 'info-emoji', 'kuis-emoji-hewan'],
  'ensiklopedia-star-wars': ['cari-lagu-film-app', 'film-baru-streaming', 'film-studio-ghibli'],
  'fakta-kucing': ['fakta-tak-berguna', 'kucing-acak', 'kucing-status-http'],
  'fakta-tak-berguna': ['fakta-kucing', 'foto-acak', 'quotes-random'],
  'film-baru-streaming': ['cari-lagu-film-app', 'durasi-nonton-serial', 'film-studio-ghibli'],
  'film-studio-ghibli': ['cari-lagu-film-app', 'film-baru-streaming', 'film-acak-malam-ini'],
  'foto-acak': ['arsip-foto-nasa', 'quotes-random', 'anjing-random'],
  'galeri-met': ['galeri-seni'],
  'galeri-seni': ['galeri-met', 'arsip-foto-nasa'],
  'game-gratis': ['diskon-game-pc', 'cari-foto-gratis-cc', 'game-mengetik'],
  'gempa-bmkg': ['gempa-dirasakan', 'gempa-dunia-terkini', 'kalkulator-energi-gempa'],
  'gempa-dirasakan': ['gempa-bmkg', 'gempa-dunia-terkini', 'kalkulator-energi-gempa'],
  'gempa-dunia-terkini': ['gempa-bmkg', 'gempa-dirasakan', 'kalkulator-energi-gempa'],
  'generator-data-dummy': ['cari-ikon-svg'],
  'github-profile': ['avatarstudio', 'emoji-github'],
  'hadits-arbain': ['baca-quran', 'tafsir-quran'],
  'harga-crypto': ['data-blockchain-bitcoin', 'kalkulator-dca', 'kalkulator-impermanent-loss'],
  'harga-emas-live': ['kalkulator-emas'],
  'hari-libur': ['date-duration', 'couple-days', 'info-hari-ini'],
  'info-crate-rust': ['info-modul-go', 'info-paket-dotnet', 'info-paket-npm'],
  'info-cve': ['cek-kerentanan-paket', 'cek-email-bocor'],
  'info-domain-rdap': ['sertifikat-ssl-domain', 'apakah-situs-down', 'ip-saya'],
  'info-emoji': ['emoji-github', 'kuis-emoji-hewan'],
  'info-kopi': ['kalkulator-rasio-kopi-air', 'timer-seduh-kopi-teh'],
  'info-makanan': ['kalori-makanan', 'resep-makanan'],
  'info-modul-go': ['info-crate-rust', 'info-paket-dotnet', 'info-paket-npm'],
  'info-musik-artis': ['lirik-lagu', 'apple-music-wrapped', 'nama-panggung'],
  'info-obat-fda': ['pengingat-obat', 'uji-klinis'],
  'info-paket-dotnet': ['info-paket-npm', 'info-paket-python', 'cek-kerentanan-paket'],
  'info-paket-npm': ['info-paket-python', 'cek-kerentanan-paket', 'info-paket-dotnet'],
  'info-paket-python': ['info-paket-npm', 'cek-kerentanan-paket', 'info-paket-dotnet'],
  'info-serial-tv': ['durasi-nonton-serial', 'cari-adegan-anime'],
  'info-tim-olahraga': ['data-bisbol-mlb', 'data-f1-live'],
  'ip-saya': ['cari-lokasi', 'tambah-gps-foto', 'kode-pos-dunia'],
  'jadwal-peluncuran-roket': ['berita-antariksa', 'arsip-foto-nasa', 'apod-harian'],
  'jadwal-sholat': ['terbit-terbenam', 'jam-dunia'],
  'jawab-cepat': ['ringkasan-wikipedia', 'sinonim-kata-terkait', 'kamus-inggris'],
  'jurnal-medis': ['cari-jurnal-paper', 'info-obat-fda', 'uji-klinis'],
  'kalkulator-ekspresi': ['kalkulator-umum', 'rumus-eksponen', 'penyelesaian-matematika'],
  'karakter-avatar': ['karakter-disney', 'avatar-inisial', 'karakter-rick-morty'],
  'karakter-disney': ['karakter-avatar', 'karakter-rick-morty', 'film-baru-streaming'],
  'karakter-rick-morty': ['karakter-avatar', 'karakter-disney', 'info-emoji'],
  'kartu-magic-mtg': ['kartu-yu-gi-oh', 'kartu-remi', 'kartu-lirik'],
  'kartu-remi': ['kartu-magic-mtg', 'kartu-lirik'],
  'kartu-yu-gi-oh': ['kartu-magic-mtg'],
  'kelinci-acak': ['kucing-acak', 'rubah-acak', 'lelucon-acak'],
  'ketinggian-lokasi': ['cari-lokasi', 'tambah-gps-foto', 'kalkulator-waktu-mendaki-aturan-naismith'],
  'kode-pos-dunia': ['kode-pos-indonesia', 'jam-dunia', 'kuis-peta-dunia'],
  'kode-pos-indonesia': ['wilayah-indonesia', 'kode-pos-dunia', 'kuis-peta-indonesia'],
  'kualitas-udara': ['cuaca-bmkg', 'cuaca-arsip', 'data-matahari-iklim'],
  'kucing-acak': ['kelinci-acak', 'rubah-acak', 'fakta-kucing'],
  'kucing-status-http': ['http-status', 'fakta-kucing', 'kucing-acak'],
  'kucing-teks': ['fakta-kucing', 'kucing-acak', 'kucing-status-http'],
  'kurs-cuaca': ['cuaca-bmkg', 'harga-crypto', 'data-blockchain-bitcoin'],
  'lelucon-acak': ['lelucon-chuck-norris', 'lelucon-geek', 'lelucon-bapak-bapak'],
  'lelucon-bapak-bapak': ['lelucon-acak', 'lelucon-chuck-norris', 'lelucon-geek'],
  'lelucon-chuck-norris': ['lelucon-acak', 'lelucon-geek', 'lelucon-bapak-bapak'],
  'lelucon-geek': ['lelucon-acak', 'lelucon-chuck-norris', 'lelucon-bapak-bapak'],
  'lowongan-kerja-eropa-remote': ['lowongan-kerja-remote'],
  'lowongan-kerja-remote': ['lowongan-kerja-eropa-remote'],
  'observasi-alam': ['data-spesies-dunia', 'bencana-alam-global'],
  'pemenang-nobel': ['buku-indonesia', 'puisi-klasik', 'ringkasan-wikipedia'],
  'pemendek-url': ['validator-email-url', 'apakah-situs-down', 'info-domain-rdap'],
  'penerjemah': ['penerjemah-pdf', 'terjemahkan-gambar'],
  'penyelesaian-matematika': ['persamaan-kuadrat', 'kalkulator-ekspresi', 'faktor-bilangan'],
  'pesan-commit-acak': ['kelinci-acak', 'kucing-acak', 'lelucon-acak'],
  'pokemon-viewer': ['foto-ke-sprite-sheet', 'data-dota-2', 'data-valorant'],
  'posisi-iss': ['data-satelit-tle', 'jarak-voyager-1'],
  'prakiraan-gelombang-laut': ['cuaca-bmkg', 'cuaca-arsip', 'data-matahari-iklim'],
  'profil-catur-chess-com': ['kalkulator-elo-catur', 'teka-teki-catur-harian'],
  'puisi-klasik': ['buku-indonesia', 'pemenang-nobel', 'worldclassics'],
  'quotes-kanye-west': ['quotes-random', 'quotes-ron-swanson', 'winquotes'],
  'quotes-random': ['quotes-kanye-west', 'quotes-ron-swanson', 'saran-random'],
  'quotes-ron-swanson': ['quotes-kanye-west', 'quotes-random', 'kelinci-acak'],
  'radio-online': ['lirik-lagu', 'info-musik-artis', 'cari-lagu-film-app'],
  'resep-koktail': ['resep-makanan', 'konversi-resep', 'masak-dari-bahan'],
  'ringkasan-wikipedia': ['ensiklopedia-star-wars', 'jawab-cepat'],
  'rubah-acak': ['kelinci-acak', 'kucing-acak', 'lelucon-acak'],
  'rute-jarak-perjalanan': ['kalkulator-waktu-tempuh', 'lihat-jejak-gpx', 'jarak-dua-titik'],
  'saran-random': ['quotes-random', 'anjing-random', 'foto-acak'],
  'sertifikat-ssl-domain': ['info-domain-rdap', 'apakah-situs-down', 'ip-saya'],
  'sinonim-kata-terkait': ['kamus-sinonim-indonesia', 'kuis-kosakata-inggris', 'pencari-rima'],
  'skor-keamanan-repo': ['github-profile', 'cek-kerentanan-paket', 'info-cve'],
  'status-server-minecraft': ['generator-achievement-minecraft', 'generator-bola-minecraft', 'generator-kubah-minecraft'],
  'tafsir-quran': ['baca-quran', 'ayat-alkitab', 'hadits-arbain'],
  'tebak-nama': ['tebak-angka', 'tebak-tahun', 'age-calc'],
  'teka-teki-catur-harian': ['teka-teki-logika-harian', 'profil-catur-chess-com', 'kalkulator-elo-catur'],
  'template-meme-populer': ['meme', 'kelinci-acak', 'kucing-acak'],
  'terbit-terbenam': ['jadwal-sholat', 'cuaca-antariksa-aurora', 'data-matahari-iklim'],
  'tes-kecepatan-internet': ['konversi-kecepatan-internet', 'kalkulator-bandwidth'],
  'uji-klinis': ['info-obat-fda', 'data-covid-19-flu'],
  /* sehari */
  'anggaran-mudik': ['anggaran-lebaran', 'kalkulator-biaya-komuter', 'anggaran-50-30-20'],
  'arah-kiblat': ['jadwal-sholat', 'baca-quran', 'terbit-terbenam'],
  'bahan-bangunan': ['kalkulator-keramik-ubin', 'kalkulator-pasir-kerikil', 'biaya-pelihara-kucing'],
  'berat-ideal-anjing': ['berat-ideal-kucing', 'pakan-anjing', 'umur-anjing'],
  'berat-ideal-kucing': ['berat-ideal-anjing', 'pakan-kucing', 'biaya-pelihara-kucing'],
  'biaya-bbm': ['kalkulator-konsumsi-bbm', 'konverter-konsumsi-bbm', 'biaya-aus-kendaraan-per-km'],
  'biaya-pelihara-anjing': ['biaya-pelihara-kucing', 'biaya-pelihara-ikan-hias', 'jadwal-vaksin-anjing'],
  'biaya-pelihara-ikan-hias': ['biaya-pelihara-anjing', 'biaya-pelihara-kucing', 'volume-akuarium'],
  'biaya-pelihara-kucing': ['biaya-pelihara-anjing', 'biaya-pelihara-ikan-hias', 'jadwal-vaksin-kucing'],
  'bmi': ['kalkulator-makro-pembagian-makronutrisi', 'kalori-makanan', 'kebutuhan-protein'],
  'catat-minum-air': ['pengingat-obat', 'kalori-makanan', 'bmi'],
  'catatan-gula-darah': ['kalkulator-konversi-gula-darah', 'kalkulator-hba1c-ke-gula-darah-rata-rata-eag', 'risiko-diabetes'],
  'cek-makanan-hewan': ['nama-hewan', 'usia-steril', 'biaya-pelihara-anjing'],
  'cek-tekanan-darah': ['kalkulator-map', 'kalkulator-asupan-natrium-garam'],
  'daftar-belanja': ['banding-harga', 'struk-belanja', 'kalkulator-uang-kembalian'],
  'diagnosis-hp-rusak': ['perbaiki-piksel-nyangkut', 'tes-baterai', 'tes-dead-pixel'],
  'hitung-parkir': ['kalkulator-biaya-komuter', 'biaya-bbm', 'kalkulator-waktu-tempuh'],
  'hitung-pk-ac': ['tagihan-listrik', 'kalkulator-hemat-lampu-led', 'kalkulator-lumen-ke-watt'],
  'info-hari-ini': ['hari-libur', 'age-calc', 'date-duration'],
  'jadwal-imunisasi': ['kalkulator-biaya-punya-bayi', 'baby-name', 'kalkulator-golongan-darah-anak'],
  'jadwal-latihan': ['atlas-otot-latihan', 'zona-denyut-jantung', 'perencana-mingguan'],
  'jadwal-siram-tanaman': ['pengingat-obat', 'jam-alarm-online', 'catat-minum-air'],
  'jadwal-vaksin-anjing': ['jadwal-vaksin-kucing', 'biaya-pelihara-anjing', 'kehamilan-anjing'],
  'jadwal-vaksin-kucing': ['jadwal-vaksin-anjing', 'biaya-pelihara-kucing', 'kehamilan-kucing'],
  'jam-alarm-online': ['pengingat-obat', 'jam-dunia', 'kalkulator-waktu'],
  'jam-dunia': ['kode-pos-dunia', 'kalkulator-waktu', 'jadwal-sholat'],
  'jejak-karbon': ['kalkulator-hemat-lampu-led', 'biaya-bbm', 'ukuran-panel-surya'],
  'kalkulator-1rm': ['jadwal-latihan', 'atlas-otot-latihan', 'zona-denyut-jantung'],
  'kalkulator-ape-index': ['kalkulator-panjang-langkah', 'kalkulator-1rm', 'jadwal-latihan'],
  'kalkulator-biaya-punya-bayi': ['baby-name', 'jadwal-imunisasi', 'kalkulator-popok'],
  'kalkulator-gear-sepeda': ['ukuran-sepeda', 'watt-sepeda', 'kalkulator-jangkauan-e-bike'],
  'kalkulator-gorden': ['kalkulator-kain', 'bahan-bangunan'],
  'kalkulator-hemat-lampu-led': ['tagihan-listrik', 'kalkulator-lumen-ke-watt', 'kalkulator-hukum-ohm'],
  'kalkulator-jangkauan-e-bike': ['tes-baterai', 'waktu-cas-baterai', 'watt-sepeda'],
  'kalkulator-kain': ['kalkulator-gorden', 'bahan-bangunan'],
  'kalkulator-lumen-ke-watt': ['kalkulator-hemat-lampu-led', 'tagihan-listrik', 'konverter-satuan-listrik'],
  'kalkulator-pace': ['kalkulator-split-lari', 'kalkulator-panjang-langkah'],
  'kalkulator-panjang-langkah': ['kalkulator-langkah-ke-kalori', 'kalkulator-ape-index', 'kalkulator-pace'],
  'kalkulator-popok': ['kalkulator-biaya-punya-bayi', 'jadwal-imunisasi', 'hitung-hpl'],
  'kalkulator-split-lari': ['kalkulator-pace'],
  'kalkulator-uang-kembalian': ['kalkulator-hitung-uang-tunai', 'struk-belanja', 'daftar-belanja'],
  'kalkulator-waktu': ['konversi-waktu-desimal', 'zona-waktu', 'jam-dunia'],
  'kalkulator-waktu-mendaki-aturan-naismith': ['kalkulator-waktu', 'ketinggian-lokasi', 'kalkulator-dilatasi-waktu'],
  'kalkulator-waktu-tempuh': ['rute-jarak-perjalanan', 'kalkulator-kecepatan-jarak-waktu', 'kalkulator-waktu'],
  'kalori-makanan': ['info-makanan', 'bmi', 'kebutuhan-protein'],
  'kebutuhan-protein': ['bmi', 'kalori-makanan', 'atlas-otot-latihan'],
  'kehamilan-anjing': ['kehamilan-kucing', 'jadwal-vaksin-anjing', 'berat-ideal-anjing'],
  'kehamilan-kucing': ['kehamilan-anjing', 'jadwal-vaksin-kucing', 'berat-ideal-kucing'],
  'kode-telepon-internasional': ['kode-pos-dunia', 'jam-dunia', 'zona-waktu'],
  'konversi-resep': ['resep-makanan', 'masak-dari-bahan', 'konversi-suhu-oven'],
  'kuota-internet': ['tes-kecepatan-internet', 'konversi-kecepatan-internet', 'kalkulator-bandwidth'],
  'latihan-napas': ['timer-meditasi', 'kalkulator-peak-flow'],
  'lemak-tubuh': ['kalkulator-massa-tubuh-tanpa-lemak-lbm', 'kalkulator-absi', 'kalkulator-bri'],
  'nama-hewan': ['cek-makanan-hewan', 'usia-steril', 'biaya-pelihara-anjing'],
  'packing-travel': ['checklist-dokumen-travel', 'anggaran-mudik', 'kalkulator-waktu-tempuh'],
  'pakan-anjing': ['pakan-kucing', 'berat-ideal-anjing', 'biaya-pelihara-anjing'],
  'pakan-kucing': ['pakan-anjing', 'berat-ideal-kucing', 'biaya-pelihara-kucing'],
  'pantun': ['generator-pantun', 'puisi-klasik'],
  'pengingat-obat': ['jam-alarm-online', 'info-obat-fda', 'catat-minum-air'],
  'perbaiki-piksel-nyangkut': ['tes-dead-pixel', 'diagnosis-hp-rusak', 'tes-layar'],
  'perbandingan-ukuran-pizza': ['banding-harga', 'kalkulator-jumlah-makanan-pesta', 'konversi-resep'],
  'risiko-diabetes': ['catatan-gula-darah', 'kalkulator-hba1c-ke-gula-darah-rata-rata-eag', 'kalkulator-konversi-gula-darah'],
  'siklus-haid': ['hitung-hpl', 'kalkulator-biaya-punya-bayi', 'timer-kontraksi'],
  'stopwatch': ['time-tracker', 'jam-alarm-online', 'jam-dunia'],
  'tahun-kabisat': ['info-hari-ini', 'date-duration', 'age-calc'],
  'tanggal-kedaluwarsa': ['date-duration', 'age-calc', 'pengingat-obat'],
  'target-baca': ['target-khatam', 'buku-indonesia', 'daftar-bacaan'],
  'tes-baterai': ['kalkulator-biaya-cas-mobil-listrik', 'waktu-cas-baterai', 'diagnosis-hp-rusak'],
  'tes-buta-warna': ['simulator-buta-warna', 'kontras'],
  'tes-dead-pixel': ['perbaiki-piksel-nyangkut', 'kalkulator-ppi', 'tes-layar'],
  'tes-gamepad': ['tes-keyboard', 'tes-mouse'],
  'tes-gps': ['cari-lokasi', 'tambah-gps-foto', 'exif-clean'],
  'tes-kamera': ['tes-webcam', 'exif-clean', 'atur-hue-foto'],
  'tes-keyboard': ['tes-gamepad', 'tes-mouse', 'typing-test'],
  'tes-layar': ['kalkulator-ppi', 'tes-dead-pixel', 'tes-webcam'],
  'tes-mikrofon': ['perekam-suara', 'audio-ke-mono-stereo', 'equalizer-audio'],
  'tes-mouse': ['tes-gamepad', 'tes-keyboard', 'konverter-sensitivitas-mouse'],
  'tes-sensor': ['tes-gps', 'tes-touchscreen', 'tes-baterai'],
  'tes-speaker': ['generator-nada-frekuensi', 'simulator-pita-suara', 'tes-mikrofon'],
  'tes-stick-drift': ['tes-gamepad', 'tes-mouse', 'tes-keyboard'],
  'tes-touchscreen': ['tes-layar', 'tes-gamepad', 'tes-mouse'],
  'tes-webcam': ['perekam-webcam', 'tes-kamera', 'info-metadata-video'],
  'timer-kontraksi': ['hitung-hpl', 'siklus-haid', 'kalkulator-biaya-punya-bayi'],
  'timer-masak': ['kalkulator-rasio-beras-air', 'pengganti-bahan-masakan', 'cooking-converter'],
  'ukuran-bra': ['ukuran-topi', 'bmi', 'lemak-tubuh'],
  'ukuran-sepeda': ['kalkulator-gear-sepeda', 'watt-sepeda', 'kalkulator-jangkauan-e-bike'],
  'ukuran-topi': ['ukuran-bra', 'ukuran-sepeda', 'kalkulator-kain'],
  'umur-anjing': ['umur-kucing', 'age-calc', 'berat-ideal-anjing'],
  'umur-kucing': ['umur-anjing', 'age-calc', 'usia-steril'],
  'usia-steril': ['cek-makanan-hewan', 'nama-hewan', 'umur-anjing'],
  'volume-akuarium': ['biaya-pelihara-ikan-hias', 'cek-makanan-hewan'],
  'waktu-bicara': ['pantun', 'word-counter'],
  'waktu-cas-baterai': ['tes-baterai', 'kalkulator-biaya-cas-mobil-listrik', 'diagnosis-hp-rusak'],
  'watt-sepeda': ['kalkulator-gear-sepeda', 'ukuran-sepeda', 'kalkulator-jangkauan-e-bike'],
  'zona-denyut-jantung': ['kalkulator-denyut-jantung-pemulihan', 'jadwal-latihan', 'kebutuhan-protein'],
  /* desain */
  'kontras': ['color-converter', 'simulator-buta-warna', 'palette'],
  'qr-decoder': ['qr-generator', 'qris-parser'],
  'qr-generator': ['qr-decoder', 'qris-parser'],
  /* converter */
  'color-converter': ['kontras', 'palette', 'gradient'],
  'qris-parser': ['qr-generator', 'qr-decoder'],
  /* musik */
  'konverter-audio': ['audio-trimmer', 'gabung-audio', 'video-ke-mp3'],
  /* teks */
  'dikte-suara': ['transkrip-audio-ke-teks', 'perekam-suara', 'word-counter'],
  'konverter-subtitle': ['konverter-audio', 'transkrip-audio-ke-teks'],
  'parafrase-teks-ai': ['penulis-artikel-ai', 'word-counter', 'sinonim-kata-terkait'],
  /* pelajar */
  'latihan-mengetik': ['typing-test', 'baca-cepat-bionik', 'tes-keyboard'],
  'tes-mengetik-kode': ['typing-test', 'latihan-mengetik', 'baca-cepat-bionik'],
  'worldclassics': ['buku-indonesia', 'cari-buku', 'puisi-klasik'],
};


/* ---------------- tag sekunder lintas-kategori (S-U3, v6.22.0, P2-2) ----------------
   Batas kategori kabur di 14 tool (audit S-A3 §2): satu field `cat` tidak cukup
   — qr-generator (desain) juga converter, konverter-audio (musik) juga converter.
   Tag ini TINGGAL DI SINI (bukan manifest): sync-manifest.js terbukti membuang
   field manifest yang tidak dikenal (uji round-trip S-U3 di salinan: tags +
   edit keywords langsung di manifest hilang sesudah sync; bump-version.py
   menjalankan sync, jadi edit manifest langsung tidak tahan lama). Skema
   meta-level `tags` (pola S-U8) adalah utang ronde mendatang; sampai saat itu
   peta ini adalah sumber kebenaran tag sekunder, dipakai relatedTools() di bawah.
   Nilai = id kategori yang juga cocok, dari fungsi tool (bukan tebakan). */
const SECONDARY_TAGS = {
  'qr-generator': ['converter'],
  'qr-decoder': ['converter'],
  'qris-parser': ['desain', 'keamanan'],
  'color-converter': ['desain'],
  'kontras': ['converter'],
  'konverter-audio': ['converter'],
  'image-convert': ['converter'],
  'konverter-subtitle': ['converter', 'musik'],
  'dikte-suara': ['musik', 'sehari'],
  'typing-test': ['teks', 'produktivitas'],
  'latihan-mengetik': ['teks', 'produktivitas'],
  'tes-mengetik-kode': ['teks', 'produktivitas'],
  'worldclassics': ['teks', 'liveapi'],
  'pdflab': ['converter'],
};

/* ---------------- "Yang mirip" (S-U3, v6.22.0, P1-2) ----------------
   Pengganti 4-alfabetis pertama di toolPage (app.js): urutan relevansi dari
   data yang sudah ada, tanpa data baru.
   (1) Rantai NEXT kurasi dulu — paling relevan karena ditulis manusia.
   (2) Skor tumpang-tindih token keywords/nama/id (+3 bila kategori lawan
       cocok dengan tag sekunder — inilah yang menemukan qris-parser dari
       qr-generator lintas kategori; +2 bila kategori sama).
   (3) Isi sisa dengan kategori yang sama alfabetis (perilaku lama, hanya
       sebagai pengisi — bukan lagi sumber utama).
   Deterministik (skor lalu id), tanpa tool tersembunyi (SEARCH_DENY),
   tanpa diri sendiri. Dipakai toolPage() via spek S-Q8 — wiring-nya bukan
   di file ini.
   Anti-false-positive (terbukti di tes S-U3): bonus tag sekunder HANYA
   berlaku bila ada ≥1 token bersama — tanpanya, SEMUA tool di kategori
   yang di-tag ikut terangkat (bagi-file sempat muncul untuk kontras,
   qris-parser untuk palette, padahal 0 token bersama). Token generik
   (massal, gratis, kalkulator, cek) masuk stopword karena tidak membedakan. */
const REL_STOP = new Set(['kalkulator', 'generator', 'pembuat', 'hitung', 'cek', 'alat', 'dan', 'yang', 'untuk', 'dengan', 'dari', 'ke', 'di', 'atau', 'cara', 'massal', 'bulk', 'gratis']);
const relTokenCache = new Map();
let relTokenVersion = manifestDetailsVersion;
function relTokens(m) {
  /* S-U5 (v6.22.0, manifest split): token dihitung dari keywords —
     begitu detail ditempel (versi berubah), cache lama yang hanya
     berisi token nama+id dibuang supaya relatedTools memakai
     keywords penuh. */
  if (relTokenVersion !== manifestDetailsVersion) {
    relTokenCache.clear();
    relTokenVersion = manifestDetailsVersion;
  }
  const hit = relTokenCache.get(m.id);
  if (hit) return hit;
  const out = new Set();
  for (const k of String(m.keywords || '').split(',')) {
    const t = k.trim().toLowerCase();
    if (t && !REL_STOP.has(t)) out.add(t);
  }
  for (const w of String(m.name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)) {
    if (w.length > 2 && !REL_STOP.has(w)) out.add(w);
  }
  for (const w of String(m.id || '').split('-')) {
    if (w.length > 2 && !REL_STOP.has(w)) out.add(w);
  }
  relTokenCache.set(m.id, out);
  return out;
}
function relatedTools(id, n = 4) {
  const m = byId(id);
  if (!m) return [];
  const out = [];
  const seen = new Set([id, ...SEARCH_DENY]);
  const push = (x) => {
    if (!x || seen.has(x.id)) return;
    seen.add(x.id);
    out.push(x);
  };
  for (const nid of (NEXT[id] || [])) push(byId(nid));
  if (out.length < n) {
    const aTok = relTokens(m);
    const scored = visibleTools()
      .filter((x) => !seen.has(x.id))
      .map((x) => {
        let kw = 0;
        const bTok = relTokens(x);
        for (const t of aTok) if (bTok.has(t)) kw += 3;
        if (kw === 0) return { x, s: 0 };
        let s = kw;
        if (x.cat === m.cat) s += 2;
        const aTags = SECONDARY_TAGS[m.id] || [];
        const bTags = SECONDARY_TAGS[x.id] || [];
        if (aTags.includes(x.cat) || bTags.includes(m.cat)) s += 3;
        return { x, s };
      })
      .filter((e) => e.s >= 4)
      .sort((a, b) => b.s - a.s || a.x.id.localeCompare(b.x.id));
    for (const e of scored) {
      if (out.length >= n) break;
      push(e.x);
    }
  }
  if (out.length < n) {
    for (const x of visibleTools()) {
      if (out.length >= n) break;
      if (x.cat === m.cat && !seen.has(x.id)) push(x);
    }
  }
  return out.slice(0, n);
}

/* ---------------- sub-kelompok tampilan kategori besar (S-U3, v6.22.0, P2-1) ----------------
   Pengelompokan TAMPILAN saja di halaman #/k/<id> — field `cat` di manifest TIDAK
   berubah (mengubahnya mengguncang router/sitemap/1.262 file). Partisi: tiap tool
   masuk TEPAT SATU subgrup; tumpang-tindih yang masuk akal dicatat di
   SUBGROUP_OVERLAPS (bukan digandakan tampilannya). Klaster dari audit S-A3 §3
   (dihitung dari manifest nyata); hitungan akhir adalah hasil partisi, bukan
   salinan angka audit yang tumpang-tindih: liveapi 64/35/40, bisnis
   21/20/34/10/30/9, desain 17/7/7/2/11/13. Rendering di catPage() = spek S-Q8. */
const SUBGROUPS = {
  liveapi: [
    { id: 'data', label: 'Data & referensi', tools: ['akhir-dukungan-software', 'apod-harian', 'arsip-foto-nasa', 'arsip-library-of-congress', 'arsip-web', 'artikel-dev-terbaru', 'ayat-alkitab', 'baca-quran', 'berita-antariksa', 'berita-hacker-news', 'buku-indonesia', 'cari-buku', 'cari-jurnal-paper', 'cari-sekolah', 'data-bisbol-mlb', 'data-blockchain-bitcoin', 'data-covid-19-flu', 'data-digimon', 'data-dnd-5e', 'data-dota-2', 'data-f1-live', 'data-indonesia', 'data-matahari-iklim', 'data-satelit-tle', 'data-spesies-dunia', 'data-valorant', 'ensiklopedia-star-wars', 'film-baru-streaming', 'film-studio-ghibli', 'galeri-met', 'galeri-seni', 'hadits-arbain', 'hari-libur', 'info-crate-rust', 'info-cve', 'info-emoji', 'info-kopi', 'info-makanan', 'info-modul-go', 'info-musik-artis', 'info-obat-fda', 'info-paket-dotnet', 'info-paket-npm', 'info-paket-python', 'info-serial-tv', 'info-tim-olahraga', 'jurnal-medis', 'kamus-inggris', 'karakter-avatar', 'karakter-disney', 'karakter-rick-morty', 'kartu-magic-mtg', 'kartu-yu-gi-oh', 'kode-pos-dunia', 'kode-pos-indonesia', 'observasi-alam', 'pemenang-nobel', 'posisi-iss', 'puisi-klasik', 'ringkasan-wikipedia', 'sinonim-kata-terkait', 'tafsir-quran', 'uji-klinis', 'wilayah-indonesia'] },
    { id: 'hiburan', label: 'Hiburan & acak', tools: ['anjing-random', 'cari-adegan-anime', 'cari-aktivitas-acak', 'cari-lagu-film-app', 'diskon-game-pc', 'emoji-github', 'fakta-kucing', 'fakta-tak-berguna', 'foto-acak', 'game-gratis', 'kartu-remi', 'kelinci-acak', 'kucing-acak', 'kucing-status-http', 'kucing-teks', 'lelucon-acak', 'lelucon-bapak-bapak', 'lelucon-chuck-norris', 'lelucon-geek', 'lirik-lagu', 'pesan-commit-acak', 'pokemon-viewer', 'profil-catur-chess-com', 'quotes-kanye-west', 'quotes-random', 'quotes-ron-swanson', 'radio-online', 'resep-koktail', 'resep-makanan', 'rubah-acak', 'saran-random', 'status-server-minecraft', 'tebak-nama', 'teka-teki-catur-harian', 'template-meme-populer'] },
    { id: 'utilitas', label: 'Utilitas live', tools: ['ambil-favicon-situs', 'avatar-inisial', 'banjir-sungai', 'bencana-alam-global', 'cari-foto-gratis-cc', 'cari-ikon-svg', 'cari-lokasi', 'cek-email-bocor', 'cek-email-sekali-pakai', 'cek-kerentanan-paket', 'cek-username', 'cuaca-antariksa-aurora', 'cuaca-arsip', 'cuaca-bmkg', 'gempa-bmkg', 'gempa-dirasakan', 'gempa-dunia-terkini', 'generator-data-dummy', 'github-profile', 'harga-crypto', 'harga-emas-live', 'info-domain-rdap', 'ip-saya', 'jadwal-peluncuran-roket', 'jadwal-sholat', 'jawab-cepat', 'kalkulator-ekspresi', 'ketinggian-lokasi', 'kualitas-udara', 'kurs-cuaca', 'lowongan-kerja-eropa-remote', 'lowongan-kerja-remote', 'pemendek-url', 'penerjemah', 'penyelesaian-matematika', 'prakiraan-gelombang-laut', 'rute-jarak-perjalanan', 'sertifikat-ssl-domain', 'skor-keamanan-repo', 'terbit-terbenam', 'tes-kecepatan-internet'] },
  ],
  bisnis: [
    { id: 'investasi', label: 'Investasi & saham', tools: ['fee-broker-saham', 'kalkulator-aturan-72', 'kalkulator-cagr', 'kalkulator-capm-beta', 'kalkulator-dca', 'kalkulator-dcf', 'kalkulator-dividen', 'kalkulator-eps-rasio-p-e', 'kalkulator-fibonacci-retracement', 'kalkulator-harga-wajar-saham-graham-number', 'kalkulator-impermanent-loss', 'kalkulator-margin-of-safety', 'kalkulator-mirr', 'kalkulator-npv-irr', 'kalkulator-obligasi-yield-ytm', 'kalkulator-roi', 'kalkulator-rsi', 'kalkulator-sharpe-ratio', 'kalkulator-stock-split', 'kalkulator-ukuran-posisi', 'kalkulator-wacc'] },
    { id: 'properti', label: 'Properti & pinjaman', tools: ['kalkulator-cap-rate-properti', 'kalkulator-cash-on-cash', 'kalkulator-harga-per-meter-persegi', 'kalkulator-kenaikan-sewa', 'kalkulator-loan-to-value', 'kalkulator-rumah', 'kalkulator-sewa-properti', 'kpr', 'simulasi-kur', 'beli-vs-sewa', 'kalkulator-anuitas', 'kalkulator-bunga-efektif-tahunan-ear-apy', 'kalkulator-bunga-sederhana', 'kalkulator-nilai-sekarang-present-value', 'kalkulator-lunasi-utang', 'kalkulator-pelunasan-kartu-kredit', 'kalkulator-rasio-utang-terhadap-pendapatan-dti', 'kalkulator-dscr', 'biaya-paylater', 'generator-deskripsi-properti'] },
    { id: 'harga', label: 'Harga & jualan', tools: ['banding-harga', 'daftar-harga', 'diskon-aman', 'fee-lazada', 'food-cost', 'harga-bundling', 'harga-coret', 'harga-grosir', 'harga-jual-delivery', 'harga-jual-marketplace', 'kalkulator-biaya-paypal', 'kalkulator-cac', 'kalkulator-churn-rate', 'kalkulator-conversion-rate', 'kalkulator-cpc-cpm-iklan', 'kalkulator-ctr', 'kalkulator-engagement', 'kalkulator-hitung-uang-tunai', 'kalkulator-hpp', 'kalkulator-komisi', 'kalkulator-margin-kontribusi', 'kalkulator-nilai-pelanggan', 'kalkulator-ppn', 'kalkulator-preorder', 'kartu-stempel', 'komisi-reseller', 'margin-markup', 'rate-card-endorse', 'roas-iklan', 'struk-belanja', 'target-omzet', 'uji-signifikansi-ab', 'berat-volumetrik', 'estimasi-penghasilan-kreator'] },
    { id: 'gaji', label: 'Gaji & pajak', tools: ['banding-gaji', 'cuti-prorata', 'denda-pajak', 'gaji-prorata', 'kalkulator-gaji-bersih', 'kalkulator-gaji-freelance', 'kalkulator-kenaikan-gaji', 'konverter-gaji', 'penghasilan-ojol', 'slip-gaji'] },
    { id: 'usaha', label: 'Usaha & dokumen', tools: ['analisis-swot', 'bep-umkm', 'buat-invoice', 'cara-bilang-profesional', 'estimasi-modal-usaha', 'generator-copy-landing-page', 'generator-faq', 'generator-headline-iklan-fb', 'generator-nda', 'generator-press-release', 'generator-rencana-bisnis', 'generator-slogan-bisnis', 'kalkulator-biaya-peluang', 'kalkulator-ebitda', 'kalkulator-eoq', 'kalkulator-fifo-lifo', 'kalkulator-modal-kerja', 'kalkulator-penyusutan-aset-depresiasi', 'kalkulator-perputaran-persediaan', 'kalkulator-rasio-lancar-cepat', 'kalkulator-roe-roa', 'kalkulator-runway-usaha', 'kalkulator-safety-stock', 'kalkulator-siklus-konversi-kas', 'kwitansi', 'laporan-laba-rugi', 'nama-brand', 'penulis-cold-email', 'simulasi-franchise', 'surat-jalan'] },
    { id: 'pribadi', label: 'Keuangan pribadi', tools: ['anggaran-50-30-20', 'kalkulator-cashflow', 'kalkulator-dana-pendidikan', 'kalkulator-fire', 'kalkulator-inflasi', 'kalkulator-kekayaan-bersih-net-worth', 'kalkulator-sinking-fund', 'kalkulator-tabungan', 'simulasi-deposito'] },
  ],
  desain: [
    { id: 'css', label: 'CSS & komponen', tools: ['animasi-css', 'boxshadow', 'clamp', 'clip-path-generator', 'css-grid-generator', 'generator-checkbox-css', 'generator-efek-glitch-teks', 'generator-glassmorphism-css', 'generator-loader-css', 'generator-segitiga-css', 'generator-switch-css', 'neumorphism', 'radius-playground', 'komponen-wireframe', 'skala-tipografi', 'motioncontrol', 'teks-gradien'] },
    { id: 'warna', label: 'Warna', tools: ['analisis-musim-warna', 'generator-gradasi-warna', 'gradient', 'kontras', 'palette', 'pencampur-warna', 'simulator-buta-warna'] },
    { id: 'alight', label: 'Alight Motion', tools: ['text2d', 'text3d', 'textvector', 'trimpath', 'svgalight', 'logoanimate', 'textfxanimation'] },
    { id: 'qr', label: 'QR & kode', tools: ['qr-generator', 'qr-decoder'] },
    { id: 'font', label: 'Font & grafis', tools: ['bentuk-blob-svg', 'font-dari-tulisan-tangan', 'galeri-font-google', 'generator-string-art', 'harmonograph', 'paduan-font', 'pembuat-pola-perler-bead', 'pembuat-pola-sulam', 'pola-svg', 'spirograph', 'svg-stroke-ke-fill'] },
    { id: 'aset', label: 'Aset & mockup', tools: ['chart-maker', 'code-to-image', 'favicon-generator', 'htmlvideo', 'kalkulator-rasio-emas', 'mockup-hp', 'novelcover', 'pembuat-landing-page', 'pembuat-stempel', 'placeholderstudio', 'projection-mapping', 'ukuran-konten-sosmed', 'ukuran-standar'] },
  ],
};
const SUBGROUP_OVERLAPS = {
  'karakter-avatar': ['hiburan'],
  'karakter-disney': ['hiburan'],
  'karakter-rick-morty': ['hiburan'],
  'kartu-magic-mtg': ['hiburan'],
  'kartu-yu-gi-oh': ['hiburan'],
  'data-digimon': ['hiburan'],
  'data-dnd-5e': ['hiburan'],
  'data-dota-2': ['hiburan'],
  'data-valorant': ['hiburan'],
  'ensiklopedia-star-wars': ['hiburan'],
  'film-studio-ghibli': ['hiburan'],
  'film-baru-streaming': ['hiburan'],
  'galeri-met': ['hiburan'],
  'galeri-seni': ['hiburan'],
  'resep-makanan': ['data'],
  'resep-koktail': ['data'],
  'lirik-lagu': ['data'],
  'cari-lagu-film-app': ['utilitas'],
  'kucing-status-http': ['utilitas'],
  'harga-crypto': ['data'],
  'harga-emas-live': ['data'],
  'kurs-cuaca': ['data'],
  'lowongan-kerja-remote': ['data'],
  'lowongan-kerja-eropa-remote': ['data'],
  'jadwal-peluncuran-roket': ['data'],
  'kalkulator-npv-irr': ['usaha'],
  'kalkulator-mirr': ['usaha'],
  'kalkulator-dcf': ['usaha'],
  'kalkulator-wacc': ['usaha'],
  'kalkulator-roi': ['usaha'],
  'kalkulator-ppn': ['gaji'],
  'estimasi-penghasilan-kreator': ['gaji'],
  'beli-vs-sewa': ['pribadi'],
  'kpr': ['pribadi'],
  'kalkulator-dscr': ['usaha'],
  'generator-deskripsi-properti': ['usaha'],
  'kalkulator-fire': ['investasi'],
  'kalkulator-inflasi': ['investasi'],
  'kalkulator-cashflow': ['usaha'],
  'kalkulator-biaya-peluang': ['investasi'],
  'teks-gradien': ['warna'],
  'generator-string-art': ['warna'],
  'paduan-font': ['css'],
};
/* Kembalikan { cat, group } subgrup utama satu tool, atau null bila kategorinya
   tidak punya subgrup. */
const subgroupOf = (id) => {
  const m = byId(id);
  if (!m) return null;
  const groups = SUBGROUPS[m.cat];
  if (!groups) return null;
  const group = groups.find((g) => g.tools.includes(id));
  return group ? { cat: m.cat, group } : null;
};
const subgroupsFor = (cat) => SUBGROUPS[cat] || null;

/* ---------------- metodologi (v6.12.0, ide UX #13) ----------------
   Rumus & asumsi tiap kalkulator — ditulis dari kode tool-nya sendiri
   (bukan dari ingatan). Tool di halaman tool mendapat tautan "Cara hitungnya"
   bila id-nya ada di sini.
   Glos inline (S-F10 v6.22.0, C-02): istilah teknis dijelaskan di
   dalam kurung saat pertama muncul — pembaca tidak perlu mencari
   artinya di tempat lain. */
const METHOD = [
  { id: 'thr', rumus: 'Masa kerja 12 bulan atau lebih → THR 1× gaji sebulan. Kurang dari 12 bulan → (masa kerja ÷ 12) × gaji.', batas: 'Gaji yang dipakai adalah gaji pokok + tunjangan tetap yang kamu isi. Aturan THR Keagamaan: pekerja dengan masa kerja 1 bulan ke atas berhak THR; kebijakan kantormu bisa berbeda. Tanya HRD.' },
  { id: 'pph21', rumus: 'Januari-November: PPh 21 = bruto (gaji kotor sebelum dipotong) sebulan × TER (Tarif Efektif Rata-rata, cara hitung pajak bulanan menurut PP 58/2023), tanpa mengurangi biaya jabatan (potongan 5% untuk biaya bekerja) atau PTKP (batas penghasilan yang tidak kena pajak) dulu. Desember: dihitung ulang setahun penuh dengan tarif progresif 5%-35% atas Penghasilan Kena Pajak, yaitu bagian gaji yang dihitung pajaknya (bruto − biaya jabatan 5%, maks Rp500rb/bulan − iuran pensiun − PTKP), dikurangi pajak yang sudah dibayar. PTKP untuk yang belum menikah dan tanpa tanggungan (TK/0) Rp54 juta/tahun (PMK 101/2016).', batas: 'Hanya untuk pegawai tetap. Bonus, THR, dan penghasilan lain di bulan itu ikut menambah bruto. Bukan pengganti perhitungan resmi kantor pajak.' },
  { id: 'kalkulator-gaji-bersih', rumus: 'Gaji bersih = bruto (gaji kotor sebelum dipotong) − BPJS Kesehatan 1% − JHT (Jaminan Hari Tua) 2% − PPh 21 (pajak gaji, dihitung pakai TER) − potongan lain. Persentase BPJS/JHT bisa diubah dan tersimpan di perangkatmu. Mode gross-up (menghitung gaji kotor dari gaji bersih yang kamu mau) mencoba-coba angka bruto sampai hasil bersihnya sama dengan target yang kamu mau.', batas: 'Persentase BPJS/JHT bawaan mengikuti aturan umum; cek slip gajimu bila kantormu memakai tarif berbeda. TER berlaku untuk pegawai tetap.' },
  { id: 'kpr', rumus: 'Anuitas (cicilan tetap tiap bulan): cicilan = pokok × r ÷ (1 − (1+r)^−n), dengan r = bunga tahunan ÷ 12. Bunga tiap bulan dihitung dari sisa pokok, jadi porsi pokok membesar seiring waktu. Flat (bunga tetap dari pokok awal): total bunga = pokok × bunga% × tahun, cicilan = (pokok + total bunga) ÷ bulan. Pembayaran ekstra dianggap langsung memotong pokok.', batas: 'Simulasi bunga tetap. Bank biasanya memakai bunga tetap (fixed) beberapa tahun pertama lalu bunga mengambang (floating), jadi cicilan sebenarnya bisa berubah. Belum termasuk denda pelunasan dipercepat; cek ketentuan bankmu.' },
  { id: 'cicilan', rumus: 'Sama seperti Simulasi KPR: anuitas (cicilan tetap tiap bulan) memakai cicilan = pokok × r ÷ (1 − (1+r)^−n), r = bunga tahunan ÷ 12; flat (bunga tetap dari pokok awal) memakai total bunga = pokok × bunga% × (bulan ÷ 12). Pembayaran ekstra masuk ke pokok sehingga tenor (jangka waktu cicilan) memendek dan total bunga berkurang.', batas: 'Bunga tetap selama tenor. Biaya admin, provisi (biaya layanan bank), dan asuransi tidak dihitung.' },
  { id: 'kalkulator-pesangon', rumus: 'Versi sederhana dari PP 35/2021 (aturan pemerintah soal pesangon). UP (Uang Pesangon): 1-9× upah sesuai masa kerja (di bawah 1 tahun 1×, 8 tahun ke atas 9×). UPMK (Uang Penghargaan Masa Kerja): 0-10× upah, mulai dari masa kerja 3 tahun. UPH (Uang Penggantian Hak): 15% × (UP + UPMK). Pengali UP menurut alasan: PHK biasa 1×, efisiensi 0,5×, pensiun 1,75×, meninggal 2×.', batas: 'Ilustrasi saja. UPH di dunia nyata juga mencakup cuti yang belum diambil dan ongkos pulang. Konsultasikan ke HRD atau serikat pekerja untuk angka pastinya.' },
  { id: 'hitung-lembur', rumus: 'Upah per jam = gaji ÷ 173 (rata-rata jam kerja dalam sebulan). Hari kerja: jam ke-1 dibayar 1,5× upah per jam, jam berikutnya 2×. Hari libur: 7 jam pertama 2×, jam ke-8 3×, jam ke-9 ke atas 4×.', batas: 'Rumus umum; ketentuan lembur di hari libur dan detailnya bisa beda per perusahaan. Cek PP (peraturan perusahaan) atau PKB (perjanjian kerja bersama) tempatmu kerja.' },
  { id: 'gaji-prorata', rumus: 'Upah harian = gaji ÷ 21 (sistem 5 hari kerja) atau ÷ 25 (sistem 6 hari kerja), sesuai PP 36/2021 Pasal 17 (aturan pemerintah soal upah). Gaji prorata = upah harian × jumlah hari kerja dalam periode itu, dihitung dari kalender bulan berjalan.', batas: 'Libur nasional belum dikurangi dari hitungan hari kerja. Bila kantormu memakai cara lain (mis. gaji ÷ 30 hari kalender), hasilnya bisa beda.' },
  { id: 'kalkulator-hpp', rumus: 'HPP (Harga Pokok Penjualan) per unit = (biaya material + tenaga kerja + overhead (biaya lain-lain, mis. listrik dan sewa)) ÷ jumlah unit. Saran harga jual = HPP ÷ (1 − margin%). Margin (keuntungan) dihitung dari harga jual, bukan dari modal.', batas: 'Hanya menghitung biaya yang kamu isi. Biaya tak terduga, susut (barang rusak atau hilang), dan pajak belum masuk. Tambahkan sendiri ke overhead bila perlu.' },
  { id: 'bmi', rumus: 'BMI = berat (kg) ÷ tinggi (m)². Kategori memakai standar WHO untuk Asia: di bawah 18,5 kurus; 18,5-22,9 normal; 23-24,9 kelebihan berat; 25-29,9 obesitas I; 30 ke atas obesitas II. BMR (kalori yang dibakar tubuh saat istirahat) dihitung pakai rumus Mifflin-St Jeor; TDEE (total kalori harian) = BMR × faktor aktivitas (1,2-1,9). Target turun berat memakai defisit 500 kkal/hari (makan 500 kkal lebih sedikit dari yang dibakar tubuh, sekitar 0,5 kg/minggu).', batas: 'BMI tidak membedakan otot dan lemak, jadi orang berotot bisa terbaca "kelebihan berat" padahal sehat. BMR/TDEE adalah perkiraan; konsultasikan ke tenaga kesehatan untuk target yang personal.' },
  { id: 'hitung-hpl', rumus: 'Tiga mode. Dari HPHT (hari pertama haid terakhir) memakai rumus Naegele (rumus standar): HPHT + 7 hari − 3 bulan + 1 tahun. Dari USG (pemeriksaan gambar janin): tanggal USG + sisa hari sampai 40 minggu (280 hari). Dari transfer embrio IVF (bayi tabung): tanggal transfer + (280 − 14 − umur embrio) hari. Perkembangan janin per minggu memakai perkiraan rata-rata umum.', batas: 'HPL (perkiraan tanggal lahir) hanya perkiraan. Hanya sebagian kecil persalinan yang tepat di tanggal HPL. Usia kehamilan dari USG trimester awal lebih akurat daripada dari HPHT bila siklus haid tidak teratur.' },
  { id: 'zakat', rumus: 'Nisab (batas minimal harta yang wajib dizakati) untuk zakat maal (zakat harta) = 85 gram emas × harga emas per gram yang kamu isi. Bila total harta mencapai nisab, zakatnya 2,5% dari harta. Zakat fitrah = 2,5 kg beras per jiwa × harga beras.', batas: 'Harga emas bawaan Rp2.500.000/gram (harga Antam 20 Nov 2026). Harga emas berubah tiap hari, cek harga saat ini agar nisabnya akurat. Harta yang dihitung adalah yang sudah dimiliki setahun (haul); konsultasikan ke lembaga zakat bila ragu.' },
];
const METHOD_IDS = new Set(METHOD.map((x) => x.id));

export {
  SEARCH_DENY, CATS, CAT_ICON, catLabel, byId, visibleTools, isNew, isOnline,
  COLLECTIONS, collectionById, NEXT, METHOD, METHOD_IDS,
  SECONDARY_TAGS, relatedTools, SUBGROUPS, SUBGROUP_OVERLAPS, subgroupOf, subgroupsFor,
};
