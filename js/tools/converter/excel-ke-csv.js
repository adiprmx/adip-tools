import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "excel-ke-csv", "name": "Excel ke CSV", "cat": "converter", "icon": "📋", "desc": "Ubah spreadsheet Excel jadi file CSV.", "keywords": "excel,xlsx,csv,spreadsheet,tabel,konversi", "since": "6.17.0"};

// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js
// (terverifikasi identik dari 3 sumber).
const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];

export function render(root) {
  const fi = T.input('file');
  fi.accept = '.xlsx,.xls,.xlsm,.xlsb,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const sheetSel = T.select([], '');
  const sheetWrap = T.el('<div></div>');
  sheetWrap.hidden = true;
  sheetWrap.appendChild(T.field('Lembar yang diubah', sheetSel));
  const delimSel = T.select([
    [',', 'Koma (,)'],
    [';', 'Titik koma (;)'],
  ], ',');
  const box = T.out();
  const prevBox = T.out();

  let xlsxSiap = null;
  const muatXlsx = () => {
    if (!xlsxSiap) {
      xlsxSiap = (async () => {
        if (typeof window.XLSX !== 'undefined') return true;
        for (const u of XLSX_CDNS) {
          const ok = await T.loadScript(u);
          if (ok && typeof window.XLSX !== 'undefined') return true;
        }
        return false;
      })().catch(() => { xlsxSiap = null; return false; });
    }
    return xlsxSiap;
  };

  let fileObj = null;
  let workbook = null;
  let busy = false;

  fi.addEventListener('change', async () => {
    fileObj = fi.files && fi.files[0] ? fi.files[0] : null;
    workbook = null;
    sheetWrap.hidden = true;
    T.hide(box); T.hide(prevBox);
    if (!fileObj) return;
    T.show(box, '<span class="dim">Membaca spreadsheet…</span>');
    const ok = await muatXlsx();
    if (!ok) { T.show(box, errBox('Alat spreadsheet tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.')); return; }
    try {
      const data = new Uint8Array(await fileObj.arrayBuffer());
      workbook = window.XLSX.read(data, { type: 'array' });
      const names = workbook.SheetNames || [];
      if (!names.length) { T.show(box, errBox('Spreadsheet ini tidak punya lembar apa-apa.')); return; }
      while (sheetSel.options.length) sheetSel.remove(0);
      names.forEach((n) => {
        const o = document.createElement('option');
        o.value = n; o.textContent = n;
        sheetSel.appendChild(o);
      });
      sheetWrap.hidden = names.length < 2;
      const ws = workbook.Sheets[names[0]];
      const range = window.XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      T.show(box, kv('File', T.esc(fileObj.name)) +
        kv('Lembar', names.length + ' lembar') +
        kv('Baris', (range.e.r + 1) + ' baris') +
        kv('Kolom', (range.e.c + 1) + ' kolom'));
    } catch (e) {
      workbook = null;
      T.show(box, errBox('File ini bukan spreadsheet yang benar, atau filenya rusak.'));
    }
  });

  const goBtn = T.btn('Ubah jadi CSV', async () => {
    if (busy) return;
    if (!workbook) { T.show(box, errBox('Pilih dulu file spreadsheetnya.')); return; }
    busy = true;
    goBtn.disabled = true;
    try {
      const namaSheet = sheetSel.value || workbook.SheetNames[0];
      const ws = workbook.Sheets[namaSheet];
      const csv = window.XLSX.utils.sheet_to_csv(ws, { FS: delimSel.value, RS: '\n' });
      if (!csv.trim()) { T.show(box, errBox('Lembar ini kosong, tidak ada yang bisa diubah.')); return; }
      // BOM UTF-8 supaya Excel Windows membuka huruf Indonesia dengan benar.
      const blob = new Blob([String.fromCharCode(0xfeff) + csv], { type: 'text/csv;charset=utf-8' });
      const nama = fileObj.name.replace(/\.[^.]+$/, '') || 'data';
      T.dl(nama + '.csv', blob, 'text/csv;charset=utf-8');
      const jumlahBaris = csv.split('\n').filter((l) => l.trim() !== '').length;
      T.show(box, '<span class="ok">Selesai. File CSV terunduh.</span>' +
        kv('Lembar', T.esc(namaSheet)) +
        kv('Baris', jumlahBaris + ' baris') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      T.show(prevBox, '<p class="hint">Pratinjau baris awal:</p><pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;max-height:160px;overflow:auto"></pre>');
      prevBox.querySelector('pre').textContent = csv.split('\n').slice(0, 5).join('\n');
      T.toast('File CSV terunduh');
    } catch (e) {
      T.show(box, errBox('Spreadsheet tidak bisa diubah. Coba lagi.'));
      const retry = T.btn('Coba lagi', () => goBtn.click());
      box.appendChild(retry);
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah satu lembar spreadsheet jadi file CSV. Bila spreadsheet punya banyak lembar, pilih dulu lembar yang mau diubah.</p>'));
  root.appendChild(T.field('Pilih file spreadsheet', fi, 'Excel (.xlsx, .xls) dan ODS.'));
  root.appendChild(sheetWrap);
  root.appendChild(T.field('Pemisah kolom', delimSel, 'Untuk dibuka di Excel Indonesia, titik koma biasanya lebih cocok.'));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
