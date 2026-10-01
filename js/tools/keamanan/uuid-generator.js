import { h as T, utils } from '../../core.js?v=4.2.0';

export const meta = {"id": "uuid-generator", "name": "UUID Generator", "cat": "keamanan", "icon": "🆔", "desc": "Buat UUID v4 acak."};

export function render(root) {

    const nInp = T.input('number', 'Jumlah (1-100)', 5);
    nInp.min = 1; nInp.max = 100;
    const out = T.out();
    let last = [];
    const uuid4 = () => {
      const b = new Uint8Array(16);
      crypto.getRandomValues(b);
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    };
    const gen = () => {
      const n = Math.max(1, Math.min(100, parseInt(nInp.value, 10) || 5));
      nInp.value = n;
      last = [];
      for (let i = 0; i < n; i++) last.push(uuid4());
      T.show(out, last.map((u) =>
        '<div class="kv"><span class="v" style="font-family:ui-monospace,monospace;font-size:13px;user-select:all;text-align:left">' + u + '</span></div>'
      ).join(''));
    };
    root.appendChild(T.field('Jumlah UUID', nInp));
    root.appendChild(T.row(T.btn('Generate', gen, true), T.btn('Salin Semua', () => { if (last.length) T.copy(last.join('\n')); else T.toast('Generate dulu'); })));
    root.appendChild(out);
    gen();
  
}
