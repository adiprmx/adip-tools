import { h as T, kv, utils } from '../../core.js';

// Kebutuhan kain dihitung dari luas potongan, lalu dibagi lebar kain dan
// ditambah sisa potong 25 persen (potongan tidak pernah menempel sempurna).
// Hasilnya perkiraan, beli 20 sampai 30 cm lebih untuk jaga-jaga.
// Berat kain = panjang x lebar x GSM (gram per meter persegi).
export const PAKAIAN = {
  kemeja: { label: 'Kemeja', potongan: '2 badan + 2 lengan' },
  celana: { label: 'Celana panjang', potongan: '2 kaki' },
  gaun: { label: 'Gaun', potongan: '2 badan + 2 rok' },
  rok: { label: 'Rok', potongan: '1 panel' },
  sprei: { label: 'Sprei', potongan: '1 lembar + kelim' },
};

export function kainPakaian(jenis, panjang, lingkar, lengan, lebarKainCm) {
  const p = Number(panjang), l = Number(lingkar) || 0, lg = Number(lengan) || 0, lk = Number(lebarKainCm);
  if (!(p > 0) || !(lk > 0) || l < 0 || lg < 0) return null;
  const lebarBadan = l / 2 + 10;
  let luas;
  if (jenis === 'kemeja') luas = 2 * p * lebarBadan + 2 * lg * 46;
  else if (jenis === 'celana') luas = 2 * p * lebarBadan;
  else if (jenis === 'gaun') luas = 4 * p * lebarBadan;
  else if (jenis === 'rok') luas = p * (l + 10);
  else if (jenis === 'sprei') luas = (p + 40) * l;
  else return null;
  const meter = luas / 10000 / (lk / 100) * 1.25;
  return { luasM2: luas / 10000, meter };
}

export function beratKain(panjangM, lebarM, gsm) {
  const p = Number(panjangM), l = Number(lebarM), g = Number(gsm);
  if (!(p > 0) || !(l > 0) || !(g > 0)) return null;
  return p * l * g;
}
utils.kainPakaian = kainPakaian;
utils.beratKain = beratKain;

export const meta = {"id": "kalkulator-kain", "name": "Kalkulator Kain", "cat": "sehari", "icon": "🧵", "desc": "Kebutuhan kain untuk proyek jahit dari ukuran pola, plus berat kain dari GSM.", "keywords": "kain,menjahit,pola,meter kain,gsm,berat kain,kemeja,celana,gaun,sprei", "since": "6.19.0"};
export function render(root) {
  const jenis = T.select(Object.entries(PAKAIAN).map(([k, v]) => [k, v.label + ' (' + v.potongan + ')']), 'kemeja');
  const panjang = T.input('text', 'cth: 70', '70');
  panjang.inputMode = 'decimal';
  const lingkar = T.input('text', 'cth: 100', '100');
  lingkar.inputMode = 'decimal';
  const lengan = T.input('text', 'cth: 60', '60');
  lengan.inputMode = 'decimal';
  const lebarKain = T.select([['115', '115 cm'], ['150', '150 cm'], ['280', '280 cm (kain lebar)']], '150');
  const gsm = T.input('text', 'cth: 150', '');
  gsm.inputMode = 'decimal';
  const box = T.out();

  const wrapLengan = T.el('<div></div>');
  wrapLengan.appendChild(T.field('Panjang lengan (cm)', lengan, 'Hanya untuk kemeja.'));
  const aturTampil = () => { wrapLengan.hidden = jenis.value !== 'kemeja'; };
  jenis.addEventListener('change', aturTampil);
  aturTampil();

  const hitung = () => {
    const r = kainPakaian(jenis.value, T.num(panjang.value), T.num(lingkar.value), T.num(lengan.value), Number(lebarKain.value));
    if (!r) { T.show(box, '<span class="err">Isi panjang dan lingkar dengan angka lebih dari 0.</span>'); return; }
    const labelLingkar = jenis.value === 'sprei' ? 'Lebar kasur' : 'Lingkar badan';
    const g = T.num(gsm.value);
    const beratGram = g > 0 ? beratKain(r.meter, Number(lebarKain.value) / 100, g) : null;
    const beratHtml = beratGram != null
      ? kv('Berat kain yang dibeli', beratGram >= 1000 ? utils.fmtDes(beratGram / 1000, 2) + ' kg' : Math.round(beratGram) + ' gram')
      : '';
    T.show(box,
      '<div class="center"><div class="dim">Kain yang dibutuhkan</div>' +
      '<div class="big">' + utils.fmtDes(r.meter, 2) + ' meter</div>' +
      '<div class="dim">Lebar kain ' + T.esc(String(lebarKain.value)) + ' cm, ' + T.esc(PAKAIAN[jenis.value].potongan) + '</div></div>' +
      kv('Luas potongan', utils.fmtDes(r.luasM2, 2) + ' m2') +
      kv('Sisa potong', '25 persen sudah termasuk') +
      beratHtml +
      '<p class="hint">Ini perkiraan dari luas potongan. Kain bermotif besar atau searah butuh kain lebih banyak karena motifnya harus ketemu. Beli 20 sampai 30 cm lebih untuk jaga-jaga salah potong. Untuk sprei, kolom lingkar diisi lebar kasur.' +
      (beratGram == null ? ' Isi GSM kain di bawah untuk melihat berat kainnya.' : ' Berat dihitung dari panjang x lebar x GSM.') + '</p>');
  };

  root.appendChild(T.el('<p class="note">Pilih pakaian yang mau dijahit dan isi ukurannya. Hasilnya meter kain yang harus dibeli pada lebar kain yang kamu pilih.</p>'));
  root.appendChild(T.field('Pakaian yang mau dijahit', jenis));
  root.appendChild(T.grid2(
    T.field('Panjang pakaian (cm)', panjang),
    T.field('Lingkar badan atau lebar kasur (cm)', lingkar),
    T.field('Lebar kain (cm)', lebarKain),
  ));
  root.appendChild(wrapLengan);
  root.appendChild(T.field('GSM kain (gram per meter persegi, opsional)', gsm, 'Angka ini biasanya tertulis di label kain atau deskripsi toko. Bila diisi, berat kain yang harus dibeli ikut ditampilkan.'));
  root.appendChild(T.btn('Hitung Kain', hitung, true));
  root.appendChild(box);

  // Hitung-live (Q4 v6.21.0, observasi utang lama): hasil ikut berubah
  // saat mengetik / ganti pilihan.
  [panjang, lingkar, lengan, gsm].forEach((i) => i.addEventListener('input', hitung));
  jenis.addEventListener('change', hitung);
  lebarKain.addEventListener('change', hitung);
  hitung();
}
