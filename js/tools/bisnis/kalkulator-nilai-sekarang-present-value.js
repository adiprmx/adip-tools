import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-nilai-sekarang-present-value", "name": "Kalkulator Nilai Sekarang (Present Value)", "cat": "bisnis", "icon": "⏳", "desc": "Berapa nilai uang di masa depan kalau dihitung dengan nilai hari ini.", "keywords": "present value,nilai sekarang,diskonto,nilai waktu uang,nilai masa depan", "since": "6.17.0"};

// PV = FV / (1 + r)^n. r dalam desimal, n dalam tahun.
export function hitungPV(nilaiMasaDepan, diskontoPersen, tahun) {
  const fv = Number(nilaiMasaDepan), r = Number(diskontoPersen) / 100, n = Number(tahun);
  if (![fv, r, n].every(isFinite) || fv < 0 || r < 0 || r >= 1 || n < 0) return null;
  const pv = fv / Math.pow(1 + r, n);
  if (!isFinite(pv)) return null;
  return { pv, faktor: pv / (fv || 1), diskon: fv - pv };
}

export function render(root) {
  const fvI = T.input('text', 'cth: 100000000', '');
  const rI = T.input('text', 'cth: 10', '');
  const nI = T.input('text', 'cth: 5', '');
  const box = T.out();

  const hitung = () => {
    const fv = T.num(fvI.value);
    const r = T.num(rI.value);
    const n = T.num(nI.value);
    if (!isFinite(fv) || fv < 0) { T.show(box, '<div class="err">Jumlah di masa depan harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(r) || r < 0 || r >= 100) { T.show(box, '<div class="err">Tingkat diskonto diisi 0 sampai di bawah 100.</div>'); return; }
    if (!isFinite(n) || n < 0 || n > 100) { T.show(box, '<div class="err">Jangka waktu diisi 0 sampai 100 tahun, boleh desimal.</div>'); return; }
    const hasil = hitungPV(fv, r, n);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    T.show(box,
      '<div class="big center">' + T.rp(hasil.pv) + '</div>' +
      '<p class="center">nilainya dalam uang hari ini</p>' +
      kv('Jumlah di masa depan', T.rp(fv)) +
      kv('Potongan karena waktu', T.rp(hasil.diskon)) +
      kv('Faktor diskon', hasil.faktor.toFixed(4).replace('.', ',')) +
      kv('Tingkat diskonto', String(r).replace('.', ',') + '% per tahun') +
      '<p class="hint">Uang hari ini lebih berharga dari uang nanti karena bisa diputar dulu. Tingkat diskonto biasanya memakai bunga deposito atau hasil investasi lain yang sejenis.</p>');
  };

  root.appendChild(T.el('<p class="note">Rp100 juta lima tahun lagi tidak sama dengan Rp100 juta hari ini. Tool ini menghitung berapa nilai uang masa depan itu kalau dibawa ke hari ini.</p>'));
  root.appendChild(T.field('Jumlah di masa depan (Rp)', fvI, 'Uang yang akan kamu terima di masa depan.'));
  root.appendChild(T.field('Tingkat diskonto (% per tahun)', rI, 'Perkiraan hasil kalau uangnya diputar di tempat lain.'));
  root.appendChild(T.field('Jangka waktu (tahun)', nI, 'Berapa tahun lagi uang itu diterima. Boleh desimal.'));
  root.appendChild(T.row(T.btn('Hitung Nilai Sekarang', hitung, true)));
  root.appendChild(box);
}
