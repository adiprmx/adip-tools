/* ============================================================
   ADIP Tools v6.14.0 — onboarding.js (P1-B1)
   Pengantar kunjungan pertama + keadaan beranda pengunjung baru.

   Spesifikasi: ~/workspace/adip-tools-upgrade/v6.14.0/
     - p1p2-riset-desain.md §5.2 (P1-A hero, P1-B lembar
       orientasi, P1-C "Mulai dari sini")
     - p1p2-copy.md §3 (copy pengantar FINAL) + §4 (copy hero)
   Copy di bawah ini dipakai PERSIS seperti tertulis di dokumen
   copy. Jangan ubah stringnya tanpa persetujuan tim copy (R2).

   KEPUTUSAN (alasan satu baris tiap butir, R-31):
   - Pengunjung baru = tanpa riwayat DAN tanpa favorit
     (localStorage adip_recent/adip_fav yang sudah ada); tidak
     ada flag baru kecuali adip_onb.
   - Lembar orientasi = dialog NON-modal (tanpa aria-modal dan
     tanpa jebakan fokus): spesifikasi menuntut lembar "tidak
     mengunci halaman di belakangnya", jadi Tab boleh keluar ke
     halaman; Esc, tombol tutup, backdrop, dan geser ke bawah
     semuanya menutup. Fokus masuk ke judul saat dibuka dan
     kembali ke elemen semula saat ditutup.
   - Setiap cara menutup menulis flag adip_onb (tugas P1:
     "hanya muncul sekali"). Centang "Jangan tampilkan lagi"
     di copy §3.5 bersifat opsional dan tidak dipakai, karena
     semua penutupan sudah berarti tidak muncul lagi.
   - Deep link tidak pernah terganggu: lembar hanya dijadwalkan
     dari home() dan dicek ulang saat timer 1,2 dtk berbunyi —
     bila hash bukan beranda, lembar batal. Navigasi apa pun
     (hashchange) menutup lembar yang sedang terbuka.
   - Langkah TIDAK dirender sebagai ikon bulat + angka 1-2-3
     (R-05): tiap langkah punya bentuk isi yang berbeda —
     langkah 1 chip contoh yang benar-benar menjalankan
     pencarian, langkah 2 kartu demo dengan tombol ♥ yang
     benar-benar menyimpan favorit, langkah 3 tombol aksi
     utama. Tidak ada UI mati di lembar ini.
   ============================================================ */
import { esc } from './core.js';
import { byId, catLabel } from './catalog.js';
import { getFav, getRecent, isFav, toggleFav } from './store.js';
import { hcardHTML } from './shell-ui.js';

/* Kunci flag "pengantar sudah dilihat" (nilai = cap waktu ms
   saat ditutup). Mengikuti konvensi adip_fav/adip_recent. */
export const ONB_KEY = 'adip_onb';
/* Jeda setelah hero dimuat sebelum lembar muncul (§5.2 P1-B). */
export const ONB_DELAY_MS = 1200;

/* ---------- keadaan pengunjung ---------- */

/* Pengunjung baru = belum pernah membuka tool (tanpa riwayat)
   dan belum pernah menyimpan favorit. Bila storage tidak bisa
   dibaca, anggap pengunjung kembali (gagal tertutup: jangan
   ganggu dengan pengantar). Probe getItem di bawah WAJIB ada:
   getRecent()/getFav() menelan throw lewat loadJson dan
   mengembalikan [], jadi tanpa probe ini storage yang rusak
   terbaca sebagai pengunjung baru (temuan P1-QA RED-03). */
export function isNewVisitor() {
  try {
    localStorage.getItem(ONB_KEY);
    return getRecent().length === 0 && getFav().length === 0;
  } catch {
    return false;
  }
}

/* Cadangan dalam memori bila flag tidak bisa ditulis ke storage
   (penuh/diblokir-tulis): lembar tetap sekali tampil selama sesi
   berjalan, bukan muncul lagi tiap kembali ke beranda
   (temuan P1-QA RED-02). Muat ulang halaman penuh tetap
   menampilkan lagi — tidak bisa dihindari tanpa storage. */
let seenMemory = false;

/* Flag sudah dilihat? Bila storage tidak bisa dibaca, anggap
   sudah (gagal tertutup). */
export function hasSeenOnboarding() {
  if (seenMemory) return true;
  try {
    return localStorage.getItem(ONB_KEY) !== null;
  } catch {
    return true;
  }
}

/* Tulis flag (semua cara menutup memanggil ini). */
export function markOnboardingSeen() {
  seenMemory = true;
  try {
    localStorage.setItem(ONB_KEY, String(Date.now()));
  } catch { /* storage penuh/diblokir: cadangan memori di atas yang berlaku */ }
}

/* ---------- hero pengunjung baru (P1-A) ---------- */

/* LP-SUB FINAL (p1p2-copy.md §4.1) — dipakai persis. */
export const HERO_SUB = 'Kalkulator gaji, kompres foto, bikin QR, sampai tools DJ. Semua gratis, langsung pakai.';

/* Baris tiga bukti singkat (§5.2 P1-A). Angka diambil dari
   manifest (parameter n), bukan ditulis mati. Kata "tools"
   dipakai konsisten mengikuti aturan suara copy §1.2.
   v6.15.0 P1 (temuan 3): tiap bukti jadi chip berikon (gaya di
   css/polish-p1.css). Teks TIDAK diubah; ikon emoji mengikuti
   sistem ikon situs ini (semua ikon tool/kategori emoji) dan
   relevan dengan isinya: laptop = hitungan jalan di perangkat
   kamu, gembok terbuka = tidak ada yang terkunci di balik akun,
   tombol FREE = gratis. Chip adalah <li>, bukan tombol: bukti
   dibaca, bukan diklik. */
export function heroProofHTML(n) {
  const count = Number(n) || 0;
  return `<ul class="hero-proof" aria-label="Tentang situs ini">
    <li><span class="hp-ic" aria-hidden="true">💻</span>Hitungan jalan di browser kamu</li>
    <li><span class="hp-ic" aria-hidden="true">🔓</span>Tanpa daftar</li>
    <li><span class="hp-ic" aria-hidden="true">🆓</span>${count} tools, gratis</li>
  </ul>`;
}

/* ---------- seksi "Mulai dari sini" (P1-C) ---------- */

/* Empat pintu masuk (§5.2 P1-C): teratas di rail Populer
   fallback, mewakili 4 kategori berbeda. ID diverifikasi ada
   di manifest v6.13.0; yang hilang difilter, bukan dikarang. */
export const MULAI_IDS = ['kalkulator-gaji-bersih', 'kalender-jawa', 'image-compress', 'qr-generator'];

/* HTML seksi (string kosong bila tidak ada satu pun tool yang
   ditemukan — seksi kosong lebih jujur daripada kartu karangan).
   Kartu memakai .hcard yang sudah ada; hanya wadahnya grid. */
export function mulaiDariSiniHTML(manifest) {
  const tools = MULAI_IDS.map((id) => byId(id)).filter(Boolean);
  if (!tools.length) return '';
  return `<section class="sec rise" style="--i:2" aria-label="Mulai dari sini">
      <div class="sechead"><h2>Mulai dari sini</h2></div>
      <div class="mulai-grid">${tools.map(hcardHTML).join('')}</div>
    </section>`;
}

/* ---------- lembar orientasi (P1-B) ---------- */

/* Copy FINAL p1p2-copy.md §3 — dipakai persis. `cari` adalah
   label langkah untuk pembaca layar (§3.6). */
const OB_TITLE = 'Baru pertama ke sini?';
const OB_SUB = 'Tiga hal singkat biar kamu langsung bisa pakai.';
const STEPS = [
  {
    title: 'Tulis yang kamu butuhkan',
    body: 'Ketik di kotak cari, misal "kalkulator gaji" atau "kecilkan foto".',
    sr: 'Cari tools',
    kind: 'cari',
  },
  {
    title: 'Simpan yang sering dipakai',
    body: 'Ketuk ♥ di kartu tools. Besok tinggal buka dari Favorit.',
    sr: 'Simpan favorit',
    kind: 'simpan',
  },
  {
    title: 'Gratis, tanpa daftar',
    body: 'Tidak perlu buat akun. Buka, pakai, selesai.',
    sr: 'Gratis tanpa daftar',
    kind: 'gratis',
  },
];
/* Contoh pencarian langkah 1 (kata yang sama dengan isi body). */
const CONTOH_CARI = ['kalkulator gaji', 'kecilkan foto'];
/* Tool demo langkah 2: kartu nyata + tombol ♥ nyata. */
const DEMO_ID = 'kalkulator-gaji-bersih';

let sheetRoot = null;
let timerId = null;
let stepIndex = 0;
let lastFocus = null;
let hashWatching = false;

/* Hash saat ini masih beranda murni? (Bukan deep link, bukan
   hash aneh yang jatuh ke fallback home.) */
function hashIsHome() {
  const h = location.hash || '';
  return h === '' || h === '#/';
}

function onHashChange() {
  if (timerId !== null) { clearTimeout(timerId); timerId = null; }
  if (sheetRoot) closeSheet();
}

/* Jadwalkan lembar 1,2 dtk sesudah home() dirender. Dipanggil
   dari home() setiap kali beranda dirender; semua penjaga ada
   di sini dan dicek ulang saat timer berbunyi. */
export function maybeShowOnboarding(manifest) {
  if (!hashWatching) {
    hashWatching = true;
    window.addEventListener('hashchange', onHashChange);
  }
  if (timerId !== null) { clearTimeout(timerId); timerId = null; }
  if (sheetRoot) return;
  if (!hashIsHome() || !isNewVisitor() || hasSeenOnboarding()) return;
  timerId = setTimeout(() => {
    timerId = null;
    if (sheetRoot) return;
    if (!hashIsHome() || !isNewVisitor() || hasSeenOnboarding()) return;
    openSheet(manifest);
  }, ONB_DELAY_MS);
}

/* ---------- bangun + buka lembar ---------- */

function stepExtraHTML(step, manifest) {
  if (step.kind === 'cari') {
    /* Chip contoh: tombol NYATA yang menjalankan pencarian. */
    return `<div class="onb-chips">${CONTOH_CARI.map((t) =>
      `<button class="onb-chip" type="button" data-cari="${esc(t)}" aria-label="Cari ${esc(t)}"><span aria-hidden="true">⌕</span> ${esc(t)}</button>`).join('')}
    </div>`;
  }
  if (step.kind === 'simpan') {
    const m = byId(DEMO_ID);
    if (!m) return '';
    const fav = isFav(m.id);
    /* Kartu demo: tautan NYATA ke tool + tombol ♥ NYATA yang
       menyimpan/menghapus favorit tool itu juga. */
    return `<div class="onb-demo">
      <a class="onb-demo-card" href="#/t/${esc(m.id)}">
        <span class="onb-demo-ic" aria-hidden="true">${esc(m.icon)}</span>
        <span class="onb-demo-tx">
          <span class="onb-demo-nm">${esc(m.name)}</span>
          <span class="onb-demo-ct">${esc(catLabel(m.cat))}</span>
        </span>
        <span class="onb-demo-go" aria-hidden="true">→</span>
      </a>
      <button class="onb-favbtn${fav ? ' on' : ''}" type="button" data-demo-fav="${esc(m.id)}" aria-pressed="${fav ? 'true' : 'false'}" aria-label="${fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}"><span aria-hidden="true">♥</span> <span data-fav-label>${fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}</span></button>
    </div>`;
  }
  return '';
}

function stepHTML(step) {
  return `<h3 class="onb-step-title" id="onbStepTitle" tabindex="-1">${esc(step.title)}</h3>
    <p class="onb-step-body">${esc(step.body)}</p>`;
}

function renderStep(manifest) {
  const body = sheetRoot.querySelector('#onbBody');
  const nav = sheetRoot.querySelector('#onbStepNav');
  const foot = sheetRoot.querySelector('#onbFoot');
  const step = STEPS[stepIndex];
  body.innerHTML = stepHTML(step) + stepExtraHTML(step, manifest);
  /* Indikator posisi: teks terlihat "Langkah N dari 3" +
     label lengkap untuk pembaca layar (§3.6). */
  nav.innerHTML = `<span aria-hidden="true">Langkah ${stepIndex + 1} dari ${STEPS.length}</span><span class="onb-sr">Langkah ${stepIndex + 1} dari ${STEPS.length}: ${esc(step.sr)}</span>`;
  /* Tombol kaki: Lewati selalu ada; Kembali hanya langkah 2-3;
     Lanjut di langkah 1-2, "Mulai pakai" di langkah 3. */
  foot.innerHTML = `
    <button class="onb-skip" type="button" data-act="lewati" aria-label="Lewati pengantar">Lewati</button>
    <span class="onb-spacer" aria-hidden="true"></span>
    ${stepIndex > 0 ? '<button class="onb-back" type="button" data-act="kembali" aria-label="Kembali ke langkah sebelumnya">Kembali</button>' : ''}
    ${stepIndex < STEPS.length - 1
      ? '<button class="onb-next" type="button" data-act="lanjut" aria-label="Lanjut ke langkah berikutnya">Lanjut</button>'
      : '<button class="onb-next" type="button" data-act="selesai" aria-label="Mulai pakai ADIP Tools">Mulai pakai</button>'}`;
  wireStep(body, foot);
  /* Pindahkan fokus ke judul langkah agar pembaca layar
     mengumumkan langkah baru. */
  const h = body.querySelector('#onbStepTitle');
  if (h) h.focus({ preventScroll: true });
}

function wireStep(body, foot) {
  body.querySelectorAll('[data-cari]').forEach((b) => {
    b.addEventListener('click', () => {
      const q = b.getAttribute('data-cari');
      closeSheet();
      location.hash = '#/semua?q=' + encodeURIComponent(q);
    });
  });
  const favBtn = body.querySelector('[data-demo-fav]');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const id = favBtn.getAttribute('data-demo-fav');
      toggleFav(id);
      const on = isFav(id);
      favBtn.classList.toggle('on', on);
      favBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      favBtn.setAttribute('aria-label', on ? 'Hapus dari favorit' : 'Tambah ke favorit');
      const lbl = favBtn.querySelector('[data-fav-label]');
      if (lbl) lbl.textContent = on ? 'Hapus dari favorit' : 'Tambah ke favorit';
    });
  }
  foot.querySelectorAll('[data-act]').forEach((b) => {
    b.addEventListener('click', () => {
      const act = b.getAttribute('data-act');
      if (act === 'lewati' || act === 'selesai') { closeSheet(); return; }
      if (act === 'lanjut' && stepIndex < STEPS.length - 1) { stepIndex += 1; renderStep(); return; }
      if (act === 'kembali' && stepIndex > 0) { stepIndex -= 1; renderStep(); }
    });
  });
}

function onKeyDown(e) {
  if (e.key === 'Escape' && sheetRoot) { e.preventDefault(); closeSheet(); }
}

/* Geser ke bawah untuk menutup (§5.2 P1-B). Hanya dari area
   pegangan/judul, supaya isi lembar tetap bisa di-scroll.
   Offset digeser lewat properti `translate` (bukan transform)
   agar tidak menabrak transform slide-up sheet di desktop. */
function wireDrag(sheet) {
  const zone = sheet.querySelector('.onb-dragzone');
  if (!zone) return;
  let startY = null, dy = 0, dragged = false;
  zone.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    startY = e.clientY; dy = 0; dragged = false;
    zone.setPointerCapture(e.pointerId);
  });
  zone.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    dy = Math.max(0, e.clientY - startY);
    if (dy > 8) dragged = true;
    if (dragged) {
      sheet.classList.add('dragging');
      sheet.style.translate = `0px ${dy}px`;
    }
  });
  const end = () => {
    if (startY === null) return;
    startY = null;
    sheet.classList.remove('dragging');
    if (dragged && dy > 90) { closeSheet(); return; }
    sheet.style.translate = '';
    /* Klik yang lahir dari sebuah geseran jangan sampai
       menekan tombol di bawahnya. */
    if (dragged) {
      const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
      sheet.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => sheet.removeEventListener('click', swallow, { capture: true }), 0);
    }
    dragged = false;
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}

function openSheet(manifest) {
  if (sheetRoot) return;
  stepIndex = 0;
  lastFocus = (document.activeElement instanceof Element) ? document.activeElement : null;
  const root = document.createElement('div');
  root.className = 'onb-root';
  root.innerHTML = `
    <div class="onb-backdrop" aria-hidden="true"></div>
    <div class="onb-sheet" role="dialog" aria-label="Pengantar singkat" aria-describedby="onbTitle onbSub">
      <div class="onb-dragzone">
        <div class="onb-grip" aria-hidden="true"></div>
        <div class="onb-head">
          <h2 class="onb-title" id="onbTitle" tabindex="-1">${esc(OB_TITLE)}</h2>
          <button class="onb-close" type="button" data-act="tutup" aria-label="Tutup pengantar">×</button>
        </div>
        <p class="onb-sub" id="onbSub">${esc(OB_SUB)}</p>
      </div>
      <div class="onb-body" id="onbBody"></div>
      <p class="onb-stepnav" id="onbStepNav"></p>
      <div class="onb-foot" id="onbFoot"></div>
    </div>`;
  document.body.appendChild(root);
  sheetRoot = root;
  const sheet = root.querySelector('.onb-sheet');
  root.querySelector('.onb-backdrop').addEventListener('click', closeSheet);
  root.querySelector('[data-act="tutup"]').addEventListener('click', closeSheet);
  document.addEventListener('keydown', onKeyDown);
  wireDrag(sheet);
  renderStep(manifest);
  /* Masuk dengan animasi slide-up (satu frame jeda agar
     transisi sempat berjalan). */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (sheetRoot) sheetRoot.classList.add('open');
  }));
  /* Fokus awal ke judul lembar (bukan ke tombol) agar pembaca
     layar mendengar judul + deskripsinya. renderStep() sudah
     memindahkan fokus ke judul langkah; kembalikan ke judul
     lembar untuk pembukaan pertama. */
  const title = root.querySelector('#onbTitle');
  if (title) title.focus({ preventScroll: true });
}

/* Menutup SELALU menulis flag: lembar hanya muncul sekali,
   lewat cara apa pun pengunjung menutupnya. */
export function closeSheet() {
  if (!sheetRoot) return;
  markOnboardingSeen();
  document.removeEventListener('keydown', onKeyDown);
  const root = sheetRoot;
  sheetRoot = null;
  root.classList.remove('open');
  root.classList.add('closing');
  const remove = () => { if (root.parentNode) root.parentNode.removeChild(root); };
  /* Di bawah prefers-reduced-motion transisi berdurasi
     0,01 ms (aturan global style.css); timeout 380 ms memberi
     ruang bagi transisi keluar 0,35 dtk di keadaan normal. */
  setTimeout(remove, 380);
  if (lastFocus && document.contains(lastFocus)) {
    lastFocus.focus({ preventScroll: true });
  }
  lastFocus = null;
}
