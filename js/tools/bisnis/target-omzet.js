import { h as T, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "target-omzet", "name": "Target Omzet", "cat": "bisnis", "icon": "🎯", "desc": "Dari target laba dan biaya tetap, ketahuan omzet dan jumlah unit yang harus terjual tiap hari.", "keywords": "target omzet,target laba,omzet,biaya tetap,unit terjual,rencana penjualan", "since": "6.11.0"};
export function render(root) {

    const labaI = T.input('text', 'cth: 5000000', '');
    labaI.inputMode = 'decimal';
    const tetapI = T.input('text', 'cth: 3000000', '');
    tetapI.inputMode = 'decimal';
    const marginI = T.input('text', 'cth: 40', '40');
    marginI.inputMode = 'decimal';
    const hargaI = T.input('text', 'cth: 50000', '');
    hargaI.inputMode = 'decimal';
    const hariI = T.input('text', 'cth: 30', '30');
    hariI.inputMode = 'decimal';
    const box = T.out();

    const calc = () => {
      const laba = T.num(labaI.value);
      const tetap = T.num(tetapI.value);
      const margin = T.num(marginI.value);
      const harga = T.num(hargaI.value);
      const hari = T.num(hariI.value);
      if (!isFinite(laba) || laba < 0 || !isFinite(tetap) || tetap < 0 ||
          !isFinite(margin) || margin <= 0 || margin >= 100 ||
          !isFinite(harga) || harga <= 0 || !isFinite(hari) || hari <= 0 || hari > 31) {
        T.toast('Isi semua kolom dengan angka yang benar ya (margin 0 sampai 100%, hari 1 sampai 31).'); return;
      }
      const omzetBulan = (laba + tetap) / (margin / 100);
      const omzetHari = omzetBulan / hari;
      const unitBulan = Math.ceil(omzetBulan / harga);
      const unitHari = Math.ceil(omzetHari / harga);
      const omzetImpas = tetap / (margin / 100);
      T.show(box,
        '<div class="big center">' + T.rp(omzetBulan) + ' <span class="mut" style="font-size:15px">/ bulan</span></div>' +
        '<p class="center">omzet yang harus dicapai supaya laba ' + T.rp(laba) + ' sebulan</p>' +
        kv('Omzet per hari', T.rp(omzetHari)) +
        kv('Unit yang harus terjual per bulan', unitBulan.toLocaleString('id-ID') + ' unit') +
        kv('Unit yang harus terjual per hari', unitHari.toLocaleString('id-ID') + ' unit') +
        kv('Omzet impas (cuma nutup biaya tetap)', T.rp(omzetImpas)) +
        kv('Biaya tetap sebulan', T.rp(tetap)) +
        kv('Target laba sebulan', T.rp(laba)) +
        '<p class="hint">Rumus: omzet target = (target laba + biaya tetap) ÷ margin kotor. Omzet per hari = omzet sebulan ÷ hari jualan. Unit = omzet ÷ harga rata-rata. Contoh dari angka di atas: (' + T.rp(laba) + ' + ' + T.rp(tetap) + ') ÷ ' + margin + '% = ' + T.rp(omzetBulan) + ' sebulan, atau ' + T.rp(omzetHari) + ' per hari selama ' + hari + ' hari. Asumsi: margin kotor sama di semua produk, dan biaya tetap tidak berubah walau penjualan naik.</p>');
    };

    root.appendChild(T.el('<p class="note">Punya target laba tapi tidak tahu harus jualan seberapa banyak? Masukkan target dan biaya tetapmu, nanti ketahuan omzet dan unit yang harus dikejar tiap hari.</p>'));
    root.appendChild(T.grid2(
      T.field('Target laba sebulan (Rp)', labaI, 'Untung bersih yang mau dicapai dalam sebulan.'),
      T.field('Biaya tetap sebulan (Rp)', tetapI, 'Sewa, gaji, listrik, internet, dan biaya lain yang tetap keluar tiap bulan.')
    ));
    root.appendChild(T.grid2(
      T.field('Margin kotor (%)', marginI, 'Persen untung kotor dari harga jual, setelah HPP.'),
      T.field('Harga rata-rata per unit (Rp)', hargaI, 'Harga jual rata-rata satu produk atau satu pesanan.')
    ));
    root.appendChild(T.field('Hari jualan sebulan', hariI, 'Berapa hari tokomu buka dalam sebulan.'));
    root.appendChild(T.row(T.btn('Hitung Target Omzet', calc, true)));
    root.appendChild(box);

}
