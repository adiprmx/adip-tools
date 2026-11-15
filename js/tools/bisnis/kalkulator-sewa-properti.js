import { h as T, kv } from '../../core.js?v=6.12.1';

export const meta = {"id":"kalkulator-sewa-properti","name":"Kalkulator Sewa Properti","cat":"bisnis","icon":"🔑","desc":"Hitung hasil sewa properti: yield kotor dan bersih, uang masuk tiap bulan, dan lama balik modal.","keywords":"properti,sewa,kos,kontrakan,yield,rental,investasi,balik modal","since":"6.11.0"};

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
const fmtPersen = (v) => String(Math.round(v * 100) / 100).replace('.', ',') + '%';

export function render(root) {
  const hargaInp = inpUang('mis. 500000000');
  const sewaInp = inpUang('mis. 3000000');
  const rawatInp = inpUang('mis. 5000000 (boleh 0)', '0');
  const pajakInp = inpUang('mis. 2000000 (boleh 0)', '0');
  const lainInp = inpUang('mis. 200000 (boleh 0)', '0');
  const kosongInp = inpUang('mis. 8', '8');
  const kelolaInp = inpUang('mis. 0 bila urus sendiri', '0');
  const out = T.out();

  const hitung = () => {
    const harga = T.num(hargaInp.value), sewa = T.num(sewaInp.value);
    const rawat = T.num(rawatInp.value), pajak = T.num(pajakInp.value), lain = T.num(lainInp.value);
    const kosong = T.num(kosongInp.value), kelola = T.num(kelolaInp.value);
    if (!isFinite(harga) || !(harga > 0)) { T.show(out, '<p class="err">Isi harga beli properti dengan angka lebih dari 0.</p>'); return; }
    if (!isFinite(sewa) || !(sewa > 0)) { T.show(out, '<p class="err">Isi sewa per bulan dengan angka lebih dari 0.</p>'); return; }
    const biaya = [rawat, pajak, lain, kosong, kelola];
    if (biaya.some((v) => !isFinite(v) || v < 0)) { T.show(out, '<p class="err">Semua biaya isi dengan angka 0 atau lebih.</p>'); return; }
    if (kosong >= 100 || kelola >= 100) { T.show(out, '<p class="err">Persentase kekosongan dan pengelolaan harus di bawah 100%.</p>'); return; }
    const r = analisisSewa(harga, sewa, { rawatTahun: rawat, pajakTahun: pajak, lainBulan: lain, kosongPersen: kosong, kelolaPersen: kelola });
    const cfWarna = r.cashflowBulan >= 0 ? '#4ade80' : '#f87171';
    T.show(out,
      '<div class="center"><div class="dim">Hasil bersih per tahun</div>' +
      '<div class="big" style="color:' + cfWarna + '">' + T.rp(r.sewaBersihTahun) + '</div></div>' +
      kv('Yield kotor', '<b>' + fmtPersen(r.yieldKotor) + '</b>') +
      kv('Yield bersih', '<b>' + fmtPersen(r.yieldBersih) + '</b>') +
      kv('Uang masuk bersih per bulan', '<b style="color:' + cfWarna + '">' + T.rp(r.cashflowBulan) + '</b>') +
      kv('Sewa kotor per tahun', T.rp(r.sewaKotorTahun)) +
      kv('Total biaya per tahun', T.rp(r.biayaTahun)) +
      (r.balikModalTahun != null
        ? kv('Balik modal', '<b>' + String(Math.round(r.balikModalTahun * 10) / 10).replace('.', ',') + ' tahun</b>')
        : '<p class="warn">Biaya lebih besar dari sewa, jadi modal tidak balik dari sewa saja.</p>') +
      '<p class="hint">Yield = sewa setahun dibagi harga beli. Angka ini belum menghitung kenaikan harga properti dan belum termasuk cicilan KPR bila beli dengan kredit.</p>');
  };

  root.appendChild(T.el('<p class="hint">Untuk kos, kontrakan, ruko, atau apartemen yang disewakan. Isi harga beli dan sewa, lalu biaya-biayanya.</p>'));
  root.appendChild(T.field('Harga beli properti (Rp)', hargaInp));
  root.appendChild(T.field('Sewa yang diterima per bulan (Rp)', sewaInp));
  root.appendChild(T.grid2(
    T.field('Perawatan per tahun (Rp)', rawatInp),
    T.field('Pajak per tahun (Rp)', pajakInp)
  ));
  root.appendChild(T.grid2(
    T.field('Biaya lain per bulan (Rp)', lainInp, 'Misalnya iuran, kebersihan'),
    T.field('Perkiraan kosong (% per tahun)', kosongInp, '8% artinya sekitar 1 bulan kosong setahun')
  ));
  root.appendChild(T.field('Biaya pengelola (% dari sewa)', kelolaInp, 'Isi 0 bila diurus sendiri'));
  root.appendChild(T.row(T.btn('Hitung hasil sewa', hitung, true)));
  root.appendChild(out);
}
