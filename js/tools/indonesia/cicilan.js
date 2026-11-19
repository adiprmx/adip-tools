import { h as T, utils, U, money } from '../../core.js';

// Tenor maksimal 600 bulan (50 tahun, selaras dengan lunasi-utang): jadwal
// angsuran dibangun per bulan, jadi tenor 999.999.999 bulan membekukan tab
// (~10 menit untuk dua jadwal). Batas ini dijaga di fungsi murni (pertahanan
// berlapis) dan di UI (pesan penolakan yang jelas).
const CICILAN_MAKS_TENOR = 600;
const CICILAN_MAKS_POKOK = 1e14; // Rp100 triliun — di atas itu hampir pasti salah ketik
const normalBulan = (b) => Math.max(1, Math.min(CICILAN_MAKS_TENOR, Math.round(+b) || 1));
const normalPokok = (p) => { const v = +p || 0; return Number.isFinite(v) ? v : 0; };
const normalBunga = (b) => { const v = +b || 0; return Number.isFinite(v) ? v : 0; };

U.cicilanFlat = (pokok, bungaTahunanPct, bulan) => {
    pokok = normalPokok(pokok); bulan = normalBulan(bulan);
    const totalBunga = pokok * normalBunga(bungaTahunanPct) / 100 * (bulan / 12);
    const totalBayar = pokok + totalBunga;
    return { perBulan: totalBayar / bulan, totalBunga, totalBayar };
  };

U.cicilanAnuitas = (pokok, bungaTahunanPct, bulan) => {
    pokok = normalPokok(pokok); bulan = normalBulan(bulan);
    const r = normalBunga(bungaTahunanPct) / 100 / 12;
    const perBulan = r > 0 ? (pokok * r) / (1 - Math.pow(1 + r, -bulan)) : pokok / bulan;
    const totalBayar = perBulan * bulan;
    return { perBulan, totalBunga: totalBayar - pokok, totalBayar };
  };

// Anuitas + pembayaran ekstra per bulan (masuk ke pokok): tenor memendek,
// total bunga berkurang.
U.cicilanAnuitasExtra = (pokok, bungaTahunanPct, bulan, extra) => {
    pokok = normalPokok(pokok); bulan = normalBulan(bulan);
    extra = Math.max(0, +extra || 0);
    const r = normalBunga(bungaTahunanPct) / 100 / 12;
    const dasar = U.cicilanAnuitas(pokok, bungaTahunanPct, bulan);
    let sisa = pokok, totalBunga = 0, n = 0;
    while (sisa > 0.5 && n < bulan) {
      n++;
      const ib = sisa * r;
      let pb = dasar.perBulan - ib + extra;
      if (n === bulan || pb >= sisa) pb = sisa;
      totalBunga += ib; sisa -= pb;
    }
    return { perBulan: dasar.perBulan + extra, months: n, totalBunga, totalBayar: pokok + totalBunga, hematBunga: dasar.totalBunga - totalBunga };
  };

// Flat + pembayaran ekstra per bulan: total bunga tetap (dihitung dari pokok
// awal), tenor memendek. Potongan bunga pelunasan awal tergantung leasing.
U.cicilanFlatExtra = (pokok, bungaTahunanPct, bulan, extra) => {
    pokok = normalPokok(pokok); bulan = normalBulan(bulan);
    extra = Math.max(0, +extra || 0);
    const dasar = U.cicilanFlat(pokok, bungaTahunanPct, bulan);
    const pokokBln = pokok / bulan;
    let sisa = pokok, n = 0;
    while (sisa > 0.5 && n < bulan) {
      n++;
      let pb = pokokBln + extra;
      if (n === bulan || pb >= sisa) pb = sisa;
      sisa -= pb;
    }
    return { perBulan: dasar.perBulan + extra, months: n, totalBunga: dasar.totalBunga, totalBayar: dasar.totalBayar, hematBunga: 0 };
  };

// Jadwal angsuran per bulan (anuitas + ekstra): rincian pokok, bunga, sisa.
U.cicilanJadwalAnuitas = (pokok, bungaTahunanPct, bulan, extra) => {
    pokok = normalPokok(pokok); bulan = normalBulan(bulan);
    extra = Math.max(0, +extra || 0);
    const r = normalBunga(bungaTahunanPct) / 100 / 12;
    const dasar = U.cicilanAnuitas(pokok, bungaTahunanPct, bulan);
    const rows = [];
    let sisa = pokok;
    for (let n = 1; n <= bulan && sisa > 0.5; n++) {
      const ib = sisa * r;
      let pb = dasar.perBulan - ib + extra;
      if (n === bulan || pb >= sisa) pb = sisa;
      sisa -= pb;
      rows.push({ bulan: n, cicilan: pb + ib, pokok: pb, bunga: ib, sisa: Math.max(0, sisa) });
    }
    return rows;
  };

// Jadwal angsuran per bulan (flat + ekstra): pokok tetap + bunga tetap per
// bulan. Total bunga flat sudah ditetapkan di awal, jadi bila lunas lebih
// awal karena ekstra, sisa bunga yang belum terbayar ikut lunas di bulan
// terakhir (sama seperti model flat di tool KPR).
U.cicilanJadwalFlat = (pokok, bungaTahunanPct, bulan, extra) => {
    pokok = normalPokok(pokok); bulan = normalBulan(bulan);
    extra = Math.max(0, +extra || 0);
    const dasar = U.cicilanFlat(pokok, bungaTahunanPct, bulan);
    const pokokBln = pokok / bulan;
    const bungaBln = dasar.totalBunga / bulan;
    const rows = [];
    let sisa = pokok, bungaTerbayar = 0;
    for (let n = 1; n <= bulan && sisa > 0.5; n++) {
      let ib = bungaBln;
      let pb = pokokBln + extra;
      if (n === bulan || pb >= sisa) {
        pb = sisa;
        ib = dasar.totalBunga - bungaTerbayar;
      }
      bungaTerbayar += ib;
      sisa -= pb;
      rows.push({ bulan: n, cicilan: pb + ib, pokok: pb, bunga: ib, sisa: Math.max(0, sisa) });
    }
    return rows;
  };

// CSV jadwal angsuran: kolom Bulan, Cicilan, Pokok, Bunga, Sisa.
U.cicilanJadwalCsv = (rows) => {
  const isi = ['Bulan,Cicilan (Rp),Pokok (Rp),Bunga (Rp),Sisa Pokok (Rp)']
    .concat(rows.map((r) => [r.bulan, Math.round(r.cicilan), Math.round(r.pokok), Math.round(r.bunga), Math.round(r.sisa)].join(',')))
    .join('\n');
  return isi;
};

// tambahBulanLabel kanonis tinggal di utils (core.js).

export const meta = {"id": "cicilan", "name": "Kalkulator Cicilan", "cat": "indonesia", "icon": "🏍️", "desc": "Simulasi cicilan flat & anuitas, DP + biaya awal, banding tenor, denda telat, jadwal per bulan & ekspor CSV.", "keywords": "cicilan,kredit,motor,angsuran,extra payment,flat,anuitas,dp,tenor,denda,csv"};
export function render(root) {

    const now = new Date();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const pokok = money(null, 'cth: 20000000'), bunga = money(null, 'cth: 12', '12'), tenor = T.input('number', 'cth: 12', '12');
    tenor.max = String(CICILAN_MAKS_TENOR); tenor.min = '1';
    const extra = money(null, 'cth: 500000 (opsional)', '0');
    const mulai = T.input('month', '', ym);
    const hargaI = money(null, 'cth: 25000000 (opsional)');
    const dpI = money(null, 'cth: 5000000 (opsional)', '0');
    const adminI = money(null, 'cth: 0 (opsional)', '0');
    const provisiI = money(null, 'cth: 0 (opsional)', '0');
    const asuransiI = money(null, 'cth: 0 (opsional)', '0');
    const tenorBanding = [12, 24, 36].map((v) => {
      const i = T.input('number', 'bulan', String(v));
      i.inputMode = 'numeric';
      return i;
    });
    const dendaMode = T.select([
      ['rp', 'Rupiah per hari'],
      ['persen', '% dari cicilan per hari'],
    ], 'rp');
    const dendaNilaiI = money(null, 'cth: 10000 (opsional)', '0');
    const dendaHariI = T.input('number', 'cth: 7', '7'); dendaHariI.inputMode = 'numeric';
    const csvSkema = T.select([
      ['anuitas', 'Anuitas'],
      ['flat', 'Flat'],
    ], 'anuitas');
    const box = T.out();
    const hitung = () => {
      const pInput = T.num(pokok.value);
      const r = T.num(bunga.value) || 0, n = Math.max(1, Math.round(T.num(tenor.value)) || 1);
      const harga = T.num(hargaI.value) || 0;
      const dp = Math.max(0, T.num(dpI.value) || 0);
      // Bila harga + DP diisi, pokok efektif = harga − DP (mengalahkan input pokok).
      let p = pInput, dariHarga = false;
      if (harga > 0 && dp > 0) {
        if (dp >= harga) { T.show(box, '<p class="warn">DP tidak boleh ≥ harga barang.</p>'); return; }
        p = harga - dp;
        dariHarga = true;
      }
      if (!(p > 0)) { T.show(box, '<p class="warn">Isi jumlah pinjaman dulu ya.</p>'); return; }
      if (!isFinite(p) || p > CICILAN_MAKS_POKOK) { T.show(box, '<p class="warn">Jumlah pinjaman terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya, mungkin ada nol yang kelebihan.</p>'); return; }
      if (n > CICILAN_MAKS_TENOR) { T.show(box, '<p class="warn">Tenor maksimal ' + CICILAN_MAKS_TENOR + ' bulan (50 tahun).</p>'); return; }
      // Bunga 1e308 membuat total bunga flat meluber ke Infinity. Batas
      // 1.000%/tahun masih mengizinkan pinjaman online paling ekstrem.
      if (!isFinite(r) || r < 0 || r > 1000) { T.show(box, '<p class="warn">Bunga per tahun isi 0 sampai 1.000 persen.</p>'); return; }
      const ex = T.num(extra.value) || 0;
      if (!isFinite(ex) || ex > CICILAN_MAKS_POKOK) { T.show(box, '<p class="warn">Pembayaran ekstra terlalu besar (maksimal Rp100 triliun). Periksa lagi angkanya.</p>'); return; }
      const f = U.cicilanFlat(p, r, n), a = U.cicilanAnuitas(p, r, n);
      const murah = f.totalBayar <= a.totalBayar ? 'flat' : 'anuitas';
      const jadwal = U.cicilanJadwalAnuitas(p, r, n, ex);
      const jadwalFlat = U.cicilanJadwalFlat(p, r, n, ex);
      const maksBaris = 120;
      const tabelJadwal = (rows, judul) => {
        if (!rows.length) return '';
        let tr = '';
        rows.slice(0, maksBaris).forEach((row) => {
          tr += '<tr><td style="text-align:center">' + row.bulan + '</td><td style="text-align:right">' + T.rp(row.cicilan) + '</td>' +
            '<td style="text-align:right">' + T.rp(row.pokok) + '</td><td style="text-align:right">' + T.rp(row.bunga) + '</td>' +
            '<td style="text-align:right">' + T.rp(row.sisa) + '</td></tr>';
        });
        return '<details style="margin-top:14px"><summary style="font-size:14px;font-weight:600;cursor:pointer">' + judul + '</summary>' +
          '<div style="overflow-x:auto;margin-top:8px"><table class="tbl">' +
          '<tr><th>Bln</th><th style="text-align:right">Cicilan</th><th style="text-align:right">Pokok</th><th style="text-align:right">Bunga</th><th style="text-align:right">Sisa</th></tr>' +
          tr + '</table></div>' +
          (rows.length > maksBaris ? '<p class="hint">Hanya ' + maksBaris + ' bulan pertama yang ditampilkan dari ' + rows.length + ' bulan.</p>' : '') +
          '</details>';
      };
      const jadwalHtml = tabelJadwal(jadwal, 'Tabel angsuran per bulan (anuitas' + (ex > 0 ? ', sudah termasuk ekstra' : '') + ')') +
        tabelJadwal(jadwalFlat, 'Tabel angsuran per bulan (flat' + (ex > 0 ? ', sudah termasuk ekstra' : '') + ')');
      let extraHtml = '';
      if (ex > 0) {
        const fe = U.cicilanFlatExtra(p, r, n, ex), ae = U.cicilanAnuitasExtra(p, r, n, ex);
        const parts = String(mulai.value || '').split('-');
        const y0 = Number(parts[0]) || now.getFullYear();
        const m0 = Number(parts[1]) || (now.getMonth() + 1);
        extraHtml =
          '<h3 style="font-size:14px;margin:14px 0 6px">Dengan pembayaran ekstra ' + T.rp(ex) + ' / bulan</h3>' +
          '<table class="tbl"><tr><th></th><th>Flat</th><th>Anuitas</th></tr>' +
          '<tr><td>Bayar / bulan</td><td><b>' + T.rp(fe.perBulan) + '</b></td><td><b>' + T.rp(ae.perBulan) + '</b></td></tr>' +
          '<tr><td>Lunas dalam</td><td>' + fe.months + ' bulan</td><td>' + ae.months + ' bulan</td></tr>' +
          '<tr><td>Perkiraan lunas</td><td>' + T.esc(utils.tambahBulanLabel(y0, m0, fe.months - 1)) + '</td><td>' + T.esc(utils.tambahBulanLabel(y0, m0, ae.months - 1)) + '</td></tr>' +
          '<tr><td>Total bunga</td><td>' + T.rp(fe.totalBunga) + '</td><td>' + T.rp(ae.totalBunga) + '</td></tr>' +
          '<tr><td>Hemat bunga</td><td>' + T.rp(fe.hematBunga) + '</td><td><b>' + T.rp(ae.hematBunga) + '</b></td></tr>' +
          '<tr><td>Total bayar</td><td>' + T.rp(fe.totalBayar) + '</td><td>' + T.rp(ae.totalBayar) + '</td></tr></table>' +
          '<p class="hint">Skema flat: total bunga dihitung dari pokok awal, jadi walau lunas lebih cepat total bunganya tetap (hemat Rp0). Tanya leasing soal potongan bila melunasi lebih awal. Skema anuitas: ekstra langsung memotong pokok, jadi bunganya ikut berkurang.</p>';
      }

      // DP + biaya awal
      const admin = Math.max(0, T.num(adminI.value) || 0);
      const provisi = Math.max(0, T.num(provisiI.value) || 0);
      const asuransi = Math.max(0, T.num(asuransiI.value) || 0);
      const danaMuka = dp + admin + provisi + asuransi;
      let dpHtml = '';
      if (dariHarga) dpHtml += '<p class="hint">Pokok pinjaman dihitung dari harga ' + T.rp(harga) + ' − DP ' + T.rp(dp) + ' (' + Math.round(dp / harga * 100) + '%) = ' + T.rp(p) + '.</p>';
      if (danaMuka > 0) {
        dpHtml += '<h3 style="font-size:14px;margin:14px 0 4px">Dana yang disiapkan di muka</h3>' +
          '<table class="tbl"><tr><td>DP</td><td style="text-align:right">' + T.rp(dp) + '</td></tr>' +
          '<tr><td>Biaya admin</td><td style="text-align:right">' + T.rp(admin) + '</td></tr>' +
          '<tr><td>Provisi</td><td style="text-align:right">' + T.rp(provisi) + '</td></tr>' +
          '<tr><td>Asuransi kredit</td><td style="text-align:right">' + T.rp(asuransi) + '</td></tr>' +
          '<tr><td><b>Total di muka</b></td><td style="text-align:right"><b>' + T.rp(danaMuka) + '</b></td></tr>' +
          '<tr><td>Total keluar semua (di muka + cicilan)</td><td style="text-align:right"><b>' + T.rp(danaMuka + a.totalBayar) + ' (anuitas) / ' + T.rp(danaMuka + f.totalBayar) + ' (flat)</b></td></tr></table>';
      }

      // Banding tenor
      const tenors = [...new Set(tenorBanding.map((i) => Math.max(1, Math.min(CICILAN_MAKS_TENOR, Math.round(T.num(i.value)) || 0))).filter((v) => v > 0))].sort((x, y) => x - y);
      let bandingHtml = '';
      if (tenors.length >= 2) {
        const sel = (fn) => tenors.map((t) => '<td style="text-align:right">' + fn(t) + '</td>').join('');
        bandingHtml = '<h3 style="font-size:14px;margin:14px 0 6px">Banding tenor (pokok & bunga yang sama)</h3>' +
          '<div style="overflow-x:auto"><table class="tbl"><tr><th></th>' + tenors.map((t) => '<th style="text-align:right">' + t + ' bulan</th>').join('') + '</tr>' +
          '<tr><td>Cicilan / bulan (flat)</td>' + sel((t) => T.rp(U.cicilanFlat(p, r, t).perBulan)) + '</tr>' +
          '<tr><td>Cicilan / bulan (anuitas)</td>' + sel((t) => '<b>' + T.rp(U.cicilanAnuitas(p, r, t).perBulan) + '</b>') + '</tr>' +
          '<tr><td>Total bunga (flat)</td>' + sel((t) => T.rp(U.cicilanFlat(p, r, t).totalBunga)) + '</tr>' +
          '<tr><td>Total bunga (anuitas)</td>' + sel((t) => T.rp(U.cicilanAnuitas(p, r, t).totalBunga)) + '</tr>' +
          '<tr><td>Total bayar (flat)</td>' + sel((t) => T.rp(U.cicilanFlat(p, r, t).totalBayar)) + '</tr>' +
          '<tr><td>Total bayar (anuitas)</td>' + sel((t) => T.rp(U.cicilanAnuitas(p, r, t).totalBayar)) + '</tr></table></div>' +
          '<p class="hint">Tenor lebih panjang = cicilan lebih ringan, tapi total bunga lebih besar. Ubah ketiga tenor di atas untuk membandingkan pilihanmu sendiri.</p>';
      }

      // Denda keterlambatan
      const dendaNilai = Math.max(0, T.num(dendaNilaiI.value) || 0);
      const dendaHari = Math.max(0, Math.round(T.num(dendaHariI.value)) || 0);
      let dendaHtml = '';
      if (dendaNilai > 0 && dendaHari > 0) {
        const perHariF = dendaMode.value === 'persen' ? f.perBulan * dendaNilai / 100 : dendaNilai;
        const perHariA = dendaMode.value === 'persen' ? a.perBulan * dendaNilai / 100 : dendaNilai;
        dendaHtml = '<h3 style="font-size:14px;margin:14px 0 4px">Denda keterlambatan</h3>' +
          '<div class="warn" style="border:1px solid #7f1d1d;border-radius:8px;padding:10px 12px">' +
          'Telat ' + dendaHari + ' hari × ' + (dendaMode.value === 'persen' ? T.esc(String(dendaNilai)) + '% dari cicilan' : T.rp(dendaNilai)) + ' per hari:<br>' +
          '• Skema flat: <b>' + T.rp(perHariF * dendaHari) + '</b> (' + T.rp(perHariF) + ' / hari)<br>' +
          '• Skema anuitas: <b>' + T.rp(perHariA * dendaHari) + '</b> (' + T.rp(perHariA) + ' / hari)<br>' +
          '<span style="font-size:12px">Denda dihitung sederhana (per hari × jumlah hari). Besaran denda tiap leasing beda — ada yang per hari, ada yang persen dari cicilan, ada yang denda tetap per keterlambatan. Cek perjanjian kreditmu.</span></div>';
      }

      T.show(box,
        '<table class="tbl"><tr><th></th><th>Flat</th><th>Anuitas</th></tr>' +
        '<tr><td>Cicilan/bulan</td><td><b>' + T.rp(f.perBulan) + '</b></td><td><b>' + T.rp(a.perBulan) + '</b></td></tr>' +
        '<tr><td>Total bunga</td><td>' + T.rp(f.totalBunga) + '</td><td>' + T.rp(a.totalBunga) + '</td></tr>' +
        '<tr><td>Total bayar</td><td>' + T.rp(f.totalBayar) + '</td><td>' + T.rp(a.totalBayar) + '</td></tr></table>' +
        '<p class="hint">Flat: bunga dihitung dari pokok awal setiap bulan (cicilan tetap). Anuitas: porsi bunga menyusut, pokok membesar (cicilan tetap). ' +
        'Untuk simulasi ini yang totalnya lebih ringan adalah metode <b>' + murah + '</b>.</p>' +
        dpHtml +
        bandingHtml +
        dendaHtml +
        jadwalHtml +
        extraHtml);
      box.appendChild(T.row(
        T.btn('Unduh jadwal CSV (' + csvSkema.value + ')', () => {
          const rows = csvSkema.value === 'flat' ? jadwalFlat : jadwal;
          if (!rows.length) { T.toast('Hitung dulu simulasinya'); return; }
          T.dl('jadwal-cicilan-' + csvSkema.value + '.csv', U.cicilanJadwalCsv(rows), 'text/csv');
          T.toast('CSV terunduh');
        })
      ));
    };
    [pokok, bunga, tenor, extra, hargaI, dpI, adminI, provisiI, asuransiI, dendaNilaiI, dendaHariI, ...tenorBanding].forEach((i) => i.addEventListener('input', hitung));
    mulai.addEventListener('change', hitung);
    dendaMode.addEventListener('change', hitung);
    csvSkema.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Pokok pinjaman', pokok),
      T.field('Bunga (%/tahun)', bunga),
      T.field('Tenor (bulan)', tenor)
    ));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">DP & biaya awal (opsional)</p>'));
    root.appendChild(T.grid2(
      T.field('Harga barang (Rp)', hargaI, 'Bila diisi bersama DP, pokok = harga − DP'),
      T.field('Uang muka / DP (Rp)', dpI)
    ));
    root.appendChild(T.grid2(
      T.field('Biaya admin (Rp)', adminI),
      T.field('Provisi (Rp)', provisiI),
      T.field('Asuransi kredit (Rp)', asuransiI)
    ));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Banding tenor (opsional)</p>'));
    root.appendChild(T.grid2(
      T.field('Tenor 1 (bulan)', tenorBanding[0]),
      T.field('Tenor 2 (bulan)', tenorBanding[1]),
      T.field('Tenor 3 (bulan)', tenorBanding[2])
    ));
    root.appendChild(T.el('<p class="mut" style="margin:14px 0 6px;font-weight:600">Denda keterlambatan (opsional)</p>'));
    root.appendChild(T.grid2(
      T.field('Cara hitung denda', dendaMode),
      T.field('Besar denda', dendaNilaiI, 'Rupiah per hari, atau % dari cicilan per hari'),
      T.field('Telat berapa hari', dendaHariI)
    ));
    root.appendChild(T.grid2(
      T.field('Pembayaran ekstra / bulan (Rp)', extra, 'Di luar cicilan, langsung memotong pokok'),
      T.field('Mulai cicilan', mulai)
    ));
    root.appendChild(T.field('Skema jadwal untuk CSV', csvSkema));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);

}
