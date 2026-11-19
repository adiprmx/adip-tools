import { h as T, fileInput, utils } from '../../core.js';

// Parser CSV yang benar: dukung quote, koma di dalam field, quote ganda, newline di dalam field.
// parseCSV, detectDelim, csvCell, rowsToCSV kanonis tinggal di utils (core.js).

export const meta = {"id": "csv-json", "name": "CSV ↔ JSON", "cat": "converter", "icon": "🔄", "desc": "Konversi CSV ke JSON dan sebaliknya.", "keywords": "csv,json,konversi,data,spreadsheet,excel"};
export function render(root) {

    const mode = T.select([['auto', 'Otomatis (deteksi)'], ['c2j', 'CSV → JSON'], ['j2c', 'JSON → CSV']], 'auto');
    const delim = T.select([['auto', 'Otomatis (, atau ;)'], [',', 'Koma (,)'], [';', 'Titik koma (;)']], 'auto');
    const head = T.select([['1', 'Baris pertama = nama kolom'], ['0', 'Tanpa nama kolom (kolom: col1, col2, …)']], '1');
    const ta = T.ta(10, 'Tempel CSV atau JSON di sini…');
    const fileI = fileInput('.csv,.json,.txt,text/csv,application/json');
    const box = T.out();
    let lastOut = '', lastName = 'hasil.txt', lastMime = 'text/plain';

    const konversi = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, '<p class="warn">Tempel dulu datanya atau pilih file.</p>'); return; }
      let m = mode.value;
      if (m === 'auto') m = /^[[{]/.test(src) ? 'j2c' : 'c2j';
      try {
        if (m === 'c2j') {
          const d = delim.value === 'auto' ? utils.detectDelim(src) : delim.value;
          const rows = utils.parseCSV(src, d).filter((r) => r.some((c) => c !== ''));
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
            '<div class="kv"><span>Pemisah yang terdeteksi</span><b>' + (d === ';' ? 'titik koma (;)' : 'koma (,)') + '</b></div>' +
            '<pre style="max-height:260px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px;user-select:all">' + T.esc(lastOut.slice(0, 4000)) + (lastOut.length > 4000 ? '\n…(dipotong, unduh untuk melihat semua)' : '') + '</pre>');
        } else {
          const data = JSON.parse(src);
          const arr = Array.isArray(data) ? data : [data];
          if (!arr.length || typeof arr[0] !== 'object') throw new Error('JSON harus berupa daftar objek');
          const keys = [];
          for (const o of arr) for (const k of Object.keys(o)) if (!keys.includes(k)) keys.push(k);
          const d = delim.value === 'auto' ? ',' : delim.value;
          const rows = [keys, ...arr.map((o) => keys.map((k) => o[k]))];
          lastOut = utils.rowsToCSV(rows, d);
          lastName = 'hasil.csv'; lastMime = 'text/csv';
          T.show(box,
            '<div class="kv"><span>Baris data</span><b>' + arr.length + '</b></div>' +
            '<div class="kv"><span>Kolom</span><b>' + keys.length + '</b></div>' +
            '<pre style="max-height:260px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px;user-select:all">' + T.esc(lastOut.slice(0, 4000)) + (lastOut.length > 4000 ? '\n…(dipotong, unduh untuk melihat semua)' : '') + '</pre>');
        }
        box.appendChild(T.row(
          T.copyBtn(() => lastOut, 'Salin hasil'),
          T.btn('Unduh file', () => T.dl(lastName, lastOut, lastMime + ';charset=utf-8'))
        ));
      } catch (e) {
        const m = (e && e.message) || '';
        const ramah = (m === 'CSV kosong' || m === 'JSON harus berupa daftar objek') ? m : 'Format datanya tidak benar. Periksa lagi isinya lalu coba lagi.';
        T.show(box, '<p class="warn">Tidak bisa diubah: ' + T.esc(ramah) + '</p>');
      }
    };

    fileI.addEventListener('change', () => {
      const f = fileI.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { ta.value = String(rd.result || ''); konversi(); };
      rd.readAsText(f);
    });

    root.appendChild(T.field('Pilih file (opsional)', fileI));
    root.appendChild(T.grid2(
      T.field('Arah konversi', mode),
      T.field('Pemisah CSV', delim)
    ));
    root.appendChild(T.field('Baris pertama', head));
    root.appendChild(T.field('Data', ta));
    root.appendChild(T.row(T.btn('Konversi', konversi, true)));
    root.appendChild(box);

}
