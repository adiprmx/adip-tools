import { h as T, errBox, fileInput, utils } from '../../core.js';

// Parser XML kecil tanpa DOMParser: elemen, atribut, teks, CDATA,
// tag self-closing, komentar, dan entity dasar. Cukup untuk XML
// berbentuk daftar data (bukan dokumen campur teks bebas).
export function decodeXmlEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      const n = parseInt(h, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&#(\d+);/g, (_, d) => {
      const n = parseInt(d, 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    })
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

export function parseXml(text) {
  const src = String(text || '');
  let i = 0;
  const skipMisc = () => {
    for (;;) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (src.startsWith('<?', i)) { const e = src.indexOf('?>', i + 2); if (e < 0) throw new Error('Deklarasi XML tidak ditutup.'); i = e + 2; continue; }
      if (src.startsWith('<!--', i)) { const e = src.indexOf('-->', i + 4); if (e < 0) throw new Error('Komentar tidak ditutup.'); i = e + 3; continue; }
      if (src.startsWith('<!DOCTYPE', i)) { const e = src.indexOf('>', i); if (e < 0) throw new Error('DOCTYPE tidak ditutup.'); i = e + 1; continue; }
      break;
    }
  };
  const parseNode = () => {
    skipMisc();
    if (src[i] !== '<' || src.startsWith('</', i)) throw new Error('Tag pembuka tidak ditemukan di posisi ' + i + '.');
    const gt = src.indexOf('>', i);
    if (gt < 0) throw new Error('Tag tidak ditutup.');
    let inner = src.slice(i + 1, gt);
    const selfClose = /\/\s*$/.test(inner);
    if (selfClose) inner = inner.replace(/\/\s*$/, '');
    const m = /^\s*([A-Za-z_][\w:.-]*)/.exec(inner);
    if (!m) throw new Error('Nama tag tidak benar.');
    const tag = m[1];
    const attrs = {};
    const attrRe = /([A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let am;
    while ((am = attrRe.exec(inner)) !== null) attrs[am[1]] = decodeXmlEntities(am[3] !== undefined ? am[3] : am[4]);
    i = gt + 1;
    const node = { tag, attrs, children: [], text: '' };
    if (selfClose) return node;
    for (;;) {
      if (i >= src.length) throw new Error('Tag <' + tag + '> tidak ditutup.');
      if (src.startsWith('</', i)) {
        const e = src.indexOf('>', i);
        if (e < 0) throw new Error('Tag penutup tidak ditutup.');
        const closeTag = src.slice(i + 2, e).trim();
        if (closeTag !== tag) throw new Error('Tag <' + tag + '> ditutup dengan </' + closeTag + '>.');
        i = e + 1;
        return node;
      }
      if (src.startsWith('<![CDATA[', i)) {
        const e = src.indexOf(']]>', i + 9);
        if (e < 0) throw new Error('CDATA tidak ditutup.');
        node.text += src.slice(i + 9, e);
        i = e + 3;
        continue;
      }
      if (src.startsWith('<!--', i)) {
        const e = src.indexOf('-->', i + 4);
        if (e < 0) throw new Error('Komentar tidak ditutup.');
        i = e + 3;
        continue;
      }
      if (src.startsWith('<?', i)) {
        const e = src.indexOf('?>', i + 2);
        if (e < 0) throw new Error('Instruksi tidak ditutup.');
        i = e + 2;
        continue;
      }
      if (src[i] === '<') {
        node.children.push(parseNode());
        continue;
      }
      const lt = src.indexOf('<', i);
      const end = lt < 0 ? src.length : lt;
      node.text += decodeXmlEntities(src.slice(i, end));
      i = end;
    }
  };
  skipMisc();
  if (i >= src.length) throw new Error('XML-nya kosong.');
  const root = parseNode();
  skipMisc();
  if (i < src.length) throw new Error('Ada isi di luar tag utama.');
  return root;
}

function flattenRecord(node, prefix, out) {
  const path = prefix ? prefix + '.' + node.tag : node.tag;
  for (const [k, v] of Object.entries(node.attrs)) {
    const key = path + '.@' + k;
    (out[key] = out[key] || []).push(v);
  }
  const kids = node.children;
  if (!kids.length) {
    const t = node.text.trim();
    if (t !== '') (out[path] = out[path] || []).push(t);
    return;
  }
  for (const c of kids) flattenRecord(c, path, out);
}

// Cari baris data: anak-anak tag utama yang namanya sama semua dianggap
// satu baris tiap anak. Bila campur, tag utama sendiri jadi satu baris.
export function xmlToRows(text) {
  let root;
  try { root = parseXml(text); } catch (e) { return { error: e.message }; }
  const kids = root.children;
  let records;
  const repeated = kids.length > 1 && kids.every((c) => c.tag === kids[0].tag);
  // Satu anak yang punya >=2 field dianggap satu baris data (daftar
  // berisi satu item). Satu anak berantai (a > b > c) bukan daftar:
  // tag utama sendiri jadi satu baris supaya jalur bersarang utuh.
  const singleRecord = kids.length === 1 && kids[0].children.length >= 2;
  if (repeated || singleRecord) records = kids;
  else records = [root];
  const headers = [];
  const flatRows = records.map((rec) => {
    const map = {};
    // Ratakan dari anak record (bukan record itu sendiri) supaya nama
    // kolomnya nama field, bukan nama tag record.
    for (const [k, v] of Object.entries(rec.attrs)) (map['@' + k] = map['@' + k] || []).push(v);
    for (const c of rec.children) flattenRecord(c, '', map);
    if (!rec.children.length && rec.text.trim() !== '') map[rec.tag] = [rec.text.trim()];
    for (const k of Object.keys(map)) if (!headers.includes(k)) headers.push(k);
    return map;
  });
  const rows = flatRows.map((map) => headers.map((h) => (map[h] || []).join('; ')));
  return { headers, rows };
}

// csvCell, rowsToCSV kanonis tinggal di utils (core.js).

export const meta = {"id": "xml-ke-csv", "name": "XML ke CSV", "cat": "converter", "icon": "🗂️", "desc": "Ubah file XML berbentuk daftar data jadi spreadsheet CSV.", "keywords": "xml,csv,konversi,spreadsheet,data,ekspor", "since": "6.18.0"};
export function render(root) {

    const ta = T.ta(8, 'Tempel XML di sini…\nContoh:\n<daftar>\n  <barang><nama>Buku</nama><harga>50000</harga></barang>\n  <barang><nama>Pena</nama><harga>5000</harga></barang>\n</daftar>');
    const fileI = fileInput('.xml,.txt,text/xml');
    const delim = T.select([[',', 'Koma (,)'], [';', 'Titik koma (;)']], ',');
    const box = T.out();
    let lastOut = '';

    const ubah = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, errBox('Tempel dulu isi XML-nya atau pilih file.')); return; }
      const r = xmlToRows(src);
      if (r.error) { T.show(box, errBox('XML-nya tidak bisa dibaca: ' + r.error)); return; }
      if (!r.headers.length) { T.show(box, errBox('Tidak ada data yang bisa diambil dari XML ini.')); return; }
      const all = [r.headers].concat(r.rows);
      lastOut = utils.rowsToCSV(all, delim.value);
      const preview = all.slice(0, 6).map((row) => row.join(delim.value)).join('\n');
      T.show(box,
        '<div class="kv"><span class="k">Baris data</span><span class="v">' + r.rows.length + '</span></div>' +
        '<div class="kv"><span class="k">Kolom</span><span class="v">' + r.headers.length + '</span></div>' +
        '<pre style="max-height:180px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px">' + T.esc(preview) + (all.length > 6 ? '\n…' : '') + '</pre>');
      box.appendChild(T.row(
        T.copyBtn(() => lastOut, 'Salin hasil'),
        T.btn('Unduh CSV', () => T.dl('xml-ke-csv.csv', lastOut, 'text/csv;charset=utf-8'))
      ));
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      ta.value = await f.text();
      ubah();
    });

    root.appendChild(T.field('Pilih file XML (opsional)', fileI));
    root.appendChild(T.field('Isi XML', ta));
    root.appendChild(T.field('Pemisah CSV hasil', delim));
    root.appendChild(T.row(T.btn('Ubah jadi CSV', ubah, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Cocok untuk XML berbentuk daftar, misal daftar barang atau daftar kontak. Atribut XML jadi kolom berawalan @. Field yang bersarang ditulis dengan titik, misal alamat.kota.</div>'));

}
