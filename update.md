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
