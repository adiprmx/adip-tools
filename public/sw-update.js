/* ADIP Tools — SW update flow (ronde PWA, tim P6).
 *
 * Modul classic worker. Dimuat `public/sw.js` (P3) via importScripts SETELAH
 * `self.PWA` didefinisikan — modul ini membaca versi dari `self.PWA.version`
 * dan DILARANG hardcode nomor versi.
 *
 * Protokol pesan (R5 §2.4, kontrak P6 <-> P10):
 *   halaman -> SW (waiting) : { type: 'GET_VERSION' }   -> balas SW_VERSION
 *   SW -> halaman            : { type: 'SW_VERSION', version }
 *   halaman -> SW (waiting) : { type: 'SKIP_WAITING' }  -> self.skipWaiting()
 *   SW -> semua klien        : { type: 'SW_ACTIVATED', version }
 *
 * ATURAN KERAS:
 * - TIDAK ADA skipWaiting otomatis. `self.skipWaiting()` hanya dipanggil dari
 *   `handleMessage` saat menerima pesan SKIP_WAITING eksplisit dari halaman
 *   (tap "Muat ulang" user). Modul ini TIDAK memasang listener install /
 *   activate dan TIDAK pernah memanggil skipWaiting sendiri.
 * - TIDAK ADA cek update di sisi SW. Cek update adalah tugas halaman via
 *   `registration.update()` (milik P10); SW tidak melakukan polling sendiri.
 * - TIDAK ADA reload dari SW. Reload diputuskan halaman (P10) di event
 *   `controllerchange`, hanya bila user menyetujui update.
 *
 * Integrasi di sw.js (P3):
 *   self.addEventListener('message', (event) => {
 *     self.__pwaUpdate.handleMessage(event);
 *   });
 *   self.addEventListener('activate', (event) => {
 *     event.waitUntil((async () => {
 *       // ... cleanup cache lama (prefix adip-tools-*) ...
 *       await self.clients.claim();
 *       await self.__pwaUpdate.broadcastActivated();
 *     })());
 *   });
 */
'use strict';

(function () {
  // Versi selalu dari self.PWA.version (diinjeksi build-time oleh
  // gen-sw-precache.js). Sentinel 'unknown' hanya bila PWA belum terpasang
  // (build rusak) — bukan nomor versi, supaya pesan tetap membawa string.
  function getVersion() {
    var pwa = (typeof self !== 'undefined' && self.PWA) || null;
    if (pwa && typeof pwa.version === 'string' && pwa.version) {
      return pwa.version;
    }
    return 'unknown';
  }

  // Kirim satu pesan ke semua klien. Mengembalikan Promise<number> (jumlah
  // klien yang berhasil dikirimi). Satu klien gagal tidak menggagalkan yang
  // lain; clients.matchAll yang gagal resolve 0 (bukan throw) agar tidak
  // pernah menggagalkan event activate pemanggil.
  function broadcast(msg) {
    if (!self.clients || typeof self.clients.matchAll !== 'function') {
      return Promise.resolve(0);
    }
    return Promise.resolve(
      self.clients.matchAll({ includeUncontrolled: true }),
    ).then(function (clients) {
      var sent = 0;
      for (var i = 0; i < clients.length; i++) {
        try {
          clients[i].postMessage(msg);
          sent++;
        } catch (e) {
          // Abaikan klien yang gagal; lanjut ke klien berikutnya.
        }
      }
      return sent;
    }).catch(function () {
      return 0;
    });
  }

  // Dipanggil sw.js di event activate, SESUDAH cleanup cache + clients.claim()
  // (R5 §4.1: urutan cleanup -> claim -> broadcast). Tab lain yang tidak
  // memicu update menerima ini dan menampilkan banner lunak (milik P10).
  function broadcastActivated() {
    return broadcast({ type: 'SW_ACTIVATED', version: getVersion() });
  }

  function handleMessage(event) {
    if (!event || !event.data || typeof event.data !== 'object') return;
    var type = event.data.type;

    if (type === 'GET_VERSION') {
      var reply = { type: 'SW_VERSION', version: getVersion() };
      // 1) MessageChannel port DIDAHULUKAN: bila halaman membuka port,
      // ia menunggu balasan DI PORT itu (menjawab via event.source malah
      // mengirim ke listener 'message' umum dan port tidak pernah terjawab
      // — terbukti timeout 5 dtk di uji browser nyata, 20 Nov 2026).
      if (
        event.ports &&
        event.ports[0] &&
        typeof event.ports[0].postMessage === 'function'
      ) {
        try {
          event.ports[0].postMessage(reply);
          return;
        } catch (e) {
          // Jatuh ke jalur berikutnya.
        }
      }
      // 2) Balas langsung ke pengirim (bila halaman tidak memakai port).
      if (event.source && typeof event.source.postMessage === 'function') {
        try {
          event.source.postMessage(reply);
          return;
        } catch (e) {
          // Jatuh ke jalur terakhir.
        }
      }
      // 3) Terakhir: broadcast ke semua klien (tidak ada jalur balas lain).
      var p = broadcast(reply);
      if (typeof event.waitUntil === 'function') {
        try {
          event.waitUntil(p);
        } catch (e) {
          // waitUntil opsional; broadcast tetap jalan.
        }
      }
      return;
    }

    if (type === 'SKIP_WAITING') {
      // Hanya atas perintah eksplisit halaman. Tanpa guard tambahan:
      // skipWaiting() idempotent di platform (panggilan ke-2 no-op).
      if (typeof self.skipWaiting === 'function') {
        self.skipWaiting();
      }
      return;
    }

    // Tipe pesan lain: abaikan diam-diam.
  }

  self.__pwaUpdate = {
    handleMessage: handleMessage,
    broadcastActivated: broadcastActivated,
  };
})();
