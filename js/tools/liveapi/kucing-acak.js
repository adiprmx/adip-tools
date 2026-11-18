import { h as T, esc, errBox } from '../../core.js';

// Foto kucing acak lewat The Cat API, tanpa key.
// Terverifikasi 17 Nov 2026: /v1/images/search?limit=1 -> 200, CORS *.
// Catatan: tanpa key, batas permintaan The Cat API rendah, jadi tool ini
// hanya memanggil sekali per ketukan tombol, tanpa muat ulang otomatis.
export const meta = {"id":"kucing-acak","name":"Kucing Acak","cat":"liveapi","icon":"🐱","desc":"Foto kucing acak setiap kali kamu mengetuk tombolnya.","keywords":"kucing,cat,foto kucing,acak,hewan,lucu","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari kucing…</p>');
    try {
      const j = await getJSON('https://api.thecatapi.com/v1/images/search?limit=1');
      const foto = Array.isArray(j) && j[0];
      if (!foto || !gambarAman(foto.url)) throw new Error('bad-data');
      const ras = foto.breeds && foto.breeds[0];
      T.show(box,
        '<div class="center"><img src="' + esc(foto.url) + '" alt="Foto kucing acak" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" data-err="hide">' +
        (ras && ras.name ? '<p class="hint" style="margin-top:8px">Ras: ' + esc(ras.name) + (ras.origin ? ' dari ' + esc(ras.origin) : '') + '</p>' : '') +
        '<p style="margin-top:8px"><a href="' + esc(foto.url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Buka ukuran penuh</a></p></div>' +
        '<p class="hint">Sumber: The Cat API.</p>');
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil foto kucing. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Satu foto kucing acak setiap ketukan. Beda dengan Fakta Kucing yang isinya teks, tool ini menampilkan fotonya.</p>'));
  root.appendChild(T.row(T.btn('🐱 Kucing lain', muat, true)));
  root.appendChild(box);
  muat();
}
