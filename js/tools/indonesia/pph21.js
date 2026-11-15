import { h as T, utils, money, kv } from '../../core.js?v=6.12.0';

// PTKP setahun (Rp): PMK 101/2016
const PTKP = {
  'TK/0': 54000000, 'TK/1': 58500000, 'TK/2': 63000000, 'TK/3': 67500000,
  'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000,
  'K/I/0': 112500000, 'K/I/1': 117000000, 'K/I/2': 121500000, 'K/I/3': 126000000,
};
const PTKP_LABEL = {
  'TK/0': 'TK/0: Lajang', 'TK/1': 'TK/1: Lajang + 1 tanggungan', 'TK/2': 'TK/2: Lajang + 2 tanggungan', 'TK/3': 'TK/3: Lajang + 3 tanggungan',
  'K/0': 'K/0: Kawin', 'K/1': 'K/1: Kawin + 1 tanggungan', 'K/2': 'K/2: Kawin + 2 tanggungan', 'K/3': 'K/3: Kawin + 3 tanggungan',
  'K/I/0': 'K/I/0: Kawin, istri kerja', 'K/I/1': 'K/I/1: Kawin, istri kerja + 1', 'K/I/2': 'K/I/2: Kawin, istri kerja + 2', 'K/I/3': 'K/I/3: Kawin, istri kerja + 3',
};

// Tarif Efektif Rata-rata (TER) bulanan, Lampiran PP 58/2023.
// Tiap baris: [batas atas bruto sebulan, tarif %]. Batas atas termasuk di baris itu.
// Kategori A: TK/0, TK/1, K/0. Kategori B: TK/2, TK/3, K/1, K/2. Kategori C: K/3.
const TER_A = [[5400000,0],[5650000,0.25],[5950000,0.5],[6300000,0.75],[6750000,1],[7500000,1.25],[8550000,1.5],[9650000,1.75],[10050000,2],[10350000,2.25],[10700000,2.5],[11050000,3],[11600000,3.5],[12500000,4],[13750000,5],[15100000,6],[16950000,7],[19750000,8],[24150000,9],[26450000,10],[28000000,11],[30050000,12],[32400000,13],[35400000,14],[39100000,15],[43850000,16],[47800000,17],[51400000,18],[56300000,19],[62200000,20],[68600000,21],[77500000,22],[89000000,23],[103000000,24],[125000000,25],[157000000,26],[206000000,27],[337000000,28],[454000000,29],[550000000,30],[695000000,31],[910000000,32],[1400000000,33],[Infinity,34]];
const TER_B = [[6200000,0],[6500000,0.25],[6850000,0.5],[7300000,0.75],[9200000,1],[10750000,1.5],[11250000,2],[11600000,2.5],[12600000,3],[13600000,4],[14950000,5],[16400000,6],[18450000,7],[21850000,8],[26000000,9],[27700000,10],[29350000,11],[31450000,12],[33950000,13],[37100000,14],[41100000,15],[45800000,16],[49500000,17],[53800000,18],[58500000,19],[64000000,20],[71000000,21],[80000000,22],[93000000,23],[109000000,24],[129000000,25],[163000000,26],[211000000,27],[374000000,28],[459000000,29],[555000000,30],[704000000,31],[957000000,32],[1405000000,33],[Infinity,34]];
const TER_C = [[6600000,0],[6950000,0.25],[7350000,0.5],[7800000,0.75],[8850000,1],[9800000,1.25],[10950000,1.5],[11200000,1.75],[12050000,2],[12950000,3],[14150000,4],[15550000,5],[17050000,6],[19500000,7],[22700000,8],[26600000,9],[28100000,10],[30100000,11],[32600000,12],[35400000,13],[38900000,14],[43000000,15],[47400000,16],[51200000,17],[55800000,18],[60400000,19],[66700000,20],[74500000,21],[83200000,22],[95600000,23],[110000000,24],[134000000,25],[169000000,26],[221000000,27],[390000000,28],[463000000,29],[561000000,30],[709000000,31],[965000000,32],[1419000000,33],[Infinity,34]];
const TER_KAT = { 'TK/0': 'A', 'TK/1': 'A', 'K/0': 'A', 'TK/2': 'B', 'TK/3': 'B', 'K/1': 'B', 'K/2': 'B', 'K/3': 'C' };
function terRate(bruto, status) {
  const kat = TER_KAT[status];
  if (!kat) return null;
  const tbl = kat === 'A' ? TER_A : kat === 'B' ? TER_B : TER_C;
  for (const [atas, tarif] of tbl) if (bruto <= atas) return { kat, tarif };
  return { kat, tarif: 34 };
}

// Tarif progresif Pasal 17 UU PPh (UU HPP)
function pphProgresif(pkp) {
  const lapis = [
    [60000000, 0.05, '5%'], [250000000, 0.15, '15%'], [500000000, 0.25, '25%'],
    [5000000000, 0.30, '30%'], [Infinity, 0.35, '35%'],
  ];
  let sisa = pkp, bawah = 0, total = 0;
  const rinc = [];
  for (const [atas, tarif, label] of lapis) {
    if (sisa <= 0) break;
    const kena = Math.min(sisa, atas - bawah);
    const pajak = kena * tarif;
    rinc.push({ label, kena, pajak });
    total += pajak; sisa -= kena; bawah = atas;
  }
  return { total: Math.round(total), rinc };
}

// PPh setahun dari penghasilan bruto setahun (dipakai mode THR/bonus).
// Biaya jabatan 5%, maks Rp6.000.000 setahun.
function pphTahunan(brutoThn, iuranThn, ptkp) {
  const bjThn = Math.min(brutoThn * 0.05, 6000000);
  const netoThn = Math.max(0, brutoThn - bjThn - iuranThn);
  const pkp = Math.floor(Math.max(0, netoThn - ptkp) / 1000) * 1000;
  const { total: pphThn, rinc } = pphProgresif(pkp);
  return { bjThn, netoThn, pkp, pphThn, rinc };
}

// PPh 21 sebulan dengan metode progresif tahunan (disetahunkan).
// Tanpa NPWP, tarifnya 20% lebih tinggi (Pasal 21 ayat 5 UU PPh).
function pphBulanProgresif(brutoBln, iuranBln, ptkp, punyaNpwp) {
  const brutoThn = brutoBln * 12;
  const bjBln = Math.min(brutoBln * 0.05, 500000); // biaya jabatan 5%, maks 500rb/bln
  const netoBln = brutoBln - bjBln - iuranBln;
  const netoThn = netoBln * 12;
  const pkp = Math.floor(Math.max(0, netoThn - ptkp) / 1000) * 1000;
  const { total, rinc } = pphProgresif(pkp);
  const kali = punyaNpwp === false ? 1.2 : 1;
  const pphThn = Math.round(total * kali);
  const rincAdj = rinc.map((x) => ({ label: x.label, kena: x.kena, pajak: Math.round(x.pajak * kali) }));
  return { brutoThn, bjBln, netoBln, netoThn, pkp, pphThn, pphBln: Math.round(pphThn / 12), rinc: rincAdj };
}

// Gross-up: cari gaji bruto supaya setelah dipotong PPh 21 (progresif) dan iuran,
// yang diterima sama dengan target. Diselesaikan dengan bagi dua (bisection).
function grossUp(targetThp, iuranBln, ptkp, punyaNpwp) {
  const thp = (bruto) => bruto - pphBulanProgresif(bruto, iuranBln, ptkp, punyaNpwp).pphBln - iuranBln;
  let lo = targetThp + iuranBln, hi = Math.max(lo * 1.5, lo + 1000000);
  for (let i = 0; i < 60 && thp(hi) < targetThp; i++) hi = lo + (hi - lo) * 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (thp(mid) < targetThp) lo = mid; else hi = mid;
  }
  const bruto = Math.round((lo + hi) / 2);
  const r = pphBulanProgresif(bruto, iuranBln, ptkp, punyaNpwp);
  return { bruto, pphBln: r.pphBln, pphThn: r.pphThn, pkp: r.pkp, thp: bruto - r.pphBln - iuranBln };
}

// PPh 21 atas THR/bonus: selisih PPh setahun dengan THR dan tanpa THR
// (cara resmi untuk penghasilan tidak teratur, PER-16/PJ/2016).
function pphThr(brutoBln, thr, iuranBln, ptkp, punyaNpwp) {
  const kali = punyaNpwp === false ? 1.2 : 1;
  const biasa = pphTahunan(brutoBln * 12, iuranBln * 12, ptkp);
  const dengan = pphTahunan(brutoBln * 12 + thr, iuranBln * 12, ptkp);
  const pph = Math.round((dengan.pphThn - biasa.pphThn) * kali);
  return { pph, bersih: Math.max(0, thr - pph), pphThnBiasa: Math.round(biasa.pphThn * kali), pphThnDengan: Math.round(dengan.pphThn * kali), pkpBiasa: biasa.pkp, pkpDengan: dengan.pkp };
}

// Logika murni (bisa di-test di Node).
utils.pph21Ter = (bruto, status) => terRate(bruto, status);
utils.pph21Progresif = (brutoBln, iuranBln, status, punyaNpwp) => pphBulanProgresif(brutoBln, iuranBln, PTKP[status] || 54000000, punyaNpwp);
utils.pph21GrossUp = (targetThp, iuranBln, status, punyaNpwp) => grossUp(targetThp, iuranBln, PTKP[status] || 54000000, punyaNpwp);
utils.pph21Thr = (brutoBln, thr, iuranBln, status, punyaNpwp) => pphThr(brutoBln, thr, iuranBln, PTKP[status] || 54000000, punyaNpwp);

export const meta = {"id": "pph21", "name": "Kalkulator PPh 21", "cat": "indonesia", "icon": "🧾", "desc": "Hitung PPh 21 karyawan: progresif, TER bulanan, gross-up, atau THR/bonus.", "keywords": "gaji,pajak,penghasilan,pph,karyawan,ter,gross-up,ptkp,thr,bonus,npwp"};
export function render(root) {

    const modeSel = T.select([
      ['progresif', 'Progresif tahunan (disetahunkan)'],
      ['ter', 'TER bulanan (potongan Januari-November)'],
      ['grossup', 'Gross-up (cari gaji bruto dari target bersih)'],
      ['thr', 'THR / bonus (dihitung dari selisih setahun)'],
    ], 'progresif');
    const gaji = money(null, 'cth: 12000000');
    const tunj = money(null, 'cth: 2000000', '0');
    const iuran = money(null, 'cth: 240000 (JHT 2%)', '0');
    const target = money(null, 'cth: 10000000');
    const thr = money(null, 'cth: 12000000');
    const npwpSel = T.select([
      ['ya', 'Punya NPWP'],
      ['tidak', 'Tidak punya NPWP (pajaknya 20% lebih tinggi)'],
    ], 'ya');
    const status = T.select(Object.keys(PTKP).map((k) => [k, PTKP_LABEL[k]]), 'TK/0');
    const box = T.out();

    const fldGaji = T.field('Gaji pokok / bulan (Rp)', gaji);
    const fldTunj = T.field('Tunjangan / bulan (Rp)', tunj, 'THR & bonus tidak dihitung di sini, pakai mode THR / bonus di atas');
    const fldIuran = T.field('Iuran pensiun / JHT / bulan (Rp)', iuran, 'Biasanya 2% dari gaji (JHT)');
    const fldTarget = T.field('Target gaji bersih / bulan (Rp)', target, 'Jumlah yang mau diterima setelah dipotong PPh 21 dan iuran');
    const fldThr = T.field('THR / bonus yang diterima (Rp)', thr, 'Jumlah kotor sebelum dipotong pajak');
    const fldNpwp = T.field('NPWP', npwpSel, 'Tanpa NPWP, PPh 21 dikenakan 20% lebih tinggi (Pasal 21 ayat 5 UU PPh)');
    const fldStatus = T.field('Status PTKP', status);
    fldTarget.hidden = true;
    fldThr.hidden = true;

    const aturTampil = () => {
      const mode = modeSel.value;
      fldGaji.hidden = true; fldTunj.hidden = true; fldIuran.hidden = true; fldTarget.hidden = true; fldStatus.hidden = true;
      fldThr.hidden = true;
      fldStatus.hidden = false;
      if (mode === 'grossup') { fldTarget.hidden = false; fldIuran.hidden = false; }
      else if (mode === 'ter') { fldGaji.hidden = false; fldTunj.hidden = false; }
      else if (mode === 'thr') { fldGaji.hidden = false; fldTunj.hidden = false; fldIuran.hidden = false; fldThr.hidden = false; }
      else { fldGaji.hidden = false; fldTunj.hidden = false; fldIuran.hidden = false; }
      hitung();
    };
    modeSel.addEventListener('change', aturTampil);

    const hitung = () => {
      const mode = modeSel.value;
      const g = T.num(gaji.value) || 0, t = T.num(tunj.value) || 0, iu = T.num(iuran.value) || 0;
      const ptkp = PTKP[status.value];
      const punyaNpwp = npwpSel.value === 'ya';

      if (mode === 'grossup') {
        const tg = T.num(target.value) || 0;
        if (tg <= 0) { T.show(box, '<p class="warn">Isi dulu target gaji bersih per bulan.</p>'); return; }
        const r = grossUp(tg, iu, ptkp, punyaNpwp);
        T.show(box,
          '<div class="big">' + T.rp(r.bruto) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
          '<p class="center mut">Gaji bruto yang dibutuhkan supaya bersihnya ' + T.rp(tg) + '</p>' +
          kv('PPh 21 / bulan (ditanggung perusahaan)', T.rp(r.pphBln)) +
          kv('PPh 21 setahun', T.rp(r.pphThn)) +
          kv('Iuran pensiun / JHT / bulan', T.rp(iu)) +
          kv('PKP setahun', T.rp(r.pkp)) +
          kv('Gaji bersih yang diterima', '<b>' + T.rp(Math.round(r.thp)) + '</b>') +
          '<p class="hint">Gross-up dihitung dengan metode progresif tahunan (Pasal 17 UU PPh): perusahaan menaikkan gaji bruto supaya pajaknya tertutup dan karyawan tetap menerima jumlah bersih yang ditargetkan. Selisih pembulatan beberapa rupiah wajar.</p>');
        return;
      }

      if (g <= 0) { T.show(box, '<p class="warn">Isi dulu gaji pokok per bulan.</p>'); return; }
      const brutoBln = g + t;

      if (mode === 'thr') {
        const th = T.num(thr.value) || 0;
        if (th <= 0) { T.show(box, '<p class="warn">Isi dulu jumlah THR / bonusnya.</p>'); return; }
        const r = pphThr(brutoBln, th, iu, ptkp, punyaNpwp);
        T.show(box,
          '<div class="big">' + T.rp(r.pph) + '</div>' +
          '<p class="center mut">PPh 21 atas THR / bonus</p>' +
          kv('THR / bonus kotor', T.rp(th)) +
          kv('THR / bonus bersih yang diterima', '<b>' + T.rp(r.bersih) + '</b>') +
          '<h3 style="font-size:14px;margin:10px 0 4px">Cara hitungnya</h3>' +
          kv('PPh setahun tanpa THR', T.rp(r.pphThnBiasa)) +
          kv('PPh setahun dengan THR', T.rp(r.pphThnDengan)) +
          kv('Selisih = PPh atas THR', T.rp(r.pph)) +
          '<p class="hint">THR dan bonus adalah penghasilan tidak teratur: pajaknya dihitung dari selisih PPh setahun dengan dan tanpa THR (PER-16/PJ/2016), bukan dari tarif bulanan. Karena itu potongannya bisa terasa lebih besar bila THR mendorong penghasilan ke lapisan tarif yang lebih tinggi.' + (punyaNpwp ? '' : ' Tanpa NPWP, angkanya sudah dikali 120%.') + '</p>');
        return;
      }

      if (mode === 'ter') {
        const tr = terRate(brutoBln, status.value);
        if (!tr) { T.show(box, '<p class="warn">TER tidak mengatur status gabungan K/I. Pakai mode progresif tahunan untuk status ini.</p>'); return; }
        const pphBln = Math.round(brutoBln * tr.tarif / 100 * (punyaNpwp ? 1 : 1.2));
        const takeHome = Math.round(brutoBln - pphBln);
        T.show(box,
          '<div class="big">' + T.rp(pphBln) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
          '<p class="center mut">Potongan PPh 21 bulan ini (Januari-November)</p>' +
          kv('Penghasilan bruto / bulan', T.rp(brutoBln)) +
          kv('Kategori TER (' + T.esc(status.value) + ')', 'Kategori ' + tr.kat) +
          kv('Tarif efektif rata-rata', T.esc(String(tr.tarif)) + '%' + (punyaNpwp ? '' : ' × 120% (tanpa NPWP)')) +
          kv('PPh 21 / bulan', T.rp(pphBln)) +
          kv('Sisa setelah PPh 21', '<b>' + T.rp(takeHome) + '</b>') +
          '<p class="hint">Sejak Januari 2024, PPh 21 pegawai tetap untuk Januari-November dihitung dari bruto sebulan dikali TER, tanpa mengurangi biaya jabatan atau PTKP dulu (PP 58/2023, PMK 168/2023). Di bulan terakhir (Desember atau saat berhenti kerja), pajak dihitung ulang setahun penuh dengan tarif progresif dikurangi potongan yang sudah dibayar. Sisa di atas belum dipotong iuran BPJS bagian karyawan.</p>');
        return;
      }

      const r = pphBulanProgresif(brutoBln, iu, ptkp, punyaNpwp);
      const pphBln = r.pphBln;
      const takeHome = Math.round(brutoBln - pphBln - iu);
      let rincHtml = '';
      for (const x of r.rinc) {
        rincHtml += kv('Lapisan ' + x.label + ' × ' + T.rp(x.kena), T.rp(Math.round(x.pajak)));
      }
      T.show(box,
        '<div class="big">' + T.rp(pphBln) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
        kv('PPh 21 setahun', T.rp(r.pphThn)) +
        kv('Take-home pay / bulan', '<b>' + T.rp(takeHome) + '</b>') +
        '<h3 style="font-size:14px;margin:10px 0 4px">Rincian</h3>' +
        kv('Bruto setahun', T.rp(r.brutoThn)) +
        kv('Biaya jabatan (5%, maks 500rb/bln)', T.rp(Math.round(r.bjBln * 12))) +
        kv('Iuran pensiun / JHT setahun', T.rp(Math.round(iu * 12))) +
        kv('Penghasilan neto setahun', T.rp(Math.round(r.netoThn))) +
        kv('PTKP (' + T.esc(status.value) + ')', T.rp(ptkp)) +
        kv('PKP (dibulatkan ke bawah ribuan)', T.rp(r.pkp)) +
        rincHtml +
        '<p class="hint">Metode progresif tahunan (disetahunkan) sesuai Pasal 17 UU PPh. Untuk potongan di slip gaji Januari-November, pemberi kerja memakai tarif efektif rata-rata (TER) bulanan (PP 58/2023). Pindah ke mode TER bulanan di atas untuk melihatnya. Total setahun kedua cara sama setelah rekonsiliasi Desember.' + (punyaNpwp ? '' : ' Tanpa NPWP, PPh di atas sudah dikali 120%.') + '</p>');
    };
    [gaji, tunj, iuran, target, thr].forEach((i) => i.addEventListener('input', hitung));
    status.addEventListener('change', hitung);
    npwpSel.addEventListener('change', hitung);

    root.appendChild(T.field('Mode perhitungan', modeSel));
    root.appendChild(fldGaji);
    root.appendChild(fldTunj);
    root.appendChild(fldTarget);
    root.appendChild(fldThr);
    root.appendChild(fldIuran);
    root.appendChild(fldNpwp);
    root.appendChild(fldStatus);
    root.appendChild(T.row(T.btn('Hitung PPh 21', hitung, true)));
    root.appendChild(box);

}
