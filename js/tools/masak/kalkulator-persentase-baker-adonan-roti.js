import { h as T, utils, kv } from '../../core.js';

// Persentase baker: tepung selalu 100%, semua bahan lain dihitung dari
// berat tepung. Contoh: tepung 500 g dengan hidrasi 65% berarti air 325 g.
// Kisaran umum roti tawar: air 60-70%, garam 2%, ragi instan 0,5-1%.
// Roti manis: gula 5-15%, mentega 5-15%. Angka di bawah bisa diubah bebas.
export function hitungBaker(tepung, persen) {
  const t = Math.max(0, Number(tepung) || 0);
  const bahan = {};
  let total = t;
  for (const k of Object.keys(persen)) {
    const p = Math.max(0, Number(persen[k]) || 0);
    bahan[k] = t * p / 100;
    total += bahan[k];
  }
  return { tepung: t, bahan, total };
}
export function tepungDariTotal(total, persen) {
  let pembagi = 1;
  for (const k of Object.keys(persen)) pembagi += Math.max(0, Number(persen[k]) || 0) / 100;
  return Math.max(0, Number(total) || 0) / pembagi;
}
utils.baker = hitungBaker;

const BAHAN = [
  ['air', 'Air', '65', 'Roti tawar umumnya 60-70%'],
  ['garam', 'Garam', '2', 'Umumnya 2% dari tepung'],
  ['ragi', 'Ragi instan', '1', 'Umumnya 0,5-1%'],
  ['gula', 'Gula', '0', 'Roti manis 5-15%, roti tawar 0%'],
  ['lemak', 'Mentega / minyak', '0', 'Roti manis 5-15%, roti tawar 0%'],
];

export const meta = {"id": "kalkulator-persentase-baker-adonan-roti", "name": "Kalkulator Persentase Baker (Adonan Roti)", "cat": "masak", "icon": "🍞", "desc": "Hitung resep roti dengan persentase baker: tepung 100%, bahan lain mengikuti.", "keywords": "baker,roti,adonan,hidrasi,tepung,ragi,resep,baking", "since": "6.17.0"};
export function render(root) {
  const modeSel = T.select([
    ['tepung', 'Dari berat tepung'],
    ['total', 'Dari berat total adonan yang diinginkan'],
  ], 'tepung');
  const tepungI = T.input('text', 'cth: 500', '500'); tepungI.inputMode = 'decimal';
  const totalI = T.input('text', 'cth: 1000', ''); totalI.inputMode = 'decimal';
  const persenI = {};
  BAHAN.forEach(([k, label, def]) => {
    const i = T.input('text', 'cth: ' + def, def); i.inputMode = 'decimal';
    persenI[k] = i;
  });
  const box = T.out();
  const fldTepung = T.field('Berat tepung (gram)', tepungI);
  const fldTotal = T.field('Berat total adonan yang diinginkan (gram)', totalI);
  fldTotal.hidden = true;

  const aturMode = () => {
    const m = modeSel.value;
    fldTepung.hidden = m !== 'tepung';
    fldTotal.hidden = m !== 'total';
    hitung();
  };
  modeSel.addEventListener('change', aturMode);

  const hitung = () => {
    const persen = {};
    BAHAN.forEach(([k]) => { persen[k] = T.num(persenI[k].value); });
    const persenValid = Object.values(persen).every((v) => isFinite(v) && v >= 0);
    if (!persenValid) { T.show(box, '<p class="warn">Persentase bahan harus angka 0 atau lebih.</p>'); return; }
    let tepung;
    if (modeSel.value === 'total') {
      const total = T.num(totalI.value) || 0;
      if (!(total > 0)) { T.hide(box); return; }
      tepung = tepungDariTotal(total, persen);
    } else {
      tepung = T.num(tepungI.value) || 0;
      if (!(tepung > 0)) { T.hide(box); return; }
    }
    const r = hitungBaker(tepung, persen);
    const fmtG = (g) => T.fmt(Math.round(g * 10) / 10) + ' g';
    let rows = kv('Tepung (100%)', fmtG(r.tepung));
    BAHAN.forEach(([k, label]) => {
      rows += kv(label + ' (' + String(persen[k]).replace('.', ',') + '%)', fmtG(r.bahan[k]));
    });
    rows += kv('Total adonan', '<b>' + fmtG(r.total) + '</b>');
    T.show(box,
      '<div class="big">' + fmtG(r.total) + '</div>' +
      '<p class="center mut">Total adonan dari ' + fmtG(r.tepung) + ' tepung.</p>' +
      rows +
      '<p class="hint">Persentase baker: tepung selalu 100%, bahan lain dihitung dari berat tepung. Hidrasi (air) 60-70% cocok untuk roti tawar; adonan di atas 70% lebih lengket dan butuh tangan yang sudah terbiasa. Persentase di atas bisa diubah bebas sesuai resepmu.</p>');
  };
  [tepungI, totalI, ...Object.values(persenI)].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Pembuat roti menghitung resep dari tepung, bukan dari total adonan. Tepung selalu 100%, air, garam, dan ragi mengikuti persentasenya. Cara ini bikin resep gampang diperbesar atau diperkecil.</p>'));
  root.appendChild(T.field('Hitung dari', modeSel));
  root.appendChild(fldTepung);
  root.appendChild(fldTotal);
  BAHAN.forEach(([k, label, , hint]) => {
    root.appendChild(T.field(label + ' (%)', persenI[k], hint));
  });
  root.appendChild(box);
  hitung();
}
