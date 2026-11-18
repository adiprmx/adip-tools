import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-churn-rate", "name": "Kalkulator Churn Rate", "cat": "bisnis", "icon": "👋", "desc": "Berapa persen pelanggan yang berhenti berlangganan dalam satu periode.", "keywords": "churn,retention,pelanggan berhenti,langganan,berhenti berlangganan", "since": "6.17.0"};

// Churn = pelanggan yang pergi / pelanggan di awal periode x 100%.
// Retention = 100% - churn.
export function hitungChurn(pelangganAwal, pelangganPergi) {
  const awal = Number(pelangganAwal), pergi = Number(pelangganPergi);
  if (![awal, pergi].every(isFinite) || awal <= 0 || pergi < 0 || pergi > awal) return null;
  const churn = (pergi / awal) * 100;
  return { churn, retention: 100 - churn, akhir: awal - pergi };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const awalI = T.input('text', 'cth: 1000', '');
  const pergiI = T.input('text', 'cth: 50', '');
  const box = T.out();

  const hitung = () => {
    const awal = T.num(awalI.value);
    const pergi = T.num(pergiI.value);
    if (!isFinite(awal) || awal <= 0) { T.show(box, '<div class="err">Pelanggan di awal periode harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(pergi) || pergi < 0) { T.show(box, '<div class="err">Pelanggan yang berhenti harus diisi angka 0 atau lebih.</div>'); return; }
    if (pergi > awal) { T.show(box, '<div class="err">Pelanggan yang berhenti tidak bisa lebih banyak dari pelanggan awal.</div>'); return; }
    const hasil = hitungChurn(awal, pergi);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    T.show(box,
      '<div class="big center">' + fmtPersen(hasil.churn) + '</div>' +
      '<p class="center">pelanggan yang berhenti di periode ini</p>' +
      kv('Pelanggan yang bertahan', fmtPersen(hasil.retention) + ' (' + T.fmt(hasil.akhir) + ' orang)') +
      kv('Pelanggan awal', T.fmt(awal)) +
      kv('Pelanggan yang pergi', T.fmt(pergi)) +
      '<p class="hint">Churn yang tinggi artinya usahamu bocor: pelanggan baru yang masuk hanya menambal yang pergi. Turunkan churn dulu sebelum menambah anggaran cari pelanggan baru.</p>');
  };

  root.appendChild(T.el('<p class="note">Churn rate itu persentase pelanggan yang berhenti berlangganan atau berhenti beli dalam satu periode. Ukur per bulan atau per tahun, asal konsisten.</p>'));
  root.appendChild(T.field('Pelanggan di awal periode', awalI, 'Jumlah pelanggan saat periode dimulai.'));
  root.appendChild(T.field('Pelanggan yang berhenti', pergiI, 'Jumlah yang berhenti selama periode itu.'));
  root.appendChild(T.row(T.btn('Hitung Churn Rate', hitung, true)));
  root.appendChild(box);
}
