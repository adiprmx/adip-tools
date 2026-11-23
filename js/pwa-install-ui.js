/* ============================================================
   ADIP Tools v6.20.0 — pwa-install-ui.js (P8)
   Render MURNI UI install PWA (kontrak R11 §3.2 — DIKUNCI).

   Modul ini HANYA menampilkan/menyembunyikan DOM dan
   melaporkan aksi pengguna lewat callback. DILARANG:
   menyentuh navigator.serviceWorker, beforeinstallprompt,
   localStorage, toast, dan location.reload() — semua itu
   milik js/pwa.js (P10). Gagal tertutup: bila DOM tidak
   ditemukan atau impor gagal, modul diam tanpa UI mati dan
   tanpa melempar.

   Pola yang ditiru: lembar bawah onboarding (js/onboarding.js)
   — non-modal (tanpa aria-modal, tanpa jebakan fokus, tanpa
   kunci scroll), tutup via x / backdrop / Esc / geser-bawah
   (>90px), fokus masuk ke judul saat dibuka dan kembali ke
   pemicu saat ditutup, dua frame requestAnimationFrame
   sebelum class .open agar transisi jalan.

   Copy FINAL R11 §4 (bahasa sehari-hari, tanpa istilah
   teknis): "Pasang ADIP Tools di HP kamu" / "Pasang
   aplikasi" / "Nanti saja".
   PENGECUALIAN v6.22.0 (S-U4, S-A4 F-11): di mode ios-guide,
   tombol utama TIDAK berlabel "Pasang aplikasi" — label itu
   bohong, karena aksinya membuka panduan, bukan memasang.
   Label iOS: "Cara pasang di iPhone" (sama dengan judul
   dialog panduannya, jadi alurnya jelas: ketuk -> baca
   panduan -> ikuti langkahnya).
   ============================================================ */
import { openDialog } from './components.js';
import { esc } from './core.js';

/* Copy FINAL R11 §4 — dipakai persis. */
const SHEET_TITLE = 'Pasang ADIP Tools di HP kamu';
const SHEET_SUB = 'Buka lebih cepat dari layar utama, tanpa ketik alamat lagi. Gratis, tanpa daftar.';
const BTN_INSTALL = 'Pasang aplikasi';
const BTN_LATER = 'Nanti saja';
/* S-U4 (v6.22.0, S-A4 F-11): label JUJUR untuk mode ios-guide —
   tombol ini membuka panduan, bukan memasang. Sama dengan judul
   dialog (IOS_TITLE) supaya pengguna tahu persis apa yang akan
   terbuka sesudah mengetuk. */
const BTN_IOS_GUIDE = 'Cara pasang di iPhone';
const FOOT_LINK_TEXT = 'Pasang aplikasi';
/* Href sengaja BUKAN route nyata — tautan tidak boleh
   menavigasi bila JS gagal; preventDefault selalu mencegah
   navigasi saat JS jalan (kontrak R11 §3.2). */
const FOOT_LINK_HREF = '#/pasang-aplikasi';
const IOS_TITLE = 'Cara pasang di iPhone';
const IOS_BODY = '<p>1. Ketuk tombol Bagikan di bawah layar.<br>2. Geser ke bawah, pilih <strong>Tambah ke Layar Utama</strong>.<br>3. Ketuk <strong>Tambah</strong> di kanan atas.</p>';
const IOS_BTN = 'Mengerti';
/* Langkah ringkas yang sama, untuk isi lembar mode ios-guide. */
const IOS_STEPS = [
  'Ketuk tombol Bagikan di bawah layar.',
  'Geser ke bawah, pilih Tambah ke Layar Utama.',
  'Ketuk Tambah di kanan atas.',
];
/* Ambang geser-bawah untuk menutup + jeda hapus DOM — angka
   yang sama dengan closeSheet() onboarding. */
const DRAG_CLOSE_PX = 90;
const CLOSE_REMOVE_MS = 380;

let sheetRoot = null;
let closeTimer = null;
let lastFocus = null;
let callbacks = null;
let footOnOpen = null;

/* ---------- dialog panduan iOS ---------- */

/* Satu-satunya pemakaian openDialog() di PWA: panduan pasang
   manual iOS Safari (tidak ada beforeinstallprompt di iOS).
   Satu aksi saja ("Mengerti"), TANPA primary/danger —
   .dlg-btn.primary tidak punya gaya di css/components.css
   (kontrak R11 §3.2). Dialog (z 85) menutupi lembar (z 82);
   lembar tetap terbuka di belakang dialog. */
function openIosGuide() {
  openDialog({
    title: IOS_TITLE,
    body: IOS_BODY,
    actions: [{ label: IOS_BTN, onClick: () => {} }],
  });
}

/* ---------- lembar ajakan pasang ---------- */

function onKeyDown(e) {
  if (e.key === 'Escape' && sheetRoot) {
    e.preventDefault();
    closeSheetByUser('dismiss');
  }
}

/* Geser ke bawah untuk menutup. Hanya dari area pegangan/
   judul, supaya isi lembar tetap bisa di-scroll. Offset
   digeser lewat properti `translate` (bukan transform) agar
   tidak menabrak transform slide-up sheet di desktop.
   Meniru wireDrag() onboarding persis. */
function wireDrag(sheet) {
  const zone = sheet.querySelector('.pwa-sheet-dragzone');
  if (!zone) return;
  let startY = null;
  let dy = 0;
  let dragged = false;
  zone.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    startY = e.clientY;
    dy = 0;
    dragged = false;
    try {
      zone.setPointerCapture(e.pointerId);
    } catch { /* setPointerCapture bisa gagal di sebagian browser: geser tetap jalan via pointermove */ }
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
    if (dragged && dy > DRAG_CLOSE_PX) {
      closeSheetByUser('dismiss');
      return;
    }
    sheet.style.translate = '';
    /* Klik yang lahir dari sebuah geseran jangan sampai
       menekan tombol di bawahnya. */
    if (dragged) {
      const swallow = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      sheet.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => sheet.removeEventListener('click', swallow, { capture: true }), 0);
    }
    dragged = false;
  };
  zone.addEventListener('pointerup', end);
  zone.addEventListener('pointercancel', end);
}

/* Hapus DOM lembar + kembalikan fokus. Dipakai kedua jalur
   tutup; yang membedakan hanyalah apakah onDismiss dipanggil
   (jalur pengguna: ya; jalur paksa hideInstallSheet: tidak). */
function teardownSheet() {
  if (!sheetRoot) return;
  document.removeEventListener('keydown', onKeyDown);
  const root = sheetRoot;
  sheetRoot = null;
  root.classList.remove('open');
  root.classList.add('closing');
  if (closeTimer !== null) clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    closeTimer = null;
    if (root.parentNode) root.parentNode.removeChild(root);
  }, CLOSE_REMOVE_MS);
  if (lastFocus && document.contains(lastFocus) && typeof lastFocus.focus === 'function') {
    lastFocus.focus({ preventScroll: true });
  }
  lastFocus = null;
}

/* Semua cara menutup OLEH PENGGUNA menutup lembar; yang
   membedakan hanyalah callback yang dipanggil (F-06, v6.22.0):
   - 'later' (tombol "Nanti saja" — penolakan EKSPLISIT):
     onDismiss() -> cooldown 14 hari (P10 dismissInstall).
   - 'dismiss' (× / backdrop / Esc / geser — tutup TANPA
     keputusan): onSnooze() -> snooze 24 jam saja (P10
     snoozeInstall). Bila onSnooze tidak disediakan, tutup diam
     tanpa callback — jangan pernah jatuh ke onDismiss.
   Dipanggil sekali: callbacks dikosongkan sebelum teardown. */
function closeSheetByUser(reason) {
  if (!sheetRoot) return;
  const cb = callbacks;
  callbacks = null;
  teardownSheet();
  try {
    if (reason === 'later') {
      if (cb && typeof cb.onDismiss === 'function') cb.onDismiss();
    } else if (cb && typeof cb.onSnooze === 'function') {
      cb.onSnooze();
    }
  } catch { /* callback P10 tidak boleh merusak UI */ }
}

/* Tampilkan lembar ajakan pasang.
   mode 'prompt': tombol utama memanggil onInstall (P10
     menjalankan promptInstall()); lembar TIDAK ditutup di
     sini — P10 menutupnya sendiri bila perlu.
   mode 'ios-guide': tombol utama berlabel "Cara pasang di
     iPhone" (S-U4: label jujur — aksinya membuka dialog
     panduan iOS via openDialog(), BUKAN memanggil onInstall).
     Judul dialognya sama, jadi pengguna tahu apa yang terbuka.
   onDismiss: penolakan EKSPLISIT ("Nanti saja") -> cooldown
     14 hari. onSnooze: tutup tanpa keputusan (Esc / × /
     backdrop / geser) -> snooze 24 jam (F-06).
   Idempotent: bila lembar sudah terbuka, tidak membuat
   duplikat. */
export function showInstallSheet({ mode, onInstall, onDismiss, onSnooze } = {}) {
  try {
    if (typeof document === 'undefined') return;
    if (sheetRoot) return;
    /* Sisa penutupan sebelumnya yang belum terhapus: buang
       langsung agar tidak ada dua root di DOM. */
    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
      const stale = document.getElementById('pwaInstallSheet');
      if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    }
    const ios = mode === 'ios-guide';
    callbacks = { onInstall, onDismiss, onSnooze };
    lastFocus = document.activeElement instanceof Element ? document.activeElement : null;
    const root = document.createElement('div');
    root.id = 'pwaInstallSheet';
    root.className = 'pwa-sheet-root';
    root.innerHTML = `
    <div class="pwa-sheet-backdrop" aria-hidden="true"></div>
    <div class="pwa-sheet" role="dialog" aria-label="${esc(SHEET_TITLE)}" aria-describedby="pwaSheetTitle pwaSheetSub">
      <div class="pwa-sheet-dragzone">
        <div class="pwa-sheet-grip" aria-hidden="true"></div>
        <div class="pwa-sheet-head">
          <h2 class="pwa-sheet-title" id="pwaSheetTitle" tabindex="-1">${esc(SHEET_TITLE)}</h2>
          <button class="pwa-close" type="button" data-act="tutup" aria-label="Tutup">×</button>
        </div>
        <p class="pwa-sheet-sub" id="pwaSheetSub">${esc(SHEET_SUB)}</p>
      </div>
      ${ios ? `<div class="pwa-sheet-body"><ol>${IOS_STEPS.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : ''}
      <div class="pwa-sheet-foot">
        <button class="pwa-btn-primary" type="button" data-act="pasang">${esc(ios ? BTN_IOS_GUIDE : BTN_INSTALL)}</button>
        <button class="pwa-btn-ghost" type="button" data-act="nanti">${esc(BTN_LATER)}</button>
      </div>
    </div>`;
    document.body.appendChild(root);
    sheetRoot = root;
    const sheet = root.querySelector('.pwa-sheet');
    root.querySelector('.pwa-sheet-backdrop').addEventListener('click', () => closeSheetByUser('dismiss'));
    root.querySelector('[data-act="tutup"]').addEventListener('click', () => closeSheetByUser('dismiss'));
    root.querySelector('[data-act="nanti"]').addEventListener('click', () => closeSheetByUser('later'));
    root.querySelector('[data-act="pasang"]').addEventListener('click', () => {
      if (ios) {
        openIosGuide();
        return;
      }
      if (callbacks && typeof callbacks.onInstall === 'function') {
        try {
          callbacks.onInstall();
        } catch { /* callback P10 tidak boleh merusak UI */ }
      }
    });
    document.addEventListener('keydown', onKeyDown);
    wireDrag(sheet);
    /* Masuk dengan animasi slide-up (dua frame jeda agar
       transisi sempat berjalan — pola onboarding). */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (sheetRoot) sheetRoot.classList.add('open');
    }));
    /* Fokus awal ke judul lembar agar pembaca layar mendengar
       judul + deskripsinya. */
    const title = root.querySelector('#pwaSheetTitle');
    if (title) title.focus({ preventScroll: true });
  } catch { /* gagal tertutup: tanpa lembar, tanpa lempar */ }
}

/* Tutup paksa (dari P10: install diterima, update tiba,
   appinstalled, navigasi). TIDAK memanggil onDismiss() —
   penutupan paksa bukan penolakan pengguna; cooldown hanya
   ditulis lewat dismissInstall(). Aman dipanggil saat lembar
   tidak terbuka (no-op). */
export function hideInstallSheet() {
  try {
    if (!sheetRoot) return;
    callbacks = null;
    teardownSheet();
  } catch { /* gagal tertutup */ }
}

/* True bila #pwaInstallSheet ada di DOM dan tidak sedang
   .closing (kontrak R11 §3.2). */
export function isInstallSheetOpen() {
  try {
    if (typeof document === 'undefined') return false;
    const el = document.getElementById('pwaInstallSheet');
    return !!(el && !el.classList.contains('closing'));
  } catch {
    return false;
  }
}

/* ---------- pintu masuk permanen di footer ---------- */

/* Pasang tautan "Pasang aplikasi" sebagai anak TERAKHIR
   .foot-links. Idempotent: bila tautan sudah ada, tidak
   menambah lagi (callback terbaru tetap dipakai — klik
   membaca footOnOpen saat diklik, bukan saat dipasang).
   Dipanggil P10 di initPWA + tiap hashchange (footer
   di-render ulang tiap route). Bila .foot-links tidak ada,
   diam saja (no-op, dicoba lagi di hashchange berikutnya). */
export function mountInstallEntry({ onOpen } = {}) {
  try {
    if (typeof document === 'undefined') return;
    if (typeof onOpen === 'function') footOnOpen = onOpen;
    if (document.querySelector('.pwa-foot-link')) return;
    const links = document.querySelector('.foot-links');
    if (!links) return;
    const a = document.createElement('a');
    a.className = 'pwa-foot-link';
    a.href = FOOT_LINK_HREF;
    a.textContent = FOOT_LINK_TEXT;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof footOnOpen === 'function') {
        try {
          footOnOpen();
        } catch { /* callback P10 tidak boleh merusak UI */ }
      }
    });
    links.appendChild(a);
  } catch { /* gagal tertutup */ }
}

/* Cabut tautan footer (P10 saat appinstalled / sudah
   terpasang). No-op bila tidak ada. */
export function unmountInstallEntry() {
  try {
    if (typeof document === 'undefined') return;
    const a = document.querySelector('.pwa-foot-link');
    if (a) a.remove();
  } catch { /* gagal tertutup */ }
}
