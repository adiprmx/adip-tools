import { h as T, utils, esc, kvRows } from '../../core.js?v=6.5.0';

export const meta = {"id": "zerowidth", "name": "Detektor Karakter Tak Terlihat", "cat": "developer", "icon": "👻", "desc": "Temukan zero-width & karakter aneh di teks.", "keywords": "zerowidth,karakter,tersembunyi,invisible"};
export function render(root) {

    const NAMES = {
      0x200B: 'ZERO WIDTH SPACE', 0x200C: 'ZERO WIDTH NON-JOINER', 0x200D: 'ZERO WIDTH JOINER',
      0xFEFF: 'ZERO WIDTH NO-BREAK SPACE (BOM)', 0x00AD: 'SOFT HYPHEN', 0x2060: 'WORD JOINER',
      0x180E: 'MONGOLIAN VOWEL SEPARATOR', 0x200E: 'LEFT-TO-RIGHT MARK', 0x200F: 'RIGHT-TO-LEFT MARK',
      0x202A: 'LEFT-TO-RIGHT EMBEDDING', 0x202B: 'RIGHT-TO-LEFT EMBEDDING', 0x202C: 'POP DIRECTIONAL FORMATTING',
      0x202D: 'LEFT-TO-RIGHT OVERRIDE', 0x202E: 'RIGHT-TO-LEFT OVERRIDE',
      0x2066: 'LEFT-TO-RIGHT ISOLATE', 0x2067: 'RIGHT-TO-LEFT ISOLATE', 0x2068: 'FIRST STRONG ISOLATE', 0x2069: 'POP DIRECTIONAL ISOLATE',
      0x202F: 'NARROW NO-BREAK SPACE', 0x205F: 'MEDIUM MATHEMATICAL SPACE', 0x3000: 'IDEOGRAPHIC SPACE',
      0xFFF9: 'INTERLINEAR ANNOTATION ANCHOR', 0xFFFA: 'INTERLINEAR ANNOTATION SEPARATOR', 0xFFFB: 'INTERLINEAR ANNOTATION TERMINATOR'
    };
    for (let cp = 0x2000; cp <= 0x200A; cp++) NAMES[cp] = 'SPASI UNICODE U+' + cp.toString(16).toUpperCase();
    const ta = T.ta(6, 'Paste teks yang dicurigai…');
    const box = T.out();
    const scan = () => {
      const s = ta.value;
      const hits = [];
      for (let i = 0; i < s.length; i++) {
        const cp = s.codePointAt(i);
        const name = NAMES[cp];
        if (name) hits.push({ i, cp, name });
        if (cp > 0xFFFF) i++;
      }
      if (!hits.length) {
        T.show(box, '<span class="ok">✓ Bersih. Tidak ada karakter tak terlihat yang dikenal.</span>');
        return;
      }
      let vis = '', last = 0;
      hits.forEach((h) => {
        vis += esc(s.slice(last, h.i));
        vis += '<span title="U+' + h.cp.toString(16).toUpperCase() + ' ' + esc(h.name) + '" style="background:#ef4444;color:#fff;border-radius:3px;padding:0 3px;font-size:11px">◈</span>';
        last = h.i + (h.cp > 0xFFFF ? 2 : 1);
      });
      vis += esc(s.slice(last));
      T.show(box,
        '<div class="warn" style="margin-bottom:8px">⚠️ Ketemu ' + hits.length + ' karakter mencurigakan:</div>' +
        '<div style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.8;background:#0d0d0f;border:1px solid #27272a;border-radius:8px;padding:12px;margin-bottom:10px">' + vis + '</div>' +
        kvRows(hits.slice(0, 50).map((h) => ['Posisi ' + h.i, 'U+' + h.cp.toString(16).toUpperCase().padStart(4, '0') + ': ' + h.name])) +
        (hits.length > 50 ? '<div class="hint">…dan ' + (hits.length - 50) + ' lagi</div>' : ''));
    };
    root.appendChild(T.field('Teks', ta));
    root.appendChild(T.row(
      T.btn('Scan', scan, true),
      T.btn('Bersihkan', () => {
        const s = ta.value;
        let out = '';
        for (let i = 0; i < s.length; i++) {
          const cp = s.codePointAt(i);
          const skip = NAMES[cp] && cp !== 0x00AD && !(cp >= 0x2000 && cp <= 0x200A);
          if (!skip) out += String.fromCodePoint(cp);
          if (cp > 0xFFFF) i++;
        }
        ta.value = out;
        scan();
        T.toast('Karakter tak terlihat dibersihkan');
      })
    ));
    root.appendChild(box);
  
}
