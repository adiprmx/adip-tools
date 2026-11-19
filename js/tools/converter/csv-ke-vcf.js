import { h as T, errBox, fileInput, utils } from '../../core.js';

// Parser CSV yang benar: dukung quote, koma di dalam field, quote ganda,
// newline di dalam field. (Pola yang sama seperti csv-json.js.)
// parseCSV, detectDelim kanonis tinggal di utils (core.js).

// Escape nilai vCard: backslash, titik koma, koma, dan baris baru.
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

export const meta = {"id": "csv-ke-vcf", "name": "CSV ke VCF", "cat": "converter", "icon": "📇", "desc": "Ubah daftar kontak CSV jadi file vCard (.vcf) untuk HP.", "keywords": "csv,vcf,vcard,kontak,telepon,impor kontak,android,iphone", "since": "6.18.0"};
export function render(root) {

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

    root.appendChild(T.field('Pilih file CSV (opsional)', fileI));
    root.appendChild(T.field('Isi CSV', ta));
    root.appendChild(T.row(T.btn('Baca CSV', muat, true)));
    root.appendChild(T.grid2(
      T.field('Kolom nama (wajib)', selNama),
      T.field('Kolom nomor telepon', selTelp)
    ));
    root.appendChild(T.grid2(
      T.field('Kolom email', selEmail),
      T.field('Kolom organisasi', selOrg)
    ));
    root.appendChild(T.field('Kolom catatan', selCat));
    root.appendChild(T.row(T.btn('Ubah jadi VCF', ubah, true)));
    root.appendChild(box);
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">File .vcf hasil unduhan bisa dibuka langsung di HP untuk menambah kontak. Baris yang nama kontaknya kosong dilewati.</div>'));

}
