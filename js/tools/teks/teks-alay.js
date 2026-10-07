import { h as T, utils } from '../../core.js?v=6.9.5';

const SUBS = {
  1: { a: '4', e: '3', o: '0' },
  2: { a: '4', e: '3', o: '0', i: '1', s: '5', g: '6', b: '8', z: '2', t: '7', l: '1' },
  3: { a: '4', e: '3', o: '0', i: '1', s: '5', g: '9', b: '8', z: '2', t: '7', l: '1', q: '9', d: 'D', k: 'K', m: 'M', n: 'N', r: 'R', w: 'W', y: 'Y' }
};

const CAPS = { 1: 0.08, 2: 0.22, 3: 0.40 };

utils.alaykan = function (text, level, rand) {
  const r = rand || Math.random;
  const lv = SUBS[level] ? Number(level) : 2;
  const sub = SUBS[lv];
  const p = CAPS[lv];
  return String(text == null ? '' : text).split('').map((ch) => {
    const low = ch.toLowerCase();
    let out = sub[low] != null ? sub[low] : ch;
    if (/[a-z]/i.test(out) && r() < p) out = r() < 0.5 ? out.toUpperCase() : out.toLowerCase();
    return out;
  }).join('');
};

export const meta = {"id": "teks-alay", "name": "Text Alay Generator", "cat": "teks", "icon": "🅰️", "desc": "Ubah teks normal jadi gaya alay Indonesia.", "keywords": "alay,gaya teks,gaul,leetspeak,4lay"};
export function render(root) {

      const inT = T.ta(4, 'Ketik teks normal di sini…', '');
      const lvl = T.select([
        ['1', 'Level 1 — Kamsud (ringan)'],
        ['2', 'Level 2 — Nakal (sedang)'],
        ['3', 'Level 3 — Bubar (parah)']
      ], '2');
      const box = T.out();
      let last = '';

      function gen() {
        last = utils.alaykan(inT.value, parseInt(lvl.value, 10));
        T.show(box, `<div class="alay-out">${T.esc(last)}</div>`);
      }

      inT.addEventListener('input', gen);
      lvl.addEventListener('change', gen);
      const again = T.btn('🎲 Acak Lagi', gen);
      T.onLeave(() => { inT.removeEventListener('input', gen); lvl.removeEventListener('change', gen); });

      const row = T.el('<div class="row"></div>');
      row.appendChild(again);
      row.appendChild(T.copyBtn(() => last, 'Salin Hasil'));
      root.appendChild(T.field('Teks normal', inT));
      root.appendChild(T.field('Level kealayan', lvl, '1 = masih bisa dibaca, 3 = cuma anak alay yang paham.'));
      root.appendChild(row);
      root.appendChild(box);
      gen();

}
