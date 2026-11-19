import { h as T, esc, errBox } from '../../core.js';

// Foto acak lewat Lorem Picsum (tanpa key).
// Terverifikasi 18 Nov 2026: picsum.photos/v2/list 200, CORS *.
const API = 'https://picsum.photos/v2/list';

const UKURAN = [
  ['400/300', 'Kecil (400x300)'], ['800/600', 'Sedang (800x600)'],
  ['1920/1080', 'Besar (1920x1080)'], ['asli', 'Ukuran asli'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// imgAman kanonis tinggal di utils.urlAman (core.js) — definisi lokal ini tidak pernah dipakai.
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "foto-acak", "name": "Foto Acak", "cat": "liveapi", "icon": "🖼️", "desc": "Foto acak berkualitas tinggi dari Lorem Picsum, bisa diunduh dalam ukuran pilihanmu.", "keywords": "foto,acak,random,picsum,gambar,placeholder,unsplash,unduh foto", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const ukuranS = T.select(UKURAN, '800/600');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    const halaman = 1 + Math.floor(Math.random() * 10);
    T.show(box, '<p class="mut">Mengambil foto acak…</p>');
    try {
      const j = await getJSON(API + '?page=' + halaman + '&limit=9');
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      const ukuran = ukuranS.value;
      T.show(box, '<p class="hint">9 foto acak. Ketuk "Unduh" untuk menyimpan dalam ukuran yang dipilih di atas.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px">' +
        j.map((f) => {
          const id = String(f.id);
          const thumb = 'https://picsum.photos/id/' + encodeURIComponent(id) + '/400/300';
          const unduh = ukuran === 'asli'
            ? (tautanAman(f.download_url) ? f.download_url : 'https://picsum.photos/id/' + encodeURIComponent(id) + '/' + (Number(f.width) || 800) + '/' + (Number(f.height) || 600))
            : 'https://picsum.photos/id/' + encodeURIComponent(id) + '/' + ukuran;
          return '<div>' +
            '<img src="' + esc(thumb) + '" alt="Foto oleh ' + esc(String(f.author || 'tidak diketahui')) + '" loading="lazy" data-err="hide" style="width:100%;height:120px;object-fit:cover;border-radius:8px;display:block">' +
            '<div class="dim" style="font-size:12px;margin-top:6px">Oleh ' + esc(String(f.author || 'tidak diketahui')) + '</div>' +
            '<div style="font-size:12px;margin-top:4px"><a href="' + esc(unduh) + '" target="_blank" rel="noopener">Unduh</a>' +
            (tautanAman(f.url) ? ' · <a href="' + esc(f.url) + '" target="_blank" rel="noopener">Sumber</a>' : '') + '</div>' +
            '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: Lorem Picsum (foto-foto dari Unsplash). Foto bebas dipakai, cantumkan nama fotografernya bila memungkinkan.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Picsum tidak merespons dalam 15 detik.'
        : 'Foto gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Foto-foto acak berkualitas tinggi. Pilih ukuran unduhan, lalu tekan tombol untuk menampilkan foto lain.</p>'));
  root.appendChild(T.field('Ukuran unduhan', ukuranS));
  root.appendChild(T.row(T.btn('Tampilkan foto lain', muat, true)));
  root.appendChild(box);
  muat();
}
