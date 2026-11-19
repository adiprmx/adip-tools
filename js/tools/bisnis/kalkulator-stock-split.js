import { h as T, utils, kv } from '../../core.js';

export const meta = {"id": "kalkulator-stock-split", "name": "Kalkulator Stock Split", "cat": "bisnis", "icon": "✂️", "desc": "Jumlah saham dan harga barumu setelah stock split atau reverse split.", "keywords": "stock split,reverse split,pecah saham,saham,jumlah saham,harga saham,rasio split", "since": "6.19.0"};

const fmtS = (x) => {
  const r = Math.round(x * 10000) / 10000;
  return String(r === 0 ? 0 : r).replace('.', ',');
};

/* Stock split a-untuk-b: saham baru = lama x a/b, harga baru = lama x b/a.
   Total nilai tidak berubah. Null bila input tidak valid. */
export function hitungStockSplit(jumlahLama, hargaLama, a, b) {
  const q = Number(jumlahLama), p = Number(hargaLama);
  const na = Number(a), nb = Number(b);
  if (![q, p, na, nb].every(isFinite) || q < 0 || p < 0 || na <= 0 || nb <= 0) return null;
  const jumlahBaru = q * na / nb;
  const hargaBaru = p * nb / na;
  if (![jumlahBaru, hargaBaru].every(isFinite)) return null;
  return { jumlahBaru, hargaBaru, nilaiLama: q * p, nilaiBaru: jumlahBaru * hargaBaru };
}
utils.stockSplit = hitungStockSplit;

export function render(root) {
  const jumlahI = T.input('text', 'cth: 100', '');
  const hargaI = T.input('text', 'cth: 200000', '');
  const aI = T.input('text', 'cth: 2', '2');
  const bI = T.input('text', 'cth: 1', '1');
  const box = T.out();

  const hitung = () => {
    const jumlah = T.num(jumlahI.value);
    const harga = T.num(hargaI.value);
    const a = T.num(aI.value);
    const b = T.num(bI.value);
    if (!isFinite(jumlah) || jumlah < 0) { T.show(box, '<div class="err">Isi jumlah saham yang kamu punya dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(harga) || harga < 0) { T.show(box, '<div class="err">Isi harga per saham dengan angka 0 atau lebih.</div>'); return; }
    if (!isFinite(a) || a <= 0 || !isFinite(b) || b <= 0) { T.show(box, '<div class="err">Isi rasio split dengan angka lebih dari 0. Contoh: 2 untuk 1 artinya 1 saham jadi 2.</div>'); return; }
    const hasil = hitungStockSplit(jumlah, harga, a, b);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    const jenis = a > b ? 'stock split' : a < b ? 'reverse split' : 'bukan split';
    const vonis = a === b
      ? 'Rasionya 1 banding 1, jadi tidak ada yang berubah.'
      : 'Total nilai investasimu tidak berubah: jumlah saham dan harga bergerak berlawanan dengan rasio yang sama.';
    T.show(box,
      '<div class="big center">' + fmtS(hasil.jumlahBaru) + ' lembar</div>' +
      '<p class="center">jumlah saham baru (' + jenis + ' ' + fmtS(a) + ' untuk ' + fmtS(b) + ')</p>' +
      kv('Harga baru per saham', T.rp(hasil.hargaBaru)) +
      kv('Jumlah saham lama', fmtS(jumlah) + ' lembar @ ' + T.rp(harga)) +
      kv('Total nilai sebelum split', T.rp(hasil.nilaiLama)) +
      kv('Total nilai sesudah split', T.rp(hasil.nilaiBaru)) +
      '<p class="info">' + vonis + '</p>' +
      '<p class="hint">Rumusnya: saham baru = saham lama x rasio, harga baru = harga lama dibagi rasio. Split hanya memecah kepemilikan jadi potongan lebih kecil, bukan menambah nilai. Reverse split menggabungkan saham jadi lebih sedikit dengan harga lebih tinggi per lembar.</p>');
  };

  root.appendChild(T.el('<p class="note">Stock split memecah satu saham jadi beberapa saham dengan harga per lembar yang lebih murah. Reverse split kebalikannya. Total nilai investasimu tetap sama, yang berubah hanya jumlah lembar dan harga per lembar.</p>'));
  root.appendChild(T.field('Jumlah saham yang kamu punya', jumlahI, 'Berapa lembar saham yang kamu miliki sekarang.'));
  root.appendChild(T.field('Harga per saham (Rp)', hargaI, 'Harga satu lembar saham sebelum split.'));
  root.appendChild(T.field('Rasio split: jadi (a)', aI, 'Angka depan rasio. Split 2 untuk 1 berarti 1 saham jadi 2, isi 2.'));
  root.appendChild(T.field('Rasio split: dari (b)', bI, 'Angka belakang rasio. Split 2 untuk 1 berarti isi 1. Reverse split 1 untuk 10 berarti a=1, b=10.'));
  root.appendChild(T.row(T.btn('Hitung Stock Split', hitung, true)));
  root.appendChild(box);
}
