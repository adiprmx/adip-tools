import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "excel-ke-json", "name": "Excel ke JSON", "cat": "converter", "icon": "🧾", "desc": "Ubah spreadsheet Excel jadi data JSON.", "keywords": "excel,xlsx,json,data,spreadsheet,konversi", "since": "6.17.0"};

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
  const headSel = T.select([
    ['1', 'Baris pertama adalah nama kolom'],
    ['0', 'Tanpa nama kolom (hasilnya daftar baris)'],
  ], '1');
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
  let lastJson = '';
  let busy = false;

  fi.addEventListener('change', async () => {
    fileObj = fi.files && fi.files[0] ? fi.files[0] : null;
    workbook = null;
    lastJson = '';
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
      T.show(box, kv('File', T.esc(fileObj.name)) + kv('Lembar', names.length + ' lembar'));
    } catch (e) {
      workbook = null;
      T.show(box, errBox('File ini bukan spreadsheet yang benar, atau filenya rusak.'));
    }
  });

  const goBtn = T.btn('Ubah jadi JSON', async () => {
    if (busy) return;
    if (!workbook) { T.show(box, errBox('Pilih dulu file spreadsheetnya.')); return; }
    busy = true;
    goBtn.disabled = true;
    try {
      const namaSheet = sheetSel.value || workbook.SheetNames[0];
      const ws = workbook.Sheets[namaSheet];
      const pakaiHeader = headSel.value === '1';
      const data = pakaiHeader
        ? window.XLSX.utils.sheet_to_json(ws, { defval: '' })
        : window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!data.length) { T.show(box, errBox('Lembar ini kosong, tidak ada yang bisa diubah.')); return; }
      lastJson = JSON.stringify(data, null, 2);
      const blob = new Blob([lastJson], { type: 'application/json;charset=utf-8' });
      const nama = fileObj.name.replace(/\.[^.]+$/, '') || 'data';
      T.dl(nama + '.json', blob, 'application/json;charset=utf-8');
      T.show(box, '<span class="ok">Selesai. File JSON terunduh.</span>' +
        kv('Lembar', T.esc(namaSheet)) +
        kv('Baris data', data.length + ' baris') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      box.appendChild(T.row(T.copyBtn(() => lastJson, 'Salin JSON')));
      T.show(prevBox, '<p class="hint">Pratinjau:</p><pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;max-height:260px;overflow:auto"></pre>');
      prevBox.querySelector('pre').textContent = lastJson.slice(0, 4000) + (lastJson.length > 4000 ? '\n…(dipotong, unduh file untuk melihat semua)' : '');
      T.toast('File JSON terunduh');
    } catch (e) {
      T.show(box, errBox('Spreadsheet tidak bisa diubah. Coba lagi.'));
      const retry = T.btn('Coba lagi', () => goBtn.click());
      box.appendChild(retry);
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah satu lembar spreadsheet jadi data JSON, siap dipakai di aplikasi atau diolah lebih lanjut. Baris pertama biasanya berisi nama kolom.</p>'));
  root.appendChild(T.field('Pilih file spreadsheet', fi, 'Excel (.xlsx, .xls) dan ODS.'));
  root.appendChild(sheetWrap);
  root.appendChild(T.field('Baris pertama', headSel));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
