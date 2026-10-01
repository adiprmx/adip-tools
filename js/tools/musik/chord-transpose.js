import { h as T, utils, U, _NI, _normAcc } from '../../core.js?v=6.1.0';

const _NS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const _NF = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const _tNote = (root, acc, steps, flat) => {
    const i = _NI[root + _normAcc(acc)];
    if (i == null) return null;
    return (flat ? _NF : _NS)[((((i + steps) % 12) + 12) % 12)];
  };

U.transposeChord = (chord, steps, preferFlat) => {
    steps = Math.round(+steps || 0);
    const m = /^\s*([A-G])([#b♯♭]?)\s*(.*?)\s*(?:\/\s*([A-G])([#b♯♭]?)\s*)?$/.exec(String(chord));
    if (!m) return chord;
    const suf = m[3] || '';
    if (suf && !/^(m(?!aj)|maj|min|dim|aug|sus|add)?\d*(b5|#5)?$/.test(suf)) return chord;
    const flatFor = (a) => {
      a = _normAcc(a);
      return a === 'b' ? true : a === '#' ? false : !!preferFlat;
    };
    const nr = _tNote(m[1], m[2], steps, flatFor(m[2]));
    if (nr == null) return chord;
    let out = nr + suf;
    if (m[4]) {
      const nb = _tNote(m[4], m[5], steps, flatFor(m[5]));
      if (nb == null) return chord;
      out += '/' + nb;
    }
    return out;
  };

export const meta = {"id": "chord-transpose", "name": "Chord Transposer", "cat": "musik", "icon": "🎸", "desc": "Naik-turunkan kunci chord lagu.", "keywords": "chord,kunci,gitar,lagu,transpose"};
export function render(root) {

    const src = T.ta(8, '[Am]           [G]\nAku di sini menunggumu\n[F]            [C]\nDi bawah langit yang biru…');
    const steps = T.el('<input type="range" class="inp" min="-11" max="11" value="0" step="1">');
    const stepsLbl = T.el('<span class="big">0</span>');
    const accidental = T.select([['sharp', 'Tampilkan kres (#)'], ['flat', 'Tampilkan mol (b)']], 'sharp');
    const box = T.out();
    const TOKEN = /^[A-G][#b]?(m(?!aj)|maj|min|dim|aug|sus|add)?\d*(\/[A-G][#b]?)?$/;
    const transposeText = (text, st, preferFlat) => {
      return text.split('\n').map((line) => {
        const toks = line.trim().split(/\s+/).filter(Boolean);
        const isChordLine = toks.length > 0 && toks.every((t) => t === '|' || TOKEN.test(t));
        let out = line.replace(/\[([^\]]+)\]/g, (m, c) => '[' + U.transposeChord(c, st, preferFlat) + ']')
          .replace(/\(([^)]+)\)/g, (m, c) => '(' + U.transposeChord(c, st, preferFlat) + ')');
        if (isChordLine) {
          out = out.split(/(\s+)/).map((w) => (/^\s*$/.test(w) || w === '|' ? w : (TOKEN.test(w) ? U.transposeChord(w, st, preferFlat) : w))).join('');
        } else {
          out = out.replace(/\b([A-G][#b]?(?:m(?!aj)|maj|min|dim|aug|sus|add)?\d*\/[A-G][#b]?)\b/g, (m) => U.transposeChord(m, st, preferFlat));
        }
        return out;
      }).join('\n');
    };
    const hitung = () => {
      const st = +steps.value;
      stepsLbl.textContent = (st > 0 ? '+' : '') + st;
      const res = transposeText(src.value, st, accidental.value === 'flat');
      T.show(box, '<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">' + T.esc(res) + '</pre>' +
        T.row(T.copyBtn(() => res, 'Salin hasil')));
    };
    steps.addEventListener('input', hitung);
    accidental.addEventListener('change', hitung);
    src.addEventListener('input', hitung);
    root.appendChild(T.field('Lirik + chord', src, 'Chord terdeteksi di dalam [tanda kurung siku], (kurung biasa), pola G/B, atau baris yang semuanya chord.'));
    root.appendChild(T.field('Transpose', steps, 'Geser nada'));
    root.appendChild(T.el('<div class="center"></div>').appendChild(stepsLbl).parentNode || T.el('<div></div>'));
    root.appendChild(T.field('Notasi nada baru', accidental));
    root.appendChild(T.row(T.btn('Transpose', hitung, true)));
    root.appendChild(box);
  
}
