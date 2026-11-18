import { h as T, esc, errBox } from '../../core.js';

// Ensiklopedia Star Wars lewat SWAPI (tanpa key).
// Terverifikasi 18 Nov 2026: swapi.dev/api/people/ 200, CORS *.
const API = 'https://swapi.dev/api/';

const KATEGORI = [
  ['people', 'Tokoh'], ['films', 'Film'], ['planets', 'Planet'],
  ['starships', 'Pesawat luar angkasa'], ['vehicles', 'Kendaraan'], ['species', 'Spesies'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Validasi origin URL halaman (RED-G2-05): tautan "Berikutnya" dan
// "Sebelumnya" datang dari respons API, jadi sebelum di-fetch harus
// dipastikan tetap mengarah ke SWAPI — bukan ke URL lain (termasuk
// perangkat jaringan lokal). Murni, bisa diuji di Node.
export function halamanSwapiAman(u) {
  try {
    return new URL(String(u)).origin === 'https://swapi.dev';
  } catch (e) {
    return false;
  }
}

const LABEL = {
  name: 'Nama', title: 'Judul', height: 'Tinggi', mass: 'Berat', birth_year: 'Tahun lahir',
  gender: 'Jenis kelamin', hair_color: 'Warna rambut', skin_color: 'Warna kulit',
  eye_color: 'Warna mata', episode_id: 'Episode', director: 'Sutradara',
  producer: 'Produser', release_date: 'Tanggal rilis', climate: 'Iklim',
  terrain: 'Medan', population: 'Populasi', diameter: 'Diameter',
  model: 'Model', manufacturer: 'Pabrikan', crew: 'Awak', passengers: 'Penumpang',
  starship_class: 'Kelas', vehicle_class: 'Kelas', classification: 'Klasifikasi',
  language: 'Bahasa', average_height: 'Tinggi rata-rata', average_lifespan: 'Usia rata-rata',
};

function ringkasan(item, kat) {
  if (kat === 'films') {
    return (item.director ? 'Sutradara: ' + item.director : '') +
      (item.release_date ? ' · rilis ' + item.release_date : '');
  }
  if (kat === 'planets') {
    return (item.climate ? 'Iklim: ' + item.climate : '') +
      (item.population ? ' · populasi ' + item.population : '');
  }
  if (kat === 'people') {
    return (item.birth_year ? 'Lahir: ' + item.birth_year : '') +
      (item.gender ? ' · ' + item.gender : '') +
      (item.height && item.height !== 'unknown' ? ' · ' + item.height + ' cm' : '');
  }
  if (kat === 'species') {
    return (item.classification ? 'Klasifikasi: ' + item.classification : '') +
      (item.language ? ' · bahasa ' + item.language : '');
  }
  return (item.model ? 'Model: ' + item.model : '') +
    (item.manufacturer ? ' · ' + item.manufacturer : '');
}

export const meta = {"id": "ensiklopedia-star-wars", "name": "Ensiklopedia Star Wars", "cat": "liveapi", "icon": "⭐", "desc": "Cari tokoh, film, planet, pesawat, dan spesies dari dunia Star Wars.", "keywords": "star wars,swapi,tokoh,film,planet,pesawat,jedi,sith,ensiklopedia", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const katS = T.select(KATEGORI, 'people');
  const cariI = T.input('text', 'Cari nama, contoh: luke (boleh kosong)');
  let urlBerikut = null;
  let urlSebelum = null;

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', () => muat(null)));
    box.appendChild(w);
  };

  const muat = async (urlHalaman) => {
    const kat = katS.value;
    let url = urlHalaman;
    if (!url) {
      url = API + kat + '/?';
      const q = String(cariI.value || '').trim();
      if (q) url += 'search=' + encodeURIComponent(q);
    } else if (!halamanSwapiAman(url)) {
      // Tautan halaman dari server tidak mengarah ke SWAPI — tolak, jangan fetch.
      gagal('Tautan halaman dari server tidak valid, jadi tidak dibuka. Coba muat ulang dari awal.');
      return;
    }
    T.show(box, '<p class="mut">Mengambil data Star Wars…</p>');
    try {
      const j = await getJSON(url);
      const list = j && Array.isArray(j.results) ? j.results : [];
      urlBerikut = j && j.next ? String(j.next) : null;
      urlSebelum = j && j.previous ? String(j.previous) : null;
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada hasil yang cocok. Coba kata lain atau kosongkan kolom pencarian.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' hasil' + (j.count != null ? ' dari ' + (Number(j.count) || 0) + ' total' : '') + '. Ketuk "Detail" untuk info lengkap tiap item.</p>' +
        list.map((it) => {
          const nama = String(it.name || it.title || 'Tanpa nama');
          const detail = Object.keys(LABEL).filter((k) => it[k] != null && it[k] !== '' && it[k] !== 'unknown' && it[k] !== 'n/a')
            .map((k) => '<div class="kv"><span class="k">' + esc(LABEL[k]) + '</span><span class="v">' + esc(String(it[k])) + '</span></div>').join('');
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            '<div style="font-weight:700;font-size:14px">' + esc(nama) + '</div>' +
            '<div class="dim" style="font-size:12.5px;margin-top:2px">' + esc(ringkasan(it, kat)) + '</div>' +
            (kat === 'films' && it.opening_crawl ? '<div class="dim" style="font-size:12px;line-height:1.5;margin-top:6px">' + esc(String(it.opening_crawl).slice(0, 220)) + '…</div>' : '') +
            (detail ? '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:12.5px">Detail</summary><div style="margin-top:6px">' + detail + '</div></details>' : '') +
            '</div>';
        }).join('') +
        '<div class="center" style="margin-top:12px;display:flex;gap:8px;justify-content:center">' +
        (urlSebelum ? '<button class="btn" id="sw-prev">Sebelumnya</button>' : '') +
        (urlBerikut ? '<button class="btn primary" id="sw-next">Berikutnya</button>' : '') +
        '</div><p class="hint">Sumber: SWAPI (Star Wars API). Data berbahasa Inggris.</p>');
      const prev = box.querySelector('#sw-prev');
      if (prev) prev.addEventListener('click', () => muat(urlSebelum));
      const next = box.querySelector('#sw-next');
      if (next) next.addEventListener('click', () => muat(urlBerikut));
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server SWAPI tidak merespons dalam 15 detik.'
        : 'Data gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  katS.addEventListener('change', () => muat(null));
  cariI.addEventListener('keydown', (e) => { if (e.key === 'Enter') muat(null); });
  root.appendChild(T.el('<p class="note">Jelajahi dunia Star Wars: tokoh, film, planet, pesawat, kendaraan, dan spesies. Isi kolom cari kalau mau yang spesifik.</p>'));
  root.appendChild(T.field('Kategori', katS));
  root.appendChild(T.field('Cari nama (opsional)', cariI, 'Contoh: luke, tatooine, falcon'));
  root.appendChild(T.row(T.btn('Cari', () => muat(null), true)));
  root.appendChild(box);
  muat(null);
}
