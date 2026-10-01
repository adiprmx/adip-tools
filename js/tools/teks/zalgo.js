import { h as T, utils } from '../../core.js?v=5.2.0';

const Z_UP = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030A','\u030B','\u030C','\u030D','\u030E','\u030F','\u0310','\u0311','\u0312','\u0313','\u0314'];

const Z_MID = ['\u0315','\u031B','\u0334','\u0335','\u0336','\u0340','\u0341','\u0342','\u0343','\u0344'];

const Z_DOWN = ['\u0316','\u0317','\u0318','\u0319','\u031A','\u031C','\u031D','\u031E','\u031F','\u0320','\u0321','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327','\u0328','\u0329','\u032A','\u032B','\u032C','\u032D','\u032E','\u032F','\u0330','\u0331','\u0332','\u0333','\u0339','\u033A','\u033B','\u033C'];

utils.zalgo = function (text, intensity, rand) {
    const r = rand || Math.random;
    const n = Math.max(1, Math.min(12, Math.round(Number(intensity) || 3)));
    return Array.from(String(text == null ? '' : text)).map((ch) => {
      if (ch.trim() === '') return ch;
      let out = ch;
      const pick = (arr) => arr[Math.floor(r() * arr.length)];
      for (let k = 0; k < n; k++) out += pick(Z_UP);
      for (let k = 0; k < Math.ceil(n / 2); k++) out += pick(Z_MID);
      for (let k = 0; k < n; k++) out += pick(Z_DOWN);
      return out;
    }).join('');
  };

export const meta = {"id": "zalgo", "name": "Zalgo Text", "cat": "teks", "icon": "🌀", "desc": "Teks rusak ala zalgo.", "keywords": "zalgo,rusak,teks,lucu"};
export function render(root) {

      const inI = T.input('text', 'Ketik teks…', 'zalgo');
      const intR = T.input('range'); intR.min = '1'; intR.max = '10'; intR.value = '3';
      const intV = T.el('<b>3</b>');
      const box = T.out();
      let last = '';

      function gen() {
        const n = parseInt(intR.value, 10);
        intV.textContent = n;
        last = utils.zalgo(inI.value, n);
        T.show(box, `<div class="zalgo-out">${T.esc(last)}</div>`);
      }

      intR.addEventListener('input', gen);
      inI.addEventListener('input', gen);
      T.onLeave(() => { intR.removeEventListener('input', gen); inI.removeEventListener('input', gen); });

      const iRow = T.el('<div class="row"></div>');
      iRow.appendChild(intR); iRow.appendChild(intV);
      root.appendChild(T.field('Teks', inI));
      root.appendChild(T.field('Intensitas kerusakan', iRow, '1 = ringan, 10 = parah.'));
      root.appendChild(T.copyBtn(() => last, 'Salin Hasil'));
      root.appendChild(box);
      gen();
    
}
