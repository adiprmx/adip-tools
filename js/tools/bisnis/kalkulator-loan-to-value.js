import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-loan-to-value", "name": "Kalkulator LTV (Loan to Value)", "cat": "bisnis", "icon": "🏠", "desc": "Rasio pinjaman terhadap nilai properti: seberapa besar KPR dibanding harga rumahnya.", "keywords": "ltv,loan to value,kpr,pinjaman,properti,rumah,agunan,uang muka,rasio pinjaman", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* LTV = pinjaman / nilai properti x 100%. Hasil dalam persen.
   Null bila input tidak valid. */
export function hitungLtv(pinjaman, nilaiProperti) {
  const p = Number(pinjaman), v = Number(nilaiProperti);
  if (![p, v].every(isFinite) || v <= 0 || p < 0) return null;
  const r = (p / v) * 100;
  return Number.isFinite(r) ? r : null;
}
utils.ltv = hitungLtv;

export function render(root) {
  const pinjamI = T.input('text', 'cth: 400000000', '');
  const nilaiI = T.input('text', 'cth: 500000000', '');
  const box = T.out();

  const hitung = () => {
    const pinjam = T.num(pinjamI.value);
    const nilai = T.num(nilaiI.value);
    if (!isFinite(pinjam) || pinjam < 0) { T.show(box, '<div class="err">Isi jumlah pinjaman dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(nilai) || nilai <= 0) { T.show(box, '<div class="err">Isi nilai properti dengan angka lebih dari 0.</div>'); return; }
    const ltv = hitungLtv(pinjam, nilai);
    if (ltv === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const dp = nilai - pinjam;
    const maks80 = nilai * 0.8;
    const vonis = ltv <= 80
      ? 'Rasio ini umumnya masih diterima bank untuk KPR rumah pertama tanpa syarat tambahan yang berat.'
      : ltv <= 90
        ? 'Rasio ini di atas 80%. Bank biasanya meminta uang muka lebih besar atau asuransi tambahan.'
        : ltv <= 100
          ? 'Rasio ini tinggi: hampir seluruh harga properti dibiayai pinjaman. Uang mukanya sangat kecil.'
          : 'Pinjaman lebih besar dari nilai propertinya. Ini jarang disetujui bank.';
    T.show(box,
      '<div class="big center">' + fmtP(ltv) + '</div>' +
      '<p class="center">loan to value (LTV)</p>' +
      kv('Jumlah pinjaman', T.rp(pinjam)) +
      kv('Nilai properti', T.rp(nilai)) +
      kv('Uang muka (selisih)', T.rp(dp) + ' (' + fmtP(100 - ltv) + ' dari harga)') +
      kv('Pinjaman maksimal di LTV 80%', T.rp(maks80)) +
      '<p class="' + (ltv <= 80 ? 'info' : ltv <= 90 ? 'warn' : 'err') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: pinjaman dibagi nilai properti, dikali 100%. LTV 80% artinya 80% harga rumah dibayar dari pinjaman dan 20% dari uang mukamu. Makin rendah LTV, makin kecil risiko buat bank dan makin ringan cicilanmu.</p>');
  };

  root.appendChild(T.el('<p class="note">LTV mengukur seberapa besar pinjamanmu dibanding nilai properti yang dijaminkan. Bank memakai angka ini untuk memutuskan apakah KPR disetujui dan berapa uang muka yang diminta.</p>'));
  root.appendChild(T.field('Jumlah pinjaman (Rp)', pinjamI, 'Jumlah yang dipinjam dari bank.'));
  root.appendChild(T.field('Nilai properti (Rp)', nilaiI, 'Harga jual atau nilai taksiran properti.'));
  root.appendChild(T.row(T.btn('Hitung LTV', hitung, true)));
  root.appendChild(box);
}
