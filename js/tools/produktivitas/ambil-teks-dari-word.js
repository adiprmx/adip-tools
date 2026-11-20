import { h as T, utils, fileInput, LOCAL_NOTE } from '../../core.js';

// Ambil Teks dari Dokumen: tarik semua teks dari dokumen Word (.docx),
// ebook EPUB, atau dokumen LibreOffice (.odt) jadi teks biasa yang bisa
// disalin atau diunduh. Format file terdeteksi otomatis dari nama dan isi.
// Hasil gabung v6.21.0 (B6): Ambil Teks dari Word (mammoth.js) +
// Ambil Teks dari EPUB (JSZip + OPF/spine) + Ambil Teks dari ODT
// (JSZip + content.xml).
// BATASAN JUJUR: yang keluar hanya teks polos, tanpa tebal, miring,
// atau tata letak. File .doc lama (bukan .docx) tidak bisa dibaca.
// EPUB yang dikunci tidak bisa dibaca.
export const meta = {"id": "ambil-teks-dari-word", "name": "Ambil Teks dari Dokumen", "cat": "produktivitas", "icon": "📄", "desc": "Tarik semua teks dari dokumen Word (.docx), ebook EPUB, atau LibreOffice (.odt) jadi teks biasa.", "keywords": "ambil teks word,docx ke teks,ekstrak teks word,baca docx,epub ke teks,ambil teks epub,baca epub,odt ke teks,ambil teks odt,libreoffice,dokumen", "since": "6.17.0"};

const MAMMOTH_CDN = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

// Rapikan teks mentah: buang baris kosong berlebih dan spasi di ujung
// baris, tanpa mengubah isi. Murni, bisa diuji di Node.
export function rapikanTeksMentah(teks) {
  return String(teks || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((b) => b.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Tebak format dokumen dari nama file. Murni, bisa diuji di Node.
// Kembalikan 'docx', 'epub', 'odt', atau '' bila tidak dikenal.
export function deteksiFormatDokumen(namaFile) {
  const n = String(namaFile || '').toLowerCase();
  if (/\.docx$/.test(n)) return 'docx';
  if (/\.epub$/.test(n)) return 'epub';
  if (/\.odt$/.test(n)) return 'odt';
  return '';
}

// Tebak format dokumen dari isi ZIP (daftar nama entri). Murni, bisa
// diuji di Node. Dipakai bila nama file tidak memberi petunjuk.
export function deteksiDariIsiZip(namaEntri) {
  const daftar = namaEntri || [];
  if (daftar.includes('word/document.xml')) return 'docx';
  if (daftar.includes('META-INF/container.xml')) return 'epub';
  if (daftar.includes('content.xml')) return 'odt';
  return '';
}

/* ---------- Mesin EPUB (JSZip + OPF/spine) ---------- */

// Cari jalur file OPF dari container.xml. Murni, bisa diuji di Node.
export function cariJalurOpf(containerXml) {
  const m = /<rootfile[^>]*full-path=["']([^"']+)["']/i.exec(String(containerXml || ''));
  return m ? m[1] : '';
}

// Urutan baca dari OPF: pasangkan spine (idref) dengan manifest (id->href),
// kembalikan daftar jalur relatif terhadap folder OPF. Murni, bisa diuji di Node.
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

// Ubah satu dokumen XHTML jadi teks polos. Murni, bisa diuji di Node.
export function xhtmlKeTeks(xhtml) {
  let s = String(xhtml || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  s = s.replace(/&#(\d+);/g, (_m, n) => { try { return String.fromCodePoint(Number(n)); } catch (e) { return ''; } });
  return s.split('\n').map((b) => b.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

// Judul dan penulis dari OPF (bila ada). Murni, bisa diuji di Node.
export function infoBuku(opfXml) {
  const xml = String(opfXml || '');
  const judul = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(xml);
  const penulis = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(xml);
  return {
    judul: judul ? judul[1].replace(/<[^>]+>/g, '').trim() : '',
    penulis: penulis ? penulis[1].replace(/<[^>]+>/g, '').trim() : '',
  };
}

/* ---------- Mesin ODT (JSZip + content.xml) ---------- */

// Ubah isi content.xml (ODF) jadi teks polos. Murni, bisa diuji di Node.
export function odtXmlKeTeks(xml) {
  let s = String(xml || '');
  s = s.replace(/<text:tracked-changes>[\s\S]*?<\/text:tracked-changes>/gi, ' ');
  s = s.replace(/<office:annotation>[\s\S]*?<\/office:annotation>/gi, ' ');
  s = s.replace(/<text:note[^>]*>[\s\S]*?<\/text:note>/gi, ' ');
  s = s.replace(/<text:line-break\s*\/>/gi, '\n');
  s = s.replace(/<text:tab\s*\/>/gi, '\t');
  s = s.replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/>/gi, (_m, n) => ' '.repeat(Math.min(50, Number(n) || 1)));
  s = s.replace(/<\/(text:p|text:h|text:list-item|table:table-row|table:table-cell)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  s = s.replace(/&#(\d+);/g, (_m, n) => { try { return String.fromCodePoint(Number(n)); } catch (e) { return ''; } });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return ''; } });
  return s.split('\n').map((b) => b.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n');
}

// Judul dan penulis dari meta.xml (bila ada). Murni, bisa diuji di Node.
export function infoOdt(metaXml) {
  const xml = String(metaXml || '');
  const judul = /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i.exec(xml);
  const penulis = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(xml);
  return {
    judul: judul ? judul[1].replace(/<[^>]+>/g, '').trim() : '',
    penulis: penulis ? penulis[1].replace(/<[^>]+>/g, '').trim() : '',
  };
}

const NAMA_FORMAT = { docx: 'Word (.docx)', epub: 'EPUB', odt: 'ODT' };

export function render(root) {
  const fi = fileInput('.docx,.epub,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/epub+zip,application/vnd.oasis.opendocument.text');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  const tampilkanHasil = (teks, f, info, catatan) => {
    const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
    const jumlahKata = teks.split(/\s+/).filter(Boolean).length;
    T.hide(statusBox);
    const judulBaris = info && info.judul ? `<p class="note"><b>${T.esc(info.judul)}</b>${info.penulis ? ' oleh ' + T.esc(info.penulis) : ''}</p>` : '';
    T.show(box, `${judulBaris}<p class="note">Teks berhasil diambil${catatan ? ' ' + catatan : ''} (${T.fmt(jumlahKata)} kata).</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">${T.esc(teks)}</pre>`);
    T.show(hasilBox, '');
    hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl(namaDasar + '.txt', teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
    hasilBox.appendChild(T.copyBtn(() => teks, 'Salin Teks'));
    T.scrollToPreview(box);
  };

  const gagalMuatMesin = (namaMesin) => {
    T.show(statusBox, '<div class="err">Mesin ' + namaMesin + ' gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
    statusBox.querySelector('button').addEventListener('click', proses);
    prosesB.disabled = false;
  };

  async function prosesDocx(f) {
    T.show(statusBox, '<span class="dim">Memuat mesin Word… (perlu internet sekali saja)</span>');
    const ok = await utils.loadLibOnce(MAMMOTH_CDN, () => !!window.mammoth && typeof window.mammoth.extractRawText === 'function');
    if (!ok) { gagalMuatMesin('Word'); return; }
    T.show(statusBox, '<span class="dim">Membaca dokumen…</span>');
    const buf = await f.arrayBuffer();
    const hasil = await window.mammoth.extractRawText({ arrayBuffer: buf });
    const teks = rapikanTeksMentah(hasil && hasil.value);
    if (!teks) {
      T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin hanya berisi gambar.</div>');
      prosesB.disabled = false;
      return;
    }
    tampilkanHasil(teks, f, null, 'dari dokumen Word');
  }

  async function prosesEpub(f, zipAwal) {
    let zip = zipAwal;
    if (!zip) {
      T.show(statusBox, '<span class="dim">Memuat mesin EPUB… (perlu internet sekali saja)</span>');
      const ok = await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip);
      if (!ok) { gagalMuatMesin('EPUB'); return; }
      T.show(statusBox, '<span class="dim">Membuka ebook…</span>');
      zip = await window.JSZip.loadAsync(f);
    }
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('bukan-epub');
    const containerXml = await containerFile.async('text');
    const jalurOpf = cariJalurOpf(containerXml);
    if (!jalurOpf) throw new Error('bukan-epub');
    const opfFile = zip.file(jalurOpf);
    if (!opfFile) throw new Error('bukan-epub');
    const opfXml = await opfFile.async('text');
    const info = infoBuku(opfXml);
    const folderOpf = jalurOpf.includes('/') ? jalurOpf.slice(0, jalurOpf.lastIndexOf('/') + 1) : '';
    const bab = daftarBacaan(opfXml);
    if (!bab.length) throw new Error('bukan-epub');
    const teksBab = [];
    for (let i = 0; i < bab.length; i++) {
      T.show(statusBox, `<span class="dim">Membaca bab ${i + 1} dari ${bab.length}…</span>`);
      const file = zip.file(folderOpf + bab[i]) || zip.file(decodeURIComponent(folderOpf + bab[i]));
      if (!file) continue;
      const xhtml = await file.async('text');
      const teks = xhtmlKeTeks(xhtml);
      if (teks) teksBab.push(teks);
    }
    if (!teksBab.length) {
      T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari ebook ini. Ebooknya mungkin dikunci atau hanya berisi gambar.</div>');
      prosesB.disabled = false;
      return;
    }
    tampilkanHasil(teksBab.join('\n\n'), f, info, 'dari <b>' + teksBab.length + ' bab</b>');
  }

  async function prosesOdt(f, zipAwal) {
    let zip = zipAwal;
    if (!zip) {
      T.show(statusBox, '<span class="dim">Memuat mesin ODT… (perlu internet sekali saja)</span>');
      const ok = await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip);
      if (!ok) { gagalMuatMesin('ODT'); return; }
      T.show(statusBox, '<span class="dim">Membuka dokumen…</span>');
      zip = await window.JSZip.loadAsync(f);
    }
    const contentFile = zip.file('content.xml');
    if (!contentFile) throw new Error('bukan-odt');
    const contentXml = await contentFile.async('text');
    const teks = odtXmlKeTeks(contentXml);
    if (!teks) throw new Error('kosong');
    let info = { judul: '', penulis: '' };
    const metaFile = zip.file('meta.xml');
    if (metaFile) {
      try { info = infoOdt(await metaFile.async('text')); } catch (e) { /* meta rusak, abaikan */ }
    }
    tampilkanHasil(teks, f, info, 'dari dokumen ODT');
  }

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file dokumen dulu (.docx, .epub, atau .odt)'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    try {
      let fmt = deteksiFormatDokumen(f.name);
      let zipAwal = null;
      if (!fmt) {
        // Nama file tidak memberi petunjuk: intip isi ZIP-nya.
        T.show(statusBox, '<span class="dim">Mengenali jenis dokumen…</span>');
        const ok = await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip);
        if (!ok) { gagalMuatMesin('dokumen'); return; }
        zipAwal = await window.JSZip.loadAsync(f);
        fmt = deteksiDariIsiZip(Object.keys(zipAwal.files || {}));
        if (!fmt) {
          T.show(statusBox, '<div class="err">Jenis dokumen ini tidak dikenali. Yang bisa dibaca di sini: Word (.docx), ebook EPUB (.epub), dan LibreOffice (.odt).</div>');
          prosesB.disabled = false;
          return;
        }
      }
      if (fmt === 'docx') await prosesDocx(f);
      else if (fmt === 'epub') await prosesEpub(f, zipAwal);
      else await prosesOdt(f, zipAwal);
    } catch (e) {
      T.show(statusBox, e && e.message === 'bukan-epub'
        ? '<div class="err">File ini bukan ebook EPUB yang benar, atau strukturnya tidak bisa dibaca.</div>'
        : e && e.message === 'bukan-odt'
          ? '<div class="err">File ini bukan dokumen ODT yang benar, atau isinya tidak bisa dibaca.</div>'
          : e && e.message === 'kosong'
            ? '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin kosong atau hanya berisi gambar.</div>'
            : '<div class="err">Dokumen tidak bisa dibuka. Pastikan filenya ' + (NAMA_FORMAT[deteksiFormatDokumen(f.name)] || 'yang benar') + ' dan tidak rusak. File .doc lama belum bisa dibaca di sini.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ambil Teksnya', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang keluar hanya teks polosnya saja, tanpa tebal, miring, atau tata letak. Cocok buat menyalin isi dokumen ke tempat lain. Jenis dokumen dikenali otomatis dari file yang kamu pilih.</p>'));
  root.appendChild(T.field('Pilih file dokumen (.docx, .epub, atau .odt)', fi, 'Word, ebook EPUB, atau LibreOffice. File .doc lama belum bisa dibaca.'));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
