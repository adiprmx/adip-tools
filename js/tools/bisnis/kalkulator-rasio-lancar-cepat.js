import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-rasio-lancar-cepat", "name": "Kalkulator Rasio Lancar & Cepat", "cat": "bisnis", "icon": "⚡", "desc": "Rasio likuiditas perusahaan: sanggup tidak membayar utang jangka pendek.", "keywords": "rasio lancar,rasio cepat,current ratio,quick ratio,likuiditas,aset lancar", "since": "6.17.0"};

// Rasio lancar = aset lancar / utang lancar.
// Rasio cepat = (aset lancar - persediaan) / utang lancar.
export function hitungRasioLikuiditas(asetLancar, persediaan, utangLancar) {
  const a = Number(asetLancar), p = Number(persediaan), u = Number(utangLancar);
  if (![a, p, u].every(isFinite) || a < 0 || p < 0 || p > a || u <= 0) return null;
  const lancar = a / u;
  const cepat = (a - p) / u;
  if (![lancar, cepat].every(isFinite)) return null;
  return { lancar, cepat };
}

const fmt2 = (x) => x.toFixed(2).replace('.', ',') + 'x';

export function render(root) {
  const aI = T.input('text', 'cth: 200000000', '');
  const pI = T.input('text', 'cth: 80000000', '');
  const uI = T.input('text', 'cth: 100000000', '');
  const box = T.out();

  const hitung = () => {
    const a = T.num(aI.value);
    const pRaw = pI.value.trim();
    const p = pRaw === '' ? 0 : T.num(pRaw);
    const u = T.num(uI.value);
    if (!isFinite(a) || a < 0) { T.show(box, '<div class="err">Aset lancar harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(p) || p < 0) { T.show(box, '<div class="err">Persediaan harus diisi angka 0 atau lebih, atau dikosongkan.</div>'); return; }
    if (p > a) { T.show(box, '<div class="err">Persediaan tidak bisa lebih besar dari aset lancar.</div>'); return; }
    if (!isFinite(u) || u <= 0) { T.show(box, '<div class="err">Utang lancar harus diisi angka lebih dari 0.</div>'); return; }
    const hasil = hitungRasioLikuiditas(a, p, u);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    const pesan = hasil.lancar < 1
      ? 'Aset lancarmu tidak cukup menutup utang jangka pendek. Ini tanda bahaya untuk arus kas.'
      : hasil.cepat < 1
        ? 'Rasio lancar cukup, tapi tanpa menjual stok, uangmu tidak cukup menutup utang jangka pendek. Jangan terlalu bergantung pada stok.'
        : 'Aset lancarmu cukup menutup utang jangka pendek, bahkan tanpa menjual stok.';
    T.show(box,
      '<div class="big center">' + fmt2(hasil.lancar) + '</div>' +
      '<p class="center">rasio lancar (current ratio)</p>' +
      kv('Rasio cepat (quick ratio)', fmt2(hasil.cepat)) +
      kv('Aset lancar', T.rp(a)) +
      kv('Persediaan', T.rp(p)) +
      kv('Utang lancar', T.rp(u)) +
      '<p class="' + (hasil.lancar < 1 ? 'err' : 'info') + '">' + pesan + '</p>' +
      '<p class="hint">Rasio lancar menghitung semua aset jangka pendek termasuk stok. Rasio cepat mengeluarkan stok karena stok paling lama berubah jadi uang. Angka di atas 1 artinya asetnya cukup menutup utang.</p>');
  };

  root.appendChild(T.el('<p class="note">Rasio ini menjawab satu pertanyaan: kalau semua tagihan jangka pendek jatuh tempo sekarang, apakah perusahaan sanggup bayar dari aset yang cepat jadi uang.</p>'));
  root.appendChild(T.field('Aset lancar (Rp)', aI, 'Kas, piutang, dan stok yang bisa jadi uang dalam setahun.'));
  root.appendChild(T.field('Persediaan / stok (Rp, boleh kosong)', pI, 'Nilai stok barang yang belum terjual.'));
  root.appendChild(T.field('Utang lancar (Rp)', uI, 'Tagihan yang jatuh tempo dalam setahun.'));
  root.appendChild(T.row(T.btn('Hitung Rasio', hitung, true)));
  root.appendChild(box);
}
