import { h as T, esc, errBox } from '../../core.js';

export const meta = {"id":"cari-lokasi","name":"Cari Lokasi & Koordinat","cat":"liveapi","icon":"📍","desc":"Cari tempat apa pun dan dapatkan koordinatnya dari OpenStreetMap.","keywords":"lokasi,koordinat,latitude,longitude,tempat,peta,alamat,osm","since":"6.16.0"};

const API = 'https://nominatim.openstreetmap.org/search';

export function render(root) {
  const box = T.out();
  const inp = T.input('text', 'Contoh: Monas Jakarta, Pantai Kuta, Stasiun Bandung');
  inp.setAttribute('autocomplete', 'off');
  let terakhir = 0;
  let tombolCari = null;

  const cari = async () => {
    const q = inp.value.trim();
    if (!q) { T.show(box, errBox('Tulis nama tempat dulu.')); return; }
    const jeda = Date.now() - terakhir;
    if (jeda < 1000) {
      T.show(box, '<p class="dim center">Tunggu sebentar, pencarian dibatasi satu kali per detik.</p>');
      return;
    }
    terakhir = Date.now();
    T.show(box, '<p class="mut">Mencari "' + esc(q) + '"…</p>');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(API + '?q=' + encodeURIComponent(q) + '&format=json&limit=8&addressdetails=1', { signal: ctrl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      if (!Array.isArray(j) || !j.length) {
        T.show(box, '<p class="center dim">Tidak ada tempat yang cocok dengan "' + esc(q) + '".</p><p class="hint center">Coba nama yang lebih umum, contoh: nama kota atau nama jalan saja.</p>');
        return;
      }
      let html = '<p class="hint">Ketuk koordinat untuk menyalinnya.</p>';
      j.forEach((it) => {
        const lat = it.lat, lon = it.lon;
        const nama = it.display_name || '-';
        const jenis = it.type ? String(it.type).replace(/_/g, ' ') : '';
        html += '<div style="border:1px solid #2e2823;border-radius:10px;padding:10px 12px;margin-bottom:8px">' +
          '<div style="font-weight:700;line-height:1.4">' + esc(nama) + '</div>' +
          (jenis ? '<div class="dim" style="font-size:12px;margin-top:2px">Jenis: ' + esc(jenis) + '</div>' : '') +
          '<div style="font-family:monospace;font-size:13px;margin-top:6px"><button type="button" class="btn" data-koor="' + esc(lat + ', ' + lon) + '" style="font-family:monospace">📋 ' + esc(lat + ', ' + lon) + '</button> ' +
          '<a class="btn" href="https://www.openstreetmap.org/?mlat=' + esc(lat) + '&mlon=' + esc(lon) + '#map=16/' + esc(lat) + '/' + esc(lon) + '" target="_blank" rel="noopener">Lihat di peta</a></div></div>';
      });
      html += '<p class="hint">Data © kontributor OpenStreetMap, lisensi ODbL.</p>';
      T.show(box, html);
      box.querySelectorAll('[data-koor]').forEach((b) => {
        b.addEventListener('click', () => T.copy(b.getAttribute('data-koor')));
      });
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server peta tidak merespons dalam 15 detik.'
        : 'Gagal mencari tempat. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', cari));
      box.appendChild(wr);
    } finally { clearTimeout(timer); }
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') cari(); });
  tombolCari = T.btn('🔍 Cari tempat', cari, true);
  root.appendChild(T.field('Nama tempat', inp, 'Nama jalan, gedung, kota, atau tempat wisata.'));
  root.appendChild(T.row(tombolCari));
  root.appendChild(box);
}
