import { h as T, kv } from '../../core.js?v=6.11.5';

export const meta = {"id": "reorder-point", "name": "Titik Pesan Ulang Stok", "cat": "bisnis", "icon": "📋", "desc": "Ketahui di stok berapa harus pesan lagi, supaya barang tidak habis sebelum kiriman datang.", "keywords": "reorder point,rop,stok,pesan ulang,inventory,safety stock,lead time", "since": "6.11.0"};
export function render(root) {

    const jualI = T.input('text', 'cth: 10', '');
    jualI.inputMode = 'decimal';
    const kirimI = T.input('text', 'cth: 3', '');
    kirimI.inputMode = 'decimal';
    const amanI = T.input('text', 'cth: 2', '2');
    amanI.inputMode = 'decimal';
    const stokI = T.input('text', 'cth: 40 (kosongkan bila tidak perlu)', '');
    stokI.inputMode = 'decimal';
    const box = T.out();

    const calc = () => {
      const jual = T.num(jualI.value);
      const kirim = T.num(kirimI.value);
      const aman = T.num(amanI.value);
      const stok = T.num(stokI.value);
      if (!isFinite(jual) || jual <= 0 || !isFinite(kirim) || kirim < 0 ||
          !isFinite(aman) || aman < 0 ||
          (stokI.value.trim() !== '' && (!isFinite(stok) || stok < 0))) {
        T.toast('Isi semua kolom dengan angka yang benar ya.'); return;
      }
      const pakaiKirim = Math.ceil(jual * kirim);
      const stokAman = Math.ceil(jual * aman);
      const rop = pakaiKirim + stokAman;
      let statusRow = '';
      let statusTxt = 'pesan lagi begitu stok menyentuh angka ini';
      let warna = '#22c55e';
      if (stokI.value.trim() !== '') {
        const hariHabis = Math.floor(stok / jual);
        if (stok <= rop) {
          statusTxt = 'stok sudah di bawah titik pesan ulang, pesan sekarang';
          warna = '#ef4444';
        } else {
          statusTxt = 'stok masih di atas titik pesan ulang';
        }
        statusRow = kv('Stok sekarang', stok.toLocaleString('id-ID') + ' unit') +
          kv('Perkiraan stok habis dalam', hariHabis + ' hari');
      }
      T.show(box,
        '<div class="big center" style="color:' + warna + '">' + rop.toLocaleString('id-ID') + ' unit</div>' +
        '<p class="center">titik pesan ulang, ' + statusTxt + '</p>' +
        kv('Penjualan harian rata-rata', jual.toLocaleString('id-ID') + ' unit/hari') +
        kv('Pemakaian selama kiriman jalan (' + kirim + ' hari)', pakaiKirim.toLocaleString('id-ID') + ' unit') +
        kv('Stok pengaman (' + aman + ' hari)', stokAman.toLocaleString('id-ID') + ' unit') +
        statusRow +
        '<p class="hint">Rumus: titik pesan ulang = penjualan harian × waktu kirim + stok pengaman. Stok pengaman = penjualan harian × hari pengaman. Contoh dari angka di atas: ' + jual + ' unit/hari × ' + kirim + ' hari kirim = ' + pakaiKirim + ' unit, ditambah pengaman ' + jual + ' × ' + aman + ' hari = ' + stokAman + ' unit, jadi pesan lagi saat stok tinggal ' + rop + ' unit. Asumsi: penjualan harian relatif stabil dan waktu kirim supplier sesuai jadwal. Naikkan hari pengaman bila penjualan sering melonjak mendadak atau kiriman sering telat.</p>');
    };

    root.appendChild(T.el('<p class="note">Stok habis sebelum kiriman datang itu kehilangan penjualan. Hitung titik pesan ulangnya, jadi pesanan ke supplier selalu datang tepat waktu.</p>'));
    root.appendChild(T.field('Penjualan harian rata-rata (unit/hari)', jualI, 'Rata-rata unit terjual tiap hari. Hitung dari penjualan sebulan dibagi 30 bila belum tahu.'));
    root.appendChild(T.field('Waktu kirim supplier (hari)', kirimI, 'Berapa hari dari pesan sampai barang datang.'));
    root.appendChild(T.field('Hari pengaman', amanI, 'Cadangan untuk jaga-jaga bila penjualan melonjak atau kiriman telat.'));
    root.appendChild(T.field('Stok sekarang (unit, opsional)', stokI, 'Diisi bila mau tahu apakah sudah waktunya pesan.'));
    root.appendChild(T.row(T.btn('Hitung Titik Pesan Ulang', calc, true)));
    root.appendChild(box);

}
