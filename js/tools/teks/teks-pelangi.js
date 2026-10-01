import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "teks-pelangi", "name": "Teks Pelangi", "cat": "teks", "icon": "🌈", "desc": "Ubah teks jadi pelangi huruf per huruf, salin sebagai HTML.", "keywords": "pelangi,rainbow,teks berwarna,html,warnai teks,gradient teks"};
export function render(root) {
  const inp = T.ta(3, 'Ketik teks di sini...', 'Halo Dunia!');
  const dirSel = T.select([
    ['ltr', 'Kiri ke kanan'],
    ['ttb', 'Atas ke bawah (per baris)'],
    ['diag', 'Diagonal']
  ], 'ltr');
  const nSel = T.select(
    [3, 4, 5, 6, 7, 8].map((n) => [String(n), n + ' warna']),
    '6'
  );
  const prev = T.el('<div class="out" style="font-size:22px;font-weight:700;line-height:1.6;word-break:break-word;min-height:48px"></div>');
  const codeBox = T.out();

  let spans = [];

  const renderRainbow = () => {
    const text = inp.value;
    const dir = dirSel.value;
    const n = parseInt(nSel.value, 10) || 6;
    spans = [];
    if (!text.trim()) {
      prev.innerHTML = '<span class="mut" style="font-size:14px;font-weight:400">Pratinjau muncul di sini...</span>';
      T.hide(codeBox);
      return;
    }
    const lines = text.split('\n');
    const htmlParts = [];
    lines.forEach((line, li) => {
      const cols = [...line];
      cols.forEach((ch, ci) => {
        let pos;
        if (dir === 'ltr') {
          pos = spans.length; // posisi antar huruf non-spasi
        } else if (dir === 'ttb') {
          pos = li * n;
        } else {
          pos = li + ci;
        }
        if (ch.trim() === '') {
          htmlParts.push(T.esc(ch));
          return;
        }
        const hue = Math.round((pos * (360 / n)) % 360);
        spans.push({ ch, hue });
        htmlParts.push('<span style="color:hsl(' + hue + ',85%,55%)">' + T.esc(ch) + '</span>');
      });
      if (li < lines.length - 1) htmlParts.push('<br>');
    });
    prev.innerHTML = htmlParts.join('');
    const code = spans.map((s) => '<span style="color:hsl(' + s.hue + ',85%,55%)">' + T.esc(s.ch) + '</span>').join('');
    T.show(codeBox, '');
    codeBox.appendChild(T.el('<p class="hint">Kode HTML-nya (' + spans.length + ' huruf):</p>'));
    const pre = T.el('<pre style="white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12px;line-height:1.5;max-height:180px;overflow:auto"></pre>');
    pre.textContent = code;
    codeBox.appendChild(pre);
    codeBox.appendChild(T.row(
      T.copyBtn(() => code, 'Salin sebagai HTML')
    ));
  };

  inp.addEventListener('input', renderRainbow);
  dirSel.addEventListener('change', renderRainbow);
  nSel.addEventListener('change', renderRainbow);

  root.appendChild(T.field('Teks', inp));
  root.appendChild(T.grid2(
    T.field('Arah gradasi', dirSel),
    T.field('Jumlah warna', nSel)
  ));
  root.appendChild(T.el('<p class="hint">Pratinjau langsung:</p>'));
  root.appendChild(prev);
  root.appendChild(codeBox);
  renderRainbow();
}
