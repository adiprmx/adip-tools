import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke Word: ambil teks dari PDF lalu susun jadi dokumen Word (.docx).
// Teks diambil per halaman dengan pdf.js (Mozilla), dokumen Word-nya
// dibuat dengan pustaka docx. BATASAN JUJUR (ditulis juga di UI): yang
// pindah hanya teks + paragraf + judul per halaman; tata letak rumit
// (kolom, tabel, posisi persis) TIDAK dipertahankan. PDF yang isinya
// hanya gambar (hasil scan) tidak punya teks untuk diambil.
export const meta = {"id": "pdf-ke-word", "name": "PDF ke Word", "cat": "produktivitas", "icon": "📝", "desc": "Ambil teks PDF jadi dokumen Word yang bisa diedit.", "keywords": "pdf ke word,pdf ke docx,ambil teks pdf,konversi pdf", "since": "6.16.0"};

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

export function render(root) {
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
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Buka Kunci PDF.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi Word', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Yang pindah hanya teks dan paragrafnya. Tata letak rumit seperti kolom dan tabel tidak dipertahankan, dan PDF hasil scan (isinya gambar) tidak bisa diambil teksnya.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
