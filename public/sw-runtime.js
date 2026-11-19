/* public/sw-runtime.js — Modul runtime cache Service Worker Adip Tools (ronde PWA).
 *
 * Classic worker, dimuat sw.js via importScripts (D-PWA-01). Modul ini TIDAK
 * berdiri sendiri: sw.js mendefinisikan `self.PWA` (nama cache berversi)
 * SEBELUM importScripts. Modul ini DILARANG hardcode versi — semua nama cache
 * dibaca dari `self.PWA` (precacheName / runtimeName).
 *
 * Kontrak (roster.md, KONTRAK MODUL SW):
 *   self.__pwaRuntime = { handleFetch(event) } — kembalikan Response, atau
 *   null = teruskan ke network (sw.js yang memutuskan).
 *
 * Strategi (R10 §3.1, R4 §9, D-PWA-10, D-PWA-12, R2):
 * - Navigasi: Network First (timeout 3 dtk, R10) -> index.html precache
 *   (SPA hash-routing: semua route dokumen yang sama) -> offline.html precache.
 *   RED1-06 (Blue R1): index.html HANYA untuk rute aplikasi (pathname '/'
 *   atau '/index.html' relatif terhadap scope SW); path lain offline
 *   mendapat offline.html (kartu offline jujur, bukan shell salah-URL).
 * - Chunk tool + aset same-origin (JS/CSS/font/gambar): Cache First di
 *   self.PWA.runtimeName, fallback precache bila jaringan gagal (FIX-2).
 *   Urutan: runtime hit -> fetch network -> bila fetch gagal (offline),
 *   cek self.PWA.precacheName. Entry chunk/CSS/font tinggal di precache
 *   tapi belum tentu pernah masuk runtime cache (chunk dimuat SEBELUM SW
 *   mengontrol halaman pada kunjungan pertama — temuan P3). Respons
 *   fallback precache TIDAK di-put ke runtime cache (hindari duplikasi).
 *   Perilaku online tidak berubah: precache hanya dipakai saat
 *   runtime-miss + jaringan gagal. Match precache memakai
 *   `{ ignoreVary: true }` (+ fallback match URL-string): respons
 *   tersimpan membawa `Vary: Origin`, dan match biasa MISS untuk request
 *   subresource `crossorigin` (membawa Origin; request install tidak) —
 *   tanpa ignoreVary, fallback TIDAK PERNAH tersaji (temuan FIX-2).
 *   Lookup runtime memakai `{ ignoreVary: true }` juga (FIX-5, temuan
 *   Q2-F2 / D-PWA-15): respons runtime tersimpan dengan `Vary: Origin`,
 *   dan match biasa MISS lintas-tipe — chunk yang masuk lewat import
 *   (mode CORS, membawa Origin) tidak cocok untuk plain fetch (tanpa
 *   Origin), dan sebaliknya, walau chunk ADA di cache. Aset content-hash
 *   immutable — isinya tidak bervariasi per Origin, jadi argumen
 *   keamanan FIX-2 berlaku sama di sini. URL content-hash = immutable.
 * - Hanya cache respons status 200, type 'basic'/'cors'. JANGAN PERNAH cache
 *   respons non-200 atau 'opaque' — Chromium mengingat kegagalan import() di
 *   module map, respons gagal yang ter-cache meracuni kunjungan berikutnya.
 *   RED1-02 (Blue R1): Content-Type respons wajib cocok dengan yang diminta
 *   (script -> javascript, style -> text/css, dst.; lihat
 *   contentTypeMatches) — respons 200 berkonten salah (mis. HTML dari SPA
 *   fallback) ditolak SIMPAN-nya tapi tetap disajikan dari jaringan.
 * - RED1-03 (Blue R1): sebelum cache.put, tanyakan
 *   self.__pwaQuota.shouldCache(url, contentLength) bila tersedia (guard
 *   kuota 85%, fail-open bila modul P14 tidak menyediakannya).
 * - RED1-07 (Blue R1): request berheader Range -> pass-through jaringan
 *   (tanpa baca/tulis cache), sama seperti modul CDN — respons cache
 *   adalah 200 penuh, bukan 206 parsial.
 * - JANGAN cache: /api/* (pass-through defensif; R2 membuktikan SW rakus
 *   menelan laporan CSP), payload ukur speedtest (hasil ukur palsu bila
 *   ter-cache), blob:/data:, non-GET, request cache 'no-store'.
 * - Eviction: sesudah menyimpan entri baru, panggil self.__pwaQuota
 *   .enforceLimits (modul P14) dengan batas D-PWA-10: max 300 entri,
 *   TTL 30 hari. Bila modul P14 belum ada, guard typeof — fetch tetap jalan.
 * - Cross-origin BUKAN urusan modul ini (modul P5/sw-cdn.js yang menangani
 *   jsDelivr/unpkg; D-PWA-12) — permintaan lintas-origin dikembalikan null.
 */
'use strict';

(function () {
  // Batas D-PWA-10 (roster.md): runtime cache chunk tool + aset same-origin.
  // TTL dalam HARI — menyesuaikan API nyata P14
  // (self.__pwaQuota.enforceLimits(cacheName, { maxEntries, maxAgeDays })).
  var MAX_ENTRIES = 300;
  var MAX_AGE_DAYS = 30;

  // Timeout Network First navigasi (R10 §3.1): jangan gantung lama di
  // koneksi lemot — sesudah ini, fallback ke precache.
  var NAV_TIMEOUT_MS = 3000;

  // Payload ukur tool tes-kecepatan-internet
  // (js/tools/liveapi/tes-kecepatan-internet.js, FILE_PING + FILE_UNDUH).
  // Tool memanggilnya dengan ?ping= / ?dl= + cache 'no-store'; pencocokan di
  // sini memakai path saja agar tetap kebal bila query/cache-mode berubah.
  // Kedua URL ini TIDAK dipakai tool lain sebagai library (grep repo).
  var SPEEDTEST_HOST = 'cdn.jsdelivr.net';
  var SPEEDTEST_PATHS = [
    '/npm/jquery@3.7.1/dist/jquery.min.js',
    '/npm/three@0.160.0/build/three.min.js'
  ];

  // Ekstensi aset same-origin yang boleh masuk runtime cache (cadangan bila
  // request.destination kosong — mis. fetch manual tanpa destination).
  var ASSET_EXT_RE = /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|avif|ico)$/i;

  function pwaNames() {
    var p = self.PWA;
    return (p && typeof p === 'object') ? p : null;
  }

  function isSpeedtestPayload(url) {
    if (url.hostname !== SPEEDTEST_HOST) return false;
    return SPEEDTEST_PATHS.indexOf(url.pathname) !== -1;
  }

  function isCacheableAsset(request, url) {
    // Runtime cache HANYA same-origin (D-PWA-12: lintas-origin urusan P5).
    if (url.origin !== self.location.origin) return false;
    var dest = request.destination;
    if (dest === 'script' || dest === 'style' || dest === 'font' || dest === 'image') return true;
    // destination '' (mis. fetch() manual): putuskan dari ekstensi.
    return ASSET_EXT_RE.test(url.pathname);
  }

  function isCacheableResponse(response, request) {
    if (!response || response.status !== 200 ||
      (response.type !== 'basic' && response.type !== 'cors')) return false;
    // RED1-02: Content-Type respons wajib cocok dengan yang diminta.
    if (request) return contentTypeMatches(request, response);
    return true;
  }

  // RED1-02: Content-Type dasar respons (tanpa parameter '; charset=...'),
  // huruf kecil. null bila tidak ada header / tidak ada API headers
  // (fail-open di pemanggil). Duplikat kecil dari modul CDN — modul SW
  // sengaja tanpa impor bersama (kontrak importScripts).
  function baseContentType(res) {
    if (!res || !res.headers || typeof res.headers.get !== 'function') return null;
    var ct = null;
    try {
      ct = res.headers.get('Content-Type');
    } catch (e) {
      return null;
    }
    if (!ct) return null;
    return String(ct).split(';')[0].trim().toLowerCase();
  }

  // RED1-02: cocokkan Content-Type respons dengan yang diminta — peta
  // yang sama dengan modul CDN (lihat sw-cdn.js contentTypeMatches):
  // destination script/worker -> text/javascript|application/javascript;
  // style -> text/css; image -> image/*; font -> font/* +
  // application/font-*; destination kosong -> ekstensi URL (.js/.mjs/
  // .css/.wasm/.json/gambar/font). Ekstensi tak dikenal dan respons
  // tanpa Content-Type = fail-open (diizinkan).
  function contentTypeMatches(request, res) {
    var ct = baseContentType(res);
    if (ct === null) return true;
    var dest = request && request.destination;
    var expected = null;
    if (dest === 'script' || dest === 'worker') expected = 'script';
    else if (dest === 'style') expected = 'style';
    else if (dest === 'image') expected = 'image';
    else if (dest === 'font') expected = 'font';
    else {
      var path = '';
      try {
        path = new URL(request.url).pathname.toLowerCase();
      } catch (e) {
        return true;
      }
      if (/\.(?:js|mjs)$/.test(path)) expected = 'script';
      else if (/\.css$/.test(path)) expected = 'style';
      else if (/\.(?:png|jpe?g|gif|svg|webp|avif|ico)$/.test(path)) expected = 'image';
      else if (/\.(?:woff2?|ttf|otf)$/.test(path)) expected = 'font';
      else if (/\.wasm$/.test(path)) expected = 'wasm';
      else if (/\.json$/.test(path)) expected = 'json';
      else return true; // ekstensi tak dikenal: fail-open
    }
    if (expected === 'script') {
      return ct === 'text/javascript' || ct === 'application/javascript';
    }
    if (expected === 'style') return ct === 'text/css';
    if (expected === 'image') return ct.indexOf('image/') === 0;
    if (expected === 'font') {
      return ct.indexOf('font/') === 0 || ct.indexOf('application/font-') === 0;
    }
    if (expected === 'wasm') return ct === 'application/wasm';
    if (expected === 'json') return ct === 'application/json';
    return true;
  }

  // RED1-03: guard kuota 85% (P14 shouldCache) sebelum cache.put.
  // Ukuran dari header Content-Length; tanpa header -> 0 (guard 85%
  // tetap jalan). Fail-open: tanpa modul P14 / tanpa shouldCache /
  // galat apa pun -> izinkan (perilaku lama).
  async function quotaAllows(request, response) {
    try {
      var q = self.__pwaQuota;
      if (!q || typeof q.shouldCache !== 'function') return true;
      var size = 0;
      if (response && response.headers && typeof response.headers.get === 'function') {
        var len = response.headers.get('Content-Length');
        var parsed = len === null || len === undefined ? NaN : parseInt(len, 10);
        if (!isNaN(parsed) && parsed > 0) size = parsed;
      }
      return await q.shouldCache(request.url, size);
    } catch (e) {
      return true;
    }
  }

  // RED1-07: deteksi header Range (pola yang sama dengan modul CDN).
  function hasRangeHeader(request) {
    try {
      return !!(request.headers && typeof request.headers.has === 'function' &&
        request.headers.has('range'));
    } catch (e) {
      return false;
    }
  }

  // RED1-06: rute aplikasikah navigasi ini? Benar bila pathname adalah
  // '/' atau '/index.html' RELATIF TERHADAP SCOPE SW (D-PWA-03: scope
  // root di Vercel, /adip-tools/ di Pages). Rute hash tool (/#/t/bmi)
  // ber-pathname '/' sehingga tetap rute aplikasi. Tanpa registration
  // (harness Node) scope dianggap root.
  function isAppRoute(request) {
    var pathname = '/';
    try {
      pathname = new URL(request.url).pathname;
    } catch (e) {
      return true; // URL tak ter-parse: perilaku lama (shell)
    }
    var scopePath = '/';
    try {
      if (self.registration && self.registration.scope) {
        scopePath = new URL(self.registration.scope).pathname;
      }
    } catch (e) { /* tanpa registration: scope root */ }
    var rel = pathname;
    if (scopePath !== '/' && scopePath.length > 1) {
      if (pathname === scopePath || pathname === scopePath.slice(0, -1)) rel = '/';
      else if (pathname.indexOf(scopePath) === 0) rel = pathname.slice(scopePath.length - 1);
    }
    return rel === '/' || rel === '/index.html';
  }

  // Eviction best-effort (P14). Kegagalan/guard di sini TIDAK BOLEH pernah
  // mematahkan fetch — eviction hanya kebersihan, bukan jalur respons.
  function enforceQuota(cacheName) {
    try {
      var q = self.__pwaQuota;
      if (q && typeof q.enforceLimits === 'function') {
        var p = q.enforceLimits(cacheName, {
          maxEntries: MAX_ENTRIES,
          maxAgeDays: MAX_AGE_DAYS
        });
        if (p && typeof p.catch === 'function') p.catch(function () {});
      }
    } catch (e) { /* abaikan: eviction tidak boleh mematahkan fetch */ }
  }

  function fetchWithTimeout(request, ms) {
    if (typeof AbortController === 'undefined') return fetch(request);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms);
    return fetch(request, { signal: controller.signal }).then(
      function (res) { clearTimeout(timer); return res; },
      function (err) { clearTimeout(timer); throw err; }
    );
  }

  async function serveNavigationFallback(request) {
    var names = pwaNames();
    if (!names || !names.precacheName) return null;
    var cache;
    try {
      cache = await caches.open(names.precacheName);
    } catch (e) {
      return null;
    }
    // URL absolut relatif terhadap lokasi sw.js — benar di root produksi
    // maupun subpath preview (D-PWA-03).
    var indexUrl = new URL('index.html', self.location.href).href;
    var offlineUrl = new URL('offline.html', self.location.href).href;
    // RED1-06: shell index.html HANYA untuk rute aplikasi; path lain
    // mendapat kartu offline jujur (bukan shell yang salah-untuk-URL).
    // Bila kartu offline hilang dari precache, null (error jaringan
    // jujur) — jangan sajikan shell sebagai pengganti.
    if (isAppRoute(request)) {
      var res = await cache.match(indexUrl);
      if (res) return res;
      res = await cache.match(offlineUrl);
      return res || null;
    }
    var off = await cache.match(offlineUrl);
    return off || null;
  }

  async function handleNavigation(request) {
    // Network First: HTML terbaru saat online; bila jaringan gagal/timeout,
    // sajikan shell dari precache (route hash tetap jalan — routing di JS).
    try {
      return await fetchWithTimeout(request, NAV_TIMEOUT_MS);
    } catch (e) {
      return serveNavigationFallback(request);
    }
  }

  // Fallback precache untuk aset (FIX-2, temuan P3): entry chunk/CSS/font
  // tinggal di precache, tapi belum tentu pernah masuk runtime cache —
  // chunk dimuat SEBELUM SW mengontrol halaman pada kunjungan pertama.
  // Dipanggil HANYA saat runtime-miss + fetch gagal (offline). Respons
  // dikembalikan apa adanya, TANPA di-put ke runtime cache (hindari
  // duplikasi entri yang sama di dua cache).
  //
  // JEBAKAN Vary (temuan FIX-2, terbukti browser nyata): respons precache
  // tersimpan dengan header `Vary: Origin` (vite preview mengirimnya;
  // server lain bisa menambah Vary lain). `cache.match(request)` BIASA
  // membandingkan header Origin: request subresource `crossorigin`
  // (module script / stylesheet / font preload) membawa Origin, sementara
  // request penyimpanan saat install (cache.addAll) tidak — hasilnya MISS
  // dan fallback precache TIDAK PERNAH tersaji untuk subresource (fetch()
  // biasa dari JS lolos karena tanpa Origin — itulah kenapa bug ini
  // menipu: probe fetch() sukses, reload nyata tetap gagal). Aset precache
  // adalah file statis same-origin yang isinya tidak bervariasi per Origin,
  // jadi `ignoreVary: true` di sini benar. Fallback ke match URL-string
  // (tanpa header Origin) bila ignoreVary tidak didukung browser lama.
  async function servePrecacheAsset(request, names) {
    if (!names || !names.precacheName) return null;
    var precache;
    try {
      precache = await caches.open(names.precacheName);
    } catch (e) {
      return null;
    }
    var res;
    try {
      res = await precache.match(request, { ignoreVary: true });
      if (!res) res = await precache.match(request.url);
    } catch (e) {
      return null;
    }
    return res || null;
  }

  async function handleAsset(request) {
    var names = pwaNames();
    if (!names || !names.runtimeName) return null;
    var cache;
    try {
      cache = await caches.open(names.runtimeName);
    } catch (e) {
      return null;
    }
    var cached;
    try {
      // `{ ignoreVary: true }` (FIX-5, temuan Q2-F2 / D-PWA-15): respons
      // tersimpan membawa `Vary: Origin`; match biasa MISS lintas-tipe
      // (import ber-Origin vs plain fetch tanpa Origin) walau chunk ADA
      // di runtime cache. Aset content-hash immutable — isi tidak
      // bervariasi per Origin (argumen yang sama seperti FIX-2 di
      // jalur precache).
      cached = await cache.match(request, { ignoreVary: true });
    } catch (e) {
      cached = undefined;
    }
    if (cached) return cached;
    var response;
    try {
      response = await fetch(request);
    } catch (e) {
      // Jaringan gagal + runtime miss: fallback ke precache (FIX-2).
      // Bila tidak ada di precache juga, null — biarkan browser/halaman
      // menangani kegagalan secara jujur (jangan sajikan fallback palsu).
      return servePrecacheAsset(request, names);
    }
    if (isCacheableResponse(response, request) && request.cache !== 'no-store') {
      try {
        // RED1-03: guard kuota 85% sebelum put (fail-open bila tak ada).
        if (await quotaAllows(request, response)) {
          await cache.put(request, response.clone());
        }
        enforceQuota(names.runtimeName);
      } catch (e) { /* put gagal (mis. kuota) — respons tetap dikembalikan */ }
    }
    return response;
  }

  async function handleFetch(event) {
    var request = event && event.request;
    if (!request || request.method !== 'GET') return null;
    var url;
    try {
      url = new URL(request.url);
    } catch (e) {
      return null;
    }
    // blob:/data: dan skema non-http(s) — teruskan (bukan urusan cache).
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    // /api/* pass-through DEFENSIF (aturan keras R2: SW rakus menelan
    // laporan CSP; sw.js juga mengecualikannya, tapi modul ini menolak juga).
    if (url.pathname === '/api' || url.pathname.indexOf('/api/') === 0) return null;
    // Payload ukur speedtest — JANGAN PERNAH di-cache (hasil ukur palsu).
    if (isSpeedtestPayload(url)) return null;
    // RED1-07: request berheader Range -> jaringan langsung, tanpa
    // baca/tulis cache (respons cache adalah 200 penuh, bukan 206).
    if (hasRangeHeader(request)) return null;
    // Navigasi (dokumen SPA) — Network First + fallback precache.
    if (request.mode === 'navigate') return handleNavigation(request);
    // Chunk tool + aset same-origin — Cache First.
    if (isCacheableAsset(request, url)) return handleAsset(request);
    // Lainnya (lintas-origin non-CDN, sitemap/llms, dsb.) — teruskan network.
    return null;
  }

  self.__pwaRuntime = {
    handleFetch: handleFetch,
    // Diekspos untuk introspeksi P14/Q2 (bukan bagian kontrak fetch).
    limits: { maxEntries: MAX_ENTRIES, maxAgeDays: MAX_AGE_DAYS }
  };
})();
