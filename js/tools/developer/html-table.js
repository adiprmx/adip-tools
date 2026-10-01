import { h as T, utils, esc, preHtml } from '../../core.js?v=6.0.0';

export const meta = {"id": "html-table", "name": "Generator Tabel HTML", "cat": "developer", "icon": "📋", "desc": "Bikin tabel HTML dari data baris.", "keywords": "html,tabel"};
export function render(root) {

    const ta = T.ta(6, 'Satu baris = satu row. Pisahkan kolom dengan | atau Tab.\nContoh:\nNama | Umur | Kota\nAdip | 25 | Jakarta');
    const headerCb = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:14px"><input type="checkbox" checked> Baris pertama = header (th)</label>');
    const borderCb = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:14px"><input type="checkbox" checked> Tambah border="1"</label>');
    const codeBox = T.out(), prevBox = T.out();
    const build = () => {
      const lines = ta.value.split('\n').map((l) => l.trim()).filter((l) => l);
      if (!lines.length) { T.hide(codeBox); T.hide(prevBox); T.toast('Isi dulu datanya'); return ''; }
      const rows = lines.map((l) => l.split(/\t|\|/).map((c) => c.trim()));
      const useHeader = headerCb.querySelector('input').checked;
      const border = borderCb.querySelector('input').checked;
      const cellTag = (c, h) => h ? '<th>' + esc(c) + '</th>' : '<td>' + esc(c) + '</td>';
      let html = '<table' + (border ? ' border="1"' : '') + '>\n';
      rows.forEach((r, i) => {
        const h = useHeader && i === 0;
        html += '  <tr>\n    ' + r.map((c) => cellTag(c, h)).join('\n    ') + '\n  </tr>\n';
      });
      html += '</table>';
      T.show(codeBox, preHtml(html));
      T.show(prevBox, '<div style="border:1px solid #27272a;border-radius:8px;padding:12px;overflow-x:auto">' + html.replace('<table', '<table style="border-collapse:collapse"') + '</div>');
      return html;
    };
    root.appendChild(T.field('Data baris', ta));
    root.appendChild(headerCb);
    root.appendChild(borderCb);
    root.appendChild(T.row(T.btn('Generate', () => { const h = build(); if (h) T.toast('Tabel dibuat'); }, true), T.copyBtn(() => codeBox.querySelector('pre') ? codeBox.querySelector('pre').textContent : '')));
    root.appendChild(T.el('<div class="hint" style="margin:12px 0 4px">Kode HTML:</div>'));
    root.appendChild(codeBox);
    root.appendChild(T.el('<div class="hint" style="margin:12px 0 4px">Preview:</div>'));
    root.appendChild(prevBox);
  
}
