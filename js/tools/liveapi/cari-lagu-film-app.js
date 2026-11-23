import { h as T, esc, errBox, utils } from '../../core.js';

// Cari lagu, film, dan aplikasi lewat iTunes Search API (tanpa key).
// Terverifikasi 18 Nov 2026: itunes.apple.com/search 200, CORS *.
const API = 'https://itunes.apple.com/search';

const JENIS = [
  ['', 'Semua'], ['musicTrack', 'Lagu'], ['movie', 'Film'],
  ['software', 'Aplikasi'], ['podcast', 'Podcast'], ['audiobook', 'Buku audio'],
  ['ebook', 'Buku digital'], ['tvSeason', 'Serial TV'],
];

const LABEL_JENIS = {
  song: 'Lagu', 'feature-movie': 'Film', software: 'Aplikasi', podcast: 'Podcast',
  audiobook: 'Buku audio', ebook: 'Buku digital', 'tv-episode': 'Episode TV',
  'music-video': 'Video musik',
};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// mediaAman kanonis tinggal di utils.urlAman (core.js).
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "cari-lagu-film-app", "name": "Cari Lagu/Film/App", "cat": "liveapi", "icon": "🎵", "desc": "Cari lagu, film, podcast, dan aplikasi di iTunes Store, lengkap dengan cuplikan lagunya.", "keywords": "itunes,lagu,film,aplikasi,podcast,musik,cari lagu,apple", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: coldplay, avengers, spotify…', 'coldplay');
  const jenisS = T.select(JENIS, '');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: coldplay.')); return; }
    T.show(box, '<p class="mut">Mencari ' + esc(q) + ' di iTunes…</p>');
    try {
      let url = API + '?term=' + encodeURIComponent(q) + '&limit=12';
      if (jenisS.value) url += '&entity=' + encodeURIComponent(jenisS.value);
      const j = await getJSON(url);
      const list = j && Array.isArray(j.results) ? j.results : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada hasil yang cocok. Coba kata lain atau ubah jenisnya ke "Semua".</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' hasil ditemukan.</p>' +
        list.map((r) => {
          const nama = String(r.trackName || r.collectionName || 'Tanpa nama');
          const artis = String(r.artistName || '');
          const gambar = utils.urlAman(r.artworkUrl100);
          const pratinjauAll = utils.urlAman(r.previewUrl);
          const pratinjau = pratinjauAll && pratinjauAll.indexOf('https://') === 0 ? pratinjauAll : null;
          const label = LABEL_JENIS[r.kind] || String(r.kind || r.wrapperType || '');
          const link = tautanAman(r.trackViewUrl) ? r.trackViewUrl : (tautanAman(r.collectionViewUrl) ? r.collectionViewUrl : null);
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
            (gambar ? '<img src="' + esc(gambar) + '" alt="" loading="lazy" data-err="hide" style="width:64px;height:64px;border-radius:8px;flex:none;object-fit:cover">' : '') +
            '<div style="min-width:0;flex:1">' +
            '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(nama) + '</div>' +
            (artis ? '<div class="dim" style="font-size:12.5px">' + esc(artis) + '</div>' : '') +
            '<div class="dim" style="font-size:11.5px;margin-top:2px">' + esc(label) +
            (r.primaryGenreName ? ' · ' + esc(String(r.primaryGenreName)) : '') +
            (r.trackPrice != null ? ' · ' + esc(String(r.currency || '')) + ' ' + esc(String(r.trackPrice)) : '') + '</div>' +
            (pratinjau ? '<audio controls preload="none" src="' + esc(pratinjau) + '" style="width:100%;height:32px;margin-top:6px"></audio>' : '') +
            (link ? '<div style="font-size:12px;margin-top:4px"><a href="' + esc(link) + '" target="_blank" rel="noopener">Buka di iTunes</a></div>' : '') +
            '</div></div>';
        }).join('') +
        '<p class="hint">Sumber: iTunes Search API (Apple). Cuplikan audio hanya tersedia untuk sebagian lagu dan podcast.</p>');
      T.wireImgErr(box);
      box.querySelectorAll('audio').forEach((a) => {
        a.addEventListener('error', () => {
          const p = document.createElement('div');
          p.className = 'dim';
          p.style.cssText = 'font-size:12px;margin-top:6px';
          p.textContent = 'Cuplikan lagu ini tidak bisa diputar saat ini.';
          a.replaceWith(p);
        }, { once: true });
      });
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server iTunes tidak bisa dihubungi dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari lagu, film, podcast, sampai aplikasi di katalog iTunes. Untuk lagu, ada cuplikan 30 detik yang bisa diputar.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Contoh: coldplay, avengers, spotify'));
  root.appendChild(T.field('Jenis', jenisS));
  root.appendChild(T.row(T.btn('Cari', cari, true)));
  root.appendChild(box);
  cari();
}
