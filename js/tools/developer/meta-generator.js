import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=6.0.1';

export const meta = {"id": "meta-generator", "name": "Meta Tag Generator", "cat": "developer", "icon": "🏷️", "desc": "Generator meta tag SEO lengkap.", "keywords": "meta,seo,tag,website"};
export function render(root) {

    const fTitle = T.input('text', 'Judul halaman', '');
    const fDesc = T.ta(2, 'Deskripsi singkat halaman (150-160 karakter ideal)');
    const fKeys = T.input('text', 'kata kunci, dipisah koma', '');
    const fAuthor = T.input('text', 'Nama penulis/situs', '');
    const fOgT = T.input('text', 'og:title (kosongkan = pakai title)', '');
    const fOgD = T.ta(2, 'og:description (kosongkan = pakai description)');
    const fOgI = T.input('text', 'URL gambar og:image (https://…)', '');
    const fTw = T.select([['summary_large_image', 'Kartu besar (gambar)'], ['summary', 'Kartu ringkas']], 'summary_large_image');
    const box = T.out();
    const build = () => {
      const title = fTitle.value.trim(), desc = fDesc.value.trim(), keys = fKeys.value.trim(),
        author = fAuthor.value.trim(), ogT = fOgT.value.trim() || title, ogD = fOgD.value.trim() || desc,
        ogI = fOgI.value.trim();
      if (!title) return '';
      const L = ['<title>' + esc(title) + '</title>'];
      if (desc) L.push('<meta name="description" content="' + esc(desc) + '">');
      if (keys) L.push('<meta name="keywords" content="' + esc(keys) + '">');
      if (author) L.push('<meta name="author" content="' + esc(author) + '">');
      L.push('<meta property="og:type" content="website">');
      if (ogT) L.push('<meta property="og:title" content="' + esc(ogT) + '">');
      if (ogD) L.push('<meta property="og:description" content="' + esc(ogD) + '">');
      if (ogI) L.push('<meta property="og:image" content="' + esc(ogI) + '">');
      L.push('<meta name="twitter:card" content="' + fTw.value + '">');
      if (ogT) L.push('<meta name="twitter:title" content="' + esc(ogT) + '">');
      if (ogD) L.push('<meta name="twitter:description" content="' + esc(ogD) + '">');
      if (ogI) L.push('<meta name="twitter:image" content="' + esc(ogI) + '">');
      return L.join('\n');
    };
    root.appendChild(T.grid2(T.field('Title', fTitle), T.field('Author', fAuthor)));
    root.appendChild(T.field('Description', fDesc));
    root.appendChild(T.field('Keywords', fKeys));
    root.appendChild(T.grid2(T.field('og:title', fOgT), T.field('og:image', fOgI)));
    root.appendChild(T.field('og:description', fOgD));
    root.appendChild(T.field('Twitter card', fTw));
    root.appendChild(T.row(T.btn('Generate', () => {
      const c = build();
      if (!c) { T.show(box, errBox('Isi dulu minimal Title.')); return; }
      T.show(box, preHtml(c));
    }, true), T.copyBtn(() => { const c = build(); return c || ''; }, 'Salin')));
    root.appendChild(box);
  
}
