import { h as T, kv, tabs } from '../../core.js?v=6.12.1';

export const meta = {"id":"kalkulator-rumah","name":"Kalkulator Beli Rumah","cat":"bisnis","icon":"🏠","desc":"Harga rumah yang terjangkau dari penghasilan, DP, dan cicilan maksimal 30 persen.","keywords":"rumah,kpr,cicilan,dp,uang muka,hipotek,beli rumah,properti","since":"6.11.0"};

/* Cicilan bulanan anuitas: PMT = P x r / (1 - (1+r)^-n). r = bunga per bulan. */
export function cicilanBulanan(pinjaman, bungaTahunPersen, tenorTahun) {
  const r = bungaTahunPersen / 100 / 12;
  const n = tenorTahun * 12;
  if (!(pinjaman > 0) || !(n > 0)) return null;
  if (r === 0) return pinjaman / n;
  return pinjaman * r / (1 - Math.pow(1 + r, -n));
}

/* Pinjaman maksimal dari cicilan bulanan yang sanggup dibayar. */
export function pinjamanMaks(cicilan, bungaTahunPersen, tenorTahun) {
  const r = bungaTahunPersen / 100 / 12;
  const n = tenorTahun * 12;
  if (!(cicilan > 0) || !(n > 0)) return null;
  if (r === 0) return cicilan * n;
  return cicilan * (1 - Math.pow(1 + r, -n)) / r;
}

const inpUang = (ph, val) => { const i = T.input('text', ph, val || ''); i.inputMode = 'decimal'; return i; };
const inpAngka = (ph, val) => { const i = T.input('text', ph, val || ''); i.inputMode = 'decimal'; return i; };

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');

  // ---- Panel 1: kemampuan beli ----
  const gajiInp = inpUang('mis. 8000000');
  const dpInp = inpUang('mis. 50000000');
  const bungaInp = inpAngka('mis. 8', '8');
  const tenorInp = inpAngka('mis. 15', '15');
  const out1 = T.out();
  const hitung1 = () => {
    const gaji = T.num(gajiInp.value), dp = T.num(dpInp.value);
    const bunga = T.num(bungaInp.value), tenor = T.num(tenorInp.value);
    if (!isFinite(gaji) || !(gaji > 0)) { T.show(out1, '<p class="err">Isi penghasilan per bulan dengan angka lebih dari 0.</p>'); return; }
    if (!isFinite(dp) || dp < 0) { T.show(out1, '<p class="err">Isi DP dengan angka 0 atau lebih.</p>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga > 50) { T.show(out1, '<p class="err">Bunga per tahun isi 0 sampai 50 persen.</p>'); return; }
    if (!isFinite(tenor) || !(tenor > 0) || tenor > 30) { T.show(out1, '<p class="err">Tenor isi 1 sampai 30 tahun.</p>'); return; }
    const cicilanMaks = gaji * 0.3;
    const pinj = pinjamanMaks(cicilanMaks, bunga, tenor);
    const hargaMaks = pinj + dp;
    const totalBayar = cicilanMaks * tenor * 12;
    T.show(out1,
      '<div class="center"><div class="dim">Harga rumah maksimal yang terjangkau</div>' +
      '<div class="big">' + T.rp(hargaMaks) + '</div></div>' +
      kv('Cicilan maksimal (30% penghasilan)', '<b>' + T.rp(cicilanMaks) + '/bulan</b>') +
      kv('Pinjaman maksimal', T.rp(pinj)) +
      kv('DP yang disiapkan', T.rp(dp)) +
      kv('Total yang dibayar selama ' + tenor + ' tahun', T.rp(totalBayar)) +
      kv('Total bunga yang dibayar', T.rp(totalBayar - pinj)) +
      '<p class="hint">Patokan 30% dipakai supaya cicilan tidak memberatkan pengeluaran lain. Belum termasuk biaya notaris, pajak, dan asuransi.</p>');
  };
  p1.appendChild(T.el('<p class="hint">Hitung dari penghasilan: cicilan dijaga maksimal 30% penghasilan per bulan, lalu dihitung mundur jadi harga rumah.</p>'));
  p1.appendChild(T.field('Penghasilan per bulan (Rp)', gajiInp, 'Penghasilan bersih yang diterima tiap bulan'));
  p1.appendChild(T.field('DP yang sudah disiapkan (Rp)', dpInp));
  p1.appendChild(T.grid2(
    T.field('Bunga KPR per tahun (%)', bungaInp, 'Bunga tetap bank, biasanya 5-12%'),
    T.field('Tenor (tahun)', tenorInp)
  ));
  p1.appendChild(T.row(T.btn('Hitung kemampuan beli', hitung1, true)));
  p1.appendChild(out1);

  // ---- Panel 2: cek cicilan harga tertentu ----
  const hargaInp = inpUang('mis. 500000000');
  const dp2Inp = inpUang('mis. 100000000');
  const bunga2Inp = inpAngka('mis. 8', '8');
  const tenor2Inp = inpAngka('mis. 15', '15');
  const gaji2Inp = inpUang('mis. 8000000 (opsional)');
  const out2 = T.out();
  const hitung2 = () => {
    const harga = T.num(hargaInp.value), dp = T.num(dp2Inp.value);
    const bunga = T.num(bunga2Inp.value), tenor = T.num(tenor2Inp.value);
    const gaji = gaji2Inp.value.trim() === '' ? null : T.num(gaji2Inp.value);
    if (!isFinite(harga) || !(harga > 0)) { T.show(out2, '<p class="err">Isi harga rumah dengan angka lebih dari 0.</p>'); return; }
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
      rasioHtml = kv('Cicilan dibanding penghasilan', '<b style="color:' + (aman ? '#4ade80' : '#f87171') + '">' +
        String(Math.round(rasio * 10) / 10).replace('.', ',') + '%</b> ' +
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

  root.appendChild(tabs([['Kemampuan beli', 0], ['Cek cicilan', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
