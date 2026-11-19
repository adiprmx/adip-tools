import { h as T, kv } from '../../core.js';

// Berat di Planet Lain: berapa berat badanmu kalau berdiri di tiap planet,
// di Bulan, dan di Pluto. Angkanya dari gravitasi permukaan tiap benda
// langit menurut NASA Planetary Fact Sheet (dibandingkan dengan Bumi = 1).
// Ingat: yang berubah itu beratmu (gaya tariknya), massamu tetap sama
// di mana pun.
export const meta = {"id": "berat-di-planet-lain", "name": "Berat di Planet Lain", "cat": "fun", "icon": "🪐", "desc": "Berat badanmu di tiap planet, di Bulan, dan di Pluto.", "keywords": "berat di planet lain,berat di bulan,berat di mars,gravitasi planet,nasa,berat badan luar angkasa", "since": "6.18.0"};

// [nama, gravitasi relatif terhadap Bumi, emoji]
export const GRAVITASI = [
  ['Merkurius', 0.38, '☿'],
  ['Venus', 0.91, '♀'],
  ['Bumi', 1.0, '🌍'],
  ['Bulan', 0.17, '🌙'],
  ['Mars', 0.38, '♂'],
  ['Jupiter', 2.34, '♃'],
  ['Saturnus', 1.06, '♄'],
  ['Uranus', 0.92, '♅'],
  ['Neptunus', 1.19, '♆'],
  ['Pluto', 0.06, '♇'],
];

// Berat di satu benda langit. Murni, bisa diuji di Node.
export function beratDiPlanet(beratKg, faktor) {
  const b = Number(beratKg);
  const f = Number(faktor);
  if (!isFinite(b) || !isFinite(f) || b < 0) return null;
  return b * f;
}

// Berat di semua benda langit. Murni, bisa diuji di Node.
export function semuaPlanet(beratKg) {
  return GRAVITASI.map(([nama, faktor, emoji]) => ({ nama, faktor, emoji, berat: beratDiPlanet(beratKg, faktor) }));
}

export function render(root) {
  const beratI = T.input('text', 'cth: 60', ''); beratI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const berat = T.num(beratI.value);
    if (!isFinite(berat) || berat <= 0 || berat > 1000) {
      T.show(box, '<div class="err">Berat badan harus diisi angka 1 sampai 1000 kg.</div>');
      return;
    }
    const hasil = semuaPlanet(berat);
    const fmt = (kg) => kg >= 100 ? Math.round(kg) + ' kg' : (Math.round(kg * 10) / 10 + '').replace('.', ',') + ' kg';
    T.show(box,
      '<div class="big">' + fmt(berat) + ' di Bumi</div>' +
      '<p class="center mut">Ini beratmu kalau berdiri di tempat lain.</p>' +
      hasil.map((h) => kv(h.emoji + ' ' + h.nama, '<b>' + fmt(h.berat) + '</b>')).join('') +
      '<p class="hint">Gravitasi: NASA Planetary Fact Sheet. Yang berubah itu beratmu (gaya tariknya); massamu tetap sama di mana pun.</p>');
  };

  beratI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); hitung(); } });

  root.appendChild(T.el('<p class="note">Masukkan berat badanmu di Bumi, lalu lihat beratmu di tiap planet, di Bulan, dan di Pluto.</p>'));
  root.appendChild(T.field('Berat badanmu di Bumi (kg)', beratI));
  root.appendChild(T.btn('Lihat Beratku', hitung, true));
  root.appendChild(box);
}
