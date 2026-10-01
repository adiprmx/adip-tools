import { h as T, utils } from '../../core.js?v=6.7.0';

const FANCY_STYLES = ['bold', 'italic', 'mono', 'script', 'struck', 'circled', 'fullwidth'];

function fancyChar(ch, style) {
    const cp = ch.codePointAt(0);
    const az = cp >= 65 && cp <= 90, za = cp >= 97 && cp <= 122, d = cp >= 48 && cp <= 57;
    switch (style) {
      case 'bold':
        if (az) return String.fromCodePoint(0x1D400 + cp - 65);
        if (za) return String.fromCodePoint(0x1D41A + cp - 97);
        if (d) return String.fromCodePoint(0x1D7CE + cp - 48);
        return ch;
      case 'italic':
        if (az) return String.fromCodePoint(0x1D434 + cp - 65);
        if (za) return String.fromCodePoint(0x1D44E + cp - 97);
        return ch;
      case 'mono':
        if (az) return String.fromCodePoint(0x1D670 + cp - 65);
        if (za) return String.fromCodePoint(0x1D68A + cp - 97);
        if (d) return String.fromCodePoint(0x1D7F6 + cp - 48);
        return ch;
      case 'script': {
        // beberapa huruf script punya code point khusus
        const special = { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 };
        if (special[ch]) return String.fromCodePoint(special[ch]);
        if (az) return String.fromCodePoint(0x1D49C + cp - 65);
        if (za) return String.fromCodePoint(0x1D4B6 + cp - 97);
        return ch;
      }
      case 'struck':
        if (az) return String.fromCodePoint(0x1D538 + cp - 65);
        if (za) return String.fromCodePoint(0x1D552 + cp - 97);
        if (d) return String.fromCodePoint(0x1D7D8 + cp - 48);
        return ch;
      case 'circled':
        if (az) return String.fromCodePoint(0x24B6 + cp - 65);
        if (za) return String.fromCodePoint(0x24D0 + cp - 97);
        if (d) return String.fromCodePoint(cp === 48 ? 0x24EA : 0x2460 + cp - 49);
        return ch;
      case 'fullwidth':
        if (cp === 32) return String.fromCodePoint(0x3000);
        if (cp >= 33 && cp <= 126) return String.fromCodePoint(cp + 0xFEE0);
        return ch;
      default: return ch;
    }
  }

utils.fancy = function (text, style) {
    return Array.from(String(text == null ? '' : text)).map((c) => fancyChar(c, style)).join('');
  };

utils.fancyStyles = FANCY_STYLES;

export const meta = {"id": "fancy-text", "name": "Fancy Text", "cat": "teks", "icon": "✨", "desc": "Teks gaya unik untuk sosmed.", "keywords": "fancy,teks,sosmed,keren,gaya"};
export function render(root) {

      const inI = T.input('text', 'Ketik teks…', 'Adip Store');
      const box = T.out();
      const labels = { bold: '𝐁𝐨𝐥𝐝', italic: '𝐼𝑡𝑎𝑙𝑖𝑐', mono: '𝙼𝚘𝚗𝚘', script: '𝒮𝒸𝓇𝒾𝓅𝓉', struck: '𝔻𝕠𝕦𝕓𝕝𝕖', circled: 'Ⓒⓘⓡⓒⓛⓔⓓ', fullwidth: 'Ｆｕｌｌｗｉｄｔｈ' };

      function gen() {
        const txt = inI.value;
        if (!txt) { T.toast('Ketik teks dulu'); return; }
        T.show(box, '');
        utils.fancyStyles.forEach((st) => {
          const v = utils.fancy(txt, st);
          const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
          card.appendChild(T.el(`<div class="hint" style="margin-bottom:4px">${T.esc(labels[st] || st)}</div>`));
          card.appendChild(T.el(`<div class="fancy-out">${T.esc(v)}</div>`));
          const r = T.el('<div class="row" style="margin-top:6px"></div>');
          r.appendChild(T.copyBtn(() => v, 'Salin'));
          card.appendChild(r);
          box.appendChild(card);
        });
      }

      inI.addEventListener('input', gen);
      T.onLeave(() => inI.removeEventListener('input', gen));
      root.appendChild(T.field('Teks', inI));
      root.appendChild(box);
      gen();
    
}
