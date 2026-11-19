import { h as T, utils, kv } from '../../core.js';

// Ukuran bra dari dua lingkar badan (cm): lingkar bawah dada dan lingkar
// dada penuh. Cup dari selisih keduanya, 1 cup = 2,5 cm. Band Eropa
// dibulatkan ke kelipatan 5 terdekat; band UK/US dibulatkan ke angka genap
// terdekat dalam inci. Panduan umum, tiap merek bisa beda 1 ukuran.
const CUP = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export function cupDariSelisih(selisihCm) {
  const d = Number(selisihCm);
  if (!isFinite(d)) return '';
  if (d < 2.5) return 'AA';
  const idx = Math.min(CUP.length - 1, Math.floor((d - 2.5) / 2.5) + 1);
  return CUP[idx];
}
export function hitungUkuranBra(underbustCm, bustCm) {
  const u = Number(underbustCm);
  const b = Number(bustCm);
  if (!isFinite(u) || !isFinite(b) || u <= 0 || b <= 0) return null;
  const selisih = Math.max(0, b - u);
  const cup = cupDariSelisih(selisih);
  const bandEu = Math.max(60, Math.min(110, Math.round(u / 5) * 5));
  const bandInci = Math.max(28, Math.min(44, Math.round((u / 2.54) / 2) * 2));
  return {
    selisih: Math.round(selisih * 10) / 10, cup,
    bandEu, bandInci,
    eu: bandEu + cup, uk: bandInci + cup, us: bandInci + cup,
    // Sister size: band naik 1 langkah, cup turun 1 langkah (volume cup sama).
    sisterEu: (bandEu + 5) + CUP[Math.max(0, CUP.indexOf(cup) - 1)],
  };
}
utils.ukuranBra = hitungUkuranBra;

export const meta = {"id": "ukuran-bra", "name": "Ukuran Bra", "cat": "sehari", "icon": "👙", "desc": "Cari ukuran bra (Eropa, UK, US) dari lingkar bawah dada dan lingkar dadamu.", "keywords": "ukuran bra,bra size,cup,band,lingkar dada,ukuran pakaian dalam", "since": "6.19.0"};
export function render(root) {
  const underI = T.input('text', 'cth: 72', ''); underI.inputMode = 'decimal';
  const bustI = T.input('text', 'cth: 86', ''); bustI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const u = T.num(underI.value);
    const b = T.num(bustI.value);
    if (!underI.value.trim() && !bustI.value.trim()) { T.hide(box); return; }
    if (!isFinite(u) || u < 50 || u > 130) { T.show(box, '<div class="err">Lingkar bawah dada harus angka 50 sampai 130 cm.</div>'); return; }
    if (!isFinite(b) || b < 50 || b > 160) { T.show(box, '<div class="err">Lingkar dada harus angka 50 sampai 160 cm.</div>'); return; }
    if (b < u) { T.show(box, '<div class="err">Lingkar dada biasanya lebih besar dari lingkar bawah dada. Cek lagi angkanya.</div>'); return; }
    const r = hitungUkuranBra(u, b);
    T.show(box,
      '<div class="big">' + r.eu + ' <span class="mut" style="font-size:16px">(Eropa)</span></div>' +
      '<p class="center mut">Ukuran UK/US: ' + r.uk + '. Sister size Eropa: ' + r.sisterEu + '.</p>' +
      kv('Selisih lingkar', T.fmt(r.selisih) + ' cm') +
      kv('Cup', r.cup) +
      kv('Band Eropa', r.bandEu) +
      kv('Band UK/US', r.bandInci + ' inci') +
      '<p class="hint">Cara ukur: lingkar bawah dada diukur pas di bawah dada dengan meteran rapat tapi tidak menekan; lingkar dada diukur di bagian paling penuh sambil bernapas biasa. Ini panduan umum, tiap merek bisa beda 1 ukuran, jadi tetap coba dulu bila bisa. Sister size punya volume cup yang sama dengan band yang beda, berguna bila band terasa terlalu ketat atau longgar.</p>');
  };
  [underI, bustI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Ukur dua lingkar dengan meteran kain, lalu ukuranmu langsung ketemu.</p>'));
  root.appendChild(T.field('Lingkar bawah dada (cm)', underI, 'Diukur pas di bawah dada'));
  root.appendChild(T.field('Lingkar dada (cm)', bustI, 'Diukur di bagian dada paling penuh'));
  root.appendChild(box);
}
