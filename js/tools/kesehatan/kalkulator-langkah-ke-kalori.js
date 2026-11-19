import { h as T, esc, utils } from '../../core.js';

// Kalori dari langkah kaki: langkah diubah ke jarak, lalu jarak diubah
// ke kalori memakai biaya energi jalan kaki per kilo berat badan.
//   Panjang langkah = 0,413 x tinggi badan (sama seperti kalkulator
//     langkah-ke-km di repo ini, supaya konsisten).
//   Jarak (km) = langkah x panjang langkah (cm) / 100.000
//   Kalori = faktor x berat (kg) x jarak (km)
// Faktor biaya jalan kaki (perkiraan umum dari literatur fisiologi
// olahraga): santai 0,65, normal 0,75, cepat 0,90 kkal per kg per km.
// Hasilnya perkiraan: kecepatan, medan, dan cara jalan memengaruhi
// kalori sebenarnya.
export const FAKTOR_JALAN = {
  santai: { nilai: 0.65, label: 'Santai' },
  normal: { nilai: 0.75, label: 'Normal' },
  cepat: { nilai: 0.90, label: 'Cepat' },
};

export function hitungKaloriLangkah(langkah, beratKg, tinggiCm, kecepatan) {
  const f = FAKTOR_JALAN[kecepatan];
  if (!(langkah >= 0) || !(beratKg > 0) || !(tinggiCm > 0) || !f) return null;
  const panjangLangkahCm = tinggiCm * 0.413;
  const jarakKm = langkah * panjangLangkahCm / 100000;
  const kalori = f.nilai * beratKg * jarakKm;
  return { panjangLangkahCm, jarakKm, kalori };
}

export const meta = { "id": "kalkulator-langkah-ke-kalori", "name": "Kalkulator Langkah ke Kalori", "cat": "kesehatan", "icon": "👟", "desc": "Berapa kalori yang terbakar dari jumlah langkahmu, dari berat badan, tinggi badan, dan kecepatan jalanmu.", "keywords": "langkah,kalori,jalan kaki,step counter,pedometer,olahraga,bakar kalori", "since": "6.19.0" };

export function render(root) {
  const langkah = T.input('number', 'Jumlah langkah', '10000');
  const berat = T.input('number', 'Berat badan (kg)', '70');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const kecepatan = T.select([
    ['santai', 'Santai (jalan pelan)'],
    ['normal', 'Normal (jalan biasa)'],
    ['cepat', 'Cepat (jalan brisk)'],
  ], 'normal');
  const box = T.out();

  const hitung = () => {
    const lk = T.num(langkah.value);
    const bb = T.num(berat.value);
    const tb = T.num(tinggi.value);
    if (!(lk >= 0 && lk <= 200000)) {
      T.show(box, '<span class="err">Isi jumlah langkah antara 0 sampai 200.000.</span>');
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
    const r = hitungKaloriLangkah(lk, bb, tb, kecepatan.value);
    T.show(box,
      '<div class="center"><div class="dim">Kalori yang terbakar</div>' +
      '<div class="big">' + T.fmt(Math.round(r.kalori)) + ' kkal</div>' +
      '<div class="dim" style="margin-top:6px">dari ' + T.fmt(lk) + ' langkah, jalan ' + esc(FAKTOR_JALAN[kecepatan.value].label.toLowerCase()) + '</div></div>' +
      '<div class="kv"><span class="k">Jarak tempuh (perkiraan)</span><span class="v">' + utils.fmtDes(r.jarakKm, 2) + ' km</span></div>' +
      '<div class="kv"><span class="k">Panjang langkahmu (perkiraan)</span><span class="v">' + utils.fmtDes(r.panjangLangkahCm, 0) + ' cm</span></div>' +
      '<div class="kv"><span class="k">Kalori per 1.000 langkah</span><span class="v">' + utils.fmtDes(FAKTOR_JALAN[kecepatan.value].nilai * bb * (1000 * r.panjangLangkahCm / 100000), 1) + ' kkal</span></div>' +
      '<p class="hint">Panjang langkah diperkirakan dari tinggi badan (0,413 kali tinggi), jadi jarak dan kalorinya perkiraan, bukan pengukuran pasti. ' +
      'Jalan menanjak, membawa beban, atau jalan lebih cepat membakar lebih banyak kalori. Ini perkiraan buat belajar, bukan diagnosis. ' +
      'Kalau kamu berolahraga untuk tujuan kesehatan tertentu, sesuaikan targetmu dengan dokter atau pelatih.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jumlah langkah', langkah, 'Dari HP, jam tangan, atau pedometer.'),
    T.field('Berat badan (kg)', berat),
    T.field('Tinggi badan (cm)', tinggi),
    T.field('Kecepatan jalan', kecepatan),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
