import { h as T, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "komisi-reseller", "name": "Komisi Reseller", "cat": "bisnis", "icon": "🤝", "desc": "Hitung komisi per penjualan dan rekap bulanan untuk reseller atau afiliator.", "keywords": "komisi reseller,afiliasi,affiliate,reseller,dropship,komisi penjualan", "since": "6.11.0"};
export function render(root) {

    const hargaI = T.input('text', 'cth: 100000', '');
    hargaI.inputMode = 'decimal';
    const komisiI = T.input('text', 'cth: 10', '10');
    komisiI.inputMode = 'decimal';
    const unitI = T.input('text', 'cth: 50', '');
    unitI.inputMode = 'decimal';
    const resellerI = T.input('text', 'cth: 5', '1');
    resellerI.inputMode = 'decimal';
    const hppI = T.input('text', 'cth: 60000 (kosongkan bila tidak perlu)', '');
    hppI.inputMode = 'decimal';
    const box = T.out();

    const calc = () => {
      const harga = T.num(hargaI.value);
      const komisi = T.num(komisiI.value);
      const unit = T.num(unitI.value);
      const reseller = T.num(resellerI.value);
      const hpp = T.num(hppI.value);
      if (!isFinite(harga) || harga <= 0 || !isFinite(komisi) || komisi < 0 || komisi >= 100 ||
          !isFinite(unit) || unit < 0 || !isFinite(reseller) || reseller <= 0 ||
          (hppI.value.trim() !== '' && (!isFinite(hpp) || hpp < 0))) {
        T.toast('Isi semua kolom dengan angka yang benar ya (komisi di bawah 100%).'); return;
      }
      const komisiUnit = harga * komisi / 100;
      const sisaOwner = harga - komisiUnit;
      const komisiBulan = komisiUnit * unit;
      const omzetBulan = harga * unit;
      const perReseller = reseller > 0 ? komisiBulan / reseller : 0;
      const unitPerReseller = reseller > 0 ? unit / reseller : 0;
      let labaRow = '';
      if (hppI.value.trim() !== '') {
        const labaOwnerUnit = harga - hpp - komisiUnit;
        const labaOwnerBulan = labaOwnerUnit * unit;
        labaRow = kv('Laba owner per unit (setelah HPP + komisi)', '<span style="color:' + (labaOwnerUnit < 0 ? '#ef4444' : '#22c55e') + '">' + T.rp(labaOwnerUnit) + '</span>') +
          kv('Laba owner per bulan', T.rp(labaOwnerBulan));
      }
      T.show(box,
        '<div class="big center">' + T.rp(komisiUnit) + ' <span class="mut" style="font-size:15px">/ penjualan</span></div>' +
        '<p class="center">komisi yang diterima reseller tiap berhasil jual satu produk</p>' +
        kv('Harga jual per unit', T.rp(harga)) +
        kv('Komisi (' + komisi + '%)', T.rp(komisiUnit)) +
        kv('Sisa untuk owner per unit', T.rp(sisaOwner)) +
        kv('Omzet sebulan (' + unit + ' unit)', T.rp(omzetBulan)) +
        kv('Total komisi sebulan', T.rp(komisiBulan)) +
        kv('Rata-rata komisi per reseller (' + reseller + ' reseller)', T.rp(perReseller)) +
        kv('Rata-rata penjualan per reseller', unitPerReseller.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' unit/bulan') +
        labaRow +
        '<p class="hint">Rumus: komisi per penjualan = harga jual × persen komisi. Total komisi sebulan = komisi per penjualan × jumlah unit terjual. Contoh dari angka di atas: ' + T.rp(harga) + ' × ' + komisi + '% = ' + T.rp(komisiUnit) + ' per penjualan, dikali ' + unit + ' unit = ' + T.rp(komisiBulan) + ' sebulan. Asumsi: komisi dihitung dari harga jual penuh, bukan dari laba, dan semua reseller menjual jumlah yang sama untuk angka rata-rata.</p>');
    };

    root.appendChild(T.el('<p class="note">Reseller dibayar dari tiap penjualan. Tentukan persen komisinya, lalu lihat berapa yang keluar tiap bulan dan berapa yang tersisa untuk owner.</p>'));
    root.appendChild(T.grid2(
      T.field('Harga jual per unit (Rp)', hargaI),
      T.field('Komisi reseller (%)', komisiI, 'Persen dari harga jual untuk tiap penjualan.')
    ));
    root.appendChild(T.grid2(
      T.field('Penjualan sebulan (unit)', unitI, 'Total unit terjual lewat semua reseller dalam sebulan.'),
      T.field('Jumlah reseller', resellerI, 'Untuk menghitung rata-rata komisi per reseller.')
    ));
    root.appendChild(T.field('Modal per unit / HPP (Rp, opsional)', hppI, 'Diisi bila mau tahu laba owner setelah HPP dan komisi.'));
    root.appendChild(T.row(T.btn('Hitung Komisi', calc, true)));
    root.appendChild(box);

}
