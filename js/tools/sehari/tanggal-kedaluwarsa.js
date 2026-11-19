import { h as T, utils, kv } from '../../core.js';

// Tanggal kedaluwarsa dari tanggal produksi + masa simpan, atau sisa hari
// dari tanggal kedaluwarsa yang sudah tercetak di kemasan.
export function parseTanggal(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0, 0);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return d;
}
export function keISO(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export function tglCantik(d) {
  return d.getDate() + ' ' + NAMA_BULAN[d.getMonth()] + ' ' + d.getFullYear();
}
// Tambah masa simpan. Bulan dijepit ke akhir bulan (31 Jan + 1 bulan =
// 28/29 Feb, bukan 2/3 Maret).
export function tambahMasaSimpan(tglISO, jumlah, satuan) {
  const d = parseTanggal(tglISO);
  const j = Math.trunc(Number(jumlah));
  if (!d || !isFinite(j) || j < 0) return null;
  const hasil = new Date(d);
  if (satuan === 'hari') {
    hasil.setDate(hasil.getDate() + j);
  } else if (satuan === 'bulan') {
    const targetBulan = hasil.getMonth() + j;
    const tahunBaru = hasil.getFullYear() + Math.floor(targetBulan / 12);
    const bulanBaru = ((targetBulan % 12) + 12) % 12;
    const hariTerakhir = new Date(tahunBaru, bulanBaru + 1, 0).getDate();
    hasil.setFullYear(tahunBaru, bulanBaru, Math.min(hasil.getDate(), hariTerakhir));
  } else if (satuan === 'tahun') {
    const tahunBaru = hasil.getFullYear() + j;
    const hariTerakhir = new Date(tahunBaru, hasil.getMonth() + 1, 0).getDate();
    hasil.setFullYear(tahunBaru, hasil.getMonth(), Math.min(hasil.getDate(), hariTerakhir));
  } else return null;
  return hasil;
}
export function sisaHari(tglISO, dariISO) {
  const target = parseTanggal(tglISO);
  const dari = dariISO ? parseTanggal(dariISO) : new Date();
  if (!target || !dari) return null;
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(dari.getFullYear(), dari.getMonth(), dari.getDate());
  return Math.round((a - b) / 86400000);
}
export function statusKedaluarsa(sisa) {
  if (sisa == null) return '';
  if (sisa < 0) return 'kedaluwarsa';
  if (sisa === 0) return 'hari ini';
  if (sisa <= 7) return 'segera';
  return 'aman';
}
utils.tanggalKedaluarsa = { tambahMasaSimpan, sisaHari, statusKedaluarsa };

export const meta = {"id": "tanggal-kedaluwarsa", "name": "Tanggal Kedaluwarsa", "cat": "sehari", "icon": "⏳", "desc": "Hitung tanggal kedaluwarsa dari tanggal produksi dan masa simpan, atau cek sisa hari barangmu.", "keywords": "kedaluwarsa,expired,masa simpan,tanggal produksi,sisa hari,expired date", "since": "6.19.0"};
export function render(root) {
  const modeSel = T.select([['produksi', 'Dari tanggal produksi + masa simpan'], ['langsung', 'Dari tanggal kedaluwarsa yang tercetak']], 'produksi');
  const produksiI = T.input('date', '', '');
  const jumlahI = T.input('text', 'cth: 6', ''); jumlahI.inputMode = 'numeric';
  const satuanSel = T.select([['bulan', 'Bulan'], ['hari', 'Hari'], ['tahun', 'Tahun']], 'bulan');
  const kedaluarsaI = T.input('date', '', '');
  const box = T.out();
  const wrapProduksi = T.el('<div></div>');
  const wrapLangsung = T.el('<div></div>');
  wrapProduksi.appendChild(T.field('Tanggal produksi', produksiI, 'Tanggal barang dibuat, biasanya tercetak di kemasan'));
  wrapProduksi.appendChild(T.grid2(
    T.field('Masa simpan', jumlahI, 'Angka masa simpannya'),
    T.field('Satuan', satuanSel)
  ));
  wrapLangsung.appendChild(T.field('Tanggal kedaluwarsa', kedaluarsaI, 'Tanggal yang tercetak di kemasan'));

  const tampilHasil = (tglKedaluarsa) => {
    const sisa = sisaHari(keISO(tglKedaluarsa));
    const status = statusKedaluarsa(sisa);
    const label = status === 'kedaluwarsa' ? 'Sudah kedaluwarsa ' + T.fmt(Math.abs(sisa)) + ' hari lalu'
      : status === 'hari ini' ? 'Kedaluwarsa hari ini'
      : status === 'segera' ? 'Segera kedaluwarsa, sisa ' + T.fmt(sisa) + ' hari'
      : 'Masih aman, sisa ' + T.fmt(sisa) + ' hari';
    T.show(box,
      '<div class="big">' + tglCantik(tglKedaluarsa) + '</div>' +
      '<p class="center mut">' + label + '.</p>' +
      kv('Tanggal kedaluwarsa', tglCantik(tglKedaluarsa)) +
      kv('Sisa hari', sisa < 0 ? T.fmt(sisa) + ' hari (lewat)' : T.fmt(sisa) + ' hari') +
      (status === 'segera' || status === 'hari ini' ? '<p class="warn">Segera pakai atau habiskan sebelum tanggalnya lewat.</p>' : '') +
      (status === 'kedaluwarsa' ? '<p class="warn">Barang yang sudah kedaluwarsa sebaiknya tidak dipakai lagi, terutama makanan, obat, dan kosmetik.</p>' : ''));
  };

  const hitung = () => {
    if (modeSel.value === 'produksi') {
      wrapProduksi.hidden = false; wrapLangsung.hidden = true;
      if (!produksiI.value) { T.hide(box); return; }
      const j = T.num(jumlahI.value);
      if (!isFinite(j) || j < 0 || j > 10000) { T.show(box, '<div class="err">Masa simpan harus angka 0 sampai 10000.</div>'); return; }
      const hasil = tambahMasaSimpan(produksiI.value, j, satuanSel.value);
      if (!hasil) { T.show(box, '<div class="err">Tanggal produksi tidak valid.</div>'); return; }
      tampilHasil(hasil);
    } else {
      wrapProduksi.hidden = true; wrapLangsung.hidden = false;
      if (!kedaluarsaI.value) { T.hide(box); return; }
      const d = parseTanggal(kedaluarsaI.value);
      if (!d) { T.show(box, '<div class="err">Tanggal kedaluwarsa tidak valid.</div>'); return; }
      tampilHasil(d);
    }
  };
  [modeSel, produksiI, jumlahI, satuanSel, kedaluarsaI].forEach((i) => i.addEventListener('input', hitung));
  modeSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Cek kapan barangmu kedaluwarsa supaya tidak keburu basi atau tidak sengaja terpakai setelah lewat tanggal.</p>'));
  root.appendChild(T.field('Cara hitung', modeSel));
  root.appendChild(wrapProduksi);
  root.appendChild(wrapLangsung);
  root.appendChild(box);
  hitung();
}
