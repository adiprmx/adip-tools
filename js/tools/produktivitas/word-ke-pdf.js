import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Word ke PDF: baca dokumen Word (.docx), ambil teksnya, susun jadi PDF.
// File .docx adalah ZIP berisi document.xml; teksnya diambil dari sana
// dengan JSZip + DOMParser, lalu ditulis ke PDF dengan pdf-lib.
// BATASAN JUJUR (ditulis juga di UI): yang pindah hanya teks + paragraf;
// tata letak rumit (tabel, gambar, kolom, posisi persis) TIDAK dipertahankan.
// File .doc lama (bukan .docx) tidak bisa dibaca di sini.
export const meta = {"id": "word-ke-pdf", "name": "Word ke PDF", "cat": "produktivitas", "icon": "📄", "desc": "Ubah dokumen Word jadi PDF, teksnya tetap bisa dicari.", "keywords": "word ke pdf,docx ke pdf,konversi word,dokumen ke pdf", "since": "6.16.0"};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const MAKS_PARAGRAF = 2000;

// Ambil daftar paragraf dari XML document.xml (murni, bisa diuji di Node
// dengan DOMParser tiruan; di browser pakai DOMParser asli).
export function xmlKeParagraf(xmlDoc) {
  const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const daftarP = xmlDoc.getElementsByTagNameNS(NS, 'p');
  const hasil = [];
  for (let i = 0; i < daftarP.length; i++) {
    const teks = [];
    const runs = daftarP[i].getElementsByTagNameNS(NS, 't');
    for (let j = 0; j < runs.length; j++) teks.push(runs[j].textContent || '');
    const gabung = teks.join('').replace(/\s+/g, ' ').trim();
    if (gabung) hasil.push(gabung);
  }
  return hasil;
}

// Potong satu paragraf jadi baris-baris yang muat di lebar halaman.
// ukur(teks) -> lebar dalam pt. Murni, bisa diuji tanpa DOM.
export function bungkusBaris(teks, lebarMaks, ukur) {
  const kata = teks.split(/\s+/).filter(Boolean);
  const baris = [];
  let jalan = '';
  for (const k of kata) {
    const coba = jalan ? jalan + ' ' + k : k;
    if (ukur(coba) <= lebarMaks) { jalan = coba; continue; }
    if (jalan) baris.push(jalan);
    // Kata tunggal yang lebih lebar dari halaman: potong per huruf.
    if (ukur(k) > lebarMaks) {
      let sisa = k;
      while (sisa && ukur(sisa) > lebarMaks) {
        let potong = sisa.length - 1;
        while (potong > 1 && ukur(sisa.slice(0, potong)) > lebarMaks) potong--;
        baris.push(sisa.slice(0, potong));
        sisa = sisa.slice(potong);
      }
      jalan = sisa;
    } else {
      jalan = k;
    }
  }
  if (jalan) baris.push(jalan);
  return baris;
}

export function render(root) {
  const fi = fileInput('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  let pdfLibSiap = null, jsZipSiap = null;

  const muatPdfLib = () => {
    if (!pdfLibSiap) {
      pdfLibSiap = T.loadScript(PDFLIB_CDN).then((ok) => ok && !!window.PDFLib)
        .catch(() => { pdfLibSiap = null; return false; });
    }
    return pdfLibSiap;
  };
  const muatJsZip = () => {
    if (!jsZipSiap) {
      jsZipSiap = T.loadScript(JSZIP_CDN).then((ok) => ok && !!window.JSZip)
        .catch(() => { jsZipSiap = null; return false; });
    }
    return jsZipSiap;
  };

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file Word (.docx) dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const [pdfOk, zipOk] = await Promise.all([muatPdfLib(), muatJsZip()]);
    if (!pdfOk || !zipOk) {
      T.show(statusBox, '<div class="err">Mesin gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      T.show(statusBox, '<span class="dim">Membaca dokumen Word…</span>');
      const zip = await window.JSZip.loadAsync(f);
      const xmlFile = zip.file('word/document.xml');
      if (!xmlFile) throw new Error('bukan-docx');
      const xmlTeks = await xmlFile.async('text');
      const xmlDoc = new DOMParser().parseFromString(xmlTeks, 'text/xml');
      if (xmlDoc.getElementsByTagName('parsererror').length) throw new Error('xml-rusak');
      let paragraf = xmlKeParagraf(xmlDoc);
      if (!paragraf.length) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari dokumen ini. Dokumennya mungkin hanya berisi gambar.</div>');
        prosesB.disabled = false;
        return;
      }
      if (paragraf.length > MAKS_PARAGRAF) paragraf = paragraf.slice(0, MAKS_PARAGRAF);
      T.show(statusBox, '<span class="dim">Menyusun PDF…</span>');
      const L = window.PDFLib;
      const doc = await L.PDFDocument.create();
      const font = await doc.embedFont(L.StandardFonts.Helvetica);
      const fontTebal = await doc.embedFont(L.StandardFonts.HelveticaBold);
      const UKURAN = 12, TINGGI_BARIS = 18, MARGIN = 56;
      const LEBAR_HAL = 595.28, TINGGI_HAL = 841.89; // A4
      const lebarTeks = LEBAR_HAL - MARGIN * 2;
      const ukur = (t) => font.widthOfTextAtSize(t, UKURAN);
      let page = doc.addPage([LEBAR_HAL, TINGGI_HAL]);
      let y = TINGGI_HAL - MARGIN;
      let halaman = 1;
      const halamanBaru = () => { page = doc.addPage([LEBAR_HAL, TINGGI_HAL]); y = TINGGI_HAL - MARGIN; halaman++; };
      paragraf.forEach((p, idx) => {
        // Paragraf pertama dianggap judul: ditebalkan dan sedikit besar.
        const fnt = idx === 0 ? fontTebal : font;
        const ukuran = idx === 0 ? 16 : UKURAN;
        const tinggi = idx === 0 ? 22 : TINGGI_BARIS;
        const ukurJudul = (t) => fnt.widthOfTextAtSize(t, ukuran);
        const baris = bungkusBaris(p, lebarTeks, idx === 0 ? ukurJudul : ukur);
        for (const b of baris) {
          if (y - tinggi < MARGIN) halamanBaru();
          page.drawText(b, { x: MARGIN, y: y - ukuran, size: ukuran, font: fnt, color: L.rgb(0.09, 0.08, 0.07) });
          y -= tinggi;
        }
        y -= 6; // jarak antar paragraf
        if (y < MARGIN + TINGGI_BARIS && idx < paragraf.length - 1) halamanBaru();
      });
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, `<p class="note">PDF jadi: <b>${halaman} halaman</b> dari ${paragraf.length} paragraf.<br>Tata letak aslinya tidak dipertahankan, yang pindah hanya teks dan paragrafnya.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF', () => { T.dl(`${namaDasar}.pdf`, blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      const bukanDocx = e && (e.message === 'bukan-docx' || e.message === 'xml-rusak');
      T.show(statusBox, bukanDocx
        ? '<div class="err">File ini bukan dokumen Word (.docx) yang benar. File .doc lama belum bisa dibaca di sini, simpan dulu sebagai .docx di aplikasi Word.</div>'
        : '<div class="err">Dokumen tidak bisa dibaca. Pastikan filenya .docx yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi PDF', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang pindah hanya teks dan paragrafnya. Tabel, gambar, dan tata letak rumit tidak dipertahankan. Hanya file .docx yang bisa dibaca, file .doc lama belum bisa.</p>'));
  root.appendChild(T.field('Pilih file Word (.docx)', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
