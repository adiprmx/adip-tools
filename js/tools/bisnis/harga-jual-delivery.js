import { h as T, kv } from '../../core.js?v=6.12.0';

// Komisi aplikasi pesan antar, riset 14 Nov 2026 (nusantek.com, hitungcerdas.net,
// duid.tech, diverifikasi 18 Okt 2026). GoFood ±20% + Rp1.000 per pesanan,
// GrabFood 25–30% (30% paling sering untuk merchant reguler), ShopeeFood ±20%.
// PPN dikenakan atas nilai komisi, bukan atas harga makanan. Tarif tidak
// dipublikasi resmi dan beda per kontrak merchant. SEMUA bisa diubah user.
const PLATFORM = {
  gofood:     { label: 'GoFood', komisi: 20, tetap: 1000 },
  grabfood:   { label: 'GrabFood', komisi: 30, tetap: 0 },
  shopeefood: { label: 'ShopeeFood', komisi: 20, tetap: 0 },
  lain:       { label: 'Lainnya (isi sendiri)', komisi: 20, tetap: 0 },
};

export const meta = {"id": "harga-jual-delivery", "name": "Harga Jual Delivery", "cat": "bisnis", "icon": "🛵", "desc": "Tentukan harga jual di GoFood, GrabFood, dan ShopeeFood supaya untung tidak habis dipotong komisi.", "keywords": "harga jual delivery,gofood,grabfood,shopeefood,komisi,ojol,pesan antar,merchant", "since": "6.11.0"};
export function render(root) {

    const modalI = T.input('text', 'cth: 12000', '');
    modalI.inputMode = 'decimal';
    const untungI = T.input('text', 'cth: 8000', '');
    untungI.inputMode = 'decimal';
    const kemasanI = T.input('text', 'cth: 2000', '0');
    kemasanI.inputMode = 'decimal';
    const platI = T.select(Object.keys(PLATFORM).map((k) => [k, PLATFORM[k].label]), 'gofood');
    const komisiI = T.input('text', 'cth: 20', '20');
    komisiI.inputMode = 'decimal';
    const tetapI = T.input('text', 'cth: 1000', '1000');
    tetapI.inputMode = 'decimal';
    const ppnI = T.input('text', 'cth: 12 (isi 0 bila sudah termasuk)', '12');
    ppnI.inputMode = 'decimal';
    const layanI = T.input('text', 'cth: 0', '0');
    layanI.inputMode = 'decimal';
    const box = T.out();

    const isiPlatform = () => {
      const p = PLATFORM[platI.value];
      komisiI.value = String(p.komisi);
      tetapI.value = String(p.tetap);
    };
    platI.addEventListener('change', isiPlatform);

    const calc = () => {
      const modal = T.num(modalI.value);
      const untung = T.num(untungI.value);
      const kemasan = T.num(kemasanI.value);
      const komisi = T.num(komisiI.value);
      const tetap = T.num(tetapI.value);
      const ppn = T.num(ppnI.value);
      const layan = T.num(layanI.value);
      if (![modal, untung, kemasan, komisi, tetap, ppn, layan].every(isFinite) ||
          modal < 0 || untung < 0 || kemasan < 0 || komisi < 0 || komisi >= 100 ||
          tetap < 0 || ppn < 0 || ppn >= 100 || layan < 0 || layan >= 100) {
        T.toast('Isi semua kolom dengan angka yang benar ya (persen di bawah 100%).'); return;
      }
      const potonganPct = komisi * (1 + ppn / 100) + layan;
      if (potonganPct >= 100) { T.toast('Total potongan sudah 100% atau lebih, tidak ada harga yang bisa untung.'); return; }
      const pokok = modal + untung + kemasan + tetap;
      const harga = Math.ceil((pokok / (1 - potonganPct / 100)) / 100) * 100;
      const komisiRp = harga * komisi / 100;
      const ppnRp = komisiRp * ppn / 100;
      const layanRp = harga * layan / 100;
      const totalPotong = komisiRp + ppnRp + layanRp + tetap;
      const diterima = harga - totalPotong;
      const untungBersih = diterima - modal - kemasan;
      T.show(box,
        '<div class="big center">' + T.rp(harga) + '</div>' +
        '<p class="center">harga jual di ' + PLATFORM[platI.value].label + ' supaya tetap untung ' + T.rp(untung) + ' per porsi</p>' +
        kv('Komisi ' + komisi + '%', T.rp(komisiRp)) +
        kv('PPN atas komisi (' + ppn + '%)', T.rp(ppnRp)) +
        (layan > 0 ? kv('Biaya layanan/promo (' + layan + '%)', T.rp(layanRp)) : '') +
        kv('Biaya tetap per pesanan', T.rp(tetap)) +
        kv('Total potongan', T.rp(totalPotong)) +
        kv('Uang yang diterima', T.rp(diterima)) +
        kv('Untung bersih per porsi', T.rp(untungBersih)) +
        '<p class="warn">⚠️ Komisi tiap merchant bisa beda tergantung kontrak dan program yang diikuti. Angka di atas adalah acuan umum 2026, riset 14 Nov 2026 (GoFood ±20% + Rp1.000, GrabFood 25–30%, ShopeeFood ±20%). Periksa lagi di aplikasi seller sebelum pasang harga.</p>' +
        '<p class="hint">Rumus: harga jual = (modal + target untung + kemasan + biaya tetap) ÷ (1 − total potongan). PPN dihitung dari nilai komisi, bukan dari harga makanan, jadi komisi efektif = komisi × (1 + PPN). Contoh dari angka di atas: pokok ' + T.rp(pokok) + ' dibagi (1 − ' + potonganPct.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%) = ' + T.rp(harga) + ' (dibulatkan ke atas per Rp100). Asumsi: komisi dihitung dari harga jual di aplikasi, dan tidak ada promo tambahan yang ditanggung penjual di luar kolom biaya layanan.</p>');
    };

    root.appendChild(T.el('<p class="note">Jual di aplikasi pesan antar itu ada potongannya. Kalau harga disamakan dengan harga di tempat, untung bisa habis di komisi.</p>'));
    root.appendChild(T.grid2(
      T.field('Modal per porsi (Rp)', modalI, 'HPP satu porsi, tanpa kemasan.'),
      T.field('Target untung per porsi (Rp)', untungI, 'Mau untung bersih berapa per porsi.')
    ));
    root.appendChild(T.field('Biaya kemasan per porsi (Rp)', kemasanI, 'Box, cup, plastik, dan sejenisnya untuk dibawa kurir.'));
    root.appendChild(T.field('Platform', platI, 'Memilih platform mengisi komisi dan biaya tetap di bawah. Semua tetap bisa diubah.'));
    root.appendChild(T.grid2(
      T.field('Komisi platform (%)', komisiI, 'Acuan 2026: GoFood 20%, GrabFood 25–30%, ShopeeFood 20%.'),
      T.field('Biaya tetap per pesanan (Rp)', tetapI, 'GoFood sekitar Rp1.000 per pesanan, isi 0 bila tidak ada.')
    ));
    root.appendChild(T.grid2(
      T.field('PPN atas komisi (%)', ppnI, 'PPN dihitung dari komisi, bukan dari harga makanan. Isi 0 bila komisi sudah termasuk PPN.'),
      T.field('Biaya layanan/promo tambahan (%)', layanI, 'Promo patungan atau iklan di aplikasi, isi 0 bila tidak ikut.')
    ));
    root.appendChild(T.row(T.btn('Hitung Harga Jual', calc, true)));
    root.appendChild(box);

}
