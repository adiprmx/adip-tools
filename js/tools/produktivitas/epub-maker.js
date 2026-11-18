import { h as T, fmtBytes, LOCAL_NOTE } from '../../core.js';

// EPUB Maker: buat file ebook EPUB dari teks atau Markdown yang diketik.
// Strukturnya EPUB 3 yang sah: mimetype (tanpa kompresi, file pertama),
// META-INF/container.xml, content.opf, nav.xhtml, toc.ncx (untuk pembaca
// lama), dan satu file XHTML per bab. Tiap judul # atau ## jadi bab baru.
// Mesinnya JSZip. Hasilnya bisa dibuka di pembaca ebook umum.
export const meta = {"id": "epub-maker", "name": "EPUB Maker", "cat": "produktivitas", "icon": "📚", "desc": "Buat file ebook EPUB dari teks atau tulisan Markdown.", "keywords": "epub maker,buat epub,ebook,teks ke epub,markdown ke epub", "since": "6.17.0"};

const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

export function escXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Inline Markdown sederhana untuk isi bab: **tebal**, *miring*.
// Murni, bisa diuji di Node.
export function inlineKeHtml(teks) {
  let s = escXml(teks);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

// Pecah teks jadi bab: tiap baris yang diawali # atau ## membuka bab baru.
// Murni, bisa diuji di Node. Mengembalikan [{judul, html}].
export function markdownKeBab(teks) {
  const baris = String(teks || '').replace(/\r\n?/g, '\n').split('\n');
  const bab = [];
  let judul = '';
  let isi = [];
  const siram = () => {
    const html = isi.filter(Boolean).join('\n');
    if (judul || html) bab.push({ judul: judul || 'Bab ' + (bab.length + 1), html });
    isi = [];
  };
  const blokParagraf = [];
  const siramParagraf = () => {
    if (!blokParagraf.length) return;
    isi.push('<p>' + inlineKeHtml(blokParagraf.join(' ')) + '</p>');
    blokParagraf.length = 0;
  };
  let daftar = null;
  const siramDaftar = () => {
    if (!daftar) return;
    isi.push('<ul>' + daftar.map((x) => '<li>' + inlineKeHtml(x) + '</li>').join('') + '</ul>');
    daftar = null;
  };
  for (const mentah of baris) {
    const b = mentah.trim();
    const jm = /^(#{1,2})\s+(.+)$/.exec(b);
    if (jm) { siramParagraf(); siramDaftar(); siram(); judul = jm[2].trim(); continue; }
    const lm = /^[-*]\s+(.+)$/.exec(b);
    if (lm) { siramParagraf(); if (!daftar) daftar = []; daftar.push(lm[1].trim()); continue; }
    if (!b) { siramParagraf(); siramDaftar(); continue; }
    siramDaftar();
    blokParagraf.push(b);
  }
  siramParagraf(); siramDaftar(); siram();
  return bab;
}

// Satu bab jadi dokumen XHTML lengkap. Murni, bisa diuji di Node.
export function babKeXhtml(bab) {
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" lang="id">\n<head>\n<title>'
    + escXml(bab.judul) + '</title>\n<link rel="stylesheet" type="text/css" href="style.css"/>\n</head>\n<body>\n<h1>'
    + escXml(bab.judul) + '</h1>\n' + bab.html + '\n</body>\n</html>\n';
}

export const CSS_EBOOK = 'body{font-family:serif;line-height:1.6;margin:5%}\nh1{font-size:1.4em;line-height:1.3}\np{text-align:justify}\n';

// content.opf (EPUB 3). Murni, bisa diuji di Node.
export function bangunOpf(meta, jumlahBab) {
  const uid = 'urn:uuid:adip-tools-' + Date.now().toString(36);
  const items = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="css" href="style.css" media-type="text/css"/>'];
  for (let i = 1; i <= jumlahBab; i++) items.push(`<item id="bab${i}" href="bab${i}.xhtml" media-type="application/xhtml+xml"/>`);
  const spine = [];
  for (let i = 1; i <= jumlahBab; i++) spine.push(`<itemref idref="bab${i}"/>`);
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
    + '<dc:identifier id="uid">' + escXml(uid) + '</dc:identifier>\n'
    + '<dc:title>' + escXml(meta.judul || 'Tanpa Judul') + '</dc:title>\n'
    + '<dc:language>' + escXml(meta.bahasa || 'id') + '</dc:language>\n'
    + (meta.penulis ? '<dc:creator>' + escXml(meta.penulis) + '</dc:creator>\n' : '')
    + '<meta property="dcterms:modified">' + new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') + '</meta>\n'
    + '</metadata>\n<manifest>\n' + items.join('\n') + '\n</manifest>\n<spine toc="ncx">\n' + spine.join('\n') + '\n</spine>\n</package>\n';
}

// Daftar isi EPUB 3 (nav.xhtml). Murni, bisa diuji di Node.
export function bangunNav(bab) {
  const isi = bab.map((b, i) => `<li><a href="bab${i + 1}.xhtml">${escXml(b.judul)}</a></li>`).join('\n');
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="id">\n<head>\n<title>Daftar Isi</title>\n<link rel="stylesheet" type="text/css" href="style.css"/>\n</head>\n<body>\n<nav epub:type="toc"><h1>Daftar Isi</h1><ol>\n'
    + isi + '\n</ol></nav>\n</body>\n</html>\n';
}

// Daftar isi EPUB 2 (toc.ncx, untuk pembaca lama). Murni, bisa diuji di Node.
export function bangunNcx(meta, bab) {
  const isi = bab.map((b, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${escXml(b.judul)}</text></navLabel><content src="bab${i + 1}.xhtml"/></navPoint>`).join('\n');
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n<head><meta name="dtb:uid" content="urn:uuid:adip-tools-epub"/></head>\n'
    + '<docTitle><text>' + escXml(meta.judul || 'Tanpa Judul') + '</text></docTitle>\n<navMap>\n' + isi + '\n</navMap>\n</ncx>\n';
}

export const CONTAINER_XML = '<?xml version="1.0" encoding="utf-8"?>\n'
  + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
  + '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>\n</container>\n';

export function render(root) {
  const judulI = T.input('text', 'Judul ebook');
  const penulisI = T.input('text', 'Nama penulis (boleh kosong)');
  const teksI = T.ta(12, '# Bab Pertama\n\nTulis isi bab di sini. **Tebal** dan *miring* ikut pindah.\n\n# Bab Kedua\n\nJudul dengan tanda # jadi bab baru.');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let jsZipSiap = null;

  const muatJsZip = () => {
    if (!jsZipSiap) {
      jsZipSiap = T.loadScript(JSZIP_CDN).then((ok) => ok && !!window.JSZip)
        .catch(() => { jsZipSiap = null; return false; });
    }
    return jsZipSiap;
  };

  async function proses() {
    const bab = markdownKeBab(teksI.value);
    if (!bab.length) { T.toast('Isi tulisanmu dulu'); teksI.focus(); return; }
    const judul = judulI.value.trim() || bab[0].judul || 'Tanpa Judul';
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin EPUB… (perlu internet sekali saja)</span>');
    const ok = await muatJsZip();
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin EPUB gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Menyusun ebook…</span>');
      const zip = new window.JSZip();
      // mimetype WAJIB file pertama dan tanpa kompresi (aturan format EPUB).
      zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
      zip.file('META-INF/container.xml', CONTAINER_XML);
      const metaBuku = { judul, penulis: penulisI.value.trim(), bahasa: 'id' };
      zip.file('OEBPS/content.opf', bangunOpf(metaBuku, bab.length));
      zip.file('OEBPS/nav.xhtml', bangunNav(bab));
      zip.file('OEBPS/toc.ncx', bangunNcx(metaBuku, bab));
      zip.file('OEBPS/style.css', CSS_EBOOK);
      bab.forEach((b, i) => zip.file('OEBPS/bab' + (i + 1) + '.xhtml', babKeXhtml(b)));
      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
      const nama = judul.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'ebook';
      T.hide(statusBox);
      T.show(box, `<p class="note">Ebook jadi: <b>${bab.length} bab</b> dengan judul "${T.esc(judul)}". Buka di aplikasi pembaca ebook di HP atau laptopmu.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh EPUB (.epub)', () => { T.dl(nama + '.epub', blob, 'application/epub+zip'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">Ebook gagal dibuat. Coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Buat Ebook EPUB', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tiap judul yang diawali tanda # jadi bab baru. Tebal dan miring ikut pindah. Hasilnya file EPUB biasa yang bisa dibuka di pembaca ebook.</p>'));
  root.appendChild(T.field('Judul ebook', judulI));
  root.appendChild(T.field('Nama penulis', penulisI));
  root.appendChild(T.field('Isi ebook', teksI));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
