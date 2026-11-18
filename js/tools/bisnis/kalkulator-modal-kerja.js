import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-modal-kerja", "name": "Kalkulator Modal Kerja", "cat": "bisnis", "icon": "🔄", "desc": "Modal kerja bersih usahamu dari aset lancar dikurangi utang jangka pendek.", "keywords": "modal kerja,working capital,aset lancar,utang lancar,likuiditas", "since": "6.17.0"};

// Modal kerja = aset lancar - utang lancar.
// Rasio modal kerja = aset lancar / utang lancar.
export function hitungModalKerja(asetLancar, utangLancar) {
  const a = Number(asetLancar), u = Number(utangLancar);
  if (![a, u].every(isFinite) || a < 0 || u < 0) return null;
  const wc = a - u;
  const rasio = u > 0 ? a / u : null;
  if (!isFinite(wc) || (rasio != null && !isFinite(rasio))) return null;
  return { modalKerja: wc, rasio };
}

export function render(root) {
  const aI = T.input('text', 'cth: 150000000', '');
  const uI = T.input('text', 'cth: 80000000', '');
  const box = T.out();

  const hitung = () => {
    const a = T.num(aI.value);
    const u = T.num(uI.value);
    if (!isFinite(a) || a < 0) { T.show(box, '<div class="err">Aset lancar harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(u) || u < 0) { T.show(box, '<div class="err">Utang lancar harus diisi angka 0 atau lebih.</div>'); return; }
    const hasil = hitungModalKerja(a, u);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const rasioTeks = hasil.rasio == null ? 'tidak ada utang lancar' : hasil.rasio.toFixed(2).replace('.', ',') + 'x';
    const pesan = hasil.modalKerja < 0
      ? 'Utang jangka pendekmu lebih besar dari aset lancarmu. Usaha bisa kesulitan bayar tagihan yang jatuh tempo dalam waktu dekat.'
      : hasil.modalKerja === 0
        ? 'Aset lancar dan utang lancarmu pas sama. Tidak ada bantalan kalau ada tagihan mendadak.'
        : 'Usahamu punya bantalan ' + T.rp(hasil.modalKerja) + ' untuk operasional sehari-hari setelah semua utang jangka pendek dibayar.';
    T.show(box,
      '<div class="big center">' + T.rp(hasil.modalKerja) + '</div>' +
      '<p class="center">modal kerja bersih</p>' +
      kv('Aset lancar', T.rp(a)) +
      kv('Utang lancar', T.rp(u)) +
      kv('Rasio modal kerja', rasioTeks) +
      '<p class="' + (hasil.modalKerja < 0 ? 'err' : 'info') + '">' + pesan + '</p>' +
      '<p class="hint">Aset lancar itu uang yang bisa dipakai dalam setahun: kas, piutang, dan stok. Utang lancar itu tagihan yang jatuh tempo dalam setahun: utang supplier, cicilan, dan gaji.</p>');
  };

  root.appendChild(T.el('<p class="note">Modal kerja itu uang yang tersisa untuk operasional setelah utang jangka pendek dibayar. Kalau negatif, usaha bisa untung di kertas tapi kehabisan uang tunai.</p>'));
  root.appendChild(T.field('Aset lancar (Rp)', aI, 'Kas, piutang, dan stok yang bisa jadi uang dalam setahun.'));
  root.appendChild(T.field('Utang lancar (Rp)', uI, 'Tagihan yang harus dibayar dalam setahun.'));
  root.appendChild(T.row(T.btn('Hitung Modal Kerja', hitung, true)));
  root.appendChild(box);
}
