// MERGE B20 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = excel-ke-xml (survivor), arah B = xml-ke-excel (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, utils, kv, fmtBytes, LOCAL_NOTE, errBox } from '../../core.js';

export const meta = {"id": "excel-ke-xml", "name": "Excel ↔ XML", "cat": "developer", "icon": "📄", "desc": "Ubah spreadsheet Excel jadi XML, atau file XML jadi Excel.", "keywords": "excel,xml,xlsx,spreadsheet,konversi,tabel,sheet,data,excel ke xml,xml ke excel", "since": "6.19.0", "online": true};


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

// ---------- Mesin arah B: XML → Excel (dari xml-ke-excel.js) ----------
// Batas kedalaman XML (G4 Blue R1, RED-15): DOMParser menerima sarang
// sedalam apa pun; tanpa batas, XML 100 ribu tingkat membuat
// domKePohon/teksGabung stack overflow. 1000 tingkat jauh di atas XML
// nyata (yang dalam pun puluhan tingkat).
const MAKS_DALAM_XML = 1000;
const MAKS_FILE_XML = 10 * 1024 * 1024;

// Pohon generik: {tag, attrs:[[nama,nilai]], anak:[pohon], teks}.
// DOMParser hanya dipakai di adaptor xmlTeksKePohon (browser); perataan
// pohonKeBaris murni dan bisa diuji di Node.

export function domKePohon(el, dalam) {
  const d = dalam || 0;
  if (d > MAKS_DALAM_XML) throw new Error('XML-nya terlalu dalam (lebih dari ' + MAKS_DALAM_XML + ' tingkat).');
  const attrs = [];
  if (el.attributes) {
    for (const a of el.attributes) attrs.push([a.name, a.value]);
  }
  const anak = [];
  let teks = '';
  for (const n of el.childNodes) {
    if (n.nodeType === 1) anak.push(domKePohon(n, d + 1));
    else if (n.nodeType === 3 || n.nodeType === 4) teks += n.nodeValue || '';
  }
  return { tag: el.tagName, attrs, anak, teks: teks.replace(/\s+/g, ' ').trim() };
}

export function xmlTeksKePohon(xml) {
  if (typeof DOMParser === 'undefined') throw new Error('Browser ini tidak bisa membaca XML.');
  const doc = new DOMParser().parseFromString(String(xml == null ? '' : xml), 'text/xml');
  const galat = doc.getElementsByTagName('parsererror')[0];
  if (galat) throw new Error('XML-nya tidak benar: ' + (galat.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 200));
  if (!doc.documentElement) throw new Error('XML-nya kosong.');
  return domKePohon(doc.documentElement);
}

function teksGabung(el, dalam) {
  const d = dalam || 0;
  if (d > MAKS_DALAM_XML) throw new Error('XML-nya terlalu dalam (lebih dari ' + MAKS_DALAM_XML + ' tingkat).');
  let keluar = el.teks || '';
  for (const c of el.anak || []) {
    const t = teksGabung(c, d + 1);
    if (t) keluar += (keluar ? ' ' : '') + t;
  }
  keluar = keluar.replace(/\s+/g, ' ').trim();
  return keluar.length > 500 ? keluar.slice(0, 497) + '...' : keluar;
}

// Angka polos (tanpa nol di depan, maks 15 digit) disimpan sebagai angka
// supaya bisa dihitung di Excel; sisanya tetap teks (kode "00123" aman).
export function nilaiSel(v) {
  if (v == null || v === '') return '';
  const s = String(v);
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(s) && s.replace(/[-.]/g, '').length <= 15) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return s;
}

// Ratakan pohon jadi {headers, rows}. Aturan: elemen anak root yang
// berulang (>=2, tag terbanyak) jadi baris; bila tidak ada, anak-anak
// root yang semuanya daun jadi satu baris; bila tidak, tiap anak root
// jadi satu baris. Kolom: @atribut, anak daun (nama tag), anak bukan
// daun (teks gabungannya). Tag yang sama dua kali dalam satu baris
// digabung dengan "; ".
export function pohonKeBaris(pohon) {
  if (!pohon) return { headers: [], rows: [] };
  const anak = pohon.anak || [];
  const frek = {};
  for (const a of anak) frek[a.tag] = (frek[a.tag] || 0) + 1;
  let tagTerpilih = null;
  for (const t of Object.keys(frek)) {
    if (frek[t] >= 2 && (!tagTerpilih || frek[t] > frek[tagTerpilih])) tagTerpilih = t;
  }
  let barisEl;
  if (tagTerpilih) barisEl = anak.filter((a) => a.tag === tagTerpilih);
  else if (anak.length === 0 || anak.every((a) => a.anak.length === 0)) barisEl = [pohon];
  else barisEl = anak;
  const headers = [];
  const rows = barisEl.map((el) => {
    const sel = {};
    const tambah = (k, v) => {
      if (v == null || v === '') return;
      if (sel[k] == null) sel[k] = v;
      else sel[k] = sel[k] + '; ' + v;
      if (!headers.includes(k)) headers.push(k);
    };
    for (const [nama, nilai] of (el.attrs || [])) tambah('@' + nama, nilai);
    for (const c of (el.anak || [])) {
      if (c.anak.length === 0) tambah(c.tag, c.teks);
      else tambah(c.tag, teksGabung(c));
    }
    if (!el.anak.length && el.teks) tambah(el.tag, el.teks);
    return sel;
  });
  return { headers, rows: rows.map((sel) => headers.map((h) => nilaiSel(sel[h] == null ? '' : sel[h]))) };
}

export function xmlTeksKeBaris(xml) {
  return pohonKeBaris(xmlTeksKePohon(xml));
}

export function barisKeAoa(headers, rows) {
  return [headers, ...rows];
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

function renderExcelKeXml(panel) {
  panel.appendChild(T.el('<p class="hint">Ubah spreadsheet Excel jadi XML. ' + T.esc(LOCAL_NOTE) + ' Pustaka pembaca Excel dimuat dari internet sekali saat pertama dipakai.</p>'));

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

  panel.append(
    T.field('Pilih file Excel', fileI, 'Format .xlsx, .xls, .csv, atau .ods.'),
    statusEl,
    opsiEl,
    infoEl,
    T.field('Hasil XML', hasilTa),
    aksiEl,
  );
}

function renderXmlKeExcel(panel) {
  const fi = T.input('file');
  fi.accept = '.xml,text/xml';
  const ta = T.ta(10, 'Tempel isi XML di sini, atau pilih file .xml di atas…');
  ta.style.fontFamily = 'ui-monospace,monospace';
  const box = T.out();
  const prevBox = T.out();

  let busy = false;
  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    if (f.size > MAKS_FILE_XML) { T.show(box, errBox('Filenya terlalu besar (maksimal 10 MB).')); return; }
    ta.value = await f.text();
    T.hide(box);
    T.hide(prevBox);
  });

  const goBtn = T.btn('Ubah jadi Excel', async () => {
    if (busy) return;
    const src = ta.value.trim();
    if (!src) { T.show(box, errBox('Tempel dulu isi XML-nya atau pilih file .xml.')); return; }
    let hasil;
    try {
      hasil = xmlTeksKeBaris(src);
    } catch (e) {
      T.show(box, errBox(e.message || 'XML-nya tidak bisa dibaca.'));
      return;
    }
    if (!hasil.headers.length || !hasil.rows.length) {
      T.show(box, errBox('XML ini tidak punya data yang bisa dijadikan tabel.'));
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
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.aoa_to_sheet(barisKeAoa(hasil.headers, hasil.rows));
      window.XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      T.dl('data.xlsx', blob, blob.type);
      T.show(box, '<span class="ok">Selesai. File Excel terunduh.</span>' +
        kv('Baris data', T.fmt(hasil.rows.length) + ' baris') +
        kv('Kolom', T.fmt(hasil.headers.length) + ' kolom') +
        kv('Ukuran hasil', fmtBytes(blob.size)));
      const preview = [hasil.headers.join(' | '), ...hasil.rows.slice(0, 3).map((r) => r.join(' | '))].join('\n');
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

  panel.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Elemen XML yang berulang jadi baris di Excel, isinya jadi kolom. Atribut XML jadi kolom yang diawali @. Angka polos disimpan sebagai angka, kode seperti 00123 tetap teks supaya nol depannya tidak hilang.</p>'));
  panel.appendChild(T.field('Pilih file .xml (opsional)', fi));
  panel.appendChild(T.field('Isi XML', ta));
  panel.appendChild(T.row(goBtn));
  panel.appendChild(box);
  panel.appendChild(prevBox);
  panel.appendChild(T.el('<p class="hint">Diproses di browser. Datamu tidak diunggah ke mana-mana.</p>'));
}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderExcelKeXml(panelA);
  renderXmlKeExcel(panelB);
  root.appendChild(buatSakelarArah('Excel → XML', 'XML → Excel', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
