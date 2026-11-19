import { h as T, utils } from '../../core.js';

// Kalkulator eDPI: eDPI = DPI x sensitivitas. Satu angka untuk
// membandingkan "kecepatan" aim antar pemain walau DPI-nya beda.
// Dilengkapi cm/360 (butuh game, karena tiap game beda skala sens)
// dan tabel sens yang rasanya sama di DPI lain.
export const meta = {"id": "kalkulator-edpi", "name": "Kalkulator eDPI", "cat": "fun", "icon": "🎯", "desc": "Hitung eDPI dari DPI dan sensitivitasmu, lihat cm/360-nya, dan cari sens yang rasanya sama di DPI lain.", "keywords": "edpi,dpi,sensitivitas,mouse,aim,cs2,valorant,game,fps,cm360", "since": "6.19.0"};

// Tabel yaw + cm/360 tinggal di modul bersama js/mouse-sens.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari 3 tool mouse).
import { YAW, cm360 } from '../../mouse-sens.js';
export { YAW, cm360 } from '../../mouse-sens.js';

export const DPI_LAIN = [400, 800, 1600, 3200];

// eDPI = DPI x sens. Murni.
export function edpi(dpi, sens) {
  if (!(dpi > 0) || !(sens > 0)) return NaN;
  return dpi * sens;
}

// Sensitivitas di DPI baru supaya rasanya sama. Murni.
export function sensDiDpi(nilaiEdpi, dpiBaru) {
  if (!(nilaiEdpi > 0) || !(dpiBaru > 0)) return NaN;
  return nilaiEdpi / dpiBaru;
}


export function render(root) {
  const box = T.out();
  const dpiI = T.input('number', 'cth: 800');
  dpiI.value = '800';
  const sensI = T.input('text', 'cth: 2,5');
  sensI.value = '2,5';
  const gameS = T.select(Object.entries(YAW).map(([k, g]) => [k, g.nama + (g.yakin ? '' : ' *')]), 'cs2');

  const hitung = () => {
    const dpi = T.num(dpiI.value);
    const sens = T.num(sensI.value);
    if (!(dpi > 0) || !(sens > 0)) { T.toast('Isi DPI dan sensitivitas dengan angka lebih dari 0'); return; }
    const game = YAW[gameS.value];
    const e = edpi(dpi, sens);
    const cm = cm360(dpi, sens, game.yaw);
    let tabel = '';
    for (const d of DPI_LAIN) {
      if (d === dpi) continue;
      tabel += '<div class="kv"><span class="k">Di ' + T.fmt(d) + ' DPI</span><span class="v">sens ' + utils.r4(sensDiDpi(e, d)) + (game.persen ? ' %' : '') + '</span></div>';
    }
    T.show(box,
      '<div class="big center">' + T.fmt(Math.round(e * 100) / 100) + '<span class="mut" style="font-size:15px"> eDPI</span></div>' +
      '<p class="center hint">' + T.fmt(dpi) + ' DPI x ' + utils.r4(sens) + ' sens di ' + game.nama + '</p>' +
      '<div style="margin-top:12px">' +
      '<div class="kv"><span class="k">cm/360</span><span class="v">' + utils.r4(cm) + ' cm</span></div>' +
      '</div>' +
      '<h3 style="margin-top:14px">Rasa yang sama di DPI lain</h3>' + tabel +
      '<p class="hint">eDPI membuat perbandingan aim jadi adil: 800 DPI x sens 2 sama cepatnya dengan 1600 DPI x sens 1. Bintang (*) di nama game artinya nilai dasarnya masih perkiraan komunitas.</p>');
  };

  root.appendChild(T.el('<p class="hint">eDPI itu DPI dikali sensitivitas. Dua pemain dengan eDPI sama punya kecepatan aim yang sama, walau DPI mousenya beda.</p>'));
  root.appendChild(T.field('DPI mouse', dpiI));
  root.appendChild(T.field('Sensitivitas di game', sensI, 'Pakai koma untuk desimal, contoh 2,5.'));
  root.appendChild(T.field('Game (untuk cm/360)', gameS));
  root.appendChild(T.row(T.btn('Hitung eDPI', hitung, true)));
  root.appendChild(box);
}
