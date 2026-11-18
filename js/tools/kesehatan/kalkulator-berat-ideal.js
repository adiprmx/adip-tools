import { h as T, esc } from '../../core.js';

// Berat ideal dari tinggi badan, tiga cara yang umum dipakai:
// - Broca: pria = tinggi - 100; wanita = (tinggi - 100) x 0,9.
// - Devine (1974): pria 50 + 2,3 per inci di atas 5 kaki (152,4 cm);
//   wanita 45,5 + 2,3 per inci di atas 5 kaki.
// - Rentang BMI sehat WHO: 18,5 - 24,9 x tinggi(m) pangkat 2.
function beratIdeal(tinggiCm, pria) {
  const inci = tinggiCm / 2.54 - 60;
  const broca = pria ? tinggiCm - 100 : (tinggiCm - 100) * 0.9;
  const devine = (pria ? 50 : 45.5) + 2.3 * inci;
  const m = tinggiCm / 100;
  const bawah = 18.5 * m * m;
  const atas = 24.9 * m * m;
  return { broca, devine, bawah, atas };
}

export const meta = {"id": "kalkulator-berat-ideal", "name": "Kalkulator Berat Ideal", "cat": "kesehatan", "icon": "⚖️", "desc": "Berat badan yang pas buat tinggimu, dihitung tiga cara: Broca, Devine, dan rentang BMI sehat.", "keywords": "berat ideal,broca,devine,bmi,tinggi badan,berat badan ideal", "since": "6.17.0"};
export function render(root) {
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const berat = T.input('number', 'Berat badanmu sekarang (kg, boleh kosong)', '');
  const box = T.out();

  const hitung = () => {
    const h = T.num(tinggi.value);
    if (!(h >= 120 && h <= 230)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 120 sampai 230 cm.</span>');
      return;
    }
    const pria = gender.value === 'pria';
    const r = beratIdeal(h, pria);
    const b = T.num(berat.value);
    let posisi = '';
    if (b > 0) {
      if (b < r.bawah) posisi = '<div class="kv"><span class="k">Beratmu sekarang</span><span class="v">' + b.toFixed(1) + ' kg, di bawah rentang sehat</span></div>';
      else if (b > r.atas) posisi = '<div class="kv"><span class="k">Beratmu sekarang</span><span class="v">' + b.toFixed(1) + ' kg, di atas rentang sehat</span></div>';
      else posisi = '<div class="kv"><span class="k">Beratmu sekarang</span><span class="v">' + b.toFixed(1) + ' kg, sudah di dalam rentang sehat</span></div>';
    }
    T.show(box,
      '<div class="center"><div class="dim">Rentang berat sehat buat tinggi ' + T.fmt(h) + ' cm</div>' +
      '<div class="big">' + r.bawah.toFixed(1) + ' - ' + r.atas.toFixed(1) + ' kg</div></div>' +
      '<div class="kv"><span class="k">Rumus Broca</span><span class="v">' + r.broca.toFixed(1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Rumus Devine (1974)</span><span class="v">' + r.devine.toFixed(1) + ' kg</span></div>' +
      '<div class="kv"><span class="k">Rentang BMI sehat (18,5 - 24,9)</span><span class="v">' + r.bawah.toFixed(1) + ' - ' + r.atas.toFixed(1) + ' kg</span></div>' +
      posisi +
      '<p class="hint">Tiga angka ini memang beda-beda, karena tiap rumus punya cara sendiri. Pakai rentang BMI sehat sebagai patokan utama, dan anggap Broca dan Devine sebagai pembanding. Rumus ini untuk orang dewasa, dan tidak membedakan otot dengan lemak, jadi orang yang berotot bisa terbaca lebih berat. ' +
      'Ini perkiraan umum, bukan diagnosis. Buat keputusan soal berat badan, tanya dokter atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Jenis kelamin', gender),
  ));
  root.appendChild(T.field('Berat badanmu sekarang (kg, boleh kosong)', berat, 'Diisi biar kelihatan posisimu terhadap rentang sehat.'));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
