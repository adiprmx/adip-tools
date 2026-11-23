import { h as T, esc, errBox } from '../../core.js';

// Skala cuaca antariksa lewat NOAA SWPC (tanpa key).
// Terverifikasi 18 Nov 2026: services.swpc.noaa.gov/products/noaa-scales.json 200, CORS *.
const API = 'https://services.swpc.noaa.gov/products/noaa-scales.json';

async function getJSON(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

const PENJELASAN = {
  R: ['Gangguan radio', 'Badai radio dari Matahari bisa mengganggu radio gelombang pendek.'],
  S: ['Radiasi Matahari', 'Partikel energetik dari Matahari, berpengaruh ke satelit dan penerbangan di kutub.'],
  G: ['Badai geomagnet', 'Gangguan medan magnet Bumi. Skala tinggi berarti aurora bisa terlihat lebih jauh dari kutub.'],
};

function barisSkala(kunci, data) {
  const info = PENJELASAN[kunci];
  const skala = data ? Number(data.Scale) : NaN;
  const teks = data && data.Text ? String(data.Text) : 'tidak ada info';
  return '<div class="kv"><span class="k"><b>' + esc(kunci) + ' · ' + esc(info[0]) + '</b>' +
    '<br><span class="hint">' + esc(info[1]) + '</span></span>' +
    '<span class="v" style="text-align:right;font-size:18px;font-weight:800">' + (isFinite(skala) ? skala + ' / 5' : '-') +
    '<br><span class="hint" style="font-size:12px;font-weight:400">' + esc(teks) + '</span></span></div>';
}

export const meta = {"id": "cuaca-antariksa-aurora", "name": "Cuaca Antariksa/Aurora", "cat": "liveapi", "icon": "🌌", "desc": "Skala badai Matahari terkini dari NOAA: gangguan radio, radiasi, dan peluang aurora.", "keywords": "cuaca antariksa,aurora,badai matahari,noaa,geomagnet,radio,matahari,space weather", "since": "6.17.0", "online": true};

export function render(root) {
  const box = T.out();

  const gagal = (pesan) => {
    T.show(box, errBox(pesan));
    const w = T.el('<div style="margin-top:8px"></div>');
    w.appendChild(T.btn('Coba lagi', muat));
    box.appendChild(w);
  };

  const muat = async () => {
    T.show(box, '<p class="mut">Mengambil skala cuaca antariksa dari NOAA…</p>');
    try {
      const j = await getJSON(API);
      const kini = j && j['0'] ? j['0'] : null;
      if (!kini) throw new Error('bad-data');
      const waktu = (kini.DateStamp ? String(kini.DateStamp) : '') + (kini.TimeStamp ? ' ' + String(kini.TimeStamp) + ' UTC' : '');
      const g = kini.G ? Number(kini.G.Scale) : NaN;
      T.show(box, '<p class="hint">Diukur ' + esc(waktu || 'waktu tidak diketahui') + '. Skala 0 berarti tenang, 5 berarti ekstrem.</p>' +
        barisSkala('R', kini.R) + barisSkala('S', kini.S) + barisSkala('G', kini.G) +
        (isFinite(g) && g >= 4
          ? '<p style="margin-top:10px">Badai geomagnet sedang kuat. Aurora berpotensi terlihat jauh dari daerah kutub malam ini.</p>'
          : (isFinite(g) && g >= 2
            ? '<p class="hint" style="margin-top:10px">Badai geomagnet ringan sampai sedang. Aurora mungkin terlihat di daerah lintang tinggi.</p>'
            : '<p class="hint" style="margin-top:10px">Kondisi geomagnet sedang tenang, aurora hanya di sekitar kutub.</p>')) +
        '<p class="hint">Sumber: NOAA Space Weather Prediction Center (SWPC), Amerika Serikat.</p>');
    } catch (e) {
      gagal(e.name === 'AbortError'
        ? 'Waktu habis, server NOAA tidak bisa dihubungi dalam 15 detik.'
        : 'Data cuaca antariksa gagal diambil. Cek koneksi internet, lalu coba lagi.');
    }
  };

  root.appendChild(T.el('<p class="note">Tiga skala cuaca antariksa dari NOAA. Skala G yang tinggi berarti aurora bisa terlihat lebih jauh dari kutub.</p>'));
  root.appendChild(T.row(T.btn('Muat ulang', muat, true)));
  root.appendChild(box);
  muat();
}
