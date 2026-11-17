import { h as T, utils, kv } from '../../core.js';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

// Fee per kategori (% dari harga jual) — angka awal 2026, SEMUA bisa diubah user.
// Shopee 2,5–10% per kategori; Tokopedia & TikTok Shop komisi 3–8% (maks Rp60.000/item).
const FEE = {
  'fashion':    { label: 'Fashion / Pakaian', shopee: 10, tokopedia: 6, tiktok: 7 },
  'elektronik': { label: 'Elektronik', shopee: 9.5, tokopedia: 3, tiktok: 5 },
  'kecantikan': { label: 'Kecantikan / Perawatan', shopee: 8, tokopedia: 5, tiktok: 6 },
  'rumah':      { label: 'Rumah Tangga', shopee: 7, tokopedia: 5, tiktok: 6 },
  'makanan':    { label: 'Makanan / Minuman', shopee: 5, tokopedia: 4, tiktok: 5 },
  'ibuanak':    { label: 'Ibu & Anak', shopee: 6, tokopedia: 5, tiktok: 6 },
  'umum':       { label: 'Lainnya / Umum', shopee: 6, tokopedia: 5, tiktok: 6 },
};

export const meta = {"id": "harga-jual-marketplace", "name": "Harga Jual Marketplace", "cat": "bisnis", "icon": "🛒", "desc": "Dari modal + target untung, ketahuan harga jual minimal di Shopee, Tokopedia, dan TikTok Shop setelah dipotong fee.", "keywords": "harga jual,marketplace,shopee,tokopedia,tiktok shop,fee,admin,komisi,seller"};
export function render(root) {

    const modalI = T.input('text', 'cth: 50.000', '');
    const untungI = T.input('text', 'cth: 15.000', '');
    const katI = T.select(Object.keys(FEE).map((k) => [k, FEE[k].label]), 'umum');
    const feeShopeeI = T.input('text', 'cth: 6', '6');
    const feeTokpedI = T.input('text', 'cth: 5', '5');
    const feeTiktokI = T.input('text', 'cth: 6', '6');
    const tetapI = T.input('text', 'cth: 1.250', '1.250');
    const capI = T.input('text', 'cth: 60.000', '60.000');
    const affI = T.input('text', 'cth: 10 (isi 0 bila tidak pakai)', '0');
    const box = T.out();

    const isiFee = () => {
      const f = FEE[katI.value];
      feeShopeeI.value = String(f.shopee);
      feeTokpedI.value = String(f.tokopedia);
      feeTiktokI.value = String(f.tiktok);
    };
    katI.addEventListener('change', isiFee);

    const hargaJual = (modal, untung, tetap, feePct, affPct, cap) => {
      let h = (modal + untung + tetap) / (1 - (feePct + affPct) / 100);
      if (cap > 0 && h * feePct / 100 > cap) h = (modal + untung + tetap + cap) / (1 - affPct / 100);
      return Math.ceil(h / 100) * 100;
    };

    const calc = () => {
      const modal = parseRp(modalI.value);
      const untung = parseRp(untungI.value);
      const tetap = parseRp(tetapI.value);
      const cap = parseRp(capI.value);
      const aff = parseRp(affI.value);
      const fs = parseRp(feeShopeeI.value), ft = parseRp(feeTokpedI.value), fk = parseRp(feeTiktokI.value);
      const fees = [fs, ft, fk];
      if (!isFinite(modal) || modal < 0 || !isFinite(untung) || untung < 0 || !isFinite(tetap) || tetap < 0 ||
          !isFinite(cap) || cap < 0 || !isFinite(aff) || aff < 0 || aff >= 100 ||
          !fees.every((f) => isFinite(f) && f >= 0 && f < 100) || fs + aff >= 100 || ft + aff >= 100 || fk + aff >= 100) {
        T.toast('Isi semua kolom dengan angka yang benar ya (fee di bawah 100%).'); return;
      }
      const list = [
        { nama: 'Shopee', fee: fs, aff: 0, cap: 0 },
        { nama: 'Tokopedia', fee: ft, aff: 0, cap: cap },
        { nama: 'TikTok Shop', fee: fk, aff: aff, cap: cap },
      ].map((p) => {
        const harga = hargaJual(modal, untung, tetap, p.fee, p.aff, p.cap);
        const feeRp = p.cap > 0 ? Math.min(harga * p.fee / 100, p.cap) : harga * p.fee / 100;
        const affRp = harga * p.aff / 100;
        const diterima = harga - feeRp - affRp - tetap;
        return { ...p, harga, feeRp, affRp, diterima, untungBersih: diterima - modal };
      });
      const termurah = list.reduce((a, b) => (a.harga <= b.harga ? a : b));

      let rows = '';
      list.forEach((p) => {
        const mark = p === termurah ? ' ✅' : '';
        rows += '<tr><td><b>' + p.nama + mark + '</b></td><td>' + p.fee + '%' + (p.aff ? ' + aff ' + p.aff + '%' : '') + '</td><td><b>' + T.rp(p.harga) + '</b></td><td>' + T.rp(p.feeRp + p.affRp + tetap) + '</td><td>' + T.rp(p.diterima) + '</td><td>' + T.rp(p.untungBersih) + '</td></tr>';
      });

      T.show(box,
        '<div class="big center">' + T.rp(termurah.harga) + '</div>' +
        '<p class="center">harga jual paling rendah — di ' + termurah.nama + ' (kategori: ' + FEE[katI.value].label + ')</p>' +
        '<div style="overflow-x:auto"><table class="tbl"><tr><th>Marketplace</th><th>Fee</th><th>Harga jual</th><th>Total potongan</th><th>Diterima</th><th>Untung bersih</th></tr>' + rows + '</table></div>' +
        kv('Modal per produk', T.rp(modal)) +
        kv('Target untung', T.rp(untung)) +
        kv('Biaya tetap per pesanan', T.rp(tetap)) +
        '<p class="warn">⚠️ Fee marketplace berubah-ubah dan beda per kategori — cek Seller Center masing-masing sebelum pasang harga. Fee di atas adalah angka awal 2026 dan semuanya bisa diubah.</p>' +
        '<p class="hint">Rumus: harga jual = (modal + target untung + biaya tetap) ÷ (1 − fee%). Komisi Tokopedia/TikTok dibatasi maks ' + T.rp(cap) + '/item. Harga dibulatkan ke atas per Rp100.</p>');
    };

    root.appendChild(T.el('<p class="note">Jangan asal pasang harga — fee marketplace bisa makan untungmu. Isi modal dan target untung, nanti ketahuan harga jual minimalnya di tiap marketplace.</p>'));
    root.appendChild(T.grid2(
      T.field('Modal per produk (Rp)', modalI, 'Harga beli + ongkir masuk + packaging.'),
      T.field('Target untung per produk (Rp)', untungI, 'Mau untung bersih berapa per pcs.')
    ));
    root.appendChild(T.field('Kategori produk', katI, 'Fee beda per kategori — memilih kategori mengisi fee awal di bawah.'));
    root.appendChild(T.grid2(
      T.field('Fee Shopee (%)', feeShopeeI),
      T.field('Fee Tokopedia (%)', feeTokpedI),
      T.field('Fee TikTok Shop (%)', feeTiktokI)
    ));
    root.appendChild(T.grid2(
      T.field('Biaya tetap per pesanan (Rp)', tetapI, 'Biaya proses/layanan per pesanan.'),
      T.field('Batas maks komisi Tokopedia/TikTok (Rp)', capI, 'Komisi di atas angka ini tidak ditagih lagi.'),
      T.field('Komisi affiliate TikTok (%)', affI, 'Isi 0 bila tidak pakai affiliate (biasanya 5–20%).')
    ));
    root.appendChild(T.row(T.btn('Hitung Harga Jual', calc, true)));
    root.appendChild(box);

}
