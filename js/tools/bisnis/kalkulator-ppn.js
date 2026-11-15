import { h as T, kv } from '../../core.js?v=6.11.5';

export const meta = {"id": "kalkulator-ppn", "name": "Kalkulator PPN", "cat": "bisnis", "icon": "🧾", "desc": "Bedah harga jadi DPP + PPN, include maupun exclude.", "keywords": "ppn,pajak,dpp,11 persen,12 persen,include,exclude,faktur"};
export function render(root) {

    const modeSel = T.select([
      ['inc', 'Harga sudah termasuk PPN (include)'],
      ['exc', 'Harga belum termasuk PPN (exclude)']
    ], 'inc');
    const nominalI = T.input('text', 'Nominal, cth: 112000', '');
    // Tarif nominal PPN 12% sejak 1 Jan 2025, TAPI untuk barang/jasa biasa
    // PPN dihitung dari DPP nilai lain (11/12 × harga) — jadi yang dibayar
    // efektif 11% (PMK 131/2024, ditegaskan tetap berlaku 2026).
    // Tarif 12% penuh hanya untuk barang mewah.
    const tarifSel = T.select([
      ['11', 'Barang/jasa biasa — efektif 11%'],
      ['12', 'Barang mewah — 12%'],
    ], '11');
    const box = T.out();

    const calc = () => {
      const harga = T.num(nominalI.value);
      const tarif = Number(tarifSel.value) / 100;
      if (!isFinite(harga) || harga <= 0) { T.toast('Isi nominal yang valid dulu'); return; }
      let dpp, ppn, total;
      if (modeSel.value === 'inc') {
        dpp = harga / (1 + tarif);
        ppn = harga - dpp;
        total = harga;
      } else {
        dpp = harga;
        ppn = harga * tarif;
        total = harga + ppn;
      }
      T.show(box,
        kv('DPP (dasar pengenaan pajak)', T.rp(dpp)) +
        kv('PPN ' + tarifSel.value + '%', T.rp(ppn)) +
        kv('Total bayar', T.rp(total)) +
        '<p class="hint">' + (modeSel.value === 'inc'
          ? 'Harga yang kamu masukkan sudah termasuk PPN — ini bedahannya jadi DPP + PPN.'
          : 'PPN ditambahkan di atas harga — segini yang dibayar pembeli.') +
        ' Tarif PPN nominal 12% (sejak 1 Jan 2025), tapi barang/jasa biasa dihitung dari DPP nilai lain 11/12 × harga, jadi yang dibayar efektif 11% (PMK 131/2024). Tarif 12% penuh hanya untuk barang mewah.</p>');
    };
    modeSel.addEventListener('change', calc);
    tarifSel.addEventListener('change', calc);

    root.appendChild(T.el('<p class="note">Harga di nota itu sudah <b>termasuk PPN</b> atau <b>belum</b>? Pilih modenya, biar DPP & PPN-nya kebedah dengan bener.</p>'));
    root.appendChild(T.field('Mode perhitungan', modeSel));
    root.appendChild(T.field('Nominal (Rp)', nominalI));
    root.appendChild(T.field('Tarif PPN', tarifSel));
    root.appendChild(T.row(T.btn('Hitung', calc, true)));
    root.appendChild(box);

}
