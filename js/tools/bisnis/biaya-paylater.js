import { h as T, utils, kv } from '../../core.js?v=6.12.1';

const parseRp = (s) => { s = String(s||'').trim().replace(/\s/g,''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };

export const meta = {"id": "biaya-paylater", "name": "Hitung Biaya PayLater", "cat": "bisnis", "icon": "💳", "desc": "Lihat total yang benar-benar dibayar kalau belanja pakai PayLater — pokok, bunga, biaya, dan denda kalau telat.", "keywords": "paylater,cicilan,bunga,biaya,spaylater,denda,total bayar"};
export function render(root) {

    const hargaI = T.input('text', 'cth: 2.000.000', '');
    const tenorI = T.select([['1','1 bulan'],['3','3 bulan'],['6','6 bulan'],['12','12 bulan']], '6');
    const bungaI = T.input('text', 'cth: 2,95', '2,95');
    const biayaI = T.input('text', 'cth: 1', '1');
    const dendaI = T.input('text', 'cth: 5', '5');
    const box = T.out();

    const calc = () => {
      const P = parseRp(hargaI.value);
      const n = +tenorI.value;
      const b = parseRp(bungaI.value);
      const by = parseRp(biayaI.value);
      const d = parseRp(dendaI.value);
      if (!isFinite(P) || P <= 0 || !isFinite(b) || b < 0 || b >= 100 || !isFinite(by) || by < 0 || by >= 100 || !isFinite(d) || d < 0 || d >= 100) {
        T.toast('Isi harga dan persentasenya dengan benar ya.'); return;
      }
      // PayLater: bunga FLAT dari pokok awal setiap bulan.
      const bungaTotal = P * b / 100 * n;
      const penanganan = P * by / 100;
      const total = P + bungaTotal + penanganan;
      const cicilan = total / n;
      const selisih = total - P;
      const dendaTelat = cicilan * d / 100;
      // Pembanding: KUR 6%/tahun, anuitas (bunga menurun).
      const r = 0.06 / 12;
      const cicilanKur = (P * r) / (1 - Math.pow(1 + r, -n));
      const totalKur = cicilanKur * n;
      const selisihKur = totalKur - P;

      T.show(box,
        '<div class="big center">' + T.rp(total) + '</div>' +
        '<p class="center">total yang benar-benar dibayar (' + n + ' bulan)</p>' +
        kv('Harga barang (tunai)', T.rp(P)) +
        kv('Cicilan per bulan', T.rp(cicilan)) +
        kv('↳ Total bunga (' + b + '%/bulan × ' + n + ' bln)', T.rp(bungaTotal)) +
        kv('↳ Biaya penanganan (' + by + '%)', T.rp(penanganan)) +
        kv('Selisih vs bayar tunai', '<b style="color:#ef4444">+' + T.rp(selisih) + ' (' + (selisih / P * 100).toFixed(1).replace('.', ',') + '%)</b>') +
        kv('Estimasi denda telat 1 bulan (' + d + '% dari cicilan)', T.rp(dendaTelat)) +
        '<table class="tbl"><tr><th></th><th>Bayar tunai</th><th>PayLater</th><th>KUR 6%/thn *</th></tr>' +
        '<tr><td>Total bayar</td><td>' + T.rp(P) + '</td><td><b>' + T.rp(total) + '</b></td><td>' + T.rp(totalKur) + '</td></tr>' +
        '<tr><td>Biaya tambahan</td><td>' + T.rp(0) + '</td><td>' + T.rp(selisih) + '</td><td>' + T.rp(selisihKur) + '</td></tr>' +
        '<tr><td>Cicilan/bulan</td><td>—</td><td>' + T.rp(cicilan) + '</td><td>' + T.rp(cicilanKur) + '</td></tr></table>' +
        '<p class="hint">* KUR hanya untuk modal usaha, bukan belanja — ditampilkan sebagai pembanding biaya saja. Bunga PayLater dihitung flat dari harga penuh, jadi terasa kecil per bulan tapi totalnya besar. Angka default per 12 Nov 2026 (RIPLAY SPayLater 20 Mei 2026: bunga 0–3,95%/bulan, denda 5%) — semuanya bisa diubah sesuai layananmu.</p>' +
        '<p class="warn">⚠️ Telat bayar menambah denda dan merusak skor kreditmu. Pakai PayLater hanya bila cicilannya benar-benar sanggup dibayar tiap bulan.</p>');
    };

    root.appendChild(T.el('<p class="note">Bunga PayLater terlihat kecil per bulan, tapi dihitung dari harga penuh — totalnya sering jauh lebih besar dari yang dibayangkan. Lihat dulu angka sebenarnya sebelum checkout.</p>'));
    root.appendChild(T.field('Harga barang (Rp)', hargaI, 'Harga yang mau dibeli pakai PayLater.'));
    root.appendChild(T.grid2(
      T.field('Tenor', tenorI),
      T.field('Bunga (%/bulan)', bungaI, 'Bunga flat dari harga penuh.'),
      T.field('Biaya penanganan (%)', biayaI, 'Sekali per transaksi.'),
      T.field('Denda telat (%)', dendaI, 'Dari tagihan yang jatuh tempo.')
    ));
    root.appendChild(T.row(T.btn('Hitung Total Bayar', calc, true)));
    root.appendChild(box);

}
