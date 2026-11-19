import { h as T, utils, kv, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Ubah file spreadsheet Excel (.xlsx/.xls/.csv) jadi XML. Pembacaan file
// memakai SheetJS lewat loader kanonis (utils.loadLibOnce, hash SRI di
// core.js). Logika ubah tabel jadi XML ditulis sendiri dan bisa diuji
// tanpa pustaka: nama elemen dibersihkan supaya valid XML, isi di-escape.

export const meta = { id: 'excel-ke-xml', name: 'Excel ke XML', cat: 'developer', icon: '📄', desc: 'Ubah file spreadsheet Excel jadi XML: pilih sheet, atur nama elemennya, lalu unduh hasilnya.', keywords: 'excel,xml,xlsx,spreadsheet,konversi,tabel,sheet', since: '6.19.0' };

const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];

let xlsxSiap = null;
async function muatXlsx() {
  if (xlsxSiap === null) xlsxSiap = utils.loadLibOnce(XLSX_CDNS, () => typeof window.XLSX !== 'undefined');
  return xlsxSiap;
}

export function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Nama kolom jadi nama elemen XML yang valid: huruf/angka/_/-/. saja,
// tidak boleh diawali angka/tanda minus/titik, kosong jadi 'kolom'.
export function namaElemen(nama, jatuh) {
  let s = String(nama == null ? '' : nama).trim();
  s = s.replace(/[^A-Za-z0-9_\-.]/g, '_');
  if (/^[0-9.-]/.test(s)) s = 'kolom_' + s;
  if (!s) s = jatuh || 'kolom';
  return s;
}

function nilaiKeTeks(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString();
  if (typeof v === 'number') return utils.r6(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

// aoa: array baris (array nilai). Opsi: akar, baris (nama elemen per
// baris), header (baris pertama = nama kolom). Murni, bisa diuji di Node.
export function aoaKeXml(aoa, opsi) {
  const o = opsi || {};
  const akar = namaElemen(o.akar || 'data', 'data');
  const namaBaris = namaElemen(o.baris || 'baris', 'baris');
  const pakaiHeader = o.header !== false;
  const data = (aoa || []).filter((r) => Array.isArray(r) && r.some((v) => v !== null && v !== undefined && String(v) !== ''));
  if (!data.length) return '<?xml version="1.0" encoding="UTF-8"?>\n<' + akar + '/>\n';
  let header = null;
  let mulai = 0;
  if (pakaiHeader) {
    header = data[0].map((v, i) => namaElemen(v == null || String(v) === '' ? 'kolom' + (i + 1) : v, 'kolom' + (i + 1)));
    // Nama kolom kembar diberi akhiran angka supaya tetap unik.
    const ketemu = {};
    header = header.map((h) => {
      ketemu[h] = (ketemu[h] || 0) + 1;
      return ketemu[h] > 1 ? h + '_' + ketemu[h] : h;
    });
    mulai = 1;
  }
  const lebar = Math.max(...data.map((r) => r.length));
  let keluar = '<?xml version="1.0" encoding="UTF-8"?>\n<' + akar + '>\n';
  for (let r = mulai; r < data.length; r++) {
    keluar += '  <' + namaBaris + '>\n';
    for (let c = 0; c < lebar; c++) {
      const nama = header ? header[c] : 'kolom' + (c + 1);
      const teks = nilaiKeTeks(data[r][c]);
      if (teks === null || teks === '') keluar += '    <' + nama + '/>\n';
      else keluar += '    <' + nama + '>' + escapeXml(teks) + '</' + nama + '>\n';
    }
    keluar += '  </' + namaBaris + '>\n';
  }
  keluar += '</' + akar + '>\n';
  return keluar;
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Ubah spreadsheet Excel jadi XML. ' + T.esc(LOCAL_NOTE) + ' Pustaka pembaca Excel dimuat dari internet sekali saat pertama dipakai.</p>'));

  const fileI = document.createElement('input');
  fileI.type = 'file';
  fileI.accept = '.xlsx,.xls,.csv,.ods';
  fileI.className = 'inp';
  const statusEl = T.el('<p class="hint"></p>');
  const infoEl = T.el('<div></div>');
  const sheetSel = T.select([], '');
  const akarI = T.input('text', 'data', 'data');
  const barisI = T.input('text', 'baris', 'baris');
  const headerCek = document.createElement('input');
  headerCek.type = 'checkbox';
  headerCek.checked = true;
  const opsiEl = T.el('<div></div>');
  opsiEl.hidden = true;
  const hasilTa = T.ta(10, 'Hasil XML muncul di sini…');
  hasilTa.style.fontFamily = 'ui-monospace,monospace';
  hasilTa.readOnly = true;
  const aksiEl = T.el('<div class="row" style="flex-wrap:wrap"></div>');

  let workbook = null, namaDasar = 'data', xmlTerakhir = '';

  function isiSheet() {
    sheetSel.innerHTML = '';
    workbook.SheetNames.forEach((nama) => {
      const o = document.createElement('option');
      o.value = nama;
      o.textContent = nama;
      sheetSel.appendChild(o);
    });
  }

  function ubah() {
    if (!workbook) return;
    try {
      const ws = workbook.Sheets[sheetSel.value];
      const aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
      xmlTerakhir = aoaKeXml(aoa, { akar: akarI.value, baris: barisI.value, header: headerCek.checked });
      hasilTa.value = xmlTerakhir;
      const jumlahBaris = aoa.filter((r) => Array.isArray(r) && r.some((v) => v !== null && v !== undefined && String(v) !== '')).length;
      infoEl.innerHTML = '<div class="card">' +
        kv('Sheet', T.esc(sheetSel.value)) +
        kv('Baris berisi data', T.fmt(jumlahBaris)) +
        kv('Ukuran XML', fmtBytes(new Blob([xmlTerakhir]).size)) +
        '</div>';
      aksiEl.innerHTML = '';
      aksiEl.append(
        T.btn('Unduh XML', () => T.dl(namaDasar + '.xml', xmlTerakhir, 'application/xml'), true),
        T.btn('Salin XML', () => { T.copy(xmlTerakhir); T.toast('XML disalin'); }),
      );
    } catch (e) {
      hasilTa.value = '';
      infoEl.innerHTML = '<p style="color:var(--err)">Gagal mengubah sheet ini: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  async function bukaFile() {
    const f = fileI.files && fileI.files[0];
    if (!f) return;
    statusEl.textContent = 'Memuat pustaka Excel...';
    const ok = await muatXlsx();
    if (!ok || !window.XLSX) {
      statusEl.textContent = '';
      T.toast('Pustaka Excel gagal dimuat. Cek koneksi internet lalu coba lagi.');
      return;
    }
    statusEl.textContent = 'Membaca file...';
    try {
      const buf = await f.arrayBuffer();
      workbook = window.XLSX.read(buf, { type: 'array', cellDates: true });
      namaDasar = f.name.replace(/\.[^.]*$/, '') || 'data';
      statusEl.textContent = '';
      isiSheet();
      opsiEl.hidden = false;
      ubah();
    } catch (e) {
      statusEl.textContent = '';
      workbook = null;
      infoEl.innerHTML = '<p style="color:var(--err)">File tidak bisa dibaca sebagai spreadsheet: ' + T.esc(e.message || 'error tidak diketahui') + '</p>';
    }
  }

  sheetSel.addEventListener('change', ubah);
  akarI.addEventListener('input', ubah);
  barisI.addEventListener('input', ubah);
  headerCek.addEventListener('change', ubah);
  fileI.addEventListener('change', bukaFile);

  const cekLabel = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:8px 0"></label>');
  cekLabel.append(headerCek, document.createTextNode('Baris pertama adalah nama kolom'));
  opsiEl.append(
    T.field('Sheet', sheetSel),
    T.grid2(T.field('Nama elemen akar', akarI), T.field('Nama elemen tiap baris', barisI)),
    cekLabel,
  );

  root.append(
    T.field('Pilih file Excel', fileI, 'Format .xlsx, .xls, .csv, atau .ods.'),
    statusEl,
    opsiEl,
    infoEl,
    T.field('Hasil XML', hasilTa),
    aksiEl,
  );
}
