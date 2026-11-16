import { h as T, utils, kv } from '../../core.js?v=6.13.0';

export const meta = {"id": "kalkulator-hari-kerja", "name": "Kalkulator Hari Kerja", "cat": "produktivitas", "icon": "🗓️", "desc": "Hitung jumlah hari kerja antara dua tanggal — sudah dikurangi Sabtu, Minggu, dan libur nasional Indonesia.", "keywords": "hari kerja,business days,libur nasional,tanggal,cuti,deadline,hrd,payroll,sabtu minggu", "since": "6.13.0"};

// Data libur 2026: SAMA dengan yang dipakai tool hari-libur (tidak bisa
// diimpor langsung karena daftarnya tersimpan di dalam render() tool itu,
// jadi disalin ke sini dengan sumber yang sama).
// Sumber: SKB 3 Menteri No. 1497/2025, No. 2/2025, No. 5/2025
// (17 hari libur nasional + 8 cuti bersama). Tanggal hari besar Islam bisa
// bergeser bila ada keputusan Menteri Agama (sidang isbat).
// Format: [tanggal ISO, nama, jenis]
const SKB_2026 = [
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

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return d;
}
function keISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function fmtTgl(d) {
  return NAMA_HARI[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear();
}

// libur: Map iso -> nama. Libur yang jatuh di Sabtu/Minggu tidak dihitung
// ganda (sudah terhitung sebagai akhir pekan).
function hitungHariKerja(mulai, akhir, libur) {
  let total = 0;
  let akhirPekan = 0;
  let liburKerja = 0;
  const liburDalamRentang = [];
  const d = new Date(mulai.getTime());
  while (d <= akhir) {
    total++;
    const dow = d.getDay();
    const iso = keISO(d);
    if (dow === 0 || dow === 6) {
      akhirPekan++;
    } else if (libur.has(iso)) {
      liburKerja++;
      liburDalamRentang.push({ iso, nama: libur.get(iso), tgl: new Date(d.getTime()) });
    }
    d.setDate(d.getDate() + 1);
  }
  return { total, akhirPekan, libur: liburKerja, kerja: total - akhirPekan - liburKerja, liburDalamRentang };
}

utils.hariKerjaHitung = hitungHariKerja;
utils.hariKerjaLibur2026 = SKB_2026;

export function render(root) {
  const today = new Date();
  const mulaiI = T.input('date', '', keISO(today));
  const akhirD = new Date(today.getTime());
  akhirD.setDate(akhirD.getDate() + 30);
  const akhirI = T.input('date', '', keISO(akhirD));
  const cutiBersamaI = T.input('checkbox', '');
  cutiBersamaI.checked = true;
  const tambahanI = T.ta(3, 'Satu tanggal satu baris, cth:\n2026-06-02\n2026-06-03', '');
  const box = T.out();
  const cacheNager = {};

  const muatLiburTahun = async (th) => {
    // 2026: data lokal SKB 3 Menteri (lengkap, tanpa internet).
    if (th === 2026) return { map: new Map(SKB_2026.map(([d, n, j]) => [d, n + ' (' + j + ')'])), sumber: 'skb' };
    if (cacheNager[th]) return cacheNager[th];
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
      cacheNager[th] = out;
      return out;
    } catch (e) {
      clearTimeout(timer);
      const out = { map: new Map(), sumber: 'gagal' };
      cacheNager[th] = out;
      return out;
    }
  };

  const parseTambahan = () => {
    const set = new Map();
    const gagal = [];
    tambahanI.value.split('\n').forEach((baris) => {
      const s = baris.trim();
      if (!s) return;
      let d = parseISO(s);
      if (!d) {
        const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
        if (m) d = parseISO(m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'));
      }
      if (d) set.set(keISO(d), 'Libur tambahan');
      else gagal.push(s);
    });
    return { set, gagal };
  };

  const hitung = async () => {
    const mulai = parseISO(mulaiI.value);
    const akhir = parseISO(akhirI.value);
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
    T.show(box, '<div class="dim center">Menghitung…</div>');
    const tahunSet = new Set();
    for (let y = mulai.getFullYear(); y <= akhir.getFullYear(); y++) tahunSet.add(y);
    const libur = new Map();
    let sumberNager = false;
    let sumberGagal = false;
    for (const th of tahunSet) {
      const r = await muatLiburTahun(th);
      if (r.sumber === 'nager') sumberNager = true;
      if (r.sumber === 'gagal') sumberGagal = true;
      r.map.forEach((nama, iso) => {
        if (!cutiBersamaI.checked && /Cuti bersama/.test(nama)) return;
        libur.set(iso, nama);
      });
    }
    const tambahan = parseTambahan();
    tambahan.set.forEach((nama, iso) => libur.set(iso, nama));
    const h = hitungHariKerja(mulai, akhir, libur);
    let daftarLibur = '';
    if (h.liburDalamRentang.length) {
      daftarLibur = '<div style="margin-top:10px"><b>Hari libur di rentang ini (yang jatuh di hari kerja):</b>' +
        h.liburDalamRentang.map((l) => '<div class="kv"><span class="k">' + T.esc(fmtTgl(l.tgl)) + '</span><span class="v">' + T.esc(l.nama) + '</span></div>').join('') + '</div>';
    }
    let catatan = 'Tanggal mulai dan tanggal akhir sama-sama dihitung. Sabtu dan Minggu bukan hari kerja.';
    if (sumberNager) catatan += ' Data libur tahun selain 2026 diambil dari Nager.Date — daftarnya bisa tidak lengkap, cek SKB 3 Menteri untuk daftar resmi.';
    if (sumberGagal) catatan += ' Data libur untuk sebagian tahun gagal dimuat (perlu internet) — tahun itu hanya Sabtu–Minggu yang dikurangi.';
    if (tambahan.gagal.length) catatan += ' Tanggal tambahan yang tidak dikenali dan dilewati: ' + tambahan.gagal.map((g) => T.esc(g)).join(', ') + '.';
    T.show(box,
      '<div class="center"><div class="dim">Hari kerja dari ' + T.esc(fmtTgl(mulai)) + ' sampai ' + T.esc(fmtTgl(akhir)) + '</div>' +
      '<div class="big">' + h.kerja + ' hari</div></div>' +
      kv('Total hari kalender', h.total + ' hari') +
      kv('Sabtu–Minggu', h.akhirPekan + ' hari') +
      kv('Hari libur (di hari kerja)', h.libur + ' hari') +
      daftarLibur +
      '<p class="hint">' + catatan + '</p>');
  };

  const chkWrap = T.el('<label class="chk" style="display:flex;gap:8px;align-items:center"></label>');
  chkWrap.appendChild(cutiBersamaI);
  chkWrap.appendChild(document.createTextNode(' Hitung cuti bersama sebagai hari libur'));

  root.appendChild(T.el('<p class="note">Butuh tahu berapa hari kerja sampai deadline, cuti, atau gajian? Pilih dua tanggal — Sabtu, Minggu, dan libur nasional Indonesia otomatis dikurangi.</p>'));
  root.appendChild(T.grid2(
    T.field('Tanggal mulai', mulaiI),
    T.field('Tanggal akhir', akhirI)
  ));
  root.appendChild(T.field('Opsi', chkWrap));
  root.appendChild(T.field('Libur tambahan (opsional)', tambahanI, 'Tanggal libur kantor/perusahaanmu, satu per baris. Format: 2026-06-02 atau 02/06/2026.'));
  root.appendChild(T.row(T.btn('Hitung Hari Kerja', hitung, true)));
  root.appendChild(box);
}
