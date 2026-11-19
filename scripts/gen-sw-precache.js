#!/usr/bin/env node
/* Bangkitkan daftar precache + versi ke dist/sw.js (PWA v6.20.0, tim P3).
 *
 * Jalan sesudah `vite build` di dalam `npm run build` (D-PWA-02):
 *   1. baca VERSION dari js/manifest.js (regex) + cross-check wajib vs
 *      scripts/split-tools.py — GAGALKAN build bila beda (R5 §2.3).
 *      DILARANG baca package.json (bump-version.py tidak mengelolanya).
 *   2. baca dist/.vite/manifest.json → entry chunk + CSS bundle + font.
 *   3. susun daftar precache SHELL-ONLY (guardrail keras: TIDAK PERNAH
 *      chunk tool — manifest berisi 1.299 chunk, semuanya difilter habis).
 *   4. ganti placeholder __PWA_VERSION__ + __PRECACHE_MANIFEST__ di
 *      dist/sw.js; assert tidak ada `__PWA` tersisa.
 *
 * Idempotent: bila dist/sw.js sudah terinjeksi versi yang sama, sukses
 * tanpa menulis ulang (no-op). Gagal keras (exit non-nol) bila input
 * hilang, versi bentrok, atau ada URL precache yang tidak ada di disk.
 *
 *   node scripts/gen-sw-precache.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function fail(msg) {
  console.error(`gen-sw-precache: GAGAL — ${msg}`);
  process.exit(1);
}

function readText(relPath, label) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) fail(`${label} hilang: ${relPath}`);
  return fs.readFileSync(abs, 'utf8');
}

// --- 1. VERSION: js/manifest.js (regex) + cross-check split-tools.py -------
const manifestJs = readText('js/manifest.js', 'manifest.js');
const mVersion = manifestJs.match(/export const VERSION = '([^']+)'/);
if (!mVersion) fail("regex VERSION tidak cocok di js/manifest.js (pola: export const VERSION = 'X.Y.Z')");
const VERSION = mVersion[1];
if (!/^\d+\.\d+\.\d+$/.test(VERSION)) {
  fail(`VERSION dari js/manifest.js bukan semver polos: '${VERSION}'`);
}

const splitPy = readText('scripts/split-tools.py', 'split-tools.py');
const mSplit = splitPy.match(/^VERSION = '([^']+)'/m);
if (!mSplit) fail("regex VERSION tidak cocok di scripts/split-tools.py (pola: VERSION = 'X.Y.Z')");
if (mSplit[1] !== VERSION) {
  fail(
    `versi bentrok: js/manifest.js '${VERSION}' ≠ scripts/split-tools.py '${mSplit[1]}' ` +
      '— bump setengah jalan, jalankan ulang scripts/bump-version.py',
  );
}

// --- 2. dist/.vite/manifest.json → aset shell ber-hash ----------------------
const viteManifestPath = path.join(DIST, '.vite', 'manifest.json');
if (!fs.existsSync(viteManifestPath)) {
  fail('dist/.vite/manifest.json hilang — jalankan `vite build` dulu');
}
let viteManifest;
try {
  viteManifest = JSON.parse(fs.readFileSync(viteManifestPath, 'utf8'));
} catch (err) {
  fail(`dist/.vite/manifest.json bukan JSON valid: ${err.message}`);
}
const entry = viteManifest['index.html'];
if (!entry || !entry.isEntry || typeof entry.file !== 'string') {
  fail('entri index.html (isEntry) tidak ditemukan di dist/.vite/manifest.json');
}
if (!Array.isArray(entry.css) || entry.css.length === 0) {
  fail('entri index.html tidak punya CSS bundle di dist/.vite/manifest.json');
}
// Font: dari entry.assets (Vite mencatat aset yang di-preload/diimpor entry).
// Fallback: pindai nilai manifest untuk woff2 dari css/fonts/ (bila Vite
// mengubah bentuk assets di masa depan). Kedua jalur HANYA mengambil woff2.
let fonts = (Array.isArray(entry.assets) ? entry.assets : []).filter((f) => f.endsWith('.woff2'));
if (fonts.length === 0) {
  fonts = Object.values(viteManifest)
    .filter((v) => v && typeof v.file === 'string' && v.file.endsWith('.woff2'))
    .map((v) => v.file);
}
if (fonts.length === 0) fail('tidak ada font woff2 di dist/.vite/manifest.json');

// --- 3. Daftar precache SHELL-ONLY ------------------------------------------
// Sumber daftar: R1 §8.1 + R9 §3 (entry chunk, CSS bundle, font woff2,
// index.html, offline.html, manifest.webmanifest, ikon PWA).
// URL RELATIF (tanpa leading '/'): cache.addAll menyelesaikannya terhadap
// URL sw.js — benar di root produksi maupun subpath preview (D-PWA-03).
// sw.js sendiri TIDAK masuk precache (self-reference, R5 §2.3e).
const STATIC_SHELL = [
  'index.html',
  'offline.html',
  'offline.js', // skrip halaman offline (RED1-09: dipindah dari inline agar lolos CSP enforcing)
  'manifest.webmanifest',
  'favicon.svg',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];
const PRECACHE = [
  ...STATIC_SHELL,
  entry.file, // entry chunk shell (satu file, 15 modul + manifest.js)
  ...entry.css, // bundle CSS (satu file)
  ...fonts, // font woff2
];

// Guardrail keras (R12): daftar ini WAJIB shell-only. Assert eksplisit:
// - tidak ada chunk tool (manifest berisi 1.299 chunk — semuanya terlarang)
// - tidak ada sw.js / sw-*.js (self-reference)
// - tidak ada URL absolut / cross-origin
// - tidak ada duplikat, jumlah entri wajar (shell = belasan, bukan ratusan)
const seen = new Set();
for (const url of PRECACHE) {
  if (seen.has(url)) fail(`duplikat di daftar precache: ${url}`);
  seen.add(url);
  if (url.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(url)) {
    fail(`URL precache harus relatif, bukan absolut: ${url}`);
  }
  if (/(^|\/)sw(-[^/]*)?\.js$/.test(url)) {
    fail(`sw.js dilarang masuk precache-nya sendiri: ${url}`);
  }
  if (url.includes('/tools/') || url.startsWith('tools/')) {
    fail(`GUARDRAIL: chunk tool masuk precache: ${url}`);
  }
}
if (PRECACHE.length > 20) {
  fail(`GUARDRAIL: precache ${PRECACHE.length} entri — shell seharusnya belasan, periksa filter`);
}
// Tiap URL wajib ada di disk dist/ (R5 §2.3d): mencegah install SW gagal
// total karena satu URL 404 (cache.addAll all-or-nothing).
let totalBytes = 0;
const rows = [];
for (const url of PRECACHE) {
  const abs = path.join(DIST, url);
  if (!fs.existsSync(abs)) fail(`file precache tidak ada di dist/: ${url}`);
  const size = fs.statSync(abs).size;
  totalBytes += size;
  rows.push({ url, size });
}

// --- 4. Injeksi ke dist/sw.js ------------------------------------------------
const swPath = path.join(DIST, 'sw.js');
if (!fs.existsSync(swPath)) {
  fail('dist/sw.js hilang — pastikan public/sw.js ada sebelum `vite build`');
}
let sw = fs.readFileSync(swPath, 'utf8');
const hasVersionPlaceholder = sw.includes('__PWA_VERSION__');
const hasManifestPlaceholder = sw.includes('__PRECACHE_MANIFEST__');
if (!hasVersionPlaceholder && !hasManifestPlaceholder) {
  // Idempotensi: sudah terinjeksi. Terima hanya bila versinya sama dengan
  // VERSION saat ini; bila versi lama, itu dist basi — vite build ulang.
  if (sw.includes(`'${VERSION}'`) && !sw.includes('__PWA') && !sw.includes('__PRECACHE')) {
    console.log(`gen-sw-precache: dist/sw.js sudah terinjeksi v${VERSION} — no-op.`);
    process.exit(0);
  }
  fail('dist/sw.js tidak mengandung placeholder DAN bukan hasil injeksi v' + VERSION);
}
if (hasVersionPlaceholder !== hasManifestPlaceholder) {
  fail('dist/sw.js hanya punya satu dari dua placeholder — template public/sw.js rusak');
}
sw = sw.split('__PWA_VERSION__').join(VERSION);
sw = sw.split('__PRECACHE_MANIFEST__').join(JSON.stringify(PRECACHE, null, 2));
if (sw.includes('__PWA') || sw.includes('__PRECACHE')) {
  fail('placeholder __PWA* tersisa di dist/sw.js setelah injeksi');
}
if (!sw.includes('const PRECACHE = [')) {
  fail('dist/sw.js tidak mengandung `const PRECACHE = [...]` setelah injeksi — template rusak');
}
fs.writeFileSync(swPath, sw);

// --- Laporan -----------------------------------------------------------------
console.log(`gen-sw-precache: v${VERSION} — ${PRECACHE.length} entri precache, ${totalBytes} byte total:`);
for (const { url, size } of rows) console.log(`  ${String(size).padStart(7)}  ${url}`);
console.log(`gen-sw-precache: OK — dist/sw.js terinjeksi (precache adip-tools-precache-${VERSION}).`);
