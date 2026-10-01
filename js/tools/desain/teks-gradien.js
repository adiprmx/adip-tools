import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "teks-gradien", "name": "Teks Gradien", "cat": "desain", "icon": "🌅", "desc": "Bikin teks berwarna gradasi + salin sebagai HTML/CSS.", "keywords": "gradien,teks,warna,css,desain,gradient"};

export const ARAH = {
  'lr': ['Kiri → Kanan', 'to right'],
  'tb': ['Atas → Bawah', 'to bottom'],
  'diag': ['Diagonal', 'to bottom right'],
  'radial': ['Menyebar (radial)', 'radial'],
};

// Bangun string CSS gradien dari parameter — fungsi murni, bisa diuji.
export function cssGradien(w1, w2, arah) {
  const a = ARAH[arah] ? ARAH[arah][1] : 'to right';
  if (a === 'radial') return 'radial-gradient(circle, ' + w1 + ', ' + w2 + ')';
  return 'linear-gradient(' + a + ', ' + w1 + ', ' + w2 + ')';
}

export function snippetHTML(teks, w1, w2, arah) {
  const g = cssGradien(w1, w2, arah);
  return '<span style="background: ' + g + '; -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;">' +
    T.esc(teks) + '</span>';
}

export function snippetCSS(w1, w2, arah) {
  const g = cssGradien(w1, w2, arah);
  return '.teks-gradien {\n  background: ' + g + ';\n  -webkit-background-clip: text;\n  background-clip: text;\n  color: transparent;\n  font-weight: 800;\n}';
}

export function render(root) {
  const teksInp = T.input('text', 'Ketik teksmu di sini…', 'ADIP TOOLS');
  const w1 = T.input('color', '', '#ffffff');
  const w2 = T.input('color', '', '#a855f7');
  const arahSel = T.select(Object.keys(ARAH).map((k) => [k, ARAH[k][0]]), 'lr');
  const prev = T.out();

  function gambar() {
    const t = teksInp.value.trim() || 'Teks contoh';
    const g = cssGradien(w1.value, w2.value, arahSel.value);
    T.show(prev, '<div class="dim" style="font-size:12px;margin-bottom:8px">Pratinjau:</div>' +
      '<div style="background:' + g + ';-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800;font-size:34px;line-height:1.3;word-break:break-word">' +
      T.esc(t) + '</div>');
  }

  [teksInp, w1, w2].forEach((i) => i.addEventListener('input', gambar));
  arahSel.addEventListener('change', gambar);

  const salinHTML = T.copyBtn(() => snippetHTML(teksInp.value.trim() || 'Teks contoh', w1.value, w2.value, arahSel.value), 'Salin HTML');
  const salinCSS = T.copyBtn(() => snippetCSS(w1.value, w2.value, arahSel.value), 'Salin CSS');

  root.append(
    T.el('<p class="dim" style="font-size:13px">Tulis teks, pilih dua warna dan arah gradasi — pratinjau langsung muncul, lalu salin kodenya.</p>'),
    T.field('Teks', teksInp),
    T.grid2(T.field('Warna 1', w1), T.field('Warna 2', w2)),
    T.field('Arah gradien', arahSel),
    prev,
    T.row(salinHTML, salinCSS)
  );
  gambar();
}
