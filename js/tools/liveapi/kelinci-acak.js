import { h as T, esc, errBox } from '../../core.js';

// GIF kelinci acak lewat Bunnies API, tanpa key.
// Terverifikasi 19 Nov 2026: /v2/loop/random/?media=gif -> 200, CORS echo.
// Respons: { media: { gif, poster } }. Poster dipakai sebagai gambar diam
// cadangan bila GIF gagal dimuat.
export const meta = {"id":"kelinci-acak","name":"Kelinci Acak","cat":"liveapi","icon":"🐰","desc":"GIF kelinci acak setiap kali kamu mengetuk tombolnya.","keywords":"kelinci,bunny,rabbit,gif,acak,hewan,lucu","since":"6.19.0"};

const API = 'https://api.bunnies.io/v2/loop/random/?media=gif';

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari kelinci…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    try {
      const r = await fetch(API, { signal: c.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const gif = j && j.media && j.media.gif;
      const poster = j && j.media && j.media.poster;
      if (!gambarAman(gif)) throw new Error('bad-data');
      T.show(box,
        '<div class="center"><img src="' + esc(gif) + '" alt="GIF kelinci acak" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" data-err="hide">' +
        (gambarAman(poster) ? '<p style="margin-top:8px"><a href="' + esc(poster) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat gambar diamnya</a></p>' : '') +
        '</div><p class="hint">Sumber: Bunnies API.</p>');
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil GIF kelinci. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  root.appendChild(T.el('<p class="note">Satu GIF kelinci acak setiap ketukan. Beda dengan Kucing Acak dan Anjing Acak yang fotonya diam, di sini kelincinya bergerak.</p>'));
  root.appendChild(T.row(T.btn('🐰 Kelinci lain', muat, true)));
  root.appendChild(box);
  muat();
}
