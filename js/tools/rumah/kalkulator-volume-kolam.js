import { h as T, utils, kv } from '../../core.js';

// Volume kolam. Persegi panjang: panjang x lebar x kedalaman rata-rata.
// Lingkaran: pi x r^2 x kedalaman. Oval: pi/4 x panjang x lebar x
// kedalaman. Ginjal (kidney): 0,45 x panjang x lebar x kedalaman
// (faktor bentuk yang umum dipakai untuk kolam ginjal). Kedalaman rata-rata
// = (dangkal + dalam) / 2 bila ujungnya beda. 1 m3 = 1.000 liter.
// Berat air: 1 liter = 1 kg. Lama isi = volume / debit keran.
export function hitungKolam(o) {
  const dRata = (Math.max(0, Number(o.dangkal) || 0) + Math.max(0, Number(o.dalam) || 0)) / 2;
  const p = Math.max(0, Number(o.panjang) || 0);
  const l = Math.max(0, Number(o.lebar) || 0);
  const dia = Math.max(0, Number(o.diameter) || 0);
  let m3 = 0;
  if (o.bentuk === 'lingkaran') m3 = Math.PI * Math.pow(dia / 2, 2) * dRata;
  else if (o.bentuk === 'oval') m3 = Math.PI / 4 * p * l * dRata;
  else if (o.bentuk === 'ginjal') m3 = 0.45 * p * l * dRata;
  else m3 = p * l * dRata;
  const liter = m3 * 1000;
  const debit = Math.max(0, Number(o.debit) || 0);
  const menitIsi = debit > 0 ? liter / debit : 0;
  return { m3, liter, kg: liter, dRata, menitIsi };
}
utils.volumeKolam = hitungKolam;

export const meta = {"id": "kalkulator-volume-kolam", "name": "Kalkulator Volume Kolam", "cat": "rumah", "icon": "🏊", "desc": "Berapa liter air yang dibutuhkan kolam persegi, bulat, oval, atau ginjal, plus lama mengisinya.", "keywords": "kolam,volume,renang,liter,air,oval,ginjal,isi kolam", "since": "6.19.0"};
export function render(root) {
  const bentukSel = T.select([
    ['persegi', 'Persegi panjang'],
    ['lingkaran', 'Lingkaran / bulat'],
    ['oval', 'Oval'],
    ['ginjal', 'Ginjal (kidney)'],
  ], 'persegi');
  const pjI = T.input('text', 'cth: 8', '8'); pjI.inputMode = 'decimal';
  const lbI = T.input('text', 'cth: 4', '4'); lbI.inputMode = 'decimal';
  const diaI = T.input('text', 'cth: 5', ''); diaI.inputMode = 'decimal';
  const dangkalI = T.input('text', 'cth: 1,2', '1,2'); dangkalI.inputMode = 'decimal';
  const dalamI = T.input('text', 'cth: 1,8', '1,8'); dalamI.inputMode = 'decimal';
  const debitI = T.input('text', 'cth: 20', ''); debitI.inputMode = 'decimal';
  const box = T.out();
  const fldPj = T.field('Panjang kolam (meter)', pjI);
  const fldLb = T.field('Lebar kolam (meter)', lbI);
  const fldDia = T.field('Diameter kolam (meter)', diaI);
  fldDia.hidden = true;

  const aturBentuk = () => {
    const bulat = bentukSel.value === 'lingkaran';
    fldPj.hidden = bulat; fldLb.hidden = bulat; fldDia.hidden = !bulat;
    hitung();
  };
  bentukSel.addEventListener('change', aturBentuk);

  const hitung = () => {
    const bulat = bentukSel.value === 'lingkaran';
    const ok = bulat
      ? (T.num(diaI.value) || 0) > 0
      : (T.num(pjI.value) || 0) > 0 && (T.num(lbI.value) || 0) > 0;
    const dOk = (T.num(dangkalI.value) || 0) > 0 || (T.num(dalamI.value) || 0) > 0;
    if (!ok || !dOk) { T.hide(box); return; }
    const r = hitungKolam({
      bentuk: bentukSel.value, panjang: T.num(pjI.value), lebar: T.num(lbI.value),
      diameter: T.num(diaI.value), dangkal: T.num(dangkalI.value), dalam: T.num(dalamI.value),
      debit: T.num(debitI.value),
    });
    const jam = Math.floor(r.menitIsi / 60);
    const mnt = Math.round(r.menitIsi % 60);
    const lamaTeks = r.menitIsi > 0 ? (jam > 0 ? jam + ' jam ' + mnt + ' menit' : mnt + ' menit') : '';
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(r.liter)) + ' liter</div>' +
      '<p class="center mut">Volume air kolam ini.</p>' +
      kv('Volume', T.fmt(Math.round(r.m3 * 100) / 100) + ' m³') +
      kv('Berat air', T.fmt(Math.round(r.kg)) + ' kg') +
      kv('Kedalaman rata-rata', T.fmt(Math.round(r.dRata * 100) / 100) + ' m') +
      (lamaTeks ? kv('Lama mengisi', lamaTeks) : '') +
      '<p class="hint">Kolam ginjal memakai faktor bentuk 0,45, jadi hasilnya perkiraan: bentuk ginjal yang satu dengan yang lain tidak persis sama. Isi kedalaman dangkal dan dalam dengan angka yang sama bila dasar kolam rata. Debit keran rumah umumnya 10–30 liter per menit.</p>');
  };
  [pjI, lbI, diaI, dangkalI, dalamI, debitI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau isi kolam atau hitung kaporitnya? Masukkan bentuk dan ukurannya dulu.</p>'));
  root.appendChild(T.field('Bentuk kolam', bentukSel));
  root.appendChild(fldPj);
  root.appendChild(fldLb);
  root.appendChild(fldDia);
  root.appendChild(T.grid2(
    T.field('Kedalaman ujung dangkal (meter)', dangkalI),
    T.field('Kedalaman ujung dalam (meter)', dalamI)
  ));
  root.appendChild(T.field('Debit keran (liter/menit, opsional)', debitI, 'Diisi kalau mau tahu lama mengisinya'));
  root.appendChild(box);
  hitung();
}
