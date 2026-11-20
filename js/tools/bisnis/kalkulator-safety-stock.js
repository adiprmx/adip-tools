import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-safety-stock", "name": "Kalkulator Safety Stock", "cat": "bisnis", "icon": "🛡️", "desc": "Stok pengaman supaya barang tidak habis saat permintaan naik atau kiriman telat. Hitung dengan cara statistik atau cara sederhana hari pengaman, lengkap dengan titik pesan ulang.", "keywords": "safety stock,stok pengaman,persediaan,lead time,service level,stok,reorder point,rop,titik pesan ulang,pesan ulang", "since": "6.17.0"};

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

// Mode sederhana (diserap dari reorder-point, v6.21.0): stok pengaman =
// penjualan harian x hari pengaman; titik pesan ulang = pemakaian selama
// kiriman jalan + stok pengaman. Murni.
export function hitungRopSederhana(jualHarian, hariKirim, hariPengaman) {
  const j = Number(jualHarian), k = Number(hariKirim), a = Number(hariPengaman);
  if (![j, k, a].every(isFinite) || j <= 0 || k < 0 || a < 0) return null;
  const pakaiKirim = Math.ceil(j * k);
  const stokAman = Math.ceil(j * a);
  return { pakaiKirim, stokAman, rop: pakaiKirim + stokAman };
}

export function render(root) {
  const modeS = T.select([
    ['statistik', 'Statistik (dari naik-turun penjualan)'],
    ['sederhana', 'Sederhana (hari pengaman)'],
  ], 'statistik');
  const zI = T.select([['90', '90% (Z = 1,28)'], ['95', '95% (Z = 1,65)'], ['99', '99% (Z = 2,33)']], '95');
  const sdI = T.input('text', 'cth: 20', '');
  const ltI = T.input('text', 'cth: 7', '');
  const dI = T.input('text', 'cth: 100', '');
  const sltI = T.input('text', 'cth: 2', '');
  const jualI = T.input('text', 'cth: 10', '');
  jualI.inputMode = 'decimal';
  const kirimI = T.input('text', 'cth: 3', '');
  kirimI.inputMode = 'decimal';
  const amanI = T.input('text', 'cth: 2', '2');
  amanI.inputMode = 'decimal';
  const stokI = T.input('text', 'cth: 40 (kosongkan bila tidak perlu)', '');
  stokI.inputMode = 'decimal';
  const box = T.out();

  const statWrap = T.el('<div></div>');
  statWrap.appendChild(T.field('Tingkat layanan yang ditargetkan', zI, 'Semakin tinggi, semakin besar stok pengamannya.'));
  statWrap.appendChild(T.field('Naik turun permintaan per hari (unit)', sdI, 'Simpangan baku penjualan harian. Kalau penjualan harianmu naik turun sekitar 20 unit, isi 20.'));
  statWrap.appendChild(T.field('Lead time (hari)', ltI, 'Waktu dari pesan sampai barang datang.'));
  statWrap.appendChild(T.field('Permintaan rata-rata per hari (unit, boleh kosong)', dI, 'Rata-rata unit terjual per hari.'));
  statWrap.appendChild(T.field('Naik turun lead time (hari, boleh kosong)', sltI, 'Kalau kiriman kadang telat 2 hari dari biasanya, isi 2.'));
  const sederWrap = T.el('<div></div>');
  sederWrap.appendChild(T.field('Penjualan harian rata-rata (unit/hari)', jualI, 'Rata-rata unit terjual tiap hari. Hitung dari penjualan sebulan dibagi 30 bila belum tahu.'));
  sederWrap.appendChild(T.field('Waktu kirim supplier (hari)', kirimI, 'Berapa hari dari pesan sampai barang datang.'));
  sederWrap.appendChild(T.field('Hari pengaman', amanI, 'Cadangan untuk jaga-jaga bila penjualan melonjak atau kiriman telat.'));
  sederWrap.appendChild(T.field('Stok sekarang (unit, opsional)', stokI, 'Diisi bila mau tahu apakah sudah waktunya pesan.'));

  const aturMode = () => {
    const seder = modeS.value === 'sederhana';
    statWrap.hidden = seder;
    sederWrap.hidden = !seder;
  };
  modeS.addEventListener('change', aturMode);
  aturMode();

  const hitungSederhana = (diam = false) => {
    const jual = T.num(jualI.value);
    const kirim = T.num(kirimI.value);
    const aman = T.num(amanI.value);
    const stok = T.num(stokI.value);
    if (!isFinite(jual) || jual <= 0 || !isFinite(kirim) || kirim < 0 ||
        !isFinite(aman) || aman < 0 ||
        (stokI.value.trim() !== '' && (!isFinite(stok) || stok < 0))) {
      if (!diam) T.toast('Isi semua kolom dengan angka yang benar ya.'); return;
    }
    const r = hitungRopSederhana(jual, kirim, aman);
    let statusRow = '';
    let statusTxt = 'pesan lagi begitu stok menyentuh angka ini';
    let warna = '#22c55e';
    if (stokI.value.trim() !== '') {
      const hariHabis = Math.floor(stok / jual);
      if (stok <= r.rop) {
        statusTxt = 'stok sudah di bawah titik pesan ulang, pesan sekarang';
        warna = '#ef4444';
      } else {
        statusTxt = 'stok masih di atas titik pesan ulang';
      }
      statusRow = kv('Stok sekarang', stok.toLocaleString('id-ID') + ' unit') +
        kv('Perkiraan stok habis dalam', hariHabis + ' hari');
    }
    T.show(box,
      '<div class="big center" style="color:' + warna + '">' + r.rop.toLocaleString('id-ID') + ' unit</div>' +
      '<p class="center">titik pesan ulang, ' + statusTxt + '</p>' +
      kv('Penjualan harian rata-rata', jual.toLocaleString('id-ID') + ' unit/hari') +
      kv('Pemakaian selama kiriman jalan (' + kirim + ' hari)', r.pakaiKirim.toLocaleString('id-ID') + ' unit') +
      kv('Stok pengaman (' + aman + ' hari)', r.stokAman.toLocaleString('id-ID') + ' unit') +
      statusRow +
      '<p class="hint">Rumus: titik pesan ulang = penjualan harian × waktu kirim + stok pengaman. Stok pengaman = penjualan harian × hari pengaman. Contoh dari angka di atas: ' + jual + ' unit/hari × ' + kirim + ' hari kirim = ' + r.pakaiKirim + ' unit, ditambah pengaman ' + jual + ' × ' + aman + ' hari = ' + r.stokAman + ' unit, jadi pesan lagi saat stok tinggal ' + r.rop + ' unit. Asumsi: penjualan harian relatif stabil dan waktu kirim supplier sesuai jadwal. Naikkan hari pengaman bila penjualan sering melonjak mendadak atau kiriman sering telat.</p>');
  };

  const hitung = (diam = false) => {
    if (modeS.value === 'sederhana') { hitungSederhana(diam); return; }
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

  // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik / ganti
  // pilihan (diam — tanpa toast selagi mengetik; tombol tetap memberi toast).
  [sdI, ltI, dI, sltI, jualI, kirimI, amanI, stokI].forEach((i) => i.addEventListener('input', () => hitung(true)));
  zI.addEventListener('change', () => hitung(true));
  modeS.addEventListener('change', () => hitung(true));

  root.appendChild(T.el('<p class="note">Safety stock itu stok cadangan untuk menghadapi dua hal yang tidak pasti: permintaan yang tiba-tiba naik dan kiriman yang telat datang. Mode statistik menghitung dari naik-turun penjualan; mode sederhana menghitung dari jumlah hari pengaman yang kamu pilih.</p>'));
  root.appendChild(T.field('Cara hitung', modeS));
  root.appendChild(statWrap);
  root.appendChild(sederWrap);
  root.appendChild(T.row(T.btn('Hitung Safety Stock', hitung, true)));
  root.appendChild(box);
}
