import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-cac", "name": "Kalkulator CAC", "cat": "bisnis", "icon": "🎯", "desc": "Berapa biaya untuk mendapatkan satu pelanggan baru.", "keywords": "cac,biaya akuisisi,pelanggan baru,pemasaran,penjualan,akuisisi", "since": "6.17.0"};

// CAC = (biaya pemasaran + biaya penjualan) / jumlah pelanggan baru.
export function hitungCAC(biayaPemasaran, biayaPenjualan, pelangganBaru) {
  const m = Number(biayaPemasaran), s = Number(biayaPenjualan), n = Number(pelangganBaru);
  if (![m, s, n].every(isFinite) || m < 0 || s < 0 || n <= 0) return null;
  const cac = (m + s) / n;
  return Number.isFinite(cac) ? cac : null;
}

export function render(root) {
  const mI = T.input('text', 'cth: 5000000', '');
  const sI = T.input('text', 'cth: 2000000', '');
  const nI = T.input('text', 'cth: 100', '');
  const box = T.out();

  const hitung = () => {
    const m = T.num(mI.value);
    const s = T.num(sI.value);
    const n = T.num(nI.value);
    if (!isFinite(m) || m < 0) { T.show(box, '<div class="err">Biaya pemasaran harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(s) || s < 0) { T.show(box, '<div class="err">Biaya penjualan harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(n) || n <= 0) { T.show(box, '<div class="err">Jumlah pelanggan baru harus diisi angka lebih dari 0.</div>'); return; }
    const cac = hitungCAC(m, s, n);
    if (cac === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    T.show(box,
      '<div class="big center">' + T.rp(cac) + '</div>' +
      '<p class="center">biaya untuk satu pelanggan baru</p>' +
      kv('Total biaya pemasaran', T.rp(m)) +
      kv('Total biaya penjualan', T.rp(s)) +
      kv('Total biaya akuisisi', T.rp(m + s)) +
      kv('Pelanggan baru', T.fmt(n)) +
      '<p class="hint">Bandingkan angka ini dengan nilai satu pelanggan (LTV). Kalau biaya dapat pelanggan lebih besar dari nilai yang dia bawa, usahanya rugi di tiap pelanggan baru.</p>');
  };

  root.appendChild(T.el('<p class="note">CAC itu biaya yang kamu keluarkan untuk mendapatkan satu pelanggan baru: iklan, promosi, gaji tim jualan, semuanya dibagi jumlah pelanggan baru dalam periode yang sama.</p>'));
  root.appendChild(T.field('Biaya pemasaran (Rp)', mI, 'Iklan, promosi, dan semua biaya pemasaran dalam satu periode.'));
  root.appendChild(T.field('Biaya penjualan (Rp)', sI, 'Gaji dan komisi tim jualan, isi 0 kalau tidak ada.'));
  root.appendChild(T.field('Pelanggan baru', nI, 'Jumlah pelanggan baru yang didapat di periode yang sama.'));
  root.appendChild(T.row(T.btn('Hitung CAC', hitung, true)));
  root.appendChild(box);
}
