import { h as T, utils } from '../../core.js';

// Generator draf perjanjian kerahasiaan (NDA) satu arah/timbal balik.
// Isi draf disusun dari data para pihak yang diisi user. Ini draf umum,
// bukan nasihat hukum: UI meminta user minta pengacara memeriksanya
// sebelum ditandatangani.
export function buatNda(d) {
  const p1 = (d.pihak1 || '').trim() || '[Nama pihak pertama]';
  const p2 = (d.pihak2 || '').trim() || '[Nama pihak kedua]';
  const tujuan = (d.tujuan || '').trim() || '[tujuan kerja sama]';
  const info = (d.info || '').trim() || 'data usaha, rencana bisnis, daftar pelanggan, dan informasi teknis';
  const tahun = Number(d.tahun) || 2;
  const kota = (d.kota || '').trim() || '[kota]';
  const tanggal = (d.tanggal || '').trim() || '[tanggal]';
  const arah = d.arah === 'satu' ? 'satu arah' : 'timbal balik';
  const pengungkap = d.arah === 'satu' ? p1 : 'masing-masing pihak';
  const penerima = d.arah === 'satu' ? p2 : 'masing-masing pihak';
  return 'PERJANJIAN KERAHASIAAN (NON-DISCLOSURE AGREEMENT)\n\n' +
    'Perjanjian ini dibuat pada tanggal ' + tanggal + ' di ' + kota + ', antara:\n\n' +
    'PIHAK PERTAMA: ' + p1 + '\n' +
    'PIHAK KEDUA: ' + p2 + '\n\n' +
    'Kedua pihak sepakat mengadakan perjanjian kerahasiaan ' + arah + ' dengan ketentuan berikut:\n\n' +
    'Pasal 1. Tujuan\n' +
    'Perjanjian ini dibuat sehubungan dengan ' + tujuan + '.\n\n' +
    'Pasal 2. Informasi Rahasia\n' +
    'Informasi Rahasia adalah segala informasi yang diungkapkan ' + pengungkap + ' kepada ' + penerima + ' sehubungan dengan tujuan di atas, termasuk ' + info + ', baik lisan, tertulis, maupun elektronik, yang dinyatakan rahasia atau sepatutnya dipahami sebagai rahasia.\n\n' +
    'Pasal 3. Kewajiban Menerima\n' +
    penerima.charAt(0).toUpperCase() + penerima.slice(1) + ' wajib:\n' +
    'a. Menjaga kerahasiaan Informasi Rahasia dan tidak mengungkapkannya kepada pihak lain tanpa persetujuan tertulis;\n' +
    'b. Menggunakan Informasi Rahasia hanya untuk tujuan perjanjian ini;\n' +
    'c. Melindungi Informasi Rahasia dengan tingkat kehati-hatian yang sama seperti melindungi informasinya sendiri.\n\n' +
    'Pasal 4. Pengecualian\n' +
    'Kewajiban ini tidak berlaku untuk informasi yang: (a) sudah diketahui umum; (b) sudah dimiliki penerima sebelum diungkapkan; (c) diterima dari pihak ketiga tanpa kewajiban rahasia; atau (d) wajib diungkapkan karena hukum atau perintah pengadilan, dengan pemberitahuan terlebih dahulu kepada pihak pengungkap bila memungkinkan.\n\n' +
    'Pasal 5. Jangka Waktu\n' +
    'Perjanjian ini berlaku selama ' + tahun + ' tahun sejak tanggal ditandatangani. Kewajiban menjaga kerahasiaan atas informasi yang sudah diterima tetap berlaku selama ' + tahun + ' tahun setelah perjanjian berakhir.\n\n' +
    'Pasal 6. Pengembalian Informasi\n' +
    'Atas permintaan pihak pengungkap, penerima wajib mengembalikan atau memusnahkan semua salinan Informasi Rahasia.\n\n' +
    'Pasal 7. Penyelesaian Perselisihan\n' +
    'Perselisihan diselesaikan lebih dulu secara musyawarah. Bila tidak tercapai, para pihak sepakat menyelesaikannya melalui pengadilan yang berwenang di ' + kota + '.\n\n' +
    'Demikian perjanjian ini dibuat dan ditandatangani kedua pihak.\n\n\n' +
    'PIHAK PERTAMA,\n\n\n( ' + p1 + ' )\n\n\n' +
    'PIHAK KEDUA,\n\n\n( ' + p2 + ' )\n\n' +
    'Catatan: draf umum yang dibuat dengan Adip Tools. Bukan nasihat hukum. Minta pengacara memeriksa draf ini sebelum ditandatangani, dan sesuaikan dengan kebutuhan dan hukum yang berlaku.';
}
utils.buatNda = buatNda;

export const meta = {"id": "generator-nda", "name": "Generator NDA", "cat": "bisnis", "icon": "🤝", "desc": "Susun draf perjanjian kerahasiaan (NDA) dari nama para pihak dan tujuannya.", "keywords": "nda,perjanjian,kerahasiaan,non-disclosure,kontrak,rahasia,dagang,bisnis,draf", "since": "6.18.0"};
export function render(root) {
  const p1I = T.input('text', 'cth: PT Maju Bersama / Andi Wijaya', '');
  const p2I = T.input('text', 'cth: Budi Santoso / CV Kreatif', '');
  const arahSel = T.select([['dua', 'Timbal balik (dua pihak saling jaga rahasia)'], ['satu', 'Satu arah (hanya pihak kedua yang menjaga)']], 'dua');
  const tujuanI = T.ta(2, 'cth: Menjajaki kerja sama pengembangan aplikasi kasir');
  const infoI = T.ta(2, 'cth: Rencana produk, daftar pelanggan, harga pokok, dan kode sumber');
  const tahunI = T.input('text', 'cth: 2', '2'); tahunI.inputMode = 'decimal';
  const kotaI = T.input('text', 'cth: Jakarta', '');
  const tglI = T.input('text', 'cth: 19 November 2026', '');
  const box = T.out();
  let teksNda = '';

  const buat = () => {
    if (!p1I.value.trim() || !p2I.value.trim()) {
      T.show(box, '<div class="err">Isi dulu nama pihak pertama dan pihak kedua.</div>');
      return;
    }
    const tahun = T.num(tahunI.value);
    if (!isFinite(tahun) || tahun <= 0 || tahun > 20) {
      T.show(box, '<div class="err">Jangka waktu harus angka antara 1 sampai 20 tahun.</div>');
      return;
    }
    teksNda = buatNda({
      pihak1: p1I.value, pihak2: p2I.value, arah: arahSel.value,
      tujuan: tujuanI.value, info: infoI.value, tahun,
      kota: kotaI.value, tanggal: tglI.value,
    });
    T.show(box,
      '<div class="big">Draf NDA siap</div>' +
      '<p class="center mut">Perjanjian ' + (arahSel.value === 'satu' ? 'satu arah' : 'timbal balik') + ', berlaku ' + String(tahun).replace('.', ',') + ' tahun.</p>' +
      '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.6;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-top:12px">' + T.esc(teksNda) + '</pre>' +
      '<p class="warn">Ini draf umum, bukan nasihat hukum. Minta pengacara memeriksa draf ini sebelum ditandatangani, dan sesuaikan dengan kebutuhanmu.</p>');
    box.appendChild(T.copyBtn(() => teksNda, 'Salin NDA'));
    box.appendChild(T.dlBtn('nda.txt', () => teksNda, 'text/plain;charset=utf-8', 'Unduh NDA (.txt)'));
  };

  root.appendChild(T.el('<p class="note">NDA itu perjanjian supaya informasi rahasia tidak bocor ke pihak lain. Isi nama para pihak dan tujuannya, alat ini menyusun drafnya dengan pasal-pasal standar.</p>'));
  root.appendChild(T.field('Pihak pertama', p1I, 'Nama orang atau perusahaan yang memberi info'));
  root.appendChild(T.field('Pihak kedua', p2I, 'Nama orang atau perusahaan yang menerima info'));
  root.appendChild(T.field('Arah perjanjian', arahSel));
  root.appendChild(T.field('Tujuan kerja sama', tujuanI));
  root.appendChild(T.field('Informasi rahasia yang dilindungi', infoI));
  root.appendChild(T.grid2(
    T.field('Jangka waktu (tahun)', tahunI),
    T.field('Kota penandatanganan', kotaI)
  ));
  root.appendChild(T.field('Tanggal perjanjian', tglI));
  root.appendChild(T.row(T.btn('Buat draf NDA', buat, true)));
  root.appendChild(box);
}
