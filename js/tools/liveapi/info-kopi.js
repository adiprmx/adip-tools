import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"info-kopi","name":"Info Kopi","cat":"liveapi","icon":"☕","desc":"Daftar minuman kopi panas dan dingin beserta bahan dan deskripsinya.","keywords":"kopi,latte,espresso,minuman,kafe","since":"6.18.0"};

// Info minuman kopi lewat SampleAPIs, tanpa key.
// Terverifikasi 18 Nov 2026: api.sampleapis.com/coffee/hot -> 200, CORS *.
// Dicek ulang 19 Nov 2026: /coffee/hot 200, /coffee/iced 200.
// Beda dari Kalkulator Rasio Kopi-Air (hitung takaran seduh): tool ini
// menampilkan daftar minuman kopi beserta bahan dan deskripsinya.
const API = 'https://api.sampleapis.com/coffee/';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function saringKopi(daftar, kata) {
  const q = String(kata || '').trim().toLowerCase();
  return (Array.isArray(daftar) ? daftar : []).filter((k) => {
    if (!k || typeof k.title !== 'string') return false;
    if (!q) return true;
    const bahan = Array.isArray(k.ingredients) ? k.ingredients.join(' ') : '';
    return (k.title + ' ' + bahan).toLowerCase().includes(q);
  });
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const jenisSel = T.select([['hot', 'Kopi panas'], ['iced', 'Kopi dingin']], 'hot');
  const inp = T.input('text', 'Contoh: latte, mocha, espresso');
  inp.setAttribute('autocomplete', 'off');
  let daftar = null;

  const tampilkan = () => {
    const hasil = saringKopi(daftar, inp.value);
    if (!hasil.length) {
      T.show(box, '<p class="center dim">Tidak ada minuman kopi yang cocok. Coba kata lain.</p>');
      return;
    }
    T.show(box,
      '<p class="dim" style="font-size:13px">Menampilkan ' + hasil.length + ' minuman kopi.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-top:10px">' +
      hasil.map((k) =>
        '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px">' +
        (gambarAman(k.image) ? '<img src="' + esc(k.image) + '" alt="' + esc(k.title) + '" style="width:100%;height:auto;border-radius:6px" loading="lazy" data-err="hide">' : '') +
        '<div style="font-weight:700;margin-top:8px">' + esc(k.title) + '</div>' +
        (k.description ? '<p class="dim" style="font-size:12.5px;line-height:1.5;margin-top:4px">' + esc(k.description) + '</p>' : '') +
        (Array.isArray(k.ingredients) && k.ingredients.length ? '<p style="font-size:12px;margin-top:6px">Bahan: ' + esc(k.ingredients.join(', ')) + '</p>' : '') +
        '</div>').join('') +
      '</div>' +
      '<p class="hint">Sumber: SampleAPIs. Deskripsi aslinya bahasa Inggris.</p>');
    T.wireImgErr(box);
  };

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    const jenis = jenisSel.value === 'iced' ? 'iced' : 'hot';
    T.show(box, '<p class="mut">Memuat daftar kopi ' + (jenis === 'iced' ? 'dingin' : 'panas') + '…</p>');
    try {
      const j = await getJSON(API + jenis);
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      daftar = j;
      tampilkan();
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server data tidak merespons dalam 10 detik.'
        : 'Gagal memuat daftar kopi. Cek koneksi internet, lalu coba lagi.');
    }
  };

  jenisSel.addEventListener('change', muat);
  inp.addEventListener('input', () => { if (daftar) tampilkan(); });
  root.appendChild(T.el('<p class="note">Lihat daftar minuman kopi, panas atau dingin, beserta bahan dan deskripsinya.</p>'));
  root.appendChild(T.field('Jenis', jenisSel));
  root.appendChild(T.field('Cari', inp, 'Nama minuman atau bahan, contoh: latte'));
  root.appendChild(box);
  muat();
}
