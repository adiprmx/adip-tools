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
    'routes.js', 'catalog.js', 'store.js', 'supabase.js', 'shell-ui.js',
    'beranda.js', 'search-plus.js', 'onboarding.js', 'components.js',
    'regex-aman.js', 'dxf.js', 'model-3d.js', 'tokenizer-js.js',
    'gif-encoder.js', 'mouse-sens.js', 'screen-time.js', 'wrapped.js'];
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

  if (errors.length) {
    console.log('\n❌ KEGAGALAN:');
    errors.forEach((e) => console.log(' - ' + e));
    process.exit(1);
  }
  console.log('\n✅ Semua cek konsistensi lolos.');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
