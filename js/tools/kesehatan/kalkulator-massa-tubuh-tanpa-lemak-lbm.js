import { h as T, esc } from '../../core.js';

// Massa tubuh tanpa lemak (LBM) dari tinggi, berat, dan jenis kelamin.
// Dua rumus yang umum dipakai:
// - Boer (1984): pria 0,407 x berat + 0,267 x tinggi - 19,2;
//   wanita 0,252 x berat + 0,473 x tinggi - 48,3.
// - James (1976): pria 1,10 x berat - 128 x (berat/tinggi)^2;
//   wanita 1,07 x berat - 148 x (berat/tinggi)^2.
// Berat dalam kg, tinggi dalam cm.
function lbmBoer(pria, w, h) {
  return pria ? 0.407 * w + 0.267 * h - 19.2 : 0.252 * w + 0.473 * h - 48.3;
}
function lbmJames(pria, w, h) {
  const r = w / h;
  return pria ? 1.10 * w - 128 * r * r : 1.07 * w - 148 * r * r;
}

export const meta = {"id": "kalkulator-massa-tubuh-tanpa-lemak-lbm", "name": "Kalkulator Massa Tubuh Tanpa Lemak (LBM)", "cat": "kesehatan", "icon": "🏋️", "desc": "Berapa kilo badanmu yang bukan lemak (otot, tulang, organ), dihitung dengan rumus Boer dan James.", "keywords": "lbm,massa tanpa lemak,lean body mass,boer,james,otot,lemak tubuh", "since": "6.17.0"};
export function render(root) {
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const berat = T.input('number', 'Berat badan (kg)', '65');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const box = T.out();

  const hitung = () => {
    const h = T.num(tinggi.value);
    const w = T.num(berat.value);
    if (!(h >= 100 && h <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    if (!(w >= 20 && w <= 400)) {
      T.show(box, '<span class="err">Isi berat badan antara 20 sampai 400 kg.</span>');
      return;
    }
    const pria = gender.value === 'pria';
    const boer = lbmBoer(pria, w, h);
    const james = lbmJames(pria, w, h);
    const rata = (boer + james) / 2;
    T.show(box,
      '<div class="center"><div class="dim">Massa tubuh tanpa lemak (rata-rata dua rumus)</div>' +
      '<div class="big">' + rata.toFixed(1) + ' kg</div>' +
      '<div class="dim">' + (rata / w * 100).toFixed(1) + '% dari berat badanmu</div></div>' +
      '<div class="kv"><span class="k">Rumus Boer (1984)</span><span class="v">' + boer.toFixed(1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Rumus James (1976)</span><span class="v">' + james.toFixed(1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Perkiraan massa lemak</span><span class="v">' + Math.max(0, w - rata).toFixed(1) + ' kg</span></div>' +
      '<p class="hint">Massa tanpa lemak itu semua isi badan selain lemak: otot, tulang, organ, dan air. Kedua rumus biasanya cuma beda sedikit. ' +
      'Hasil ini perkiraan dari rumus, bukan hasil ukur alat. Ukur yang lebih akurat butuh alat khusus seperti DEXA atau timbangan komposisi tubuh. ' +
      'Ini bukan diagnosis; buat keputusan soal latihan atau diet, tanya pelatih atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Berat badan (kg)', berat),
  ));
  root.appendChild(T.field('Jenis kelamin', gender));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
