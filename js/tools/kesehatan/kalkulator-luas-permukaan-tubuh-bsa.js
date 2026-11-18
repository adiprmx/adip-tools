import { h as T, esc } from '../../core.js';

// Luas permukaan tubuh (BSA) dari tinggi dan berat badan, dua rumus:
// - Mosteller (1987): akar(tinggi(cm) x berat(kg) / 3600).
// - DuBois & DuBois (1916): 0,007184 x tinggi^0,725 x berat^0,425.
// Hasil dalam meter persegi (m2). BSA dipakai dokter untuk menghitung
// dosis obat dan menilai fungsi organ.
function bsaMosteller(h, w) { return Math.sqrt(h * w / 3600); }
function bsaDuBois(h, w) { return 0.007184 * Math.pow(h, 0.725) * Math.pow(w, 0.425); }

export const meta = {"id": "kalkulator-luas-permukaan-tubuh-bsa", "name": "Kalkulator Luas Permukaan Tubuh (BSA)", "cat": "kesehatan", "icon": "📐", "desc": "Luas permukaan tubuhmu dari tinggi dan berat badan, dihitung dengan rumus Mosteller dan DuBois.", "keywords": "bsa,luas permukaan tubuh,mosteller,dubois,dosis obat,permukaan tubuh", "since": "6.17.0"};
export function render(root) {
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const berat = T.input('number', 'Berat badan (kg)', '65');
  const box = T.out();

  const hitung = () => {
    const h = T.num(tinggi.value);
    const w = T.num(berat.value);
    if (!(h >= 50 && h <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 50 sampai 250 cm.</span>');
      return;
    }
    if (!(w >= 3 && w <= 400)) {
      T.show(box, '<span class="err">Isi berat badan antara 3 sampai 400 kg.</span>');
      return;
    }
    const m = bsaMosteller(h, w);
    const d = bsaDuBois(h, w);
    T.show(box,
      '<div class="center"><div class="dim">Luas permukaan tubuh (rata-rata dua rumus)</div>' +
      '<div class="big">' + ((m + d) / 2).toFixed(2) + ' m&sup2;</div></div>' +
      '<div class="kv"><span class="k">Mosteller (1987)</span><span class="v">' + m.toFixed(2) + ' m&sup2;</span></div>' +
      '<div class="kv"><span class="k">DuBois &amp; DuBois (1916)</span><span class="v">' + d.toFixed(2) + ' m&sup2;</span></div>' +
      '<p class="hint">Orang dewasa biasanya di kisaran 1,5-2,0 m&sup2;. Kedua rumus biasanya cuma beda sedikit, dan Mosteller yang paling sering dipakai karena paling gampang. ' +
      'BSA dipakai dokter untuk menghitung dosis obat tertentu dan menilai fungsi organ. Ini perkiraan dari rumus, bukan hasil ukur langsung. Buat keputusan medis, konsultasikan ke tenaga kesehatan.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Berat badan (kg)', berat),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
