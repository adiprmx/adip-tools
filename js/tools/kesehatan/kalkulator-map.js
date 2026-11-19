import { h as T, esc, utils } from '../../core.js';

// Mean Arterial Pressure (MAP): rata-rata tekanan di arteri selama satu
// detak jantung. Rumus: MAP = (sistolik + 2 x diastolik) / 3.
// Diastolik dihitung dua kali karena jantung lebih lama beristirahat
// (diastol) daripada memompa (sistol) dalam tiap detak.
// Patokan umum: 70-100 mmHg normal. Di bawah 60 mmHg, aliran darah ke
// organ bisa kurang. Di atas 100 mmHg, tekanan rata-rata mulai tinggi.
export function map(sistolik, diastolik) {
  return (sistolik + 2 * diastolik) / 3;
}

export function tekananNadi(sistolik, diastolik) {
  return sistolik - diastolik;
}

export function bandMap(m) {
  if (m < 60) return ['Rendah', 'Di bawah 60 mmHg, aliran darah ke organ penting (otak, ginjal) bisa kurang. Bila disertai pusing, lemas, atau pingsan, segera cari pertolongan medis.', 'err'];
  if (m < 70) return ['Agak rendah', 'Sedikit di bawah rentang normal. Bila kamu merasa pusing atau lemas, ceritakan ke dokter.', 'warn'];
  if (m <= 100) return ['Normal', 'Tekanan arteri rata-rata dalam rentang normal (70-100 mmHg).', 'ok'];
  if (m <= 110) return ['Agak tinggi', 'Sedikit di atas rentang normal. Ukur lagi setelah istirahat, dan cek berkala.', 'warn'];
  return ['Tinggi', 'Tekanan arteri rata-rata tinggi. Sebaiknya konsultasi ke dokter, terutama bila tensimu memang sering tinggi.', 'err'];
}
utils.map = map;
utils.bandMap = bandMap;

export const meta = {"id": "kalkulator-map", "name": "Kalkulator MAP (Tekanan Arteri Rata-rata)", "cat": "kesehatan", "icon": "🩺", "desc": "Hitung tekanan arteri rata-rata (MAP) dari hasil tensimu, lengkap dengan arti angkanya untuk aliran darah ke organ.", "keywords": "map,mean arterial pressure,tekanan arteri rata-rata,tekanan darah,tensi,sistolik,diastolik", "since": "6.19.0"};
export function render(root) {
  const sis = T.input('number', 'Sistolik / angka atas (mmHg)', '120');
  const dia = T.input('number', 'Diastolik / angka bawah (mmHg)', '80');
  const box = T.out();

  const hitung = () => {
    const s = T.num(sis.value);
    const d = T.num(dia.value);
    if (!(s > 0) || !(d > 0)) {
      T.show(box, '<span class="err">Isi kedua angka tekanan darah dengan angka yang benar.</span>');
      return;
    }
    if (s < 50 || s > 300 || d < 30 || d > 200) {
      T.show(box, '<span class="err">Angkanya di luar rentang yang masuk akal. Cek lagi hasil pengukuranmu.</span>');
      return;
    }
    if (d >= s) {
      T.show(box, '<span class="err">Angka bawah (diastolik) harus lebih kecil dari angka atas (sistolik).</span>');
      return;
    }
    const m = map(s, d);
    const band = bandMap(m);
    T.show(box,
      '<div class="center"><div class="dim">Tekanan arteri rata-rata (MAP)</div>' +
      '<div class="big">' + utils.fmtDes(m, 1) + ' <span style="font-size:18px">mmHg</span></div>' +
      '<div class="' + band[2] + '"><b>' + esc(band[0]) + '</b></div></div>' +
      '<div class="kv"><span class="k">Tekanan darahmu</span><span class="v">' + s + '/' + d + ' mmHg</span></div>' +
      '<div class="kv"><span class="k">Tekanan nadi (sistolik - diastolik)</span><span class="v">' + tekananNadi(s, d) + ' mmHg</span></div>' +
      '<div class="kv"><span class="k">Artinya</span><span class="v">' + esc(band[1]) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan MAP</div>' +
      '<div class="kv"><span class="k">Di bawah 60 mmHg</span><span class="v">Rendah' + (m < 60 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">60-69 mmHg</span><span class="v">Agak rendah' + (m >= 60 && m < 70 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">70-100 mmHg</span><span class="v">Normal' + (m >= 70 && m <= 100 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">101-110 mmHg</span><span class="v">Agak tinggi' + (m > 100 && m <= 110 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">Di atas 110 mmHg</span><span class="v">Tinggi' + (m > 110 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">MAP menggambarkan tekanan rata-rata yang mendorong darah ke organ selama satu detak jantung. ' +
      'Angka ini BUKAN diagnosis. Satu kali ukur belum cukup untuk menyimpulkan apa pun, ukur setelah duduk tenang 5 menit dan jangan habis minum kopi atau olahraga. ' +
      'Bila MAP-mu di bawah 60 atau di atas 110, atau kamu merasa pusing, nyeri dada, atau sesak, segera konsultasi ke dokter.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Sistolik / angka atas (mmHg)', sis),
    T.field('Diastolik / angka bawah (mmHg)', dia),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
