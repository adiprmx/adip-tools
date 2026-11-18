import { h as T, esc, errBox } from '../../core.js';

// Artikel terbaru dari DEV Community (tanpa key).
// Terverifikasi 18 Nov 2026: dev.to/api/articles 200, CORS *.
const API = 'https://dev.to/api/articles';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function tglCantik(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "artikel-dev-terbaru", "name": "Artikel Dev Terbaru", "cat": "liveapi", "icon": "💻", "desc": "Artikel pemrograman terbaru dari komunitas DEV.to, bisa difilter per topik.", "keywords": "dev.to,artikel,programming,pemrograman,developer,blog,teknologi,dev", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const tagI = T.input('text', 'Topik, contoh: javascript (boleh kosong)');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    const tag = String(tagI.value || '').trim().toLowerCase().replace(/^#/, '');
    T.show(box, '<p class="mut">Mengambil artikel terbaru…</p>');
    try {
      const url = API + '?per_page=12' + (tag ? '&tag=' + encodeURIComponent(tag) : '');
      const j = await getJSON(url);
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada artikel' + (tag ? ' untuk topik ' + esc(tag) : '') + ' saat ini. Coba topik lain atau kosongkan kolom topik.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + j.length + ' artikel terbaru' + (tag ? ' bertopik ' + esc(tag) : '') + '.</p>' +
        j.map((a) => {
          const penulis = (a.user && a.user.name) || 'Penulis DEV';
          const tags = Array.isArray(a.tag_list) ? a.tag_list.slice(0, 4).join(', ') : '';
          const isi = '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(String(a.title || 'Tanpa judul')) + '</div>' +
            (a.description ? '<div class="dim" style="font-size:12.5px;line-height:1.5;margin-top:4px">' + esc(String(a.description)) + '</div>' : '') +
            '<div class="dim" style="font-size:11.5px;margin-top:6px">' + esc(penulis) +
            (a.readable_publish_date ? ' · ' + esc(tglCantik(a.published_at) || String(a.readable_publish_date)) : '') +
            (a.reading_time_minutes ? ' · ' + (Number(a.reading_time_minutes) || 0) + ' menit baca' : '') +
            (a.public_reactions_count != null ? ' · ' + (Number(a.public_reactions_count) || 0) + ' reaksi' : '') +
            (tags ? '<br>Topik: ' + esc(tags) : '') + '</div>';
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            (tautanAman(a.url) ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') +
        '<p class="hint">Sumber: DEV Community (dev.to). Artikel berbahasa Inggris.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server DEV tidak merespons dalam 15 detik.'
        : 'Artikel gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  tagI.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(); });
  root.appendChild(T.el('<p class="note">Artikel pemrograman terbaru dari DEV.to. Isi topik kalau mau yang spesifik, contoh: javascript, python, atau webdev.</p>'));
  root.appendChild(T.field('Topik (opsional)', tagI, 'Kosongkan untuk semua artikel terbaru'));
  root.appendChild(T.row(T.btn('Muat artikel', muat, true)));
  root.appendChild(box);
  muat();
}
