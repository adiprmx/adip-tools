import { h as T, utils, kv } from '../../core.js';

// Kebutuhan rol wallpaper dari luas dinding. Satu rol dipotong jadi
// beberapa lembar setinggi dinding (ditambah pengulangan pola bila ada).
// Luas yang ditutup satu rol = jumlah lembar x lebar rol x tinggi dinding.
// Jumlah rol = luas bersih / luas per rol, dibulatkan ke atas.
// Ukuran rol umum: lebar 0,53 m, panjang 10,05 m.
export function hitungWallpaper(o) {
  const panjang = Number(o.panjangDinding);
  const tinggi = Number(o.tinggi);
  const kurang = Math.max(0, Number(o.kurang) || 0);
  const lebarRol = Number(o.lebarRol);
  const panjangRol = Number(o.panjangRol);
  const ulang = Math.max(0, Number(o.ulangPolaCm) || 0) / 100;
  if (![panjang, tinggi, lebarRol, panjangRol].every(isFinite) || panjang <= 0 || tinggi <= 0 || lebarRol <= 0 || panjangRol <= 0) return null;
  const luasKotor = panjang * tinggi;
  const luasBersih = Math.max(0, luasKotor - kurang);
  const tinggiPotong = tinggi + ulang;
  const stripPerRol = Math.floor(panjangRol / tinggiPotong);
  if (stripPerRol < 1) return null;
  const luasPerRol = stripPerRol * lebarRol * tinggi;
  const rol = Math.ceil(luasBersih / luasPerRol);
  return { luasKotor, luasBersih, stripPerRol, luasPerRol, rol };
}
utils.wallpaper = hitungWallpaper;

export const meta = {"id": "kalkulator-wallpaper", "name": "Kalkulator Wallpaper", "cat": "rumah", "icon": "🖼️", "desc": "Berapa rol wallpaper yang perlu dibeli dari luas dinding dan ukuran rolnya.", "keywords": "wallpaper,rol,dinding,rumah,renovasi,luas,pola,dekorasi,kamar", "since": "6.18.0"};
export function render(root) {
  const pjI = T.input('text', 'cth: 12', ''); pjI.inputMode = 'decimal';
  const tgI = T.input('text', 'cth: 3', ''); tgI.inputMode = 'decimal';
  const kurangI = T.input('text', 'cth: 4', '0'); kurangI.inputMode = 'decimal';
  const lebarI = T.input('text', 'cth: 0,53', '0,53'); lebarI.inputMode = 'decimal';
  const panjangI = T.input('text', 'cth: 10,05', '10,05'); panjangI.inputMode = 'decimal';
  const ulangI = T.input('text', 'cth: 0', '0'); ulangI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const pj = T.num(pjI.value);
    const tg = T.num(tgI.value);
    const kurang = T.num(kurangI.value);
    const lebar = T.num(lebarI.value);
    const panjang = T.num(panjangI.value);
    const ulang = T.num(ulangI.value);
    if (!isFinite(pj) || pj <= 0) {
      T.show(box, '<div class="err">Total panjang dinding harus diisi angka lebih dari 0 (dalam meter).</div>');
      return;
    }
    if (!isFinite(tg) || tg <= 0) {
      T.show(box, '<div class="err">Tinggi dinding harus diisi angka lebih dari 0 (dalam meter).</div>');
      return;
    }
    if (!isFinite(kurang) || kurang < 0 || kurang >= pj * tg) {
      T.show(box, '<div class="err">Luas pintu dan jendela harus angka 0 atau lebih, dan lebih kecil dari luas dinding.</div>');
      return;
    }
    if (!isFinite(lebar) || lebar <= 0 || !isFinite(panjang) || panjang <= 0) {
      T.show(box, '<div class="err">Lebar dan panjang rol harus diisi angka lebih dari 0.</div>');
      return;
    }
    if (!isFinite(ulang) || ulang < 0) {
      T.show(box, '<div class="err">Pengulangan pola harus diisi angka 0 atau lebih (dalam cm).</div>');
      return;
    }
    const r = hitungWallpaper({ panjangDinding: pj, tinggi: tg, kurang, lebarRol: lebar, panjangRol: panjang, ulangPolaCm: ulang });
    if (!r) {
      T.show(box, '<div class="err">Satu rol tidak cukup untuk satu lembar setinggi dindingmu. Cek lagi tinggi dinding dan panjang rolnya.</div>');
      return;
    }
    T.show(box,
      '<div class="big">' + T.fmt(r.rol) + ' rol</div>' +
      '<p class="center mut">Wallpaper yang perlu dibeli.</p>' +
      kv('Luas dinding bersih', r.luasBersih.toFixed(2).replace('.', ',') + ' m2') +
      kv('Lembar per rol', T.fmt(r.stripPerRol) + ' lembar') +
      kv('Luas yang ditutup satu rol', r.luasPerRol.toFixed(2).replace('.', ',') + ' m2') +
      '<p class="hint">Ukuran rol 0,53 x 10,05 m adalah ukuran yang paling umum dijual, cek kemasan rolmu. Beli 1 rol cadangan untuk jaga-jaga bila ada lembar yang rusak saat pasang atau perlu tambal di kemudian hari. Beli dari batch yang sama supaya warnanya tidak beda.</p>');
  };
  [pjI, tgI, kurangI, lebarI, panjangI, ulangI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau memasang wallpaper? Masukkan total panjang dinding dan tingginya, kurangi luas pintu dan jendela, dan lihat berapa rol yang perlu dibeli.</p>'));
  root.appendChild(T.grid2(
    T.field('Total panjang dinding (m)', pjI, 'Jumlah panjang semua dinding yang dilapisi'),
    T.field('Tinggi dinding (m)', tgI)
  ));
  root.appendChild(T.field('Luas pintu dan jendela (m2)', kurangI, 'Total luas yang tidak dilapisi wallpaper'));
  root.appendChild(T.grid2(
    T.field('Lebar rol (m)', lebarI),
    T.field('Panjang rol (m)', panjangI)
  ));
  root.appendChild(T.field('Pengulangan pola (cm)', ulangI, 'Jarak pengulangan motif, tertulis di kemasan. Isi 0 bila polos atau tanpa pola.'));
  root.appendChild(box);
}
