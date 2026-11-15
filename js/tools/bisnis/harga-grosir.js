import { h as T, kv } from '../../core.js?v=6.11.5';

export const meta = {"id": "harga-grosir", "name": "Harga Grosir Bertingkat", "cat": "bisnis", "icon": "🏪", "desc": "Susun harga grosir per jumlah pembelian, dan cek laba tiap tingkatannya.", "keywords": "harga grosir,grosir,bertingkat,tier,partai,diskon jumlah,reseller grosir", "since": "6.11.0"};
export function render(root) {

    const hppI = T.input('text', 'cth: 40000', '');
    hppI.inputMode = 'decimal';
    const ecerI = T.input('text', 'cth: 60000', '');
    ecerI.inputMode = 'decimal';
    const box = T.out();
    const tiers = [];
    const defTier = [
      { qty: '10', diskon: '5' },
      { qty: '50', diskon: '10' },
      { qty: '100', diskon: '15' },
    ];
    defTier.forEach((d) => {
      const qtyI = T.input('text', 'Min. jumlah', d.qty);
      qtyI.inputMode = 'decimal';
      const diskonI = T.input('text', 'Diskon %', d.diskon);
      diskonI.inputMode = 'decimal';
      tiers.push({ qtyI, diskonI });
    });

    const calc = () => {
      const hpp = T.num(hppI.value);
      const ecer = T.num(ecerI.value);
      if (!isFinite(hpp) || hpp < 0 || !isFinite(ecer) || ecer <= 0) {
        T.toast('Isi modal dan harga ecer dengan angka yang benar ya.'); return;
      }
      const data = [];
      for (const t of tiers) {
        if (t.qtyI.value.trim() === '' && t.diskonI.value.trim() === '') continue;
        const qty = T.num(t.qtyI.value);
        const diskon = T.num(t.diskonI.value);
        if (!isFinite(qty) || qty <= 0 || !isFinite(diskon) || diskon < 0 || diskon >= 100) {
          T.toast('Tiap tingkatan butuh jumlah minimum dan diskon yang benar ya.'); return;
        }
        data.push({ qty: Math.floor(qty), diskon });
      }
      if (data.length === 0) { T.toast('Isi minimal satu tingkatan grosir.'); return; }
      data.sort((a, b) => a.qty - b.qty);
      let rows = '';
      let adaRugi = false;
      data.forEach((t) => {
        const hargaUnit = Math.ceil((ecer * (1 - t.diskon / 100)) / 100) * 100;
        const labaUnit = hargaUnit - hpp;
        const margin = hargaUnit > 0 ? labaUnit / hargaUnit * 100 : 0;
        if (labaUnit < 0) adaRugi = true;
        rows += '<tr><td>≥ ' + t.qty.toLocaleString('id-ID') + ' pcs</td><td>' + t.diskon + '%</td><td><b>' + T.rp(hargaUnit) + '</b></td><td style="color:' + (labaUnit < 0 ? '#ef4444' : '#22c55e') + '">' + T.rp(labaUnit) + '</td><td>' + margin.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%</td><td>' + T.rp(labaUnit * t.qty) + '</td></tr>';
      });
      const termurah = data[data.length - 1];
      const hargaTermurah = Math.ceil((ecer * (1 - termurah.diskon / 100)) / 100) * 100;
      T.show(box,
        '<div class="big center">' + T.rp(hargaTermurah) + ' <span class="mut" style="font-size:15px">/ pcs</span></div>' +
        '<p class="center">harga per pcs di tingkatan terbanyak (≥ ' + termurah.qty.toLocaleString('id-ID') + ' pcs)</p>' +
        '<div style="overflow-x:auto"><table class="tbl"><tr><th>Jumlah</th><th>Diskon</th><th>Harga / pcs</th><th>Laba / pcs</th><th>Margin</th><th>Laba total di jumlah min.</th></tr>' + rows + '</table></div>' +
        kv('Harga ecer', T.rp(ecer)) +
        kv('Modal per pcs (HPP)', T.rp(hpp)) +
        kv('Laba per pcs di harga ecer', T.rp(ecer - hpp)) +
        (adaRugi ? '<p class="warn">⚠️ Ada tingkatan yang harganya di bawah modal (laba merah). Turunkan diskon tingkatan itu.</p>' : '') +
        '<p class="hint">Rumus: harga grosir per pcs = harga ecer × (1 − diskon tingkatan). Laba per pcs = harga grosir − HPP. Contoh dari tingkatan pertama: ' + T.rp(ecer) + ' × (1 − ' + data[0].diskon + '%) = ' + T.rp(Math.ceil((ecer * (1 - data[0].diskon / 100)) / 100) * 100) + ' per pcs. Harga dibulatkan ke atas per Rp100. Asumsi: HPP per pcs sama di semua jumlah pembelian.</p>');
    };

    root.appendChild(T.el('<p class="note">Makin banyak beli, makin murah per pcs. Tapi diskon grosir tetap harus di atas modal, kalau tidak makin laku makin rugi.</p>'));
    root.appendChild(T.grid2(
      T.field('Modal per pcs / HPP (Rp)', hppI),
      T.field('Harga ecer (Rp)', ecerI, 'Harga satuan biasa, jadi patokan diskon.')
    ));
    tiers.forEach((t, i) => {
      root.appendChild(T.el('<div style="font-weight:600;margin:10px 0 8px">Tingkatan ' + (i + 1) + '</div>'));
      root.appendChild(T.grid2(
        T.field('Jumlah minimum (pcs)', t.qtyI, 'Beli segini baru dapat harga tingkatan ini.'),
        T.field('Diskon (%)', t.diskonI, 'Potongan dari harga ecer.')
      ));
    });
    root.appendChild(T.row(T.btn('Hitung Harga Grosir', calc, true)));
    root.appendChild(box);

}
