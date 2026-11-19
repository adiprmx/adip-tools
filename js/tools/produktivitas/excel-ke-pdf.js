import { h as T, utils, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Excel ke PDF: ubah spreadsheet jadi PDF berbentuk tabel. Lembar yang
// dipilih dibaca dengan SheetJS, lalu digambar jadi tabel berpetak di
// PDF dengan pdf-lib. Bila tabelnya panjang, otomatis lanjut ke halaman
// berikutnya dengan judul kolom diulang di tiap halaman.
export const meta = {"id": "excel-ke-pdf", "name": "Excel ke PDF", "cat": "produktivitas", "icon": "📗", "desc": "Ubah spreadsheet jadi PDF berbentuk tabel.", "keywords": "excel ke pdf,xlsx ke pdf,spreadsheet ke pdf,tabel excel pdf", "since": "6.19.0"};

const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
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

export function render(root) {
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

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Baris pertama dianggap judul kolom dan diulang di tiap halaman. Hanya isi sel yang pindah; rumus, warna, dan gambar di dalam spreadsheet tidak ikut.</p>'));
  root.appendChild(T.field('Pilih file Excel (.xlsx/.xls) atau CSV', fi));
  root.appendChild(T.field('Lembar', lembarSel, 'Pilih file dulu, daftar lembar akan muncul di sini.'));
  root.appendChild(T.field('Judul di atas tabel', judulI));
  root.appendChild(T.field('Arah kertas', orientasiSel));
  root.appendChild(prosesB);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
