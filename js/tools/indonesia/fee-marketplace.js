import { h as T, utils } from '../../core.js';
// SUMBER TUNGGAL tabel fee: FEE dan BIAYA_PROSES_PER_PESANAN tinggal di
// harga-jual-marketplace.js (kategori bisnis) dan diimpor ke sini — tidak
// ada lagi dua salinan tabel yang bisa melenceng satu sama lain.
// Angka awal dicek 20 Nov 2026 (riset web F3, dicek ulang tim U1 hari yang
// sama; tarif per subkategori hanya terlihat di Seller Center masing-masing,
// jadi SEMUA bisa diubah user):
// - Shopee: biaya admin 2,5–10% per kategori (Non-Star/Star/Star+; naik
//   1 Jan 2026) + biaya proses Rp1.250/pesanan.
// - Tokopedia & TikTok Shop (satu sistem pasca-integrasi): komisi platform
//   2,5–10% (non-Mall; Mall sampai 12,2%) DITAMBAH komisi dinamis 3–8% per
//   kategori, komisi dinamis dibatasi maks Rp60.000/item sejak 16 Sep 2026,
//   + biaya proses Rp1.250/pesanan + biaya layanan logistik Rp540–5.060
//   (sejak 1 Mei 2026).
// Kolom Tokopedia/TikTok di tabel adalah perkiraan gabungan satu angka
// (bukan rincian platform + dinamis) — isi dengan total yang tertera di
// Seller Centermu bila beda. Jangan jadikan patokan mati: fee berubah berkala.
// - Blibli TIDAK masuk tabel: komisinya 2–8% per kategori (terverifikasi
//   dari kisarannya saja; rincian per kategori tidak dipublikasi), jadi
//   kolom Blibli di bawah ini sengaja kosong dan wajib diisi sendiri.
//   Bukalapak tidak ditambahkan: tarifnya tidak cukup terverifikasi.
//   Lazada punya tool sendiri (fee-lazada) karena strukturnya berbeda.
import { FEE, BIAYA_PROSES_PER_PESANAN } from '../bisnis/harga-jual-marketplace.js';
export { FEE, BIAYA_PROSES_PER_PESANAN };
utils.feeMarketplaceKategori = FEE;

// Logika murni (bisa di-test di Node): fee rupiah = harga x fee% + biaya tetap.
export function hitungFeeMarketplace(harga, feePct, tetap) {
  const h = Number(harga), f = Number(feePct), t = Number(tetap);
  if (![h, f, t].every(Number.isFinite) || h < 0 || f < 0 || f > 100 || t < 0) return null;
  const feeRp = Math.round(h * f / 100) + Math.round(t);
  return { feeRp, bersih: Math.max(0, h - feeRp) };
}
utils.hitungFeeMarketplace = hitungFeeMarketplace;

export const meta = {"id": "fee-marketplace", "name": "Fee Admin Marketplace", "cat": "indonesia", "icon": "🛒", "desc": "Bandingin fee admin Shopee, Tokopedia, TikTok Shop & Blibli.", "keywords": "fee,admin,marketplace,shopee,tokopedia,tiktok,blibli,komisi,seller"};
export function render(root) {
  const MP = [
    { name: 'Shopee', kunci: 'shopee' },
    { name: 'Tokopedia', kunci: 'tokopedia' },
    { name: 'TikTok Shop', kunci: 'tiktok' },
    // Blibli: tanpa fee awal (tarif per kategori tidak terverifikasi —
    // user isi sendiri; lihat komentar di atas).
    { name: 'Blibli', kunci: null },
  ];
  const harga = T.input('text', 'Contoh: 100000');
  harga.inputMode = 'decimal';
  const katSel = T.select(Object.keys(FEE).map((k) => [k, FEE[k].label]), 'umum');
  const box = T.out();

  const isiFee = () => {
    const f = FEE[katSel.value];
    MP.forEach((m) => { if (m.kunci) m.feeInp.value = String(f[m.kunci]); });
    hitung();
  };
  katSel.addEventListener('change', isiFee);

  const hitung = () => {
    const h = T.num(harga.value) || 0;
    if (h <= 0) { T.show(box, '<p class="hint">Isi harga jualnya dulu ya.</p>'); return; }
    const rows = MP.map((m) => {
      const feeMentah = T.num(m.feeInp.value);
      const kosong = !isFinite(feeMentah);
      const f = kosong ? null : Math.min(100, Math.max(0, feeMentah));
      const fix = Math.max(0, T.num(m.fixInp.value) || 0);
      const r = kosong ? null : hitungFeeMarketplace(h, f, fix);
      return { m, f, fix, feeRp: r ? r.feeRp : null, bersih: r ? r.bersih : null, kosong };
    });
    const terisi = rows.filter((r) => !r.kosong);
    const maxBersih = terisi.length ? Math.max(...terisi.map((r) => r.bersih)) : null;
    let html = '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">' +
      '<tr><td></td><td class="mut" style="padding:7px 8px">Fee</td><td class="mut" style="padding:7px 8px">Bersih diterima</td></tr>';
    rows.forEach((r) => {
      const juara = !r.kosong && r.bersih === maxBersih ? ' <b>← paling cuan</b>' : '';
      html += '<tr>' +
        '<td style="padding:7px 8px;border-bottom:1px solid #251f18;vertical-align:top">' + T.esc(r.m.name) + juara + '</td>' +
        (r.kosong
          ? '<td colspan="2" style="padding:7px 8px;border-bottom:1px solid #251f18;vertical-align:top"><span class="mut">Isi fee-nya dulu (komisi Blibli 2–8% per kategori — cek Seller Center).</span></td>'
          : '<td style="padding:7px 8px;border-bottom:1px solid #251f18;font-family:monospace;vertical-align:top">' + T.rp(r.feeRp) + '<br><span class="mut" style="font-size:11px">' + T.esc(String(r.f)) + '% + ' + T.rp(r.fix) + '</span></td>' +
            '<td style="padding:7px 8px;border-bottom:1px solid #251f18;font-family:monospace;vertical-align:top"><b>' + T.rp(r.bersih) + '</b></td>') +
        '</tr>';
    });
    html += '</table>';
    html += '<p class="hint">Fee % dan biaya tetap bisa kamu ubah sesuai akun sellermu — tiap toko bisa beda. Fee awal per kategori dicek 20 Nov 2026, dan tabelnya sama dengan tool Harga Jual Marketplace (satu sumber, tidak ada dua versi). Tokopedia/TikTok Shop menagih dua lapis (komisi platform + komisi dinamis maks Rp60.000/item), jadi kolom fee di sini isi dengan total keduanya. Blibli sengaja tanpa fee awal karena rincian per kategorinya tidak dipublikasi — isi sendiri sesuai tokomu. Lazada punya hitungan sendiri di tool Fee Lazada. Ini estimasi aja, angka resminya cek di seller center masing-masing ya.</p>';
    T.show(box, html);
  };

  MP.forEach((m) => {
    const awal = m.kunci ? String(FEE['umum'][m.kunci]) : '';
    m.feeInp = T.input('number', m.kunci ? '% fee' : 'cth: 5', awal);
    m.feeInp.min = '0';
    m.feeInp.max = '100';
    m.fixInp = T.input('text', m.kunci ? 'Rp 1.250' : 'Rp 0', m.kunci ? String(BIAYA_PROSES_PER_PESANAN) : '0');
    m.fixInp.inputMode = 'decimal';
    const card = T.el('<div></div>');
    card.appendChild(T.el('<div style="font-weight:600;margin-bottom:6px">' + T.esc(m.name) + '</div>'));
    card.appendChild(T.field(m.kunci ? 'Fee (%)' : 'Fee (%) — isi sendiri', m.feeInp));
    card.appendChild(T.field('Biaya tetap (Rp)', m.fixInp));
    m.card = card;
    m.feeInp.addEventListener('input', hitung);
    m.fixInp.addEventListener('input', hitung);
  });

  root.appendChild(T.field('Harga jual (Rp)', harga));
  root.appendChild(T.field('Kategori produk', katSel, 'Memilih kategori mengisi fee awal di bawah — fee tiap kategori beda.'));
  const cols = T.el('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px"></div>');
  MP.forEach((m) => cols.appendChild(m.card));
  root.appendChild(cols);
  root.appendChild(box);
  harga.addEventListener('input', hitung);
  hitung();
}
