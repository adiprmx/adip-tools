# Update — 1 Okt 2026: QA Fixes v5.0.0 → v5.0.1 (7 temuan visual)

## Yang diperbaiki
1. Ikon "Takaran Masak": string mentah "U0001f373" → emoji 🍳 (di meta tool + manifest).
2. Section "Lihat Juga" di halaman tool tidak tampil: `observeRv()` tidak pernah dipanggil
   untuk baris terkait (class `.rv` tetap `opacity: 0`) — sekarang di-observe setelah render.
3. Pill "muse-test" di "Sering dicari": artefak testing di tabel Supabase global
   `tool_search_terms` (bukan localStorage, bukan hardcoded). Baris tidak bisa dihapus
   via API (RLS blokir DELETE) → tambah `SEARCH_DENY` di app.js, filter di `fetchTopSearches`.
   Untuk hapus permanen: `DELETE FROM tool_search_terms WHERE term='muse-test';` via SQL editor.
4. Fade gradient di tepi kanan (dan kiri saat ter-scroll) pada `.rail` (pills kategori)
   dan `.qrail` (★ Favorit): mask-image + `watchFadeX()` toggle kelas saat scroll.
5. Ikon "QR Code Generator": ⬛ → 🔲 (di meta tool + manifest).
6. Label "Iuran pensiun..." terpotong di tepi kiri: `.fld > label` tambah `padding-left: 2px`.
7. Sapaan time-aware: sore 15:00–18:00, malam 18:00+ (sebelumnya sore sampai 19:00).

---

# Update — 1 Okt 2026: Redesign Total "Liquid Minimal" (v5.0.0)

## Ringkasan
Redesign total UI/UX atas perintah owner: minimalism, liquid glass, modern,
beranimasi, anti AI slop. 110 tools, logika tool tidak disentuh.

## Yang berubah
- Font: Space Grotesk → Plus Jakarta Sans (self-host woff2 variable 200-800,
  `css/fonts/plus-jakarta-sans.woff2`; file lama dihapus).
- Tema: dark only, base #09090b (zinc-950, bukan pure black). Satu aksen mint
  #34d399, dikunci di seluruh halaman (mark, focus ring, tombol primary,
  tab kategori aktif, bintang favorit).
- Liquid glass (aproksimasi web: backdrop-filter + inner highlight) hanya di
  elemen mengambang: topbar sticky, command palette, dock bawah, toast.
  Fallback solid via `prefers-reduced-transparency`.
- Shape lock: kartu 20px, permukaan 16px, kontrol (tombol/chip/tab) pill.
- Hero compact left-aligned: "Butuh apa?" dipertahankan, sub ≤20 kata.
- Kategori: pill tabs (ganti kartu 132px); nomor urut section (01, 02…)
  dihapus.
- Direktori: scroll-reveal stagger via IntersectionObserver (tanpa scroll
  listener), hover angkat ikon + border aksen.
- Copy audit: "100 tools" → "110 tools" di semua string; footer dipangkas.
- `js/core.js`: hanya penyesuaian warna inline helper (preHtml, kvRows);
  API tidak berubah.
- Versi 4.3.0 → 5.0.0 di semua tempat (manifest, split-tools.py, 110 file
  tool, app.js imports, index.html css+js).

---

# Update — 1 Okt 2026: 10 Tools Baru (v4.3.0)

## Ringkasan
100 → 110 tools. Sepuluh tool baru mengikuti kontrak kerapian penuh: satu file
= satu tool (`js/tools/<kategori>/<id>.js`), 1 baris manifest per tool (sorted
cat,id seperti output generator), `scripts/check-tools.js` lolos. Tidak ada
perubahan `core.js`/`app.js` selain bump versi. Semua tool 100% client-side,
tanpa backend/API key.

## Tool baru
- **indonesia/pph21** 🧾 Kalkulator PPh 21 — bruto/bulan + iuran + status PTKP
  (12 pilihan TK/K/KI), tarif progresif Pasal 17 (5/15/25/30/35%), biaya jabatan
  5% (maks 500rb/bln), PKP dibulatkan ke bawah ribuan. Output PPh/bln & thn,
  take-home pay, rincian per lapisan + catatan TER (PP 58/2023).
- **indonesia/plat-nomor** 🚗 Cek Asal Plat Nomor — 52 kode plat Indonesia
  ter-embed (wilayah + contoh daerah), input bebas ("B 1234 XYZ" → B),
  daftar semua kode di `<details>`.
- **indonesia/hijriah** 🌙 Konverter Hijriah — Masehi ↔ Hijriah dua arah,
  algoritma Kuwaiti, nama bulan & hari Indonesia, disclaimer ±1–2 hari.
- **bisnis/kpr** 🏠 Simulasi KPR — harga, DP, tenor, bunga; cicilan anuitas,
  total bunga, tabel angsuran per tahun.
- **gambar/meme** 😂 Meme Generator — upload foto / background warna, teks
  atas-bawah gaya Impact + outline, unduh PNG via canvas.
- **gambar/blur-foto** 🫣 Blur Foto — upload, seret area di foto (pointer events,
  mobile-friendly), intensitas pixel, blur seluruh foto, undo, unduh PNG.
- **keamanan/passphrase** 🔑 Passphrase Indonesia — wordlist 324 kata unik
  ter-embed, crypto.getRandomValues, opsi jumlah kata/pemisah/kapital/angka/
  simbol, estimasi entropi + label kekuatan.
- **desain/clamp** 📏 CSS Clamp Generator — output `clamp()` versi px & rem +
  tombol salin, preview live dengan slider simulasi lebar layar.
- **desain/kontras** ◐ Cek Kontras Warna — rasio WCAG dari 2 warna (color picker
  + hex), badge lolos/gagal AA/AAA (normal & besar), preview dua arah, tukar.
- **converter/csv-json** 🔄 CSV ↔ JSON — parser CSV benar (quote, delimiter
  `,`/`;` auto-deteksi ala Excel Indonesia), deteksi arah otomatis, upload file,
  salin/unduh hasil.

## Yang berubah
- `js/manifest.js`: 110 entri, `VERSION` 4.2.0 → 4.3.0.
- Cache-buster `?v=4.2.0` → `?v=4.3.0` di 100 file tool lama + `js/app.js`
  (2 import) + `index.html` (`js/app.js`); `css/style.css` tetap `?v=4.0.0`.
- `scripts/split-tools.py`: `VERSION` → '4.3.0' (konsistensi regenerasi).

## Verifikasi
- `scripts/check-tools.js`: 110/110 tool ter-import, semua cek konsistensi lolos.
- Algoritma Hijriah diuji di Node vs tanggal known: 1 Muh 1447 → 27 Jun 2026,
  1 Ram 1447 → 18 Feb 2026, 17 Agu 1945 → 8 Ramadan 1364H, round-trip OK.
- Logika PPh 21 & KPR dihitung manual spot-check (12jt/bln TK/0 → PPh 550rb/bln).
- Parser CSV di-trace untuk quote/`,` di dalam field/quote ganda/trailing newline.

---

# Update — 1 Okt 2026: Migrasi ES Modules (Fase 1)

## Ringkasan
Fondasi migrasi ke ES modules. Perilaku & tampilan 100% identik — hanya cara
kode diorganisir yang berubah (tanpa build step, tanpa framework).

## Yang berubah
- `js/core.js` (BARU): ES module pengganti `js/helpers.js` — export named
  (`el`, `esc`, `toast`, `copy`, `btn`, `field`, `input`, `select`, `ta`,
  `out`, `show`, `hide`, `copyBtn`, `dl`, `dlBtn`, `row`, `grid2`, `onLeave`,
  `fmt`, `rp`, `num`, `actx`, `beep`, `loadScript`) + `h`, `cats`, `tools`,
  `utils`, `leaveCbs` sebagai live bindings.
- `js/helpers.js` (HAPUS): digantikan `core.js`.
- `js/tools-a.js` … `js/tools-e.js`: IIFE + `window.ADIPTOOLS` → ES module
  (`import { h as T, tools, utils } from './core.js'`). Isi tool tidak diubah.
- `js/app.js`: IIFE → ES module; import `core.js` + 5 modul tools.
- `index.html`: 7 script tag → 1 `<script type="module" src="js/app.js?v=4.1.0">`.
- Global `window.ADIPTOOLS` dihapus total.

## Verifikasi
- `node --check` ESM: 7/7 file lolos.
- Import graph di Node: 100 tools terdaftar, 0 duplikat id, 0 tool rusak,
  14 kategori, 54 fungsi murni di `utils` (spot-check `terbilang` benar).
- Uji fungsional jsdom: home render (100 kartu + sapaan), buka tool
  `password-generator` & `terbilang`, search "qr" → 2 hasil, palette Ctrl+K
  terbuka, 0 JS error.

## Berikutnya (Fase 2)
Pecah tiap tool jadi `js/tools/<kategori>/<id>.js` + manifest — code splitting:
tool hanya di-download saat dibuka.

## Hotfix — 1 Okt 2026 ~07:00 WIB: QR Generator CDN 404
- Temuan saat uji regresi live: tool QR Code Generator rusak — URL
  `https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js` return 404
  (paket npm qrcode@1.5.x tidak punya folder `build/`; bug pre-existing,
  bukan akibat migrasi ES modules).
- Fix: pin ke `qrcode@1.4.4` (punya `/build/qrcode.min.js`, terverifikasi 200).
  2 baris di `js/tools-a..e` → `js/tools-b.js` diubah, API tool tidak berubah.

---

# Update — 1 Okt 2026: Code Splitting (Fase 2)

## Ringkasan
Tiap tool kini file ES module sendiri: `js/tools/<kategori>/<id>.js` (100 file,
14 folder kategori). `app.js` hanya memuat metadata ringan dari `js/manifest.js`;
kode tool di-download via dynamic `import()` HANYA saat tool dibuka, lalu
di-cache. Perilaku & tampilan 100% identik — hanya cara kode diorganisir yang
berubah (tanpa build step, tanpa framework).

## Yang berubah
- `js/tools-a.js` … `js/tools-e.js` (HAPUS): digantikan 100 file
  `js/tools/<kategori>/<id>.js` — satu file = satu tool, nama file = id tool.
- `js/manifest.js` (BARU): 100 entri metadata `{id,name,cat,icon,desc,file}` +
  `VERSION = '4.2.0'`. Tidak ada kode tool di sini.
- `js/app.js`: import 5 batch → import `manifest.js` saja; `toolPage()` pakai
  dynamic `import('./' + t.file + '?v=' + VERSION)` + cache `toolMods`.
- `js/core.js`: +21 shared helper yang dipakai >1 tool
  (`errBox, preHtml, kvRows, tabs, U, _NI, _normAcc, kv, money, LOCAL_NOTE,
  canvasToBlob, fileInput, fmtBytes, imgEl, loadImage, utils.extractEmails,
  utils.extractPhones, p2, parseISO, todayISO, utils.ageParts`) + alias
  `const T = h` untuk helper pindahan yang memakai `T.*`.
- `index.html`, `app.js`: versi bump 4.1.0 → 4.2.0 (cache-buster `?v=`).
- `scripts/check-tools.js` (BARU): verifikasi otomatis — manifest 100 entri,
  semua tool ter-import, export `{meta, render}` ada, meta.id cocok,
  0 id duplikat, 0 import antar-tool, 0 import dari batch lama.
- `scripts/split-tools.py` + `scripts/analyze-tools.js`: generator Fase 2
  (analisis AST acorn → emit per-tool). Bisa di-run ulang bila perlu.

## Aturan kerapian (kontrak, berlaku ke depan)
1. Satu file = satu tool; nama file = id tool; folder = kategorinya.
2. Tool DILARANG import tool lain.
3. Fungsi dipakai >1 tool → `core.js`; fungsi 1 tool → ikut file tool-nya.
4. `app.js` cuma shell + router; metadata tool di `manifest.js`.
5. Tool baru = 1 file + 1 baris manifest + jalanin `scripts/check-tools.js`.

## Verifikasi
- `scripts/check-tools.js`: 100/100 tool ter-import, semua cek konsistensi lolos.
- Uji fungsional jsdom: 97/100 tool render tanpa error (3 sisanya limitasi
  jsdom: `favicon` & `spinwheel` butuh canvas 2D asli, `countdown` render normal
  saat diuji terisolasi).
- Uji integrasi app.js (jsdom): home render 100 baris tool + 14 seksi kategori,
  search "qr" → 2 hasil, navigasi `#/t/terbilang` → dynamic import jalan dan
  tool tampil, kembali ke home normal, 0 JS error.

## Catatan teknis (bug generator yang di-fix)
- Offset acorn = UTF-16 code units, Python = code points → konversi wajib
  (emoji di file bikin ekstraksi body meleset).
- Definisi `utils.X` di dalam IIFE top-level ikut dipindah (terbilang, toRoman/
  fromRoman, morse) — bukan cuma assignment top-level langsung.
- Deklarasi multi-nama (`const a = {}, b = {};`) di-emit sekali (dedup by source).
- `esc` tidak diduplikat ke core.js (sudah ada); komentar manifest tanpa `*/`.
