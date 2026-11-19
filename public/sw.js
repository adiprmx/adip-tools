/* ADIP Tools — Service Worker inti (PWA v6.20.0, tim P3).
 *
 * Template build-time: dua token placeholder (versi + manifest precache)
 * diganti scripts/gen-sw-precache.js sesudah `vite build` (lihat D-PWA-02).
 * JANGAN daftarkan file ini langsung dari public/ — yang dipakai browser
 * selalu dist/sw.js hasil injeksi (nama cache + daftar precache final).
 *
 * Arsitektur modular (D-PWA-01): lifecycle + precache + routing fetch di
 * sini; strategi cache di modul importScripts. Modul DILARANG hardcode
 * versi — semua nama cache turun dari self.PWA di bawah ini.
 */
'use strict';

// Kontrak modul SW (roster, dikunci koordinator 20 Nov 2026):
// didefinisikan SEBELUM importScripts agar semua modul bisa memakainya.
self.PWA = {
  version: '__PWA_VERSION__',
  precacheName: 'adip-tools-precache-__PWA_VERSION__',
  runtimeName: 'adip-tools-runtime-__PWA_VERSION__',
  cdnName: 'adip-tools-cdn-v1',
};

// URL relatif (tanpa leading '/') agar scope + impor benar di root
// produksi (Vercel) maupun subpath preview (/adip-tools/, D-PWA-03).
importScripts('sw-runtime.js', 'sw-cdn.js', 'sw-update.js', 'sw-quota.js');

// Daftar precache shell-only, diganti gen script dengan array JSON.
// BUKAN daftar manual: nama ber-hash hanya diketahui pasca-build.
// Guardrail keras: TIDAK PERNAH berisi chunk tool (lihat gen script).
const PRECACHE = __PRECACHE_MANIFEST__;

// --- Install: precache app shell (atomik) ---------------------------------
// cache.addAll all-or-nothing: bila SATU URL gagal (mis. 404), seluruh
// install gagal dan SW baru dibuang — SW lama tetap aktif, tidak ada
// kerusakan. Itu perilaku standar yang benar (R5 §4.3).
// TIDAK ada skipWaiting otomatis: update flow milik P6 — SW baru berhenti
// di state `waiting` sampai user mengetuk "Muat ulang" (R5 §3.1).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(self.PWA.precacheName).then((cache) => cache.addAll(PRECACHE)),
  );
});

// --- Activate: hapus cache lama, lalu klaim klien ---------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const KEEP = new Set([
        self.PWA.precacheName,
        self.PWA.runtimeName,
        self.PWA.cdnName,
      ]);
      const keys = await caches.keys();
      // Prefix `adip-tools-` (bukan daftar nama persis) agar cache skema
      // lama/eksperimen ikut terhapus. Per-item allSettled: kegagalan hapus
      // satu nama tidak boleh menggagalkan activate (R5 §4.1).
      await Promise.allSettled(
        keys
          .filter((name) => name.startsWith('adip-tools-') && !KEEP.has(name))
          .map((name) => caches.delete(name)),
      );
      // Claim SESUDAH cleanup agar klien yang baru diklaim tidak pernah
      // membaca cache setengah terhapus (R5 §4.1).
      await self.clients.claim();
      // Broadcast SW_ACTIVATED ke semua klien (R5 §2.4/C6; implementasi di
      // modul update P6). Guard: broadcast tidak boleh menggagalkan
      // activate bila modul tidak menyediakannya.
      const update = self.__pwaUpdate;
      if (update && typeof update.broadcastActivated === 'function') {
        await update.broadcastActivated();
      }
    })(),
  );
});

// --- Fetch: routing (KONTRAK MODUL SW, roster) -----------------------------
// Urutan: (1) abaikan non-GET / non-http(s) / /api/* — pass-through tanpa
// respondWith; (2) navigasi → modul runtime; (3) host CDN (jsDelivr/unpkg)
// → modul cdn; (4) aset same-origin → modul runtime; (5) lainnya → network
// tanpa respondWith.
//
// (1) /api/* WAJIB pass-through (R2, empiris 10 run): SW rakus menelan 2
// laporan CSP per skenario bila mencegat /api/csp-report.
// (3) Hanya jsDelivr/unpkg: cdnjs/esm.sh/js.puter.com ada di script-src
// tapi TIDAK di connect-src — fetch() SW ke sana DIBLOKIR saat enforcing
// (D-PWA-12). Lib dari ketiga host itu tetap dimuat halaman via <script>.
const CDN_HOSTS = new Set(['cdn.jsdelivr.net', 'unpkg.com']);

// --- Lazy refill precache (FIX-6, Q2-O1) -------------------------------------
// "Hapus data offline" (P17) menghapus SEMUA cache termasuk precache,
// sementara SW tetap ter-register — dan `install` hanya jalan saat SW baru,
// jadi precache tidak pernah terisi lagi sampai update SW berikutnya.
// Perbaikan self-healing di sisi SW (tanpa protokol pesan baru, tanpa
// menyentuh modul lain): tiap navigasi, periksa apakah precache masih
// berisi index.html (sentinel); bila hilang, isi ulang di latar belakang.
//
// Kenapa cek diulang TIAP navigasi (bukan sekali lalu dikunci): penghapusan
// cache bisa terjadi KAPAN SAJA di dalam masa hidup SW yang sama — tidak
// ada event yang memberi tahu SW bahwa cache dihapus dari halaman — jadi
// kunci "pernah utuh" akan membunuh self-healing (terbukti di validasi
// browser FIX-6: desain kunci-sekali GAGAL mengisi ulang sesudah satu
// reload normal mendahului penghapusan). Ceknya sendiri murah dan lokal
// (open + match, tanpa jaringan) dan jalan di latar belakang; yang
// dibatasi hanyalah upaya isi ulang yang gagal (lihat cooldown).
//
// Aturan throttle (state in-memory, hilang saat SW mati — sengaja):
// - Bila precache UTUH (sentinel ketemu): tidak ada addAll — navigasi
//   normal tidak memicu request jaringan ekstra.
// - Bila isi ulang GAGAL (mis. offline — wajar), coba lagi paling cepat
//   60 detik kemudian (cooldown in-memory); navigasi di dalam jendela
//   cooldown tidak memicu upaya baru.
// - Guard in-flight: navigasi bersamaan tidak memicu addAll ganda.
// - Isi ulang TIDAK PERNAH memblokir navigasi: jalan lewat
//   event.waitUntil (agar SW tidak mati di tengah isi ulang), sementara
//   respons navigasi tetap dilayani network/runtime seperti biasa.
// - Sentinel hanya index.html: penghapusan SEBAGIAN (satu-dua entri via
//   DevTools) tidak terdeteksi — kasus yang diperbaiki adalah penghapusan
//   seluruh cache (P17 / caches.delete / DevTools "Clear site data").
// - Pengecekan memakai match URL-string (tanpa header Origin) sehingga
//   tidak kena jebakan Vary seperti yang didokumentasikan FIX-2.
let precacheRefillInFlight = false;
let precacheRefillNextAttempt = 0;
const PRECACHE_REFILL_COOLDOWN_MS = 60000;

function maybeRefillPrecache(event) {
  if (precacheRefillInFlight) return;
  if (Date.now() < precacheRefillNextAttempt) return;
  precacheRefillInFlight = true;
  const refill = (async () => {
    try {
      const cache = await caches.open(self.PWA.precacheName);
      const indexUrl = new URL('index.html', self.location.href).href;
      if (await cache.match(indexUrl)) return; // utuh: tanpa addAll
      await cache.addAll(PRECACHE);
      // Sukses: SENGAJA tanpa kunci — penghapusan berikutnya di masa
      // hidup SW yang sama wajib terdeteksi navigasi berikutnya.
    } catch (e) {
      // Gagal (offline / satu URL 404): jangan ulangi tiap navigasi —
      // coba lagi paling cepat sesudah cooldown (60 detik).
      precacheRefillNextAttempt = Date.now() + PRECACHE_REFILL_COOLDOWN_MS;
    } finally {
      precacheRefillInFlight = false;
    }
  })();
  try {
    if (event && typeof event.waitUntil === 'function') event.waitUntil(refill);
  } catch (e) { /* waitUntil gagal — isi ulang tetap jalan, abaikan */ }
  // Refill sudah catch semua galat di dalam, jadi promise ini tidak
  // pernah reject (tidak ada unhandled rejection bila waitUntil absen).
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // blob: / data: / chrome-extension: / ws: dst. lolos tanpa dicegat.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  // Pass-through /api/* (R2): jangan pernah respondWith di sini.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  let handler = null;
  if (request.mode === 'navigate') {
    handler = self.__pwaRuntime;
    // Lazy refill precache (FIX-6): cek sentinel + isi ulang di latar
    // belakang bila hilang — tidak memblokir respondWith di bawah.
    maybeRefillPrecache(event);
  } else if (CDN_HOSTS.has(url.hostname)) {
    handler = self.__pwaCdn;
  } else if (url.origin === self.location.origin) {
    handler = self.__pwaRuntime;
  } else {
    return; // Cross-origin di luar CDN allowlist: network, tanpa respondWith.
  }
  if (!handler || typeof handler.handleFetch !== 'function') return;
  // Modul mengembalikan Response atau null; null = jatuh ke jaringan.
  event.respondWith(
    (async () => (await handler.handleFetch(event)) || fetch(request))(),
  );
});

// --- Message: delegasi penuh ke modul update (P6) ---------------------------
self.addEventListener('message', (event) => {
  const update = self.__pwaUpdate;
  if (update && typeof update.handleMessage === 'function') {
    update.handleMessage(event);
  }
});
