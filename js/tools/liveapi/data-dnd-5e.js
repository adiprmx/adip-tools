import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"data-dnd-5e","name":"Data D&D 5e","cat":"liveapi","icon":"🐉","desc":"Cari mantra, monster, dan ras Dungeons & Dragons edisi ke-5.","keywords":"dnd,dungeons dragons,mantra,monster,ras,rpg,5e","since":"6.18.0"};

// Data Dungeons & Dragons 5e (mantra, monster, ras) lewat dnd5eapi.co, tanpa key.
// Terverifikasi 18 Nov 2026: www.dnd5eapi.co/api/2014/spells/fireball -> 200, CORS *.
// Dicek ulang 19 Nov 2026: spells/fireball, monsters/goblin, races/elf semua 200.
// Beda dari Dadu D&D (pelempar dadu): tool ini menampilkan isi buku aturan.
const API = 'https://www.dnd5eapi.co/api/2014/';

export const KATEGORI = [
  ['spells', 'Mantra'],
  ['monsters', 'Monster'],
  ['races', 'Ras'],
];

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 404) throw new Error('not-found');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// "Fireball" -> "fireball", "Ancient Red Dragon" -> "ancient-red-dragon".
export function keSlug(nama) {
  return String(nama || '').trim().toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function urlDnd(kategori, slug) {
  return API + kategori + '/' + slug;
}

export function ringkas(j, kategori) {
  if (!j || typeof j !== 'object' || typeof j.name !== 'string') return null;
  const teks = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string').join('\n\n') : '');
  const dasar = { nama: j.name, deskripsi: teks(j.desc) };
  if (kategori === 'spells') {
    return Object.assign(dasar, {
      baris: [
        ['Level', j.level === 0 ? 'Cantrip (level 0)' : 'Level ' + j.level],
        ['Aliran', j.school && j.school.name ? j.school.name : '-'],
        ['Waktu merapal', j.casting_time || '-'],
        ['Jangkauan', j.range || '-'],
        ['Butuh konsentrasi', j.concentration ? 'Ya' : 'Tidak'],
      ],
    });
  }
  if (kategori === 'monsters') {
    return Object.assign(dasar, {
      baris: [
        ['Ukuran', j.size || '-'],
        ['Jenis', j.type || '-'],
        ['Darah (HP)', typeof j.hit_points === 'number' ? String(j.hit_points) : '-'],
        ['Kelas zirah', Array.isArray(j.armor_class) && j.armor_class[0] ? String(j.armor_class[0].value) : '-'],
        ['Tingkat bahaya', typeof j.challenge_rating === 'number' ? String(j.challenge_rating) : '-'],
      ],
    });
  }
  return Object.assign(dasar, {
    baris: [
      ['Kecepatan jalan', j.speed ? String(j.speed) + ' kaki' : '-'],
      ['Ukuran', j.size || '-'],
      ['Bahasa', Array.isArray(j.languages) ? j.languages.map((l) => l.name).join(', ') : '-'],
    ],
  });
}

export function render(root) {
  const box = T.out();
  const katSel = T.select(KATEGORI, 'spells');
  const inp = T.input('text', 'Contoh: Fireball, Goblin, Elf');
  inp.setAttribute('autocomplete', 'off');
  inp.setAttribute('autocapitalize', 'off');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', cari));
    box.appendChild(w);
  };

  const cari = async () => {
    const slug = keSlug(inp.value);
    if (!slug) { T.show(box, errBox('Tulis nama yang dicari, contoh: Fireball.')); return; }
    const kat = katSel.value;
    const label = (KATEGORI.find((k) => k[0] === kat) || KATEGORI[0])[1].toLowerCase();
    T.show(box, '<p class="mut">Mencari ' + label + ' ' + esc(String(inp.value).trim()) + '…</p>');
    try {
      const hasil = ringkas(await getJSON(urlDnd(kat, slug)), kat);
      if (!hasil) throw new Error('bad-data');
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:18px">' + esc(hasil.nama) + '</div></div>' +
        (hasil.deskripsi ? '<p class="hint" style="margin-top:10px;white-space:pre-line">' + esc(hasil.deskripsi) + '</p>' : '') +
        '<div style="margin-top:10px">' +
        hasil.baris.map((b) => '<div class="kv"><span class="k">' + esc(b[0]) + '</span><span class="v">' + esc(b[1]) + '</span></div>').join('') +
        '</div>' +
        '<p class="hint">Sumber: dnd5eapi.co, data aturan resmi D&D 5e (SRD). Teks aslinya bahasa Inggris.</p>');
    } catch (e) {
      if (e.message === 'not-found') {
        T.show(box, '<p class="center dim">Tidak ditemukan. Periksa ejaan bahasa Inggrisnya, atau coba nama lain.</p>');
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server data tidak merespons dalam 10 detik.'
        : 'Gagal mencari. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari mantra, monster, atau ras dari Dungeons & Dragons edisi ke-5. Tulis namanya dalam bahasa Inggris.</p>'));
  root.appendChild(T.field('Jenis yang dicari', katSel));
  root.appendChild(T.field('Nama', inp, 'Contoh mantra: Fireball. Monster: Goblin. Ras: Elf'));
  root.appendChild(T.row(T.btn('Cari', cari, true)));
  root.appendChild(box);
}
