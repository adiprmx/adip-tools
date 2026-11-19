import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-cash-on-cash", "name": "Kalkulator Cash on Cash Return", "cat": "bisnis", "icon": "💵", "desc": "Berapa persen uang tunai yang kamu tanam kembali tiap tahun dari properti sewa.", "keywords": "cash on cash,properti,sewa,investasi properti,uang muka,hasil tunai,rental yield", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* Cash on cash = arus kas tahunan / total uang tunai yang ditanam x 100%.
   Hasil dalam persen. Null bila input tidak valid. */
export function hitungCashOnCash(arusKasTahunan, uangTanam) {
  const cf = Number(arusKasTahunan), inv = Number(uangTanam);
  if (![cf, inv].every(isFinite) || inv <= 0) return null;
  const r = (cf / inv) * 100;
  return Number.isFinite(r) ? r : null;
}
utils.cashOnCash = hitungCashOnCash;

export function render(root) {
  const sewaI = T.input('text', 'cth: 5000000', '');
  const biayaI = T.input('text', 'cth: 1500000', '');
  const cicilI = T.input('text', 'cth: 2500000', '');
  const dpI = T.input('text', 'cth: 100000000', '');
  const lainI = T.input('text', 'cth: 15000000', '0');
  const box = T.out();

  const hitung = () => {
    const sewa = T.num(sewaI.value);
    const biaya = T.num(biayaI.value);
    const cicil = T.num(cicilI.value);
    const dp = T.num(dpI.value);
    const lain = T.num(lainI.value);
    if (!isFinite(sewa) || sewa < 0) { T.show(box, '<div class="err">Isi pemasukan sewa per bulan dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(biaya) || biaya < 0) { T.show(box, '<div class="err">Isi biaya bulanan dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(cicil) || cicil < 0) { T.show(box, '<div class="err">Isi cicilan per bulan dengan angka 0 atau lebih (isi 0 bila beli tunai).</div>'); return; }
    if (!isFinite(dp) || dp <= 0) { T.show(box, '<div class="err">Isi uang muka dengan angka lebih dari 0.</div>'); return; }
    if (!isFinite(lain) || lain < 0) { T.show(box, '<div class="err">Isi biaya awal lainnya dengan angka 0 atau lebih.</div>'); return; }
    const bersihBulan = sewa - biaya - cicil;
    const bersihTahun = bersihBulan * 12;
    const tanam = dp + lain;
    const coc = hitungCashOnCash(bersihTahun, tanam);
    if (coc === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const balik = bersihTahun > 0 ? tanam / bersihTahun : null;
    const vonis = coc >= 8
      ? 'Hasil tunai tahunan ini terbilang bagus untuk properti sewa.'
      : coc >= 4
        ? 'Hasil tunai tahunan ini wajar untuk properti sewa, sekelas deposito yang bagus.'
        : coc > 0
          ? 'Hasil tunai tahunan ini kecil. Cek lagi: apakah sewanya bisa naik, atau biayanya bisa ditekan?'
          : 'Arus kasnya minus: sewa tidak menutup biaya dan cicilan. Properti ini menggerus uangmu tiap bulan.';
    T.show(box,
      '<div class="big center">' + fmtP(coc) + '</div>' +
      '<p class="center">uang tunai kembali per tahun</p>' +
      kv('Uang bersih per bulan', T.rp(bersihBulan)) +
      kv('Uang bersih per tahun', T.rp(bersihTahun)) +
      kv('Total uang tunai yang ditanam', T.rp(tanam)) +
      kv('Perkiraan balik modal', balik == null ? 'tidak balik modal dari sewa saja' : utils.r4(balik).replace('.', ',') + ' tahun') +
      '<p class="' + (coc >= 4 ? 'info' : coc > 0 ? 'warn' : 'err') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: uang bersih setahun dibagi total uang tunai yang kamu keluarkan di awal (uang muka + biaya awal), dikali 100%. Hitungan ini sebelum pajak dan belum menghitung kenaikan harga properti.</p>');
  };

  root.appendChild(T.el('<p class="note">Cash on cash mengukur berapa persen uang tunai yang kamu tanam di properti kembali tiap tahun dari hasil sewa, setelah biaya dan cicilan. Beda dengan yield biasa: yang dihitung hanya uang tunai yang benar-benar keluar dari kantongmu.</p>'));
  root.appendChild(T.field('Pemasukan sewa per bulan (Rp)', sewaI, 'Sewa yang diterima tiap bulan.'));
  root.appendChild(T.field('Biaya bulanan (Rp)', biayaI, 'Perawatan, iuran, pajak, dan biaya lain tiap bulan.'));
  root.appendChild(T.field('Cicilan KPR per bulan (Rp)', cicilI, 'Isi 0 bila properti dibeli tunai tanpa cicilan.'));
  root.appendChild(T.field('Uang muka (Rp)', dpI, 'Uang yang dibayar di awal pembelian.'));
  root.appendChild(T.field('Biaya awal lainnya (Rp)', lainI, 'Biaya notaris, pajak pembelian, renovasi awal, dan sejenisnya.'));
  root.appendChild(T.row(T.btn('Hitung Cash on Cash', hitung, true)));
  root.appendChild(box);
}
