import { h as T, utils, errBox, esc } from '../../core.js?v=5.0.1';

export const meta = {"id": "json-table", "name": "JSON ke Tabel", "cat": "developer", "icon": "📊", "desc": "Paste JSON jadi tabel yang enak dibaca."};

export function render(root) {

    const ta = T.ta(8, 'Paste JSON: array of objects atau satu object…');
    const box = T.out();
    root.appendChild(T.field('Input JSON', ta));
    root.appendChild(T.row(T.btn('Jadikan Tabel', () => {
      const raw = ta.value.trim();
      if (!raw) { T.show(box, errBox('Tempel dulu JSON-nya.')); return; }
      let data;
      try { data = JSON.parse(raw); }
      catch (e) { T.show(box, errBox('JSON tidak valid: ' + e.message)); return; }
      let rows, cols;
      if (Array.isArray(data)) {
        if (!data.length) { T.show(box, '<span class="dim">Array kosong.</span>'); return; }
        rows = data;
        const set = [];
        rows.forEach((r) => { if (r && typeof r === 'object') Object.keys(r).forEach((k) => { if (!set.includes(k)) set.push(k); }); });
        cols = set.length ? set : ['nilai'];
        if (!set.length) rows = rows.map((v) => ({ nilai: v }));
      } else if (data && typeof data === 'object') {
        cols = ['kunci', 'nilai'];
        rows = Object.keys(data).map((k) => ({ kunci: k, nilai: data[k] }));
      } else { T.show(box, errBox('Butuh JSON object atau array.')); return; }
      const cell = (v) => (v && typeof v === 'object') ? esc(JSON.stringify(v)) : esc(String(v == null ? '' : v));
      const td = 'padding:8px 10px;border:1px solid #27272a;font-size:13px;vertical-align:top';
      const th = td + ';background:#18181b;font-weight:600;text-align:left;position:sticky;top:0';
      let html = '<div style="overflow-x:auto;border-radius:8px"><table style="border-collapse:collapse;min-width:100%;white-space:nowrap"><thead><tr>' +
        cols.map((c) => '<th style="' + th + '">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + cols.map((c) => '<td style="' + td + '">' + cell(r[c]) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div><div class="hint" style="margin-top:8px">' + rows.length + ' baris · ' + cols.length + ' kolom</div>';
      T.show(box, html);
    }, true)));
    root.appendChild(box);
  
}
