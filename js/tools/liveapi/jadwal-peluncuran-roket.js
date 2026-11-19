import { h as T, esc, errBox, utils } from '../../core.js';

// Jadwal peluncuran roket lewat The Space Devs, tanpa key.
// Terverifikasi 17 Nov 2026: /2.2.0/launch/upcoming/?limit=1 -> 200, CORS *.
// Catatan: API ini membatasi bila dipanggil terlalu sering (throttle).
// Tool ini hanya memanggil sekali per aksi, tanpa muat ulang otomatis.
export const meta = {"id":"jadwal-peluncuran-roket","name":"Jadwal Peluncuran Roket","cat":"liveapi","icon":"🚀","desc":"Peluncuran roket dan misi antariksa yang akan datang.","keywords":"roket,peluncuran,antariksa,spacex,nasa,misi luar angkasa,launch","since":"6.17.0"};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (r.status === 429) throw new Error('throttle');
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// tglCantik kanonis tinggal di utils (core.js) — dipakai dengan
// { bulan: 'long', jam: true, pukul: true }.

const gambarAman = (u) => typeof u === 'string' && u.indexOf('https://') === 0;

export function render(root) {
  const box = T.out();

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil jadwal peluncuran…</p>');
    try {
      const j = await getJSON('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10');
      const list = (j && j.results) || [];
      if (!list.length) {
        T.show(box, '<p class="center dim">Tidak ada jadwal peluncuran yang tercatat saat ini.</p>');
        return;
      }
      T.show(box, list.map((l) => {
        const roket = (l.rocket && l.rocket.configuration && l.rocket.configuration.name) || '';
        const misi = (l.mission && l.mission.description) || '';
        const lokasi = (l.pad && l.pad.location && l.pad.location.name) || '';
        const status = (l.status && l.status.name) || '';
        return '<div style="border-top:1px solid #ffffff14;padding:12px 0;display:flex;gap:12px">' +
          (gambarAman(l.image) ? '<img src="' + esc(l.image) + '" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;flex:none" loading="lazy" data-err="hide">' : '') +
          '<div style="min-width:0">' +
          '<div style="font-weight:700;font-size:15px">' + esc(l.name || 'Peluncuran') + '</div>' +
          '<div class="dim" style="font-size:12.5px;line-height:1.7">' + esc(utils.tglCantik(l.net, { bulan: 'long', jam: true, pukul: true })) +
          (roket ? '<br>Roket: ' + esc(roket) : '') +
          (lokasi ? '<br>Lokasi: ' + esc(lokasi) : '') +
          (status ? '<br>Status: ' + esc(status) : '') + '</div>' +
          (misi ? '<p class="hint" style="margin-top:6px">' + esc(misi.length > 300 ? misi.slice(0, 300) + '…' : misi) + '</p>' : '') +
          '</div></div>';
      }).join('') + '<p class="hint">Sumber: The Space Devs. Waktu tampil dalam zona waktu perangkatmu.</p>');
      T.wireImgErr(box);
    } catch (e) {
      const msg = e.message === 'throttle'
        ? 'Server peluncuran sedang membatasi permintaan. Tunggu sebentar lalu coba lagi.'
        : e.name === 'AbortError'
          ? 'Waktu habis, server tidak merespons dalam 15 detik.'
          : 'Gagal mengambil jadwal peluncuran. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Sepuluh peluncuran roket berikutnya, lengkap dengan roket, lokasi, dan misinya.</p>'));
  root.appendChild(T.row(T.btn('🔄 Muat ulang', muat)));
  root.appendChild(box);
  muat();
}
