import { h as T, kv, utils } from '../../core.js';

// Panjang langkah dari tinggi badan: jalan kaki sekitar 0,413 x tinggi,
// lari sekitar 0,65 x tinggi (perkiraan umum, bukan pengukuran).
// Ukur langsung: panjang langkah = jarak jalan (cm) / jumlah langkah.
export function langkahDariTinggi(tinggiCm, lari) {
  const t = Number(tinggiCm);
  if (!(t > 0)) return null;
  return t * (lari ? 0.65 : 0.413);
}

export function langkahDariUkur(jarakMeter, jumlahLangkah) {
  const j = Number(jarakMeter), n = Number(jumlahLangkah);
  if (!(j > 0) || !(n > 0)) return null;
  return j * 100 / n;
}

export function langkahUntukJarak(jarakKm, panjangLangkahCm) {
  const j = Number(jarakKm), p = Number(panjangLangkahCm);
  if (!(j > 0) || !(p > 0)) return null;
  return Math.round(j * 100000 / p);
}
utils.langkahDariTinggi = langkahDariTinggi;
utils.langkahDariUkur = langkahDariUkur;
utils.langkahUntukJarak = langkahUntukJarak;

export const meta = {"id": "kalkulator-panjang-langkah", "name": "Kalkulator Panjang Langkah", "cat": "sehari", "icon": "👣", "desc": "Panjang langkahmu dari tinggi badan atau dari hasil ukur jalan, plus jumlah langkah untuk jarak tertentu.", "keywords": "panjang langkah,stride,jalan kaki,lari,langkah,tinggi badan,ukur langkah", "since": "6.19.0"};
export function render(root) {
  const cara = T.select([
    ['tinggi', 'Perkirakan dari tinggi badan'],
    ['ukur', 'Ukur langsung (jalan jarak tertentu, hitung langkah)'],
  ], 'tinggi');
  const tinggi = T.input('text', 'cth: 170', '170');
  tinggi.inputMode = 'decimal';
  const jarak = T.input('text', 'cth: 100', '100');
  jarak.inputMode = 'decimal';
  const jumlah = T.input('text', 'cth: 130', '130');
  jumlah.inputMode = 'decimal';
  const target = T.input('text', 'cth: 5', '5');
  target.inputMode = 'decimal';
  const box = T.out();

  const wrapTinggi = T.el('<div></div>');
  wrapTinggi.appendChild(T.field('Tinggi badan (cm)', tinggi));
  const wrapUkur = T.el('<div></div>');
  wrapUkur.appendChild(T.grid2(
    T.field('Jarak yang kamu jalan (meter)', jarak, 'Ukur dengan penggaris jalan atau aplikasi peta.'),
    T.field('Jumlah langkah', jumlah, 'Hitung langkah selama jalan jarak itu.'),
  ));
  const aturTampil = () => {
    wrapTinggi.hidden = cara.value !== 'tinggi';
    wrapUkur.hidden = cara.value !== 'ukur';
  };
  cara.addEventListener('change', aturTampil);
  aturTampil();

  const hitung = () => {
    let cmJalan, cmLari, caraPakai;
    if (cara.value === 'tinggi') {
      cmJalan = langkahDariTinggi(T.num(tinggi.value), false);
      cmLari = langkahDariTinggi(T.num(tinggi.value), true);
      caraPakai = 'perkiraan dari tinggi badan';
      if (cmJalan === null) { T.show(box, '<span class="err">Isi tinggi badan dengan angka lebih dari 0.</span>'); return; }
    } else {
      cmJalan = langkahDariUkur(T.num(jarak.value), T.num(jumlah.value));
      cmLari = null;
      caraPakai = 'hasil ukur langsung';
      if (cmJalan === null) { T.show(box, '<span class="err">Isi jarak dan jumlah langkah dengan angka lebih dari 0.</span>'); return; }
    }
    const t = T.num(target.value);
    const butuh = isFinite(t) && t > 0 ? langkahUntukJarak(t, cmJalan) : null;
    T.show(box,
      '<div class="center"><div class="dim">Panjang langkah jalan kaki (' + caraPakai + ')</div>' +
      '<div class="big">' + utils.fmtDes(cmJalan, 1) + ' cm</div>' +
      (cmLari !== null ? '<div class="dim">Panjang langkah lari sekitar ' + utils.fmtDes(cmLari, 1) + ' cm</div>' : '') + '</div>' +
      (butuh !== null ? kv('Langkah untuk ' + utils.fmtDes(t, 1) + ' km', T.fmt(butuh) + ' langkah') : '') +
      '<p class="hint">Perkiraan dari tinggi badan memakai rumus umum 0,413 x tinggi untuk jalan dan 0,65 x tinggi untuk lari. Hasil ukur langsung lebih akurat: jalan di permukaan datar dengan langkah biasa, jangan sengaja memanjangkan atau memendekkan langkah.</p>');
  };

  root.appendChild(T.el('<p class="note">Panjang langkah berguna untuk mengubah jumlah langkah jadi jarak, atau sebaliknya. Pilih cara hitungnya, lalu isi angkanya.</p>'));
  root.appendChild(T.field('Cara hitung', cara));
  root.appendChild(wrapTinggi);
  root.appendChild(wrapUkur);
  root.appendChild(T.field('Jarak target (km, opsional)', target, 'Untuk tahu berapa langkah yang dibutuhkan sejauh ini.'));
  root.appendChild(T.btn('Hitung Panjang Langkah', hitung, true));
  root.appendChild(box);
  hitung();
}
