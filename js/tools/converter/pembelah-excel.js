import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "pembelah-excel", "name": "Pembelah Excel", "cat": "converter", "icon": "✂️", "desc": "Pecah file Excel per lembar atau per sejumlah baris.", "keywords": "excel,xlsx,pecah,split,lembar,baris,spreadsheet", "since": "6.19.0"};

// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js.
const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];

// Bagi larik baris jadi beberapa bagian. Bila keepHeader, baris pertama
// diulang di tiap bagian dan tidak dihitung sebagai data. Fungsi murni.
export function bagiBarisExcel(baris, perBagian, keepHeader) {
  const per = Math.max(1, Math.floor(perBagian) || 1);
  const head = keepHeader && baris.length ? baris[0] : null;
  const data = head ? baris.slice(1) : baris;
  const parts = [];
  for (let i = 0; i < data.length; i += per) {
    const chunk = data.slice(i, i + per);
    parts.push(head ? [head].concat(chunk) : chunk);
  }
  return { parts, dataRows: data.length };
}

export function render(root) {
  const fi = T.input('file');
  fi.accept = '.xlsx,.xls,.xlsm,.xlsb,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const modeSel = T.select([
    ['lembar', 'Per lembar: tiap lembar jadi satu file'],
    ['baris', 'Per baris: satu lembar dibelah per sejumlah baris'],
  ], 'lembar');
  const sheetSel = T.select([], '');
  const sheetWrap = T.el('<div></div>');
  sheetWrap.hidden = true;
  sheetWrap.appendChild(T.field('Lembar yang dibelah', sheetSel));
  const perIn = T.input('text', 'cth: 1000', '1000'); perIn.inputMode = 'numeric';
  const headSel = T.select([['1', 'Ya, ulangi judul di tiap file'], ['0', 'Tidak, file pertama saja yang punya judul']], '1');
  const barisWrap = T.el('<div></div>');
  barisWrap.hidden = true;
  barisWrap.appendChild(T.grid2(T.field('Baris data per file', perIn), T.field('Ulangi baris judul', headSel)));
  const box = T.out();

  // Loader library kanonis: utils.loadLibOnce (core.js).

  let fileObj = null, workbook = null, busy = false;

  const refreshMode = () => {
    const perBaris = modeSel.value === 'baris';
    barisWrap.hidden = !perBaris;
    sheetWrap.hidden = !perBaris || !workbook || workbook.SheetNames.length < 2;
  };
  modeSel.addEventListener('change', refreshMode);

  fi.addEventListener('change', async () => {
    fileObj = fi.files && fi.files[0] ? fi.files[0] : null;
    workbook = null;
    T.hide(box);
    if (!fileObj) return;
    T.show(box, '<span class="dim">Membaca spreadsheet…</span>');
    const ok = await utils.loadLibOnce(XLSX_CDNS, () => typeof window.XLSX !== 'undefined');
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
      const rincian = names.map((n) => {
        const ws = workbook.Sheets[n];
        const range = window.XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
        return T.esc(n) + ' (' + (range.e.r + 1) + ' baris)';
      }).join(', ');
      T.show(box,
        kv('File', T.esc(fileObj.name)) +
        kv('Lembar', names.length + ' lembar: ' + rincian) +
        kv('Ukuran', fmtBytes(fileObj.size)));
      refreshMode();
    } catch (e) {
      workbook = null;
      T.show(box, errBox('File ini bukan spreadsheet yang benar, atau filenya rusak.'));
    }
  });

  const belah = () => {
    if (busy) return;
    if (!workbook) { T.show(box, errBox('Pilih dulu file spreadsheetnya.')); return; }
    busy = true;
    goBtn.disabled = true;
    try {
      const XLSX = window.XLSX;
      const base = fileObj.name.replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'data';
      const hasil = [];
      if (modeSel.value === 'lembar') {
        workbook.SheetNames.forEach((nama) => {
          const wbBaru = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wbBaru, workbook.Sheets[nama], nama);
          const buf = XLSX.write(wbBaru, { bookType: 'xlsx', type: 'array' });
          hasil.push({ name: base + '-' + nama.replace(/[^\w\- ]+/g, '').trim() + '.xlsx', data: new Uint8Array(buf) });
        });
      } else {
        const namaSheet = sheetSel.value || workbook.SheetNames[0];
        const ws = workbook.Sheets[namaSheet];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
        const dataRows = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
        if (!dataRows.length) { T.show(box, errBox('Lembar ini kosong, tidak ada yang bisa dibelah.')); return; }
        const per = Math.floor(Number(perIn.value));
        if (!Number.isFinite(per) || per < 1) { T.show(box, errBox('Isi jumlah baris per file dengan angka 1 atau lebih.')); return; }
        const r = bagiBarisExcel(dataRows, per, headSel.value === '1');
        if (r.parts.length > 200) { T.show(box, errBox('Hasilnya ' + r.parts.length + ' file, terlalu banyak. Naikkan jumlah baris per file.')); return; }
        r.parts.forEach((part, i) => {
          const wbBaru = XLSX.utils.book_new();
          const wsBaru = XLSX.utils.aoa_to_sheet(part);
          XLSX.utils.book_append_sheet(wbBaru, wsBaru, namaSheet.slice(0, 31));
          const buf = XLSX.write(wbBaru, { bookType: 'xlsx', type: 'array' });
          hasil.push({ name: base + '-bagian-' + (i + 1) + '.xlsx', data: new Uint8Array(buf) });
        });
      }
      if (!hasil.length) { T.show(box, errBox('Tidak ada file yang dihasilkan.')); return; }
      const daftar = hasil.map((h, i) =>
        '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #27272a">' +
        '<span style="flex:1;line-height:1.5;word-break:break-all">' + T.esc(h.name) + ' <span class="dim">(' + fmtBytes(h.data.length) + ')</span></span>' +
        '<button type="button" class="btn" data-file="' + i + '" style="flex:none">Unduh</button></div>').join('');
      T.show(box, '<span class="ok">Selesai. Jadi ' + hasil.length + ' file Excel.</span>' + daftar);
      box.querySelectorAll('button[data-file]').forEach((b) => {
        b.addEventListener('click', () => {
          const h = hasil[Number(b.dataset.file)];
          T.dl(h.name, new Blob([h.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        });
      });
      if (hasil.length > 1) box.appendChild(T.row(T.zipBtn(base + '-terbelah.zip', () => hasil, 'Unduh semua (ZIP)')));
      T.toast(hasil.length + ' file siap');
    } catch (e) {
      T.show(box, errBox('Spreadsheet tidak bisa dibelah. Coba lagi.'));
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  };

  const goBtn = T.btn('Belah Excel', belah, true);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Pecah file Excel jadi beberapa file: tiap lembar dipisah, atau satu lembar dibelah per sejumlah baris. Isi sel dipertahankan, format warna dan rumus tidak ikut.</p>'));
  root.appendChild(T.field('Pilih file spreadsheet', fi, 'Excel (.xlsx, .xls) dan ODS.'));
  root.appendChild(T.field('Cara membelah', modeSel));
  root.appendChild(sheetWrap);
  root.appendChild(barisWrap);
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}
