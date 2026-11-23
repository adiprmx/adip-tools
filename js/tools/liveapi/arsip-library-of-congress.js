import { h as T, esc, errBox, utils } from '../../core.js';

// Foto dan dokumen sejarah dari Library of Congress AS (tanpa key).
// Terverifikasi 18 Nov 2026: www.loc.gov/photos/?fo=json 200, CORS *.
const API = 'https://www.loc.gov/photos/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// imgAman kanonis tinggal di utils.urlAman (core.js).
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "arsip-library-of-congress", "name": "Arsip Library of Congress", "cat": "liveapi", "icon": "🏛️", "desc": "Foto dan dokumen sejarah dari perpustakaan nasional Amerika Serikat.", "keywords": "library of congress,arsip,sejarah,foto lama,dokumen,loc,amerika", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: new york, railroad, war, jazz…', 'new york');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: railroad atau jazz.')); return; }
    T.show(box, '<p class="mut">Mencari arsip tentang ' + esc(q) + '…</p>');
    try {
      const j = await getJSON(API + '?q=' + encodeURIComponent(q) + '&fo=json&c=12');
      const items = j && Array.isArray(j.results) ? j.results : [];
      if (!items.length) {
        T.show(box, '<p class="center dim">Tidak ada arsip yang cocok. Coba kata lain dalam bahasa Inggris.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + items.length + ' arsip ditemukan. Ketuk untuk membuka halaman aslinya.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px">' +
        items.map((it) => {
          const item = it.item || {};
          const imgs = Array.isArray(item.image_url) ? item.image_url : [];
          const thumb = utils.urlAman(imgs[imgs.length - 1] || imgs[0]);
          const judul = String(it.title || 'Tanpa judul');
          const link = tautanAman(item.url) ? item.url : (tautanAman(it.url) ? it.url : null);
          const isi = (thumb ? '<img src="' + esc(thumb) + '" alt="' + esc(judul) + '" loading="lazy" data-err="hide" style="width:100%;height:120px;object-fit:cover;border-radius:8px;display:block">' : '<div style="height:120px;border-radius:8px;background:#221d18;display:flex;align-items:center;justify-content:center"><span class="dim" style="font-size:12px">Tidak ada pratinjau</span></div>') +
            '<div style="font-size:12.5px;line-height:1.4;margin-top:6px">' + esc(judul) + '</div>' +
            (it.date ? '<div class="dim" style="font-size:11.5px">' + esc(String(it.date)) + '</div>' : '');
          return '<div>' + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: Library of Congress, Amerika Serikat. Banyak koleksinya sudah domain publik, cek halaman aslinya untuk ketentuan tiap item.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server arsip tidak bisa dihubungi dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Arsip foto dan dokumen sejarah dari perpustakaan nasional AS. Kata kunci dalam bahasa Inggris memberi hasil paling banyak.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Contoh: new york, railroad, jazz, war'));
  root.appendChild(T.row(T.btn('Cari arsip', cari, true)));
  root.appendChild(box);
  cari();
}
