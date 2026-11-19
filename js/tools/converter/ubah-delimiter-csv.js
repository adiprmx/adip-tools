import { h as T, errBox, fileInput, utils } from '../../core.js';

// Parser CSV yang benar: dukung quote, koma di dalam field, quote ganda,
// newline di dalam field. (Pola yang sama seperti csv-json.js.)
// parseCSV kanonis tinggal di utils (core.js).

export function detectDelim(text) {
  const first = String(text).split('\n')[0] || '';
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  for (const c of first) if (counts[c] !== undefined) counts[c]++;
  let best = ',', bestN = -1;
  for (const d of [',', ';', '\t', '|']) if (counts[d] > bestN) { best = d; bestN = counts[d]; }
  return best;
}

// csvCell, rowsToCSV kanonis tinggal di utils (core.js).

export const DELIM_LABEL = { ',': 'koma (,)', ';': 'titik koma (;)', '\t': 'tab', '|': 'garis tegak (|)' };

export const meta = {"id": "ubah-delimiter-csv", "name": "Ubah Delimiter CSV", "cat": "converter", "icon": "🔣", "desc": "Ubah pemisah kolom CSV, misal koma jadi titik koma.", "keywords": "csv,delimiter,pemisah,koma,titik koma,tab,pipe,separator", "since": "6.18.0"};
export function render(root) {

    const ta = T.ta(8, 'Tempel CSV di sini…\nContoh:\nnama,umur,kota\nBudi,28,Jakarta');
    const fileI = fileInput('.csv,.txt,.tsv,text/csv');
    const dari = T.select([['auto', 'Otomatis (deteksi)'], [',', 'Koma (,)'], [';', 'Titik koma (;)'], ['\t', 'Tab'], ['|', 'Garis tegak (|)']], 'auto');
    const ke = T.select([[',', 'Koma (,)'], [';', 'Titik koma (;)'], ['\t', 'Tab'], ['|', 'Garis tegak (|)']], ';');
    const box = T.out();
    let lastOut = '';

    const ubah = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, errBox('Tempel dulu isi CSV-nya atau pilih file.')); return; }
      const from = dari.value === 'auto' ? detectDelim(src) : dari.value;
      const to = ke.value;
      if (from === to) { T.show(box, errBox('Pemisah asal dan tujuan sama. Pilih pemisah tujuan yang berbeda.')); return; }
      const rows = utils.parseCSV(src, from).filter((r) => r.some((c) => String(c).trim() !== ''));
      if (!rows.length) { T.show(box, errBox('CSV-nya kosong.')); return; }
      lastOut = utils.rowsToCSV(rows, to);
      const preview = lastOut.split('\n').slice(0, 6).join('\n');
      T.show(box,
        '<div class="kv"><span class="k">Pemisah asal</span><span class="v">' + T.esc(DELIM_LABEL[from]) + '</span></div>' +
        '<div class="kv"><span class="k">Pemisah baru</span><span class="v">' + T.esc(DELIM_LABEL[to]) + '</span></div>' +
        '<div class="kv"><span class="k">Baris</span><span class="v">' + rows.length + '</span></div>' +
        '<pre style="max-height:180px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px">' + T.esc(preview) + (rows.length > 6 ? '\n…' : '') + '</pre>');
      box.appendChild(T.row(
        T.copyBtn(() => lastOut, 'Salin hasil'),
        T.btn('Unduh CSV', () => T.dl('csv-delimiter-baru.csv', lastOut, 'text/csv;charset=utf-8'))
      ));
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      ta.value = await f.text();
      ubah();
    });

    root.appendChild(T.field('Pilih file CSV (opsional)', fileI));
    root.appendChild(T.field('Isi CSV', ta));
    root.appendChild(T.grid2(T.field('Pemisah sekarang', dari), T.field('Pemisah tujuan', ke)));
    root.appendChild(T.row(T.btn('Ubah pemisah', ubah, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Isi kolom yang mengandung pemisah baru otomatis dibungkus tanda kutip supaya tidak rusak.</div>'));

}
