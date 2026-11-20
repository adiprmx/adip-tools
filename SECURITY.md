# SECURITY.md — Adip Tools

Postur keamanan Adip Tools (situs statis, vanilla JS, tanpa backend sendiri).
Terakhir diaudit: 15 Nov 2026 (T04 Security, ronde v6.12.0) terhadap v6.11.5.
Laporan audit lengkap: `~/workspace/adip-tools-upgrade/v6.12.0/t04-security-report.md`
(di luar repo — file ini ringkasannya untuk publik repo).

## Cara kerja situs (yang menentukan ancamannya)

- 100% client-side: tidak ada server aplikasi, tidak ada login, tidak ada cookie
  sesi. Satu-satunya backend milik sendiri adalah Supabase (hanya untuk
  agregat pencarian populer).
- Sebagian besar tool memproses data 100% lokal di browser (file tidak diunggah).
  Pengecualian dicantumkan di bawah — semuanya atas aksi eksplisit pengguna.
- Tidak ada kunci API/rahasia apa pun di repo ini. Satu-satunya kredensial di
  kode adalah **kunci anon Supabase** (`js/app.js`) yang memang dirancang
  publik (peran `anon`, dibatasi RLS di sisi database).

## Yang sudah aman

- **Tidak ada secret bocor.** Scan seluruh repo (599 file tool + core + riwayat
  git lokal): tidak ada API key, token, password, atau private key. `.gitignore`
  menutup `.env`, `*.pem`, `*.key`, `secrets/`.
- **Semua panggilan jaringan memakai HTTPS.** Tidak ada `fetch()` ke `http://`.
- **Output escaping konsisten.** Helper `esc()` (`js/core.js`) dipakai di shell
  aplikasi, hasil pencarian, kartu tool, dan sampel tool yang diaudit
  (termasuk pesan Telegram dari pihak ketiga di `lihat-update-telegram` dan
  data API publik di tool Live API). Tool `genmail` punya sanitizer HTML
  email sendiri (buang script/iframe/event handler/`javascript:`).
- **Tidak ada `eval()`** di kode halaman. `new Function()` hanya di
  `plot-fungsi` (ekspresi matematika dengan allowlist ketat) dan `htmlvideo`
  (tool eksekusi kode milik pengguna sendiri — lihat "Risiko yang diterima").
- **Semua link eksternal aman.** 23 `target="_blank"` memakai `rel="noopener"`;
  semua `window.open` memakai `'noopener'`.
- **API key pengguna (BYOK) tidak pernah lewat server kami.** Key ElevenLabs /
  LLM / NASA disimpan hanya di `localStorage` browser pengguna
  (`adipTools_key_*`) dan dikirim langsung ke penyedia saat tombol ditekan.
  Token bot Telegram tidak disimpan sama sekali.
- **Iframe pratinjau HTML disandbox.** `preview-html`, `html-ke-pdf`,
  `htmlvideo` memakai `sandbox="allow-scripts"` (tanpa `allow-same-origin`).
- **Pustaka CDN dipin versinya.** Semua script CDN memakai versi eksplisit
  (mis. `jspdf@2.5.1`, `@ffmpeg/ffmpeg@0.12.15`) — bukan tag `latest`.

## Service worker (PWA v6.20.0)

Sejak v6.20.0 situs memakai service worker (SW) untuk instalasi aplikasi dan
mode offline. Bagian ini mendeskripsikan **desain** yang dibangun ronde
v6.20.0; mekanisme yang ditandai [desain] diverifikasi tim QA/keamanan
ronde ini (laporan audit Red/Blue, di luar repo).

- **Scope same-origin.** SW didaftarkan dari `./sw.js` dengan scope `./`
  (root origin `tools.adipmusic.my.id`) — SW hanya mengendalikan halaman di
  origin ini, tidak bisa menyentuh situs lain. Browser sendiri yang
  menegakkannya: SW lintas origin tidak bisa didaftarkan.
- **Tanpa rahasia di SW/manifest.** SW dan `manifest.webmanifest` tidak
  memuat kunci API, token, atau kredensial apa pun (gerbang ZB-8 ronde
  v6.20.0). SW juga tidak mengubah cara data pengguna dikirim — tabel
  "Data pengguna yang meninggalkan browser" di bawah tetap berlaku.
- **File SW selalu dicek ulang [desain].** Semua file `sw*.js` disajikan
  dengan `Cache-Control: no-cache` (diatur di `vercel.json`), sehingga
  browser memeriksa versi baru SW setiap kali situs dibuka. Tanpa ini,
  SW lama bisa bertahan dan pengguna terjebak di cache basi.
- **Cache berversi per rilis [desain].** Nama cache precache/runtime
  mengikuti versi rilis (`adip-tools-precache-6.20.0`,
  `adip-tools-runtime-6.20.0`). Saat versi baru aktif, cache versi lama
  dihapus di event `activate` — tidak ada cache precache/runtime usang
  yang bertahan lintas rilis. **Pengecualian yang disengaja:** cache CDN
  (`adip-tools-cdn-v1`) TIDAK berversi — ffmpeg (~31 MB) dan pustaka
  CDN tidak boleh diunduh ulang tiap rilis. Batas umurnya ditegakkan
  dengan cara lain: setiap cache-hit CDN memeriksa header `Date`
  respons tersimpan, dan entri berumur > 30 hari dianggap miss
  (dihapus + diunduh ulang) — jadi umur cache CDN jahat paling lama
  30 hari, bukan tanpa batas. Entri tanpa header `Date` valid
  dipertahankan (fail-open); kedua CDN allowlist (jsDelivr, unpkg)
  selalu mengirim `Date`, jadi kasus itu praktis tidak terjadi.
  **Ketergantungan penting (RED2-01, Red-2 20 Nov 2026):** batas 30 hari
  ini bergantung pada header `Access-Control-Expose-Headers: *` dari
  jsDelivr dan unpkg. `Date` BUKAN header CORS-safelist, sehingga SW
  hanya dapat membaca `Date` dari entri CDN tersimpan bila CDN
  mengeksposnya lewat header itu — kedua CDN mengirim
  `Access-Control-Expose-Headers: *` (terverifikasi 20 Nov 2026). Bila
  CDN menghapus atau mempersempit header itu, SW tidak dapat melihat
  `Date` dan entri dipertahankan (fail-open, tanpa alarm); umur 30 hari
  tidak dapat ditegakkan dan risiko RED1-01 kembali terbuka.
  Re-verifikasi berkala (read-only): `curl -I
  https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js` dan
  `curl -I https://unpkg.com/jquery@3.7.1/dist/jquery.min.js`, lalu
  periksa baris `access-control-expose-headers: *` pada keduanya.
- **Yang masuk cache, dan yang tidak [desain].**
  - Precache hanya berisi app shell same-origin (halaman utama, `app.js`,
    `core.js`, `manifest.js`, CSS) — chunk tool TIDAK di-precache semua,
    melainkan masuk cache saat tool itu dibuka (on-demand).
  - Hanya respons sukses (HTTP 200) yang disimpan; respons gagal tidak
    pernah di-cache. Selain itu, `Content-Type` respons wajib cocok
    dengan yang diminta (skrip harus `text/javascript` /
    `application/javascript`, CSS harus `text/css`, dst.) — respons
    200 berkonten salah (mis. HTML dari SPA fallback) ditolak
    simpan-nya, walau tetap disajikan ke halaman dari jaringan.
    JANGAN tambah SPA rewrite di `vercel.json` (mis.
    `{"source": "/(.*)", "destination": "/index.html"}`) tanpa
    pertimbangan sadar (RED1-02): rewrite membuat aset hilang dijawab
    200 + `text/html` dan mengubah semantik 404 situs — guard
    Content-Type di atas menolak menyimpan respons semacam itu, tapi
    keputusan rewrite tetap harus eksplisit. Catatan: `vercel.json`
    TIDAK boleh berisi kunci `$comment` atau kunci non-skema lain —
    validasi skema Vercel menolak deploy (terbukti 20 Nov 2026:
    deploy v6.20.0 gagal ERROR sebelum build karena `$comment`).
  - Pustaka CDN yang di-cache adalah URL berpin versi + hash integritas
    (SRI) yang sudah ada — SW tidak mengubah/menurunkan pemeriksaan
    integritas yang dilakukan browser saat memuat pustaka.
  - SDK Puter (`js.puter.com/v2/`) TIDAK di-cache jangka panjang karena
    tanpa pin versi; data live API (cuaca, gempa, harga, dsb.) TIDAK
    di-cache sama sekali — menyajikan data basi seolah live dilarang.
  - Payload ukur tool tes kecepatan internet dikecualikan dari cache —
    bila ter-cache, hasil ukurnya palsu.
- **Mitigasi cache poisoning [desain].** Serangan yang relevan: penyerang
  membujuk SW menyimpan respons jahat/basi lalu disajikan ke pengguna.
  Pertahanannya berlapis: (1) SW hanya diinstal dari origin sendiri lewat
  HTTPS — tidak ada jalur pihak ketiga menyuntikkan SW; (2) precache hanya
  aset build same-origin yang namanya ber-hash (konten berubah = nama
  berubah); (3) hanya respons 200 yang di-cache; (4) pustaka CDN berpin
  versi + SRI — respons yang tidak cocok hash-nya ditolak browser sebelum
  dipakai; (5) umur cache jahat dibatasi: cache precache/runtime
  berversi per rilis (paling lama satu rilis), cache CDN ditegakkan
  umur 30 hari pada setiap pembacaan (lihat butir "Cache berversi per
  rilis" di atas). Risiko residu: pustaka CDN yang dimuat via dynamic
  `import()` ESM tidak mendukung SRI (keterbatasan browser, sudah dicatat
  di butir 5 "Yang perlu diperbaiki").
- **Update flow aman [desain].** SW baru TIDAK mengambil alih otomatis
  (`skipWaiting` tidak dipanggil sendiri): pengguna melihat pemberitahuan
  "Ada versi baru" dan mengetuk Muat ulang — barulah SW baru aktif dan
  mengklaim halaman. Ini mencegah halaman yang sedang dipakai tiba-tiba
  berganti versi di tengah jalan. Catatan residual (RED1-04): pesan
  `SKIP_WAITING` ke SW waiting bisa dikirim skrip same-origin mana pun —
  platform tidak menyediakan cara membedakan pengirimnya — jadi gerbang
  persetujuan update hanya sekuat kebersihan XSS origin ini; mitigasinya
  adalah menutup item 1–3 di "Yang perlu diperbaiki". Banner update
  sendiri diverifikasi ke controller live sebelum tampil (RED1-05),
  sehingga banner palsu dari skrip same-origin tidak bisa muncul.
- **CSP worker.** Kebijakan CSP Report-Only sudah memuat
  `worker-src 'self' blob: https://cdn.jsdelivr.net` — worker same-origin
  diizinkan. Catatan: CSP masih Report-Only (belum ditegakkan); penegakan
  CSP adalah gerbang fase lain, bukan ronde PWA ini.
- **Rollback SW.** Bila SW bermasalah, rollback TIDAK dilakukan dengan
  sekadar menghapus file SW (pengguna lama akan tetap memakai cache basi).
  Prosedur yang benar ada di runbook `docs/pwa-rollback.md`: deploy versi
  SW yang unregister + hapus cache, lalu verifikasi situs lolos tanpa SW.

## Data pengguna yang meninggalkan browser (atas aksi pengguna)

| Tujuan | Data | Tool |
|---|---|---|
| Supabase milik sendiri | Kata pencarian (huruf kecil, maks 40 karakter) | Shell aplikasi (otomatis, debounce 1,2 dtk) |
| api.telegram.org | Token bot (di URL, sesuai desain Bot API) | tes-bot-telegram, lihat-update-telegram |
| api.elevenlabs.io | API key + teks/audio pengguna | elevenlabs |
| Endpoint LLM pilihan pengguna (default Pollinations / OpenAI) | API key + isi dokumen | documentai |
| text/image.pollinations.ai | Prompt / teks pengguna | carifakta, worldclassics, aiimage, novelcover |
| js.puter.com + layanan Puter | Prompt / gambar, lewat akun Puter pengguna | aiimage, animetoreal, multiai |
| catbox.moe | File gambar (menjadi URL publik) | fotolink |
| api.guerrillamail.com (+ proxy CORS cadangan) | Isi temp-mail (termasuk OTP) | genmail |
| Proxy CORS pihak ketiga (r.jina.ai, cors-anyway, api.allorigins.win) | URL target + isi halaman yang diambil | getcode, website-scanner, removebg |
| API publik baca-saja (±30 host: BMKG, Open-Meteo, GitHub, dsb.) | Parameter pencarian (kota, username, dsb.) | Tool Live API |
| translate.googleapis.com | Teks yang diterjemahkan | worldclassics |

## Yang perlu diperbaiki (ringkas — detail di laporan audit)

1. **(Medium) Markdown ke PDF mengeksekusi HTML mentah.** `marked.parse()`
   tidak menyaring HTML; `prev.innerHTML = parse(md)` di
   `js/tools/converter/markdown-ke-pdf.js` (baris ~104, ~120) menjalankan
   `<img onerror>` / `<svg onload>` dari Markdown yang ditempel. Perbaiki
   dengan sanitizer (mis. DOMPurify) sebelum `innerHTML`.
2. **(Medium) Link `javascript:` di pratinjau Markdown & Bio Link.**
   Regex link di `markdown-preview.js` dan `miniMd` (markdown-ke-pdf.js)
   tidak memvalidasi skema; `buatBioLinkHTML` juga tidak. Batasi ke
   `http:`/`https:`/`mailto:`.
3. **(Medium) Iframe pratinjau Bio Link tanpa sandbox.**
   `js/tools/produktivitas/bio-link.js` (~baris 36): tambah
   `sandbox="allow-popups"`.
4. **(Medium) Belum ada Content-Security-Policy.** Tidak ada CSP
   (meta maupun header) dan tidak ada konfigurasi header keamanan di repo.
   CSP yang presisi (daftar origin lengkap + dua varian: meta & header)
   ada di laporan audit. Catatan: CSP penuh butuh `style-src 'unsafe-inline'`
   (inline style dipakai di mana-mana) dan `script-src 'unsafe-eval'`
   (dibutuhkan `htmlvideo`/`plot-fungsi`) sampai refactor dilakukan —
   nilai CSP di sini adalah defense-in-depth, bukan obat XSS.
5. **(Medium) Script CDN tanpa Subresource Integrity.** `loadScript()`
   (`js/core.js`) memuat ±30 pustaka tanpa hash integritas; SDK Puter
   (`js.puter.com/v2/`) bahkan tanpa pin versi. Tambah parameter integritas
   di `loadScript` + hash SRI untuk pustaka klasik; dokumentasikan risiko
   residu untuk modul ESM (dynamic `import()` tidak mendukung SRI).
6. **(Medium → ditutup v6.12.1) Verifikasi RLS Supabase.** Kode kini memakai
   tabel agregat `tool_search_terms` + RPC `track_search` (skema di
   `supabase/tool_search_terms.sql`), sesuai dengan yang benar-benar ada di
   database. RLS aktif; anon hanya punya kebijakan SELECT ke tabel agregat
   (istilah + hitungan, tanpa identitas pengguna), dan tulis hanya via RPC
   SECURITY DEFINER bervalidasi. Key client adalah publishable key proyek
   (bukan service_role/secret). Verifikasi live 15 Nov 2026: RPC
   `track_search` + GET `tool_search_terms` berfungsi dengan key baru
   (lihat `~/workspace/adip-tools-upgrade/v6.12.1/p1-supabase-report.md`).
7. **(Low) EXIF tidak dibersihkan sebelum upload.** `fotolink` mengunggah
   file asli ke catbox.moe — metadata EXIF (termasuk GPS) ikut terkirim
   ke URL publik. Peringatan sudah ada di UI; idealnya EXIF di-strip dulu
   (ada tool `exif-clean` di repo yang sama).
8. **(Low) Helper `kv()` tidak meng-escape nilai** (`js/core.js` ~baris 425).
   Semua pemanggil yang disampel meng-escape manual, tapi ini jebakan.
   Escape nilai di dalam `kv()` atau beri nama `kvHtml` + peringatan.
9. ~~(Low) `getcode` iframe~~ — **SELESAI, item tidak lagi berlaku.**
   Kode kini `sandbox=''` (`js/tools/developer/getcode.js:48`, origin opak
   tanpa `allow-same-origin`); pratinjau tidak butuh same-origin.

## Risiko yang diterima (by design, didokumentasikan)

- **`htmlvideo` mengeksekusi kode pengguna.** `new Function()` + iframe
  `sandbox="allow-scripts"` (origin OPAK, tanpa `allow-same-origin` sejak
  v6.19.1 — temuan R-01). Kode pengguna berjalan TERISOLASI: tidak punya
  akses ke origin situs dan TIDAK BISA membaca `localStorage` berisi API
  key BYOK (dibuktikan probe browser, Red-2). Catatan: render animasi ke
  video (`drawImage` dari iframe) diketahui rusak di Chromium + Firefox —
  tombol render gagal jujur. Tetap jangan tempel kode HTML/JS dari sumber
  yang tidak dipercaya: kode itu tetap dieksekusi dan bisa membuat
  request jaringan dari dalam frame terisolasi.
- **API key BYOK di `localStorage`.** Praktis dan terungkap di UI, tapi
  kunci bisa dibaca oleh skrip apa pun yang berhasil berjalan di origin
  ini — alasan lain menjaga kebersihan XSS tetap prioritas.
- **Proxy CORS pihak ketiga.** Beberapa tool memakai proxy publik agar
  bisa mengambil konten lintas origin; operator proxy bisa melihat URL
  target dan isinya. Jangan pakai tool tersebut untuk URL yang sensitif.

## Cara melaporkan masalah keamanan

Temukan kerentanan? Laporkan lewat:

- **GitHub Issues** di repo ini (untuk masalah non-sensitif), atau
- **Email** ke pemilik situs (lihat footer / halaman kontak di
  tools.adipmusic.my.id) untuk masalah sensitif — jangan publikasikan
  dulu sebelum ada perbaikan.

Sertakan: langkah reproduksi, dampak yang kamu lihat, dan (bila ada)
usulan perbaikan. Laporan yang baik akan ditanggapi dan diperbaiki
secepatnya; terima kasih sudah membantu menjaga situs ini aman.
