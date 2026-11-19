import { h as T, kv, utils } from '../../core.js';

export const meta = {"id":"kalkulator-sewa-properti","name":"Kalkulator Sewa Properti","cat":"bisnis","icon":"🔑","desc":"Analisis properti sewa: yield kotor dan bersih, uang masuk per bulan setelah cicilan KPR, hasil dari uang tunai, titik impas hunian, lama balik modal, dan proyeksi 10 tahun.","keywords":"properti,sewa,kos,kontrakan,yield,rental,investasi,balik modal,investasi properti,cash on cash,roi,kpr,proyeksi,titik impas","since":"6.11.0"};

// cicilanBulanan kanonis tinggal di utils (core.js).

/* Sisa pokok KPR setelah k bulan dibayar (anuitas).
   Bentuk stabil (P4-03): (1+r)^k = exp(k*log1p(r)) dan
   ((1+r)^k - 1)/r = expm1(k*log1p(r))/r — bentuk pow langsung memberi
   NaN saat r mungil (1+r membulat ke 1, lalu 0/0 lewat cicilan Infinity). */
export function sisaPinjaman(pinjaman, bungaTahunPersen, tenorTahun, bulanBerjalan) {
  const r = bungaTahunPersen / 100 / 12;
  const n = tenorTahun * 12;
  const k = Math.min(bulanBerjalan, n);
  if (!Number.isFinite(pinjaman) || !Number.isFinite(bungaTahunPersen) || !Number.isFinite(tenorTahun)) return null;
  if (r === 0 || 1 + r === 1) return Math.max(0, pinjaman * (1 - k / n));
  const cicil = utils.cicilanBulanan(pinjaman, bungaTahunPersen, tenorTahun);
  if (cicil == null) return null;
  return Math.max(0, pinjaman * Math.exp(k * Math.log1p(r)) - cicil * Math.expm1(k * Math.log1p(r)) / r);
}

/* Analisis sewa tanpa KPR (fungsi lama kalkulator-sewa-properti v6.11.0,
   dipertahankan untuk kompatibilitas). */
export function analisisSewa(hargaBeli, sewaBulan, biaya) {
  const b = biaya || {};
  const sewaKotorTahun = sewaBulan * 12;
  const kosongTahun = sewaKotorTahun * ((b.kosongPersen || 0) / 100);
  const kelolaTahun = sewaKotorTahun * ((b.kelolaPersen || 0) / 100);
  const biayaTahun = (b.rawatTahun || 0) + (b.pajakTahun || 0) + (b.lainBulan || 0) * 12 + kosongTahun + kelolaTahun;
  const sewaBersihTahun = sewaKotorTahun - biayaTahun;
  return {
    sewaKotorTahun,
    biayaTahun,
    sewaBersihTahun,
    yieldKotor: hargaBeli > 0 ? sewaKotorTahun / hargaBeli * 100 : null,
    yieldBersih: hargaBeli > 0 ? sewaBersihTahun / hargaBeli * 100 : null,
    cashflowBulan: sewaBersihTahun / 12,
    balikModalTahun: sewaBersihTahun > 0 ? hargaBeli / sewaBersihTahun : null,
  };
}

const inpUang = (ph, val) => { const i = T.input('text', ph, val || ''); i.inputMode = 'decimal'; return i; };
// Guard tampilan (P4-05): persen non-finite atau absurd (>1 jt %) tidak
// boleh tampil mentah ("-2e+301%", "-6,66…e+301%") — samakan dengan T.rp.
export const fmtPersen = (v) => {
  if (!Number.isFinite(v) || Math.abs(v) > 1e6) return 'di luar jangkauan';
  return String(Math.round(v * 100) / 100).replace('.', ',') + '%';
};

export function render(root) {
  const hargaInp = inpUang('mis. 500000000');
  const dpInp = inpUang('mis. 30', '30');
  const bungaInp = inpUang('mis. 8', '8');
  const tenorInp = inpUang('mis. 15', '15');
  const sewaInp = inpUang('mis. 3500000');
  const naikSewaInp = inpUang('mis. 3', '3');
  const naikHargaInp = inpUang('mis. 5', '5');
  const pajakInp = inpUang('mis. 2000000 (boleh 0)', '0');
  const rawatInp = inpUang('mis. 5000000 (boleh 0)', '0');
  const lainInp = inpUang('mis. 200000 (boleh 0)', '0');
  const kosongInp = inpUang('mis. 8', '8');
  const kelolaInp = inpUang('mis. 0 bila urus sendiri', '0');
  const out = T.out();

  const hitung = () => {
    const harga = T.num(hargaInp.value), dpPersen = T.num(dpInp.value);
    const bunga = T.num(bungaInp.value), tenor = T.num(tenorInp.value);
    const sewa = T.num(sewaInp.value), naikSewa = T.num(naikSewaInp.value), naikHarga = T.num(naikHargaInp.value);
    const pajak = T.num(pajakInp.value), rawat = T.num(rawatInp.value), lain = T.num(lainInp.value);
    const kosong = T.num(kosongInp.value), kelola = T.num(kelolaInp.value);
    if (!isFinite(harga) || !(harga > 0)) { T.show(out, '<p class="err">Isi harga beli properti dengan angka lebih dari 0.</p>'); return; }
    if (harga > 1e14) { T.show(out, '<p class="err">Harga beli terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return; }
    if (!isFinite(dpPersen) || dpPersen < 0 || dpPersen > 100) { T.show(out, '<p class="err">DP isi 0 sampai 100 persen. Isi 100 bila beli tunai tanpa KPR.</p>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga > 50) { T.show(out, '<p class="err">Bunga KPR per tahun isi 0 sampai 50 persen.</p>'); return; }
    if (!isFinite(tenor) || !(tenor > 0) || tenor > 35) { T.show(out, '<p class="err">Tenor isi 1 sampai 35 tahun.</p>'); return; }
    if (!isFinite(sewa) || !(sewa > 0)) { T.show(out, '<p class="err">Isi sewa per bulan dengan angka lebih dari 0.</p>'); return; }
    if (sewa > 1e14) { T.show(out, '<p class="err">Sewa per bulan terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>'); return; }
    if (!isFinite(naikSewa) || naikSewa < 0 || naikSewa > 50) { T.show(out, '<p class="err">Kenaikan sewa per tahun isi 0 sampai 50 persen.</p>'); return; }
    if (!isFinite(naikHarga) || naikHarga < 0 || naikHarga > 50) { T.show(out, '<p class="err">Kenaikan harga properti per tahun isi 0 sampai 50 persen.</p>'); return; }
    const biaya = [pajak, rawat, lain, kosong, kelola];
    if (biaya.some((x) => !isFinite(x) || x < 0)) { T.show(out, '<p class="err">Semua biaya isi dengan angka 0 atau lebih.</p>'); return; }
    // Batas yang sama dengan harga & sewa (P4-05): tanpa batas, pajak/rawat
    // 1e308 menghasilkan yield "-2e+301%" dan cashflow 412 karakter.
    if (pajak > 1e14) { T.show(out, '<p class="err">Pajak per tahun terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return; }
    if (rawat > 1e14) { T.show(out, '<p class="err">Perawatan per tahun terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return; }
    if (lain > 1e14) { T.show(out, '<p class="err">Biaya lain per bulan terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return; }
    if (kosong >= 100 || kelola >= 100) { T.show(out, '<p class="err">Persentase kekosongan dan pengelolaan harus di bawah 100%.</p>'); return; }

    const dp = harga * (dpPersen / 100);
    const pinj = harga - dp;
    const cicil = pinj > 0 ? utils.cicilanBulanan(pinj, bunga, tenor) : 0;
    const uangTunaiAwal = dp; // biaya awal (notaris/pajak beli) tidak dimasukkan — disebut di asumsi

    // Tahun pertama
    const sewaKotorThn = sewa * 12;
    const kosongThn = sewaKotorThn * (kosong / 100);
    const kelolaThn = sewaKotorThn * (kelola / 100);
    const biayaThn = rawat + pajak + lain * 12 + kosongThn + kelolaThn;
    const sewaBersihThn = sewaKotorThn - biayaThn;
    const cashflowThn = sewaBersihThn - cicil * 12;
    const cashflowBln = cashflowThn / 12;
    const yieldKotor = sewaKotorThn / harga * 100;
    const yieldBersih = sewaBersihThn / harga * 100;
    const coc = uangTunaiAwal > 0 ? cashflowThn / uangTunaiAwal * 100 : null; // cash-on-cash
    const balikModal = sewaBersihThn > 0 ? harga / sewaBersihThn : null; // dari sewa bersih, sebelum cicilan (fitur lama)

    // Titik impas hunian: % hunian minimal supaya sewa menutup semua biaya + cicilan.
    const biayaTetapThn = rawat + pajak + lain * 12 + cicil * 12;
    const sewaPerPersen = sewaKotorThn * (1 - kelola / 100) / 100;
    const impasHunian = sewaPerPersen > 0 ? biayaTetapThn / sewaPerPersen : null; // dalam persen

    // Proyeksi 10 tahun: sewa naik naikSewa%/thn, biaya naik mengikuti sewa untuk
    // komponen % (kosong, kelola) dan tetap untuk pajak/rawat/lain (sederhana & jujur).
    const proyeksi = [];
    let sewaThn = sewaKotorThn;
    let nilaiProperti = harga;
    let kumCashflow = 0;
    for (let th = 1; th <= 10; th++) {
      if (th > 1) sewaThn *= (1 + naikSewa / 100);
      const ksg = sewaThn * (kosong / 100);
      const kll = sewaThn * (kelola / 100);
      const by = rawat + pajak + lain * 12 + ksg + kll;
      const bersih = sewaThn - by;
      const cf = bersih - cicil * 12;
      kumCashflow += cf;
      nilaiProperti *= (1 + naikHarga / 100);
      proyeksi.push({ th, sewa: sewaThn, biaya: by, cf, nilai: nilaiProperti });
    }
    const sisaKpr10 = pinj > 0 ? sisaPinjaman(pinj, bunga, tenor, 120) : 0;
    const ekuitas10 = proyeksi[9].nilai - sisaKpr10;
    const totalHasil10 = kumCashflow + (ekuitas10 - dp);

    const cfWarna = cashflowBln >= 0 ? '#4ade80' : '#f87171';
    const cocWarna = coc == null ? '#a1a1aa' : (coc >= 0 ? '#4ade80' : '#f87171');
    const barisProyeksi = proyeksi.map((r) =>
      '<tr><td>Tahun ' + r.th + '</td><td style="text-align:right">' + T.rp(r.sewa) + '</td>' +
      '<td style="text-align:right">' + T.rp(r.biaya) + '</td>' +
      '<td style="text-align:right;color:' + (r.cf >= 0 ? '#4ade80' : '#f87171') + '">' + T.rp(r.cf) + '</td>' +
      '<td style="text-align:right">' + T.rp(r.nilai) + '</td></tr>'
    ).join('');

    T.show(out,
      '<div class="center"><div class="dim">Uang masuk bersih per bulan (setelah cicilan KPR)</div>' +
      '<div class="big" style="color:' + cfWarna + '">' + T.rp(cashflowBln) + '</div>' +
      '<p class="dim">' + (cashflowBln >= 0 ? 'Sewa menutup cicilan dan biaya — ada sisa tiap bulan.' : 'Sewa belum menutup cicilan dan biaya — kamu perlu nombok tiap bulan.') + '</p></div>' +
      kv('Cicilan KPR per bulan', '<b>' + T.rp(cicil) + '</b>' + (pinj > 0 ? ' (pinjaman ' + T.rp(pinj) + ', ' + tenor + ' tahun)' : ' (beli tunai)')) +
      kv('Uang tunai awal (DP)', T.rp(uangTunaiAwal)) +
      kv('Yield kotor', '<b>' + fmtPersen(yieldKotor) + '</b> per tahun') +
      kv('Yield bersih (setelah biaya)', '<b>' + fmtPersen(yieldBersih) + '</b> per tahun') +
      (coc != null
        ? kv('Hasil dari uang tunai (cash-on-cash)', '<b style="color:' + cocWarna + '">' + fmtPersen(coc) + '</b> per tahun')
        : '') +
      (impasHunian != null
        ? kv('Titik impas hunian', '<b>' + fmtPersen(Math.max(0, Math.min(100, impasHunian))) + '</b> ' +
          (impasHunian > 100 ? '(tidak mungkin impas: biaya melebihi sewa penuh)' : 'properti harus terisi segini supaya tidak nombok'))
        : '') +
      kv('Sewa bersih tahun pertama', T.rp(sewaBersihThn)) +
      kv('Total biaya tahun pertama', T.rp(biayaThn)) +
      (balikModal != null
        ? kv('Balik modal dari sewa bersih', '<b>' + String(Math.round(balikModal * 10) / 10).replace('.', ',') + ' tahun</b>')
        : '<p class="warn">Biaya lebih besar dari sewa, jadi modal tidak balik dari sewa saja.</p>') +
      '<hr class="divi"><h3 class="h3">📈 Proyeksi 10 tahun</h3>' +
      '<p class="dim" style="font-size:13px">Sewa naik ' + fmtPersen(naikSewa) + ' per tahun, harga properti naik ' + fmtPersen(naikHarga) + ' per tahun, cicilan tetap.</p>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Tahun</th><th style="text-align:right">Sewa/thn</th><th style="text-align:right">Biaya/thn</th><th style="text-align:right">Uang masuk/thn</th><th style="text-align:right">Nilai properti</th></tr></thead><tbody>' + barisProyeksi + '</tbody></table></div>' +
      kv('Total uang masuk 10 tahun', '<b>' + T.rp(kumCashflow) + '</b>') +
      kv('Nilai properti setelah 10 tahun', T.rp(proyeksi[9].nilai)) +
      kv('Sisa pokok KPR setelah 10 tahun', T.rp(sisaKpr10)) +
      kv('Perkiraan total hasil 10 tahun', '<b>' + T.rp(totalHasil10) + '</b>') +
      '<p class="hint"><b>Asumsi yang dipakai:</b> bunga KPR tetap ' + fmtPersen(bunga) + ' per tahun; pajak, perawatan, dan biaya lain tidak naik; kekosongan ' + fmtPersen(kosong) + ' tiap tahun; belum termasuk biaya awal pembelian (notaris, pajak beli, admin KPR) dan pajak penghasilan dari sewa; kenaikan harga properti adalah perkiraan, bukan jaminan. Total hasil = total uang masuk 10 tahun + (nilai properti akhir − sisa KPR − DP awal).</p>');
  };

  root.appendChild(T.el('<p class="hint">Untuk kos, kontrakan, ruko, atau apartemen yang dibeli (tunai atau KPR) lalu disewakan. Isi harga, sewa, dan biaya-biayanya.</p>'));
  root.appendChild(T.field('Harga beli properti (Rp)', hargaInp));
  root.appendChild(T.grid2(
    T.field('DP (% dari harga)', dpInp, 'Isi 100 bila beli tunai'),
    T.field('Bunga KPR per tahun (%)', bungaInp)
  ));
  root.appendChild(T.grid2(
    T.field('Tenor KPR (tahun)', tenorInp),
    T.field('Sewa yang diterima per bulan (Rp)', sewaInp)
  ));
  root.appendChild(T.grid2(
    T.field('Kenaikan sewa per tahun (%)', naikSewaInp, 'Untuk proyeksi 10 tahun'),
    T.field('Kenaikan harga properti per tahun (%)', naikHargaInp, 'Perkiraan saja, bukan jaminan')
  ));
  root.appendChild(T.grid2(
    T.field('Pajak per tahun (Rp)', pajakInp),
    T.field('Perawatan per tahun (Rp)', rawatInp)
  ));
  root.appendChild(T.grid2(
    T.field('Biaya lain per bulan (Rp)', lainInp, 'Misalnya iuran, kebersihan'),
    T.field('Perkiraan kosong (% per tahun)', kosongInp, '8% artinya sekitar 1 bulan kosong setahun')
  ));
  root.appendChild(T.field('Biaya pengelola (% dari sewa)', kelolaInp, 'Isi 0 bila diurus sendiri'));
  root.appendChild(T.row(T.btn('Hitung investasi sewa', hitung, true)));
  root.appendChild(out);
}
