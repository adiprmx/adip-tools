import { h as T, esc, errBox } from '../../core.js';

// Info karakter Disney lewat Disney API, tanpa key.
// Terverifikasi 17 Nov 2026: /character?pageSize=1 -> 200, CORS *.
export const meta = {"id":"karakter-disney","name":"Karakter Disney","cat":"liveapi","icon":"🏰","desc":"Cari karakter Disney: film, serial, dan game tempat mereka muncul.","keywords":"disney,karakter,mickey,princess,pixar,film disney,animasi","since":"6.17.0", "online": true};

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
const daftar = (a, n) => (Array.isArray(a) ? a.filter(Boolean).slice(0, n || 5) : []);

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Mickey Mouse, Elsa, atau Simba');
  inp.setAttribute('autocomplete', 'off');

  const tampil = (list) => {
    T.show(box, list.map((k) => {
      const film = daftar(k.films);
      const serial = daftar(k.tvShows);
      const game = daftar(k.videoGames);
      return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
        (gambarAman(k.imageUrl) ? '<img src="' + esc(k.imageUrl) + '" alt="" style="width:84px;height:84px;object-fit:cover;border-radius:8px;flex:none" loading="lazy" data-err="hide">' : '') +
        '<div style="min-width:0">' +
        '<div style="font-weight:700;font-size:15px">' + esc(k.name || 'Tanpa nama') + '</div>' +
        (film.length ? '<div class="hint">Film: ' + esc(film.join(', ')) + '</div>' : '') +
        (serial.length ? '<div class="hint">Serial: ' + esc(serial.join(', ')) + '</div>' : '') +
        (game.length ? '<div class="hint">Game: ' + esc(game.join(', ')) + '</div>' : '') +
        (!film.length && !serial.length && !game.length ? '<div class="hint">Belum ada daftar film atau serial untuk karakter ini.</div>' : '') +
        '</div></div>';
    }).join('') + '<p class="hint">Sumber: Disney API.</p>');
    T.wireImgErr(box);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis nama karakter dulu.')); return; }
    T.show(box, '<p class="mut">Mencari karakter ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://api.disneyapi.dev/character?name=' + encodeURIComponent(q));
      const data = j && j.data;
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      if (!list.length) throw new Error('not-found');
      tampil(list.slice(0, 8));
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Karakter tidak ditemukan. Coba nama dalam bahasa Inggris, contoh: Mickey Mouse.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Disney API tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mencari karakter. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  const acak = async () => {
    T.show(box, '<p class="mut">Mengambil karakter acak…</p>');
    try {
      const halaman = 1 + Math.floor(Math.random() * 200);
      const j = await getJSON('https://api.disneyapi.dev/character?page=' + halaman + '&pageSize=6');
      const data = j && j.data;
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      if (!list.length) throw new Error('bad-data');
      tampil(list);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Disney API tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil karakter. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', acak));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari karakter Disney untuk melihat film, serial, dan game tempat mereka muncul. Atau ketuk tombol acak untuk menjelajah.</p>'));
  root.appendChild(T.field('Nama karakter', inp, 'Contoh: Mickey Mouse, Elsa'));
  root.appendChild(T.row(T.btn('🔍 Cari karakter', cari, true), T.btn('🎲 Karakter acak', acak)));
  root.appendChild(box);
}
