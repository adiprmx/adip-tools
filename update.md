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
