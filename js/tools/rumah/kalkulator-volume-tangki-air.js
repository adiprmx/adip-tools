import { h as T, utils, kv } from '../../core.js';

// Volume tangki air. Silinder: phi x (diameter/2)^2 x tinggi. Kotak:
// panjang x lebar x tinggi. Hasil dalam liter (1 m3 = 1.000 liter).
// Lama cukup = volume / (penghuni x pemakaian per orang per hari).
// Pemakaian default 120 liter per orang per hari (mandi, cuci, masak,
// dan keperluan lain), bisa diubah.
export function hitungTangki(o) {
  let m3 = 0;
  if (o.bentuk === 'kotak') {
    m3 = Math.max(0, Number(o.panjang) || 0) / 100 * Math.max(0, Number(o.lebar) || 0) / 100 * Math.max(0, Number(o.tinggi) || 0) / 100;
  } else {
    const r = Math.max(0, Number(o.diameter) || 0) / 200;
    m3 = Math.PI * r * r * Math.max(0, Number(o.tinggi) || 0) / 100;
  }
  const liter = m3 * 1000;
  const penghuni = Math.max(0, Number(o.penghuni) || 0);
  const pakai = Math.max(0, Number(o.pakai) || 0);
  const perHari = penghuni * pakai;
  const hari = perHari > 0 ? liter / perHari : 0;
  return { liter, perHari, hari };
}
utils.volumeTangkiAir = hitungTangki;

export const meta = {"id": "kalkulator-volume-tangki-air", "name": "Kalkulator Volume Tangki Air", "cat": "rumah", "icon": "💧", "desc": "Berapa liter muat di tangki air, dan berapa hari cukup untuk penghuni rumah.", "keywords": "tangki,air,volume,toren,liter,rumah,silinder,kotak", "since": "6.17.0"};
export function render(root) {
  const bentukSel = T.select([
    ['silinder', 'Silinder / toren bulat'],
    ['kotak', 'Kotak'],
  ], 'silinder');
  const diaI = T.input('text', 'cth: 100', ''); diaI.inputMode = 'decimal';
  const pjI = T.input('text', 'cth: 100', ''); pjI.inputMode = 'decimal';
  const lbI = T.input('text', 'cth: 100', ''); lbI.inputMode = 'decimal';
  const tgI = T.input('text', 'cth: 150', ''); tgI.inputMode = 'decimal';
  const penghuniI = T.input('text', 'cth: 4', '4'); penghuniI.inputMode = 'decimal';
  const pakaiI = T.input('text', 'cth: 120', '120'); pakaiI.inputMode = 'decimal';
  const box = T.out();
  const fldDia = T.field('Diameter tangki (cm)', diaI);
  const fldPj = T.field('Panjang tangki (cm)', pjI);
  const fldLb = T.field('Lebar tangki (cm)', lbI);
  fldPj.hidden = true;
  fldLb.hidden = true;

  const aturBentuk = () => {
    const k = bentukSel.value === 'kotak';
    fldDia.hidden = k;
    fldPj.hidden = !k;
    fldLb.hidden = !k;
    hitung();
  };
  bentukSel.addEventListener('change', aturBentuk);

  const hitung = () => {
    const tinggi = T.num(tgI.value) || 0;
    const kotak = bentukSel.value === 'kotak';
    const ok = kotak
      ? (T.num(pjI.value) || 0) > 0 && (T.num(lbI.value) || 0) > 0 && tinggi > 0
      : (T.num(diaI.value) || 0) > 0 && tinggi > 0;
    if (!ok) { T.hide(box); return; }
    const r = hitungTangki({
      bentuk: bentukSel.value,
      diameter: T.num(diaI.value), panjang: T.num(pjI.value), lebar: T.num(lbI.value),
      tinggi, penghuni: T.num(penghuniI.value), pakai: T.num(pakaiI.value),
    });
    const hariTeks = r.hari >= 1
      ? T.fmt(Math.floor(r.hari)) + ' hari' + (r.hari % 1 >= 0.5 ? ' lebih' : '')
      : Math.round(r.hari * 24) + ' jam';
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(r.liter)) + ' liter</div>' +
      '<p class="center mut">Volume tangki ini.</p>' +
      kv('Pemakaian per hari', T.fmt(Math.round(r.perHari)) + ' liter') +
      kv('Cukup untuk', '<b>' + hariTeks + '</b>') +
      '<p class="hint">Pemakaian 120 liter per orang per hari adalah angka umum untuk rumah tangga (mandi, cuci, masak, siram). Rumah dengan mesin cuci dan banyak kamar mandi bisa lebih boros, ubah angkanya sesuai kebiasaan rumahmu. Tangki sebaiknya tidak diisi sampai penuh meluber, sisakan sedikit ruang di atas.</p>');
  };
  [diaI, pjI, lbI, tgI, penghuniI, pakaiI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau beli toren atau cek tangki yang sudah ada? Masukkan ukurannya dan jumlah penghuni rumah.</p>'));
  root.appendChild(T.field('Bentuk tangki', bentukSel));
  root.appendChild(fldDia);
  root.appendChild(fldPj);
  root.appendChild(fldLb);
  root.appendChild(T.field('Tinggi tangki (cm)', tgI));
  root.appendChild(T.grid2(
    T.field('Jumlah penghuni', penghuniI),
    T.field('Pemakaian per orang per hari (liter)', pakaiI)
  ));
  root.appendChild(box);
  hitung();
}
