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
   A. Showcase "Baru ditambahkan" di beranda — carousel tool baru
      (since === VERSION). Beranda saat ini TIDAK punya section ini;
      tool baru hanya kelihatan lewat chip filter di #/semua.
   B. Meta kategori — deskripsi satu baris + 3 tool unggulan per
      kategori, untuk halaman #/k/<id> yang saat ini cuma judul +
      jumlah + grid tanpa pengantar.
   C. (OPSIONAL) "Coba tool acak" — tombol jelajah di beranda.

   KONTRAK:
   - Murni + tanpa side effect di top-level: semua fungsi menerima
     manifest sebagai parameter, supaya bisa dites tanpa browser.
   - Hanya memakai kelas CSS yang SUDAH ADA di css/style.css
     (.sec, .sechead, .hscroll, .hcard, .glass, .rise, .allbtn)
     + inline style meniru pola app.js. Tanpa CSS baru.
   - Aksen PUTIH saja (chip BARU memakai gaya inline yang sama
     persis dengan cardEl di app.js). Copy bahasa Indonesia
     sehari-hari; tanpa klaim popularitas yang tidak terukur.
   ============================================================ */
import { esc } from './core.js?v=6.12.1';

/* selaras dengan SEARCH_DENY di app.js */
const SEARCH_DENY = ['muse-test'];
const visible = (m) => Boolean(m) && !SEARCH_DENY.includes(m.id);

/* label kategori — salinan CATS di app.js (fallback bila pemanggil
   tidak mengoper label sendiri). Bila label berubah di app.js,
   ubah juga di sini. */
const CAT_LABEL = {
  keamanan: 'Keamanan', converter: 'Converter', developer: 'Dev & Web',
  desain: 'Desain', indonesia: 'Indonesia', musik: 'Musik', gambar: 'Gambar',
  teks: 'Teks', bisnis: 'Bisnis', sehari: 'Sehari-hari', fun: 'Fun',
  produktivitas: 'Produktivitas', pelajar: 'Pelajar', liveapi: 'Live API',
  fakesos: 'Fake Sosmed',
};
const catLabel = (id) => CAT_LABEL[id] || 'Lainnya';

/* kartu horizontal — salinan hcardHTML di app.js (dipakai Populer,
   Riwayat, "Lanjut ke"). Disalin supaya modul ini mandiri dan tidak
   bergantung pada fungsi privat app.js. */
const hcardHTML = (m) => `
  <a class="hcard glass" href="#/t/${m.id}" aria-label="${esc(m.name)}">
    <span class="hic" aria-hidden="true">${m.icon}</span>
    <span class="hnm">${esc(m.name)}</span>
    <span class="hct">${esc(catLabel(m.cat))}</span>
  </a>`;

/* fade tepi carousel — cerminan watchFadeX di app.js. Disalin supaya
   modul ini mandiri; perilakunya identik (kelas .fx-r/.fx-l). */
export function attachRailFade(rail) {
  if (!rail || typeof rail.addEventListener !== 'function') return;
  const upd = () => {
    rail.classList.toggle('fx-r', rail.scrollWidth - rail.scrollLeft - rail.clientWidth > 4);
    rail.classList.toggle('fx-l', rail.scrollLeft > 4);
  };
  rail.addEventListener('scroll', upd, { passive: true });
  upd();
}

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

/* HTML isi section "Baru ditambahkan" (tanpa tag <section> — wadah
   section-nya milik template home() di app.js). Mode 'strict' =
   tool baru di versi ini; mode 'latest' = fallback batch terbaru
   dengan label versi aslinya. */
export function baruSectionHTML(tools, { version = '', mode = 'strict' } = {}) {
  if (!tools || !tools.length) return '';
  const sub = mode === 'strict'
    ? `versi ${version}`
    : `dari versi ${version}`;
  return `
    <div class="sechead"><h2>✨ Baru ditambahkan</h2><span class="n">${esc(sub)}</span></div>
    <div class="hscroll" id="baruRail">${tools.map(hcardHTML).join('')}</div>`;
}

/* Render showcase ke wadah <section id="baruSec"> di beranda.
   Mengembalikan true bila section terisi, false bila disembunyikan
   (tidak ada tool baru sama sekali — wadah display:none). */
export function renderBaru(host, manifest, version, { limit = 8 } = {}) {
  if (!host) return false;
  let tools = newTools(manifest, version, limit);
  let mode = 'strict';
  let v = version;
  if (!tools.length) {
    v = latestSince(manifest);
    tools = v ? latestSinceTools(manifest, limit) : [];
    mode = 'latest';
  }
  if (!tools.length) {
    host.style.display = 'none';
    host.innerHTML = '';
    return false;
  }
  host.style.display = '';
  host.innerHTML = baruSectionHTML(tools, { version: v, mode });
  const rail = typeof host.querySelector === 'function'
    ? host.querySelector('#baruRail') : null;
  if (rail) attachRailFade(rail);
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
  indonesia: { desc: 'Hitungan khas Indonesia: THR, pajak, weton, sampai biaya SIM dan STNK.', unggulan: ['weton', 'thr', 'pph21'] },
  musik: { desc: 'Buat yang main musik atau DJ: tempo, chord, sampai rencana setlist.', unggulan: ['camelot', 'metronome', 'tap-bpm'] },
  gambar: { desc: 'Olah foto langsung di browser: kompres, potong, hapus latar — tanpa upload.', unggulan: ['image-compress', 'removebg', 'crop-pas-foto'] },
  teks: { desc: 'Ubah dan hitung teks: jumlah kata, format WA, sampai bikin hashtag.', unggulan: ['word-counter', 'wa-formatter', 'generator-hashtag'] },
  bisnis: { desc: 'Hitung usaha dan gaji: harga jual, invoice, sampai gaji bersih setelah potongan.', unggulan: ['kalkulator-gaji-bersih', 'buat-invoice', 'harga-jual'] },
  sehari: { desc: 'Keperluan sehari-hari: kesehatan, rumah, hewan peliharaan, sampai tes HP.', unggulan: ['bmi', 'kalori-makanan', 'stopwatch'] },
  fun: { desc: 'Buat seru-seruan: kuis, tebak-tebakan, sampai roda putar buat undian.', unggulan: ['spinwheel', 'tebak-tebakan', 'zodiak-hari-ini'] },
  produktivitas: { desc: 'Biar kerja lebih rapi: CV, timer fokus, PDF, sampai catatan harian.', unggulan: ['pembuat-cv', 'pomodoro', 'pdflab'] },
  pelajar: { desc: 'Bantu belajar: kalkulator, flashcard, sampai latihan SKD CPNS.', unggulan: ['kalkulator-umum', 'flashcard', 'ipk'] },
  liveapi: { desc: 'Data langsung dari internet: jadwal sholat, gempa, kurs, cuaca, dan lainnya.', unggulan: ['jadwal-sholat', 'gempa-bmkg', 'kurs-cuaca'] },
  fakesos: { desc: 'Bikin tangkapan layar bohongan buat lucu-lucuan — jangan dipakai untuk menipu.', unggulan: ['fake-chat-wa', 'fake-post-ig', 'fake-tweet'] },
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
    <div class="hscroll" id="catTopRail">${top.map(hcardHTML).join('')}</div>` : '';
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
  const rail = typeof host.querySelector === 'function'
    ? host.querySelector('#catTopRail') : null;
  if (rail) attachRailFade(rail);
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
