// public/sw-cdn.js — modul strategi CDN untuk Service Worker Adip Tools.
// PWA v6.20.0, tim P5. Classic worker: dimuat public/sw.js via importScripts
// SETELAH self.PWA didefinisikan (D-PWA-01). JANGAN ubah file ini menjadi
// modul ESM — importScripts tidak bisa memuat ESM.
//
// KONTRAK MODUL SW (roster, dikunci koordinator 20 Nov 2026):
//   - Nama cache DIBACA dari self.PWA.cdnName — modul ini DILARANG hardcode
//     nama cache maupun versi. Bila self.PWA belum ada, handleFetch fail-open
//     (kembalikan null = jaringan langsung, tanpa cache).
//   - Ekspor: self.__pwaCdn = { async handleFetch(event) } -> Response | null.
//     null berarti "bukan urusan modul ini" — sw.js tidak respondWith dan
//     browser melakukan fetch normal.
//   - sw.js sudah menyaring non-GET / non-http(s) / /api/* sebelum memanggil
//     modul ini; guard di bawah adalah pertahanan lapis kedua.
//
// BATAS HOST (D-PWA-12, dari R2 empiris): hanya cdn.jsdelivr.net + unpkg.com
// (anggota connect-src — fetch SW ke sana diizinkan saat enforcing).
// cdnjs, esm.sh, js.puter.com ada di script-src tapi TIDAK di connect-src —
// fetch() SW ke sana DIBLOKIR saat enforcing, jadi modul ini mengembalikan
// null untuk ketiganya (halaman tetap memuatnya via <script> seperti biasa,
// tanpa cache SW). Google Fonts (fonts.googleapis.com / fonts.gstatic.com)
// juga di luar host izin — font situs di-precache dari bundle lokal.
//
// STRATEGI:
//   - Lib CDN umum: stale-while-revalidate. Ada cache -> sajikan cache
//     langsung + perbarui di latar (event.waitUntil). Tidak ada cache ->
//     fetch jaringan + simpan, lalu sajikan.
//   - ffmpeg WASM core (@ffmpeg/* BERPIN versi, ~31 MB): CacheFirst
//     on-demand. URL berpin versi immutable sehingga cache tidak bisa basi,
//     dan revalidasi latar tiap pemakaian hanya membuang ~31 MB bandwidth.
//     ffmpeg TANPA pin versi tidak pernah di-cache (bytes bisa berubah
//     tanpa ganti URL). Karena immutable, 'reload'/'no-cache' pun tetap
//     dilayani dari cache (FIX-7/F1: byte di URL berpin tidak bisa berubah,
//     jadi memaksa unduh ulang ~31 MB saat hard-reload hanya pemborosan;
//     lib SWR yang mutable tetap menghormati skipRead).
//   - pdf.js worker berpin (FIX-7/F2): pdf.js memuat worker via
//     new Worker() mode no-cors -> respons opaque -> aturan umum menolaknya
//     -> tool pdf gagal total saat offline. URL worker BERPIN ini diambil
//     ulang dengan mode CORS eksplisit (jsDelivr/unpkg mengirim
//     Access-Control-Allow-Origin: *) sehingga responsnya 'cors' 200 dan
//     lolos isCacheableResponse TANPA mengubah aturan itu. Worker lain
//     (tesseract, mediapipe) tidak tersentuh: tetap opaque + tidak di-cache.
//   - Hanya cache respons status 200 type 'cors'. JANGAN PERNAH cache
//     respons 'opaque' (status + bytes tidak bisa diverifikasi — tidak ada
//     cara memastikan isinya cocok dengan hash SRI) atau non-200 (respons
//     gagal yang ter-cache meracuni kunjungan berikutnya; D-PWA-10).
//
// PRESERVASI SRI — mengapa script ber-integrity tetap aman dari cache:
//   1. Cache API menyimpan byte respons APA ADANYA (tanpa transformasi).
//   2. Saat SW menyajikan respons cache ke <script integrity="sha384-...">,
//      browser menjalankan cek integrity terhadap byte yang disajikan —
//      persis seperti bila byte itu datang dari jaringan. Byte yang sama
//      dengan saat hash dibuat -> cek lolos; byte berbeda -> script diblokir.
//   3. Karena itu caching TIDAK melemahkan SRI: cache tidak bisa menyuntikkan
//      byte yang lolos cek integrity kecuali byte itu memang byte aslinya.
//   RISIKO SISA: bila bytes di CDN berubah TANPA ganti URL, cache lama tetap
//   menyajikan byte lama — yang tetap LOLOS integrity (hash cocok dengan
//   byte lama) tapi menjalankan kode lama. Untuk URL berpin versi risiko ini
//   tidak terjadi (versi npm immutable; jsDelivr/unpkg menyajikan tarball
//   registry apa adanya). Lapisan tambahan (terbukti live 20 Nov 2026):
//   untuk pemuatan ber-SRI, fetch(request) di dalam SW ikut menegakkan
//   integrity metadata request — revalidasi latar TIDAK BISA menyimpan byte
//   yang gagal cek integrity (byte drift ditolak di jaringan, cache tetap
//   memegang byte lama yang valid). ffmpeg CacheFirst menerima risiko sisa
//   secara sadar karena bump versi selalu mengganti URL (= kunci cache
//   baru). Puter SDK (js.puter.com/v2/, TANPA pin) TIDAK di-cache sama sekali.
//   CATATAN: hanya pemuatan CORS-mode yang menghasilkan respons 'cors' dan
//   bisa di-cache: <script crossorigin="anonymous"> + integrity (loadScript
//   di core.js memasang keduanya untuk 45 URL SRI_HASH), dynamic import()
//   ESM, dan fetch(). <script> TANPA crossorigin menghasilkan 'opaque' dan
//   lewat tanpa cache — tetap jalan online, gagal jujur saat offline.
//   PENGECUALIAN (FIX-7/F2): pdf.js worker berpin diambil ulang mode CORS
//   oleh SW (lihat isPdfJsWorkerPinned) supaya tool pdf jalan offline.
//
// PENGECUALIAN LAIN (selain host terlarang):
//   - Payload speedtest (tes-kecepatan-internet.js): jquery@3.7.1 +
//     three@0.160.0 jsDelivr — meng-cache-nya membuat hasil ukur palsu (R4).
//     Kedua URL hanya dipakai tool itu (grep js/ 20 Nov 2026), jadi
//     pengecualian per-path tidak merugikan tool lain. Dicocokkan per
//     pathname (tool menambahkan ?ping=/?dl= timestamp).
//   - Request cache:'no-store' (dipakai speedtest + pemakaian lain):
//     passthrough, jangan baca/tulis cache.
//   - Request dengan header Range: respons cache adalah 200 penuh — jangan
//     sajikan untuk permintaan parsial, dan jangan simpan respons 206.
//   - Request cache:'reload'/'no-cache': lewati BACA cache (wajib revalidasi)
//     tapi tetap simpan hasil segarnya.
//
// EVICTION (D-PWA-10): max 20 entri / 30 hari, via
//   self.__pwaQuota.enforceLimits(cacheName, { maxEntries, maxAgeDays })
// (kontrak final P14, public/sw-quota.js: TTL dari header Date respons —
// entri tanpa Date valid DIPERTAHANKAN; trim FIFO via cache.keys();
// tidak pernah reject, mengembalikan stats). Bila modul P14 belum termuat
// (guard typeof) atau gagal, fallback FIFO lokal: hapus entri tertua
// (urutan insert cache.keys()) sampai <= 20 entri. Fallback TIDAK
// menegakkan TTL 30 hari (tanpa membaca header Date tiap entri, umur
// tidak diketahui — itu ranah P14). Kegagalan eviction jatuh ke fallback
// dan TIDAK PERNAH mematahkan respons fetch.
//
// UMUR SAAT BACA (RED1-01, Blue R1, Opsi A): nama cache CDN TIDAK
// berversi lintas rilis (sengaja — ffmpeg 31 MB tidak boleh diunduh
// ulang tiap rilis), jadi batas umur racun adalah TTL 30 hari yang
// ditegakkan DI SINI pada setiap cache-hit (isFreshEnough), BUKAN hanya
// di enforceLimits pasca-put — entri CacheFirst ffmpeg tidak pernah
// di-put ulang, jadi tanpa cek baca ia tidak pernah dicek umurnya.
// Entri dengan Date valid berumur > 30 hari dianggap miss: dihapus +
// di-fetch ulang. Entri TANPA Date valid dipertahankan (fail-open):
// jsDelivr + unpkg SELALU mengirim Date (terverifikasi curl live
// 20 Nov 2026), jadi entri tanpa Date praktis tidak terjadi dari CDN
// sungguhan; fail-open menghindari unduh ulang 31 MB tiap baca bila
// satu edge lupa mengirim Date. Residual ini dicatat di SECURITY.md.
//
// GUARD CONTENT-TYPE (RED1-02, Blue R1): respons hanya DISIMPAN bila
// Content-Type-nya cocok dengan yang diminta (peta di
// contentTypeMatches). Respons yang ditolak TETAP disajikan ke halaman
// dari jaringan — hanya penyimpanannya yang ditolak. Tanpa header
// Content-Type (atau tanpa API headers, mis. harness Node) = fail-open.
//
// GUARD KUOTA (RED1-03, Blue R1): sebelum cache.put, tanyakan
// self.__pwaQuota.shouldCache(url, contentLength) bila tersedia —
// tolak caching baru bila pemakaian storage > 85% kuota. Fail-open
// bila modul P14 tidak menyediakan shouldCache.
//
// DEDUP: unduhan untuk URL yang sama hanya berjalan sekali (peta inflight).
// Pemanggil bersamaan berbagi SATU respons jaringan; masing-masing WAJIB
// meng-clone() secara sinkron sebelum mengembalikannya ke respondWith —
// satu Response hanya bisa dikonsumsi sekali, tapi clone() dari beberapa
// pemanggil aman selama dilakukan sebelum ada yang mengonsumsi bodi
// (semua continuation microtask jalan sebelum browser membaca respons).
// Dua tab yang membuka tool ffmpeg bersamaan tidak pernah mengunduh 31 MB
// dua kali.
(function () {
  'use strict';

  var ALLOWED_HOSTS = ['cdn.jsdelivr.net', 'unpkg.com'];
  var MAX_ENTRIES = 20;
  var MAX_AGE_DAYS = 30;

  // Payload ukur speedtest — JANGAN PERNAH di-cache (hasil ukur palsu).
  // Sumber: js/tools/liveapi/tes-kecepatan-internet.js:9-10.
  var SPEEDTEST_PATHS = [
    '/npm/jquery@3.7.1/dist/jquery.min.js',
    '/npm/three@0.160.0/build/three.min.js'
  ];

  // ffmpeg: CacheFirst HANYA bila path membawa pin semver eksplisit
  // (jsDelivr /npm/@ffmpeg/ffmpeg@0.12.15/... atau unpkg
  // /@ffmpeg/core@0.12.10/... — awalan /npm opsional). Bentuk tanpa pin
  // (@latest, tanpa @versi) masuk FFMPEG_ANY tapi bukan FFMPEG_PINNED ->
  // tidak pernah di-cache. Versi prarilis (0.12.10-beta.1) juga tidak
  // cocok pola pin -> fail-closed, tidak di-cache.
  var FFMPEG_PINNED = /^(\/npm)?\/@ffmpeg\/(ffmpeg|core)@\d+\.\d+\.\d+\//;
  var FFMPEG_ANY = /^(\/npm)?\/@ffmpeg\/(ffmpeg|core)(@|\/)/;

  // pdf.js worker berpin (FIX-7/F2): SEMUA tool memakai SATU pin yang sama
  // (PDFJS_WORKER = .../pdfjs-dist@3.11.174/build/pdf.worker.min.js, ~38
  // file). Pola pin semver seperti FFMPEG_PINNED: versi tanpa pin (@latest,
  // tanpa @versi) fail-closed ke perilaku lama (opaque, tidak di-cache).
  var PDFJS_WORKER_PINNED = /^(\/npm)?\/pdfjs-dist@\d+\.\d+\.\d+\/build\/pdf\.worker\.min\.js$/;

  // url -> Promise<boolean> unduhan latar yang sedang berjalan.
  var inflight = new Map();

  function cdnCacheName() {
    var pwa = self.PWA;
    if (!pwa || typeof pwa.cdnName !== 'string' || !pwa.cdnName) return null;
    return pwa.cdnName;
  }

  // Satu-satunya respons yang boleh masuk cache: 200 + CORS (terverifikasi).
  // 'opaque' (no-cors) dan non-200 selalu ditolak — lihat header file.
  // RED1-02: bila request diberikan, Content-Type respons juga wajib
  // cocok dengan yang diminta (contentTypeMatches).
  function isCacheableResponse(res, request) {
    if (!res || res.status !== 200 || res.type !== 'cors') return false;
    if (request) return contentTypeMatches(request, res);
    return true;
  }

  // RED1-02: Content-Type dasar respons (tanpa parameter '; charset=...'),
  // huruf kecil. null bila tidak ada header / tidak ada API headers
  // (fail-open di pemanggil).
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

  // RED1-02: cocokkan Content-Type respons dengan yang diminta.
  // Peta: destination script/worker -> text/javascript|application/javascript
  // (jsDelivr memakai application/javascript, unpkg text/javascript —
  // keduanya sah); style -> text/css; image -> image/*; font -> font/* +
  // application/font-*. Bila destination kosong (fetch manual / Request
  // hasil konstruksi seperti re-fetch CORS worker pdf), putuskan dari
  // ekstensi URL (.js/.mjs/.css/.wasm/.json/gambar/font). Ekstensi tak
  // dikenal (mis. .tflite/.data model ML) dan respons tanpa Content-Type
  // = fail-open (diizinkan) — guard ini hanya menolak KETIDAKCOCOKAN
  // yang pasti, mis. HTML 200 tersimpan sebagai .js (RED1-02).
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

  // RED1-01: segarkah entri cache ini? Batas MAX_AGE_DAYS (30 hari) dari
  // header Date respons tersimpan. Tanpa Date / Date tak ter-parse /
  // tanpa API headers = FRESH (fail-open — lihat catatan UMUR SAAT BACA
  // di header file). Date masa depan (jam server miring, RED1-12)
  // menghasilkan umur negatif -> segar.
  var MS_PER_DAY = 24 * 60 * 60 * 1000;

  function isFreshEnough(res) {
    if (!res || !res.headers || typeof res.headers.get !== 'function') return true;
    var dateHeader = null;
    try {
      dateHeader = res.headers.get('Date');
    } catch (e) {
      return true;
    }
    if (!dateHeader) return true;
    var t = Date.parse(dateHeader);
    if (isNaN(t)) return true;
    return Date.now() - t <= MAX_AGE_DAYS * MS_PER_DAY;
  }

  // RED1-03: guard kuota 85% (P14 shouldCache) sebelum cache.put.
  // Ukuran dari header Content-Length; tanpa header -> 0 (guard 85%
  // tetap jalan). Fail-open: tanpa modul P14 / tanpa shouldCache /
  // galat apa pun -> izinkan (perilaku lama).
  async function quotaAllows(request, res) {
    try {
      var q = self.__pwaQuota;
      if (!q || typeof q.shouldCache !== 'function') return true;
      var size = 0;
      if (res && res.headers && typeof res.headers.get === 'function') {
        var len = res.headers.get('Content-Length');
        var parsed = len === null || len === undefined ? NaN : parseInt(len, 10);
        if (!isNaN(parsed) && parsed > 0) size = parsed;
      }
      return await q.shouldCache(request.url, size);
    } catch (e) {
      return true;
    }
  }

  function isSpeedtest(url) {
    if (url.hostname !== 'cdn.jsdelivr.net') return false;
    return SPEEDTEST_PATHS.indexOf(url.pathname) !== -1;
  }

  function isFfmpegPinned(url) {
    return FFMPEG_PINNED.test(url.pathname);
  }

  function isFfmpegUnpinned(url) {
    return FFMPEG_ANY.test(url.pathname) && !FFMPEG_PINNED.test(url.pathname);
  }

  function isPdfJsWorkerPinned(url) {
    return PDFJS_WORKER_PINNED.test(url.pathname);
  }

  function hasRangeHeader(request) {
    try {
      return !!(request.headers && typeof request.headers.has === 'function' &&
        request.headers.has('range'));
    } catch (e) {
      return false;
    }
  }

  // Daftarkan kerja latar ke SW (agar tidak terpotong saat SW dihentikan)
  // + telan rejection (kerja latar tidak boleh mematahkan fetch).
  function track(event, promise) {
    var guarded = promise.catch(function () {});
    try {
      if (event && typeof event.waitUntil === 'function') {
        event.waitUntil(guarded);
      }
    } catch (e) { /* waitUntil opsional di luar SW */ }
  }

  // Tegakkan batas 20 entri / 30 hari. P14 bila ada, FIFO lokal bila tidak.
  async function enforceLimits(cache, cacheName) {
    var quota = self.__pwaQuota;
    if (quota && typeof quota.enforceLimits === 'function') {
      try {
        await quota.enforceLimits(cacheName, {
          maxEntries: MAX_ENTRIES,
          maxAgeDays: MAX_AGE_DAYS
        });
        return;
      } catch (e) { /* jatuh ke fallback FIFO di bawah */ }
    }
    try {
      var keys = await cache.keys();
      while (keys.length > MAX_ENTRIES) {
        var oldest = keys.shift();
        await cache.delete(oldest);
      }
    } catch (e) { /* eviction gagal — cache tetap berfungsi */ }
  }

  // Fetch jaringan ter-dedup per URL: pemanggil bersamaan berbagi SATU
  // unduhan. Mengembalikan Response jaringan (atau null bila gagal) dan
  // TIDAK PERNAH melempar. Pemanggil pertama (fetcher) menyimpan salinan
  // respons cacheable ke cache sebelum promise resolve. Pemanggil WAJIB
  // meng-clone() hasil ini secara sinkron sebelum mengembalikannya ke
  // respondWith (lihat catatan DEDUP di header file).
  function fetchShared(request, cacheName) {
    var key = request.url;
    var pending = inflight.get(key);
    if (pending) return pending;
    var p = (async function () {
      var res;
      try {
        res = await fetch(request);
      } catch (e) {
        return null; // offline / gagal jaringan
      }
      if (isCacheableResponse(res, request)) {
        try {
          var cache = await caches.open(cacheName);
          // RED1-03: guard kuota 85% sebelum put (fail-open bila tak ada).
          if (await quotaAllows(request, res)) {
            await cache.put(request, res.clone());
          }
          await enforceLimits(cache, cacheName);
        } catch (e) { /* penyimpanan gagal — respons tetap dipakai */ }
      }
      return res;
    })();
    var tracked = p.then(
      function (v) {
        if (inflight.get(key) === tracked) inflight.delete(key);
        return v;
      },
      function () {
        if (inflight.get(key) === tracked) inflight.delete(key);
        return null;
      }
    );
    inflight.set(key, tracked);
    return tracked;
  }

  // Revalidasi latar: fetch + simpan. Mengembalikan true bila respons
  // cacheable (tersimpan). Tidak pernah melempar.
  async function updateCache(request, cacheName) {
    try {
      var res = await fetchShared(request, cacheName);
      return isCacheableResponse(res, request);
    } catch (e) {
      return false;
    }
  }

  // Fetch foreground untuk cache-miss: kembalikan clone respons jaringan
  // (atau null bila jaringan gagal). Respons non-cacheable (404/opaque)
  // diteruskan apa adanya — bukan null — supaya halaman mendapat respons
  // jaringan yang sesungguhnya tanpa fetch kedua.
  async function fetchFresh(request, cacheName) {
    var res;
    try {
      res = await fetchShared(request, cacheName);
    } catch (e) {
      return null;
    }
    if (!res) return null;
    try {
      return res.clone();
    } catch (e) {
      return res; // clone gagal (seharusnya tak terjadi) — pakai aslinya
    }
  }

  async function handleFetch(event) {
    var request = event && event.request;
    if (!request) return null;
    var url;
    try {
      url = new URL(request.url);
    } catch (e) {
      return null;
    }
    // Lapis kedua setelah filter sw.js: hanya GET https ke host izin.
    if (request.method !== 'GET') return null;
    if (url.protocol !== 'https:') return null;
    if (ALLOWED_HOSTS.indexOf(url.hostname) === -1) return null;
    // Payload speedtest + ffmpeg tanpa pin: jangan pernah sentuh cache.
    if (isSpeedtest(url)) return null;
    if (isFfmpegUnpinned(url)) return null;
    if (request.cache === 'no-store') return null;
    if (hasRangeHeader(request)) return null;

    var cacheName = cdnCacheName();
    if (!cacheName) return null; // self.PWA belum didefinisikan: fail-open.

    var cache;
    try {
      cache = await caches.open(cacheName);
    } catch (e) {
      return null;
    }
    // 'reload'/'no-cache' = pemanggil minta revalidasi: lewati baca cache.
    // PENGECUALIAN (FIX-7/F1): URL BERPIN versi (ffmpeg + pdf worker) adalah
    // immutable — byte di URL itu tidak bisa berubah, jadi 'reload'/'no-cache'
    // tidak bisa menghasilkan byte berbeda; membaca cache tetap benar dan
    // menghemat unduh ulang (~31 MB untuk ffmpeg core). Tanpa pengecualian
    // ini, hard-reload selalu mengunduh ulang core; dan harness QA berbasis
    // route interception (yang memaksa cache:'reload') selalu melihat
    // CacheFirst "gagal" walau perilaku produk normal sudah benar.
    var skipRead = (request.cache === 'reload' || request.cache === 'no-cache') &&
      !isFfmpegPinned(url) && !isPdfJsWorkerPinned(url);
    var cached = null;
    if (!skipRead) {
      try {
        cached = await cache.match(request);
      } catch (e) {
        cached = null;
      }
      // RED1-01: entri basi (>30 hari, dari header Date tersimpan)
      // dianggap miss — hapus dari cache lalu fetch ulang di bawah.
      // Berlaku untuk ketiga cabang (ffmpeg CacheFirst, worker pdf,
      // SWR) karena semuanya membaca `cached` ini.
      if (cached && !isFreshEnough(cached)) {
        try {
          await cache.delete(request.url);
        } catch (e) { /* abaikan — miss tetap diproses */ }
        cached = null;
      }
    }

    // ffmpeg berpin versi: CacheFirst. Tanpa revalidasi latar — mengunduh
    // ulang ~31 MB tiap pemakaian adalah pemborosan; URL berpin immutable.
    if (isFfmpegPinned(url)) {
      if (cached) return cached;
      return fetchFresh(request, cacheName);
    }

    // pdf.js worker berpin (FIX-7/F2): request-nya no-cors (new Worker)
    // sehingga fetch polos menghasilkan respons opaque yang tidak boleh
    // di-cache — ambil ulang URL BERPIN INI dengan mode CORS eksplisit.
    // jsDelivr/unpkg mengirim Access-Control-Allow-Origin: * sehingga
    // responsnya 'cors' 200 dan lolos isCacheableResponse TANPA mengubah
    // aturan itu (opaque tetap ditolak untuk semua URL lain). Lookup cache
    // memakai fallback ignoreVary (pola FIX-2/FIX-5, pertahanan lapis kedua
    // bila Vary: Accept-Encoding respons CDN tidak cocok dengan header
    // request worker).
    if (isPdfJsWorkerPinned(url)) {
      var workerCached = cached;
      if (!workerCached) {
        try {
          workerCached = await cache.match(request, { ignoreVary: true });
        } catch (e) {
          workerCached = null;
        }
        // RED1-01: cek umur juga untuk hit lewat fallback ignoreVary.
        if (workerCached && !isFreshEnough(workerCached)) {
          try {
            await cache.delete(request.url);
          } catch (e) { /* abaikan */ }
          workerCached = null;
        }
      }
      if (workerCached) return workerCached;
      // Guard typeof Request: harness Node P5 tidak punya konstruktor
      // Request — fallback ke request asli (perilaku lama) supaya
      // handleFetch tetap total di lingkungan uji.
      var corsRequest = request;
      try {
        if (typeof Request === 'function') {
          corsRequest = new Request(request.url, { mode: 'cors', credentials: 'same-origin' });
        }
      } catch (e) { corsRequest = request; }
      return fetchFresh(corsRequest, cacheName);
    }

    // Lib CDN umum: stale-while-revalidate.
    if (cached) {
      track(event, updateCache(request, cacheName));
      return cached;
    }
    return fetchFresh(request, cacheName);
  }

  self.__pwaCdn = {
    handleFetch: handleFetch,
    MAX_ENTRIES: MAX_ENTRIES,
    MAX_AGE_DAYS: MAX_AGE_DAYS,
    ALLOWED_HOSTS: ALLOWED_HOSTS.slice()
  };
})();
