import { h as T, esc, errBox } from '../../core.js';

// Template meme populer lewat Imgflip, GET saja tanpa key.
// Terverifikasi 17 Nov 2026: /get_memes -> 200, CORS *.
// Fitur caption (menulis teks ke meme) MEMBUTUHKAN akun Imgflip, jadi
// TIDAK ada di tool ini. Tool ini hanya menjelajah template dan
// mengunduh gambar templatenya. Kredensial user tidak pernah diminta.
export const meta = {"id":"template-meme-populer","name":"Template Meme Populer","cat":"liveapi","icon":"😂","desc":"Jelajahi template meme paling populer dari Imgflip dan unduh gambarnya.","keywords":"meme,template meme,imgflip,lucu,template,meme populer","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (!j || !j.success || !j.data || !Array.isArray(j.data.memes)) throw new Error('bad-data');
    return j.data.memes;
  } finally { clearTimeout(t); }
}

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();
  const cariI = T.input('text', 'Saring template: contoh drake, cat, distracted…');
  cariI.setAttribute('autocomplete', 'off');
  let semua = [];

  const tampil = () => {
    const q = String(cariI.value || '').trim().toLowerCase();
    const list = !q ? semua : semua.filter((m) => (m.name || '').toLowerCase().includes(q));
    if (!list.length) {
      T.show(box, '<p class="center dim">Tidak ada template yang cocok dengan saringan itu.</p>');
      return;
    }
    T.show(box, '<p class="hint">' + list.length + ' template' + (q ? ' cocok dengan saringan' : ' paling populer') + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:10px">' + list.slice(0, 30).map((m) =>
        '<div style="border:1px solid #ffffff14;border-radius:10px;overflow:hidden">' +
        (gambarAman(m.url) ? '<img src="' + esc(m.url) + '" alt="' + esc(m.name || 'Template meme') + '" style="width:100%;height:150px;object-fit:cover;display:block" loading="lazy" data-err="hide">' : '') +
        '<div style="padding:8px"><div style="font-weight:700;font-size:13px;line-height:1.4">' + esc(m.name || 'Tanpa nama') + '</div>' +
        '<div class="dim" style="font-size:11.5px;margin-top:2px">' + esc(String(m.box_count || 0)) + ' kotak teks</div>' +
        (gambarAman(m.url) ? '<div style="margin-top:6px"><a href="' + esc(m.url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Unduh gambar</a></div>' : '') +
        '</div></div>'
      ).join('') + '</div>' +
      '<p class="hint">Sumber: Imgflip. Menulis teks ke meme butuh akun Imgflip, jadi tidak ada di sini. Unduh gambarnya lalu edit di aplikasi favoritmu.</p>');
    T.wireImgErr(box);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil template meme…</p>');
    try {
      semua = await getJSON('https://api.imgflip.com/get_memes');
      if (!semua.length) throw new Error('bad-data');
      tampil();
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Imgflip tidak merespons dalam 15 detik.'
        : 'Gagal mengambil template meme. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  cariI.addEventListener('input', () => { if (semua.length) tampil(); });
  root.appendChild(T.el('<p class="note">Template meme paling populer dari Imgflip. Ketik untuk menyaring, ketuk unduh untuk menyimpan gambar templatenya.</p>'));
  root.appendChild(T.field('Saring template', cariI, 'Penyaringan dilakukan di perangkatmu, tanpa memanggil server lagi'));
  root.appendChild(T.row(T.btn('🔄 Muat ulang', muat)));
  root.appendChild(box);
  muat();
}
