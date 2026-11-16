import { h as T, utils, esc } from '../../core.js?v=6.12.2';

export const meta = {"id":"hari-libur","name":"Hari Libur Indonesia","cat":"liveapi","icon":"📅","desc":"Daftar hari libur nasional Indonesia per tahun.","keywords":"hari,libur,nasional,tanggal,merah,indonesia"};
export function render(root) {
  // Data lokal 2026 — sumber utama: SKB 3 Menteri No. 1497/2025, No. 2/2025,
  // No. 5/2025 (17 hari libur nasional + 8 cuti bersama).
  // Dipakai sebagai sumber utama karena date.nager.at untuk Indonesia 2026
  // hanya mengembalikan 9 hari dan tidak memuat Idul Fitri, Idul Adha,
  // Nyepi, Waisak, Isra Mi'raj, Maulid, dan Tahun Baru Islam.
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

  const tahun = T.select([['2025', '2025'], ['2026', '2026'], ['2027', '2027']], '2026');
  const box = T.out();
  const fmtTgl = (iso) => {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return iso; }
  };

  // Render daftar yang sudah dinormalisasi: [{date, name, jenis}]
  const tampilkan = (th, data, sumber) => {
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    let berikutnya = null;
    let html = '';
    data.forEach((h) => {
      const tgl = new Date(h.date + 'T00:00:00');
      const lewat = tgl < hariIni;
      if (!lewat && !berikutnya) berikutnya = h;
      const sisa = Math.round((tgl - hariIni) / 86400000);
      html += '<div class="kv"' + (lewat ? ' style="opacity:0.45"' : '') + '>' +
        '<span class="k">' + esc(fmtTgl(h.date)) + '</span>' +
        '<span class="v" style="text-align:right"><b>' + esc(h.name || '-') + '</b>' +
        (h.jenis ? '<br><span class="dim" style="font-size:12px">' + esc(h.jenis) + '</span>' : '') +
        (!lewat && sisa >= 0 ? '<br><span class="info" style="font-size:12px">' + sisa + ' hari lagi</span>' : '') +
        '</span></div>';
    });
    let head = '';
    if (berikutnya) {
      const tgl = new Date(berikutnya.date + 'T00:00:00');
      const sisa = Math.round((tgl - hariIni) / 86400000);
      head = '<div class="center" style="margin-bottom:10px"><div class="dim">Libur terdekat</div>' +
        '<div class="big">' + sisa + ' hari lagi</div>' +
        '<div class="info"><b>' + esc(berikutnya.name) + '</b> — ' + esc(fmtTgl(berikutnya.date)) + '</div></div>';
    } else {
      head = '<div class="dim center" style="margin-bottom:10px">Semua libur tahun ' + esc(th) + ' sudah lewat.</div>';
    }
    T.show(box, head + html + '<div class="hint">' + sumber + '</div>');
  };

  const muat = async () => {
    const th = tahun.value;
    // Tahun 2026: data lokal SKB 3 Menteri (lengkap, tanpa internet).
    if (th === '2026') {
      tampilkan(th, SKB_2026.map(([date, name, jenis]) => ({ date, name, jenis })),
        'Data 2026: SKB 3 Menteri No. 1497/2025, No. 2/2025, No. 5/2025 — 17 hari libur nasional + 8 cuti bersama. ' +
        'Tanggal hari besar Islam bisa bergeser bila ada keputusan Menteri Agama (sidang isbat).');
      return;
    }
    // Tahun lain: Nager.Date sebagai pelengkap, dengan disclaimer ketidaklengkapan.
    T.show(box, '<div class="dim center">Memuat hari libur ' + esc(th) + '…</div>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch('https://date.nager.at/api/v3/publicholidays/' + th + '/ID', { signal: ctrl.signal });
      clearTimeout(timer);
      status = res.status;
      if (!res.ok) throw new Error('HTTP ' + res.status + ' dari server.');
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('Tahun ' + th + ' di luar jangkauan data libur nasional.');
      tampilkan(th, data.map((h) => ({ date: h.date, name: h.localName || h.name, jenis: 'Libur nasional' })),
        'Data ' + esc(th) + ' dari Nager.Date — daftarnya bisa tidak lengkap (beberapa hari besar keagamaan tidak tercantum). ' +
        'Untuk daftar resmi, cek SKB 3 Menteri tahun ' + esc(th) + '.');
    } catch (e) {
      clearTimeout(timer);
      let msg;
      if (e.name === 'AbortError') msg = 'Waktu permintaan habis (timeout 15 detik). Koneksi lambat atau server tidak merespons.';
      else if (status === 429) msg = 'Rate limit tercapai (429). Terlalu banyak permintaan — tunggu sebentar lalu coba lagi.';
      else if (status === 404 || /di luar jangkauan/.test(e.message)) msg = 'Tahun ' + th + ' di luar jangkauan data libur nasional. Pilih tahun 2025–2027.';
      else msg = 'Gagal memuat hari libur. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wrap);
    }
  };
  root.appendChild(T.grid2(T.field('Tahun', tahun)));
  root.appendChild(T.row(T.btn('📅 Tampilkan', muat, true)));
  root.appendChild(box);
  tahun.addEventListener('change', muat);
  muat();
}
