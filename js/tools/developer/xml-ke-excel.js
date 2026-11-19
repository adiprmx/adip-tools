import { h as T, utils, kv, fmtBytes, errBox } from '../../core.js';

// XML ke Excel: elemen yang berulang jadi baris, anak daunnya jadi kolom.
// Atribut jadi kolom @nama. SheetJS 0.18.5 (hash SRI ada di peta SRI_HASH
// core.js). 100% client-side.
const XLSX_CDNS = [
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js',
];
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
  if (typeof DOMParser === 'undefined') throw new Error('DOMParser tidak tersedia di lingkungan ini');
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

export const meta = { id: 'xml-ke-excel', name: 'XML ke Excel', cat: 'developer', icon: '📊', desc: 'Ubah file XML jadi spreadsheet Excel: elemen yang berulang jadi baris, isinya jadi kolom.', keywords: 'xml,excel,xlsx,spreadsheet,konversi,data,tabel', since: '6.19.0' };

export function render(root) {
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

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Elemen XML yang berulang jadi baris di Excel, isinya jadi kolom. Atribut XML jadi kolom yang diawali @. Angka polos disimpan sebagai angka, kode seperti 00123 tetap teks supaya nol depannya tidak hilang.</p>'));
  root.appendChild(T.field('Pilih file .xml (opsional)', fi));
  root.appendChild(T.field('Isi XML', ta));
  root.appendChild(T.row(goBtn));
  root.appendChild(box);
  root.appendChild(prevBox);
  root.appendChild(T.el('<p class="hint">Diproses di browser. Datamu tidak diunggah ke mana-mana.</p>'));
}
