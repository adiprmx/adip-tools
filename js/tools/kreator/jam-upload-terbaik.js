import { h as T } from '../../core.js';

// Jam Upload Terbaik: panduan jam unggah per platform dari ringkasan data
// yang dipublikasikan (Sprout Social, Hootsuite, Later, 2024-2025).
// Semua jam di bawah ini PATOKAN UMUM, bukan janji: jam terbaik tiap akun
// beda-beda, tergantung siapa penontonmu. Cek analitik akunmu sendiri
// untuk angka yang paling cocok. Jam bisa digeser ke zona waktumu.
export const meta = {"id": "jam-upload-terbaik", "name": "Jam Upload Terbaik", "cat": "kreator", "icon": "🕐", "desc": "Panduan jam unggah terbaik per platform, patokan umum dari data yang dipublikasikan.", "keywords": "jam upload terbaik,jam posting tiktok,jam posting instagram,jam upload youtube,waktu posting,prime time konten", "since": "6.18.0"};

// Jam dalam WIB (UTC+7). [mulai, selesai] per jendela.
export const DATA_JAM = {
  tiktok: {
    nama: 'TikTok',
    hariKerja: [[10, 12], [19, 21]],
    akhirPekan: [[11, 13], [19, 22]],
    catatan: 'Penonton TikTok paling ramai menjelang istirahat siang dan malam hari.',
  },
  instagram: {
    nama: 'Instagram (Reels & Feed)',
    hariKerja: [[9, 11], [19, 20]],
    akhirPekan: [[10, 12]],
    catatan: 'Pagi hari kerja dan malam hari paling ramai; siang akhir pekan juga bagus.',
  },
  youtube: {
    nama: 'YouTube',
    hariKerja: [[12, 15], [19, 21]],
    akhirPekan: [[9, 11], [19, 21]],
    catatan: 'YouTube paling ramai sore sampai malam; pagi akhir pekan ramai penonton santai.',
  },
  facebook: {
    nama: 'Facebook',
    hariKerja: [[9, 12], [13, 15]],
    akhirPekan: [[12, 14]],
    catatan: 'Facebook paling ramai pagi sampai siang hari kerja.',
  },
  x: {
    nama: 'X (Twitter)',
    hariKerja: [[8, 10], [19, 21]],
    akhirPekan: [[9, 11]],
    catatan: 'X paling ramai pagi saat orang baru bangun dan malam hari.',
  },
};

export const ZONA_WAKTU = [
  ['WIB (UTC+7)', 7],
  ['WITA (UTC+8)', 8],
  ['WIT (UTC+9)', 9],
  ['Singapura / Malaysia (UTC+8)', 8],
  ['London (UTC+0)', 0],
  ['New York (UTC-5)', -5],
  ['Los Angeles (UTC-8)', -8],
];

// Geser jam dari WIB ke zona lain. Murni, bisa diuji di Node.
export function geserJam(jam, keUtc) {
  const j = Number(jam);
  const ke = Number(keUtc);
  if (!isFinite(j) || !isFinite(ke)) return null;
  const hasil = (j + (ke - 7)) % 24;
  return hasil < 0 ? hasil + 24 : hasil;
}

export function fmtJam(jam) {
  const j = Math.floor(Number(jam) || 0);
  return String(j).padStart(2, '0') + ':00';
}

export function render(root) {
  const platI = T.select(Object.keys(DATA_JAM).map((k) => [k, DATA_JAM[k].nama]), 'tiktok');
  const zonaI = T.select(ZONA_WAKTU.map(([l, v]) => [String(v), l]), '7');
  const box = T.out();

  const gambar = () => {
    const d = DATA_JAM[platI.value];
    const ke = Number(zonaI.value);
    const jendela = (daftar) => daftar.map(([a, b]) => {
      const a2 = geserJam(a, ke), b2 = geserJam(b, ke);
      return '<div class="kv"><span class="k">' + fmtJam(a2) + ' - ' + fmtJam(b2) + '</span><span class="v">jendela ramai</span></div>';
    }).join('');
    T.show(box,
      '<div class="big">' + T.esc(d.nama) + '</div>' +
      '<p class="note">' + T.esc(d.catatan) + '</p>' +
      '<div class="dim" style="margin-top:10px">Senin sampai Jumat</div>' + jendela(d.hariKerja) +
      '<div class="dim" style="margin-top:10px">Sabtu dan Minggu</div>' + jendela(d.akhirPekan) +
      '<p class="hint">Jam di atas patokan umum dari ringkasan data yang dipublikasikan Sprout Social, Hootsuite, dan Later (2024-2025). Jam terbaik tiap akun beda, cek analitik akunmu sendiri untuk angka yang paling cocok.</p>');
  };

  platI.addEventListener('change', gambar);
  zonaI.addEventListener('change', gambar);

  root.appendChild(T.el('<p class="note">Jam di sini patokan umum, bukan janji. Penonton tiap akun beda, jadi cek analitik akunmu sendiri untuk angka yang paling cocok.</p>'));
  root.appendChild(T.grid2(T.field('Platform', platI), T.field('Zona waktumu', zonaI)));
  root.appendChild(box);
  gambar();
}
