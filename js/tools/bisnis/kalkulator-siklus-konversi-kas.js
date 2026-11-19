import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-siklus-konversi-kas", "name": "Kalkulator Siklus Konversi Kas", "cat": "bisnis", "icon": "⏳", "desc": "Berapa hari uangmu terikat dari beli stok sampai terima bayaran pelanggan.", "keywords": "siklus konversi kas,cash conversion cycle,ccc,dio,dso,dpo,modal kerja,piutang,stok,utang dagang", "since": "6.19.0"};

const fmtD = (x, d) => {
  const r = Number(x.toFixed(d == null ? 1 : d));
  return String(r === 0 ? 0 : r).replace('.', ',');
};

/* CCC = DIO + DSO - DPO (dalam hari). Null bila input tidak valid. */
export function hitungCcc(dio, dso, dpo) {
  const v = [dio, dso, dpo].map(Number);
  if (!v.every(isFinite)) return null;
  const c = v[0] + v[1] - v[2];
  return Number.isFinite(c) ? c : null;
}

/* DIO = rata-rata stok / HPP x 365; DSO = rata-rata piutang / penjualan x 365;
   DPO = rata-rata utang dagang / HPP x 365. */
export function hitungKomponen(stokRata, piutangRata, utangRata, hpp, penjualan) {
  const s = Number(stokRata), p = Number(piutangRata), u = Number(utangRata);
  const h = Number(hpp), j = Number(penjualan);
  if (![s, p, u, h, j].every(isFinite) || h <= 0 || j <= 0 || s < 0 || p < 0 || u < 0) return null;
  return { dio: (s / h) * 365, dso: (p / j) * 365, dpo: (u / h) * 365 };
}
utils.siklusKonversiKas = hitungCcc;

export function render(root) {
  const dioI = T.input('text', 'cth: 60', '');
  const dsoI = T.input('text', 'cth: 45', '');
  const dpoI = T.input('text', 'cth: 30', '');
  const stokI = T.input('text', 'cth: 100000000', '');
  const piutangI = T.input('text', 'cth: 75000000', '');
  const utangI = T.input('text', 'cth: 50000000', '');
  const hppI = T.input('text', 'cth: 600000000', '');
  const jualI = T.input('text', 'cth: 900000000', '');
  const box = T.out();

  const hitung = () => {
    let dio = T.num(dioI.value);
    let dso = T.num(dsoI.value);
    let dpo = T.num(dpoI.value);
    let dariData = '';
    const adaData = stokI.value.trim() !== '' || piutangI.value.trim() !== '' || utangI.value.trim() !== '';
    if (adaData) {
      const k = hitungKomponen(T.num(stokI.value), T.num(piutangI.value), T.num(utangI.value), T.num(hppI.value), T.num(jualI.value));
      if (k === null) { T.show(box, '<div class="err">Data keuangan tidak lengkap atau tidak valid. Isi semua kolom data (stok, piutang, utang, HPP, penjualan) dengan angka, HPP dan penjualan harus lebih dari 0.</div>'); return; }
      dio = k.dio; dso = k.dso; dpo = k.dpo;
      dariData = ' (dihitung dari data keuangan di bawah)';
    }
    if (![dio, dso, dpo].every(isFinite) || dio < 0 || dso < 0 || dpo < 0) { T.show(box, '<div class="err">Isi ketiga jumlah hari dengan angka 0 atau lebih, atau isi data keuangan di bawah.</div>'); return; }
    const ccc = hitungCcc(dio, dso, dpo);
    if (ccc === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const vonis = ccc < 0
      ? 'Siklus negatif: kamu menerima bayaran pelanggan sebelum membayar pemasok. Uang pelanggan membiayai operasimu.'
      : ccc <= 30
        ? 'Siklus pendek: uangmu hanya terikat sebentar sebelum kembali sebagai kas.'
        : ccc <= 90
          ? 'Siklus sedang: uangmu terikat beberapa bulan. Cek apakah stok atau piutang bisa dipersingkat.'
          : 'Siklus panjang: uangmu terikat lama di stok dan piutang. Ini menekan kas usahamu.';
    T.show(box,
      '<div class="big center">' + fmtD(ccc) + ' hari</div>' +
      '<p class="center">siklus konversi kas</p>' +
      kv('Barang mengendap (DIO)', fmtD(dio) + ' hari' + dariData) +
      kv('Pelanggan bayar (DSO)', fmtD(dso) + ' hari' + dariData) +
      kv('Kamu bayar pemasok (DPO)', fmtD(dpo) + ' hari' + dariData) +
      '<p class="' + (ccc <= 30 ? 'info' : ccc <= 90 ? 'warn' : 'err') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: hari barang mengendap + hari pelanggan bayar - hari kamu bayar pemasok. Makin pendek siklusnya, makin cepat uang kembali dan makin sedikit modal kerja yang dibutuhkan.</p>');
  };

  root.appendChild(T.el('<p class="note">Siklus konversi kas mengukur berapa lama uangmu terikat: dari membeli stok, sampai stok terjual dan pelanggan membayar. Makin pendek, makin sehat kas usahamu.</p>'));
  root.appendChild(T.field('Hari barang mengendap (DIO)', dioI, 'Rata-rata berapa hari stok di gudang sebelum terjual.'));
  root.appendChild(T.field('Hari pelanggan bayar (DSO)', dsoI, 'Rata-rata berapa hari dari penjualan sampai uang diterima.'));
  root.appendChild(T.field('Hari kamu bayar pemasok (DPO)', dpoI, 'Rata-rata berapa hari dari membeli stok sampai membayar pemasok.'));
  root.appendChild(T.el('<p class="note">Tidak tahu jumlah harinya? Isi data keuangan setahun di bawah, dan ketiganya dihitung otomatis.</p>'));
  root.appendChild(T.field('Rata-rata stok (Rp)', stokI, 'Nilai rata-rata stok selama setahun.'));
  root.appendChild(T.field('Rata-rata piutang (Rp)', piutangI, 'Nilai rata-rata piutang pelanggan selama setahun.'));
  root.appendChild(T.field('Rata-rata utang dagang (Rp)', utangI, 'Nilai rata-rata utang ke pemasok selama setahun.'));
  root.appendChild(T.field('HPP setahun (Rp)', hppI, 'Harga pokok barang yang terjual selama setahun.'));
  root.appendChild(T.field('Penjualan setahun (Rp)', jualI, 'Total penjualan selama setahun.'));
  root.appendChild(T.row(T.btn('Hitung Siklus Konversi Kas', hitung, true)));
  root.appendChild(box);
}
