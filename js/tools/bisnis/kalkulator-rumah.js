import { h as T, kv, tabs } from '../../core.js?v=6.13.0';

export const meta = {"id":"kalkulator-rumah","name":"Kalkulator Beli Rumah","cat":"bisnis","icon":"🏠","desc":"Harga rumah yang terjangkau dari penghasilan: batas cicilan bisa diatur, biaya awal ikut dihitung, sisa penghasilan, banding tenor — plus cek cicilan rumah incaran.","keywords":"rumah,kpr,cicilan,dp,uang muka,hipotek,beli rumah,properti,mampu beli rumah,harga rumah maksimal,tenor,biaya awal","since":"6.11.0"};

/* Cicilan bulanan anuitas: PMT = P x r / (1 - (1+r)^-n). r = bunga per bulan.
   Bentuk stabil numerik (P4-03): 1 - (1+r)^-n dihitung sebagai
   -expm1(-n*log1p(r)) — bentuk pow langsung menderita pembatalan
   katastrofik saat r mungil (r < ~1e-12: 1+r membulat, penyebut jadi 0
   -> cicilan Infinity; di 1e-12 pun hasilnya sudah 6% meleset).
   Bila 1+r membulat ke 1 (r di bawah setengah ulp), pakai limit linear
   P/n — rumus eksak saat r -> 0. */
export function cicilanBulanan(pinjaman, bungaTahunPersen, tenorTahun) {
  const r = bungaTahunPersen / 100 / 12;
  const n = tenorTahun * 12;
  if (!Number.isFinite(pinjaman) || !Number.isFinite(bungaTahunPersen) || !Number.isFinite(tenorTahun)) return null;
  if (!(pinjaman > 0) || !(n > 0)) return null;
  if (r === 0 || 1 + r === 1) return pinjaman / n;
  return pinjaman * r / (-Math.expm1(-n * Math.log1p(r)));
}

/* Pinjaman maksimal dari cicilan bulanan yang sanggup dibayar.
   Bentuk stabil yang sama (P4-03): (1-(1+r)^-n)/r = -expm1(-n*log1p(r))/r. */
export function pinjamanMaks(cicilan, bungaTahunPersen, tenorTahun) {
  const r = bungaTahunPersen / 100 / 12;
  const n = tenorTahun * 12;
  if (!Number.isFinite(cicilan) || !Number.isFinite(bungaTahunPersen) || !Number.isFinite(tenorTahun)) return null;
  if (!(cicilan > 0) || !(n > 0)) return null;
  if (r === 0 || 1 + r === 1) return cicilan * n;
  return cicilan * (-Math.expm1(-n * Math.log1p(r))) / r;
}

/* Harga rumah maksimal: pinjaman maks + uang tunai, dikurangi biaya awal
   yang besarnya ikut harga (biayaPersen % dari harga).
   H = (pinjaman + dp) / (1 + biayaPersen/100). */
export function hargaMaks(pinjam, dp, biayaPersen) {
  if (!Number.isFinite(pinjam) || !Number.isFinite(dp) || !Number.isFinite(biayaPersen)) return null;
  const c = Math.max(0, biayaPersen) / 100;
  if (c >= 1) return null;
  return (pinjam + dp) / (1 + c);
}

const inpUang = (ph, val) => { const i = T.input('text', ph, val || ''); i.inputMode = 'decimal'; return i; };
// Guard tampilan (P4-03): persen non-finite atau absurd (>1 jt %) tidak
// boleh tampil mentah ("Infinity%", "-2e+301%") — samakan dengan T.rp.
export const fmtPersen = (v) => {
  if (!Number.isFinite(v) || Math.abs(v) > 1e6) return 'di luar jangkauan';
  return String(Math.round(v * 10) / 10).replace('.', ',') + '%';
};

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Panel 1: kemampuan beli (batas cicilan bisa diatur + biaya awal) ----
  const gajiInp = inpUang('mis. 8000000');
  const wajibInp = inpUang('mis. 3000000 (boleh 0)', '0');
  const dpInp = inpUang('mis. 50000000');
  const bungaInp = inpUang('mis. 8', '8');
  const tenorInp = inpUang('mis. 15', '15');
  const rasioInp = inpUang('mis. 30', '30');
  const biayaInp = inpUang('mis. 5', '5');
  const out1 = T.out();

  const hitung1 = () => {
    const gaji = T.num(gajiInp.value), wajib = T.num(wajibInp.value);
    const dp = T.num(dpInp.value), bunga = T.num(bungaInp.value);
    const tenor = T.num(tenorInp.value), rasio = T.num(rasioInp.value), biaya = T.num(biayaInp.value);
    if (!isFinite(gaji) || !(gaji > 0)) { T.show(out1, '<p class="err">Isi penghasilan per bulan dengan angka lebih dari 0.</p>'); return; }
    if (gaji > 1e14) { T.show(out1, '<p class="err">Penghasilan terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return; }
    if (!isFinite(wajib) || wajib < 0 || wajib >= gaji) { T.show(out1, '<p class="err">Pengeluaran wajib isi 0 atau lebih, dan harus lebih kecil dari penghasilan.</p>'); return; }
    if (!isFinite(dp) || dp < 0) { T.show(out1, '<p class="err">Isi DP dengan angka 0 atau lebih.</p>'); return; }
    if (dp > 1e14) { T.show(out1, '<p class="err">Uang tunai terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga > 50) { T.show(out1, '<p class="err">Bunga per tahun isi 0 sampai 50 persen.</p>'); return; }
    if (!isFinite(tenor) || !(tenor > 0) || tenor > 35) { T.show(out1, '<p class="err">Tenor isi 1 sampai 35 tahun.</p>'); return; }
    if (!isFinite(rasio) || rasio < 10 || rasio > 60) { T.show(out1, '<p class="err">Batas cicilan isi 10 sampai 60 persen dari penghasilan.</p>'); return; }
    if (!isFinite(biaya) || biaya < 0 || biaya >= 100) { T.show(out1, '<p class="err">Biaya awal isi 0 sampai di bawah 100 persen dari harga rumah.</p>'); return; }

    const cicilanMaks = gaji * (rasio / 100);
    const pinj = pinjamanMaks(cicilanMaks, bunga, tenor);
    const harga = hargaMaks(pinj, dp, biaya);
    const biayaAwal = harga * (biaya / 100);
    const dpBersih = dp - biayaAwal;
    const totalBayar = cicilanMaks * tenor * 12;
    const sisa = gaji - cicilanMaks - wajib;
    const sisaWarna = sisa >= 0 ? 'var(--ok)' : 'var(--err)';

    // Tabel banding tenor: 10, 15, 20, 25, 30 tahun (tenor yang dipilih ditandai).
    const tenorList = [10, 15, 20, 25, 30];
    const barisTenor = tenorList.map((t) => {
      const pj = pinjamanMaks(cicilanMaks, bunga, t);
      const hg = hargaMaks(pj, dp, biaya);
      const tb = cicilanMaks * t * 12;
      const aktif = t === tenor;
      return '<tr' + (aktif ? ' style="background:rgba(255,111,97,.12)"' : '') + '><td><b>' + t + ' thn' + (aktif ? ' ✓' : '') + '</b></td>' +
        '<td style="text-align:right">' + T.rp(hg) + '</td>' +
        '<td style="text-align:right">' + T.rp(cicilanMaks) + '</td>' +
        '<td style="text-align:right">' + T.rp(tb - pj) + '</td></tr>';
    }).join('');

    T.show(out1,
      '<div class="center"><div class="dim">Harga rumah maksimal yang masih aman</div>' +
      '<div class="big" style="color:#ff6f61">' + T.rp(harga) + '</div>' +
      '<p class="dim">Dengan cicilan ' + fmtPersen(rasio) + ' dari penghasilan selama ' + tenor + ' tahun</p></div>' +
      kv('Cicilan per bulan', '<b>' + T.rp(cicilanMaks) + '</b> (' + fmtPersen(rasio) + ' penghasilan)') +
      kv('Pinjaman KPR', T.rp(pinj)) +
      kv('DP yang dipakai (setelah biaya awal)', T.rp(dpBersih)) +
      kv('Perkiraan biaya awal (' + fmtPersen(biaya) + ' dari harga)', T.rp(biayaAwal)) +
      kv('Total bunga selama ' + tenor + ' tahun', T.rp(totalBayar - pinj)) +
      kv('Total yang dibayar (cicilan saja)', T.rp(totalBayar)) +
      kv('Sisa penghasilan per bulan', '<b style="color:' + sisaWarna + '">' + T.rp(sisa) + '</b>') +
      (dpBersih < 0
        ? '<p class="warn">Uang tunai yang disiapkan (' + T.rp(dp) + ') tidak cukup menutup perkiraan biaya awal (' + T.rp(biayaAwal) + '). Siapkan uang tunai lebih besar, atau cari rumah dengan harga lebih rendah.</p>'
        : '') +
      '<hr class="divi"><h3 class="h3">📊 Bandingkan tenor</h3>' +
      '<p class="dim" style="font-size:13px">Cicilan bulanan sama di semua tenor (sesuai batas yang kamu atur). Tenor lebih lama = harga rumah bisa lebih tinggi, tapi total bunga jauh lebih besar.</p>' +
      '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Tenor</th><th style="text-align:right">Harga maks</th><th style="text-align:right">Cicilan/bln</th><th style="text-align:right">Total bunga</th></tr></thead><tbody>' + barisTenor + '</tbody></table></div>' +
      '<p class="hint"><b>Asumsi yang dipakai:</b> bunga KPR tetap ' + fmtPersen(bunga) + ' per tahun selama tenor; cicilan dihitung anuitas (tetap tiap bulan); biaya awal ' + fmtPersen(biaya) + ' dari harga rumah (perkiraan notaris, pajak, dan admin KPR — ubah angkanya bila bank memberi rincian lain); belum termasuk asuransi, biaya renovasi, dan kenaikan bunga setelah masa fixed rate berakhir.</p>');
  };

  p1.appendChild(T.el('<p class="hint">Ketahui harga rumah tertinggi yang cicilannya masih nyaman dibayar tiap bulan. Atur sendiri batas cicilannya — patokan umum 30% dari penghasilan.</p>'));
  p1.appendChild(T.field('Penghasilan bersih per bulan (Rp)', gajiInp, 'Penghasilan yang benar-benar diterima tiap bulan'));
  p1.appendChild(T.field('Pengeluaran wajib per bulan (Rp)', wajibInp, 'Misalnya makan, transport, tagihan — untuk melihat sisa uang setelah cicilan'));
  p1.appendChild(T.grid2(
    T.field('Uang tunai yang disiapkan (Rp)', dpInp, 'Untuk DP + biaya awal'),
    T.field('Batas cicilan (% dari penghasilan)', rasioInp, '30% patokan umum. Naikkan bila pengeluaranmu kecil')
  ));
  p1.appendChild(T.grid2(
    T.field('Bunga KPR per tahun (%)', bungaInp, 'Bunga tetap bank, biasanya 5-12%'),
    T.field('Tenor (tahun)', tenorInp)
  ));
  p1.appendChild(T.field('Perkiraan biaya awal (% dari harga rumah)', biayaInp, 'Notaris, pajak, dan admin KPR. Umumnya sekitar 5% — ubah bila bank memberi rincian lain'));
  p1.appendChild(T.row(T.btn('Hitung harga rumah maksimal', hitung1, true)));
  p1.appendChild(out1);

  // ---- Panel 2: cek cicilan harga tertentu (fitur lama, dipertahankan) ----
  const hargaInp = inpUang('mis. 500000000');
  const dp2Inp = inpUang('mis. 100000000');
  const bunga2Inp = inpUang('mis. 8', '8');
  const tenor2Inp = inpUang('mis. 15', '15');
  const gaji2Inp = inpUang('mis. 8000000 (opsional)');
  const out2 = T.out();
  const hitung2 = () => {
    const harga = T.num(hargaInp.value), dp = T.num(dp2Inp.value);
    const bunga = T.num(bunga2Inp.value), tenor = T.num(tenor2Inp.value);
    const gaji = gaji2Inp.value.trim() === '' ? null : T.num(gaji2Inp.value);
    if (!isFinite(harga) || !(harga > 0)) { T.show(out2, '<p class="err">Isi harga rumah dengan angka lebih dari 0.</p>'); return; }
    if (harga > 1e14) { T.show(out2, '<p class="err">Harga rumah terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>'); return; }
    if (!isFinite(dp) || dp < 0 || dp >= harga) { T.show(out2, '<p class="err">DP harus 0 atau lebih dan lebih kecil dari harga rumah.</p>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga > 50) { T.show(out2, '<p class="err">Bunga per tahun isi 0 sampai 50 persen.</p>'); return; }
    if (!isFinite(tenor) || !(tenor > 0) || tenor > 30) { T.show(out2, '<p class="err">Tenor isi 1 sampai 30 tahun.</p>'); return; }
    if (gaji != null && (!isFinite(gaji) || !(gaji > 0))) { T.show(out2, '<p class="err">Penghasilan harus lebih dari 0 bila diisi.</p>'); return; }
    const pinj = harga - dp;
    const cicil = cicilanBulanan(pinj, bunga, tenor);
    const totalBayar = cicil * tenor * 12;
    let rasioHtml = '';
    if (gaji != null) {
      const rasio = cicil / gaji * 100;
      const aman = rasio <= 30;
      rasioHtml = kv('Cicilan dibanding penghasilan', '<b style="color:' + (aman ? 'var(--ok)' : 'var(--err)') + '">' +
        fmtPersen(rasio) + '</b> ' +
        (aman ? '(masih dalam patokan 30%)' : '(melewati patokan 30%, berat)'));
    }
    T.show(out2,
      '<div class="center"><div class="dim">Cicilan per bulan</div>' +
      '<div class="big">' + T.rp(cicil) + '</div></div>' +
      kv('Pinjaman (harga dikurangi DP)', T.rp(pinj)) +
      kv('Total yang dibayar', T.rp(totalBayar)) +
      kv('Total bunga', T.rp(totalBayar - pinj)) +
      rasioHtml);
  };
  p2.appendChild(T.el('<p class="hint">Sudah ada rumah incaran? Masukkan harganya untuk melihat cicilan bulanannya.</p>'));
  p2.appendChild(T.field('Harga rumah (Rp)', hargaInp));
  p2.appendChild(T.field('DP (Rp)', dp2Inp));
  p2.appendChild(T.grid2(
    T.field('Bunga KPR per tahun (%)', bunga2Inp),
    T.field('Tenor (tahun)', tenor2Inp)
  ));
  p2.appendChild(T.field('Penghasilan per bulan (Rp)', gaji2Inp, 'Opsional, untuk cek apakah cicilan masih wajar'));
  p2.appendChild(T.row(T.btn('Hitung cicilan', hitung2, true)));
  p2.appendChild(out2);

  root.appendChild(tabs([['Kemampuan', 0], ['Cek cicilan', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
