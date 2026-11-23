# ADIP Tools 🧰

**1.261 tools gratis berbahasa Indonesia** — kalkulator, converter, generator, dan alat sehari-hari, sebagian besar khusus untuk kebutuhan di Indonesia.

🌐 Live: <https://tools.adipmusic.my.id>

Tanpa daftar, tanpa iklan. Bisa dipasang sebagai aplikasi di HP/komputer (opsional) — sebagian tool jalan offline. Kebanyakan tool jalan sepenuhnya di browser kamu. Buka, pakai, selesai.

## Isi

- [Kategori](#kategori)
- [Alamat halaman](#alamat-halaman)
- [Pasang sebagai aplikasi, pakai offline (PWA)](#pasang-sebagai-aplikasi-pakai-offline-pwa)
- [Cara menjalankan lokal](#cara-menjalankan-lokal)
- [Menambah tool baru](#menambah-tool-baru)
- [Bump versi](#bump-versi)
- [Arsitektur singkat](#arsitektur-singkat)
- [Aturan desain (design lock)](#aturan-desain-design-lock)
- [File generate — jangan edit manual](#file-generate--jangan-edit-manual)
- [Struktur folder](#struktur-folder)

## Kategori

22 kategori, 1.261 tool (v6.21.0). Daftar lengkap per tool ada di [TOOLS.md](TOOLS.md).

| Kategori | Jumlah | Isi |
|---|---:|---|
| 🌐 Data Langsung | 139 | Gempa BMKG, jadwal sholat, kurs, harga crypto |
| 💼 Bisnis | 124 | Gaji, HPP, invoice, PPN, BEP, marketplace |
| 🏠 Sehari-hari | 98 | BMI, umur, parkir, jadwal, tes perangkat |
| 🖼️ Gambar | 94 | Kompres, convert, crop pas foto, kolase, meme |
| 🎲 Fun | 93 | Kuis, tebak-tebakan, spin wheel, zodiak |
| 📚 Pelajar | 79 | IPK, CPNS, TOEFL, matriks, tabel periodik |
| 🧑‍💻 Developer | 75 | JSON, JWT, hash, regex, cron, Git |
| ⚡ Produktivitas | 74 | Pomodoro, kanban, surat, CV, habit tracker |
| 🔁 Converter | 69 | Satuan, suhu, mata uang, video, Base64 |
| 🎨 Desain | 57 | Palet warna, gradient, QR, favicon, tipografi |
| 🇮🇩 Indonesia | 56 | Pajak kendaraan, BPJS, THR, zakat, weton, SIM |
| 🎧 Musik | 51 | Metronome, chord, BPM, tuner, DJ |
| 🎭 Sosmed Palsu | 46 | Fake chat, fake post, fake notif (untuk hiburan) |
| ❤️ Kesehatan | 44 | Skor jantung, lemak tubuh, rokok, peak flow |
| 🔤 Teks | 37 | Word counter, lorem ipsum, fancy text |
| 🔐 Keamanan | 34 | Password, TOTP, cek penipuan, enkripsi |
| 🔬 Sains | 24 | Berat molekul, hukum Ohm, energi gempa |
| 🎬 Kreator | 18 | Caption IG/TikTok, brief konten, hook video |
| 🚗 Otomotif | 16 | Beli vs sewa mobil, biaya cas mobil listrik |
| 🏡 Rumah | 15 | Atap, keramik, pasir, beban balok |
| 🍳 Masak | 9 | Rasio beras-air, kopi, oven ke air fryer |
| ✈️ Travel | 9 | Anggaran trip, jet lag, bebas visa |

## Alamat halaman

Situs memakai alamat hash (bagian setelah `#` di URL). Bedakan dua huruf ini:

- `#/t/<id-tool>` — satu tool, mis. `#/t/qr-generator`.
- `#/k/<kategori>` — satu kategori, mis. `#/k/bisnis`.
- `#/c/<koleksi>` — satu koleksi lintas kategori, mis. `#/c/lamaran-kerja`.
- `#/semua` — semua tool (tambah `?q=` untuk pencarian, mis. `#/semua?q=gaji`).
- `#/favorit` — daftar favoritmu.
- `#/metodologi` — rumus & asumsi kalkulator.

Catatan: `#/k/` = kategori, `#/c/` = koleksi — jangan tertukar. Alamat
`#/favorit` harus persis begitu: tambahan apa pun di belakangnya (mis.
`#/favorit?x=1`) membuat situs kembali ke beranda — perilaku lama yang
sengaja dipertahankan. Beberapa tool membaca tambahan di alamatnya:
`#/t/pdflab?tab=9` membuka tab ke-10 PDFLab, `#/t/csv-ke-excel?dir=b`
membuka arah Excel → CSV.

## Pasang sebagai aplikasi, pakai offline (PWA)

Sejak v6.20.0, ADIP Tools bisa dipasang sebagai aplikasi dan sebagian tool-nya
jalan tanpa internet. Memasang itu **opsional** — situs tetap jalan penuh di
browser tanpa dipasang.

### Cara memasang

- **Android (Chrome/Edge):** ketuk tombol **Instal** yang muncul di situs, atau
  lewat menu browser (⋮ → "Instal aplikasi"). Ikon ADIP Tools muncul di layar
  utama seperti aplikasi biasa.
- **Komputer (Chrome/Edge):** klik ikon instal di address bar, atau menu
  browser → "Instal ADIP Tools". Aplikasi terbuka di jendela sendiri, tanpa
  address bar.
- **iPhone/iPad (Safari):** Safari tidak punya tombol instal otomatis. Caranya
  manual: ketuk tombol **Bagikan** (kotak + panah ke atas) → **Tambah ke Layar
  Utama** → **Tambah**. Situs akan menampilkan panduan langkah ini bila kamu
  membukanya dari iPhone/iPad.
- **Menghapus:** seperti menghapus aplikasi biasa — tekan lama ikonnya lalu
  hapus/uninstall. Menghapus aplikasi juga menghapus data offline-nya.

### Apa yang jalan tanpa internet

Syaratnya satu: tool itu **pernah dibuka sekali saat online**, supaya tersimpan
di perangkat. Setelah itu:

| Keadaan | Jumlah tool | Artinya |
|---|---:|---|
| Jalan penuh offline | 933 (72%) | Kalkulator, converter, generator, dan sebagian besar tool lain — semuanya jalan normal tanpa internet |
| Jalan offline setelah pustakanya tersimpan sekali | 114 | Tool PDF, video/audio, dan sejenisnya: pustakanya diunduh sekali saat pertama dipakai (mis. mesin video/audio ~31 MB), lalu jalan offline |
| Jalan offline, kecuali tombol unduh PNG | 53 | Fungsi utamanya jalan penuh; hanya tombol unduh gambar yang butuh internet sekali |
| Butuh internet | 166 + 33 | Tool data live (cuaca, gempa, harga, jadwal) dan tool AI (butuh akun/kuota layanan AI) — datanya memang dari internet, jadi tidak bisa offline. Bila dibuka tanpa internet, muncul pesan jujur + tombol coba lagi, bukan data palsu |

Catatan: halaman utama, pencarian, favorit, dan riwayat tersimpan di perangkat
dan tetap bisa dibuka offline. Istilah "Populer" butuh internet (datanya dari
server) — offline, bagian itu kosong.

### Mengelola data offline

- **Lihat ukuran:** besar data offline yang tersimpan ditampilkan di footer
  situs, dekat tombol instal.
- **Hapus data offline:** tombol **hapus cache offline** di footer menghapus
  semua tool yang tersimpan, tanpa menghapus favorit dan riwayatmu (keduanya
  tersimpan terpisah). Setelah dihapus, tool perlu dibuka sekali lagi saat
  online supaya tersimpan ulang.
- **Batas penyimpanan:** tool yang tersimpan dibatasi 300 tool terakhir
  (yang paling lama tidak dibuka akan diganti otomatis), dan pustaka dari
  internet dibatasi 20 item — supaya tidak memenuhi memori HP.

### Cara kerja pembaruan

- Saat ada versi baru, situs menampilkan pemberitahuan **"Ada versi baru ADIP
  Tools."** Ketuk **Muat ulang** untuk memakai versi baru — pembaruan tidak
  terjadi diam-diam di tengah kamu memakai tool.
- Begitu versi baru aktif, data offline versi lama dihapus otomatis, jadi kamu
  tidak akan terjebak di versi lama.
- File pembaruan aplikasi selalu dicek ulang ke server setiap kali situs
  dibuka, jadi versi baru tidak akan terlewat karena tersimpan di cache lama.

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

Yang dilakukan `bump-version.py` (berurutan): ubah `VERSION` di `scripts/split-tools.py`, regenerate `js/manifest.js` lewat `sync-manifest.js`, lalu regenerate `TOOLS.md` (+ sitemap & llms.txt via cascade). Langkah sapu `?v=` lama sudah tidak menemukan apa pun sejak v6.14.0 (sistem `?v=` dicabut, diganti hash Vite) — adaptasi `bump-version.py` oleh tim P0 berikutnya. Opsi `--dry-run` hanya mencetak rencana tanpa mengubah file.

## Arsitektur singkat

Detail lengkap: [docs/arsitektur.md](docs/arsitektur.md).

- **Statis murni.** HTML + CSS + vanilla JS, tanpa framework, tanpa backend sendiri. Build memakai Vite (`npm run build` → `dist/`): bundling + minifikasi + nama file ber-hash. Hosting cukup server file statis apa pun.
- **Shell + hash routing.** `index.html` hanya berisi skip link + `<main id="app">` dan dua `<script type="module">`. `js/app.js` adalah router hash: `#/t/<id-tool>`, `#/k/<kategori>`, `#/semua`, `#/favorit`, `#/c/<koleksi>`, `#/metodologi`.
- **Lazy load per tool.** Beranda hanya memuat `js/manifest.js` (metadata ringan 1.261 tool). Kode tool diimpor dinamis lewat `import.meta.glob` saat halamannya dibuka — satu chunk ber-hash per tool sebagai cache-buster.
- **Satu file = satu tool.** Tiap tool adalah ES module mandiri di `js/tools/<kategori>/<id>.js`, mengimpor helper dari `js/core.js` (komponen UI, format angka/Rupiah, download, ZIP, toast, dan lain-lain).
- **Client-side, dengan dua pengecualian jujur:**
  - **Data Langsung (139 tool):** mengambil data publik dari API pihak ketiga (BMKG, Aladhan, CoinGecko, dan sejenisnya) langsung dari browser.
  - **Supabase (opsional, gagal diam-diam):** `js/app.js` hanya mencatat kata kunci pencarian (anonim, maks. 80 karakter) dan mengambil daftar tool populer. Kalau Supabase mati, situs tetap jalan normal.
  - **ffmpeg.wasm (29 tool video/audio):** `@ffmpeg/ffmpeg` 0.12.15 + `@ffmpeg/core` 0.12.10 single-thread, dimuat dari CDN jsDelivr; worker-nya di-vendor same-origin di `js/ffmpeg-worker/` agar tidak kena blokir lintas-origin. Semua proses jalan di perangkat pengguna — file tidak di-upload.
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
  manifest.js         Metadata 1.261 tool (GENERATED)
  beranda.js          Showcase "Baru ditambahkan" + pengantar kategori (v6.12.0)
  detail-riwayat.js   Rel riwayat + chip kembali di halaman tool (v6.12.0)
  seo-share.js        Meta/JSON-LD dinamis + tombol bagikan (v6.12.0)
  search-plus.js      Ranker pencarian intent-aware + saran (v6.12.0)
  fx.js               Efek visual
  ffmpeg-loader.js    Pemuat bersama ffmpeg.wasm (29 tool video/audio)
  ffmpeg-worker/      Worker ffmpeg yang di-vendor same-origin
  tools/<kategori>/   Satu file per tool (1.261 terdaftar di manifest v6.21.0)
scripts/              Generator manifest/TOOLS.md/sitemap/llms.txt, bump, cek
docs/                 Panduan kontribusi & arsitektur
supabase/             SQL pendukung pencarian (catatan: tidak cocok dengan app.js — lihat docs/arsitektur.md)
TOOLS.md              Daftar lengkap 1.261 tool (GENERATED)
llms.txt              Ringkasan situs untuk LLM (GENERATED)
sitemap.xml           Sitemap (GENERATED)
robots.txt            Mengizinkan semua crawler, menunjuk sitemap
```

## Status

v6.12.0 — 606 tool, 15 kategori. Ronde upgrade v6.12.0 (32 tim + 1 koordinator) selesai 15 Nov 2026.
