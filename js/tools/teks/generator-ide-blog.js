import { h as T, errBox } from '../../core.js';

export const meta = {"id": "generator-ide-blog", "name": "Generator Ide Blog", "cat": "teks", "icon": "💡", "desc": "Dapat ide judul dan topik blog dari niche yang kamu isi.", "keywords": "ide blog,judul blog,topik blog,niche,blogging,konten", "since": "6.19.0"};

// Pola judul per sudut. {n} diganti niche yang diisi pengguna. Daftar ini
// pola susunan judul, bukan klaim data, jadi tidak ada angka yang dibuat-buat.
export const POLA_BLOG = {
  panduan: [
    'Cara memulai {n} dari nol buat pemula',
    'Panduan lengkap {n} buat yang baru mulai',
    'Langkah demi langkah belajar {n} tanpa bingung',
    'Dasar-dasar {n} yang perlu kamu kuasai dulu',
    'Cara {n} yang benar, dari persiapan sampai selesai',
  ],
  daftar: [
    '10 hal tentang {n} yang sering terlewat',
    '7 kesalahan umum di {n} dan cara menghindarinya',
    '12 tips {n} yang langsung bisa dipakai hari ini',
    '5 alat bantu {n} yang layak dicoba',
    '9 contoh {n} yang bisa jadi inspirasi',
  ],
  perbandingan: [
    '{n} cara lama vs cara baru, mana yang lebih cocok buatmu',
    'Membandingkan dua pendekatan {n} yang paling sering dipakai',
    '{n} murah vs mahal, apa bedanya di hasil akhir',
    'Dua gaya {n} yang berbeda, kapan pakai yang mana',
  ],
  kesalahan: [
    'Kesalahan pemula di {n} yang bikin hasil mengecewakan',
    'Kenapa {n}-mu belum membuahkan hasil, dan cara memperbaikinya',
    'Mitos soal {n} yang masih banyak dipercaya',
    'Hal yang sering salah kaprah tentang {n}',
  ],
  cerita: [
    'Cerita di balik {n}: yang tidak terlihat dari luar',
    'Setahun menekuni {n}, ini yang berubah',
    'Pengalaman pertama mencoba {n}, jujur tanpa dilebihkan',
    'Apa yang kupelajari dari {n} selama ini',
  ],
  opini: [
    'Pendapatku soal tren {n} belakangan ini',
    'Apakah {n} masih layak ditekuni sekarang',
    'Yang perlu berubah dari cara orang memandang {n}',
    'Sisi {n} yang jarang dibahas orang',
  ],
};

export const SUDUT_BLOG = [
  ['campur', 'Campur semua sudut'],
  ['panduan', 'Panduan dan cara'],
  ['daftar', 'Daftar dan tips'],
  ['perbandingan', 'Perbandingan'],
  ['kesalahan', 'Kesalahan dan mitos'],
  ['cerita', 'Cerita dan pengalaman'],
  ['opini', 'Opini dan tren'],
];

// Acak terurut: pakai fungsi acak yang disuntik supaya bisa diuji di Node
// dengan urutan yang bisa ditebak. Mengembalikan judul unik sebanyak diminta.
export function buatIdeBlog(niche, jumlah, sudut, acak) {
  const n = String(niche || '').trim();
  if (!n) return [];
  const rnd = typeof acak === 'function' ? acak : Math.random;
  let pola = [];
  if (sudut && sudut !== 'campur' && POLA_BLOG[sudut]) pola = POLA_BLOG[sudut].slice();
  else Object.keys(POLA_BLOG).forEach((k) => { pola = pola.concat(POLA_BLOG[k]); });
  const isi = pola.map((p) => p.split('{n}').join(n));
  for (let i = isi.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = isi[i]; isi[i] = isi[j]; isi[j] = t;
  }
  const target = Math.max(1, Math.min(30, Math.floor(jumlah) || 10));
  return isi.slice(0, Math.min(target, isi.length));
}

export function render(root) {
  const nicheIn = T.input('text', 'cth: berkebun di lahan sempit', '');
  const sudutSel = T.select(SUDUT_BLOG, 'campur');
  const jumlahSel = T.select([['10', '10 ide'], ['20', '20 ide'], ['30', '30 ide']], '10');
  const box = T.out();
  let hasil = [];

  const proses = () => {
    const niche = nicheIn.value.trim();
    if (!niche) { T.show(box, errBox('Isi dulu niche atau topik blogmu.')); return; }
    hasil = buatIdeBlog(niche, Number(jumlahSel.value), sudutSel.value);
    if (!hasil.length) { T.show(box, errBox('Tidak ada ide yang bisa dibuat dari topik itu.')); return; }
    const daftar = hasil.map((ide, i) =>
      '<div style="display:flex;gap:8px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #27272a">' +
      '<span class="dim" style="min-width:24px">' + (i + 1) + '.</span>' +
      '<span style="flex:1;line-height:1.5">' + T.esc(ide) + '</span>' +
      '<button type="button" class="btn" data-salin="' + i + '" style="flex:none">Salin</button></div>').join('');
    T.show(box, '<p class="dim" style="font-size:13px;margin:0 0 4px">Pilih yang cocok, ubah seperlunya, lalu tulis dengan gayamu sendiri.</p>' + daftar);
    box.querySelectorAll('button[data-salin]').forEach((b) => {
      b.addEventListener('click', () => T.copy(hasil[Number(b.dataset.salin)] || ''));
    });
    box.appendChild(T.row(
      T.copyBtn(() => hasil.join('\n'), 'Salin semua'),
      T.dlBtn('ide-blog.txt', () => hasil.join('\n'), 'text/plain;charset=utf-8', 'Unduh .txt'),
    ));
  };

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Isi niche blogmu, pilih sudutnya, lalu dapat daftar judul yang bisa langsung dipakai atau diubah. Ide disusun dari pola judul yang umum dipakai blogger, bukan dari data tren.</p>'));
  root.appendChild(T.field('Niche atau topik blogmu', nicheIn));
  root.appendChild(T.grid2(T.field('Sudut tulisan', sudutSel), T.field('Jumlah ide', jumlahSel)));
  root.appendChild(T.row(T.btn('Buat ide', proses, true)));
  root.appendChild(box);
}
