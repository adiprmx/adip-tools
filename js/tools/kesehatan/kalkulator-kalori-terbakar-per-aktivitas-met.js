import { h as T, esc } from '../../core.js';

// Kalori terbakar = nilai MET x berat badan (kg) x durasi (jam).
// Nilai MET dari Compendium of Physical Activities (Ainsworth dkk., 2011):
// 1 MET = energi saat duduk diam. Nilai di bawah adalah angka baku
// kompendium untuk tiap aktivitas.
const AKTIVITAS = [
  ['Jalan santai (3 km/jam)', 2.8],
  ['Jalan cepat (5 km/jam)', 3.5],
  ['Jalan sangat cepat (6,5 km/jam)', 5.0],
  ['Lari pelan (8 km/jam)', 8.3],
  ['Lari (9,5 km/jam)', 9.8],
  ['Lari cepat (11 km/jam)', 11.0],
  ['Sepeda santai', 4.0],
  ['Sepeda sedang (19-22 km/jam)', 8.0],
  ['Sepeda cepat (25-30 km/jam)', 10.0],
  ['Berenang santai', 6.0],
  ['Berenang gaya bebas sedang', 8.0],
  ['Angkat beban sedang', 3.5],
  ['Angkat beban berat', 6.0],
  ['Senam aerobik ringan', 5.0],
  ['Senam aerobik berat', 7.3],
  ['Yoga', 3.0],
  ['Badminton santai', 5.5],
  ['Tenis', 7.3],
  ['Basket', 6.5],
  ['Sepak bola santai', 7.0],
  ['Lompat tali', 12.3],
  ['Naik tangga', 8.8],
  ['Berkebun', 3.8],
  ['Beres-beres rumah', 3.3],
  ['Menari', 4.5],
  ['Mendayung sedang', 4.8],
];

export const meta = {"id": "kalkulator-kalori-terbakar-per-aktivitas-met", "name": "Kalkulator Kalori Terbakar per Aktivitas (MET)", "cat": "kesehatan", "icon": "🔥", "desc": "Berapa kalori yang terbakar saat jalan, lari, sepeda, renang, dan aktivitas lainnya.", "keywords": "kalori,met,aktivitas,olahraga,laju bakar,lari,sepeda,renang,compendium", "since": "6.17.0"};
export function render(root) {
  const aktivitas = T.select(AKTIVITAS.map(([nama, met]) => [String(met), nama + ' (MET ' + met + ')']), '8.3');
  const berat = T.input('number', 'Berat badan (kg)', '70');
  const durasi = T.input('number', 'Durasi (menit)', '30');
  const box = T.out();

  const hitung = () => {
    const met = Number(aktivitas.value);
    const bb = T.num(berat.value);
    const mnt = T.num(durasi.value);
    if (!(bb >= 20 && bb <= 300)) {
      T.show(box, '<span class="err">Isi berat badan antara 20 sampai 300 kg.</span>');
      return;
    }
    if (!(mnt > 0 && mnt <= 1440)) {
      T.show(box, '<span class="err">Isi durasi antara 1 sampai 1440 menit.</span>');
      return;
    }
    const jam = mnt / 60;
    const kkal = met * bb * jam;
    const namaAkt = AKTIVITAS.find(([, m]) => String(m) === String(met))[0];
    T.show(box,
      '<div class="center"><div class="dim">Kalori yang terbakar</div>' +
      '<div class="big">' + Math.round(kkal) + ' kkal</div>' +
      '<div class="dim">' + esc(namaAkt) + ', ' + T.fmt(mnt) + ' menit</div></div>' +
      '<div class="kv"><span class="k">Nilai MET aktivitas</span><span class="v">' + met + '</span></div>' +
      '<div class="kv"><span class="k">Kalori per jam</span><span class="v">' + Math.round(met * bb) + ' kkal/jam</span></div>' +
      '<div class="kv"><span class="k">Kalori per menit</span><span class="v">' + (met * bb / 60).toFixed(1) + ' kkal/menit</span></div>' +
      '<p class="hint">Rumus: kalori = nilai MET x berat badan x durasi. Nilai MET dari Compendium of Physical Activities (Ainsworth dkk., 2011), patokan yang dipakai peneliti olahraga. ' +
      '1 MET sama dengan energi saat duduk diam. Hasil ini perkiraan, karena kecepatan, medan, dan kondisi badan tiap orang beda-beda. Ini bukan nasihat medis; buat program latihan, tanya pelatih atau tenaga kesehatan.</p>');
  };

  root.appendChild(T.field('Aktivitas', aktivitas));
  root.appendChild(T.grid2(
    T.field('Berat badan (kg)', berat),
    T.field('Durasi (menit)', durasi),
  ));
  root.appendChild(T.btn('Hitung', hitung, true));
  root.appendChild(box);
  hitung();
}
