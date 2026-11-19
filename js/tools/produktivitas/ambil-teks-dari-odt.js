import { h as T, utils, fileInput, LOCAL_NOTE } from '../../core.js';

// Ambil Teks dari ODT: tarik semua teks dari dokumen LibreOffice (.odt)
// jadi teks biasa. File ODT adalah ZIP: isi dokumennya ada di
// content.xml, info judul/penulis (bila ada) di meta.xml. Mesinnya JSZip,
// sama seperti tool EPUB.
// BATASAN JUJUR: yang keluar hanya teks polos; tabel jadi teks berurutan,
// gambar, catatan kaki, dan tata letak tidak ikut.
export const meta = {"id": "ambil-teks-dari-odt", "name": "Ambil Teks dari ODT", "cat": "produktivitas", "icon": "📄", "desc": "Tarik semua teks dari dokumen LibreOffice (.odt) jadi teks biasa.", "keywords": "odt ke teks,ambil teks odt,libreoffice,openoffice,dokumen odt,ekstrak odt", "since": "6.18.0"};

const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';

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

export function render(root) {
  const fi = fileInput('.odt,application/vnd.oasis.opendocument.text');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file ODT dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin ODT… (perlu internet sekali saja)</span>');
    const ok = await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip);
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin ODT gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      T.show(statusBox, '<span class="dim">Membuka dokumen…</span>');
      const zip = await window.JSZip.loadAsync(f);
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
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const jumlahKata = teks.split(/\s+/).filter(Boolean).length;
      T.hide(statusBox);
      const judulBaris = info.judul ? `<p class="note"><b>${T.esc(info.judul)}</b>${info.penulis ? ' oleh ' + T.esc(info.penulis) : ''}</p>` : '';
      T.show(box, `${judulBaris}<p class="note">Teks berhasil diambil (${T.fmt(jumlahKata)} kata).</p><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;max-height:420px;overflow:auto">${T.esc(teks)}</pre>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl(namaDasar + '.txt', teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
      hasilBox.appendChild(T.copyBtn(() => teks, 'Salin Teks'));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, e && e.message === 'bukan-odt'
        ? '<div class="err">File ini bukan dokumen ODT yang benar, atau isinya tidak bisa dibaca.</div>'
        : e && e.message === 'kosong'
          ? '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin kosong atau hanya berisi gambar.</div>'
          : '<div class="err">Dokumen tidak bisa dibuka. Pastikan filenya ODT yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ambil Teksnya', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang keluar hanya teks polosnya saja. Tabel jadi teks berurutan, gambar dan tata letak tidak ikut.</p>'));
  root.appendChild(T.field('Pilih file ODT', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
