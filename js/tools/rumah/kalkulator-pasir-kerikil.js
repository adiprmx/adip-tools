import { h as T, utils, kv } from '../../core.js';

// Volume dan berat pasir atau kerikil dari ukuran area dan tebal lapisan.
// Volume = panjang x lebar x tebal. Berat = volume x berat jenis.
// Berat jenis umum: pasir 1.600 kg/m3, kerikil 1.700 kg/m3. Pasir basah
// lebih berat dari pasir kering, jadi angka ini patokan umum dan bisa
// diubah user. Karung dihitung per 50 kg.
export const BERAT_JENIS = { pasir: 1600, kerikil: 1700, sirtu: 1750 };
export function hitungPasirKerikil(panjang, lebar, tebalCm, densitas) {
  const p = Number(panjang);
  const l = Number(lebar);
  const t = Number(tebalCm);
  const d = Number(densitas);
  if (![p, l, t, d].every(isFinite) || p <= 0 || l <= 0 || t <= 0 || d <= 0) return null;
  const volumeM3 = p * l * (t / 100);
  const beratKg = volumeM3 * d;
  return {
    volumeM3,
    beratKg,
    beratTon: beratKg / 1000,
    karung50: Math.ceil(beratKg / 50),
  };
}
utils.pasirKerikil = hitungPasirKerikil;

export const meta = {"id": "kalkulator-pasir-kerikil", "name": "Kalkulator Pasir & Kerikil", "cat": "rumah", "icon": "🪨", "desc": "Berapa kubik dan berapa berat pasir atau kerikil yang perlu dibeli.", "keywords": "pasir,kerikil,sirtu,volume,berat,bangunan,cor,pondasi,urug,rumah,renovasi", "since": "6.18.0"};
export function render(root) {
  const jenisSel = T.select([
    ['pasir', 'Pasir (1.600 kg/m3)'],
    ['kerikil', 'Kerikil (1.700 kg/m3)'],
    ['sirtu', 'Sirtu / pasir batu (1.750 kg/m3)'],
  ], 'pasir');
  const pjI = T.input('text', 'cth: 5', ''); pjI.inputMode = 'decimal';
  const lbI = T.input('text', 'cth: 4', ''); lbI.inputMode = 'decimal';
  const tbI = T.input('text', 'cth: 10', ''); tbI.inputMode = 'decimal';
  const densI = T.input('text', 'cth: 1600', '1600'); densI.inputMode = 'decimal';
  const box = T.out();

  jenisSel.addEventListener('change', () => {
    densI.value = String(BERAT_JENIS[jenisSel.value]);
    hitung();
  });

  const hitung = () => {
    const pj = T.num(pjI.value);
    const lb = T.num(lbI.value);
    const tb = T.num(tbI.value);
    const dens = T.num(densI.value);
    if (!isFinite(pj) || pj <= 0 || !isFinite(lb) || lb <= 0) {
      T.show(box, '<div class="err">Panjang dan lebar area harus diisi angka lebih dari 0 (dalam meter).</div>');
      return;
    }
    if (!isFinite(tb) || tb <= 0) {
      T.show(box, '<div class="err">Tebal lapisan harus diisi angka lebih dari 0 (dalam cm).</div>');
      return;
    }
    if (!isFinite(dens) || dens <= 0) {
      T.show(box, '<div class="err">Berat jenis harus diisi angka lebih dari 0.</div>');
      return;
    }
    const r = hitungPasirKerikil(pj, lb, tb, dens);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    T.show(box,
      '<div class="big">' + r.volumeM3.toFixed(2).replace('.', ',') + ' m3</div>' +
      '<p class="center mut">Volume ' + T.esc(jenisSel.options[jenisSel.selectedIndex].textContent.split(' (')[0].toLowerCase()) + ' yang dibutuhkan.</p>' +
      kv('Berat total', T.fmt(Math.round(r.beratKg)) + ' kg (' + r.beratTon.toFixed(2).replace('.', ',') + ' ton)') +
      kv('Karung 50 kg', T.fmt(r.karung50) + ' karung') +
      kv('Luas area', (pj * lb).toFixed(2).replace('.', ',') + ' m2') +
      '<p class="hint">Berat jenis di atas adalah angka umum. Pasir basah lebih berat dari pasir kering, dan kerikil beda ukuran beda beratnya. Pesan lebih 5 sampai 10% untuk tumpahan dan pemadatan.</p>');
  };
  [pjI, lbI, tbI, densI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau mengurug halaman, mengecor lantai, atau membuat jalan setapak? Masukkan ukuran areanya dan tebal lapisan, dan lihat berapa kubik pasir atau kerikil yang perlu dipesan.</p>'));
  root.appendChild(T.field('Jenis material', jenisSel));
  root.appendChild(T.grid2(
    T.field('Panjang area (m)', pjI),
    T.field('Lebar area (m)', lbI)
  ));
  root.appendChild(T.grid2(
    T.field('Tebal lapisan (cm)', tbI),
    T.field('Berat jenis (kg/m3)', densI, 'Terisi otomatis dari jenis material, bisa diubah')
  ));
  root.appendChild(box);
}
