import { h as T, utils } from '../../core.js';

// Cari font coding: kuis 3 pertanyaan + katalog font monospace populer
// untuk ngoding, lengkap dengan pratinjau langsung di halaman.
// Pratinjau memakai Google Fonts bila internet hidup; bila mati, daftar
// dan tautan tetap tampil dan pratinjau jatuh ke font monospace bawaan
// perangkat. Atribut tiap font (ligatur, gaya miring, lisensi, sumber)
// adalah fakta katalog yang bisa dicek di tautan masing-masing.

export const meta = { id: 'cari-font-coding', name: 'Cari Font Coding', cat: 'developer', icon: '🔤', desc: 'Jawab 3 pertanyaan singkat, dapat rekomendasi font coding yang paling enak dibaca, lengkap dengan pratinjau dan tautan unduhnya.', keywords: 'font,coding,monospace,ligatur,programmer,editor,jetbrains,fira code', since: '6.19.0' };

export const CONTOH_KODE = 'const total = harga * jumlah; // 0O Il1\nif (total !== 0 && total >= 100) {\n  return total => diskon;\n}';

export const FONTS = [
  { nama: 'JetBrains Mono', ligatur: true, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/JetBrains+Mono', catatan: 'Bawaan editor JetBrains; tinggi huruf besar, enak dibaca lama.' },
  { nama: 'Fira Code', ligatur: true, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Fira+Code', catatan: 'Pelopor ligatur coding; nol bertitik, panah menyatu rapi.' },
  { nama: 'Cascadia Code', ligatur: true, miring: 'biasa', gratis: true, google: false, url: 'https://github.com/microsoft/cascadia-code', catatan: 'Font bawaan Windows Terminal; ada varian PL dengan ikon powerline.' },
  { nama: 'Victor Mono', ligatur: true, miring: 'kursif', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Victor+Mono', catatan: 'Huruf miringnya kursif ala tulisan tangan, cocok untuk komentar.' },
  { nama: 'Iosevka', ligatur: true, miring: 'biasa', gratis: true, google: false, url: 'https://github.com/be5invis/Iosevka', catatan: 'Sangat sempit, muat banyak kolom; bentuk huruf bisa diatur sendiri.' },
  { nama: 'Monaspace', ligatur: true, miring: 'biasa', gratis: true, google: false, url: 'https://github.com/githubnext/monaspace', catatan: 'Keluarga 5 font dari GitHub; teknik texture healing untuk kode rapat.' },
  { nama: 'Maple Mono', ligatur: true, miring: 'biasa', gratis: true, google: false, url: 'https://github.com/subframe7536/maple-font', catatan: 'Bentuk membulat dan lembut; ada varian dengan ikon Nerd Font.' },
  { nama: 'Commit Mono', ligatur: true, miring: 'biasa', gratis: true, google: false, url: 'https://github.com/eigilnikolaisen/commit-mono', catatan: 'Netral dan bersih; dirancang khusus supaya tidak melelahkan mata.' },
  { nama: 'IBM Plex Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/IBM+Plex+Mono', catatan: 'Keluarga IBM Plex; bentuk tegas, nol bergaris.' },
  { nama: 'Source Code Pro', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Source+Code+Pro', catatan: 'Dari Adobe; tenang dan mudah dibaca di ukuran kecil.' },
  { nama: 'Ubuntu Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Ubuntu+Mono', catatan: 'Bawaan Ubuntu; bentuk khas yang gampang dikenali.' },
  { nama: 'Roboto Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Roboto+Mono', catatan: 'Keluarga Roboto versi monospace; netral dan aman.' },
  { nama: 'Space Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Space+Mono', catatan: 'Gaya retro era mesin tik; tebal dan berkarakter.' },
  { nama: 'Inconsolata', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Inconsolata', catatan: 'Klasik yang sangat mudah dibaca; tanpa banyak hiasan.' },
  { nama: 'PT Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/PT+Mono', catatan: 'Dirancang untuk huruf Latin dan Cyrillic sekaligus.' },
  { nama: 'Hack', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Hack', catatan: 'Turunan Bitstream Vera; nol bergaris, tanda baca besar.' },
  { nama: 'Fantasque Sans Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Fantasque+Sans+Mono', catatan: 'Membulat dan santai; huruf k, w, dan y berbentuk khas.' },
  { nama: 'Intel One Mono', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/Intel+One+Mono', catatan: 'Dari Intel; jelas membedakan 0, O, 1, l, dan I.' },
  { nama: '0xProto', ligatur: false, miring: 'biasa', gratis: true, google: true, url: 'https://fonts.google.com/specimen/0xProto', catatan: 'Nerd Font dari 0xType; ikon terminal sudah termasuk.' },
  { nama: 'Geist Mono', ligatur: false, miring: 'biasa', gratis: true, google: false, url: 'https://github.com/vercel/geist-font', catatan: 'Font Vercel; modern dan rapat, senada dengan Geist Sans.' },
  { nama: 'Dank Mono', ligatur: true, miring: 'kursif', gratis: false, google: false, url: 'https://dankmono.com', catatan: 'Berbayar; huruf miring kursif yang elegan, ligatur halus.' },
  { nama: 'Operator Mono', ligatur: true, miring: 'kursif', gratis: false, google: false, url: 'https://www.typography.com/fonts/operator/overview', catatan: 'Berbayar; terkenal karena huruf miring kursifnya yang cantik.' },
];

// Skor kecocokan kuis: ligatur dan gaya miring masing-masing 2 poin,
// filter gratis mengeliminasi font berbayar. Murni, bisa diuji di Node.
export function nilaiFont(f, j) {
  if (j.gratis && !f.gratis) return -1;
  let skor = 0;
  const alasan = [];
  if (j.ligatur === 'ya' && f.ligatur) { skor += 2; alasan.push('punya ligatur'); }
  if (j.ligatur === 'tidak' && !f.ligatur) { skor += 2; alasan.push('tanpa ligatur'); }
  if (j.miring === 'kursif' && f.miring === 'kursif') { skor += 2; alasan.push('miring kursif'); }
  if (j.miring === 'biasa' && f.miring === 'biasa') { skor += 1; alasan.push('miring biasa'); }
  if (f.gratis) { skor += 0; }
  return { skor, alasan };
}

export function rekomendasikan(jawaban, batas) {
  const hasil = FONTS.map((f) => {
    const n = nilaiFont(f, jawaban);
    return n === -1 ? null : { font: f, skor: n.skor, alasan: n.alasan };
  }).filter(Boolean);
  hasil.sort((a, b) => b.skor - a.skor);
  return hasil.slice(0, batas || 5);
}

export function cariFont(kueri) {
  const q = String(kueri || '').trim().toLowerCase();
  if (!q) return FONTS.slice();
  return FONTS.filter((f) => f.nama.toLowerCase().includes(q) || f.catatan.toLowerCase().includes(q));
}

export function urlGoogleFonts(namaDaftar) {
  const keluarga = namaDaftar.map((n) => 'family=' + n.replace(/ /g, '+') + ':ital,wght@0,400;0,700;1,400').join('&');
  return 'https://fonts.googleapis.com/css2?' + keluarga + '&display=swap';
}

export function render(root) {
  const st = document.createElement('style');
  st.textContent =
    '.fc-kartu{border:1px solid var(--line-soft);border-radius:10px;padding:12px;margin:10px 0}' +
    '.fc-nama{font-size:16px;font-weight:700}' +
    '.fc-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--surface-2);margin:0 4px 4px 0}' +
    '.fc-contoh{font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word;background:var(--surface-2);border-radius:8px;padding:10px;margin:8px 0;font-family:ui-monospace,monospace}' +
    '.fc-pilih{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}';
  root.appendChild(st);

  root.appendChild(T.el('<p class="hint">Font coding yang enak bikin mata tidak cepat lelah. Jawab 3 pertanyaan, atau langsung cari dari daftar ' + FONTS.length + ' font populer di bawah.</p>'));

  // --- Kuis ---
  const qLig = T.select([['ya', 'Ya, penting'], ['tidak', 'Tidak, ganggu'], ['bebas', 'Tidak peduli']], 'ya');
  const qMir = T.select([['kursif', 'Ya, suka yang kursif'], ['biasa', 'Biasa saja'], ['bebas', 'Tidak peduli']], 'bebas');
  const qGra = T.select([['ya', 'Ya, gratis saja'], ['tidak', 'Boleh yang berbayar']], 'ya');
  const hasilKuis = T.el('<div></div>');

  function jalanKuis() {
    const j = { ligatur: qLig.value, miring: qMir.value, gratis: qGra.value === 'ya' };
    const top = rekomendasikan(j, 5);
    let h = '<h3 style="margin:14px 0 4px">Rekomendasi untukmu</h3>';
    if (!top.length) h += '<p class="hint">Tidak ada font yang cocok dengan jawabanmu.</p>';
    top.forEach((r, i) => {
      h += kartuHtml(r.font, '#' + (i + 1) + (r.alasan.length ? ': ' + r.alasan.join(', ') : ''));
    });
    hasilKuis.innerHTML = h;
  }

  // --- Pratinjau Google Fonts ---
  let pratinjauDimuat = false;
  let pratinjauGagal = false;
  const statusPratinjau = T.el('<p class="hint"></p>');

  function muatPratinjau(namaDaftar) {
    const google = namaDaftar.filter((n) => {
      const f = FONTS.find((x) => x.nama === n);
      return f && f.google;
    });
    if (!google.length) {
      statusPratinjau.textContent = 'Font yang dipilih tidak tersedia di Google Fonts, pratinjau memakai font monospace bawaan perangkat.';
      return;
    }
    const tautan = document.createElement('link');
    tautan.rel = 'stylesheet';
    tautan.href = urlGoogleFonts(google.slice(0, 8));
    tautan.onload = () => {
      pratinjauDimuat = true;
      statusPratinjau.textContent = '';
      root.querySelectorAll('.fc-contoh[data-font]').forEach((el) => {
        el.style.fontFamily = '"' + el.dataset.font + '", ui-monospace, monospace';
      });
    };
    tautan.onerror = () => {
      pratinjauGagal = true;
      statusPratinjau.textContent = 'Pratinjau font tidak bisa dimuat (butuh internet). Daftar dan tautan di bawah tetap bisa dipakai.';
    };
    document.head.appendChild(tautan);
  }

  function kartuHtml(f, label) {
    const tag = [];
    tag.push(f.ligatur ? 'ligatur' : 'tanpa ligatur');
    if (f.miring === 'kursif') tag.push('miring kursif');
    tag.push(f.gratis ? 'gratis' : 'berbayar');
    tag.push(f.google ? 'Google Fonts' : 'di luar Google Fonts');
    return '<div class="fc-kartu"><div class="fc-nama">' + T.esc(f.nama) + (label ? ' <span style="font-size:12px;color:var(--faint)">' + T.esc(label) + '</span>' : '') + '</div>' +
      '<div style="margin:6px 0">' + tag.map((t) => '<span class="fc-tag">' + T.esc(t) + '</span>').join('') + '</div>' +
      '<p class="hint" style="margin:4px 0">' + T.esc(f.catatan) + '</p>' +
      '<div class="fc-contoh" data-font="' + T.esc(f.nama) + '"' + (pratinjauDimuat ? ' style="font-family:\'' + T.esc(f.nama) + '\', ui-monospace, monospace"' : '') + '>' + T.esc(CONTOH_KODE) + '</div>' +
      '<a href="' + T.esc(f.url) + '" target="_blank" rel="noopener">Lihat ' + T.esc(f.nama) + ' ↗</a></div>';
  }

  // --- Daftar lengkap ---
  const cariI = T.input('text', 'Cari font, misal "jetbrains"...', '');
  const daftarEl = T.el('<div></div>');

  function tampilDaftar() {
    const hasil = cariFont(cariI.value);
    daftarEl.innerHTML = hasil.length
      ? hasil.map((f) => kartuHtml(f, '')).join('')
      : '<p class="hint">Tidak ada font yang cocok dengan pencarianmu.</p>';
  }

  const btnPratinjau = T.btn('Muat pratinjau font', () => {
    const tampil = Array.from(root.querySelectorAll('.fc-contoh[data-font]')).map((el) => el.dataset.font);
    const unik = tampil.filter((n, i) => tampil.indexOf(n) === i);
    muatPratinjau(unik.length ? unik : FONTS.slice(0, 8).map((f) => f.nama));
  }, true);

  cariI.addEventListener('input', tampilDaftar);
  tampilDaftar();

  root.append(
    T.field('Simbol seperti => dan != mau menyatu jadi satu bentuk (ligatur)?', qLig),
    T.field('Komentar miring mau berbentuk kursif ala tulisan tangan?', qMir),
    T.field('Harus gratis?', qGra),
    T.row(T.btn('Cari font untukku', jalanKuis, true)),
    hasilKuis,
    T.el('<h3 style="margin:18px 0 4px">Semua font</h3>'),
    T.field('Cari', cariI),
    T.row(btnPratinjau),
    statusPratinjau,
    daftarEl,
  );
}
