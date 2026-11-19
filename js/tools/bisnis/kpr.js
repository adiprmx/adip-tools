import { h as T, utils, money, kv } from '../../core.js';

// tambahBulanLabel kanonis tinggal di utils (core.js).

// Simulasi angsuran dengan pembayaran ekstra.
// skema 'anuitas': cicilan tetap, bunga dari sisa pokok (ekstra memangkas bunga).
// skema 'flat': total bunga tetap dari pokok awal (ekstra hanya memangkas tenor).
// extraBln dibayar tiap bulan, extraThn tiap akhir tahun, extraSekali dibayar
// sekali di bulan ke-extraSekaliBln. Semuanya masuk ke pokok.
//
// Bunga bertingkat (fixed -> floating): bila bungaFloat > 0 dan 0 < tahunFixed
// < tenor, cicilan dihitung ulang saat masa fixed habis:
// - anuitas: cicilan baru = anuitas dari sisa pokok atas sisa tenor dengan
//   bunga floating.
// - flat: porsi pokok/bulan tetap (pokok/tenor); bunga/bulan masa fixed =
//   pokok awal x bunga fixed, masa floating = sisa pokok x bunga floating.
// Tanpa bungaFloat/tahunFixed, perilakunya sama persis seperti sebelumnya.
utils.kprSimulasi = function (o) {
  const pokok = Math.max(0, Number(o.pokok) || 0);
  const bungaPct = Math.max(0, Number(o.bunga) || 0);
  const tahun = Math.max(1, Math.min(35, Math.round(Number(o.tahun)) || 1));
  const n = tahun * 12;
  const rFix = bungaPct / 100 / 12;
  const bungaFloatPct = Math.max(0, Number(o.bungaFloat) || 0);
  const tahunFixed = Math.max(0, Math.min(tahun, Math.round(Number(o.tahunFixed)) || 0));
  const adaFloating = bungaFloatPct > 0 && tahunFixed > 0 && tahunFixed < tahun;
  const bulanGanti = adaFloating ? tahunFixed * 12 + 1 : 0; // cicilan berubah mulai bulan ini
  const rFloat = bungaFloatPct / 100 / 12;
  const extraBln = Math.max(0, Number(o.extraBln) || 0);
  const extraThn = Math.max(0, Number(o.extraThn) || 0);
  const extraSekali = Math.max(0, Number(o.extraSekali) || 0);
  const extraSekaliBln = Math.max(1, Math.min(n, Math.round(Number(o.extraSekaliBln)) || 1));
  const skema = o.skema === 'flat' ? 'flat' : 'anuitas';
  const totalBungaFlatAwal = pokok * bungaPct / 100 * tahun;
  const anuitas = (p, r, sisaBulan) => (r > 0 ? p * r / (1 - Math.pow(1 + r, -sisaBulan)) : p / sisaBulan);
  let cicilan = skema === 'flat'
    ? (pokok + totalBungaFlatAwal) / n
    : anuitas(pokok, rFix, n);
  const cicilanAwal = cicilan;
  let cicilanSetelah = null;
  let sisa = pokok, totalBunga = 0, bulan = 0;
  const rows = [];
  let t = 1, bungaThn = 0, pokokThn = 0;
  while (sisa > 0.5 && bulan < n) {
    bulan++;
    const floating = adaFloating && bulan >= bulanGanti;
    const r = floating ? rFloat : rFix;
    if (adaFloating && bulan === bulanGanti && skema === 'anuitas') {
      cicilan = anuitas(sisa, rFloat, n - bulan + 1);
      cicilanSetelah = cicilan;
    }
    let ib, pb;
    if (skema === 'flat') {
      // Flat masa floating: bunga dari sisa pokok (bukan pokok awal lagi).
      ib = floating ? sisa * rFloat : totalBungaFlatAwal / n;
      pb = pokok / n + extraBln;
    } else {
      ib = sisa * r;
      pb = cicilan - ib + extraBln;
    }
    if (bulan % 12 === 0) pb += extraThn;
    if (extraSekali > 0 && bulan === extraSekaliBln) pb += extraSekali;
    if (bulan === n || pb >= sisa) {
      pb = sisa;
      // Flat tanpa floating: total bunga sudah ditetapkan di awal, jadi sisa
      // bunga yang belum terbayar ikut lunas di bulan terakhir walau tenor
      // memendek. Flat dengan floating: bunga bulan terakhir tetap dari sisa.
      if (skema === 'flat' && !adaFloating) ib = totalBungaFlatAwal - totalBunga;
    }
    if (adaFloating && bulan === bulanGanti && skema === 'flat' && cicilanSetelah == null) {
      cicilanSetelah = pokok / n + ib;
    }
    bungaThn += ib; pokokThn += pb; totalBunga += ib; sisa -= pb;
    if (bulan % 12 === 0 || sisa <= 0.5) {
      rows.push({ tahun: t, pokok: pokokThn, bunga: bungaThn, sisa: Math.max(0, sisa), ganti: adaFloating && bulanGanti > (t - 1) * 12 && bulanGanti <= t * 12 });
      t++; bungaThn = 0; pokokThn = 0;
    }
  }
  const totalBayar = pokok + totalBunga;
  return {
    skema, cicilan: cicilanAwal, cicilanSetelah, bulanGanti, adaFloating,
    months: bulan, totalBunga, totalBayar,
    hematBulan: n - bulan, rows,
  };
};
// Simulasi tanpa ekstra, untuk pembanding hemat bunga.
utils.kprSimulasiDasar = function (o) {
  return utils.kprSimulasi({ pokok: o.pokok, bunga: o.bunga, tahun: o.tahun, skema: o.skema, bungaFloat: o.bungaFloat, tahunFixed: o.tahunFixed, extraBln: 0, extraThn: 0 });
};
// Sisa pokok jadwal dasar (tanpa ekstra) setelah bulan ke-m. Dipakai untuk
// memperkirakan denda pelunasan dipercepat: denda dihitung dari sisa pokok
// jadwal normal di bulan saat pinjaman lunas lebih awal.
utils.kprSisaPokokDasar = function (o, bulanKe) {
  const pokok = Math.max(0, Number(o.pokok) || 0);
  const bungaPct = Math.max(0, Number(o.bunga) || 0);
  const tahun = Math.max(1, Math.min(35, Math.round(Number(o.tahun)) || 1));
  const n = tahun * 12;
  const m = Math.max(0, Math.min(n, Math.round(Number(bulanKe)) || 0));
  const skema = o.skema === 'flat' ? 'flat' : 'anuitas';
  if (skema === 'flat') return Math.max(0, pokok - pokok / n * m);
  const r = bungaPct / 100 / 12;
  const cicilan = r > 0 ? pokok * r / (1 - Math.pow(1 + r, -n)) : pokok / n;
  let sisa = pokok;
  for (let b = 1; b <= m && sisa > 0; b++) {
    const ib = sisa * r;
    sisa -= Math.min(sisa, cicilan - ib);
  }
  return Math.max(0, sisa);
};

export const meta = {"id": "kpr", "name": "Simulasi KPR", "cat": "bisnis", "icon": "🏠", "desc": "Simulasi cicilan KPR: anuitas/flat, bunga fixed lalu floating, extra payment, biaya awal, cek keterjangkauan & banding skenario.", "keywords": "kpr,rumah,cicilan,kredit,angsuran,bank,extra payment,flat,anuitas,pbb,asuransi,fixed,floating,biaya awal,dsr"};
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

    // Bunga bertingkat (fixed -> floating)
    const floatCek = document.createElement('input');
    floatCek.type = 'checkbox'; floatCek.id = 'kpr-float';
    const bungaFloatI = T.input('number', 'cth: 10', '10'); bungaFloatI.inputMode = 'decimal';
    const tahunFixedI = T.input('number', 'cth: 3', '3'); tahunFixedI.inputMode = 'numeric';
    const floatWrap = T.el('<div></div>');

    // Biaya awal KPR
    const provisiI = T.input('number', 'cth: 1 (% dari pokok kredit)', '0'); provisiI.inputMode = 'decimal';
    const adminI = money(null, 'cth: 0 (opsional)', '0');
    const appraisalI = money(null, 'cth: 0 (opsional)', '0');
    const notarisI = money(null, 'cth: 0 (opsional)', '0');
    const bphtbI = money(null, 'cth: 0 (opsional)', '0');
    const ajbI = money(null, 'cth: 0 (opsional)', '0');
    const bbnI = money(null, 'cth: 0 (opsional)', '0');

    // Cek keterjangkauan + denda pelunasan awal
    const gajiI = money(null, 'cth: 12000000 (opsional)', '0');
    const dendaI = T.input('number', 'cth: 1 (% dari sisa pokok, opsional)', '0'); dendaI.inputMode = 'decimal';

    // Skenario B
    const bandingCek = document.createElement('input');
    bandingCek.type = 'checkbox'; bandingCek.id = 'kpr-banding';
    const dpBI = money(null, 'cth: 80000000');
    const tenorBI = T.input('number', 'cth: 20', '20'); tenorBI.inputMode = 'numeric';
    const bungaBI = T.input('number', 'cth: 8', '8'); bungaBI.inputMode = 'decimal';
    const bandingWrap = T.el('<div></div>');

    const box = T.out();
    const tblBox = T.out();
    const bandingBox = T.out();

    const hitung = () => {
      const H = T.num(harga.value) || 0, DP = T.num(dp.value) || 0;
      const thn = Math.max(1, Math.min(35, Math.round(T.num(tenor.value)) || 0));
      const b = Math.max(0, T.num(bunga.value) || 0);
      if (H <= 0) { T.show(box, '<p class="warn">Isi dulu harga propertinya.</p>'); T.hide(tblBox); T.hide(bandingBox); return; }
      if (!isFinite(H) || H > 1e14) { T.show(box, '<p class="warn">Harga properti terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); T.hide(tblBox); T.hide(bandingBox); return; }
      if (DP >= H) { T.show(box, '<p class="warn">DP tidak boleh ≥ harga properti.</p>'); T.hide(tblBox); T.hide(bandingBox); return; }
      const pokok = H - DP;
      const extraBln = T.num(extraBlnI.value) || 0;
      const extraThn = T.num(extraThnI.value) || 0;
      const extraSekali = T.num(extraSekaliI.value) || 0;
      const extraSekaliBln = Math.max(1, Math.round(T.num(extraSekaliBlnI.value)) || 1);
      const skema = skemaSel.value;
      const pakaiFloat = floatCek.checked;
      const bFloat = pakaiFloat ? Math.max(0, T.num(bungaFloatI.value) || 0) : 0;
      const thnFixed = pakaiFloat ? Math.max(0, Math.min(thn, Math.round(T.num(tahunFixedI.value)) || 0)) : 0;
      // Bunga KPR di atas 50%/tahun tidak realistis dan membuat total bunga
      // flat meluber ke Infinity (pokok × bunga × tahun) — preseden yang
      // sama sudah dipakai kalkulator sewa & rumah.
      if (b > 50 || bFloat > 50) { T.show(box, '<p class="warn">Bunga per tahun isi 0 sampai 50 persen.</p>'); T.hide(tblBox); T.hide(bandingBox); return; }
      const r = utils.kprSimulasi({ pokok, bunga: b, tahun: thn, skema, extraBln, extraThn, extraSekali, extraSekaliBln, bungaFloat: bFloat, tahunFixed: thnFixed });
      // Jaring pengaman terakhir: bila kombinasi input lain (biaya, ekstra)
      // membuat hasil simulasi tidak finite, tolak dengan pesan jelas
      // daripada menampilkan Rp∞/NaN.
      if (![r.cicilan, r.totalBayar, r.totalBunga].every(Number.isFinite)) { T.show(box, '<p class="warn">Angka yang diisi terlalu besar sehingga hasilnya tidak bisa dihitung. Periksa lagi angkanya.</p>'); T.hide(tblBox); T.hide(bandingBox); return; }
      const adaExtra = extraBln > 0 || extraThn > 0 || extraSekali > 0;
      const dasar = adaExtra
        ? utils.kprSimulasiDasar({ pokok, bunga: b, tahun: thn, skema, bungaFloat: bFloat, tahunFixed: thnFixed }) : null;
      const pbbThn = T.num(pbbI.value) || 0;
      const asrThn = T.num(asuransiI.value) || 0;
      const pmiBln = T.num(pmiI.value) || 0;
      const biayaLainBln = pbbThn / 12 + asrThn / 12 + pmiBln;
      const parts = String(mulaiI.value || '').split('-');
      const y0 = Number(parts[0]) || now.getFullYear();
      const m0 = Number(parts[1]) || (now.getMonth() + 1);
      const lunas = utils.tambahBulanLabel(y0, m0, r.months - 1);
      const hematBunga = dasar ? dasar.totalBunga - r.totalBunga : 0;

      // Biaya awal KPR
      const provisiPct = Math.max(0, T.num(provisiI.value) || 0);
      const provisiRp = pokok * provisiPct / 100;
      const biayaAwal = provisiRp + (T.num(adminI.value) || 0) + (T.num(appraisalI.value) || 0) + (T.num(notarisI.value) || 0) + (T.num(bphtbI.value) || 0) + (T.num(ajbI.value) || 0) + (T.num(bbnI.value) || 0);
      const biayaAwalHtml = biayaAwal > 0
        ? kv('Biaya awal KPR', T.rp(Math.round(biayaAwal))) +
          '<p class="hint">Rinciannya: provisi ' + T.rp(Math.round(provisiRp)) + (provisiPct > 0 ? ' (' + T.esc(String(provisiPct)) + '% dari pokok kredit)' : '') +
          ', admin ' + T.rp(Math.round(T.num(adminI.value) || 0)) + ', appraisal ' + T.rp(Math.round(T.num(appraisalI.value) || 0)) +
          ', notaris/PPAT ' + T.rp(Math.round(T.num(notarisI.value) || 0)) + ', BPHTB ' + T.rp(Math.round(T.num(bphtbI.value) || 0)) +
          ', AJB ' + T.rp(Math.round(T.num(ajbI.value) || 0)) + ', balik nama ' + T.rp(Math.round(T.num(bbnI.value) || 0)) + '.</p>' +
          kv('Dana disiapkan di muka', '<b>' + T.rp(Math.round(DP + biayaAwal)) + '</b>') +
          '<p class="hint">DP + semua biaya awal di atas. Ini uang yang harus sudah ada sebelum akad, di luar cicilan bulanan.</p>'
        : '';

      // Denda pelunasan dipercepat
      const dendaPct = Math.max(0, T.num(dendaI.value) || 0);
      let dendaHtml = '';
      let hematBersih = hematBunga;
      if (dasar && r.hematBulan > 0 && dendaPct > 0) {
        const sisaDiLunas = utils.kprSisaPokokDasar({ pokok, bunga: b, tahun: thn, skema }, r.months);
        const dendaRp = sisaDiLunas * dendaPct / 100;
        hematBersih = Math.max(0, hematBunga - dendaRp);
        dendaHtml = kv('Denda pelunasan awal (' + T.esc(String(dendaPct)) + '% dari sisa pokok)', T.rp(Math.round(dendaRp))) +
          '<p class="hint">Perkiraan dari sisa pokok jadwal normal (' + T.rp(Math.round(sisaDiLunas)) + ') di bulan ke-' + r.months + ', saat pinjaman lunas lebih awal. Ketentuan denda tiap bank beda — ada yang 1%, ada yang bebas denda setelah tahun tertentu.</p>' +
          (hematBunga > 0 ? kv('Hemat bunga bersih (setelah denda)', '<b>' + T.rp(Math.round(hematBersih)) + '</b>') : '');
      }

      // Cek keterjangkauan (DSR)
      const gaji = T.num(gajiI.value) || 0;
      let dsrHtml = '';
      if (gaji > 0) {
        const cicilanTotal = r.cicilan + extraBln + biayaLainBln;
        const dsr = cicilanTotal / gaji * 100;
        const vonis = dsr < 30 ? 'Aman — cicilan di bawah 30% penghasilan.'
          : dsr <= 40 ? 'Waspada — cicilan 30–40% penghasilan, sisakan dana darurat.'
          : 'Berat — cicilan di atas 40% penghasilan, risiko keuanganmu tinggi.';
        const warna = dsr < 30 ? '#4ade80' : dsr <= 40 ? '#fbbf24' : '#f87171';
        dsrHtml = '<h3 style="font-size:14px;margin:12px 0 4px">Cek keterjangkauan</h3>' +
          kv('Cicilan / penghasilan', '<b style="color:' + warna + '">' + dsr.toFixed(1) + '%</b>') +
          kv('Sisa penghasilan setelah cicilan', T.rp(Math.round(gaji - cicilanTotal))) +
          '<p class="hint">' + vonis + ' Patokan umum bank: cicilan sebaiknya tidak lebih dari 30–40% penghasilan bulanan.</p>';
      }

      T.show(box,
        '<div class="big">' + T.rp(Math.round(r.cicilan + extraBln)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
        '<p class="center mut">Cicilan' + (extraBln > 0 ? ' + pembayaran ekstra' : '') + ' (' + (skema === 'flat' ? 'flat' : 'anuitas') + ')' +
        (r.adaFloating ? ', masa fixed ' + thnFixed + ' tahun' : '') + '</p>' +
        kv('Pokok kredit', T.rp(Math.round(pokok))) +
        kv('DP (' + Math.round(DP / H * 100) + '%)', T.rp(Math.round(DP))) +
        kv('Cicilan pokok + bunga', T.rp(Math.round(r.cicilan)) + ' / bulan') +
        (r.adaFloating && r.cicilanSetelah != null ? kv('Cicilan setelah floating (mulai bulan ke-' + r.bulanGanti + ')', '<b>' + T.rp(Math.round(r.cicilanSetelah)) + ' / bulan</b>') : '') +
        (biayaLainBln > 0 ? kv('PBB + asuransi + PMI', T.rp(Math.round(biayaLainBln)) + ' / bulan') : '') +
        (biayaLainBln > 0 ? kv('Total keluar / bulan', '<b>' + T.rp(Math.round(r.cicilan + extraBln + biayaLainBln)) + '</b>') : '') +
        kv('Total bunga', T.rp(Math.round(r.totalBunga))) +
        kv('Total bayar (kredit)', T.rp(Math.round(r.totalBayar))) +
        kv('Total bayar + DP', T.rp(Math.round(r.totalBayar + DP))) +
        kv('Lunas dalam', r.months + ' bulan (sekitar ' + Math.floor(r.months / 12) + ' thn ' + (r.months % 12) + ' bln)') +
        kv('Perkiraan lunas', '<b>' + T.esc(lunas) + '</b>') +
        (dasar && r.hematBulan > 0 ? kv('Lebih cepat lunas', r.hematBulan + ' bulan') : '') +
        (dasar && hematBunga > 0 ? kv('Hemat bunga', '<b>' + T.rp(Math.round(hematBunga)) + '</b>') : '') +
        dendaHtml +
        biayaAwalHtml +
        dsrHtml +
        (dasar && skema === 'flat' && r.hematBulan > 0 && !r.adaFloating ? '<p class="hint">Skema flat: total bunga dihitung dari pokok awal, jadi walau lunas lebih cepat total bunganya tetap. Tanya bank atau leasing soal potongan bila melunasi lebih awal.</p>' : ''));

      let rows = '';
      for (const row of r.rows) {
        rows += '<tr><td style="text-align:center">' + row.tahun + (row.ganti ? ' *' : '') + '</td><td style="text-align:right">' + T.rp(Math.round(row.pokok)) + '</td>' +
          '<td style="text-align:right">' + T.rp(Math.round(row.bunga)) + '</td>' +
          '<td style="text-align:right">' + T.rp(Math.round(row.sisa)) + '</td></tr>';
      }
      T.show(tblBox,
        '<h3 style="font-size:14px;margin:12px 0 6px">Tabel angsuran per tahun' + (adaExtra ? ' (sudah termasuk pembayaran ekstra)' : '') + '</h3>' +
        '<div style="overflow-x:auto"><table class="tbl">' +
        '<tr><th>Thn</th><th style="text-align:right">Pokok</th><th style="text-align:right">Bunga</th><th style="text-align:right">Sisa</th></tr>' +
        rows + '</table></div>' +
        (r.adaFloating ? '<p class="hint">Tanda * = tahun saat bunga berubah dari fixed (' + T.esc(String(b)) + '%) ke floating (' + T.esc(String(bFloat)) + '%), cicilan dihitung ulang mulai bulan ke-' + r.bulanGanti + ' (' + T.esc(utils.tambahBulanLabel(y0, m0, r.bulanGanti - 1)) + '). Bunga floating di dunia nyata berubah-ubah mengikuti suku bunga acuan, jadi angka setelah masa fixed adalah perkiraan dengan asumsi bunga floating tetap.</p>'
          : '<p class="hint">Simulasi bunga tetap. Bank biasanya memakai bunga fixed beberapa tahun pertama lalu floating — centang "Bunga berubah setelah masa fixed" di atas untuk mensimulasikannya. Pembayaran ekstra diasumsikan langsung memotong pokok tanpa denda pelunasan dipercepat, cek ketentuan bankmu.</p>'));

      // Banding skenario B
      if (bandingCek.checked) {
        const DPB = Math.max(0, T.num(dpBI.value) || 0);
        const thnB = Math.max(1, Math.min(35, Math.round(T.num(tenorBI.value)) || 1));
        const bB = Math.max(0, T.num(bungaBI.value) || 0);
        if (DPB >= H) {
          T.show(bandingBox, '<p class="warn">DP skenario B tidak boleh ≥ harga properti.</p>');
        } else {
          const pokokB = H - DPB;
          const rB = utils.kprSimulasi({ pokok: pokokB, bunga: bB, tahun: thnB, skema, extraBln: 0, extraThn: 0, bungaFloat: bFloat, tahunFixed: thnFixed });
          const lunasB = utils.tambahBulanLabel(y0, m0, rB.months - 1);
          const selisih = (x, y) => x - y;
          T.show(bandingBox,
            '<h3 style="font-size:14px;margin:14px 0 6px">Banding 2 skenario</h3>' +
            '<div style="overflow-x:auto"><table class="tbl"><tr><th></th><th>A (saat ini)</th><th>B</th><th>Selisih (B − A)</th></tr>' +
            '<tr><td>DP</td><td>' + T.rp(Math.round(DP)) + '</td><td>' + T.rp(Math.round(DPB)) + '</td><td>' + T.rp(Math.round(selisih(DPB, DP))) + '</td></tr>' +
            '<tr><td>Pokok kredit</td><td>' + T.rp(Math.round(pokok)) + '</td><td>' + T.rp(Math.round(pokokB)) + '</td><td>' + T.rp(Math.round(selisih(pokokB, pokok))) + '</td></tr>' +
            '<tr><td>Tenor</td><td>' + thn + ' thn</td><td>' + thnB + ' thn</td><td>' + (thnB - thn) + ' thn</td></tr>' +
            '<tr><td>Cicilan / bulan</td><td><b>' + T.rp(Math.round(r.cicilan)) + '</b></td><td><b>' + T.rp(Math.round(rB.cicilan)) + '</b></td><td>' + T.rp(Math.round(selisih(rB.cicilan, r.cicilan))) + '</td></tr>' +
            '<tr><td>Total bunga</td><td>' + T.rp(Math.round(r.totalBunga)) + '</td><td>' + T.rp(Math.round(rB.totalBunga)) + '</td><td>' + T.rp(Math.round(selisih(rB.totalBunga, r.totalBunga))) + '</td></tr>' +
            '<tr><td>Total bayar + DP</td><td>' + T.rp(Math.round(r.totalBayar + DP)) + '</td><td>' + T.rp(Math.round(rB.totalBayar + DPB)) + '</td><td>' + T.rp(Math.round(selisih(rB.totalBayar + DPB, r.totalBayar + DP))) + '</td></tr>' +
            '<tr><td>Lunas</td><td>' + T.esc(lunas) + '</td><td>' + T.esc(lunasB) + '</td><td>' + (rB.months - r.months) + ' bln</td></tr></table></div>' +
            '<p class="hint">Skenario B memakai skema dan pengaturan floating yang sama dengan skenario A, tanpa pembayaran ekstra. Nilai selisih negatif berarti B lebih ringan.</p>');
        }
      } else {
        T.hide(bandingBox);
      }
    };

    const segarkanFloat = () => {
      floatWrap.hidden = !floatCek.checked;
      hitung();
    };
    const segarkanBanding = () => {
      bandingWrap.hidden = !bandingCek.checked;
      hitung();
    };
    floatCek.addEventListener('change', segarkanFloat);
    bandingCek.addEventListener('change', segarkanBanding);
    [harga, dp, tenor, bunga, extraBlnI, extraThnI, extraSekaliI, extraSekaliBlnI, pbbI, asuransiI, pmiI, bungaFloatI, tahunFixedI, provisiI, adminI, appraisalI, notarisI, bphtbI, ajbI, bbnI, gajiI, dendaI, dpBI, tenorBI, bungaBI].forEach((i) => i.addEventListener('input', hitung));
    skemaSel.addEventListener('change', hitung);
    mulaiI.addEventListener('change', hitung);

    floatWrap.appendChild(T.grid2(
      T.field('Bunga floating (% / tahun)', bungaFloatI, 'Bunga setelah masa fixed habis'),
      T.field('Lama masa fixed (tahun)', tahunFixedI, 'Harus lebih pendek dari tenor')
    ));
    floatWrap.hidden = true;
    bandingWrap.appendChild(T.grid2(
      T.field('DP skenario B (Rp)', dpBI),
      T.field('Tenor skenario B (tahun)', tenorBI)
    ));
    bandingWrap.appendChild(T.field('Bunga skenario B (% / tahun)', bungaBI));
    bandingWrap.hidden = true;

    const lblFloat = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lblFloat.appendChild(floatCek);
    lblFloat.appendChild(document.createTextNode('Bunga berubah setelah masa fixed (fixed lalu floating)'));
    const lblBanding = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
    lblBanding.appendChild(bandingCek);
    lblBanding.appendChild(document.createTextNode('Bandingkan dengan skenario lain'));

    root.appendChild(T.grid2(
      T.field('Harga properti (Rp)', harga),
      T.field('Uang muka / DP (Rp)', dp)
    ));
    root.appendChild(T.grid2(
      T.field('Tenor (tahun)', tenor, 'Maks 35 tahun'),
      T.field('Bunga (% / tahun)', bunga, 'Bunga fixed, cth: 7.5')
    ));
    root.appendChild(T.field('Skema bunga', skemaSel));
    root.appendChild(lblFloat);
    root.appendChild(floatWrap);
    root.appendChild(T.grid2(
      T.field('Mulai cicilan', mulaiI),
      T.field('Pembayaran ekstra / bulan (Rp)', extraBlnI, 'Di luar cicilan, langsung memotong pokok')
    ));
    root.appendChild(T.field('Pembayaran ekstra / tahun (Rp)', extraThnI, 'Dibayar tiap akhir tahun, misal dari THR atau bonus'));
    root.appendChild(T.grid2(
      T.field('Pembayaran ekstra sekali (Rp)', extraSekaliI, 'Sekali bayar, misal dari hasil jual aset atau bonus besar'),
      T.field('Dibayar di bulan ke-', extraSekaliBlnI, 'Bulan ke-1 = cicilan pertama')
    ));
    root.appendChild(T.field('Denda pelunasan dipercepat (% dari sisa pokok)', dendaI, 'Bila lunas lebih awal karena pembayaran ekstra. Isi 0 bila bankmu bebas denda.'));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Biaya lain (opsional)</p>'));
    root.appendChild(T.grid2(
      T.field('PBB / tahun (Rp)', pbbI),
      T.field('Asuransi jiwa & kebakaran / tahun (Rp)', asuransiI)
    ));
    root.appendChild(T.field('PMI / asuransi kredit / bulan (Rp)', pmiI, 'Isi 0 bila tidak ada'));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Biaya awal KPR (opsional, dibayar sekali di muka)</p>'));
    root.appendChild(T.grid2(
      T.field('Provisi (% dari pokok kredit)', provisiI, 'Umumnya 1%'),
      T.field('Biaya admin (Rp)', adminI)
    ));
    root.appendChild(T.grid2(
      T.field('Biaya appraisal / penilai (Rp)', appraisalI),
      T.field('Notaris / PPAT (Rp)', notarisI)
    ));
    root.appendChild(T.grid2(
      T.field('BPHTB (Rp)', bphtbI, 'Bea perolehan hak atas tanah & bangunan'),
      T.field('AJB (Rp)', ajbI, 'Akta jual beli')
    ));
    root.appendChild(T.field('BBN / balik nama (Rp)', bbnI));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Cek keterjangkauan (opsional)</p>'));
    root.appendChild(T.field('Penghasilan / bulan (Rp)', gajiI, 'Untuk menghitung cicilan dibanding penghasilanmu'));
    root.appendChild(lblBanding);
    root.appendChild(bandingWrap);
    root.appendChild(T.row(T.btn('Hitung simulasi', hitung, true)));
    root.appendChild(box);
    root.appendChild(bandingBox);
    root.appendChild(tblBox);

}
