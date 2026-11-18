import { h as T, esc } from '../../core.js';

// Perkiraan VO2 Max (daya tahan jantung-paru) dari dua tes lapangan:
// - Rockport 1 mil jalan cepat (Kline dkk., 1987):
//   VO2 Max = 132,853 - 0,0769 x berat(lb) - 0,3877 x umur
//             + 6,315 (pria) - 3,2649 x waktu(menit) - 0,1565 x denyut akhir.
// - Cooper 12 menit lari (Cooper, 1968):
//   VO2 Max = (jarak meter - 504,9) / 44,73.
// Kategori memakai norma Cooper Institute per kelompok umur dan jenis
// kelamin (batas bawah tiap kategori, dari Sangat kurang sampai Unggul).
const NORMA = {
  pria: {
    20: [33.0, 38.5, 42.5, 46.5, 52.5],
    30: [30.2, 36.7, 40.6, 44.6, 50.5],
    40: [28.4, 34.6, 38.4, 42.4, 48.3],
    50: [25.5, 31.1, 35.7, 39.6, 45.4],
    60: [23.7, 29.4, 33.0, 36.7, 42.6],
  },
  wanita: {
    20: [26.0, 31.0, 35.0, 39.0, 44.1],
    30: [24.0, 29.0, 33.0, 37.0, 42.1],
    40: [22.0, 27.0, 30.0, 34.0, 39.1],
    50: [20.0, 25.0, 28.0, 32.0, 36.1],
    60: [18.0, 23.0, 26.0, 30.0, 34.1],
  },
};
const LABEL_KAT = ['Sangat kurang', 'Kurang', 'Cukup', 'Baik', 'Sangat baik', 'Unggul'];

function kategori(vo2, umur, pria) {
  const kelompok = umur < 30 ? 20 : umur < 40 ? 30 : umur < 50 ? 40 : umur < 60 ? 50 : 60;
  const batas = NORMA[pria ? 'pria' : 'wanita'][kelompok];
  let i = 0;
  while (i < 5 && vo2 >= batas[i]) i++;
  return LABEL_KAT[i];
}

export const meta = {"id": "kalkulator-vo2-max", "name": "Kalkulator VO2 Max", "cat": "kesehatan", "icon": "🏃", "desc": "Perkiraan daya tahan jantung dan parumu dari tes jalan 1 mil (Rockport) atau lari 12 menit (Cooper).", "keywords": "vo2 max,vo2max,rockport,cooper,daya tahan,kebugaran,lari,jalan", "since": "6.17.0"};
export function render(root) {
  const metode = T.select([
    ['rockport', 'Tes jalan 1 mil (Rockport)'],
    ['cooper', 'Tes lari 12 menit (Cooper)'],
  ], 'rockport');
  const berat = T.input('number', 'Berat badan (kg)', '70');
  const umur = T.input('number', 'Umur (tahun)', '30');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const waktu = T.input('number', 'Waktu jalan 1 mil (menit, cth: 15,5)', '15');
  const denyut = T.input('number', 'Denyut jantung di akhir tes (per menit)', '120');
  const jarak = T.input('number', 'Jarak lari 12 menit (meter)', '2400');
  const box = T.out();
  const grupRockport = T.el('<div></div>');
  grupRockport.appendChild(T.grid2(
    T.field('Waktu jalan 1 mil (menit)', waktu, 'Jalan cepat sejauh 1,6 km, catat waktunya. Boleh desimal, misal 15,5.'),
    T.field('Denyut jantung di akhir tes (per menit)', denyut, 'Hitung denyutmu begitu sampai garis akhir.'),
  ));
  const grupCooper = T.el('<div></div>');
  grupCooper.appendChild(T.field('Jarak lari 12 menit (meter)', jarak, 'Lari sejauh mungkin dalam 12 menit, catat jaraknya.'));
  const aturMetode = () => {
    const isRock = metode.value === 'rockport';
    grupRockport.style.display = isRock ? '' : 'none';
    grupCooper.style.display = isRock ? 'none' : '';
  };
  metode.addEventListener('change', aturMetode);

  const hitung = () => {
    const u = T.num(umur.value);
    if (!(u >= 13 && u <= 90)) {
      T.show(box, '<span class="err">Isi umur antara 13 sampai 90 tahun.</span>');
      return;
    }
    const pria = gender.value === 'pria';
    let vo2, cara;
    if (metode.value === 'rockport') {
      const bb = T.num(berat.value);
      const wkt = T.num(waktu.value);
      const hr = T.num(denyut.value);
      if (!(bb >= 30 && bb <= 300)) {
        T.show(box, '<span class="err">Isi berat badan antara 30 sampai 300 kg.</span>');
        return;
      }
      if (!(wkt >= 5 && wkt <= 40)) {
        T.show(box, '<span class="err">Isi waktu jalan 1 mil antara 5 sampai 40 menit.</span>');
        return;
      }
      if (!(hr >= 60 && hr <= 220)) {
        T.show(box, '<span class="err">Isi denyut jantung akhir antara 60 sampai 220 per menit.</span>');
        return;
      }
      const lb = bb * 2.20462;
      vo2 = 132.853 - 0.0769 * lb - 0.3877 * u + (pria ? 6.315 : 0) - 3.2649 * wkt - 0.1565 * hr;
      cara = 'Tes jalan 1 mil (Rockport)';
    } else {
      const jrk = T.num(jarak.value);
      if (!(jrk >= 500 && jrk <= 6000)) {
        T.show(box, '<span class="err">Isi jarak lari 12 menit antara 500 sampai 6000 meter.</span>');
        return;
      }
      vo2 = (jrk - 504.9) / 44.73;
      cara = 'Tes lari 12 menit (Cooper)';
    }
    if (!(vo2 > 5 && vo2 < 100)) {
      T.show(box, '<span class="err">Hasilnya di luar jangkauan wajar. Periksa lagi angka yang kamu isi.</span>');
      return;
    }
    const kat = kategori(vo2, u, pria);
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan VO2 Max</div>' +
      '<div class="big">' + vo2.toFixed(1) + '</div>' +
      '<div class="dim">mL/kg/menit</div>' +
      '<div style="margin-top:6px"><b>Kategori kebugaran: ' + esc(kat) + '</b> (untuk umur ' + T.fmt(u) + ' tahun, ' + (pria ? 'pria' : 'wanita') + ')</div></div>' +
      '<div class="kv"><span class="k">Metode</span><span class="v">' + esc(cara) + '</span></div>' +
      '<p class="hint">VO2 Max itu seberapa banyak oksigen yang bisa dipakai badanmu saat olahraga berat, patokan daya tahan jantung dan paru. ' +
      'Rumus Rockport (Kline dkk., 1987) dan Cooper (1968) memperkirakannya dari tes lapangan; ukur pastinya cuma bisa di lab dengan alat khusus. ' +
      'Kategori memakai norma Cooper Institute. Bila kamu punya penyakit jantung, asma berat, atau lama tidak olahraga, tanya dokter dulu sebelum tes lari. ' +
      'Ini perkiraan buat belajar, bukan diagnosis.</p>');
  };

  root.appendChild(T.field('Metode tes', metode));
  root.appendChild(T.grid2(
    T.field('Berat badan (kg)', berat, 'Dipakai untuk tes Rockport.'),
    T.field('Umur (tahun)', umur),
  ));
  root.appendChild(T.field('Jenis kelamin', gender));
  root.appendChild(grupRockport);
  root.appendChild(grupCooper);
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  aturMetode();
  hitung();
}
