import { h as T, kv, errBox, esc } from '../../core.js?v=6.11.5';

// Daftar (satu baris satu item) -> CSV / JSON / SQL / bullet / markdown.
// Opsi: buang baris kosong, buang duplikat, urutkan abjad.
function parseList(raw, opts) {
  let items = String(raw || '').split(/\r?\n/).map((s) => s.trim());
  if (opts.empty) items = items.filter((s) => s !== '');
  if (opts.dedup) items = [...new Set(items)];
  if (opts.sort) items = [...items].sort((a, b) => a.localeCompare(b, 'id'));
  return items;
}

function csvCell(s) {
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toCsv(items) { return items.map(csvCell).join(','); }
function toCsvLines(items) { return items.map(csvCell).join('\n'); }
function toJson(items) { return JSON.stringify(items, null, 2); }
function toJsonCompact(items) { return JSON.stringify(items); }
function sqlQuote(s) { return "'" + s.replace(/'/g, "''") + "'"; }
function toSqlIn(items) { return 'IN (' + items.map(sqlQuote).join(', ') + ')'; }
function toSqlValues(items) { return items.map((s) => '(' + sqlQuote(s) + '),').join('\n').replace(/,$/, ';'); }
function toBullets(items) { return items.map((s) => '- ' + s).join('\n'); }
function toNumbered(items) { return items.map((s, i) => (i + 1) + '. ' + s).join('\n'); }
function toMdTable(items) {
  return '| Item |\n| --- |\n' + items.map((s) => '| ' + s.replace(/\|/g, '\\|') + ' |').join('\n');
}

export const meta = {"id": "list-converter", "name": "List Converter", "cat": "developer", "icon": "📋", "desc": "Ubah daftar jadi CSV, JSON, SQL, atau markdown.", "keywords": "list,daftar,csv,json,sql,markdown,konversi", "since": "6.11.0"};
export function render(root) {

    const inp = T.ta(7, 'Satu baris satu item.\nContoh:\napel\njeruk\nmangga');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const mkChk = (label, checked) => {
      const l = T.el('<label class="pick"><input type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px"> <span>' + T.esc(label) + '</span></label>');
      return { el: l, box: l.querySelector('input') };
    };
    const cEmpty = mkChk('Buang baris kosong', true);
    const cDedup = mkChk('Buang duplikat', false);
    const cSort = mkChk('Urutkan abjad', false);
    const fmtSel = T.select([
      ['csv', 'CSV satu baris'],
      ['csvlines', 'CSV per baris'],
      ['json', 'JSON (rapi)'],
      ['jsoncompact', 'JSON (rapat)'],
      ['sqlin', 'SQL IN (...)'],
      ['sqlvalues', 'SQL VALUES (...)'],
      ['bullets', 'Bullet markdown'],
      ['numbered', 'Nomor markdown'],
      ['mdtable', 'Tabel markdown'],
    ], 'csv');
    const out = T.out();
    let lastResult = '';

    const run = () => {
      const opts = { empty: cEmpty.box.checked, dedup: cDedup.box.checked, sort: cSort.box.checked };
      const items = parseList(inp.value, opts);
      if (!items.length) { lastResult = ''; T.show(out, errBox('Daftarnya masih kosong. Tulis dulu satu item per baris.')); return; }
      const fns = { csv: toCsv, csvlines: toCsvLines, json: toJson, jsoncompact: toJsonCompact, sqlin: toSqlIn, sqlvalues: toSqlValues, bullets: toBullets, numbered: toNumbered, mdtable: toMdTable };
      lastResult = fns[fmtSel.value](items);
      T.show(out,
        '<div class="hint" style="margin-bottom:8px">' + items.length + ' item' + (opts.dedup ? ' (duplikat sudah dibuang)' : '') + '.</div>' +
        '<pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.5;overflow-x:auto">' + esc(lastResult) + '</pre>');
    };

    root.appendChild(T.field('Daftar', inp, 'Satu baris satu item. Spasi di ujung baris dibuang otomatis.'));
    root.appendChild(T.grid2(cEmpty.el, cDedup.el, cSort.el));
    root.appendChild(T.field('Format hasil', fmtSel));
    root.appendChild(T.row(T.btn('Ubah', run, true), T.copyBtn(() => lastResult, 'Salin Hasil'), T.dlBtn('daftar.txt', () => lastResult, 'text/plain', 'Unduh')));
    root.appendChild(out);
  
}
