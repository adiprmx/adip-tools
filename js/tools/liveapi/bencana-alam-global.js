import { h as T, esc, errBox } from '../../core.js';

// Peristiwa bencana alam terkini lewat NASA EONET (tanpa key).
// Terverifikasi 18 Nov 2026: eonet.gsfc.nasa.gov/api/v3/events 200, CORS *.
// Catatan: header Content-Type API ini salah (rss+xml) tapi isi bodinya JSON
// yang valid, jadi fetch lalu .json() tetap jalan.
const API = 'https://eonet.gsfc.nasa.gov/api/v3/events';

const KATEGORI = [
  ['', 'Semua jenis'], ['wildfires', 'Kebakaran hutan'], ['severeStorms', 'Badai'],
  ['volcanoes', 'Gunung berapi'], ['earthquakes', 'Gempa bumi'], ['floods', 'Banjir'],
  ['landslides', 'Longsor'], ['seaLakeIce', 'Es laut dan danau'], ['snow', 'Salju'],
  ['drought', 'Kekeringan'], ['dustHaze', 'Debu dan kabut asap'], ['manmade', 'Akibat manusia'],
  ['waterColor', 'Perubahan warna air'], ['tempExtremes', 'Suhu ekstrem'],
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

function tglCantik(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "bencana-alam-global", "name": "Bencana Alam Global", "cat": "liveapi", "icon": "🌋", "desc": "Peristiwa bencana alam yang sedang terjadi di dunia, dari data NASA EONET.", "keywords": "bencana,gempa,banjir,gunung berapi,kebakaran,badai,nasa,eonet,alam", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const katS = T.select(KATEGORI, '');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil daftar bencana yang sedang terjadi…</p>');
    try {
      const url = API + '?limit=20&status=open' + (katS.value ? '&category=' + encodeURIComponent(katS.value) : '');
      const j = await getJSON(url);
      const ev = j && Array.isArray(j.events) ? j.events : [];
      if (!ev.length) {
        T.show(box, '<p class="center dim">Tidak ada peristiwa yang tercatat untuk jenis itu saat ini.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + ev.length + ' peristiwa sedang terjadi.</p>' +
        ev.map((e) => {
          const kats = Array.isArray(e.categories) ? e.categories.map((k) => k.title).filter(Boolean).join(', ') : '';
          const geo = Array.isArray(e.geometry) && e.geometry.length ? e.geometry[e.geometry.length - 1] : null;
          const tgl = geo && geo.date ? tglCantik(geo.date) : '';
          const koord = geo && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2
            ? Number(geo.coordinates[1]).toFixed(2) + ', ' + Number(geo.coordinates[0]).toFixed(2) : '';
          const sumber = Array.isArray(e.sources) && e.sources[0] && tautanAman(e.sources[0].url) ? e.sources[0].url : null;
          const isi = '<div style="font-weight:700;font-size:14px;line-height:1.4">' + esc(String(e.title || 'Tanpa judul')) + '</div>' +
            '<div class="dim" style="font-size:12px;margin-top:4px">' +
            (kats ? esc(kats) : '') + (tgl ? (kats ? ' · ' : '') + esc(tgl) : '') +
            (koord ? '<br>Koordinat: ' + esc(koord) : '') + '</div>';
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            (sumber ? '<a href="' + esc(sumber) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') +
        '<p class="hint">Sumber: NASA EONET. Data ini untuk pantauan umum, bukan peringatan resmi. Untuk kondisi darurat, ikuti arahan otoritas setempat.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server NASA tidak merespons dalam 15 detik.'
        : 'Daftar bencana gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  katS.addEventListener('change', muat);
  root.appendChild(T.el('<p class="note">Peristiwa bencana alam yang sedang terjadi di seluruh dunia, dicatat NASA. Pilih jenis untuk menyaring.</p>'));
  root.appendChild(T.field('Jenis bencana', katS));
  root.appendChild(T.row(T.btn('Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
