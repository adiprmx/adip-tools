import { h as T, utils } from '../../core.js?v=6.1.0';

export const meta = {"id": "case-converter", "name": "Case Converter", "cat": "converter", "icon": "✏️", "desc": "camelCase, snake_case, kebab-case, Title Case, dll.", "keywords": "case,huruf,camel,snake,kebab,kapital"};
export function render(root) {

    const inp = T.ta(3, 'Tulis teks di sini… misal: halo dunia keren');
    const out = T.out();
    const kata = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^a-zA-Z0-9]+/).filter(Boolean).map((w) => w.toLowerCase());
    const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
    const go = () => {
      const ws = kata(inp.value);
      if (!ws.length) { T.show(out, '<span class="dim">Ketik sesuatu dulu, semua varian muncul otomatis.</span>'); return; }
      const varian = [
        ['camelCase', ws.map((w, i) => (i ? cap(w) : w)).join('')],
        ['PascalCase', ws.map(cap).join('')],
        ['snake_case', ws.join('_')],
        ['kebab-case', ws.join('-')],
        ['Title Case', ws.map(cap).join(' ')],
        ['SCREAMING_SNAKE', ws.join('_').toUpperCase()],
        ['lower case', ws.join(' ')],
        ['UPPER CASE', ws.join(' ').toUpperCase()],
      ];
      T.show(out, varian.map(([n, v], i) =>
        '<div class="kv"><span class="k">' + n + '</span><span class="v" style="font-family:ui-monospace,monospace;user-select:all;text-align:right">' + T.esc(v) + '</span></div>'
      ).join(''));
      const btns = T.el('<div style="margin-top:10px"></div>');
      varian.forEach(([n, v]) => {
        const b = T.btn(n, () => T.copy(v));
        b.classList.add('small'); b.style.margin = '0 6px 6px 0';
        btns.appendChild(b);
      });
      out.appendChild(btns);
    };
    inp.addEventListener('input', go);
    root.appendChild(T.field('Teks', inp));
    root.appendChild(out);
    go();
  
}
