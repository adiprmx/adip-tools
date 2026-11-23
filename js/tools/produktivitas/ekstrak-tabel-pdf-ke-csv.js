import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Ekstrak Tabel PDF ke CSV: ambil tabel dari PDF dan simpan sebagai file
// CSV yang bisa dibuka di Excel atau Google Sheets. Caranya: teks PDF
// dikelompokkan jadi baris (posisi Y sama) lalu kolom (jarak X yang jauh
// memisahkan kolom). Mesinnya pdf.js; ZIP-nya JSZip.
// BATASAN JUJUR (ditulis juga di UI): deteksi tabel ini tebakan dari
// posisi teks, bukan garis tabel asli. Tabel tanpa jarak kolom yang jelas
// bisa berantakan; bila begitu, hasilnya tetap diunduh sebagai teks
// per baris supaya tidak ada isi yang hilang diam-diam.
export const meta = {"id": "ekstrak-tabel-pdf-ke-csv", "name": "Ekstrak Tabel PDF ke CSV", "cat": "produktivitas", "icon": "📋", "desc": "Ambil tabel dari PDF dan simpan sebagai file CSV.", "keywords": "tabel pdf ke csv,pdf ke csv,ekstrak tabel pdf,csv dari pdf", "since": "6.19.0", "online": true};

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const JSZIP_CDN = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
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

// Escape satu sel CSV (RFC 4180): kutip bila ada koma, kutip, atau
// baris baru; kutip ganda didobel. Murni, bisa diuji di Node.
export function csvEscape(sel) {
  const s = String(sel == null ? '' : sel);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Tabel jadi teks CSV (baris dipisah \n, BOM di depan supaya Excel
// membuka huruf Indonesia dengan benar). Murni, bisa diuji di Node.
export function tabelKeCsv(tabel) {
  return '\ufeff' + (tabel || []).map((r) => r.map(csvEscape).join(',')).join('\n') + '\n';
}

export function render(root) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let hasil = []; // [{nama, csv, baris, rapi, halaman}]
  let namaDasar = 'dokumen';

  function tampilHasil() {
    T.show(hasilBox, '');
    hasil.forEach((r) => {
      const barisEl = T.el('<div class="row" style="align-items:center;margin-bottom:8px"></div>');
      barisEl.appendChild(T.el('<span style="font-size:13px;flex:1">Halaman ' + r.halaman + ' <span class="dim">(' + r.baris + ' baris' + (r.rapi ? '' : ', tabel tidak rapi') + ')</span></span>'));
      barisEl.appendChild(T.btn('Unduh CSV', () => { T.dl(r.nama, r.csv, 'text/csv;charset=utf-8'); T.toast('Berhasil diunduh'); }));
      hasilBox.appendChild(barisEl);
    });
    if (hasil.length > 1) {
      hasilBox.appendChild(T.btn('Unduh Semua (ZIP)', async () => {
        T.show(statusBox, '<span class="dim">Menyiapkan ZIP…</span>');
        if (!(await utils.loadLibOnce(JSZIP_CDN, () => !!window.JSZip))) {
          T.show(statusBox, '<span class="dim">Pembuat ZIP gagal dimuat. Cek koneksi lalu coba lagi, atau unduh CSV-nya satu per satu.</span>');
          return;
        }
        try {
          const zip = new window.JSZip();
          hasil.forEach((r) => zip.file(r.nama, r.csv));
          const blob = await zip.generateAsync({ type: 'blob' });
          T.dl(namaDasar + '-csv.zip', blob, 'application/zip');
          T.hide(statusBox);
          T.toast('ZIP berhasil diunduh');
        } catch (e) {
          T.show(statusBox, '<span class="dim">Gagal membuat ZIP. Unduh CSV-nya satu per satu.</span>');
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
      namaDasar = (f.name || 'dokumen').replace(/\.[^.]*$/, '');
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await window.pdfjsLib.getDocument({ data }).promise;
      const total = Math.min(doc.numPages, MAKS_HALAMAN);
      let halamanTidakRapi = 0;
      let totalBaris = 0;
      for (let i = 1; i <= total; i++) {
        T.show(statusBox, `<span class="dim">Membaca halaman ${i} dari ${total}…</span>`);
        const page = await doc.getPage(i);
        const konten = await page.getTextContent();
        const { tabel, rapi } = barisKeTabel(itemsKeBaris(konten.items || []));
        if (!tabel.length) continue;
        totalBaris += tabel.length;
        if (!rapi) halamanTidakRapi++;
        hasil.push({ nama: namaDasar + '-hal' + i + '.csv', csv: tabelKeCsv(tabel), baris: tabel.length, rapi, halaman: i });
      }
      await doc.destroy();
      if (!totalBaris) {
        T.show(statusBox, '<div class="err">Tidak ada teks yang bisa diambil dari PDF ini. Kemungkinan PDF-nya hasil scan (isinya hanya gambar).</div>');
        prosesB.disabled = false;
        return;
      }
      T.hide(statusBox);
      const catatan = halamanTidakRapi
        ? '<br>Di ' + halamanTidakRapi + ' halaman tabelnya tidak terdeteksi rapi, jadi baris teksnya masuk apa adanya. Periksa halaman itu sendiri.'
        : '';
      T.show(box, `<p class="note">Selesai: <b>${totalBaris} baris</b> dari ${hasil.length} halaman.${catatan}</p>`);
      tampilHasil();
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

  const prosesB = T.btn('Ekstrak Jadi CSV', proses, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Tabel ditebak dari posisi teksnya, bukan dari garis tabel asli. Tiap halaman PDF jadi satu file CSV. File CSV bisa dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lain.</p>'));
  root.appendChild(T.field('Pilih file PDF', fi));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
