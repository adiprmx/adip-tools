/* ============================================================
   ADIP Tools v6.0 — app shell + router (liquid glass edition)
   Tetap murni: vanilla JS, tanpa framework, tanpa build step.

   STRUKTUR BARU v6 (anti scroll-fatigue):
   - Beranda PENDEK: hero sapaan + search besar, kartu "Lanjutkan",
     carousel Populer, grid Kategori 4 kolom, carousel Riwayat,
     tombol "Semua tools", footer 1 baris.
   - Direktori vertikal pindah ke view #/semua (dengan filter)
     dan #/k/<kategori> (view per kategori).
   - Hero search mengetik -> lompat ke #/semua?q=...

   YANG TIDAK BERUBAH dari v5.2:
   - Smart search (typo-tolerant + keyword + prioritas judul, v4.5.1)
   - Favorit + riwayat localStorage (format [{id,t}], auto-migrasi)
   - Command palette (Ctrl+K), shortcut "/" fokus search
   - Tracking pencarian populer via Supabase (best-effort)
   - Kontrak: tool = 1 file; tool dilarang import tool lain;
     fungsi bersama -> core.js; manifest.js generated (jangan edit manual).

   TAMBAHAN v6.12.0 (riset 13 Nov 2026 bag. 3, ide UX #7/#8/#9/#13):
   - Koleksi berdasarkan masalah di beranda (#/c/<id>)
   - Rantai "Lanjut ke" di halaman tool (peta NEXT)
   - Filter "Favorit" di #/semua + tombol ♥ di palette
   - Halaman Metodologi (#/metodologi, anchor per tool)
   ============================================================ */
import { manifest, VERSION } from './manifest.js?v=6.12.2';
import * as T from './core.js?v=6.12.2';
import { renderBaru, renderCatIntro, pickRandomTool, acakButtonHTML } from './beranda.js?v=6.12.2';
import { recentRailHTML, prevToolChip, catMoreLink } from './detail-riwayat.js?v=6.12.2';
import { initSeoShare, bindShareButtons, shareButtonHTML } from './seo-share.js?v=6.12.2';
import { rankedSearchPlus, assessQuery, suggestDidYouMean, getRecentSearches, addRecentSearch } from './search-plus.js?v=6.12.2';

const SB_URL = 'https://jebafddwupyqpwevhsqn.supabase.co';
const SB_ANON = 'sb_publishable_rxxzONDsxTmmsHiQgaptjg_7zbG5qeT';
const SEARCH_DENY = ['muse-test'];

const CATS = [
  ['semua','Semua'],['keamanan','Keamanan'],['converter','Converter'],['developer','Dev & Web'],
  ['desain','Desain'],['indonesia','Indonesia'],['musik','Musik'],['gambar','Gambar'],
  ['teks','Teks'],['bisnis','Bisnis'],['sehari','Sehari-hari'],['fun','Fun'],
  ['produktivitas','Produktivitas'],['pelajar','Pelajar'],['liveapi','Live API'],
  ['fakesos','Fake Sosmed'],
];
const CAT_ICON = {
  keamanan: '🔐', converter: '🔁', developer: '🧑‍💻', desain: '🎨', indonesia: '🇮🇩',
  musik: '🎧', gambar: '🖼️', teks: '🔤', bisnis: '💼', sehari: '🏠',
  fun: '🎲', produktivitas: '⚡', pelajar: '📚', liveapi: '🌐', semua: '🧰',
  fakesos: '🎭',
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
  { id: 'jualan-online', icon: '🛍️', name: 'Buat jualan online', desc: 'Hitung harga jual, diskon, fee marketplace, sampai invoice rapi.', tools: ['daftar-harga', 'harga-jual', 'kalkulator-hpp', 'food-cost', 'fee-lazada', 'diskon-aman', 'harga-coret', 'harga-bundling', 'harga-grosir', 'buat-invoice', 'generator-hashtag', 'komisi-reseller'] },
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
  'gaji-prorata': ['cuti-prorata', 'kalkulator-lembur'],
  'cuti-prorata': ['gaji-prorata', 'kalkulator-pesangon'],
  'kalkulator-lembur': ['gaji-prorata', 'kalkulator-gaji-bersih'],
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
  'harga-jual': ['kalkulator-hpp', 'diskon-aman', 'harga-coret'],
  'kalkulator-hpp': ['food-cost', 'harga-jual', 'bep-umkm'],
  'food-cost': ['harga-jual', 'kalkulator-hpp'],
  'fee-lazada': ['harga-jual', 'komisi-reseller', 'diskon-aman'],
  'diskon-aman': ['harga-coret', 'harga-jual'],
  'harga-coret': ['diskon-aman', 'harga-bundling'],
  'harga-bundling': ['harga-coret', 'diskon-aman'],
  'harga-grosir': ['harga-bundling', 'komisi-reseller'],
  'komisi-reseller': ['fee-lazada', 'target-omzet'],
  'bep-umkm': ['estimasi-modal-usaha', 'target-omzet'],
  'estimasi-modal-usaha': ['bep-umkm', 'target-omzet'],
  'target-omzet': ['reorder-point', 'komisi-reseller'],
  'reorder-point': ['target-omzet', 'harga-grosir'],
  'buat-invoice': ['daftar-harga', 'harga-jual', 'fee-lazada'],
  'date-duration': ['kalkulator-umur', 'hitung-hpl'],
  'kalkulator-umur': ['date-duration', 'hitung-hpl'],
  'hitung-hpl': ['kalkulator-umur', 'date-duration'],
  'weton': ['kalender-jawa'],
  'kalender-jawa': ['weton'],
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
  'wilayah-indonesia': ['data-indonesia', 'weton', 'kalender-jawa'],
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
  { id: 'thr', rumus: 'Masa kerja 12 bulan atau lebih → THR 1× gaji sebulan. Kurang dari 12 bulan → (masa kerja ÷ 12) × gaji.', batas: 'Gaji yang dipakai adalah gaji pokok + tunjangan tetap yang kamu isi. Aturan THR Keagamaan: pekerja dengan masa kerja 1 bulan ke atas berhak THR; kebijakan kantormu bisa berbeda — tanya HRD.' },
  { id: 'pph21', rumus: 'Januari–November: PPh 21 = bruto sebulan × TER (Tarif Efektif Rata-rata, PP 58/2023), tanpa mengurangi biaya jabatan atau PTKP dulu. Desember: dihitung ulang setahun penuh dengan tarif progresif 5%–35% atas Penghasilan Kena Pajak (bruto − biaya jabatan 5%, maks Rp500rb/bulan − iuran pensiun − PTKP), dikurangi pajak yang sudah dibayar. PTKP TK/0 Rp54 juta/tahun (PMK 101/2016).', batas: 'Hanya untuk pegawai tetap. Bonus, THR, dan penghasilan lain di bulan itu ikut menambah bruto. Bukan pengganti perhitungan resmi kantor pajak.' },
  { id: 'kalkulator-gaji-bersih', rumus: 'Gaji bersih = bruto − BPJS Kesehatan 1% − JHT 2% − PPh 21 (TER) − potongan lain. Persentase BPJS/JHT bisa diubah dan tersimpan di perangkatmu. Mode gross-up mencari bruto lewat iterasi sampai hasil bersihnya sama dengan target yang kamu mau.', batas: 'Persentase BPJS/JHT default mengikuti aturan umum; cek slip gajimu bila kantormu memakai tarif berbeda. TER berlaku untuk pegawai tetap.' },
  { id: 'kpr', rumus: 'Anuitas: cicilan = pokok × r ÷ (1 − (1+r)^−n), dengan r = bunga tahunan ÷ 12. Bunga tiap bulan dihitung dari sisa pokok, jadi porsi pokok membesar seiring waktu. Flat: total bunga = pokok × bunga% × tahun, cicilan = (pokok + total bunga) ÷ bulan. Pembayaran ekstra diasumsikan langsung memotong pokok.', batas: 'Simulasi bunga tetap. Bank biasanya memakai bunga fixed beberapa tahun pertama lalu floating — cicilan aktual bisa berubah. Belum termasuk denda pelunasan dipercepat; cek ketentuan bankmu.' },
  { id: 'cicilan', rumus: 'Sama seperti Simulasi KPR: anuitas memakai cicilan = pokok × r ÷ (1 − (1+r)^−n), r = bunga tahunan ÷ 12; flat memakai total bunga = pokok × bunga% × (bulan ÷ 12). Pembayaran ekstra masuk ke pokok sehingga tenor memendek dan total bunga berkurang.', batas: 'Bunga tetap selama tenor. Biaya admin, provisi, dan asuransi tidak dihitung.' },
  { id: 'kalkulator-pesangon', rumus: 'Versi sederhana PP 35/2021. UP (Uang Pesangon): 1–9× upah sesuai masa kerja (di bawah 1 tahun 1×, 8 tahun ke atas 9×). UPMK (Uang Penghargaan Masa Kerja): 0–10× upah, mulai dari masa kerja 3 tahun. UPH (Uang Penggantian Hak): 15% × (UP + UPMK). Pengali UP menurut alasan: PHK biasa 1×, efisiensi 0,5×, pensiun 1,75×, meninggal 2×.', batas: 'Ilustrasi saja — UPH di dunia nyata juga mencakup cuti yang belum diambil dan ongkos pulang. Konsultasikan ke HRD atau serikat pekerja untuk angka pastinya.' },
  { id: 'kalkulator-lembur', rumus: 'Upah per jam = gaji ÷ 173. Jam lembur ke-1 dibayar 1,5× upah per jam, jam berikutnya 2×.', batas: 'Rumus umum; ketentuan lembur di hari libur dan detailnya bisa beda per perusahaan — cek PP/PKB tempatmu kerja.' },
  { id: 'gaji-prorata', rumus: 'Upah harian = gaji ÷ 21 (sistem 5 hari kerja) atau ÷ 25 (sistem 6 hari kerja), sesuai PP 36/2021 Pasal 17. Gaji prorata = upah harian × jumlah hari kerja dalam periode itu, dihitung dari kalender bulan berjalan.', batas: 'Libur nasional belum dikurangi dari hitungan hari kerja. Bila kantormu memakai cara lain (mis. gaji ÷ 30 hari kalender), hasilnya bisa beda.' },
  { id: 'kalkulator-hpp', rumus: 'HPP per unit = (biaya material + tenaga kerja + overhead) ÷ jumlah unit. Saran harga jual = HPP ÷ (1 − margin%) — margin dihitung dari harga jual, bukan dari modal.', batas: 'Hanya menghitung biaya yang kamu isi. Biaya tak terduga, susut, dan pajak belum masuk — tambahkan sendiri ke overhead bila perlu.' },
  { id: 'bmi', rumus: 'BMI = berat (kg) ÷ tinggi (m)². Kategori memakai standar WHO untuk Asia: di bawah 18,5 kurus; 18,5–22,9 normal; 23–24,9 kelebihan berat; 25–29,9 obesitas I; 30 ke atas obesitas II. BMR memakai rumus Mifflin-St Jeor; TDEE = BMR × faktor aktivitas (1,2–1,9). Target turun berat memakai defisit 500 kkal/hari (sekitar 0,5 kg/minggu).', batas: 'BMI tidak membedakan otot dan lemak — orang berotot bisa terbaca "kelebihan berat" padahal sehat. BMR/TDEE adalah perkiraan; konsultasikan ke tenaga kesehatan untuk target yang personal.' },
  { id: 'hitung-hpl', rumus: 'Tiga mode. Dari HPHT memakai rumus Naegele: HPHT + 7 hari − 3 bulan + 1 tahun. Dari USG: tanggal USG + sisa hari sampai 40 minggu (280 hari). Dari transfer embrio IVF: tanggal transfer + (280 − 14 − umur embrio) hari. Perkembangan janin per minggu memakai perkiraan rata-rata umum.', batas: 'HPL adalah perkiraan — hanya sebagian kecil persalinan yang tepat di tanggal HPL. Usia kehamilan dari USG trimester awal lebih akurat daripada dari HPHT bila siklus haid tidak teratur.' },
  { id: 'zakat', rumus: 'Nisab zakat maal = 85 gram emas × harga emas per gram yang kamu isi. Bila total harta mencapai nisab, zakatnya 2,5% dari harta. Zakat fitrah = 2,5 kg beras per jiwa × harga beras.', batas: 'Harga emas default Rp2.517.000/gram (harga Antam 15 Nov 2026) — harga emas berubah tiap hari, cek harga saat ini agar nisabnya akurat. Harta yang dihitung adalah yang sudah dimiliki setahun (haul); konsultasikan ke lembaga zakat bila ragu.' },
];
const METHOD_IDS = new Set(METHOD.map((x) => x.id));

/* ---------------- sapaan waktu ---------------- */
function greet() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return 'Selamat pagi';
  if (h >= 11 && h < 15) return 'Selamat siang';
  if (h >= 15 && h < 19) return 'Selamat sore';
  return 'Selamat malam';
}
const timeAgo = (ts) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  return Math.floor(s / 86400) + ' hari lalu';
};

/* ---------------- supabase: tracking + populer ---------------- */
function sbHeaders() {
  return { 'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' };
}
const SB_POPULAR = [];
async function sbFetchPopular() {
  try {
    const r = await fetch(SB_URL + '/rest/v1/tool_search_terms?select=term&order=count.desc&limit=8', { headers: sbHeaders() });
    if (!r.ok) return;
    const data = await r.json();
    if (Array.isArray(data)) SB_POPULAR.push(...data.map((x) => String(x.term || x).trim()).filter(Boolean));
  } catch (e) { /* silent */ }
  renderPopuler();
}
async function sbTrack(q) {
  try {
    await fetch(SB_URL + '/rest/v1/rpc/track_search', {
      method: 'POST', headers: sbHeaders(),
      body: JSON.stringify({ p_term: q.toLowerCase().slice(0, 40) }),
    });
  } catch (e) { /* silent */ }
}
let sbT;
function sbTrackDeb(q) { clearTimeout(sbT); sbT = setTimeout(() => sbTrack(q), 1200); }

/* ---------------- favorit + riwayat ---------------- */
const FKEY = 'adip_fav', RKEY = 'adip_recent';
const loadJson = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : fb; } catch { return fb; } };
const saveJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
// migrasi otomatis format lama [id] -> [{id,t}]
const getFav = () => loadJson(FKEY, []).map((x) => (typeof x === 'string' ? { id: x, t: 0 } : x));
const isFav = (id) => getFav().some((x) => x.id === id);
function toggleFav(id) {
  let f = getFav();
  if (f.some((x) => x.id === id)) f = f.filter((x) => x.id !== id);
  else { f.unshift({ id, t: Date.now() }); if (f.length > 50) f.length = 50; }
  saveJson(FKEY, f);
}
const getRecent = () => loadJson(RKEY, []).map((x) => (typeof x === 'string' ? { id: x, t: 0 } : x));
function touchRecent(id) {
  let r = getRecent().filter((x) => x.id !== id);
  r.unshift({ id, t: Date.now() }); if (r.length > 20) r.length = 20;
  saveJson(RKEY, r);
}
let toastT;
function toast(msg) {
  const app = document.getElementById('app');
  let el = app.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); app.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
function bindFav(root) {
  root.querySelectorAll('.fav').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = b.dataset.id;
      toggleFav(id);
      const on = isFav(id);
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
      b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      toast(on ? 'Masuk favorit' : 'Dihapus dari favorit');
      if (document.body.dataset.route === 'fav') favPage();
    });
  });
}

/* ---------------- smart search (port v4.5.1, tidak diubah) ---------------- */
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  if (Math.abs(m - n) > 2) return 3;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function fuzzyScore(q, t) {
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;
  const dist = lev(q, t);
  if (q.length >= 4 && dist <= 1) return 55;
  if (q.length >= 5 && dist <= 2) return 40;
  let qi = 0, score = 0, last = -1;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) { score += last + 1 === ti ? 6 : 4; last = ti; qi++; }
  }
  return qi === q.length ? Math.min(30, score / q.length) : 0;
}
function wordScore(q, text) {
  const words = String(text).toLowerCase().split(/\s+/);
  let best = 0;
  for (const w of words) best = Math.max(best, fuzzyScore(q, w));
  return best;
}
function searchScore(q, m) {
  const name = m.name.toLowerCase();
  const desc = (m.desc || '').toLowerCase();
  const kws = String(m.keywords || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
  const nameHit = Math.max(fuzzyScore(q, name), wordScore(q, name));
  const descHit = Math.max(fuzzyScore(q, desc), wordScore(q, desc)) * 0.6;
  const kwHit = kws.reduce((a, k) => Math.max(a, Math.max(fuzzyScore(q, k), wordScore(q, k))), 0) * 0.8;
  return Math.max(nameHit, descHit, kwHit);
}
const FAV_BOOST = 8, REC_BOOST = 6, TITLE_BONUS = 12;
function searchCtx() { return { favIds: new Set(getFav().map((x) => x.id)), recIds: new Set(getRecent().map((x) => x.id)) }; }
function rankedSearch(q) {
  const ql = q.trim().toLowerCase();
  if (!ql) return visibleTools();
  const terms = ql.split(/\s+/);
  const ctx = searchCtx();
  return visibleTools()
    .map((m) => ({ m, s: Math.max(...terms.map((t) => searchScore(t, m))) }))
    .filter((x) => x.s > 15)
    .map((x) => ({
      m: x.m,
      s: x.s + (ctx.favIds.has(x.m.id) ? FAV_BOOST : 0) + (ctx.recIds.has(x.m.id) ? REC_BOOST : 0)
        + (x.m.name.toLowerCase().includes(ql) ? TITLE_BONUS : 0),
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 24)
    .map((x) => x.m);
}

/* ---------------- command palette ---------------- */
let palEl = null, palItems = [], palSel = 0;
function closePalette() {
  if (!palEl) return;
  palEl.remove(); palEl = null; palItems = [];
  document.body.style.overflow = '';
}
function hiMark(text, q) {
  const safe = T.esc(text);
  const ql = q.trim().toLowerCase();
  if (!ql) return safe;
  /* cari di string yang sudah di-escape (T02 B4): indeks dari teks mentah
     membelah entitas HTML seperti &amp; bila diterapkan ke teks ter-escape. */
  const qEsc = T.esc(q.trim()).toLowerCase();
  const idx = safe.toLowerCase().indexOf(qEsc);
  if (idx < 0) return safe;
  return safe.slice(0, idx) + '<mark>' + safe.slice(idx, idx + qEsc.length) + '</mark>' + safe.slice(idx + qEsc.length);
}
function openPalette() {
  if (palEl) { closePalette(); return; }
  palEl = document.createElement('div');
  palEl.className = 'pal-wrap';
  palEl.innerHTML = `
    <div class="pal-backdrop"></div>
    <div class="pal" role="dialog" aria-modal="true" aria-label="Cari cepat">
      <div class="pal-bar">
        <span class="glyph">⌕</span>
        <input id="palQ" type="search" placeholder="Cari tools..." autocomplete="off" aria-label="Cari tools">
        <kbd>esc</kbd>
      </div>
      <div class="pal-list" id="palList" role="listbox"></div>
      <div class="pal-hint"><span><kbd>↑↓</kbd>pindah</span><span><kbd>↵</kbd>buka</span><span><kbd>esc</kbd>tutup</span></div>
    </div>`;
  document.body.appendChild(palEl);
  document.body.style.overflow = 'hidden';
  const inp = palEl.querySelector('#palQ');
  const list = palEl.querySelector('#palList');
  palEl.querySelector('.pal-backdrop').addEventListener('click', closePalette);
  function paint(q) {
    const res = rankedSearchPlus(q, manifest, searchCtx());
    const recents = !q.trim() ? getRecent().slice(0, 4).map((x) => byId(x.id)).filter(Boolean) : [];
    const showRecent = recents.length && !q.trim();
    const showFav = !q.trim() && !showRecent && getFav().length;
    const favs = showFav ? getFav().slice(0, 4).map((x) => byId(x.id)).filter(Boolean) : [];
    palItems = [];
    let html = '';
    if (showRecent) {
      html += '<div class="pal-sec">Baru dibuka</div>';
      palItems.push(...recents);
    } else if (showFav) {
      html += '<div class="pal-sec">Favorit</div>';
      palItems.push(...favs);
    }
    palItems.push(...res.slice(0, 10));
    if (!palItems.length) {
      const sug = q.trim() ? suggestDidYouMean(q, manifest) : null;
      list.innerHTML = sug
        ? `<div class="pal-empty">Tidak ketemu.<br>Maksud Anda: <button class="schip" data-sug="${sug.id}">${T.esc(sug.name)}</button>?</div>`
        : '<div class="pal-empty">Tidak ketemu.<br>Coba kata lain, mis. "kalkulator".</div>';
      list.querySelector('[data-sug]')?.addEventListener('click', (e) => { touchRecent(e.target.dataset.sug); location.hash = '#/t/' + e.target.dataset.sug; closePalette(); });
      return;
    }
    palSel = 0;
    html += palItems.map((m, i) => `
      <div class="pal-item${i === 0 ? ' act' : ''}" data-i="${i}" role="option" tabindex="-1">
        <span class="pic">${m.icon}</span>
        <span class="ptx"><span class="pnm">${hiMark(m.name, q)}</span>
        <span class="pds">${T.esc(m.desc || '')}</span></span>
        <span class="pct">${catLabel(m.cat)}</span>
        <button class="pal-fav" data-fid="${m.id}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}" style="flex:none;width:34px;height:34px;border:0;background:none;cursor:pointer;font-size:18px;border-radius:8px;color:${isFav(m.id) ? 'var(--acc)' : 'var(--dim)'};opacity:${isFav(m.id) ? '1' : '0.6'}">♥</button>
      </div>`).join('');
    list.innerHTML = html;
    list.querySelectorAll('.pal-item').forEach((b) => {
      b.addEventListener('click', () => { touchRecent(palItems[+b.dataset.i].id); location.hash = '#/t/' + palItems[+b.dataset.i].id; closePalette(); });
    });
    list.querySelectorAll('.pal-fav').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = b.dataset.fid;
        toggleFav(id);
        const on = isFav(id);
        b.style.color = on ? 'var(--acc)' : 'var(--dim)';
        b.style.opacity = on ? '1' : '0.6';
        b.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
        toast(on ? 'Masuk favorit' : 'Dihapus dari favorit');
      });
    });
    scrollPal();
  }
  function scrollPal() {
    list.querySelectorAll('.pal-item').forEach((b, i) => b.classList.toggle('act', i === palSel));
    const act = list.querySelector('.pal-item.act');
    if (act) act.scrollIntoView({ block: 'nearest' });
  }
  inp.addEventListener('input', () => paint(inp.value));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); scrollPal(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); scrollPal(); }
    else if (e.key === 'Enter' && palItems[palSel]) {
      e.preventDefault();
      if (inp.value.trim()) addRecentSearch(inp.value.trim());
      const m = palItems[palSel];
      touchRecent(m.id);
      location.hash = '#/t/' + m.id;
      closePalette();
    }
  });
  paint('');
  setTimeout(() => inp.focus(), 30);
}

/* ---------------- bottom tab bar + indikator geser ---------------- */
function ensureTabs() {
  let nav = document.querySelector('.tabs');
  if (nav) return nav;
  nav = document.createElement('nav');
  nav.className = 'tabs';
  nav.setAttribute('aria-label', 'Navigasi utama');
  nav.innerHTML = `
    <span class="tab-ind" aria-hidden="true" style="opacity:0"></span>
    <a class="tab" data-tab="home" href="#/"><span class="ti">🏠</span><span>Beranda</span></a>
    <button class="tab" data-tab="search" id="tabSearch" aria-label="Cari cepat"><span class="ti">⌕</span><span>Cari</span></button>
    <a class="tab" data-tab="fav" href="#/favorit"><span class="ti">♥</span><span>Favorit</span></a>`;
  document.body.appendChild(nav);
  nav.querySelector('#tabSearch').addEventListener('click', openPalette);
  return nav;
}
function setTabActive(name) {
  const nav = ensureTabs();
  const ind = nav.querySelector('.tab-ind');
  nav.querySelectorAll('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
  const i = ['home', 'search', 'fav'].indexOf(name);
  if (i < 0) { ind.style.opacity = '0'; }
  else { ind.style.opacity = '1'; ind.style.transform = `translateX(${i * 100}%)`; }
}

/* ---------------- kartu ---------------- */
function cardEl(m, hl) {
  const a = document.createElement('a');
  a.className = 'tcard glass';
  a.href = '#/t/' + m.id;
  a.setAttribute('aria-label', m.name);
  const fav = isFav(m.id);
  a.innerHTML = `
    <span class="tic" aria-hidden="true">${m.icon}</span>
    <span class="nm">${hl ? hiMark(m.name, hl) : T.esc(m.name)}</span>
    <span class="ds">${T.esc(m.desc || '')}</span>
    <span class="ct">${catLabel(m.cat)}${isNew(m) ? '<span class="newb" style="color:var(--txt);border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.06);border-radius:999px;padding:2px 7px;margin-left:6px">BARU</span>' : ''}</span>
    <button class="fav${fav ? ' on' : ''}" data-id="${m.id}" aria-label="${fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button>`;
  a.addEventListener('click', () => touchRecent(m.id));
  bindFav(a);
  return a;
}
const hcardHTML = (m) => `
  <a class="hcard glass" href="#/t/${m.id}" aria-label="${T.esc(m.name)}">
    <span class="hic" aria-hidden="true">${m.icon}</span>
    <span class="hnm">${T.esc(m.name)}</span>
    <span class="hct">${catLabel(m.cat)}</span>
  </a>`;

/* fade tepi carousel saat konten terpotong */
function watchFadeX(rail) {
  const upd = () => {
    rail.classList.toggle('fx-r', rail.scrollWidth - rail.scrollLeft - rail.clientWidth > 4);
    rail.classList.toggle('fx-l', rail.scrollLeft > 4);
  };
  rail.addEventListener('scroll', upd, { passive: true });
  upd();
}

/* placeholder hero: contoh nyata, rotasi 3 dtk */
const PH_EXAMPLES = [
  'Coba "gaji"...', 'Coba "weton"...', 'Coba "gaji pokok"...', 'Coba "kompres foto"...',
  'Coba "qr"...', 'Coba "password"...', 'Coba "camelot"...', 'Coba "THR"...',
];
/* satu timer bersama (T02 B5): kunjungan beranda berulang tidak menumpuk interval */
let phTimer = null;
function rotatePh(input) {
  clearInterval(phTimer);
  let i = 0;
  phTimer = setInterval(() => { if (document.body.contains(input)) { i = (i + 1) % PH_EXAMPLES.length; input.placeholder = PH_EXAMPLES[i]; } }, 3000);
}

/* ---------------- BERANDA (v6: pendek, tanpa direktori vertikal) ---------------- */
function home() {
  document.body.dataset.route = 'home';
  setTabActive('home');
  document.title = 'Butuh apa? - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  const cats = CATS.filter((c) => c[0] !== 'semua');
  const tiles = cats
    .map(([id, label]) => {
      const cnt = manifest.filter((m) => m.cat === id).length;
      return `<a class="cattile glass" href="#/k/${id}">
        <span class="ci" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
        <span class="cl">${label}</span>
        <span class="cn">${cnt}</span>
      </a>`;
    }).join('');
  const colTiles = COLLECTIONS
    .map((c) => `<a class="cattile glass" href="#/c/${c.id}">
      <span class="ci" aria-hidden="true">${c.icon}</span>
      <span class="cl">${c.name}</span>
      <span class="cn">${c.tools.filter((id) => byId(id)).length}</span>
    </a>`).join('');
  app.innerHTML = `
  <div class="wrap view">
    <header class="top">
      <a class="brand" href="#/"><span class="mark" aria-hidden="true">a</span><span class="wm">ADIP <em>Tools</em></span></a>
      <div class="top-right">
        <span class="topcount"><span class="livedot" aria-hidden="true"></span><b data-countup="${n}">0</b> tools</span>
        <button class="icobtn" id="palBtn" aria-label="Cari cepat (Ctrl+K)">⌕</button>
      </div>
    </header>
    <section class="hero rise" style="--i:0">
      <p class="hi">${greet()}, butuh bantuan apa?</p>
      <h1><span class="w" style="--i:0"><span class="mask"><span class="mi">Butuh</span></span></span> <span class="w" style="--i:1"><span class="mask"><span class="mi"><span class="qm">apa?</span></span></span></span></h1>
      <div class="hsearch glass">
        <span class="glyph" aria-hidden="true">⌕</span>
        <input id="q" type="search" placeholder="${PH_EXAMPLES[0]}" autocomplete="off" aria-label="Cari tools">
      </div>
      <p class="dim" style="font-size:11.5px;margin:8px 2px 0">Kata yang kamu cari dicatat tanpa nama untuk daftar Populer.</p>
    </section>
    <div id="contd"></div>
    <section class="sec rise" style="--i:2" aria-label="Populer">
      <div class="sechead"><h2>🔥 Populer</h2></div>
      <div class="hscroll" id="popRail"></div>
    </section>
    <section class="sec rise" style="--i:3" id="baruSec" aria-label="Baru ditambahkan"></section>
    <section class="sec rise" style="--i:4" aria-label="Kategori">
      <div class="sechead"><h2>Kategori</h2><span class="n">${cats.length}</span></div>
      <div class="catgrid">${tiles}</div>
    </section>
    <section class="sec rise" style="--i:5" aria-label="Koleksi">
      <div class="sechead"><h2>Koleksi</h2><span class="n">berdasarkan masalah</span></div>
      <div class="catgrid">${colTiles}</div>
    </section>
    <section class="sec rise" style="--i:6" id="recSec" aria-label="Riwayat">
      <div class="sechead"><h2>🕐 Riwayat</h2></div>
      <div class="hscroll" id="recRail"></div>
    </section>
    <a class="allbtn glass rise" style="--i:7" href="#/semua">
      <span>Semua tools <span class="an">${n}</span></span>
      <span class="ago" aria-hidden="true">→</span>
    </a>
    ${acakButtonHTML(8)}
    <footer class="foot rise" style="--i:9"><b>ADIP Tools</b> · ${n} tools, gratis · Tanpa daftar · <a href="#/metodologi">Metodologi</a></footer>
  </div>`;
  app.querySelector('#palBtn').addEventListener('click', openPalette);
  const inp = app.querySelector('#q');
  rotatePh(inp);
  let goT;
  inp.addEventListener('input', () => {
    clearTimeout(goT);
    const v = inp.value.trim();
    if (v.length >= 2) goT = setTimeout(() => {
      if (document.body.contains(inp) && document.body.dataset.route === 'home')
        location.hash = '#/semua?q=' + encodeURIComponent(v);
    }, 700);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = inp.value.trim();
      if (v) sbTrack(v);
      location.hash = '#/semua' + (v ? '?q=' + encodeURIComponent(v) : '');
    }
  });
  renderContinue();
  renderPopuler();
  renderBaru(document.getElementById('baruSec'), manifest, VERSION);
  renderRecent();
  document.getElementById('acakBtn')?.addEventListener('click', () => {
    const m = pickRandomTool(manifest);
    if (m) location.hash = '#/t/' + m.id;
  });
  // count-up angka tools
  const cb = app.querySelector('[data-countup]');
  if (cb) {
    const target = parseInt(cb.dataset.countup, 10) || 0;
    const t0 = performance.now(), dur = 900;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      cb.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

/* kartu "Lanjutkan": alat terakhir dibuka */
function renderContinue() {
  const host = document.getElementById('contd');
  if (!host) return;
  const r = getRecent()[0];
  const m = r && byId(r.id);
  if (!m) { host.innerHTML = ''; return; }
  host.innerHTML = `
    <a class="contd glass rise" style="--i:1" href="#/t/${m.id}">
      <span class="cic" aria-hidden="true">${m.icon}</span>
      <span class="ctx">
        <span class="clbl">Lanjutkan</span>
        <span class="cnm">${T.esc(m.name)}</span>
        <span class="cts">dibuka ${timeAgo(r.t)}</span>
      </span>
      <span class="cgo" aria-hidden="true">→</span>
    </a>`;
}

/* Populer: istilah Supabase -> tool teratas tiap istilah */
function renderPopuler() {
  const rail = document.getElementById('popRail');
  if (!rail) return;
  const terms = SB_POPULAR.length ? SB_POPULAR : ['kalkulator thr', 'weton jawa', 'kompres gambar', 'password aman', 'camelot wheel', 'qr code'];
  const seen = new Set(), tools = [];
  for (const t of terms) {
    const hit = rankedSearchPlus(t, manifest)[0];
    if (hit && !seen.has(hit.id) && !SEARCH_DENY.includes(hit.id)) { seen.add(hit.id); tools.push(hit); }
    if (tools.length >= 8) break;
  }
  rail.innerHTML = tools.map(hcardHTML).join('');
  watchFadeX(rail);
}

/* Riwayat: carousel tool terakhir dibuka */
function renderRecent() {
  const rail = document.getElementById('recRail');
  const sec = document.getElementById('recSec');
  if (!rail || !sec) return;
  const recs = getRecent().map((x) => byId(x.id)).filter(Boolean).slice(0, 10);
  if (!recs.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  rail.innerHTML = recs.map(hcardHTML).join('');
  watchFadeX(rail);
}

/* ---------------- VIEW: semua tools + filter (#/semua) ---------------- */
function allPage(q) {
  document.body.dataset.route = 'semua';
  setTabActive(null);
  document.title = 'Semua tools - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  /* chip filter: gaya meniru .schip (token yang sama), tanpa sentuh CSS.
     Chip hanya muncul bila ada tool baru, supaya tidak jadi tombol mati. */
  const hasNew = manifest.some(isNew);
  const CHIP = 'font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:var(--surface)';
  const CHIP_ON = 'font:inherit;font-size:13px;font-weight:600;color:var(--txt);cursor:pointer;border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:8px 14px;background:rgba(255,255,255,.08)';
  let filter = 'all';
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <h2 class="pagetitle rise" style="--i:0">Semua tools</h2>
    <div class="hsearch glass rise" style="--i:1">
      <span class="glyph" aria-hidden="true">⌕</span>
      <input id="aq" type="search" placeholder="Cari ${n} tools..." value="${T.esc(q)}" autocomplete="off" aria-label="Cari semua tools">
    </div>
    <div class="fchips" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px" role="group" aria-label="Filter tools">
      <button class="fchip" data-f="all" aria-pressed="true" style="${CHIP_ON}">Semua</button>
      ${hasNew ? `<button class="fchip" data-f="new" aria-pressed="false" style="${CHIP}">Terbaru</button>` : ''}
      <button class="fchip" data-f="fav" aria-pressed="false" style="${CHIP}">♥ Favorit</button>
    </div>
    <div class="sechead" style="margin-top:18px"><h2 id="allCount"></h2></div>
    <div class="tgrid" id="allGrid"></div>
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis · Tanpa daftar · <a href="#/metodologi">Metodologi</a></footer>
  </div>`;
  const inp = app.querySelector('#aq');
  const grid = app.querySelector('#allGrid');
  const count = app.querySelector('#allCount');
  const paint = (qq) => {
    const ql = qq.trim();
    const a = ql ? assessQuery(ql, manifest, searchCtx()) : null;
    let list = a ? a.results : visibleTools();
    if (filter === 'new') list = list.filter(isNew);
    if (filter === 'fav') {
      const favIds = new Set(getFav().map((x) => x.id));
      list = list.filter((m) => favIds.has(m.id));
    }
    count.textContent = ql ? `${list.length} hasil` : `${list.length} tools`;
    count.parentElement.querySelector('.sug-hint')?.remove();
    if (a && !a.confident && a.suggestion) {
      count.insertAdjacentHTML('afterend', `<p class="sug-hint" style="margin:8px 0 0;font-size:13px;color:var(--mut)">Maksud Anda: <button class="schip" data-sug="${a.suggestion.id}">${T.esc(a.suggestion.name)}</button>?</p>`);
      count.parentElement.querySelector('[data-sug]').addEventListener('click', (e) => { location.hash = '#/t/' + e.target.dataset.sug; });
    }
    grid.innerHTML = '';
    if (a && !a.confident && !a.suggestion && !a.topExact) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Tidak ada tool yang pas untuk "${T.esc(ql)}".</b><p>Coba kata lain, mis. "kalkulator".</p>
        <div class="sugx">${['kalkulator', 'qr', 'weton'].map((s) => `<button class="schip">${s}</button>`).join('')}</div></div>`;
      grid.querySelectorAll('.schip').forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; paint(inp.value); }));
      return;
    }
    if (!list.length) {
      if (filter === 'fav' && !ql) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p></div>`;
        return;
      }
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <b>Tidak ketemu.</b><p>Coba kata lain, mis. "kalkulator".</p>
        <div class="sugx">${['kalkulator', 'qr', 'weton'].map((s) => `<button class="schip">${s}</button>`).join('')}</div>
      </div>`;
      grid.querySelectorAll('.schip').forEach((b) => b.addEventListener('click', () => { inp.value = b.textContent; paint(inp.value); }));
      return;
    }
    list.forEach((m) => grid.appendChild(cardEl(m, ql || null)));
  };
  let t;
  inp.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { if (inp.value.trim()) sbTrackDeb(inp.value.trim()); paint(inp.value); }, 180);
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inp.value.trim()) { addRecentSearch(inp.value.trim()); sbTrack(inp.value.trim()); }
  });
  const chips = app.querySelectorAll('.fchip');
  chips.forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f;
    chips.forEach((c) => {
      const on = c === b;
      c.style.cssText = on ? CHIP_ON : CHIP;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    paint(inp.value);
  }));
  paint(q);
}

/* ---------------- VIEW: kategori penuh (#/k/<id>) ---------------- */
function catPage(id) {
  const cat = CATS.find((c) => c[0] === id && id !== 'semua');
  const app = document.getElementById('app');
  if (!cat) { location.hash = '#/'; return; }
  document.body.dataset.route = 'kategori';
  setTabActive(null);
  document.title = cat[1] + ' - ADIP Tools';
  const n = manifest.length;
  const tools = visibleTools().filter((m) => m.cat === id);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">${CAT_ICON[id] || '🧰'}</span>
      <div><h2>${cat[1]}</h2><p class="csub">${tools.length} tools</p></div>
    </div>
    <div id="catIntro"></div>
    <div class="tgrid" id="catGrid"></div>
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis · Tanpa daftar · <a href="#/metodologi">Metodologi</a></footer>
  </div>`;
  const grid = app.querySelector('#catGrid');
  tools.forEach((m) => grid.appendChild(cardEl(m, null)));
  renderCatIntro(document.getElementById('catIntro'), id, manifest);
}

/* ---------------- FAVORIT ---------------- */
function favPage() {
  document.body.dataset.route = 'fav';
  setTabActive('fav');
  document.title = 'Favorit - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  const favs = getFav().map((x) => byId(x.id)).filter(Boolean);
  app.innerHTML = `
  <div class="wrap view">
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">♥</span>
      <div><h2>Favorit</h2><p class="csub">${favs.length} tersimpan di perangkat ini</p></div>
    </div>
    <div class="tgrid" id="favGrid"></div>
    ${favs.length ? '' : `<div class="empty"><b>Belum ada favorit.</b><p>Ketuk ♥ di kartu tools buat nyimpen.</p></div>`}
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis · Tanpa daftar · <a href="#/metodologi">Metodologi</a></footer>
  </div>`;
  const grid = app.querySelector('#favGrid');
  favs.forEach((m) => grid.appendChild(cardEl(m, null)));
}

/* ---------------- VIEW: koleksi (#/c/<id>) ---------------- */
function collectionPage(id) {
  const col = collectionById(id);
  const app = document.getElementById('app');
  if (!col) { location.hash = '#/'; return; }
  document.body.dataset.route = 'koleksi';
  setTabActive(null);
  document.title = col.name + ' - ADIP Tools';
  const n = manifest.length;
  const tools = col.tools.map(byId).filter(Boolean);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <div class="cat-head rise" style="--i:0">
      <span class="ctic" aria-hidden="true">${col.icon}</span>
      <div><h2>${T.esc(col.name)}</h2><p class="csub">${tools.length} tools</p></div>
    </div>
    <p class="rise" style="--i:1;font-size:14px;line-height:1.6;color:var(--mut);margin:-6px 0 16px">${T.esc(col.desc)}</p>
    <div class="tgrid" id="colGrid"></div>
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis · Tanpa daftar · <a href="#/metodologi">Metodologi</a></footer>
  </div>`;
  const grid = app.querySelector('#colGrid');
  tools.forEach((m) => grid.appendChild(cardEl(m, null)));
}

/* ---------------- HALAMAN METODOLOGI (#/metodologi) ----------------
   Desain jujur ala alatbantu.app: tiap kalkulator dijelaskan cara hitungnya
   + asumsi & batasannya. Konten dari METHOD (ditulis dari kode tool-nya).
   Anchor per tool: #/metodologi#thr — router memanggil methodPage lalu
   scroll ke entri yang dimaksud. */
function methodPage() {
  document.body.dataset.route = 'metodologi';
  setTabActive(null);
  document.title = 'Metodologi - ADIP Tools';
  const n = manifest.length;
  const app = document.getElementById('app');
  const entries = METHOD.map((x) => ({ x, m: byId(x.id) })).filter((e) => e.m);
  app.innerHTML = `
  <div class="wrap view">
    <a class="back" href="#/">← Beranda</a>
    <h2 class="pagetitle rise" style="--i:0">Metodologi</h2>
    <p class="rise" style="--i:1;font-size:14px;line-height:1.7;color:var(--mut);margin:-4px 0 8px">Cara tiap hitungan bekerja, ditulis dengan jujur — termasuk asumsi dan batasannya. Kalau ada yang tidak sesuai dengan aturan terbaru, itu karena tarif dan aturan mengikuti peraturan saat tool-nya ditulis.</p>
    <div class="glass rise" style="--i:1;border-radius:14px;padding:14px 16px;margin:12px 0 20px;font-size:13.5px;line-height:1.7">
      <b>Prinsip yang berlaku untuk semua kalkulator di sini:</b>
      <ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:6px">
        <li>Semua hitungan jalan 100% di browser kamu — angka yang kamu isi tidak dikirim ke mana pun.</li>
        <li>Angka di sini adalah <b>estimasi</b> untuk membantu mengambil keputusan, bukan nasihat pajak, hukum, atau medis.</li>
        <li>Hasil dibulatkan ke rupiah terdekat; selisih beberapa rupiah dari hitungan lain adalah wajar.</li>
      </ul>
    </div>
    <div style="display:grid;gap:12px">
      ${entries.map(({ x, m }, i) => `
      <article class="glass rise" id="m-${m.id}" style="--i:${i};border-radius:14px;padding:16px;scroll-margin-top:16px">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          <span style="font-size:22px" aria-hidden="true">${m.icon}</span>
          <h3 style="font-size:16px;font-weight:750;letter-spacing:-.01em">${T.esc(m.name)}</h3>
          <a href="#/t/${m.id}" style="margin-left:auto;font-size:12.5px;white-space:nowrap">Buka tool →</a>
        </div>
        <p style="font-size:13.5px;line-height:1.7;margin:0 0 8px">${T.esc(x.rumus)}</p>
        <p class="hint" style="line-height:1.65;margin:0"><b style="color:var(--mut)">Asumsi &amp; batasan:</b> ${T.esc(x.batas)}</p>
      </article>`).join('')}
    </div>
    <footer class="foot"><b>ADIP Tools</b> · ${n} tools, gratis · Tanpa daftar</footer>
  </div>`;
  // anchor per tool: #/metodologi#thr
  const anchor = (location.hash.split('#')[2] || '').replace(/[^a-z0-9-]/g, '');
  if (anchor) {
    const target = document.getElementById('m-' + anchor);
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

/* ---------------- HALAMAN TOOL ---------------- */
let toolCb = [];
function onToolLeave(cb) { toolCb.push(cb); }
function runLeaveCbs() { toolCb.forEach((cb) => { try { cb(); } catch {} }); toolCb = []; }
/* token navigasi per pemanggilan toolPage (T02 B1): import tool A yang lambat
   tidak boleh me-render ke halaman tool B bila user sudah pindah. */
let toolSeq = 0;
async function toolPage(id) {
  const mySeq = ++toolSeq;
  const m = byId(id);
  const app = document.getElementById('app');
  document.body.dataset.route = 'tool';
  if (!m) {
    setTabActive(null);
    document.title = 'Tidak ditemukan - ADIP Tools';
    app.innerHTML = `<div class="wrap view"><div class="empty"><b>Tools tidak ditemukan.</b>
      <p>Mungkin alamatnya berubah.</p></div><a class="back" href="#/">← Beranda</a></div>`;
    return;
  }
  setTabActive(null);
  document.title = m.name + ' - ADIP Tools';
  window.scrollTo(0, 0);
  app.innerHTML = `
  <div class="wrap narrow view">
    <a class="back" href="#/">← Beranda</a><span id="prevChip"></span>
    <div class="tool-head">
      <span class="tic" aria-hidden="true">${m.icon}</span>
      <div class="th">
        <h2>${T.esc(m.name)}</h2>
        <div class="meta">
          <span class="tag">${catLabel(m.cat)}</span>
          <span class="ds">${T.esc(m.desc || '')}</span>
        </div>
      </div>
      <div class="tacts"><button class="fav icobtn${isFav(m.id) ? ' on' : ''}" data-id="${m.id}" aria-label="${isFav(m.id) ? 'Hapus dari favorit' : 'Tambah ke favorit'}">♥</button>${shareButtonHTML(m)}</div>
    </div>
    <div class="tool glass" id="toolbox"><div class="skel"><i class="short"></i><i></i><i class="tall"></i></div></div>
    <div id="methLink"></div>
    <div id="nextSec"></div>
    <div id="recentSec"></div>
    <div class="related">
      <div class="sechead"><h2>Sejenis</h2></div>
      <div class="tgrid" id="relGrid"></div>
      <div id="catMore"></div>
    </div>
    <footer class="foot"><b>ADIP Tools</b> · ${manifest.length} tools, gratis · Tanpa daftar · <a href="#/metodologi">Metodologi</a></footer>
  </div>`;
  touchRecent(m.id);
  /* binding di sini (bukan setelah render): tombol ♥ & bagikan tetap hidup
     walau import tool gagal (T02 B8). */
  bindFav(app);
  bindShareButtons(app);
  try {
    const mod = await import('./' + m.file + '?v=' + VERSION);
    if (mySeq !== toolSeq || document.body.dataset.route !== 'tool') return;
    const box = document.getElementById('toolbox');
    box.querySelector('.skel')?.remove();
    mod.render(box, onToolLeave, T, m);
  } catch (e) {
    if (mySeq !== toolSeq) return; // jangan timpa halaman tool lain dengan pesan error tool ini
    const box = document.getElementById('toolbox');
    if (box) box.innerHTML = `<div class="empty"><b>Gagal memuat.</b><p>Coba muat ulang halaman.</p></div>`;
  }
  const grid = document.getElementById('relGrid');
  if (grid) {
    manifest
      .filter((x) => x.cat === m.cat && x.id !== m.id)
      .slice(0, 4)
      .forEach((x) => grid.appendChild(cardEl(x, null)));
  }
  // rantai "Lanjut ke" (ide UX #7): langkah berikut yang relevan, dari peta NEXT
  const nextHost = document.getElementById('nextSec');
  const nextTools = (NEXT[m.id] || []).map(byId).filter(Boolean);
  if (nextHost && nextTools.length) {
    nextHost.innerHTML = `
    <section class="sec" aria-label="Lanjut ke" style="margin-top:22px">
      <div class="sechead"><h2>Lanjut ke</h2></div>
      <div class="hscroll" id="nextRail">${nextTools.map(hcardHTML).join('')}</div>
    </section>`;
    const rail = nextHost.querySelector('#nextRail');
    if (rail) watchFadeX(rail);
  }
  // tautan metodologi untuk kalkulator yang rumusnya didokumentasikan
  const methHost = document.getElementById('methLink');
  if (methHost && METHOD_IDS.has(m.id)) {
    methHost.innerHTML = `<a href="#/metodologi#${m.id}" style="display:block;margin-top:14px;font-size:13px;color:var(--mut)">📖 Cara hitungnya — lihat rumus, asumsi &amp; batasannya di halaman Metodologi →</a>`;
  }
  // riwayat "Baru saja dibuka" di halaman detail (T10, v6.12.0)
  const recHost = document.getElementById('recentSec');
  if (recHost) {
    recHost.innerHTML = recentRailHTML(m.id, getRecent(), byId, hcardHTML);
    const rail = recHost.querySelector('.hscroll');
    if (rail) watchFadeX(rail);
  }
  const prevHost = document.getElementById('prevChip');
  if (prevHost) prevHost.innerHTML = prevToolChip(m.id, getRecent(), byId, T.esc);
  const catHost = document.getElementById('catMore');
  if (catHost) catHost.innerHTML = catMoreLink(m.cat, catLabel);
}

/* ---------------- ROUTER ---------------- */
function route() {
  clearInterval(phTimer);
  runLeaveCbs(); closePalette();
  const run = () => {
    window.scrollTo(0, 0);
    const hash = location.hash || '#/';
    if (hash.startsWith('#/t/')) toolPage(decodeURIComponent(hash.slice(4).split('?')[0]));
    else if (hash.startsWith('#/k/')) catPage(decodeURIComponent(hash.slice(4).split('?')[0]));
    else if (hash.startsWith('#/c/')) collectionPage(decodeURIComponent(hash.slice(4).split('?')[0].split('#')[0]));
    else if (hash.startsWith('#/metodologi')) methodPage();
    else if (hash.startsWith('#/semua')) {
      const mm = hash.match(/[?&]q=([^&]*)/);
      allPage(mm ? decodeURIComponent(mm[1]) : '');
    }
    else if (hash === '#/favorit') favPage();
    else home();
    /* pindah fokus ke judul halaman (T24 P1-6): pengguna keyboard tidak
       perlu Tab dari atas tiap ganti view. */
    const appEl = document.getElementById('app');
    const h = appEl && appEl.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  };
  // transisi halaman ala aplikasi native (fallback: render biasa)
  if (document.startViewTransition) document.startViewTransition(run);
  else run();
}

/* ---------------- boot ---------------- */
ensureTabs();
sbFetchPopular();
window.addEventListener('hashchange', route);
document.addEventListener('keydown', (e) => {
  const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (palEl && e.key === 'Escape') { closePalette(); return; }
  if (e.key === '/' && !palEl && !inField) {
    const q = document.getElementById('q') || document.getElementById('aq');
    if (q) { e.preventDefault(); q.focus(); }
  }
});
route();
initSeoShare({ manifest, catLabel, onToast: (msg) => toast(msg) });
