import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-eoq", "name": "Kalkulator EOQ", "cat": "bisnis", "icon": "📦", "desc": "Jumlah pemesanan paling hemat supaya biaya pesan dan biaya simpan seimbang.", "keywords": "eoq,pemesanan ekonomis,persediaan,stok,biaya simpan,biaya pesan", "since": "6.17.0"};

// EOQ = akar(2 x D x S / H). D = kebutuhan setahun, S = biaya sekali pesan,
// H = biaya simpan satu unit setahun.
// Total biaya = (D/EOQ) x S + (EOQ/2) x H.
export function hitungEOQ(permintaan, biayaPesan, biayaSimpan) {
  const D = Number(permintaan), S = Number(biayaPesan), H = Number(biayaSimpan);
  if (![D, S, H].every(isFinite) || D <= 0 || S <= 0 || H <= 0) return null;
  const eoq = Math.sqrt((2 * D * S) / H);
  const orderSetahun = D / eoq;
  const totalBiaya = orderSetahun * S + (eoq / 2) * H;
  if (![eoq, orderSetahun, totalBiaya].every(isFinite)) return null;
  return { eoq, orderSetahun, totalBiaya };
}

export function render(root) {
  const dI = T.input('text', 'cth: 12000', '');
  const sI = T.input('text', 'cth: 50000', '');
  const hI = T.input('text', 'cth: 2000', '');
  const box = T.out();

  const hitung = () => {
    const D = T.num(dI.value);
    const S = T.num(sI.value);
    const H = T.num(hI.value);
    if (!isFinite(D) || D <= 0) { T.show(box, '<div class="err">Kebutuhan setahun harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(S) || S <= 0) { T.show(box, '<div class="err">Biaya sekali pesan harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(H) || H <= 0) { T.show(box, '<div class="err">Biaya simpan per unit setahun harus diisi angka lebih dari 0.</div>'); return; }
    const hasil = hitungEOQ(D, S, H);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const jedaHari = 365 / hasil.orderSetahun;
    T.show(box,
      '<div class="big center">' + T.fmt(Math.round(hasil.eoq)) + ' unit</div>' +
      '<p class="center">jumlah paling hemat untuk sekali pesan</p>' +
      kv('Pesan dalam setahun', String(hasil.orderSetahun.toFixed(1)).replace('.', ',') + ' kali') +
      kv('Jeda antar pesanan', String(jedaHari.toFixed(0)) + ' hari') +
      kv('Total biaya pesan + simpan setahun', T.rp(hasil.totalBiaya)) +
      kv('Stok rata-rata di gudang', T.fmt(Math.round(hasil.eoq / 2)) + ' unit') +
      '<p class="hint">Pesan terlalu sedikit bikin ongkir dan biaya pesan membengkak, pesan terlalu banyak bikin gudang penuh dan modal mengendap. EOQ mencari titik tengahnya.</p>');
  };

  root.appendChild(T.el('<p class="note">EOQ itu jumlah pemesanan paling hemat: cukup besar supaya tidak sering pesan, cukup kecil supaya gudang tidak penuh. Cocok buat barang yang lakunya stabil sepanjang tahun.</p>'));
  root.appendChild(T.field('Kebutuhan dalam setahun (unit)', dI, 'Total unit yang terjual atau dipakai selama setahun.'));
  root.appendChild(T.field('Biaya sekali pesan (Rp)', sI, 'Ongkir, admin, dan semua biaya tiap kali memesan.'));
  root.appendChild(T.field('Biaya simpan per unit setahun (Rp)', hI, 'Sewa gudang, listrik, dan risiko rusak per satu unit selama setahun.'));
  root.appendChild(T.row(T.btn('Hitung EOQ', hitung, true)));
  root.appendChild(box);
}
