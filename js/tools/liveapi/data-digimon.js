import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"data-digimon","name":"Data Digimon","cat":"liveapi","icon":"🐾","desc":"Telusuri daftar Digimon lengkap dengan gambar dan levelnya.","keywords":"digimon,agumon,anime,monster,level","since":"6.18.0"};

// Daftar Digimon lengkap lewat digimon-api.vercel.app, tanpa key.
// Terverifikasi 18 Nov 2026: digimon-api.vercel.app/api/digimon -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200. Daftar penuh dimuat sekali, lalu
// pencarian nama dan level dilakukan di perangkatmu sendiri.
const API = 'https://digimon-api.vercel.app/api/digimon';

export const TINGKAT = [
  ['semua', 'Semua level'],
  ['Fresh', 'Fresh'],
  ['In Training', 'In Training'],
  ['Rookie', 'Rookie'],
  ['Champion', 'Champion'],
  ['Ultimate', 'Ultimate'],
  ['Mega', 'Mega'],
  ['Armor', 'Armor'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function saringDigimon(daftar, kata, tingkat) {
  const q = String(kata || '').trim().toLowerCase();
  return (Array.isArray(daftar) ? daftar : []).filter((d) => {
    if (!d || typeof d.name !== 'string') return false;
    if (tingkat && tingkat !== 'semua' && d.level !== tingkat) return false;
    return !q || d.name.toLowerCase().includes(q);
  });
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Agumon');
  inp.setAttribute('autocomplete', 'off');
  const tingkatSel = T.select(TINGKAT, 'semua');
  let daftar = null;

  const tampilkan = () => {
    const hasil = saringDigimon(daftar, inp.value, tingkatSel.value);
    if (!hasil.length) {
      T.show(box, '<p class="center dim">Tidak ada Digimon yang cocok. Coba kata lain atau level lain.</p>');
      return;
    }
    const potong = hasil.slice(0, 60);
    T.show(box,
      '<p class="dim" style="font-size:13px">Menampilkan ' + potong.length + ' dari ' + hasil.length + ' Digimon yang cocok.</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:10px">' +
      potong.map((d) =>
        '<div style="border:1px solid #2e2823;border-radius:10px;padding:8px;text-align:center">' +
        (gambarAman(d.img) ? '<img src="' + esc(d.img) + '" alt="' + esc(d.name) + '" style="width:100%;height:auto;border-radius:6px" loading="lazy" data-err="hide">' : '') +
        '<div style="font-weight:700;font-size:13px;margin-top:6px;word-break:break-word">' + esc(d.name) + '</div>' +
        '<div class="dim" style="font-size:12px">' + esc(d.level || '-') + '</div></div>').join('') +
      '</div>' +
      '<p class="hint">Sumber: digimon-api.vercel.app.</p>');
    T.wireImgErr(box);
  };

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Memuat daftar Digimon…</p>');
    try {
      const j = await getJSON(API);
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      daftar = j;
      tampilkan();
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server data tidak merespons dalam 10 detik.'
        : 'Gagal memuat daftar Digimon. Cek koneksi internet, lalu coba lagi.');
    }
  };

  const cariLokal = () => { if (daftar) tampilkan(); };
  inp.addEventListener('input', cariLokal);
  tingkatSel.addEventListener('change', cariLokal);
  root.appendChild(T.el('<p class="note">Telusuri daftar Digimon lengkap dengan gambar dan levelnya. Ketik nama atau pilih level untuk menyaring.</p>'));
  root.appendChild(T.field('Cari nama', inp, 'Ketik sebagian nama juga bisa, contoh: agu'));
  root.appendChild(T.field('Level', tingkatSel));
  root.appendChild(box);
  muat();
}
