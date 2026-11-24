#!/usr/bin/env node
/* v6.12: bangkitkan ulang js/manifest.js dari meta tiap file tool.
   Sumber kebenaran = export const meta di js/tools/<cat>/<id>.js.
   Jalankan: node scripts/sync-manifest.js [version] [--no-cascade]

   Versi: argumen eksplisit menang; tanpa argumen, pakai VERSION yang sudah
   tertulis di js/manifest.js (bila ada), lalu VERSION di scripts/split-tools.py.
   (Dulu: fallback hardcoded '5.2.0' — berbahaya, sekali jalan tanpa argumen
   VERSION manifest turun ke 5.2.0 dan semua ?v= ikut kacau.)

   Cascade (default AKTIF): setelah manifest ditulis, ketiga generator turunan
   dijalankan berurutan — gen-tools-md.py, gen-sitemap.js, gen-llms-txt.js —
   supaya TOOLS.md, sitemap.xml, dan llms.txt selalu sinkron dengan manifest
   (bug pipeline v6.11.x: bump-version.py hanya me-regenerate manifest +
   TOOLS.md, llms.txt tertinggal di 6.11.0). Pakai --no-cascade bila hanya
   manifest yang mau ditulis.

   v6.22.0 (S-F6): cap `since` untuk tool BARU.
   Aturan: `since` tetap dibaca dari meta tool bila ada (sumber kebenaran).
   Bila meta tidak menulis `since`, sync membandingkan dengan manifest
   rilis sebelumnya (js/manifest.js yang masih di disk sebelum ditulis
   ulang): tool yang BELUM ADA di manifest lama = tool baru di rilis ini,
   dicap since = VERSION. Tool lama yang sudah ada di manifest lama tapi
   tanpa since TIDAK dicap (415 tool per audit S-A8 — mencap mereka
   6.22.0 berarti berbohong soal riwayat). Bila meta kehilangan `since`
   yang dulu tercatat di manifest lama, cap lama dipertahankan + peringatan
   (jangan hapus riwayat diam-diam). Bila manifest lama tidak ada / tidak
   bisa dibaca / versinya lebih baru dari VERSION / kosong, TIDAK ADA
   pencapan sama sekali (lebih baik tanpa cap daripada cap salah).

   v6.22.0 (S-U8): field `online` + `dataValidUntil`.
   - `online` (boolean, opsional): tool mendeklarasikan `online: true` di
     meta bila fungsi intinya butuh jaringan (fetch/API/AI/pustaka CDN).
     Sync hanya menulis key ini bila nilainya true; `online: false` atau
     tanpa flag artinya sama (bisa offline) dan TIDAK ditulis ke manifest,
     supaya manifest tetap ringkas. Tipe selain boolean = gagal cepat.
   - `dataValidUntil` (string tanggal ISO YYYY-MM-DD, opsional): tanggal
     terakhir data berkala di tool itu masih berlaku (mis. tarif PLN/BBM
     "2026-12-31"). Format salah atau tanggal kalender tidak valid =
     gagal cepat. Tanggal yang sudah lewat TIDAK menggagalkan sync
     (check-tools.js memberi peringatan) — data basi adalah utang konten,
     bukan kesalahan build.
   Kedua field disalin dari meta apa adanya (meta sumber kebenaran);
   tidak ada preservasi dari manifest lama seperti `since`.

   v6.22.0 (S-U5): manifest split — first load ramping.
   Selain js/manifest.js (TETAP PENUH, sumber kebenaran Node:
   check-tools, gen-llms-txt, gen-sitemap, gen-tools-md, harness),
   sync juga membangkitkan DUA file dari daftar `entries` yang SAMA:
   - js/manifest-boot.js — entri RAMPING (id, name, cat, icon, file
     + since/online/dataValidUntil bila ada; TANPA desc/keywords)
     + VERSION + loader malas loadManifestDetails(). Vite memetakan
     impor './manifest.js' ke file ini (resolve.alias di
     vite.config.mjs), jadi entry chunk browser tidak lagi menelan
     desc/keywords 1.262 tool di first load (hemat ~69 KB gzip).
   - js/manifest-details.js — detail id-keyed
     {"id": ["desc", "keywords"], ...}, dimuat malas sesudah boot
     lalu ditempel ke entri yang sama (merge-in-place).
   Ketiga file selalu dibangkitkan bersamaan dari `entries` yang
   sama — tidak mungkin versinya berbeda. js/manifest.js TIDAK
   berubah isinya dibanding sebelum split (byte-identical bila
   meta tidak berubah); verifikasi round-trip tugas 8 S-U5.
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { register } = require('node:module');

register('./strip-query-loader.mjs', pathToFileURL(__filename));

const JS = path.join(__dirname, '..', 'js');
const SCRIPTS = __dirname;

/* Banding semver x.y.z (sama seperti cmpSemver di js/beranda.js). */
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
function cmpSemver(a, b) {
  const pa = String(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

/* Tanggal ISO YYYY-MM-DD yang benar-benar ada di kalender
   (S-U8: menolak "2026-13-40" maupun "31-12-2026"). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function isValidISODate(s) {
  if (typeof s !== 'string' || !ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/* Manifest rilis sebelumnya (yang masih di disk), diparse baris per baris
   tanpa import (hindari cache modul + aman bila file rusak sebagian).
   Kembalikan null bila file tidak ada. */
function loadPreviousManifest() {
  const mf = path.join(JS, 'manifest.js');
  if (!fs.existsSync(mf)) return null;
  const src = fs.readFileSync(mf, 'utf-8');
  const ver = (src.match(/export const VERSION = '([^']+)'/) || [])[1] || null;
  const byId = new Map();
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('{"id":')) continue;
    try { const e = JSON.parse(t.replace(/,$/, '')); byId.set(e.id, e); }
    catch { /* baris bukan entri JSON — abaikan */ }
  }
  return { version: ver, byId };
}

/* Versi saat ini: dari manifest.js yang sudah ada, lalu split-tools.py. */
function currentVersion() {
  const mf = path.join(JS, 'manifest.js');
  if (fs.existsSync(mf)) {
    const m = fs.readFileSync(mf, 'utf-8').match(/export const VERSION = '([^']+)'/);
    if (m) return m[1];
  }
  const sp = path.join(SCRIPTS, 'split-tools.py');
  if (fs.existsSync(sp)) {
    const m = fs.readFileSync(sp, 'utf-8').match(/^VERSION = '([^']+)'/m);
    if (m) return m[1];
  }
  return null;
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const NO_CASCADE = process.argv.includes('--no-cascade');
const VERSION = args[0] || currentVersion();
if (!VERSION) {
  console.error('FATAL: versi tidak diberikan dan tidak bisa dibaca dari js/manifest.js maupun scripts/split-tools.py — jalankan dengan argumen versi, mis. node scripts/sync-manifest.js 6.12.0');
  process.exit(1);
}

async function main() {
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) files.push(p);
    }
  };
  walk(path.join(JS, 'tools'));

  /* Manifest rilis sebelumnya = pembanding "tool baru vs tool lama".
     Hanya bisa dipakai bila: file ada, ada entri yang terparse, dan
     versinya tidak lebih baru dari VERSION yang ditulis (bila lebih
     baru, kita sedang downgrade — pencapan dimatikan total). */
  const prev = loadPreviousManifest();
  let prevUsable = Boolean(prev && prev.version && prev.byId.size > 0)
    && cmpSemver(prev.version, VERSION) <= 0;
  if (prev && !prevUsable) {
    console.warn(`PERINGATAN: manifest lama (VERSION=${prev.version || '?'}, ${prev.byId.size} entri) TIDAK bisa dipakai sebagai pembanding — pencapan since untuk tool baru DIMATIKAN pada jalan ini; tool tanpa since tetap tanpa since.`);
  } else if (!prev) {
    console.warn('PERINGATAN: js/manifest.js lama tidak ditemukan — pencapan since untuk tool baru DIMATIKAN pada jalan ini; tool tanpa since tetap tanpa since.');
  }
  const stamped = [];    // tool baru, dicap since = VERSION
  const preserved = [];  // meta kehilangan since, cap lama dipertahankan
  const stillMissing = []; // tool lama tanpa since (jujur: tetap kosong)
  let onlineCount = 0;   // S-U8: entri ber-online:true
  let freshCount = 0;    // S-U8: entri ber-dataValidUntil

  const entries = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(f).href);
    if (!mod.meta || !mod.meta.id) throw new Error('meta hilang: ' + f);
    const rel = path.relative(JS, f).replace(/\\/g, '/');
    const [,, cat, file] = rel.match(/^(tools)\/([^/]+)\/([^/]+)$/) || [];
    if (!cat) throw new Error('path tak dikenal: ' + rel);
    const id = file.replace(/\.js$/, '');
    if (mod.meta.id !== id) throw new Error(`meta.id ${mod.meta.id} != ${id}`);
    if (mod.meta.cat !== cat) throw new Error(`meta.cat ${mod.meta.cat} != folder ${cat} (${id})`);
    // Cap since: meta menang; bila meta kosong, putuskan dari manifest lama.
    let since = null;
    if (mod.meta.since) {
      if (!SEMVER_RE.test(mod.meta.since)) throw new Error(`${id}: meta.since '${mod.meta.since}' bukan semver x.y.z`);
      if (cmpSemver(mod.meta.since, VERSION) > 0) throw new Error(`${id}: meta.since ${mod.meta.since} lebih baru dari VERSION ${VERSION}`);
      since = mod.meta.since;
    } else if (prevUsable && prev.byId.has(id) && prev.byId.get(id).since) {
      since = prev.byId.get(id).since; // cap lama dipertahankan, bukan dihapus
      preserved.push(id);
    } else if (prevUsable && !prev.byId.has(id)) {
      since = VERSION; // belum ada di rilis sebelumnya = BARU di rilis ini
      stamped.push(id);
    } else {
      stillMissing.push(id); // tool lama tanpa since — dibiarkan kosong (jujur)
    }
    // S-U8: `online` + `dataValidUntil` disalin dari meta (bila ada).
    // Logika cap `since` di atas TIDAK disentuh.
    let online = false;
    if ('online' in mod.meta) {
      if (typeof mod.meta.online !== 'boolean') throw new Error(`${id}: meta.online harus boolean (true/false), bukan ${typeof mod.meta.online}`);
      online = mod.meta.online;
    }
    let dataValidUntil = null;
    if (mod.meta.dataValidUntil != null) {
      if (!isValidISODate(mod.meta.dataValidUntil)) throw new Error(`${id}: meta.dataValidUntil '${mod.meta.dataValidUntil}' bukan tanggal ISO YYYY-MM-DD yang valid`);
      dataValidUntil = mod.meta.dataValidUntil;
    }
    entries.push({
      id, name: mod.meta.name, cat, icon: mod.meta.icon, desc: mod.meta.desc,
      keywords: mod.meta.keywords || '', file: rel,
      ...(since ? { since } : {}),
      ...(online ? { online: true } : {}),
      ...(dataValidUntil ? { dataValidUntil } : {}),
    });
    if (online) onlineCount++;
    if (dataValidUntil) freshCount++;
  }
  entries.sort((a, b) => (a.cat < b.cat ? -1 : a.cat > b.cat ? 1 : a.id < b.id ? -1 : 1));

  const out = [
    `/* ADIP Tools v${VERSION} — manifest metadata (GENERATED, jangan edit manual).`,
    '   Dibangkitkan oleh scripts/sync-manifest.js dari meta tiap file tool.',
    '   Berisi metadata ringan untuk home/search/palette; kode tool di-load on-demand.',
    '*/',
    `export const VERSION = '${VERSION}';`,
    'export const manifest = [',
    ...entries.map(m => '  ' + JSON.stringify(m) + ','),
    '];',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(JS, 'manifest.js'), out);
  console.log(`manifest.js ditulis: ${entries.length} entri, VERSION=${VERSION}`);
  if (stamped.length) console.log(`since: ${stamped.length} tool baru dicap ${VERSION}: ${stamped.slice(0, 20).join(', ')}${stamped.length > 20 ? ` (+${stamped.length - 20} lagi)` : ''}`);
  if (preserved.length) console.log(`since: ${preserved.length} tool dipertahankan cap lamanya (meta kehilangan since): ${preserved.slice(0, 20).join(', ')}${preserved.length > 20 ? ` (+${preserved.length - 20} lagi)` : ''}`);
  if (stillMissing.length) console.log(`since: ${stillMissing.length} tool lama tetap tanpa since (jujur, bukan ditebak) — lihat audit S-A8 untuk rencana backfill.`);
  console.log(`online: ${onlineCount} tool ber-online:true (butuh jaringan); dataValidUntil: ${freshCount} tool ber-tanggal kesegaran.`);

  /* S-U5 (v6.22.0, manifest split): bangkitkan manifest-boot.js
     (entri ramping + loader malas) dan manifest-details.js
     (detail id-keyed) dari daftar `entries` yang SAMA — jadi
     ketiganya selalu konsisten (id, urutan, VERSION sama).
     Urutan key entri ramping = urutan key entri penuh minus
     desc/keywords, supaya diff antar-file mudah dibaca. */
  const bootEntries = entries.map((m) => {
    const e = { id: m.id, name: m.name, cat: m.cat, icon: m.icon, file: m.file };
    if (m.since) e.since = m.since;
    if (m.online === true) e.online = true;
    if (m.dataValidUntil) e.dataValidUntil = m.dataValidUntil;
    return e;
  });
  const bootOut = [
    `/* ADIP Tools v${VERSION} — manifest BOOT ramping (GENERATED, jangan edit manual).`,
    '   Dibangkitkan oleh scripts/sync-manifest.js bersamaan dengan js/manifest.js',
    '   (sumber kebenaran Node, TETAP PENUH) dan js/manifest-details.js.',
    '   Entri di sini TANPA desc/keywords supaya entry chunk browser kecil di',
    '   first load; detail dimuat malas oleh loadManifestDetails() di bawah',
    '   lalu ditempel ke entri yang SAMA (merge-in-place) — semua pemegang',
    '   referensi manifest langsung melihat data penuh tanpa ganti array.',
    '   Vite memetakan impor \'./manifest.js\' ke file ini (resolve.alias).',
    '*/',
    `export const VERSION = '${VERSION}';`,
    'export const manifest = [',
    ...bootEntries.map((m) => '  ' + JSON.stringify(m) + ','),
    '];',
    '',
    '/* ---- pemuatan malas detail (S-U5, v6.22.0, manifest split) ----',
    '   Pola safety yang sama seperti S-F5 di core.js: timeout eksplisit,',
    '   tanpa retry otomatis, gagal = data ramping tetap jalan (pencarian',
    '   nama-saja, deskripsi kosong) — shell tidak pernah mati karena',
    '   chunk detail gagal dimuat. */',
    'export let manifestDetailsVersion = 0;',
    'let detailsPromise = null;',
    'let detailsFailedAt = 0;',
    'const detailsListeners = new Set();',
    'const DETAILS_TIMEOUT_MS = 10000;',
    'const DETAILS_RETRY_COOLDOWN_MS = 30000;',
    '',
    '/* true bila manifest masih ramping (belum ada desc/keywords). */',
    'export function needsDetails(man) {',
    "  return Array.isArray(man) && man.length > 0 && !('desc' in man[0]);",
    '}',
    '',
    'function withTimeout(promise, ms) {',
    '  let timer;',
    '  const timeout = new Promise((_, reject) => {',
    "    timer = setTimeout(() => reject(new Error('manifest-details timeout')), ms);",
    '  });',
    '  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));',
    '}',
    '',
    '/* Muat js/manifest-details.js lalu tempel desc/keywords ke entri',
    '   yang SAMA (merge-in-place). Mengembalikan true bila detail',
    '   berhasil ditempel, false bila gagal (jaringan mati, chunk',
    '   hilang, timeout). TIDAK PERNAH reject: pemanggil cukup cek',
    '   nilai baliknya. Panggilan bersamaan berbagi satu promise;',
    '   sesudah gagal, ada jeda 30 dtk sebelum boleh coba lagi',
    '   (tanpa loop retry otomatis). */',
    'export function loadManifestDetails() {',
    '  if (!needsDetails(manifest)) return Promise.resolve(true);',
    '  if (detailsPromise) return detailsPromise;',
    '  if (detailsFailedAt && Date.now() - detailsFailedAt < DETAILS_RETRY_COOLDOWN_MS) {',
    '    return Promise.resolve(false);',
    '  }',
    '  detailsPromise = (async () => {',
    '    try {',
    "      const mod = await withTimeout(import('./manifest-details.js'), DETAILS_TIMEOUT_MS);",
    '      const details = (mod && mod.manifestDetails) || {};',
    '      const byId = new Map(manifest.map((m) => [m.id, m]));',
    '      let merged = 0;',
    '      for (const [id, d] of Object.entries(details)) {',
    '        const m = byId.get(id);',
    '        if (!m || !Array.isArray(d)) continue;',
    '        m.desc = d[0] || \'\';',
    '        m.keywords = d[1] || \'\';',
    '        merged++;',
    '      }',
    '      if (merged > 0) {',
    '        manifestDetailsVersion += 1;',
    '        /* Beri tahu pendengar SETELAH versi naik (di dalam try,',
    '           tapi tiap pendengar dibungkus sendiri — pendengar yang',
    '           melempar tidak boleh membuat merge yang sukses',
    '           terbaca gagal). */',
    '        const listeners = [...detailsListeners];',
    '        detailsListeners.clear();',
    '        for (const cb of listeners) { try { cb(); } catch { /* abaikan */ } }',
    '      }',
    '      return merged > 0;',
    '    } catch {',
    '      detailsFailedAt = Date.now();',
    '      return false;',
    '    } finally {',
    '      detailsPromise = null;',
    '    }',
    '  })();',
    '  return detailsPromise;',
    '}',
    '',
    '/* Daftarkan cb yang dipanggil sekali begitu detail berhasil',
    '   ditempel (atau langsung, bila sudah menempel). TIDAK memulai',
    '   pemuatan — pemicu tetap di tangan pemanggil',
    '   loadManifestDetails(). Dipakai seo-share.js yang hanya perlu',
    '   sinkronisasi ulang meta, tanpa berhak memulai fetch 198 KB',
    '   di tengah boot. Mengembalikan fungsi batal daftar. */',
    'export function onManifestDetails(cb) {',
    "  if (typeof cb !== 'function') return () => {};",
    '  if (!needsDetails(manifest)) { cb(); return () => {}; }',
    '  detailsListeners.add(cb);',
    '  return () => { detailsListeners.delete(cb); };',
    '}',
    '',
    '/* TIDAK ADA auto-load di sini — DENGAN SENGAJA (S-U5).',
    '   Percobaan pertama memakai requestIdleCallback (timeout 2 dtk)',
    '   sebagai pemicu otomatis, dan TERUKUR merugikan: chunk detail',
    '   (198 KB) tiba di ~900 ms dan parse+merge-nya memblokir main',
    '   thread 805 ms — TEPAT sebelum kerja tunda afterFirstPaint —',
    '   sehingga rail Populer/Spotlight terisi ~800 ms lebih lambat',
    '   (diagnostik Playwright S-U5: popFill 3.182 ms vs 2.379 ms',
    '   baseline). Detail dimuat BERDASARKAN PERMINTAAN saja:',
    '   - pencarian pertama (buildIndex di search-plus.js),',
    '   - render rail beranda (beranda.js: re-render sesudah detail),',
    '   - isi deskripsi kartu (components.js: ensureDetailsForCards,',
    '     dipanggil tiap ganti rute kartu lewat enhanceRoute).',
    '   Modul yang hanya perlu TAHU saat detail tiba (seo-share.js:',
    '   sinkronisasi ulang meta) memakai onManifestDetails() —',
    '   berlangganan tanpa memicu fetch.',
    '   Semua pemicu berbagi satu promise (deduplikasi di atas) —',
    '   tidak ada fetch ganda. */',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(JS, 'manifest-boot.js'), bootOut);
  const detailsOut = [
    `/* ADIP Tools v${VERSION} — detail manifest (GENERATED, jangan edit manual).`,
    '   Dibangkitkan oleh scripts/sync-manifest.js bersamaan dengan js/manifest.js',
    '   dan js/manifest-boot.js. Id-keyed (bukan paralel indeks) supaya merge',
    '   tahan urutan: id tak dikenal diabaikan, id yang hilang tetap ramping.',
    '   Dimuat malas oleh loadManifestDetails() di manifest-boot.js; BUKAN',
    '   precache (lihat keputusan strategi precache S-U5 di gen-sw-precache.js).',
    '*/',
    'export const manifestDetails = {',
    ...entries.map((m) => '  ' + JSON.stringify(m.id) + ': ' + JSON.stringify([m.desc, m.keywords || '']) + ','),
    '};',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(JS, 'manifest-details.js'), detailsOut);
  console.log(`manifest split (S-U5): manifest-boot.js ${bootEntries.length} entri ramping + manifest-details.js ${entries.length} detail ditulis.`);

  if (!NO_CASCADE) {
    // Cascade: output turunan WAJIB ikut regenerate dari manifest baru,
    // kalau tidak versi/jumlahnya tertinggal (bug pipeline v6.11.x).
    execFileSync('python3', [path.join(SCRIPTS, 'gen-tools-md.py')], { stdio: 'inherit' });
    execFileSync('node', [path.join(SCRIPTS, 'gen-sitemap.js')], { stdio: 'inherit' });
    execFileSync('node', [path.join(SCRIPTS, 'gen-llms-txt.js')], { stdio: 'inherit' });
    console.log('cascade: TOOLS.md + sitemap.xml + llms.txt diregenerate dari manifest baru');
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
