import { h as T, esc, errBox } from '../../core.js';

// Ayat Alkitab lewat bible-api.com (tanpa key).
// Terverifikasi 18 Nov 2026: bible-api.com/john 3:16 200, CORS *.
const API = 'https://bible-api.com/';

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

export const meta = {"id": "ayat-alkitab", "name": "Ayat Alkitab", "cat": "liveapi", "icon": "✝️", "desc": "Cari dan baca ayat Alkitab berdasarkan kitab, pasal, dan ayat.", "keywords": "alkitab,bible,ayat,firman,kitab,pasal,injil,renungan", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Yohanes 3:16 atau John 3:16', 'Yohanes 3:16');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const ref = String(inp.value || '').trim();
    if (!ref) { T.show(box, errBox('Tulis rujukan ayat dulu, contoh: Yohanes 3:16.')); return; }
    T.show(box, '<p class="mut">Mencari ' + esc(ref) + '…</p>');
    try {
      const j = await getJSON(API + encodeURIComponent(ref));
      const ayat = j && Array.isArray(j.verses) ? j.verses : [];
      if (!ayat.length) throw new Error('not-found');
      T.show(box, '<p class="center"><b style="font-size:16px">' + esc(String(j.reference || ref)) + '</b></p>' +
        ayat.map((v) => '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
          '<p style="font-size:15px;line-height:1.7">' + esc(String(v.text || '').trim()) + '</p>' +
          '<p class="dim" style="font-size:12px">' + esc(String(v.book_name || '')) + ' ' + (Number(v.chapter) || '') + ':' + (Number(v.verse) || '') + '</p>' +
          '</div>').join('') +
        '<p class="hint">Teks dalam bahasa Inggris (' + esc(String(j.translation_name || 'World English Bible')) + '). Sumber: bible-api.com.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Ayat tidak ditemukan. Periksa ejaan kitab dan nomornya, contoh: Yohanes 3:16, Mazmur 23, atau John 3:16.</p>');
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Alkitab tidak bisa dihubungi dalam 15 detik.'
        : 'Ayat gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Tulis nama kitab, pasal, dan ayat. Bisa satu ayat atau satu pasal utuh, contoh: Mazmur 23.</p>'));
  root.appendChild(T.field('Rujukan ayat', inp, 'Contoh: Yohanes 3:16, Mazmur 23, Kejadian 1:1'));
  root.appendChild(T.row(T.btn('Cari ayat', cari, true)));
  root.appendChild(box);
}
