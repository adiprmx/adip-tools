import { h as T, esc, errBox } from '../../core.js';

// Ketinggian (elevasi) suatu koordinat di atas permukaan laut, lewat
// Open-Meteo Elevation API, tanpa key.
// Terverifikasi 19 Nov 2026: /v1/elevation?latitude=-6.2&longitude=106.8
// -> 429 + CORS * (kuota harian IP proxy bersama habis; endpoint hidup,
// pengunjung memakai IP masing-masing). Respons sukses: {"elevation":[15.0]}.
// Angka negatif berarti di bawah permukaan laut.
export const meta = {"id":"ketinggian-lokasi","name":"Ketinggian Lokasi","cat":"liveapi","icon":"⛰️","desc":"Cek ketinggian sebuah titik di atas permukaan laut dari koordinatnya.","keywords":"ketinggian,elevasi,mdpl,koordinat,lintang,bujur,gunung,laut","since":"6.19.0", "online": true};

const API = 'https://api.open-meteo.com/v1/elevation?latitude=';

export function render(root) {
  const box = T.out();
  const lat = T.input('text', 'Contoh: -6,2', '-6,2');
  const lon = T.input('text', 'Contoh: 106,8', '106,8');
  lat.setAttribute('inputmode', 'decimal');
  lon.setAttribute('inputmode', 'decimal');

  const cek = async () => {
    const la = parseFloat(lat.value.replace(',', '.'));
    const lo = parseFloat(lon.value.replace(',', '.'));
    if (Number.isNaN(la) || Number.isNaN(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      T.show(box, errBox('Koordinat tidak valid. Lintang antara -90 sampai 90, bujur antara -180 sampai 180.'));
      return;
    }
    T.show(box, '<p class="mut">Mengecek ketinggian…</p>');
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    try {
      const r = await fetch(API + la + '&longitude=' + lo, { signal: c.signal });
      if (r.status === 429) throw new Error('rate');
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      const el = j && Array.isArray(j.elevation) ? j.elevation[0] : null;
      if (typeof el !== 'number') throw new Error('bad-data');
      const mdpl = Math.round(el * 10) / 10;
      const ket = el < 0
        ? 'Titik ini berada di bawah permukaan laut.'
        : el === 0
          ? 'Titik ini pas di permukaan laut.'
          : 'Titik ini berada ' + esc(String(mdpl)).replace('.', ',') + ' meter di atas permukaan laut.';
      T.show(box,
        '<div class="center"><div style="font-weight:800;font-size:32px;margin:6px 0">' + esc(String(mdpl)).replace('.', ',') + ' m</div>' +
        '<div class="dim" style="font-size:13px">' + ket + '</div></div>' +
        '<div class="kv"><span class="k">Lintang</span><span class="v">' + esc(String(la)) + '</span></div>' +
        '<div class="kv"><span class="k">Bujur</span><span class="v">' + esc(String(lo)) + '</span></div>' +
        '<p class="hint">Sumber: Open-Meteo. Angka berasal dari model ketinggian global, bisa selisih beberapa meter dari kondisi di lapangan.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server tidak bisa dihubungi dalam 15 detik.'
        : e.message === 'rate'
          ? 'Server sedang membatasi permintaan dari jaringan ini. Coba lagi beberapa saat lagi.'
          : 'Gagal mengecek ketinggian. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cek));
      box.appendChild(wr);
    } finally { clearTimeout(t); }
  };

  root.appendChild(T.el('<p class="note">Tulis lintang dan bujur, lalu ketuk Cek. Hasilnya ketinggian titik itu di atas permukaan laut, dalam meter. Koordinat Jakarta sudah terisi sebagai contoh.</p>'));
  root.appendChild(T.grid2(T.field('Lintang', lat), T.field('Bujur', lon)));
  root.appendChild(T.row(T.btn('⛰️ Cek ketinggian', cek, true)));
  root.appendChild(box);
  T.show(box, '<p class="center dim">Belum ada yang dicek. Ketuk tombol di atas untuk mulai.</p>');
}
