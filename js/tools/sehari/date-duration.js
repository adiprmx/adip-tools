import { h as T, utils, kv, tabs, parseISO, todayISO } from '../../core.js?v=6.12.2';

export const meta = {"id": "date-duration", "name": "Durasi Tanggal", "cat": "sehari", "icon": "📅", "desc": "Durasi antara dua tanggal, tambah/kurang hari dari tanggal, dan hitung hari kerja dengan daftar libur.", "keywords": "tanggal,durasi,selisih,hari,hari kerja,libur,tambah hari"};

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function fmtTanggalPanjang(d) {
  return NAMA_HARI[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + NAMA_BULAN[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
}

/* Hitung hari kerja (Senin-Jumat) dari awal sampai sebelum akhir, dikurangi libur. */
export function hitungHariKerja(awal, akhir, liburSet) {
  let kerja = 0;
  for (let t = awal.getTime(); t < akhir.getTime(); t += 86400000) {
    const d = new Date(t);
    const w = d.getUTCDay();
    if (w < 1 || w > 5) continue;
    const iso = d.toISOString().slice(0, 10);
    if (liburSet && liburSet.has(iso)) continue;
    kerja++;
  }
  return kerja;
}

/* Tambah/kurang hari kalender dari tanggal. */
export function tambahHari(tanggal, jumlah) {
  const d = new Date(tanggal.getTime());
  d.setUTCDate(d.getUTCDate() + jumlah);
  return d;
}

/* Tambah/kurang hari kerja (lewati Sabtu-Minggu) dari tanggal. */
export function tambahHariKerja(tanggal, jumlah) {
  const d = new Date(tanggal.getTime());
  const arah = jumlah >= 0 ? 1 : -1;
  let sisa = Math.abs(jumlah);
  while (sisa > 0) {
    d.setUTCDate(d.getUTCDate() + arah);
    const w = d.getUTCDay();
    if (w >= 1 && w <= 5) sisa--;
  }
  return d;
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

  // ---- Panel 1: selisih tanggal (fitur lama dipertahankan) ----
  const dari = T.input('date', 'Tanggal awal', todayISO());
  const sampai = T.input('date', 'Tanggal akhir', todayISO());
  const cekKerja = document.createElement('input');
  cekKerja.type = 'checkbox'; cekKerja.checked = true; cekKerja.id = 'dd-kj';
  const liburTa = T.ta(3, 'Satu tanggal per baris, mis.\n2026-12-25\n2027-01-01', '');
  const box = T.out();
  const hitung = () => {
    const a = parseISO(dari.value), b = parseISO(sampai.value);
    if (!a || !b) { T.show(box, '<span class="err">Isi kedua tanggal dengan benar.</span>'); return; }
    const awal = a < b ? a : b, akhir = a < b ? b : a;
    const totalHari = Math.round((akhir - awal) / 86400000);
    const minggu = Math.floor(totalHari / 7), sisaHari = totalHari % 7;
    let html =
      '<div class="center"><div class="big">' + T.fmt(totalHari) + ' hari</div></div>' +
      '<div class="kv"><span class="k">Minggu</span><span class="v">' + minggu + ' minggu ' + sisaHari + ' hari</span></div>' +
      '<div class="kv"><span class="k">Bulan (perkiraan)</span><span class="v">± ' + (totalHari / 30.44).toFixed(1) + ' bulan</span></div>' +
      '<div class="kv"><span class="k">Tahun (perkiraan)</span><span class="v">± ' + (totalHari / 365.25).toFixed(2) + ' tahun</span></div>';
    if (cekKerja.checked) {
      const libur = bacaLibur(liburTa.value);
      const kerja = hitungHariKerja(awal, akhir, libur.set);
      html += '<div class="kv"><span class="k">Hari kerja (Senin-Jumat)</span><span class="v">' + T.fmt(kerja) + ' hari</span></div>';
      if (libur.set.size > 0) html += '<p class="hint">' + libur.set.size + ' hari libur dikurangi dari hitungan hari kerja.</p>';
      if (libur.tidakValid > 0) html += '<p class="warn">' + libur.tidakValid + ' baris libur tidak bisa dibaca (formatnya YYYY-MM-DD, mis. 2026-12-25).</p>';
    }
    T.show(box, html);
  };
  p1.appendChild(T.grid2(T.field('Tanggal awal', dari), T.field('Tanggal akhir', sampai)));
  const lbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lbl.appendChild(cekKerja);
  lbl.appendChild(document.createTextNode('Hitung hari kerja (Senin-Jumat)'));
  p1.appendChild(lbl);
  p1.appendChild(T.field('Hari libur (opsional)', liburTa, 'Satu tanggal per baris, format tahun-bulan-tanggal. Libur yang jatuh di akhir pekan tidak berpengaruh.'));
  p1.appendChild(T.btn('Hitung', hitung, true));
  p1.appendChild(box);
  hitung();

  // ---- Panel 2: tambah / kurang hari ----
  const tglInp = T.input('date', 'Tanggal awal', todayISO());
  const jmlInp = T.input('text', 'mis. 30', ''); jmlInp.inputMode = 'numeric';
  const arahSel = T.select([['+', 'Tambah (+)'], ['-', 'Kurang (−)']], '+');
  const cekKerjaSaja = document.createElement('input');
  cekKerjaSaja.type = 'checkbox'; cekKerjaSaja.id = 'dd-hk';
  const box2 = T.out();
  const hitung2 = () => {
    const t = parseISO(tglInp.value);
    const jml = T.num(jmlInp.value);
    if (!t) { T.show(box2, '<span class="err">Isi tanggal awal dengan benar.</span>'); return; }
    if (!isFinite(jml) || !Number.isInteger(jml) || jml < 0 || jml > 36500) {
      T.show(box2, '<span class="err">Jumlah hari isi bilangan bulat 0 sampai 36500.</span>'); return;
    }
    const jumlah = arahSel.value === '+' ? jml : -jml;
    const hasil = cekKerjaSaja.checked ? tambahHariKerja(t, jumlah) : tambahHari(t, jumlah);
    const akhirPekan = hasil.getUTCDay() === 0 || hasil.getUTCDay() === 6;
    T.show(box2,
      '<div class="center"><div class="dim">Hasil</div><div class="big">' + T.esc(fmtTanggalPanjang(hasil)) + '</div></div>' +
      kv('Tanggal (angka)', hasil.toISOString().slice(0, 10).split('-').reverse().join('/')) +
      (akhirPekan ? '<p class="hint">Tanggal hasilnya jatuh di akhir pekan.</p>' : '') +
      (cekKerjaSaja.checked ? '<p class="hint">Dihitung hari kerja saja, Sabtu dan Minggu dilewati.</p>' : ''));
  };
  p2.appendChild(T.el('<p class="hint">Misalnya 30 hari dari hari ini jatuh tanggal berapa, atau 10 hari kerja dari tanggal tertentu.</p>'));
  p2.appendChild(T.field('Tanggal awal', tglInp));
  p2.appendChild(T.grid2(T.field('Jumlah hari', jmlInp), T.field('Arah', arahSel)));
  const lbl2 = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:4px 0 10px"></label>');
  lbl2.appendChild(cekKerjaSaja);
  lbl2.appendChild(document.createTextNode('Hitung hari kerja saja (lewati Sabtu-Minggu)'));
  p2.appendChild(lbl2);
  p2.appendChild(T.btn('Hitung tanggal', hitung2, true));
  p2.appendChild(box2);

  root.appendChild(tabs([['Selisih tanggal', 0], ['Tambah/kurang hari', 1]], [p1, p2]));
  root.appendChild(p1);
  root.appendChild(p2);
}
