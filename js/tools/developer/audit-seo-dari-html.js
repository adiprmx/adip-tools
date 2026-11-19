import { h as T, errBox, fileInput } from '../../core.js';

// Audit SEO dasar dari kode HTML, murni dengan regex (tanpa DOMParser)
// supaya bisa diuji di Node. Skor = (ok + 0,5 x peringatan) / total cek.
// Setiap cek: { id, label, status: 'ok'|'warn'|'fail', detail }.
export function auditSeo(html) {
  const src = String(html || '');
  const checks = [];
  const add = (id, label, status, detail) => checks.push({ id, label, status, detail: detail || '' });

  const metaTags = src.match(/<meta\b[^>]*>/gi) || [];
  const metaAttr = (tag, name) => {
    const m = new RegExp(name + '\\s*=\\s*"([^"]*)"|' + name + "\\s*=\\s*'([^']*)'", 'i').exec(tag);
    return m ? (m[1] !== undefined ? m[1] : m[2]) : null;
  };
  const findMeta = (attr, val) => metaTags.find((t) => {
    const v = metaAttr(t, attr);
    return v != null && v.toLowerCase() === val;
  });

  // 1. Judul halaman
  const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(src);
  const title = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : '';
  if (!titleM) add('title', 'Judul halaman (title)', 'fail', 'Tidak ada judul. Mesin pencari memakai judul sebagai nama halaman di hasil pencarian.');
  else if (title.length >= 30 && title.length <= 60) add('title', 'Judul halaman (title)', 'ok', '"' + title + '" (' + title.length + ' karakter, pas).');
  else add('title', 'Judul halaman (title)', 'warn', '"' + title + '" (' + title.length + ' karakter; idealnya 30-60 supaya tidak terpotong).');

  // 2. Deskripsi meta
  const descTag = findMeta('name', 'description');
  const desc = descTag ? (metaAttr(descTag, 'content') || '') : '';
  if (!descTag) add('description', 'Deskripsi (meta description)', 'fail', 'Tidak ada deskripsi. Mesin pencari memakai ini sebagai cuplikan di bawah judul.');
  else if (desc.length >= 50 && desc.length <= 160) add('description', 'Deskripsi (meta description)', 'ok', desc.length + ' karakter, pas.');
  else add('description', 'Deskripsi (meta description)', 'warn', desc.length + ' karakter; idealnya 50-160 supaya cuplikannya tidak terpotong.');

  // 3. Satu H1
  const h1 = (src.match(/<h1[\s>]/gi) || []).length;
  if (h1 === 1) add('h1', 'Judul utama (H1)', 'ok', 'Ada 1 H1.');
  else if (h1 === 0) add('h1', 'Judul utama (H1)', 'fail', 'Tidak ada H1. Tiap halaman sebaiknya punya satu judul utama.');
  else add('h1', 'Judul utama (H1)', 'warn', 'Ada ' + h1 + ' H1. Sebaiknya satu saja per halaman.');

  // 4. Subjudul H2
  const h2 = (src.match(/<h2[\s>]/gi) || []).length;
  if (h2 > 0) add('h2', 'Subjudul (H2)', 'ok', 'Ada ' + h2 + ' H2.');
  else add('h2', 'Subjudul (H2)', 'warn', 'Tidak ada H2. Subjudul membantu pembaca dan mesin pencari memahami isi halaman.');

  // 5. Teks alt gambar
  const imgs = src.match(/<img\b[^>]*>/gi) || [];
  const tanpaAlt = imgs.filter((t) => metaAttr(t, 'alt') == null || metaAttr(t, 'alt').trim() === '').length;
  if (!imgs.length) add('alt', 'Teks alt gambar', 'ok', 'Tidak ada gambar di halaman ini.');
  else if (!tanpaAlt) add('alt', 'Teks alt gambar', 'ok', 'Semua ' + imgs.length + ' gambar punya teks alt.');
  else add('alt', 'Teks alt gambar', 'warn', tanpaAlt + ' dari ' + imgs.length + ' gambar belum punya teks alt.');

  // 6. Bahasa halaman
  if (/<html[^>]+lang\s*=/i.test(src)) add('lang', 'Bahasa halaman (lang)', 'ok', 'Tag html sudah menyebut bahasanya.');
  else add('lang', 'Bahasa halaman (lang)', 'warn', 'Tag html belum menyebut bahasa halaman, misal lang="id".');

  // 7. Tampilan HP (viewport)
  if (findMeta('name', 'viewport')) add('viewport', 'Tampilan HP (viewport)', 'ok', 'Ada pengaturan viewport untuk layar HP.');
  else add('viewport', 'Tampilan HP (viewport)', 'warn', 'Tidak ada meta viewport, halaman bisa tampil kecil di HP.');

  // 8. Canonical
  if (/<link\b[^>]*rel\s*=\s*["']canonical["']/i.test(src)) add('canonical', 'Alamat utama (canonical)', 'ok', 'Ada link canonical.');
  else add('canonical', 'Alamat utama (canonical)', 'warn', 'Tidak ada link canonical. Berguna bila satu isi bisa dibuka dari beberapa alamat.');

  // 9. Pratinjau sosmed (Open Graph)
  const ogT = findMeta('property', 'og:title');
  const ogD = findMeta('property', 'og:description');
  if (ogT && ogD) add('og', 'Pratinjau sosmed (Open Graph)', 'ok', 'Ada og:title dan og:description.');
  else if (ogT || ogD) add('og', 'Pratinjau sosmed (Open Graph)', 'warn', 'Baru sebagian: ' + (ogT ? 'og:title ada, og:description belum.' : 'og:description ada, og:title belum.'));
  else add('og', 'Pratinjau sosmed (Open Graph)', 'warn', 'Tidak ada tag Open Graph, tautan halaman ini tampil polos saat dibagikan.');

  // 10. Ikon situs (favicon)
  if (/<link\b[^>]*rel\s*=\s*["'](icon|shortcut icon|apple-touch-icon)["']/i.test(src)) add('favicon', 'Ikon situs (favicon)', 'ok', 'Ada favicon.');
  else add('favicon', 'Ikon situs (favicon)', 'warn', 'Tidak ada favicon. Tab browser tampil tanpa ikon.');

  // 11. Perintah noindex
  const robots = findMeta('name', 'robots');
  const robotsIsi = robots ? (metaAttr(robots, 'content') || '').toLowerCase() : '';
  if (robotsIsi.includes('noindex')) add('noindex', 'Perintah noindex', 'fail', 'Halaman ini meminta mesin pencari TIDAK menampilkannya di hasil pencarian.');
  else add('noindex', 'Perintah noindex', 'ok', 'Tidak ada perintah noindex.');

  // Info (tidak dinilai): jumlah tautan
  const links = src.match(/<a\b[^>]*href\s*=\s*["']([^"']*)["']/gi) || [];
  const ext = links.filter((t) => /^https?:\/\//i.test(metaAttr(t, 'href') || '')).length;

  const ok = checks.filter((c) => c.status === 'ok').length;
  const warn = checks.filter((c) => c.status === 'warn').length;
  const score = Math.round(((ok + warn * 0.5) / checks.length) * 100);
  return { score, total: checks.length, ok, warn, fail: checks.length - ok - warn, checks, tautan: links.length, tautanLuar: ext };
}

export const meta = {"id": "audit-seo-dari-html", "name": "Audit SEO dari HTML", "cat": "developer", "icon": "🔍", "desc": "Tempel kode HTML, dapat skor dan daftar masalah SEO dasar.", "keywords": "seo,audit,html,title,meta,description,h1,alt,google", "since": "6.18.0"};
export function render(root) {

    const ta = T.ta(10, 'Tempel kode HTML di sini…');
    const fileI = fileInput('.html,.htm,.txt,text/html');
    const box = T.out();

    const audit = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, errBox('Tempel dulu kode HTML-nya atau pilih file.')); return; }
      if (!/<[a-z][\s\S]*>/i.test(src)) { T.show(box, errBox('Isinya tidak terlihat seperti kode HTML.')); return; }
      const r = auditSeo(src);
      const mark = (s) => s === 'ok' ? '<span class="ok">✓</span>' : s === 'warn' ? '<span class="warn">!</span>' : '<span class="err">✗</span>';
      let html = '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px"><span style="font-size:28px;font-weight:700">' + r.score + '</span><span class="dim">dari 100, dari ' + r.total + ' cek dasar</span></div>' +
        '<div class="kv"><span class="k">Lolos</span><span class="v">' + r.ok + '</span></div>' +
        '<div class="kv"><span class="k">Perlu dibenahi</span><span class="v">' + r.warn + '</span></div>' +
        '<div class="kv"><span class="k">Bermasalah</span><span class="v">' + r.fail + '</span></div>' +
        '<div class="kv"><span class="k">Tautan</span><span class="v">' + r.tautan + ' (' + r.tautanLuar + ' ke situs lain)</span></div>';
      html += '<div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">' + r.checks.map((c) =>
        '<div style="display:flex;gap:8px;font-size:13px;line-height:1.5"><span style="flex:none">' + mark(c.status) + '</span><span><b>' + T.esc(c.label) + '</b><br><span class="dim">' + T.esc(c.detail) + '</span></span></div>'
      ).join('') + '</div>';
      T.show(box, html);
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      ta.value = await f.text();
      audit();
    });

    root.appendChild(T.field('Pilih file HTML (opsional)', fileI));
    root.appendChild(T.field('Kode HTML', ta));
    root.appendChild(T.row(T.btn('Audit', audit, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Skor ini hanya dari 11 cek dasar di atas dan bukan jaminan peringkat di mesin pencari. Isi halaman, kecepatan, dan tautan dari situs lain juga berpengaruh.</div>'));

}
