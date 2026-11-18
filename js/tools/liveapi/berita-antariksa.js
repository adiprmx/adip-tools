import { h as T, esc, errBox } from '../../core.js';

// Berita antariksa lewat Spaceflight News API (tanpa key).
// Terverifikasi 18 Nov 2026: api.spaceflightnewsapi.net/v4/articles/ 200, CORS *.
// Catatan: host wajib api.spaceflightnewsapi.net (www 404).
const API = 'https://api.spaceflightnewsapi.net/v4/articles/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function tglCantik(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const imgAman = (u) => {
  if (typeof u !== 'string') return null;
  try {
    const p = new URL(u.trim());
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch (e) { return null; }
};
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "berita-antariksa", "name": "Berita Antariksa", "cat": "liveapi", "icon": "🛰️", "desc": "Berita terbaru dunia antariksa: peluncuran roket, misi, dan penemuan.", "keywords": "berita,antariksa,luar angkasa,roket,nasa,spacex,peluncuran,spaceflight", "since": "6.17.0"};

export function render(root) {
  const box = T.out();

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil berita antariksa terbaru…</p>');
    try {
      const j = await getJSON(API + '?limit=10');
      const list = j && Array.isArray(j.results) ? j.results : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada berita yang bisa diambil saat ini.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' berita terbaru.</p>' +
        list.map((a) => {
          const img = imgAman(a.image_url);
          const isi = (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" data-err="hide" style="width:100%;height:auto;border-radius:8px;display:block;margin-bottom:8px">' : '') +
            '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(String(a.title || 'Tanpa judul')) + '</div>' +
            (a.summary ? '<div class="dim" style="font-size:12.5px;line-height:1.5;margin-top:4px">' + esc(String(a.summary)) + '</div>' : '') +
            '<div class="dim" style="font-size:11.5px;margin-top:6px">' + esc(String(a.news_site || '')) +
            (a.published_at ? ' · ' + esc(tglCantik(a.published_at)) : '') + '</div>';
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            (tautanAman(a.url) ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') +
        '<p class="hint">Sumber: Spaceflight News API. Berita berbahasa Inggris, ketuk untuk membaca selengkapnya di situs aslinya.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server berita tidak merespons dalam 15 detik.'
        : 'Berita gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Berita terbaru seputar roket, misi luar angkasa, dan astronomi dari berbagai media.</p>'));
  root.appendChild(T.row(T.btn('Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
