import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"zona-denyut-jantung","name":"Zona Denyut Jantung","cat":"sehari","icon":"❤️","desc":"Hitung zona latihan dari denyut jantung maksimalmu.","keywords":"denyut,jantung,heart,rate,zona,kardio,latihan,olahraga,bpm"};

const ZONES = [
  ['Zona 1', 0.50, 0.60, '#4ade80', 'Pemulihan', 'Sangat ringan — jalan santai. Buat pemanasan atau recovery habis latihan berat.'],
  ['Zona 2', 0.60, 0.70, '#a3e635', 'Bakar lemak', 'Intensitas sedang — badan pakai lemak sebagai bahan bakar. Zona favorit buat yang lagi nurunin berat.'],
  ['Zona 3', 0.70, 0.80, '#facc15', 'Kardio', 'Mulai ngos-ngosan tapi masih bisa ngomong. Melatih stamina jantung & paru-paru.'],
  ['Zona 4', 0.80, 0.90, '#fb923c', 'Ambang', 'Berat — cuma bisa ngomong sepatah-sepatah. Melatih kecepatan & daya tahan tubuh.'],
  ['Zona 5', 0.90, 1.00, '#ef4444', 'Maksimal', 'All-out, cuma tahan beberapa menit. Buat atlet — jangan kelamaan di sini.'],
];

export function render(root) {
  root.appendChild(T.el('<p class="hint">Masukin umurmu, nanti dihitung denyut jantung maksimal (220 − umur) dan dibagi ke 5 zona latihan. 💓</p>'));

  const umur = T.input('number', 'Contoh: 25');
  umur.value = '25';
  const box = T.out();

  const hitung = () => {
    const u = Math.round(T.num(umur.value));
    if (!(u >= 5 && u <= 120)) {
      T.show(box, '<span class="err">Isi umur yang masuk akal dulu (5–120 tahun).</span>');
      return;
    }
    const maks = 220 - u;
    const rows = ZONES.map(([z, lo, hi, warna, fungsi, desc]) => {
      const b1 = Math.round(maks * lo), b2 = Math.round(maks * hi);
      return '<div class="card" style="margin-bottom:8px;padding:10px 12px">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + warna + ';flex-shrink:0"></span>' +
        '<b>' + z + '</b><span class="mut" style="font-size:12px">· ' + fungsi + '</span>' +
        '<span style="margin-left:auto;font-weight:700;font-size:14px">' + b1 + '–' + b2 + ' <span class="mut" style="font-weight:400;font-size:11px">bpm</span></span>' +
        '</div>' +
        '<div class="mut" style="font-size:12px;line-height:1.5">' + desc + '</div>' +
        '</div>';
    }).join('');

    T.show(box,
      '<div class="center" style="margin-bottom:12px"><div class="dim">Denyut jantung maksimal (estimasi)</div>' +
      '<div class="big">' + maks + ' <span style="font-size:14px;font-weight:400" class="mut">bpm</span></div></div>' +
      rows +
      '<div class="card" style="border:1px solid #facc1544;background:#facc150d;padding:10px 12px;font-size:12px;line-height:1.6">' +
      '⚠️ <b>Disclaimer:</b> ini info umum buat panduan latihan, <b>bukan saran medis</b>. Rumus 220 − umur itu estimasi kasar — tiap orang beda. Kalau kamu punya riwayat jantung, hipertensi, atau kondisi khusus, konsultasi ke dokter dulu sebelum latihan intens. Kalau pas latihan dada sakit/pusing/lemes banget, berhenti dan cari bantuan.</div>');
  };

  root.appendChild(T.field('Umur (tahun)', umur));
  root.appendChild(T.btn('Hitung zona', hitung, true));
  root.appendChild(box);
  hitung();
}
