import { h as T, esc, errBox } from '../../core.js';

// Galeri font Google Fonts, lewat GitHub API repo google/fonts + CSS
// Google Fonts. Terverifikasi 19 Nov 2026:
// api.github.com/repos/google/fonts/contents/ofl -> 200, CORS *;
// fonts.googleapis.com/css2 -> 200, CORS *.
// Daftar nama font diambil dari folder ofl/ (100 per halaman). Nama asli
// keluarga font dibaca dari METADATA.pb tiap font saat dipilih, lalu
// pratinjau dimuat dari Google Fonts CSS. Tanpa key; batas GitHub tanpa
// login 60 permintaan per jam per alamat IP.
export const meta = {"id":"galeri-font-google","name":"Galeri Font Google","cat":"desain","icon":"Aa","desc":"Jelajahi font Google Fonts, lihat pratinjau dengan teksmu sendiri, dan salin untuk dipakai.","keywords":"font,google fonts,tipografi,huruf,desain,pratinjau","since":"6.19.0", "online": true};

const API = 'https://api.github.com/repos/google/fonts/contents/ofl?per_page=100&page=';
const META = 'https://api.github.com/repos/google/fonts/contents/ofl/';

async function getJSON(url, mentah) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const opt = { signal: c.signal };
    if (mentah) opt.headers = { Accept: 'application/vnd.github.v3.raw' };
    const r = await fetch(url, opt);
    if (r.status === 403 || r.status === 429) throw new Error('rate');
    if (!r.ok) throw new Error('http ' + r.status);
    return mentah ? r.text() : r.json();
  } finally { clearTimeout(t); }
}

function namaDariSlug(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Cari font, contoh: roboto, noto, inter');
  inp.setAttribute('autocomplete', 'off');
  const contoh = T.input('text', 'Tulis teks untuk pratinjau', 'Adip Tools 123');
  const daftarBox = T.out();
  const lagiBox = T.out();
  let semua = [];
  let halaman = 0;
  let habis = false;
  let memuat = false;
  let aktif = null;

  const pasangCss = (keluarga) => {
    let link = document.getElementById('galeri-font-google-css');
    if (!link) {
      link = document.createElement('link');
      link.id = 'galeri-font-google-css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(keluarga).replace(/%20/g, '+') + ':wght@400;700&display=swap';
  };

  const tampilPratinjau = () => {
    if (!aktif) return;
    const cssUrl = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(aktif.keluarga).replace(/%20/g, '+') + ':wght@400;700&display=swap';
    T.show(box,
      '<div style="font-size:15px;font-weight:700">' + esc(aktif.keluarga) + '</div>' +
      '<div class="dim" style="font-size:12.5px">Folder: ' + esc(aktif.slug) + '</div>' +
      '<p style="font-family:\'' + esc(aktif.keluarga) + '\',sans-serif;font-size:26px;line-height:1.4;margin:10px 0;word-break:break-word">' + esc(contoh.value.trim() || 'Adip Tools 123') + '</p>' +
      '<p style="font-family:\'' + esc(aktif.keluarga) + '\',sans-serif;font-size:16px;font-weight:700;margin:0 0 10px;word-break:break-word">' + esc(contoh.value.trim() || 'Adip Tools 123') + '</p>' +
      '<p class="hint">Tautan CSS font ini (tempel di HTML atau @import):</p>' +
      '<p style="font-size:12px;word-break:break-all;background:var(--panel,#f4f4f4);padding:8px;border-radius:8px">' + esc(cssUrl) + '</p>');
    const wr = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>');
    wr.appendChild(T.copyBtn(() => cssUrl, 'Salin tautan CSS'));
    wr.appendChild(T.copyBtn(() => aktif.keluarga, 'Salin nama font'));
    box.appendChild(wr);
  };

  const pilih = async (slug) => {
    T.show(box, '<p class="mut">Mengambil detail font…</p>');
    try {
      const pb = await getJSON(META + encodeURIComponent(slug) + '/METADATA.pb', true);
      const m = typeof pb === 'string' && pb.match(/^name:\s*"([^"]+)"/m);
      if (!m) throw new Error('bad-data');
      aktif = { slug, keluarga: m[1] };
      pasangCss(m[1]);
      tampilPratinjau();
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 20 detik.'
        : e.message === 'rate'
          ? 'Batas permintaan GitHub tercapai (60 per jam). Coba lagi nanti.'
          : 'Gagal mengambil detail font ini. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', () => pilih(slug)));
      box.appendChild(wr);
    }
  };

  const tampilDaftar = (filter) => {
    const q = (filter || '').trim().toLowerCase();
    const cocok = semua.filter((s) => !q || s.toLowerCase().includes(q) || namaDariSlug(s).toLowerCase().includes(q));
    if (!cocok.length) {
      T.show(daftarBox, '<p class="center dim">Tidak ada font yang cocok dengan "' + esc(filter) + '" di antara yang sudah dimuat. Muat lagi di bawah untuk menambah daftar.</p>');
      return;
    }
    let html = '<p class="hint">' + cocok.length + ' font. Ketuk nama untuk melihat pratinjau.</p><div style="display:flex;flex-wrap:wrap;gap:6px">';
    cocok.forEach((s) => {
      html += '<button type="button" class="btn" data-font="' + esc(s) + '">' + esc(namaDariSlug(s)) + '</button>';
    });
    html += '</div>';
    T.show(daftarBox, html);
    daftarBox.querySelectorAll('[data-font]').forEach((b) => {
      b.addEventListener('click', () => pilih(b.getAttribute('data-font')));
    });
  };

  const tampilLagi = () => {
    T.show(lagiBox, '');
    if (habis) {
      T.show(lagiBox, '<p class="hint">Semua font sudah dimuat.</p>');
      return;
    }
    const wr = T.el('<div style="margin-top:10px"></div>');
    wr.appendChild(T.btn('Muat 100 font lagi', muat));
    lagiBox.appendChild(wr);
  };

  const muat = async () => {
    if (memuat) return;
    memuat = true;
    T.show(lagiBox, '<p class="mut">Memuat…</p>');
    if (!semua.length) T.show(daftarBox, '<p class="mut">Mengambil daftar font dari Google Fonts…</p>');
    try {
      const j = await getJSON(API + (halaman + 1));
      const list = Array.isArray(j) ? j.filter((x) => x && x.type === 'dir').map((x) => x.name) : [];
      if (!list.length && !semua.length) throw new Error('bad-data');
      if (list.length < 100) habis = true;
      halaman++;
      semua = semua.concat(list);
      tampilDaftar(inp.value);
      tampilLagi();
      if (halaman === 1) T.show(box, '<p class="center dim">Pilih font di bawah untuk melihat pratinjau dengan teksmu.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 20 detik.'
        : e.message === 'rate'
          ? 'Batas permintaan GitHub tercapai (60 per jam). Coba lagi nanti.'
          : 'Gagal mengambil daftar font. Cek koneksi internet, lalu coba lagi.';
      const target = semua.length ? lagiBox : daftarBox;
      if (!semua.length) T.show(lagiBox, '');
      T.show(target, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      target.appendChild(wr);
    } finally { memuat = false; }
  };

  inp.addEventListener('input', () => { if (semua.length) tampilDaftar(inp.value); });
  contoh.addEventListener('input', tampilPratinjau);
  root.appendChild(T.el('<p class="note">Daftar font dari repo Google Fonts. Ketuk nama font untuk melihat pratinjau dengan teksmu sendiri dan menyalin tautan CSS-nya.</p>'));
  root.appendChild(T.field('Teks pratinjau', contoh));
  root.appendChild(T.field('Cari font', inp));
  root.appendChild(box);
  root.appendChild(daftarBox);
  root.appendChild(lagiBox);
  muat();
}
