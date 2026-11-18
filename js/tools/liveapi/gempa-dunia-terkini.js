import { h as T, esc, errBox } from '../../core.js';

// Gempa bumi terbaru di dunia lewat USGS (tanpa key).
// Terverifikasi 18 Nov 2026: earthquake.usgs.gov/fdsnws/event/1/query 200, CORS *.
const API = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

const MAGNITUDO = [
  ['', 'Semua kekuatan'], ['4', 'Magnitudo 4 ke atas'], ['5', 'Magnitudo 5 ke atas'], ['6', 'Magnitudo 6 ke atas'],
];
const RENTANG = [
  ['1', '24 jam terakhir'], ['7', '7 hari terakhir'], ['30', '30 hari terakhir'],
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

function waktuCantik(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function tglISO(hariLalu) {
  const d = new Date();
  d.setDate(d.getDate() - hariLalu);
  return d.toISOString().slice(0, 10);
}

const tautanAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export const meta = {"id": "gempa-dunia-terkini", "name": "Gempa Dunia Terkini", "cat": "liveapi", "icon": "🌍", "desc": "Gempa bumi terbaru di seluruh dunia dari USGS, bisa difilter kekuatan dan waktunya.", "keywords": "gempa,bumi,usgs,dunia,earthquake,magnitudo,terkini", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const magS = T.select(MAGNITUDO, '');
  const rentangS = T.select(RENTANG, '1');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil data gempa terbaru…</p>');
    try {
      let url = API + '?format=geojson&limit=30&orderby=time&starttime=' + tglISO(Number(rentangS.value));
      if (magS.value) url += '&minmagnitude=' + encodeURIComponent(magS.value);
      const j = await getJSON(url);
      const list = j && Array.isArray(j.features) ? j.features : [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada gempa yang tercatat untuk filter itu. Coba rentang waktu lebih panjang atau turunkan batas magnitudonya.</p>');
        return;
      }
      T.show(box, '<p class="hint">' + list.length + ' gempa terbaru, dari yang paling baru.</p>' +
        list.map((f) => {
          const p = f.properties || {};
          const g = f.geometry || {};
          const koord = Array.isArray(g.coordinates) ? g.coordinates : [];
          const mag = typeof p.mag === 'number' ? p.mag.toFixed(1) : '?';
          const kedalaman = koord.length > 2 && typeof koord[2] === 'number' ? koord[2].toFixed(1) + ' km' : 'tidak ada data';
          const link = tautanAman(p.url) ? p.url : null;
          const isi = '<div style="font-weight:700;font-size:14px;line-height:1.4">M' + esc(mag) + ' · ' + esc(String(p.place || 'Lokasi tidak diketahui')) + '</div>' +
            '<div class="dim" style="font-size:12px;margin-top:4px">' + esc(waktuCantik(p.time)) +
            ' · kedalaman ' + esc(kedalaman) +
            (p.tsunami ? ' · berpotensi tsunami' : '') + '</div>';
          return '<div style="border-top:1px solid #ffffff14;padding:12px 0">' +
            (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + isi + '</a>' : isi) + '</div>';
        }).join('') +
        '<p class="hint">Sumber: USGS (Survei Geologi Amerika Serikat). Waktu ditampilkan dalam zona waktu perangkatmu.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server USGS tidak merespons dalam 15 detik.'
        : 'Data gempa gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Gempa bumi terbaru di seluruh dunia. Saring berdasarkan kekuatan dan rentang waktunya.</p>'));
  root.appendChild(T.field('Kekuatan minimum', magS));
  root.appendChild(T.field('Rentang waktu', rentangS));
  root.appendChild(T.row(T.btn('Lihat gempa', muat, true)));
  root.appendChild(box);
  muat();
}
