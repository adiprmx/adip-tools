import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-perputaran-persediaan", "name": "Kalkulator Perputaran Persediaan", "cat": "bisnis", "icon": "🔃", "desc": "Berapa kali stok terjual habis dalam setahun dan berapa lama barang mengendap di gudang.", "keywords": "perputaran persediaan,inventory turnover,stok,gudang,hpp,dio,hari persediaan", "since": "6.19.0"};

const fmtD = (x, d) => {
  const r = Number(x.toFixed(d == null ? 2 : d));
  return String(r === 0 ? 0 : r).replace('.', ',');
};

/* Perputaran = HPP / rata-rata persediaan. Hari mengendap = 365 / perputaran.
   Mengembalikan {putaran, hari} atau null bila input tidak valid. */
export function hitungPerputaran(hpp, persediaanRata) {
  const h = Number(hpp), p = Number(persediaanRata);
  if (![h, p].every(isFinite) || p <= 0 || h < 0) return null;
  const putaran = h / p;
  if (!Number.isFinite(putaran)) return null;
  return { putaran, hari: putaran > 0 ? 365 / putaran : null };
}
utils.perputaranPersediaan = hitungPerputaran;

export function render(root) {
  const hppI = T.input('text', 'cth: 600000000', '');
  const awalI = T.input('text', 'cth: 80000000', '');
  const akhirI = T.input('text', 'cth: 120000000', '');
  const box = T.out();

  const hitung = () => {
    const hpp = T.num(hppI.value);
    const awal = T.num(awalI.value);
    const akhir = T.num(akhirI.value);
    if (!isFinite(hpp) || hpp < 0) { T.show(box, '<div class="err">Isi HPP setahun dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(awal) || awal < 0) { T.show(box, '<div class="err">Isi nilai stok awal tahun dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(akhir) || akhir < 0) { T.show(box, '<div class="err">Isi nilai stok akhir tahun dengan angka 0 atau lebih.</div>'); return; }
    const rata = (awal + akhir) / 2;
    const hasil = hitungPerputaran(hpp, rata);
    if (hasil === null) { T.show(box, '<div class="err">Rata-rata stok harus lebih dari 0. Cek lagi stok awal dan akhirnya.</div>'); return; }
    const vonis = hasil.putaran >= 8
      ? 'Stok berputar cepat: barang tidak lama mengendap dan uang tidak tertahan di gudang.'
      : hasil.putaran >= 4
        ? 'Stok berputar wajar untuk kebanyakan usaha dagang.'
        : 'Stok berputar lambat: barang lama mengendap dan uang tertahan di gudang. Cek barang yang jarang laku.';
    T.show(box,
      '<div class="big center">' + fmtD(hasil.putaran) + 'x</div>' +
      '<p class="center">stok terjual habis per tahun</p>' +
      kv('HPP setahun', T.rp(hpp)) +
      kv('Rata-rata nilai stok', T.rp(rata)) +
      kv('Barang mengendap di gudang', hasil.hari == null ? 'tidak terjual sama sekali' : fmtD(hasil.hari, 1) + ' hari') +
      '<p class="' + (hasil.putaran >= 4 ? 'info' : 'warn') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: HPP setahun dibagi rata-rata nilai stok (stok awal + stok akhir, dibagi 2). Hari mengendap = 365 dibagi perputaran. Angka yang sehat beda-beda tiap jenis usaha: toko sembako bisa 12x setahun, toko furnitur bisa 2x.</p>');
  };

  root.appendChild(T.el('<p class="note">Perputaran persediaan mengukur berapa kali stokmu terjual habis dalam setahun. Makin sering berputar, makin cepat uang kembali dan makin sedikit barang mengendap di gudang.</p>'));
  root.appendChild(T.field('HPP setahun (Rp)', hppI, 'Harga pokok barang yang terjual selama setahun.'));
  root.appendChild(T.field('Nilai stok awal tahun (Rp)', awalI, 'Nilai semua stok di awal tahun.'));
  root.appendChild(T.field('Nilai stok akhir tahun (Rp)', akhirI, 'Nilai semua stok di akhir tahun.'));
  root.appendChild(T.row(T.btn('Hitung Perputaran', hitung, true)));
  root.appendChild(box);
}
