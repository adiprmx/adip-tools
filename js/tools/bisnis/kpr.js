import { h as T, money, kv } from '../../core.js?v=6.0.0';

export const meta = {"id": "kpr", "name": "Simulasi KPR", "cat": "bisnis", "icon": "🏠", "desc": "Simulasi cicilan KPR + tabel angsuran.", "keywords": "kpr,rumah,cicilan,kredit,angsuran,bank"};
export function render(root) {

    const harga = money(null, 'cth: 800000000');
    const dp = money(null, 'cth: 160000000 (20%)');
    const tenor = T.input('number', 'cth: 15', '15'); tenor.inputMode = 'numeric';
    const bunga = T.input('number', 'cth: 7.5', '7.5'); bunga.inputMode = 'decimal';
    const box = T.out();
    const tblBox = T.out();

    const hitung = () => {
      const H = T.num(harga.value) || 0, DP = T.num(dp.value) || 0;
      const thn = Math.max(1, Math.min(35, Math.round(T.num(tenor.value)) || 0));
      const b = Math.max(0, T.num(bunga.value) || 0);
      if (H <= 0) { T.show(box, '<p class="warn">Isi dulu harga propertinya.</p>'); T.hide(tblBox); return; }
      if (DP >= H) { T.show(box, '<p class="warn">DP tidak boleh ≥ harga properti.</p>'); T.hide(tblBox); return; }
      const pokok = H - DP;
      const r = b / 100 / 12, n = thn * 12;
      const cicilan = r > 0 ? pokok * r / (1 - Math.pow(1 + r, -n)) : pokok / n;
      const totalKredit = cicilan * n;
      const totalBunga = totalKredit - pokok;

      T.show(box,
        '<div class="big">' + T.rp(Math.round(cicilan)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
        kv('Pokok kredit', T.rp(Math.round(pokok))) +
        kv('DP (' + Math.round(DP / H * 100) + '%)', T.rp(Math.round(DP))) +
        kv('Total bunga ' + thn + ' thn', T.rp(Math.round(totalBunga))) +
        kv('Total bayar (kredit)', T.rp(Math.round(totalKredit))) +
        kv('Total bayar + DP', T.rp(Math.round(totalKredit + DP))));

      // Tabel angsuran per tahun
      let sisa = pokok, rows = '';
      for (let t = 1; t <= thn; t++) {
        let bungaThn = 0, pokokThn = 0;
        for (let bl = 0; bl < 12; bl++) {
          const ib = sisa * r;
          const pb = Math.min(cicilan - ib, sisa);
          bungaThn += ib; pokokThn += pb; sisa -= pb;
          if (sisa <= 0) { sisa = 0; break; }
        }
        rows += '<tr><td style="text-align:center">' + t + '</td><td style="text-align:right">' + T.rp(Math.round(pokokThn)) + '</td>' +
          '<td style="text-align:right">' + T.rp(Math.round(bungaThn)) + '</td>' +
          '<td style="text-align:right">' + T.rp(Math.round(sisa)) + '</td></tr>';
        if (sisa <= 0) break;
      }
      T.show(tblBox,
        '<h3 style="font-size:14px;margin:12px 0 6px">Tabel angsuran per tahun</h3>' +
        '<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse">' +
        '<tr style="opacity:.7"><th>Thn</th><th style="text-align:right">Pokok</th><th style="text-align:right">Bunga</th><th style="text-align:right">Sisa</th></tr>' +
        rows + '</table></div>' +
        '<p class="hint">Simulasi angsuran anuitas (bunga tetap). Bank biasanya memakai bunga fixed beberapa tahun pertama lalu floating — cicilan aktual bisa berubah.</p>');
    };
    [harga, dp, tenor, bunga].forEach((i) => i.addEventListener('input', hitung));

    root.appendChild(T.grid2(
      T.field('Harga properti (Rp)', harga),
      T.field('Uang muka / DP (Rp)', dp)
    ));
    root.appendChild(T.grid2(
      T.field('Tenor (tahun)', tenor, 'Maks 35 tahun'),
      T.field('Bunga (% / tahun)', bunga, 'Bunga fixed, cth: 7.5')
    ));
    root.appendChild(T.row(T.btn('Hitung simulasi', hitung, true)));
    root.appendChild(box);
    root.appendChild(tblBox);

}
