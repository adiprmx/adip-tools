import { h as T, esc, errBox } from '../../core.js';

// Fakta acak lewat Useless Facts API (tanpa key).
// Terverifikasi 18 Nov 2026: uselessfacts.jsph.pl/api/v2/facts/random 200, CORS *.
const API = 'https://uselessfacts.jsph.pl/api/v2/facts/random';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "fakta-tak-berguna", "name": "Fakta Tak Berguna", "cat": "liveapi", "icon": "🤓", "desc": "Fakta acak yang tidak berguna tapi seru buat bahan obrolan.", "keywords": "fakta,acak,tak berguna,random,useless facts,trivia,seru", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mencari fakta acak…</p>');
    try {
      const j = await getJSON(API);
      if (!j || !j.text) throw new Error('bad-data');
      T.show(box, '<div class="center"><div style="font-size:17px;line-height:1.6;font-weight:700">“' + esc(String(j.text)) + '”</div>' +
        (j.source ? '<div class="dim" style="font-size:12px;margin-top:8px">Sumber: ' + esc(String(j.source)) + '</div>' : '') +
        (tautanAman(j.source_url) ? '<div style="font-size:12.5px;margin-top:4px"><a href="' + esc(j.source_url) + '" target="_blank" rel="noopener">Buka sumber fakta</a></div>' : '') +
        '</div><p class="hint">Fakta ditampilkan dalam bahasa Inggris apa adanya dari Useless Facts API.</p>');
      const w = T.el('<div class="center" style="margin-top:10px"></div>');
      w.appendChild(T.btn('Fakta lain', muat, true));
      box.appendChild(w);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server fakta tidak bisa dihubungi dalam 15 detik.'
        : 'Fakta gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Satu fakta acak setiap kali ditekan. Tidak berguna, tapi lumayan buat bahan obrolan.</p>'));
  root.appendChild(T.row(T.btn('Tampilkan fakta', muat, true)));
  root.appendChild(box);
  muat();
}
