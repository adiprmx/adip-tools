import { h as T, esc, errBox } from '../../core.js';

// Prakiraan gelombang laut lewat Open-Meteo Marine, tanpa key.
// Terverifikasi 17 Nov 2026: /v1/marine?latitude=-6.2&longitude=106.8&hourly=wave_height&forecast_days=1 -> 200, CORS *.
// Batas: 10.000 permintaan per hari per IP.
export const meta = {"id":"prakiraan-gelombang-laut","name":"Prakiraan Gelombang Laut","cat":"liveapi","icon":"🌊","desc":"Prakiraan tinggi gelombang laut per jam untuk lokasi pesisir yang kamu pilih.","keywords":"gelombang,omak,laut,marine,prakiraan laut,nelayan,selancar,cuaca laut","since":"6.17.0", "online": true};

const PRESET = [
  ['jakarta', 'Jakarta (Teluk Jakarta)', -6.1, 106.85],
  ['bali', 'Bali (Kuta)', -8.72, 115.17],
  ['surabaya', 'Surabaya (Selat Madura)', -7.2, 112.75],
  ['medan', 'Medan (Belawan)', 3.78, 98.68],
  ['makassar', 'Makassar (Selat Makassar)', -5.14, 119.42],
  ['custom', 'Lokasi lain (isi koordinat)', null, null],
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

function jamCantik(s) {
  const d = new Date(s);
  if (isNaN(d)) return String(s || '').slice(11, 16);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function render(root) {
  const box = T.out();
  const pilih = T.select(PRESET.map(([v, l]) => [v, l]), 'jakarta');
  const latI = T.input('number', 'Lintang, contoh: -6.1', '-6.1');
  const lonI = T.input('number', 'Bujur, contoh: 106.85', '106.85');
  const koordBox = T.el('<div></div>');
  koordBox.appendChild(T.grid2(T.field('Lintang', latI, ''), T.field('Bujur', lonI, '')));
  koordBox.hidden = true;

  pilih.addEventListener('change', () => {
    const p = PRESET.find((x) => x[0] === pilih.value);
    if (p && p[2] != null) { latI.value = p[2]; lonI.value = p[3]; koordBox.hidden = true; }
    else koordBox.hidden = false;
  });

  const muat = async () => {
    const lat = Number(latI.value), lon = Number(lonI.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      T.show(box, errBox('Koordinat tidak valid. Lintang -90 sampai 90, bujur -180 sampai 180.'));
      return;
    }
    T.show(box, '<p class="mut">Mengambil prakiraan gelombang…</p>');
    try {
      const j = await getJSON('https://marine-api.open-meteo.com/v1/marine?latitude=' + lat + '&longitude=' + lon +
        '&hourly=wave_height,wave_period,wind_wave_height&forecast_days=2&timezone=auto');
      const h = j && j.hourly;
      if (!h || !Array.isArray(h.time) || !h.time.length) throw new Error('bad-data');
      const sekarang = Date.now();
      let mulai = h.time.findIndex((t) => new Date(t).getTime() >= sekarang - 3600000);
      if (mulai < 0) mulai = 0;
      const potong = h.time.slice(mulai, mulai + 12);
      const tinggi = h.wave_height || [];
      const maks = Math.max.apply(null, (h.wave_height || []).filter((v) => typeof v === 'number'));
      T.show(box,
        '<div class="center"><div class="dim">Tinggi gelombang tertinggi 2 hari ke depan</div>' +
        '<div style="font-weight:800;font-size:26px;margin:4px 0">' + (Number.isFinite(maks) ? esc(maks.toFixed(1)) + ' m' : 'Tidak ada data') + '</div>' +
        '<div class="dim" style="font-size:12.5px">Lokasi: ' + esc(String(lat)) + ', ' + esc(String(lon)) + '</div></div>' +
        '<div style="margin-top:12px">' + potong.map((t, i) => {
          const idx = mulai + i;
          const tg = tinggi[idx];
          const periode = h.wave_period && h.wave_period[idx];
          return '<div class="kv"><span class="k">' + esc(jamCantik(t)) + '</span><span class="v">' +
            (typeof tg === 'number' ? tg.toFixed(1) + ' m' : '-') +
            (typeof periode === 'number' ? ' · periode ' + periode.toFixed(0) + ' dtk' : '') + '</span></div>';
        }).join('') + '</div>' +
        '<p class="hint">Sumber: Open-Meteo Marine. Tinggi gelombang adalah tinggi rata-rata gelombang tertinggi di jam itu. Selalu cek info resmi pelayaran sebelum melaut.</p>');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server Open-Meteo tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal mengambil prakiraan gelombang. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', muat));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Pilih lokasi pesisir untuk melihat prakiraan tinggi gelombang per jam selama 2 hari ke depan.</p>'));
  root.appendChild(T.field('Lokasi', pilih, ''));
  root.appendChild(koordBox);
  root.appendChild(T.row(T.btn('🌊 Lihat prakiraan', muat, true)));
  root.appendChild(box);
}
