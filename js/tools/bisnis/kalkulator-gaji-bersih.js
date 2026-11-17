import { h as T, utils } from '../../core.js';

// Tarif Efektif Rata-rata (TER) bulanan, Lampiran PP 58/2023.
// Tiap baris: [batas atas bruto sebulan, tarif %]. Batas atas termasuk di baris itu.
// Kategori A: TK/0, TK/1, K/0. Kategori B: TK/2, TK/3, K/1, K/2. Kategori C: K/3.
const TER_A = [[5400000,0],[5650000,0.25],[5950000,0.5],[6300000,0.75],[6750000,1],[7500000,1.25],[8550000,1.5],[9650000,1.75],[10050000,2],[10350000,2.25],[10700000,2.5],[11050000,3],[11600000,3.5],[12500000,4],[13750000,5],[15100000,6],[16950000,7],[19750000,8],[24150000,9],[26450000,10],[28000000,11],[30050000,12],[32400000,13],[35400000,14],[39100000,15],[43850000,16],[47800000,17],[51400000,18],[56300000,19],[62200000,20],[68600000,21],[77500000,22],[89000000,23],[103000000,24],[125000000,25],[157000000,26],[206000000,27],[337000000,28],[454000000,29],[550000000,30],[695000000,31],[910000000,32],[1400000000,33],[Infinity,34]];
const TER_B = [[6200000,0],[6500000,0.25],[6850000,0.5],[7300000,0.75],[9200000,1],[10750000,1.5],[11250000,2],[11600000,2.5],[12600000,3],[13600000,4],[14950000,5],[16400000,6],[18450000,7],[21850000,8],[26000000,9],[27700000,10],[29350000,11],[31450000,12],[33950000,13],[37100000,14],[41100000,15],[45800000,16],[49500000,17],[53800000,18],[58500000,19],[64000000,20],[71000000,21],[80000000,22],[93000000,23],[109000000,24],[129000000,25],[163000000,26],[211000000,27],[374000000,28],[459000000,29],[555000000,30],[704000000,31],[957000000,32],[1405000000,33],[Infinity,34]];
const TER_C = [[6600000,0],[6950000,0.25],[7350000,0.5],[7800000,0.75],[8850000,1],[9800000,1.25],[10950000,1.5],[11200000,1.75],[12050000,2],[12950000,3],[14150000,4],[15550000,5],[17050000,6],[19500000,7],[22700000,8],[26600000,9],[28100000,10],[30100000,11],[32600000,12],[35400000,13],[38900000,14],[43000000,15],[47400000,16],[51200000,17],[55800000,18],[60400000,19],[66700000,20],[74500000,21],[83200000,22],[95600000,23],[110000000,24],[134000000,25],[169000000,26],[221000000,27],[390000000,28],[463000000,29],[561000000,30],[709000000,31],[965000000,32],[1419000000,33],[Infinity,34]];
const TER_KAT = { 'TK/0': 'A', 'TK/1': 'A', 'K/0': 'A', 'TK/2': 'B', 'TK/3': 'B', 'K/1': 'B', 'K/2': 'B', 'K/3': 'C' };
// PTKP setahun (Rp): PMK 101/2016 — 54 jt + 4,5 jt per tanggungan,
// + 4,5 jt bila kawin. Dipakai saat hitung ulang PPh 21 bulan Desember.
const PTKP_NOMINAL = { 'TK/0': 54000000, 'TK/1': 58500000, 'TK/2': 63000000, 'TK/3': 67500000, 'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000 };

// Iuran BPJS Ketenagakerjaan porsi pemberi kerja (PP 44/2015 & PP 45/2015):
// JKK 0,24%–1,74% (menurut kelas risiko pekerjaan), JKM 0,3%, JHT 3,7%, JP 2%.
// Batas upah (mis. JP) tidak diterapkan di sini — lihat catatan di bawah.
const IURAN_PERUSAHAAN = { jkm: 0.3, jht: 3.7, jp: 2 };

function terRate(bruto, status) {
  const kat = TER_KAT[status];
  if (!kat) return null;
  const tbl = kat === 'A' ? TER_A : kat === 'B' ? TER_B : TER_C;
  for (const [atas, tarif] of tbl) if (bruto <= atas) return { kat, tarif };
  return { kat, tarif: 34 };
}

// Gross-up: cari penghasilan bruto supaya setelah dipotong BPJS, JHT, PPh 21 (TER)
// dan potongan lain, yang diterima sama dengan target. Iterasi titik tetap.
function grossUpBersih(target, bp, jp, lain, pphOn, status) {
  if (!Number.isFinite(target) || !(target > 0)) return null;
  let bruto = target + lain;
  for (let i = 0; i < 60; i++) {
    const tr = pphOn ? terRate(bruto, status) : null;
    const rate = tr ? tr.tarif / 100 : 0;
    const denom = 1 - bp / 100 - jp / 100 - rate;
    if (denom <= 0) return null;
    const next = (target + lain) / denom;
    if (Math.abs(next - bruto) < 1) { bruto = next; break; }
    bruto = next;
  }
  return bruto;
}

// Iuran porsi perusahaan dari penghasilan bruto. jkkPct bisa diubah
// (0,24–1,74% menurut risiko pekerjaan); JKM/JHT/JP memakai tarif tetap.
function iuranPerusahaan(bruto, jkkPct) {
  // Kalikan dengan tarif/100 dulu: bruto * tarif bisa meluber ke Infinity
  // sebelum dibagi 100 bila bruto sangat besar (pola yang sama dengan NaN
  // pajak THR di atas).
  const jkk = bruto * (Math.max(0, jkkPct || 0) / 100);
  const jkm = bruto * (IURAN_PERUSAHAAN.jkm / 100);
  const jht = bruto * (IURAN_PERUSAHAAN.jht / 100);
  const jp = bruto * (IURAN_PERUSAHAAN.jp / 100);
  return { jkk, jkm, jht, jp, total: jkk + jkm + jht + jp };
}

// Pajak atas THR (1x gaji bruto) dengan metode TER: di bulan THR diterima,
// penghasilan bruto bulan itu = gaji + THR, sehingga tarif TER ditentukan
// dari jumlah gabungan itu. Pajak THR = PPh bulan THR − PPh bulan biasa.
function pajakThr(gajiBruto, thr, pphOn, status) {
  if (!pphOn || !(thr > 0)) return 0;
  // Gaji 1e308: gaji+THR = Infinity dan 1e308*34 meluber sebelum dibagi 100
  // → Infinity−Infinity = NaN (THR bersih tampil Rp0). Tolak sejak awal.
  if (!Number.isFinite(gajiBruto) || !Number.isFinite(thr) || !Number.isFinite(gajiBruto + thr)) return 0;
  const trBiasa = terRate(gajiBruto, status);
  const trThr = terRate(gajiBruto + thr, status);
  const pphBiasa = trBiasa ? gajiBruto * (trBiasa.tarif / 100) : 0;
  const pphGabung = trThr ? (gajiBruto + thr) * (trThr.tarif / 100) : 0;
  return Math.max(0, pphGabung - pphBiasa);
}

// Logika murni (bisa di-test di Node).
utils.gajiBersihTer = (bruto, status) => terRate(bruto, status);
utils.gajiBersihGrossUp = (target, bp, jp, lain, pphOn, status) => grossUpBersih(target, bp, jp, lain, pphOn, status);
utils.gajiBersihIuranPerusahaan = (bruto, jkkPct) => iuranPerusahaan(bruto, jkkPct);
utils.gajiBersihPajakThr = (gajiBruto, thr, pphOn, status) => pajakThr(gajiBruto, thr, pphOn, status);

export const meta = {"id": "kalkulator-gaji-bersih", "name": "Kalkulator Gaji Bersih", "cat": "bisnis", "icon": "💰", "desc": "Gaji pokok + tunjangan − BPJS, PPh 21 (TER), & potongan = take-home pay. Ada gross-up, iuran perusahaan, pajak THR & banding tawaran.", "keywords": "gaji,bersih,take home pay,bpjs,jht,potongan,tunjangan,payroll,thr,pph 21,ter,gross-up,ptkp,jkk,jkm,jp,iuran perusahaan"};
export function render(root) {
  let bpjsPct = 1, jhtPct = 2, jkkPct = 0.24;
  try {
    const b = parseFloat(localStorage.getItem('kalkulator-gaji-bersih-bpjs'));
    if (b >= 0 && b <= 100) bpjsPct = b;
    const j = parseFloat(localStorage.getItem('kalkulator-gaji-bersih-jht'));
    if (j >= 0 && j <= 100) jhtPct = j;
    const k = parseFloat(localStorage.getItem('kalkulator-gaji-bersih-jkk'));
    if (k >= 0 && k <= 100) jkkPct = k;
  } catch (e) { /* abaikan */ }

  const pokokI = T.input('text', 'cth: 5000000'); pokokI.inputMode = 'decimal';
  const bpjsI = T.input('text', 'cth: 1', String(bpjsPct)); bpjsI.inputMode = 'decimal';
  const jhtI = T.input('text', 'cth: 2', String(jhtPct)); jhtI.inputMode = 'decimal';
  const jkkI = T.input('text', 'cth: 0.24', String(jkkPct)); jkkI.inputMode = 'decimal';
  const pphSel = T.select([
    ['tidak', 'Tidak, tanpa PPh 21'],
    ['ya', 'Ya, potong PPh 21 (TER bulanan)'],
  ], 'tidak');
  const statusSel = T.select([
    ['TK/0', 'TK/0: Belum kawin, tanpa tanggungan'],
    ['TK/1', 'TK/1: Belum kawin, 1 tanggungan'],
    ['TK/2', 'TK/2: Belum kawin, 2 tanggungan'],
    ['TK/3', 'TK/3: Belum kawin, 3 tanggungan'],
    ['K/0', 'K/0: Kawin, tanpa tanggungan'],
    ['K/1', 'K/1: Kawin, 1 tanggungan'],
    ['K/2', 'K/2: Kawin, 2 tanggungan'],
    ['K/3', 'K/3: Kawin, 3 tanggungan'],
  ], 'TK/0');
  const jamI = T.input('text', 'cth: 8', '8'); jamI.inputMode = 'decimal';
  const hariI = T.input('text', 'cth: 5', '5'); hariI.inputMode = 'decimal';
  const targetI = T.input('text', 'cth: 8000000'); targetI.inputMode = 'decimal';
  const pokokBI = T.input('text', 'cth: 6000000'); pokokBI.inputMode = 'decimal';
  const tunjBI = T.input('text', 'cth: 1000000 (opsional)', '0'); tunjBI.inputMode = 'decimal';
  const tunjBox = T.el('<div></div>');
  const potBox = T.el('<div></div>');
  const box = T.out();
  const bandingBox = T.out();
  const grossBox = T.out();

  const fldStatus = T.field('Status PTKP', statusSel, 'Menentukan kategori TER (A, B, atau C)');
  fldStatus.hidden = true;
  pphSel.addEventListener('change', () => { fldStatus.hidden = pphSel.value !== 'ya'; hitung(); });

  let tunj = [{ nama: 'Tunjangan makan', jumlah: '' }];
  let potLain = [];

  const rowHtml = (rows) => rows.map((r, i) =>
    '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
    '<input class="inp" data-k="nama" data-i="' + i + '" placeholder="Nama" value="' + T.esc(r.nama) + '" style="flex:2"/>' +
    '<input class="inp" data-k="jumlah" data-i="' + i + '" placeholder="Rp" value="' + T.esc(r.jumlah) + '" inputmode="decimal" style="flex:1"/>' +
    '<button class="btn" data-del="' + i + '" aria-label="Hapus baris ' + (i + 1) + '" style="flex-shrink:0">✕</button>' +
    '</div>').join('');

  const bindRows = (boxEl, rows, rerender) => {
    boxEl.querySelectorAll('input[data-k]').forEach((el) => {
      el.addEventListener('input', () => {
        rows[Number(el.dataset.i)][el.dataset.k] = el.value;
        hitung();
      });
    });
    boxEl.querySelectorAll('[data-del]').forEach((b) => {
      b.addEventListener('click', () => {
        rows.splice(Number(b.dataset.del), 1);
        rerender();
        hitung();
      });
    });
  };

  const renderTunj = () => {
    tunjBox.innerHTML = rowHtml(tunj) + '<button class="btn" data-add="1">＋ Tambah tunjangan</button>';
    tunjBox.querySelector('[data-add]').addEventListener('click', () => {
      tunj.push({ nama: '', jumlah: '' });
      renderTunj(); hitung();
    });
    bindRows(tunjBox, tunj, renderTunj);
  };
  const renderPot = () => {
    potBox.innerHTML = (potLain.length ? rowHtml(potLain) : '<p class="hint" style="margin-bottom:8px">Belum ada potongan lain.</p>') +
      '<button class="btn" data-add="1">＋ Tambah potongan</button>';
    potBox.querySelector('[data-add]').addEventListener('click', () => {
      potLain.push({ nama: '', jumlah: '' });
      renderPot(); hitung();
    });
    bindRows(potBox, potLain, renderPot);
  };

  const sumRows = (rows) => rows.reduce((a, r) => a + (T.num(r.jumlah) || 0), 0);
  let slipTerakhir = '';

  const hitung = () => {
    const pokok = T.num(pokokI.value) || 0;
    const bp = T.num(bpjsI.value), jp = T.num(jhtI.value), jk = T.num(jkkI.value);
    if (!(pokok > 0)) { T.hide(box); T.hide(bandingBox); return; }
    if (!isFinite(pokok) || pokok > 1e14) {
      T.show(box, '<p class="warn">Gaji pokok terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return;
    }
    if (!(bp >= 0 && bp <= 100) || !(jp >= 0 && jp <= 100) || !(jk >= 0 && jk <= 100)) {
      T.show(box, '<p class="warn">Persentase BPJS, JHT & JKK harus 0–100%.</p>'); return;
    }
    try {
      localStorage.setItem('kalkulator-gaji-bersih-bpjs', String(bp));
      localStorage.setItem('kalkulator-gaji-bersih-jht', String(jp));
      localStorage.setItem('kalkulator-gaji-bersih-jkk', String(jk));
    } catch (e) { /* abaikan */ }
    const totTunj = sumRows(tunj);
    const gross = pokok + totTunj;
    if (!isFinite(gross) || gross > 1e14) {
      T.show(box, '<p class="warn">Penghasilan bruto terlalu besar (maksimal Rp100 triliun). Periksa lagi gaji pokok & tunjangannya, mungkin ada nol yang kelebihan.</p>'); return;
    }
    const bpjs = gross * bp / 100;
    const jht = gross * jp / 100;
    const lain = sumRows(potLain);
    if (!isFinite(lain) || lain > 1e14) {
      T.show(box, '<p class="warn">Total potongan lain terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>'); return;
    }
    const pphOn = pphSel.value === 'ya';
    const tr = pphOn ? terRate(gross, statusSel.value) : null;
    const pph = tr ? gross * tr.tarif / 100 : 0;
    const thp = gross - bpjs - jht - pph - lain;
    const jamHari = Math.max(1, T.num(jamI.value) || 8);
    const hariMinggu = Math.min(7, Math.max(1, T.num(hariI.value) || 5));
    const thpMinggu = thp * 12 / 52;
    // THR: 1x gaji bruto, dipotong pajak THR (metode TER gabungan).
    const thrKotor = gross;
    const pjkThr = pajakThr(gross, thrKotor, pphOn, statusSel.value);
    const thrBersih = thrKotor - pjkThr;
    // Iuran porsi perusahaan.
    const iur = iuranPerusahaan(gross, jk);
    const biayaPerusahaan = gross + iur.total;
    const baris = (arr, minus) => arr.filter((r) => String(r.nama).trim() && (T.num(r.jumlah) || 0) > 0)
      .map((r) => '<div class="kv"><span class="k">' + T.esc(r.nama) + '</span><span class="v">' + (minus ? '− ' : '') + T.rp(T.num(r.jumlah)) + '</span></div>').join('');
    T.show(box,
      '<div class="kv"><span class="k">Gaji pokok</span><span class="v">' + T.rp(pokok) + '</span></div>' +
      baris(tunj) +
      '<div class="kv"><span class="k"><b>Penghasilan bruto</b></span><span class="v"><b>' + T.rp(gross) + '</b></span></div>' +
      '<div class="kv"><span class="k">BPJS Kesehatan (' + T.esc(String(bp)) + '%)</span><span class="v">− ' + T.rp(bpjs) + '</span></div>' +
      '<div class="kv"><span class="k">JHT (' + T.esc(String(jp)) + '%)</span><span class="v">− ' + T.rp(jht) + '</span></div>' +
      (tr ? '<div class="kv"><span class="k">PPh 21 TER kategori ' + tr.kat + ' (' + T.esc(String(tr.tarif)) + '%)</span><span class="v">− ' + T.rp(pph) + '</span></div>' : '') +
      (tr ? '<div class="kv"><span class="k">PTKP ' + T.esc(statusSel.value) + ' (setahun)</span><span class="v">' + T.rp(PTKP_NOMINAL[statusSel.value] || 54000000) + '</span></div>' : '') +
      baris(potLain, true) +
      '<div class="kv total"><span class="k"><b>Take-home pay</b></span><span class="v"><b>' + T.rp(thp) + '</b></span></div>' +
      '<div class="big center" style="margin-top:10px">' + T.rp(thp) + ' <span class="mut" style="font-size:14px">/ bulan</span></div>' +
      '<h3 style="font-size:14px;margin:12px 0 4px">Take-home pay per periode</h3>' +
      '<div class="kv"><span class="k">Per jam (' + T.esc(String(jamHari)) + ' jam/hari)</span><span class="v">' + T.rp(Math.round(thpMinggu / hariMinggu / jamHari)) + '</span></div>' +
      '<div class="kv"><span class="k">Per hari (' + T.esc(String(hariMinggu)) + ' hari/minggu)</span><span class="v">' + T.rp(Math.round(thpMinggu / hariMinggu)) + '</span></div>' +
      '<div class="kv"><span class="k">Per minggu</span><span class="v">' + T.rp(Math.round(thpMinggu)) + '</span></div>' +
      '<div class="kv"><span class="k">Per tahun</span><span class="v">' + T.rp(Math.round(thp * 12)) + '</span></div>' +
      '<div class="kv"><span class="k">THR 1x gaji bruto (kotor)</span><span class="v">' + T.rp(Math.round(thrKotor)) + '</span></div>' +
      (pphOn ? '<div class="kv"><span class="k">Pajak THR</span><span class="v">− ' + T.rp(Math.round(pjkThr)) + '</span></div>' : '') +
      '<div class="kv"><span class="k">THR bersih</span><span class="v"><b>' + T.rp(Math.round(thrBersih)) + '</b></span></div>' +
      '<div class="kv"><span class="k">Per tahun + THR bersih</span><span class="v">' + T.rp(Math.round(thp * 12 + thrBersih)) + '</span></div>' +
      '<p class="hint">Pajak THR dihitung dengan tarif TER bulan THR diterima (gaji + THR digabung, lalu dikurangi PPh bulan biasa). Besaran THR umumnya 1x gaji sebulan bagi yang sudah kerja setahun, prorata bila kurang dari setahun.</p>' +
      '<h3 style="font-size:14px;margin:12px 0 4px">Yang dibayar perusahaan (di luar gaji)</h3>' +
      '<div class="kv"><span class="k">JKK (' + T.esc(String(jk)) + '%)</span><span class="v">' + T.rp(Math.round(iur.jkk)) + '</span></div>' +
      '<div class="kv"><span class="k">JKM (0,3%)</span><span class="v">' + T.rp(Math.round(iur.jkm)) + '</span></div>' +
      '<div class="kv"><span class="k">JHT porsi perusahaan (3,7%)</span><span class="v">' + T.rp(Math.round(iur.jht)) + '</span></div>' +
      '<div class="kv"><span class="k">JP porsi perusahaan (2%)</span><span class="v">' + T.rp(Math.round(iur.jp)) + '</span></div>' +
      '<div class="kv"><span class="k"><b>Total biaya perusahaan / bulan</b></span><span class="v"><b>' + T.rp(Math.round(biayaPerusahaan)) + '</b></span></div>' +
      '<div class="kv"><span class="k">Yang diterima karyawan (THP)</span><span class="v">' + T.rp(Math.round(thp)) + '</span></div>' +
      '<p class="hint">Iuran di atas dibayar perusahaan di luar gajimu, jadi tidak memotong THP. JKK 0,24%–1,74% tergantung risiko pekerjaanmu (kantoran umumnya 0,24%). Batas upah BPJS (mis. JP) belum diterapkan di hitungan ini.</p>');
    box.appendChild(T.row(T.btn('Salin rincian (teks slip)', () => {
      if (slipTerakhir) T.copy(slipTerakhir);
      else T.toast('Hitung dulu gajinya');
    })));

    // Teks slip untuk disalin.
    const garis = (k, v) => k + ': ' + v + '\n';
    let slip = 'RINCIAN GAJI\n';
    slip += garis('Gaji pokok', T.rp(pokok));
    tunj.filter((r) => String(r.nama).trim() && (T.num(r.jumlah) || 0) > 0).forEach((r) => { slip += garis(r.nama, T.rp(T.num(r.jumlah))); });
    slip += garis('Penghasilan bruto', T.rp(gross));
    slip += garis('BPJS Kesehatan (' + bp + '%)', '- ' + T.rp(bpjs));
    slip += garis('JHT (' + jp + '%)', '- ' + T.rp(jht));
    if (tr) slip += garis('PPh 21 TER kategori ' + tr.kat + ' (' + tr.tarif + '%)', '- ' + T.rp(pph));
    potLain.filter((r) => String(r.nama).trim() && (T.num(r.jumlah) || 0) > 0).forEach((r) => { slip += garis(r.nama, '- ' + T.rp(T.num(r.jumlah))); });
    slip += garis('Take-home pay / bulan', T.rp(thp));
    slip += garis('THR bersih (1x bruto)', T.rp(Math.round(thrBersih)));
    slip += garis('Per tahun + THR bersih', T.rp(Math.round(thp * 12 + thrBersih)));
    slip += garis('Total biaya perusahaan / bulan', T.rp(Math.round(biayaPerusahaan)));
    slipTerakhir = slip;

    // Banding 2 tawaran
    const pokokB = T.num(pokokBI.value) || 0;
    if (pokokB > 1e14) {
      T.show(bandingBox, '<p class="warn">Gaji pokok tawaran B terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>');
    } else if (pokokB > 0) {
      const tunjB = Math.max(0, T.num(tunjBI.value) || 0);
      const grossB = pokokB + tunjB;
      const bpjsB = grossB * bp / 100;
      const jhtB = grossB * jp / 100;
      const trB = pphOn ? terRate(grossB, statusSel.value) : null;
      const pphB = trB ? grossB * trB.tarif / 100 : 0;
      const thpB = grossB - bpjsB - jhtB - pphB;
      const iurB = iuranPerusahaan(grossB, jk);
      T.show(bandingBox,
        '<h3 style="font-size:14px;margin:14px 0 6px">Banding 2 tawaran gaji</h3>' +
        '<div style="overflow-x:auto"><table class="tbl"><tr><th></th><th>A (saat ini)</th><th>B</th><th>Selisih (B − A)</th></tr>' +
        '<tr><td>Gaji pokok</td><td>' + T.rp(pokok) + '</td><td>' + T.rp(pokokB) + '</td><td>' + T.rp(pokokB - pokok) + '</td></tr>' +
        '<tr><td>Tunjangan</td><td>' + T.rp(totTunj) + '</td><td>' + T.rp(tunjB) + '</td><td>' + T.rp(tunjB - totTunj) + '</td></tr>' +
        '<tr><td>Penghasilan bruto</td><td>' + T.rp(gross) + '</td><td>' + T.rp(grossB) + '</td><td>' + T.rp(grossB - gross) + '</td></tr>' +
        '<tr><td>BPJS + JHT</td><td>− ' + T.rp(bpjs + jht) + '</td><td>− ' + T.rp(bpjsB + jhtB) + '</td><td>' + T.rp((bpjsB + jhtB) - (bpjs + jht)) + '</td></tr>' +
        '<tr><td>PPh 21</td><td>− ' + T.rp(pph) + '</td><td>− ' + T.rp(pphB) + '</td><td>' + T.rp(pphB - pph) + '</td></tr>' +
        (lain > 0 ? '<tr><td>Potongan lain (hanya A)</td><td>− ' + T.rp(lain) + '</td><td>—</td><td></td></tr>' : '') +
        '<tr><td><b>Take-home pay</b></td><td><b>' + T.rp(thp) + '</b></td><td><b>' + T.rp(thpB) + '</b></td><td><b>' + T.rp(thpB - thp) + '</b></td></tr>' +
        '<tr><td>Total biaya perusahaan</td><td>' + T.rp(Math.round(biayaPerusahaan)) + '</td><td>' + T.rp(Math.round(grossB + iurB.total)) + '</td><td>' + T.rp(Math.round((grossB + iurB.total) - biayaPerusahaan)) + '</td></tr></table></div>' +
        '<p class="hint">Tawaran B memakai persentase iuran, pengaturan PPh 21, dan status PTKP yang sama dengan A. Potongan lain (koperasi, kasbon, dsb.) hanya berlaku untuk A.</p>');
    } else {
      T.hide(bandingBox);
    }
  };

  const hitungGrossUp = () => {
    const target = T.num(targetI.value) || 0;
    if (!(target > 0)) { T.show(grossBox, '<p class="warn">Isi dulu target gaji bersih per bulan.</p>'); return; }
    if (!isFinite(target) || target > 1e14) { T.show(grossBox, '<p class="warn">Target terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>'); return; }
    const bp = T.num(bpjsI.value), jp = T.num(jhtI.value);
    if (!(bp >= 0 && bp <= 100) || !(jp >= 0 && jp <= 100)) {
      T.show(grossBox, '<p class="warn">Persentase BPJS & JHT harus 0–100%.</p>'); return;
    }
    const lain = sumRows(potLain);
    const pphOn = pphSel.value === 'ya';
    const bruto = grossUpBersih(target, bp, jp, lain, pphOn, statusSel.value);
    if (bruto == null) { T.show(grossBox, '<p class="warn">Total persentase potongan 100% atau lebih, gross-up tidak bisa dihitung.</p>'); return; }
    const tr = pphOn ? terRate(bruto, statusSel.value) : null;
    const pph = tr ? bruto * tr.tarif / 100 : 0;
    const cek = bruto - bruto * bp / 100 - bruto * jp / 100 - pph - lain;
    T.show(grossBox,
      '<div class="big">' + T.rp(Math.round(bruto)) + '<span style="font-size:13px;font-weight:400"> / bulan</span></div>' +
      '<p class="center mut">Penghasilan bruto yang dibutuhkan</p>' +
      '<div class="kv"><span class="k">BPJS Kesehatan (' + T.esc(String(bp)) + '%)</span><span class="v">− ' + T.rp(Math.round(bruto * bp / 100)) + '</span></div>' +
      '<div class="kv"><span class="k">JHT (' + T.esc(String(jp)) + '%)</span><span class="v">− ' + T.rp(Math.round(bruto * jp / 100)) + '</span></div>' +
      (tr ? '<div class="kv"><span class="k">PPh 21 TER kategori ' + tr.kat + ' (' + T.esc(String(tr.tarif)) + '%)</span><span class="v">− ' + T.rp(Math.round(pph)) + '</span></div>' : '') +
      (lain > 0 ? '<div class="kv"><span class="k">Potongan lain</span><span class="v">− ' + T.rp(lain) + '</span></div>' : '') +
      '<div class="kv total"><span class="k"><b>Cek: gaji bersih yang diterima</b></span><span class="v"><b>' + T.rp(Math.round(cek)) + '</b></span></div>' +
      '<p class="hint">Gross-up memakai persentase BPJS dan JHT di atas' + (pphOn ? ' plus PPh 21 TER sesuai status PTKP' : '') + '. Bila perusahaan menanggung pajak, angka bruto ini yang dinegosiasikan sebagai gaji.</p>');
  };

  [pokokI, bpjsI, jhtI, jkkI, jamI, hariI, pokokBI, tunjBI].forEach((i) => i.addEventListener('input', hitung));
  statusSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Hitung gaji yang beneran masuk rekening: gaji pokok + tunjangan, dikurangi BPJS, JHT, PPh 21, dan potongan lain. Persentase iurannya bisa disesuaikan.</p>'));
  root.appendChild(T.field('Gaji pokok (Rp)', pokokI));
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Tunjangan</p>'));
  root.appendChild(tunjBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Potongan iuran (dari penghasilan bruto, tersimpan otomatis)</p>'));
  root.appendChild(T.grid2(
    T.field('BPJS Kesehatan (%)', bpjsI),
    T.field('JHT (%)', jhtI)
  ));
  root.appendChild(T.field('JKK porsi perusahaan (%)', jkkI, '0,24%–1,74% tergantung risiko pekerjaan. Kantoran umumnya 0,24%.'));
  root.appendChild(T.field('Potong PPh 21?', pphSel, 'TER bulanan dipakai pemberi kerja untuk potongan Januari-November (PP 58/2023)'));
  root.appendChild(fldStatus);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Potongan lain</p>'));
  root.appendChild(potBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Konversi periode (untuk baris per jam/hari/minggu)</p>'));
  root.appendChild(T.grid2(
    T.field('Jam kerja / hari', jamI),
    T.field('Hari kerja / minggu', hariI)
  ));
  root.appendChild(box);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Banding 2 tawaran gaji (opsional)</p>'));
  root.appendChild(T.grid2(
    T.field('Gaji pokok tawaran B (Rp)', pokokBI, 'Isi untuk membandingkan dengan tawaran A di atas'),
    T.field('Total tunjangan tawaran B (Rp)', tunjBI)
  ));
  root.appendChild(bandingBox);
  root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Gross-up: balik hitung dari target bersih</p>'));
  root.appendChild(T.field('Target gaji bersih / bulan (Rp)', targetI, 'Memakai persentase iuran dan pengaturan PPh 21 di atas'));
  root.appendChild(T.row(T.btn('Hitung gaji bruto yang dibutuhkan', hitungGrossUp, true)));
  root.appendChild(grossBox);
  root.appendChild(T.el('<p class="hint">Iuran dihitung dari penghasilan bruto (pokok + tunjangan). Angka ilustrasi, potongan aktual bisa beda tergantung kebijakan perusahaan & batas upah BPJS. TER bulanan: PPh 21 = bruto sebulan x tarif TER sesuai kategori status PTKP, tanpa mengurangi biaya jabatan atau PTKP dulu. Di bulan Desember, PPh 21 dihitung ulang setahun penuh dengan tarif progresif dikurangi potongan Januari-November yang sudah dibayar, jadi potongan Desember bisa beda. Butuh hitung THR, lembur, atau pesangon tersendiri? Ada tool terpisah: <a href="#/t/thr">THR</a>, <a href="#/t/kalkulator-lembur">Lembur</a>, <a href="#/t/kalkulator-pesangon">Pesangon</a>.</p>'));
  renderTunj();
  renderPot();
  hitung();
}
