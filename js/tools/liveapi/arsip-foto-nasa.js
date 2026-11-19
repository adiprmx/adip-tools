import { h as T, esc, errBox, utils } from '../../core.js';

// Cari foto dari arsip NASA Images (tanpa key).
// Terverifikasi 18 Nov 2026: images-api.nasa.gov/search 200, CORS *.
const API = 'https://images-api.nasa.gov/search';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Hanya http/https yang boleh jadi sumber gambar.
// imgAman kanonis tinggal di utils.urlAman (core.js).

// tglCantik kanonis tinggal di utils (core.js).

export const meta = {"id": "arsip-foto-nasa", "name": "Arsip Foto NASA", "cat": "liveapi", "icon": "🚀", "desc": "Cari foto dan gambar dari arsip NASA: planet, roket, astronot, sampai galaksi.", "keywords": "nasa,foto,antariksa,arsip,planet,roket,astronot,galaksi,gambar", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: apollo, mars, jupiter, nebula…', 'apollo');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis kata kunci dulu, contoh: apollo atau mars.')); return; }
    T.show(box, '<p class="mut">Mencari foto NASA tentang ' + esc(q) + '…</p>');
    try {
      const j = await getJSON(API + '?q=' + encodeURIComponent(q) + '&media_type=image&page_size=12');
      const items = j && j.collection && Array.isArray(j.collection.items) ? j.collection.items : [];
      if (!items.length) {
        T.show(box, '<p class="center dim">Tidak ada foto yang cocok dengan kata kunci itu. Coba kata lain dalam bahasa Inggris, contoh: moon atau galaxy.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + items.length + ' foto ditemukan. Ketuk foto untuk membuka halaman aslinya di situs NASA.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:10px">' +
        items.map((it) => {
          const d = (it.data && it.data[0]) || {};
          const thumb = utils.urlAman(it.links && it.links[0] && it.links[0].href);
          const judul = String(d.title || 'Tanpa judul');
          const detail = d.nasa_id ? 'https://images.nasa.gov/details/' + encodeURIComponent(String(d.nasa_id)) : null;
          const isi = (thumb ? '<img src="' + esc(thumb) + '" alt="' + esc(judul) + '" loading="lazy" data-err="hide" style="width:100%;height:120px;object-fit:cover;border-radius:8px;display:block">' : '<div style="height:120px;border-radius:8px;background:#221d18;display:flex;align-items:center;justify-content:center"><span class="dim" style="font-size:12px">Tidak ada pratinjau</span></div>') +
            '<div style="font-size:12.5px;line-height:1.4;margin-top:6px">' + esc(judul) + '</div>' +
            (d.date_created ? '<div class="dim" style="font-size:11.5px">' + esc(utils.tglCantik(d.date_created)) + '</div>' : '');
          return '<div>' + (detail ? '<a href="' + esc(detail) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: NASA Image and Video Library. Kebanyakan foto NASA bebas dipakai, cek halaman aslinya untuk ketentuan tiap foto.</p>');
      T.wireImgErr(box);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server NASA tidak merespons dalam 15 detik.'
        : 'Pencarian gagal. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Arsip foto resmi NASA. Kata kunci dalam bahasa Inggris memberi hasil paling banyak.</p>'));
  root.appendChild(T.field('Kata kunci', inp, 'Contoh: apollo, mars, iss, nebula'));
  root.appendChild(T.row(T.btn('Cari foto', cari, true)));
  root.appendChild(box);
  cari();
}
