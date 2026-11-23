import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF Hitam-Putih: ubah PDF berwarna jadi PDF hitam-putih.
// Caranya: tiap halaman digambar ke kanvas dengan pdf.js, pikselnya
// diubah jadi abu-abu, lalu disusun lagi jadi PDF dengan jsPDF.
// BATASAN JUJUR: hasil akhirnya adalah gambar per halaman, jadi teksnya
// tidak bisa dipilih atau dicari lagi, dan ukuran file bisa membesar.
export const meta = {"id": "pdf-hitam-putih", "name": "PDF Hitam-Putih", "cat": "produktivitas", "icon": "⬛", "desc": "Ubah PDF berwarna jadi hitam-putih, hemat tinta saat mencetak.", "keywords": "pdf hitam putih,pdf grayscale,pdf abu-abu,hemat tinta", "since": "6.17.0", "online": true};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const JSPDF_CDN = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
const MAKS_HALAMAN = 50;
const SKALA_GAMBAR = 2;

// Ubah data piksel RGBA jadi abu-abu (luminansi Rec. 601) di tempat.
// Murni, bisa diuji di Node dengan Uint8ClampedArray.
export function ubahKeAbu(data) {
  for (let i = 0; i + 3 < data.length; i += 4) {
    const abu = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = abu; data[i + 1] = abu; data[i + 2] = abu;
  }
  return data;
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const kualitasSel = T.select([
    ['1.5', 'Biasa (file lebih kecil)'],
    ['2', 'Bagus (seimbang)'],
    ['3', 'Tajam (file lebih besar)'],
  ], '2');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const [pdfOk, jspdfOk] = await Promise.all([utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }), utils.loadLibOnce(JSPDF_CDN, () => !!window.jspdf && typeof window.jspdf.jsPDF === 'function')]);
    if (!pdfOk || !jspdfOk) {
      T.show(statusBox, '<div class="err">Mesin gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const skala = Number(kualitasSel.value) || SKALA_GAMBAR;
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const jumlahAsli = doc.numPages;
      const total = Math.min(jumlahAsli, MAKS_HALAMAN);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let pdfBaru = null;
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Mengubah halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: skala });
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ubahKeAbu(imgData.data);
        ctx.putImageData(imgData, 0, 0);
        const gambar = canvas.toDataURL('image/jpeg', 0.9);
        const lebarPt = viewport.width / skala;
        const tinggiPt = viewport.height / skala;
        const orientasi = lebarPt > tinggiPt ? 'landscape' : 'portrait';
        if (!pdfBaru) {
          pdfBaru = new window.jspdf.jsPDF({ orientation: orientasi, unit: 'pt', format: [lebarPt, tinggiPt] });
        } else {
          pdfBaru.addPage([lebarPt, tinggiPt], orientasi);
        }
        pdfBaru.addImage(gambar, 'JPEG', 0, 0, lebarPt, tinggiPt);
      }
      await doc.destroy();
      const blob = pdfBaru.output('blob');
      T.hide(statusBox);
      T.show(box, `<p class="note">PDF hitam-putih jadi dari <b>${total} halaman</b>. Teksnya tidak bisa dipilih lagi karena tiap halaman sekarang gambar.${jumlahAsli > MAKS_HALAMAN ? ' Hanya 50 halaman pertama yang diproses.' : ''}</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)} (asli ${fmtBytes(f.size)}).</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF Hitam-Putih', () => { T.dl(namaDasar + '-hitam-putih.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
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

  const prosesB = T.btn('Ubah Jadi Hitam-Putih', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Hasilnya gambar per halaman, jadi teks tidak bisa dipilih atau dicari lagi, dan ukuran file bisa membesar. Maksimal 50 halaman.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.field('Kualitas gambar', kualitasSel));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
