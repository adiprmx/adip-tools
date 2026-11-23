// MERGE B17 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = epub-ke-pdf (survivor), arah B = pdf-ke-epub (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, kv, fmtBytes, errBox, fileInput, LOCAL_NOTE } from '../../core.js';

export const meta = {"id": "epub-ke-pdf", "name": "EPUB ↔ PDF", "cat": "converter", "icon": "📕", "desc": "Ubah ebook EPUB jadi PDF A4, atau PDF teks jadi ebook EPUB.", "keywords": "epub,pdf,ebook,buku,konversi,dokumen,epub ke pdf,pdf ke epub,pdf jadi ebook,ebook dari pdf", "since": "6.19.0", "online": true};


// JSZip 3.10.1 + pdf-lib 1.17.1. Hash SRI keduanya ada di peta SRI_HASH core.js.
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';

// Cari jalur file OPF dari container.xml. Fungsi murni, diuji di Node.
export function cariJalurOpf(containerXml) {
  const m = /<rootfile[^>]*full-path=["']([^"']+)["']/i.exec(String(containerXml || ''));
  return m ? m[1] : '';
}

// Urutan baca dari OPF: pasangkan spine (idref) dengan manifest (id->href).
export function daftarBacaan(opfXml) {
  const xml = String(opfXml || '');
  const manifest = {};
  const polaItem = /<item[^>]*>/gi;
  let m;
  while ((m = polaItem.exec(xml)) !== null) {
    const tag = m[0];
    const id = /id=["']([^"']+)["']/i.exec(tag);
    const href = /href=["']([^"']+)["']/i.exec(tag);
    if (id && href) manifest[id[1]] = href[1];
  }
  const hasil = [];
  const polaRef = /<itemref[^>]*idref=["']([^"']+)["'][^>]*>/gi;
  while ((m = polaRef.exec(xml)) !== null) {
    const href = manifest[m[1]];
    if (href && !hasil.includes(href)) hasil.push(href);
  }
  return hasil;
}

// Judul dan penulis dari OPF (bila ada).
export function infoBuku(opfXml) {
  const xml = String(opfXml || '');
  const judul = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(xml);
  const penulis = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(xml);
  const bersih = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  return { judul: bersih(judul ? judul[1] : ''), penulis: bersih(penulis ? penulis[1] : '') };
}

// Ubah satu dokumen XHTML jadi daftar blok {jenis: 'judul'|'teks', teks}.
export function xhtmlKeBlok(xhtml) {
  let s = String(xhtml || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const blok = [];
  const pola = /<(h[1-6]|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  const bersih = (t) => t.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_a, n) => { try { return String.fromCodePoint(Number(n)); } catch (e) { return ''; } })
    .replace(/[ \t]+/g, ' ').trim();
  while ((m = pola.exec(s)) !== null) {
    const teks = bersih(m[2]);
    if (!teks) continue;
    blok.push({ jenis: /^h/i.test(m[1]) ? 'judul' : 'teks', teks });
  }
  if (!blok.length) {
    const sisa = bersih(s);
    if (sisa) blok.push({ jenis: 'teks', teks: sisa });
  }
  return blok;
}

// Font PDF bawaan (Helvetica) hanya bisa huruf Latin. Tanda baca umum
// dipetakan ke padanan ASCII, sisanya diganti '?'. Fungsi murni.
export function sanitasiPdf(teks) {
  const peta = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', '•': '-', '·': '-', '«': '"', '»': '"' };
  let hasil = '';
  for (const ch of String(teks || '')) {
    if (peta[ch]) { hasil += peta[ch]; continue; }
    hasil += ch.codePointAt(0) <= 255 ? ch : '?';
  }
  return hasil;
}

// Bungkus teks jadi baris-baris yang muat di lebarMaks. ukur(teks) adalah
// fungsi pengukur lebar (di browser: font.widthOfTextAtSize). Fungsi murni.
export function bungkusTeks(teks, lebarMaks, ukur) {
  const kata = String(teks || '').split(/\s+/).filter(Boolean);
  const baris = [];
  let jalan = '';
  for (const k of kata) {
    const coba = jalan ? jalan + ' ' + k : k;
    if (ukur(coba) <= lebarMaks || !jalan) { jalan = coba; continue; }
    baris.push(jalan);
    jalan = k;
  }
  if (jalan) baris.push(jalan);
  return baris;
}

// ---------- Mesin arah B: PDF → EPUB (dari pdf-ke-epub.js) ----------
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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

// UID unik untuk satu ebook; dipakai bersama oleh OPF dan NCX supaya
// cocok (aturan format EPUB: dtb:uid di NCX harus sama dengan identifier
// di OPF). Sebelumnya NCX memakai nilai hardcoded sementara OPF memakai
// timestamp — tidak pernah cocok. Murni, bisa diuji di Node.
export function buatUid() {
  return 'urn:uuid:adip-tools-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
}

// content.opf (EPUB 3). Murni, bisa diuji di Node.
// uid: bila diisi, dipakai apa adanya supaya sama dengan NCX.
export function bangunOpf(metaBuku, jumlahBab, uid) {
  const idBuku = uid || buatUid();
  const items = ['<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="css" href="style.css" media-type="text/css"/>'];
  for (let i = 1; i <= jumlahBab; i++) items.push(`<item id="bab${i}" href="bab${i}.xhtml" media-type="application/xhtml+xml"/>`);
  const spine = [];
  for (let i = 1; i <= jumlahBab; i++) spine.push(`<itemref idref="bab${i}"/>`);
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">\n<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
    + '<dc:identifier id="uid">' + escXml(idBuku) + '</dc:identifier>\n'
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
// uid WAJIB sama dengan yang dipakai bangunOpf untuk ebook yang sama.
export function bangunNcx(metaBuku, bab, uid) {
  const idBuku = uid || buatUid();
  const isi = bab.map((b, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${escXml(b.judul)}</text></navLabel><content src="bab${i + 1}.xhtml"/></navPoint>`).join('\n');
  return '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">\n<head><meta name="dtb:uid" content="' + escXml(idBuku) + '"/></head>\n'
    + '<docTitle><text>' + escXml(metaBuku.judul || 'Tanpa Judul') + '</text></docTitle>\n<navMap>\n' + isi + '\n</navMap>\n</ncx>\n';
}

export const CONTAINER_XML = '<?xml version="1.0" encoding="utf-8"?>\n'
  + '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
  + '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>\n</container>\n';

// Sakelar arah: dua tombol besar di paling atas. Arah yang aktif tampil
// terbalik (putih di atas hitam) supaya langsung kelihatan tanpa membaca
// kecil-kecil. Kedua panel tetap hidup berdampingan — pindah arah tidak
// menghapus isian di panel yang ditinggalkan.
/* R1 (v6.21.0): alias redirect — kunjungan dari tautan lama arah B
   (#/t/<id-pensiun>) mendarat di sini dengan ?dir=b; buka langsung
   panel arah B. Tanpa ?dir=b, perilaku lama (arah A) tidak berubah. */
function mintaArahB() {
  try {
    const q = (typeof location !== 'undefined' && location.hash.split('?')[1]) || '';
    return /(?:^|&)dir=b(?:&|$)/.test(q);
  } catch {
    return false;
  }
}

function buatSakelarArah(labelA, labelB, panelA, panelB) {
  const bungkus = T.el('<div role="tablist" aria-label="Arah konversi" style="display:flex;gap:8px;margin:2px 0 16px"></div>');
  const GAYA_AKTIF = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff;font-size:15px;font-weight:700;background:#ffffff;color:#000000;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const GAYA_MATI = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff33;font-size:15px;font-weight:600;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const tombolA = document.createElement('button');
  tombolA.type = 'button';
  tombolA.textContent = labelA;
  tombolA.setAttribute('role', 'tab');
  const tombolB = document.createElement('button');
  tombolB.type = 'button';
  tombolB.textContent = labelB;
  tombolB.setAttribute('role', 'tab');
  const atur = (keA) => {
    tombolA.style.cssText = keA ? GAYA_AKTIF : GAYA_MATI;
    tombolB.style.cssText = keA ? GAYA_MATI : GAYA_AKTIF;
    tombolA.setAttribute('aria-selected', keA ? 'true' : 'false');
    tombolB.setAttribute('aria-selected', keA ? 'false' : 'true');
    panelA.hidden = !keA;
    panelB.hidden = keA;
  };
  tombolA.addEventListener('click', () => atur(true));
  tombolB.addEventListener('click', () => atur(false));
  bungkus.appendChild(tombolA);
  bungkus.appendChild(tombolB);
  atur(!mintaArahB());
  return bungkus;
}

function renderEpubKePdf(panel) {
  const fi = T.input('file');
  fi.accept = '.epub,application/epub+zip';
  const box = T.out();
  let fileObj = null, busy = false;

  let libSiap = null;
  const muatLib = () => {
    if (!libSiap) {
      libSiap = (async () => {
        // Loader library kanonis: utils.loadLibOnce (core.js).
        if (!(await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip))) return false;
        if (!(await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib))) return false;
        return true;
      })().catch(() => { libSiap = null; return false; });
    }
    return libSiap;
  };

  const proses = async () => {
    if (busy) return;
    if (!fileObj) { T.show(box, errBox('Pilih dulu file EPUB-nya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.show(box, '<span class="dim">Membaca ebook…</span>');
    try {
      const ok = await muatLib();
      if (!ok) { T.show(box, errBox('Alat konversi tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.')); return; }
      const zip = await window.JSZip.loadAsync(await fileObj.arrayBuffer());
      const containerFile = zip.file('META-INF/container.xml');
      if (!containerFile) { T.show(box, errBox('File ini bukan EPUB yang benar (tidak ada daftar isinya).')); return; }
      const opfPath = cariJalurOpf(await containerFile.async('string'));
      if (!opfPath || !zip.file(opfPath)) { T.show(box, errBox('File EPUB ini rusak: daftar isinya tidak ketemu.')); return; }
      const opfXml = await zip.file(opfPath).async('string');
      const info = infoBuku(opfXml);
      const folderOpf = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
      const bab = daftarBacaan(opfXml);
      if (!bab.length) { T.show(box, errBox('EPUB ini tidak punya bab yang bisa dibaca.')); return; }
      const semuaBlok = [];
      for (const rel of bab) {
        const f = zip.file(folderOpf + rel) || zip.file(rel);
        if (!f) continue;
        const xhtml = await f.async('string');
        semuaBlok.push(...xhtmlKeBlok(xhtml));
      }
      if (!semuaBlok.length) { T.show(box, errBox('Tidak ada teks yang bisa diambil dari ebook ini. EPUB berisi gambar saja atau dikunci DRM tidak bisa diubah.')); return; }

      const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
      const doc = await PDFDocument.create();
      const fontBiasa = await doc.embedFont(StandardFonts.Helvetica);
      const fontTebal = await doc.embedFont(StandardFonts.HelveticaBold);
      if (info.judul) doc.setTitle(info.judul);
      if (info.penulis) doc.setAuthor(info.penulis);
      const LEBAR = 595.28, TINGGI = 841.89, MARGIN = 56;
      const lebarTeks = LEBAR - MARGIN * 2;
      let page = doc.addPage([LEBAR, TINGGI]);
      let y = TINGGI - MARGIN;
      const halamanBaru = () => { page = doc.addPage([LEBAR, TINGGI]); y = TINGGI - MARGIN; };
      const tulisBaris = (teks, font, ukuran, spasi) => {
        if (y - ukuran < MARGIN) halamanBaru();
        page.drawText(teks, { x: MARGIN, y: y - ukuran, size: ukuran, font, color: rgb(0.1, 0.1, 0.1) });
        y -= ukuran + spasi;
      };
      if (info.judul) {
        const judulBaris = bungkusTeks(sanitasiPdf(info.judul), lebarTeks, (t) => fontTebal.widthOfTextAtSize(t, 22));
        judulBaris.forEach((b) => tulisBaris(b, fontTebal, 22, 6));
        if (info.penulis) tulisBaris(sanitasiPdf(info.penulis), fontBiasa, 13, 4);
        y -= 18;
      }
      let halamanAwal = doc.getPageCount();
      for (const blok of semuaBlok) {
        const bersih = sanitasiPdf(blok.teks);
        if (blok.jenis === 'judul') {
          y -= 8;
          const baris = bungkusTeks(bersih, lebarTeks, (t) => fontTebal.widthOfTextAtSize(t, 15));
          baris.forEach((b) => tulisBaris(b, fontTebal, 15, 4));
          y -= 4;
        } else {
          const baris = bungkusTeks(bersih, lebarTeks, (t) => fontBiasa.widthOfTextAtSize(t, 11.5));
          baris.forEach((b) => tulisBaris(b, fontBiasa, 11.5, 4));
          y -= 6;
        }
      }
      const jumlahHalaman = doc.getPageCount() - halamanAwal + 1;
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'ebook';
      T.dl(base + '.pdf', blob, 'application/pdf');
      T.show(box, '<span class="ok">Selesai. PDF terunduh.</span>' +
        kv('Judul', info.judul ? T.esc(info.judul) : 'Tidak terbaca') +
        (info.penulis ? kv('Penulis', T.esc(info.penulis)) : '') +
        kv('Bab', bab.length + ' bab') +
        kv('Halaman PDF', jumlahHalaman + ' halaman') +
        kv('Ukuran PDF', fmtBytes(blob.size)));
      T.toast('PDF terunduh');
    } catch (e) {
      T.show(box, errBox('EPUB tidak bisa diubah. File mungkin rusak atau dikunci DRM.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  };

  const goBtn = T.btn('Ubah jadi PDF', proses, true);

  fi.addEventListener('change', () => {
    fileObj = fi.files && fi.files[0] ? fi.files[0] : null;
    T.hide(box);
    if (!fileObj) return;
    T.show(box, kv('File', T.esc(fileObj.name)) + kv('Ukuran', fmtBytes(fileObj.size)));
  });

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi ebook disusun ulang jadi PDF A4: judul bab ditebalkan, teks mengalir per halaman. Gambar dan tata letak asli tidak ikut. Huruf di luar Latin (misal Arab, Mandarin, emoji) diganti tanda tanya karena font PDF bawaan.</p>'));
  panel.appendChild(T.field('Pilih file EPUB', fi));
  panel.appendChild(T.row(goBtn));
  panel.appendChild(box);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}

function renderPdfKeEpub(panel) {
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
      const uid = buatUid();
      zip.file('OEBPS/content.opf', bangunOpf(metaBuku, bab.length, uid));
      zip.file('OEBPS/nav.xhtml', bangunNav(bab));
      zip.file('OEBPS/toc.ncx', bangunNcx(metaBuku, bab, uid));
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
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Kunci PDF, tab Buka kunci.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi EPUB', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Bab dikenali dari judul seperti "Bab 1" atau judul huruf besar. Bila tidak ada judul yang dikenali, ebook dipecah per 12 halaman. Gambar dan tabel tidak ikut pindah.</p>'));
  panel.appendChild(T.field('Pilih file PDF', fi));
  panel.appendChild(T.field('Judul ebook', judulI));
  panel.appendChild(T.field('Nama penulis', penulisI));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderEpubKePdf(panelA);
  renderPdfKeEpub(panelB);
  root.appendChild(buatSakelarArah('EPUB → PDF', 'PDF → EPUB', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
