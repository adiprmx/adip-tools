import { h as T, esc } from '../../core.js';

// Perkiraan tinggi dewasa anak dari tinggi kedua orang tua, metode
// tinggi target genetik (mid-parental height):
// Anak laki-laki: (tinggi ayah + tinggi ibu + 13) / 2.
// Anak perempuan: (tinggi ayah + tinggi ibu - 13) / 2.
// Rentang normal: hasil di atas plus minus 8,5 cm. Angka 13 cm adalah
// selisih rata-rata tinggi pria dan wanita dewasa.
function tinggiTarget(ayah, ibu, laki) {
  const tengah = (ayah + ibu + (laki ? 13 : -13)) / 2;
  return { tengah, bawah: tengah - 8.5, atas: tengah + 8.5 };
}

export const meta = {"id": "kalkulator-prediksi-tinggi-anak", "name": "Kalkulator Prediksi Tinggi Anak", "cat": "kesehatan", "icon": "📏", "desc": "Perkiraan tinggi anakmu saat dewasa, dari tinggi ayah dan ibu.", "keywords": "tinggi anak,prediksi tinggi,genetik,mid-parental,tinggi badan anak,tumbuh", "since": "6.17.0"};
export function render(root) {
  const ayah = T.input('number', 'Tinggi badan ayah (cm)', '175');
  const ibu = T.input('number', 'Tinggi badan ibu (cm)', '160');
  const anak = T.select([['laki', 'Anak laki-laki'], ['perempuan', 'Anak perempuan']], 'laki');
  const box = T.out();

  const hitung = () => {
    const a = T.num(ayah.value);
    const ib = T.num(ibu.value);
    if (!(a >= 120 && a <= 230) || !(ib >= 120 && ib <= 230)) {
      T.show(box, '<span class="err">Isi tinggi ayah dan ibu antara 120 sampai 230 cm.</span>');
      return;
    }
    const r = tinggiTarget(a, ib, anak.value === 'laki');
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan tinggi dewasa anak</div>' +
      '<div class="big">' + r.tengah.toFixed(1) + ' cm</div>' +
      '<div class="dim">Rentang normal: ' + r.bawah.toFixed(1) + ' - ' + r.atas.toFixed(1) + ' cm</div></div>' +
      '<div class="kv"><span class="k">Tinggi target genetik</span><span class="v">' + r.tengah.toFixed(1) + ' cm</span></div>' +
      '<div class="kv"><span class="k">Batas bawah rentang</span><span class="v">' + r.bawah.toFixed(1) + ' cm</span></div>' +
      '<div class="kv"><span class="k">Batas atas rentang</span><span class="v">' + r.atas.toFixed(1) + ' cm</span></div>' +
      '<p class="hint">Dihitung dengan metode tinggi target genetik (mid-parental height): rata-rata tinggi kedua orang tua, ditambah 13 cm untuk anak laki-laki atau dikurangi 13 cm untuk anak perempuan, dengan rentang plus minus 8,5 cm. ' +
      'Ini perkiraan kasar, bukan diagnosis. Gizi, kesehatan, tidur, dan gen dari kakek-nenek juga ikut menentukan tinggi anak, jadi hasil akhirnya bisa di luar rentang ini. ' +
      'Bila pertumbuhan anakmu jauh dari kurva normal, tanya dokter anak atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Tinggi badan ayah (cm)', ayah),
    T.field('Tinggi badan ibu (cm)', ibu),
  ));
  root.appendChild(T.field('Jenis kelamin anak', anak));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
