/* ============================================================
   ADIP Tools v6.12.0 — modul beranda & katalog (TIM 08)
   Beranda + halaman kategori, tanpa menyentuh shell (app.js
   milik TIM 07; koordinator yang wiring modul ini).

   ISI MODUL (hasil audit 15 Nov 2026 — yang SUDAH ada di shell
   dan TIDAK diduplikasi di sini):
   - Koleksi berdasarkan masalah: SUDAH ADA di app.js (COLLECTIONS,
     4 koleksi + route #/c/<id>). Modul ini tidak membuat koleksi.
   - Badge BARU + chip "Terbaru": SUDAH ADA di app.js (isNew).
   - Favorit, riwayat, command palette, "Lanjutkan", carousel
     Populer, grid Kategori, rantai "Lanjut ke": SUDAH ADA.

   YANG MASIH KURANG dan dibangun di sini:
   A. Showcase "Baru ditambahkan" di beranda — grid tool baru
      (since === VERSION). Beranda saat ini TIDAK punya section ini;
      tool baru hanya kelihatan lewat chip filter di #/semua.
      (v6.14.0 P2-B1: dulu carousel, kini grid statis .hgrid —
      semua 8 tool terlihat tanpa geser; V-07.)
      (v6.15.0 P1: kurasi satu tool per kategori dari batch yang
      sama + kartu lebar berdeskripsi .baru-grid/.baru-card —
      lihat curateNewTools/baruCardHTML. Label versi tidak berubah.)
   B. Meta kategori — deskripsi satu baris + 3 tool unggulan per
      kategori, untuk halaman #/k/<id> yang saat ini cuma judul +
      jumlah + grid tanpa pengantar.
   C. (OPSIONAL) "Coba tool acak" — tombol jelajah di beranda.

   TAMBAHAN v6.14.0 (P0-C, modernisasi shell):
   D. Helper view beranda yang dulu tinggal di app.js pindah ke sini:
      renderContinue ("Lanjutkan"), renderPopuler (rail Populer),
      renderRecent (carousel Riwayat), greet, rotasi placeholder
      hero. app.js kini hanya memanggilnya dari home().
   E. Duplikasi dicabut: hcardHTML + watchFadeX kini satu sumber di
      shell-ui.js; label kategori + SEARCH_DENY kini satu sumber di
      catalog.js. attachRailFade dipertahankan sebagai alias
      re-export supaya pemanggil lama tidak rusak.
   F. renderPopuler() kini menerima daftar istilah populer sebagai
      parameter (bukan membaca state Supabase di app.js) — app.js
      yang mengambil istilahnya lewat supabase.js lalu mengopernya.
      (v6.22.0 S-U1, F-06: + parameter status 'pending'/'live'/
      'stale' untuk pesan jujur + penundaan render saat rail
      sedang digeser.)

   TAMBAHAN v6.19.1 (P8, Spotlight):
   G. Spotlight "Tool pilihan" — satu tool unggulan per hari, rotasi
      deterministik tanpa backend (pool 84 unggulan CAT_META diacak
      sekali FNV-1a -> mulberry32 -> Fisher-Yates, indeks =
      nomorHari(WIB) mod 84). Fungsi murni pilihSpotlight/
      spotlightOrder + renderSpotlight (pola renderBaru).
      (v6.22.0 S-U1: pool 59 -> 84, spesifikasi kurasi S-U10 §5.)

   KONTRAK (diperbarui v6.14.0):
   - Murni + tanpa side effect di top-level: semua fungsi menerima
     manifest sebagai parameter, supaya bisa dites tanpa browser.
     (Pengecualian v6.14.0: renderContinue/renderRecent membaca
     riwayat dari store.js dan renderPopuler menerima istilah
     populer sebagai parameter — ketiganya render ke DOM beranda,
     sesuai tugas barunya sebagai pemilik view beranda.)
   - Hanya memakai kelas CSS yang SUDAH ADA di css/style.css
     (.sec, .sechead, .hscroll, .hcard, .glass, .rise, .allbtn)
     + kelas baru P2-B1 (.hgrid, .coba-grid — lihat seksi
     "DASHBOARD v6.14.0" di akhir style.css) + kelas baru P1
     v6.15.0 (.baru-grid, .baru-card — css/polish-p1.css, khusus
     showcase "Baru ditambahkan") + inline style meniru pola app.js.
   - Aksen PUTIH saja (chip BARU memakai gaya inline yang sama
     persis dengan cardEl di app.js). Copy bahasa Indonesia
     sehari-hari; tanpa klaim popularitas yang tidak terukur.
   ============================================================ */
import { esc } from './core.js';
import { SEARCH_DENY, byId, catLabel } from './catalog.js';
import { getRecent } from './store.js';
import { hcardHTML, watchFadeX } from './shell-ui.js';
import { rankedSearchPlus } from './search-plus.js';
/* S-U5 (v6.22.0, manifest split): loader + versi detail dari
   manifest-boot.js (impor langsung, BUKAN lewat alias
   './manifest.js' — supaya js/manifest.js tetap tak tersentuh). */
import { manifestDetailsVersion, loadManifestDetails, needsDetails } from './manifest-boot.js';

/* Alias kompatibilitas: fade tepi carousel kini satu sumber di
   shell-ui.js (watchFadeX); nama lama tetap diekspor supaya
   pemanggil yang memakai attachRailFade tidak rusak. */
export { watchFadeX as attachRailFade } from './shell-ui.js';

const visible = (m) => Boolean(m) && !SEARCH_DENY.includes(m.id);

/* ================= A. SHOWCASE "BARU DITAMBAHKAN" =================
   Fakta audit (S-A8, 21 Nov 2026, terhitung ulang S-F9): 0 tool
   ber-since 6.20.0/6.21.0; batch terbaru 6.19.0 (290 tool); batch
   6.11.0 kini 135 tool (bukan 147); 415 tool tanpa `since` sama
   sekali. Akibatnya isNew() di catalog.js false untuk SEMUA tool
   (chip "Terbaru" di #/semua pun tidak muncul).
   KEPUTUSAN S-U1 (v6.22.0, F-02): fallback "batch terbaru" DICABUT.
   Dulu bila tidak ada tool dengan since === VERSION, renderBaru
   menampilkan batch `since` terbaru dengan label "dari versi
   6.19.0" — labelnya jujur, tapi heading "Baru ditambahkan" di
   rilis 6.22.0 menampilkan barang dua versi lalu, dan klaim
   "baru" itu yang menyesatkan, bukan labelnya. Kini seksi
   disembunyikan bila tidak ada batch versi berjalan — perilaku
   yang sama dengan seksi kosong lain di beranda (Favorit,
   Riwayat) dan chip "Terbaru" yang juga bersembunyi saat tidak
   ada tool baru. v6.22.0 adalah ronde shell (0 tool baru), jadi
   seksi ini memang kosong di ronde ini, bukan rusak. Perbaikan
   datanya (backfill `since`) milik S-F6, bukan modul ini.
   latestSince()/latestSinceTools() dipertahankan sebagai API
   modul (dipakai harness/tes), bukan lagi oleh renderBaru. */

export function cmpSemver(a, b) {
  const pa = String(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/* tool baru di versi yang dimaksud (semantik sama dengan isNew
   di app.js: since === VERSION), dibatasi `limit` teratas. */
export function newTools(manifest, version, limit = 8) {
  if (!Array.isArray(manifest) || !version) return [];
  return manifest.filter((m) => visible(m) && m.since === version).slice(0, limit);
}

/* nilai `since` terbesar yang ada di manifest (atau null bila tidak
   ada satu pun tool ber-cap since). */
export function latestSince(manifest) {
  let best = null;
  for (const m of manifest || []) {
    if (!m || !m.since) continue;
    if (!best || cmpSemver(m.since, best) > 0) best = m.since;
  }
  return best;
}

/* tool dari batch `since` terbaru (fallback renderBaru). */
export function latestSinceTools(manifest, limit = 8) {
  const v = latestSince(manifest);
  if (!v) return [];
  return manifest.filter((m) => visible(m) && m.since === v).slice(0, limit);
}

/* v6.15.0 P1 (temuan 1) — KURASI CAMPURAN KATEGORI.
   Masalahnya: newTools() mengambil 8 tool pertama dari batch
   dalam urutan manifest, dan 8 pertama batch 6.13.0 kebetulan
   semuanya Bisnis — seksi terasa seperti filler walau batch-nya
   sendiri punya 21 tool dalam 8 kategori.
   Perbaikannya (satu-satunya perubahan perilaku di ronde ini,
   diizinkan koordinator): dari batch yang SAMA, ambil satu tool
   per kategori dalam urutan manifest, lalu isi sisa slot dengan
   tool batch berikutnya dalam urutan manifest. Deterministik,
   tanpa klaim "terbaik"/"paling populer", dan label versi
   ("dari versi 6.13.0") tetap benar karena semua tool yang
   tampil memang berasal dari batch itu. Bila batch punya
   kategori lebih sedikit dari limit, pengisian sisa menjamin
   seksi tetap terisi penuh (mis. batch 6.12.0 hanya 4 kategori).
   newTools()/latestSinceTools() dipertahankan sebagai API modul
   (tidak ada pemanggil lain saat ini, tapi keduanya diekspor). */
export function curateNewTools(manifest, version, limit = 8) {
  if (!Array.isArray(manifest) || !version) return [];
  const batch = manifest.filter((m) => visible(m) && m.since === version);
  const picked = [];
  const cats = new Set();
  for (const m of batch) {
    if (picked.length >= limit) break;
    if (cats.has(m.cat)) continue;
    cats.add(m.cat);
    picked.push(m);
  }
  if (picked.length < limit) {
    for (const m of batch) {
      if (picked.length >= limit) break;
      if (!picked.includes(m)) picked.push(m);
    }
  }
  return picked;
}

/* Kartu lebar "Baru ditambahkan" (v6.15.0 P1): ikon + nama +
   deskripsi nyata dari manifest (2 baris, di-clamp CSS) +
   label kategori. Deskripsi membuat tiap kartu menjelaskan
   dirinya sendiri — kartu seperti ini tidak bisa terasa
   seperti filler. Gaya di css/polish-p1.css. */
export function baruCardHTML(m) {
  // R-10 (Blue-B): icon + id ikut di-escape (defense-in-depth — manifest
  // adalah data repo tepercaya, tapi jangan render mentah). Emoji aman:
  // esc() hanya mengubah & < > " '.
  return `
  <a class="baru-card glass" href="#/t/${esc(m.id)}" aria-label="${esc(m.name)}">
    <span class="bic" aria-hidden="true">${esc(m.icon)}</span>
    <span class="btx">
      <span class="bnm">${esc(m.name)}</span>
      <span class="bds">${esc(m.desc || '')}</span>
      <span class="bct">${catLabel(m.cat)}</span>
    </span>
  </a>`;
}

/* HTML isi section "Baru ditambahkan" (tanpa tag <section> — wadah
   section-nya milik template home() di app.js). Mode 'strict' =
   tool baru di versi ini; mode 'latest' = label batch lama, kini
   tidak dipakai renderBaru lagi (S-U1 v6.22.0, F-02) tapi
   dipertahankan untuk harness/tes. v6.15.0 P1: kartu lebar
   berdeskripsi (.baru-grid/.baru-card), bukan lagi .hgrid. */
export function baruSectionHTML(tools, { version = '', mode = 'strict' } = {}) {
  if (!tools || !tools.length) return '';
  const sub = mode === 'strict'
    ? `versi ${version}`
    : `dari versi ${version}`;
  return `
    <div class="sechead"><h2>✨ Baru ditambahkan</h2><span class="n">${esc(sub)}</span></div>
    <div class="baru-grid">${tools.map(baruCardHTML).join('')}</div>`;
}

/* Render showcase ke wadah <section id="baruSec"> di beranda.
   Mengembalikan true bila section terisi, false bila disembunyikan
   (tidak ada tool baru di versi berjalan — wadah display:none).
   S-U1 (v6.22.0, F-02): TIDAK ADA lagi fallback ke batch terbaru;
   seksi kosong disembunyikan, bukan diisi batch lama.
   v6.15.0 P1: pemilihan tool lewat curateNewTools (satu per
   kategori dari batch yang sama) — lihat catatan di sana. */
export function renderBaru(host, manifest, version, { limit = 8 } = {}) {
  if (!host) return false;
  const tools = curateNewTools(manifest, version, limit);
  if (!tools.length) {
    host.style.display = 'none';
    host.innerHTML = '';
    return false;
  }
  host.style.display = '';
  host.innerHTML = baruSectionHTML(tools, { version, mode: 'strict' });
  /* S-U5 (v6.22.0, manifest split): kartu memakai desc — bila
     manifest masih ramping, render ulang sekali begitu detail
     tiba supaya deskripsi asli tampil (bukan baris kosong).
     Render ini tetap SINKRON (kontrak harness S-U1); re-render
     hanya efek samping terjadwal. */
  if (needsDetails(manifest)) {
    rerenderAfterDetails(host, () => renderBaru(host, manifest, version, { limit }));
  }
  return true;
}

/* ================= B. META KATEGORI =================
   Deskripsi satu baris + 3-4 tool unggulan per kategori, untuk halaman
   #/k/<id>. "Unggulan" = pilihan kurasi TIM 08 (tool yang paling
   berguna/umum dipakai di kategorinya), BUKAN klaim peringkat
   pemakaian — label di layar memakai "Coba dulu / mulai dari sini",
   bukan "paling populer". Semua ID di bawah diverifikasi ada di
   manifest v6.17.0 (857 tool); catUnggulan() tetap memfilter ID yang
   hilang, jadi aman bila ada tool yang dihapus di rilis berikut.
   v6.22.0 S-U1 (spesifikasi S-U10 §5): 25 ID batch 6.18.0/6.19.0
   ditambahkan ke akhir tiap array — 18 kategori kini 4 unggulan,
   4 kategori tipis (kesehatan, kreator, masak, travel) kini genap 3.
   Ke-25 ID diverifikasi ada di manifest, ber-since 6.18.0/6.19.0,
   desc 40-160 karakter, dan belum ada di pool (skrip Node, 0 gagal).
   Efek samping: strip "Coba dulu" ikut membesar jadi 4 kartu di
   18 kategori — grid .coba-grid disesuaikan (style.css: 2 kolom HP,
   4 kolom mulai 640px, pola .mulai-grid). */
export const CAT_META = {
  keamanan: { desc: 'Jaga akun dan datamu: sandi kuat, cek kebocoran, dan kenali modus penipuan sebelum kena.', unggulan: ['password-generator', 'password-strength', 'cek-privasi-tempel', 'checklist-privasi-30-hari'] },
  converter: { desc: 'Ubah format apa pun: satuan, video, file, sampai angka dan takaran masak.', unggulan: ['unit-converter', 'video-ke-mp3', 'terbilang', 'ganti-nama-file-massal'] },
  developer: { desc: 'Tool buat ngoding: rapikan JSON (data), tes regex (pola teks), sampai bongkar token JWT (tanda masuk).', unggulan: ['json-formatter', 'regex-tester', 'jwt-parser', 'apakah-situs-down'] },
  desain: { desc: 'Bikin tampilan lebih bagus: warna, QR, gradasi, sampai mockup HP.', unggulan: ['qr-generator', 'palette', 'gradient', 'galeri-font-google'] },
  indonesia: { desc: 'Hitungan khas Indonesia: THR, pajak, weton, sampai biaya SIM dan STNK.', unggulan: ['kalender-jawa', 'thr', 'pph21', 'biaya-admin-transfer-antar-bank'] },
  musik: { desc: 'Buat yang main musik atau DJ: tempo, chord, sampai rencana setlist.', unggulan: ['camelot', 'metronome', 'tap-bpm', 'audio-8d'] },
  gambar: { desc: 'Olah foto langsung di browser: kompres, potong, hapus latar. Tanpa upload.', unggulan: ['image-compress', 'removebg', 'crop-pas-foto', 'banding-foto'] },
  teks: { desc: 'Ubah dan hitung teks: jumlah kata, format WA, sampai bikin hashtag.', unggulan: ['word-counter', 'wa-formatter', 'generator-hashtag', 'karakter-khusus'] },
  bisnis: { desc: 'Hitung usaha dan gaji: harga jual, invoice, sampai gaji bersih setelah potongan.', unggulan: ['kalkulator-gaji-bersih', 'buat-invoice', 'margin-markup', 'analisis-swot'] },
  sehari: { desc: 'Keperluan sehari-hari: kesehatan, rumah, hewan peliharaan, sampai tes HP.', unggulan: ['bmi', 'kalori-makanan', 'stopwatch', 'diagnosis-hp-rusak'] },
  fun: { desc: 'Buat seru-seruan: kuis, tebak-tebakan, sampai roda putar buat undian.', unggulan: ['spinwheel', 'tebak-tebakan', 'zodiak-hari-ini', 'berat-di-planet-lain'] },
  produktivitas: { desc: 'Biar kerja lebih rapi: CV, timer fokus, PDF, sampai catatan harian.', unggulan: ['pembuat-cv', 'pomodoro', 'pdflab', 'diagram-alir'] },
  pelajar: { desc: 'Bantu belajar: kalkulator, flashcard, sampai latihan SKD CPNS.', unggulan: ['kalkulator-umum', 'flashcard', 'ipk', 'biaya-kuliah'] },
  liveapi: { desc: 'Data langsung dari internet: jadwal sholat, gempa, kurs, cuaca, dan lainnya.', unggulan: ['jadwal-sholat', 'gempa-bmkg', 'kurs-cuaca', 'cuaca-arsip'] },
  fakesos: { desc: 'Bikin tangkapan layar bohongan buat lucu-lucuan. Jangan dipakai untuk menipu.', unggulan: ['fake-chat-wa', 'fake-post-ig', 'fake-tweet', 'fake-chat-snapchat'] },
  kesehatan: { desc: 'Hitung soal badan: berat ideal, kalori, gula darah, sampai risiko jantung dan tumbuh kembang anak.', unggulan: ['atlas-otot-latihan', 'bmi-anak', 'jadwal-donor-darah'] },
  kreator: { desc: 'Bikin konten lebih cepat: ide hook video sampai carousel siap posting.', unggulan: ['generator-hook-tiktok', 'pembuat-carousel-tiktok-ig', 'cek-zona-aman-tiktok'] },
  masak: { desc: 'Hitung takaran dan waktu masak: rasio beras dan kopi, porsi pesta, sampai timer seduh dan bahan pengganti.', unggulan: ['masak-dari-bahan', 'pengganti-bahan-masakan', 'timer-seduh-kopi-teh'] },
  travel: { desc: 'Siapin perjalanan: anggaran trip, dokumen, jet lag, sampai frasa penting dan negara bebas visa.', unggulan: ['paspor-indonesia-bebas-visa', 'anggaran-trip', 'perencana-road-trip'] },
  sains: { desc: 'Hitung dan simulasi sains: listrik, gerak, sampai tata surya.', unggulan: ['kalkulator-hukum-ohm', 'simulator-tata-surya', 'simulator-gravitasi', 'kalkulator-energi-gempa'] },
  otomotif: { desc: 'Hitung kendaraanmu: bensin, cas mobil listrik, sampai harga jual mobil bekas.', unggulan: ['kalkulator-konsumsi-bbm', 'kalkulator-biaya-cas-mobil-listrik', 'kalkulator-depresiasi-mobil', 'beli-vs-sewa-mobil'] },
  rumah: { desc: 'Hitung kebutuhan rumah: atap, keramik, tangga, sampai tangki air.', unggulan: ['kalkulator-keramik-ubin', 'kalkulator-atap', 'kalkulator-volume-tangki-air', 'kalkulator-pagar'] },
};

export function catMeta(catId) {
  return CAT_META[catId] || null;
}

/* tool unggulan kategori yang benar-benar ada di manifest. */
export function catUnggulan(catId, manifest) {
  const meta = catMeta(catId);
  if (!meta || !Array.isArray(manifest)) return [];
  return meta.unggulan
    .map((id) => manifest.find((m) => m.id === id))
    .filter(visible);
}

/* HTML pengantar halaman kategori: deskripsi + strip "Coba dulu".
   Mengembalikan string kosong bila kategori tidak punya meta. */
export function catIntroHTML(catId, manifest) {
  const meta = catMeta(catId);
  if (!meta) return '';
  const top = catUnggulan(catId, manifest);
  const strip = top.length ? `
    <div class="sechead" style="margin-top:18px"><h2>Coba dulu</h2><span class="n">mulai dari sini</span></div>
    <div class="coba-grid">${top.map(hcardHTML).join('')}</div>` : '';
  return `
    <p class="rise" style="--i:1;font-size:14px;line-height:1.6;color:var(--mut);margin:-6px 0 16px">${esc(meta.desc)}</p>${strip}`;
}

/* Render pengantar ke wadah <div id="catIntro"> di halaman kategori.
   Mengembalikan true bila terisi. */
export function renderCatIntro(host, catId, manifest) {
  if (!host) return false;
  const html = catIntroHTML(catId, manifest);
  if (!html) { host.innerHTML = ''; return false; }
  host.innerHTML = html;
  return true;
}

/* ================= SPOTLIGHT "TOOL PILIHAN" (v6.19.1 P8) =================
   Satu tool unggulan per hari, rotasi deterministik TANPA backend:
   pool 84 unggulan CAT_META diacak SEKALI (FNV-1a -> mulberry32 ->
   Fisher-Yates), lalu hari ke-d mengambil indeks nomorHari mod 84.
   Hari berurutan -> indeks berurutan -> tool SELALU berbeda
   (jaminan STRUKTURAL, bukan probabilistik). Siklus 84 hari; tiap
   tool tampil sekali per siklus. Tanggal dari perangkat + zona
   Asia/Jakarta (Intl) — pengunjung di luar WIB tetap dapat hari
   yang benar. Spesifikasi lengkap: r7-spotlight-spec.md.
   (v6.22.0 S-U1: pool 59 -> 84, kurasi 25 ID batch 6.18.0/6.19.0
   spesifikasi S-U10 §5. Urutan acak ikut berubah karena pool-nya
   berubah — wajar, tidak dimitigasi.) */

export const SPOTLIGHT_SEED = 'adip-tools-spotlight-v1';

/* FNV-1a 32-bit: hash string -> uint32, stabil lintas browser. */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/* mulberry32: PRNG deterministik 32-bit (pola umum, domain publik). */
export function mulberry32(a) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Pool: gabungan semua `unggulan` CAT_META (84 ID unik, urutan
   kategori CAT_META). Diturunkan dari CAT_META — bukan daftar
   kurasi kedua — supaya spotlight dan "Coba dulu" tidak menyimpang. */
export function spotlightPoolIds() {
  const ids = [];
  for (const meta of Object.values(CAT_META)) {
    for (const id of meta.unggulan) if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

/* Urutan acak TETAP: sama di semua perangkat & kunjungan (hanya
   bergantung pada pool + seed). ID yang hilang dari manifest
   dibuang (pola catUnggulan). Pencarian ID memakai Map sekali
   jalan (S-F9, S-A5 F11): `byId` di catalog.js masih `manifest.find`
   linear, jadi Map di sini yang benar-benar memotong 84x pindai. */
export function spotlightOrder(manifest) {
  if (!Array.isArray(manifest)) return [];
  const byIdMap = new Map(manifest.map((m) => [m.id, m]));
  const pool = spotlightPoolIds()
    .map((id) => byIdMap.get(id))
    .filter(visible);
  const acak = pool.slice();
  const rnd = mulberry32(fnv1a(SPOTLIGHT_SEED));
  for (let i = acak.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [acak[i], acak[j]] = [acak[j], acak[i]];
  }
  return acak;
}

/* Nomor hari sejak epoch, tengah malam WIB. Input "YYYY-MM-DD". */
export function nomorHari(tanggalWIB) {
  const [y, m, d] = String(tanggalWIB).split('-').map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - 7 * 3600 * 1000) / 86400000);
}

/* Tanggal hari ini (WIB) sebagai "YYYY-MM-DD". "en-CA" menghasilkan
   format YYYY-MM-DD; zona Asia/Jakarta eksplisit. */
export function tanggalHariIniWIB() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/* Label tanggal untuk sub-header section, mis. "Kamis, 19 November
   2026". Diparse dari string YYYY-MM-DD yang SAMA dengan rotasi —
   satu sumber tanggal untuk tool dan label. Tengah hari UTC =
   19.00 WIB, jadi hari kalendernya tidak pernah bergeser. */
export function labelTanggalWIB(tanggalWIB) {
  const [y, m, d] = String(tanggalWIB).split('-').map(Number);
  const tengah = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(tengah);
}

/* Tool spotlight untuk tanggal WIB tertentu (default: hari ini).
   Mengembalikan null bila pool < 2 — section disembunyikan. */
export function pilihSpotlight(manifest, tanggalWIB = tanggalHariIniWIB()) {
  const urutan = spotlightOrder(manifest);
  if (urutan.length < 2) return null;
  return urutan[nomorHari(tanggalWIB) % urutan.length];
}

/* HTML isi section spotlight (tanpa tag <section> — wadahnya milik
   template home() di app.js). Satu kartu lebar penuh, pakai ulang
   anatomi .baru-card — NOL CSS baru. Mikro-copy di bawah kartu
   (S-U1 v6.22.0, F-05): menjelaskan rotasi harian tanpa klaim
   "terbaik" dan tanpa em-dash. */
export function spotlightSectionHTML(tool, tanggalWIB) {
  if (!tool) return '';
  return `
    <div class="sechead"><h2>⭐ Tool pilihan</h2><span class="n">${esc(labelTanggalWIB(tanggalWIB))}</span></div>
    ${baruCardHTML(tool)}
    <p class="secnote">Pilihan hari ini, ganti tiap hari</p>`;
}

/* Render spotlight ke wadah <section id="spotSec"> di beranda.
   Mengembalikan true bila terisi, false bila disembunyikan
   (pola renderBaru). Parameter tanggal opsional untuk tes. */
export function renderSpotlight(host, manifest, tanggalWIB = tanggalHariIniWIB()) {
  if (!host) return false;
  const tool = pilihSpotlight(manifest, tanggalWIB);
  if (!tool) {
    host.style.display = 'none';
    host.innerHTML = '';
    return false;
  }
  host.style.display = '';
  host.innerHTML = spotlightSectionHTML(tool, tanggalWIB);
  /* S-U5 (v6.22.0, manifest split): kartu memakai desc — bila
     manifest masih ramping, render ulang sekali begitu detail
     tiba (pola yang sama seperti renderBaru). */
  if (needsDetails(manifest)) {
    rerenderAfterDetails(host, () => renderSpotlight(host, manifest, tanggalWIB));
  }
  return true;
}

/* S-U5 (v6.22.0, manifest split): render-now + re-render sekali.
   Render pertama jalan langsung dengan data yang ada (ramping);
   bila manifest masih ramping, satu re-render dijadwalkan begitu
   detail tiba. Dijaga: satu host hanya dijadwalkan sekali
   (WeakSet); re-render hanya jalan bila host masih di DOM; pass
   kedua menemukan detail sudah menempel, jadi tidak ada loop.
   Di Node (tanpa document) tidak menjadwalkan apa-apa. */
const detailsRerenderHosts = new WeakSet();
function rerenderAfterDetails(host, rerender) {
  if (!host || typeof document === 'undefined') return;
  if (detailsRerenderHosts.has(host)) return;
  detailsRerenderHosts.add(host);
  loadManifestDetails().then((ok) => {
    if (ok && document.body.contains(host)) rerender();
  });
}

/* ================= C. (OPSIONAL) COBA TOOL ACAK =================
   Tombol jelajah di beranda, di bawah tombol "Semua tools".
   Opsional: koordinator boleh melewatkan wiring ini bila beranda
   sudah terasa penuh. */
export function pickRandomTool(manifest, excludeId = null) {
  const pool = (manifest || []).filter((m) => visible(m) && m.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* Tombol memakai kelas .allbtn + .glass yang sudah ada (aksen putih
   saja); inline style hanya menormalkan <button> (lebar penuh,
   kursor tangan) karena .allbtn aslinya dipakai di <a>. */
export function acakButtonHTML(riseIndex = 7) {
  return `<button class="allbtn glass rise" id="acakBtn" type="button" style="--i:${riseIndex};margin-top:10px;width:100%;text-align:left;cursor:pointer">
      <span>🎲 Coba tool acak</span>
      <span class="ago" aria-hidden="true">→</span>
    </button>`;
}

/* ================= D. HELPER VIEW BERANDA (pindah dari app.js, v6.14.0) =================
   Fungsi-fungsi di bawah ini HANYA dipakai view beranda home() — dipindah
   ke sini supaya app.js tinggal mengorkestrasi view, bukan menampung
   semua helpernya. Isi fungsi verbatim dari app.js v6.13.0, kecuali
   renderPopuler() yang kini menerima daftar istilah populer sebagai
   parameter (lihat catatan F di header). */

/* ---------------- sapaan waktu ---------------- */
export function greet() {
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

/* placeholder hero: contoh nyata, rotasi 3 dtk */
export const PH_EXAMPLES = [
  'Coba "gaji"...', 'Coba "weton"...', 'Coba "gaji pokok"...', 'Coba "kompres foto"...',
  'Coba "qr"...', 'Coba "password"...', 'Coba "camelot"...', 'Coba "THR"...',
];
/* satu timer bersama (T02 B5): kunjungan beranda berulang tidak menumpuk interval.
   Router memanggil stopPlaceholderRotation() tiap ganti view. */
let phTimer = null;
export function startPlaceholderRotation(input) {
  clearInterval(phTimer);
  let i = 0;
  phTimer = setInterval(() => { if (document.body.contains(input)) { i = (i + 1) % PH_EXAMPLES.length; input.placeholder = PH_EXAMPLES[i]; } }, 3000);
}
export function stopPlaceholderRotation() {
  clearInterval(phTimer);
}

/* kartu "Lanjutkan": alat terakhir dibuka */
export function renderContinue() {
  const host = document.getElementById('contd');
  if (!host) return;
  const r = getRecent()[0];
  const m = r && byId(r.id);
  if (!m) { host.innerHTML = ''; return; }
  host.innerHTML = `
    <a class="contd glass rise" style="--i:1" href="#/t/${esc(m.id)}">
      <span class="cic" aria-hidden="true">${esc(m.icon)}</span>
      <span class="ctx">
        <span class="clbl">Lanjutkan</span>
        <span class="cnm">${esc(m.name)}</span>
        <span class="cts">dibuka ${timeAgo(r.t)}</span>
      </span>
      <span class="cgo" aria-hidden="true">→</span>
    </a>`;
}

/* Populer: istilah populer -> tool teratas tiap istilah.
   `terms` = istilah dari Supabase (supabase.js); kosong/undefined =
   daftar fallback yang sama seperti dulu.
   (S-F9, S-A5 F1) Dua perubahan:
   1. Hasil pencarian di-cache per istilah di Map modul ini, jadi
      render kedua (istilah live Supabase) tidak menghitung ulang
      istilah yang sudah dicari, dan kunjungan beranda berikutnya
      dalam sesi yang sama tidak membayar 6 pencarian lagi.
   2. renderPopuler() sendiri tetap sinkron, tapi home() TIDAK
      memanggilnya langsung lagi: pakai afterFirstPaint() supaya
      pencarian (sampai ~1-2 dtk di VM ukur) jalan SESUDAH konten
      pertama tampil, bukan sebelumnya. */
export const POPULER_FALLBACK = ['kalkulator thr', 'weton jawa', 'kompres gambar', 'password aman', 'camelot wheel', 'qr code'];

/* Istilah -> tool teratas (atau null bila tidak ada hasil). Cache
   per sesi: istilah yang sama tidak dicari ulang. Murni (tanpa DOM)
   supaya bisa dites di Node.
   S-U5 (v6.22.0, manifest split): cache dibuang begitu versi detail
   berubah — peringkat dari indeks ramping bisa salah (terukur:
   'weton jawa' dan 'password aman' beda peringkat 1 antara indeks
   ramping dan penuh), jadi hasil lama tidak boleh dipertahankan. */
const populerCache = new Map();
let populerCacheVersion = manifestDetailsVersion;
export function cariPopuler(terms, manifest) {
  if (populerCacheVersion !== manifestDetailsVersion) {
    populerCache.clear();
    populerCacheVersion = manifestDetailsVersion;
  }
  const list = (terms && terms.length) ? terms : POPULER_FALLBACK;
  const seen = new Set(), tools = [];
  for (const t of list) {
    let hit = populerCache.get(t);
    if (hit === undefined) {
      hit = rankedSearchPlus(t, manifest)[0] || null;
      populerCache.set(t, hit);
    }
    if (hit && !seen.has(hit.id) && !SEARCH_DENY.includes(hit.id)) { seen.add(hit.id); tools.push(hit); }
    if (tools.length >= 8) break;
  }
  return tools;
}

/* Jalankan `fn` sesudah paint pertama. Dua rAF memastikan satu frame
   sudah tampil (rAF pertama jalan sebelum paint, kedua sesudahnya),
   lalu requestIdleCallback (bila ada, batas 800 ms) menunggu main
   thread menganggur; tanpa itu, setTimeout 0. Di Node (tanpa window)
   langsung jalan supaya harness bisa memakainya. */
export function afterFirstPaint(fn) {
  if (typeof window === 'undefined') { fn(); return; }
  const run = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => fn(), { timeout: 800 });
    else setTimeout(fn, 0);
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

export function renderPopuler(terms, manifest, status = 'pending') {
  const rail = document.getElementById('popRail');
  if (!rail) return;
  /* S-U1 (v6.22.0, F-06): jangan render ulang rail saat pengguna
     sedang menggesernya — isi yang bertukar di tengah geseran
     adalah kedip yang membingungkan (dulu: render ulang diam-diam
     begitu fetch Supabase berhasil). Render ditunda dan dicoba
     lagi tiap 1,2 dtk sampai rail senggang (maks 10x, lalu
     dipaksakan supaya konten tidak basi selamanya). */
  if (populerBusy(rail)) {
    populerPending = { terms, manifest, status };
    schedulePopulerRetry();
    return;
  }
  populerPending = null;
  const tools = cariPopuler(terms, manifest);
  rail.innerHTML = tools.map(hcardHTML).join('');
  watchFadeX(rail);
  /* S-U5 (v6.22.0, manifest split): peringkat Populer memakai
     pencarian — bila manifest masih ramping, render ulang sekali
     begitu detail tiba supaya peringkatnya memakai indeks penuh.
     Dijaga satu penjadwalan aktif; bila detail gagal dimuat, flag
     dilepas supaya render berikutnya boleh mencoba lagi (loader
     sendiri punya jeda 30 dtk sesudah gagal). */
  if (needsDetails(manifest) && !populerRerenderScheduled) {
    populerRerenderScheduled = true;
    loadManifestDetails().then((ok) => {
      populerRerenderScheduled = false;
      if (ok) renderPopuler(terms, manifest, status);
    });
  }
  /* S-U1 (v6.22.0, F-06 + handoff S-U4): pesan jujur soal sumber.
     status 'stale' (fetch Supabase gagal) -> rail menampilkan
     fallback lokal + pesan "Populer tidak diperbarui." di bawah
     rail, bukan berpura-pura live. 'live'/'pending' -> tanpa
     pesan (pending: fetch belum selesai, pesan "tidak diperbarui"
     saat itu adalah klaim yang salah). */
  const sec = rail.closest('section');
  const note = sec ? sec.querySelector('.pop-note') : null;
  if (status === 'stale') {
    if (note) note.textContent = 'Populer tidak diperbarui.';
    else {
      const p = document.createElement('p');
      p.className = 'secnote pop-note';
      p.textContent = 'Populer tidak diperbarui.';
      rail.insertAdjacentElement('afterend', p);
    }
  } else if (note) note.remove();
}

/* Rail sedang dipakai? Hover, fokus di dalam rail, atau baru saja
   digeser (<1,5 dtk lalu — scroll sesudah innerHTML diganti akan
   melompat ke awal, itu yang dihindari). */
let populerPending = null;
let populerRetryTimer = null;
let populerLastScroll = 0;
let populerScrollWatched = false;
let populerRerenderScheduled = false; /* S-U5: re-render detail sekali */
function populerBusy(rail) {
  if (rail.matches(':hover')) return true;
  if (rail.contains(document.activeElement)) return true;
  if (Date.now() - populerLastScroll < 1500) return true;
  return false;
}
function schedulePopulerRetry() {
  const rail = document.getElementById('popRail');
  if (rail && !populerScrollWatched) {
    populerScrollWatched = true;
    rail.addEventListener('scroll', () => { populerLastScroll = Date.now(); }, { passive: true });
  }
  if (populerRetryTimer) return;
  let tries = 0;
  const tick = () => {
    populerRetryTimer = null;
    if (!populerPending) return;
    const r = document.getElementById('popRail');
    if (!r) { populerPending = null; return; }
    if (populerBusy(r) && tries < 10) {
      tries += 1;
      populerRetryTimer = setTimeout(tick, 1200);
      return;
    }
    const p = populerPending;
    populerPending = null;
    renderPopuler(p.terms, p.manifest, p.status);
  };
  populerRetryTimer = setTimeout(tick, 1200);
}

/* Riwayat: carousel tool terakhir dibuka */
export function renderRecent() {
  const rail = document.getElementById('recRail');
  const sec = document.getElementById('recSec');
  if (!rail || !sec) return;
  const recs = getRecent().map((x) => byId(x.id)).filter(Boolean).slice(0, 10);
  if (!recs.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  rail.innerHTML = recs.map(hcardHTML).join('');
  watchFadeX(rail);
}
