import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke EPUB: ubah PDF berisi teks jadi ebook EPUB yang bisa dibaca di
// e-reader. Teks diambil per halaman dengan pdf.js, lalu dipecah jadi
// bab berdasarkan judul yang dikenali (baris "Bab 1", judul huruf besar,
// atau judul bernomor). Mesin ZIP-nya JSZip.
// BATASAN JUJUR (ditulis juga di UI): yang pindah hanya teks. Gambar,
// tabel, dan tata letak PDF tidak ikut. PDF hasil scan (isinya hanya
// gambar) tidak bisa diubah karena tidak ada teksnya.
export const meta = {"id": "pdf-ke-epub", "name": "PDF ke EPUB", "cat": "produktivitas", "icon": "📖", "desc": "Ubah PDF teks jadi ebook EPUB yang bisa dibaca di e-reader.", "keywords": "pdf ke epub,pdf jadi ebook,ebook dari pdf,konversi pdf epub", "since": "6.19.0"};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const MAKS_HALAMAN = 200;
const HALAMAN_PER_BAGIAN = 12;

export function escXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// Susun potongan teks pdf.js jadi baris-baris (dikelompokkan posisi Y,
// diurutkan atas ke bawah, kiri ke kanan), lalu gabung dengan baris baru
// supaya judul bab bisa dikenali per baris. Murni, bisa diuji di Node.
export function itemsKeBarisTeks(items) {
  const urut = (items || []).slice().sort((a, b) => {
    const dy = (b.transform[5] || 0) - (a.transform[5] || 0);
    if (Math.abs(dy) > 2) return dy;
    return (a.transform[4] || 0) - (b.transform[4] || 0);
  });
  const baris = [];
  for (const it of urut) {
    const teks = String(it.str || '');
    if (!teks.trim()) continue;
    const y = it.transform[5] || 0;
    const terakhir = baris[baris.length - 1];
    if (terakhir && Math.abs(terakhir.y - y) <= 2) {
      terakhir.teks.push(teks);
    } else {
      baris.push({ y, teks: [teks] });
    }
  }
  return baris.map((b) => b.teks.join(' ')).join('\n');
}

// Tebak apakah satu baris adalah judul bab. Murni, bisa diuji di Node.
export function barisJudulBab(baris) {
  const b = String(baris || '').trim();
  if (!b || b.length > 80) return false;
  if (/^(bab|bagian|pasal|chapter|buku)\s+(\d+|[ivxlcdm]+)\b/i.test(b)) return true;
  if (/^\d+(\.\d+)*\s+\S/.test(b) && !/[.!?]$/.test(b) && b.length <= 60) return true;
  if (b.length >= 3 && b.length <= 50 && b === b.toUpperCase() && /[A-Z]/.test(b) && !/[.!?]$/.test(b) && (b.split(/\s+/).length >= 2 || b.length >= 4)) return true;
  return false;
}

// Pecah teks per halaman jadi bab: [{judul, paragraf: [string]}].
// Judul dikenali dari baris judul; bila tidak ada judul sama sekali,
// teks dipecah per 12 halaman. Murni, bisa diuji di Node.
export function teksKeBab(teksPerHalaman) {
  const semuaBaris = [];
  (teksPerHalaman || []).forEach((teks, hi) => {
    String(teks || '').replace(/\r\n?/g, '\n').split('\n').forEach((b) => {
      semuaBaris.push({ teks: b.trim(), halaman: hi + 1 });
    });
  });
  const bab = [];
  let judul = '';
  let paragraf = [];
  let blok = [];
  const siramBlok = () => {
    if (!blok.length) return;
    paragraf.push(blok.join(' '));
    blok = [];
  };
  const siramBab = () => {
    siramBlok();
    if (judul || paragraf.length) bab.push({ judul: judul || 'Bab ' + (bab.length + 1), paragraf });
    paragraf = [];
  };
  for (const { teks } of semuaBaris) {
    if (!teks) { siramBlok(); continue; }
    if (barisJudulBab(teks)) {
      siramBab();
      judul = teks;
      continue;
    }
    blok.push(teks);
  }
  siramBab();
  const adaJudulAsli = bab.some((b, i) => i > 0 || !/^Bab \d+$/.test(b.judul));
  if (bab.length <= 1 && !adaJudulAsli) {
    // Tanpa judul: pecah per 12 halaman supaya ebook tetap punya bab.
    const hasil = [];
    let isi = [];
    let mulai = 1;
    (teksPerHalaman || []).forEach((teks, hi) => {
      const potong = String(teks || '').split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
      isi.push(...potong);
      if ((hi + 1) % HALAMAN_PER_BAGIAN === 0 || hi === (teksPerHalaman || []).length - 1) {
        if (isi.length) hasil.push({ judul: 'Bagian ' + (hasil.length + 1) + ' (halaman ' + mulai + '-' + (hi + 1) + ')', paragraf: isi });
        isi = [];
        mulai = hi + 2;
      }
    });
    return hasil;
  }
  return bab;
}

// Satu bab jadi dokumen XHTML lengkap. Murni, bisa diuji di Node.
export function babKeXhtml(bab) {
  const isi = (bab.paragraf || []).map((p) => '<p>' + escXml(p) + '</p>').join('\n');
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" lang="id">\n<head>\n<title>'
    + escXml(bab.judul) + '</title>\n<link rel="stylesheet" type="text/css" href="style.css"/>\n</head>\n<body>\n<h1>'
    + escXml(bab.judul) + '</h1>\n' + isi + '\n</body>\n</html>\n';
}

export const CSS_EBOOK = 'body{font-family:serif;line-height:1.6;margin:5%}\nh1{font-size:1.4em;line-height:1.3}\np{text-align:justify}\n';

// content.opf (EPUB 3). Murni, bisa diuji di Node.
export function bangunOpf(metaBuku, jumlahBab) {
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
    + '<dc:title>' + escXml(metaBuku.judul || 'Tanpa Judul') + '</dc:title>\n'
    + '<dc:language>' + escXml(metaBuku.bahasa || 'id') + '</dc:language>\n'
    + (metaBuku.penulis ? '<dc:creator>' + escXml(metaBuku.penulis) + '</dc:creator>\n' : '')
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
export function bangunNcx(metaBuku, bab) {
  const isi = bab.map((b, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${escXml(b.judul)}</text></navLabel><content src="bab${i + 1}.xhtml"/></navPoint>`).join('\n');
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n<head><meta name="dtb:uid" content="urn:uuid:adip-tools-epub"/></head>\n'
    + '<docTitle><text>' + escXml(metaBuku.judul || 'Tanpa Judul') + '</text></docTitle>\n<navMap>\n' + isi + '\n</navMap>\n</ncx>\n';
}

export const CONTAINER_XML = '<?xml version="1.0" encoding="utf-8"?>\n'
  + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
  + '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>\n</container>\n';

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const judulI = T.input('text', 'Judul ebook (boleh kosong, memakai nama file)');
  const penulisI = T.input('text', 'Nama penulis (boleh kosong)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF dan EPUB… (perlu internet sekali saja)</span>');
    const [pdfOk, zipOk] = await Promise.all([
      utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }),
      utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip),
    ]);
    if (!pdfOk || !zipOk) {
      T.show(statusBox, '<div class="err">Mesin gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const total = Math.min(doc.numPages, MAKS_HALAMAN);
      const teksPerHalaman = [];
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        teksPerHalaman.push(itemsKeBarisTeks(konten.items || []));
      }
      await doc.destroy();
      const bab = teksKeBab(teksPerHalaman);
      if (!bab.length || !bab.some((b) => b.paragraf.length)) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar).</div>');
        prosesB.disabled = false;
        return;
      }
      T.show(statusBox, '<span class="dim">Menyusun ebook…</span>');
      const judul = judulI.value.trim() || namaDasar;
      const zip = new window.JSZip();
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
      T.show(box, `<p class="note">Ebook jadi: <b>${bab.length} bab</b> dari ${total} halaman, judul "${T.esc(judul)}". Buka di aplikasi pembaca ebook di HP atau laptopmu.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh EPUB (.epub)', () => { T.dl(nama + '.epub', blob, 'application/epub+zip'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      const terkunci = e && e.name === 'PasswordException';
      T.show(statusBox, terkunci
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Buka Kunci PDF.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi EPUB', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Bab dikenali dari judul seperti "Bab 1" atau judul huruf besar. Bila tidak ada judul yang dikenali, ebook dipecah per 12 halaman. Gambar dan tabel tidak ikut pindah.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.field('Judul ebook', judulI));
  root.appendChild(T.field('Nama penulis', penulisI));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
