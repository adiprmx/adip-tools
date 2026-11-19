import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-impermanent-loss", "name": "Kalkulator Impermanent Loss", "cat": "bisnis", "icon": "🪙", "desc": "Berapa rugi penyedia likuiditas DeFi saat harga token berubah dibanding sekadar menyimpan tokennya.", "keywords": "impermanent loss,defi,likuiditas,pool,uniswap,token,kripto,amm", "since": "6.19.0"};

const nol = (x) => (x === 0 ? 0 : x);
const fmtP = (x, d) => nol(x).toFixed(d == null ? 2 : d).replace('.', ',') + '%';

/* Impermanent loss: IL = 2 x akar(r) / (1 + r) - 1, dengan r = harga baru /
   harga awal. Hasil dalam persen (negatif = rugi dibanding menyimpan).
   Null bila input tidak valid. */
export function hitungImpermanentLoss(hargaAwal, hargaBaru) {
  const a = Number(hargaAwal), b = Number(hargaBaru);
  if (![a, b].every(isFinite) || a <= 0 || b <= 0) return null;
  const r = b / a;
  const il = (2 * Math.sqrt(r) / (1 + r) - 1) * 100;
  return Number.isFinite(il) ? il : null;
}
utils.impermanentLoss = hitungImpermanentLoss;

export function render(root) {
  const awalI = T.input('text', 'cth: 100', '');
  const baruI = T.input('text', 'cth: 200', '');
  const modalI = T.input('text', 'cth: 10000000', '');
  const box = T.out();

  const hitung = () => {
    const awal = T.num(awalI.value);
    const baru = T.num(baruI.value);
    const modal = T.num(modalI.value);
    if (!isFinite(awal) || awal <= 0) { T.show(box, '<div class="err">Isi harga token saat masuk pool dengan angka lebih dari 0.</div>'); return; }
    if (!isFinite(baru) || baru <= 0) { T.show(box, '<div class="err">Isi harga token sekarang dengan angka lebih dari 0.</div>'); return; }
    if (!isFinite(modal) || modal < 0) { T.show(box, '<div class="err">Isi modal yang dimasukkan ke pool dengan angka 0 atau lebih.</div>'); return; }
    const il = hitungImpermanentLoss(awal, baru);
    if (il === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const r = baru / awal;
    const nilaiHodl = modal * (1 + r) / 2;
    const nilaiPool = nilaiHodl * (1 + il / 100);
    const selisih = nilaiPool - nilaiHodl;
    const vonis = il >= -1
      ? 'Harga hampir tidak berubah, jadi kerugiannya kecil sekali dibanding menyimpan tokennya.'
      : 'Makin jauh harga bergerak dari harga awal, makin besar kerugian ini, ke arah naik maupun turun.';
    T.show(box,
      '<div class="big center">' + fmtP(il) + '</div>' +
      '<p class="center">impermanent loss dibanding menyimpan token</p>' +
      kv('Perubahan harga', 'x' + utils.r4(r).replace('.', ',') + ' (' + fmtP((r - 1) * 100) + ')') +
      kv('Nilai bila disimpan saja', T.rp(nilaiHodl)) +
      kv('Nilai di pool likuiditas', T.rp(nilaiPool)) +
      kv('Selisih', T.rp(selisih)) +
      '<p class="' + (il >= -1 ? 'info' : 'warn') + '">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: 2 x akar(perubahan harga) dibagi (1 + perubahan harga), dikurangi 1. Hitungan ini belum termasuk fee yang kamu dapat dari pool, yang bisa menutup sebagian kerugian. Kerugian baru jadi nyata saat kamu menarik dana dari pool.</p>');
  };

  root.appendChild(T.el('<p class="note">Saat kamu menitipkan sepasang token ke pool likuiditas DeFi, harganya bisa berubah dan nilai danamu jadi lebih kecil dibanding bila token itu disimpan saja. Selisih itu namanya impermanent loss.</p>'));
  root.appendChild(T.field('Harga token saat masuk pool', awalI, 'Harga token saat kamu pertama menitipkan dana.'));
  root.appendChild(T.field('Harga token sekarang', baruI, 'Harga token saat ini.'));
  root.appendChild(T.field('Modal yang dimasukkan (Rp)', modalI, 'Total nilai yang kamu titipkan ke pool.'));
  root.appendChild(T.row(T.btn('Hitung Impermanent Loss', hitung, true)));
  root.appendChild(box);
}
