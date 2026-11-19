/* ADIP Tools — SW quota & eviction (ronde PWA, tim P14).
 *
 * Modul classic worker. Dimuat `public/sw.js` (P3) via importScripts SETELAH
 * `self.PWA` didefinisikan — modul ini membaca nama cache dari `self.PWA`
 * (runtimeName / cdnName) dan DILARANG hardcode nomor versi.
 *
 * Batas default D-PWA-10 (roster, R10 menang atas R9 — seluruh korpus chunk
 * hanya ~6 MB, jadi batas 50-100 entri R9 terlalu ketat tanpa alasan):
 *   runtime chunk: max 300 entri + 30 hari
 *   CDN          : max 20 entri  + 30 hari
 * Batas diterima sebagai parameter enforceLimits — modul pemanggil (P4/P5)
 * yang menentukan; default di atas hanya dipakai bila parameter tidak
 * diberikan (dan hanya untuk cache yang namanya dikenali lewat self.PWA).
 *
 * Mekanisme utama pengendalian storage tetap nama cache berversi + hapus
 * cache lama di `activate` (P6, R5 §4.1). Eviction di sini hanya pelengkap
 * (R10 §3.3): FIFO via urutan `cache.keys()` — tanpa IndexedDB, karena
 * batas 300 entri praktis jarang tercapai sehingga selisih LRU vs FIFO
 * hampir tidak terasa.
 *
 * API yang diekspor (self.__pwaQuota):
 *   enforceLimits(cacheName, { maxEntries, maxAgeDays[, maxAgeSeconds] })
 *     Hapus entri kedaluwarsa (umur dari header `Date` respons; entri
 *     TANPA header Date — atau Date tak ter-parse — DIPERTAHANKAN, jangan
 *     hapus buta), lalu hapus entri tertua (FIFO) sampai <= maxEntries.
 *     Mengembalikan Promise<stats> dan TIDAK PERNAH reject — aman
 *     dipanggil fire-and-forget sesudah cache.put() tanpa memblokir
 *     respons ke halaman. stats = { cache, deletedExpired,
 *     deletedOverflow, remaining, error }.
 *     RED1-03 (Blue R1): DISERIALKAN + DI-COALESCE per nama cache —
 *     paling banyak satu enforcement berjalan per cache; pemicu yang
 *     datang selama enforcement berjalan ditunda dan digabung menjadi
 *     SATU run susulan (bukan antrean N run). Tanpa ini, banjir 350 put
 *     memicu 350 enforcement tumpang-tindih O(n) dan cap 300 entri
 *     dilanggar berdetik-detik (poc-07 Red-1: 351 entri di t+3 dtk).
 *   getCacheSizes()
 *     Jumlah entri + perkiraan byte per cache `adip-tools-*` (diagnostik;
 *     P17 memakai API halaman, bukan ini). Byte dari header Content-Length
 *     bila ada, bila tidak dari body (clone().arrayBuffer()); entri yang
 *     bodinya tak terbaca (mis. opaque) ditandai bytesEstimated. Jumlah
 *     entri opaque dilaporkan terpisah (Chrome menghitung tiap respons
 *     opaque ~7 MB terhadap kuota, apa pun ukuran aslinya — R10 §3.4).
 *     Mengembalikan Promise<result> dan TIDAK PERNAH reject.
 *   shouldCache(url, responseSize)
 *     Guard kuota sebelum caching baru. Bila `navigator.storage.estimate()`
 *     menunjukkan kuota >85% terpakai, tolak (return false) — pemanggil
 *     melayani dari jaringan, jangan gagalkan halaman. Bila API estimate
 *     tidak tersedia / gagal / kuota tak diketahui, IZINKAN (fail-open).
 *     Guard kedua: tolak bila usage + responseSize melebihi kuota penuh.
 *     Parameter `url` diterima untuk kenyamanan pemanggil / kebijakan
 *     per-URL di masa depan; saat ini tidak mempengaruhi keputusan.
 *
 * Integrasi di sw.js / modul runtime & CDN (P4/P5):
 *   // sesudah cache.put(), fire-and-forget — jangan await di fetch handler:
 *   self.__pwaQuota.enforceLimits(self.PWA.runtimeName,
 *     { maxEntries: 300, maxAgeDays: 30 });
 *   // sebelum cache.put(), guard kuota:
 *   if (await self.__pwaQuota.shouldCache(url, size)) await cache.put(req, res);
 */
'use strict';

(function () {
  // Prefix seleksi cache milik Adip Tools (R5 §4.1). Ini prefix, bukan versi.
  var CACHE_PREFIX = 'adip-tools-';

  // Ambang guard kuota: tolak caching baru bila pemakaian > 85% kuota.
  var QUOTA_WARN_RATIO = 0.85;

  // Batas default D-PWA-10 per jenis cache.
  var DEFAULT_LIMITS = {
    runtime: { maxEntries: 300, maxAgeDays: 30 },
    cdn: { maxEntries: 20, maxAgeDays: 30 },
  };

  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function getPWA() {
    if (typeof self !== 'undefined' && self.PWA) return self.PWA;
    return null;
  }

  // Tentukan batas efektif: parameter pemanggil menang; field yang hilang
  // diisi default D-PWA-10 sesuai jenis cache (dikenali lewat self.PWA);
  // cache tak dikenal tanpa parameter = tanpa batas (no-op).
  function limitsFor(cacheName, opts) {
    var pwa = getPWA();
    var base = null;
    if (pwa && cacheName === pwa.runtimeName) base = DEFAULT_LIMITS.runtime;
    else if (pwa && cacheName === pwa.cdnName) base = DEFAULT_LIMITS.cdn;
    var maxEntries =
      opts && typeof opts.maxEntries === 'number'
        ? opts.maxEntries
        : base
          ? base.maxEntries
          : Infinity;
    // Alias maxAgeSeconds diterima demi kompatibilitas pemanggil CDN (P5
    // mengirim maxAgeSeconds; P4 mengirim maxAgeDays). maxAgeDays menang
    // bila keduanya diberikan.
    var maxAgeDays =
      opts && typeof opts.maxAgeDays === 'number'
        ? opts.maxAgeDays
        : opts && typeof opts.maxAgeSeconds === 'number'
          ? opts.maxAgeSeconds / 86400
          : base
            ? base.maxAgeDays
            : Infinity;
    return { maxEntries: maxEntries, maxAgeDays: maxAgeDays };
  }

  // Hapus entri kedaluwarsa lalu trim FIFO sampai <= maxEntries.
  // TIDAK PERNAH reject: kegagalan apa pun dilaporkan di stats.error.
  // SATU run mentah — JANGAN dipanggil langsung dari luar modul; pakai
  // enforceLimits (wrapper serialisasi/coalescing, RED1-03) di bawah.
  async function runEnforceLimits(cacheName, opts) {
    var stats = {
      cache: cacheName,
      deletedExpired: 0,
      deletedOverflow: 0,
      remaining: 0,
      error: null,
    };
    try {
      var limits = limitsFor(cacheName, opts);
      var cache = await caches.open(cacheName);
      // cache.keys() mengembalikan URL sesuai urutan penyisipan (Chrome /
      // Firefox) — dasar FIFO.
      var keys = await cache.keys();
      var now = Date.now();
      var maxAgeMs = limits.maxAgeDays * MS_PER_DAY;
      var checkAge = isFinite(maxAgeMs);
      var survivors = [];
      for (var i = 0; i < keys.length; i++) {
        var req = keys[i];
        var expired = false;
        if (checkAge) {
          try {
            var res = await cache.match(req);
            var dateHeader =
              res && res.headers ? res.headers.get('Date') : null;
            if (dateHeader) {
              var t = Date.parse(dateHeader);
              // Hanya hapus bila Date valid DAN umur melewati batas.
              // Tanpa Date / Date tak ter-parse: pertahankan.
              if (!isNaN(t) && now - t > maxAgeMs) expired = true;
            }
          } catch (e) {
            // cache.match gagal: pertahankan entri, jangan hapus buta.
          }
        }
        if (expired) {
          await cache.delete(req);
          stats.deletedExpired++;
        } else {
          survivors.push(req);
        }
      }
      // Trim FIFO: hapus tertua dulu sampai dalam batas.
      while (survivors.length > limits.maxEntries) {
        var oldest = survivors.shift();
        await cache.delete(oldest);
        stats.deletedOverflow++;
      }
      stats.remaining = survivors.length;
    } catch (e) {
      stats.error = String((e && e.message) || e);
    }
    return stats;
  }

  // RED1-03: state serialisasi per nama cache —
  // { running, queuedOpts, waiters[] }. Satu enforcement berjalan per
  // cache; pemicu selama berjalan dicatat (opts terbaru menang) dan
  // pemanggilnya menunggu run susulan yang sama. Loop while menangani
  // pemicu yang datang SELAMA run susulan (satu run lagi, dst.).
  // Tanpa await antara cek `while` dan `running = false`, tidak ada
  // interleaving (JS single-threaded): pemanggil yang datang sesudah
  // loop selesai selalu memulai run-nya sendiri.
  var enforceState = {};

  function enforceStateFor(cacheName) {
    var st = enforceState[cacheName];
    if (!st) {
      st = { running: false, queuedOpts: null, waiters: [] };
      enforceState[cacheName] = st;
    }
    return st;
  }

  // Wrapper publik: serial + coalesce. Kontrak sama dengan sebelumnya
  // (Promise<stats>, tidak pernah reject); stats yang dikembalikan
  // adalah stats run TERAKHIR yang mencakup pemanggilan ini.
  async function enforceLimits(cacheName, opts) {
    var st = enforceStateFor(cacheName);
    if (st.running) {
      st.queuedOpts = opts;
      return new Promise(function (resolve) {
        st.waiters.push(resolve);
      });
    }
    st.running = true;
    var stats = await runEnforceLimits(cacheName, opts);
    while (st.queuedOpts) {
      var nextOpts = st.queuedOpts;
      st.queuedOpts = null;
      var waiters = st.waiters;
      st.waiters = [];
      stats = await runEnforceLimits(cacheName, nextOpts);
      waiters.forEach(function (resolve) {
        try {
          resolve(stats);
        } catch (e) { /* abaikan */ }
      });
    }
    st.running = false;
    return stats;
  }

  // Hitung jumlah entri + perkiraan byte per cache `adip-tools-*`.
  // TIDAK PERNAH reject.
  async function getCacheSizes() {
    var result = {
      caches: {},
      totalEntries: 0,
      totalBytes: 0,
      bytesEstimated: false,
      error: null,
    };
    try {
      var names = await caches.keys();
      for (var n = 0; n < names.length; n++) {
        var name = names[n];
        if (name.indexOf(CACHE_PREFIX) !== 0) continue;
        var cache = await caches.open(name);
        var keys = await cache.keys();
        var bytes = 0;
        var estimated = false;
        var opaque = 0;
        for (var i = 0; i < keys.length; i++) {
          var res = await cache.match(keys[i]);
          if (!res) continue;
          if (res.type === 'opaque') opaque++;
          var len = res.headers ? res.headers.get('Content-Length') : null;
          if (len !== null && len !== undefined) {
            var parsed = parseInt(len, 10);
            if (!isNaN(parsed)) bytes += parsed;
            else estimated = true;
          } else {
            try {
              var buf = await res.clone().arrayBuffer();
              bytes += buf.byteLength;
            } catch (e) {
              // Body tak terbaca (mis. opaque): tandai estimasi, jangan gagal.
              estimated = true;
            }
          }
        }
        result.caches[name] = {
          entries: keys.length,
          bytes: bytes,
          bytesEstimated: estimated,
          opaqueEntries: opaque,
        };
        result.totalEntries += keys.length;
        result.totalBytes += bytes;
        if (estimated) result.bytesEstimated = true;
      }
    } catch (e) {
      result.error = String((e && e.message) || e);
    }
    return result;
  }

  // Guard kuota sebelum caching baru. Fail-open: API tak tersedia / gagal /
  // kuota tak diketahui -> izinkan (true). Tolak (false) bila pemakaian
  // >85% kuota, atau bila usage + responseSize melebihi kuota penuh.
  async function shouldCache(url, responseSize) {
    try {
      var nav = null;
      if (typeof self !== 'undefined' && self.navigator) nav = self.navigator;
      else if (typeof navigator !== 'undefined') nav = navigator;
      if (!nav || !nav.storage || typeof nav.storage.estimate !== 'function') {
        return true;
      }
      var est = await nav.storage.estimate();
      if (!est || typeof est.quota !== 'number' || est.quota <= 0) return true;
      var usage = typeof est.usage === 'number' ? est.usage : 0;
      if (usage / est.quota > QUOTA_WARN_RATIO) return false;
      var size =
        typeof responseSize === 'number' &&
        isFinite(responseSize) &&
        responseSize > 0
          ? responseSize
          : 0;
      if (size > 0 && usage + size > est.quota) return false;
      return true;
    } catch (e) {
      return true;
    }
  }

  self.__pwaQuota = {
    enforceLimits: enforceLimits,
    getCacheSizes: getCacheSizes,
    shouldCache: shouldCache,
    // Diekspor agar pemanggil (P4/P5) bisa memakai default D-PWA-10 yang
    // sama tanpa menduplikasi angka: LIMITS.runtime / LIMITS.cdn.
    LIMITS: DEFAULT_LIMITS,
    QUOTA_WARN_RATIO: QUOTA_WARN_RATIO,
  };
})();
