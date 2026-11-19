import { h as T, errBox, fileInput, utils } from '../../core.js';

// Parser CSV yang benar: dukung quote, koma di dalam field, quote ganda,
// newline di dalam field. (Pola yang sama seperti csv-json.js.)
// parseCSV, detectDelim, csvCell, rowsToCSV kanonis tinggal di utils (core.js).

// Bagi baris jadi beberapa bagian. Baris pertama dianggap judul bila
// keepHeader true: judul diulang di tiap bagian, tidak dihitung sebagai data.
export function splitCsvRows(rows, perPart, keepHeader) {
  const per = Math.max(1, Math.floor(perPart) || 1);
  const head = keepHeader && rows.length ? rows[0] : null;
  const data = head ? rows.slice(1) : rows;
  const parts = [];
  for (let i = 0; i < data.length; i += per) {
    const chunk = data.slice(i, i + per);
    parts.push(head ? [head].concat(chunk) : chunk);
  }
  return { parts, dataRows: data.length, header: head };
}

export const meta = {"id": "pembelah-csv", "name": "Pembelah CSV", "cat": "converter", "icon": "✂️", "desc": "Pecah file CSV besar jadi beberapa file yang lebih kecil.", "keywords": "csv,split,pecah,bagi file,besar,chunk", "since": "6.18.0"};
export function render(root) {

    const ta = T.ta(8, 'Tempel CSV di sini…');
    const fileI = fileInput('.csv,.txt,text/csv');
    const perInp = T.input('number', 'Baris data per file', 1000);
    const headSel = T.select([['1', 'Ya, ulangi judul di tiap file'], ['0', 'Tidak, file pertama saja yang punya judul']], '1');
    const box = T.out();
    let parts = [], delim = ',', baseName = 'bagian';

    const belah = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, errBox('Tempel dulu isi CSV-nya atau pilih file.')); return; }
      const per = Math.floor(Number(perInp.value));
      if (!Number.isFinite(per) || per < 1) { T.show(box, errBox('Isi jumlah baris per file dengan angka 1 atau lebih.')); return; }
      delim = utils.detectDelim(src);
      const rows = utils.parseCSV(src, delim).filter((r) => r.some((c) => String(c).trim() !== ''));
      if (!rows.length) { T.show(box, errBox('CSV-nya kosong.')); return; }
      const r = splitCsvRows(rows, per, headSel.value === '1');
      parts = r.parts;
      if (!parts.length) { T.show(box, errBox('Tidak ada baris data untuk dibelah.')); return; }
      let html = '<div class="kv"><span class="k">Baris data</span><span class="v">' + r.dataRows + '</span></div>' +
        '<div class="kv"><span class="k">Jadi file</span><span class="v big">' + parts.length + '</span></div>' +
        '<div class="kv"><span class="k">Pemisah terbaca</span><span class="v">' + (delim === ';' ? 'titik koma (;)' : 'koma (,)') + '</span></div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">' +
        parts.map((p, i) => '<button type="button" class="btn" data-part="' + i + '">' + T.esc(baseName) + '-' + (i + 1) + '.csv (' + (headSel.value === '1' ? p.length - 1 : p.length) + ' baris)</button>').join('') +
        '</div>';
      T.show(box, html);
      box.querySelectorAll('button[data-part]').forEach((b) => {
        b.addEventListener('click', () => {
          const i = +b.getAttribute('data-part');
          T.dl(baseName + '-' + (i + 1) + '.csv', utils.rowsToCSV(parts[i], delim), 'text/csv;charset=utf-8');
        });
      });
      box.appendChild(T.row(
        T.zipBtn(baseName + '-semua.zip', () => parts.map((p, i) => ({ name: baseName + '-' + (i + 1) + '.csv', data: utils.rowsToCSV(p, delim) })), 'Unduh semua (ZIP)')
      ));
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      baseName = f.name.replace(/\.csv$/i, '') || 'bagian';
      ta.value = await f.text();
      belah();
    });

    root.appendChild(T.field('Pilih file CSV (opsional)', fileI));
    root.appendChild(T.field('Isi CSV', ta));
    root.appendChild(T.grid2(
      T.field('Baris data per file', perInp),
      T.field('Baris judul diulang?', headSel)
    ));
    root.appendChild(T.row(T.btn('Belah', belah, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Baris pertama dianggap judul kolom. Tiap file hasil bisa diunduh satu per satu, atau semuanya sekaligus dalam satu ZIP.</div>'));

}
