import { h as T, errBox, fileInput } from '../../core.js';

// Pasangan dari csv-ke-vcf.js: arah sebaliknya, VCF (vCard) ke CSV.
// Kolom hasil (nama,telepon,email,organisasi,catatan) sama persis dengan
// kolom yang ditebak csv-ke-vcf, jadi hasilnya bisa dipakai lagi di sana.

// Gabung baris lanjutan vCard: baris yang diawali spasi/tab adalah sambungan
// baris sebelumnya (folding, RFC 2426).
export function unfoldVcf(text) {
  const src = String(text == null ? '' : text).replace(/\r\n|\r/g, '\n');
  const out = [];
  for (const raw of src.split('\n')) {
    if ((raw.startsWith(' ') || raw.startsWith('\t')) && out.length) out[out.length - 1] += raw.slice(1);
    else out.push(raw);
  }
  return out;
}

// Balikkan escape vCard: \n jadi baris baru, \, \; \\ jadi karakter aslinya.
export function vcfUnescape(v) {
  return String(v).replace(/\\(.)/g, (_, c) => {
    if (c === 'n' || c === 'N') return '\n';
    return c;
  });
}

// Dekode quoted-printable (vCard 2.1 lama): =XX jadi byte, lalu baca UTF-8.
export function decodeQP(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '=') {
      const hex = s.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) { bytes.push(parseInt(hex, 16)); i += 2; }
      // '=' di ujung baris = sambungan lunak, lewati saja.
    } else bytes.push(s.charCodeAt(i) & 0xff);
  }
  try { return new TextDecoder('utf-8').decode(new Uint8Array(bytes)); }
  catch { return s; }
}

// Pisah nilai komponen (';') tanpa memecah '\;' yang sudah di-escape.
function splitUnescaped(v) {
  const parts = [];
  let cur = '';
  for (let i = 0; i < v.length; i++) {
    if (v[i] === '\\' && i + 1 < v.length) { cur += v[i] + v[i + 1]; i++; }
    else if (v[i] === ';') { parts.push(cur); cur = ''; }
    else cur += v[i];
  }
  parts.push(cur);
  return parts.map(vcfUnescape);
}

// Parse teks vCard jadi daftar kontak. Tiap kontak:
// { nama, telepon: [], email: [], organisasi, catatan }.
// Field berulang (TEL/EMAIL ganda) dikumpulkan semua, bukan hanya yang pertama.
export function parseVcf(text) {
  const contacts = [];
  let cur = null;
  for (const line of unfoldVcf(text)) {
    const up = line.toUpperCase();
    if (up === 'BEGIN:VCARD') { cur = { nama: '', telepon: [], email: [], organisasi: '', catatan: '', _n: '' }; continue; }
    if (up === 'END:VCARD') { if (cur) contacts.push(cur); cur = null; continue; }
    if (!cur) continue;
    const ci = line.indexOf(':');
    if (ci < 0) continue;
    const head = line.slice(0, ci);
    let value = line.slice(ci + 1);
    const parts = head.split(';');
    let name = parts[0].toUpperCase();
    const dot = name.indexOf('.');
    if (dot > 0) name = name.slice(dot + 1); // awalan grup, mis. item1.TEL
    const params = parts.slice(1).join(';').toUpperCase();
    if (params.includes('QUOTED-PRINTABLE')) value = decodeQP(value);
    if (name === 'FN') {
      const v = vcfUnescape(value).trim();
      if (v && !cur.nama) cur.nama = v;
    } else if (name === 'N') {
      cur._n = value; // diproses belakangan, bila FN tidak ada
    } else if (name === 'TEL') {
      const v = vcfUnescape(value).trim();
      if (v) cur.telepon.push(v);
    } else if (name === 'EMAIL') {
      const v = vcfUnescape(value).trim();
      if (v) cur.email.push(v);
    } else if (name === 'ORG') {
      if (!cur.organisasi) cur.organisasi = splitUnescaped(value).map((s) => s.trim()).filter(Boolean).join(', ');
    } else if (name === 'NOTE') {
      const v = vcfUnescape(value);
      cur.catatan = cur.catatan ? cur.catatan + '\n' + v : v;
    }
  }
  // Nama cadangan dari N (Keluarga;Nama;Tengah;GelarDepan;GelarBelakang).
  for (const c of contacts) {
    if (!c.nama && c._n) {
      const [kel, nam, teng, gelD, gelB] = splitUnescaped(c._n);
      c.nama = [gelD, nam, teng, kel, gelB].map((s) => (s || '').trim()).filter(Boolean).join(' ');
    }
    delete c._n;
  }
  return contacts;
}

// Escape satu sel CSV: beri kutip bila berisi koma, kutip, atau baris baru.
// Netralisasi injeksi formula (OWASP, sama seperti utils.csvCell): sel yang
// diawali = + - @ | % (sesudah buang spasi/tab di depan) diawali apostrof,
// supaya spreadsheet tidak mengevaluasinya sebagai formula.
// Pengecualian D-G3-14: angka murni (-5, +3.14) TIDAK dinetralkan.
export function csvEscape(v) {
  let s = String(v == null ? '' : v);
  const t = s.replace(/^[ \t]+/, '');
  if (/^[=+\-@|%]/.test(t) && !/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// Kontak jadi CSV. Nomor/email ganda digabung satu kolom, dipisah titik koma.
export function vcfToCsv(contacts) {
  const rows = [['nama', 'telepon', 'email', 'organisasi', 'catatan']];
  let dilewati = 0;
  for (const c of contacts || []) {
    if (!c.nama) { dilewati++; continue; }
    rows.push([
      c.nama,
      (c.telepon || []).join('; '),
      (c.email || []).join('; '),
      c.organisasi || '',
      c.catatan || '',
    ]);
  }
  return { csv: rows.map((r) => r.map(csvEscape).join(',')).join('\n'), jumlah: rows.length - 1, dilewati };
}

export const meta = {"id": "vcf-ke-csv", "name": "VCF ke CSV", "cat": "converter", "icon": "📋", "desc": "Ubah file kontak .vcf jadi tabel CSV yang bisa dibuka di spreadsheet.", "keywords": "vcf,vcard,csv,kontak,ekspor kontak,daftar kontak,spreadsheet", "since": "6.18.0"};
export function render(root) {

    const ta = T.ta(8, 'Tempel isi file .vcf di sini…\nContoh:\nBEGIN:VCARD\nVERSION:3.0\nFN:Budi\nTEL;TYPE=CELL:081234567890\nEMAIL:budi@contoh.id\nEND:VCARD');
    const fileI = fileInput('.vcf,.vcard,.txt,text/vcard');
    const box = T.out();
    let lastCsv = '';

    const ubah = () => {
      const src = ta.value.trim();
      if (!src) { T.show(box, errBox('Tempel dulu isi file kontaknya atau pilih file.')); return; }
      const contacts = parseVcf(src);
      if (!contacts.length) { T.show(box, errBox('Tidak ada kartu kontak yang terbaca. Pastikan isinya file .vcf.')); return; }
      const r = vcfToCsv(contacts);
      if (!r.jumlah) { T.show(box, errBox('Tidak ada kontak yang bisa dibuat. Pastikan tiap kartu punya nama.')); return; }
      lastCsv = r.csv;
      const preview = r.csv.split('\n').slice(0, 6).join('\n');
      T.show(box,
        '<div class="kv"><span class="k">Kontak terbaca</span><span class="v big">' + r.jumlah + '</span></div>' +
        (r.dilewati ? '<div class="kv"><span class="k">Kartu dilewati (tanpa nama)</span><span class="v">' + r.dilewati + '</span></div>' : '') +
        '<div class="hint" style="margin:8px 0 4px">Pratinjau CSV:</div>' +
        '<pre style="max-height:180px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px">' + T.esc(preview) + '</pre>');
      box.appendChild(T.row(
        T.copyBtn(() => lastCsv, 'Salin semua'),
        T.btn('Unduh kontak.csv', () => T.dl('kontak.csv', lastCsv, 'text/csv;charset=utf-8'))
      ));
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      ta.value = await f.text();
      ubah();
    });

    root.appendChild(T.field('Pilih file kontak (.vcf, opsional)', fileI));
    root.appendChild(T.field('Isi file kontak', ta));
    root.appendChild(T.row(T.btn('Ubah jadi CSV', ubah, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Nomor dan email yang lebih dari satu digabung dalam satu kolom, dipisah titik koma. File CSV hasil unduhan bisa dibuka di spreadsheet atau dipakai lagi di tool CSV ke VCF.</div>'));

}
