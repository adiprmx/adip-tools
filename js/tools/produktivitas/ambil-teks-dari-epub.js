import { h as T, fileInput, LOCAL_NOTE } from '../../core.js';

// Ambil Teks dari EPUB: tarik semua teks dari ebook EPUB jadi teks biasa.
// File EPUB adalah ZIP: daftar isi dibaca dari META-INF/container.xml,
// urutan baca dari file OPF (manifest + spine), lalu tiap bab XHTML
// diubah jadi teks. Mesinnya JSZip.
// BATASAN JUJUR: yang keluar hanya teks polos per bab; gambar, catatan
// kaki, dan tata letak tidak ikut. EPUB yang dikunci DRM tidak bisa dibaca.
export const meta = {"id": "ambil-teks-dari-epub", "name": "Ambil Teks dari EPUB", "cat": "produktivitas", "icon": "📖", "desc": "Tarik semua teks dari ebook EPUB jadi teks biasa.", "keywords": "epub ke teks,ambil teks epub,baca epub,ekstrak ebook", "since": "6.17.0"};

const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

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

export function render(root) {
  const fi = fileInput('.epub,application/epub+zip');
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
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file EPUB dulu'); return; }
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
      T.show(statusBox, '<span class="dim">Membuka ebook…</span>');
      const zip = await window.JSZip.loadAsync(f);
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
      const teks = teksBab.join('\n\n');
      const namaDasar = (f.name || 'ebook').replace(/\.[^.]*$/, '');
      const jumlahKata = teks.split(/\s+/).filter(Boolean).length;
      T.hide(statusBox);
      const judulBaris = info.judul ? `<p class="note"><b>${T.esc(info.judul)}</b>${info.penulis ? ' oleh ' + T.esc(info.penulis) : ''}</p>` : '';
      T.show(box, `${judulBaris}<p class="note">Teks berhasil diambil dari <b>${teksBab.length} bab</b> (${T.fmt(jumlahKata)} kata).</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">${T.esc(teks)}</pre>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl(namaDasar + '.txt', teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      hasilBox.appendChild(T.copyBtn(() => teks, 'Salin Teks'));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, e && e.message === 'bukan-epub'
        ? '<div class="err">File ini bukan ebook EPUB yang benar, atau strukturnya tidak bisa dibaca.</div>'
        : '<div class="err">Ebook tidak bisa dibuka. Pastikan filenya EPUB yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ambil Teksnya', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang keluar hanya teks polos per babnya saja. Gambar, catatan kaki, dan tata letak tidak ikut. EPUB yang dikunci tidak bisa dibaca.</p>'));
  root.appendChild(T.field('Pilih file EPUB', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
