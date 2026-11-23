// MERGE B26 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = pdf-ke-word (survivor), arah B = word-ke-pdf (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

export const meta = {"id": "pdf-ke-word", "name": "PDF ↔ Word", "cat": "produktivitas", "icon": "📝", "desc": "Ambil teks PDF jadi dokumen Word, atau ubah dokumen Word jadi PDF.", "keywords": "pdf ke word,pdf ke docx,ambil teks pdf,konversi pdf,word ke pdf,docx ke pdf,konversi word,dokumen ke pdf,pdf,word", "since": "6.16.0", "online": true};


const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
const MAKS_HALAMAN = 200;

// Kelompokkan potongan teks pdf.js jadi baris, lalu baris jadi paragraf.
// Potongan satu baris = posisi Y hampir sama; jarak antar-baris yang jauh
// (lebih dari 1,8x tinggi huruf) = paragraf baru. Murni, bisa diuji di Node.
export function teksKeParagraf(items) {
  const baris = [];
  const urut = items.slice().sort((a, b) => {
    const dy = (b.transform[5] || 0) - (a.transform[5] || 0);
    if (Math.abs(dy) > 2) return dy;
    return (a.transform[4] || 0) - (b.transform[4] || 0);
  });
  for (const it of urut) {
    const teks = String(it.str || '');
    if (!teks.trim()) continue;
    const y = it.transform[5] || 0;
    const x = it.transform[4] || 0;
    const h = Math.abs(it.transform[3] || it.height || 12) || 12;
    const terakhir = baris[baris.length - 1];
    if (terakhir && Math.abs(terakhir.y - y) <= Math.max(2, h * 0.4)) {
      terakhir.potong.push({ x, teks });
    } else {
      baris.push({ y, h, potong: [{ x, teks }] });
    }
  }
  const paragraf = [];
  let jalan = '';
  let ySebelumnya = null;
  for (const b of baris) {
    b.potong.sort((a, c) => a.x - c.x);
    const teksBaris = b.potong.map((p) => p.teks).join('').replace(/\s+/g, ' ').trim();
    if (!teksBaris) continue;
    if (ySebelumnya !== null && Math.abs(ySebelumnya - b.y) > b.h * 1.8 && jalan) {
      paragraf.push(jalan);
      jalan = '';
    }
    jalan = jalan ? jalan + ' ' + teksBaris : teksBaris;
    ySebelumnya = b.y;
  }
  if (jalan) paragraf.push(jalan);
  return paragraf;
}

// ---------- Mesin arah B: Word → PDF (dari word-ke-pdf.js) ----------
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

function renderPdfKeWord(panel) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF dan Word… (perlu internet sekali saja)</span>');
    const [pdfOk, docxOk] = await Promise.all([utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }), utils.loadLibOnce(DOCX_CDN, () => !!window.docx && typeof window.docx.Document === 'function')]);
    if (!pdfOk || !docxOk) {
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
      const semuaParagraf = []; // [{judul, paragraf[]}]
      let totalParagraf = 0;
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const paragraf = teksKeParagraf(konten.items || []);
        semuaParagraf.push({ judul: `Halaman ${i}`, paragraf });
        totalParagraf += paragraf.length;
      }
      await doc.destroy();
      if (!totalParagraf) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar).</div>');
        prosesB.disabled = false;
        return;
      }
      T.show(statusBox, '<span class="dim">Menyusun dokumen Word…</span>');
      const D = window.docx;
      const anak = [];
      semuaParagraf.forEach((hal, hi) => {
        if (hi > 0) anak.push(new D.Paragraph({ children: [new D.PageBreak()] }));
        anak.push(new D.Paragraph({ children: [new D.TextRun({ text: hal.judul, bold: true, size: 28 })], spacing: { after: 200 } }));
        hal.paragraf.forEach((p) => {
          anak.push(new D.Paragraph({ children: [new D.TextRun({ text: p, size: 24 })], spacing: { after: 120 } }));
        });
      });
      const dokumen = new D.Document({ sections: [{ children: anak }] });
      const blob = await D.Packer.toBlob(dokumen);
      T.hide(statusBox);
      T.show(box, `<p class="note">Teks dari <b>${total} halaman</b> (${totalParagraf} paragraf) sudah disusun jadi dokumen Word.<br>Tata letak aslinya tidak dipertahankan, yang pindah hanya teks dan paragrafnya.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh Word (.docx)', () => { T.dl(`${namaDasar}.docx`, blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); T.toast('Berhasil diunduh'); }, true));
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

  const prosesB = T.btn('Ubah Jadi Word', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Yang pindah hanya teks dan paragrafnya. Tata letak rumit seperti kolom dan tabel tidak dipertahankan, dan PDF hasil scan (isinya gambar) tidak bisa diambil teksnya.</p>'));
  panel.appendChild(T.field('Pilih file PDF', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

function renderWordKePdf(panel) {
  const fi = fileInput('.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file Word (.docx) dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const [pdfOk, zipOk] = await Promise.all([utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib), utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip)]);
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

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Yang pindah hanya teks dan paragrafnya. Tabel, gambar, dan tata letak rumit tidak dipertahankan. Hanya file .docx yang bisa dibaca, file .doc lama belum bisa.</p>'));
  panel.appendChild(T.field('Pilih file Word (.docx)', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderPdfKeWord(panelA);
  renderWordKePdf(panelB);
  root.appendChild(buatSakelarArah('PDF → Word', 'Word → PDF', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
