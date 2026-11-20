import { h as T, esc, errBox } from '../../core.js';

// Info karakter Rick and Morty, tanpa key.
// Terverifikasi 17 Nov 2026: /api/character/1 -> 200, CORS *.
export const meta = {"id":"karakter-rick-morty","name":"Karakter Rick & Morty","cat":"liveapi","icon":"🛸","desc":"Cari karakter serial Rick and Morty: status, spesies, dan asal mereka.","keywords":"rick and morty,rick,morty,karakter,kartun,serial animasi","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;
const STATUS = { Alive: 'Hidup', Dead: 'Meninggal', unknown: 'Tidak diketahui' };

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Rick, Morty, atau Summer');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama karakter dulu.')); return; }
    T.show(box, '<p class="mut">Mencari karakter ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://rickandmortyapi.com/api/character/?name=' + encodeURIComponent(q));
      const list = (j && j.results) || [];
      if (!list.length) throw new Error('not-found');
      // Hitungan memakai total dari API (j.info.count), bukan jumlah satu
      // halaman; bila ada halaman berikut, beri tahu pengguna.
      const total = (j && j.info && typeof j.info.count === 'number') ? j.info.count : list.length;
      const tampil = list.slice(0, 12);
      const adaBerikutnya = !!(j && j.info && j.info.next);
      T.show(box, '<p class="hint">' + total + ' karakter ditemukan' + (tampil.length < total ? ', ' + tampil.length + ' ditampilkan di sini' : '') + '</p>' +
        (adaBerikutnya ? '<p class="hint">Ada halaman berikut. Ketik nama yang lebih spesifik untuk mempersempit hasil.</p>' : '') +
        tampil.map((k) => {
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
          (gambarAman(k.image) ? '<img src="' + esc(k.image) + '" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:8px;flex:none" loading="lazy" data-err="hide">' : '') +
          '<div style="min-width:0">' +
          '<div style="font-weight:700;font-size:15px">' + esc(k.name || 'Tanpa nama') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          (STATUS[k.status] || esc(k.status || '')) +
          (k.species ? ' · ' + esc(k.species) : '') +
          (k.gender ? ' · ' + esc(k.gender) : '') + '<br>' +
          'Asal: ' + esc((k.origin && k.origin.name) || 'Tidak diketahui') + '<br>' +
          'Terakhir terlihat: ' + esc((k.location && k.location.name) || 'Tidak diketahui') +
          (Array.isArray(k.episode) ? '<br>Muncul di ' + k.episode.length + ' episode' : '') +
          '</div></div></div>';
      }).join('') + '<p class="hint">Sumber: Rick and Morty API.</p>');
      T.wireImgErr(box);
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Karakter tidak ditemukan. Coba nama dalam bahasa Inggris, contoh: Rick.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mencari karakter. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari karakter serial Rick and Morty untuk melihat status, spesies, dan asal mereka.</p>'));
  root.appendChild(T.field('Nama karakter', inp, 'Contoh: Rick, Morty'));
  root.appendChild(T.row(T.btn('🔍 Cari karakter', cari, true)));
  root.appendChild(box);
}
