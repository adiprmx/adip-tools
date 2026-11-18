import { h as T, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// PDF ke Excel: ambil tabel dari PDF jadi file spreadsheet (.xlsx).
// Caranya: teks PDF dikelompokkan jadi baris (posisi Y sama) lalu kolom
// (jarak X yang jauh memisahkan kolom). Mesinnya pdf.js + SheetJS.
// BATASAN JUJUR (ditulis juga di UI): deteksi tabel ini tebakan dari
// posisi teks, bukan garis tabel asli. Tabel tanpa jarak kolom yang jelas
// bisa berantakan; bila begitu, hasilnya tetap diunduh sebagai teks
// per baris supaya tidak ada isi yang hilang diam-diam.
export const meta = {"id": "pdf-ke-excel", "name": "PDF ke Excel", "cat": "produktivitas", "icon": "📊", "desc": "Ambil tabel dari PDF jadi file spreadsheet Excel.", "keywords": "pdf ke excel,pdf ke xlsx,tabel pdf,ekstrak tabel pdf", "since": "6.17.0"};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
const MAKS_HALAMAN = 100;

// Kelompokkan potongan teks pdf.js jadi baris-baris tabel.
// Tiap baris: [{x, teks, lebar}]. Murni, bisa diuji di Node.
export function itemsKeBaris(items) {
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
    const lebar = (it.width || 0) || teks.length * h * 0.5;
    const terakhir = baris[baris.length - 1];
    if (terakhir && Math.abs(terakhir.y - y) <= Math.max(2, h * 0.4)) {
      terakhir.sel.push({ x, teks, lebar });
    } else {
      baris.push({ y, h, sel: [{ x, teks, lebar }] });
    }
  }
  return baris;
}

// Pecah tiap baris jadi kolom: potongan yang jaraknya lebih dari
// (1,5x tinggi huruf) dari potongan sebelumnya memulai kolom baru.
// Mengembalikan {tabel: string[][], rapi: boolean}.
// "Rapi" berarti minimal separuh baris punya jumlah kolom yang sama
// dengan baris terbanyak, jadi hasilnya mirip tabel betulan.
// Murni, bisa diuji di Node.
export function barisKeTabel(baris) {
  const tabel = [];
  for (const b of baris) {
    const potong = b.sel.slice().sort((a, c) => a.x - c.x);
    const kolom = [];
    let jalan = '';
    let ujungSebelumnya = null;
    const ambang = Math.max(10, b.h * 1.5);
    for (const p of potong) {
      if (ujungSebelumnya !== null && p.x - ujungSebelumnya > ambang && jalan) {
        kolom.push(jalan.trim());
        jalan = '';
      }
      jalan = jalan ? jalan + ' ' + p.teks : p.teks;
      ujungSebelumnya = p.x + p.lebar;
    }
    if (jalan) kolom.push(jalan.trim());
    if (kolom.length) tabel.push(kolom);
  }
  if (!tabel.length) return { tabel, rapi: false };
  const hitung = {};
  let terbanyak = 0, jumlahTerbanyak = 0;
  for (const r of tabel) {
    hitung[r.length] = (hitung[r.length] || 0) + 1;
    if (hitung[r.length] > jumlahTerbanyak) { jumlahTerbanyak = hitung[r.length]; terbanyak = r.length; }
  }
  const rapi = terbanyak >= 2 && jumlahTerbanyak >= Math.ceil(tabel.length / 2);
  return { tabel, rapi };
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let pdfJsSiap = null, xlsxSiap = null;

  const muatPdfJs = () => {
    if (!pdfJsSiap) {
      pdfJsSiap = T.loadScript(PDFJS_CDN).then((ok) => {
        const siap = ok && !!window.pdfjsLib;
        if (siap) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return siap;
      }).catch(() => { pdfJsSiap = null; return false; });
    }
    return pdfJsSiap;
  };
  const muatXlsx = () => {
    if (!xlsxSiap) {
      xlsxSiap = T.loadScript(XLSX_CDN).then((ok) => ok && !!window.XLSX && !!window.XLSX.utils)
        .catch(() => { xlsxSiap = null; return false; });
    }
    return xlsxSiap;
  };

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF dan Excel… (perlu internet sekali saja)</span>');
    const [pdfOk, xlsxOk] = await Promise.all([muatPdfJs(), muatXlsx()]);
    if (!pdfOk || !xlsxOk) {
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
      const wb = window.XLSX.utils.book_new();
      let halamanAdaTabel = 0;
      let halamanTidakRapi = 0;
      let totalBaris = 0;
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const { tabel, rapi } = barisKeTabel(itemsKeBaris(konten.items || []));
        if (!tabel.length) continue;
        totalBaris += tabel.length;
        if (rapi) halamanAdaTabel++;
        else halamanTidakRapi++;
        const ws = window.XLSX.utils.aoa_to_sheet(tabel);
        window.XLSX.utils.book_append_sheet(wb, ws, 'Halaman ' + i);
      }
      await doc.destroy();
      if (!totalBaris) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar).</div>');
        prosesB.disabled = false;
        return;
      }
      const bytes = window.XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      T.hide(statusBox);
      const catatan = halamanTidakRapi && !halamanAdaTabel
        ? '<br>Tabel tidak terdeteksi rapi di PDF ini, jadi tiap baris teks masuk sebagai satu baris di Excel. Periksa dan rapikan sendiri bila perlu.'
        : halamanTidakRapi
          ? `<br>Di ${halamanTidakRapi} halaman tabelnya tidak terdeteksi rapi, jadi baris teksnya masuk apa adanya. Periksa halaman itu sendiri.`
          : '';
      T.show(box, `<p class="note">Spreadsheet jadi: <b>${totalBaris} baris</b> dari ${total} halaman.${catatan}</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh Excel (.xlsx)', () => { T.dl(namaDasar + '.xlsx', blob, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); T.toast('Berhasil diunduh'); }, true));
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

  const prosesB = T.btn('Ubah Jadi Excel', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tabel ditebak dari posisi teksnya, bukan dari garis tabel asli. Tabel yang kolomnya rapat bisa berantakan, dan hasilnya akan ditulis apa adanya supaya tidak ada isi yang hilang diam-diam. Tiap halaman PDF jadi satu lembar di Excel.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
