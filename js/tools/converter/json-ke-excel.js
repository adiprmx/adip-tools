import { h as T, kv, fmtBytes, errBox } from '../../core.js';

export const meta = {"id": "json-ke-excel", "name": "JSON ke Excel", "cat": "converter", "icon": "📈", "desc": "Ubah data JSON jadi spreadsheet Excel.", "keywords": "json,excel,xlsx,data,spreadsheet,konversi", "since": "6.17.0"};

// SheetJS 0.18.5. Hash SRI ada di peta SRI_HASH core.js
// (terverifikasi identik dari 3 sumber).
const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];

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

export function render(root) {
  const fi = T.input('file');
  fi.accept = '.json,application/json';
  const ta = T.ta(10, 'Tempel data JSON di sini, atau pilih file .json di atas…');
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
      const ok = await muatXlsx();
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ubah data JSON jadi spreadsheet Excel. Cocok untuk daftar objek seperti data pelanggan, produk, atau hasil unduhan dari aplikasi lain.</p>'));
  root.appendChild(T.field('Pilih file .json (opsional)', fi));
  root.appendChild(T.field('Data JSON', ta));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Datamu tidak diunggah ke mana-mana.</p>'));
}
