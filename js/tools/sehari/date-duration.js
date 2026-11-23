import { h as T, utils, kv, tabs, parseISO, todayISO } from '../../core.js';

export const meta = {"id": "date-duration", "name": "Durasi Tanggal", "cat": "sehari", "icon": "📅", "desc": "Durasi antara dua tanggal, tambah/kurang hari/bulan/tahun, hitung mundur, dan hitung hari kerja dengan libur nasional 2026–2027.", "keywords": "tanggal,durasi,selisih,hari,hari kerja,libur,tambah hari,hitung mundur,countdown,libur nasional,cuti bersama,deadline,hrd,payroll,business days", "online": true};

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/* Libur nasional + cuti bersama 2026 — disalin dari tool Hari Libur Indonesia
   (js/tools/liveapi/hari-libur.js), sumber: SKB 3 Menteri No. 1497/2025,
   No. 2/2025, No. 5/2025 (17 hari libur nasional + 8 cuti bersama).
   Format: [tanggal ISO, nama, jenis]. */
export const LIBUR_2026 = [
  ['2026-01-01', 'Tahun Baru 2026 Masehi', 'Libur nasional'],
  ['2026-01-16', 'Isra Mikraj Nabi Muhammad SAW', 'Libur nasional'],
  ['2026-02-16', 'Cuti Bersama Tahun Baru Imlek 2577 Kongzili', 'Cuti bersama'],
  ['2026-02-17', 'Tahun Baru Imlek 2577 Kongzili', 'Libur nasional'],
  ['2026-03-18', 'Cuti Bersama Hari Suci Nyepi', 'Cuti bersama'],
  ['2026-03-19', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'Libur nasional'],
  ['2026-03-20', 'Cuti Bersama Hari Raya Idulfitri 1447 H', 'Cuti bersama'],
  ['2026-03-21', 'Hari Raya Idulfitri 1447 H', 'Libur nasional'],
  ['2026-03-22', 'Hari Raya Idulfitri 1447 H', 'Libur nasional'],
  ['2026-03-23', 'Cuti Bersama Hari Raya Idulfitri 1447 H', 'Cuti bersama'],
  ['2026-03-24', 'Cuti Bersama Hari Raya Idulfitri 1447 H', 'Cuti bersama'],
  ['2026-04-03', 'Wafat Yesus Kristus', 'Libur nasional'],
  ['2026-04-05', 'Kebangkitan Yesus Kristus (Paskah)', 'Libur nasional'],
  ['2026-05-01', 'Hari Buruh Internasional', 'Libur nasional'],
  ['2026-05-14', 'Kenaikan Yesus Kristus', 'Libur nasional'],
  ['2026-05-15', 'Cuti Bersama Kenaikan Yesus Kristus', 'Cuti bersama'],
  ['2026-05-27', 'Hari Raya Iduladha 1447 H', 'Libur nasional'],
  ['2026-05-28', 'Cuti Bersama Hari Raya Iduladha 1447 H', 'Cuti bersama'],
  ['2026-05-31', 'Hari Raya Waisak 2570 BE', 'Libur nasional'],
  ['2026-06-01', 'Hari Lahir Pancasila', 'Libur nasional'],
  ['2026-06-16', '1 Muharam Tahun Baru Islam 1448 H', 'Libur nasional'],
  ['2026-08-17', 'Proklamasi Kemerdekaan RI', 'Libur nasional'],
  ['2026-08-25', 'Maulid Nabi Muhammad SAW', 'Libur nasional'],
  ['2026-12-24', 'Cuti Bersama Hari Raya Natal', 'Cuti bersama'],
  ['2026-12-25', 'Kelahiran Yesus Kristus (Natal)', 'Libur nasional'],
];

/* Libur nasional + cuti bersama 2027, sumber: SKB 3 Menteri No. 1205/2026,
   No. 3/2026, No. 2/2026 (ditetapkan 15 September 2026; 18 hari libur
   nasional + 8 cuti bersama). Hari dalam seminggu tiap tanggal sudah
   dicocokkan dengan lampiran SKB. Format sama dengan LIBUR_2026. */
export const LIBUR_2027 = [
  ['2027-01-01', 'Tahun Baru 2027 Masehi', 'Libur nasional'],
  ['2027-01-05', 'Isra Mikraj Nabi Muhammad SAW', 'Libur nasional'],
  ['2027-02-05', 'Cuti Bersama Tahun Baru Imlek 2578 Kongzili', 'Cuti bersama'],
  ['2027-02-06', 'Tahun Baru Imlek 2578 Kongzili', 'Libur nasional'],
  ['2027-03-08', 'Hari Suci Nyepi (Tahun Baru Saka 1949)', 'Libur nasional'],
  ['2027-03-09', 'Cuti Bersama Hari Raya Idulfitri 1448 H', 'Cuti bersama'],
  ['2027-03-10', 'Hari Raya Idulfitri 1448 H', 'Libur nasional'],
  ['2027-03-11', 'Hari Raya Idulfitri 1448 H', 'Libur nasional'],
  ['2027-03-12', 'Cuti Bersama Hari Raya Idulfitri 1448 H', 'Cuti bersama'],
  ['2027-03-15', 'Cuti Bersama Hari Raya Idulfitri 1448 H', 'Cuti bersama'],
  ['2027-03-25', 'Cuti Bersama Wafat Yesus Kristus', 'Cuti bersama'],
  ['2027-03-26', 'Wafat Yesus Kristus', 'Libur nasional'],
  ['2027-03-28', 'Kebangkitan Yesus Kristus (Paskah)', 'Libur nasional'],
  ['2027-05-01', 'Hari Buruh Internasional', 'Libur nasional'],
  ['2027-05-06', 'Kenaikan Yesus Kristus', 'Libur nasional'],
  ['2027-05-17', 'Hari Raya Iduladha 1448 H', 'Libur nasional'],
  ['2027-05-18', 'Cuti Bersama Hari Raya Iduladha 1448 H', 'Cuti bersama'],
  ['2027-05-19', 'Cuti Bersama Hari Raya Waisak 2571 BE', 'Cuti bersama'],
  ['2027-05-20', 'Hari Raya Waisak 2571 BE', 'Libur nasional'],
  ['2027-06-01', 'Hari Lahir Pancasila', 'Libur nasional'],
  ['2027-06-06', '1 Muharam Tahun Baru Islam 1449 H', 'Libur nasional'],
  ['2027-08-15', 'Maulid Nabi Muhammad SAW', 'Libur nasional'],
  ['2027-08-17', 'Proklamasi Kemerdekaan RI', 'Libur nasional'],
  ['2027-12-24', 'Cuti Bersama Hari Raya Natal', 'Cuti bersama'],
  ['2027-12-25', 'Kelahiran Yesus Kristus (Natal)', 'Libur nasional'],
  ['2027-12-26', 'Isra Mikraj Nabi Muhammad SAW', 'Libur nasional'],
];

/* Hitung hari kerja INKLUSIF (tanggal mulai & akhir sama-sama dihitung),
   loop per hari — dari Kalkulator Hari Kerja. libur: Map iso -> nama.
   Libur yang jatuh di Sabtu/Minggu tidak dihitung ganda (sudah terhitung
   sebagai akhir pekan). Beda dengan hitungHariKerja di atas yang
   eksklusif (tanggal akhir tidak dihitung) dan O(1). */
export function hitungHariKerjaInklusif(mulai, akhir, libur) {
  let total = 0;
  let akhirPekan = 0;
  let liburKerja = 0;
  const liburDalamRentang = [];
  const d = new Date(mulai.getTime());
  while (d <= akhir) {
    total++;
    const dow = d.getUTCDay();
    const iso = d.toISOString().slice(0, 10);
    if (dow === 0 || dow === 6) {
      akhirPekan++;
    } else if (libur.has(iso)) {
      liburKerja++;
      liburDalamRentang.push({ iso, nama: libur.get(iso), tgl: new Date(d.getTime()) });
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return { total, akhirPekan, libur: liburKerja, kerja: total - akhirPekan - liburKerja, liburDalamRentang };
}

utils.hariKerjaHitung = hitungHariKerjaInklusif;
utils.hariKerjaLibur2026 = LIBUR_2026;
utils.hariKerjaLibur2027 = LIBUR_2027;

/* Pilihan akhir pekan: set angka hari (0=Minggu … 6=Sabtu) yang dianggap libur. */
export const AKHIR_PEKAN = {
  'sabtu-minggu': [0, 6],
  'jumat-sabtu': [5, 6],
  'minggu': [0],
};
export const AKHIR_PEKAN_LABEL = {
  'sabtu-minggu': 'Sabtu–Minggu',
  'jumat-sabtu': 'Jumat–Sabtu',
  'minggu': 'Hanya Minggu (6 hari kerja)',
};

export function fmtTanggalPanjang(d) {
  return NAMA_HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + NAMA_BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

/* Hitung hari kerja dari awal sampai sebelum akhir, dikurangi libur.
   akhirPekan: array angka hari libur (bawaan [0,6] = Minggu & Sabtu).
   Dihitung dengan aritmetika (minggu penuh × hari kerja per minggu + sisa),
   BUKAN loop per hari: rentang 0001→275760 (~100 juta hari) dulu membekukan
   tab 80 detik, sekarang O(1) terhadap rentang. Hasilnya sama persis dengan
   loop per hari (termasuk libur yang jatuh di hari kerja dalam rentang). */
export function hitungHariKerja(awal, akhir, liburSet, akhirPekan) {
  const liburHari = new Set(akhirPekan || [0, 6]);
  const totalHari = Math.ceil((akhir.getTime() - awal.getTime()) / 86400000);
  if (!(totalHari > 0)) return 0;
  const kerjaPerMinggu = 7 - liburHari.size;
  const mingguPenuh = Math.floor(totalHari / 7);
  const sisa = totalHari % 7;
  let kerja = mingguPenuh * kerjaPerMinggu;
  const hariAwal = awal.getUTCDay();
  for (let i = 0; i < sisa; i++) if (!liburHari.has((hariAwal + i) % 7)) kerja++;
  if (liburSet) {
    for (const iso of liburSet) {
      const d = parseISO(iso);
      if (!d || d < awal || d >= akhir) continue;
      if (!liburHari.has(d.getUTCDay())) kerja--;
    }
  }
  return kerja;
}

/* Tambah/kurang hari kalender dari tanggal. */
export function tambahHari(tanggal, jumlah) {
  const d = new Date(tanggal.getTime());
  d.setUTCDate(d.getUTCDate() + jumlah);
  return d;
}

/* Tambah/kurang hari kerja (lewati akhir pekan) dari tanggal.
   Dihitung dengan aritmetika minggu penuh + sisa (maks 6 langkah): memanggil
   fungsi ini langsung dengan 100 juta hari dulu tidak selesai dalam 10 detik.
   Dijepit ke ±3.650.000 hari kerja (~10 ribu tahun) supaya hasilnya tetap
   tanggal yang valid. */
export function tambahHariKerja(tanggal, jumlah, akhirPekan) {
  const liburHari = new Set(akhirPekan || [0, 6]);
  const kerjaPerMinggu = 7 - liburHari.size;
  const d = new Date(tanggal.getTime());
  if (kerjaPerMinggu <= 0) return d; // semua hari libur: tidak bisa maju
  const arah = jumlah >= 0 ? 1 : -1;
  let sisa = Math.min(Math.abs(jumlah), 3650000);
  const mingguPenuh = Math.floor(sisa / kerjaPerMinggu);
  if (mingguPenuh > 0) {
    d.setUTCDate(d.getUTCDate() + arah * mingguPenuh * 7);
    sisa -= mingguPenuh * kerjaPerMinggu;
  }
  if (sisa === 0 && mingguPenuh > 0) {
    // Jumlah pas kelipatan minggu kerja: lompatan mendarat di hari yang sama
    // dengan tanggal awal — bila itu hari libur (mis. Minggu), ujung yang
    // benar adalah hari kerja terakhir yang dihitung, yaitu hari kerja
    // terdekat BERLAWANAN arah jalan (maju → mundur ke Jumat, mundur →
    // maju ke Senin). Tanpa ini hasilnya meleset sampai 2 hari.
    while (liburHari.has(d.getUTCDay())) d.setUTCDate(d.getUTCDate() - arah);
    return d;
  }
  while (sisa > 0) {
    d.setUTCDate(d.getUTCDate() + arah);
    if (!liburHari.has(d.getUTCDay())) sisa--;
  }
  return d;
}

/* Tambah/kurang bulan kalender, dengan penjepit akhir bulan:
   31 Jan + 1 bulan = 28 Feb (29 di tahun kabisat), bukan 2/3 Maret. */
export function tambahBulanKalender(tanggal, jumlah) {
  const hari = tanggal.getUTCDate();
  const d = new Date(Date.UTC(tanggal.getUTCFullYear(), tanggal.getUTCMonth(), 1));
  d.setUTCMonth(d.getUTCMonth() + jumlah);
  const hariDiBulan = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(hari, hariDiBulan));
  return d;
}

/* Hari ke-berapa dalam tahun + sisa hari sampai akhir tahun (UTC). */
export function infoHariDalamTahun(tanggal) {
  const thn = tanggal.getUTCFullYear();
  const awalTahun = Date.UTC(thn, 0, 1);
  const akhirTahun = Date.UTC(thn + 1, 0, 1);
  const ke = Math.floor((tanggal.getTime() - awalTahun) / 86400000) + 1;
  const total = Math.round((akhirTahun - awalTahun) / 86400000);
  return { ke, total, sisa: total - ke, tahun: thn };
}

/* Baca daftar libur dari teks: satu tanggal per baris, format YYYY-MM-DD. */
export function bacaLibur(teks) {
  const set = new Set();
  let tidakValid = 0;
  String(teks || '').split(/\n/).forEach((baris) => {
    const s = baris.trim();
    if (!s) return;
    const d = parseISO(s);
    if (d) set.add(d.toISOString().slice(0, 10));
    else tidakValid++;
  });
  return { set, tidakValid };
}

export function render(root) {
  const p1 = T.el('<div></div>');
  const p2 = T.el('<div></div>');
  const p3 = T.el('<div></div>');
  const p4 = T.el('<div></div>');

  const pilihAkhirPekan = (nilaiAwal) => T.select([
    ['sabtu-minggu', 'Sabtu–Minggu'],
    ['jumat-sabtu', 'Jumat–Sabtu'],
    ['minggu', 'Hanya Minggu (6 hari kerja)'],
  ], nilaiAwal || 'sabtu-minggu');

  // ---- Panel 1: selisih tanggal (fitur lama dipertahankan) ----
  const dari = T.input('date', 'Tanggal awal', todayISO());
  const sampai = T.input('date', 'Tanggal akhir', todayISO());
  const cekKerja = document.createElement('input');
  cekKerja.type = 'checkbox'; cekKerja.checked = true; cekKerja.id = 'dd-kj';
  const akhirPekanSel = pilihAkhirPekan();
  const cekLiburNasional = document.createElement('input');
  cekLiburNasional.type = 'checkbox'; cekLiburNasional.id = 'dd-ln';
  const cekLiburNasional2027 = document.createElement('input');
  cekLiburNasional2027.type = 'checkbox'; cekLiburNasional2027.id = 'dd-ln27';
  const liburTa = T.ta(3, 'Satu tanggal per baris, mis.\n2026-12-25\n2027-01-01', '');
  const box = T.out();
  const hitung = () => {
    const a = parseISO(dari.value), b = parseISO(sampai.value);
    if (!a || !b) { T.show(box, '<span class="err">Isi kedua tanggal dengan benar.</span>'); return; }
    const awal = a < b ? a : b, akhir = a < b ? b : a;
    const totalHari = Math.round((akhir - awal) / 86400000);
    const minggu = Math.floor(totalHari / 7), sisaHari = totalHari % 7;
    const info = infoHariDalamTahun(akhir);
    let html =
      '<div class="center"><div class="big">' + T.fmt(totalHari) + ' hari</div></div>' +
      '<div class="kv"><span class="k">Minggu</span><span class="v">' + minggu + ' minggu ' + sisaHari + ' hari</span></div>' +
      '<div class="kv"><span class="k">Bulan (perkiraan)</span><span class="v">± ' + (totalHari / 30.44).toFixed(1) + ' bulan</span></div>' +
      '<div class="kv"><span class="k">Tahun (perkiraan)</span><span class="v">± ' + (totalHari / 365.25).toFixed(2) + ' tahun</span></div>' +
      '<div class="kv"><span class="k">Tanggal akhir di tahunnya</span><span class="v">Hari ke-' + info.ke + ' dari ' + info.total + ' hari di tahun ' + info.tahun + ', sisa ' + info.sisa + ' hari lagi sampai akhir tahun</span></div>';
    if (cekKerja.checked) {
      const libur = bacaLibur(liburTa.value);
      const akhirPekan = AKHIR_PEKAN[akhirPekanSel.value] || [0, 6];
      const tabelNasional = [];
      if (cekLiburNasional.checked) tabelNasional.push(...LIBUR_2026);
      if (cekLiburNasional2027.checked) tabelNasional.push(...LIBUR_2027);
      tabelNasional.forEach(([iso]) => { libur.set.add(iso); });
      const kerja = hitungHariKerja(awal, akhir, libur.set, akhirPekan);
      // Hanya libur yang jatuh di dalam rentang DAN di hari kerja yang
      // benar-benar mengurangi hitungan — sisanya tidak berpengaruh.
      let berdampak = 0, nasionalBerdampak = 0;
      const setNasional = new Set(tabelNasional.map(([iso]) => iso));
      libur.set.forEach((iso) => {
        const d = parseISO(iso);
        if (d && d >= awal && d < akhir && !akhirPekan.includes(d.getUTCDay())) {
          berdampak++;
          if (setNasional.has(iso)) nasionalBerdampak++;
        }
      });
      html += '<div class="kv"><span class="k">Hari kerja (' + T.esc(AKHIR_PEKAN_LABEL[akhirPekanSel.value] || 'Sabtu–Minggu') + ' libur)</span><span class="v">' + T.fmt(kerja) + ' hari</span></div>';
      if (berdampak > 0) html += '<p class="hint">' + berdampak + ' hari libur dikurangi dari hitungan hari kerja' + (nasionalBerdampak > 0 ? ' (termasuk ' + nasionalBerdampak + ' libur nasional)' : '') + '.</p>';
      if (libur.tidakValid > 0) html += '<p class="warn">' + libur.tidakValid + ' baris libur tidak bisa dibaca (formatnya YYYY-MM-DD, mis. 2026-12-25).</p>';
    }
    T.show(box, html);
  };
  p1.appendChild(T.grid2(T.field('Tanggal awal', dari), T.field('Tanggal akhir', sampai)));
  const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lbl.appendChild(cekKerja);
  lbl.appendChild(document.createTextNode('Hitung hari kerja'));
  p1.appendChild(lbl);
  p1.appendChild(T.field('Akhir pekan', akhirPekanSel, 'Hari yang dianggap libur saat menghitung hari kerja'));
  const lblLn = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lblLn.appendChild(cekLiburNasional);
  lblLn.appendChild(document.createTextNode('Pakai libur nasional Indonesia 2026 (25 hari, SKB 3 Menteri)'));
  p1.appendChild(lblLn);
  const lblLn27 = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lblLn27.appendChild(cekLiburNasional2027);
  lblLn27.appendChild(document.createTextNode('Pakai libur nasional Indonesia 2027 (26 hari, SKB 3 Menteri)'));
  p1.appendChild(lblLn27);
  p1.appendChild(T.field('Hari libur tambahan (opsional)', liburTa, 'Satu tanggal per baris, format tahun-bulan-tanggal. Libur yang jatuh di akhir pekan tidak berpengaruh.'));
  p1.appendChild(T.btn('Hitung', hitung, true));
  p1.appendChild(box);
  hitung();

  // ---- Panel 2: tambah / kurang hari / bulan / tahun ----
  const tglInp = T.input('date', 'Tanggal awal', todayISO());
  const jmlInp = T.input('text', 'mis. 30', ''); jmlInp.inputMode = 'numeric';
  const arahSel = T.select([['+', 'Tambah (+)'], ['-', 'Kurang (−)']], '+');
  const satuanSel = T.select([['hari', 'Hari'], ['bulan', 'Bulan'], ['tahun', 'Tahun']], 'hari');
  const akhirPekanSel2 = pilihAkhirPekan();
  const cekKerjaSaja = document.createElement('input');
  cekKerjaSaja.type = 'checkbox'; cekKerjaSaja.id = 'dd-hk';
  const box2 = T.out();
  const hitung2 = () => {
    const t = parseISO(tglInp.value);
    const jml = T.num(jmlInp.value);
    if (!t) { T.show(box2, '<span class="err">Isi tanggal awal dengan benar.</span>'); return; }
    const satuan = satuanSel.value;
    const maks = satuan === 'hari' ? 36500 : satuan === 'bulan' ? 1200 : 100;
    if (!isFinite(jml) || !Number.isInteger(jml) || jml < 0 || jml > maks) {
      T.show(box2, '<span class="err">Jumlah isi bilangan bulat 0 sampai ' + T.fmt(maks) + ' ' + satuan + '.</span>'); return;
    }
    const jumlah = arahSel.value === '+' ? jml : -jml;
    let hasil;
    let keterangan = '';
    if (cekKerjaSaja.checked && satuan === 'hari') {
      hasil = tambahHariKerja(t, jumlah, AKHIR_PEKAN[akhirPekanSel2.value] || [0, 6]);
      keterangan = '<p class="hint">Dihitung hari kerja saja, ' + T.esc(AKHIR_PEKAN_LABEL[akhirPekanSel2.value] || 'Sabtu–Minggu') + ' dilewati.</p>';
    } else if (satuan === 'bulan') {
      hasil = tambahBulanKalender(t, jumlah);
      keterangan = '<p class="hint">Bila tanggal awal tidak ada di bulan hasil (mis. 31 Januari + 1 bulan), hasilnya dijepit ke tanggal terakhir bulan itu (28/29 Februari).</p>';
    } else if (satuan === 'tahun') {
      hasil = tambahBulanKalender(t, jumlah * 12);
      keterangan = '<p class="hint">29 Februari + 1 tahun = 28 Februari di tahun biasa.</p>';
    } else {
      hasil = tambahHari(t, jumlah);
    }
    const akhirPekan = hasil.getUTCDay() === 0 || hasil.getUTCDay() === 6;
    T.show(box2,
      '<div class="center"><div class="dim">Hasil</div><div class="big">' + T.esc(fmtTanggalPanjang(hasil)) + '</div></div>' +
      kv('Tanggal (angka)', hasil.toISOString().slice(0, 10).split('-').reverse().join('/')) +
      (akhirPekan ? '<p class="hint">Tanggal hasilnya jatuh di akhir pekan.</p>' : '') +
      keterangan);
  };
  const segarkanSatuan = () => {
    // Mode hari kerja hanya berlaku untuk satuan hari.
    const labelHk = cekKerjaSaja.parentElement;
    if (labelHk) labelHk.style.opacity = satuanSel.value === 'hari' ? '1' : '0.45';
    hitung2();
  };
  satuanSel.addEventListener('change', segarkanSatuan);
  p2.appendChild(T.el('<p class="hint">Misalnya 30 hari dari hari ini jatuh tanggal berapa, atau 10 hari kerja dari tanggal tertentu.</p>'));
  p2.appendChild(T.field('Tanggal awal', tglInp));
  p2.appendChild(T.grid2(T.field('Jumlah', jmlInp), T.field('Satuan', satuanSel), T.field('Arah', arahSel)));
  const lbl2 = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lbl2.appendChild(cekKerjaSaja);
  lbl2.appendChild(document.createTextNode('Hitung hari kerja saja (hanya untuk satuan hari)'));
  p2.appendChild(lbl2);
  p2.appendChild(T.field('Akhir pekan', akhirPekanSel2));
  p2.appendChild(T.btn('Hitung tanggal', hitung2, true));
  p2.appendChild(box2);

  // ---- Panel 3: hitung mundur ----
  const targetTgl = T.input('date', 'Tanggal target', todayISO());
  const targetJam = T.input('time', '', '00:00');
  const mulaiCd = T.input('date', 'Tanggal mulai (opsional)', '');
  const box3 = T.out();
  let timerCd = null;
  const hentikanCd = () => { if (timerCd) { clearInterval(timerCd); timerCd = null; } };
  T.onLeave(hentikanCd);
  const gambarCd = () => {
    const tgl = targetTgl.value;
    if (!tgl) { T.show(box3, '<span class="err">Isi dulu tanggal targetnya.</span>'); return; }
    const jam = targetJam.value || '00:00';
    const target = new Date(tgl + 'T' + jam + ':00');
    if (isNaN(target.getTime())) { T.show(box3, '<span class="err">Tanggal target tidak bisa dibaca.</span>'); return; }
    const now = new Date();
    const selisih = target.getTime() - now.getTime();
    if (selisih < 0) {
      const lewat = -selisih;
      const hari = Math.floor(lewat / 86400000);
      T.show(box3,
        '<div class="center"><div class="dim">Target sudah lewat</div><div class="big">' + T.fmt(hari) + ' hari yang lalu</div></div>' +
        kv('Target', T.esc(fmtTanggalPanjang(new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())))) + ' pukul ' + T.esc(jam)));
      return;
    }
    const hari = Math.floor(selisih / 86400000);
    const jamSisa = Math.floor(selisih % 86400000 / 3600000);
    const mnt = Math.floor(selisih % 3600000 / 60000);
    const dtk = Math.floor(selisih % 60000 / 1000);
    let progres = '';
    if (mulaiCd.value) {
      const mulai = new Date(mulaiCd.value + 'T00:00:00');
      if (!isNaN(mulai.getTime()) && target.getTime() > mulai.getTime()) {
        const pct = Math.max(0, Math.min(100, (now.getTime() - mulai.getTime()) / (target.getTime() - mulai.getTime()) * 100));
        progres = '<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:12px"><span>Perjalanan ke target</span><span>' + pct.toFixed(1) + '%</span></div>' +
          '<div style="height:10px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;margin-top:4px"><div style="height:100%;width:' + pct + '%;background:#ff6f61"></div></div></div>';
      }
    }
    T.show(box3,
      '<div class="center"><div class="dim">Sisa waktu sampai target</div>' +
      '<div class="big">' + T.fmt(hari) + ' hari ' + String(jamSisa).padStart(2, '0') + ':' + String(mnt).padStart(2, '0') + ':' + String(dtk).padStart(2, '0') + '</div>' +
      '<div class="mut" style="font-size:13px">' + T.fmt(hari) + ' hari, ' + jamSisa + ' jam, ' + mnt + ' menit lagi</div></div>' +
      kv('Target', T.esc(fmtTanggalPanjang(new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())))) + ' pukul ' + T.esc(jam)) +
      progres +
      '<p class="hint">Hitung mundur diperbarui tiap detik.</p>');
  };
  const mulaiCdFn = () => {
    hentikanCd();
    gambarCd();
    timerCd = setInterval(gambarCd, 1000);
  };
  p3.appendChild(T.el('<p class="hint">Misalnya berapa hari lagi sampai liburan, ulang tahun, atau tenggat tugas.</p>'));
  p3.appendChild(T.grid2(T.field('Tanggal target', targetTgl), T.field('Jam target (opsional)', targetJam)));
  p3.appendChild(T.field('Tanggal mulai (opsional)', mulaiCd, 'Bila diisi, muncul baris perjalanan dari tanggal mulai sampai target'));
  p3.appendChild(T.row(T.btn('Mulai hitung mundur', mulaiCdFn, true), T.btn('Berhenti', () => { hentikanCd(); T.show(box3, '<p class="hint">Hitung mundur dihentikan.</p>'); })));
  p3.appendChild(box3);

  // ---- Panel 4: hari kerja (dari Kalkulator Hari Kerja) ----
  // Beda dengan tab "Selisih tanggal": tanggal mulai & akhir sama-sama
  // dihitung, libur tahun selain 2026–2027 diambil dari Nager.Date, ada opsi
  // cuti bersama, dan daftar libur di rentang ditampilkan beserta namanya.
  const hkMulai = T.input('date', '', todayISO());
  const hkAkhirD = new Date();
  hkAkhirD.setDate(hkAkhirD.getDate() + 30);
  const hkAkhir = T.input('date', '', hkAkhirD.getFullYear() + '-' + String(hkAkhirD.getMonth() + 1).padStart(2, '0') + '-' + String(hkAkhirD.getDate()).padStart(2, '0'));
  const hkCuti = T.input('checkbox', '');
  hkCuti.checked = true;
  const hkTambahan = T.ta(3, 'Satu tanggal satu baris, cth:\n2026-06-02\n2026-06-03', '');
  const hkBox = T.out();
  const hkCacheNager = {};

  const hkMuatLiburTahun = async (th) => {
    // 2026-2027: data lokal SKB 3 Menteri (lengkap, tanpa internet).
    if (th === 2026) return { map: new Map(LIBUR_2026.map(([d, n, j]) => [d, n + ' (' + j + ')'])), sumber: 'skb' };
    if (th === 2027) return { map: new Map(LIBUR_2027.map(([d, n, j]) => [d, n + ' (' + j + ')'])), sumber: 'skb' };
    if (hkCacheNager[th]) return hkCacheNager[th];
    // Tahun lain: Nager.Date (sama seperti tool hari-libur), bisa tidak lengkap.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('https://date.nager.at/api/v3/publicholidays/' + th + '/ID', { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('format');
      const out = { map: new Map(data.map((h) => [h.date, (h.localName || h.name) + ' (Libur nasional)'])), sumber: 'nager' };
      hkCacheNager[th] = out;
      return out;
    } catch (e) {
      clearTimeout(timer);
      const out = { map: new Map(), sumber: 'gagal' };
      hkCacheNager[th] = out;
      return out;
    }
  };

  const hkParseTambahan = () => {
    const set = new Map();
    const gagal = [];
    hkTambahan.value.split('\n').forEach((baris) => {
      const s = baris.trim();
      if (!s) return;
      let d = parseISO(s);
      if (!d) {
        const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
        if (m) d = parseISO(m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'));
      }
      if (d) set.set(d.toISOString().slice(0, 10), 'Libur tambahan');
      else gagal.push(s);
    });
    return { set, gagal };
  };

  const hkHitung = async () => {
    const mulai = parseISO(hkMulai.value);
    const akhir = parseISO(hkAkhir.value);
    if (!mulai || !akhir) {
      T.toast('Pilih tanggal mulai dan tanggal akhir dulu.'); return;
    }
    if (akhir < mulai) {
      T.toast('Tanggal akhir harus sama atau sesudah tanggal mulai.'); return;
    }
    const rentangHari = Math.round((akhir - mulai) / 86400000) + 1;
    if (rentangHari > 366 * 3) {
      T.toast('Rentangnya maksimal 3 tahun — persempit tanggalnya.'); return;
    }
    T.show(hkBox, '<div class="dim center">Menghitung…</div>');
    const tahunSet = new Set();
    for (let y = mulai.getUTCFullYear(); y <= akhir.getUTCFullYear(); y++) tahunSet.add(y);
    const libur = new Map();
    let sumberNager = false;
    let sumberGagal = false;
    for (const th of tahunSet) {
      const r = await hkMuatLiburTahun(th);
      if (r.sumber === 'nager') sumberNager = true;
      if (r.sumber === 'gagal') sumberGagal = true;
      r.map.forEach((nama, iso) => {
        if (!hkCuti.checked && /Cuti bersama/.test(nama)) return;
        libur.set(iso, nama);
      });
    }
    const tambahan = hkParseTambahan();
    tambahan.set.forEach((nama, iso) => libur.set(iso, nama));
    const h = hitungHariKerjaInklusif(mulai, akhir, libur);
    let daftarLibur = '';
    if (h.liburDalamRentang.length) {
      daftarLibur = '<div style="margin-top:10px"><b>Hari libur di rentang ini (yang jatuh di hari kerja):</b>' +
        h.liburDalamRentang.map((l) => '<div class="kv"><span class="k">' + T.esc(fmtTanggalPanjang(l.tgl)) + '</span><span class="v">' + T.esc(l.nama) + '</span></div>').join('') + '</div>';
    }
    let catatan = 'Tanggal mulai dan tanggal akhir sama-sama dihitung. Sabtu dan Minggu bukan hari kerja.';
    if (sumberNager) catatan += ' Data libur tahun selain 2026–2027 diambil dari Nager.Date — daftarnya bisa tidak lengkap, cek SKB 3 Menteri untuk daftar resmi.';
    if (sumberGagal) catatan += ' Data libur untuk sebagian tahun gagal dimuat (perlu internet) — tahun itu hanya Sabtu–Minggu yang dikurangi.';
    if (tambahan.gagal.length) catatan += ' Tanggal tambahan yang tidak dikenali dan dilewati: ' + tambahan.gagal.map((g) => T.esc(g)).join(', ') + '.';
    T.show(hkBox,
      '<div class="center"><div class="dim">Hari kerja dari ' + T.esc(fmtTanggalPanjang(mulai)) + ' sampai ' + T.esc(fmtTanggalPanjang(akhir)) + '</div>' +
      '<div class="big">' + h.kerja + ' hari</div></div>' +
      kv('Total hari kalender', h.total + ' hari') +
      kv('Sabtu–Minggu', h.akhirPekan + ' hari') +
      kv('Hari libur (di hari kerja)', h.libur + ' hari') +
      daftarLibur +
      '<p class="hint">' + catatan + '</p>');
  };

  const hkChkWrap = T.el('<label class="chk" style="display:flex;gap:8px;align-items:center"></label>');
  hkChkWrap.appendChild(hkCuti);
  hkChkWrap.appendChild(document.createTextNode(' Hitung cuti bersama sebagai hari libur'));

  p4.appendChild(T.el('<p class="note">Butuh tahu berapa hari kerja sampai deadline, cuti, atau gajian? Pilih dua tanggal — Sabtu, Minggu, dan libur nasional Indonesia otomatis dikurangi.</p>'));
  p4.appendChild(T.grid2(
    T.field('Tanggal mulai', hkMulai),
    T.field('Tanggal akhir', hkAkhir)
  ));
  p4.appendChild(T.field('Opsi', hkChkWrap));
  p4.appendChild(T.field('Libur tambahan (opsional)', hkTambahan, 'Tanggal libur kantor/perusahaanmu, satu per baris. Format: 2026-06-02 atau 02/06/2026.'));
  p4.appendChild(T.row(T.btn('Hitung Hari Kerja', hkHitung, true)));
  p4.appendChild(hkBox);

  root.appendChild(tabs([['Selisih tanggal', 0], ['Tambah/kurang', 1], ['Hitung mundur', 2], ['Hari kerja', 3]], [p1, p2, p3, p4]));
  root.appendChild(p1);
  root.appendChild(p2);
  root.appendChild(p3);
  root.appendChild(p4);
}
