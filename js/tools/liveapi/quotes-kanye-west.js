import { h as T, utils, esc, errBox } from '../../core.js';

// Kutipan acak Kanye West, tanpa key.
// Terverifikasi 19 Nov 2026: / -> 200, CORS *.
export const meta = {"id":"quotes-kanye-west","name":"Quotes Kanye West","cat":"liveapi","icon":"🎤","desc":"Kutipan acak Kanye West, dalam bahasa Inggris.","keywords":"kanye west,quotes,kutipan,acak,musik","since":"6.19.0"};

export function render(root) {
  const box = T.out();
  let terakhir = '';

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari kutipan…</p>');
    try {
      const j = await utils.getJson('https://api.kanye.rest/');
      if (!j || typeof j.quote !== 'string' || !j.quote) throw new Error('bad-data');
      terakhir = j.quote;
      T.show(box, '<div class="center" style="padding:12px 4px">' +
        '<div style="font-size:20px;line-height:1.6;font-weight:600">“' + esc(j.quote) + '”</div>' +
        '<div class="dim" style="margin-top:10px">- Kanye West</div></div>' +
        '<p class="hint center">Sumber: kanye.rest</p>');
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(T.copyBtn(() => terakhir, '📋 Salin kutipan'));
      box.appendChild(wr);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil kutipan. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu kutipan acak Kanye West setiap ketukan, dalam bahasa Inggris.</p>'));
  root.appendChild(T.row(T.btn('🎤 Kutipan lain', muat, true)));
  root.appendChild(box);
  muat();
}
