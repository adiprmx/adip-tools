import { h as T, kv, utils } from '../../core.js';

// Ape index = rentang lengan dikurangi tinggi badan (cm). Rasio = rentang
// lengan dibagi tinggi badan. Nilai positif artinya jangkauan lebih panjang
// dari tinggi badan, yang membantu di panjat tebing.
export function apeIndex(rentangCm, tinggiCm) {
  const r = Number(rentangCm), t = Number(tinggiCm);
  if (!(r > 0) || !(t > 0)) return null;
  const selisih = r - t;
  const rasio = r / t;
  let arti;
  if (selisih > 5) arti = 'Jangkauan panjang. Rentang lenganmu jauh di atas tinggi badanmu, ini membantu saat meraih pegangan jauh di panjat tebing.';
  else if (selisih >= -5) arti = 'Seimbang. Rentang lenganmu kira-kira sama dengan tinggi badanmu, seperti kebanyakan orang.';
  else arti = 'Jangkauan pendek. Rentang lenganmu di bawah tinggi badanmu. Di panjat tebing, teknik dan kekuatan kaki jadi lebih penting.';
  return { selisih: Object.is(selisih, -0) ? 0 : selisih, rasio, arti };
}
utils.apeIndex = apeIndex;

export const meta = {"id": "kalkulator-ape-index", "name": "Kalkulator Ape Index", "cat": "sehari", "icon": "🧗", "desc": "Ape index dari rentang lengan dan tinggi badan, untuk panjat tebing dan olahraga lain.", "keywords": "ape index,rentang lengan,tinggi badan,panjat tebing,climbing,jangkauan", "since": "6.19.0"};
export function render(root) {
  const rentang = T.input('text', 'cth: 180', '180');
  rentang.inputMode = 'decimal';
  const tinggi = T.input('text', 'cth: 175', '175');
  tinggi.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const r = apeIndex(T.num(rentang.value), T.num(tinggi.value));
    if (!r) { T.show(box, '<span class="err">Isi rentang lengan dan tinggi badan dengan angka lebih dari 0.</span>'); return; }
    const tanda = r.selisih > 0 ? '+' : '';
    T.show(box,
      '<div class="center"><div class="dim">Ape index kamu</div>' +
      '<div class="big">' + tanda + utils.fmtDes(r.selisih, 1) + ' cm</div>' +
      '<div class="dim">Rasio rentang lengan terhadap tinggi: ' + utils.fmtDes(r.rasio, 3) + '</div></div>' +
      '<p>' + T.esc(r.arti) + '</p>' +
      '<p class="hint">Cara ukur rentang lengan: berdiri menghadap tembok, rentangkan kedua lengan lurus ke samping, lalu ukur dari ujung jari tengah kiri ke ujung jari tengah kanan. Ukur 2 sampai 3 kali dan pakai rata-ratanya supaya akurat.</p>');
  };

  root.appendChild(T.el('<p class="note">Ape index membandingkan rentang lengan dengan tinggi badan. Panjat tebing memakai angka ini karena jangkauan lengan memengaruhi seberapa jauh kamu bisa meraih pegangan.</p>'));
  root.appendChild(T.grid2(
    T.field('Rentang lengan (cm)', rentang),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.btn('Hitung Ape Index', hitung, true));
  root.appendChild(box);
  hitung();
}
