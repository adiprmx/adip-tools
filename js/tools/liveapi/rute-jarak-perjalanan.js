import { h as T, esc, errBox } from '../../core.js';

// Rute mengemudi, jarak, dan waktu tempuh lewat OSRM, tanpa key.
// Terverifikasi 17 Nov 2026: /route/v1/driving/106.8,-6.2;107.6,-6.9?overview=false -> 200, CORS *.
// Server demo OSRM, pakai wajar. Parameter steps=true ditambahkan di
// endpoint yang sama agar langkah perjalanan ikut tampil bila ada.
export const meta = {"id":"rute-jarak-perjalanan","name":"Rute & Jarak Perjalanan","cat":"liveapi","icon":"🗺️","desc":"Hitung jarak dan waktu tempuh berkendara antara dua titik koordinat.","keywords":"rute,jarak,perjalanan,osrm,berkendara,waktu tempuh,peta,navigasi","since":"6.17.0", "online": true};

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

function durasiCantik(detik) {
  const d = Math.round(Number(detik) || 0);
  if (d < 60) return d + ' detik';
  const menit = Math.floor(d / 60);
  if (menit < 60) return menit + ' menit';
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return jam + ' jam' + (sisa ? ' ' + sisa + ' menit' : '');
}

export function render(root) {
  const box = T.out();
  const lat1 = T.input('number', 'Lintang awal', '-6.2');
  const lon1 = T.input('number', 'Bujur awal', '106.8');
  const lat2 = T.input('number', 'Lintang tujuan', '-6.9');
  const lon2 = T.input('number', 'Bujur tujuan', '107.6');

  const hitung = async () => {
    const a1 = Number(lat1.value), o1 = Number(lon1.value), a2 = Number(lat2.value), o2 = Number(lon2.value);
    const ok = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
    if (!ok(a1, -90, 90) || !ok(o1, -180, 180) || !ok(a2, -90, 90) || !ok(o2, -180, 180)) {
      T.show(box, errBox('Koordinat tidak valid. Lintang -90 sampai 90, bujur -180 sampai 180.'));
      return;
    }
    T.show(box, '<p class="mut">Menghitung rute…</p>');
    try {
      const j = await getJSON('https://router.project-osrm.org/route/v1/driving/' +
        o1 + ',' + a1 + ';' + o2 + ',' + a2 + '?overview=false&steps=true');
      if (!j || j.code !== 'Ok' || !j.routes || !j.routes.length) throw new Error('no-route');
      const r = j.routes[0];
      const km = (Number(r.distance) || 0) / 1000;
      const langkah = ((r.legs && r.legs[0] && r.legs[0].steps) || []).filter((s) => s.maneuver && s.maneuver.instruction);
      T.show(box,
        '<div class="center"><div class="dim">Jarak berkendara</div>' +
        '<div style="font-weight:800;font-size:26px;margin:4px 0">' + esc(km >= 10 ? km.toFixed(0) : km.toFixed(1)) + ' km</div>' +
        '<div class="dim" style="font-size:13px">Waktu tempuh sekitar ' + esc(durasiCantik(r.duration)) + '</div></div>' +
        (langkah.length ? '<p style="margin-top:14px"><b>Langkah perjalanan</b></p>' +
          langkah.slice(0, 12).map((s, i) => '<div class="kv"><span class="k">' + (i + 1) + '. ' + esc(s.maneuver.instruction) + '</span><span class="v">' +
          esc(((Number(s.distance) || 0) / 1000).toFixed(1)) + ' km</span></div>').join('') : '') +
        '<p class="hint">Sumber: OSRM dengan data OpenStreetMap. Waktu tempuh adalah perkiraan dalam kondisi normal, bukan kondisi macet.</p>');
    } catch (e) {
      if (e.message === 'no-route') {
        T.show(box, '<p class="center dim">Tidak ada rute berkendara antara dua titik itu. Periksa koordinatnya, mungkin salah satu titik berada di laut atau di luar jalan.</p>');
        return;
      }
      const msg = e.name === 'AbortError'
        ? 'Waktu habis, server OSRM tidak bisa dihubungi dalam 15 detik.'
        : 'Gagal menghitung rute. Cek koneksi internet, lalu coba lagi.';
      T.show(box, errBox(msg));
      const wr = T.el('<div style="margin-top:8px"></div>');
      wr.appendChild(T.btn('🔄 Coba lagi', hitung));
      box.appendChild(wr);
    }
  };

  root.appendChild(T.el('<p class="note">Isi koordinat titik awal dan tujuan untuk melihat jarak dan perkiraan waktu tempuh berkendara. Koordinat yang kamu isi dikirim ke OSRM untuk dihitung rutenya. Koordinat bisa didapat dari tool Cari Lokasi. Nilai awal berisi contoh Jakarta ke Bandung.</p>'));
  root.appendChild(T.el('<p style="margin-top:8px"><b>Titik awal</b></p>'));
  root.appendChild(T.grid2(T.field('Lintang awal', lat1, ''), T.field('Bujur awal', lon1, '')));
  root.appendChild(T.el('<p style="margin-top:8px"><b>Titik tujuan</b></p>'));
  root.appendChild(T.grid2(T.field('Lintang tujuan', lat2, ''), T.field('Bujur tujuan', lon2, '')));
  root.appendChild(T.row(T.btn('🗺️ Hitung rute', hitung, true)));
  root.appendChild(box);
}
