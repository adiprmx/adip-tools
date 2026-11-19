import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pembuat Buklet PDF: susun ulang halaman PDF menjadi buklet atau zine
// siap cetak dan lipat di rumah. Dua halaman kecil berdampingan di tiap
// sisi kertas A4 mendatar; setelah dicetak bolak-balik dan dilipat,
// urutannya jadi benar. Mesinnya pdf-lib.
export const meta = {"id": "pembuat-buklet-pdf", "name": "Pembuat Buklet PDF", "cat": "produktivitas", "icon": "📖", "desc": "Susun ulang halaman PDF menjadi buklet siap cetak dan lipat.", "keywords": "buklet pdf,zine pdf,booklet pdf,cetak buklet,lipat pdf", "since": "6.19.0"};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const MAKS_HALAMAN = 200;

// Hitung urutan cetak buklet. total = jumlah halaman asli (dibulatkan
// ke atas jadi kelipatan 4 dengan halaman kosong, 0 = halaman kosong).
// Mengembalikan daftar lembar: [{depan: [kiri, kanan], belakang: [kiri,
// kanan]}] dengan nomor halaman 1-based. Murni, bisa diuji di Node.
export function urutanBuklet(total) {
  const t = Math.max(4, Math.ceil(Math.max(0, total || 0) / 4) * 4);
  const lembar = [];
  const jumlah = t / 4;
  for (let i = 0; i < jumlah; i++) {
    const depanKiri = t - 2 * i;
    const depanKanan = 2 * i + 1;
    const belakangKiri = 2 * i + 2;
    const belakangKanan = t - 2 * i - 1;
    lembar.push({
      depan: [depanKiri <= total ? depanKiri : 0, depanKanan <= total ? depanKanan : 0],
      belakang: [belakangKiri <= total ? belakangKiri : 0, belakangKanan <= total ? belakangKanan : 0],
    });
  }
  return lembar;
}

// Jumlah lembar kertas yang dibutuhkan. Murni, bisa diuji di Node.
export function hitungLembar(total) {
  return Math.max(1, Math.ceil(Math.max(0, total || 0) / 4));
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
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
      const sumber = await L.PDFDocument.load(data, { ignoreEncryption: true });
      const total = Math.min(sumber.getPageCount(), MAKS_HALAMAN);
      if (sumber.getPageCount() < 1) throw new Error('pdf kosong');
      const lembar = urutanBuklet(total);
      const keluar = await L.PDFDocument.create();
      const lebarHal = 842; // A4 mendatar
      const tinggiHal = 595;
      const setengah = lebarHal / 2;
      const salin = await keluar.copyPages(sumber, Array.from({ length: total }, (_, i) => i));
      const tanam = [];
      for (let i = 0; i < salin.length; i++) tanam.push(await keluar.embedPage(salin[i]));
      const gambarSisi = (pasangan) => {
        const hal = keluar.addPage([lebarHal, tinggiHal]);
        pasangan.forEach((nomor, sisi) => {
          if (!nomor) return;
          const emb = tanam[nomor - 1];
          const skala = Math.min(setengah / emb.width, tinggiHal / emb.height);
          const w = emb.width * skala;
          const h = emb.height * skala;
          hal.drawPage(emb, {
            x: sisi * setengah + (setengah - w) / 2,
            y: (tinggiHal - h) / 2,
            width: w,
            height: h,
          });
        });
      };
      for (const l of lembar) {
        gambarSisi(l.depan);
        gambarSisi(l.belakang);
      }
      const bytes = await keluar.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Buklet jadi: <b>${total} halaman</b> disusun ke <b>${lembar.length} lembar</b> (${lembar.length * 2} sisi cetak). Cetak bolak-balik dengan sisi pendek sebagai sumbu lipat, lalu lipat di tengah dan staples.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh Buklet PDF', () => { T.dl(namaDasar + '-buklet.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">PDF tidak bisa diproses. Pastikan filenya PDF yang benar, tidak rusak, dan tidak dikunci kata sandi.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Buat Buklet', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Cara pakai: unduh hasilnya, cetak bolak-balik (flip on short edge / balik sisi pendek), lipat di tengah, lalu staples. Bila jumlah halaman bukan kelipatan 4, sisa lembar diisi halaman kosong.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
