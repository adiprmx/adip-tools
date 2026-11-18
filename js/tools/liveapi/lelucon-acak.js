import { h as T, esc, errBox } from '../../core.js';

// Lelucon acak lewat JokeAPI, tanpa key, mode aman WAJIB.
// Terverifikasi 17 Nov 2026: /joke/Any?safe-mode -> 200, CORS *.
// Parameter safe-mode menyaring konten dewasa dan ofensif.
export const meta = {"id":"lelucon-acak","name":"Lelucon Acak","cat":"liveapi","icon":"😄","desc":"Lelucon acak dari berbagai kategori, sudah disaring agar aman dibaca semua umur.","keywords":"lelucon,joke,lucu,hiburan,acak,komedi","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (!j || j.error) throw new Error('bad-data');
    return j;
  } finally { clearTimeout(t); }
}

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari lelucon…</p>');
    try {
      const j = await getJSON('https://v2.jokeapi.dev/joke/Any?safe-mode');
      if (j.type === 'single' && j.joke) {
        T.show(box, '<div class="center" style="font-size:16px;line-height:1.6;padding:8px 0">' + esc(j.joke) + '</div>' +
          '<p class="hint center">Kategori: ' + esc(j.category || 'Umum') + ' · Sumber: JokeAPI (mode aman)</p>');
      } else if (j.type === 'twopart' && j.setup) {
        T.show(box, '<div class="center" style="font-size:16px;line-height:1.6;padding:8px 0">' + esc(j.setup) + '</div>' +
          '<div class="center"><button class="btn" id="lj-jawab">Lihat jawabannya</button></div>' +
          '<div id="lj-delivery" class="center" style="font-size:16px;line-height:1.6;padding:8px 0" hidden></div>' +
          '<p class="hint center">Kategori: ' + esc(j.category || 'Umum') + ' · Sumber: JokeAPI (mode aman)</p>');
        const b = box.querySelector('#lj-jawab');
        const d = box.querySelector('#lj-delivery');
        if (b && d) b.addEventListener('click', () => { d.hidden = false; d.textContent = j.delivery || ''; b.remove(); });
      } else {
        throw new Error('bad-data');
      }
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

  root.appendChild(T.el('<p class="note">Lelucon acak dalam bahasa Inggris dari berbagai kategori. Mode aman aktif, jadi tidak ada konten dewasa.</p>'));
  root.appendChild(T.row(T.btn('😄 Lelucon lain', muat, true)));
  root.appendChild(box);
  muat();
}
