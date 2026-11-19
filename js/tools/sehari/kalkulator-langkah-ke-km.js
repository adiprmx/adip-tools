import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-langkah-ke-km', name: 'Kalkulator Langkah ke KM', cat: 'sehari', icon: '🚶', desc: 'Ubah jumlah langkah dari HP atau jam tanganmu menjadi jarak kilometer, dengan panjang langkah dari tinggi badanmu.', keywords: 'langkah,km,jalan kaki,jarak,step counter,pedometer,olahraga', since: '6.18.0' };

// Panjang langkah dari tinggi badan: perkiraan umum 0,413 x tinggi badan
// (dipakai banyak kalkulator langkah; hasilnya perkiraan, bukan pengukuran).
export function langkahDariTinggi(tinggiCm) {
  if (!(tinggiCm > 0)) return null;
  return tinggiCm * 0.413;
}

// Jarak (km) dari jumlah langkah dan panjang langkah (cm).
export function langkahKeKm(langkah, panjangLangkahCm) {
  if (!(langkah >= 0) || !(panjangLangkahCm > 0)) return null;
  return langkah * panjangLangkahCm / 100000;
}

function fmtDes(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const d = des == null ? 2 : des;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Isi jumlah langkahmu, lalu tinggi badanmu. Panjang langkah diperkirakan dari tinggi badan, jadi hasilnya perkiraan yang cukup dekat, bukan pengukuran pasti.</p>'));

  const langkahI = T.input('text', 'cth: 10000', '10000'); langkahI.inputMode = 'decimal';
  const tinggiI = T.input('text', 'cth: 170', '170'); tinggiI.inputMode = 'decimal';
  const langkahManualI = T.input('text', 'cth: 70', ''); langkahManualI.inputMode = 'decimal';
  const pakaiManual = T.select([
    ['tinggi', 'Perkirakan dari tinggi badan'],
    ['manual', 'Saya tahu panjang langkah saya'],
  ], 'tinggi');
  const box = T.out();

  const wrapManual = T.el('<div></div>');
  wrapManual.appendChild(T.field('Panjang langkahmu (cm)', langkahManualI, 'Ukur dari tumit satu kaki ke tumit kaki berikutnya saat jalan biasa.'));

  function aturTampil() {
    wrapManual.hidden = pakaiManual.value !== 'manual';
  }
  pakaiManual.addEventListener('change', aturTampil);
  aturTampil();

  function hitung() {
    const langkah = T.num(langkahI.value);
    if (!isFinite(langkah) || langkah < 0 || !Number.isInteger(langkah)) { T.toast('Isi jumlah langkahnya dulu dengan bilangan bulat 0 atau lebih'); return; }
    let cmLangkah;
    if (pakaiManual.value === 'manual') {
      cmLangkah = T.num(langkahManualI.value);
      if (!isFinite(cmLangkah) || cmLangkah <= 0 || cmLangkah > 200) { T.toast('Isi panjang langkahnya dulu (antara 1 sampai 200 cm)'); return; }
    } else {
      const tinggi = T.num(tinggiI.value);
      if (!isFinite(tinggi) || tinggi < 50 || tinggi > 250) { T.toast('Isi tinggi badanmu dulu (antara 50 sampai 250 cm)'); return; }
      cmLangkah = langkahDariTinggi(tinggi);
    }
    const km = langkahKeKm(langkah, cmLangkah);
    const meter = km * 1000;
    const mil = km / 1.609344;
    // Waktu tempuh dengan kecepatan jalan santai 5 km/jam (perkiraan).
    const menit = km / 5 * 60;
    T.show(box,
      '<p class="big">' + fmtDes(km) + ' km</p>' +
      '<p>' + T.fmt(langkah) + ' langkah dengan panjang langkah ' + fmtDes(cmLangkah, 1) + ' cm = ' + fmtDes(meter, 0) + ' meter (' + fmtDes(mil) + ' mil).</p>' +
      '<p class="hint">Jalan santai sekitar 5 km/jam, jarak segitu ditempuh kira-kira ' + fmtDes(menit, 0) + ' menit. Panjang langkah dari tinggi badan adalah perkiraan umum (0,413 × tinggi).</p>');
  }

  root.append(
    T.field('Jumlah langkah', langkahI),
    T.field('Cara hitung panjang langkah', pakaiManual),
    T.field('Tinggi badan (cm)', tinggiI),
    wrapManual,
    T.btn('Hitung jarak', hitung, true),
    box,
  );
}
