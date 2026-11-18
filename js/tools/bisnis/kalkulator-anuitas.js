import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-anuitas", "name": "Kalkulator Anuitas", "cat": "bisnis", "icon": "💰", "desc": "Nilai anuitas biasa dan jatuh tempo, plus pembayaran berkala untuk dana pensiun.", "keywords": "anuitas,annuity,pensiun,nilai sekarang,nilai akhir,pembayaran berkala", "since": "6.17.0"};

// Anuitas biasa: pembayaran di akhir tiap periode.
// Anuitas jatuh tempo: pembayaran di awal tiap periode (nilainya dikali (1+r)).
// r = bunga per periode dalam desimal. Bila r = 0, nilai = pembayaran x periode.
export function hitungAnuitas(pembayaran, bungaPersen, periode, jatuhTempo) {
  const pmt = Number(pembayaran), r = Number(bungaPersen) / 100, n = Number(periode);
  if (![pmt, r, n].every(isFinite) || pmt <= 0 || r < 0 || n <= 0) return null;
  let pv, fv;
  if (r === 0) { pv = pmt * n; fv = pmt * n; }
  else {
    pv = pmt * ((1 - Math.pow(1 + r, -n)) / r);
    fv = pmt * ((Math.pow(1 + r, n) - 1) / r);
  }
  if (jatuhTempo) { pv *= (1 + r); fv *= (1 + r); }
  if (![pv, fv].every(isFinite)) return null;
  return { pv, fv };
}

export function render(root) {
  const pmtI = T.input('text', 'cth: 1000000', '');
  const bungaI = T.input('text', 'cth: 1', '');
  const nI = T.input('text', 'cth: 120', '');
  const jenisI = T.select([['biasa', 'Biasa (bayar di akhir periode)'], ['tempo', 'Jatuh tempo (bayar di awal periode)']], 'biasa');
  const box = T.out();

  const hitung = () => {
    const pmt = T.num(pmtI.value);
    const bunga = T.num(bungaI.value);
    const n = T.num(nI.value);
    if (!isFinite(pmt) || pmt <= 0) { T.show(box, '<div class="err">Pembayaran per periode harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(bunga) || bunga < 0 || bunga >= 100) { T.show(box, '<div class="err">Bunga per periode diisi 0 sampai di bawah 100.</div>'); return; }
    if (!isFinite(n) || n <= 0 || n > 1200) { T.show(box, '<div class="err">Jumlah periode diisi angka lebih dari 0, maksimal 1200.</div>'); return; }
    const hasil = hitungAnuitas(pmt, bunga, n, jenisI.value === 'tempo');
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const totalSetor = pmt * n;
    T.show(box,
      '<div class="big center">' + T.rp(hasil.pv) + '</div>' +
      '<p class="center">nilai sekarang dari semua pembayaran itu</p>' +
      kv('Nilai akhir (kalau dibiarkan berbunga)', T.rp(hasil.fv)) +
      kv('Total yang dibayar', T.rp(totalSetor)) +
      kv('Bunga yang terkumpul', T.rp(hasil.fv - totalSetor)) +
      kv('Jenis anuitas', jenisI.value === 'tempo' ? 'Jatuh tempo (bayar di awal)' : 'Biasa (bayar di akhir)') +
      '<p class="hint">Nilai sekarang artinya: uang sebesar itu hari ini nilainya sama dengan rangkaian pembayaran di atas. Cocok buat menilai dana pensiun atau cicilan jangka panjang.</p>');
  };

  root.appendChild(T.el('<p class="note">Anuitas itu pembayaran yang besarnya sama dan datang berkala, seperti dana pensiun atau cicilan. Tool ini menghitung berapa nilainya hari ini dan berapa jadinya kalau dibiarkan berbunga.</p>'));
  root.appendChild(T.field('Pembayaran per periode (Rp)', pmtI, 'Jumlah yang diterima atau dibayar tiap periode.'));
  root.appendChild(T.field('Bunga per periode (%)', bungaI, 'Bunga untuk satu periode. Kalau per bulan, isi bunga bulanannya.'));
  root.appendChild(T.field('Jumlah periode', nI, 'Berapa kali pembayaran terjadi. Contoh: 120 untuk 10 tahun bulanan.'));
  root.appendChild(T.field('Jenis anuitas', jenisI, 'Jatuh tempo dibayar di awal periode, jadi nilainya sedikit lebih besar.'));
  root.appendChild(T.row(T.btn('Hitung Anuitas', hitung, true)));
  root.appendChild(box);
}
