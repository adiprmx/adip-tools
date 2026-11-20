import { h as T, utils } from '../../core.js';

// Kalkulator eDPI: eDPI = DPI x sensitivitas. Satu angka untuk
// membandingkan "kecepatan" aim antar pemain walau DPI-nya beda.
// Dilengkapi cm/360 (butuh game, karena tiap game beda skala sens)
// dan tabel sens yang rasanya sama di DPI lain.
export const meta = {"id": "kalkulator-edpi", "name": "Kalkulator eDPI", "cat": "fun", "icon": "🎯", "desc": "Hitung eDPI dari DPI dan sensitivitasmu, lihat cm/360-nya, dan cari sens yang rasanya sama di DPI lain. Bisa juga dibalik: isi cm/360 yang kamu mau, cari sensitivitasnya.", "keywords": "edpi,dpi,sensitivitas,mouse,aim,cs2,valorant,game,fps,cm360,cm/360 target,mousepad", "since": "6.19.0"};

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

// Sensitivitas untuk cm/360 target (diserap dari kalkulator-cm360,
// v6.21.0). Rumus balik cm/360 = 2,54 x 360 / (DPI x sens x yaw).
export function sensDariCm(dpi, targetCm, yaw) {
  if (!(dpi > 0) || !(targetCm > 0) || !(yaw > 0)) return NaN;
  return (2.54 * 360) / (dpi * targetCm * yaw);
}

// Pembanding mousepad (diserap dari kalkulator-cm360, v6.21.0):
// lebar mousepad umum 25/35/45 cm — muat satu putaran penuh atau
// kurang berapa cm. Murni.
export const MOUSEPAD = [
  ['Kecil (25 cm)', 25], ['Sedang (35 cm)', 35], ['Besar (45 cm)', 45],
];
export function cekMousepad(cm) {
  return MOUSEPAD.map(([nama, lebar]) => ({
    nama, lebar,
    muat: cm <= lebar,
    kurang: cm > lebar ? cm - lebar : 0,
  }));
}

export function render(root) {
  const box = T.out();
  const modeS = T.select([['edpi', 'DPI + sensitivitas ke eDPI dan cm/360'], ['target', 'cm/360 yang kamu mau ke sensitivitas']], 'edpi');
  const dpiI = T.input('number', 'cth: 800');
  dpiI.value = '800';
  const sensI = T.input('text', 'cth: 2,5');
  sensI.value = '2,5';
  const cmI = T.input('text', 'cth: 30');
  const gameS = T.select(Object.entries(YAW).map(([k, g]) => [k, g.nama + (g.yakin ? '' : ' *')]), 'cs2');
  const rowSens = T.field('Sensitivitas di game', sensI, 'Pakai koma untuk desimal, contoh 2,5.');
  const rowCm = T.field('cm/360 yang kamu mau', cmI, 'Makin kecil angkanya, makin cepat putarannya.');
  rowCm.style.display = 'none';

  modeS.addEventListener('change', () => {
    const keEdpi = modeS.value === 'edpi';
    rowSens.style.display = keEdpi ? '' : 'none';
    rowCm.style.display = keEdpi ? 'none' : '';
    hitung(true); // hitung-live: ganti mode langsung hitung ulang (diam)
  });

  // Gambar mousepad: garis jarak geser + banding lebar mousepad umum.
  const gambarMousepad = (cm) => {
    const maks = 60;
    const pct = Math.min(100, (cm / maks) * 100);
    let padHtml = '';
    for (const p of cekMousepad(cm)) {
      padHtml += '<div class="kv"><span class="k">Mousepad ' + p.nama + '</span><span class="v">' + (p.muat ? 'muat 360°' : 'kurang ' + utils.r4(p.kurang) + ' cm') + '</span></div>';
    }
    return '<div style="margin:14px 0 4px"><div style="height:10px;background:#ffffff14;border-radius:5px"><div style="height:10px;width:' + pct + '%;background:#fff;border-radius:5px"></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11px" class="hint"><span>0 cm</span><span>60 cm</span></div></div>' +
      '<div style="margin-top:10px">' + padHtml + '</div>' +
      '<p class="hint">Garis putih di atas itu jarak geser mouse untuk satu putaran penuh, dibandingkan dengan lebar mousepad pada umumnya.</p>';
  };

  const hitung = (diam = false) => {
    const dpi = T.num(dpiI.value);
    const game = YAW[gameS.value];
    if (!(dpi > 0)) { if (!diam) T.toast('Isi DPI dengan angka lebih dari 0'); return; }
    if (modeS.value === 'target') {
      const target = T.num(cmI.value);
      if (!(target > 0)) { if (!diam) T.toast('cm/360 target harus lebih dari 0'); return; }
      const sens = sensDariCm(dpi, target, game.yaw);
      const e = edpi(dpi, sens);
      T.show(box,
        '<div class="big center">' + utils.r4(sens) + '<span class="mut" style="font-size:15px"> sens' + (game.persen ? ' %' : '') + '</span></div>' +
        '<p class="center hint">di ' + game.nama + ', ' + T.fmt(dpi) + ' DPI, untuk ' + utils.r4(target) + ' cm/360</p>' +
        '<div class="kv"><span class="k">eDPI-nya</span><span class="v">' + T.fmt(Math.round(e * 100) / 100) + '</span></div>' +
        gambarMousepad(target) +
        '<p class="hint" style="margin-top:10px">Atur sensitivitas di pengaturan game ke angka itu. Kalau gamenya hanya terima 2 desimal, bulatkan ke ' + (Math.round(sens * 100) / 100) + '.</p>');
      return;
    }
    const sens = T.num(sensI.value);
    if (!(sens > 0)) { if (!diam) T.toast('Isi DPI dan sensitivitas dengan angka lebih dari 0'); return; }
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
      gambarMousepad(cm) +
      '<h3 style="margin-top:14px">Rasa yang sama di DPI lain</h3>' + tabel +
      '<p class="hint">eDPI membuat perbandingan aim jadi adil: 800 DPI x sens 2 sama cepatnya dengan 1600 DPI x sens 1. Bintang (*) di nama game artinya nilai dasarnya masih perkiraan komunitas.</p>');
  };

  // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik / ganti
  // game (diam — tanpa toast selagi mengetik; tombol tetap memberi toast).
  [dpiI, sensI, cmI].forEach((i) => i.addEventListener('input', () => hitung(true)));
  gameS.addEventListener('change', () => hitung(true));

  root.appendChild(T.el('<p class="hint">eDPI itu DPI dikali sensitivitas. Dua pemain dengan eDPI sama punya kecepatan aim yang sama, walau DPI mousenya beda. cm/360 itu jarak geser mouse untuk memutar pandangan satu putaran penuh: angka kecil = aim cepat, angka besar = aim pelan dan presisi.</p>'));
  root.appendChild(T.field('Mode', modeS));
  root.appendChild(T.field('DPI mouse', dpiI));
  root.appendChild(rowSens);
  root.appendChild(rowCm);
  root.appendChild(T.field('Game (untuk cm/360)', gameS));
  root.appendChild(T.row(T.btn('Hitung eDPI', hitung, true)));
  root.appendChild(box);
}
