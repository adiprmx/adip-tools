import { h as T, utils } from '../../core.js';

// Kalkulator cm/360: berapa cm mouse harus digeser untuk memutar
// pandangan 360 derajat di game. Rumus: cm/360 = 2,54 x 360 / (DPI x
// sens x yaw), yaw = derajat per hitungan mouse pada sens 1.
// Nilai yaw umum komunitas: CS2 0,022; Valorant 0,06996 (0,022 x 3,18);
// Apex 0,022; Overwatch 2 0,0066; PUBG 0,022. Tiga game terakhir di
// tabel (R6, Fortnite, CoD) nilainya perkiraan komunitas dan ditandai
// di UI. BELUM TERVERIFIKASI WEB (egress mati saat build): QA cek ulang
// ke mouse-sensitivity.com saat egress pulih.
export const meta = {"id": "kalkulator-cm360", "name": "Kalkulator cm/360", "cat": "fun", "icon": "🖱️", "desc": "Hitung cm/360 dari DPI dan sensitivitasmu, atau cari sensitivitas untuk cm/360 target. Ada gambar mousepad pembandingnya.", "keywords": "cm/360,sensitivitas,dpi,mouse,aim,cs2,valorant,game,fps", "since": "6.19.0"};

// Tabel yaw + cm/360 tinggal di modul bersama js/mouse-sens.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari 3 tool mouse).
import { YAW, cm360 } from '../../mouse-sens.js';
export { YAW, cm360 } from '../../mouse-sens.js';


// Sensitivitas untuk cm/360 target. Murni.
export function sensDariCm(dpi, targetCm, yaw) {
  if (!(dpi > 0) || !(targetCm > 0) || !(yaw > 0)) return NaN;
  return (2.54 * 360) / (dpi * targetCm * yaw);
}

export function render(root) {
  const box = T.out();
  const modeS = T.select([['ke-cm', 'DPI + sensitivitas ke cm/360'], ['ke-sens', 'cm/360 target ke sensitivitas']], 'ke-cm');
  const gameS = T.select(Object.entries(YAW).map(([k, g]) => [k, g.nama + (g.yakin ? '' : ' *')]), 'cs2');
  const dpiI = T.input('number', 'cth: 800');
  dpiI.value = '800';
  const sensI = T.input('text', 'cth: 2,5');
  sensI.value = '2,5';
  const cmI = T.input('text', 'cth: 30');
  const rowSens = T.field('Sensitivitas di game', sensI, 'Pakai koma untuk desimal, contoh 2,5.');
  const rowCm = T.field('cm/360 yang kamu mau', cmI, 'Makin kecil angkanya, makin cepat putarannya.');
  rowCm.style.display = 'none';

  modeS.onchange = () => {
    const keCm = modeS.value === 'ke-cm';
    rowSens.style.display = keCm ? '' : 'none';
    rowCm.style.display = keCm ? 'none' : '';
  };

  const gambar = (cm, sens, game) => {
    const maks = 60;
    const pct = Math.min(100, (cm / maks) * 100);
    const pad = [
      ['Kecil (25 cm)', 25], ['Sedang (35 cm)', 35], ['Besar (45 cm)', 45],
    ];
    let padHtml = '';
    for (const [nama, lebar] of pad) {
      const muat = cm <= lebar;
      padHtml += '<div class="kv"><span class="k">Mousepad ' + nama + '</span><span class="v">' + (muat ? 'muat 360°' : 'kurang ' + utils.r4(cm - lebar) + ' cm') + '</span></div>';
    }
    T.show(box,
      '<div class="big center">' + utils.r4(cm) + '<span class="mut" style="font-size:15px"> cm / 360°</span></div>' +
      '<p class="center hint">' + game.nama + ' · ' + utils.r4(sens) + ' sens' + (game.persen ? '%' : '') + '</p>' +
      '<div style="margin:14px 0 4px"><div style="height:10px;background:#ffffff14;border-radius:5px"><div style="height:10px;width:' + pct + '%;background:#fff;border-radius:5px"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11px" class="hint"><span>0 cm</span><span>60 cm</span></div></div>' +
      '<div style="margin-top:10px">' + padHtml + '</div>' +
      '<p class="hint">Garis putih di atas itu jarak geser mouse untuk satu putaran penuh, dibandingkan dengan lebar mousepad pada umumnya.</p>');
  };

  const hitung = () => {
    const game = YAW[gameS.value];
    const dpi = T.num(dpiI.value);
    if (!(dpi > 0)) { T.toast('DPI harus lebih dari 0'); return; }
    if (modeS.value === 'ke-cm') {
      const sens = T.num(sensI.value);
      if (!(sens > 0)) { T.toast('Sensitivitas harus lebih dari 0'); return; }
      gambar(cm360(dpi, sens, game.yaw), sens, game);
    } else {
      const target = T.num(cmI.value);
      if (!(target > 0)) { T.toast('cm/360 target harus lebih dari 0'); return; }
      const sens = sensDariCm(dpi, target, game.yaw);
      T.show(box,
        '<div class="big center">' + utils.r4(sens) + '<span class="mut" style="font-size:15px"> sens' + (game.persen ? ' %' : '') + '</span></div>' +
        '<p class="center hint">di ' + game.nama + ', ' + T.fmt(dpi) + ' DPI, untuk ' + utils.r4(target) + ' cm/360</p>' +
        '<p class="hint" style="margin-top:10px">Atur sensitivitas di pengaturan game ke angka itu. Kalau gamenya hanya terima 2 desimal, bulatkan ke ' + (Math.round(sens * 100) / 100) + '.</p>');
    }
  };

  root.appendChild(T.el('<p class="hint">cm/360 itu jarak geser mouse untuk memutar pandangan satu putaran penuh. Angka kecil = aim cepat, angka besar = aim pelan dan presisi. Bintang (*) di nama game artinya nilai dasarnya masih perkiraan komunitas.</p>'));
  root.appendChild(T.field('Mode', modeS));
  root.appendChild(T.field('Game', gameS));
  root.appendChild(T.field('DPI mouse', dpiI));
  root.appendChild(rowSens);
  root.appendChild(rowCm);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
}
