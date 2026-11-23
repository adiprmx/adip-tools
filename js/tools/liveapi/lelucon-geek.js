import { h as T, utils, esc, errBox } from '../../core.js';

// Lelucon acak bertema teknologi dan programming, tanpa key.
// Terverifikasi 19 Nov 2026: /api?format=json -> 200, CORS echo.
export const meta = {"id":"lelucon-geek","name":"Lelucon Geek","cat":"liveapi","icon":"🤓","desc":"Lelucon acak bertema teknologi dan programming, dalam bahasa Inggris.","keywords":"geek,lelucon,joke,lucu,teknologi,programming,komedi,acak","since":"6.19.0", "online": true};

export function render(root) {
  const box = T.out();
  let terakhir = '';

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari lelucon…</p>');
    try {
      const j = await utils.getJson('https://geek-jokes.sameerkumar.website/api?format=json');
      if (!j || typeof j.joke !== 'string' || !j.joke) throw new Error('bad-data');
      terakhir = j.joke;
      T.show(box, '<div class="center" style="font-size:16px;line-height:1.6;padding:8px 0">' + esc(j.joke) + '</div>' +
        '<p class="hint center">Sumber: Geek Jokes</p>');
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(T.copyBtn(() => terakhir, '📋 Salin lelucon'));
      box.appendChild(wr);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil lelucon. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu lelucon acak bertema teknologi dan programming setiap ketukan, dalam bahasa Inggris.</p>'));
  root.appendChild(T.row(T.btn('🤓 Lelucon lain', muat, true)));
  root.appendChild(box);
  muat();
}
