import { h as T, utils, money, kv } from '../../core.js?v=6.12.2';

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function tambahBulan(y, m, n) {
  const d = new Date(y, m - 1 + n, 1);
  return NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear();
}

// Simulasi angsuran dengan pembayaran ekstra.
// skema 'anuitas': cicilan tetap, bunga dari sisa pokok (ekstra memangkas bunga).
// skema 'flat': total bunga tetap dari pokok awal (ekstra hanya memangkas tenor).
// extraBln dibayar tiap bulan, extraThn tiap akhir tahun, extraSekali dibayar
// sekali di bulan ke-extraSekaliBln. Semuanya masuk ke pokok.
utils.kprSimulasi = function (o) {
  const pokok = Math.max(0, Number(o.pokok) || 0);
  const bungaPct = Math.max(0, Number(o.bunga) || 0);
  const tahun = Math.max(1, Math.min(35, Math.round(Number(o.tahun)) || 1));
  const n = tahun * 12;
  const r = bungaPct / 100 / 12;
  const extraBln = Math.max(0, Number(o.extraBln) || 0);
  const extraThn = Math.max(0, Number(o.extraThn) || 0);
  const extraSekali = Math.max(0, Number(o.extraSekali) || 0);
  const extraSekaliBln = Math.max(1, Math.min(n, Math.round(Number(o.extraSekaliBln)) || 1));
  const skema = o.skema === 'flat' ? 'flat' : 'anuitas';
  const totalBungaFlat = pokok * bungaPct / 100 * tahun;
  const cicilan = skema === 'flat'
    ? (pokok + totalBungaFlat) / n
    : (r > 0 ? pokok * r / (1 - Math.pow(1 + r, -n)) : pokok / n);
  let sisa = pokok, totalBunga = 0, bulan = 0;
  const rows = [];
  let t = 1, bungaThn = 0, pokokThn = 0;
  while (sisa > 0.5 && bulan < n) {
    bulan++;
    let ib = skema === 'flat' ? totalBungaFlat / n : sisa * r;
    let pb = cicilan - ib + extraBln;
    if (bulan % 12 === 0) pb += extraThn;
    if (extraSekali > 0 && bulan === extraSekaliBln) pb += extraSekali;
    if (bulan === n || pb >= sisa) {
      pb = sisa;
      // Flat: total bunga sudah ditetapkan di awal, jadi sisa bunga yang belum
      // terbayar ikut lunas di bulan terakhir walau tenor memendek.
      if (skema === 'flat') ib = totalBungaFlat - totalBunga;
    }
    bungaThn += ib; pokokThn += pb; totalBunga += ib; sisa -= pb;
    if (bulan % 12 === 0 || sisa <= 0.5) {
      rows.push({ tahun: t, pokok: pokokThn, bunga: bungaThn, sisa: Math.max(0, sisa) });
      t++; bungaThn = 0; pokokThn = 0;
    }
  }
  const totalBayar = pokok + totalBunga;
  return {
    skema, cicilan, months: bulan, totalBunga, totalBayar,
    hematBulan: n - bulan, rows,
  };
};
// Simulasi tanpa ekstra, untuk pembanding hemat bunga.
utils.kprSimulasiDasar = function (o) {
  return utils.kprSimulasi({ pokok: o.pokok, bunga: o.bunga, tahun: o.tahun, skema: o.skema, extraBln: 0, extraThn: 0 });
};

export const meta = {"id": "kpr", "name": "Simulasi KPR", "cat": "bisnis", "icon": "🏠", "desc": "Simulasi cicilan KPR: anuitas/flat, extra payment, + tabel angsuran.", "keywords": "kpr,rumah,cicilan,kredit,angsuran,bank,extra payment,flat,anuitas,pbb,asuransi"};
export function render(root) {

    const now = new Date();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    const harga = money(null, 'cth: 800000000');
    const dp = money(null, 'cth: 160000000 (20%)');
    const tenor = T.input('number', 'cth: 15', '15'); tenor.inputMode = 'numeric';
    const bunga = T.input('number', 'cth: 7.5', '7.5'); bunga.inputMode = 'decimal';
    const skemaSel = T.select([
      ['anuitas', 'Anuitas (cicilan tetap, bunga menyusut)'],
      ['flat', 'Flat (bunga dari pokok awal, total bunga tetap)'],
    ], 'anuitas');
    const extraBlnI = money(null, 'cth: 500000 (opsional)', '0');
    const extraThnI = money(null, 'cth: 5000000 (opsional)', '0');
    const extraSekaliI = money(null, 'cth: 10000000 (opsional)', '0');
    const extraSekaliBlnI = T.input('number', 'cth: 12', '12'); extraSekaliBlnI.inputMode = 'numeric';
    const mulaiI = T.input('month', '', ym);
    const pbbI = money(null, 'cth: 2000000 (opsional)', '0');
    const asuransiI = money(null, 'cth: 3000000 (opsional)', '0');
    const pmiI = money(null, 'cth: 0 (opsional)', '0');
    const box = T.out();
    const tblBox = T.out();

    const hitung = () => {
      const H = T.num(harga.value) || 0, DP = T.num(dp.value) || 0;
      const thn = Math.max(1, Math.min(35, Math.round(T.num(tenor.value)) || 0));
      const b = Math.max(0, T.num(bunga.value) || 0);
      if (H <= 0) { T.show(box, '<p class="warn">Isi dulu harga propertinya.</p>'); T.hide(tblBox); return; }
      if (DP >= H) { T.show(box, '<p class="warn">DP tidak boleh ≥ harga properti.</p>'); T.hide(tblBox); return; }
      const pokok = H - DP;
      const extraBln = T.num(extraBlnI.value) || 0;
      const extraThn = T.num(extraThnI.value) || 0;
      const extraSekali = T.num(extraSekaliI.value) || 0;
      const extraSekaliBln = Math.max(1, Math.round(T.num(extraSekaliBlnI.value)) || 1);
      const skema = skemaSel.value;
      const r = utils.kprSimulasi({ pokok, bunga: b, tahun: thn, skema, extraBln, extraThn, extraSekali, extraSekaliBln });
      const adaExtra = extraBln > 0 || extraThn > 0 || extraSekali > 0;
      const dasar = adaExtra
        ? utils.kprSimulasiDasar({ pokok, bunga: b, tahun: thn, skema }) : null;
      const pbbThn = T.num(pbbI.value) || 0;
      const asrThn = T.num(asuransiI.value) || 0;
      const pmiBln = T.num(pmiI.value) || 0;
      const biayaLainBln = pbbThn / 12 + asrThn / 12 + pmiBln;
      const parts = String(mulaiI.value || '').split('-');
      const y0 = Number(parts[0]) || now.getFullYear();
      const m0 = Number(parts[1]) || (now.getMonth() + 1);
      const lunas = tambahBulan(y0, m0, r.months - 1);
      const hematBunga = dasar ? dasar.totalBunga - r.totalBunga : 0;

      T.show(box,
        '<div class="big">' + T.rp(Math.round(r.cicilan + extraBln)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
        '<p class="center mut">Cicilan' + (extraBln > 0 ? ' + pembayaran ekstra' : '') + ' (' + (skema === 'flat' ? 'flat' : 'anuitas') + ')' + '</p>' +
        kv('Pokok kredit', T.rp(Math.round(pokok))) +
        kv('DP (' + Math.round(DP / H * 100) + '%)', T.rp(Math.round(DP))) +
        kv('Cicilan pokok + bunga', T.rp(Math.round(r.cicilan)) + ' / bulan') +
        (biayaLainBln > 0 ? kv('PBB + asuransi + PMI', T.rp(Math.round(biayaLainBln)) + ' / bulan') : '') +
        (biayaLainBln > 0 ? kv('Total keluar / bulan', '<b>' + T.rp(Math.round(r.cicilan + extraBln + biayaLainBln)) + '</b>') : '') +
        kv('Total bunga', T.rp(Math.round(r.totalBunga))) +
        kv('Total bayar (kredit)', T.rp(Math.round(r.totalBayar))) +
        kv('Total bayar + DP', T.rp(Math.round(r.totalBayar + DP))) +
        kv('Lunas dalam', r.months + ' bulan (sekitar ' + Math.floor(r.months / 12) + ' thn ' + (r.months % 12) + ' bln)') +
        kv('Perkiraan lunas', '<b>' + T.esc(lunas) + '</b>') +
        (dasar && r.hematBulan > 0 ? kv('Lebih cepat lunas', r.hematBulan + ' bulan') : '') +
        (dasar && hematBunga > 0 ? kv('Hemat bunga', '<b>' + T.rp(Math.round(hematBunga)) + '</b>') : '') +
        (dasar && skema === 'flat' && r.hematBulan > 0 ? '<p class="hint">Skema flat: total bunga dihitung dari pokok awal, jadi walau lunas lebih cepat total bunganya tetap. Tanya bank atau leasing soal potongan bila melunasi lebih awal.</p>' : ''));

      let rows = '';
      for (const row of r.rows) {
        rows += '<tr><td style="text-align:center">' + row.tahun + '</td><td style="text-align:right">' + T.rp(Math.round(row.pokok)) + '</td>' +
          '<td style="text-align:right">' + T.rp(Math.round(row.bunga)) + '</td>' +
          '<td style="text-align:right">' + T.rp(Math.round(row.sisa)) + '</td></tr>';
      }
      T.show(tblBox,
        '<h3 style="font-size:14px;margin:12px 0 6px">Tabel angsuran per tahun' + (adaExtra ? ' (sudah termasuk pembayaran ekstra)' : '') + '</h3>' +
        '<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse">' +
        '<tr style="opacity:.7"><th>Thn</th><th style="text-align:right">Pokok</th><th style="text-align:right">Bunga</th><th style="text-align:right">Sisa</th></tr>' +
        rows + '</table></div>' +
        '<p class="hint">Simulasi bunga tetap. Bank biasanya memakai bunga fixed beberapa tahun pertama lalu floating, jadi cicilan aktual bisa berubah. Pembayaran ekstra diasumsikan langsung memotong pokok tanpa denda pelunasan dipercepat, cek ketentuan bankmu.</p>');
    };
    [harga, dp, tenor, bunga, extraBlnI, extraThnI, extraSekaliI, extraSekaliBlnI, pbbI, asuransiI, pmiI].forEach((i) => i.addEventListener('input', hitung));
    skemaSel.addEventListener('change', hitung);
    mulaiI.addEventListener('change', hitung);

    root.appendChild(T.grid2(
      T.field('Harga properti (Rp)', harga),
      T.field('Uang muka / DP (Rp)', dp)
    ));
    root.appendChild(T.grid2(
      T.field('Tenor (tahun)', tenor, 'Maks 35 tahun'),
      T.field('Bunga (% / tahun)', bunga, 'Bunga fixed, cth: 7.5')
    ));
    root.appendChild(T.field('Skema bunga', skemaSel));
    root.appendChild(T.grid2(
      T.field('Mulai cicilan', mulaiI),
      T.field('Pembayaran ekstra / bulan (Rp)', extraBlnI, 'Di luar cicilan, langsung memotong pokok')
    ));
    root.appendChild(T.field('Pembayaran ekstra / tahun (Rp)', extraThnI, 'Dibayar tiap akhir tahun, misal dari THR atau bonus'));
    root.appendChild(T.grid2(
      T.field('Pembayaran ekstra sekali (Rp)', extraSekaliI, 'Sekali bayar, misal dari hasil jual aset atau bonus besar'),
      T.field('Dibayar di bulan ke-', extraSekaliBlnI, 'Bulan ke-1 = cicilan pertama')
    ));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Biaya lain (opsional)</p>'));
    root.appendChild(T.grid2(
      T.field('PBB / tahun (Rp)', pbbI),
      T.field('Asuransi jiwa & kebakaran / tahun (Rp)', asuransiI)
    ));
    root.appendChild(T.field('PMI / asuransi kredit / bulan (Rp)', pmiI, 'Isi 0 bila tidak ada'));
    root.appendChild(T.row(T.btn('Hitung simulasi', hitung, true)));
    root.appendChild(box);
    root.appendChild(tblBox);

}
