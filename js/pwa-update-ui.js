/* ============================================================
   ADIP Tools v6.20.0 — pwa-update-ui.js (P9)
   Bar notifikasi update PWA: render murni, tanpa logika SW.

   Kontrak: ~/workspace/adip-tools-upgrade/pwa-v6200/
     - r11-ui-patterns.md §3.3 (signature + perilaku DIKUNCI)
     - r5-versioning.md §3 (update flow: banner + reload
       eksplisit, tanpa skipWaiting otomatis)
     - roster.md (resolusi copy: TANPA parameter versi)

   PEMISAHAN (R11 §3): modul ini HANYA merender DOM dan
   melaporkan aksi pengguna lewat callback. DILARANG menyentuh
   service worker, storage, toast, dan reload halaman —
   semuanya milik js/pwa.js (P10).
   Style milik css/pwa.css (P8); modul ini hanya memakai
   class kontrak R11 §3.4 (bertanda ◆) — NOL class baru.

   Copy FINAL (R11 §4, keputusan koordinator): teks generik
   tanpa nomor versi — "Ada versi baru ADIP Tools." /
   "Muat ulang" / "Nanti" / × aria-label "Tutup".

   Perilaku yang dikunci:
   - Idempotent: satu instance #pwaUpdateBar; panggilan kedua
     tidak membuat duplikat (callback diperbarui ke yang baru).
   - Anak document.body (selamat dari render ulang route —
     #app di-render ulang tiap navigasi hash).
   - role="status" (pengumuman sopan, seperti toast).
   - Bar tampil dengan class .open (css/pwa.css: tanpa
     .open bar opacity 0 = tak terlihat — FIX-3). .open
     ditambah lewat dua frame rAF sesudah appendChild
     (pola P8 install sheet), langsung bila rAF tak ada.
   - hideUpdateBar() menghapus DOM langsung TANPA animasi
     .closing (FIX-3): isUpdateBarOpen() selalu konsisten
     dengan keterlihatan — tanpa keadaan setengah (elemen
     .closing di DOM tapi isOpen true sementara bar tak
     terlihat).
   - MENETAP sampai ditindak/ditutup — TANPA timer hilang
     otomatis. Navigasi hash TIDAK menutup bar (berbeda dari
     sheet install: update berlaku untuk seluruh situs).
   - "Muat ulang" -> onReload(); "Nanti" + × + Esc ->
     onDismiss(). hideUpdateBar() TIDAK memanggil onDismiss()
     (penutupan paksa oleh P10 ≠ penolakan pengguna).
   - Bar TIDAK mencuri fokus (toast non-modal; pengguna bisa
     sedang memakai tool saat bar muncul).
   - Gagal tertutup: tanpa document/body, modul diam tanpa
     melempar; callback yang melempar ditelan agar bar tetap
     bisa ditutup/dibuka ulang.
   ============================================================ */

/* ID elemen bar — satu-satunya instance di DOM. */
const BAR_ID = 'pwaUpdateBar';

/* Callback aktif dari panggilan showUpdateBar terakhir.
   Disimpan di memori modul (bukan DOM) agar panggilan kedua
   bisa memperbarui callback tanpa membuat ulang elemen. */
let onReloadCb = null;
let onDismissCb = null;

/* Panggil callback pengguna dengan aman: callback milik P10
   tidak boleh memecahkan modul UI bila ia melempar. */
function callSafe(fn) {
  if (typeof fn !== 'function') return;
  try {
    fn();
  } catch {
    /* Diam: render murni tidak pernah melempar. */
  }
}

/* Esc menutup bar (= penolakan, seperti tombol "Nanti").
   Listener dipasang saat bar tampil, dicabut saat bar hilang. */
function onKeyDown(e) {
  if (e.key === 'Escape' && isUpdateBarOpen()) {
    e.preventDefault();
    callSafe(onDismissCb);
  }
}

/* Tampilkan bar update. Dipanggil P10 begitu SW waiting
   terdeteksi + aturan ekslusi R11 §3.6 lolos.
   TANPA parameter versi (keputusan koordinator 20 Nov 01:41).
   onReload: P10 menjalankan applyUpdate() (skipWaiting +
   reload). onDismiss: P10 menjalankan dismissUpdate()
   (catat versi ditolak + hideUpdateBar). */
export function showUpdateBar({ onReload, onDismiss } = {}) {
  try {
    if (typeof document === 'undefined' || !document.body) return;
    onReloadCb = typeof onReload === 'function' ? onReload : null;
    onDismissCb = typeof onDismiss === 'function' ? onDismiss : null;
    /* Idempotent: bar sudah terbuka -> callback saja yang
       diperbarui, tanpa duplikat DOM. */
    if (isUpdateBarOpen()) return;
    const bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.className = 'pwa-update';
    bar.setAttribute('role', 'status');
    const text = document.createElement('p');
    text.className = 'pwa-update-text';
    text.textContent = 'Ada versi baru ADIP Tools.';
    const actions = document.createElement('div');
    actions.className = 'pwa-update-actions';
    const reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.className = 'pwa-update-btn';
    reloadBtn.textContent = 'Muat ulang';
    reloadBtn.addEventListener('click', () => callSafe(onReloadCb));
    const laterBtn = document.createElement('button');
    laterBtn.type = 'button';
    laterBtn.className = 'pwa-update-dismiss';
    laterBtn.textContent = 'Nanti';
    laterBtn.addEventListener('click', () => callSafe(onDismissCb));
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pwa-update-close';
    closeBtn.setAttribute('aria-label', 'Tutup');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => callSafe(onDismissCb));
    actions.append(reloadBtn, laterBtn, closeBtn);
    bar.append(text, actions);
    document.body.appendChild(bar);
    /* Masuk dengan transisi opacity: dua frame jeda agar
       transisi sempat berjalan (pola P8 install sheet,
       js/pwa-install-ui.js). Tanpa .open, css/pwa.css
       menahan bar di opacity 0 — ada di DOM tapi tak
       terlihat (bug FIX-3). Penjaga getElementById: bila
       hideUpdateBar() dipanggil sebelum frame kedua, bar
       sudah tidak di DOM dan .open tidak ditambah ke
       elemen yatim. Bila rAF tidak tersedia (lingkungan
       non-browser), tambah class langsung — fail-closed,
       tanpa throw. */
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        try {
          if (document.getElementById(BAR_ID) === bar) bar.classList.add('open');
        } catch {
          /* Gagal tertutup. */
        }
      }));
    } else {
      bar.classList.add('open');
    }
    document.addEventListener('keydown', onKeyDown);
  } catch {
    /* Gagal tertutup: tanpa UI mati, tanpa lempar. */
  }
}

/* Sembunyikan bar (dipanggil P10 saat update diterapkan,
   SW waiting hilang, atau penolakan sudah dicatat).
   Aman dipanggil saat bar tidak terbuka (no-op).
   TIDAK memanggil onDismiss().
   FIX-3 — SEMANTIK PENUTUPAN (dipilih: hapus DOM langsung,
   TANPA animasi .closing): isUpdateBarOpen() = "bar ada di
   DOM" selalu konsisten dengan keterlihatan. Alternatif
   .closing + hapus tertunda DITOLAK di sini agar tidak ada
   keadaan setengah (elemen .closing di DOM tapi isOpen
   mengklaim true sementara bar tak terlihat); bila animasi
   keluar diinginkan kelak, isUpdateBarOpen() WAJIB ikut
   mengecualikan .closing seperti isInstallSheetOpen() P8. */
export function hideUpdateBar() {
  try {
    if (typeof document === 'undefined') return;
    document.removeEventListener('keydown', onKeyDown);
    onReloadCb = null;
    onDismissCb = null;
    document.getElementById(BAR_ID)?.remove();
  } catch {
    /* Gagal tertutup. */
  }
}

/* True bila bar ada di DOM (dipakai P10 untuk aturan
   ekslusi R11 §3.6). */
export function isUpdateBarOpen() {
  try {
    if (typeof document === 'undefined') return false;
    return Boolean(document.getElementById(BAR_ID));
  } catch {
    return false;
  }
}
