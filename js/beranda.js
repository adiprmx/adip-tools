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

/* Alias kompatibilitas: fade tepi carousel kini satu sumber di
   shell-ui.js (watchFadeX); nama lama tetap diekspor supaya
   pemanggil yang memakai attachRailFade tidak rusak. */
export { watchFadeX as attachRailFade } from './shell-ui.js';

const visible = (m) => Boolean(m) && !SEARCH_DENY.includes(m.id);

/* ================= A. SHOWCASE "BARU DITAMBAHKAN" =================
   Fakta audit: field `since` di manifest HANYA diisi untuk rilis
   6.11.0 (147 tool). Tidak ada satu pun tool dengan since 6.11.1–
   6.11.5, sehingga isNew() di app.js saat ini false untuk SEMUA
   tool (chip "Terbaru" di #/semua pun tidak muncul). Supaya section
   ini tidak mati bila sync-manifest lupa memberi cap since untuk
   tool baru 6.12.0, renderBaru() memakai fallback JUJUR: bila tidak
   ada tool dengan since === VERSION, tampilkan batch `since`
   terbaru yang ada, dengan label versi aslinya ("dari versi
   6.11.0") — bukan diklaim sebagai baru di versi ini. */

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
  return `
  <a class="baru-card glass" href="#/t/${m.id}" aria-label="${esc(m.name)}">
    <span class="bic" aria-hidden="true">${m.icon}</span>
    <span class="btx">
      <span class="bnm">${esc(m.name)}</span>
      <span class="bds">${esc(m.desc || '')}</span>
      <span class="bct">${catLabel(m.cat)}</span>
    </span>
  </a>`;
}

/* HTML isi section "Baru ditambahkan" (tanpa tag <section> — wadah
   section-nya milik template home() di app.js). Mode 'strict' =
   tool baru di versi ini; mode 'latest' = fallback batch terbaru
   dengan label versi aslinya. v6.15.0 P1: kartu lebar
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
   (tidak ada tool baru sama sekali — wadah display:none).
   v6.15.0 P1: pemilihan tool lewat curateNewTools (satu per
   kategori dari batch yang sama) — lihat catatan di sana. */
export function renderBaru(host, manifest, version, { limit = 8 } = {}) {
  if (!host) return false;
  let tools = curateNewTools(manifest, version, limit);
  let mode = 'strict';
  let v = version;
  if (!tools.length) {
    v = latestSince(manifest);
    tools = v ? curateNewTools(manifest, v, limit) : [];
    mode = 'latest';
  }
  if (!tools.length) {
    host.style.display = 'none';
    host.innerHTML = '';
    return false;
  }
  host.style.display = '';
  host.innerHTML = baruSectionHTML(tools, { version: v, mode });
  return true;
}

/* ================= B. META KATEGORI =================
   Deskripsi satu baris + 3 tool unggulan per kategori, untuk halaman
   #/k/<id>. "Unggulan" = pilihan kurasi TIM 08 (tool yang paling
   berguna/umum dipakai di kategorinya), BUKAN klaim peringkat
   pemakaian — label di layar memakai "Coba dulu / mulai dari sini",
   bukan "paling populer". Semua ID di bawah diverifikasi ada di
   manifest v6.11.5 (588 tool); catUnggulan() tetap memfilter ID yang
   hilang, jadi aman bila ada tool yang dihapus di rilis berikut. */
export const CAT_META = {
  keamanan: { desc: 'Jaga akun dan datamu: sandi kuat, cek kebocoran, dan kenali modus penipuan sebelum kena.', unggulan: ['password-generator', 'password-strength', 'cek-privasi-tempel'] },
  converter: { desc: 'Ubah format apa pun: satuan, video, file, sampai angka dan takaran masak.', unggulan: ['unit-converter', 'video-ke-mp3', 'terbilang'] },
  developer: { desc: 'Alat bantu ngoding: rapikan JSON, tes regex, sampai bongkar token JWT.', unggulan: ['json-formatter', 'regex-tester', 'jwt-parser'] },
  desain: { desc: 'Bikin tampilan lebih bagus: warna, QR, gradasi, sampai mockup HP.', unggulan: ['qr-generator', 'palette', 'gradient'] },
  indonesia: { desc: 'Hitungan khas Indonesia: THR, pajak, weton, sampai biaya SIM dan STNK.', unggulan: ['kalender-jawa', 'thr', 'pph21'] },
  musik: { desc: 'Buat yang main musik atau DJ: tempo, chord, sampai rencana setlist.', unggulan: ['camelot', 'metronome', 'tap-bpm'] },
  gambar: { desc: 'Olah foto langsung di browser: kompres, potong, hapus latar. Tanpa upload.', unggulan: ['image-compress', 'removebg', 'crop-pas-foto'] },
  teks: { desc: 'Ubah dan hitung teks: jumlah kata, format WA, sampai bikin hashtag.', unggulan: ['word-counter', 'wa-formatter', 'generator-hashtag'] },
  bisnis: { desc: 'Hitung usaha dan gaji: harga jual, invoice, sampai gaji bersih setelah potongan.', unggulan: ['kalkulator-gaji-bersih', 'buat-invoice', 'margin-markup'] },
  sehari: { desc: 'Keperluan sehari-hari: kesehatan, rumah, hewan peliharaan, sampai tes HP.', unggulan: ['bmi', 'kalori-makanan', 'stopwatch'] },
  fun: { desc: 'Buat seru-seruan: kuis, tebak-tebakan, sampai roda putar buat undian.', unggulan: ['spinwheel', 'tebak-tebakan', 'zodiak-hari-ini'] },
  produktivitas: { desc: 'Biar kerja lebih rapi: CV, timer fokus, PDF, sampai catatan harian.', unggulan: ['pembuat-cv', 'pomodoro', 'pdflab'] },
  pelajar: { desc: 'Bantu belajar: kalkulator, flashcard, sampai latihan SKD CPNS.', unggulan: ['kalkulator-umum', 'flashcard', 'ipk'] },
  liveapi: { desc: 'Data langsung dari internet: jadwal sholat, gempa, kurs, cuaca, dan lainnya.', unggulan: ['jadwal-sholat', 'gempa-bmkg', 'kurs-cuaca'] },
  fakesos: { desc: 'Bikin tangkapan layar bohongan buat lucu-lucuan. Jangan dipakai untuk menipu.', unggulan: ['fake-chat-wa', 'fake-post-ig', 'fake-tweet'] },
  kesehatan: { desc: 'Jaga badan: kenali otot dan latihan yang tepat buat tiap bagian tubuh.', unggulan: ['atlas-otot-latihan'] },
  kreator: { desc: 'Bikin konten lebih cepat: ide hook video sampai carousel siap posting.', unggulan: ['generator-hook-tiktok', 'pembuat-carousel-tiktok-ig'] },
  masak: { desc: 'Masak dari bahan yang ada di dapur: resep rumahan Indonesia, langkah demi langkah.', unggulan: ['masak-dari-bahan'] },
  travel: { desc: 'Siapin perjalanan: cek negara bebas visa buat paspor Indonesia.', unggulan: ['paspor-indonesia-bebas-visa'] },
  sains: { desc: 'Hitung dan simulasi sains: listrik, gerak, sampai tata surya.', unggulan: ['kalkulator-hukum-ohm', 'simulator-tata-surya', 'simulator-gravitasi'] },
  otomotif: { desc: 'Hitung kendaraanmu: bensin, cas mobil listrik, sampai harga jual mobil bekas.', unggulan: ['kalkulator-konsumsi-bbm', 'kalkulator-biaya-cas-mobil-listrik', 'kalkulator-depresiasi-mobil'] },
  rumah: { desc: 'Hitung kebutuhan rumah: atap, keramik, tangga, sampai tangki air.', unggulan: ['kalkulator-keramik-ubin', 'kalkulator-atap', 'kalkulator-volume-tangki-air'] },
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
    <a class="contd glass rise" style="--i:1" href="#/t/${m.id}">
      <span class="cic" aria-hidden="true">${m.icon}</span>
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
   daftar fallback yang sama seperti dulu. */
export function renderPopuler(terms, manifest) {
  const rail = document.getElementById('popRail');
  if (!rail) return;
  const list = (terms && terms.length) ? terms : ['kalkulator thr', 'weton jawa', 'kompres gambar', 'password aman', 'camelot wheel', 'qr code'];
  const seen = new Set(), tools = [];
  for (const t of list) {
    const hit = rankedSearchPlus(t, manifest)[0];
    if (hit && !seen.has(hit.id) && !SEARCH_DENY.includes(hit.id)) { seen.add(hit.id); tools.push(hit); }
    if (tools.length >= 8) break;
  }
  rail.innerHTML = tools.map(hcardHTML).join('');
  watchFadeX(rail);
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
