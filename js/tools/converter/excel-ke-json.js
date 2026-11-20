// MERGE B18 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = excel-ke-json (survivor), arah B = json-ke-excel (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "excel-ke-json", "name": "Excel ↔ JSON", "cat": "converter", "icon": "🧾", "desc": "Ubah spreadsheet Excel jadi data JSON, atau data JSON jadi Excel.", "keywords": "excel,xlsx,json,data,spreadsheet,konversi,excel ke json,json ke excel", "since": "6.17.0"};


// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js
// (terverifikasi identik dari 3 sumber).
const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];

// ---------- Mesin arah B: JSON → Excel (dari json-ke-excel.js) ----------
// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js
// (terverifikasi identik dari 3 sumber).


function nilaiTeks(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

// Siapkan data JSON jadi {headers, rows} untuk spreadsheet. Menerima daftar
// objek, satu objek, daftar baris, atau daftar nilai biasa. Murni, bisa
// diuji di Node.
export function siapkanBarisJson(data) {
  if (Array.isArray(data) && data.length && Array.isArray(data[0])) {
    return { headers: data[0].map((c) => String(c)), rows: data.slice(1).map((r) => r.map(nilaiTeks)) };
  }
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length) return { headers: [], rows: [] };
  if (typeof arr[0] !== 'object' || arr[0] === null) {
    return { headers: ['nilai'], rows: arr.map((v) => [nilaiTeks(v)]) };
  }
  const headers = [];
  for (const o of arr) {
    if (o && typeof o === 'object') {
      for (const k of Object.keys(o)) if (!headers.includes(k)) headers.push(k);
    }
  }
  const rows = arr.map((o) => headers.map((k) => (o && typeof o === 'object' ? nilaiTeks(o[k]) : '')));
  return { headers, rows };
}

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

function renderExcelKeJson(panel) {
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

  // Loader library kanonis: utils.loadLibOnce (core.js).

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

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah satu lembar spreadsheet jadi data JSON, siap dipakai di aplikasi atau diolah lebih lanjut. Baris pertama biasanya berisi nama kolom.</p>'));
  panel.appendChild(T.field('Pilih file spreadsheet', fi, 'Excel (.xlsx, .xls) dan ODS.'));
  panel.appendChild(sheetWrap);
  panel.appendChild(T.field('Baris pertama', headSel));
  panel.appendChild(T.row(goBtn));
  panel.appendChild(box);
  panel.appendChild(prevBox);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Filemu tidak diunggah ke mana-mana.</p>'));
}

function renderJsonKeExcel(panel) {
  const fi = T.input('file');
  fi.accept = '.json,application/json';
  const ta = T.ta(10, 'Tempel data JSON di sini, atau pilih file .json di atas…');
  const box = T.out();
  const prevBox = T.out();

  // Loader library kanonis: utils.loadLibOnce (core.js).

  let busy = false;
  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    ta.value = await f.text();
    T.hide(box); T.hide(prevBox);
  });

  const goBtn = T.btn('Ubah jadi Excel', async () => {
    if (busy) return;
    const src = ta.value.trim();
    if (!src) { T.show(box, errBox('Tempel dulu datanya atau pilih file .json.')); return; }
    let data;
    try {
      data = JSON.parse(src);
    } catch (e) {
      T.show(box, errBox('Datanya bukan JSON yang benar. Periksa lagi kurung dan tanda petiknya.'));
      return;
    }
    busy = true;
    goBtn.disabled = true;
    T.show(box, '<span class="dim">Memuat alat spreadsheet…</span>');
    try {
      const ok = await utils.loadLibOnce(XLSX_CDNS, () => typeof window.XLSX !== 'undefined');
      if (!ok) {
        T.show(box, errBox('Alat spreadsheet tidak bisa dimuat dari internet. Cek koneksi lalu coba lagi.'));
        return;
      }
      const { headers, rows } = siapkanBarisJson(data);
      if (!headers.length || !rows.length) { T.show(box, errBox('Data JSON ini kosong, tidak ada yang bisa diubah.')); return; }
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet([headers, ...rows]);
      window.XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      T.dl('data.xlsx', blob, blob.type);
      T.show(box, '<span class="ok">Selesai. File Excel terunduh.</span>' +
        kv('Baris data', rows.length + ' baris') +
        kv('Kolom', headers.length + ' kolom') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      const preview = [headers.join(' | '), ...rows.slice(0, 3).map((r) => r.join(' | '))].join('\n');
      T.show(prevBox, '<p class="hint">Pratinjau baris awal:</p><pre style="white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.6;max-height:160px;overflow:auto"></pre>');
      prevBox.querySelector('pre').textContent = preview;
      T.toast('File Excel terunduh');
    } catch (e) {
      T.show(box, errBox('Data tidak bisa diubah jadi Excel. Coba lagi.'));
      const retry = T.btn('Coba lagi', () => goBtn.click());
      box.appendChild(retry);
    } finally {
      busy = false;
      goBtn.disabled = false;
    }
  }, true);

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah data JSON jadi spreadsheet Excel. Cocok untuk daftar objek seperti data pelanggan, produk, atau hasil unduhan dari aplikasi lain.</p>'));
  panel.appendChild(T.field('Pilih file .json (opsional)', fi));
  panel.appendChild(T.field('Data JSON', ta));
  panel.appendChild(T.row(goBtn));
  panel.appendChild(box);
  panel.appendChild(prevBox);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Datamu tidak diunggah ke mana-mana.</p>'));
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderExcelKeJson(panelA);
  renderJsonKeExcel(panelB);
  root.appendChild(buatSakelarArah('Excel → JSON', 'JSON → Excel', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
