import { h as T, utils, esc, errBox } from '../../core.js';

// Lelucon acak bertema Chuck Norris, lewat chucknorris.io, tanpa key.
// Terverifikasi 19 Nov 2026: /jokes/random -> 200, CORS *.
export const meta = {"id":"lelucon-chuck-norris","name":"Lelucon Chuck Norris","cat":"liveapi","icon":"🥋","desc":"Lelucon acak bertema Chuck Norris, dalam bahasa Inggris.","keywords":"chuck norris,lelucon,joke,lucu,hiburan,acak,komedi","since":"6.19.0"};

export function render(root) {
  const box = T.out();
  let terakhir = '';

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari lelucon…</p>');
    try {
      const j = await utils.getJson('https://api.chucknorris.io/jokes/random');
      if (!j || typeof j.value !== 'string' || !j.value) throw new Error('bad-data');
      terakhir = j.value;
      T.show(box, '<div class="center" style="font-size:16px;line-height:1.6;padding:8px 0">' + esc(j.value) + '</div>' +
        '<p class="hint center">Sumber: chucknorris.io</p>');
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(T.copyBtn(() => terakhir, '📋 Salin lelucon'));
      box.appendChild(wr);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil lelucon. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu lelucon acak bertema Chuck Norris setiap ketukan, dalam bahasa Inggris.</p>'));
  root.appendChild(T.row(T.btn('🥋 Lelucon lain', muat, true)));
  root.appendChild(box);
  muat();
}
