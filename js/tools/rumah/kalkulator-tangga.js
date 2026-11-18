import { h as T, utils, kv } from '../../core.js';

// Ukuran tangga yang nyaman, rumus Blondel: 2 x tinggi anak tangga +
// lebar pijakan = 60 sampai 64 cm (ideal 63 cm). Tinggi anak tangga yang
// nyaman 15-19 cm, lebar pijakan 25-30 cm. Jumlah anak tangga dihitung
// dari tinggi lantai dibagi tinggi anak tangga ideal 17,5 cm, lalu tinggi
// anak tangga disesuaikan supaya pas. Panjang total tangga = lebar pijakan
// x (jumlah anak tangga - 1), karena pijakan terakhir adalah lantai atas.
export function hitungTangga(tinggiCm, blondel) {
  const t = Math.max(0, Number(tinggiCm) || 0);
  const b = Math.max(0, Number(blondel) || 63);
  const jumlah = Math.max(1, Math.round(t / 17.5));
  const naik = t / jumlah;
  const datar = b - 2 * naik;
  const panjang = datar * (jumlah - 1);
  const sudut = Math.atan2(naik, datar) * 180 / Math.PI;
  const nyaman = naik >= 15 && naik <= 19 && datar >= 25 && datar <= 30;
  return { jumlah, naik, datar, panjang, sudut, nyaman, blondel: 2 * naik + datar };
}
utils.kalkulatorTangga = hitungTangga;

export const meta = {"id": "kalkulator-tangga", "name": "Kalkulator Tangga", "cat": "rumah", "icon": "🪜", "desc": "Ukuran tangga yang nyaman dari tinggi lantai: tinggi anak tangga, lebar pijakan, dan jumlahnya.", "keywords": "tangga,rumah,blondel,anak tangga,pijakan,renovasi,bangunan", "since": "6.17.0"};
export function render(root) {
  const tinggiI = T.input('text', 'cth: 300', ''); tinggiI.inputMode = 'decimal';
  const blondelI = T.input('text', 'cth: 63', '63'); blondelI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const tinggi = T.num(tinggiI.value) || 0;
    if (!(tinggi > 0)) { T.hide(box); return; }
    const blondel = T.num(blondelI.value);
    if (!isFinite(blondel) || blondel < 55 || blondel > 70) { T.show(box, '<p class="warn">Angka Blondel umumnya 60 sampai 64 cm.</p>'); return; }
    const r = hitungTangga(tinggi, blondel);
    const fmtCm = (v) => T.fmt(Math.round(v * 10) / 10) + ' cm';
    const peringatan = r.nyaman ? '' : '<p class="warn">Ukuran ini di luar rentang nyaman (anak tangga 15-19 cm, pijakan 25-30 cm). Tangga akan terasa curam atau melelahkan. Coba ubah angka Blondel atau tinggi lantainya.</p>';
    T.show(box,
      '<div class="big">' + r.jumlah + ' anak tangga</div>' +
      '<p class="center mut">' + (r.nyaman ? 'Ukuran ini nyaman dipakai sehari-hari.' : 'Ukuran ini kurang nyaman, lihat catatan di bawah.') + '</p>' +
      kv('Tinggi tiap anak tangga', fmtCm(r.naik)) +
      kv('Lebar tiap pijakan', fmtCm(r.datar)) +
      kv('Panjang total tangga', fmtCm(r.panjang) + ' (' + T.fmt(Math.round(r.panjang / 100 * 100) / 100) + ' m)') +
      kv('Kemiringan tangga', T.fmt(Math.round(r.sudut * 10) / 10) + ' derajat') +
      kv('Rumus Blondel (2 x naik + datar)', T.fmt(Math.round(r.blondel * 10) / 10) + ' cm') +
      peringatan +
      '<p class="hint">Rumus Blondel: 2 x tinggi anak tangga + lebar pijakan = 60 sampai 64 cm, idealnya 63 cm. Pijakan terakhir tidak dihitung panjangnya karena lantai atas sudah menjadi pijakan. Untuk tangga putar (L atau U), bagi jumlah anak tangga ke dua sisi dan beri bordes di tengahnya.</p>');
  };
  [tinggiI, blondelI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Tangga yang terlalu curam bikin capek, yang terlalu landai makan tempat. Masukkan tinggi dari lantai bawah ke lantai atas, dan ukuran nyamannya langsung ketemu.</p>'));
  root.appendChild(T.field('Tinggi lantai ke lantai (cm)', tinggiI, 'Dari permukaan lantai bawah ke permukaan lantai atas'));
  root.appendChild(T.field('Angka Blondel (cm)', blondelI, 'Rumus kenyamanan: 2 x naik + datar. Umumnya 60-64, ideal 63'));
  root.appendChild(box);
  hitung();
}
