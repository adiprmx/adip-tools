import { h as T, esc } from '../../core.js';

// Rasio pinggang-pinggul (WHR) = lingkar pinggang dibagi lingkar pinggul.
// Batas WHO: pria di atas 0,90 dan wanita di atas 0,85 berarti lemak
// perut sudah berlebih dan risiko penyakit naik. Di bawah batas itu
// risiko lebih rendah. Kategori di sini: rendah (di bawah batas WHO),
// sedang (di batas sampai 0,09 di atasnya), tinggi (0,10 di atas batas).
function kategoriWHR(whr, pria) {
  const batas = pria ? 0.90 : 0.85;
  if (whr < batas) return ['Rendah', 'ok', 'di bawah batas WHO (' + batas.toFixed(2) + ')'];
  if (whr < batas + 0.10) return ['Sedang', 'warn', 'di atas batas WHO (' + batas.toFixed(2) + ')'];
  return ['Tinggi', 'err', 'jauh di atas batas WHO (' + batas.toFixed(2) + ')'];
}

export const meta = {"id": "kalkulator-rasio-pinggang-pinggul-whr", "name": "Kalkulator Rasio Pinggang-Pinggul (WHR)", "cat": "kesehatan", "icon": "🧍", "desc": "Rasio lingkar pinggang dan pinggulmu, dan apa artinya buat risiko penyakit menurut WHO.", "keywords": "whr,rasio pinggang pinggul,pinggang,pinggul,lemak perut,who,risiko", "since": "6.17.0"};
export function render(root) {
  const pinggang = T.input('number', 'Lingkar pinggang (cm)', '90');
  const pinggul = T.input('number', 'Lingkar pinggul (cm)', '100');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const box = T.out();

  const hitung = () => {
    const pg = T.num(pinggang.value);
    const pu = T.num(pinggul.value);
    if (!(pg >= 40 && pg <= 250)) {
      T.show(box, '<span class="err">Isi lingkar pinggang antara 40 sampai 250 cm.</span>');
      return;
    }
    if (!(pu >= 40 && pu <= 250)) {
      T.show(box, '<span class="err">Isi lingkar pinggul antara 40 sampai 250 cm.</span>');
      return;
    }
    const pria = gender.value === 'pria';
    const whr = pg / pu;
    const k = kategoriWHR(whr, pria);
    T.show(box,
      '<div class="center"><div class="dim">Rasio pinggang-pinggul (WHR)</div>' +
      '<div class="big">' + whr.toFixed(2) + '</div>' +
      '<div class="' + k[1] + '" style="margin-top:6px"><b>Risiko: ' + esc(k[0]) + '</b>, ' + esc(k[2]) + '</div></div>' +
      '<div class="dim" style="margin-top:12px">Batas WHO</div>' +
      '<div class="kv"><span class="k">Pria</span><span class="v">risiko naik di atas 0,90</span></div>' +
      '<div class="kv"><span class="k">Wanita</span><span class="v">risiko naik di atas 0,85</span></div>' +
      '<p class="hint">Cara ukur: lingkar pinggang diukur di titik tersempit antara tulang rusuk dan pusar, lingkar pinggul di bagian terlebar. Ukur sambil berdiri santai, meteran jangan ditekan. ' +
      'WHR menggambarkan lemak di perut, yang lebih berkaitan dengan risiko penyakit jantung dan diabetes daripada berat badan saja. ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Buat keputusan soal kesehatan, tanya dokter atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Lingkar pinggang (cm)', pinggang, 'Di titik tersempit, antara tulang rusuk dan pusar.'),
    T.field('Lingkar pinggul (cm)', pinggul, 'Di bagian pinggul terlebar.'),
  ));
  root.appendChild(T.field('Jenis kelamin', gender));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
