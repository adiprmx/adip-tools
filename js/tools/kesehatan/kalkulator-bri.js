import { h as T, esc, utils } from '../../core.js';

// Body Roundness Index (BRI), Thomas dkk., Obesity 2013.
// BRI mengukur "kebulatan" tubuh dari lingkar pinggang dan tinggi badan,
// sebagai pelengkap BMI yang tidak membedakan lemak dan otot:
//   BRI = 364,2 - 365,5 x akar(1 - ((pinggang / 2pi)^2 / (0,5 x tinggi)^2))
// Pinggang dan tinggi dalam satuan yang sama (cm).
// Gambaran nilai (Thomas dkk. 2013): sekitar 1 sangat kurus, 2-3 kurus,
// 3-4,5 sehat, 4,5-6 agak bulat, 6-8 bulat, di atas 8 sangat bulat.
// Ini gambaran deskriptif, bukan batas diagnosis.
export function hitungBRI(pinggangCm, tinggiCm) {
  if (!(pinggangCm > 0) || !(tinggiCm > 0)) return null;
  const rasio = Math.pow(pinggangCm / (2 * Math.PI), 2) / Math.pow(0.5 * tinggiCm, 2);
  if (rasio >= 1) return null;
  return 364.2 - 365.5 * Math.sqrt(1 - rasio);
}

export function kategoriBRI(b) {
  if (b < 2) return ['Sangat kurus', 'Bentuk tubuhmu sangat ramping. Kalau berat badanmu terus turun tanpa sebab jelas, cek ke dokter.', 'warn'];
  if (b < 3) return ['Kurus', 'Bentuk tubuhmu ramping. Pastikan asupanmu cukup dan seimbang.', 'ok'];
  if (b < 4.5) return ['Sehat', 'Bentuk tubuhmu termasuk kisaran sehat.', 'ok'];
  if (b < 6) return ['Agak bulat', 'Bentuk tubuhmu mulai membulat. Risiko penyakit terkait lemak perut perlahan naik.', 'warn'];
  if (b < 8) return ['Bulat', 'Bentuk tubuhmu sudah cukup bulat. Sebaiknya cek ke dokter dan mulai jaga pola makan dan gerak.', 'warn'];
  return ['Sangat bulat', 'Bentuk tubuhmu sangat bulat. Risiko penyakit terkait lemak perut tinggi. Periksakan ke dokter untuk rencana yang aman.', 'err'];
}

export const meta = { "id": "kalkulator-bri", "name": "Kalkulator BRI (Indeks Kebulatan Tubuh)", "cat": "kesehatan", "icon": "⭕", "desc": "Ukur kebulatan tubuhmu dari lingkar pinggang dan tinggi badan, pelengkap BMI yang tidak membedakan lemak dan otot.", "keywords": "bri,body roundness index,indeks kebulatan tubuh,lingkar pinggang,bmi,lemak perut", "since": "6.19.0" };

export function render(root) {
  const pinggang = T.input('number', 'Lingkar pinggang (cm)', '85');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const box = T.out();

  const hitung = () => {
    const pg = T.num(pinggang.value);
    const tb = T.num(tinggi.value);
    if (!(pg >= 40 && pg <= 250)) {
      T.show(box, '<span class="err">Isi lingkar pinggang antara 40 sampai 250 cm.</span>');
      return;
    }
    if (!(tb >= 100 && tb <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    const b = hitungBRI(pg, tb);
    if (b == null) {
      T.show(box, '<span class="err">Lingkar pinggang tidak mungkin sebesar itu dibanding tinggi badan. Periksa lagi angkanya.</span>');
      return;
    }
    const k = kategoriBRI(b);
    T.show(box,
      '<div class="center"><div class="dim">Body Roundness Index (BRI)</div>' +
      '<div class="big">' + utils.fmtDes(b, 2) + '</div>' +
      '<div class="' + k[2] + '" style="margin-top:6px"><b>' + esc(k[0]) + '</b><br>' + esc(k[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Lingkar pinggang</span><span class="v">' + T.fmt(pg) + ' cm</span></div>' +
      '<div class="kv"><span class="k">Setengah tinggi badanmu</span><span class="v">' + utils.fmtDes(tb / 2, 0) + ' cm (patokan pinggang sehat)</span></div>' +
      '<div class="dim" style="margin-top:12px">Gambaran nilai BRI</div>' +
      '<div class="kv"><span class="k">Di bawah 2</span><span class="v">Sangat kurus' + (b < 2 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">2 - 3</span><span class="v">Kurus' + (b >= 2 && b < 3 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">3 - 4,5</span><span class="v">Sehat' + (b >= 3 && b < 4.5 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">4,5 - 6</span><span class="v">Agak bulat' + (b >= 4.5 && b < 6 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">6 - 8</span><span class="v">Bulat' + (b >= 6 && b < 8 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">8 ke atas</span><span class="v">Sangat bulat' + (b >= 8 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Rumus dari Thomas dkk. (Obesity, 2013). BRI melengkapi BMI, bukan menggantikannya, dan gambaran nilai di atas bersifat deskriptif, bukan batas diagnosis. ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Kalau hasilnya mengkhawatirkan, cek ke dokter atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Lingkar pinggang (cm)', pinggang, 'Di titik tersempit, antara tulang rusuk dan pusar.'),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
