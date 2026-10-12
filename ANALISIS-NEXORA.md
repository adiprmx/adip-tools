# Analisis Arsitektur Kode — "All Tools Nexora" (Developer Dika)

> Sumber: file statis yang diunduh dari `https://all-tools-nexora-teal.vercel.app/` (12 Okt 2026, dengan izin eksplisit Developer Dika untuk dipelajari). Versi yang dianalisis: **6.4.0**. Analisis ini hanya dari sisi client (HTML/CSS/JS publik); kode server `/api/*` tidak terlihat.

---

## 1. Arsitektur Keseluruhan

**Ini SPA satu file HTML, bukan multi-page.** Seluruh situs hidup di satu `index.html`. Tidak ada navigasi halaman per tool — setiap tool dibuka di dalam **modal fullscreen** yang mereka sebut "room" (`#toolViewer` + `#toolViewerBody`):

```js
function nxOpenBaseTool(toolId) {
    const viewer = document.getElementById('toolViewer');
    const body = document.getElementById('toolViewerBody');
    viewer.classList.add('active');
    document.body.classList.add('nx-tool-room-open');
    document.body.style.overflow = 'hidden';
    ...
    switch (toolId) {
        case 'safelinku': renderSafelinkuBypass(body); break;
        case 'cryptomarket': renderCryptoMarket(body); break;
        ...
    }
}
```

**Routing** hanya ada untuk deep-link: hash `#tool-<id>` dibaca `lazy-loader.js` saat load (`restoreRoute()`), dan `history.pushState` dipakai saat membuka tool tertentu supaya tombol back browser menutup room. Jadi "route" = buka modal, bukan pindah halaman.

**Tool dimuat secara lazy, bukan sekaligus.** Alurnya saat user klik kartu tool:

1. `NexoraTools.open(toolId)` → rantai middleware → `openLazyTool()` di `lazy-loader.js`
2. `ensureModule(namaModul)`: inject `<link rel="stylesheet">` untuk semua CSS modul dulu (`Promise.all`), lalu inject `<script>` **satu per satu berurutan** (`script.async = false` supaya urutan eksekusi terjaga)
3. Toast "Memuat fitur…" muncul selama proses; asset yang sudah dimuat tidak di-load ulang (cache di `Map` + cek `document.scripts`/`document.styleSheets`)
4. Setelah modul siap → fungsi render global tool dipanggil (atau dispatcher `next()`)

**CSS/JS tool di-inject tepat saat tool dibuka** — bukan saat halaman dimuat. Halaman awal hanya memuat ~7 file CSS core + 13 script core (total core JS ±300KB). Ini yang bikin first load tetap ringan walau katalognya besar.

**Urutan boot** (dari `index.html`, semua classic `<script>` berurutan, bukan ESM):

```
account.js → config.js → shared-utils.js → network.js → performance.js
→ app.js → shell.js → liquid-reactor.js → nexora-overdrive.js
→ tool-registry.js → stability.js → lazy-loader.js → postload.js
```

**Katalog tool: 66 entri di config**, terbagi 5 kategori: `downloader` (7), `maker` (7), `tools` (47), `vault` (2: ttquote, qrgen), `external` (3: motioncontrol, getcode, webencryption). Registry yang di-freeze menghitung 59 (4 kategori tanpa `downloader`). Klaim "98 visual experiments" dari temuan awal **tidak terverifikasi** — tidak ada daftar experiments di file yang diunduh (yang ada hanya `nxVisualRoom` + `visual-website.css`, tanpa data 98 item).

---

## 2. Struktur Kode

```
assets/
├── config.js                  ← 51KB: brand, UI policy, daftar modul, katalog 66 tool
├── css/
│   ├── core.css, components.css, account.css, mobile-usability.css   ← dimuat di awal
│   └── features/<nama-tool>.css   ← di-inject on-demand per tool
├── js/
│   ├── core/                  ← 13 file: account, shared-utils, network, performance,
│   │                            app, shell, liquid-reactor, nexora-overdrive,
│   │                            tool-registry, stability, lazy-loader, postload
│   └── features/              ← 1 file JS per tool/modul, mis. safelinku-bypass.js
└── apps/<nama>/               ← "aplikasi" besar mandiri, mis. assets/apps/html-video/
                                 punya bundle sendiri: app.c2d0910b.bundle.js
```

**Pembagian peran core/:**

| File | Peran |
|---|---|
| `config.js` | Satu-satunya source of truth: versi, brand, UI policy, `modules` (peta nama modul → daftar css/js), `tools` (katalog per kategori) |
| `tool-registry.js` | Membangun daftar tool dari config → `Object.freeze` tiap baris; expose `get/list/statusLabel`; dispatch event `nexora:tool-registry-ready` |
| `lazy-loader.js` | Inject CSS/JS on-demand + dedup + versioning + toast loading + deep-link `#tool-` |
| `network.js` | Wrapper `fetch` global (`window.NexoraFetch`): timeout, retry, execution token |
| `app.js` (92KB) | Katalog UI, search, kartu tool, dispatcher `NexoraTools` (middleware), `nxOpenBaseTool` + switch raksasa |
| `shell.js` (34KB) | Navigasi, menu, modal "About Dev", overlay lain — diekstrak dari script inline index.html lama |
| `stability.js` | Health/UX: blokir pinch-zoom, sinkron keyboard height, overlay recovery |
| `shared-utils.js` | Hanya 3 fungsi: `copyText`, `escapeHtml`, `formatBytes` (di-freeze) |
| `account.js` / `liquid-reactor.js` / `nexora-overdrive.js` / `performance.js` / `postload.js` | Membership/gating, efek visual hero, boot lanjutan |

**Penamaan file:** kebab-case konsisten (`safelinku-bypass.js`, `text-to-pdf.js`, `ip-intelligence.js`); nama modul di config = nama file tanpa ekstensi. Satu tool = satu pasangan `features/<nama>.js` + `features/<nama>.css`.

**Pola berulang antar modul fitur** (terlihat di `safelinku-bypass.js`, dan diasumsikan sama di modul lain karena dispatcher-nya seragam):

```js
/* NEXORA Safelinku Bypass — internal direct-link resolver UI */
(function () {
  "use strict";
  var ENDPOINT = "/api/safelinku-bypass";
  ...
  window.renderSafelinkuBypass = function renderSafelinkuBypass(body) {
    if (typeof body.__nxCleanup === "function") body.__nxCleanup();
    body.innerHTML = [ '<section class="nsl" ...>', ... ].join("");
    // querySelector semua elemen, bind event listener...
    body.__nxCleanup = function () { if (controller) controller.abort(); };
  };
})();
```

Setiap modul: IIFE → definisi konstanta/helper privat → **mengekspos satu fungsi render global** (`window.render<Nama>`) yang menerima elemen `body` (wadah modal). Cleanup didaftarkan di `body.__nxCleanup`.

---

## 3. Gaya Penulisan Kode

**Vanilla JS murni, tanpa framework.** Tidak ada React/Vue/Svelte, tidak ada bundler di client (kecuali bundle mandiri di `assets/apps/`). Semua script adalah **classic script + IIFE**, bukan ES module:

```js
(function(root,factory){
  "use strict";
  var config=factory();
  if(typeof module==="object"&&module.exports)module.exports=config;
  if(root)root.NexoraConfig=config;
})(typeof window!=="undefined"?window:null,function(){ ... });
```

Pola UMD-ish ini dipakai supaya file yang sama bisa di-`require` di Node (untuk testing/tooling) maupun jalan di browser.

**State management = global `window.*` namespace.** Tidak ada store reaktif; yang ada "service locator" di window:

- `window.NexoraConfig` — konfigurasi
- `window.NexoraTools` — dispatcher buka tool (`{open, use}`, di-freeze + `Object.defineProperty(writable:false)`)
- `window.NexoraFetch` / `window.NexoraSecureFetch` — HTTP client
- `window.NexoraShared` — utilitas
- `window.NexoraModules` — `{ensure, open, isLoaded, manifest}`
- `window.NexoraAccount` — membership/gating (`canAccess(toolId)`)

**Event handling = CustomEvent bus di `document`.** Modul berkomunikasi lewat event, bukan import:

```js
window.dispatchEvent(new CustomEvent("nexora:tool-registry-ready"));
// ... di tempat lain:
window.addEventListener('nexora:tool-dispatcher-ready', attachToolDispatcher);
document.dispatchEvent(new CustomEvent('nexora:module-loaded',{detail:{name:name}}));
document.dispatchEvent(new CustomEvent("nexora:network-error",{...}));
```

**Manipulasi DOM = template string + innerHTML + querySelector.** Tidak ada virtual DOM, tidak ada helper `h()`:

```js
body.innerHTML = ['<section class="nsl" ...>', '  <header ...>', ...].join("");
var form = body.querySelector("#nslForm");
form.addEventListener("submit", process);
```

**Pola khas lain yang menonjol:**

1. **Middleware ala Express** untuk membuka tool — `use(handler, priority)` dengan guard anti-double-`next()`:
```js
function use(handler, priority = 0) {
    const entry = { handler, priority: Number(priority)||0, order: registrationOrder++ };
    middleware.push(entry);
    middleware.sort((l,r) => (r.priority-l.priority) || (l.order-r.order));
    return function unregisterToolMiddleware(){ /* ... */ };
}
function dispatch(index) {
    if (index <= cursor) throw new Error('NexoraTools middleware next() dipanggil lebih dari sekali.');
    ...
}
```
Lazy-loader mendaftarkan middleware prioritas 100 yang mengintersep `open()` untuk memuat modul dulu, lalu memanggil `next()` ke pembuka dasar.

2. **Defensive coding di mana-mana**: `typeof x === "function"` sebelum panggil, try/catch di sekitar dispatch event, fallback clipboard (`navigator.clipboard` → textarea + `execCommand`), `?.` di network.js.

3. **Aksesibilitas serius untuk ukuran proyek hobi**: `aria-expanded`, `aria-busy`, `aria-live="polite"` di status, focus restore saat modal ditutup, Escape menutup modal, `role="button"` + `tabindex` di kartu tool.

4. **Bahasa campur**: komentar & error message Bahasa Indonesia ("NexoraConfig harus dimuat sebelum tool-registry.js"), identifier Inggris.

---

## 4. Pola Tiap Tool — Lifecycle End-to-End (contoh: `safelinku-bypass`)

**Fase 1 — Registrasi (di `config.js`, ditulis manual sekali):**

```js
// config.tools.tools[] — metadata katalog
{ "id": "safelinku", "icon": "fa-solid fa-link-slash",
  "name": "Safelinku Bypass", "badge": "...",
  "runtime": { "mode": "module", "module": "safelinku-bypass", "handler": "renderSafelinkuBypass" } }

// config.modules — peta aset yang di-load on-demand
"safelinku-bypass": {
  "css": ["assets/css/features/safelinku-bypass.css"],
  "js":  ["assets/js/features/safelinku-bypass.js"]
}
```

**Fase 2 — Inisialisasi (saat diklik):** `NexoraTools.open('safelinku')` → middleware lazy-loader → `ensureModule('safelinku-bypass')` → inject CSS + JS → toast sukses → `nxOpenBaseTool` membuka modal → `switch(toolId)` memanggil `renderSafelinkuBypass(body)`.

**Fase 3 — Render UI:** fungsi render membersihkan dulu (`body.__nxCleanup()` + `body.innerHTML = [...]`), membangun form (input URL, tombol Tempel, tombol Bypass, area status, area hasil tersembunyi), lalu bind semua event via `querySelector`.

**Fase 4 — Alur input → proses → output:**

```js
async function process(event) {
  event.preventDefault();
  var raw = input.value.trim();
  if (!validInput(raw)) { setStatus("Gunakan link Safelinku / sfl.gl yang valid.", "error", "INVALID_URL"); return; }
  setBusy(true); setStatus("Memproses link...", "loading");
  try {
    var response = await requestBypass(raw, controller);   // POST /api/safelinku-bypass via window.NexoraFetch
    var payload = await response.json().catch(...);
    resolvedUrl = safeDestination(payload.result.destinationUrl);  // validasi ulang: hanya http/https, tanpa kredensial
    destination.href = resolvedUrl; ... result.hidden = false;
  } catch (error) {
    if (error.name === "AbortError") return;
    setStatus(pesanRamah, "error", error.code);   // kode error eksplisit: INVALID_URL, NETWORK_ERROR, UNSAFE_URL...
  } finally { setBusy(false); }
}
```

Ciri khas: validasi input ketat di client (hostname harus persis `sfl.gl`), URL hasil divalidasi ulang sebelum dipasang ke `href` (anti `javascript:`), pesan error selalu ada kode + kalimat ramah Bahasa Indonesia, tombol copy pakai `NexoraShared.copyText`.

**Fase 5 — Cleanup (saat modal ditutup / tool lain dibuka):**

```js
function closeTool() {
  ...
  if (typeof body.__nxCleanup === 'function') body.__nxCleanup();  // abort request yang jalan
  body.innerHTML = '';
}
```

`runtime.mode` di config menentukan perilaku: `module` (lazy-load seperti di atas), `api` (butuh backend), `local` (murni client), `hybrid`, plus `external` (link keluar). Registry menandai `requiresNetwork` otomatis dari mode.

---

## 5. Teknik Menarik (yang benar-benar cerdas)

**a) Versioning cache-buster dua lapis, per-file, dengan nama patch deskriptif.**
Di `index.html` setiap aset punya versi seperti `?v=6.4.0-safelinku1` atau `?v=6.4.0-hf22-original-unified1` — bukan sekadar angka, tapi nama yang menjelaskan *perubahan apa*. Lebih cerdas lagi: `lazy-loader.js` punya tabel regex `ASSET_PATCHES` (±34 aturan) yang menempelkan patch version **khusus per file** saat lazy-load:

```js
var ASSET_VERSION = config.version;   // "6.4.0"
var ASSET_PATCH = 'branding1';
var ASSET_PATCHES = [
  [/novel-cover(?:-generator|-puter|-director)?\.(?:js|css)(?:$|\?)/, 'novel-cover-v43'],
  [/avatar-studio\.(?:js|css)(?:$|\?)/, 'avatar-studio-v8-clean'],
  [/crypto-market\.(?:js|css)(?:$|\?)/, 'crypto-mtf'],
  ...
];
function versioned(url){
  var match = ASSET_PATCHES.find(function(entry){ return entry[0].test(String(url)); });
  var version = ASSET_VERSION + '-' + (match ? match[1] : ASSET_PATCH);
  return url + '?v=' + encodeURIComponent(version);
}
```

Hasilnya: update satu tool tidak menginvalidasi cache 65 tool lain. Ini cache-busting granular tanpa build tool.

**b) Execution token untuk setiap panggilan API.** `network.js` memetakan setiap endpoint sensitif ke pasangan (tool, action), lalu sebelum request dikirim, ia minta token sekali pakai ke `/api/execution-token` dan menempelkannya sebagai header `X-Nexora-Execution`:

```js
function secureDescriptor(input, init){
  ...
  if(path==="/api/safelinku-bypass"){ ... }  // (pola umum; tiap endpoint dipetakan)
  else if(path==="/api/ai/chat"){ tool="nexoraai"; action="chat"; }
  ...
}
// saat request:
var descriptor = secureDescriptor(input, requestInit);
if(descriptor){
  var executionToken = await issueExecutionToken(descriptor.tool, descriptor.action, controller.signal);
  requestInit.headers = Object.assign({}, requestInit.headers, {"X-Nexora-Execution": executionToken});
}
```

Ini mencegah orang memanggil API backend langsung dari luar (token di-issue per sesi/tool/action). Untuk proyek statis + serverless, ini lapisan anti-abuse yang murah dan rapi.

**c) `window.NexoraFetch`: fetch dengan timeout + retry + event bus.** Timeout default 18 detik (150 detik untuk FormData/upload), retry 1x khusus GET/HEAD dengan backoff 350ms, dan setiap kegagalan jaringan me-dispatch `nexora:network-error` ke document sehingga UI global bisa bereaksi. Fitur tool cukup panggil `window.NexoraFetch(url, {nexoraTimeoutMs: 12000, ...})`.

**d) Dedup pemuatan aset.** `Map` janji (`assetPromises`) + pengecekan `document.scripts`/`document.styleSheets` + flag `dataset.nxLoaded` — file yang sama tidak pernah diunduh dua kali walau tool dibuka-tutup berkali-kali, dan modul yang gagal di-load dihapus dari cache janji supaya bisa dicoba lagi.

**e) Katalog bisa di-override dari database saat runtime.** `app.js` me-merge katalog config dengan data dari Supabase: nama, deskripsi, badge, ikon, urutan, status aktif/nonaktif, sampai level akses `vvip` — tanpa deploy ulang. Tool internal tanpa implementasi bundled tidak akan dibuatkan kartunya ("never create a dead internal card").

**f) Search dengan alias.** `lazy-loader.js` membangun peta label: id + nama + semua `aliases` (mis. "html to video", "webgl to mp4") dalam huruf kecil — pencarian jadi toleran terhadap istilah yang dipakai user, bukan cuma nama resmi.

**g) Detail mobile yang dipikirkan:** `stability.js` memblokir pinch-zoom ganda yang menggeser overlay di Chrome Android, dan memakai `visualViewport.height` untuk menghitung tinggi keyboard (bukan `window.innerHeight` yang salah saat zoom). Ini bug kelas "hanya ketahuan setelah user lapor" — mereka sudah menanganinya proaktif.

---

## 6. Perbandingan dengan Adip Tools

| Aspek | Nexora (Dika) | Adip Tools | Penilaian |
|---|---|---|---|
| Sistem modul | Classic script + IIFE + global `window.*` | ES module (`import`/`export`) | Adip lebih modern & aman (scope terkungkung, tree-shakeable); pola global Nexora rawan tabrakan nama di 377 tool |
| Registrasi tool | Manual di `config.js` raksasa (51KB) + `switch` raksasa di `app.js` | Self-registration: tiap file `tools.push({...})`; manifest di-generate script | **Adip menang telak** — switch-case Nexora tidak scalable; tambah tool = edit 2 tempat manual. Jangan ditiru |
| Katalog | Satu file config: brand + UI policy + modul + katalog | `manifest.js` generated dari meta tiap file | Keduanya on-demand; konsep "satu source of truth" Nexora bagus, tapi eksekusi Adip (generated) lebih tahan human-error untuk 377 tool |
| Fungsi berbagi | `shared-utils.js` cuma 3 fungsi; tiap tool bawa helper sendiri | `core.js`: `h`, `utils`, `esc`, kategori | Adip lebih disiplin (aturan "fungsi >1 tool → core.js"); Nexora berisiko duplikasi antar 66 file fitur |
| Render tool | Modal fullscreen (`#toolViewerBody`), fungsi `renderX(body)` | Render inline di root halaman, `render(root)` + `T.onLeave` cleanup | Setara; pola cleanup Nexora (`body.__nxCleanup`) ≈ `onLeave` Adip — keduanya benar |
| Lazy loading | Inject `<link>`+`<script>` manual, CSS dulu lalu JS berurutan | Dynamic `import()` ESM | Dynamic import Adip lebih bersih; tapi **dedup + toast loading + status aria-live Nexora** patut ditiru |
| Versioning | `?v=6.4.0-<nama-patch-deskriptif>` per file + tabel regex `ASSET_PATCHES` | `?v=` per versi rilis di tiap file | **Adopsi dari Nexora**: patch version per-file (bukan per-rilis) → update 1 tool tidak bust cache 376 tool lain |
| Keamanan API | Execution token per (tool, action) + header `X-Nexora-Execution` | (belum ada pola setara) | **Adopsi**: murah, cocok untuk endpoint serverless Adip yang rentan abuse |
| HTTP client | `NexoraFetch`: timeout + retry GET + event error global | Timeout per-fetch (pelajaran 3 Okt 2026) | **Adopsi**: bungkus jadi satu `fetch` util dengan timeout+retry+event, bukan ulang di tiap tool |
| Search | Alias map (id/nama/aliases lowercase) | keywords di manifest | Setara; alias Nexora sedikit lebih eksplisit |
| Remote config | Merge katalog dari Supabase saat runtime (ganti nama/badge/nonaktifkan tanpa deploy) | — | **Adopsi selektif**: berguna untuk kill-switch tool bermasalah tanpa rilis baru |
| Health check | Metadata `health` per tool (HEAD check ke path aset) | `check-tools.js` saat build | Nexora cek saat runtime; Adip saat build. Keduanya valid; runtime check cocok untuk status "Siap/Gangguan" di UI |
| Desain | Neon/cyber (Orbitron + Poppins, efek liquid/overdrive) | 'Tenang' (solid + hairline, motion minimal) | Selera berbeda; tidak perlu ditiru — identitas Adip sudah dikunci |
| Skala | 66 tool, config manual masih "muat" | 377 tool, wajib generated | Cara Nexora tidak akan bertahan di skala Adip |

### Yang bisa kita adopsi (prioritas)
1. **Per-file patch versioning** (`?v=<versi>-<nama-patch>`) — hemat bandwidth user & cache tetap segar per tool.
2. **Satu HTTP client terpusat** (`NexoraFetch`-style): timeout + retry + dispatch event error global.
3. **Execution token** untuk endpoint `/api` yang sensitif — anti-abuse murah.
4. **Toast/status loading dengan `aria-live`** saat lazy-load tool + dedup janji aset.
5. **Remote kill-switch / override katalog** (nama, badge, nonaktif) tanpa deploy.

### Yang tidak cocok untuk kita
1. **Classic script + global `window.*`** — Adip sudah ESM; mundur ke pola ini = undang tabrakan nama di 377 tool.
2. **Config raksasa manual + switch-case dispatcher** — tidak scalable; self-registration + manifest generated Adip sudah lebih baik.
3. **Modal fullscreen untuk semua tool** — Adip tools adalah halaman; pola render Adip tetap.
4. **Membership VVIP gating** — tidak relevan dengan model gratis Adip.
5. **Satu file config berisi segalanya** (brand + UI policy + katalog) — di skala 377 tool akan jadi nightmare merge; generated manifest Adip lebih tepat.

### Catatan jujur
Nexora dibangun dengan **ketelitian operasional yang tinggi** (retry, token, cleanup, aksesibilitas, anti-cache-stale, mobile edge-case) tapi **arsitektur registrasinya rapuh** (switch raksasa, config manual). Adip Tools unggul di arsitektur skala (ESM, generated manifest, kontrak `render`/`onLeave`), dan bisa naik kelas dengan mengadopsi lapisan operasional Nexora (poin 1–5 di atas) tanpa mengubah fondasi yang sudah benar.

---

*Disusun 12 Okt 2026 dari file statis publik v6.4.0 atas izin Developer Dika. Kode server (`/api/*`) tidak termasuk dalam analisis ini.*
