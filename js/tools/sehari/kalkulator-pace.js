import { h as T, kv } from '../../core.js?v=6.12.1';

// Prediksi waktu jarak lain memakai rumus Riegel (1977):
// T2 = T1 x (D2 / D1) ^ 1.06
const NOTE = '<p class="hint">Ini perkiraan umum, bukan pengganti saran dokter.</p>';

function fmtWaktu(detik) {
  const total = Math.round(detik);
  const jam = Math.floor(total / 3600);
  const mnt = Math.floor((total % 3600) / 60);
  const dtk = total % 60;
  const mm = String(mnt).padStart(2, '0');
  const ss = String(dtk).padStart(2, '0');
  return jam > 0 ? jam + ':' + mm + ':' + ss : mnt + ':' + ss;
}

function fmtPace(detikPerKm) {
  const mnt = Math.floor(detikPerKm / 60);
  const dtk = Math.round(detikPerKm % 60);
  if (dtk === 60) return (mnt + 1) + ':00';
  return mnt + ':' + String(dtk).padStart(2, '0');
}

const JARAK = [
  ['5K', 5], ['10K', 10], ['Half marathon (21,1 km)', 21.0975], ['Marathon (42,2 km)', 42.195],
];

export const meta = {"id": "kalkulator-pace", "name": "Kalkulator Pace Lari", "cat": "sehari", "icon": "🏃", "desc": "Pace per km dari jarak dan waktu lari, plus prediksi waktu jarak lain.", "keywords": "pace,lari,running,km,marathon,riegel,prediksi waktu", "since": "6.11.0"};
export function render(root) {

    const jarak = T.input('text', 'Jarak lari, cth: 5', '5');
    jarak.inputMode = 'decimal';
    const jam = T.input('text', 'Jam, cth: 0', '0');
    jam.inputMode = 'numeric';
    const menit = T.input('text', 'Menit, cth: 25', '25');
    menit.inputMode = 'numeric';
    const detik = T.input('text', 'Detik, cth: 0', '0');
    detik.inputMode = 'numeric';
    const box = T.out();

    const calc = () => {
      const d = T.num(jarak.value);
      const j = T.num(jam.value) || 0, m = T.num(menit.value) || 0, s = T.num(detik.value) || 0;
      const total = j * 3600 + m * 60 + s;
      if (!(d > 0)) {
        T.show(box, '<span class="err">Isi jarak larinya dengan angka yang benar.</span>');
        return;
      }
      if (!(total > 0)) {
        T.show(box, '<span class="err">Isi waktu larinya dengan angka yang benar.</span>');
        return;
      }
      if (m >= 60 || s >= 60) {
        T.show(box, '<span class="err">Menit dan detik masing-masing maksimal 59.</span>');
        return;
      }
      const paceKm = total / d;
      const paceMil = paceKm * 1.60934;
      const kec = d / (total / 3600);
      let prediksi = '';
      for (const [nama, dj] of JARAK) {
        const t = total * Math.pow(dj / d, 1.06);
        prediksi += kv(nama, fmtWaktu(t));
      }
      T.show(box,
        '<div class="center"><div class="dim">Pace kamu</div>' +
        '<div class="big">' + fmtPace(paceKm) + ' /km</div>' +
        '<div class="hint">' + fmtPace(paceMil) + ' per mil, kecepatan ' + kec.toFixed(1) + ' km/jam</div></div>' +
        '<div class="dim" style="margin-top:12px">Prediksi waktu untuk jarak lain (rumus Riegel)</div>' +
        prediksi +
        '<p class="hint">Prediksi memakai rumus Riegel (1977): makin jauh jaraknya, waktunya naik sedikit lebih lambat dari jaraknya. ' +
        'Ini perkiraan untuk pelari yang latihannya seimbang. Jarak yang jauh dari jarak aslinya biasanya kurang akurat.</p>' +
        NOTE);
    };

    root.appendChild(T.el('<p class="note">Masukkan jarak dan waktu larimu. Hasilnya pace per kilometer, plus perkiraan waktu kalau lari jarak lain.</p>'));
    root.appendChild(T.field('Jarak (km)', jarak));
    root.appendChild(T.grid2(
      T.field('Jam', jam),
      T.field('Menit', menit),
      T.field('Detik', detik),
    ));
    root.appendChild(T.btn('Hitung', calc, true));
    root.appendChild(box);
    calc();

}
