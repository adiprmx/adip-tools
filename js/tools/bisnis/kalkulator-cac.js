import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-cac", "name": "Kalkulator CAC", "cat": "bisnis", "icon": "🎯", "desc": "Berapa biaya untuk mendapatkan satu pelanggan baru.", "keywords": "cac,biaya akuisisi,pelanggan baru,pemasaran,penjualan,akuisisi", "since": "6.17.0"};

// CAC = (biaya pemasaran + biaya penjualan) / jumlah pelanggan baru.
export function hitungCAC(biayaPemasaran, biayaPenjualan, pelangganBaru) {
  const m = Number(biayaPemasaran), s = Number(biayaPenjualan), n = Number(pelangganBaru);
  if (![m, s, n].every(isFinite) || m < 0 || s < 0 || n <= 0) return null;
  const cac = (m + s) / n;
  return Number.isFinite(cac) ? cac : null;
}

// Rasio LTV:CAC — patokan umum (dipakai juga di tool Nilai Pelanggan):
// CAC sebaiknya tidak lebih dari 1/3 LTV, alias rasio 3:1.
// - rasio >= 3: sehat; 1–3: masih untung tapi tipis; < 1: rugi per pelanggan.
// Logika murni (bisa di-test di Node).
export function hitungRasioLtvCac(ltv, cac) {
  const l = Number(ltv), c = Number(cac);
  if (![l, c].every(isFinite) || l <= 0 || c <= 0) return null;
  const rasio = l / c;
  if (!isFinite(rasio)) return null;
  const cacMaks = l / 3;
  const level = rasio >= 3 ? 'sehat' : rasio >= 1 ? 'tipis' : 'rugi';
  const status = level === 'sehat'
    ? 'sehat — tiap rupiah yang keluar untuk dapat pelanggan balik 3x lipat atau lebih'
    : level === 'tipis'
      ? 'masih untung, tapi tipis — usahakan sampai 3:1 dengan menekan biaya atau menaikkan nilai pelanggan'
      : 'rugi — biaya dapat pelanggan lebih besar dari nilai yang dia bawa';
  return { rasio, cacMaks, level, status };
}

export function render(root) {
  const mI = T.input('text', 'cth: 5000000', '');
  const sI = T.input('text', 'cth: 2000000', '');
  const nI = T.input('text', 'cth: 100', '');
  const ltvI = T.input('text', 'cth: 900000 (boleh kosong)', '');
  const box = T.out();

  const hitung = () => {
    const m = T.num(mI.value);
    const s = T.num(sI.value);
    const n = T.num(nI.value);
    const ltv = T.num(ltvI.value);
    if (!isFinite(m) || m < 0) { T.show(box, '<div class="err">Biaya pemasaran harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(s) || s < 0) { T.show(box, '<div class="err">Biaya penjualan harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(n) || n <= 0) { T.show(box, '<div class="err">Jumlah pelanggan baru harus diisi angka lebih dari 0.</div>'); return; }
    const cac = hitungCAC(m, s, n);
    if (cac === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const rasio = (isFinite(ltv) && ltv > 0) ? hitungRasioLtvCac(ltv, cac) : null;
    const warnaRasio = rasio == null ? '' : rasio.level === 'sehat' ? '#22c55e' : rasio.level === 'tipis' ? '#eab308' : '#ef4444';
    const fmtRasio = (r) => r.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    T.show(box,
      '<div class="big center">' + T.rp(cac) + '</div>' +
      '<p class="center">biaya untuk satu pelanggan baru</p>' +
      kv('Total biaya pemasaran', T.rp(m)) +
      kv('Total biaya penjualan', T.rp(s)) +
      kv('Total biaya akuisisi', T.rp(m + s)) +
      kv('Pelanggan baru', T.fmt(n)) +
      (rasio == null
        ? '<p class="hint">Isi nilai satu pelanggan (LTV) di bawah untuk melihat rasio LTV:CAC — perbandingan nilai pelanggan dengan biaya mendapatkannya. Belum tahu LTV-mu? Hitung dulu di tool <a href="#/t/kalkulator-nilai-pelanggan">Nilai Pelanggan (LTV)</a>.</p>'
        : kv('Nilai satu pelanggan (LTV)', T.rp(ltv)) +
          kv('Rasio LTV : CAC', '<b style="color:' + warnaRasio + '">' + fmtRasio(rasio.rasio) + ' : 1</b>') +
          kv('Batas wajar biaya per pelanggan', T.rp(rasio.cacMaks) + ' <span class="dim">(⅓ LTV)</span>') +
          '<p class="hint">Rasio ' + fmtRasio(rasio.rasio) + ' : 1 artinya ' + rasio.status + '. Patokan umum: rasio 3:1 atau lebih.</p>'));
  };

  // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik.
  [mI, sI, nI, ltvI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">CAC itu biaya yang kamu keluarkan untuk mendapatkan satu pelanggan baru: iklan, promosi, gaji tim jualan, semuanya dibagi jumlah pelanggan baru dalam periode yang sama.</p>'));
  root.appendChild(T.field('Biaya pemasaran (Rp)', mI, 'Iklan, promosi, dan semua biaya pemasaran dalam satu periode.'));
  root.appendChild(T.field('Biaya penjualan (Rp)', sI, 'Gaji dan komisi tim jualan, isi 0 kalau tidak ada.'));
  root.appendChild(T.field('Pelanggan baru', nI, 'Jumlah pelanggan baru yang didapat di periode yang sama.'));
  root.appendChild(T.field('Nilai satu pelanggan / LTV (Rp, boleh kosong)', ltvI, 'Nilai total yang dibawa satu pelanggan selama dia belanja. Isi untuk melihat rasio LTV:CAC.'));
  root.appendChild(T.row(T.btn('Hitung CAC', hitung, true)));
  root.appendChild(box);
}
