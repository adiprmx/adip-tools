// MERGE B19 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = pdf-ke-excel (survivor), arah B = excel-ke-pdf (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

export const meta = {"id": "pdf-ke-excel", "name": "PDF ↔ Excel", "cat": "produktivitas", "icon": "📊", "desc": "Ambil tabel dari PDF jadi Excel, atau ubah spreadsheet jadi PDF tabel.", "keywords": "pdf ke excel,pdf ke xlsx,tabel pdf,ekstrak tabel pdf,excel ke pdf,xlsx ke pdf,spreadsheet ke pdf,tabel excel pdf,excel,pdf", "since": "6.17.0", "online": true};


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

// ---------- Mesin arah B: Excel → PDF (dari excel-ke-pdf.js) ----------
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const MAKS_BARIS = 5000;
const MAKS_KOLOM = 20;

// Bagi lebar halaman ke kolom sesuai panjang isi terpanjang tiap kolom.
// Mengembalikan lebar tiap kolom (pt) yang jumlahnya pas lebarMaks.
// Murni, bisa diuji di Node.
export function hitungLebarKolom(baris, lebarMaks) {
  const jumlahKolom = Math.max(1, ...baris.map((r) => r.length));
  const skor = new Array(jumlahKolom).fill(1);
  for (const r of baris) {
    for (let c = 0; c < jumlahKolom; c++) {
      const isi = String(r[c] == null ? '' : r[c]);
      skor[c] = Math.max(skor[c], Math.min(40, isi.length));
    }
  }
  const total = skor.reduce((a, b) => a + b, 0);
  const lebar = skor.map((s) => (s / total) * lebarMaks);
  const sisa = lebarMaks - lebar.reduce((a, b) => a + b, 0);
  lebar[lebar.length - 1] += sisa;
  return lebar;
}

// Potong teks jadi baris-baris yang muat di lebar sel.
// ukur(teks) -> lebar dalam pt. Murni, bisa diuji tanpa DOM.
// Memakai utils.bungkusTeks (kanonis, G4 C1G4-R).
export const bungkusSel = utils.bungkusTeks;

// Bagi baris data ke halaman-halaman berdasarkan tinggi tiap baris.
// tinggiBaris[i] = tinggi baris ke-i (pt). Mengembalikan daftar halaman,
// tiap halaman berisi indeks baris. Murni, bisa diuji di Node.
export function bagiHalaman(tinggiBaris, tinggiTersedia) {
  const halaman = [];
  let jalan = [];
  let pakai = 0;
  for (let i = 0; i < tinggiBaris.length; i++) {
    if (jalan.length && pakai + tinggiBaris[i] > tinggiTersedia) {
      halaman.push(jalan);
      jalan = [];
      pakai = 0;
    }
    jalan.push(i);
    pakai += tinggiBaris[i];
  }
  if (jalan.length) halaman.push(jalan);
  return halaman;
}

// Sakelar arah: dua tombol besar di paling atas. Arah yang aktif tampil
// terbalik (putih di atas hitam) supaya langsung kelihatan tanpa membaca
// kecil-kecil. Kedua panel tetap hidup berdampingan — pindah arah tidak
// menghapus isian di panel yang ditinggalkan.
/* R1 (v6.21.0): alias redirect — kunjungan dari tautan lama arah B
   (#/t/<id-pensiun>) mendarat di sini dengan ?dir=b; buka langsung
   panel arah B. Tanpa ?dir=b, perilaku lama (arah A) tidak berubah. */
function mintaArahB() {
  try {
    const q = (typeof location !== 'undefined' && location.hash.split('?')[1]) || '';
    return /(?:^|&)dir=b(?:&|$)/.test(q);
  } catch {
    return false;
  }
}

function buatSakelarArah(labelA, labelB, panelA, panelB) {
  const bungkus = T.el('<div role="tablist" aria-label="Arah konversi" style="display:flex;gap:8px;margin:2px 0 16px"></div>');
  const GAYA_AKTIF = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff;font-size:15px;font-weight:700;background:#ffffff;color:#000000;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const GAYA_MATI = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff33;font-size:15px;font-weight:600;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const tombolA = document.createElement('button');
  tombolA.type = 'button';
  tombolA.textContent = labelA;
  tombolA.setAttribute('role', 'tab');
  const tombolB = document.createElement('button');
  tombolB.type = 'button';
  tombolB.textContent = labelB;
  tombolB.setAttribute('role', 'tab');
  const atur = (keA) => {
    tombolA.style.cssText = keA ? GAYA_AKTIF : GAYA_MATI;
    tombolB.style.cssText = keA ? GAYA_MATI : GAYA_AKTIF;
    tombolA.setAttribute('aria-selected', keA ? 'true' : 'false');
    tombolB.setAttribute('aria-selected', keA ? 'false' : 'true');
    panelA.hidden = !keA;
    panelB.hidden = keA;
  };
  tombolA.addEventListener('click', () => atur(true));
  tombolB.addEventListener('click', () => atur(false));
  bungkus.appendChild(tombolA);
  bungkus.appendChild(tombolB);
  atur(!mintaArahB());
  return bungkus;
}

function renderPdfKeExcel(panel) {
  const fi = fileInput('application/pdf,.pdf');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  // Loader library kanonis: utils.loadLibOnce (core.js).

  async function proses() {
    const f = fi.files && fi.files[0];
    if (!f) { T.toast('Pilih file PDF dulu'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF dan Excel… (perlu internet sekali saja)</span>');
    const [pdfOk, xlsxOk] = await Promise.all([utils.loadLibOnce(PDFJS_CDN, () => !!window.pdfjsLib, () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; }), utils.loadLibOnce(XLSX_CDN, () => !!window.XLSX && !!window.XLSX.utils)]);
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
        ? '<div class="err">PDF ini dikunci kata sandi. Buka kuncinya dulu dengan tool Kunci PDF, tab Buka kunci.</div>'
        : '<div class="err">PDF tidak bisa dibaca. Pastikan filenya PDF yang benar dan tidak rusak.</div> <button class="btn" type="button">Coba lagi</button>');
      const tombol = statusBox.querySelector('button');
      if (tombol) tombol.addEventListener('click', proses);
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi Excel', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Tabel ditebak dari posisi teksnya, bukan dari garis tabel asli. Tabel yang kolomnya rapat bisa berantakan, dan hasilnya akan ditulis apa adanya supaya tidak ada isi yang hilang diam-diam. Tiap halaman PDF jadi satu lembar di Excel.</p>'));
  panel.appendChild(T.field('Pilih file PDF', fi));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

function renderExcelKePdf(panel) {
  const fi = fileInput('.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv');
  const lembarSel = T.select([], '');
  const orientasiSel = T.select([['landscape', 'Mendatar (cocok untuk tabel lebar)'], ['portrait', 'Tegak']], 'landscape');
  const judulI = T.input('text', 'Judul di atas tabel (boleh kosong)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();
  let workbook = null;
  let namaDasar = 'spreadsheet';

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    workbook = null;
    lembarSel.innerHTML = '';
    if (!f) return;
    T.show(statusBox, '<span class="dim">Membaca spreadsheet… (perlu internet sekali saja untuk mesin Excel)</span>');
    const ok = await utils.loadLibOnce(XLSX_CDN, () => !!window.XLSX && !!window.XLSX.utils);
    if (!ok) {
      T.show(statusBox, '<div class="err">Mesin Excel gagal dimuat. Cek koneksi internetmu lalu pilih lagi filenya.</div>');
      return;
    }
    try {
      const buf = await f.arrayBuffer();
      workbook = window.XLSX.read(new Uint8Array(buf), { type: 'array' });
      namaDasar = (f.name || 'spreadsheet').replace(/\.[^.]*$/, '');
      const nama = workbook.SheetNames || [];
      lembarSel.innerHTML = '';
      nama.forEach((n, i) => {
        const o = document.createElement('option');
        o.value = n;
        o.textContent = n + (i === 0 ? ' (pertama)' : '');
        lembarSel.appendChild(o);
      });
      T.hide(statusBox);
      if (!nama.length) T.show(statusBox, '<div class="err">Spreadsheet ini tidak punya lembar yang bisa dibaca.</div>');
    } catch (e) {
      T.show(statusBox, '<div class="err">File tidak bisa dibaca. Pastikan filenya Excel (.xlsx/.xls) atau CSV yang benar.</div>');
    }
  });

  async function proses() {
    if (!workbook) { T.toast('Pilih file Excel dulu'); return; }
    const namaLembar = lembarSel.value || workbook.SheetNames[0];
    const ws = workbook.Sheets[namaLembar];
    if (!ws) { T.toast('Lembar tidak ditemukan'); return; }
    T.hide(box); T.hide(hasilBox);
    prosesB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    if (!(await utils.loadLibOnce(PDFLIB_CDN, () => !!window.PDFLib))) {
      T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div>');
      prosesB.disabled = false;
      return;
    }
    try {
      const mentah = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
      const baris = mentah
        .map((r) => (Array.isArray(r) ? r : []).map((c) => String(c == null ? '' : c)).slice(0, MAKS_KOLOM))
        .filter((r) => r.some((c) => String(c).trim()))
        .slice(0, MAKS_BARIS);
      if (!baris.length) {
        T.show(statusBox, '<div class="err">Lembar ini kosong, tidak ada yang bisa diubah jadi PDF.</div>');
        prosesB.disabled = false;
        return;
      }
      if (baris.length < 2) {
        // Hanya judul kolom, tanpa satu pun baris data: sebelumnya tetap
        // "sukses" dan menyimpan PDF 0 halaman.
        T.show(statusBox, '<div class="err">Lembar ini hanya berisi judul kolom, belum ada datanya. Tambah dulu isi tabelnya di spreadsheet, lalu coba lagi.</div>');
        prosesB.disabled = false;
        return;
      }
      const L = window.PDFLib;
      const doc = await L.PDFDocument.create();
      const font = await doc.embedFont(L.StandardFonts.Helvetica);
      const fontTebal = await doc.embedFont(L.StandardFonts.HelveticaBold);
      const mendatar = orientasiSel.value === 'landscape';
      const lebarHal = mendatar ? 842 : 595;
      const tinggiHal = mendatar ? 595 : 842;
      const margin = 36;
      const ukuran = 9;
      const tinggiBarisIsi = 15;
      const lebarMaks = lebarHal - margin * 2;
      const lebarKolom = hitungLebarKolom(baris, lebarMaks);
      const ukur = (t) => font.widthOfTextAtSize(t, ukuran);
      const judul = judulI.value.trim();
      const yJudul = judul ? 22 : 0;
      const tinggiTersedia = tinggiHal - margin * 2 - tinggiBarisIsi - yJudul;
      const tinggi = baris.slice(1).map((r) => {
        let maks = 1;
        r.forEach((c, ci) => {
          maks = Math.max(maks, bungkusSel(c, Math.max(10, lebarKolom[ci] - 8), ukur).length);
        });
        return Math.max(tinggiBarisIsi, maks * 12 + 4);
      });
      const halaman = bagiHalaman(tinggi, tinggiTersedia);
      const abu = L.rgb(0.9, 0.9, 0.9);
      const garis = L.rgb(0.75, 0.75, 0.75);
      const hitam = L.rgb(0.1, 0.1, 0.1);
      const gambarKepala = (hal, yAtas) => {
        let x = margin;
        hal.drawRectangle({ x: margin, y: yAtas - tinggiBarisIsi, width: lebarMaks, height: tinggiBarisIsi, color: abu, borderColor: garis, borderWidth: 0.5 });
        baris[0].forEach((c, ci) => {
          const teks = bungkusSel(c, Math.max(10, lebarKolom[ci] - 8), (t) => fontTebal.widthOfTextAtSize(t, ukuran))[0] || '';
          hal.drawText(teks, { x: x + 4, y: yAtas - tinggiBarisIsi + 4, size: ukuran, font: fontTebal, color: hitam });
          x += lebarKolom[ci];
        });
        return yAtas - tinggiBarisIsi;
      };
      halaman.forEach((indeksBaris, hi) => {
        const hal = doc.addPage([lebarHal, tinggiHal]);
        let y = tinggiHal - margin;
        if (judul && hi === 0) {
          hal.drawText(judul, { x: margin, y: y - 14, size: 13, font: fontTebal, color: hitam });
          y -= yJudul;
        }
        y = gambarKepala(hal, y);
        indeksBaris.forEach((bi) => {
          const r = baris[bi + 1];
          const t = tinggi[bi];
          let x = margin;
          hal.drawRectangle({ x: margin, y: y - t, width: lebarMaks, height: t, borderColor: garis, borderWidth: 0.5 });
          r.forEach((c, ci) => {
            const potong = bungkusSel(c, Math.max(10, lebarKolom[ci] - 8), ukur);
            potong.forEach((b, k) => {
              hal.drawText(b, { x: x + 4, y: y - 11 - k * 12, size: ukuran, font, color: hitam });
            });
            x += lebarKolom[ci];
          });
          y -= t;
        });
      });
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      T.hide(statusBox);
      T.show(box, `<p class="note">Selesai: <b>${baris.length - 1} baris</b> dari lembar "${T.esc(namaLembar)}" jadi PDF <b>${halaman.length} halaman</b>.</p>`);
      T.show(hasilBox, '');
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh PDF', () => { T.dl(namaDasar + '.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(box);
    } catch (e) {
      T.show(statusBox, '<div class="err">PDF gagal dibuat. Coba lagi.</div>');
    } finally {
      prosesB.disabled = false;
    }
  }

  const prosesB = T.btn('Ubah Jadi PDF', proses, true);

  panel.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  panel.appendChild(T.el('<p class="note">Baris pertama dianggap judul kolom dan diulang di tiap halaman. Hanya isi sel yang pindah; rumus, warna, dan gambar di dalam spreadsheet tidak ikut.</p>'));
  panel.appendChild(T.field('Pilih file Excel (.xlsx/.xls) atau CSV', fi));
  panel.appendChild(T.field('Lembar', lembarSel, 'Pilih file dulu, daftar lembar akan muncul di sini.'));
  panel.appendChild(T.field('Judul di atas tabel', judulI));
  panel.appendChild(T.field('Arah kertas', orientasiSel));
  panel.appendChild(prosesB);
  panel.appendChild(statusBox);
  panel.appendChild(box);
  panel.appendChild(hasilBox);
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderPdfKeExcel(panelA);
  renderExcelKePdf(panelB);
  root.appendChild(buatSakelarArah('PDF → Excel', 'Excel → PDF', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
