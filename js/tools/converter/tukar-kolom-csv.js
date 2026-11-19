import { h as T, errBox, fileInput, utils } from '../../core.js';

// Parser CSV yang benar: dukung quote, koma di dalam field, quote ganda,
// newline di dalam field. (Pola yang sama seperti csv-json.js.)
// parseCSV, detectDelim, csvCell, rowsToCSV kanonis tinggal di utils (core.js).

// Tukar posisi dua kolom (indeks 0-based) di semua baris.
export function swapColumns(rows, a, b) {
  if (a === b) return rows.map((r) => r.slice());
  return rows.map((r) => {
    const out = r.slice();
    const va = out[a] !== undefined ? out[a] : '';
    const vb = out[b] !== undefined ? out[b] : '';
    out[a] = vb; out[b] = va;
    return out;
  });
}

export const meta = {"id": "tukar-kolom-csv", "name": "Tukar Kolom CSV", "cat": "converter", "icon": "⇄", "desc": "Tukar posisi dua kolom dalam file CSV.", "keywords": "csv,kolom,tukar,swap,posisi,spreadsheet", "since": "6.18.0"};
export function render(root) {

    const ta = T.ta(8, 'Tempel CSV di sini…\nContoh:\nnama,umur,kota\nBudi,28,Jakarta');
    const fileI = fileInput('.csv,.txt,text/csv');
    const selA = T.select([], '0');
    const selB = T.select([], '1');
    const box = T.out();
    let rows = null, delim = ',', lastOut = '';

    const refreshCols = () => {
      const h = rows ? rows[0] : [];
      const opts = h.map((c, i) => [String(i), (String(c || '').trim() || ('Kolom ' + (i + 1))) + ' (kolom ' + (i + 1) + ')']);
      for (const s of [selA, selB]) {
        const keep = s.value;
        s.innerHTML = '';
        s.options.length = 0;
        for (const [v, l] of opts) {
          const o = document.createElement('option');
          o.value = v; o.textContent = l;
          s.appendChild(o);
        }
        s.value = keep;
      }
      if (selA.value === '') selA.value = '0';
      if (selB.value === '') selB.value = opts.length > 1 ? '1' : '0';
    };

    const muat = () => {
      const src = ta.value.trim();
      if (!src) { rows = null; T.show(box, errBox('Tempel dulu isi CSV-nya atau pilih file.')); return false; }
      delim = utils.detectDelim(src);
      rows = utils.parseCSV(src, delim).filter((r) => r.some((c) => String(c).trim() !== ''));
      if (!rows.length || rows[0].length < 2) { rows = null; T.show(box, errBox('CSV-nya perlu minimal 2 kolom untuk ditukar.')); return false; }
      refreshCols();
      T.show(box, '<span class="dim">Terbaca ' + rows.length + ' baris, ' + rows[0].length + ' kolom. Pilih dua kolomnya, lalu tekan Tukar.</span>');
      return true;
    };

    const tukar = () => {
      if (!rows && !muat()) return;
      const a = +selA.value, b = +selB.value;
      if (a === b) { T.show(box, errBox('Pilih dua kolom yang berbeda.')); return; }
      const swapped = swapColumns(rows, a, b);
      lastOut = utils.rowsToCSV(swapped, delim);
      const preview = swapped.slice(0, 6).map((r) => r.join(delim)).join('\n');
      T.show(box,
        '<div class="kv"><span class="k">Kolom ditukar</span><span class="v">' + T.esc(String(rows[0][a])) + ' ⇄ ' + T.esc(String(rows[0][b])) + '</span></div>' +
        '<pre style="max-height:180px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px">' + T.esc(preview) + (swapped.length > 6 ? '\n…' : '') + '</pre>');
      box.appendChild(T.row(
        T.copyBtn(() => lastOut, 'Salin hasil'),
        T.btn('Unduh CSV', () => T.dl('csv-tukar-kolom.csv', lastOut, 'text/csv;charset=utf-8'))
      ));
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      ta.value = await f.text();
      muat();
    });

    root.appendChild(T.field('Pilih file CSV (opsional)', fileI));
    root.appendChild(T.field('Isi CSV', ta));
    root.appendChild(T.row(T.btn('Baca CSV', muat, true)));
    root.appendChild(T.grid2(T.field('Kolom pertama', selA), T.field('Kolom kedua', selB)));
    root.appendChild(T.row(T.btn('Tukar', tukar, true)));
    root.appendChild(box);

}
