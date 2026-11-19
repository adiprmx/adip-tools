import { h as T, utils, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke JPG/PNG: render tiap halaman PDF jadi gambar. Mesin render-nya
// pdf.js (Mozilla), sama seperti PDF Lab; ZIP-nya JSZip, sama seperti
// tool Kompres Gambar.
export const meta = {"id": "pdf-ke-jpg-png", "name": "PDF ke JPG/PNG", "cat": "produktivitas", "icon": "🖼️", "desc": "Ubah tiap halaman PDF jadi gambar JPG atau PNG.", "keywords": "pdf ke jpg,pdf ke png,pdf ke gambar,render pdf,halaman pdf", "since": "6.16.0"};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
const MAKS_HALAMAN = 100;

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const mutuSel = T.select([
    ['1', 'Biasa (cukup untuk dibaca)'],
    ['2', 'Tajam (cocok untuk dibagikan)'],
    ['3', 'Sangat tajam (file besar)'],
  ], '2');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  let hasil = []; // [{blob, nama, w, h}]
  let namaDasar = 'pdf';

  // Loader library kanonis: utils.loadLibOnce (core.js).

  function gambarHasil() {
    T.show(hasilBox, '');
    hasil.forEach((r, i) => {
      const url = URL.createObjectURL(r.blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      const kartu = T.el('<div class="card" style="margin-bottom:12px"></div>');
      kartu.appendChild(T.el(`<div class="hint" style="margin-bottom:6px"><b>Halaman ${i + 1}</b> (${r.w}×${r.h}, ${fmtBytes(r.blob.size)})</div>`));
      const im = document.createElement('img');
      im.src = url; im.alt = `Halaman ${i + 1}`;
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      kartu.appendChild(im);
      const baris = T.el('<div class="row" style="margin-top:8px"></div>');
      baris.appendChild(T.btn('Unduh', () => { T.dl(r.nama, r.blob, r.blob.type); T.toast('Berhasil diunduh'); }, true));
      kartu.appendChild(baris);
      hasilBox.appendChild(kartu);
    });
    if (hasil.length > 1) {
      hasilBox.appendChild(T.btn('Unduh Semua (ZIP)', async () => {
        T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
        if (!(await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip))) {
          T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi, atau unduh gambarnya satu per satu.</span>');
          return;
        }
        try {
          const zip = new window.JSZip();
          hasil.forEach((r) => zip.file(r.nama, r.blob));
          const blob = await zip.generateAsync({ type: 'blob' });
          T.dl(`${namaDasar}-gambar.zip`, blob, 'application/zip');
          T.hide(statusBox);
          T.toast('ZIP berhasil diunduh');
        } catch (e) {
          T.show(statusBox, '<span class="dim">Gagal membuat ZIP. Unduh gambarnya satu per satu.</span>');
        }
      }, true));
    }
  }

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    hasil = [];
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    if (!(await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }))) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      namaDasar = (f.name || 'pdf').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const total = Math.min(doc.numPages, MAKS_HALAMAN);
      if (doc.numPages > MAKS_HALAMAN) {
        T.show(statusBox, `<span class="dim">PDF ini ${doc.numPages} halaman; yang diubah hanya ${MAKS_HALAMAN} halaman pertama.</span>`);
      }
      const skala = parseFloat(mutuSel.value);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const ext = fmtSel.value === 'png' ? 'png' : 'jpg';
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Mengubah halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: skala });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const ctx = c.getContext('2d');
        if (mime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const blob = await canvasToBlob(c, mime, 0.92);
        if (!blob) throw new Error('render gagal');
        hasil.push({ blob, nama: `${namaDasar}-hal${i}.${ext}`, w: c.width, h: c.height });
      }
      await doc.destroy();
      T.hide(statusBox);
      T.show(box, `<p class="note"><b>${hasil.length} halaman</b> berhasil diubah jadi gambar.</p>`);
      gambarHasil();
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

  const prosesB = T.btn('Ubah Jadi Gambar', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.grid2(
    T.field('Format gambar', fmtSel),
    T.field('Ketajaman', mutuSel, 'Makin tajam, makin besar file gambarnya.'),
  ));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
