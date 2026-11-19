import { h as T, utils, esc, errBox } from '../../core.js';

// Foto kucing acak + tulisanmu sendiri, lewat Cataas, tanpa key.
// Terverifikasi 19 Nov 2026: /cat?json=true -> 200, CORS *.
// Pola /cat/{id}/says/{teks} adalah endpoint resmi Cataas yang sama
// (gambar dimuat lewat <img>, jadi CORS tidak relevan untuk gambarnya).
export const meta = {"id":"kucing-teks","name":"Kucing + Teks","cat":"liveapi","icon":"🐱","desc":"Foto kucing acak dengan tulisanmu sendiri di atasnya.","keywords":"kucing,cat,teks,gambar kucing,meme,cataas,tulisan","since":"6.19.0"};

const idAman = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]+$/.test(s);

export function render(root) {
  const inp = T.input('text', 'Tulis sesuatu, mis. Halo!', '');
  inp.maxLength = 60;
  const box = T.out();
  let idKucing = '';

  const tampil = () => {
    if (!idKucing) return;
    const teks = (inp.value || '').trim();
    const url = teks
      ? 'https://cataas.com/cat/' + idKucing + '/says/' + encodeURIComponent(teks)
      : 'https://cataas.com/cat/' + idKucing;
    T.show(box,
      '<div class="center"><img src="' + esc(url) + '" alt="Foto kucing' + (teks ? ' dengan tulisan ' + esc(teks) : ' acak') + '" style="max-width:100%;height:auto;border-radius:10px;display:block" loading="lazy" data-err="hide">' +
      '<p style="margin-top:8px"><a href="' + esc(url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Buka ukuran penuh</a></p></div>' +
      '<p class="hint">Sumber: Cataas.</p>');
    T.wireImgErr(box);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari kucing…</p>');
    try {
      const j = await utils.getJson('https://cataas.com/cat?json=true');
      if (!j || !idAman(j.id)) throw new Error('bad-data');
      idKucing = j.id;
      tampil();
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

  const gantiTeks = () => { if (idKucing) tampil(); else muat(); };

  root.appendChild(T.el('<p class="note">Ketik tulisanmu, lalu ketuk tombolnya. Tulisannya muncul di atas foto kucing acak. Kosongkan kotaknya kalau mau fotonya saja.</p>'));
  root.appendChild(T.field('Tulisan di foto', inp));
  root.appendChild(T.row(T.btn('🐱 Kucing lain', muat, true), T.btn('✏️ Ganti tulisannya', gantiTeks)));
  root.appendChild(box);
  muat();
}
