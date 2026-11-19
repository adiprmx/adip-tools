import { h as T } from '../../core.js';

export const meta = {"id":"ukuran-standar","name":"Ukuran Standar","cat":"desain","icon":"📐","desc":"Referensi ukuran kertas, amplop, kartu, foto, dan bingkai.","keywords":"ukuran,kertas,a4,amplop,kartu nama,foto,bingkai,mm,cm,inci","since":"6.19.0"};

// Semua ukuran dalam milimeter. Kertas A/B/C mengikuti ISO 216; ukuran AS
// mengikuti standar ANSI; ukuran foto mengikuti cetakan umum di Indonesia.
export const DATA_UKURAN = {
  kertas: [
    ['A0', 841, 1189, 'ISO 216'], ['A1', 594, 841, 'ISO 216'], ['A2', 420, 594, 'ISO 216'],
    ['A3', 297, 420, 'ISO 216'], ['A4', 210, 297, 'ISO 216'], ['A5', 148, 210, 'ISO 216'],
    ['A6', 105, 148, 'ISO 216'], ['A7', 74, 105, 'ISO 216'], ['A8', 52, 74, 'ISO 216'],
    ['A9', 37, 52, 'ISO 216'], ['A10', 26, 37, 'ISO 216'],
    ['B0', 1000, 1414, 'ISO 216'], ['B1', 707, 1000, 'ISO 216'], ['B2', 500, 707, 'ISO 216'],
    ['B3', 353, 500, 'ISO 216'], ['B4', 250, 353, 'ISO 216'], ['B5', 176, 250, 'ISO 216'],
    ['B6', 125, 176, 'ISO 216'], ['B7', 88, 125, 'ISO 216'], ['B8', 62, 88, 'ISO 216'],
    ['B9', 44, 62, 'ISO 216'], ['B10', 31, 44, 'ISO 216'],
    ['C0', 917, 1297, 'ISO 216'], ['C1', 648, 917, 'ISO 216'], ['C2', 458, 648, 'ISO 216'],
    ['C3', 324, 458, 'ISO 216'], ['C4', 229, 324, 'ISO 216'], ['C5', 162, 229, 'ISO 216'],
    ['C6', 114, 162, 'ISO 216'], ['C7', 81, 114, 'ISO 216'], ['C8', 57, 81, 'ISO 216'],
    ['C9', 40, 57, 'ISO 216'], ['C10', 28, 40, 'ISO 216'],
    ['Letter', 216, 279, 'ANSI (8,5 x 11 inci)'], ['Legal', 216, 356, 'ANSI (8,5 x 14 inci)'],
    ['Tabloid', 279, 432, 'ANSI (11 x 17 inci)'], ['Executive', 184, 267, 'ANSI (7,25 x 10,5 inci)'],
    ['Folio / F4', 210, 330, 'Umum di Indonesia'],
  ],
  amplop: [
    ['DL (E65)', 110, 220, 'Muatan A4 lipat 3'], ['C4', 229, 324, 'Muatan A4 tanpa lipat'],
    ['C5', 162, 229, 'Muatan A4 lipat 1'], ['C6', 114, 162, 'Muatan A4 lipat 2'],
    ['C6/C5', 114, 229, 'Muatan A4 lipat 2 memanjang'], ['C5/C6', 162, 229, 'Muatan A5'],
    ['B5', 176, 250, 'Muatan B5'], ['E4', 280, 400, 'Muatan B4'],
    ['US #10', 105, 241, 'Amplop bisnis AS (4,125 x 9,5 inci)'],
    ['Kantong cokelat', 229, 324, 'Ukuran C4, umum di Indonesia'],
  ],
  kartu: [
    ['Kartu nama (Indonesia/Eropa)', 85, 55, 'Standar umum'],
    ['Kartu nama (Amerika)', 89, 51, '3,5 x 2 inci'],
    ['Kartu nama (Jepang)', 91, 55, 'Standar Jepang'],
    ['Kartu kredit / ATM', 85.6, 53.98, 'ISO/IEC 7810 ID-1'],
    ['KTP Indonesia', 85.6, 53.98, 'ISO/IEC 7810 ID-1'],
    ['Kartu pos', 148, 105, 'Ukuran A6'],
    ['ID card / lanyard', 85.6, 53.98, 'ISO/IEC 7810 ID-1'],
  ],
  foto: [
    ['Pas foto 2x3', 20, 30, 'Umum untuk dokumen'],
    ['Pas foto 3x4', 30, 40, 'Umum untuk dokumen'],
    ['Pas foto 4x6', 40, 60, 'Paspor Indonesia dan dokumen'],
    ['Paspor Amerika', 51, 51, '2 x 2 inci'],
    ['Cetak 2R', 64, 89, '2,5 x 3,5 inci'],
    ['Cetak 3R', 89, 127, '3,5 x 5 inci'],
    ['Cetak 4R', 102, 152, '4 x 6 inci'],
    ['Cetak 5R', 127, 178, '5 x 7 inci'],
    ['Cetak 8R', 203, 254, '8 x 10 inci'],
    ['Cetak 10R', 254, 305, '10 x 12 inci'],
    ['Cetak 12R', 305, 381, '12 x 15 inci'],
  ],
  bingkai: [
    ['10 x 15 cm', 100, 150, 'Foto 4R'], ['13 x 18 cm', 130, 180, 'Foto 5R'],
    ['15 x 21 cm', 150, 210, 'Ukuran A5'], ['20 x 25 cm', 200, 250, 'Foto 8R'],
    ['20 x 30 cm', 200, 300, 'Poster kecil'], ['21 x 30 cm', 210, 297, 'Ukuran A4'],
    ['30 x 40 cm', 300, 400, 'Poster sedang'], ['40 x 50 cm', 400, 500, 'Poster'],
    ['50 x 70 cm', 500, 700, 'Poster besar'], ['60 x 80 cm', 600, 800, 'Poster besar'],
    ['70 x 100 cm', 700, 1000, 'Poster jumbo'], ['30 x 30 cm', 300, 300, 'Persegi'],
  ],
};
const KATEGORI = [
  ['kertas', 'Kertas'],
  ['amplop', 'Amplop'],
  ['kartu', 'Kartu'],
  ['foto', 'Foto'],
  ['bingkai', 'Bingkai'],
];
const SATUAN = [
  ['mm', 'Milimeter (mm)'],
  ['cm', 'Sentimeter (cm)'],
  ['inci', 'Inci'],
];

function fmtAngka(n) {
  const v = Math.round(n * 100) / 100;
  return String(v).replace('.', ',');
}
export function konversiUkuran(mm, satuan) {
  if (satuan === 'cm') return fmtAngka(mm / 10) + ' cm';
  if (satuan === 'inci') return fmtAngka(mm / 25.4) + ' inci';
  return fmtAngka(mm) + ' mm';
}
export function cariUkuran(kata) {
  const q = (kata || '').trim().toLowerCase();
  const hasil = [];
  Object.keys(DATA_UKURAN).forEach((kat) => {
    DATA_UKURAN[kat].forEach((baris) => {
      if (!q || baris[0].toLowerCase().indexOf(q) !== -1 || baris[3].toLowerCase().indexOf(q) !== -1) {
        hasil.push({ kat, nama: baris[0], lebar: baris[1], tinggi: baris[2], ket: baris[3] });
      }
    });
  });
  return hasil;
}

export function render(root) {
  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Ukuran kertas seri A, B, dan C mengikuti standar ISO 216. Ukuran lain mengikuti standar yang tertulis di tiap baris. Ketuk satu baris untuk menyalin ukurannya.</p>'));

  const cariI = T.input('text', 'Cari ukuran, contoh: A4 atau amplop');
  root.appendChild(T.field('Cari', cariI));
  const katSel = T.select([['semua', 'Semua kategori']].concat(KATEGORI), 'semua');
  const satuanSel = T.select(SATUAN, 'mm');
  root.appendChild(T.grid2(T.field('Kategori', katSel), T.field('Satuan', satuanSel)));

  const out = T.out();

  function tampil() {
    const q = cariI.value;
    let daftar = cariUkuran(q);
    if (katSel.value !== 'semua') daftar = daftar.filter((d) => d.kat === katSel.value);
    const satuan = satuanSel.value;
    if (!daftar.length) {
      T.show(out, '<div class="dim center" style="padding:14px 0">Tidak ada ukuran yang cocok. Coba kata lain.</div>');
      return;
    }
    let html = '<div style="font-size:12.5px;color:var(--faint);margin-bottom:8px">' + daftar.length + ' ukuran ditemukan.</div>';
    daftar.forEach((d) => {
      const labelKat = (KATEGORI.find(([v]) => v === d.kat) || [])[1] || d.kat;
      html += '<div class="ukuran-baris" data-teks="' + T.esc(d.nama + ': ' + d.lebar + ' x ' + d.tinggi + ' mm') + '" style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer">' +
        '<span><span style="font-weight:700;font-size:14px">' + T.esc(d.nama) + '</span> <span class="hint">' + T.esc(labelKat) + '</span>' +
        '<br><span class="hint">' + T.esc(d.ket) + '</span></span>' +
        '<span style="font-size:14px;white-space:nowrap">' + konversiUkuran(d.lebar, satuan) + ' x ' + konversiUkuran(d.tinggi, satuan) + '</span></div>';
    });
    T.show(out, html);
    out.querySelectorAll('.ukuran-baris').forEach((el) => {
      el.addEventListener('click', () => { T.copy(el.getAttribute('data-teks')); });
    });
  }

  cariI.addEventListener('input', tampil);
  katSel.addEventListener('change', tampil);
  satuanSel.addEventListener('change', tampil);
  root.appendChild(out);
  tampil();
}
