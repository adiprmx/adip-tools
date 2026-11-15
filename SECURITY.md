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

## Data pengguna yang meninggalkan browser (atas aksi pengguna)

| Tujuan | Data | Tool |
|---|---|---|
| Supabase milik sendiri | Kata pencarian (huruf kecil, maks 80 karakter) | Shell aplikasi (otomatis, debounce 1,2 dtk) |
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
6. **(Medium) Verifikasi RLS Supabase belum bisa dibuktikan dari repo.**
   Kode memakai tabel `search_logs` + RPC `popular_tools`, sementara
   `supabase/tool_search_terms.sql` di repo mendefinisikan objek yang
   berbeda (`tool_search_terms` + `track_search`) — drift. Pastikan di
   dashboard Supabase: anon **tidak** punya kebijakan SELECT ke
   `search_logs` (kata pencarian pengguna tidak boleh bisa dibaca publik
   lewat anon key), dan tulis sebaiknya hanya via RPC bervalidasi seperti
   desain di file SQL tersebut. (Verifikasi live 15 Nov 2026 tidak
   konklusif: curl timeout, probe HTTP 401.)
7. **(Low) EXIF tidak dibersihkan sebelum upload.** `fotolink` mengunggah
   file asli ke catbox.moe — metadata EXIF (termasuk GPS) ikut terkirim
   ke URL publik. Peringatan sudah ada di UI; idealnya EXIF di-strip dulu
   (ada tool `exif-clean` di repo yang sama).
8. **(Low) Helper `kv()` tidak meng-escape nilai** (`js/core.js` ~baris 425).
   Semua pemanggil yang disampel meng-escape manual, tapi ini jebakan.
   Escape nilai di dalam `kv()` atau beri nama `kvHtml` + peringatan.
9. **(Low) `getcode` iframe:** `sandbox="allow-same-origin"` sebaiknya
   dicabut (origin opak lebih aman; pratinjau tidak butuh same-origin).

## Risiko yang diterima (by design, didokumentasikan)

- **`htmlvideo` mengeksekusi kode pengguna.** `new Function()` + iframe
  `sandbox="allow-scripts allow-same-origin"` diperlukan agar animasi
  pengguna bisa di-render ke video. Jangan tempel kode HTML/JS dari sumber
  yang tidak dipercaya ke tool ini — kode tersebut berjalan dengan hak
  akses origin situs (termasuk membaca `localStorage` berisi API key BYOK).
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
