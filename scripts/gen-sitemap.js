#!/usr/bin/env node
/* Bangkitkan sitemap.xml dari js/manifest.js (sumber kebenaran).
   Otomatis ikut jalan tiap sync-manifest.js (cascade); bisa juga dijalankan
   manual tiap rilis, setelah manifest final:
     node scripts/gen-sitemap.js
   Isi: homepage + satu URL per tool (#/t/<id>).
   <lastmod> (S-U10 v6.22.0, utang S-F7 §5): diambil dari tanggal rilis
   produksi versi `since` tiap tool (scripts/release-dates.json). Homepage
   memakai tanggal rilis VERSION manifest. Tool tanpa `since`, atau yang
   versinya belum ada di tabel, TIDAK mendapat <lastmod>. Jujur, bukan
   ditebak. Tanggal di tabel semuanya terverifikasi dari laporan ronde /
   log harian (sumber per baris ada di laporan S-U10); JANGAN tambah
   tanggal dari mtime file atau perkiraan. Rilis baru (mis. 6.22.0)
   ditambahkan ke tabel HANYA sesudah tanggal live produksinya
   terverifikasi. Sampai saat itu tool barunya tanpa lastmod.
   Catatan 6.11.0: rilis 6.11.0 sendiri tidak pernah ke produksi; batch
   ber-cap 6.11.0 pertama kali live lewat rilis 6.11.5 (15 Nov 2026
   13:52 WIB), jadi kedua kunci memakai tanggal yang sama.
*/
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('node:url');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://tools.adipmusic.my.id';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Tabel versi -> tanggal rilis produksi (YYYY-MM-DD, WIB). File hilang
   atau tanggal berformat salah = gagal cepat, supaya sitemap tidak
   diam-diam kehilangan lastmod. */
function loadReleaseDates() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'release-dates.json'), 'utf-8'));
  for (const [ver, date] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) {
      throw new Error(`release-dates.json: tanggal tidak valid untuk ${ver}: ${JSON.stringify(date)}`);
    }
  }
  return raw;
}

async function main() {
  const { manifest, VERSION } = await import(pathToFileURL(path.join(ROOT, 'js', 'manifest.js')).href);
  const dates = loadReleaseDates();
  const lastmodFor = (ver) => (ver && dates[ver]) || null;
  // encodeURIComponent(id): no-op untuk slug normal, pengaman bila id kelak
  // mengandung karakter yang tidak valid di URL (spasi, &, dsb.).
  const entries = [{ url: SITE + '/', lastmod: lastmodFor(VERSION) }];
  let noSince = 0;
  let noDate = 0;
  for (const m of manifest) {
    const lastmod = lastmodFor(m.since);
    if (!m.since) noSince += 1;
    else if (!lastmod) noDate += 1;
    entries.push({ url: `${SITE}/#/t/${encodeURIComponent(m.id)}`, lastmod });
  }
  const withLastmod = entries.filter((e) => e.lastmod).length;
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) =>
      e.lastmod
        ? `  <url><loc>${esc(e.url)}</loc><lastmod>${e.lastmod}</lastmod></url>`
        : `  <url><loc>${esc(e.url)}</loc></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml);
  console.log(`sitemap.xml ditulis: ${entries.length} URL (${manifest.length} tool), ${withLastmod} dengan lastmod, ${noSince} tanpa since, ${noDate} since tanpa tanggal terverifikasi`);
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
