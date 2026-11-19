import { h as T, kv } from '../../core.js';

export const meta = {"id": "umur-di-planet-lain", "name": "Umur di Planet Lain", "cat": "fun", "icon": "🪐", "desc": "Berapa umurmu kalau dihitung dalam tahun Merkurius, Mars, atau Jupiter? Masukkan tanggal lahirmu.", "keywords": "umur di planet lain,umur mars,umur jupiter,periode orbit,planet,tata surya,nasa", "since": "6.19.0"};

// Periode orbit tiap planet dalam tahun Bumi (NASA Planetary Fact Sheet).
// Umur di planet = umur Bumi (tahun) dibagi periode orbitnya.
export const PERIODE_ORBIT = [
  ['Merkurius', 0.240846, '☿'],
  ['Venus', 0.615198, '♀'],
  ['Bumi', 1, '🌍'],
  ['Mars', 1.88082, '♂'],
  ['Jupiter', 11.862, '♃'],
  ['Saturnus', 29.4571, '♄'],
  ['Uranus', 84.0205, '♅'],
  ['Neptunus', 164.8, '♆'],
  ['Pluto', 248.0, '♇'],
];

export function parseTanggal(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

// Umur dalam tahun Bumi (desimal) dari selisih hari dibagi 365,25.
export function umurBumiTahun(tglLahir, sekarang) {
  const lahir = tglLahir instanceof Date ? tglLahir : parseTanggal(tglLahir);
  const kini = sekarang instanceof Date ? sekarang : parseTanggal(sekarang);
  if (!lahir || !kini || kini < lahir) return null;
  const hari = (kini - lahir) / 86400000;
  return { tahun: hari / 365.25, hari: Math.floor(hari) };
}

export function umurDiPlanet(tglLahir, sekarang) {
  const umur = umurBumiTahun(tglLahir, sekarang);
  if (!umur) return null;
  return PERIODE_ORBIT.map(([nama, periode, emoji]) => ({
    nama, periode, emoji,
    umur: umur.tahun / periode,
  }));
}

// Ulang tahun berikutnya di tiap planet: tanggal saat umur planet
// bertambah 1 tahun planet.
export function ulangTahunBerikutnya(tglLahir, sekarang) {
  const umur = umurBumiTahun(tglLahir, sekarang);
  if (!umur) return null;
  const lahir = tglLahir instanceof Date ? tglLahir : parseTanggal(tglLahir);
  return PERIODE_ORBIT.map(([nama, periode, emoji]) => {
    const umurPlanet = umur.tahun / periode;
    const ulangKe = Math.floor(umurPlanet) + 1;
    const hariKe = ulangKe * periode * 365.25;
    const tanggal = new Date(lahir.getTime() + hariKe * 86400000);
    return { nama, periode, emoji, ulangKe, tanggal };
  });
}

export function render(root) {
  const tglI = T.input('date', '', '');
  const box = T.out();

  const fmtUmur = (v) => {
    const r = Math.round(v * 100) / 100;
    const bersih = Object.is(r, -0) ? 0 : r;
    return String(bersih).replace('.', ',');
  };
  const fmtTanggal = (d) => {
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
  };

  const hitung = () => {
    const lahir = parseTanggal(tglI.value);
    if (!lahir) {
      T.show(box, '<div class="err">Isi tanggal lahirmu dulu.</div>');
      return;
    }
    const kini = new Date();
    if (lahir > kini) {
      T.show(box, '<div class="err">Tanggal lahir tidak boleh di masa depan.</div>');
      return;
    }
    const umur = umurBumiTahun(lahir, kini);
    const hasil = umurDiPlanet(lahir, kini);
    const ultah = ulangTahunBerikutnya(lahir, kini);
    T.show(box,
      '<div class="big">' + fmtUmur(umur.tahun) + ' tahun di Bumi</div>' +
      '<p class="center mut">Kamu sudah hidup ' + T.fmt(umur.hari) + ' hari.</p>' +
      hasil.map((h) => kv(h.emoji + ' ' + h.nama, '<b>' + fmtUmur(h.umur) + ' tahun</b>')).join('') +
      '<h3 style="margin-top:14px">Ulang tahunmu berikutnya di tiap planet</h3>' +
      ultah.map((u) => kv(u.emoji + ' ' + u.nama, 'ke-' + u.ulangKe + ' pada ' + fmtTanggal(u.tanggal))).join('') +
      '<p class="hint">Periode orbit: NASA Planetary Fact Sheet. Satu tahun Merkurius hanya 88 hari Bumi, satu tahun Neptunus 164,8 tahun Bumi.</p>');
  };

  tglI.addEventListener('change', hitung);

  root.appendChild(T.el('<p class="note">Satu tahun di tiap planet beda panjangnya, karena jaraknya ke Matahari beda. Umurmu dalam tahun Mars jauh lebih kecil dari umurmu di Bumi.</p>'));
  root.appendChild(T.field('Tanggal lahir', tglI));
  root.appendChild(T.btn('Lihat Umurku', hitung, true));
  root.appendChild(box);
}
