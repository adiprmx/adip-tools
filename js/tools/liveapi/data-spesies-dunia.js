import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"data-spesies-dunia","name":"Data Spesies Dunia","cat":"liveapi","icon":"🌿","desc":"Cari nama latin hewan, tumbuhan, dan jamur di basis data GBIF.","keywords":"spesies,gbif,nama latin,hewan,tumbuhan,biodiversitas,taksonomi","since":"6.18.0", "online": true};

// Cari data spesies lewat GBIF (Global Biodiversity Information Facility),
// tanpa key. Terverifikasi 18 Nov 2026:
// api.gbif.org/v1/species/search?q=panthera&limit=1 -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
// Beda dari Observasi Alam (pengamatan masyarakat di iNaturalist): tool ini
// mencari di basis data taksonomi spesies dunia.
const API = 'https://api.gbif.org/v1/species/search';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

export function urlCariSpesies(kata) {
  const q = new URLSearchParams({ q: kata, limit: '10' });
  return API + '?' + q.toString();
}

export function ringkasSpesies(j) {
  if (!j || !Array.isArray(j.results)) return null;
  return {
    total: typeof j.count === 'number' ? j.count : j.results.length,
    daftar: j.results.map((r) => ({
      nama: typeof r.scientificName === 'string' ? r.scientificName : (typeof r.canonicalName === 'string' ? r.canonicalName : '-'),
      namaUmum: typeof r.vernacularName === 'string' ? r.vernacularName : '',
      kingdom: typeof r.kingdom === 'string' ? r.kingdom : '-',
      golongan: typeof r.rank === 'string' ? r.rank : '-',
      status: typeof r.taxonomicStatus === 'string' ? r.taxonomicStatus : '-',
    })),
  };
}

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: panthera, quercus, homo sapiens');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const kata = String(inp.value || '').trim();
    if (kata.length < 2) {
      T.show(box, errBox('Tulis minimal 2 huruf, contoh: panthera.'));
      return;
    }
    T.show(box, '<p class="mut">Mencari spesies ' + esc(kata) + '…</p>');
    try {
      const hasil = ringkasSpesies(await getJSON(urlCariSpesies(kata)));
      if (!hasil) throw new Error('bad-data');
      if (!hasil.daftar.length) {
        T.show(box, '<p class="center dim">Tidak ada spesies yang cocok dengan kata itu. Coba nama latinnya, contoh: panthera tigris.</p>');
        return;
      }
      T.show(box,
        '<p class="dim" style="font-size:13px">Ditemukan ' + hasil.total.toLocaleString('id-ID') + ' entri, menampilkan ' + hasil.daftar.length + ' teratas.</p>' +
        '<div style="margin-top:10px">' +
        hasil.daftar.map((s) =>
          '<div style="border-bottom:1px solid #2e2823;padding:8px 0">' +
          '<div style="font-weight:700;font-style:italic">' + esc(s.nama) + '</div>' +
          (s.namaUmum ? '<div style="font-size:13px">' + esc(s.namaUmum) + '</div>' : '') +
          '<div class="dim" style="font-size:12.5px;margin-top:2px">Kerajaan: ' + esc(s.kingdom) + ' · Golongan: ' + esc(s.golongan) + ' · Status: ' + esc(s.status) + '</div></div>').join('') +
        '</div>' +
        '<p class="hint">Sumber: GBIF, basis data keanekaragaman hayati dunia. Nama spesies memakai nama latin.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server data tidak bisa dihubungi dalam 10 detik.'
        : 'Gagal mencari spesies. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari nama latin hewan, tumbuhan, atau jamur di basis data spesies dunia GBIF.</p>'));
  root.appendChild(T.field('Nama spesies', inp, 'Nama latin, contoh: panthera'));
  root.appendChild(T.row(T.btn('Cari spesies', cari, true)));
  root.appendChild(box);
}
