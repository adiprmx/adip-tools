// MERGE B16 (v6.21.0, D2): satu tool dua arah. Mesin kedua arah
// dipertahankan berdampingan di file ini (NOL fungsi hilang):
// arah A = csv-ke-vcf (survivor), arah B = vcf-ke-csv (dipensiunkan,
// diserap ke sini). Sakelar arah ada di paling atas render().

import { h as T, errBox, fileInput, utils } from '../../core.js';

export const meta = {"id": "csv-ke-vcf", "name": "CSV ↔ VCF", "cat": "converter", "icon": "📇", "desc": "Ubah daftar kontak CSV jadi file vCard untuk HP, atau sebaliknya.", "keywords": "csv,vcf,vcard,kontak,telepon,impor kontak,ekspor kontak,daftar kontak,android,iphone,spreadsheet,csv ke vcf,vcf ke csv", "since": "6.18.0"};
export function vcfEscape(v) {
  return String(v == null ? '' : v)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// rows: hasil parseCSV, baris pertama = nama kolom.
// map: { nama, telepon, email, organisasi, catatan } berisi indeks kolom atau -1.
export function csvToVcf(rows, map) {
  const data = rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== ''));
  const cards = [];
  for (const r of data) {
    const nama = map.nama >= 0 ? String(r[map.nama] || '').trim() : '';
    if (!nama) continue;
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vcfEscape(nama), 'N:' + vcfEscape(nama) + ';;;'];
    if (map.telepon >= 0 && String(r[map.telepon] || '').trim()) lines.push('TEL;TYPE=CELL:' + vcfEscape(String(r[map.telepon]).trim()));
    if (map.email >= 0 && String(r[map.email] || '').trim()) lines.push('EMAIL:' + vcfEscape(String(r[map.email]).trim()));
    if (map.organisasi >= 0 && String(r[map.organisasi] || '').trim()) lines.push('ORG:' + vcfEscape(String(r[map.organisasi]).trim()));
    if (map.catatan >= 0 && String(r[map.catatan] || '').trim()) lines.push('NOTE:' + vcfEscape(String(r[map.catatan]).trim()));
    lines.push('END:VCARD');
    cards.push(lines.join('\r\n'));
  }
  return { vcf: cards.join('\r\n'), jumlah: cards.length, dilewati: data.length - cards.length };
}

// ---------- Mesin arah B: VCF → CSV (dari vcf-ke-csv.js) ----------
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

function renderCsvKeVcf(panel) {

    const ta = T.ta(8, 'Tempel CSV di sini…\nContoh:\nnama,telepon,email\nBudi,081234567890,budi@contoh.id');
    const fileI = fileInput('.csv,.txt,text/csv');
    const box = T.out();
    let rows = null, lastVcf = '';

    const colOptions = () => {
      const h = rows ? rows[0] : [];
      return h.map((c, i) => [String(i), (c || ('Kolom ' + (i + 1)))]);
    };
    const selNama = T.select([], '-1');
    const selTelp = T.select([], '-1');
    const selEmail = T.select([], '-1');
    const selOrg = T.select([], '-1');
    const selCat = T.select([], '-1');

    const refreshMap = () => {
      const opts = [['-1', 'Tidak dipakai']].concat(colOptions());
      for (const s of [selNama, selTelp, selEmail, selOrg, selCat]) {
        const keep = s.value;
        s.innerHTML = '';
        s.options.length = 0;
        for (const [v, l] of opts) {
          const o = document.createElement('option');
          o.value = v; o.textContent = l;
          s.appendChild(o);
        }
        s.value = keep;
      }
      // Tebak kolom dari nama headernya (nama, telepon/hp, email, organisasi, catatan).
      const h = (rows ? rows[0] : []).map((c) => String(c || '').toLowerCase());
      const guess = (words) => {
        for (let i = 0; i < h.length; i++) if (words.some((w) => h[i].includes(w))) return String(i);
        return '-1';
      };
      selNama.value = guess(['nama', 'name']);
      selTelp.value = guess(['telepon', 'telp', 'hp', 'phone', 'ponsel', 'nomor']);
      selEmail.value = guess(['email', 'mail', 'surel']);
      selOrg.value = guess(['organisasi', 'perusahaan', 'kantor', 'org']);
      selCat.value = guess(['catatan', 'note', 'keterangan']);
    };

    const muat = () => {
      const src = ta.value.trim();
      if (!src) { rows = null; T.show(box, errBox('Tempel dulu isi CSV-nya atau pilih file.')); return false; }
      const d = utils.detectDelim(src);
      rows = utils.parseCSV(src, d).filter((r) => r.some((c) => String(c).trim() !== ''));
      if (rows.length < 2) { rows = null; T.show(box, errBox('CSV-nya perlu minimal baris judul dan satu baris kontak.')); return false; }
      refreshMap();
      T.show(box, '<span class="dim">Terbaca ' + (rows.length - 1) + ' baris kontak, ' + rows[0].length + ' kolom. Cocokkan kolomnya di bawah, lalu tekan Ubah.</span>');
      return true;
    };

    const ubah = () => {
      if (!rows && !muat()) return;
      const map = {
        nama: +selNama.value, telepon: +selTelp.value, email: +selEmail.value,
        organisasi: +selOrg.value, catatan: +selCat.value,
      };
      if (map.nama < 0) { T.show(box, errBox('Pilih dulu kolom yang berisi nama kontak.')); return; }
      const r = csvToVcf(rows, map);
      if (!r.jumlah) { T.show(box, errBox('Tidak ada kontak yang bisa dibuat. Pastikan kolom nama terisi.')); return; }
      lastVcf = r.vcf;
      const first = r.vcf.split('END:VCARD')[0] + 'END:VCARD';
      T.show(box,
        '<div class="kv"><span class="k">Kontak jadi</span><span class="v big">' + r.jumlah + '</span></div>' +
        (r.dilewati ? '<div class="kv"><span class="k">Baris dilewati (nama kosong)</span><span class="v">' + r.dilewati + '</span></div>' : '') +
        '<div class="hint" style="margin:8px 0 4px">Contoh kartu pertama:</div>' +
        '<pre style="max-height:180px;overflow:auto;font-size:12px;background:#ffffff08;padding:10px;border-radius:8px">' + T.esc(first) + '</pre>');
      box.appendChild(T.row(
        T.copyBtn(() => lastVcf, 'Salin semua'),
        T.btn('Unduh kontak.vcf', () => T.dl('kontak.vcf', lastVcf, 'text/vcard;charset=utf-8'))
      ));
    };

    fileI.addEventListener('change', async () => {
      const f = fileI.files[0];
      if (!f) return;
      ta.value = await f.text();
      muat();
    });

    panel.appendChild(T.field('Pilih file CSV (opsional)', fileI));
    panel.appendChild(T.field('Isi CSV', ta));
    panel.appendChild(T.row(T.btn('Baca CSV', muat, true)));
    panel.appendChild(T.grid2(
      T.field('Kolom nama (wajib)', selNama),
      T.field('Kolom nomor telepon', selTelp)
    ));
    panel.appendChild(T.grid2(
      T.field('Kolom email', selEmail),
      T.field('Kolom organisasi', selOrg)
    ));
    panel.appendChild(T.field('Kolom catatan', selCat));
    panel.appendChild(T.row(T.btn('Ubah jadi VCF', ubah, true)));
    panel.appendChild(box);
    panel.appendChild(T.el('<div class="hint" style="margin-top:12px">File .vcf hasil unduhan bisa dibuka langsung di HP untuk menambah kontak. Baris yang nama kontaknya kosong dilewati.</div>'));

}

function renderVcfKeCsv(panel) {

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

    panel.appendChild(T.field('Pilih file kontak (.vcf, opsional)', fileI));
    panel.appendChild(T.field('Isi file kontak', ta));
    panel.appendChild(T.row(T.btn('Ubah jadi CSV', ubah, true)));
    panel.appendChild(box);
    panel.appendChild(T.el('<div class="hint" style="margin-top:12px">Nomor dan email yang lebih dari satu digabung dalam satu kolom, dipisah titik koma. File CSV hasil unduhan bisa dibuka di spreadsheet atau dipakai lagi di tool CSV ke VCF.</div>'));

}

export function render(root) {
  const panelA = T.el('<div></div>');
  const panelB = T.el('<div></div>');
  renderCsvKeVcf(panelA);
  renderVcfKeCsv(panelB);
  root.appendChild(buatSakelarArah('CSV → VCF', 'VCF → CSV', panelA, panelB));
  root.appendChild(panelA);
  root.appendChild(panelB);
}
