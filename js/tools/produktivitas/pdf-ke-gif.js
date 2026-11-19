import { h as T, utils, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke GIF: ubah halaman-halaman PDF jadi satu animasi GIF yang
// berputar. Tiap halaman jadi satu frame. Mesin render-nya pdf.js;
// encoder GIF-nya ditulis sendiri di file ini (GIF89a + kompresi LZW),
// tanpa pustaka tambahan.
// BATASAN JUJUR (ditulis juga di UI): GIF hanya punya 256 warna, jadi
// halaman berwarna penuh akan sedikit berubah warnanya. Halaman yang
// diproses dibatasi 30 supaya file tidak terlalu besar.
export const meta = {"id": "pdf-ke-gif", "name": "PDF ke GIF", "cat": "produktivitas", "icon": "🎞️", "desc": "Ubah halaman-halaman PDF jadi satu animasi GIF.", "keywords": "pdf ke gif,pdf jadi animasi,gif dari pdf,animasi pdf", "since": "6.19.0"};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_HALAMAN = 30;

// Encoder GIF89a animasi tinggal di modul bersama js/gif-encoder.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari pdf-ke-gif.js +
// gif-3d-wigglegram.js). Default tunda kanon 200 mdtk; default 1000
// milik tool ini dipertahankan di call-site (|| 1000 di bawah).
import { GifEncoder } from '../../gif-encoder.js';
export { buatPalet, buatPencariPalet, lzwKompres, GifEncoder } from '../../gif-encoder.js';

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const lebarSel = T.select([
    ['320', 'Kecil (lebar 320px)'],
    ['480', 'Sedang (lebar 480px)'],
    ['640', 'Besar (lebar 640px)'],
  ], '480');
  const tundaSel = T.select([
    ['500', '0,5 detik per halaman'],
    ['1000', '1 detik per halaman'],
    ['2000', '2 detik per halaman'],
  ], '1000');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    if (!(await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }))) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const total = Math.min(doc.numPages, MAKS_HALAMAN);
      const lebarTarget = parseInt(lebarSel.value, 10);
      const encoder = new GifEncoder(lebarTarget, 0, { tundaMs: parseInt(tundaSel.value, 10) || 1000 });
      let tinggiFrame = 0;
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Mengubah halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const vp1 = page.getViewport({ scale: 1 });
        const skala = lebarTarget / vp1.width;
        const vp = page.getViewport({ scale: skala });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        if (i === 1) { tinggiFrame = c.height; encoder.tinggi = c.height; }
        // Samakan tinggi frame (halaman beda ukuran dipusatkan di kanvas
        // setinggi frame pertama, sisanya putih).
        const c2 = document.createElement('canvas');
        c2.width = lebarTarget; c2.height = tinggiFrame;
        const ctx2 = c2.getContext('2d');
        ctx2.fillStyle = '#ffffff';
        ctx2.fillRect(0, 0, c2.width, c2.height);
        ctx2.drawImage(c, 0, Math.max(0, Math.floor((tinggiFrame - c.height) / 2)));
        const img = ctx2.getImageData(0, 0, c2.width, c2.height);
        encoder.tambahFrame(img.data, c2.width, c2.height);
      }
      await doc.destroy();
      const gif = encoder.selesai();
      const blob = new Blob([gif], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      T.show(box, `<p class="note">Animasi jadi: <b>${total} frame</b> (${lebarTarget}×${tinggiFrame}px).</p>`);
      T.show(hasilBox, '');
      const im = document.createElement('img');
      im.src = url;
      im.alt = 'Animasi GIF dari PDF';
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;margin-bottom:12px';
      hasilBox.appendChild(im);
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh GIF', () => { T.dl(namaDasar + '.gif', blob, 'image/gif'); T.toast('Berhasil diunduh'); }, true));
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

  const prosesB = T.btn('Ubah Jadi GIF', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">GIF hanya punya 256 warna, jadi halaman berwarna penuh akan sedikit berubah warnanya. Maksimal 30 halaman pertama yang diubah.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.grid2(
    T.field('Lebar GIF', lebarSel),
    T.field('Jeda tiap halaman', tundaSel),
  ));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
