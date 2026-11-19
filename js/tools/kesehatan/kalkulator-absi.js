import { h as T, esc, utils } from '../../core.js';

// A Body Shape Index (ABSI), Krakauer & Krakauer, PLoS ONE 2012.
// ABSI = lingkar pinggang (m) / (BMI^(2/3) x tinggi (m)^(1/2)).
// ABSI mengukur risiko dari bentuk tubuh (lemak perut) di luar BMI:
// dua orang dengan BMI sama bisa punya ABSI berbeda, dan ABSI yang
// lebih tinggi dikaitkan dengan risiko kematian yang lebih tinggi.
// Patokan risiko (Krakauer & Krakauer 2012, dari data NHANES):
// di bawah 0,076 rendah, 0,076-0,080 rata-rata, 0,080-0,085 tinggi,
// 0,085 ke atas sangat tinggi.
export function hitungABSI(pinggangCm, beratKg, tinggiCm) {
  if (!(pinggangCm > 0) || !(beratKg > 0) || !(tinggiCm > 0)) return null;
  const h = tinggiCm / 100;
  const wc = pinggangCm / 100;
  const bmi = beratKg / (h * h);
  const absi = wc / (Math.pow(bmi, 2 / 3) * Math.sqrt(h));
  return { absi, bmi };
}

export function kategoriABSI(a) {
  if (a < 0.076) return ['Risiko rendah', 'Bentuk tubuhmu, dilihat dari lingkar pinggang dibanding tinggi dan berat badan, termasuk kelompok risiko rendah.', 'ok'];
  if (a < 0.080) return ['Risiko rata-rata', 'Bentuk tubuhmu termasuk kelompok risiko rata-rata. Jaga pola makan dan tetap aktif bergerak.', 'ok'];
  if (a < 0.085) return ['Risiko tinggi', 'Lingkar pinggangmu cukup besar dibanding tinggi dan berat badanmu. Risiko penyakit terkait lemak perut mulai naik.', 'warn'];
  return ['Risiko sangat tinggi', 'Lingkar pinggangmu jauh lebih besar dibanding tinggi dan berat badanmu. Sebaiknya cek ke dokter untuk pemeriksaan lanjutan.', 'err'];
}

export const meta = { "id": "kalkulator-absi", "name": "Kalkulator ABSI (Indeks Bentuk Tubuh)", "cat": "kesehatan", "icon": "📏", "desc": "Ukur risiko dari bentuk tubuhmu: lingkar pinggang dibanding tinggi dan berat badan, di luar angka BMI saja.", "keywords": "absi,body shape index,indeks bentuk tubuh,lingkar pinggang,bmi,lemak perut,risiko", "since": "6.19.0" };

export function render(root) {
  const pinggang = T.input('number', 'Lingkar pinggang (cm)', '85');
  const berat = T.input('number', 'Berat badan (kg)', '72');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const box = T.out();

  const hitung = () => {
    const pg = T.num(pinggang.value);
    const bb = T.num(berat.value);
    const tb = T.num(tinggi.value);
    if (!(pg >= 40 && pg <= 250)) {
      T.show(box, '<span class="err">Isi lingkar pinggang antara 40 sampai 250 cm.</span>');
      return;
    }
    if (!(bb >= 20 && bb <= 400)) {
      T.show(box, '<span class="err">Isi berat badan antara 20 sampai 400 kg.</span>');
      return;
    }
    if (!(tb >= 100 && tb <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    const r = hitungABSI(pg, bb, tb);
    const k = kategoriABSI(r.absi);
    T.show(box,
      '<div class="center"><div class="dim">Indeks Bentuk Tubuh (ABSI)</div>' +
      '<div class="big">' + utils.fmtDes(r.absi, 4) + '</div>' +
      '<div class="' + k[2] + '" style="margin-top:6px"><b>' + esc(k[0]) + '</b><br>' + esc(k[1]) + '</div></div>' +
      '<div class="kv"><span class="k">BMI kamu (buat perbandingan)</span><span class="v">' + utils.fmtDes(r.bmi, 1) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan ABSI</div>' +
      '<div class="kv"><span class="k">Di bawah 0,076</span><span class="v">Risiko rendah' + (r.absi < 0.076 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0,076 - 0,080</span><span class="v">Risiko rata-rata' + (r.absi >= 0.076 && r.absi < 0.080 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0,080 - 0,085</span><span class="v">Risiko tinggi' + (r.absi >= 0.080 && r.absi < 0.085 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<div class="kv"><span class="k">0,085 ke atas</span><span class="v">Risiko sangat tinggi' + (r.absi >= 0.085 ? ' <b>&larr; kamu di sini</b>' : '') + '</span></div>' +
      '<p class="hint">Rumus: ABSI = lingkar pinggang dibagi (BMI pangkat 2/3 kali akar tinggi badan), dari Krakauer dan Krakauer (2012). ' +
      'ABSI melengkapi BMI, bukan menggantikannya. Ini perkiraan buat belajar, bukan diagnosis. Kalau hasilnya mengkhawatirkan, cek ke dokter atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Lingkar pinggang (cm)', pinggang, 'Di titik tersempit, antara tulang rusuk dan pusar.'),
    T.field('Berat badan (kg)', berat),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
