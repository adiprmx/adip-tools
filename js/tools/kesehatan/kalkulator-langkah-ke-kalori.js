import { h as T, esc, utils } from '../../core.js';

// Kalori dari langkah kaki: langkah diubah ke jarak, lalu jarak diubah
// ke kalori memakai biaya energi jalan kaki per kilo berat badan.
//   Panjang langkah = 0,413 x tinggi badan (perkiraan umum), ATAU diisi
//     manual oleh user (ukur tumit-ke-tumit; diserap dari
//     kalkulator-langkah-ke-km, v6.21.0).
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

// panjangManualCm (opsional): bila diisi angka > 0, dipakai sebagai
// ganti perkiraan 0,413 x tinggi; tinggiCm lalu tidak dibutuhkan.
export function hitungKaloriLangkah(langkah, beratKg, tinggiCm, kecepatan, panjangManualCm) {
  const f = FAKTOR_JALAN[kecepatan];
  if (!(langkah >= 0) || !(beratKg > 0) || !f) return null;
  const manual = Number(panjangManualCm);
  const panjangLangkahCm = manual > 0 ? manual : tinggiCm * 0.413;
  if (!(panjangLangkahCm > 0)) return null;
  const jarakKm = langkah * panjangLangkahCm / 100000;
  const kalori = f.nilai * beratKg * jarakKm;
  return { panjangLangkahCm, jarakKm, kalori, manual: manual > 0 };
}

export const meta = { "id": "kalkulator-langkah-ke-kalori", "name": "Kalkulator Langkah ke Kalori", "cat": "kesehatan", "icon": "👟", "desc": "Berapa kalori yang terbakar dari jumlah langkahmu, dari berat badan, tinggi badan, dan kecepatan jalanmu. Panjang langkah bisa dari tinggi badan atau ukuranmu sendiri.", "keywords": "langkah,kalori,jalan kaki,step counter,pedometer,olahraga,bakar kalori,km,jarak,panjang langkah,langkah ke km", "since": "6.19.0" };

export function render(root) {
  const langkah = T.input('number', 'Jumlah langkah', '10000');
  const berat = T.input('number', 'Berat badan (kg)', '70');
  const tinggi = T.input('number', 'Tinggi badan (cm)', '170');
  const kecepatan = T.select([
    ['santai', 'Santai (jalan pelan)'],
    ['normal', 'Normal (jalan biasa)'],
    ['cepat', 'Cepat (jalan brisk)'],
  ], 'normal');
  const caraLangkah = T.select([
    ['tinggi', 'Perkirakan dari tinggi badan'],
    ['manual', 'Saya tahu panjang langkah saya'],
  ], 'tinggi');
  const langkahManualI = T.input('number', 'Panjang langkah (cm)', '');
  const tinggiField = T.field('Tinggi badan (cm)', tinggi);
  const manualField = T.field('Panjang langkahmu (cm)', langkahManualI, 'Ukur dari tumit satu kaki ke tumit kaki berikutnya saat jalan biasa.');
  const box = T.out();

  const aturCara = () => {
    const manual = caraLangkah.value === 'manual';
    tinggiField.hidden = manual;
    manualField.hidden = !manual;
  };
  caraLangkah.addEventListener('change', aturCara);
  aturCara();

  const hitung = () => {
    const lk = T.num(langkah.value);
    const bb = T.num(berat.value);
    const tb = T.num(tinggi.value);
    const manual = caraLangkah.value === 'manual';
    const cmManual = T.num(langkahManualI.value);
    if (!(lk >= 0 && lk <= 200000)) {
      T.show(box, '<span class="err">Isi jumlah langkah antara 0 sampai 200.000.</span>');
      return;
    }
    if (!(bb >= 20 && bb <= 400)) {
      T.show(box, '<span class="err">Isi berat badan antara 20 sampai 400 kg.</span>');
      return;
    }
    if (manual) {
      if (!(cmManual > 0 && cmManual <= 200)) {
        T.show(box, '<span class="err">Isi panjang langkah antara 1 sampai 200 cm.</span>');
        return;
      }
    } else if (!(tb >= 100 && tb <= 250)) {
      T.show(box, '<span class="err">Isi tinggi badan antara 100 sampai 250 cm.</span>');
      return;
    }
    const r = hitungKaloriLangkah(lk, bb, tb, kecepatan.value, manual ? cmManual : null);
    // Waktu tempuh dengan kecepatan jalan santai 5 km/jam (perkiraan).
    const menit = r.jarakKm / 5 * 60;
    T.show(box,
      '<div class="center"><div class="dim">Kalori yang terbakar</div>' +
      '<div class="big">' + T.fmt(Math.round(r.kalori)) + ' kkal</div>' +
      '<div class="dim" style="margin-top:6px">dari ' + T.fmt(lk) + ' langkah, jalan ' + esc(FAKTOR_JALAN[kecepatan.value].label.toLowerCase()) + '</div></div>' +
      '<div class="kv"><span class="k">Jarak tempuh (perkiraan)</span><span class="v">' + utils.fmtDes(r.jarakKm, 2) + ' km (' + utils.fmtDes(r.jarakKm / 1.609344, 2) + ' mil)</span></div>' +
      '<div class="kv"><span class="k">Panjang langkahmu' + (r.manual ? '' : ' (perkiraan)') + '</span><span class="v">' + utils.fmtDes(r.panjangLangkahCm, 0) + ' cm</span></div>' +
      '<div class="kv"><span class="k">Kalori per 1.000 langkah</span><span class="v">' + utils.fmtDes(FAKTOR_JALAN[kecepatan.value].nilai * bb * (1000 * r.panjangLangkahCm / 100000), 1) + ' kkal</span></div>' +
      '<div class="kv"><span class="k">Waktu tempuh jalan santai (perkiraan)</span><span class="v">kira-kira ' + utils.fmtDes(menit, 0) + ' menit</span></div>' +
      '<p class="hint">' + (r.manual ? 'Panjang langkah memakai ukuranmu sendiri.' : 'Panjang langkah diperkirakan dari tinggi badan (0,413 kali tinggi), jadi jarak dan kalorinya perkiraan, bukan pengukuran pasti.') + ' ' +
      'Jalan menanjak, membawa beban, atau jalan lebih cepat membakar lebih banyak kalori. Ini perkiraan buat belajar, bukan diagnosis. ' +
      'Kalau kamu berolahraga untuk tujuan kesehatan tertentu, sesuaikan targetmu dengan dokter atau pelatih.</p>');
  };

  root.appendChild(T.grid2(
    T.field('Jumlah langkah', langkah, 'Dari HP, jam tangan, atau pedometer.'),
    T.field('Berat badan (kg)', berat),
    T.field('Cara hitung panjang langkah', caraLangkah),
    T.field('Kecepatan jalan', kecepatan),
  ));
  root.appendChild(tinggiField);
  root.appendChild(manualField);
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);

  // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik / ganti pilihan.
  [langkah, berat, tinggi, langkahManualI].forEach((i) => i.addEventListener('input', hitung));
  kecepatan.addEventListener('change', hitung);
  caraLangkah.addEventListener('change', hitung);
  hitung();
}
