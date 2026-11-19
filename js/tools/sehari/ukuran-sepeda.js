import { h as T, utils, kv } from '../../core.js';

// Ukuran rangka sepeda dari tinggi badan dan inseam (panjang kaki bagian
// dalam). Rumus umum toko sepeda: rangka road = inseam x 0,67 (cm),
// hybrid = inseam x 0,685 (cm), MTB = inseam x 0,66 lalu ke inci.
// Label S/M/L/XL dari tinggi badan sebagai pembanding.
export function labelTinggi(tinggiCm) {
  const t = Number(tinggiCm);
  if (!isFinite(t)) return '';
  if (t < 155) return 'XS';
  if (t < 165) return 'S';
  if (t < 175) return 'M';
  if (t < 185) return 'L';
  if (t < 193) return 'XL';
  return 'XXL';
}
export function hitungUkuranSepeda(tinggiCm, inseamCm, jenis) {
  const t = Number(tinggiCm);
  const ins = Number(inseamCm);
  if (!isFinite(t) || !isFinite(ins) || t <= 0 || ins <= 0) return null;
  const faktor = jenis === 'mtb' ? 0.66 : jenis === 'hybrid' ? 0.685 : 0.67;
  const rangkaCm = ins * faktor;
  const rangkaInci = rangkaCm / 2.54;
  return {
    jenis, label: labelTinggi(t),
    rangkaCm: Math.round(rangkaCm * 10) / 10,
    rangkaInci: Math.round(rangkaInci * 10) / 10,
    // Rangka road/MTB biasa dijual per 2 cm atau per 1 inci.
    rangkaCmBulat: Math.round(rangkaCm / 2) * 2,
    rangkaInciBulat: Math.round(rangkaInci),
  };
}
utils.ukuranSepeda = hitungUkuranSepeda;

export const meta = {"id": "ukuran-sepeda", "name": "Ukuran Sepeda", "cat": "sehari", "icon": "🚲", "desc": "Cari ukuran rangka sepeda road, hybrid, atau MTB dari tinggi badan dan panjang kakimu.", "keywords": "ukuran sepeda,frame sepeda,rangka sepeda,road bike,mtb,hybrid,sepeda", "since": "6.19.0"};
export function render(root) {
  const jenisSel = T.select([['road', 'Road (balap)'], ['hybrid', 'Hybrid / kota'], ['mtb', 'MTB (gunung)']], 'road');
  const tinggiI = T.input('text', 'cth: 170', ''); tinggiI.inputMode = 'decimal';
  const inseamI = T.input('text', 'cth: 78', ''); inseamI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const t = T.num(tinggiI.value);
    const ins = T.num(inseamI.value);
    if (!tinggiI.value.trim() && !inseamI.value.trim()) { T.hide(box); return; }
    if (!isFinite(t) || t < 120 || t > 220) { T.show(box, '<div class="err">Tinggi badan harus angka 120 sampai 220 cm.</div>'); return; }
    if (!isFinite(ins) || ins < 50 || ins > 110) { T.show(box, '<div class="err">Panjang kaki dalam harus angka 50 sampai 110 cm.</div>'); return; }
    if (ins >= t) { T.show(box, '<div class="err">Panjang kaki dalam tidak mungkin sama atau lebih dari tinggi badan. Cek lagi angkanya.</div>'); return; }
    const r = hitungUkuranSepeda(t, ins, jenisSel.value);
    const namaJenis = jenisSel.value === 'mtb' ? 'MTB' : jenisSel.value === 'hybrid' ? 'Hybrid' : 'Road';
    const utama = jenisSel.value === 'mtb'
      ? r.rangkaInciBulat + ' inci'
      : r.rangkaCmBulat + ' cm';
    const kedua = jenisSel.value === 'mtb'
      ? ' (' + T.fmt(r.rangkaCm) + ' cm)'
      : ' (' + T.fmt(r.rangkaInci) + ' inci)';
    T.show(box,
      '<div class="big">' + utama + '</div>' +
      '<p class="center mut">Rangka ' + namaJenis + ' untukmu, label tinggi badan: ' + r.label + '.</p>' +
      kv('Rangka hitungan', T.fmt(r.rangkaCm) + ' cm' + kedua) +
      kv('Label dari tinggi badan', r.label) +
      kv('Rangka yang dijual', 'Cari yang paling dekat dengan ' + utama) +
      '<p class="hint">Cara ukur panjang kaki dalam: berdiri tanpa alas kaki menempel dinding, selipkan buku di antara kaki sampai mentok ke atas, ukur dari lantai ke atas buku. Rangka yang dijual toko biasanya kelipatan 2 cm (road/hybrid) atau 1 inci (MTB), jadi ambil yang paling dekat. Bila ragu di antara dua ukuran, road/hybrid lebih enak yang kecil, MTB lebih enak yang besar. Tetap coba duduk di sepedanya bila bisa.</p>');
  };
  [jenisSel, tinggiI, inseamI].forEach((i) => i.addEventListener('input', hitung));
  jenisSel.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Sepeda yang pas ukurannya bikin gowes nyaman dan lutut tidak cepat pegal.</p>'));
  root.appendChild(T.field('Jenis sepeda', jenisSel));
  root.appendChild(T.grid2(
    T.field('Tinggi badan (cm)', tinggiI),
    T.field('Panjang kaki dalam (cm)', inseamI, 'Dari lantai ke selangkangan')
  ));
  root.appendChild(box);
}
