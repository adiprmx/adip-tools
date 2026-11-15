# ADIP Tools 🧰

**606 tools gratis berbahasa Indonesia** — kalkulator, converter, generator, dan alat sehari-hari, sebagian besar khusus untuk kebutuhan di Indonesia.

🌐 Live: <https://tools.adipmusic.my.id>

Tanpa daftar, tanpa instalasi, tanpa iklan. Kebanyakan tool jalan sepenuhnya di browser kamu. Buka, pakai, selesai.

## Isi

- [Kategori](#kategori)
- [Cara menjalankan lokal](#cara-menjalankan-lokal)
- [Menambah tool baru](#menambah-tool-baru)
- [Bump versi](#bump-versi)
- [Arsitektur singkat](#arsitektur-singkat)
- [Aturan desain (design lock)](#aturan-desain-design-lock)
- [File generate — jangan edit manual](#file-generate--jangan-edit-manual)
- [Struktur folder](#struktur-folder)

## Kategori

15 kategori, 606 tool (v6.12.0). Daftar lengkap per tool ada di [TOOLS.md](TOOLS.md).

| Kategori | Jumlah | Isi |
|---|---:|---|
| 🏠 Sehari-hari | 67 | BMI, umur, parkir, jadwal, tes perangkat |
| 💼 Bisnis | 61 | Gaji, HPP, invoice, PPN, BEP, marketplace |
| 🇮🇩 Indonesia | 55 | Pajak kendaraan, BPJS, THR, zakat, weton, SIM |
| 🧑‍💻 Developer | 47 | JSON, JWT, hash, regex, cron, Git |
| 🖼️ Gambar | 42 | Kompres, convert, crop pas foto, kolase, meme |
| ⚡ Produktivitas | 43 | Pomodoro, kanban, surat, CV, habit tracker |
| 🎨 Desain | 39 | Palet warna, gradient, QR, favicon, tipografi |
| 🎲 Fun | 43 | Kuis, tebak-tebakan, spin wheel, zodiak |
| 📚 Pelajar | 34 | IPK, CPNS, TOEFL, matriks, tabel periodik |
| 🔁 Converter | 32 | Satuan, suhu, mata uang, video, Base64 |
| 🎧 Musik | 31 | Metronome, chord, BPM, tuner, DJ |
| 🔐 Keamanan | 30 | Password, TOTP, cek penipuan, enkripsi |
| 🌐 Live API | 32 | Gempa BMKG, jadwal sholat, kurs, harga crypto |
| 🔤 Teks | 27 | Word counter, lorem ipsum, fancy text |
| 🎭 Fake Sosmed | 23 | Fake chat, fake post, fake notif (untuk hiburan) |

## Cara menjalankan lokal

Tidak ada build step, tidak ada dependency yang harus di-install. Cukup layani folder ini lewat HTTP — **jangan dibuka langsung sebagai file** (`file://`), karena ES module diblokir browser kalau tanpa server.

```bash
cd adip-tools
python3 -m http.server 8000
# buka http://localhost:8000
```

Alternatif lain yang setara: `npx serve`, `php -S localhost:8000`, atau ekstensi Live Server di VS Code.

## Menambah tool baru

Panduan lengkap: [docs/menambah-tool.md](docs/menambah-tool.md). Ringkasnya:

1. Buat **satu file** `js/tools/<kategori>/<id-tool>.js` (id = nama file tanpa `.js`).
2. File itu wajib mengekspor dua hal:
   - `export const meta = { id, name, cat, icon, desc, keywords }` — `id` harus sama dengan nama file, `cat` harus sama dengan nama folder.
   - `export function render(root, onLeave, T, m)` — membangun UI tool di dalam elemen `root`, memakai helper dari `core.js` (`T.btn`, `T.input`, `T.out`, dan lain-lain).
3. Regenerasi manifest + daftar tool:
   ```bash
   node scripts/sync-manifest.js <versi-saat-ini>
   python3 scripts/gen-tools-md.py
   ```
4. Validasi sebelum selesai:
   ```bash
   node scripts/check-tools.js
   ```

Aturan keras: **satu tool = satu file**, tool dilarang mengimpor tool lain, fungsi yang dipakai bersama taruh di `js/core.js`.

## Bump versi

Jangan bump versi dengan edit manual — satu perintah mengurus semuanya:

```bash
python3 scripts/bump-version.py 6.12.0
node scripts/check-tools.js   # wajib lolos sebelum commit/push
```

Yang dilakukan `bump-version.py` (berurutan): ubah `VERSION` di `scripts/split-tools.py`, regenerate `js/manifest.js` lewat `sync-manifest.js`, sapu semua `?v=<versi-lama>` jadi `?v=<versi-baru>` di `js/tools/*/*.js`, `index.html`, dan `js/app.js`, lalu regenerate `TOOLS.md`. Opsi `--dry-run` hanya mencetak rencana tanpa mengubah file.

## Arsitektur singkat

Detail lengkap: [docs/arsitektur.md](docs/arsitektur.md).

- **Statis murni.** HTML + CSS + vanilla JS, tanpa framework, tanpa build step, tanpa backend sendiri. Hosting cukup server file statis apa pun.
- **Shell + hash routing.** `index.html` hanya berisi skip link + `<main id="app">` dan dua `<script type="module">`. `js/app.js` adalah router hash: `#/t/<id-tool>`, `#/k/<kategori>`, `#/semua`, `#/favorit`, `#/c/<koleksi>`, `#/metodologi`.
- **Lazy load per tool.** Beranda hanya memuat `js/manifest.js` (metadata ringan 606 tool). Kode tool diimpor dinamis (`import()`) saat halamannya dibuka, lengkap dengan `?v=<versi>` sebagai cache-buster.
- **Satu file = satu tool.** Tiap tool adalah ES module mandiri di `js/tools/<kategori>/<id>.js`, mengimpor helper dari `js/core.js` (komponen UI, format angka/Rupiah, download, ZIP, toast, dan lain-lain).
- **Client-side, dengan dua pengecualian jujur:**
  - **Live API (27 tool):** mengambil data publik dari API pihak ketiga (BMKG, Aladhan, CoinGecko, dan sejenisnya) langsung dari browser.
  - **Supabase (opsional, gagal diam-diam):** `js/app.js` hanya mencatat kata kunci pencarian (anonim, maks. 80 karakter) dan mengambil daftar tool populer. Kalau Supabase mati, situs tetap jalan normal.
  - **ffmpeg.wasm (6 tool video/audio):** `@ffmpeg/ffmpeg` 0.12.15 + `@ffmpeg/core` 0.12.10 single-thread, dimuat dari CDN jsDelivr; worker-nya di-vendor same-origin di `js/ffmpeg-worker/` agar tidak kena blokir lintas-origin. Semua proses jalan di perangkat pengguna — file tidak di-upload.
- **State lokal.** Favorit dan riwayat tersimpan di `localStorage` (`adip_fav`, `adip_recent`), maksimal 50 favorit.

## Aturan desain (design lock)

Tampilan dikunci di `css/style.css`. Jangan memperkenalkan warna, font, atau gaya baru tanpa mengubah design lock-nya dulu.

- **Palet hangat-gelap:** latar `#161311`, permukaan `#1e1a16`, garis `#332a21`, teks `#f6f1e8`, teks redup `#c9bda9`.
- **Aksen satu-satunya:** koral `#ff6f61` (teks di atasnya `#2b100a`). Warna hanya untuk status: sukses `#7ccf8f`, peringatan `#fbbf24`, error `#f87171`, info `#8ab8ff`.
- **Font:** Bricolage Grotesque (self-hosted, `css/fonts/bricolage-grotesque.woff2`) untuk semua teks; monospace sistem untuk kode/angka teknis.
- **Radius:** kartu 18px, kontrol 12px. Mobile-first, target sentuh nyaman di HP.
- **Copy berbahasa Indonesia sehari-hari**, tanpa istilah teknis di depan pengguna, dan **semua angka yang tampil harus data nyata** — dilarang angka contoh yang seolah-olah nyata. Kalau belum ada data, tampilkan empty state yang jujur.

## File generate — jangan edit manual

File-file ini dibangkitkan dari `export const meta` tiap tool. Edit meta-nya, lalu regenerate:

| File | Generator |
|---|---|
| `js/manifest.js` | `node scripts/sync-manifest.js <versi>` |
| `TOOLS.md` | `python3 scripts/gen-tools-md.py` |
| `sitemap.xml` | `node scripts/gen-sitemap.js` |
| `llms.txt` | `node scripts/gen-llms-txt.js` |

Script lain di `scripts/`: `check-tools.js` (validasi struktur + manifest), `analyze-tools.js` (analisis repo), `split-tools.py` (pemecah file tool lama, menyimpan `VERSION`), `strip-query-loader.mjs` (loader Node agar `?v=` diabaikan saat import).

## Struktur folder

```
index.html            Shell kosong + stylesheet + entry module
css/                  style.css (design lock) + fx-*.css (efek) + fonts/
js/
  app.js              Router hash, beranda, pencarian, favorit, koleksi
  core.js             Helper bersama semua tool (namespace `h`, `utils`)
  manifest.js         Metadata 606 tool (GENERATED)
  beranda.js          Showcase "Baru ditambahkan" + pengantar kategori (v6.12.0)
  detail-riwayat.js   Rel riwayat + chip kembali di halaman tool (v6.12.0)
  seo-share.js        Meta/JSON-LD dinamis + tombol bagikan (v6.12.0)
  search-plus.js      Ranker pencarian intent-aware + saran (v6.12.0)
  fx.js               Efek visual
  ffmpeg-loader.js    Pemuat bersama ffmpeg.wasm (6 tool video/audio)
  ffmpeg-worker/      Worker ffmpeg yang di-vendor same-origin
  tools/<kategori>/   Satu file per tool (606 terdaftar di manifest v6.12.0)
scripts/              Generator manifest/TOOLS.md/sitemap/llms.txt, bump, cek
docs/                 Panduan kontribusi & arsitektur
supabase/             SQL pendukung pencarian (catatan: tidak cocok dengan app.js — lihat docs/arsitektur.md)
TOOLS.md              Daftar lengkap 588 tool (GENERATED)
llms.txt              Ringkasan situs untuk LLM (GENERATED)
sitemap.xml           Sitemap (GENERATED)
robots.txt            Mengizinkan semua crawler, menunjuk sitemap
```

## Status

v6.12.0 — 606 tool, 15 kategori. Ronde upgrade v6.12.0 (32 tim + 1 koordinator) selesai 15 Nov 2026.
