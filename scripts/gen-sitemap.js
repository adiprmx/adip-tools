#!/usr/bin/env node
/* Bangkitkan sitemap.xml dari js/manifest.js (sumber kebenaran).
   Otomatis ikut jalan tiap sync-manifest.js (cascade); bisa juga dijalankan
   manual tiap rilis, setelah manifest final:
     node scripts/gen-sitemap.js
   Isi: homepage + satu URL per tool (#/t/<id>).
*/
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://tools.adipmusic.my.id';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function main() {
  const { manifest } = await import(pathToFileURL(path.join(ROOT, 'js', 'manifest.js')).href);
  // encodeURIComponent(id): no-op untuk slug normal, pengaman bila id kelak
  // mengandung karakter yang tidak valid di URL (spasi, &, dsb.).
  const urls = [SITE + '/', ...manifest.map((m) => `${SITE}/#/t/${encodeURIComponent(m.id)}`)];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  console.log(`sitemap.xml ditulis: ${urls.length} URL (${manifest.length} tool)`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
