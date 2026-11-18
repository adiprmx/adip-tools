import { h as T, utils, money, kv } from '../../core.js';

// Rencana bisnis sederhana: formulir -> dokumen terstruktur + hitungan
// keuangan dasar (margin, laba per bulan, titik impas). Semua angka dihitung
// dari yang user isi, bukan ramalan.
utils.rencanaBisnis = function (o) {
  const harga = Math.max(0, Number(o.harga) || 0);
  const hpp = Math.max(0, Number(o.hpp) || 0);
  const unit = Math.max(0, Number(o.unit) || 0);
  const tetap = Math.max(0, Number(o.tetap) || 0);
  const margin = harga - hpp;
  const labaKotor = margin * unit;
  const labaBersih = labaKotor - tetap;
  const bep = margin > 0 ? Math.ceil(tetap / margin) : null;
  return { margin, labaKotor, labaBersih, bep };
};

export const meta = {"id": "generator-rencana-bisnis", "name": "Generator Rencana Bisnis", "cat": "bisnis", "icon": "📋", "desc": "Ubah ide usahamu jadi rencana tertulis: produk, pelanggan, dan hitungan keuangan.", "keywords": "rencana bisnis,business plan,usaha,umkm,modal,keuangan,bep,titik impas", "since": "6.16.0"};
export function render(root) {
  const namaI = T.input('text', 'cth: Kopi Sore', '');
  const produkI = T.ta(2, 'cth: Kopi susu gula aren dalam botol 250 ml, dijual lewat WA dan pasar malam');
  const pelangganI = T.ta(2, 'cth: Pekerja kantoran dan mahasiswa di sekitar kampus, usia 20-35 tahun');
  const masalahI = T.ta(2, 'cth: Susah cari kopi enak yang harganya ramah di kantong');
  const keunggulanI = T.ta(2, 'cth: Biji kopi lokal, gula aren asli, harga Rp12 ribu per botol');
  const hargaI = money(null, 'cth: 12000');
  const hppI = money(null, 'cth: 7000');
  const unitI = T.input('text', 'cth: 300', ''); unitI.inputMode = 'numeric';
  const tetapI = money(null, 'cth: 1000000');
  const box = T.out();
  let teksRencana = '';

  const buat = () => {
    const nama = namaI.value.trim() || 'Usahaku';
    const r = utils.rencanaBisnis({
      harga: T.num(hargaI.value), hpp: T.num(hppI.value),
      unit: T.num(unitI.value), tetap: T.num(tetapI.value),
    });
    const isi = (v, ganti) => (v || '').trim() || ganti;
    teksRencana =
      'RENCANA BISNIS: ' + nama + '\n' +
      'Dibuat dengan Adip Tools\n\n' +
      '1. RINGKASAN\n' + isi(produkI.value, '(isi produk/jasamu di formulir)') + '\n\n' +
      '2. PELANGGAN\n' + isi(pelangganI.value, '(isi siapa pelangganmu)') + '\n\n' +
      '3. MASALAH YANG DISELESAIKAN\n' + isi(masalahI.value, '(isi masalah pelanggan yang kamu selesaikan)') + '\n\n' +
      '4. KEUNGGULAN\n' + isi(keunggulanI.value, '(isi apa yang membuat usahamu beda)') + '\n\n' +
      '5. HITUNGAN KEUANGAN (dari angka yang kamu isi)\n' +
      '- Harga jual per produk: ' + T.rp(T.num(hargaI.value) || 0) + '\n' +
      '- Biaya per produk (HPP): ' + T.rp(T.num(hppI.value) || 0) + '\n' +
      '- Untung per produk: ' + T.rp(r.margin) + '\n' +
      '- Target jual per bulan: ' + (T.num(unitI.value) || 0) + ' produk\n' +
      '- Laba kotor per bulan: ' + T.rp(r.labaKotor) + '\n' +
      '- Biaya tetap per bulan: ' + T.rp(T.num(tetapI.value) || 0) + '\n' +
      '- Perkiraan laba bersih per bulan: ' + T.rp(r.labaBersih) + '\n' +
      (r.bep !== null ? '- Titik impas: jual ' + r.bep + ' produk per bulan supaya tidak rugi\n' : '- Titik impas: harga jual harus di atas biaya per produk\n') +
      '\nCatatan: angka di atas dihitung dari yang kamu isi, bukan ramalan. Cek lagi harga bahan dan biaya di lapangan sebelum memutuskan.';
    const bepHtml = r.bep !== null
      ? kv('Titik impas (tidak rugi)', 'Jual ' + r.bep + ' produk/bulan')
      : '<p class="warn">Harga jual masih di bawah atau sama dengan biaya per produk — belum ada untung per produk.</p>';
    T.show(box,
      '<div class="big">' + T.rp(r.labaBersih) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
      '<p class="center mut">Perkiraan laba bersih dari angka yang kamu isi.</p>' +
      kv('Untung per produk', T.rp(r.margin)) +
      kv('Laba kotor per bulan', T.rp(r.labaKotor)) +
      bepHtml +
      '<pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.6;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-top:12px">' + T.esc(teksRencana) + '</pre>' +
      '<p class="hint">Angka dihitung dari yang kamu isi — bukan ramalan. Cek lagi harga bahan dan biaya di lapangan sebelum memutuskan.</p>');
    box.appendChild(T.copyBtn(() => teksRencana, 'Salin rencana'));
    const dl = T.dlBtn('rencana-bisnis.txt', () => teksRencana, 'text/plain;charset=utf-8', 'Unduh rencana (.txt)');
    box.appendChild(dl);
  };

  root.appendChild(T.el('<p class="note">Isi formulir ini, dan alat akan menyusunnya jadi rencana bisnis yang rapi — lengkap dengan hitungan untung, rugi, dan titik impas.</p>'));
  root.appendChild(T.field('Nama usaha', namaI));
  root.appendChild(T.field('Produk atau jasa yang dijual', produkI));
  root.appendChild(T.field('Siapa pelangganmu', pelangganI));
  root.appendChild(T.field('Masalah pelanggan yang kamu selesaikan', masalahI));
  root.appendChild(T.field('Apa yang membuat usahamu beda', keunggulanI));
  root.appendChild(T.grid2(
    T.field('Harga jual per produk (Rp)', hargaI),
    T.field('Biaya per produk / HPP (Rp)', hppI)
  ));
  root.appendChild(T.grid2(
    T.field('Target jual per bulan (produk)', unitI),
    T.field('Biaya tetap per bulan (Rp)', tetapI, 'Sewa, listrik, gaji, dan biaya rutin lain')
  ));
  const btn = T.btn('Buat rencana bisnis', buat);
  root.appendChild(T.el('<div style="margin:4px 0 12px"></div>'));
  root.lastChild.appendChild(btn);
  root.appendChild(box);
}
