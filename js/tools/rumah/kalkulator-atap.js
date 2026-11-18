import { h as T, utils, kv } from '../../core.js';

// Kebutuhan genteng. Atap miring luasnya lebih besar dari luas denah:
// luas miring = luas datar / cos(sudut kemiringan). Kebutuhan per m2
// (bisa diubah): genteng tanah liat 25 buah, genteng beton 10 buah,
// genteng keramik 11 buah, genteng metal dihitung per lembar 0,75 m x 4 m
// (3 m2 per lembar). Cadangan default 5% untuk pecah dan potong.
const JENIS = {
  tanah: { label: 'Genteng tanah liat', perM2: 25, satuan: 'buah' },
  beton: { label: 'Genteng beton', perM2: 10, satuan: 'buah' },
  keramik: { label: 'Genteng keramik', perM2: 11, satuan: 'buah' },
  metal: { label: 'Genteng metal (lembar 0,75 m x 4 m)', perM2: 1 / 3, satuan: 'lembar' },
};
export function hitungAtap(luasDatar, sudut, perM2, cadangan) {
  const luas = Math.max(0, Number(luasDatar) || 0);
  const s = Math.max(0, Math.min(89, Number(sudut) || 0));
  const luasMiring = luas / Math.cos(s * Math.PI / 180);
  const p = Math.max(0, Number(perM2) || 0);
  const c = Math.max(0, Number(cadangan) || 0) / 100;
  const butuh = luasMiring * p;
  const beli = Math.ceil(butuh * (1 + c));
  return { luasMiring, butuh, beli };
}
utils.kalkulatorAtap = hitungAtap;

export const meta = {"id": "kalkulator-atap", "name": "Kalkulator Atap", "cat": "rumah", "icon": "🏠", "desc": "Berapa genteng yang perlu dibeli, dari luas atap, kemiringan, dan jenis gentengnya.", "keywords": "atap,genteng,rumah,renovasi,kemiringan,bangunan,metal,beton", "since": "6.17.0"};
export function render(root) {
  const luasI = T.input('text', 'cth: 100', ''); luasI.inputMode = 'decimal';
  const sudutI = T.input('text', 'cth: 30', '30'); sudutI.inputMode = 'decimal';
  const jenisSel = T.select(Object.keys(JENIS).map((k) => [k, JENIS[k].label]), 'tanah');
  const perM2I = T.input('text', 'cth: 25', '25'); perM2I.inputMode = 'decimal';
  const cadI = T.input('text', 'cth: 5', '5'); cadI.inputMode = 'decimal';
  const box = T.out();
  let perM2Diubah = false;
  perM2I.addEventListener('input', () => { perM2Diubah = true; });
  jenisSel.addEventListener('change', () => {
    if (!perM2Diubah) {
      const jj = JENIS[jenisSel.value] || JENIS.tanah;
      const v = jj.perM2;
      perM2I.value = String(Math.round(v * 100) / 100).replace('.', ',');
    }
    hitung();
  });

  const hitung = () => {
    const luas = T.num(luasI.value) || 0;
    if (!(luas > 0)) { T.hide(box); return; }
    const sudut = T.num(sudutI.value);
    if (!isFinite(sudut) || sudut < 0 || sudut >= 89) { T.show(box, '<p class="warn">Kemiringan atap harus 0 sampai 89 derajat.</p>'); return; }
    const perM2 = T.num(perM2I.value);
    if (!isFinite(perM2) || perM2 <= 0) { T.show(box, '<p class="warn">Kebutuhan per m2 harus angka lebih dari 0.</p>'); return; }
    const j = JENIS[jenisSel.value];
    const r = hitungAtap(luas, sudut, perM2, T.num(cadI.value));
    T.show(box,
      '<div class="big">' + T.fmt(r.beli) + ' ' + j.satuan + '</div>' +
      '<p class="center mut">Yang perlu dibeli, sudah termasuk cadangan.</p>' +
      kv('Luas denah (datar)', T.fmt(Math.round(luas * 100) / 100) + ' m2') +
      kv('Luas atap miring', T.fmt(Math.round(r.luasMiring * 100) / 100) + ' m2') +
      kv('Kebutuhan pas', T.fmt(Math.ceil(r.butuh)) + ' ' + j.satuan) +
      kv('Cadangan', String(T.num(cadI.value) || 0).replace('.', ',') + '%') +
      '<p class="hint">Kebutuhan bawaan per m2: genteng tanah liat 25 buah, beton 10 buah, keramik 11 buah, metal 1 lembar per 3 m2. Angka tiap merek bisa beda, cek kemasan gentengmu dan ubah kolomnya bila perlu. Atap yang bentuknya rumit (banyak jurai dan lembah) butuh cadangan lebih besar.</p>');
  };
  [luasI, sudutI, perM2I, cadI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Atap miring luasnya lebih besar dari luas lantai di bawahnya. Masukkan luas denah dan kemiringannya, dan jumlah gentengnya langsung ketemu.</p>'));
  root.appendChild(T.field('Luas denah yang ditutup atap (m2)', luasI, 'Panjang x lebar lantai, bukan luas miring atap'));
  root.appendChild(T.field('Kemiringan atap (derajat)', sudutI, 'Atap rumah umumnya 25-35 derajat'));
  root.appendChild(T.field('Jenis genteng', jenisSel));
  root.appendChild(T.grid2(
    T.field('Kebutuhan per m2', perM2I, 'Terisi otomatis sesuai jenis, bisa diubah'),
    T.field('Cadangan pecah / potong (%)', cadI)
  ));
  root.appendChild(box);
  hitung();
}
