import { h as T, kv, utils } from '../../core.js';

// Gorden: lebar kain = lebar jendela x kerutan. Jumlah panel = lebar kain
// dibagi lebar kain per gulung (dibulatkan ke atas). Panjang tiap panel =
// tinggi jendela + jarak rel di atas jendela + kelim atas dan bawah.
// Total kain = jumlah panel x panjang tiap panel.
export function gorden(lebarJendela, tinggiJendela, kerutan, jarakRel, kelim, lebarKain) {
  const lj = Number(lebarJendela), tj = Number(tinggiJendela), k = Number(kerutan);
  const jr = Number(jarakRel) || 0, kl = Number(kelim) || 0, lk = Number(lebarKain);
  if (!(lj > 0) || !(tj > 0) || !(k > 0) || !(lk > 0) || jr < 0 || kl < 0) return null;
  const lebarKainTotal = lj * k;
  const panel = Math.ceil(lebarKainTotal / lk);
  const panjangPanel = tj + jr + kl;
  const totalMeter = panel * panjangPanel / 100;
  return { lebarKainTotal, panel, panjangPanel, totalMeter };
}
utils.gorden = gorden;

export const meta = {"id": "kalkulator-gorden", "name": "Kalkulator Gorden", "cat": "sehari", "icon": "🪟", "desc": "Kebutuhan kain gorden dari ukuran jendela: jumlah panel dan total meter kain.", "keywords": "gorden,kain gorden,jendela,tirai,kerutan,panel,meter kain", "since": "6.19.0"};
export function render(root) {
  const lebar = T.input('text', 'cth: 150', '150');
  lebar.inputMode = 'decimal';
  const tinggi = T.input('text', 'cth: 140', '140');
  tinggi.inputMode = 'decimal';
  const kerutan = T.select([
    ['1.5', 'Ringan (1,5x lebar jendela)'],
    ['2', 'Sedang (2x lebar jendela)'],
    ['2.5', 'Penuh (2,5x lebar jendela)'],
  ], '2');
  const jarakRel = T.input('text', 'cth: 15', '15');
  jarakRel.inputMode = 'decimal';
  const kelim = T.input('text', 'cth: 20', '20');
  kelim.inputMode = 'decimal';
  const lebarKain = T.select([['140', '140 cm'], ['150', '150 cm'], ['280', '280 cm (kain lebar)']], '140');
  const box = T.out();

  const hitung = () => {
    // Nilai select dikontrol program, jadi pakai Number() (T.num membaca
    // "1.5" dengan benar, tapi Number() lebih aman untuk nilai program).
    const r = gorden(T.num(lebar.value), T.num(tinggi.value), Number(kerutan.value), T.num(jarakRel.value), T.num(kelim.value), Number(lebarKain.value));
    if (!r) { T.show(box, '<span class="err">Isi lebar dan tinggi jendela dengan angka lebih dari 0.</span>'); return; }
    T.show(box,
      '<div class="center"><div class="dim">Total kain yang dibutuhkan</div>' +
      '<div class="big">' + utils.fmtDes(r.totalMeter, 2) + ' meter</div>' +
      '<div class="dim">' + r.panel + ' panel, tiap panel ' + utils.fmtDes(r.panjangPanel, 0) + ' cm</div></div>' +
      kv('Lebar kain total', utils.fmtDes(r.lebarKainTotal, 0) + ' cm (lebar jendela x kerutan)') +
      kv('Panjang tiap panel', utils.fmtDes(r.panjangPanel, 0) + ' cm') +
      kv('Lebar kain per gulung', T.esc(String(lebarKain.value)) + ' cm') +
      '<p class="hint">Kerutan adalah lipatan kain: makin besar angkanya, gorden makin mengembang dan kelihatan mewah, tapi kain yang dibutuhkan makin banyak. Beli 10 sampai 20 cm lebih untuk jaga-jaga salah potong. Ukur jendela di tiga titik dan pakai angka terbesar, karena kusen tidak selalu lurus.</p>');
  };

  root.appendChild(T.el('<p class="note">Masukkan ukuran jendela dan seberapa mengembang gorden yang kamu mau. Hasilnya jumlah panel dan total meter kain yang harus dibeli.</p>'));
  root.appendChild(T.grid2(
    T.field('Lebar jendela (cm)', lebar),
    T.field('Tinggi jendela (cm)', tinggi),
    T.field('Kerutan gorden', kerutan),
    T.field('Lebar kain per gulung (cm)', lebarKain),
    T.field('Jarak rel di atas jendela (cm)', jarakRel, 'Rel biasanya 10 sampai 20 cm di atas kusen.'),
    T.field('Kelim atas dan bawah (cm)', kelim, 'Total untuk lipatan atas dan bawah, biasanya 15 sampai 25 cm.'),
  ));
  root.appendChild(T.btn('Hitung Kain Gorden', hitung, true));
  root.appendChild(box);
  hitung();
}
