#!/usr/bin/env node
/* v5.2: bangkitkan ulang js/manifest.js dari meta tiap file tool.
   Sumber kebenaran = export const meta di js/tools/<cat>/<id>.js.
   Jalankan: node scripts/sync-manifest.js [version]
*/
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');
const { register } = require('node:module');

register('./strip-query-loader.mjs', pathToFileURL(__filename));

const VERSION = process.argv[2] || '5.2.0';
const JS = path.join(__dirname, '..', 'js');

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
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
