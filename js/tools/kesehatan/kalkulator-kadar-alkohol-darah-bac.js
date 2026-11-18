import { h as T, esc } from '../../core.js';

// Perkiraan kadar alkohol dalam darah (BAC) dengan rumus Widmark:
// BAC (%) = gram alkohol / (berat badan dalam gram x r) x 100
//           - 0,015 x jam sejak mulai minum.
// r = 0,68 (pria) / 0,55 (wanita). Gram alkohol = volume (mL) x kadar
// alkohol (%) x 0,789 (massa jenis etanol). Metabolisme 0,015%/jam
// adalah angka rata-rata. INI PERKIRAAN KASAR UNTUK EDUKASI SAJA.
function bacPersen(gramAlkohol, beratKg, pria, jam) {
  const r = pria ? 0.68 : 0.55;
  const awal = gramAlkohol / (beratKg * 1000 * r) * 100;
  return Math.max(0, awal - 0.015 * jam);
}

export const meta = {"id": "kalkulator-kadar-alkohol-darah-bac", "name": "Kalkulator Kadar Alkohol Darah (BAC)", "cat": "kesehatan", "icon": "🍺", "desc": "Perkiraan kasar kadar alkohol dalam darahmu setelah minum, buat belajar. Bukan alat ukur resmi.", "keywords": "bac,alkohol,darah,widmark,minum,mabuk,mengemudi", "since": "6.17.0"};
export function render(root) {
  const minuman = T.select([
    ['bir', 'Bir (5%)'],
    ['anggur', 'Anggur / wine (12%)'],
    ['spirit', 'Spirit: vodka, wiski, dll (40%)'],
    ['lain', 'Minuman lain (isi kadar sendiri)'],
  ], 'bir');
  const kadar = T.input('number', 'Kadar alkohol minuman lain (%)', '');
  const jumlah = T.input('number', 'Jumlah gelas / botol', '2');
  const volume = T.input('number', 'Volume per gelas / botol (mL)', '330');
  const berat = T.input('number', 'Berat badan (kg)', '70');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const jam = T.input('number', 'Jam sejak mulai minum', '2');
  const box = T.out();
  const fKadar = T.field('Kadar alkohol minuman lain (%)', kadar, 'Lihat di label botolnya.');
  const aturKadar = () => { fKadar.style.display = minuman.value === 'lain' ? '' : 'none'; };
  minuman.addEventListener('change', aturKadar);

  const hitung = () => {
    const abvTetap = { bir: 5, anggur: 12, spirit: 40 };
    const abv = minuman.value === 'lain' ? T.num(kadar.value) : abvTetap[minuman.value];
    const jml = T.num(jumlah.value);
    const vol = T.num(volume.value);
    const bb = T.num(berat.value);
    const jamN = T.num(jam.value);
    if (!(abv > 0 && abv <= 96)) {
      T.show(box, '<span class="err">Isi kadar alkohol minuman antara 0 sampai 96%.</span>');
      return;
    }
    if (!(jml > 0 && jml <= 100) || !(vol > 0 && vol <= 5000)) {
      T.show(box, '<span class="err">Isi jumlah dan volume minuman dengan angka yang masuk akal.</span>');
      return;
    }
    if (!(bb >= 30 && bb <= 300)) {
      T.show(box, '<span class="err">Isi berat badan antara 30 sampai 300 kg.</span>');
      return;
    }
    if (!(jamN >= 0 && jamN <= 48)) {
      T.show(box, '<span class="err">Isi waktu sejak mulai minum antara 0 sampai 48 jam.</span>');
      return;
    }
    const gram = jml * vol * (abv / 100) * 0.789;
    const bac = bacPersen(gram, bb, gender.value === 'pria', jamN);
    const jamSadar = bac / 0.015;
    const batas = bac >= 0.05
      ? '<div class="err"><b>Di atas 0,05%</b>, batas umum di banyak negara untuk mengemudi.</div>'
      : '<div class="warn"><b>Di bawah 0,05%</b>, tapi itu bukan berarti aman untuk mengemudi.</div>';
    T.show(box,
      '<div class="center"><div class="dim">Perkiraan kadar alkohol dalam darah</div>' +
      '<div class="big">' + bac.toFixed(3) + '%</div>' +
      '<div class="dim">= ' + Math.round(bac * 1000) + ' mg/dL</div>' +
      '<div style="margin-top:6px">' + batas + '</div></div>' +
      '<div class="kv"><span class="k">Alkohol yang diminum</span><span class="v">' + gram.toFixed(1) + ' gram</span></div>' +
      '<div class="kv"><span class="k">Perkiraan waktu sampai bersih</span><span class="v">sekitar ' + jamSadar.toFixed(1) + ' jam lagi</span></div>' +
      '<p class="hint"><b>Ini perkiraan kasar untuk belajar, bukan alat ukur resmi.</b> Hasil sebenarnya beda-beda tergantung isi perut, kecepatan minum, obat yang diminum, dan kondisi badan. ' +
      'Alat resmi (breathalyzer / tes darah polisi) bisa menunjukkan angka yang beda. Jangan mengemudi setelah minum alkohol apa pun, berapa pun angkanya. ' +
      'Ini perkiraan buat belajar, bukan diagnosis. Buat keputusan medis, konsultasikan ke tenaga kesehatan. ' +
      'Rumus: Widmark, dengan angka metabolisme rata-rata 0,015% per jam.</p>');
  };

  root.appendChild(T.field('Minuman', minuman));
  root.appendChild(fKadar);
  root.appendChild(T.grid2(
    T.field('Jumlah gelas / botol', jumlah),
    T.field('Volume per gelas / botol (mL)', volume),
  ));
  root.appendChild(T.grid2(
    T.field('Berat badan (kg)', berat),
    T.field('Jenis kelamin', gender),
  ));
  root.appendChild(T.field('Jam sejak mulai minum', jam, 'Dari tegukan pertama sampai sekarang.'));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  aturKadar();
  hitung();
}
