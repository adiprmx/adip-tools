import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "pembuat-singkatan", "name": "Pembuat Singkatan", "cat": "teks", "icon": "🔤", "desc": "Bikin beberapa varian singkatan dari kalimat atau frasa.", "keywords": "singkatan,akronim,initsial,abbreviation,frasa"};
export function render(root) {
  const inp = T.ta(2, 'Contoh: Kementerian Pendidikan dan Kebudayaan', 'Kementerian Pendidikan dan Kebudayaan');
  const box = T.out();

  const stopWords = new Set(['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'dengan', 'atau', 'serta']);

  const wordsOf = (s) => String(s || '')
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9\u00C0-\u024F]+|[^a-zA-Z0-9\u00C0-\u024F]+$/g, ''))
    .filter((w) => w.length > 0);

  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const noVowel = (w) => {
    const v = w.replace(/[aiueoAIUEO]/g, '');
    return v.length ? cap(v) : w.charAt(0).toUpperCase();
  };

  const build = () => {
    const words = wordsOf(inp.value);
    T.hide(box);
    if (words.length < 2) {
      T.show(box, '<p class="hint">Tulis minimal 2 kata biar bisa dibikin singkatannya.</p>');
      return;
    }
    const inti = words.filter((w) => !stopWords.has(w.toLowerCase()));
    const src = inti.length >= 2 ? inti : words;

    const varian = [
      ['Huruf depan tiap kata', src.map((w) => w.charAt(0).toUpperCase()).join(''), 'Kementerian Pendidikan → KP'],
      ['2 huruf per kata', src.map((w) => cap(w.slice(0, 2))).join(''), 'Kementerian Pendidikan → KePe'],
      ['3 huruf per kata', src.map((w) => cap(w.slice(0, 3))).join(''), 'Kementerian Pendidikan → KemPen'],
      ['Vokal dihilangkan', src.map(noVowel).join(' '), 'Kementerian Pendidikan → Kmntrn Pnddkn'],
      ['Kata depan + huruf akhir', cap(src[0]) + ' ' + src.slice(1).map((w) => w.charAt(0).toUpperCase()).join(''), 'Buat nama brand yang masih kebaca']
    ];

    T.show(box, '');
    varian.forEach(([label, val, note]) => {
      const rowBox = T.el(
        '<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;background:#12100d;border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px"></div>'
      );
      const left = T.el('<div style="min-width:0"></div>');
      left.appendChild(T.el('<div style="font-size:12px;color:#c9bda9">' + T.esc(label) + '</div>'));
      left.appendChild(T.el('<div style="font-size:17px;font-weight:700;word-break:break-word">' + T.esc(val) + '</div>'));
      left.appendChild(T.el('<div class="hint" style="margin:2px 0 0">' + T.esc(note) + '</div>'));
      rowBox.appendChild(left);
      rowBox.appendChild(T.copyBtn(() => val, 'Salin'));
      box.appendChild(rowBox);
    });
  };

  inp.addEventListener('input', build);
  root.appendChild(T.field('Kalimat / frasa', inp, 'Pisahkan dengan spasi, kata penghubung (dan, di, ke) otomatis dilewati.'));
  root.appendChild(box);
  build();
}
