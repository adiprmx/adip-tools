import { h as T, fileInput } from '../../core.js?v=6.7.0';

// Parser CSV yang benar: dukung quote, koma di dalam field, quote ganda, newline di dalam field.
function parseCSV(text, delim) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* abaikan, \n yang menangani */ }
    else field += c;
  }
  row.push(field); rows.push(row);
  // buang baris kosong di ujung
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
  return rows;
}
function detectDelim(text) {
  const first = text.split('\n')[0] || '';
  const nSemi = (first.match(/;/g) || []).length, nCom = (first.match(/,/g) || []).length;
  return nSemi > nCom ? ';' : ',';
}
function csvCell(v, delim) {
  v = String(v == null ? '' : v);
  return /["\n\r]/.test(v) || v.includes(delim) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function rowsToCSV(rows, delim) {
  return rows.map((r) => r.map((c) => csvCell(c, delim)).join(delim)).join('\n');
}

export const meta = {"id": "csv-json", "name": "CSV ↔ JSON", "cat": "converter", "icon": "🔄", "desc": "Konversi CSV ke JSON dan sebaliknya.", "keywords": "csv,json,konversi,data,spreadsheet,excel"};
export function render(root) {

    const mode = T.select([['auto', 'Otomatis (deteksi)'], ['c2j', 'CSV → JSON'], ['j2c', 'JSON → CSV']], 'auto');
    const delim = T.select([['auto', 'Otomatis (, atau ;)'], [',', 'Koma (,)'], [';', 'Titik koma (;)']], 'auto');
    const head = T.select([['1', 'Baris pertama = header'], ['0', 'Tanpa header (kolom: col1, col2, …)']], '1');
    const ta = T.ta(10, 'Paste CSV atau JSON di sini…');
    const fileI = fileInput('.csv,.json,.txt,text/csv,application/json');
    const box = T.out();
    let lastOut = '', lastName = 'hasil.txt', lastMime = 'text/plain';

    const konversi = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, '<p class="warn">Paste dulu datanya atau upload file.</p>'); return; }
      let m = mode.value;
      if (m === 'auto') m = /^[[{]/.test(src) ? 'j2c' : 'c2j';
      try {
        if (m === 'c2j') {
          const d = delim.value === 'auto' ? detectDelim(src) : delim.value;
          const rows = parseCSV(src, d).filter((r) => r.some((c) => c !== ''));
          if (!rows.length) throw new Error('CSV kosong');
          let out;
          if (head.value === '1') {
            const h = rows[0];
            out = rows.slice(1).map((r) => {
              const o = {};
              h.forEach((k, i) => { o[k || ('col' + (i + 1))] = r[i] !== undefined ? r[i] : ''; });
              return o;
            });
          } else {
            out = rows.map((r) => { const o = {}; r.forEach((c, i) => { o['col' + (i + 1)] = c; }); return o; });
          }
          lastOut = JSON.stringify(out, null, 2);
          lastName = 'hasil.json'; lastMime = 'application/json';
          T.show(box,
            '<div class="kv"><span>Baris data</span><b>' + out.length + '</b></div>' +
            '<div class="kv"><span>Delimiter terdeteksi</span><b>' + (d === ';' ? 'titik koma (;)' : 'koma (,)') + '</b></div>' +
            '<pre style="max-height:260px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px;user-select:all">' + T.esc(lastOut.slice(0, 4000)) + (lastOut.length > 4000 ? '\n…(dipotong, unduh untuk full)' : '') + '</pre>');
        } else {
          const data = JSON.parse(src);
          const arr = Array.isArray(data) ? data : [data];
          if (!arr.length || typeof arr[0] !== 'object') throw new Error('JSON harus array of objects');
          const keys = [];
          for (const o of arr) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
          const d = delim.value === 'auto' ? ',' : delim.value;
          const rows = [keys, ...arr.map((o) => keys.map((k) => o[k]))];
          lastOut = rowsToCSV(rows, d);
          lastName = 'hasil.csv'; lastMime = 'text/csv';
          T.show(box,
            '<div class="kv"><span>Baris data</span><b>' + arr.length + '</b></div>' +
            '<div class="kv"><span>Kolom</span><b>' + keys.length + '</b></div>' +
            '<pre style="max-height:260px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px;user-select:all">' + T.esc(lastOut.slice(0, 4000)) + (lastOut.length > 4000 ? '\n…(dipotong, unduh untuk full)' : '') + '</pre>');
        }
        box.appendChild(T.row(
          T.copyBtn(() => lastOut, 'Salin hasil'),
          T.btn('Unduh file', () => T.dl(lastName, lastOut, lastMime + ';charset=utf-8'))
        ));
      } catch (e) {
        T.show(box, '<p class="warn">Gagal konversi: ' + T.esc(e.message) + '</p>');
      }
    };

    fileI.addEventListener('change', () => {
      const f = fileI.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { ta.value = String(rd.result || ''); konversi(); };
      rd.readAsText(f);
    });

    root.appendChild(T.field('Upload file (opsional)', fileI));
    root.appendChild(T.grid2(
      T.field('Arah konversi', mode),
      T.field('Delimiter CSV', delim)
    ));
    root.appendChild(T.field('Header CSV', head));
    root.appendChild(T.field('Data', ta));
    root.appendChild(T.row(T.btn('Konversi', konversi, true)));
    root.appendChild(box);

}
