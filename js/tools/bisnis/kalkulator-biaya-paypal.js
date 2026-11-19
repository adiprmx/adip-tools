import { h as T, utils, kv } from '../../core.js';

// Biaya menerima pembayaran lewat PayPal. Fee = jumlah x persen +
// biaya tetap, ditambah biaya konversi mata uang bila ada.
// Tarif persen dari halaman tarif resmi PayPal (dicek 19 November 2026):
// dalam negeri 3,40%, luar negeri 4,40% (Indonesia masuk kelompok
// "all other markets"), konversi mata uang Asia Pasifik 3,0%.
// Biaya tetap dalam rupiah TIDAK tercantum di halaman tarif resmi itu
// (daftar biaya tetap hanya mencantumkan mata uang lain, mis. US$0,30),
// jadi nilai awal Rp5.000 bisa diubah user sesuai tagihan terakhirnya.
export function hitungPaypal(jumlah, persen, tetap, konversiPersen) {
  const j = Number(jumlah);
  const p = Number(persen);
  const t = Math.max(0, Number(tetap) || 0);
  const k = Math.max(0, Number(konversiPersen) || 0);
  if (!isFinite(j) || j <= 0 || !isFinite(p) || p < 0 || p >= 100) return null;
  const fee = j * p / 100 + t;
  const feeKonversi = j * k / 100;
  const totalFee = fee + feeKonversi;
  return { fee, feeKonversi, totalFee, bersih: j - totalFee };
}
// Tagihan kotor supaya yang diterima bersih sekian:
// kotor = (bersih + tetap) / (1 - persen - konversi).
export function hitungTagihanPaypal(bersih, persen, tetap, konversiPersen) {
  const b = Number(bersih);
  const p = Number(persen);
  const t = Math.max(0, Number(tetap) || 0);
  const k = Math.max(0, Number(konversiPersen) || 0);
  if (!isFinite(b) || b <= 0 || !isFinite(p) || p < 0 || p + k >= 100) return null;
  const kotor = (b + t) / (1 - (p + k) / 100);
  const r = hitungPaypal(kotor, p, t, k);
  return r ? { kotor, ...r } : null;
}
utils.biayaPaypal = hitungPaypal;

export const meta = {"id": "kalkulator-biaya-paypal", "name": "Kalkulator Biaya PayPal", "cat": "bisnis", "icon": "💸", "desc": "Berapa fee PayPal yang dipotong dan berapa bersih yang sampai ke kamu.", "keywords": "paypal,fee,biaya,terima pembayaran,freelance,luar negeri,konversi,bersih", "since": "6.18.0"};
export function render(root) {
  const modeSel = T.select([
    ['terima', 'Hitung dari jumlah yang dikirim'],
    ['tagih', 'Hitung tagihan supaya terima bersih sekian'],
  ], 'terima');
  const jenisSel = T.select([
    ['3.4', 'Dalam negeri (3,40%)'],
    ['4.4', 'Luar negeri (4,40%)'],
  ], '4.4');
  const jumlahI = T.input('text', 'cth: 1000000', ''); jumlahI.inputMode = 'decimal';
  const persenI = T.input('text', 'cth: 4,4', '4,4'); persenI.inputMode = 'decimal';
  const tetapI = T.input('text', 'cth: 5000', '5000'); tetapI.inputMode = 'decimal';
  const konvSel = T.select([['0', 'Tidak ada konversi mata uang'], ['3', 'Ya, ada konversi (tambah 3,0%)']], '0');
  const box = T.out();

  jenisSel.addEventListener('change', () => {
    persenI.value = jenisSel.value.replace('.', ',');
    hitung();
  });

  const hitung = () => {
    const jumlah = T.num(jumlahI.value);
    const persen = T.num(persenI.value);
    const tetap = T.num(tetapI.value);
    const konv = T.num(konvSel.value);
    if (!isFinite(jumlah) || jumlah <= 0) {
      T.show(box, '<div class="err">Jumlah uang harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(persen) || persen < 0 || persen >= 100) {
      T.show(box, '<div class="err">Persen fee harus angka antara 0 sampai di bawah 100.</div>');
      return;
    }
    if (!isFinite(tetap) || tetap < 0) {
      T.show(box, '<div class="err">Biaya tetap harus diisi angka 0 atau lebih.</div>');
      return;
    }
    if (modeSel.value === 'tagih') {
      const r = hitungTagihanPaypal(jumlah, persen, tetap, konv);
      if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi persen fee-nya.</div>'); return; }
      T.show(box,
        '<div class="big">' + T.rp(Math.round(r.kotor)) + '</div>' +
        '<p class="center mut">Tagih sebesar ini supaya bersih yang kamu terima ' + T.rp(Math.round(jumlah)) + '.</p>' +
        kv('Fee persen (' + String(persen).replace('.', ',') + '%)', T.rp(Math.round(r.fee - tetap))) +
        kv('Biaya tetap', T.rp(Math.round(tetap))) +
        (konv > 0 ? kv('Biaya konversi (' + String(konv).replace('.', ',') + '%)', T.rp(Math.round(r.feeKonversi))) : '') +
        kv('Total fee', T.rp(Math.round(r.totalFee))) +
        kv('Yang kamu terima bersih', T.rp(Math.round(r.bersih))) +
        '<p class="hint">Tarif 3,40% (dalam negeri) dan 4,40% (luar negeri) dari halaman tarif resmi PayPal, dicek 19 November 2026. Biaya tetap rupiah tidak tercantum di halaman itu, jadi angka Rp5.000 di atas bisa kamu sesuaikan. Tarif bisa berubah, cek halaman tarif PayPal sebelum menagih.</p>');
      return;
    }
    const r = hitungPaypal(jumlah, persen, tetap, konv);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi persen fee-nya.</div>'); return; }
    T.show(box,
      '<div class="big">' + T.rp(Math.round(r.bersih)) + '</div>' +
      '<p class="center mut">Bersih yang sampai ke kamu dari ' + T.rp(Math.round(jumlah)) + '.</p>' +
      kv('Fee persen (' + String(persen).replace('.', ',') + '%)', T.rp(Math.round(r.fee - tetap))) +
      kv('Biaya tetap', T.rp(Math.round(tetap))) +
      (konv > 0 ? kv('Biaya konversi (' + String(konv).replace('.', ',') + '%)', T.rp(Math.round(r.feeKonversi))) : '') +
      kv('Total fee', T.rp(Math.round(r.totalFee))) +
      (r.bersih < 0 ? '<p class="err">Fee-nya lebih besar dari jumlah yang dikirim. Pembayaran sekecil ini tidak layak lewat PayPal.</p>' : '') +
      '<p class="hint">Tarif 3,40% (dalam negeri) dan 4,40% (luar negeri) dari halaman tarif resmi PayPal, dicek 19 November 2026. Biaya tetap rupiah tidak tercantum di halaman itu, jadi angka Rp5.000 di atas bisa kamu sesuaikan. Tarif bisa berubah, cek halaman tarif PayPal sebelum menagih.</p>');
  };
  [modeSel, konvSel].forEach((i) => i.addEventListener('change', hitung));
  [jumlahI, persenI, tetapI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">PayPal memotong fee dari setiap pembayaran yang kamu terima. Masukkan jumlahnya, dan lihat berapa yang benar-benar sampai ke kamu, atau berapa yang harus kamu tagih supaya bersihnya pas.</p>'));
  root.appendChild(T.field('Mode hitung', modeSel));
  root.appendChild(T.field('Jumlah uang (Rp)', jumlahI, 'Jumlah yang dikirim, atau bersih yang mau kamu terima, sesuai mode di atas'));
  root.appendChild(T.field('Jenis transaksi', jenisSel));
  root.appendChild(T.grid2(
    T.field('Fee persen (%)', persenI, 'Terisi otomatis dari jenis transaksi, bisa diubah'),
    T.field('Biaya tetap (Rp)', tetapI, 'Biaya tetap per transaksi')
  ));
  root.appendChild(T.field('Konversi mata uang', konvSel, 'Pilih Ya bila uangnya dikonversi ke rupiah, mis. dari dolar'));
  root.appendChild(box);
}
