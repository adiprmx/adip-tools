import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=6.5.0';

export const meta = {"id": "json-formatter", "name": "JSON Formatter", "cat": "developer", "icon": "🧩", "desc": "Rapikan, minify, & validasi JSON.", "keywords": "json,format,rapi,validasi"};
export function render(root) {

    const ta = T.ta(8, 'Paste JSON di sini…');
    const indentSel = T.select([['2', 'Indent 2'], ['4', 'Indent 4']], '2');
    const box = T.out();
    const run = (mode) => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return; }
      try {
        const obj = JSON.parse(raw);
        if (mode === 'valid') { T.show(box, '<span class="ok">✓ JSON valid.</span>'); return; }
        const ind = mode === 'min' ? 0 : +indentSel.value;
        T.show(box, preHtml(JSON.stringify(obj, null, ind)));
      } catch (e) {
        let pos = '';
        const m = /position (\d+)/.exec(String(e.message));
        if (m) pos = ' (posisi karakter ke-' + m[1] + ')';
        T.show(box, errBox('JSON tidak valid' + pos + ': ' + e.message));
      }
    };
    root.appendChild(T.field('Input JSON', ta));
    root.appendChild(T.row(T.field('Indentasi', indentSel)));
    root.appendChild(T.row(
      T.btn('Rapikan', () => run('pretty'), true),
      T.btn('Minify', () => run('min')),
      T.btn('Validasi', () => run('valid'))
    ));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : ''), T.dlBtn('format.json', () => box.querySelector('pre') ? box.querySelector('pre').textContent : '{}', 'application/json', 'Unduh')));
  
}
