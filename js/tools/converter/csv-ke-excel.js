// MERGE B15 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = csv-ke-excel (survivor), arah B = excel-ke-csv (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "csv-ke-excel", "name": "CSV ↔ Excel", "cat": "converter", "icon": "📊", "desc": "Ubah CSV jadi Excel, atau Excel jadi CSV. Pilih arahnya di atas.", "keywords": "csv,excel,xlsx,spreadsheet,tabel,konversi,csv ke excel,excel ke csv", "since": "6.17.0", "online": true};


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

// ---------- Mesin arah B: Excel → CSV (dari excel-ke-csv.js) ----------
// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js
// (terverifikasi identik dari 3 sumber).

// Sakelar arah: dua tombol besar di paling atas. Arah yang aktif tampil
// terbalik (putih di atas hitam) supaya langsung kelihatan tanpa membaca
// kecil-kecil. Kedua panel tetap hidup berdampingan — pindah arah tidak
// menghapus isian di panel yang ditinggalkan.
/* R1 (v6.21.0): alias redirect — kunjungan dari tautan lama arah B
   (#/t/<id-pensiun>) mendarat di sini dengan ?dir=b; buka langsung
   panel arah B. Tanpa ?dir=b, perilaku lama (arah A) tidak berubah. */
function mintaArahB() {
  try {
    const q = (typeof location !== 'undefined' && location.hash.split('?')[1]) || '';
    return /(?:^|&)dir=b(?:&|$)/.test(q);
  } catch {
    return false;
  }
}

function buatSakelarArah(labelA, labelB, panelA, panelB) {
  const bungkus = T.el('<div role="tablist" aria-label="Arah konversi" style="display:flex;gap:8px;margin:2px 0 16px"></div>');
  const GAYA_AKTIF = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff;font-size:15px;font-weight:700;background:#ffffff;color:#000000;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const GAYA_MATI = 'flex:1;min-height:48px;padding:12px 8px;border-radius:10px;border:1px solid #ffffff33;font-size:15px;font-weight:600;background:transparent;color:#a1a1aa;cursor:pointer;transition:background .15s,color .15s,border-color .15s';
  const tombolA = document.createElement('button');
  tombolA.type = 'button';
  tombolA.textContent = labelA;
  tombolA.setAttribute('role', 'tab');
  const tombolB = document.createElement('button');
  tombolB.type = 'button';
  tombolB.textContent = labelB;
  tombolB.setAttribute('role', 'tab');
  const atur = (keA) => {
    tombolA.style.cssText = keA ? GAYA_AKTIF : GAYA_MATI;
    tombolB.style.cssText = keA ? GAYA_MATI : GAYA_AKTIF;
    tombolA.setAttribute('aria-selected', keA ? 'true' : 'false');
    tombolB.setAttribute('aria-selected', keA ? 'false' : 'true');
    panelA.hidden = !keA;
    panelB.hidden = keA;
  };
  tombolA.addEventListener('click', () => atur(true));
  tombolB.addEventListener('click', () => atur(false));
  bungkus.appendChild(tombolA);
  bungkus.appendChild(tombolB);
  atur(!mintaArahB());
  return bungkus;
}

function renderCsvKeExcel(panel) {
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

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah file CSV jadi spreadsheet Excel (.xlsx) yang bisa dibuka di Excel, Google Sheets, dan WPS. Baris pertama dianggap judul kolom.</p>'));
  panel.appendChild(T.field('Pilih file CSV', fi));
  panel.appendChild(T.field('Pemisah kolom', delimSel, 'CSV dari Excel Indonesia biasanya memakai titik koma.'));
  panel.appendChild(T.row(goBtn));
  panel.appendChild(box);
  panel.appendChild(prevBox);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}

function renderExcelKeCsv(panel) {
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

  // Loader library kanonis: utils.loadLibOnce (core.js).

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

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah satu lembar spreadsheet jadi file CSV. Bila spreadsheet punya banyak lembar, pilih dulu lembar yang mau diubah.</p>'));
  panel.appendChild(T.field('Pilih file spreadsheet', fi, 'Excel (.xlsx, .xls) dan ODS.'));
  panel.appendChild(sheetWrap);
  panel.appendChild(T.field('Pemisah kolom', delimSel, 'Untuk dibuka di Excel Indonesia, titik koma biasanya lebih cocok.'));
  panel.appendChild(T.row(goBtn));
  panel.appendChild(box);
  panel.appendChild(prevBox);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderCsvKeExcel(panelA);
  renderExcelKeCsv(panelB);
  root.appendChild(buatSakelarArah('CSV → Excel', 'Excel → CSV', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
