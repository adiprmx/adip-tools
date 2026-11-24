#!/usr/bin/env node
/* Cek konsistensi struktur Fase 2 (aturan #6 kontrak kerapian):
   - tiap tool = 1 file js/tools/<cat>/<id>.js
   - manifest.js sinkron dengan file (tidak ada yatim/duplikat)
   - tiap file tool export { meta, render }
   - semua import statis bisa di-resolve
   - (v6.22.0, S-F6) metadata: format since, desc/keywords/icon kosong,
     desc terlalu pendek/panjang, keywords terlalu sedikit, kunci `file`
     liar di meta. Aturan: yang TIDAK ADA hari ini (desc/keywords/icon
     kosong, since format salah, since > VERSION, since manifest beda
     dari meta) = pelanggaran BARU -> GAGAL. Yang SUDAH ADA sebagai
     kesenjangan lama (415 tanpa since, 34 desc <30 karakter, 9 desc
     >150, 18 keywords <4, 11 meta.file) = PERINGATAN + ringkasan,
     tidak menggagalkan. Alasan: menggagalkan build untuk utang lama
     berarti CI merah sebelum ada yang berubah; penegakan untuk tool
     baru terjadi di sync-manifest.js (tool baru otomatis dicap since).
   - (v6.22.0, S-U8) metadata lanjutan: `online` harus boolean bila ada
     (dan manifest wajib cocok dengan meta — bila beda, sync belum jalan);
     `dataValidUntil` harus tanggal ISO YYYY-MM-DD yang valid bila ada
     (dan manifest wajib cocok dengan meta). `dataValidUntil` yang sudah
     lewat = PERINGATAN, bukan gagal (data basi adalah utang konten,
     bukan kesalahan build). Sesudah ronde S-U8, kesenjangan lama di
     atas tinggal tanpa-since (415) + desc >150 (9); desc <30, keywords
     <4, dan meta.file sudah 0.
   Jalankan: node scripts/check-tools.js
*/
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');
const { register } = require('node:module');

// Abaikan ?v= cache-buster saat import di Node (browser menanganinya native).
register('./strip-query-loader.mjs', pathToFileURL(__filename));

const JS = path.join(__dirname, '..', 'js');
let errors = [];
// Peringatan metadata (S-F6): dihitung, diringkas di akhir, tidak menggagalkan.
const warn = {
  noSince: [],       // legacy: tanpa since (415 per audit S-A8)
  descShort: [],     // desc < 30 karakter (34 di S-A8; 0 sesudah S-U8)
  descLong: [],      // desc > 150 karakter (9; angka 58 di S-A8 memakai ambang 120)
  keywordsThin: [],  // keywords < 4 (18 di S-A8; 0 sesudah S-U8)
  metaFile: [],      // kunci liar `file` di meta (11 di S-A8; 0 sesudah S-U8)
  dataExpired: [],   // S-U8: dataValidUntil sudah lewat (peringatan, bukan gagal)
};
const SEMVER_RE = /^\d+\.\d+\.\d+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// S-U8: tanggal ISO YYYY-MM-DD yang benar-benar ada di kalender.
function isValidISODate(s) {
  if (typeof s !== 'string' || !ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
function cmpSemver(a, b) {
  const pa = String(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function main() {
  // 1. Muat manifest
  const { manifest, VERSION } = await import('../js/manifest.js');
  console.log(`manifest: ${manifest.length} tools, VERSION=${VERSION}`);

  // 2. Tidak ada id duplikat
  const ids = manifest.map((m) => m.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) errors.push('id duplikat: ' + [...new Set(dup)].join(', '));

  // 3. Tiap entri manifest -> file ada; tiap file -> ada di manifest
  const filesOnDisk = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js')) filesOnDisk.push(p);
    }
  };
  walk(path.join(JS, 'tools'));
  const rel = (p) => path.relative(JS, p).replace(/\\/g, '/');

  const manifestFiles = new Set(manifest.map((m) => m.file));
  for (const m of manifest) {
    const full = path.join(JS, m.file);
    if (!fs.existsSync(full)) errors.push(`manifest yatim (file hilang): ${m.id} -> ${m.file}`);
    if (m.file !== `tools/${m.cat}/${m.id}.js`) errors.push(`path tidak ikut konvensi: ${m.id} -> ${m.file}`);
  }
  for (const f of filesOnDisk) {
    if (!manifestFiles.has(rel(f))) errors.push('file yatim (tanpa manifest): ' + rel(f));
  }

  // 4. Import tiap tool, cek export { meta, render }
  let ok = 0;
  for (const m of manifest) {
    try {
      const mod = await import(pathToFileURL(path.join(JS, m.file)).href);
      if (!mod.meta || !mod.render) {
        errors.push(`${m.id}: export meta/render hilang`);
        continue;
      }
      if (mod.meta.id !== m.id) errors.push(`${m.id}: meta.id != manifest (${mod.meta.id})`);
      if (typeof mod.render !== 'function') errors.push(`${m.id}: render bukan fungsi`);
      // 4b. Validasi metadata (S-F6). Aturan gagal vs peringatan lihat header.
      const meta = mod.meta;
      if (!meta.desc) errors.push(`${m.id}: desc kosong`);
      else if (meta.desc.length < 30) warn.descShort.push(m.id);
      else if (meta.desc.length > 150) warn.descLong.push(m.id);
      if (!meta.keywords) errors.push(`${m.id}: keywords kosong`);
      else {
        const n = String(meta.keywords).split(',').map((s) => s.trim()).filter(Boolean).length;
        if (n < 4) warn.keywordsThin.push(m.id);
      }
      if (!meta.icon) errors.push(`${m.id}: icon kosong`);
      if (meta.since) {
        if (!SEMVER_RE.test(meta.since)) errors.push(`${m.id}: since '${meta.since}' bukan semver x.y.z`);
        else if (cmpSemver(meta.since, VERSION) > 0) errors.push(`${m.id}: since ${meta.since} lebih baru dari VERSION ${VERSION}`);
        else if (m.since !== meta.since) errors.push(`${m.id}: since manifest (${m.since || '-'}) != meta (${meta.since}) — jalankan sync-manifest`);
      } else {
        warn.noSince.push(m.id); // legacy; penegakan tool baru ada di sync-manifest
      }
      if (meta.file) warn.metaFile.push(m.id); // kunci liar, sync mengabaikannya
      // 4c. Validasi metadata (S-U8): online + dataValidUntil.
      if ('online' in meta && typeof meta.online !== 'boolean') {
        errors.push(`${m.id}: online harus boolean (true/false), bukan ${typeof meta.online}`);
      }
      // Manifest hanya menulis online bila true; tanpa key = false. Bila
      // meta dan manifest beda nilai boolean-nya, sync belum jalan.
      if (Boolean(m.online) !== Boolean(meta.online)) {
        errors.push(`${m.id}: online manifest (${m.online ? 'true' : '-'}) != meta (${meta.online ? 'true' : '-'}) — jalankan sync-manifest`);
      }
      if (meta.dataValidUntil != null) {
        if (!isValidISODate(meta.dataValidUntil)) {
          errors.push(`${m.id}: dataValidUntil '${meta.dataValidUntil}' bukan tanggal ISO YYYY-MM-DD yang valid`);
        } else if (meta.dataValidUntil < new Date().toISOString().slice(0, 10)) {
          warn.dataExpired.push(m.id); // tanggal lewat = peringatan, bukan gagal
        }
      }
      if ((m.dataValidUntil || null) !== (meta.dataValidUntil || null)) {
        errors.push(`${m.id}: dataValidUntil manifest (${m.dataValidUntil || '-'}) != meta (${meta.dataValidUntil || '-'}) — jalankan sync-manifest`);
      }
      ok++;
    } catch (e) {
      errors.push(`${m.id}: gagal import — ${e.message}`);
    }
  }
  console.log(`import tool: ${ok}/${manifest.length} OK`);

  // 5. core.js di-check via import. app.js TIDAK bisa di-import di Node
  //    (top-level memakai `document` — terverifikasi 15 Nov 2026:
  //    "document is not defined"), jadi sintaks file shell (app.js, fx.js,
  //    ffmpeg-loader.js, ffmpeg-worker/*, modul P0-C, beranda.js,
  //    search-plus.js) di-check via `node --check`
  //    dengan --input-type=module lewat stdin. WAJIB cara ini: `node --check
  //    file.js` polos TIDAK BISA dipercaya untuk ES module (pernah lolos
  //    syntax error nyata, pelajaran 1 Okt 2026); --input-type=module
  //    memaksa parse goal module dan teruji gagal pada cuplikan rusak.
  await import('../js/core.js');
  console.log('core.js import OK');
  const { spawnSync } = require('node:child_process');
  const shellFiles = ['app.js', 'fx.js', 'ffmpeg-loader.js',
    'ffmpeg-worker/worker.js', 'ffmpeg-worker/const.js',
    'ffmpeg-worker/errors.js',
    'routes.js', 'catalog.js', 'store.js', 'backup.js', 'supabase.js', 'shell-ui.js',
    'beranda.js', 'search-plus.js', 'onboarding.js', 'components.js',
    'regex-aman.js', 'dxf.js', 'model-3d.js', 'tokenizer-js.js',
    'gif-encoder.js', 'mouse-sens.js', 'screen-time.js', 'wrapped.js',
    'tarif-pln.js', 'harga-bbm.js'];
  for (const sf of shellFiles) {
    const full = path.join(JS, sf);
    if (!fs.existsSync(full)) { errors.push(`file shell hilang: js/${sf}`); continue; }
    const r = spawnSync(process.execPath,
      ['--check', '--input-type=module'],
      { input: fs.readFileSync(full), encoding: 'utf8' });
    if (r.status !== 0) {
      const first = (r.stderr || '').split('\n').slice(0, 3).join(' | ');
      errors.push(`js/${sf}: syntax error — ${first}`);
    }
  }
  console.log(`cek sintaks shell: ${shellFiles.length} file`);

  // 6. (v6.14.0+, P0-A) TIDAK BOLEH ada ?v=x.y.z tersisa di js/ + index.html:
  //    sistem cache-buster manual DICABUT, diganti hash nama file Vite.
  //    Kemunculan ?v= angka berarti ada file yang belum dimigrasi atau
  //    generator (split-tools.py) yang belum diupdate. Regex hanya
  //    menangkap ?v= diikuti angka x.y.z, jadi teks 'watch?v=' (YouTube)
  //    otomatis dilewati.
  const stale = new Map(); // versi ?v= yang tersisa -> {count, files:Set}
  const scanV = (file) => {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\?v=(\d+\.\d+\.\d+)/g)) {
      const e = stale.get(m[1]) || { count: 0, files: new Set() };
      e.count++;
      e.files.add(path.relative(path.join(JS, '..'), file).replace(/\\/g, '/'));
      stale.set(m[1], e);
    }
  };
  const allJs = [];
  const walkJs = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walkJs(p);
      else if (e.name.endsWith('.js')) allJs.push(p);
    }
  };
  walkJs(JS);
  allJs.forEach(scanV);
  scanV(path.join(JS, '..', 'index.html'));
  for (const [v, e] of [...stale.entries()].sort()) {
    errors.push(`?v= tersisa (sistem ?v= dicabut v6.14.0): ?v=${v} (${e.count}x di ${e.files.size} file, cth: ${[...e.files].slice(0, 3).join(', ')})`);
  }
  console.log(`cek ?v=: ${stale.size ? [...stale.keys()].join(', ') + ' (TERSISA — HARUS DIHAPUS)' : 'tidak ada ?v= (sistem hash Vite aktif)'}`);

  // 7. (v6.14.0+, P0-A, KEBALIKAN aturan lama) Import core.js/manifest.js/
  //    ffmpeg-loader.js TIDAK BOLEH membawa query apa pun: di Vite,
  //    `core.js?v=...` adalah modul BERBEDA dari `core.js` (instans ganda:
  //    state seperti leaveCbs/actx terbelah diam-diam). Regex dijangkar ke
  //    awal statement `import` (flag m): tanpa jangkar, contoh import di
  //    dalam komentar blok (core.js:6) ikut ke-match dan jadi false
  //    positive (T05, 15 Nov 2026).
  for (const f of allJs) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/^import\s+[\s\S]*?from\s+['"]([^'"]*(?:core|manifest|ffmpeg-loader)\.js)([^'"]*)['"]/gm)) {
      if (m[2].startsWith('?')) {
        errors.push(`${rel(f)}: import ${m[1]} membawa query '${m[2]}' (instans modul ganda di Vite — hapus query-nya)`);
      }
    }
  }

  // 8. (v6.23.0, S-B15/Q3-03c; diperluas S-B16/Q3b) TRIPWIRE keamanan tool
  //    Cek Username — BUKAN pemindai keamanan umum (yang itu tetap utang,
  //    lihat catatan di bawah). Empat guard runtime yang menutup temuan
  //    Red-2/Red-3 WAJIB tetap ada di js/tools/liveapi/cek-username.js:
  //      - hostCocok(apiDomain, domain): Q3-01 — apiDomain yang
  //        bertentangan dengan domain profil entri TIDAK di-fetch.
  //      - hostAdalahIP(: Q3-02 — host IP literal ditolak builder +
  //        entriSah (panggilan ada di domainSah/entriSah/kedua builder).
  //      - placeholderDiPathQuery(pola): Q3b-02 — {u} yang hanya di
  //        fragment (tidak pernah terkirim) ditolak kedua builder.
  //        (Tripwire memakai SELURUH pernyataan pemanggilan, bukan nama
  //        fungsi saja — definisi `function placeholderDiPathQuery(pola)`
  //        mengandung nama+parameter yang sama, sehingga tripwire nama
  //        saja tidak akan menyala bila pemanggilannya dihapus tapi
  //        definisinya tertinggal. Pelajaran S-B16 saat uji staging.)
  //      - hostAkhirCocok(r, entri.apiDomain): Q3b-03 — status respons
  //        akhir hanya dipercaya bila host URL akhirnya cocok apiDomain.
  //    Bila salah satu string hilang (mis. refactor yang tidak sengaja
  //    menghapus guard), check GAGAL dengan keras supaya penghapusannya
  //    jadi keputusan sadar — bukan kecelakaan diam-diam. Bila guard
  //    diimplementasi ulang dengan nama/cara lain, perbarui tripwire ini
  //    BERSAMAAN dengan refactor-nya (dan buktikan harness Q3 tetap hijau).
  //    CATATAN JUJUR (Q3-03): di luar tripwire ini, check-tools.js tetap
  //    0 pemeriksaan keamanan umum atas 1.262 tool lain (SR-4 S-B11):
  //    tidak ada pemindai innerHTML/URL/jalur data generik — menambahkan
  //    pemindai generik yang tidak banjir false positive adalah pekerjaan
  //    tersendiri (utang S-Q3/S-V, bukan satu baris grep).
  const cekUserFile = path.join(JS, 'tools', 'liveapi', 'cek-username.js');
  if (!fs.existsSync(cekUserFile)) {
    errors.push('tripwire Q3: js/tools/liveapi/cek-username.js hilang');
  } else {
    const srcCekUser = fs.readFileSync(cekUserFile, 'utf8');
    if (!srcCekUser.includes('hostCocok(apiDomain, domain)')) {
      errors.push('tripwire Q3-01: guard hostCocok(apiDomain, domain) HILANG dari js/tools/liveapi/cek-username.js (apiDomain yang bertentangan dengan domain profil akan di-fetch lagi — lihat fix/S-B15-blue2.md)');
    }
    if (!srcCekUser.includes('hostAdalahIP(')) {
      errors.push('tripwire Q3-02: guard hostAdalahIP( HILANG dari js/tools/liveapi/cek-username.js (host IP literal akan lolos lagi — lihat fix/S-B15-blue2.md)');
    }
    if (!srcCekUser.includes('if (!placeholderDiPathQuery(pola)) return null;')) {
      errors.push('tripwire Q3b-02: guard placeholderDiPathQuery(pola) HILANG dari js/tools/liveapi/cek-username.js ({u} hanya di fragment akan di-fetch lagi + "Ada" palsu — lihat fix/S-B16-blue3.md)');
    }
    if (!srcCekUser.includes('hostAkhirCocok(r, entri.apiDomain)')) {
      errors.push('tripwire Q3b-03: guard hostAkhirCocok(r, entri.apiDomain) HILANG dari js/tools/liveapi/cek-username.js (status redirect lintas-origin akan dipercaya lagi — lihat fix/S-B16-blue3.md)');
    }
  }

  if (errors.length) {
    console.log('\n❌ KEGAGALAN:');
    errors.forEach((e) => console.log(' - ' + e));
    process.exit(1);
  }
  // Ringkasan peringatan metadata (S-F6): kesenjangan lama, tidak menggagalkan.
  const sample = (arr) => (arr.length > 10 ? arr.slice(0, 10).join(', ') + ` (+${arr.length - 10} lagi)` : arr.join(', '));
  console.log('\nperingatan metadata (kesenjangan lama — tidak menggagalkan):');
  console.log(` - tanpa since: ${warn.noSince.length} tool (cth: ${sample(warn.noSince)})`);
  console.log(` - desc < 30 karakter: ${warn.descShort.length} tool (cth: ${sample(warn.descShort)})`);
  console.log(` - desc > 150 karakter: ${warn.descLong.length} tool (cth: ${sample(warn.descLong)})`);
  console.log(` - keywords < 4: ${warn.keywordsThin.length} tool (cth: ${sample(warn.keywordsThin)})`);
  console.log(` - kunci meta.file liar: ${warn.metaFile.length} tool (cth: ${sample(warn.metaFile)})`);
  console.log(` - dataValidUntil sudah lewat: ${warn.dataExpired.length} tool (cth: ${sample(warn.dataExpired)})`);
  console.log('\n✅ Semua cek konsistensi lolos.');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
