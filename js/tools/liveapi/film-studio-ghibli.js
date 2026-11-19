import { h as T, esc, errBox, utils } from '../../core.js';

// Film Studio Ghibli lewat Ghibli API (tanpa key).
// Terverifikasi 18 Nov 2026: ghibliapi.vercel.app/films 200, CORS echo.
const API = 'https://ghibliapi.vercel.app/films';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// imgAman kanonis tinggal di utils.urlAman (core.js).

export const meta = {"id": "film-studio-ghibli", "name": "Film Studio Ghibli", "cat": "liveapi", "icon": "🎞️", "desc": "Daftar film Studio Ghibli lengkap: judul, sutradara, tahun, dan sinopsisnya.", "keywords": "ghibli,film,anime,studio ghibli,miyazaki,totoro,spirited away", "since": "6.17.0"};

export function render(root) {
  const box = T.out();

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil daftar film Ghibli…</p>');
    try {
      const j = await getJSON(API);
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      const list = j.slice().sort((a, b) => Number(a.release_date || 0) - Number(b.release_date || 0));
      T.show(box, '<p class="hint">' + list.length + ' film, diurutkan dari yang paling lama. Ketuk "Sinopsis" untuk membaca ceritanya.</p>' +
        list.map((f) => {
          const gambar = utils.urlAman(f.image);
          const skor = Number(f.rt_score);
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
            (gambar ? '<img src="' + esc(gambar) + '" alt="' + esc(String(f.title || 'Poster film')) + '" loading="lazy" data-err="hide" style="width:72px;height:auto;border-radius:8px;flex:none;object-fit:cover;align-self:flex-start">' : '') +
            '<div style="min-width:0;flex:1">' +
            '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(String(f.title || 'Tanpa judul')) + '</div>' +
            '<div class="dim" style="font-size:12px;margin-top:2px">' +
            (f.original_title ? esc(String(f.original_title)) + ' · ' : '') +
            (f.release_date ? esc(String(f.release_date)) : '') +
            (isFinite(skor) ? ' · skor ' + skor + '/100' : '') + '</div>' +
            '<div class="dim" style="font-size:12px">Sutradara: ' + esc(String(f.director || 'tidak ada info')) +
            (f.producer ? ' · Produser: ' + esc(String(f.producer)) : '') +
            (f.running_time ? ' · ' + esc(String(f.running_time)) + ' menit' : '') + '</div>' +
            (f.description ? '<details style="margin-top:6px"><summary style="cursor:pointer;font-size:12.5px">Sinopsis</summary><div class="dim" style="font-size:12.5px;line-height:1.6;margin-top:6px">' + esc(String(f.description)) + '</div></details>' : '') +
            '</div></div>';
        }).join('') +
        '<p class="hint">Sumber: Ghibli API. Sinopsis berbahasa Inggris.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Ghibli API tidak merespons dalam 15 detik.'
        : 'Daftar film gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Semua film Studio Ghibli, dari yang paling lama sampai yang terbaru, lengkap dengan sutradara dan sinopsisnya.</p>'));
  root.appendChild(T.row(T.btn('Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
