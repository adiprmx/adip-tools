import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-safety-stock", "name": "Kalkulator Safety Stock", "cat": "bisnis", "icon": "🛡️", "desc": "Stok pengaman supaya barang tidak habis saat permintaan naik atau kiriman telat.", "keywords": "safety stock,stok pengaman,persediaan,lead time,service level,stok", "since": "6.17.0"};

// Safety stock = Z x simpangan baku permintaan x akar(lead time).
// Bila lead time juga berubah-ubah:
//   SS = Z x akar(lead time rata-rata x sigmaD^2 + permintaan rata-rata^2 x sigmaLT^2).
// Z dari tingkat layanan: 90% = 1,28; 95% = 1,65; 99% = 2,33.
// Reorder point = permintaan rata-rata x lead time + safety stock.
export const Z_LAYANAN = { '90': 1.28, '95': 1.65, '99': 2.33 };

export function hitungSafetyStock(z, sigmaD, leadTime, permintaanRata, sigmaLT) {
  const zz = Number(z), sd = Number(sigmaD), lt = Number(leadTime);
  const d = Number(permintaanRata || 0), slt = Number(sigmaLT || 0);
  if (![zz, sd, lt, d, slt].every(isFinite) || zz <= 0 || sd < 0 || lt <= 0 || d < 0 || slt < 0) return null;
  let ss;
  if (slt > 0 && d > 0) ss = zz * Math.sqrt(lt * sd * sd + d * d * slt * slt);
  else ss = zz * sd * Math.sqrt(lt);
  const rop = d > 0 ? d * lt + ss : null;
  if (!isFinite(ss) || (rop != null && !isFinite(rop))) return null;
  return { ss, rop };
}

export function render(root) {
  const zI = T.select([['90', '90% (Z = 1,28)'], ['95', '95% (Z = 1,65)'], ['99', '99% (Z = 2,33)']], '95');
  const sdI = T.input('text', 'cth: 20', '');
  const ltI = T.input('text', 'cth: 7', '');
  const dI = T.input('text', 'cth: 100', '');
  const sltI = T.input('text', 'cth: 2', '');
  const box = T.out();

  const hitung = () => {
    const z = Z_LAYANAN[zI.value];
    const sd = T.num(sdI.value);
    const lt = T.num(ltI.value);
    const dRaw = dI.value.trim(), sltRaw = sltI.value.trim();
    const d = dRaw === '' ? 0 : T.num(dRaw);
    const slt = sltRaw === '' ? 0 : T.num(sltRaw);
    if (!isFinite(sd) || sd < 0) { T.show(box, '<div class="err">Naik turun permintaan harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(lt) || lt <= 0) { T.show(box, '<div class="err">Lead time harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(d) || d < 0) { T.show(box, '<div class="err">Permintaan rata-rata harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    if (!isFinite(slt) || slt < 0) { T.show(box, '<div class="err">Naik turun lead time harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    if (slt > 0 && d <= 0) { T.show(box, '<div class="err">Kalau lead time berubah-ubah, permintaan rata-rata harus diisi.</div>'); return; }
    const hasil = hitungSafetyStock(z, sd, lt, d, slt);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    T.show(box,
      '<div class="big center">' + T.fmt(Math.ceil(hasil.ss)) + ' unit</div>' +
      '<p class="center">stok pengaman yang perlu disiapkan</p>' +
      (hasil.rop == null ? '' : kv('Pesan lagi saat stok tinggal', T.fmt(Math.ceil(hasil.rop)) + ' unit (reorder point)')) +
      kv('Tingkat layanan', zI.value + '%') +
      kv('Lead time', String(lt).replace('.', ',') + ' hari') +
      '<p class="hint">Tingkat layanan 95% artinya dalam 95 dari 100 siklus pemesanan, stokmu cukup sampai kiriman datang. Naik turun permintaan bisa dihitung dari catatan penjualan harianmu.</p>');
  };

  root.appendChild(T.el('<p class="note">Safety stock itu stok cadangan untuk menghadapi dua hal yang tidak pasti: permintaan yang tiba-tiba naik dan kiriman yang telat datang. Isi permintaan rata-rata kalau mau tahu di stok berapa harus pesan lagi.</p>'));
  root.appendChild(T.field('Tingkat layanan yang ditargetkan', zI, 'Semakin tinggi, semakin besar stok pengamannya.'));
  root.appendChild(T.field('Naik turun permintaan per hari (unit)', sdI, 'Simpangan baku penjualan harian. Kalau penjualan harianmu naik turun sekitar 20 unit, isi 20.'));
  root.appendChild(T.field('Lead time (hari)', ltI, 'Waktu dari pesan sampai barang datang.'));
  root.appendChild(T.field('Permintaan rata-rata per hari (unit, boleh kosong)', dI, 'Rata-rata unit terjual per hari.'));
  root.appendChild(T.field('Naik turun lead time (hari, boleh kosong)', sltI, 'Kalau kiriman kadang telat 2 hari dari biasanya, isi 2.'));
  root.appendChild(T.row(T.btn('Hitung Safety Stock', hitung, true)));
  root.appendChild(box);
}
