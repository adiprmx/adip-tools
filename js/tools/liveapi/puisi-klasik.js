import { h as T, esc, errBox } from '../../core.js';

// Puisi klasik Inggris lewat PoetryDB, tanpa key.
// Terverifikasi 17 Nov 2026: https://poetrydb.org/random -> 200, CORS *.
export const meta = {"id":"puisi-klasik","name":"Puisi Klasik","cat":"liveapi","icon":"📜","desc":"Baca puisi klasik Inggris: acak, berdasarkan penulis, atau berdasarkan judul.","keywords":"puisi,puisi klasik,poetry,penyair,sastra,shakespeare,puisi inggris","since":"6.17.0"};

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

export function render(root) {
  const box = T.out();
  const mode = T.select([
    ['random', 'Puisi acak'],
    ['author', 'Berdasarkan penulis'],
    ['title', 'Berdasarkan judul'],
  ], 'random');
  const inp = T.input('text', 'Contoh: William Shakespeare');
  inp.setAttribute('autocomplete', 'off');
  const inpWrap = T.field('Cari', inp, 'Untuk mode acak, kolom ini tidak dipakai');
  let hasil = [];
  let indeks = 0;

  const tampilPuisi = (p, posisi) => {
    const baris = (p.lines || []).join('\n');
    T.show(box,
      '<div class="center"><div style="font-weight:800;font-size:17px">' + esc(p.title || 'Tanpa judul') + '</div>' +
      '<div class="dim" style="font-size:13px;margin-top:2px">oleh ' + esc(p.author || 'Tidak diketahui') + '</div></div>' +
      '<div style="margin-top:14px;font-size:14.5px;line-height:1.8;white-space:pre-wrap;text-align:center">' + esc(baris) + '</div>' +
      (posisi ? '<p class="hint center" style="margin-top:10px">' + esc(posisi) + '</p>' : '') +
      '<p class="hint">Sumber: PoetryDB. Puisi berbahasa Inggris apa adanya.</p>');
    if (hasil.length > 1) {
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(T.btn('📜 Puisi berikutnya', () => {
        indeks = (indeks + 1) % hasil.length;
        tampilPuisi(hasil[indeks], 'Puisi ' + (indeks + 1) + ' dari ' + hasil.length);
      }));
      box.appendChild(wr);
    }
  };

  const muat = async () => {
    hasil = [];
    indeks = 0;
    let url;
    if (mode.value === 'random') {
      url = 'https://poetrydb.org/random';
      T.show(box, '<p class="mut">Mengambil puisi acak…</p>');
    } else {
      const q = String(inp.value || '').trim();
      if (!q) { T.show(box, errBox(mode.value === 'author' ? 'Tulis nama penulis dulu.' : 'Tulis judul puisi dulu.')); return; }
      url = mode.value === 'author'
        ? 'https://poetrydb.org/author/' + encodeURIComponent(q)
        : 'https://poetrydb.org/title/' + encodeURIComponent(q);
      T.show(box, '<p class="mut">Mencari puisi…</p>');
    }
    try {
      const j = await getJSON(url);
      const list = Array.isArray(j) ? j.filter((p) => p && p.title && Array.isArray(p.lines) && p.lines.length) : [];
      if (!list.length) throw new Error('not-found');
      hasil = list;
      tampilPuisi(hasil[0], list.length > 1 ? 'Puisi 1 dari ' + list.length : '');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Tidak ada puisi yang cocok. Coba nama penulis atau judul dalam bahasa Inggris.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server PoetryDB tidak merespons dalam 15 detik.'
        : 'Gagal mengambil puisi. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  mode.addEventListener('change', () => { inpWrap.hidden = mode.value === 'random'; });
  inpWrap.hidden = true;
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(); });
  root.appendChild(T.el('<p class="note">Baca puisi klasik Inggris. Pilih puisi acak, atau cari berdasarkan penulis dan judulnya.</p>'));
  root.appendChild(T.field('Cara memilih', mode, ''));
  root.appendChild(inpWrap);
  root.appendChild(T.row(T.btn('📜 Tampilkan puisi', muat, true)));
  root.appendChild(box);
}
