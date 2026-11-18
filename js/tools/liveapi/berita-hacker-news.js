import { h as T, esc, errBox } from '../../core.js';

// Berita teknologi teratas dari Hacker News (tanpa key).
// Terverifikasi 18 Nov 2026: hacker-news.firebaseio.com/v0/topstories.json 200, CORS echo.
const API = 'https://hacker-news.firebaseio.com/v0';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function waktuLalu(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  if (isNaN(d)) return '';
  const beda = Date.now() - d.getTime();
  const jam = Math.floor(beda / 3600000);
  if (jam < 1) return 'baru saja';
  if (jam < 24) return jam + ' jam lalu';
  const hari = Math.floor(jam / 24);
  return hari + ' hari lalu';
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "berita-hacker-news", "name": "Berita Hacker News", "cat": "liveapi", "icon": "📰", "desc": "Berita teknologi teratas dari Hacker News: startup, pemrograman, dan sains.", "keywords": "hacker news,berita,teknologi,startup,programming,hn,y combinator", "since": "6.17.0"};

export function render(root) {
  const box = T.out();

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil berita teratas Hacker News…</p>');
    try {
      const ids = await getJSON(API + '/topstories.json');
      if (!Array.isArray(ids) || !ids.length) throw new Error('bad-data');
      // Satu aksi pengguna: ambil 10 berita teratas (10 panggilan item).
      const hasil = await Promise.all(ids.slice(0, 10).map((id) =>
        getJSON(API + '/item/' + id + '.json').catch(() => null)));
      const list = hasil.filter((it) => it && it.title);
      if (!list.length) throw new Error('bad-data');
      T.show(box, '<p class="hint">' + list.length + ' berita teratas saat ini.</p>' +
        list.map((it, i) => {
          const link = tautanAman(it.url) ? it.url : 'https://news.ycombinator.com/item?id=' + Number(it.id);
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            '<div style="font-weight:700;font-size:14px;line-height:1.4"><a href="' + esc(link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + (i + 1) + '. ' + esc(String(it.title)) + '</a></div>' +
            '<div class="dim" style="font-size:12px;margin-top:4px">' +
            (Number(it.score) || 0) + ' poin · oleh ' + esc(String(it.by || 'anonim')) +
            ' · ' + esc(waktuLalu(it.time)) +
            ' · <a href="https://news.ycombinator.com/item?id=' + Number(it.id) + '" target="_blank" rel="noopener">' + (Number(it.descendants) || 0) + ' komentar</a></div></div>';
        }).join('') +
        '<p class="hint">Sumber: Hacker News (Y Combinator). Berita berbahasa Inggris.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Hacker News tidak merespons dalam 15 detik.'
        : 'Berita gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Sepuluh berita teknologi teratas dari Hacker News saat ini. Ketuk judul untuk membaca sumbernya, ketuk jumlah komentar untuk diskusinya.</p>'));
  root.appendChild(T.row(T.btn('Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
