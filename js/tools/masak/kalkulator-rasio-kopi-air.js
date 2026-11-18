import { h as T, utils, kv } from '../../core.js';

// Rasio kopi : air (per berat) per metode seduh. Tubruk 1 : 15, V60 1 : 15,
// french press 1 : 14, espresso 1 : 2, cold brew 1 : 8. Rasio bisa diubah
// bebas, karena selera dan biji kopi beda-beda. 1 cangkir dihitung 200 ml.
const METODE = {
  tubruk: { label: 'Tubruk', rasio: 15 },
  v60: { label: 'V60 / pour over', rasio: 15 },
  french: { label: 'French press', rasio: 14 },
  espresso: { label: 'Espresso', rasio: 2 },
  coldbrew: { label: 'Cold brew', rasio: 8 },
};
export function hitungKopiAir(kopi, rasio) {
  const k = Math.max(0, Number(kopi) || 0);
  const r = Math.max(0, Number(rasio) || 0);
  return { kopi: k, airMl: k * r, cangkir: k * r / 200 };
}
utils.rasioKopiAir = hitungKopiAir;

export const meta = {"id": "kalkulator-rasio-kopi-air", "name": "Kalkulator Rasio Kopi-Air", "cat": "masak", "icon": "☕", "desc": "Takaran kopi dan air dari metode seduh: tubruk, V60, french press, espresso, atau cold brew.", "keywords": "kopi,air,rasio,tubruk,v60,french press,espresso,cold brew,seduh", "since": "6.17.0"};
export function render(root) {
  const modeSel = T.select([
    ['kopi', 'Dari berat kopi'],
    ['air', 'Dari jumlah air'],
  ], 'kopi');
  const kopiI = T.input('text', 'cth: 20', '20'); kopiI.inputMode = 'decimal';
  const airI = T.input('text', 'cth: 300', ''); airI.inputMode = 'decimal';
  const metodeSel = T.select(Object.keys(METODE).map((k) => [k, METODE[k].label]), 'v60');
  const rasioI = T.input('text', 'cth: 15', '15'); rasioI.inputMode = 'decimal';
  const box = T.out();
  const fldKopi = T.field('Berat kopi (gram)', kopiI);
  const fldAir = T.field('Jumlah air (ml)', airI);
  fldAir.hidden = true;
  let rasioDiubah = false;
  rasioI.addEventListener('input', () => { rasioDiubah = true; });
  metodeSel.addEventListener('change', () => {
    const mm = METODE[metodeSel.value] || METODE.v60;
    if (!rasioDiubah) rasioI.value = String(mm.rasio);
    hitung();
  });
  modeSel.addEventListener('change', () => {
    fldKopi.hidden = modeSel.value !== 'kopi';
    fldAir.hidden = modeSel.value !== 'air';
    hitung();
  });

  const hitung = () => {
    const rasio = T.num(rasioI.value);
    if (!isFinite(rasio) || rasio <= 0) { T.show(box, '<p class="warn">Rasio harus angka lebih dari 0.</p>'); return; }
    const m = METODE[metodeSel.value] || METODE.v60;
    let kopi, airMl;
    if (modeSel.value === 'air') {
      airMl = T.num(airI.value) || 0;
      if (!(airMl > 0)) { T.hide(box); return; }
      kopi = airMl / rasio;
    } else {
      kopi = T.num(kopiI.value) || 0;
      if (!(kopi > 0)) { T.hide(box); return; }
      airMl = kopi * rasio;
    }
    const cangkir = airMl / 200;
    T.show(box,
      '<div class="big">' + T.fmt(Math.round(kopi * 10) / 10) + ' g kopi : ' + T.fmt(Math.round(airMl)) + ' ml air</div>' +
      '<p class="center mut">Metode ' + T.esc(m.label.toLowerCase()) + ', rasio 1 : ' + String(rasio).replace('.', ',') + '.</p>' +
      kv('Kopi', T.fmt(Math.round(kopi * 10) / 10) + ' gram') +
      kv('Air', T.fmt(Math.round(airMl)) + ' ml') +
      kv('Hasil seduh (1 cangkir = 200 ml)', 'sekitar ' + T.fmt(Math.round(cangkir * 10) / 10) + ' cangkir') +
      '<p class="hint">Rasio bawaan: tubruk 1 : 15, V60 1 : 15, french press 1 : 14, espresso 1 : 2, cold brew 1 : 8. Espresso memakai air paling sedikit karena diekstrak bertekanan. Rasio di atas bisa diubah sesuai biji kopi dan seleramu.</p>');
  };
  [kopiI, airI, rasioI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Kopi enak mulai dari takaran yang pas. Pilih metode seduhmu, masukkan berat kopi atau jumlah air, dan takaran pasangannya langsung ketemu.</p>'));
  root.appendChild(T.field('Hitung dari', modeSel));
  root.appendChild(fldKopi);
  root.appendChild(fldAir);
  root.appendChild(T.field('Metode seduh', metodeSel));
  root.appendChild(T.field('Rasio air (air per 1 bagian kopi)', rasioI, 'Terisi otomatis sesuai metode, bisa diubah'));
  root.appendChild(box);
  hitung();
}
