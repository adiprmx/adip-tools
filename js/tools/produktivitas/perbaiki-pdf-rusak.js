import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Perbaiki PDF Rusak: coba selamatkan PDF yang susah dibuka dengan
// membacanya ulang lalu menyimpannya kembali. Bila struktur PDF-nya
// sudah tidak bisa diperbaiki, tool ini mencoba mengambil teksnya saja
// supaya isinya tidak hilang total. Bila keduanya gagal, alasannya
// disampaikan apa adanya, bukan janji kosong.
export const meta = {"id": "perbaiki-pdf-rusak", "name": "Perbaiki PDF Rusak", "cat": "produktivitas", "icon": "🩹", "desc": "Selamatkan PDF yang susah dibuka dengan membaca ulang dan menyimpannya kembali.", "keywords": "perbaiki pdf,pdf rusak,repair pdf,selamatkan pdf,pdf tidak bisa dibuka", "since": "6.19.0", "online": true};

const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAKS_HALAMAN_SELAMAT = 100;

// Cek 5 byte awal file: PDF yang benar diawali "%PDF-". Murni.
export function cekMagic(byte) {
  const b = byte instanceof Uint8Array ? byte : new Uint8Array(byte || []);
  if (b.length < 5) return false;
  return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
}

// Ubah error teknis jadi pesan yang bisa dimengerti. Murni.
export function klasifikasiError(e) {
  const nama = (e && e.name) || '';
  const pesan = String((e && e.message) || e || '').toLowerCase();
  if (nama === 'PasswordException' || pesan.includes('password') || pesan.includes('encrypted')) {
    return 'PDF ini dikunci kata sandi, jadi tidak bisa diperbaiki di sini. Buka kuncinya dulu dengan tool Kunci PDF, tab Buka kunci.';
  }
  if (pesan.includes('invalid pdf') || pesan.includes('no pdf header') || pesan.includes('not a pdf')) {
    return 'Struktur file PDF ini rusak parah dan tidak bisa dibaca lagi.';
  }
  if (pesan.includes('unexpected end') || pesan.includes('truncated') || pesan.includes('eof') || pesan.includes('xref')) {
    return 'File PDF ini terpotong atau tabel isinya rusak. Kemungkinan unduhannya belum selesai.';
  }
  if (pesan.includes('out of memory') || pesan.includes('memory')) {
    return 'File ini terlalu besar untuk diperbaiki di HP ini.';
  }
  return 'PDF tidak bisa dibaca. Kerusakannya di luar yang bisa diperbaiki tool ini.';
}

// Potong paragraf jadi baris yang muat di lebar halaman.
// ukur(teks) -> lebar dalam pt. Murni, bisa diuji tanpa DOM.
// Memakai utils.bungkusTeks, tapi input kosong tetap [] (kanon
// mengembalikan ['']; perbedaan disengaja, G4 C1G4-R).
export function bungkusBaris(teks, lebarMaks, ukur) {
  if (!String(teks || '').trim()) return [];
  return utils.bungkusTeks(teks, lebarMaks, ukur);
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  async function selamatkanTeks(data, namaDasar) {
    const pdfOk = await utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; });
    if (!pdfOk) return null;
    const doc = await window.pdfjsLib.getDocument({ data }).promise;
    const total = Math.min(doc.numPages, MAKS_HALAMAN_SELAMAT);
    const perHalaman = [];
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      const konten = await page.getTextContent();
      const teks = (konten.items || []).map((it) => it.str || '').join(' ');
      perHalaman.push(teks);
    }
    await doc.destroy();
    const gabung = perHalaman.map((t, i) => '--- Halaman ' + (i + 1) + ' ---\n' + t).join('\n\n');
    if (!gabung.replace(/--- Halaman \d+ ---/g, '').trim()) return null;
    return { teks: gabung, halaman: total };
  }

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const pdfLibOk = await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib);
    if (!pdfLibOk) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', proses);
      prosesB.disabled = false;
      return;
    }
    try {
      const namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const buf = await f.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (!cekMagic(bytes)) {
        T.show(statusBox, '<div class="err">File ini bukan PDF yang benar (tidak ada tanda awal PDF). Mungkin filenya salah unduh atau tertukar dengan file lain.</div>');
        prosesB.disabled = false;
        return;
      }
      T.show(statusBox, '<span class="dim">Membaca ulang PDF dan menyimpannya kembali…</span>');
      const L = window.PDFLib;
      let doc = null;
      let galatPerbaiki = null;
      try {
        doc = await L.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
      } catch (e) {
        galatPerbaiki = e;
      }
      if (doc) {
        const keluar = await doc.save();
        const blob = new Blob([keluar], { type: 'application/pdf' });
        T.hide(statusBox);
        T.show(box, `<p class="note">PDF berhasil dibaca ulang dan disimpan kembali (<b>${doc.getPageCount()} halaman</b>). Coba buka file hasilnya; bila masih bermasalah, kerusakannya ada di dalam isi halaman, bukan di struktur file.</p>`);
        T.show(hasilBox, '');
        hasilBox.appendChild(T.el(`<p class="dim">Ukuran file hasil: ${fmtBytes(blob.size)} (asli ${fmtBytes(f.size)}).</p>`));
        hasilBox.appendChild(T.btn('Unduh PDF Hasil Perbaikan', () => { T.dl(namaDasar + '-diperbaiki.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
        T.scrollToPreview(box);
        prosesB.disabled = false;
        return;
      }
      // Jalur penyelamatan: pdf-lib gagal, coba ambil teksnya dengan pdf.js.
      T.show(statusBox, '<span class="dim">Struktur PDF tidak bisa diperbaiki. Mencoba mengambil teksnya saja…</span>');
      let selamat = null;
      try { selamat = await selamatkanTeks(bytes, namaDasar); } catch (e2) { selamat = null; }
      if (selamat) {
        T.hide(statusBox);
        T.show(box, '<p class="note">PDF-nya tidak bisa diperbaiki utuh, tapi <b>teks dari ' + selamat.halaman + ' halaman</b> berhasil diselamatkan. Unduh sebagai teks, atau susun lagi jadi PDF baru (tata letak asli tidak ikut terselamatkan).</p>');
        T.show(hasilBox, '');
        hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl(namaDasar + '-teks-diselamatkan.txt', selamat.teks, 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
        hasilBox.appendChild(T.btn('Susun Jadi PDF Baru', async () => {
          try {
            const docBaru = await L.PDFDocument.create();
            const font = await docBaru.embedFont(L.StandardFonts.Helvetica);
            const ukuran = 11;
            const margin = 50;
            const lebarMaks = 595 - margin * 2;
            const ukur = (t) => font.widthOfTextAtSize(t, ukuran);
            const semuaBaris = selamat.teks.split('\n').flatMap((p) => bungkusBaris(p, lebarMaks, ukur));
            let hal = docBaru.addPage([595, 842]);
            let y = 842 - margin;
            for (const baris of semuaBaris) {
              if (y < margin + ukuran) { hal = docBaru.addPage([595, 842]); y = 842 - margin; }
              hal.drawText(baris, { x: margin, y, size: ukuran, font });
              y -= ukuran * 1.5;
            }
            const keluar = await docBaru.save();
            T.dl(namaDasar + '-dari-teks.pdf', new Blob([keluar], { type: 'application/pdf' }), 'application/pdf');
            T.toast('Berhasil diunduh');
          } catch (e3) {
            T.toast('PDF baru gagal dibuat');
          }
        }));
        T.scrollToPreview(box);
      } else {
        T.show(statusBox, '<div class="err">' + T.esc(klasifikasiError(galatPerbaiki)) + ' Teksnya pun tidak bisa diambil.</div>');
      }
    } catch (e) {
      T.show(statusBox, '<div class="err">' + T.esc(klasifikasiError(e)) + '</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Perbaiki PDF', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Cara kerjanya: file dibaca ulang lalu disimpan kembali dengan struktur baru. PDF yang rusak parah mungkin hanya teksnya yang bisa diselamatkan. PDF yang dikunci kata sandi tidak bisa diperbaiki di sini.</p>'));
  root.appendChild(T.field('Pilih file PDF yang rusak', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
