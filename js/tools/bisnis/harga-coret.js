import { h as T, kv } from '../../core.js';

export const meta = {"id": "harga-coret", "name": "Harga Coret Promo", "cat": "bisnis", "icon": "🏷️", "desc": "Hitung harga setelah diskon dan cek laba per unitnya, supaya promo tidak bikin rugi.", "keywords": "harga coret,diskon,promo,sale,potongan harga,laba promo", "since": "6.11.0"};
export function render(root) {

    const normalI = T.input('text', 'cth: 100000', '');
    normalI.inputMode = 'decimal';
    const diskonI = T.input('text', 'cth: 20', '');
    diskonI.inputMode = 'decimal';
    const hppI = T.input('text', 'cth: 60000', '');
    hppI.inputMode = 'decimal';
    const box = T.out();

    const calc = () => {
      const normal = T.num(normalI.value);
      const diskon = T.num(diskonI.value);
      const hpp = T.num(hppI.value);
      if (!isFinite(normal) || normal <= 0 || !isFinite(diskon) || diskon < 0 || diskon >= 100 ||
          !isFinite(hpp) || hpp < 0) {
        T.toast('Isi semua kolom dengan angka yang benar ya (diskon di bawah 100%).'); return;
      }
      const potongan = normal * diskon / 100;
      const promo = normal - potongan;
      const laba = promo - hpp;
      const margin = promo > 0 ? laba / promo * 100 : 0;
      const rugi = laba < 0;
      const warna = rugi ? '#ef4444' : '#22c55e';
      const status = rugi
        ? 'rugi ' + T.rp(-laba) + ' per unit, diskon terlalu besar'
        : 'masih untung ' + T.rp(laba) + ' per unit';
      T.show(box,
        '<div class="big center"><s class="mut">' + T.rp(normal) + '</s> ' + T.rp(promo) + '</div>' +
        '<p class="center">harga coret ' + T.rp(normal) + ' jadi ' + T.rp(promo) + ' (diskon ' + diskon + '%)</p>' +
        kv('Potongan harga', T.rp(potongan)) +
        kv('Modal per unit (HPP)', T.rp(hpp)) +
        kv('Laba per unit setelah diskon', '<span style="color:' + warna + '">' + T.rp(laba) + '</span>') +
        kv('Margin setelah diskon', margin.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%') +
        (rugi ? '<p class="warn">⚠️ Harga promo di bawah modal, ' + status + '. Turunkan diskonnya atau naikkan harga normalnya.</p>'
              : '<p class="hint">Promo ini ' + status + '.</p>') +
        '<p class="hint">Rumus: harga promo = harga normal × (1 − diskon). Laba per unit = harga promo − HPP. Contoh dari angka di atas: ' + T.rp(normal) + ' × (1 − ' + diskon + '%) = ' + T.rp(promo) + ', dikurangi HPP ' + T.rp(hpp) + ' = laba ' + T.rp(laba) + ' per unit. Asumsi: HPP sudah termasuk semua biaya per unit, dan tidak ada biaya marketplace atau komisi tambahan.</p>');
    };

    root.appendChild(T.el('<p class="note">Diskon bikin pembeli senang, tapi jangan sampai harga promo jatuh di bawah modal. Cek dulu labanya sebelum pasang harga coret.</p>'));
    root.appendChild(T.field('Harga normal (Rp)', normalI, 'Harga sebelum diskon, yang nanti dicoret.'));
    root.appendChild(T.field('Diskon (%)', diskonI, 'Berapa persen potongannya.'));
    root.appendChild(T.field('Modal per unit / HPP (Rp)', hppI, 'Biaya pokok satu produk, termasuk kemasan bila ada.'));
    root.appendChild(T.row(T.btn('Hitung Harga Promo', calc, true)));
    root.appendChild(box);

}
