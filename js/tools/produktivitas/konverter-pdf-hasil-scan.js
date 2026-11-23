import { h as T, utils, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Konverter PDF Hasil Scan: buat PDF tampak seperti hasil scan,
// fotokopi, atau fax lama: tiap halaman sedikit miring, warnanya pudar
// ke abu-abu, ada bintik kertas dan tepi yang gelap. Bukan OCR dan
// bukan pemindai: teks di dalam PDF berubah jadi gambar.
// Mesinnya pdf.js (render) + pdf-lib (susun ulang).
export const meta = {"id": "konverter-pdf-hasil-scan", "name": "Konverter PDF Hasil Scan", "cat": "produktivitas", "icon": "📠", "desc": "Buat PDF tampak seperti hasil scan, fotokopi, atau fax lama.", "keywords": "pdf hasil scan,efek scan pdf,fotokopi pdf,fax pdf,scan look", "since": "6.19.0", "online": true};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const MAKS_HALAMAN = 50;

// PRNG deterministik mulberry32. Murni, bisa diuji di Node.
// Memakai utils.mulberry32 (kanonis, G4 C1G4-R).
export const prngBenih = utils.mulberry32;

// Sudut miring tiap halaman (derajat), deterministik dari nomor halaman
// supaya hasilnya sama bila diulang. Murni, bisa diuji di Node.
export function sudutMiring(halaman, maksDerajat) {
  const acak = prngBenih(halaman * 2654435761 + 97);
  return (acak() * 2 - 1) * Math.abs(maksDerajat || 0);
}

// Terapkan efek scan ke piksel RGBA (Uint8ClampedArray).
// gaya: 'fotokopi' | 'fax' | 'pudar'. Murni (mengubah data di tempat),
// bisa diuji di Node dengan data tiruan.
export function efekScan(data, lebar, tinggi, gaya, benih) {
  const acak = prngBenih(benih || 1);
  const kontras = gaya === 'fax' ? 1.6 : gaya === 'fotokopi' ? 1.25 : 1.05;
  const bintik = gaya === 'fax' ? 0.012 : gaya === 'fotokopi' ? 0.006 : 0.002;
  const tengahX = lebar / 2, tengahY = tinggi / 2;
  const jarakMaks = Math.sqrt(tengahX * tengahX + tengahY * tengahY) || 1;
  for (let y = 0; y < tinggi; y++) {
    for (let x = 0; x < lebar; x++) {
      const i = (y * lebar + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      let abu = 0.299 * r + 0.587 * g + 0.114 * b;
      if (gaya === 'pudar') {
        // Scan warna pudar: warna dipertahankan tapi dijenuhkan.
        const jenuh = 0.45;
        let nr = abu + (r - abu) * jenuh;
        let ng = abu + (g - abu) * jenuh;
        let nb = abu + (b - abu) * jenuh;
        nr = (nr - 128) * kontras + 128;
        ng = (ng - 128) * kontras + 128;
        nb = (nb - 128) * kontras + 128;
        data[i] = nr; data[i + 1] = ng; data[i + 2] = nb;
      } else {
        abu = (abu - 128) * kontras + 128;
        if (gaya === 'fax') abu = abu > 160 ? 245 : abu < 90 ? 25 : abu;
        data[i] = abu; data[i + 1] = abu; data[i + 2] = abu;
      }
      // Bintik kertas acak.
      if (acak() < bintik) {
        const gelap = acak() < 0.5;
        data[i] = gelap ? 60 : 250; data[i + 1] = data[i]; data[i + 2] = data[i];
      }
      // Tepi halaman sedikit lebih gelap (vignette).
      const dx = (x - tengahX) / jarakMaks, dy = (y - tengahY) / jarakMaks;
      const jarak = Math.sqrt(dx * dx + dy * dy);
      if (jarak > 0.55) {
        const faktor = 1 - (jarak - 0.55) * 0.28;
        data[i] *= faktor; data[i + 1] *= faktor; data[i + 2] *= faktor;
      }
    }
  }
  return data;
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const gayaSel = T.select([
    ['fotokopi', 'Fotokopi (abu-abu, kontras sedang)'],
    ['fax', 'Fax lama (hitam-putih kasar)'],
    ['pudar', 'Scan warna pudar'],
  ], 'fotokopi');
  const miringSel = T.select([
    ['0.8', 'Sedikit miring'],
    ['1.8', 'Miring jelas'],
    ['0', 'Tidak miring'],
  ], '0.8');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const [pdfOk, libOk] = await Promise.all([
      utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }),
      utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib),
    ]);
    if (!pdfOk || !libOk) {
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
      const L = window.PDFLib;
      const keluar = await L.PDFDocument.create();
      const gaya = gayaSel.value;
      const miringMaks = parseFloat(miringSel.value);
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Memindai halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1.5 });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        // Miringkan halaman di kanvas baru yang sedikit lebih besar.
        const sudut = sudutMiring(i, miringMaks) * Math.PI / 180;
        const c2 = document.createElement('canvas');
        c2.width = Math.round(c.width * 1.06); c2.height = Math.round(c.height * 1.06);
        const ctx2 = c2.getContext('2d');
        ctx2.fillStyle = '#f4f2ee';
        ctx2.fillRect(0, 0, c2.width, c2.height);
        ctx2.save();
        ctx2.translate(c2.width / 2, c2.height / 2);
        ctx2.rotate(sudut);
        ctx2.drawImage(c, -c.width / 2, -c.height / 2);
        ctx2.restore();
        const img = ctx2.getImageData(0, 0, c2.width, c2.height);
        efekScan(img.data, c2.width, c2.height, gaya, i * 7919 + 13);
        ctx2.putImageData(img, 0, 0);
        const blob = await canvasToBlob(c2, 'image/jpeg', 0.85);
        if (!blob) throw new Error('render gagal');
        const gambar = await keluar.embedJpg(new Uint8Array(await blob.arrayBuffer()));
        const hal = keluar.addPage([c2.width * 0.75, c2.height * 0.75]);
        hal.drawImage(gambar, { x: 0, y: 0, width: hal.getWidth(), height: hal.getHeight() });
      }
      await doc.destroy();
      const bytes = await keluar.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Selesai: <b>${total} halaman</b> diubah jadi tampilan hasil scan. Teks di dalam PDF kini berupa gambar, jadi tidak bisa dipilih atau dicari lagi.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF Hasil Scan', () => { T.dl(namaDasar + '-hasil-scan.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
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

  const prosesB = T.btn('Ubah Jadi Hasil Scan', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Hasilnya PDF bergambar: tiap halaman jadi foto hasil scan. Teks di dalamnya tidak bisa dipilih atau dicari lagi. Ini efek tampilan, bukan pemindai dokumen.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(T.grid2(
    T.field('Gaya hasil scan', gayaSel),
    T.field('Kemiringan halaman', miringSel),
  ));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
