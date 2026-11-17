#!/usr/bin/env node
/* Bangkitkan llms.txt dari js/manifest.js (sumber kebenaran): katalog semua
   tool yang terbaca mesin, dikelompokkan per kategori.
   Otomatis ikut jalan tiap sync-manifest.js (cascade); bisa juga dijalankan
   manual tiap rilis, setelah manifest final:
     node scripts/gen-llms-txt.js
*/
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://tools.adipmusic.my.id';

/* Teks aman untuk di dalam [teks](url) markdown: nama tool boleh mengandung
   [ ] atau newline — tanpa escape, sintaks link rusak dan baris llms.txt
   jadi tidak terbaca mesin. */
const mdText = (s) => (s || '').replace(/\s+/g, ' ').trim().replace(/\[/g, '\\[').replace(/\]/g, '\\]');
/* Label kategori baru yang belum ada di CATS: title-case slug, bukan slug mentah. */
const titleCase = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* label kategori, selaras dengan CATS di js/app.js */
const CATS = [
  ['keamanan', 'Keamanan'], ['converter', 'Converter'], ['developer', 'Dev & Web'],
  ['desain', 'Desain'], ['indonesia', 'Indonesia'], ['musik', 'Musik'], ['gambar', 'Gambar'],
  ['teks', 'Teks'], ['bisnis', 'Bisnis'], ['sehari', 'Sehari-hari'], ['fun', 'Fun'],
  ['produktivitas', 'Produktivitas'], ['pelajar', 'Pelajar'], ['liveapi', 'Live API'],
  ['fakesos', 'Fake Sosmed'],
];

async function main() {
  const { manifest, VERSION } = await import(pathToFileURL(path.join(ROOT, 'js', 'manifest.js')).href);
  const lines = [
    '# ADIP Tools',
    '',
    `> Kumpulan ${manifest.length} tool gratis berbahasa Indonesia yang berjalan di browser, tanpa daftar dan tanpa instalasi. Versi ${VERSION}.`,
    '',
  ];
  const byCat = new Map();
  for (const m of manifest) {
    if (!byCat.has(m.cat)) byCat.set(m.cat, []);
    byCat.get(m.cat).push(m);
  }
  const order = [...CATS.map(([id]) => id), ...[...byCat.keys()].filter((id) => !CATS.some(([c]) => c === id))];
  const label = new Map(CATS);
  for (const cat of order) {
    const tools = byCat.get(cat);
    if (!tools || !tools.length) continue;
    lines.push(`## ${label.get(cat) || titleCase(cat)}`, '');
    for (const m of tools) {
      const desc = (m.desc || '').replace(/\s+/g, ' ').trim();
      lines.push(`- [${mdText(m.name)}](${SITE}/#/t/${m.id})${desc ? ': ' + desc : ''}`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(ROOT, 'public', 'llms.txt'), lines.join('\n'));
  console.log(`llms.txt ditulis: ${manifest.length} tool, ${order.filter((c) => (byCat.get(c) || []).length).length} kategori`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
