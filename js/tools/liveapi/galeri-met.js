import { h as T, esc, errBox } from '../../core.js';

// Koleksi Metropolitan Museum of Art lewat Met Collection API (tanpa key).
// Terverifikasi 18 Nov 2026: collectionapi.metmuseum.org 200, CORS *.
// Beda dari galeri-seni (Art Institute of Chicago): ini koleksi Met Museum.
const API = 'https://collectionapi.metmuseum.org/public/collection/v1';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const imgAman = (u) => {
  if (typeof u !== 'string' || !u) return null;
  try {
    const p = new URL(u.trim());
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch (e) { return null; }
};
const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "galeri-met", "name": "Galeri Met", "cat": "liveapi", "icon": "🎨", "desc": "Jelajahi koleksi seni Metropolitan Museum of Art: lukisan, patung, sampai artefak kuno.", "keywords": "met museum,seni,galeri,lukisan,museum,artefak,koleksi,metropolitan", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: van gogh, egypt, samurai…', 'van gogh');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: van gogh atau egypt.')); return; }
    T.show(box, '<p class="mut">Mencari koleksi Met tentang ' + esc(q) + '…</p>');
    try {
      const hasil = await getJSON(API + '/search?q=' + encodeURIComponent(q) + '&hasImages=true');
      const ids = hasil && Array.isArray(hasil.objectIDs) ? hasil.objectIDs.slice(0, 10) : [];
      if (!ids.length) {
        T.show(box, '<p class="center dim">Tidak ada karya yang cocok. Coba kata lain dalam bahasa Inggris, contoh: monet, egypt, atau armor.</p>');
        return;
      }
      T.show(box, '<p class="mut">Mengambil ' + ids.length + ' karya dari ' + (Number(hasil.total) || 0).toLocaleString('id-ID') + ' yang cocok…</p>');
      // Satu aksi pengguna: ambil detail 10 karya teratas.
      const karya = (await Promise.all(ids.map((id) =>
        getJSON(API + '/objects/' + id).catch(() => null)))).filter((o) => o && o.title);
      if (!karya.length) throw new Error('bad-data');
      T.show(box, '<p class="hint">' + karya.length + ' karya teratas. Ketuk karya untuk membuka halaman aslinya di situs Met.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px">' +
        karya.map((o) => {
          const gambar = imgAman(o.primaryImageSmall || o.primaryImage);
          const link = tautanAman(o.objectURL) ? o.objectURL : null;
          const isi = (gambar ? '<img src="' + esc(gambar) + '" alt="' + esc(String(o.title)) + '" loading="lazy" data-err="hide" style="width:100%;height:150px;object-fit:cover;border-radius:8px;display:block">' : '<div style="height:150px;border-radius:8px;background:#221d18;display:flex;align-items:center;justify-content:center"><span class="dim" style="font-size:12px">Tidak ada gambar</span></div>') +
            '<div style="font-size:12.5px;line-height:1.4;margin-top:6px;font-weight:700">' + esc(String(o.title)) + '</div>' +
            '<div class="dim" style="font-size:11.5px;line-height:1.4">' +
            (o.artistDisplayName ? esc(String(o.artistDisplayName)) + '<br>' : '') +
            (o.objectDate ? esc(String(o.objectDate)) : '') +
            (o.medium ? (o.objectDate ? ' · ' : '') + esc(String(o.medium)) : '') +
            (o.isPublicDomain ? '<br>Domain publik' : '') + '</div>';
          return '<div>' + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: The Metropolitan Museum of Art, New York. Karya bertanda domain publik bebas dipakai.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server Met Museum tidak merespons dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Koleksi seni dari Metropolitan Museum of Art di New York. Kata kunci bahasa Inggris memberi hasil paling banyak.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Contoh: van gogh, egypt, samurai, monet'));
  root.appendChild(T.row(T.btn('Cari karya', cari, true)));
  root.appendChild(box);
  cari();
}
