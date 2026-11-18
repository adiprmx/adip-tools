import { h as T, esc, errBox } from '../../core.js';

// Daftar game gratis lewat FreeToGame (tanpa key).
// Terverifikasi 18 Nov 2026: www.freetogame.com/api/games 200, CORS *.
// Catatan di live-api-verified.md: tidak ada masalah CORS untuk endpoint ini.
const API = 'https://www.freetogame.com/api/games';

const PLATFORM = [
  ['all', 'Semua platform'], ['pc', 'PC'], ['browser', 'Peramban'],
];
const URUT = [
  ['popularity', 'Paling populer'], ['release-date', 'Terbaru rilis'],
  ['alphabetical', 'Nama A ke Z'], ['relevance', 'Paling relevan'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const imgAman = (u) => {
  if (typeof u !== 'string') return null;
  try {
    const p = new URL(u.trim());
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch (e) { return null; }
};
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "game-gratis", "name": "Game Gratis", "cat": "liveapi", "icon": "🎮", "desc": "Daftar game PC dan peramban yang gratis dimainkan, diurutkan dari yang paling populer.", "keywords": "game,gratis,free to play,pc,browser,freetogame,main game", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const platS = T.select(PLATFORM, 'pc');
  const urutS = T.select(URUT, 'popularity');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil daftar game gratis…</p>');
    try {
      const j = await getJSON(API + '?platform=' + encodeURIComponent(platS.value) + '&sort-by=' + encodeURIComponent(urutS.value));
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada game yang bisa diambil saat ini.</p>');
        return;
      }
      const list = j.slice(0, 24);
      T.show(box, '<p class="hint">' + list.length + ' game teratas. Ketuk game untuk membuka halaman mainnya.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:10px">' +
        list.map((g) => {
          const gambar = imgAman(g.thumbnail);
          const link = tautanAman(g.game_url) ? g.game_url : null;
          const isi = (gambar ? '<img src="' + esc(gambar) + '" alt="' + esc(String(g.title || 'Game')) + '" loading="lazy" data-err="hide" style="width:100%;height:auto;border-radius:8px;display:block">' : '') +
            '<div style="font-size:13px;line-height:1.4;margin-top:6px;font-weight:700">' + esc(String(g.title || 'Tanpa judul')) + '</div>' +
            '<div class="dim" style="font-size:11.5px">' + esc(String(g.genre || '')) + (g.platform ? ' · ' + esc(String(g.platform)) : '') + '</div>' +
            (g.short_description ? '<div class="dim" style="font-size:12px;line-height:1.4;margin-top:4px">' + esc(String(g.short_description).slice(0, 120)) + '</div>' : '');
          return '<div>' + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: FreeToGame. Game gratis dimainkan, sebagian menawarkan pembelian dalam game.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server FreeToGame tidak merespons dalam 15 detik.'
        : 'Daftar game gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Game yang bisa dimainkan gratis di PC atau langsung di peramban. Pilih platform dan urutannya, lalu ketuk game untuk mulai main.</p>'));
  root.appendChild(T.field('Platform', platS));
  root.appendChild(T.field('Urutkan', urutS));
  root.appendChild(T.row(T.btn('Lihat game', muat, true)));
  root.appendChild(box);
  muat();
}
