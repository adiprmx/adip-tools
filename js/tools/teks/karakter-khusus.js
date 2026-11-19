import { h as T } from '../../core.js';

// Karakter Khusus: kumpulan simbol dan karakter Unicode yang susah
// diketik di keyboard HP. Ketuk untuk menyalin, lalu tempel di mana saja.
// Tiap karakter menampilkan kode Unicodenya.
export const meta = {"id": "karakter-khusus", "name": "Karakter Khusus", "cat": "teks", "icon": "✦", "desc": "Pilih dan salin simbol atau karakter Unicode yang susah diketik.", "keywords": "karakter khusus,simbol,unicode,copy paste character,simbol matematika,panah,simbol mata uang", "since": "6.18.0"};

// [karakter, nama, kategori]
export const KARAKTER = [
  ['←', 'panah kiri', 'Panah'], ['↑', 'panah atas', 'Panah'], ['→', 'panah kanan', 'Panah'],
  ['↓', 'panah bawah', 'Panah'], ['↔', 'panah kiri kanan', 'Panah'], ['↕', 'panah atas bawah', 'Panah'],
  ['↖', 'panah kiri atas', 'Panah'], ['↗', 'panah kanan atas', 'Panah'], ['↘', 'panah kanan bawah', 'Panah'],
  ['↙', 'panah kiri bawah', 'Panah'], ['⇐', 'panah ganda kiri', 'Panah'], ['⇒', 'panah ganda kanan', 'Panah'],
  ['⇑', 'panah ganda atas', 'Panah'], ['⇓', 'panah ganda bawah', 'Panah'], ['↩', 'panah kembali', 'Panah'],
  ['↪', 'panah maju', 'Panah'], ['↵', 'panah enter', 'Panah'], ['⟶', 'panah panjang', 'Panah'],
  ['$', 'dolar', 'Mata uang'], ['€', 'euro', 'Mata uang'], ['£', 'poundsterling', 'Mata uang'],
  ['¥', 'yen', 'Mata uang'], ['₹', 'rupee', 'Mata uang'], ['₽', 'rubel', 'Mata uang'],
  ['₩', 'won', 'Mata uang'], ['¢', 'sen', 'Mata uang'], ['฿', 'baht', 'Mata uang'],
  ['₺', 'lira turki', 'Mata uang'], ['₴', 'hryvnia', 'Mata uang'], ['₫', 'dong', 'Mata uang'],
  ['₱', 'peso', 'Mata uang'], ['₪', 'shekel', 'Mata uang'], ['₿', 'bitcoin', 'Mata uang'],
  ['±', 'plus minus', 'Matematika'], ['×', 'kali', 'Matematika'], ['÷', 'bagi', 'Matematika'],
  ['=', 'sama dengan', 'Matematika'], ['≠', 'tidak sama dengan', 'Matematika'], ['≈', 'kira-kira', 'Matematika'],
  ['≤', 'kurang dari sama dengan', 'Matematika'], ['≥', 'lebih dari sama dengan', 'Matematika'],
  ['<', 'kurang dari', 'Matematika'], ['>', 'lebih dari', 'Matematika'], ['∞', 'tak hingga', 'Matematika'],
  ['√', 'akar', 'Matematika'], ['π', 'pi', 'Matematika'], ['∑', 'sigma jumlah', 'Matematika'],
  ['∫', 'integral', 'Matematika'], ['Δ', 'delta', 'Matematika'], ['Ω', 'omega ohm', 'Matematika'],
  ['°', 'derajat', 'Matematika'], ['%', 'persen', 'Matematika'], ['‰', 'permil', 'Matematika'],
  ['¹', 'pangkat satu', 'Matematika'], ['²', 'pangkat dua', 'Matematika'], ['³', 'pangkat tiga', 'Matematika'],
  ['½', 'setengah', 'Matematika'], ['¼', 'seperempat', 'Matematika'], ['¾', 'tiga perempat', 'Matematika'],
  ['©', 'hak cipta', 'Tanda baca'], ['®', 'merek terdaftar', 'Tanda baca'], ['™', 'merek dagang', 'Tanda baca'],
  ['•', 'titik tengah', 'Tanda baca'], ['…', 'titik tiga', 'Tanda baca'], ['«', 'kutip sudut kiri', 'Tanda baca'],
  ['»', 'kutip sudut kanan', 'Tanda baca'], ['“', 'kutip buka', 'Tanda baca'], ['”', 'kutip tutup', 'Tanda baca'],
  ['‘', 'kutip satu buka', 'Tanda baca'], ['’', 'kutip satu tutup', 'Tanda baca'], ['—', 'strip panjang', 'Tanda baca'],
  ['–', 'strip sedang', 'Tanda baca'], ['§', 'pasal', 'Tanda baca'], ['¶', 'paragraf', 'Tanda baca'],
  ['†', 'salib latin', 'Tanda baca'], ['‡', 'salib ganda', 'Tanda baca'],
  ['★', 'bintang penuh', 'Bentuk'], ['☆', 'bintang kosong', 'Bentuk'], ['♥', 'hati penuh', 'Bentuk'],
  ['♡', 'hati kosong', 'Bentuk'], ['♦', 'wajik', 'Bentuk'], ['♣', 'keriting', 'Bentuk'],
  ['♠', 'sekop', 'Bentuk'], ['●', 'lingkaran penuh', 'Bentuk'], ['○', 'lingkaran kosong', 'Bentuk'],
  ['■', 'kotak penuh', 'Bentuk'], ['□', 'kotak kosong', 'Bentuk'], ['▲', 'segitiga atas', 'Bentuk'],
  ['▼', 'segitiga bawah', 'Bentuk'], ['◆', 'belah ketupat penuh', 'Bentuk'], ['◇', 'belah ketupat kosong', 'Bentuk'],
  ['⬛', 'kotak hitam besar', 'Bentuk'], ['⬜', 'kotak putih besar', 'Bentuk'], ['🔺', 'segitiga merah', 'Bentuk'],
  ['✓', 'centang', 'Tanda'], ['✔', 'centang tebal', 'Tanda'], ['✗', 'silang', 'Tanda'],
  ['✘', 'silang tebal', 'Tanda'], ['⚠', 'peringatan', 'Tanda'], ['⚡', 'petir', 'Tanda'],
  ['☑', 'kotak centang', 'Tanda'], ['☐', 'kotak kosong', 'Tanda'], ['☒', 'kotak silang', 'Tanda'],
  ['♻', 'daur ulang', 'Tanda'], ['⚙', 'roda gigi', 'Tanda'], ['✂', 'gunting', 'Tanda'],
  ['✎', 'pensil', 'Tanda'], ['✉', 'amplop', 'Tanda'], ['☎', 'telepon', 'Tanda'],
  ['♪', 'not musik', 'Musik'], ['♫', 'not musik ganda', 'Musik'], ['♩', 'not seperempat', 'Musik'],
  ['♬', 'not musik tiga', 'Musik'], ['♭', 'mol', 'Musik'], ['♮', 'natural', 'Musik'],
  ['♯', 'kres', 'Musik'], ['𝄞', 'kunci G', 'Musik'],
  ['☀', 'matahari', 'Cuaca'], ['☁', 'awan', 'Cuaca'], ['☂', 'payung', 'Cuaca'],
  ['☃', 'manusia salju', 'Cuaca'], ['❄', 'kepingan salju', 'Cuaca'], ['☔', 'payung hujan', 'Cuaca'],
  ['🌙', 'bulan sabit', 'Cuaca'], ['⭐', 'bintang', 'Cuaca'],
  ['α', 'alfa', 'Yunani'], ['β', 'beta', 'Yunani'], ['γ', 'gama', 'Yunani'],
  ['δ', 'delta kecil', 'Yunani'], ['ε', 'epsilon', 'Yunani'], ['θ', 'teta', 'Yunani'],
  ['λ', 'lamda', 'Yunani'], ['μ', 'mu mikro', 'Yunani'], ['σ', 'sigma', 'Yunani'],
  ['φ', 'fi', 'Yunani'], ['ω', 'omega kecil', 'Yunani'],
];

export const KATEGORI = [...new Set(KARAKTER.map((k) => k[2]))];

// Kode Unicode satu karakter, misal U+2192. Murni, bisa diuji di Node.
export function kodeUnicode(ch) {
  const s = String(ch || '');
  if (!s) return '';
  return 'U+' + s.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
}

// Cari karakter berdasarkan nama atau kategori. Murni, bisa diuji di Node.
export function cariKarakter(q) {
  const kata = String(q || '').trim().toLowerCase();
  if (!kata) return KARAKTER.slice();
  return KARAKTER.filter((k) => k[1].includes(kata) || k[2].toLowerCase().includes(kata) || k[0] === q);
}

export function render(root) {
  const cariI = T.input('text', 'cth: panah, hati, euro', '');
  const katI = T.select([['semua', 'Semua kategori']].concat(KATEGORI.map((k) => [k, k])), 'semua');
  const box = T.out();
  const detailBox = T.out();

  const gambar = () => {
    let daftar = cariKarakter(cariI.value);
    if (katI.value !== 'semua') daftar = daftar.filter((k) => k[2] === katI.value);
    if (!daftar.length) {
      T.show(box, '<p class="note">Tidak ada karakter yang cocok. Coba kata lain, contoh: panah, hati, bintang.</p>');
      return;
    }
    T.show(box, '');
    daftar.forEach(([ch, nama, kat]) => {
      const b = T.el('<button type="button" class="btn" style="font-size:20px;min-width:52px;min-height:48px" title="' + T.esc(nama) + ' (' + kodeUnicode(ch) + ')"></button>');
      b.textContent = ch;
      b.addEventListener('click', () => {
        T.copy(ch);
        T.show(detailBox, '<p class="note">Disalin: <b style="font-size:20px">' + T.esc(ch) + '</b> ' + T.esc(nama) + ' (' + kodeUnicode(ch) + ', ' + T.esc(kat) + '). Tempel di mana saja.</p>');
      });
      box.appendChild(b);
    });
  };

  cariI.addEventListener('input', gambar);
  katI.addEventListener('change', gambar);

  root.appendChild(T.el('<p class="note">' + KARAKTER.length + ' karakter. Ketuk satu untuk menyalinnya, lalu tempel di mana saja.</p>'));
  root.appendChild(T.grid2(T.field('Cari', cariI), T.field('Kategori', katI)));
  root.appendChild(detailBox);
  root.appendChild(box);
  gambar();
}
