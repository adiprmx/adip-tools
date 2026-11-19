import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-fifo-lifo", "name": "Kalkulator FIFO/LIFO Persediaan", "cat": "bisnis", "icon": "📦", "desc": "Nilai persediaan dan harga pokok penjualan dengan metode FIFO dan LIFO, dari daftar pembelianmu.", "keywords": "fifo,lifo,persediaan,stok,hpp,harga pokok,inventory,gudang,akuntansi", "since": "6.19.0"};

/* Parse daftar pembelian: satu baris = "jumlah,harga" (koma atau titik-koma
   atau spasi sebagai pemisah). Balikan {pembelian: [{qty, harga}]|null, salah}. */
export function parsePembelian(teks) {
  const daftar = [];
  const baris = String(teks == null ? '' : teks).split(/\r?\n/);
  for (const b of baris) {
    const t = b.trim();
    if (!t) continue;
    const potong = t.split(/[,;\t]+|\s+/).filter(Boolean);
    if (potong.length !== 2) return { pembelian: null, salah: t };
    const qty = T.num(potong[0]);
    const harga = T.num(potong[1]);
    if (!isFinite(qty) || !isFinite(harga) || qty <= 0 || harga < 0) return { pembelian: null, salah: t };
    daftar.push({ qty, harga });
  }
  return { pembelian: daftar, salah: null };
}

/* Hitung HPP + nilai persediaan akhir dengan metode FIFO atau LIFO.
   pembelian: array {qty, harga} urut dari yang paling dulu dibeli.
   terjual: jumlah unit yang terjual. */
export function hitungPersediaan(pembelian, terjual, metode) {
  const n = Number(terjual);
  if (!Array.isArray(pembelian) || !pembelian.length || !isFinite(n) || n < 0) return null;
  const total = pembelian.reduce((a, p) => a + p.qty, 0);
  if (n > total) return null;
  const sisaPerLot = pembelian.map((p) => ({ qty: p.qty, harga: p.harga }));
  const ambil = metode === 'lifo' ? sisaPerLot.slice().reverse() : sisaPerLot;
  let sisa = n;
  let hpp = 0;
  for (const lot of ambil) {
    if (sisa <= 0) break;
    const pakai = Math.min(lot.qty, sisa);
    hpp += pakai * lot.harga;
    lot.qty -= pakai;
    sisa -= pakai;
  }
  const akhir = sisaPerLot.reduce((a, p) => a + p.qty * p.harga, 0);
  return { hpp, akhir, terjual: n, sisaUnit: total - n };
}
utils.persediaanFifoLifo = hitungPersediaan;

export function render(root) {
  const beliI = T.ta(5, 'Satu baris per pembelian: jumlah,harga\ncth:\n10,5000\n10,6000\n5,7000');
  const jualI = T.input('text', 'cth: 12', '');
  const box = T.out();

  const hitung = () => {
    const hasil = parsePembelian(beliI.value);
    if (hasil.salah != null) { T.show(box, '<div class="err">Baris "' + T.esc(hasil.salah.slice(0, 30)) + '" tidak bisa dibaca. Formatnya: jumlah,harga per baris.</div>'); return; }
    if (!hasil.pembelian.length) { T.show(box, '<div class="err">Isi dulu daftar pembeliannya, satu baris per pembelian.</div>'); return; }
    const terjual = T.num(jualI.value);
    if (!isFinite(terjual) || terjual < 0) { T.show(box, '<div class="err">Isi jumlah unit yang terjual dengan angka 0 atau lebih.</div>'); return; }
    const fifo = hitungPersediaan(hasil.pembelian, terjual, 'fifo');
    const lifo = hitungPersediaan(hasil.pembelian, terjual, 'lifo');
    if (fifo === null) { T.show(box, '<div class="err">Jumlah yang terjual melebihi total stok yang dibeli.</div>'); return; }
    const totalBeli = hasil.pembelian.reduce((a, p) => a + p.qty * p.harga, 0);
    T.show(box,
      '<div class="big center">' + T.rp(fifo.hpp) + '</div>' +
      '<p class="center">harga pokok penjualan (FIFO)</p>' +
      kv('Total pembelian', T.rp(totalBeli)) +
      kv('Unit terjual', T.fmt(terjual) + ' dari ' + T.fmt(fifo.sisaUnit + terjual) + ' unit') +
      '<table class="tbl" style="margin-top:10px"><thead><tr><th>Metode</th><th style="text-align:right">HPP</th><th style="text-align:right">Stok akhir</th></tr></thead><tbody>' +
      '<tr><td>FIFO (yang duluan dibeli, duluan dijual)</td><td style="text-align:right">' + T.rp(fifo.hpp) + '</td><td style="text-align:right">' + T.rp(fifo.akhir) + '</td></tr>' +
      '<tr><td>LIFO (yang terakhir dibeli, duluan dijual)</td><td style="text-align:right">' + T.rp(lifo.hpp) + '</td><td style="text-align:right">' + T.rp(lifo.akhir) + '</td></tr>' +
      '</tbody></table>' +
      '<p class="hint">FIFO menjual stok lama dulu, jadi stok akhir dinilai dari harga beli terbaru. LIFO sebaliknya. Saat harga naik, HPP FIFO lebih kecil dan laba terlihat lebih besar. Di Indonesia, standar akuntansi (PSAK) tidak mengizinkan LIFO untuk laporan keuangan, tapi metode ini tetap berguna untuk perbandingan dan belajar.</p>');
  };

  root.appendChild(T.el('<p class="note">Bila harga belimu berubah-ubah, nilai stok dan laba tergantung metode mana yang dipakai. FIFO menganggap barang yang dibeli duluan dijual duluan. LIFO menganggap barang yang baru dibeli dijual duluan.</p>'));
  root.appendChild(T.field('Daftar pembelian', beliI, 'Satu baris per pembelian, urut dari yang paling dulu. Format: jumlah,harga. Contoh: 10,5000 artinya beli 10 unit seharga Rp5.000 per unit.'));
  root.appendChild(T.field('Unit yang terjual', jualI, 'Berapa unit yang sudah terjual dari stok ini.'));
  root.appendChild(T.row(T.btn('Hitung FIFO & LIFO', hitung, true)));
  root.appendChild(box);
}
