import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"emoji-github","name":"Emoji GitHub","cat":"liveapi","icon":"😀","desc":"Telusuri semua emoji GitHub lengkap dengan kodenya.","keywords":"emoji,github,kode emoji,emoticon","since":"6.18.0", "online": true};

// Daftar semua emoji GitHub lewat api.github.com/emojis, tanpa key.
// Terverifikasi 18 Nov 2026: api.github.com/emojis -> 200, CORS *.
// Dicek ulang 19 Nov 2026: 200.
// Batas jujur: tanpa login GitHub, layanan ini mengizinkan 60 permintaan
// per jam per alamat IP. Daftar dimuat sekali saja per kunjungan, lalu
// pencarian dilakukan di perangkatmu sendiri.
const API = 'https://api.github.com/emojis';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 403) throw new Error('rate-limit');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Saring daftar emoji (objek nama -> alamat gambar) berdasarkan kata kunci.
export function saringEmoji(obj, kata, batas) {
  const q = String(kata || '').trim().toLowerCase().replace(/:/g, '');
  const semua = Object.keys(obj || {}).filter((k) => typeof obj[k] === 'string');
  const cocok = q ? semua.filter((k) => k.toLowerCase().includes(q)) : semua;
  return { total: semua.length, cocok: cocok.length, tampil: cocok.slice(0, batas || 120) };
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: rocket, cat, heart');
  inp.setAttribute('autocomplete', 'off');
  let data = null;

  const tampilkan = () => {
    const hasil = saringEmoji(data, inp.value, 120);
    if (!hasil.cocok) {
      T.show(box, '<p class="center dim">Tidak ada emoji yang cocok. Coba kata lain, contoh: rocket.</p>');
      return;
    }
    T.show(box,
      '<p class="dim" style="font-size:13px">Menampilkan ' + hasil.tampil.length + ' dari ' + hasil.cocok.toLocaleString('id-ID') + ' emoji yang cocok (total ' + hasil.total.toLocaleString('id-ID') + ').</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px;margin-top:10px">' +
      hasil.tampil.map((nama) =>
        '<div style="border:1px solid #2e2823;border-radius:10px;padding:8px 4px;text-align:center">' +
        (gambarAman(data[nama]) ? '<img src="' + esc(data[nama]) + '" alt=":' + esc(nama) + ':" style="width:28px;height:28px" loading="lazy" data-err="hide">' : '') +
        '<div style="font-size:11.5px;margin-top:4px;word-break:break-all">:' + esc(nama) + ':</div></div>').join('') +
      '</div>' +
      '<p class="hint">Sumber: api.github.com/emojis. Kode seperti :rocket: bisa dipakai di komentar GitHub.</p>');
    T.wireImgErr(box);
  };

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Memuat daftar emoji GitHub…</p>');
    try {
      const j = await getJSON(API);
      if (!j || typeof j !== 'object' || !Object.keys(j).length) throw new Error('bad-data');
      data = j;
      tampilkan();
    } catch (e) {
      if (e.message === 'rate-limit') {
        gagal('Batas permintaan GitHub tercapai (60 per jam tanpa login). Tunggu sebentar, lalu coba lagi.');
        return;
      }
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server GitHub tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal memuat daftar emoji. Cek koneksi internet, lalu coba lagi.');
    }
  };

  inp.addEventListener('input', () => { if (data) tampilkan(); });
  root.appendChild(T.el('<p class="note">Telusuri semua emoji yang bisa dipakai di GitHub, lengkap dengan kodenya. Tanpa login, GitHub mengizinkan 60 kali muat daftar per jam.</p>'));
  root.appendChild(T.field('Cari emoji', inp, 'Ketik kata, contoh: rocket'));
  root.appendChild(box);
  muat();
}
