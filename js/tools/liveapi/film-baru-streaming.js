import { h as T, esc, errBox } from '../../core.js';

// Film dan serial yang baru tayang di layanan streaming, lewat Galaxy Movies.
// Terverifikasi 19 Nov 2026: www.galaxymovies.app/api/streaming-changes
// ?provider=netflix -> 200, CORS * (domain tanpa www membalas 308 ke www,
// jadi tool memakai host www langsung). Data katalog Amerika.
// Respons: { label, provider, coming: [{ tmdbId, tmdbType, title, date,
// season }] } + daftar perubahan lain bila ada (new/leaving).
// Slug provider lain (disney, prime, hulu, max, peacock, paramount, apple)
// mengikuti pola parameter yang sama; bila suatu layanan tidak dikenal API,
// tool menampilkan pesan gagal jujur, bukan daftar karangan.
export const meta = {"id":"film-baru-streaming","name":"Film Baru di Streaming","cat":"liveapi","icon":"🎬","desc":"Lihat film dan serial yang baru tayang dan segera tayang di Netflix dan layanan lain.","keywords":"film,serial,streaming,netflix,disney,baru tayang,bioskop","since":"6.19.0"};

const API = 'https://www.galaxymovies.app/api/streaming-changes?provider=';
const LAYANAN = [
  ['netflix', 'Netflix'], ['disney', 'Disney+'], ['prime', 'Prime Video'],
  ['hulu', 'Hulu'], ['max', 'Max'], ['peacock', 'Peacock'],
  ['paramount', 'Paramount+'], ['apple', 'Apple TV+'],
];

function tglCantik(s) {
  if (typeof s !== 'string' || s.length < 10) return '-';
  const nama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const m = parseInt(s.slice(5, 7), 10);
  return s.slice(8, 10) + ' ' + (nama[m - 1] || s.slice(5, 7)) + ' ' + s.slice(0, 4);
}
const jenis = (t) => (t === 'tv' ? 'Serial' : t === 'movie' ? 'Film' : (t || ''));

function bagian(judul, items) {
  if (!Array.isArray(items) || !items.length) return '';
  const urut = items.slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  let h = '<p style="font-weight:700;margin:14px 0 6px">' + esc(judul) + ' (' + urut.length + ')</p>';
  urut.slice(0, 60).forEach((it) => {
    h += '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--line,#e5e5e5)">' +
      '<span style="font-size:13.5px">' + esc(it.title || '-') +
      (it.season != null ? ' <span class="dim" style="font-size:12px">(musim ' + esc(String(it.season)) + ')</span>' : '') +
      '</span><span class="dim" style="font-size:12.5px;white-space:nowrap;text-align:right">' + esc(jenis(it.tmdbType)) + '<br>' + esc(tglCantik(it.date)) + '</span></div>';
  });
  if (urut.length > 60) h += '<p class="hint">Menampilkan 60 dari ' + urut.length + ' judul.</p>';
  return h;
}

export function render(root) {
  const box = T.out();
  const layanan = T.select(LAYANAN, 'netflix');

  const muat = async () => {
    const nama = LAYANAN.find((p) => p[0] === layanan.value);
    T.show(box, '<p class="mut">Mengambil daftar ' + esc(nama ? nama[1] : '') + '…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 20000);
    try {
      const r = await fetch(API + layanan.value, { signal: c.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!j || typeof j !== 'object') throw new Error('bad-data');
      const baru = j.new || j.arrivals || j.added || [];
      const segera = j.coming || j.upcoming || [];
      const pergi = j.leaving || j.departures || j.removed || [];
      const total = (Array.isArray(baru) ? baru.length : 0) + (Array.isArray(segera) ? segera.length : 0) + (Array.isArray(pergi) ? pergi.length : 0);
      if (!Array.isArray(baru) && !Array.isArray(segera) && !Array.isArray(pergi)) throw new Error('bad-data');
      if (!total) {
        T.show(box, '<p class="center dim">Tidak ada perubahan katalog ' + esc(nama ? nama[1] : '') + ' saat ini. Coba lagi besok atau pilih layanan lain.</p>');
        return;
      }
      let html = '<p class="hint">Katalog Amerika, diperbarui ' + (j.updatedAt ? esc(tglCantik(new Date(j.updatedAt).toISOString().slice(0, 10))) : 'hari ini') + '.</p>';
      html += bagian('Baru tayang', baru);
      html += bagian('Segera tayang', segera);
      html += bagian('Segera pergi', pergi);
      html += '<p class="hint">Sumber: Galaxy Movies. Judul dan tanggal mengikuti katalog Amerika; ketersediaan di Indonesia bisa berbeda.</p>';
      T.show(box, html);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak merespons dalam 20 detik.'
        : 'Gagal mengambil daftar. Layanan ini mungkin belum dikenal, atau cek koneksi internet lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  layanan.addEventListener('change', muat);
  root.appendChild(T.el('<p class="note">Pilih layanan streaming untuk melihat film dan serial yang baru tayang dan segera tayang di sana.</p>'));
  root.appendChild(T.field('Layanan', layanan));
  root.appendChild(box);
  muat();
}
