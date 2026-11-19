/* ============================================================
   ADIP Tools v6.20.0 — pwa.js (P10)
   Registrasi service worker + orkestrasi PWA (install/update).

   Kontrak (DIKUNCI, r11-ui-patterns.md §3.1 + roster):
   - Modul ini SATU-SATUNYA yang boleh: registrasi SW, menangkap
     beforeinstallprompt, mendeteksi update SW, membaca/menulis
     localStorage PWA, memutuskan WAKTU tampil UI, memanggil
     toast, mendeteksi iOS/standalone.
   - Modul UI (pwa-install-ui.js P8, pwa-update-ui.js P9,
     pwa-cache-ui.js P17) adalah render murni — diimpor DINAMIS
     hanya saat dibutuhkan, tidak pernah di boot. Impor dinamis
     yang gagal TIDAK diulang di halaman yang sama (pelajaran
     components.js §E-04): janji impor di-cache apa pun
     hasilnya, termasuk null.
   - Gagal tertutup: SW tidak didukung / storage rusak / impor
     dinamis gagal / DOM tidak ditemukan -> diam tanpa UI mati
     dan tanpa melempar. Situs tetap 100% jalan tanpa PWA.

   Aturan keras yang diterapkan di sini:
   - D-PWA-05: registrasi SW HANYA bila import.meta.env.PROD.
   - ZB-6 (R5 §5): registrasi + cek update pertama DILARANG
     sebelum event window load; cek pertama paling awal 5 dtk
     sesudah load / requestIdleCallback pertama.
   - R5 §3.2: jadwal cek update = idle pasca-load + kembali ke
     tab + fokus (throttle 5 mnt, satu timestamp bersama) +
     interval 60 mnt (hanya saat tab terlihat). TANPA cek per
     route hash.
   - R5 §3.1: tanpa skipWaiting otomatis, tanpa reload paksa —
     reload hanya atas ketukan "Muat ulang", SEKALI (guard
     reloadDone), lewat controllerchange.
   - D-PWA-13: css/pwa.css diimpor dari sini (dibundel Vite).
   - Protokol pesan P6<->P10 (R5 §2.4): GET_VERSION /
     SW_VERSION / SKIP_WAITING / SW_ACTIVATED.
   - R11 §2.3: gerbang install = beforeinstallprompt tertangkap
     ATAU iOS Safari belum terpasang; belum terpasang;
     onboarding sudah dilihat; >= 8 dtk sesudah load; tidak
     ada cooldown penolakan 14 hari; aturan ekslusi §3.6 lolos.
     Prioritas: update menang atas install.

   Kunci localStorage (prefix `pwa:`, per instruksi tugas P10):
   - pwa:install-dismissed — timestamp ms penolakan terakhir
     (cooldown 14 hari)
   - pwa:update-seen — string versi SW yang sudah ditolak
     (penolakan hanya berlaku untuk versi itu)
   - pwa:installed — timestamp ms event appinstalled
   CATATAN: nilai kunci ini menyimpang dari r11 §3.5
   (`adip_pwa_*`); nama konstanta tetap mengikuti kontrak R11.
   Hanya modul ini yang membaca/menulis ketiga kunci itu.

   Keputusan P10 yang tidak diatur kontrak (dicatat di laporan):
   - Ketukan tautan footer "Pasang aplikasi" (niat eksplisit)
     melewati delay 8 dtk + cooldown, tapi tetap hormati
     aturan ekslusi + status terpasang + prioritas update.
   - Penolakan dialog sistem (userChoice 'dismissed') menutup
     lembar TANPA menulis cooldown — itu bukan penolakan
     lembar; entri footer tetap tersedia.
   - SW_ACTIVATED juga ter-broadcast pada aktivasi PERTAMA
     (P6 §6.4, terverifikasi B2): pwa.js WAJIB mengabaikannya
     bila halaman tidak punya controller lama — kalau tidak,
     banner lunak tampil keliru di kunjungan pertama. Guard
     memakai dua sinyal (versi controller yang dikenal +
     riwayat controllerchange) agar tahan terhadap urutan
     kedatangan pesan vs event (lihat isFirstActivation).
   - GET_VERSION memakai MessageChannel per query (P6 §5:
     SW membalas ke event.ports[0] dulu). Sebelum FIX-4,
     balasan datang lewat listener 'message' umum tanpa
     pencocokan permintaan — dua query bersamaan (controller
     + waiting) bisa saling menukar balasan dan meracuni
     waitingVersion (Q2-F1, 20 Nov 2026). Jalur port
     merutekan tiap balasan ke pemintanya; fallback legacy
     (tanpa MessageChannel) diserialkan lewat antrean.
   ============================================================ */
import '../css/pwa.css';
import { hasSeenOnboarding } from './onboarding.js';

/* ---------- konstanta kontrak (R11 §3.1) ---------- */

export const PWA_MIN_DELAY_MS = 8000;
export const PWA_INSTALL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 hari
export const PWA_INSTALL_DISMISSED_KEY = 'pwa:install-dismissed';
export const PWA_UPDATE_SEEN_KEY = 'pwa:update-seen';
export const PWA_INSTALLED_KEY = 'pwa:installed';

/* ---------- konstanta internal (R5 §3.2) ---------- */

const SW_URL = './sw.js';
const UPDATE_CHECK_THROTTLE_MS = 5 * 60 * 1000; // fokus + kembali ke tab
const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // interval selama tab terbuka
const FIRST_UPDATE_DELAY_MS = 5000; // cek pertama pasca-load
const VERSION_REPLY_TIMEOUT_MS = 3000; // tunggu balasan SW_VERSION
const EXCLUSION_RECHECK_MS = 500; // debounce MutationObserver
/* Jaring pengaman applyUpdate (BUKAN timeout buta — lihat
   armReloadSafetyNet): worker waiting yang lama menganggur
   dihentikan browser dan butuh cold-start saat menerima
   SKIP_WAITING; aktivasi terukur 1,5–5,2 dtk di Chromium
   headless dan bisa lebih lama saat CPU sibuk. */
const RELOAD_NET_POLL_MS = 2000;
const RELOAD_NET_RESEND_MS = 10000; // kirim ulang SKIP_WAITING
const RELOAD_NET_MAX_MS = 30000; // batas akhir sebelum reload paksa
const UNKNOWN_VERSION = 'unknown';

/* import.meta.env hanya ada di bawah Vite; di Node (validasi
   ESM) aksesnya melempar — tangkap dan anggap bukan PROD.
   Pola `import.meta.env.PROD` ditulis utuh agar Vite
   menggantinya secara statis saat build. */
const IS_PROD = (() => {
  try {
    return import.meta.env.PROD === true;
  } catch {
    return false;
  }
})();

/* ---------- state modul ---------- */

let toastFn = null;
let inited = false;
let loadFired = false;
let loadAt = 0;
let registration = null;
let deferredPrompt = null;
let waitingWorker = null;
let waitingVersion = null;
let softVersion = null; // versi dari SW_ACTIVATED / controllerchange (tab lain)
let updateAccepted = false;
let reloadDone = false;
/* Riwayat controller — untuk guard aktivasi pertama (P6 §6.4).
   controllerAtLoad: controller sudah ada saat initPWA jalan.
   activationCount: berapa kali controllerchange terlihat.
   firstChangeFromNull: change pertama null -> SW (aktivasi
     pertama) atau SW -> SW (update).
   previousController: controller terakhir yang dikenal sebelum
     change terbaru (null bila belum pernah ada).
   knownControllerVersion: versi controller yang dikenal
     (ditanyakan lewat GET_VERSION; 'unknown' tidak disimpan). */
let controllerAtLoad = false;
let activationCount = 0;
let firstChangeFromNull = null;
let previousController = null;
let knownControllerVersion = null;
let lastUpdateCheck = 0;
let installTimer = null;
let updateInterval = null;
let observer = null;
let recheckTimer = null;
let storageBroken = false;
let installUiPromise = null;
let updateUiPromise = null;
let cacheUiPromise = null;

/* ---------- storage aman (gagal tertutup) ---------- */

function storageGet(key) {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    storageBroken = true;
    return null;
  }
}

function storageSet(key, value) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    storageBroken = true;
  }
}

/* ---------- deteksi perangkat / status ---------- */

function detectIos() {
  try {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    /* iPadOS 13+ melaporkan diri sebagai MacIntel. */
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  } catch {
    return false;
  }
}

function isStandalone() {
  try {
    if (
      typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(display-mode: standalone)').matches
    ) return true;
    if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
  } catch { /* abaikan */ }
  return false;
}

function isInstalled() {
  if (isStandalone()) return true;
  return storageGet(PWA_INSTALLED_KEY) !== null;
}

function installAvailable() {
  if (isInstalled()) return false;
  if (deferredPrompt !== null) return true;
  return detectIos(); // iOS: tanpa beforeinstallprompt, panduan manual
}

/* ---------- aturan ekslusi (R11 §3.6) ---------- */

/* Kondisi 1-3 + 5: onboarding / dialog / palette terbuka, atau
   tab tidak terlihat. Kondisi 4 (UI PWA lain terbuka)
   dicek terpisah per pemanggil karena arahnya berbeda. */
function uiBlocked() {
  try {
    if (typeof document === 'undefined') return true;
    if (document.visibilityState !== 'visible') return true;
    if (document.querySelector('.onb-root')) return true;
    if (document.querySelector('.dlg-wrap')) return true;
    if (document.querySelector('.pal-wrap')) return true;
  } catch {
    return true;
  }
  return false;
}

/* Cek DOM langsung (tanpa impor modul UI) agar gerbang bisa
   dinilai tanpa membayar biaya unduh modul. */
function installSheetOpen() {
  try {
    const el = document.getElementById('pwaInstallSheet');
    return !!(el && !el.classList.contains('closing'));
  } catch {
    return false;
  }
}

function updateBarOpen() {
  try {
    return Boolean(document.getElementById('pwaUpdateBar'));
  } catch {
    return false;
  }
}

/* ---------- impor dinamis modul UI (di-cache, gagal = null) ---------- */

function loadInstallUi() {
  if (!installUiPromise) {
    installUiPromise = import('./pwa-install-ui.js').catch(() => null);
  }
  return installUiPromise;
}

function loadUpdateUi() {
  if (!updateUiPromise) {
    updateUiPromise = import('./pwa-update-ui.js').catch(() => null);
  }
  return updateUiPromise;
}

function loadCacheUi() {
  if (!cacheUiPromise) {
    cacheUiPromise = import('./pwa-cache-ui.js').catch(() => null);
  }
  return cacheUiPromise;
}

/* ---------- pembantu UI (no-op bila UI tidak terbuka) ---------- */

function hideInstallSheetSafe() {
  if (!installSheetOpen()) return;
  void loadInstallUi().then((ui) => {
    if (ui) ui.hideInstallSheet();
  });
}

function hideUpdateBarSafe() {
  if (!updateBarOpen()) return;
  void loadUpdateUi().then((ui) => {
    if (ui) ui.hideUpdateBar();
  });
}

function unmountInstallEntrySafe() {
  try {
    if (!document.querySelector('.pwa-foot-link')) return;
  } catch {
    return;
  }
  void loadInstallUi().then((ui) => {
    if (ui) ui.unmountInstallEntry();
  });
}

function showToast(msg) {
  if (typeof toastFn !== 'function') return;
  try {
    toastFn(msg);
  } catch { /* toast gagal: bukan alasan melempar */ }
}

/* ---------- gerbang install (R11 §2.3) ---------- */

function installCooldownActive() {
  /* Gagal baca storage = gerbang tidak lolos (R11 §3.5). */
  if (storageBroken) return true;
  const raw = storageGet(PWA_INSTALL_DISMISSED_KEY);
  if (raw === null) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < PWA_INSTALL_COOLDOWN_MS;
}

function installGateOk({ explicit = false } = {}) {
  if (isInstalled()) return false;
  if (deferredPrompt === null && !detectIos()) return false;
  if (!explicit) {
    if (!hasSeenOnboarding()) return false;
    if (!loadFired || Date.now() - loadAt < PWA_MIN_DELAY_MS) return false;
    if (installCooldownActive()) return false;
  }
  if (uiBlocked()) return false;
  /* Prioritas: update menang (R11 §2.3) — install menunggu
     sampai update selesai atau ditutup. */
  if (updateBarOpen() || updatePending()) return false;
  if (installSheetOpen()) return false;
  return true;
}

async function maybeShowInstall(opts = {}) {
  if (!installGateOk(opts)) return;
  const ui = await loadInstallUi();
  if (!ui) return;
  /* Cek ulang sesudah impor: keadaan bisa berubah selama
     modul diunduh (dialog terbuka, update tiba). */
  if (!installGateOk(opts)) return;
  ui.showInstallSheet({
    mode: deferredPrompt !== null ? 'prompt' : 'ios-guide',
    onInstall: handleInstallClick,
    onDismiss: dismissInstall,
  });
}

function scheduleInstallCheck() {
  if (installTimer !== null) return;
  installTimer = setTimeout(() => {
    installTimer = null;
    void maybeShowInstall();
  }, PWA_MIN_DELAY_MS);
}

/* ---------- update: status tertunda ---------- */

/* Update layak diberitahukan: ada SW waiting ATAU update sudah
   diterapkan tab lain (soft), dan versi itu belum ditolak.
   Gagal baca storage = jangan tampilkan (gagal tertutup).
   Fail-closed (FIX-4 / Q2-F1): versi yang belum diketahui
   (null = query belum selesai, 'unknown' = timeout/gagal)
   TIDAK BOLEH menampilkan bar — bar dengan versi tak dikenal
   akan menulis penolakan 'unknown' dan merusak pencocokan
   penolakan per versi. Bar tampil sesudah versi diketahui. */
function updatePending() {
  if (storageBroken) return false;
  const seen = storageGet(PWA_UPDATE_SEEN_KEY);
  if (waitingWorker) {
    if (waitingVersion === null || waitingVersion === UNKNOWN_VERSION) return false;
    return seen !== waitingVersion;
  }
  if (softVersion) {
    if (softVersion === UNKNOWN_VERSION) return false;
    return seen !== softVersion;
  }
  return false;
}

function pendingVersion() {
  return waitingVersion || softVersion || UNKNOWN_VERSION;
}

async function maybeShowUpdate() {
  if (updateAccepted) return;
  if (!updatePending()) return;
  if (updateBarOpen()) return;
  if (uiBlocked()) return; // dicoba lagi via observer/hashchange/visibility
  if (installSheetOpen()) {
    /* Prioritas update: tutup sheet dulu, lalu tampilkan bar. */
    const installUi = await loadInstallUi();
    if (installUi) installUi.hideInstallSheet();
    if (installSheetOpen()) return; // sheet bandel: coba lagi nanti
  }
  const ui = await loadUpdateUi();
  if (!ui) return;
  if (!updatePending() || uiBlocked() || updateBarOpen()) return;
  ui.showUpdateBar({ onReload: applyUpdate, onDismiss: dismissUpdate });
}

/* ---------- update: tanya versi SW (GET_VERSION) ---------- */

/* Antrean serial HANYA untuk jalur fallback legacy (tanpa
   MessageChannel): satu query legacy outstanding — balasan
   generik tidak bisa salah alamat bila query tidak pernah
   bersamaan. Jalur utama (MessageChannel) tidak butuh antrean
   karena tiap query punya port sendiri. */
let legacyVersionChain = Promise.resolve();

/* Jalur legacy (P10 asli): satu listener 'message' generik
   yang menerima SW_VERSION pertama yang tiba, dari worker
   mana pun. HANYA dipakai bila MessageChannel tidak tersedia
   (praktis tidak ada di browser yang mendukung SW) — dan
   selalu lewat antrean serial askVersion. */
function askVersionLegacy(worker) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (version) => {
      if (done) return;
      done = true;
      try {
        navigator.serviceWorker.removeEventListener('message', onMessage);
      } catch { /* abaikan */ }
      resolve(version);
    };
    const onMessage = (event) => {
      if (
        event
        && event.data
        && event.data.type === 'SW_VERSION'
        && typeof event.data.version === 'string'
      ) {
        finish(event.data.version);
      }
    };
    try {
      navigator.serviceWorker.addEventListener('message', onMessage);
      worker.postMessage({ type: 'GET_VERSION' });
    } catch {
      finish(UNKNOWN_VERSION);
      return;
    }
    setTimeout(() => finish(UNKNOWN_VERSION), VERSION_REPLY_TIMEOUT_MS);
  });
}

/* Tanya versi satu worker — balasan DICocokkan dengan
   permintaan lewat MessageChannel per query (FIX-4 / Q2-F1).
   SW (P6 §5, sw-update.js) membalas GET_VERSION ke
   event.ports[0] dulu, jadi balasan controller TIDAK PERNAH
   mendarat di query waiting dan sebaliknya — walau kedua
   query berjalan bersamaan saat boot sesudah reload.
   Timeout 3 dtk tetap dipertahankan ('unknown' bila worker
   tidak menjawab, mis. worker dingin / dibuang browser).
   Dipilih atas dua alternatif: id permintaan butuh ubah
   sw-update.js (di luar file ini); serialisasi semua query
   menunda tampilnya bar update sampai query controller
   selesai (dua query 3 dtk berurutan bila satu timeout). */
function askVersion(worker) {
  if (typeof MessageChannel !== 'undefined') {
    return new Promise((resolve) => {
      let done = false;
      let channel = null;
      let timer = null;
      const finish = (version) => {
        if (done) return;
        done = true;
        if (timer !== null) clearTimeout(timer);
        try {
          if (channel && typeof channel.port1.close === 'function') {
            channel.port1.close();
          }
        } catch { /* abaikan */ }
        resolve(version);
      };
      try {
        channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          const data = event && event.data;
          if (
            data
            && data.type === 'SW_VERSION'
            && typeof data.version === 'string'
          ) {
            finish(data.version);
          }
          /* Pesan lain di port ini: abaikan, terus menunggu
             sampai timeout (port ini hanya untuk query ini). */
        };
        timer = setTimeout(() => finish(UNKNOWN_VERSION), VERSION_REPLY_TIMEOUT_MS);
        worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
      } catch {
        finish(UNKNOWN_VERSION);
      }
    });
  }
  /* Fallback tanpa MessageChannel: serialkan lewat antrean. */
  const run = () => askVersionLegacy(worker);
  const pending = legacyVersionChain.then(run, run);
  legacyVersionChain = pending.catch(() => {});
  return pending;
}

async function resolveWaitingVersion() {
  const worker = waitingWorker;
  if (!worker) return;
  const version = await askVersion(worker);
  if (waitingWorker !== worker) return; // sudah diganti update yang lebih baru
  waitingVersion = version;
  void maybeShowUpdate();
}

/* ---------- pesan SW + controllerchange ---------- */

/* Apakah aktivasi yang dilaporkan ini aktivasi PERTAMA di
   halaman ini (instal pertama, bukan update)? Dua sinyal:
   (1) VERSI (terkuat): bila halaman pernah dikontrol versi
   LAIN dari versi yang di-broadcast, ini pasti update.
   (2) RIWAYAT controllerchange: belum pernah ada change +
   tidak ada controller saat init = pertama; satu change
   null -> SW = pertama; dua change atau lebih = update.
   Kombinasi ini tahan terhadap urutan kedatangan pesan vs
   event (broadcast bisa datang sebelum/sesudah
   controllerchange) — kecuali satu lubang sempit: update
   yang pesannya datang sebelum change DAN versi controller
   lama tidak pernah berhasil ditanyakan (fail-closed:
   banner tidak tampil; jalur waiting tetap bisa
   menampilkannya). */
function isFirstActivation(version) {
  if (
    knownControllerVersion
    && version !== UNKNOWN_VERSION
    && knownControllerVersion !== version
  ) return false;
  if (activationCount === 0) return !controllerAtLoad;
  if (activationCount === 1) return firstChangeFromNull === true;
  return false;
}

/* Tanyakan versi controller dan simpan bila berhasil (hanya
   versi nyata; 'unknown'/gagal tidak menimpa yang sudah ada). */
async function refreshKnownVersion(worker) {
  if (!worker) return;
  const version = await askVersion(worker);
  if (version && version !== UNKNOWN_VERSION) {
    knownControllerVersion = version;
  }
}

function onServiceWorkerMessage(event) {
  const data = event && event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type !== 'SW_ACTIVATED') return;
  /* Update diterapkan tab lain: banner lunak di tab ini,
     kecuali tab ini yang memicu update (akan reload) atau
     bar sudah terbuka / versi sudah ditolak (dicek di
     maybeShowUpdate lewat updatePending). */
  if (updateAccepted) return;
  const version = typeof data.version === 'string' ? data.version : UNKNOWN_VERSION;
  /* P6 §6.4: broadcast juga menyala pada aktivasi PERTAMA —
     abaikan bila halaman tidak punya controller lama. */
  if (isFirstActivation(version)) return;
  /* RED1-05 (Blue R1): VERIFIKASI versi ke controller live sebelum
     mempercayai broadcast — event 'message' di ServiceWorkerContainer
     bisa dipalsukan skrip same-origin mana pun lewat dispatchEvent
     sintetis (poc-05b Red-1: banner palsu 9.9.9-spoof). Hanya terima
     bila controller live melaporkan versi yang SAMA; abaikan bila
     tidak cocok / tidak ada controller / timeout (fail-closed).
     RACE YANG AMAN: broadcast bisa tiba SEBELUM controllerchange
     (saat itu controller masih worker LAMA) — penolakan di sini
     TIDAK menghilangkan banner legit, karena onControllerChange ->
     handleExternalActivation menanyakan ulang versi ke controller
     baru dan menampilkan banner yang sama. */
  void verifyActivatedVersion(version);
}

async function verifyActivatedVersion(version) {
  let controller = null;
  try {
    controller = navigator.serviceWorker.controller;
  } catch { /* abaikan */ }
  if (!controller) return;
  const liveVersion = await askVersion(controller);
  if (liveVersion !== version) return;
  softVersion = version;
  void maybeShowUpdate();
}

async function handleExternalActivation() {
  /* Jalur cadangan bila broadcast SW_ACTIVATED tidak sampai:
     tanyakan versi ke controller baru, lalu tampilkan banner
     lunak yang sama. Versi tak diketahui = gagal tertutup
     (jangan tampilkan banner yang mungkin bertabrakan dengan
     penolakan versi yang tercatat). */
  let controller = null;
  try {
    controller = navigator.serviceWorker.controller;
  } catch { /* abaikan */ }
  if (!controller) return;
  const version = await askVersion(controller);
  if (version && version !== UNKNOWN_VERSION) {
    softVersion = version;
    void maybeShowUpdate();
  }
}

function onControllerChange() {
  /* Catat riwayat SEBELUM bercabang (dipakai guard
     isFirstActivation — termasuk untuk change pertama). */
  const hadPrev = previousController !== null;
  if (activationCount === 0) firstChangeFromNull = !hadPrev;
  activationCount++;
  try {
    previousController = navigator.serviceWorker.controller;
  } catch { /* abaikan */ }
  /* Kenali versi controller baru (untuk sinyal versi guard;
     jangan ditunggu — guard tahan bila query belum selesai). */
  void refreshKnownVersion(previousController);
  if (updateAccepted) {
    if (!reloadDone) {
      reloadDone = true;
      try {
        location.reload();
      } catch { /* abaikan */ }
    }
    return;
  }
  /* Instal pertama: controller berubah null -> SW. Bukan update. */
  if (!hadPrev) return;
  /* SW baru mengambil alih tanpa persetujuan tab ini
     (diterapkan tab lain / aktivasi otomatis). */
  void handleExternalActivation();
}

/* ---------- registrasi SW (PROD + sesudah load) ---------- */

function wireRegistration(reg) {
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state !== 'installed') return;
      /* Tanpa controller = instal pertama, bukan update. */
      if (!navigator.serviceWorker.controller) return;
      waitingWorker = worker;
      void resolveWaitingVersion();
    });
  });
}

async function registerSW() {
  if (!IS_PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    registration = await navigator.serviceWorker.register(SW_URL, {
      updateViaCache: 'none',
      scope: './',
    });
    wireRegistration(registration);
    /* SW waiting dari sebelum halaman dimuat (halaman di-reload
       saat update tertunda): tangani seperti updatefound. */
    if (registration.waiting) {
      waitingWorker = registration.waiting;
      void resolveWaitingVersion();
    }
  } catch { /* registrasi gagal: situs tetap jalan tanpa SW */ }
}

/* ---------- jadwal cek update (R5 §3.2) ---------- */

function checkForUpdate() {
  if (!registration) return;
  const now = Date.now();
  if (now - lastUpdateCheck < UPDATE_CHECK_THROTTLE_MS) return;
  lastUpdateCheck = now;
  try {
    const p = registration.update();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch { /* gagal diam-diam; coba lagi di pemicu berikut */ }
}

function scheduleFirstUpdateCheck() {
  const run = () => checkForUpdate();
  try {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: FIRST_UPDATE_DELAY_MS });
      return;
    }
  } catch { /* jatuh ke setTimeout */ }
  setTimeout(run, FIRST_UPDATE_DELAY_MS);
}

/* ---------- entri footer + pemicu cek ulang ---------- */

async function mountFooterEntries() {
  /* Entri install: hanya bila install tersedia & belum terpasang
     (tautan mati lebih buruk daripada tanpa tautan). */
  if (installAvailable()) {
    const ui = await loadInstallUi();
    if (ui) ui.mountInstallEntry({ onOpen: onFooterInstallOpen });
  }
  /* Entri cache (P17): impor dinamis ber-guard — bila modul
     belum ada / gagal dimuat, situs tetap jalan (integrasi
     tertunda, bukan kegagalan build). */
  try {
    const cacheUi = await loadCacheUi();
    if (cacheUi) {
      cacheUi.mountCacheEntry({
        toast: typeof toastFn === 'function' ? toastFn : undefined,
      });
    }
  } catch { /* P17 belum selesai / gagal dimuat: diam */ }
}

function onFooterInstallOpen() {
  /* Ketukan eksplisit pengguna: lewati delay 8 dtk + cooldown
     (niat jelas), tapi tetap hormati aturan ekslusi + status
     terpasang + prioritas update. */
  void maybeShowInstall({ explicit: true });
}

function onHashChange() {
  /* Lembar install tidak boleh menggantung antar-halaman;
     bar update TIDAK ditutup navigasi (berlaku seluruh situs). */
  hideInstallSheetSafe();
  void mountFooterEntries(); // footer di-render ulang tiap route
  void maybeShowUpdate();
  void maybeShowInstall();
}

function onVisibilityChange() {
  if (typeof document === 'undefined') return;
  if (document.visibilityState !== 'visible') return;
  checkForUpdate();
  void maybeShowUpdate();
  void maybeShowInstall();
}

function startExclusionObserver() {
  if (typeof MutationObserver === 'undefined') return;
  if (!document.body || observer) return;
  observer = new MutationObserver(() => {
    /* Cek ulang paling lambat 500 ms sesudah kondisi ekslusi
       berubah (dialog/sheet tertutup, footer ter-render). */
    if (recheckTimer !== null) return;
    recheckTimer = setTimeout(() => {
      recheckTimer = null;
      void maybeShowUpdate();
      void maybeShowInstall();
      void mountFooterEntries();
    }, EXCLUSION_RECHECK_MS);
  });
  try {
    observer.observe(document.body, { childList: true, subtree: true });
  } catch {
    observer = null;
  }
}

/* ---------- event install ---------- */

async function handleInstallClick() {
  const outcome = await promptInstall();
  const ui = await loadInstallUi();
  if (!ui) return;
  ui.hideInstallSheet();
  if (outcome === 'accepted') {
    /* Toast "Sudah terpasang." datang dari event appinstalled;
       di sini cukup cabut entri footer. */
    unmountInstallEntrySafe();
  }
  /* 'dismissed' (dialog sistem dibatalkan): tutup lembar tanpa
     cooldown — bukan penolakan lembar; entri footer tetap ada.
     'unavailable': tidak ada yang bisa dilakukan; lembar
     sudah ditutup di atas. */
}

function onAppInstalled() {
  storageSet(PWA_INSTALLED_KEY, String(Date.now()));
  deferredPrompt = null;
  hideInstallSheetSafe();
  unmountInstallEntrySafe();
  showToast('Sudah terpasang.');
}

/* ---------- boot ---------- */

function onLoad() {
  if (loadFired) return;
  loadFired = true;
  loadAt = Date.now();
  startExclusionObserver();
  void mountFooterEntries();
  /* Registrasi + cek update pertama HANYA sesudah load (ZB-6). */
  void registerSW().then(() => scheduleFirstUpdateCheck());
  scheduleInstallCheck();
  updateInterval = setInterval(() => {
    if (document.visibilityState === 'visible') checkForUpdate();
  }, UPDATE_INTERVAL_MS);
}

/* ---------- KONTRAK MODUL (R11 §3.1) ---------- */

/* Idempotent: panggilan kedua tidak melakukan apa-apa. Tidak
   menampilkan UI apa pun secara langsung — selalu lewat modul
   UI. Kerja berat (registrasi SW, cek update, mount footer,
   gerbang install) ditunda sampai sesudah event load. */
export function initPWA({ toast } = {}) {
  if (inited) return;
  inited = true;
  if (typeof toast === 'function') toastFn = toast;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  /* Tangkap beforeinstallprompt SEAWAL MUNGKIN — event menyala
     sekali per load; listener yang telat = event hilang. */
  window.addEventListener('beforeinstallprompt', (event) => {
    try {
      event.preventDefault();
    } catch { /* abaikan */ }
    deferredPrompt = event;
    void mountFooterEntries();
    void maybeShowInstall();
  });
  window.addEventListener('appinstalled', onAppInstalled);

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    /* Jepret controller saat init (sinyal riwayat guard
       aktivasi pertama) + kenali versinya bila sudah ada. */
    try {
      previousController = navigator.serviceWorker.controller;
      controllerAtLoad = previousController !== null;
    } catch { /* abaikan */ }
    if (previousController) void refreshKnownVersion(previousController);
    navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', () => checkForUpdate());
  window.addEventListener('hashchange', onHashChange);

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad, { once: true });
  }
}

/* Fungsi baca murni, tanpa efek samping. */
export function getPWAState() {
  const ios = detectIos();
  const installed = isInstalled();
  return {
    supported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    installed,
    installAvailable: !installed && (deferredPrompt !== null || ios),
    updateAvailable: waitingWorker !== null,
    ios,
  };
}

/* Jalankan prompt install sistem (HANYA dalam user gesture —
   dipanggil dari ketukan tombol lembar). Event hanya bisa
   dipakai sekali: dikosongkan sesudah prompt(). */
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    return choice && choice.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'dismissed';
  }
}

/* Jaring pengaman applyUpdate: POLL cerdas, bukan timeout
   buta. Timeout buta 10 dtk pernah me-reload halaman SEBELUM
   aktivasi selesai (worker waiting yang dingin butuh
   cold-start; aktivasi terukur sampai 5,2 dtk) — halaman
   kembali dikontrol SW lama dan bar muncul lagi. Poll ini:
   - tiap 2 dtk cek registration.waiting; bila sudah null
     (aktivasi selesai) -> reload (controllerchange
     seharusnya sudah me-reload; ini jaring bila event hilang).
   - bila sesudah 10 dtk waiting MASIH ada -> kirim ulang
     SKIP_WAITING sekali (pesan pertama mungkin hilang saat
     worker dingin), lalu terus menunggu.
   - sesudah 30 dtk -> reload terakhir (halaman segar; bar
     muncul lagi bila update masih tertunda, pengguna bisa
     mencoba lagi). Guard reloadDone mencegah reload ganda. */
function armReloadSafetyNet() {
  const started = Date.now();
  let resent = false;
  const timer = setInterval(() => {
    if (reloadDone) {
      clearInterval(timer);
      return;
    }
    const elapsed = Date.now() - started;
    let waiting = null;
    try {
      waiting = registration ? registration.waiting : null;
    } catch { /* abaikan */ }
    if (!waiting) {
      clearInterval(timer);
      reloadDone = true;
      try {
        location.reload();
      } catch { /* abaikan */ }
      return;
    }
    if (elapsed >= RELOAD_NET_RESEND_MS && !resent) {
      resent = true;
      try {
        waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch { /* abaikan */ }
    }
    if (elapsed >= RELOAD_NET_MAX_MS) {
      clearInterval(timer);
      reloadDone = true;
      try {
        location.reload();
      } catch { /* abaikan */ }
    }
  }, RELOAD_NET_POLL_MS);
}

/* SATU-SATUNYA tempat location.reload() di seluruh kode PWA.
   Kirim SKIP_WAITING ke SW waiting; reload SEKALI saat
   controllerchange. Bila tidak ada waiting SW (update sudah
   diterapkan tab lain / tap kedua), muat ulang biasa. */
export function applyUpdate() {
  try {
    hideUpdateBarSafe();
    /* Sumber kebenaran LIVE: registration.waiting. Variabel
       waitingWorker bisa basi — bila SW sudah diaktifkan tab
       lain, waitingWorker masih menunjuk worker yang kini
       aktif; mengirim SKIP_WAITING ke sana tidak memicu
       controllerchange baru. Bila tidak ada lagi waiting SW,
       langsung muat ulang biasa (R5 §4.2). */
    const liveWaiting = registration ? registration.waiting : null;
    waitingWorker = liveWaiting;
    if (liveWaiting) {
      updateAccepted = true;
      try {
        liveWaiting.postMessage({ type: 'SKIP_WAITING' });
      } catch { /* jaring pengaman di bawah yang menangani */ }
      armReloadSafetyNet();
      return;
    }
    if (!reloadDone) {
      reloadDone = true;
      location.reload();
    }
  } catch { /* gagal tertutup */ }
}

/* Tulis cooldown 14 hari + sembunyikan lembar. */
export function dismissInstall() {
  storageSet(PWA_INSTALL_DISMISSED_KEY, String(Date.now()));
  hideInstallSheetSafe();
}

/* Tulis versi SW yang ditolak (penolakan hanya untuk versi
   itu) + sembunyikan bar. Update tidak lagi memblokir install. */
export function dismissUpdate() {
  storageSet(PWA_UPDATE_SEEN_KEY, pendingVersion());
  hideUpdateBarSafe();
  void maybeShowInstall();
}
