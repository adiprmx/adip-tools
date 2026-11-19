import { h as T, esc, utils } from '../../core.js';

// Fat-Free Mass Index (FFMI), Kouri dkk., Clinical Journal of Sport
// Medicine 1995. FFMI mengukur seberapa berotot seseorang, dinormalisasi
// terhadap tinggi badan, jadi bisa dibandingkan antar orang.
//   Massa tanpa lemak (FFM) = berat x (1 - persen lemak tubuh)
//   FFMI = FFM (kg) / tinggi (m)^2
//   FFMI ternormalisasi = FFMI + 6,3 x (1,8 - tinggi (m))
// Batas atas alami (tanpa steroid) menurut Kouri: sekitar 25 untuk pria
// dan 22 untuk wanita. Kategori di bawah mengikuti tabel Kouri yang
// dipakai luas di literatur kebugaran.
export function hitungFFMI(beratKg, lemakPersen, tinggiCm) {
  if (!(beratKg > 0) || !(lemakPersen >= 0 && lemakPersen < 80) || !(tinggiCm > 0)) return null;
  const h = tinggiCm / 100;
  const ffm = beratKg * (1 - lemakPersen / 100);
  const ffmi = ffm / (h * h);
  const ffmiNorm = ffmi + 6.3 * (1.8 - h);
  return { ffm, ffmi, ffmiNorm };
}

export function kategoriFFMI(norm, jk) {
  if (jk === 'pria') {
    if (norm < 17) return ['Di bawah rata-rata', 'Massa ototmu di bawah rata-rata pria. Latihan beban teratur dan cukup protein bisa menaikkannya.', 'warn'];
    if (norm < 19) return ['Rata-rata', 'Massa ototmu setara rata-rata pria.', 'ok'];
    if (norm < 21) return ['Di atas rata-rata', 'Massa ototmu di atas rata-rata pria. Kamu sudah lebih berotot dari kebanyakan orang.', 'ok'];
    if (norm < 23) return ['Sangat berotot', 'Massa ototmu tergolong sangat baik untuk pria.', 'ok'];
    if (norm <= 25) return ['Luar biasa', 'Massa ototmu mendekati batas atas yang bisa dicapai tanpa bantuan obat. Hasil latihan bertahun-tahun.', 'ok'];
    return ['Di atas batas alami', 'Nilai ini di atas batas yang umumnya bisa dicapai tanpa steroid (Kouri dkk., 1995). Periksa lagi persen lemak tubuhmu, karena alat ukur rumahan sering meleset.', 'warn'];
  }
  if (norm < 14) return ['Di bawah rata-rata', 'Massa ototmu di bawah rata-rata wanita. Latihan beban teratur dan cukup protein bisa menaikkannya.', 'warn'];
  if (norm < 16) return ['Rata-rata', 'Massa ototmu setara rata-rata wanita.', 'ok'];
  if (norm < 18) return ['Di atas rata-rata', 'Massa ototmu di atas rata-rata wanita. Kamu sudah lebih berotot dari kebanyakan orang.', 'ok'];
  if (norm < 20) return ['Sangat berotot', 'Massa ototmu tergolong sangat baik untuk wanita.', 'ok'];
  if (norm <= 22) return ['Luar biasa', 'Massa ototmu mendekati batas atas yang bisa dicapai tanpa bantuan obat. Hasil latihan bertahun-tahun.', 'ok'];
  return ['Di atas batas alami', 'Nilai ini di atas batas yang umumnya bisa dicapai tanpa steroid (Kouri dkk., 1995). Periksa lagi persen lemak tubuhmu, karena alat ukur rumahan sering meleset.', 'warn'];
}

export const meta = { "id": "kalkulator-ffmi", "name": "Kalkulator FFMI (Indeks Massa Tanpa Lemak)", "cat": "kesehatan", "icon": "💪", "desc": "Seberapa berotot kamu dibanding orang lain, dari berat badan, persen lemak tubuh, dan tinggi badan.", "keywords": "ffmi,fat free mass index,massa otot,otot,lemak tubuh,binaraga,fitness", "since": "6.19.0" };

export function render(root) {
  const jk = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const berat = T.input('number', 'Berat badan (kg)', '80');
  const lemak = T.input('number', 'Persen lemak tubuh (%)', '15');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '178');
  const box = T.out();

  const hitung = () => {
    const bb = T.num(berat.value);
    const lm = T.num(lemak.value);
    const tb = T.num(tinggi.value);
    if (!(bb >= 20 && bb <= 400)) {
      T.show(box, '<span class="err">Isi berat badan antara 20 sampai 400 kg.</span>');
      return;
    }
    if (!(lm >= 2 && lm < 80)) {
      T.show(box, '<span class="err">Isi persen lemak tubuh antara 2 sampai 80%.</span>');
      return;
    }
    if (!(tb >= 100 && tb <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    const r = hitungFFMI(bb, lm, tb);
    const k = kategoriFFMI(r.ffmiNorm, jk.value);
    T.show(box,
      '<div class="center"><div class="dim">FFMI ternormalisasi</div>' +
      '<div class="big">' + utils.fmtDes(r.ffmiNorm, 2) + '</div>' +
      '<div class="' + k[2] + '" style="margin-top:6px"><b>' + esc(k[0]) + '</b><br>' + esc(k[1]) + '</div></div>' +
      '<div class="kv"><span class="k">Massa tanpa lemak (otot, tulang, organ)</span><span class="v">' + utils.fmtDes(r.ffm, 1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Massa lemak</span><span class="v">' + utils.fmtDes(bb - r.ffm, 1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">FFMI mentah (sebelum normalisasi tinggi)</span><span class="v">' + utils.fmtDes(r.ffmi, 2) + '</span></div>' +
      '<div class="dim" style="margin-top:12px">Patokan ' + (jk.value === 'pria' ? 'pria' : 'wanita') + ' (FFMI ternormalisasi)</div>' +
      (jk.value === 'pria'
        ? '<div class="kv"><span class="k">Di bawah 17</span><span class="v">Di bawah rata-rata</span></div>' +
          '<div class="kv"><span class="k">17 - 19</span><span class="v">Rata-rata</span></div>' +
          '<div class="kv"><span class="k">19 - 21</span><span class="v">Di atas rata-rata</span></div>' +
          '<div class="kv"><span class="k">21 - 23</span><span class="v">Sangat berotot</span></div>' +
          '<div class="kv"><span class="k">23 - 25</span><span class="v">Luar biasa</span></div>' +
          '<div class="kv"><span class="k">Di atas 25</span><span class="v">Di atas batas alami</span></div>'
        : '<div class="kv"><span class="k">Di bawah 14</span><span class="v">Di bawah rata-rata</span></div>' +
          '<div class="kv"><span class="k">14 - 16</span><span class="v">Rata-rata</span></div>' +
          '<div class="kv"><span class="k">16 - 18</span><span class="v">Di atas rata-rata</span></div>' +
          '<div class="kv"><span class="k">18 - 20</span><span class="v">Sangat berotot</span></div>' +
          '<div class="kv"><span class="k">20 - 22</span><span class="v">Luar biasa</span></div>' +
          '<div class="kv"><span class="k">Di atas 22</span><span class="v">Di atas batas alami</span></div>') +
      '<p class="hint">Rumus dari Kouri dkk. (1995). Hasilnya sangat bergantung pada persen lemak tubuhmu: timbangan bioimpedansi rumahan bisa meleset beberapa persen, dan itu mengubah FFMI. ' +
      'Pengukuran paling akurat memakai DEXA atau kaliper oleh orang terlatih. Ini perkiraan buat belajar, bukan diagnosis. Kalau kamu mengejar target otot dengan cara ekstrem, konsultasikan ke dokter atau pelatih bersertifikat.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jenis kelamin', jk),
    T.field('Berat badan (kg)', berat),
    T.field('Persen lemak tubuh (%)', lemak, 'Dari timbangan bioimpedansi, kaliper, atau DEXA.'),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
