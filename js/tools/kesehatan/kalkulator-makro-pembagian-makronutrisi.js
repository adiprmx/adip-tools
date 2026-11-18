import { h as T, esc } from '../../core.js';

// Pembagian makronutrisi: protein 4 kkal/gram, karbohidrat 4 kkal/gram,
// lemak 9 kkal/gram. Pola yang tersedia:
// - Seimbang: 30% protein, 40% karbo, 30% lemak.
// - Tinggi protein: 40% protein, 30% karbo, 30% lemak.
// - Rendah karbo: 30% protein, 20% karbo, 50% lemak.
// Target kalori bisa diisi sendiri, atau dihitung dari kebutuhan harian
// (TDEE) dengan rumus Mifflin-St Jeor (1990) x faktor aktivitas.
const POLA = {
  seimbang: { p: 30, k: 40, l: 30, label: 'Seimbang' },
  protein: { p: 40, k: 30, l: 30, label: 'Tinggi protein' },
  rendahKarbo: { p: 30, k: 20, l: 50, label: 'Rendah karbo' },
};

function bmrMifflin(pria, bb, h, u) {
  return 10 * bb + 6.25 * h - 5 * u + (pria ? 5 : -161);
}

export const meta = {"id": "kalkulator-makro-pembagian-makronutrisi", "name": "Kalkulator Makro (Pembagian Makronutrisi)", "cat": "kesehatan", "icon": "🥗", "desc": "Bagi target kalorimu jadi protein, karbohidrat, dan lemak dalam gram, sesuai pola makan yang kamu pilih.", "keywords": "makro,makronutrisi,protein,karbo,lemak,tdee,kalori,diet,meal plan", "since": "6.17.0"};
export function render(root) {
  const sumber = T.select([
    ['isi', 'Saya isi target kalorinya sendiri'],
    ['hitung', 'Hitung dari badan saya (TDEE)'],
  ], 'isi');
  const kalori = T.input('number', 'Target kalori per hari (kkal)', '2000');
  const berat = T.input('number', 'Berat badan (kg)', '65');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '165');
  const umur = T.input('number', 'Umur (tahun)', '25');
  const gender = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
  const aktif = T.select([
    ['1.2', 'Jarang gerak (kantoran)'],
    ['1.375', 'Ringan (olahraga 1-3x/minggu)'],
    ['1.55', 'Sedang (olahraga 3-5x/minggu)'],
    ['1.725', 'Berat (olahraga 6-7x/minggu)'],
    ['1.9', 'Atlet / fisik sangat berat'],
  ], '1.375');
  const pola = T.select([
    ['seimbang', 'Seimbang (30% protein, 40% karbo, 30% lemak)'],
    ['protein', 'Tinggi protein (40% protein, 30% karbo, 30% lemak)'],
    ['rendahKarbo', 'Rendah karbo (30% protein, 20% karbo, 50% lemak)'],
  ], 'seimbang');
  const box = T.out();
  const fKalori = T.field('Target kalori per hari (kkal)', kalori);
  const grupTdee = T.el('<div></div>');
  grupTdee.appendChild(T.grid2(
    T.field('Berat badan (kg)', berat),
    T.field('Tinggi badan (cm)', tinggi),
  ));
  grupTdee.appendChild(T.grid2(
    T.field('Umur (tahun)', umur),
    T.field('Jenis kelamin', gender),
  ));
  grupTdee.appendChild(T.field('Tingkat aktivitas', aktif));
  const aturSumber = () => {
    const dariTdee = sumber.value === 'hitung';
    fKalori.style.display = dariTdee ? 'none' : '';
    grupTdee.style.display = dariTdee ? '' : 'none';
  };
  sumber.addEventListener('change', aturSumber);

  const hitung = () => {
    let kkal, tdeeInfo = '';
    if (sumber.value === 'hitung') {
      const bb = T.num(berat.value), h = T.num(tinggi.value), u = T.num(umur.value);
      if (!(bb >= 20 && bb <= 300) || !(h >= 100 && h <= 250) || !(u >= 10 && u <= 100)) {
        T.show(box, '<span class="err">Isi berat, tinggi, dan umur dengan angka yang masuk akal.</span>');
        return;
      }
      const bmr = bmrMifflin(gender.value === 'pria', bb, h, u);
      kkal = Math.round(bmr * Number(aktif.value));
      tdeeInfo = '<div class="kv"><span class="k">Kebutuhan harian (TDEE)</span><span class="v">' + T.fmt(kkal) + ' kkal/hari</span></div>' +
        '<div class="kv"><span class="k">Kalori basal (BMR Mifflin-St Jeor)</span><span class="v">' + T.fmt(Math.round(bmr)) + ' kkal/hari</span></div>';
    } else {
      kkal = T.num(kalori.value);
      if (!(kkal >= 800 && kkal <= 10000)) {
        T.show(box, '<span class="err">Isi target kalori antara 800 sampai 10000 kkal per hari.</span>');
        return;
      }
    }
    const pl = POLA[pola.value] || POLA.seimbang;
    const protein = Math.round(kkal * pl.p / 100 / 4);
    const karbo = Math.round(kkal * pl.k / 100 / 4);
    const lemak = Math.round(kkal * pl.l / 100 / 9);
    T.show(box,
      '<div class="center"><div class="dim">Pembagian makro per hari, pola ' + esc(pl.label.toLowerCase()) + '</div>' +
      '<div class="dim">Target ' + T.fmt(Math.round(kkal)) + ' kkal</div></div>' +
      tdeeInfo +
      '<div class="kv"><span class="k">Protein (' + pl.p + '%)</span><span class="v">' + T.fmt(protein) + ' g (' + T.fmt(protein * 4) + ' kkal)</span></div>' +
      '<div class="kv"><span class="k">Karbohidrat (' + pl.k + '%)</span><span class="v">' + T.fmt(karbo) + ' g (' + T.fmt(karbo * 4) + ' kkal)</span></div>' +
      '<div class="kv"><span class="k">Lemak (' + pl.l + '%)</span><span class="v">' + T.fmt(lemak) + ' g (' + T.fmt(lemak * 9) + ' kkal)</span></div>' +
      '<p class="hint">Dihitung dari nilai umum: protein dan karbohidrat 4 kkal per gram, lemak 9 kkal per gram. ' +
      'Pola ini patokan umum, bukan resep diet dan bukan diagnosis. Kebutuhan tiap orang beda tergantung tujuan, kondisi kesehatan, dan aktivitas. ' +
      'Bila kamu punya kondisi khusus (diabetes, penyakit ginjal, hamil), tanya dokter, ahli gizi, atau tenaga kesehatan sebelum mengubah pola makan.</p>');
  };

  root.appendChild(T.field('Target kalori', sumber));
  root.appendChild(fKalori);
  root.appendChild(grupTdee);
  root.appendChild(T.field('Pola makan', pola));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  aturSumber();
  hitung();
}
