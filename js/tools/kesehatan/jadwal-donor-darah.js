import { h as T, esc, utils } from '../../core.js';

// Jadwal donor darah: kapan kamu boleh donor lagi setelah donor terakhir.
// Jeda antar donor (standar internasional AABB/Palang Merah; sejalan
// dengan anjuran UDD PMI "minimal 2 bulan sekali" untuk darah lengkap):
//   darah lengkap 56 hari (8 minggu), atau 90 hari (3 bulan) bila UDD
//   setempat memakai jeda 3 bulan; plasma 14 hari; trombosit 14 hari.
// Semua hitungan tanggal memakai UTC supaya tidak bergeser karena zona
// waktu. Parameter hariIniISO membuat fungsi ini bisa diuji dengan
// tanggal "hari ini" yang ditentukan.
export const JEDA_DONOR = {
  lengkap56: { hari: 56, label: 'Darah lengkap (56 hari)' },
  lengkap90: { hari: 90, label: 'Darah lengkap (90 hari)' },
  plasma: { hari: 14, label: 'Plasma (14 hari)' },
  trombosit: { hari: 14, label: 'Trombosit (14 hari)' },
};

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return d;
}

function keISO(d) {
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}

function tambahHari(d, n) {
  const c = new Date(d.getTime());
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

export function donorBerikutnya(terakhirISO, jenis, hariIniISO) {
  const j = JEDA_DONOR[jenis];
  const t = parseISO(terakhirISO);
  if (!j || !t) return null;
  const boleh = tambahHari(t, j.hari);
  const hariIni = hariIniISO ? parseISO(hariIniISO) : new Date();
  const hariIniUTC = hariIniISO ? hariIni : new Date(Date.UTC(hariIni.getFullYear(), hariIni.getMonth(), hariIni.getDate()));
  const sisaHari = Math.round((boleh.getTime() - hariIniUTC.getTime()) / 86400000);
  const jadwal = [0, 1, 2].map((i) => keISO(tambahHari(boleh, i * j.hari)));
  return { bolehISO: keISO(boleh), sisaHari, jadwal, jedaHari: j.hari };
}

export const meta = { "id": "jadwal-donor-darah", "name": "Jadwal Donor Darah", "cat": "kesehatan", "icon": "🩸", "desc": "Kapan kamu boleh donor lagi setelah donor terakhir, untuk darah lengkap, plasma, dan trombosit.", "keywords": "donor darah,jadwal donor,pmi,plasma,trombosit,darah lengkap,udd", "since": "6.19.0" };

export function render(root) {
  const terakhir = T.input('date', '', '');
  const jenis = T.select([
    ['lengkap56', 'Darah lengkap, jeda 56 hari (8 minggu)'],
    ['lengkap90', 'Darah lengkap, jeda 90 hari (3 bulan)'],
    ['plasma', 'Plasma, jeda 14 hari'],
    ['trombosit', 'Trombosit, jeda 14 hari'],
  ], 'lengkap56');
  const box = T.out();

  const hitung = () => {
    const r = donorBerikutnya(terakhir.value, jenis.value);
    if (!r) {
      T.show(box, '<span class="err">Isi tanggal donor terakhirmu dulu.</span>');
      return;
    }
    const sudah = r.sisaHari <= 0;
    const barisJadwal = r.jadwal.map((iso, i) => '<div class="kv"><span class="k">' + (i === 0 ? 'Donor berikutnya' : 'Berikutnya lagi (' + (i + 1) + ')') + '</span><span class="v">' + esc(utils.tglIndo(iso)) + '</span></div>').join('');
    T.show(box,
      '<div class="center"><div class="dim">Kamu boleh donor lagi pada</div>' +
      '<div class="big" style="font-size:28px">' + esc(utils.tglIndo(r.bolehISO)) + '</div>' +
      '<div class="' + (sudah ? 'ok' : 'warn') + '" style="margin-top:6px"><b>' + (sudah ? 'Sudah bisa donor lagi.' : 'Masih ' + r.sisaHari + ' hari lagi.') + '</b><br>' +
      (sudah ? 'Jeda sejak donor terakhirmu sudah terlewati. Pastikan badanmu sehat saat datang.' : 'Tunggu sampai tanggal itu supaya tubuhmu pulih sepenuhnya.') + '</div></div>' +
      '<div class="kv"><span class="k">Donor terakhir</span><span class="v">' + esc(utils.tglIndo(terakhir.value)) + '</span></div>' +
      '<div class="kv"><span class="k">Jenis donor</span><span class="v">' + esc(JEDA_DONOR[jenis.value].label) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">3 jadwal ke depan</div>' +
      barisJadwal +
      '<div class="dim" style="margin-top:12px">Syarat umum donor (PMI)</div>' +
      '<div class="kv"><span class="k">Umur</span><span class="v">17-65 tahun (17 tahun perlu izin orang tua)</span></div>' +
      '<div class="kv"><span class="k">Berat badan</span><span class="v">minimal 45 kg</span></div>' +
      '<div class="kv"><span class="k">Kondisi</span><span class="v">sehat, tidak demam, tidak minum obat tertentu</span></div>' +
      '<p class="hint">Jeda di atas mengikuti standar internasional dan anjuran UDD PMI. UDD setempat bisa memakai jeda yang sedikit berbeda, ' +
      'dan petugas yang memutuskan kamu boleh donor atau tidak pada hari itu (cek tekanan darah, hemoglobin, dan kondisi badan). ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Kalau kamu merasa tidak enak badan setelah donor, hubungi UDD atau dokter.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Tanggal donor terakhir', terakhir),
    T.field('Jenis donor', jenis, 'Pilih 90 hari bila UDD tempatmu memakai jeda 3 bulan.'),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  // Isi tanggal contoh: 56 hari yang lalu, supaya hasil langsung terlihat.
  const contoh = new Date();
  contoh.setDate(contoh.getDate() - 56);
  terakhir.value = contoh.getFullYear() + '-' + String(contoh.getMonth() + 1).padStart(2, '0') + '-' + String(contoh.getDate()).padStart(2, '0');
  hitung();
}
