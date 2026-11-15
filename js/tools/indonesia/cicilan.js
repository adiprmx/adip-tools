import { h as T, utils, U, money } from '../../core.js?v=6.12.1';

U.cicilanFlat = (pokok, bungaTahunanPct, bulan) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    const totalBunga = pokok * (+bungaTahunanPct || 0) / 100 * (bulan / 12);
    const totalBayar = pokok + totalBunga;
    return { perBulan: totalBayar / bulan, totalBunga, totalBayar };
  };

U.cicilanAnuitas = (pokok, bungaTahunanPct, bulan) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    const r = (+bungaTahunanPct || 0) / 100 / 12;
    const perBulan = r > 0 ? (pokok * r) / (1 - Math.pow(1 + r, -bulan)) : pokok / bulan;
    const totalBayar = perBulan * bulan;
    return { perBulan, totalBunga: totalBayar - pokok, totalBayar };
  };

// Anuitas + pembayaran ekstra per bulan (masuk ke pokok): tenor memendek,
// total bunga berkurang.
U.cicilanAnuitasExtra = (pokok, bungaTahunanPct, bulan, extra) => {
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    extra = Math.max(0, +extra || 0);
    const r = (+bungaTahunanPct || 0) / 100 / 12;
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
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
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
    pokok = +pokok || 0; bulan = Math.max(1, Math.round(+bulan) || 1);
    extra = Math.max(0, +extra || 0);
    const r = (+bungaTahunanPct || 0) / 100 / 12;
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

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function tambahBulan(y, m, n) {
  const d = new Date(y, m - 1 + n, 1);
  return NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear();
}

export const meta = {"id": "cicilan", "name": "Kalkulator Cicilan", "cat": "indonesia", "icon": "🏍️", "desc": "Simulasi cicilan flat & anuitas, plus extra payment.", "keywords": "cicilan,kredit,motor,angsuran,extra payment,flat,anuitas"};
export function render(root) {

    const now = new Date();
    const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const pokok = money(null, 'cth: 20000000'), bunga = money(null, 'cth: 12', '12'), tenor = T.input('number', 'cth: 12', '12');
    const extra = money(null, 'cth: 500000 (opsional)', '0');
    const mulai = T.input('month', '', ym);
    const box = T.out();
    const hitung = () => {
      const p = T.num(pokok.value), r = T.num(bunga.value) || 0, n = Math.max(1, Math.round(T.num(tenor.value)) || 1);
      if (!(p > 0)) { T.show(box, '<p class="warn">Isi jumlah pinjaman dulu ya.</p>'); return; }
      const ex = T.num(extra.value) || 0;
      const f = U.cicilanFlat(p, r, n), a = U.cicilanAnuitas(p, r, n);
      const murah = f.totalBayar <= a.totalBayar ? 'flat' : 'anuitas';
      const jadwal = U.cicilanJadwalAnuitas(p, r, n, ex);
      const maksBaris = 120;
      let jadwalHtml = '';
      if (jadwal.length) {
        let rows = '';
        jadwal.slice(0, maksBaris).forEach((row) => {
          rows += '<tr><td style="text-align:center">' + row.bulan + '</td><td style="text-align:right">' + T.rp(row.cicilan) + '</td>' +
            '<td style="text-align:right">' + T.rp(row.pokok) + '</td><td style="text-align:right">' + T.rp(row.bunga) + '</td>' +
            '<td style="text-align:right">' + T.rp(row.sisa) + '</td></tr>';
        });
        jadwalHtml = '<details style="margin-top:14px"><summary style="font-size:14px;font-weight:600;cursor:pointer">Tabel angsuran per bulan (anuitas' + (ex > 0 ? ', sudah termasuk ekstra' : '') + ')</summary>' +
          '<div style="overflow-x:auto;margin-top:8px"><table style="width:100%;font-size:12px;border-collapse:collapse">' +
          '<tr style="opacity:.7"><th>Bln</th><th style="text-align:right">Cicilan</th><th style="text-align:right">Pokok</th><th style="text-align:right">Bunga</th><th style="text-align:right">Sisa</th></tr>' +
          rows + '</table></div>' +
          (jadwal.length > maksBaris ? '<p class="hint">Hanya ' + maksBaris + ' bulan pertama yang ditampilkan dari ' + jadwal.length + ' bulan.</p>' : '') +
          '</details>';
      }
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
          '<tr><td>Perkiraan lunas</td><td>' + T.esc(tambahBulan(y0, m0, fe.months - 1)) + '</td><td>' + T.esc(tambahBulan(y0, m0, ae.months - 1)) + '</td></tr>' +
          '<tr><td>Total bunga</td><td>' + T.rp(fe.totalBunga) + '</td><td>' + T.rp(ae.totalBunga) + '</td></tr>' +
          '<tr><td>Hemat bunga</td><td>' + T.rp(fe.hematBunga) + '</td><td><b>' + T.rp(ae.hematBunga) + '</b></td></tr>' +
          '<tr><td>Total bayar</td><td>' + T.rp(fe.totalBayar) + '</td><td>' + T.rp(ae.totalBayar) + '</td></tr></table>' +
          '<p class="hint">Skema flat: total bunga dihitung dari pokok awal, jadi walau lunas lebih cepat total bunganya tetap (hemat Rp0). Tanya leasing soal potongan bila melunasi lebih awal. Skema anuitas: ekstra langsung memotong pokok, jadi bunganya ikut berkurang.</p>';
      }
      T.show(box,
        '<table class="tbl"><tr><th></th><th>Flat</th><th>Anuitas</th></tr>' +
        '<tr><td>Cicilan/bulan</td><td><b>' + T.rp(f.perBulan) + '</b></td><td><b>' + T.rp(a.perBulan) + '</b></td></tr>' +
        '<tr><td>Total bunga</td><td>' + T.rp(f.totalBunga) + '</td><td>' + T.rp(a.totalBunga) + '</td></tr>' +
        '<tr><td>Total bayar</td><td>' + T.rp(f.totalBayar) + '</td><td>' + T.rp(a.totalBayar) + '</td></tr></table>' +
        '<p class="hint">Flat: bunga dihitung dari pokok awal setiap bulan (cicilan tetap). Anuitas: porsi bunga menyusut, pokok membesar (cicilan tetap). ' +
        'Untuk simulasi ini yang totalnya lebih ringan adalah metode <b>' + murah + '</b>.</p>' +
        jadwalHtml +
        extraHtml);
    };
    [pokok, bunga, tenor, extra].forEach((i) => i.addEventListener('input', hitung));
    mulai.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Pokok pinjaman', pokok),
      T.field('Bunga (%/tahun)', bunga),
      T.field('Tenor (bulan)', tenor)
    ));
    root.appendChild(T.grid2(
      T.field('Pembayaran ekstra / bulan (Rp)', extra, 'Di luar cicilan, langsung memotong pokok'),
      T.field('Mulai cicilan', mulai)
    ));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  
}
