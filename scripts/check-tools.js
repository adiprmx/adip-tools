#!/usr/bin/env node
/* Cek konsistensi struktur Fase 2 (aturan #6 kontrak kerapian):
   - tiap tool = 1 file js/tools/<cat>/<id>.js
   - manifest.js sinkron dengan file (tidak ada yatim/duplikat)
   - tiap file tool export { meta, render }
   - semua import statis bisa di-resolve
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
      ok++;
    } catch (e) {
      errors.push(`${m.id}: gagal import — ${e.message}`);
    }
  }
  console.log(`import tool: ${ok}/${manifest.length} OK`);

  // 5. core.js di-check via import. app.js TIDAK bisa di-import di Node
  //    (top-level memakai `document` — terverifikasi 15 Nov 2026:
  //    "document is not defined"), jadi sintaks file shell (app.js, fx.js,
  //    ffmpeg-loader.js, ffmpeg-worker/*) di-check via `node --check`
  //    dengan --input-type=module lewat stdin. WAJIB cara ini: `node --check
  //    file.js` polos TIDAK BISA dipercaya untuk ES module (pernah lolos
  //    syntax error nyata, pelajaran 1 Okt 2026); --input-type=module
  //    memaksa parse goal module dan teruji gagal pada cuplikan rusak.
  await import('../js/core.js');
  console.log('core.js import OK');
  const { spawnSync } = require('node:child_process');
  const shellFiles = ['app.js', 'fx.js', 'ffmpeg-loader.js',
    'ffmpeg-worker/worker.js', 'ffmpeg-worker/const.js',
    'ffmpeg-worker/errors.js'];
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

  // 6. Semua ?v= cache-buster harus sama dengan VERSION manifest (gap 6:
  //    ?v= basi = cache basi + instans modul core.js ganda). Regex hanya
  //    menangkap ?v= diikuti angka x.y.z, jadi pola dinamis '?v=' + VERSION
  //    di app.js:883 dan teks 'watch?v=' otomatis dilewati.
  //    Cakupan: SELURUH file .js di js/ (tool + tingkat atas + worker) dan
  //    index.html — sebelumnya hanya tool + app.js, jadi ?v= basi di
  //    core.js/fx.js/ffmpeg-loader.js tidak akan pernah ketahuan
  //    (T05, 15 Nov 2026).
  const stale = new Map(); // versi basi -> {count, files:Set}
  const scanV = (file) => {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\?v=(\d+\.\d+\.\d+)/g)) {
      if (m[1] === VERSION) continue;
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
    errors.push(`?v= basi: ?v=${v} (${e.count}x di ${e.files.size} file, cth: ${[...e.files].slice(0, 3).join(', ')}) — VERSION=${VERSION}`);
  }
  console.log(`cek ?v=: ${stale.size ? [...stale.keys()].join(', ') + ' (BASI)' : 'semua sama dengan VERSION'}`);

  // 7. Import statis core.js/manifest.js TANPA ?v= = instans modul ganda
  //    (gap 6): satu instans tanpa query + satu dengan ?v=VERSION, state
  //    (mis. utils/registry) terbelah diam-diam. Hanya kedua modul ini yang
  //    diperiksa: import relatif lain (mis. ./const.js di ffmpeg-worker)
  //    sengaja tanpa ?v= karena worker di-load via import.meta.url.
  //    Regex dijangkar ke awal statement `import` (flag m): tanpa jangkar,
  //    contoh import di dalam komentar blok (core.js:6) ikut ke-match dan
  //    jadi false positive (T05, 15 Nov 2026).
  //    (T05, 15 Nov 2026; temuan pertama: js/beranda.js:33 milik T08.)
  for (const f of allJs) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/^import\s+[\s\S]*?from\s+['"]([^'"]*(?:core|manifest)\.js)([^'"]*)['"]/gm)) {
      if (!m[2].startsWith('?v=')) {
        errors.push(`${rel(f)}: import ${m[1]} tanpa ?v= (instans modul ganda)`);
      }
    }
  }

  if (errors.length) {
    console.log('\n❌ KEGAGALAN:');
    errors.forEach((e) => console.log(' - ' + e));
    process.exit(1);
  }
  console.log('\n✅ Semua cek konsistensi lolos.');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
