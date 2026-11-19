import { h as T, kv, utils } from '../../core.js';

// Perbandingan pizza: luas = pi x (diameter/2)^2. Harga per cm2 = harga /
// luas. Pizza yang harga per cm2-nya paling kecil adalah yang paling hemat.
// Setara = luas pizza besar dibagi luas pizza kecil.
export function pizza(diameterCm, harga) {
  const d = Number(diameterCm), h = Number(harga);
  if (!(d > 0) || !(h >= 0)) return null;
  const luas = Math.PI * Math.pow(d / 2, 2);
  return { luas, perCm2: h / luas };
}

export function bandingPizza(a, b) {
  const pa = pizza(a.d, a.harga), pb = pizza(b.d, b.harga);
  if (!pa || !pb) return null;
  const hemat = pa.perCm2 <= pb.perCm2 ? 'a' : 'b';
  const selisihPersen = Math.abs(pa.perCm2 - pb.perCm2) / Math.max(pa.perCm2, pb.perCm2) * 100;
  const setara = pb.luas / pa.luas;
  return { pa, pb, hemat, selisihPersen, setara };
}
utils.pizza = pizza;
utils.bandingPizza = bandingPizza;

export const meta = {"id": "perbandingan-ukuran-pizza", "name": "Perbandingan Ukuran Pizza", "cat": "sehari", "icon": "🍕", "desc": "Pizza mana yang paling hemat? Bandingkan dua ukuran pizza dari diameter dan harganya.", "keywords": "pizza,ukuran pizza,diameter,harga pizza,hemat,perbandingan,cm2", "since": "6.19.0"};
export function render(root) {
  const d1 = T.input('text', 'cth: 30', '30');
  d1.inputMode = 'decimal';
  const h1 = T.input('text', 'cth: 100000', '100000');
  h1.inputMode = 'decimal';
  const d2 = T.input('text', 'cth: 40', '40');
  d2.inputMode = 'decimal';
  const h2 = T.input('text', 'cth: 150000', '150000');
  h2.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const r = bandingPizza({ d: T.num(d1.value), harga: T.num(h1.value) }, { d: T.num(d2.value), harga: T.num(h2.value) });
    if (!r) { T.show(box, '<span class="err">Isi diameter dengan angka lebih dari 0 dan harga dengan angka 0 atau lebih.</span>'); return; }
    const namaA = 'Pizza ' + utils.fmtDes(T.num(d1.value), 0) + ' cm';
    const namaB = 'Pizza ' + utils.fmtDes(T.num(d2.value), 0) + ' cm';
    const pemenang = r.hemat === 'a' ? namaA : namaB;
    const setaraTxt = r.setara >= 1
      ? 'Satu ' + namaB + ' sama dengan ' + utils.fmtDes(r.setara, 2) + ' buah ' + namaA + '.'
      : 'Satu ' + namaA + ' sama dengan ' + utils.fmtDes(1 / r.setara, 2) + ' buah ' + namaB + '.';
    T.show(box,
      '<div class="center"><div class="dim">Yang paling hemat</div>' +
      '<div class="big">' + T.esc(pemenang) + '</div>' +
      '<div class="dim">Lebih hemat ' + utils.fmtDes(r.selisihPersen, 1) + '% per cm2</div></div>' +
      kv(namaA + ' (luas)', utils.fmtDes(r.pa.luas, 0) + ' cm2, ' + T.rp(Math.round(r.pa.perCm2)) + ' per cm2') +
      kv(namaB + ' (luas)', utils.fmtDes(r.pb.luas, 0) + ' cm2, ' + T.rp(Math.round(r.pb.perCm2)) + ' per cm2') +
      '<p>' + T.esc(setaraTxt) + '</p>' +
      '<p class="hint">Luas pizza naik dengan kuadrat diameter, jadi pizza yang diameternya 2 kali lipat luasnya 4 kali lipat. Itu sebabnya pizza besar sering jauh lebih hemat, walau harganya kelihatan mahal.</p>');
  };

  root.appendChild(T.el('<p class="note">Masukkan diameter dan harga dua pizza. Hasilnya pizza mana yang paling hemat per cm2, dan berapa pizza kecil yang setara dengan satu pizza besar.</p>'));
  root.appendChild(T.grid2(
    T.field('Pizza pertama: diameter (cm)', d1),
    T.field('Pizza pertama: harga (Rp)', h1),
    T.field('Pizza kedua: diameter (cm)', d2),
    T.field('Pizza kedua: harga (Rp)', h2),
  ));
  root.appendChild(T.btn('Bandingkan', hitung, true));
  root.appendChild(box);
  hitung();
}
