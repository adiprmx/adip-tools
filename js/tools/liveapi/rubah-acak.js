import { h as T, utils, esc, errBox } from '../../core.js';

// Foto rubah acak lewat randomfox.ca, tanpa key.
// Terverifikasi 19 Nov 2026: /floof/ -> JSON hidup
// ({"image":"https://randomfox.ca/images/90.jpg", ...}).
export const meta = {"id":"rubah-acak","name":"Rubah Acak","cat":"liveapi","icon":"🦊","desc":"Foto rubah acak setiap kali kamu mengetuk tombolnya.","keywords":"rubah,fox,foto rubah,acak,hewan,lucu","since":"6.19.0"};

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari rubah…</p>');
    try {
      const j = await utils.getJson('https://randomfox.ca/floof/');
      if (!j || !gambarAman(j.image)) throw new Error('bad-data');
      T.show(box,
        '<div class="center"><img src="' + esc(j.image) + '" alt="Foto rubah acak" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" data-err="hide">' +
        (gambarAman(j.link) ? '<p style="margin-top:8px"><a href="' + esc(j.link) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat di randomfox.ca</a></p>' : '') + '</div>' +
        '<p class="hint">Sumber: randomfox.ca.</p>');
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil foto rubah. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu foto rubah acak setiap ketukan.</p>'));
  root.appendChild(T.row(T.btn('🦊 Rubah lain', muat, true)));
  root.appendChild(box);
  muat();
}
