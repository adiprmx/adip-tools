import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "epub-ke-pdf", "name": "EPUB ke PDF", "cat": "converter", "icon": "📕", "desc": "Ubah ebook EPUB jadi PDF A4 yang rapi.", "keywords": "epub,pdf,ebook,buku,konversi,dokumen", "since": "6.19.0"};

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

export function render(root) {
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi ebook disusun ulang jadi PDF A4: judul bab ditebalkan, teks mengalir per halaman. Gambar dan tata letak asli tidak ikut. Huruf di luar Latin (misal Arab, Mandarin, emoji) diganti tanda tanya karena font PDF bawaan.</p>'));
  root.appendChild(T.field('Pilih file EPUB', fi));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
