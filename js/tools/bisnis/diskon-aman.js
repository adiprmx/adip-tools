import { h as T, kv } from '../../core.js?v=6.12.2';

export const meta = {"id": "diskon-aman", "name": "Diskon Aman", "cat": "bisnis", "icon": "✂️", "desc": "Cari tahu diskon maksimal sebelum rugi, plus tabel laba di tiap level diskon.", "keywords": "diskon aman,diskon maksimal,batas diskon,rugi,promo aman,margin", "since": "6.11.0"};
export function render(root) {

    const hargaI = T.input('text', 'cth: 100000', '');
    hargaI.inputMode = 'decimal';
    const hppI = T.input('text', 'cth: 60000', '');
    hppI.inputMode = 'decimal';
    const biayaI = T.input('text', 'cth: 5000 (isi 0 bila tidak ada)', '0');
    biayaI.inputMode = 'decimal';
    const labaMinI = T.input('text', 'cth: 0 (impas) atau 10000', '0');
    labaMinI.inputMode = 'decimal';
    const box = T.out();

    const fmtPct = (n) => n.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%';

    const calc = () => {
      const harga = T.num(hargaI.value);
      const hpp = T.num(hppI.value);
      const biaya = T.num(biayaI.value);
      const labaMin = T.num(labaMinI.value);
      if (!isFinite(harga) || harga <= 0 || !isFinite(hpp) || hpp < 0 ||
          !isFinite(biaya) || biaya < 0 || !isFinite(labaMin) || labaMin < 0) {
        T.toast('Isi semua kolom dengan angka yang benar ya.'); return;
      }
      const lantai = hpp + biaya + labaMin;
      const maksPct = (harga - lantai) / harga * 100;
      const sudahRugi = maksPct < 0;
      const warna = sudahRugi ? '#ef4444' : '#22c55e';
      const status = sudahRugi
        ? 'harga jual sudah di bawah modal, tidak ada diskon yang aman'
        : 'di atas angka ini, tiap penjualan mulai rugi';
      let rows = '';
      [5, 10, 15, 20, 25, 30, 40, 50].forEach((d) => {
        const hDiskon = harga * (1 - d / 100);
        const laba = hDiskon - hpp - biaya;
        const ok = laba >= labaMin;
        rows += '<tr><td>' + d + '%</td><td>' + T.rp(hDiskon) + '</td><td style="color:' + (ok ? '#22c55e' : '#ef4444') + '">' + T.rp(laba) + '</td><td>' + (ok ? 'aman' : 'rugi') + '</td></tr>';
      });
      T.show(box,
        '<div class="big center" style="color:' + warna + '">' + (sudahRugi ? '0%' : fmtPct(maksPct)) + '</div>' +
        '<p class="center">diskon maksimal yang masih aman, ' + status + '</p>' +
        kv('Harga jual normal', T.rp(harga)) +
        kv('Modal + biaya per unit', T.rp(hpp + biaya)) +
        kv('Laba minimum yang ditargetkan', T.rp(labaMin)) +
        kv('Harga terendah yang masih aman', T.rp(lantai)) +
        '<div style="overflow-x:auto"><table class="tbl"><tr><th>Diskon</th><th>Harga setelah diskon</th><th>Laba per unit</th><th>Status</th></tr>' + rows + '</table></div>' +
        '<p class="hint">Rumus: diskon maksimal = (harga jual − modal − biaya − laba minimum) ÷ harga jual. Harga terendah yang masih aman = modal + biaya + laba minimum. Contoh dari angka di atas: (' + T.rp(harga) + ' − ' + T.rp(hpp + biaya) + ' − ' + T.rp(labaMin) + ') ÷ ' + T.rp(harga) + ' = ' + fmtPct(maksPct) + '. Tabel di atas memakai laba minimum ' + T.rp(labaMin) + ' sebagai batas aman. Asumsi: biaya per unit tetap sama di semua level diskon.</p>');
    };

    root.appendChild(T.el('<p class="note">Sebelum ikut promo atau kasih diskon besar, cek dulu batas amannya. Diskon yang melewati batas bikin tiap penjualan justru rugi.</p>'));
    root.appendChild(T.field('Harga jual normal (Rp)', hargaI, 'Harga sebelum diskon.'));
    root.appendChild(T.field('Modal per unit / HPP (Rp)', hppI, 'Biaya pokok satu produk.'));
    root.appendChild(T.field('Biaya lain per unit (Rp)', biayaI, 'Kemasan, ongkir yang ditanggung penjual, atau fee. Isi 0 bila tidak ada.'));
    root.appendChild(T.field('Laba minimum per unit (Rp)', labaMinI, 'Untung paling kecil yang masih diterima. Isi 0 bila yang penting tidak rugi.'));
    root.appendChild(T.row(T.btn('Hitung Diskon Aman', calc, true)));
    root.appendChild(box);

}
