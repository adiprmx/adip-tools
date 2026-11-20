import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke PowerPoint: ubah PDF jadi presentasi .pptx. Tiap halaman PDF
// jadi satu slide berisi gambar halaman itu (tampilannya persis seperti
// di PDF), dan teks halamannya disimpan di catatan slide supaya tetap
// bisa dicari. Mesinnya pdf.js + PptxGenJS.
// BATASAN JUJUR: slide-nya gambar, bukan teks yang bisa diedit; teks
// hanya ada di catatan slide. PDF hasil scan tetap jadi gambar, tapi
// tanpa teks di catatannya.
export const meta = {"id": "pdf-ke-powerpoint", "name": "PDF ke PowerPoint", "cat": "produktivitas", "icon": "📊", "desc": "Ubah PDF jadi presentasi, tiap halaman jadi satu slide.", "keywords": "pdf ke pptx,pdf ke powerpoint,pdf jadi presentasi,konversi pdf", "since": "6.17.0"};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const PPTX_CDN = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
const MAKS_HALAMAN = 50;
const SKALA_GAMBAR = 1.5;
// Ukuran slide layar lebar 16:9 dalam inci (standar PptxGenJS).
export const LEBAR_SLIDE = 13.33;
export const TINGGI_SLIDE = 7.5;

// Hitung penempatan gambar di slide: pas di tengah dengan rasio asli.
// Murni, bisa diuji di Node. Mengembalikan {x, y, w, h} dalam inci.
export function hitungPenempatan(lebarGambar, tinggiGambar) {
  const rasioGambar = (lebarGambar || 1) / (tinggiGambar || 1);
  const rasioSlide = LEBAR_SLIDE / TINGGI_SLIDE;
  let w, h;
  if (rasioGambar > rasioSlide) {
    w = LEBAR_SLIDE;
    h = LEBAR_SLIDE / rasioGambar;
  } else {
    h = TINGGI_SLIDE;
    w = TINGGI_SLIDE * rasioGambar;
  }
  return { x: (LEBAR_SLIDE - w) / 2, y: (TINGGI_SLIDE - h) / 2, w, h };
}

// Kelompokkan potongan teks pdf.js jadi satu teks mengalir.
// Murni, bisa diuji di Node.
export function itemsKeTeks(items) {
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
    const x = it.transform[4] || 0;
    const h = Math.abs(it.transform[3] || it.height || 12) || 12;
    const lebar = it.width || teks.length * h * 0.5;
    const terakhir = baris[baris.length - 1];
    if (terakhir && Math.abs(terakhir.y - y) <= Math.max(2, h * 0.4)) {
      terakhir.potong.push({ x, teks, lebar });
    } else {
      baris.push({ y, h, potong: [{ x, teks, lebar }] });
    }
  }
  return baris.map((b) => {
    b.potong.sort((a, c) => a.x - c.x);
    let teksBaris = '';
    let ujung = null;
    for (const p of b.potong) {
      if (ujung !== null && p.x > ujung + 1) teksBaris += ' ';
      teksBaris += p.teks;
      ujung = p.x + p.lebar;
    }
    return teksBaris.replace(/\s+/g, ' ').trim();
  }).filter(Boolean).join('\n');
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
    T.show(statusBox, '<span class="dim">Memuat mesin PDF dan PowerPoint… (perlu internet sekali saja)</span>');
    const [pdfOk, pptxOk] = await Promise.all([utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }), utils.loadLibOnce(PPTX_CDN, () => typeof window.PptxGenJS === 'function')]);
    if (!pdfOk || !pptxOk) {
      T.show(statusBox, '<div class="err">Mesin gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const jumlahAsli = doc.numPages;
      const total = Math.min(jumlahAsli, MAKS_HALAMAN);
      const pptx = new window.PptxGenJS();
      pptx.defineLayout({ name: 'LEBAR', width: LEBAR_SLIDE, height: TINGGI_SLIDE });
      pptx.layout = 'LEBAR';
      pptx.title = namaDasar;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let halamanAdaTeks = 0;
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Mengubah halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: SKALA_GAMBAR });
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        // Isi putih dulu: tanpa ini, area transparan PDF jadi hitam saat
        // diubah ke JPEG (JPEG tidak punya transparansi).
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const gambar = canvas.toDataURL('image/jpeg', 0.85);
        const konten = await page.getTextContent();
        const teks = itemsKeTeks(konten.items || []);
        if (teks) halamanAdaTeks++;
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };
        const pos = hitungPenempatan(canvas.width, canvas.height);
        slide.addImage({ data: gambar, x: pos.x, y: pos.y, w: pos.w, h: pos.h });
        if (teks) slide.addNotes(teks.slice(0, 4000));
      }
      await doc.destroy();
      T.show(statusBox, '<span class="dim">Menyusun file presentasi…</span>');
      const blob = await pptx.write({ outputType: 'blob' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Presentasi jadi: <b>${total} slide</b>. Teks halaman tersimpan di catatan slide (${halamanAdaTeks} dari ${total} halaman punya teks).${jumlahAsli > MAKS_HALAMAN ? ' Hanya 50 halaman pertama yang diproses.' : ''}</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PowerPoint (.pptx)', () => { T.dl(namaDasar + '.pptx', blob, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'); T.toast('Berhasil diunduh'); }, true));
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

  const prosesB = T.btn('Ubah Jadi PowerPoint', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tiap slide berisi gambar halamannya, jadi tampilannya sama persis. Teksnya ada di catatan slide, bukan teks yang bisa diedit langsung. Maksimal 50 halaman.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
