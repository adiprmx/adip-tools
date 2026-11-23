import { h as T, esc, errBox } from '../../core.js';

// Cari paper ilmiah lewat Crossref (tanpa key).
// Terverifikasi 18 Nov 2026: api.crossref.org/works 200, CORS *.
const API = 'https://api.crossref.org/works';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function tahunTerbit(w) {
  const p = w.published || w.issued || w['published-print'] || w['published-online'];
  const dp = p && Array.isArray(p['date-parts']) && p['date-parts'][0];
  return dp && dp[0] ? String(dp[0]) : '';
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "cari-jurnal-paper", "name": "Cari Jurnal/Paper", "cat": "liveapi", "icon": "📚", "desc": "Cari paper dan jurnal ilmiah lewat metadata DOI dari Crossref.", "keywords": "jurnal,paper,ilmiah,crossref,doi,riset,penelitian,skripsi,artikel ilmiah", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: climate change, machine learning…', 'climate change');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: climate change.')); return; }
    T.show(box, '<p class="mut">Mencari paper tentang ' + esc(q) + '…</p>');
    try {
      const j = await getJSON(API + '?query=' + encodeURIComponent(q) + '&rows=10&select=DOI,title,author,container-title,published,issued,type,URL');
      const msg = j && j.message;
      const list = msg && Array.isArray(msg.items) ? msg.items : [];
      const total = msg ? Number(msg['total-results']) || 0 : 0;
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada paper yang cocok. Coba kata lain, umumnya dalam bahasa Inggris.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' hasil teratas' + (total ? ' dari ' + total.toLocaleString('id-ID') + ' yang cocok' : '') + '.</p>' +
        list.map((w) => {
          const judul = Array.isArray(w.title) && w.title[0] ? String(w.title[0]) : 'Tanpa judul';
          const penulis = Array.isArray(w.author) ? w.author.slice(0, 4).map((a) => ((a.given || '') + ' ' + (a.family || '')).trim()).filter(Boolean).join(', ') : '';
          const jurnal = Array.isArray(w['container-title']) && w['container-title'][0] ? String(w['container-title'][0]) : '';
          const thn = tahunTerbit(w);
          const doi = w.DOI ? 'https://doi.org/' + encodeURIComponent(String(w.DOI)) : null;
          const link = tautanAman(w.URL) ? w.URL : doi;
          const isi = '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(judul) + '</div>' +
            '<div class="dim" style="font-size:12px;line-height:1.5;margin-top:4px">' +
            (penulis ? esc(penulis) : '') +
            (jurnal ? '<br>' + esc(jurnal) : '') +
            (thn ? ' · ' + esc(thn) : '') +
            (w.type ? ' · ' + esc(String(w.type)) : '') +
            (w.DOI ? '<br>DOI: ' + esc(String(w.DOI)) : '') + '</div>';
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') +
        '<p class="hint">Sumber: Crossref. Tautan DOI mengarah ke halaman penerbit, sebagian paper mungkin berbayar.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Crossref tidak bisa dihubungi dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari paper dan jurnal ilmiah dari jutaan catatan DOI. Kata kunci bahasa Inggris memberi hasil paling banyak.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Contoh: climate change, machine learning, diabetes'));
  root.appendChild(T.row(T.btn('Cari paper', cari, true)));
  root.appendChild(box);
  cari();
}
