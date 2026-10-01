import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=5.0.1';

function sqlFormat(src) {
    const kws = ['INSERT INTO', 'DELETE FROM', 'GROUP BY', 'ORDER BY', 'UNION ALL', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'INNER JOIN', 'CROSS JOIN', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'ON', 'AND', 'OR', 'UNION', 'VALUES', 'UPDATE', 'SET', 'INTO'];
    let s = ' ' + String(src || '').replace(/\s+/g, ' ').trim();
    const sorted = kws.slice().sort((a, b) => b.length - a.length);
    sorted.forEach((kw) => {
      const re = new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi');
      s = s.replace(re, (m) => '\n' + m.toUpperCase());
    });
    s = s.replace(/\(\s*/g, '(\n  ').replace(/\s*\)/g, '\n)');
    const lines = s.split('\n').map((l) => l.trim()).filter((l) => l);
    return lines.map((l) => (/^(AND|OR|ON)\b/.test(l) ? '  ' + l : l)).join('\n');
  }

export const meta = {"id": "sql-formatter", "name": "SQL Formatter", "cat": "developer", "icon": "🗄️", "desc": "Rapikan query SQL."};

export function render(root) {

    const ta = T.ta(8, 'Paste query SQL… misal: select id, nama from users where aktif = 1 order by nama');
    const box = T.out();
    root.appendChild(T.field('Input SQL', ta));
    root.appendChild(T.row(T.btn('Rapikan', () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu query-nya.')); return; }
      T.show(box, preHtml(sqlFormat(raw)));
    }, true)));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : '')));
  
}
