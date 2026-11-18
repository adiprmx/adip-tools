import { h as T, esc, errBox } from '../../core.js';

// Prakiraan debit sungai lewat Open-Meteo Flood API (tanpa key).
// Terverifikasi 18 Nov 2026: flood-api.open-meteo.com/v1/flood 200, CORS *.
// Batas: 10.000 permintaan/hari per IP.
const API = 'https://flood-api.open-meteo.com/v1/flood';

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
  const d = new Date(s + 'T00:00:00');
  if (isNaN(d)) return String(s);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const meta = {"id": "banjir-sungai", "name": "Banjir Sungai", "cat": "liveapi", "icon": "🌊", "desc": "Prakiraan debit air sungai untuk beberapa hari ke depan di titik yang kamu pilih.", "keywords": "banjir,sungai,debit,air,open-meteo,prakiraan,banjir sungai,hidrologi", "since": "6.17.0"};

export function render(root) {
  const box = T.out();
  const latI = T.input('number', 'Contoh: -6.2', '-6.2');
  const lonI = T.input('number', 'Contoh: 106.8', '106.8');
  const hariS = T.select([['7', '7 hari'], ['14', '14 hari'], ['16', '16 hari']], '7');

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    const lat = parseFloat(String(latI.value).replace(',', '.'));
    const lon = parseFloat(String(lonI.value).replace(',', '.'));
    if (!isFinite(lat) || lat < -90 || lat > 90 || !isFinite(lon) || lon < -180 || lon > 180) {
      T.show(box, errBox('Isi lintang antara -90 sampai 90 dan bujur antara -180 sampai 180.'));
      return;
    }
    T.show(box, '<p class="mut">Mengambil prakiraan debit sungai…</p>');
    try {
      const j = await getJSON(API + '?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&daily=river_discharge&forecast_days=' + encodeURIComponent(hariS.value));
      const daily = j && j.daily;
      const waktu = daily && Array.isArray(daily.time) ? daily.time : [];
      const debit = daily && Array.isArray(daily.river_discharge) ? daily.river_discharge : [];
      if (!waktu.length || !debit.length) throw new Error('bad-data');
      let maks = -1, maksIdx = 0;
      debit.forEach((v, i) => { if (typeof v === 'number' && v > maks) { maks = v; maksIdx = i; } });
      T.show(box, '<p class="hint">Debit air sungai (meter kubik per detik) di titik ' + esc(String(lat)) + ', ' + esc(String(lon)) + '. Angka paling tinggi jatuh pada ' + esc(tglCantik(waktu[maksIdx])) + '.</p>' +
        waktu.map((t, i) => {
          const v = debit[i];
          return '<div class="kv"><span class="k">' + esc(tglCantik(t)) + (i === maksIdx ? ' <b>(tertinggi)</b>' : '') + '</span><span class="v">' + (typeof v === 'number' ? v.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' m³/detik' : 'tidak ada data') + '</span></div>';
        }).join('') +
        '<p class="hint">Ini prakiraan model komputer dari Open-Meteo, bukan peringatan resmi. Untuk info banjir resmi, ikuti pengumuman BPBD dan BMKG setempat.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server prakiraan tidak merespons dalam 15 detik.'
        : 'Prakiraan gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Lihat seberapa besar aliran air sungai di suatu titik untuk hari-hari ke depan. Isi koordinat titik yang mau dicek, contoh Jakarta: -6.2 dan 106.8.</p>'));
  root.appendChild(T.field('Lintang (latitude)', latI, 'Angka antara -90 sampai 90'));
  root.appendChild(T.field('Bujur (longitude)', lonI, 'Angka antara -180 sampai 180'));
  root.appendChild(T.field('Berapa hari', hariS));
  root.appendChild(T.row(T.btn('Lihat prakiraan', muat, true)));
  root.appendChild(box);
}
