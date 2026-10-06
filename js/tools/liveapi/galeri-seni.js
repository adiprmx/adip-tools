import { h as T, esc } from '../../core.js?v=6.9.5';

export const meta = {"id":"galeri-seni","name":"Galeri Seni Dunia","cat":"liveapi","icon":"🖼️","desc":"Jelajahi karya seni acak dari Art Institute of Chicago.","keywords":"seni,galeri,lukisan,museum,art,acak,karya,chicago"};

export function render(root) {
  const box = T.out();

  const getJson = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) {
        const err = new Error('HTTP ' + res.status);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const acak = async () => {
    const page = 1 + Math.floor(Math.random() * 50);
    T.show(box, '<div class="dim center">Mengambil karya seni acak…</div>');
    try {
      const d = await getJson('https://api.artic.edu/api/v1/artworks?page=' + page + '&limit=12&fields=id,title,artist_title,image_id,date_display');
      const semua = d.data || [];
      // Karya tanpa image_id dilewati — ambil yang lain dari batch yang sama.
      const bergambar = semua.filter((a) => a && a.image_id);
      if (!bergambar.length) throw new Error('no-image');
      const karya = bergambar[Math.floor(Math.random() * bergambar.length)];
      const imgUrl = 'https://www.artic.edu/iiif/2/' + karya.image_id + '/full/843,/0/default.jpg';
      let html = '<div class="center" style="margin-bottom:12px">' +
        '<img src="' + esc(imgUrl) + '" alt="' + esc(karya.title || 'karya seni') + '" loading="lazy" style="max-width:100%;max-height:60vh;object-fit:contain;border-radius:10px;border:1px solid #ffffff20">' +
        '<div style="font-size:18px;font-weight:700;margin-top:10px">' + esc(karya.title || 'Tanpa judul') + '</div>' +
        '<div class="dim">' + esc(karya.artist_title || 'Seniman tidak diketahui') + (karya.date_display ? ' · ' + esc(karya.date_display) : '') + '</div>' +
        '</div>';
      html += '<div class="hint">Sumber: Art Institute of Chicago (domain publik / CC0).</div>';
      T.show(box, html);
      const wrap = T.el('<div class="center" style="margin-top:10px"></div>');
      wrap.appendChild(T.btn('🎲 Karya acak lainnya', acak));
      box.appendChild(wrap);
    } catch (e) {
      let msg;
      if (e && e.name === 'AbortError') msg = 'Waktu habis — server tidak merespons dalam 15 detik. Periksa koneksi internet lalu coba lagi.';
      else if (e && e.message === 'no-image') msg = 'Batch ini tidak punya gambar. Coba lagi.';
      else msg = 'Gagal mengambil karya seni. Periksa koneksi internet lalu coba lagi.';
      T.show(box, '<span class="err">' + esc(msg) + '</span>');
      const wrap = T.el('<div style="margin-top:8px"></div>');
      wrap.appendChild(T.btn('🔄 Coba lagi', acak));
      box.appendChild(wrap);
    }
  };

  root.appendChild(T.row(T.btn('🎲 Karya acak', acak, true)));
  root.appendChild(box);
}
