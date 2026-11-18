import { h as T, esc } from '../../core.js';

// Rasio pinggang-tinggi (WHtR) = lingkar pinggang dibagi tinggi badan.
// Patokan umum (Ashwell & Hsieh, 2005): jaga lingkar pinggang kurang
// dari setengah tinggi badan (WHtR di bawah 0,5).
// Kategori: di bawah 0,4 terlalu kurus, 0,4-0,5 sehat, 0,5-0,6 waspada,
// 0,6 ke atas risiko tinggi.
function kategoriWHtR(r) {
  if (r < 0.4) return ['Di bawah normal', 'Kamu mungkin terlalu kurus. Lingkar pinggang yang sangat kecil juga bisa jadi tanda kurang gizi.', 'warn'];
  if (r < 0.5) return ['Sehat', 'Lingkar pinggangmu masih kurang dari setengah tinggi badanmu. Pertahankan.', 'ok'];
  if (r < 0.6) return ['Waspada', 'Lingkar pinggangmu sudah setengah tinggi badan atau lebih. Risiko penyakit mulai naik.', 'warn'];
  return ['Risiko tinggi', 'Lingkar pinggangmu jauh di atas setengah tinggi badanmu. Sebaiknya cek ke dokter.', 'err'];
}

export const meta = {"id": "kalkulator-rasio-pinggang-tinggi-whtr", "name": "Kalkulator Rasio Pinggang-Tinggi (WHtR)", "cat": "kesehatan", "icon": "🎯", "desc": "Bandingkan lingkar pinggangmu dengan tinggi badanmu. Patokannya: pinggang kurang dari setengah tinggi badan.", "keywords": "whtr,rasio pinggang tinggi,pinggang,tinggi badan,lemak perut,0,5", "since": "6.17.0"};
export function render(root) {
  const pinggang = T.input('number', 'Lingkar pinggang (cm)', '85');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const box = T.out();

  const hitung = () => {
    const pg = T.num(pinggang.value);
    const h = T.num(tinggi.value);
    if (!(pg >= 40 && pg <= 250)) {
      T.show(box, '<span class="err">Isi lingkar pinggang antara 40 sampai 250 cm.</span>');
      return;
    }
    if (!(h >= 100 && h <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    const r = pg / h;
    const k = kategoriWHtR(r);
    const target = h / 2;
    T.show(box,
      '<div class="center"><div class="dim">Rasio pinggang-tinggi (WHtR)</div>' +
      '<div class="big">' + r.toFixed(2) + '</div>' +
      '<div class="' + k[2] + '" style="margin-top:6px"><b>' + esc(k[0]) + '</b><br>' + esc(k[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Target lingkar pinggangmu</span><span class="v">di bawah ' + target.toFixed(0) + ' cm (setengah tinggi badan)</span></div>' +
      '<div class="dim" style="margin-top:12px">Kategori</div>' +
      '<div class="kv"><span class="k">Di bawah 0,4</span><span class="v">Di bawah normal' + (r < 0.4 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0,4 - 0,5</span><span class="v">Sehat' + (r >= 0.4 && r < 0.5 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0,5 - 0,6</span><span class="v">Waspada' + (r >= 0.5 && r < 0.6 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0,6 ke atas</span><span class="v">Risiko tinggi' + (r >= 0.6 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Cara ukur pinggang: di titik tersempit antara tulang rusuk dan pusar, sambil berdiri santai, meteran jangan ditekan. ' +
      'Patokan 0,5 berlaku untuk pria dan wanita dewasa. Ini perkiraan buat belajar, bukan diagnosis. Buat keputusan soal kesehatan, tanya dokter atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Lingkar pinggang (cm)', pinggang, 'Di titik tersempit, antara tulang rusuk dan pusar.'),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
