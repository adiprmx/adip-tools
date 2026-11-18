import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Ubah Ukuran Halaman PDF: ganti ukuran halaman PDF (A4, Letter, Legal,
// A3, A5) dengan isi yang ikut menyesuaikan. Caranya dengan pdf-lib:
// tiap halaman asli disisipkan ke halaman baru dengan skala yang pas,
// jadi isinya tidak terpotong dan tidak meluber.
// BATASAN JUJUR: halaman yang rasionya beda jauh akan menyisakan ruang
// kosong di sisi yang lebih panjang; tautan dan formulir di dalam PDF
// tidak ikut pindah.
export const meta = {"id": "ubah-ukuran-halaman-pdf", "name": "Ubah Ukuran Halaman PDF", "cat": "produktivitas", "icon": "📐", "desc": "Ganti ukuran halaman PDF (A4, Letter, Legal) dengan isi yang menyesuaikan.", "keywords": "ubah ukuran pdf,a4 ke letter,ukuran halaman pdf,resize pdf", "since": "6.17.0"};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const MAKS_HALAMAN = 200;

// Ukuran kertas dalam poin (1 inci = 72 poin). A4 210x297 mm,
// Letter 8,5x11 inci, Legal 8,5x14 inci.
export const UKURAN_KERTAS = {
  a4: [595.28, 841.89],
  a4l: [841.89, 595.28],
  letter: [612, 792],
  letterl: [792, 612],
  legal: [612, 1008],
  legall: [1008, 612],
  a3: [841.89, 1190.55],
  a5: [419.53, 595.28],
};

// Hitung skala dan posisi supaya halaman lama muat di tengah halaman baru
// tanpa terpotong. Murni, bisa diuji di Node.
// Mengembalikan {skala, lebar, tinggi, x, y}.
export function hitungPenempatan(lebarLama, tinggiLama, lebarBaru, tinggiBaru) {
  const skala = Math.min(lebarBaru / (lebarLama || 1), tinggiBaru / (tinggiLama || 1));
  const lebar = lebarLama * skala;
  const tinggi = tinggiLama * skala;
  return { skala, lebar, tinggi, x: (lebarBaru - lebar) / 2, y: (tinggiBaru - tinggi) / 2 };
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const ukuranSel = T.select([
    ['a4', 'A4 tegak'],
    ['a4l', 'A4 mendatar'],
    ['letter', 'Letter tegak (US)'],
    ['letterl', 'Letter mendatar (US)'],
    ['legal', 'Legal tegak (US)'],
    ['legall', 'Legal mendatar (US)'],
    ['a3', 'A3 tegak'],
    ['a5', 'A5 tegak'],
  ], 'a4');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let pdfLibSiap = null;

  const muatPdfLib = () => {
    if (!pdfLibSiap) {
      pdfLibSiap = T.loadScript(PDFLIB_CDN).then((ok) => ok && !!window.PDFLib)
        .catch(() => { pdfLibSiap = null; return false; });
    }
    return pdfLibSiap;
  };

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const ok = await muatPdfLib();
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const [lebarBaru, tinggiBaru] = UKURAN_KERTAS[ukuranSel.value] || UKURAN_KERTAS.a4;
      const namaUkuran = ukuranSel.options[ukuranSel.selectedIndex]
        ? ukuranSel.options[ukuranSel.selectedIndex].textContent : ukuranSel.value;
      const bytesAsli = await f.arrayBuffer();
      const L = window.PDFLib;
      const src = await L.PDFDocument.load(bytesAsli, { ignoreEncryption: false });
      const total = Math.min(src.getPageCount(), MAKS_HALAMAN);
      const out = await L.PDFDocument.create();
      const halamanSisip = await out.embedPdf(bytesAsli);
      for (let i = 0; i < total; i++) {
        T.show(statusBox, `<span class="dim">Memproses halaman ${i + 1} dari ${total}…</span>`);
        const halLama = src.getPage(i);
        const { width, height } = halLama.getSize();
        const pos = hitungPenempatan(width, height, lebarBaru, tinggiBaru);
        const halBaru = out.addPage([lebarBaru, tinggiBaru]);
        halBaru.drawPage(halamanSisip[i], { x: pos.x, y: pos.y, width: pos.lebar, height: pos.tinggi });
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Ukuran halaman sudah diganti jadi <b>${T.esc(namaUkuran)}</b> untuk ${total} halaman. Isinya menyesuaikan tanpa terpotong.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)} (asli ${fmtBytes(f.size)}).</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF Baru', () => { T.dl(namaDasar + '-' + ukuranSel.value + '.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      const terkunci = e && /encrypt|password/i.test(e.message || '');
      T.show(statusBox, terkunci
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Buka Kunci PDF.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Ukuran Halaman', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Isi halaman ikut menyesuaikan tanpa terpotong. Bila rasionya beda jauh, ada ruang kosong di sisi yang lebih panjang. Tautan dan formulir di dalam PDF tidak ikut pindah.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.field('Ukuran halaman baru', ukuranSel));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
