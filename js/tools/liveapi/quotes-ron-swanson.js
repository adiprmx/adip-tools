import { h as T, utils, esc, errBox } from '../../core.js';

// Kutipan acak Ron Swanson (tokoh serial Parks & Recreation), tanpa key.
// Terverifikasi 19 Nov 2026: /v2/quotes -> 200, CORS *.
export const meta = {"id":"quotes-ron-swanson","name":"Quotes Ron Swanson","cat":"liveapi","icon":"🥩","desc":"Kutipan acak Ron Swanson dari serial Parks & Recreation, dalam bahasa Inggris.","keywords":"ron swanson,quotes,kutipan,parks and recreation,acak,lucu","since":"6.19.0", "online": true};

export function render(root) {
  const box = T.out();
  let terakhir = '';

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari kutipan…</p>');
    try {
      const j = await utils.getJson('https://ron-swanson-quotes.herokuapp.com/v2/quotes');
      const q = Array.isArray(j) && j[0];
      if (typeof q !== 'string' || !q) throw new Error('bad-data');
      terakhir = q;
      T.show(box, '<div class="center" style="padding:12px 4px">' +
        '<div style="font-size:20px;line-height:1.6;font-weight:600">“' + esc(q) + '”</div>' +
        '<div class="dim" style="margin-top:10px">- Ron Swanson</div></div>' +
        '<p class="hint center">Sumber: Ron Swanson Quotes</p>');
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(T.copyBtn(() => terakhir, '📋 Salin kutipan'));
      box.appendChild(wr);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil kutipan. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu kutipan acak Ron Swanson setiap ketukan, dalam bahasa Inggris.</p>'));
  root.appendChild(T.row(T.btn('🥩 Kutipan lain', muat, true)));
  root.appendChild(box);
  muat();
}
