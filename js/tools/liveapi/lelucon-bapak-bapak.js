import { h as T, esc, errBox } from '../../core.js';

// Lelucon bapak-bapak (dad joke) lewat icanhazdadjoke, tanpa key.
// Terverifikasi 17 Nov 2026: https://icanhazdadjoke.com/ -> 200, CORS *.
// WAJIB header Accept: application/json. Tanpa header itu API
// mengembalikan halaman HTML, bukan JSON.
export const meta = {"id":"lelucon-bapak-bapak","name":"Lelucon Bapak-Bapak","cat":"liveapi","icon":"👨","desc":"Lelucon receh gaya bapak-bapak, satu ketukan satu lelucon baru.","keywords":"dad joke,lelucon bapak-bapak,joke,lucu,receh,hiburan","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari lelucon…</p>');
    try {
      const j = await getJSON('https://icanhazdadjoke.com/');
      if (!j || !j.joke) throw new Error('bad-data');
      T.show(box, '<div class="center" style="font-size:17px;line-height:1.6;padding:8px 0">' + esc(j.joke) + '</div>' +
        '<p class="hint center">Sumber: icanhazdadjoke.com</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 15 detik.'
        : 'Gagal mengambil lelucon. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Lelucon receh gaya bapak-bapak dalam bahasa Inggris. Satu ketukan, satu lelucon baru.</p>'));
  root.appendChild(T.row(T.btn('👨 Lelucon lain', muat, true)));
  root.appendChild(box);
  muat();
}
