import { h as T, kv } from '../../core.js?v=6.11.5';

export const meta = {"id": "harga-bundling", "name": "Harga Bundling", "cat": "bisnis", "icon": "📦", "desc": "Gabung 2 sampai 3 produk jadi satu paket, hitung harga paket dan labanya dibanding jual satuan.", "keywords": "bundling,paket,harga paket,combo,promo paket,diskon paket", "since": "6.11.0"};
export function render(root) {

    const box = T.out();
    const items = [];
    for (let i = 0; i < 3; i++) {
      const namaI = T.input('text', 'cth: Produk ' + (i + 1), '');
      const hargaI = T.input('text', 'Harga satuan Rp', '');
      hargaI.inputMode = 'decimal';
      const hppI = T.input('text', 'Modal satuan Rp', '');
      hppI.inputMode = 'decimal';
      items.push({ namaI, hargaI, hppI });
    }
    const diskonI = T.input('text', 'cth: 10', '10');
    diskonI.inputMode = 'decimal';

    const calc = () => {
      const diskon = T.num(diskonI.value);
      if (!isFinite(diskon) || diskon < 0 || diskon >= 100) {
        T.toast('Isi diskon paket dengan angka yang benar ya (di bawah 100%).'); return;
      }
      const pakai = [];
      for (const it of items) {
        if (it.hargaI.value.trim() === '' && it.hppI.value.trim() === '') continue;
        const harga = T.num(it.hargaI.value);
        const hpp = T.num(it.hppI.value);
        if (!isFinite(harga) || harga <= 0 || !isFinite(hpp) || hpp < 0) {
          T.toast('Harga dan modal tiap produk harus angka yang benar ya.'); return;
        }
        pakai.push({ nama: it.namaI.value.trim() || 'Produk', harga, hpp });
      }
      if (pakai.length < 2) { T.toast('Isi minimal 2 produk untuk membuat paket.'); return; }
      const totalSatuan = pakai.reduce((a, p) => a + p.harga, 0);
      const totalHpp = pakai.reduce((a, p) => a + p.hpp, 0);
      const hargaPaket = Math.ceil((totalSatuan * (1 - diskon / 100)) / 100) * 100;
      const hemat = totalSatuan - hargaPaket;
      const labaPaket = hargaPaket - totalHpp;
      const labaSatuan = totalSatuan - totalHpp;
      const selisih = labaPaket - labaSatuan;
      const margin = hargaPaket > 0 ? labaPaket / hargaPaket * 100 : 0;
      const rugi = labaPaket < 0;
      const warna = rugi ? '#ef4444' : '#22c55e';
      let rows = '';
      pakai.forEach((p) => {
        rows += '<tr><td>' + T.esc(p.nama) + '</td><td>' + T.rp(p.harga) + '</td><td>' + T.rp(p.hpp) + '</td><td>' + T.rp(p.harga - p.hpp) + '</td></tr>';
      });
      T.show(box,
        '<div class="big center">' + T.rp(hargaPaket) + '</div>' +
        '<p class="center">harga paket ' + pakai.length + ' produk (diskon ' + diskon + '%, pembeli hemat ' + T.rp(hemat) + ')</p>' +
        '<div style="overflow-x:auto"><table class="tbl"><tr><th>Produk</th><th>Harga satuan</th><th>Modal</th><th>Laba satuan</th></tr>' + rows + '</table></div>' +
        kv('Total harga satuan', T.rp(totalSatuan)) +
        kv('Total modal paket', T.rp(totalHpp)) +
        kv('Laba paket', '<span style="color:' + warna + '">' + T.rp(labaPaket) + '</span>') +
        kv('Laba bila dijual satuan', T.rp(labaSatuan)) +
        kv('Selisih laba paket vs satuan', T.rp(selisih)) +
        kv('Margin paket', margin.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + '%') +
        (rugi ? '<p class="warn">⚠️ Harga paket di bawah total modal, paket ini rugi. Turunkan diskon paketnya.</p>' : '') +
        '<p class="hint">Rumus: harga paket = total harga satuan × (1 − diskon paket). Laba paket = harga paket − total modal. Contoh dari angka di atas: total satuan ' + T.rp(totalSatuan) + ' × (1 − ' + diskon + '%) = ' + T.rp(hargaPaket) + ' (dibulatkan ke atas per Rp100), dikurangi total modal ' + T.rp(totalHpp) + ' = laba ' + T.rp(labaPaket) + '. Bundling masuk akal bila paket bikin pembeli beli lebih banyak atau lebih sering, walau laba per paket lebih kecil dari jual satuan.</p>');
    };

    root.appendChild(T.el('<p class="note">Paket bundling bikin pembeli merasa hemat dan belanja lebih banyak. Isi 2 sampai 3 produk, lalu atur diskon paketnya.</p>'));
    items.forEach((it, i) => {
      root.appendChild(T.el('<div style="font-weight:600;margin:10px 0 8px">Produk ' + (i + 1) + (i === 2 ? ' (opsional)' : '') + '</div>'));
      root.appendChild(T.field('Nama produk', it.namaI));
      root.appendChild(T.grid2(
        T.field('Harga satuan (Rp)', it.hargaI),
        T.field('Modal satuan (Rp)', it.hppI)
      ));
    });
    root.appendChild(T.field('Diskon paket (%)', diskonI, 'Potongan dari total harga satuan.'));
    root.appendChild(T.row(T.btn('Hitung Harga Paket', calc, true)));
    root.appendChild(box);

}
