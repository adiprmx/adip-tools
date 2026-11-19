import { h as T, utils } from '../../core.js';

// Data provinsi (38): nama + koordinat dari dataset Indonesia Region API
// (turunan Kepmendagri 300.2.2-2138/2025 + 2430-2025, efektif 23 Jun 2025);
// ibu kota dari tabel Wikipedia "Provinces of Indonesia"; koordinat dicek
// silang dengan GeoJSON 38 provinsi (denyherianto, CC-BY-4.0).
// Diambil & diverifikasi 18 Nov 2026.
// [nama, ibu kota, lat, lng]
const PROV = [
  ['Aceh', 'Banda Aceh', 4.37, 97.23],
  ['Sumatera Utara', 'Medan', 2.53, 99.11],
  ['Sumatera Barat', 'Padang', -1.16, 101.07],
  ['Riau', 'Pekanbaru', 0.14, 101.8],
  ['Jambi', 'Jambi', -1.81, 102.35],
  ['Sumatera Selatan', 'Palembang', -3.26, 104.08],
  ['Bengkulu', 'Bengkulu', -3.05, 101.88],
  ['Lampung', 'Bandar Lampung', -4.8, 105.21],
  ['Kepulauan Bangka Belitung', 'Pangkal Pinang', -2.61, 106.16],
  ['Kepulauan Riau', 'Tanjung Pinang', 3.96, 108.18],
  ['DKI Jakarta', 'Jakarta Pusat', -6.21, 106.83],
  ['Jawa Barat', 'Bandung', -6.98, 107.92],
  ['Jawa Tengah', 'Semarang', -7.31, 109.6],
  ['DI Yogyakarta', 'Yogyakarta', -7.97, 110.59],
  ['Jawa Timur', 'Surabaya', -7.62, 112.12],
  ['Banten', 'Serang', -6.53, 106.11],
  ['Bali', 'Denpasar', -8.36, 115.21],
  ['Nusa Tenggara Barat', 'Mataram', -8.72, 117.21],
  ['Nusa Tenggara Timur', 'Kupang', -8.55, 120.41],
  ['Kalimantan Barat', 'Pontianak', -0.27, 110.74],
  ['Kalimantan Tengah', 'Palangka Raya', -1.78, 113.7],
  ['Kalimantan Selatan', 'Banjarbaru', -3.08, 115.38],
  ['Kalimantan Timur', 'Samarinda', 0.31, 116.37],
  ['Kalimantan Utara', 'Tanjung Selor', 3.2, 116.37],
  ['Sulawesi Utara', 'Manado', 0.66, 124.17],
  ['Sulawesi Tengah', 'Palu', -1.41, 120.14],
  ['Sulawesi Selatan', 'Makassar', -3.66, 119.96],
  ['Sulawesi Tenggara', 'Kendari', -3.5, 121.67],
  ['Gorontalo', 'Gorontalo', 0.74, 122.21],
  ['Sulawesi Barat', 'Mamuju', -2.87, 119.22],
  ['Maluku', 'Ambon', -3.28, 130.27],
  ['Maluku Utara', 'Sofifi', 1.23, 128.45],
  ['Papua', 'Jayapura', -2.29, 137.9],
  ['Papua Barat', 'Manokwari', -1.71, 133.5],
  ['Papua Selatan', 'Merauke', -6.17, 139.85],
  ['Papua Tengah', 'Nabire', -4.05, 137.08],
  ['Papua Pegunungan', 'Jayawijaya', -4.37, 139.83],
  ['Papua Barat Daya', 'Sorong', -1.14, 132.31],
];

const W = 900, H = 400;
// Proyeksi equirectangular: lng 94-142, lat 6.5 s.d. -11.
const px = (lng) => (lng - 94) / (142 - 94) * W;
const py = (lat) => (6.5 - lat) / (6.5 - (-11)) * H;

export const meta = {"id": "kuis-peta-indonesia", "name": "Kuis Peta Indonesia", "cat": "fun", "icon": "🗺️", "desc": "Lihat peta titik 38 provinsi dan uji hafalan ibu kotanya lewat kuis.", "keywords": "kuis,peta,indonesia,provinsi,ibu kota,geografi,tebak", "since": "6.16.0"};
export function render(root) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const info = T.el('<p class="note">Ketuk titik di peta untuk melihat nama provinsi dan ibu kotanya.</p>');

  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.style.cssText = 'width:100%;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px';
  PROV.forEach(([nama, ibu, lat, lng]) => {
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('cx', px(lng)); c.setAttribute('cy', py(lat));
    c.setAttribute('r', '7');
    c.setAttribute('fill', '#ff6f61');
    c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '1.5');
    c.style.cursor = 'pointer';
    const t = document.createElementNS(SVGNS, 'title');
    t.textContent = nama + ' — ' + ibu;
    c.appendChild(t);
    c.addEventListener('click', () => {
      info.innerHTML = '<b>' + T.esc(nama) + '</b> — ibu kota: <b>' + T.esc(ibu) + '</b>';
      svg.querySelectorAll('circle').forEach((x) => x.setAttribute('fill', '#ff6f61'));
      c.setAttribute('fill', '#ffd166');
    });
    svg.appendChild(c);
  });

  // ---- Kuis: 10 soal, tebak ibu kota dari nama provinsi ----
  const kuisBox = T.el('<div style="margin-top:20px"></div>');
  let soal = [], idx = 0, benar = 0, dijawab = false;

  // acak (Fisher-Yates) kanonis tinggal di utils.shuffle (core.js).
  const mulai = () => {
    soal = utils.shuffle(PROV).slice(0, 10).map(([nama, ibu]) => {
      const pengecoh = utils.shuffle(PROV.filter((p) => p[1] !== ibu)).slice(0, 3).map((p) => p[1]);
      return { nama, ibu, pilihan: utils.shuffle([ibu, ...pengecoh]) };
    });
    idx = 0; benar = 0;
    tampilSoal();
  };
  const tampilSoal = () => {
    dijawab = false;
    if (idx >= soal.length) {
      kuisBox.innerHTML = '';
      const hasil = T.el('<div class="out"></div>');
      hasil.innerHTML = '<div class="big">' + benar + ' / ' + soal.length + '</div>' +
        '<p class="center mut">' + (benar === soal.length ? 'Sempurna! Kamu hafal semua ibu kota.' : benar >= 7 ? 'Hebat! Tinggal sedikit lagi.' : benar >= 4 ? 'Lumayan, coba lagi sambil lihat peta di atas.' : 'Coba lihat peta di atas dulu, lalu main lagi.') + '</p>';
      kuisBox.appendChild(hasil);
      kuisBox.appendChild(T.btn('Main lagi', mulai));
      return;
    }
    const s = soal[idx];
    kuisBox.innerHTML = '';
    kuisBox.appendChild(T.el('<p class="mut">Soal ' + (idx + 1) + ' dari ' + soal.length + ' · Benar: ' + benar + '</p>'));
    kuisBox.appendChild(T.el('<p style="font-size:18px;font-weight:600;margin:8px 0 12px">Apa ibu kota provinsi <b>' + T.esc(s.nama) + '</b>?</p>'));
    const grid = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>');
    s.pilihan.forEach((p) => {
      const b = T.btn(p, () => {
        if (dijawab) return;
        dijawab = true;
        const ok = p === s.ibu;
        if (ok) benar += 1;
        grid.querySelectorAll('button').forEach((x) => {
          x.disabled = true;
          if (x.textContent === s.ibu) { x.style.background = '#4ade80'; x.style.color = '#161311'; }
          else if (x === b) { x.style.background = '#ef4444'; x.style.color = '#fff'; }
        });
        const ket = T.el('<p class="mut" style="margin-top:10px">' + (ok ? 'Betul!' : 'Jawaban yang benar: <b>' + T.esc(s.ibu) + '</b>.') + '</p>');
        kuisBox.appendChild(ket);
        kuisBox.appendChild(T.btn(idx + 1 < soal.length ? 'Soal berikutnya →' : 'Lihat hasil', () => { idx += 1; tampilSoal(); }));
      });
      grid.appendChild(b);
    });
    kuisBox.appendChild(grid);
  };

  root.appendChild(T.el('<p class="note">Peta titik 38 provinsi Indonesia. Titik menunjukkan perkiraan lokasi tiap provinsi, bukan batas wilayahnya. DKI Jakarta tidak punya ibu kota resmi — Jakarta Pusat dipakai di sini karena banyak gedung pemerintahan ada di sana.</p>'));
  root.appendChild(svg);
  root.appendChild(info);
  root.appendChild(T.el('<div class="sechead" style="margin-top:20px"><h2>Kuis ibu kota</h2><span class="n">10 soal</span></div>'));
  root.appendChild(kuisBox);
  kuisBox.appendChild(T.btn('Mulai kuis', mulai));
  root.appendChild(T.el('<p class="hint">Sumber data: daftar provinsi &amp; koordinat dari Indonesia Region API (turunan Kepmendagri 2025); ibu kota dari Wikipedia "Provinces of Indonesia". Diverifikasi 18 November 2026.</p>'));
}
