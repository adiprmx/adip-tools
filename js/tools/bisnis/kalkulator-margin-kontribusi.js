import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-margin-kontribusi", "name": "Kalkulator Margin Kontribusi", "cat": "bisnis", "icon": "🧮", "desc": "Berapa tiap produk menyumbang untuk menutup biaya tetap dan jadi laba.", "keywords": "margin kontribusi,contribution margin,biaya variabel,balik modal,analisis laba", "since": "6.17.0"};

// Margin kontribusi per unit = harga jual - biaya variabel per unit.
// Rasio = margin kontribusi / harga jual x 100%.
// BEP unit = biaya tetap / margin kontribusi per unit.
export function hitungMarginKontribusi(hargaJual, biayaVariabel, unit, biayaTetap) {
  const h = Number(hargaJual), v = Number(biayaVariabel), u = Number(unit || 0), f = Number(biayaTetap || 0);
  if (![h, v, u, f].every(isFinite) || h <= 0 || v < 0 || v > h || u < 0 || f < 0) return null;
  const cm = h - v;
  const rasio = (cm / h) * 100;
  const total = cm * u;
  const bep = cm > 0 && f > 0 ? f / cm : null;
  if (![cm, rasio, total].every(isFinite) || (bep != null && !isFinite(bep))) return null;
  return { cm, rasio, total, bep };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const hI = T.input('text', 'cth: 50000', '');
  const vI = T.input('text', 'cth: 30000', '');
  const uI = T.input('text', 'cth: 1000', '');
  const fI = T.input('text', 'cth: 10000000', '');
  const box = T.out();

  const hitung = () => {
    const h = T.num(hI.value);
    const v = T.num(vI.value);
    const uRaw = uI.value.trim(), fRaw = fI.value.trim();
    const u = uRaw === '' ? 0 : T.num(uRaw);
    const f = fRaw === '' ? 0 : T.num(fRaw);
    if (!isFinite(h) || h <= 0) { T.show(box, '<div class="err">Harga jual per unit harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(v) || v < 0) { T.show(box, '<div class="err">Biaya variabel per unit harus diisi angka 0 atau lebih.</div>'); return; }
    if (v > h) { T.show(box, '<div class="err">Biaya variabel lebih besar dari harga jual: tiap unit yang terjual justru menambah rugi.</div>'); return; }
    if (!isFinite(u) || u < 0) { T.show(box, '<div class="err">Jumlah unit harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    if (!isFinite(f) || f < 0) { T.show(box, '<div class="err">Biaya tetap harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    const hasil = hitungMarginKontribusi(h, v, u, f);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    T.show(box,
      '<div class="big center">' + T.rp(hasil.cm) + '</div>' +
      '<p class="center">margin kontribusi per unit</p>' +
      kv('Rasio margin kontribusi', fmtPersen(hasil.rasio)) +
      (u > 0 ? kv('Total margin kontribusi (' + T.fmt(u) + ' unit)', T.rp(hasil.total)) : '') +
      (hasil.bep == null ? '' : kv('Balik modal pada', T.fmt(Math.ceil(hasil.bep)) + ' unit')) +
      '<p class="hint">Margin kontribusi itu sisa dari harga jual setelah biaya yang ikut naik tiap unit terjual (bahan, kemasan, ongkir). Sisa inilah yang menutup sewa, gaji, dan akhirnya jadi laba.</p>');
  };

  root.appendChild(T.el('<p class="note">Setiap produk yang terjual menyisakan uang setelah biaya per unitnya dibayar. Sisa itu yang menutup biaya tetap dan jadi laba. Isi jumlah unit dan biaya tetap kalau mau tahu titik balik modalnya.</p>'));
  root.appendChild(T.field('Harga jual per unit (Rp)', hI, 'Harga yang dibayar pembeli untuk satu unit.'));
  root.appendChild(T.field('Biaya variabel per unit (Rp)', vI, 'Bahan, kemasan, dan biaya lain yang keluar tiap satu unit dibuat.'));
  root.appendChild(T.field('Jumlah unit terjual (boleh kosong)', uI, 'Berapa unit terjual dalam satu periode.'));
  root.appendChild(T.field('Biaya tetap per periode (Rp, boleh kosong)', fI, 'Sewa, gaji, dan biaya yang tetap keluar walau tidak ada yang terjual.'));
  root.appendChild(T.row(T.btn('Hitung Margin Kontribusi', hitung, true)));
  root.appendChild(box);
}
