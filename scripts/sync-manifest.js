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
*/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { register } = require('node:module');

register('./strip-query-loader.mjs', pathToFileURL(__filename));

const JS = path.join(__dirname, '..', 'js');
const SCRIPTS = __dirname;

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
    entries.push({
      id, name: mod.meta.name, cat, icon: mod.meta.icon, desc: mod.meta.desc,
      keywords: mod.meta.keywords || '', file: rel,
      ...(mod.meta.since ? { since: mod.meta.since } : {}),
    });
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
