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

  // 5. core.js + app.js + manifest.js syntax (di-check via import)
  await import('../js/core.js');
  console.log('core.js import OK');

  if (errors.length) {
    console.log('\n❌ KEGAGALAN:');
    errors.forEach((e) => console.log(' - ' + e));
    process.exit(1);
  }
  console.log('\n✅ Semua cek konsistensi lolos.');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
