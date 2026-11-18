import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-cagr", "name": "Kalkulator CAGR", "cat": "bisnis", "icon": "📈", "desc": "Berapa persen investasi tumbuh tiap tahun, rata-rata dari nilai awal sampai nilai akhir.", "keywords": "cagr,pertumbuhan tahunan,investasi,return,tumbuh,rata-rata,portofolio", "since": "6.16.0"};

// CAGR = (nilai akhir / nilai awal) ^ (1 / tahun) - 1, dalam persen.
// Kembalikan null bila input tidak valid atau hasilnya di luar jangkauan.
export function hitungCagr(awal, akhir, tahun) {
  const a = Number(awal), b = Number(akhir), n = Number(tahun);
  if (![a, b, n].every(isFinite) || a <= 0 || b < 0 || n <= 0) return null;
  const c = (Math.pow(b / a, 1 / n) - 1) * 100;
  return Number.isFinite(c) ? c : null;
}
utils.cagr = hitungCagr;

function fmtPersen(x) {
  return x.toFixed(2).replace('.', ',') + '%';
}

export function render(root) {
  const awalI = T.input('text', 'cth: 10000000', '');
  const akhirI = T.input('text', 'cth: 20000000', '');
  const tahunI = T.input('text', 'cth: 5', '');
  const box = T.out();

  const hitung = () => {
    const awal = T.num(awalI.value);
    const akhir = T.num(akhirI.value);
    const tahun = T.num(tahunI.value);
    if (!isFinite(awal) || awal <= 0) {
      T.show(box, '<div class="err">Nilai awal harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(akhir) || akhir < 0) {
      T.show(box, '<div class="err">Nilai akhir harus diisi angka 0 atau lebih.</div>');
      return;
    }
    if (!isFinite(tahun) || tahun <= 0) {
      T.show(box, '<div class="err">Lama investasi harus diisi angka lebih dari 0, boleh desimal (contoh: 2,5).</div>');
      return;
    }
    const cagr = hitungCagr(awal, akhir, tahun);
    if (cagr === null) {
      T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>');
      return;
    }
    const selisih = akhir - awal;
    const total = (selisih / awal) * 100;
    const tahunTeks = String(tahun).replace('.', ',');
    const verdict = cagr > 0
      ? 'Investasimu tumbuh rata-rata ' + fmtPersen(cagr) + ' setiap tahun.'
      : cagr < 0
        ? 'Investasimu menyusut rata-rata ' + fmtPersen(-cagr) + ' setiap tahun.'
        : 'Nilai investasimu tidak berubah selama ' + tahunTeks + ' tahun.';
    T.show(box,
      '<div class="big center">' + (cagr > 0 ? '+' : '') + fmtPersen(cagr) + '</div>' +
      '<p class="center">pertumbuhan rata-rata per tahun</p>' +
      kv('Nilai awal', T.rp(awal)) +
      kv('Nilai akhir', T.rp(akhir)) +
      kv('Pertumbuhan total', T.rp(selisih) + ' (' + (total > 0 ? '+' : '') + fmtPersen(total) + ')') +
      kv('Lama investasi', tahunTeks + ' tahun') +
      '<p class="' + (cagr > 0 ? 'info' : cagr < 0 ? 'err' : 'warn') + '">' + verdict + '</p>');
  };

  root.appendChild(T.el('<p class="note">CAGR itu rata-rata pertumbuhan investasi tiap tahun, dihitung seolah perubahannya merata setiap tahun. Cocok buat membandingkan dua investasi yang jalannya beda lama.</p>'));
  root.appendChild(T.field('Nilai awal (Rp)', awalI, 'Modal awal yang kamu taruh.'));
  root.appendChild(T.field('Nilai akhir (Rp)', akhirI, 'Nilai investasi sekarang, atau saat dijual.'));
  root.appendChild(T.field('Lama investasi (tahun)', tahunI, 'Boleh desimal, contoh: 2,5 tahun.'));
  root.appendChild(T.row(T.btn('Hitung CAGR', hitung, true)));
  root.appendChild(box);
}
