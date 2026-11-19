import { h as T, utils, kv } from '../../core.js';

// Kebutuhan material pagar dari keliling lahan. Pagar tertutup (keliling
// penuh): jumlah tiang = keliling / jarak tiang, dibulatkan ke atas.
// Panjang panel = keliling dikurangi lebar gerbang. Beton per tiang
// 0,04 m3 (lubang sekitar 30 x 30 x 45 cm) sebagai patokan umum.
export function hitungPagar(keliling, jarakTiang, lebarGerbang) {
  const k = Number(keliling);
  const j = Number(jarakTiang);
  const g = Math.max(0, Number(lebarGerbang) || 0);
  if (![k, j].every(isFinite) || k <= 0 || j <= 0 || g >= k) return null;
  const tiang = Math.ceil(k / j);
  const panel = tiang;
  const panjangPanel = k - g;
  return {
    tiang,
    panel,
    panjangPanel,
    betonM3: tiang * 0.04,
    jarakNyata: k / tiang,
  };
}
utils.pagar = hitungPagar;

export const meta = {"id": "kalkulator-pagar", "name": "Kalkulator Pagar", "cat": "rumah", "icon": "🪵", "desc": "Berapa tiang, panel, dan beton yang perlu disiapkan untuk memagari lahanmu.", "keywords": "pagar,tiang,panel,keliling,lahan,rumah,renovasi,beton,gerbang,bangunan", "since": "6.18.0"};
export function render(root) {
  const kelilingI = T.input('text', 'cth: 40', ''); kelilingI.inputMode = 'decimal';
  const jarakI = T.input('text', 'cth: 2,5', '2,5'); jarakI.inputMode = 'decimal';
  const gerbangI = T.input('text', 'cth: 3', '0'); gerbangI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const keliling = T.num(kelilingI.value);
    const jarak = T.num(jarakI.value);
    const gerbang = T.num(gerbangI.value);
    if (!isFinite(keliling) || keliling <= 0) {
      T.show(box, '<div class="err">Keliling lahan harus diisi angka lebih dari 0 (dalam meter).</div>');
      return;
    }
    if (!isFinite(jarak) || jarak <= 0 || jarak > keliling) {
      T.show(box, '<div class="err">Jarak antar tiang harus angka lebih dari 0 dan tidak lebih dari keliling.</div>');
      return;
    }
    if (!isFinite(gerbang) || gerbang < 0 || gerbang >= keliling) {
      T.show(box, '<div class="err">Lebar gerbang harus angka 0 atau lebih, dan lebih kecil dari keliling.</div>');
      return;
    }
    const r = hitungPagar(keliling, jarak, gerbang);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    T.show(box,
      '<div class="big">' + T.fmt(r.tiang) + ' tiang</div>' +
      '<p class="center mut">Untuk memagari ' + T.fmt(keliling) + ' meter keliling lahan.</p>' +
      kv('Panel pagar', T.fmt(r.panel) + ' panel') +
      kv('Panjang panel total', r.panjangPanel.toFixed(1).replace('.', ',') + ' m') +
      kv('Jarak antar tiang sebenarnya', r.jarakNyata.toFixed(2).replace('.', ',') + ' m') +
      kv('Beton untuk kaki tiang', r.betonM3.toFixed(2).replace('.', ',') + ' m3') +
      '<p class="hint">Jarak antar tiang disesuaikan supaya tiang terbagi rata di seluruh keliling. Beton 0,04 m3 per tiang adalah patokan lubang sekitar 30 x 30 x 45 cm. Beli tiang cadangan 1 atau 2 batang untuk jaga-jaga bila ada yang patah saat pasang.</p>');
  };
  [kelilingI, jarakI, gerbangI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau memagari lahan? Masukkan keliling lahannya dan jarak antar tiang yang kamu mau, dan lihat berapa tiang dan panel yang perlu dibeli.</p>'));
  root.appendChild(T.field('Keliling lahan (m)', kelilingI, 'Total panjang sisi lahan yang dipagari'));
  root.appendChild(T.field('Jarak antar tiang (m)', jarakI, 'Biasanya 2 sampai 3 meter'));
  root.appendChild(T.field('Lebar gerbang (m)', gerbangI, 'Isi 0 bila tidak ada gerbang'));
  root.appendChild(box);
}
