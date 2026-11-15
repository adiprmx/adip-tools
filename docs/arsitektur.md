# Arsitektur

Ringkasan cara kerja Adip Tools di balik layar. Untuk gambaran umum, lihat [README.md](../README.md); untuk menambah tool, lihat [menambah-tool.md](menambah-tool.md).

## Prinsip

Situs statis murni: HTML + CSS + vanilla JS, tanpa framework, tanpa build step, tanpa backend sendiri. Satu-satunya "server" yang terlibat adalah CDN (ffmpeg), API publik (tool Live API), dan Supabase (pencatatan pencarian — opsional, gagal diam-diam).

## Alur muat halaman

```
index.html (21 baris: <div id="app"> + 2 <script type="module">)
  └─ js/app.js        shell + router hash + beranda + pencarian
       ├─ js/manifest.js   metadata ringan 588 tool (GENERATED)
       ├─ js/core.js       helper bersama (namespace `h`, `utils`)
       └─ js/tools/<cat>/<id>.js   diimpor DINAMIS saat halamannya dibuka
  └─ js/fx.js         efek visual (terpisah dari logika)
```

Beranda tidak memuat kode 588 tool — hanya manifest (~588 entri JSON, satu baris per tool). Kode tool dimuat on-demand lewat `import('./' + m.file + '?v=' + VERSION)` di `app.js`, dengan skeleton loading selama modul dimuat dan pesan "Gagal memuat" kalau import gagal.

## Routing (hash)

Router di `js/app.js` (`function route()`, dipicu `hashchange` + pemuatan awal; dibungkus `document.startViewTransition` bila tersedia):

| Hash | Halaman |
|---|---|
| `#/` | Beranda (hero + search + kategori + populer + riwayat) |
| `#/t/<id-tool>` | Halaman satu tool |
| `#/k/<kategori>` | Daftar tool satu kategori |
| `#/semua?q=<kata>` | Direktori semua tool + filter/pencarian |
| `#/favorit` | Tool yang difavoritkan |
| `#/c/<id-koleksi>` | Koleksi berdasarkan masalah (v6.12.0) |
| `#/metodologi` (+ `#<id-tool>`) | Rumus, asumsi & batasan kalkulator |

Hash routing sengaja dipilih: hosting statis apa pun bisa melayani semua URL tanpa konfigurasi rewrite server, dan tautan per tool (`https://tools.adipmusic.my.id/#/t/bmi`) tetap bisa dibagikan.

Fitur shell lain di `app.js`: command palette (Ctrl/⌘+K), favorit (♥), riwayat "Lanjutkan", rantai "Lanjut ke" (peta `NEXT`), tool sejenis (4 tool satu kategori), badge "BARU" untuk tool yang `since`-nya sama dengan versi berjalan, dan halaman Metodologi.

## Manifest: sumber kebenaran turunan

Sumber kebenaran adalah `export const meta` di tiap file tool. `js/manifest.js` hanya turunannya, dibangkitkan `scripts/sync-manifest.js`:

```
js/tools/<cat>/<id>.js  (export const meta)
        │  node scripts/sync-manifest.js <versi>
        ▼
js/manifest.js  (GENERATED — jangan edit manual)
        │
        ├─ python3 scripts/gen-tools-md.py  → TOOLS.md
        ├─ node scripts/gen-sitemap.js      → sitemap.xml
        └─ node scripts/gen-llms-txt.js     → llms.txt
```

`sync-manifest.js` mengimpor semua file tool di Node (dengan `strip-query-loader.mjs` agar `?v=` diabaikan), memvalidasi `meta.id == nama file` dan `meta.cat == nama folder`, lalu menulis entri terurut kategori → id. `check-tools.js` memvalidasi hasil akhirnya: tidak ada id duplikat, tidak ada file yatim, tiap file mengekspor `{ meta, render }`, semua import statis bisa di-resolve.

## State

Tidak ada akun, tidak ada database pengguna. State hanya di `localStorage` browser:

| Key | Isi | Batas |
|---|---|---|
| `adip_fav` | Favorit `[{id, t}]` | 50 item |
| `adip_recent` | Riwayat dibuka `[{id, t}]` | 20 item |

Format lama `[id]` dimigrasi otomatis ke `[{id, t}]` saat dibaca.

## ffmpeg.wasm (6 tool video/audio)

Dipakai `video-ke-mp3`, `kompres-video`, `video-ke-gif`, `potong-video`, `konverter-audio`, `audio-trimmer`. Arsitektur dibekukan karena rapuh lintas-browser — jangan diubah tanpa menguji ulang di Chrome Android & desktop:

- **Versi:** `@ffmpeg/ffmpeg` 0.12.15 (ESM) + `@ffmpeg/core` 0.12.10 (ESM, single-thread). Core multi-thread (`core-mt`) sengaja TIDAK dipakai karena butuh `SharedArrayBuffer` + header COOP/COEP.
- **CDN:** core JS + WASM (~31 MB) dari jsDelivr; dimuat sekali lalu instance-nya di-cache (`loadFFmpeg()` di `js/ffmpeg-loader.js`).
- **Worker di-vendor same-origin** (`js/ffmpeg-worker/worker.js` + `const.js` + `errors.js`): Chrome menolak Worker lintas-origin walau CDN mengirim CORS, jadi worker tidak boleh dari CDN.
- **`fetchFile` ditulis ulang lokal** (`fetchFileLokal`): `@ffmpeg/util` UMD memanggil `require()`/`exports` di browser.
- Semua proses jalan di perangkat pengguna; file tidak di-upload ke mana pun.

## Supabase (opsional)

`js/app.js` memakai satu proyek Supabase hanya untuk dua hal: mencatat kata kunci pencarian (RPC `track_search`, anonim, maks. 40 karakter, debounce 1,2 detik) dan mengambil daftar istilah paling sering dicari (`GET /rest/v1/tool_search_terms?select=term&order=count.desc&limit=8`). Data disimpan sebagai agregat satu baris per istilah di tabel `tool_search_terms` — tanpa identitas pengguna. Semua panggilan dibungkus `try/catch` dan gagal diam-diam — situs tetap berfungsi penuh tanpa Supabase. Bila fetch gagal atau tabel kosong, rel Populer memakai 6 istilah fallback hardcoded di `renderPopuler()`.

> Catatan (v6.12.1, 15 Nov 2026): aplikasi sebelumnya memakai tabel + RPC yang ternyata tidak ada di database, dan anon key-nya sudah dirotasi sehingga semua panggilan 401. Aplikasi kini diselaraskan ke desain database yang benar-benar live (`tool_search_terms` + `track_search`, skema di `supabase/tool_search_terms.sql`) dan memakai publishable key proyek.

## Cache-busting

Semua referensi internal membawa `?v=<versi>` (CSS di `index.html`, `app.js`, import `core.js`/`ffmpeg-loader.js` di tiap file tool, dan dynamic import di router). `bump-version.py` menyapu semuanya sekaligus saat bump versi — jangan ubah `?v=` manual per file, pasti ada yang terlewat.

## Batasan yang perlu diketahui

- **Harus lewat HTTP.** ES module + dynamic import tidak jalan dari `file://`. Jalankan server statis lokal untuk pengembangan.
- **Tidak ada SSR/SEO per tool di server.** Sitemap mencantumkan URL hash (`/#/t/<id>`); crawler yang tidak mengeksekusi JS hanya melihat shell kosong.
- **ffmpeg butuh unduhan ~31 MB** pada pemakaian pertama, dan proses video berat bisa lambat di HP low-end. UI wajib menampilkan progres & tombol batal (`cancelFFmpeg()`).
- **Tool Live API bergantung pada API pihak ketiga** yang bisa berubah/mati tanpa pemberitahuan. Tiap tool wajib menangani gagal fetch dengan pesan yang jelas.
- **Satu file tool = satu module.** File tool besar (ribuan baris) tetap satu file; pemecahan hanya lewat fungsi bersama di `core.js`.
