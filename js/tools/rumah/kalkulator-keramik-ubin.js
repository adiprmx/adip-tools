import { h as T, utils, kv } from '../../core.js';

// Kebutuhan keramik lantai. Jumlah keping = luas x (1 + cadangan) / luas
// satu keping. Jumlah dus = keping / isi per dus, dibulatkan ke atas.
// Isi per dus bawaan (umum di pasaran, bisa diubah): 60x60 isi 4,
// 40x40 isi 6, 30x30 isi 11, 20x20 isi 25, 30x60 isi 8. Cadangan default
// 10% untuk pecah dan potong di sudut.
const UKURAN = {
  '60x60': { label: '60 x 60 cm', sisi: 60, isi: 4 },
  '40x40': { label: '40 x 40 cm', sisi: 40, isi: 6 },
  '30x30': { label: '30 x 30 cm', sisi: 30, isi: 11 },
  '20x20': { label: '20 x 20 cm', sisi: 20, isi: 25 },
  '30x60': { label: '30 x 60 cm', sisi: 30, sisi2: 60, isi: 8 },
};
export function hitungKeramik(luas, sisiCm, sisi2Cm, isiDus, cadangan) {
  const l = Math.max(0, Number(luas) || 0);
  const a = Math.max(0, Number(sisiCm) || 0) / 100;
  const b = Math.max(0, Number(sisi2Cm) || Number(sisiCm) || 0) / 100;
  const isi = Math.max(1, Number(isiDus) || 1);
  const c = Math.max(0, Number(cadangan) || 0) / 100;
  const luasKeping = a * b;
  if (luasKeping <= 0) return { keping: 0, dus: 0, luasBeli: 0 };
  const keping = Math.ceil(l * (1 + c) / luasKeping);
  const dus = Math.ceil(keping / isi);
  return { keping, dus, luasBeli: dus * isi * luasKeping };
}
utils.kalkulatorKeramik = hitungKeramik;

export const meta = {"id": "kalkulator-keramik-ubin", "name": "Kalkulator Keramik/Ubin", "cat": "rumah", "icon": "🧱", "desc": "Berapa keramik dan dus yang perlu dibeli, dari luas lantai dan ukuran keramiknya.", "keywords": "keramik,ubin,lantai,renovasi,rumah,dus,ukuran,bangunan", "since": "6.17.0"};
export function render(root) {
  const modeSel = T.select([
    ['luas', 'Luas lantai langsung'],
    ['pxl', 'Dari panjang x lebar ruangan'],
  ], 'luas');
  const luasI = T.input('text', 'cth: 20', ''); luasI.inputMode = 'decimal';
  const pjI = T.input('text', 'cth: 5', ''); pjI.inputMode = 'decimal';
  const lbI = T.input('text', 'cth: 4', ''); lbI.inputMode = 'decimal';
  const ukuranSel = T.select([...Object.keys(UKURAN).map((k) => [k, UKURAN[k].label]), ['custom', 'Ukuran lain (isi sendiri)']], '60x60');
  const sisiI = T.input('text', 'cth: 60', '60'); sisiI.inputMode = 'decimal';
  const sisi2I = T.input('text', 'cth: 60', '60'); sisi2I.inputMode = 'decimal';
  const isiI = T.input('text', 'cth: 4', '4'); isiI.inputMode = 'decimal';
  const cadI = T.input('text', 'cth: 10', '10'); cadI.inputMode = 'decimal';
  const box = T.out();
  const fldLuas = T.field('Luas lantai (m2)', luasI);
  const fldPxl = T.grid2(
    T.field('Panjang ruangan (m)', pjI),
    T.field('Lebar ruangan (m)', lbI)
  );
  fldPxl.hidden = true;
  let ukuranDiubah = false;
  [sisiI, sisi2I, isiI].forEach((i) => i.addEventListener('input', () => { ukuranDiubah = true; }));
  modeSel.addEventListener('change', () => {
    fldLuas.hidden = modeSel.value !== 'luas';
    fldPxl.hidden = modeSel.value !== 'pxl';
    hitung();
  });
  ukuranSel.addEventListener('change', () => {
    if (!ukuranDiubah && UKURAN[ukuranSel.value]) {
      const u = UKURAN[ukuranSel.value];
      sisiI.value = String(u.sisi);
      sisi2I.value = String(u.sisi2 || u.sisi);
      isiI.value = String(u.isi);
    }
    hitung();
  });

  const hitung = () => {
    let luas = 0;
    if (modeSel.value === 'pxl') {
      const p = T.num(pjI.value) || 0, l = T.num(lbI.value) || 0;
      luas = p * l;
    } else {
      luas = T.num(luasI.value) || 0;
    }
    if (!(luas > 0)) { T.hide(box); return; }
    const sisi = T.num(sisiI.value);
    const sisi2 = T.num(sisi2I.value);
    const isi = T.num(isiI.value);
    if (!isFinite(sisi) || sisi <= 0 || !isFinite(sisi2) || sisi2 <= 0) { T.show(box, '<p class="warn">Ukuran keramik harus angka lebih dari 0.</p>'); return; }
    if (!isFinite(isi) || isi <= 0) { T.show(box, '<p class="warn">Isi per dus harus angka lebih dari 0.</p>'); return; }
    const r = hitungKeramik(luas, sisi, sisi2, isi, T.num(cadI.value));
    T.show(box,
      '<div class="big">' + T.fmt(r.dus) + ' dus</div>' +
      '<p class="center mut">Yang perlu dibeli, sudah termasuk cadangan.</p>' +
      kv('Luas lantai', T.fmt(Math.round(luas * 100) / 100) + ' m2') +
      kv('Ukuran keramik', T.fmt(sisi) + ' x ' + T.fmt(sisi2) + ' cm') +
      kv('Jumlah keping', T.fmt(r.keping) + ' keping') +
      kv('Isi per dus', T.fmt(isi) + ' keping') +
      kv('Luas keramik yang dibeli', T.fmt(Math.round(r.luasBeli * 100) / 100) + ' m2') +
      '<p class="hint">Cadangan 10% menutup keramik yang pecah saat pasang dan potongan di sudut ruangan. Ruangan yang bentuknya tidak kotak atau banyak sudut butuh cadangan lebih besar, sampai 15%. Isi per dus beda tiap merek, cek kemasannya.</p>');
  };
  [luasI, pjI, lbI, sisiI, sisi2I, isiI, cadI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Beli keramik kurang, repot bolak-balik toko. Beli kebanyakan, mubazir. Masukkan luas lantainya dan ukuran keramiknya.</p>'));
  root.appendChild(T.field('Hitung luas dari', modeSel));
  root.appendChild(fldLuas);
  root.appendChild(fldPxl);
  root.appendChild(T.field('Ukuran keramik', ukuranSel));
  root.appendChild(T.grid2(
    T.field('Sisi keramik 1 (cm)', sisiI),
    T.field('Sisi keramik 2 (cm)', sisi2I)
  ));
  root.appendChild(T.grid2(
    T.field('Isi per dus (keping)', isiI, 'Terisi otomatis sesuai ukuran, bisa diubah'),
    T.field('Cadangan pecah / potong (%)', cadI)
  ));
  root.appendChild(box);
  hitung();
}
