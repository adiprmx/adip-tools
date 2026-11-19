import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "csv-ke-excel", "name": "CSV ke Excel", "cat": "converter", "icon": "📊", "desc": "Ubah file CSV jadi spreadsheet Excel.", "keywords": "csv,excel,xlsx,spreadsheet,tabel,konversi", "since": "6.17.0"};

// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js
// (terverifikasi identik dari 3 sumber).
const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];

// Parser CSV yang benar: dukung tanda kutip, koma di dalam field, kutip
// ganda, dan baris baru di dalam field. Murni, bisa diuji di Node.
export function uraiCsv(teks, pemisah) {
  const delim = pemisah || ',';
  const baris = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (q) {
      if (c === '"') {
        if (teks[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); baris.push(row); row = []; field = ''; }
    else if (c === '\r') { /* abaikan, \n yang menangani */ }
    else field += c;
  }
  row.push(field); baris.push(row);
  while (baris.length && baris[baris.length - 1].length === 1 && baris[baris.length - 1][0] === '') baris.pop();
  return baris;
}

export function tebakPemisah(teks) {
  const pertama = (teks.split('\n')[0] || '');
  const nSemi = (pertama.match(/;/g) || []).length;
  const nCom = (pertama.match(/,/g) || []).length;
  const nTab = (pertama.match(/\t/g) || []).length;
  if (nTab > nSemi && nTab > nCom) return '\t';
  return nSemi > nCom ? ';' : ',';
}

// Sel yang tampak seperti angka diubah jadi angka supaya Excel bisa
// menghitungnya. Kode berawalan nol ("001") tetap teks supaya nolnya utuh.
export function nilaiSel(v, isHeader) {
  const s = String(v == null ? '' : v);
  if (isHeader || s === '') return s;
  // Spasi di sekeliling angka diabaikan saat dites sebagai angka, tapi
  // nilai teks lain dikembalikan apa adanya.
  const t = s.trim();
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(t)) {
    const n = Number(t);
    if (Number.isFinite(n)) return n;
  }
  return s;
}

export function render(root) {
  const fi = T.input('file');
  fi.accept = '.csv,.txt,text/csv,text/plain';
  const delimSel = T.select([
    ['auto', 'Otomatis (koma atau titik koma)'],
    [',', 'Koma (,)'],
    [';', 'Titik koma (;)'],
  ], 'auto');
  const box = T.out();
  const prevBox = T.out();

  // Loader library kanonis: utils.loadLibOnce (core.js).

  let fileObj = null;
  let busy = false;
  fi.addEventListener('change', () => {
    fileObj = fi.files && fi.files[0] ? fi.files[0] : null;
    T.hide(box); T.hide(prevBox);
  });

  const goBtn = T.btn('Ubah jadi Excel', async () => {
    if (busy) return;
    if (!fileObj) { T.show(box, errBox('Pilih dulu file CSV-nya.')); return; }
    busy = true;
    goBtn.disabled = true;
    T.show(box, '<span class="dim">Memuat alat spreadsheet…</span>');
    try {
      const ok = await utils.loadLibOnce(XLSX_CDNS, () => typeof window.XLSX !== 'undefined');
      if (!ok) {
        T.show(box, errBox('Alat spreadsheet tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.'));
        return;
      }
      const teks = await fileObj.text();
      if (!teks.trim()) { T.show(box, errBox('File CSV ini kosong.')); return; }
      const delim = delimSel.value === 'auto' ? tebakPemisah(teks) : delimSel.value;
      const rows = uraiCsv(teks, delim).filter((r) => r.some((c) => String(c) !== ''));
      if (!rows.length) { T.show(box, errBox('File CSV ini kosong atau tidak bisa dibaca.')); return; }
      const aoa = rows.map((r, i) => r.map((c) => nilaiSel(c, i === 0)));
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const nama = fileObj.name.replace(/\.[^.]+$/, '') || 'data';
      T.dl(nama + '.xlsx', blob, blob.type);
      const kolom = Math.max(...rows.map((r) => r.length));
      T.show(box, '<span class="ok">Selesai. File Excel terunduh.</span>' +
        kv('Baris data', (rows.length - 1) + ' baris (di luar baris judul)') +
        kv('Kolom', kolom + ' kolom') +
        kv('Pemisah yang dipakai', delim === ';' ? 'titik koma (;)' : 'koma (,)') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      const preview = rows.slice(0, 4).map((r) => r.join(' | ')).join('\n');
      T.show(prevBox, '<p class="hint">Pratinjau baris awal:</p><pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;max-height:160px;overflow:auto"></pre>');
      prevBox.querySelector('pre').textContent = preview;
      T.toast('File Excel terunduh');
    } catch (e) {
      T.show(box, errBox('CSV tidak bisa diubah. Pastikan filenya CSV yang benar.'));
      const retry = T.btn('Coba lagi', () => goBtn.click());
      box.appendChild(retry);
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah file CSV jadi spreadsheet Excel (.xlsx) yang bisa dibuka di Excel, Google Sheets, dan WPS. Baris pertama dianggap judul kolom.</p>'));
  root.appendChild(T.field('Pilih file CSV', fi));
  root.appendChild(T.field('Pemisah kolom', delimSel, 'CSV dari Excel Indonesia biasanya memakai titik koma.'));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
