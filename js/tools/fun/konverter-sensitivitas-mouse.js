import { h as T, utils } from '../../core.js';

// Konverter Sensitivitas Mouse antar game: sens target = sens asal x
// yaw asal / yaw target, jadi putaran 360 derajatnya sama persis.
// Fortnite memakai persen (0-100), jadi yaw-nya per 1 persen.
export const meta = {"id": "konverter-sensitivitas-mouse", "name": "Konverter Sensitivitas Mouse", "cat": "fun", "icon": "🔄", "desc": "Pindahkan sensitivitas mouse-mu antar game (CS2, Valorant, Apex, Overwatch 2, dan lainnya) supaya kecepatan aim-nya tetap sama.", "keywords": "sensitivitas,konverter,mouse,cs2,valorant,apex,overwatch,fortnite,cod,aim", "since": "6.19.0"};

// Tabel yaw + cm/360 tinggal di modul bersama js/mouse-sens.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari 3 tool mouse).
import { YAW, cm360 } from '../../mouse-sens.js';
export { YAW, cm360 } from '../../mouse-sens.js';

// Sensitivitas di game target. Murni.
export function konversi(sensAsal, yawAsal, yawTarget) {
  if (!(sensAsal > 0) || !(yawAsal > 0) || !(yawTarget > 0)) return NaN;
  return sensAsal * yawAsal / yawTarget;
}


export function render(root) {
  const box = T.out();
  const opsi = Object.entries(YAW).map(([k, g]) => [k, g.nama + (g.yakin ? '' : ' *')]);
  const asalS = T.select(opsi, 'cs2');
  const tujuanS = T.select(opsi, 'valorant');
  const sensI = T.input('text', 'cth: 2');
  sensI.value = '2';
  const dpiI = T.input('number', 'cth: 800');
  dpiI.value = '800';

  const hitung = () => {
    const asal = YAW[asalS.value];
    const tujuan = YAW[tujuanS.value];
    const sens = T.num(sensI.value);
    const dpi = T.num(dpiI.value);
    if (!(sens > 0)) { T.toast('Isi sensitivitas asal dengan angka lebih dari 0'); return; }
    if (!(dpi > 0)) { T.toast('Isi DPI dengan angka lebih dari 0'); return; }
    if (asalS.value === tujuanS.value) { T.toast('Game asal dan tujuan sama, tidak ada yang dikonversi'); return; }
    const hasil = konversi(sens, asal.yaw, tujuan.yaw);
    const cm = cm360(dpi, sens, asal.yaw);
    const e = dpi * sens;
    T.show(box,
      '<div class="big center">' + utils.r4(hasil) + '<span class="mut" style="font-size:15px">' + (tujuan.persen ? ' %' : '') + ' sens di ' + tujuan.nama + '</span></div>' +
      '<p class="center hint">setara ' + utils.r4(sens) + (asal.persen ? ' %' : '') + ' sens di ' + asal.nama + '</p>' +
      '<div style="margin-top:12px">' +
      '<div class="kv"><span class="k">cm/360 (sama di kedua game)</span><span class="v">' + utils.r4(cm) + ' cm</span></div>' +
      '<div class="kv"><span class="k">eDPI</span><span class="v">' + T.fmt(Math.round(e * 100) / 100) + '</span></div>' +
      '</div>' +
      '<p class="hint" style="margin-top:10px">Hasilnya dibulatkan ke 4 desimal. Kalau gamenya hanya terima 2-3 desimal, pakai angka terdekat, bedanya tidak terasa. Bintang (*) di nama game artinya nilai dasarnya masih perkiraan komunitas.</p>');
  };

  root.appendChild(T.el('<p class="hint">Pindah game tapi mau aim-mu terasa sama? Masukkan sensitivitas di game lamamu, tool ini mengubahnya ke skala game baru supaya satu putaran 360 derajat butuh geseran mouse yang sama.</p>'));
  root.appendChild(T.field('Dari game', asalS));
  root.appendChild(T.field('Sensitivitas di game itu', sensI, 'Pakai koma untuk desimal, contoh 2,5. Untuk Fortnite isi persen, contoh 12.'));
  root.appendChild(T.field('Ke game', tujuanS));
  root.appendChild(T.field('DPI mouse', dpiI, 'Untuk menghitung cm/360.'));
  root.appendChild(T.row(T.btn('Konversi', hitung, true)));
  root.appendChild(box);
}
