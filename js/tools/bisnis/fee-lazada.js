import { h as T, kv } from '../../core.js';

// Tarif Lazada, riset 14 Nov 2026. Komisi Marketplace 0–8,18% dan LazMall
// 2,5–11,7% (sudah termasuk PPN), berlaku 1 Feb 2026. Sumber Lazada Seller
// Center via kalkulatorharga.com (diverifikasi 18 Okt 2026). Contoh: Pakaian
// Wanita Marketplace 6,43%, LazMall 9,95%. Biaya proses pesanan Rp1.250 per
// pesanan (termasuk pajak, untuk seller bergabung > 90 hari). Free Shipping
// Max non-elektronik 1,5–6% maks Rp20.000/produk, elektronik 4% maks
// Rp10.000/produk (everpro.id, bisnison.com). PPh 22 0,5% opsional.
// SEMUA tarif bisa diubah user. Angka final selalu di seller center Lazada.
const KOMISI_DEFAULT = { marketplace: 6.43, lazmall: 9.95 };

export const meta = {"id": "fee-lazada", "name": "Fee Lazada", "cat": "bisnis", "icon": "🛍️", "desc": "Estimasi potongan Lazada per pesanan: komisi, biaya proses, Free Shipping Max, dan PPh 22.", "keywords": "fee lazada,komisi lazada,biaya lazada,seller lazada,lazmall,potongan lazada", "since": "6.11.0"};
export function render(root) {

    const hargaI = T.input('text', 'cth: 99000', '');
    hargaI.inputMode = 'decimal';
    const tipeI = T.select([
      ['marketplace', 'Marketplace (toko biasa)'],
      ['lazmall', 'LazMall (toko resmi brand)'],
    ], 'marketplace');
    const komisiI = T.input('text', 'cth: 6,43', '6,43');
    komisiI.inputMode = 'decimal';
    const capI = T.input('text', 'cth: 20000 (isi 0 bila tanpa batas)', '20000');
    capI.inputMode = 'decimal';
    const prosesI = T.input('text', 'cth: 1250 (isi 0 bila baru < 90 hari)', '1250');
    prosesI.inputMode = 'decimal';
    const fsmI = T.input('text', 'cth: 0 (isi bila ikut Free Shipping Max)', '0');
    fsmI.inputMode = 'decimal';
    const pphI = T.select([
      ['0', 'Tidak dipungut PPh 22'],
      ['0.5', 'Ya, PPh 22 0,5%'],
    ], '0');
    const lainI = T.input('text', 'cth: 0', '0');
    lainI.inputMode = 'decimal';
    const hppI = T.input('text', 'cth: 60000 (kosongkan bila tidak perlu)', '');
    hppI.inputMode = 'decimal';
    const box = T.out();

    const isiKomisi = () => {
      komisiI.value = String(KOMISI_DEFAULT[tipeI.value]).replace('.', ',');
    };
    tipeI.addEventListener('change', isiKomisi);

    const calc = () => {
      const harga = T.num(hargaI.value);
      const komisi = T.num(komisiI.value);
      const cap = T.num(capI.value);
      const proses = T.num(prosesI.value);
      const fsm = T.num(fsmI.value);
      const pph = Number(pphI.value);
      const lain = T.num(lainI.value);
      const hpp = T.num(hppI.value);
      if (!isFinite(harga) || harga <= 0 || !isFinite(komisi) || komisi < 0 || komisi >= 100 ||
          !isFinite(cap) || cap < 0 || !isFinite(proses) || proses < 0 ||
          !isFinite(fsm) || fsm < 0 || fsm >= 100 || !isFinite(lain) || lain < 0 ||
          (hppI.value.trim() !== '' && (!isFinite(hpp) || hpp < 0))) {
        T.toast('Isi semua kolom dengan angka yang benar ya (persen di bawah 100%).'); return;
      }
      const komisiRp = cap > 0 ? Math.min(harga * komisi / 100, cap) : harga * komisi / 100;
      const fsmRp = harga * fsm / 100;
      const pphRp = harga * pph / 100;
      const totalPotong = komisiRp + proses + fsmRp + pphRp + lain;
      const diterima = harga - totalPotong;
      const efektif = harga > 0 ? totalPotong / harga * 100 : 0;
      let labaRow = '';
      if (hppI.value.trim() !== '') {
        const laba = diterima - hpp;
        labaRow = kv('Laba bersih per pesanan', '<span style="color:' + (laba < 0 ? '#ef4444' : '#22c55e') + '">' + T.rp(laba) + '</span>');
      }
      T.show(box,
        '<div class="big center">' + T.rp(diterima) + '</div>' +
        '<p class="center">uang yang diterima per pesanan (dari harga ' + T.rp(harga) + ')</p>' +
        kv('Komisi ' + komisi + '%' + (cap > 0 && harga * komisi / 100 > cap ? ' (kena batas maks)' : ''), T.rp(komisiRp)) +
        kv('Biaya proses pesanan', T.rp(proses)) +
        (fsm > 0 ? kv('Free Shipping Max (' + fsm + '%)', T.rp(fsmRp)) : '') +
        (pph > 0 ? kv('PPh 22 (0,5%)', T.rp(pphRp)) : '') +
        (lain > 0 ? kv('Biaya lain', T.rp(lain)) : '') +
        kv('Total potongan (' + efektif.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%)', T.rp(totalPotong)) +
        labaRow +
        '<p class="warn">⚠️ Tarif Lazada beda per kategori dan bisa berubah. Angka awal di sini dari tarif yang berlaku 1 Feb 2026, riset 14 Nov 2026 (komisi Marketplace 0–8,18%, LazMall 2,5–11,7%, sudah termasuk PPN). Periksa lagi di seller center Lazada sebelum menetapkan harga.</p>' +
        '<p class="hint">Rumus: uang yang diterima = harga jual − komisi − biaya proses − Free Shipping Max − PPh 22 − biaya lain. Komisi dihitung dari harga jual dan dibatasi angka maks per produk bila diisi. Contoh dari angka di atas: komisi ' + T.rp(komisiRp) + ' + proses ' + T.rp(proses) + (fsm > 0 ? ' + Free Shipping Max ' + T.rp(fsmRp) : '') + (pph > 0 ? ' + PPh 22 ' + T.rp(pphRp) : '') + ' = total potongan ' + T.rp(totalPotong) + ', jadi diterima ' + T.rp(diterima) + '. Asumsi: komisi dihitung dari harga jual penuh, belum termasuk voucher, iklan, dan subsidi ongkir yang ditanggung penjual.</p>');
    };

    root.appendChild(T.el('<p class="note">Jualan di Lazada ada potongannya di tiap pesanan. Masukkan harga jual dan tarif yang berlaku di tokomu, nanti ketahuan berapa yang benar-benar diterima.</p>'));
    root.appendChild(T.field('Harga jual (Rp)', hargaI, 'Harga satu produk yang dibayar pembeli.'));
    root.appendChild(T.field('Tipe toko', tipeI, 'Memilih tipe toko mengisi komisi awal di bawah. Semua tetap bisa diubah.'));
    root.appendChild(T.grid2(
      T.field('Komisi (%)', komisiI, 'Acuan 2026: Marketplace 0–8,18%, LazMall 2,5–11,7%. Contoh Pakaian Wanita 6,43% / 9,95%.'),
      T.field('Batas maks komisi per produk (Rp)', capI, 'Komisi di atas angka ini tidak ditagih lagi. Isi 0 bila tidak ada batas.')
    ));
    root.appendChild(T.grid2(
      T.field('Biaya proses pesanan (Rp)', prosesI, 'Rp1.250 per pesanan untuk seller yang sudah bergabung lebih dari 90 hari. Isi 0 bila masih gratis.'),
      T.field('Free Shipping Max (%)', fsmI, 'Hanya bila ikut programnya. Acuan non-elektronik 1,5–6%, elektronik 4%. Isi 0 bila tidak ikut.')
    ));
    root.appendChild(T.grid2(
      T.field('PPh 22', pphI, '0,5% dari harga jual, bila tokomu dipungut.'),
      T.field('Biaya lain per pesanan (Rp)', lainI, 'Iklan, packing, atau retur per pesanan. Isi 0 bila tidak ada.')
    ));
    root.appendChild(T.field('Modal per unit / HPP (Rp, opsional)', hppI, 'Diisi bila mau tahu laba bersih per pesanan.'));
    root.appendChild(T.row(T.btn('Hitung Fee Lazada', calc, true)));
    root.appendChild(box);

}
