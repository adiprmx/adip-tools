import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"info-emoji","name":"Info Emoji","cat":"liveapi","icon":"🔎","desc":"Emoji acak beserta nama dan kategorinya, atau telusuri per kategori.","keywords":"emoji,acak,kategori,unicode,karakter","since":"6.18.0"};

// Info emoji lewat EmojiHub, tanpa key.
// Terverifikasi 18 Nov 2026: emojihub.yurace.pro/api/random -> 200, CORS *.
// Dicek ulang 19 Nov 2026: /api/random 200,
// /api/all/category/smileys-and-people 200.
// Beda dari Emoji GitHub (daftar emoji GitHub + gambarnya): tool ini
// menampilkan karakter emoji Unicode beserta nama, kategori, dan grupnya.
const API = 'https://emojihub.yurace.pro/api/';

export const KATEGORI = [
  ['smileys-and-people', 'Wajah dan orang'],
  ['animals-and-nature', 'Hewan dan alam'],
  ['food-and-drink', 'Makanan dan minuman'],
  ['travel-and-places', 'Perjalanan dan tempat'],
  ['activities', 'Kegiatan'],
  ['objects', 'Benda'],
  ['symbols', 'Simbol'],
  ['flags', 'Bendera'],
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

// Ubah daftar kode Unicode ("U+1F600") jadi karakter emoji yang tampil.
// Hanya kode berbentuk U+XXXX yang diterima; sisanya dibuang.
export function karakterEmoji(kode) {
  if (!Array.isArray(kode) || !kode.length) return '';
  try {
    return kode.map((u) => {
      const m = /^U\+([0-9A-Fa-f]{4,6})$/.exec(String(u || '').trim());
      if (!m) return '';
      const cp = parseInt(m[1], 16);
      return cp <= 0x10FFFF ? String.fromCodePoint(cp) : '';
    }).join('');
  } catch (e) { return ''; }
}

export function urlKategori(kat) {
  return API + 'all/category/' + kat;
}

export function ringkasEmoji(j) {
  if (!j || typeof j !== 'object' || typeof j.name !== 'string') return null;
  return {
    nama: j.name,
    karakter: karakterEmoji(j.unicode),
    kategori: typeof j.category === 'string' ? j.category : '-',
    grup: typeof j.group === 'string' ? j.group : '-',
    kodeHtml: Array.isArray(j.htmlCode) ? j.htmlCode.join(' ') : '',
  };
}

export function render(root) {
  const box = T.out();
  const katSel = T.select(KATEGORI, 'smileys-and-people');

  const tampilSatu = (hasil) => {
    T.show(box,
      '<div class="center"><div style="font-size:72px;line-height:1.2">' + esc(hasil.karakter || '?') + '</div>' +
      '<div style="font-weight:700;margin-top:8px">' + esc(hasil.nama) + '</div>' +
      '<div class="dim" style="font-size:13px;margin-top:4px">Kategori: ' + esc(hasil.kategori) + ' · Grup: ' + esc(hasil.grup) + '</div>' +
      (hasil.kodeHtml ? '<div class="dim" style="font-size:12.5px;margin-top:4px">Kode HTML: ' + esc(hasil.kodeHtml) + '</div>' : '') +
      '</div>' +
      '<p class="hint">Sumber: EmojiHub.</p>');
  };

  const gagal = (pesan, ulang) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', ulang));
    box.appendChild(w);
  };

  const acak = async () => {
    T.show(box, '<p class="mut">Mengambil emoji acak…</p>');
    try {
      const hasil = ringkasEmoji(await getJSON(API + 'random'));
      if (!hasil) throw new Error('bad-data');
      tampilSatu(hasil);
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server emoji tidak merespons dalam 10 detik.'
        : 'Gagal mengambil emoji. Cek koneksi internet, lalu coba lagi.', acak);
    }
  };

  const perKategori = async () => {
    const kat = katSel.value;
    const label = (KATEGORI.find((k) => k[0] === kat) || KATEGORI[0])[1];
    T.show(box, '<p class="mut">Memuat emoji kategori ' + esc(label.toLowerCase()) + '…</p>');
    try {
      const j = await getJSON(urlKategori(kat));
      if (!Array.isArray(j) || !j.length) throw new Error('bad-data');
      const daftar = j.map(ringkasEmoji).filter(Boolean).slice(0, 60);
      if (!daftar.length) throw new Error('bad-data');
      T.show(box,
        '<p class="dim" style="font-size:13px">Menampilkan ' + daftar.length + ' emoji kategori ' + esc(label.toLowerCase()) + '.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px;margin-top:10px">' +
        daftar.map((e) =>
          '<div style="border:1px solid #2e2823;border-radius:10px;padding:8px 4px;text-align:center">' +
          '<div style="font-size:30px;line-height:1.2">' + esc(e.karakter || '?') + '</div>' +
          '<div style="font-size:11px;margin-top:4px;word-break:break-word">' + esc(e.nama) + '</div></div>').join('') +
        '</div>' +
        '<p class="hint">Sumber: EmojiHub.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server emoji tidak merespons dalam 10 detik.'
        : 'Gagal memuat kategori itu. Cek koneksi internet, lalu coba lagi.', perKategori);
    }
  };

  root.appendChild(T.el('<p class="note">Dapatkan emoji acak beserta namanya, atau telusuri emoji per kategori.</p>'));
  root.appendChild(T.row(T.btn('🎲 Emoji acak', acak, true)));
  root.appendChild(T.field('Kategori', katSel));
  root.appendChild(T.row(T.btn('Lihat kategori', perKategori)));
  root.appendChild(box);
  acak();
}
