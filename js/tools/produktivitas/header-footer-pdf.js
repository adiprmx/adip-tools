import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Header & Footer PDF: tambah teks di bagian atas (header) atau bawah
// (footer) semua halaman PDF. Tulis {halaman} di dalam teks untuk nomor
// halaman dan {total} untuk jumlah halaman. Mesinnya pdf-lib.
export const meta = {"id": "header-footer-pdf", "name": "Header & Footer PDF", "cat": "produktivitas", "icon": "📄", "desc": "Tambah teks header dan footer di semua halaman PDF.", "keywords": "header pdf,footer pdf,nomor halaman pdf,tambah teks pdf", "since": "6.19.0", "online": true};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';

// Ganti penanda {halaman} dan {total} dengan angka. Murni, bisa diuji.
export function isiPenanda(teks, halaman, total) {
  return String(teks || '')
    .replace(/\{halaman\}/g, String(halaman))
    .replace(/\{total\}/g, String(total));
}

// Hitung posisi X teks di halaman selebar lebarHal sesuai rata.
// Murni, bisa diuji di Node.
export function posisiX(rata, lebarHal, lebarTeks, margin) {
  if (rata === 'tengah') return (lebarHal - lebarTeks) / 2;
  if (rata === 'kanan') return lebarHal - margin - lebarTeks;
  return margin;
}

// Hitung posisi Y (dari bawah, satuan pt pdf-lib) untuk header/footer.
// Murni, bisa diuji di Node.
export function posisiY(jenis, tinggiHal, ukuranHuruf, margin) {
  if (jenis === 'header') return tinggiHal - margin - ukuranHuruf;
  return margin;
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const headerI = T.input('text', 'Teks header, misal Laporan Bulanan');
  const footerI = T.input('text', 'Teks footer, misal Halaman {halaman} dari {total}');
  footerI.value = 'Halaman {halaman} dari {total}';
  const rataSel = T.select([['kiri', 'Rata kiri'], ['tengah', 'Rata tengah'], ['kanan', 'Rata kanan']], 'tengah');
  const ukuranSel = T.select([['9', 'Kecil (9)'], ['11', 'Sedang (11)'], ['14', 'Besar (14)']], '11');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    const header = headerI.value.trim();
    const footer = footerI.value.trim();
    if (!header && !footer) { T.toast('Isi dulu teks header atau footernya'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    if (!(await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib))) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = await f.arrayBuffer();
      const L = window.PDFLib;
      const doc = await L.PDFDocument.load(data, { ignoreEncryption: true });
      const font = await doc.embedFont(L.StandardFonts.Helvetica);
      const ukuran = parseInt(ukuranSel.value, 10);
      const margin = 36;
      const total = doc.getPageCount();
      for (let i = 0; i < total; i++) {
        const hal = doc.getPage(i);
        const { width, height } = hal.getSize();
        if (header) {
          const teks = isiPenanda(header, i + 1, total);
          const lebar = font.widthOfTextAtSize(teks, ukuran);
          hal.drawText(teks, { x: posisiX(rataSel.value, width, lebar, margin), y: posisiY('header', height, ukuran, margin), size: ukuran, font, color: L.rgb(0.35, 0.35, 0.35) });
        }
        if (footer) {
          const teks = isiPenanda(footer, i + 1, total);
          const lebar = font.widthOfTextAtSize(teks, ukuran);
          hal.drawText(teks, { x: posisiX(rataSel.value, width, lebar, margin), y: posisiY('footer', height, ukuran, margin), size: ukuran, font, color: L.rgb(0.35, 0.35, 0.35) });
        }
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Selesai: teks ditambahkan ke <b>${total} halaman</b>.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF', () => { T.dl(namaDasar + '-header-footer.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">PDF tidak bisa diproses. Pastikan filenya PDF yang benar, tidak rusak, dan tidak dikunci kata sandi.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Tambah Header & Footer', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tulis {halaman} untuk nomor halaman dan {total} untuk jumlah halaman. Contoh: "Halaman {halaman} dari {total}". Kosongkan salah satu kolom bila hanya butuh header atau footer saja.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.field('Teks header (atas)', headerI));
  root.appendChild(T.field('Teks footer (bawah)', footerI));
  root.appendChild(T.grid2(
    T.field('Rata teks', rataSel),
    T.field('Ukuran huruf', ukuranSel),
  ));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
