import { h as T, esc, errBox } from '../../core.js';

// Info serial TV lewat TVMaze, tanpa key.
// Terverifikasi 17 Nov 2026: /search/shows?q=breaking%20bad -> 200, CORS *.
// Ringkasan dari API mengandung tag HTML, jadi dibersihkan dulu sebelum tampil.
export const meta = {"id":"info-serial-tv","name":"Info Serial TV","cat":"liveapi","icon":"📺","desc":"Cari serial TV: sinopsis, status tayang, genre, dan ratingnya.","keywords":"serial tv,acara tv,sinopsis,episode,tvmaze,drama,series","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Ringkasan TVMaze berisi tag <p> dan <b>. Ambil teksnya saja lewat
// parser DOM, jangan pernah sisipkan HTML mentah dari API ke halaman.
function teksBersih(html) {
  const d = document.createElement('div');
  d.innerHTML = String(html || '');
  const t = (d.textContent || '').replace(/\s+/g, ' ').trim();
  return t.length > 400 ? t.slice(0, 400) + '…' : t;
}

const gambarAman = (u) => typeof u === 'string' && (u.indexOf('https://') === 0 || u.indexOf('http://') === 0);

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Breaking Bad, Stranger Things');
  inp.setAttribute('autocomplete', 'off');

  const cari = async () => {
    const q = String(inp.value || '').trim();
    if (!q) { T.show(box, errBox('Tulis judul serial dulu.')); return; }
    T.show(box, '<p class="mut">Mencari serial ' + esc(q) + '…</p>');
    try {
      const j = await getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(q));
      const list = (Array.isArray(j) ? j : []).map((x) => x.show).filter(Boolean).slice(0, 6);
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada serial yang cocok. Coba judul dalam bahasa Inggris atau ejaan lain.</p>');
        return;
      }
      T.show(box, list.map((s) => {
        const rating = s.rating && s.rating.average;
        const jadwal = s.schedule && s.schedule.days && s.schedule.days.length
          ? s.schedule.days.join(', ') + (s.schedule.time ? ' pukul ' + s.schedule.time : '') : '';
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
          (s.image && gambarAman(s.image.medium) ? '<img src="' + esc(s.image.medium) + '" alt="" style="width:84px;height:120px;object-fit:cover;border-radius:8px;flex:none" loading="lazy" data-err="hide">' : '') +
          '<div style="min-width:0">' +
          '<div style="font-weight:700;font-size:15px">' + esc(s.name || 'Tanpa judul') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' +
          (s.status ? esc(s.status === 'Running' ? 'Masih tayang' : s.status === 'Ended' ? 'Sudah tamat' : s.status) : '') +
          (s.premiered ? ' · mulai ' + esc(String(s.premiered).slice(0, 4)) : '') +
          (s.language ? ' · ' + esc(s.language) : '') +
          (rating ? ' · rating ' + esc(String(rating)) + '/10' : '') +
          '</div>' +
          (s.genres && s.genres.length ? '<div class="hint">' + esc(s.genres.join(', ')) + '</div>' : '') +
          (jadwal ? '<div class="hint">Jadwal: ' + esc(jadwal) + '</div>' : '') +
          (s.summary ? '<p class="hint" style="margin-top:6px">' + esc(teksBersih(s.summary)) + '</p>' : '') +
          (s.url && s.url.indexOf('https://') === 0 ? '<div style="margin-top:4px"><a href="' + esc(s.url) + '" target="_blank" rel="noopener" style="font-size:12.5px">Lihat di TVMaze</a></div>' : '') +
          '</div></div>';
      }).join('') + '<p class="hint">Sumber: TVMaze.</p>');
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server TVMaze tidak merespons dalam 15 detik.'
        : 'Gagal mencari serial. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  root.appendChild(T.el('<p class="note">Cari serial TV untuk melihat sinopsis, status tayang, genre, dan ratingnya. Data dari TVMaze.</p>'));
  root.appendChild(T.field('Judul serial', inp, 'Contoh: Breaking Bad'));
  root.appendChild(T.row(T.btn('🔍 Cari serial', cari, true)));
  root.appendChild(box);
}
