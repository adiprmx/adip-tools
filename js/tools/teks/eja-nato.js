import { h as T, utils } from '../../core.js?v=6.11.5';

export const meta = {"id": "eja-nato", "name": "Eja dengan Alfabet NATO", "cat": "teks", "icon": "📞", "desc": "Ubah huruf jadi ejaan Alfa-Bravo-Charlie supaya tidak salah dengar saat mengeja lewat telepon.", "keywords": "nato,eja,alfabet,alfa,bravo,telepon,kode,ejaan"};
export function render(root) {

    const NATO = {
      A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot',
      G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima',
      M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo',
      S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey',
      X: 'X-ray', Y: 'Yankee', Z: 'Zulu',
      '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
      '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner',
    };
    const REVERSE = {};
    Object.keys(NATO).forEach((k) => { REVERSE[NATO[k].toLowerCase()] = k; });
    // Ejaan yang juga sering dipakai orang
    REVERSE['alpha'] = 'A'; REVERSE['nine'] = '9'; REVERSE['xray'] = 'X'; REVERSE['x ray'] = 'X';

    const inp = T.ta(4, 'Tulis teks atau kode di sini… contoh: B 1234 XY');
    const outp = T.ta(4, 'Hasil muncul di sini…');
    outp.readOnly = true;

    function toNato(text) {
      const words = text.trim().split(/\s+/).filter(Boolean);
      return words.map((w) => {
        return w.split('').map((ch) => NATO[ch.toUpperCase()] || ch).join(' ');
      }).join('  /  ');
    }

    function fromNato(text) {
      return text.split(/\s*\/\s*/).map((chunk) => {
        return chunk.trim().split(/[\s,]+/).filter(Boolean).map((w) => {
          const key = w.toLowerCase();
          if (REVERSE[key]) return REVERSE[key];
          if (/^[a-z0-9]$/i.test(w)) return w.toUpperCase();
          return w; // kata yang tidak dikenal dibiarkan apa adanya
        }).join('');
      }).join(' ');
    }

    function doTo() {
      if (!inp.value.trim()) { T.toast('Tulis teks dulu'); return; }
      outp.value = toNato(inp.value);
    }
    function doFrom() {
      if (!inp.value.trim()) { T.toast('Tulis ejaan NATO dulu'); return; }
      outp.value = fromNato(inp.value);
    }

    root.appendChild(T.el('<p class="note">📞 Berguna saat mengeja kode booking, nama, atau nomor lewat telepon — B dan D tidak akan tertukar lagi.</p>'));
    root.appendChild(T.field('Input', inp));
    root.appendChild(T.row(T.btn('Teks → NATO', doTo, true), T.btn('NATO → Teks', doFrom)));
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.row(
      T.btn('Salin Hasil', () => { if (!outp.value) { T.toast('Belum ada hasil'); return; } T.copy(outp.value); }),
      T.btn('Tukar ⇅', () => { const t = inp.value; inp.value = outp.value; outp.value = t; })
    ));
    root.appendChild(T.el('<p class="hint">Contoh: "B1234" dibaca "Bravo One Two Three Four". Tanda "/" memisahkan antar kata.</p>'));
  
}
