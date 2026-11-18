import { h as T, dl, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pembuat Surat Jual Beli: susun surat jual beli kendaraan atau barang
// dari data yang diisi user sendiri (penjual, pembeli, barang, harga),
// lalu ekspor sebagai teks, Word (.docx), atau PDF.
// Ini template dokumen umum yang isinya diisi user; bukan dokumen palsu.
// Disarankan tetap dibaca ulang dan ditandatangani kedua pihak di atas
// meterai bila nilainya besar (ditulis juga di UI).
export const meta = {"id": "pembuat-surat-jual-beli", "name": "Pembuat Surat Jual Beli", "cat": "produktivitas", "icon": "📜", "desc": "Susun surat jual beli motor, mobil, atau barang dari detail kedua pihak.", "keywords": "surat jual beli,jual beli motor,jual beli mobil,template surat", "since": "6.17.0"};

const DOCX_CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
const PDFLIB_CDN = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';

export const JENIS_BARANG = [
  ['motor', 'Sepeda motor'],
  ['mobil', 'Mobil'],
  ['barang', 'Barang lain'],
];

// Tulis angka rupiah dengan pemisah ribuan. Murni, bisa diuji di Node.
export function formatRupiah(n) {
  const v = Math.round(Number(n) || 0);
  return 'Rp' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Susun isi surat sebagai daftar baris teks. Murni, bisa diuji di Node.
// data: {jenis, penjualNama, penjualKtp, penjualAlamat, pembeliNama,
// pembeliKtp, pembeliAlamat, barangNama, barangDetail, harga, tanggal,
// tempat, caraBayar, catatan}
export function susunSurat(data) {
  const d = data || {};
  const jenisLabel = (JENIS_BARANG.find(([v]) => v === d.jenis) || [])[1] || 'Barang';
  const garis = [];
  garis.push('SURAT JUAL BELI');
  garis.push('');
  garis.push('Yang bertanda tangan di bawah ini:');
  garis.push('');
  garis.push('Nama     : ' + (d.penjualNama || '-'));
  garis.push('No. KTP  : ' + (d.penjualKtp || '-'));
  garis.push('Alamat   : ' + (d.penjualAlamat || '-'));
  garis.push('Selanjutnya disebut PIHAK PERTAMA (Penjual).');
  garis.push('');
  garis.push('Nama     : ' + (d.pembeliNama || '-'));
  garis.push('No. KTP  : ' + (d.pembeliKtp || '-'));
  garis.push('Alamat   : ' + (d.pembeliAlamat || '-'));
  garis.push('Selanjutnya disebut PIHAK KEDUA (Pembeli).');
  garis.push('');
  garis.push('Kedua pihak sepakat mengadakan jual beli dengan ketentuan berikut:');
  garis.push('');
  garis.push('Pasal 1 - Barang yang diperjualbelikan');
  garis.push('Jenis barang : ' + jenisLabel);
  garis.push('Nama barang  : ' + (d.barangNama || '-'));
  if (d.barangDetail) garis.push('Keterangan   : ' + d.barangDetail);
  garis.push('');
  garis.push('Pasal 2 - Harga dan pembayaran');
  garis.push('Harga yang disepakati: ' + formatRupiah(d.harga) + '.');
  garis.push('Cara bayar: ' + (d.caraBayar || 'Tunai, dibayar lunas saat surat ini ditandatangani.'));
  garis.push('');
  garis.push('Pasal 3 - Serah terima');
  garis.push('PIHAK PERTAMA menyerahkan barang beserta surat-suratnya kepada PIHAK KEDUA, dan PIHAK KEDUA menerimanya dalam keadaan baik.');
  if (d.catatan) {
    garis.push('');
    garis.push('Catatan tambahan: ' + d.catatan);
  }
  garis.push('');
  garis.push('Surat ini dibuat rangkap dua dan ditandatangani kedua pihak dengan sebenarnya, tanpa paksaan dari pihak mana pun.');
  garis.push('');
  const tempat = d.tempat || '';
  const tanggal = d.tanggal || '';
  garis.push((tempat ? tempat + ', ' : '') + tanggal);
  garis.push('');
  garis.push('PIHAK PERTAMA (Penjual)');
  garis.push('');
  garis.push('');
  garis.push('( ' + (d.penjualNama || '....................') + ' )');
  garis.push('');
  garis.push('PIHAK KEDUA (Pembeli)');
  garis.push('');
  garis.push('');
  garis.push('( ' + (d.pembeliNama || '....................') + ' )');
  return garis;
}

export function render(root) {
  const jenisSel = T.select(JENIS_BARANG, 'motor');
  const penjualNama = T.input('text', 'Nama lengkap penjual');
  const penjualKtp = T.input('text', 'Nomor KTP penjual');
  const penjualAlamat = T.ta(2, 'Alamat lengkap penjual');
  const pembeliNama = T.input('text', 'Nama lengkap pembeli');
  const pembeliKtp = T.input('text', 'Nomor KTP pembeli');
  const pembeliAlamat = T.ta(2, 'Alamat lengkap pembeli');
  const barangNama = T.input('text', 'Misal: Honda Beat 2021, warna hitam');
  const barangDetail = T.ta(2, 'Misal: nomor polisi, nomor rangka, nomor mesin, kondisi barang');
  const hargaI = T.input('text', 'Misal: 15000000');
  hargaI.inputMode = 'decimal';
  const caraBayar = T.select([
    ['Tunai, dibayar lunas saat surat ini ditandatangani.', 'Tunai lunas saat tanda tangan'],
    ['Transfer bank, dibayar lunas saat surat ini ditandatangani.', 'Transfer bank lunas saat tanda tangan'],
    ['Dibayar bertahap sesuai kesepakatan kedua pihak.', 'Bertahap sesuai kesepakatan'],
  ], 'Tunai, dibayar lunas saat surat ini ditandatangani.');
  const tempatI = T.input('text', 'Misal: Jakarta');
  const tanggalI = T.input('date');
  const catatanI = T.ta(2, 'Catatan lain bila ada (boleh kosong)');
  const box = T.out();
  const statusBox = T.out();
  const hasilBox = T.out();

  const hariIni = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  tanggalI.value = hariIni.getFullYear() + '-' + p2(hariIni.getMonth() + 1) + '-' + p2(hariIni.getDate());

  function kumpulkan() {
    const harga = Number(String(hargaI.value || '').replace(/[^0-9]/g, '')) || 0;
    const tgl = tanggalI.value ? tanggalI.value.split('-') : [];
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tanggalTeks = tgl.length === 3
      ? Number(tgl[2]) + ' ' + namaBulan[Number(tgl[1]) - 1] + ' ' + tgl[0]
      : '';
    return {
      jenis: jenisSel.value,
      penjualNama: penjualNama.value.trim(),
      penjualKtp: penjualKtp.value.trim(),
      penjualAlamat: penjualAlamat.value.trim(),
      pembeliNama: pembeliNama.value.trim(),
      pembeliKtp: pembeliKtp.value.trim(),
      pembeliAlamat: pembeliAlamat.value.trim(),
      barangNama: barangNama.value.trim(),
      barangDetail: barangDetail.value.trim(),
      harga,
      tanggal: tanggalTeks,
      tempat: tempatI.value.trim(),
      caraBayar: caraBayar.value,
      catatan: catatanI.value.trim(),
    };
  }

  function validasi(d) {
    if (!d.penjualNama) return 'Isi nama penjual dulu';
    if (!d.pembeliNama) return 'Isi nama pembeli dulu';
    if (!d.barangNama) return 'Isi nama barangnya dulu';
    if (!d.harga) return 'Isi harganya dulu (angka saja)';
    return '';
  }

  function tampilkanSurat(baris) {
    T.show(box, '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:13px;line-height:1.6">' + T.esc(baris.join('\n')) + '</pre>');
    T.scrollToPreview(box);
  }

  function susun() {
    const d = kumpulkan();
    const salah = validasi(d);
    if (salah) { T.toast(salah); return null; }
    return susunSurat(d);
  }

  let docxSiap = null, pdfLibSiap = null;
  const muatDocx = () => {
    if (!docxSiap) {
      docxSiap = T.loadScript(DOCX_CDN).then((ok) => ok && !!window.docx && typeof window.docx.Document === 'function')
        .catch(() => { docxSiap = null; return false; });
    }
    return docxSiap;
  };
  const muatPdfLib = () => {
    if (!pdfLibSiap) {
      pdfLibSiap = T.loadScript(PDFLIB_CDN).then((ok) => ok && !!window.PDFLib)
        .catch(() => { pdfLibSiap = null; return false; });
    }
    return pdfLibSiap;
  };

  async function unduhDocx() {
    const baris = susun();
    if (!baris) return;
    T.show(statusBox, '<span class="dim">Memuat mesin Word… (perlu internet sekali saja)</span>');
    const ok = await muatDocx();
    if (!ok) { T.show(statusBox, '<div class="err">Mesin Word gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div>'); return; }
    T.hide(statusBox);
    const D = window.docx;
    const anak = baris.map((b) => {
      const tebal = /^(SURAT JUAL BELI|Pasal \d|PIHAK (PERTAMA|KEDUA))/.test(b);
      return new D.Paragraph({ children: [new D.TextRun({ text: b || ' ', bold: tebal, size: tebal && b === 'SURAT JUAL BELI' ? 32 : 24 })], spacing: { after: 60 } });
    });
    const dokumen = new D.Document({ sections: [{ children: anak }] });
    const blob = await D.Packer.toBlob(dokumen);
    tampilkanSurat(baris);
    T.show(hasilBox, '');
    hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
    hasilBox.appendChild(T.btn('Unduh Word (.docx)', () => { T.dl('surat-jual-beli.docx', blob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); T.toast('Berhasil diunduh'); }, true));
  }

  async function unduhPdf() {
    const baris = susun();
    if (!baris) return;
    T.show(statusBox, '<span class="dim">Memuat mesin PDF… (perlu internet sekali saja)</span>');
    const ok = await muatPdfLib();
    if (!ok) { T.show(statusBox, '<div class="err">Mesin PDF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div>'); return; }
    T.hide(statusBox);
    const L = window.PDFLib;
    const doc = await L.PDFDocument.create();
    const font = await doc.embedFont(L.StandardFonts.Helvetica);
    const fontTebal = await doc.embedFont(L.StandardFonts.HelveticaBold);
    const MARGIN = 56, LEBAR = 595.28, TINGGI = 841.89, UKURAN = 11, TINGGI_BARIS = 17;
    const lebarTeks = LEBAR - MARGIN * 2;
    let page = doc.addPage([LEBAR, TINGGI]);
    let y = TINGGI - MARGIN;
    const halamanBaru = () => { page = doc.addPage([LEBAR, TINGGI]); y = TINGGI - MARGIN; };
    const tulisBaris = (teks, fnt, ukuran) => {
      const kata = String(teks).split(/\s+/).filter(Boolean);
      let jalan = '';
      const potong = [];
      for (const k of kata) {
        const coba = jalan ? jalan + ' ' + k : k;
        if (fnt.widthOfTextAtSize(coba, ukuran) <= lebarTeks) { jalan = coba; continue; }
        if (jalan) potong.push(jalan);
        jalan = k;
      }
      if (jalan) potong.push(jalan);
      if (!potong.length) potong.push('');
      for (const b of potong) {
        if (y - TINGGI_BARIS < MARGIN) halamanBaru();
        if (b) page.drawText(b, { x: MARGIN, y: y - ukuran, size: ukuran, font: fnt, color: L.rgb(0.09, 0.08, 0.07) });
        y -= TINGGI_BARIS;
      }
    };
    for (const b of baris) {
      const judul = b === 'SURAT JUAL BELI';
      const tebal = judul || /^(Pasal \d|PIHAK (PERTAMA|KEDUA))/.test(b);
      tulisBaris(b, tebal ? fontTebal : font, judul ? 16 : UKURAN);
    }
    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    tampilkanSurat(baris);
    T.show(hasilBox, '');
    hasilBox.appendChild(T.el(`<p class="dim">Ukuran file: ${fmtBytes(blob.size)}.</p>`));
    hasilBox.appendChild(T.btn('Unduh PDF', () => { T.dl('surat-jual-beli.pdf', blob, 'application/pdf'); T.toast('Berhasil diunduh'); }, true));
  }

  function unduhTeks() {
    const baris = susun();
    if (!baris) return;
    tampilkanSurat(baris);
    T.show(hasilBox, '');
    hasilBox.appendChild(T.btn('Unduh Teks (.txt)', () => { T.dl('surat-jual-beli.txt', baris.join('\n'), 'text/plain;charset=utf-8'); T.toast('Berhasil diunduh'); }, true));
    hasilBox.appendChild(T.copyBtn(() => baris.join('\n'), 'Salin Surat'));
  }

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.el('<p class="note">Ini template surat umum. Isi datanya sendiri, baca ulang sebelum dipakai, dan tanda tangani bersama. Untuk nilai besar, tanda tangan di atas meterai lebih aman.</p>'));
  root.appendChild(T.field('Jenis barang', jenisSel));
  root.appendChild(T.el('<p class="note"><b>Penjual (Pihak Pertama)</b></p>'));
  root.appendChild(T.field('Nama penjual', penjualNama));
  root.appendChild(T.field('Nomor KTP penjual', penjualKtp));
  root.appendChild(T.field('Alamat penjual', penjualAlamat));
  root.appendChild(T.el('<p class="note"><b>Pembeli (Pihak Kedua)</b></p>'));
  root.appendChild(T.field('Nama pembeli', pembeliNama));
  root.appendChild(T.field('Nomor KTP pembeli', pembeliKtp));
  root.appendChild(T.field('Alamat pembeli', pembeliAlamat));
  root.appendChild(T.el('<p class="note"><b>Barang dan harga</b></p>'));
  root.appendChild(T.field('Nama barang', barangNama));
  root.appendChild(T.field('Keterangan barang', barangDetail));
  root.appendChild(T.field('Harga (angka saja)', hargaI));
  root.appendChild(T.field('Cara bayar', caraBayar));
  root.appendChild(T.grid2(T.field('Tempat dibuat', tempatI), T.field('Tanggal', tanggalI)));
  root.appendChild(T.field('Catatan tambahan', catatanI));
  root.appendChild(T.row(T.btn('Lihat Surat', () => { const b = susun(); if (b) { tampilkanSurat(b); T.show(hasilBox, ''); } }, true), T.btn('Unduh Teks', unduhTeks), T.btn('Unduh Word', unduhDocx), T.btn('Unduh PDF', unduhPdf)));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(hasilBox);
}
