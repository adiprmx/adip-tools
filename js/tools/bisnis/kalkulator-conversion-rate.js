import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-conversion-rate", "name": "Kalkulator Conversion Rate", "cat": "bisnis", "icon": "🛒", "desc": "Berapa persen pengunjung yang jadi pembeli atau pendaftar.", "keywords": "conversion rate,konversi,pengunjung,pembeli,pendaftar,rasio konversi", "since": "6.17.0"};

// Conversion rate = konversi / pengunjung x 100%.
// Biaya per konversi = biaya iklan / konversi (null bila biaya 0 / tidak diisi).
export function hitungConversionRate(pengunjung, konversi, biayaIklan) {
  const p = Number(pengunjung), k = Number(konversi), b = Number(biayaIklan || 0);
  if (![p, k, b].every(isFinite) || p <= 0 || k < 0 || k > p || b < 0) return null;
  const rate = (k / p) * 100;
  const perKonversi = b > 0 && k > 0 ? b / k : null;
  return { rate, perKonversi };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const pI = T.input('text', 'cth: 10000', '');
  const kI = T.input('text', 'cth: 250', '');
  const bI = T.input('text', 'cth: 5000000', '');
  const box = T.out();

  const hitung = () => {
    const p = T.num(pI.value);
    const k = T.num(kI.value);
    const bRaw = bI.value.trim();
    const b = bRaw === '' ? 0 : T.num(bRaw);
    if (!isFinite(p) || p <= 0) { T.show(box, '<div class="err">Jumlah pengunjung harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(k) || k < 0) { T.show(box, '<div class="err">Jumlah konversi harus diisi angka 0 atau lebih.</div>'); return; }
    if (k > p) { T.show(box, '<div class="err">Konversi tidak bisa lebih banyak dari pengunjung.</div>'); return; }
    if (!isFinite(b) || b < 0) { T.show(box, '<div class="err">Biaya iklan harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    const hasil = hitungConversionRate(p, k, b);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    T.show(box,
      '<div class="big center">' + fmtPersen(hasil.rate) + '</div>' +
      '<p class="center">pengunjung yang jadi pembeli atau pendaftar</p>' +
      kv('Pengunjung', T.fmt(p)) +
      kv('Konversi', T.fmt(k)) +
      (hasil.perKonversi == null ? '' : kv('Biaya per konversi', T.rp(hasil.perKonversi))) +
      kv('Dari 1.000 pengunjung', T.fmt(Math.round(hasil.rate * 10)) + ' konversi') +
      '<p class="hint">Naikkan angka ini dengan memperbaiki halaman dan tawaran, bukan cuma menambah pengunjung. Konversi yang naik sedikit saja bisa mengubah untung rugi iklanmu.</p>');
  };

  root.appendChild(T.el('<p class="note">Conversion rate mengukur seberapa bagus pengunjung berubah jadi pembeli, pendaftar, atau apa pun yang kamu anggap berhasil. Isi biaya iklan kalau mau tahu harga satu konversi.</p>'));
  root.appendChild(T.field('Jumlah pengunjung', pI, 'Total orang yang datang ke halaman atau tokomu.'));
  root.appendChild(T.field('Jumlah konversi', kI, 'Yang membeli, mendaftar, atau melakukan aksi yang ditargetkan.'));
  root.appendChild(T.field('Biaya iklan (Rp, boleh kosong)', bI, 'Total biaya iklan di periode yang sama.'));
  root.appendChild(T.row(T.btn('Hitung Conversion Rate', hitung, true)));
  root.appendChild(box);
}
