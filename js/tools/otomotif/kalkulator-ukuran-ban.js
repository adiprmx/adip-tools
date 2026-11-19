import { h as T, utils, kv } from '../../core.js';

// Ukuran ban: dari kode 205/55 R16, tinggi dinding = lebar x aspek / 100,
// diameter = 2 x tinggi dinding + pelek x 25,4 mm, keliling = diameter x pi.
// Ganti ukuran mengubah diameter: speedometer membaca dari putaran roda,
// jadi bila diameter berubah, angka di speedometer meleset.
export function hitungBan(lebar, aspek, rim) {
  const l = Number(lebar);
  const a = Number(aspek);
  const r = Number(rim);
  if (![l, a, r].every(isFinite) || l <= 0 || a <= 0 || r <= 0) return null;
  const dinding = l * a / 100;
  const diameter = 2 * dinding + r * 25.4;
  return {
    dinding,
    diameter,
    keliling: diameter * Math.PI,
    putaranPerKm: 1000000 / (diameter * Math.PI),
  };
}
export function bandingBan(lama, baru) {
  const bLama = hitungBan(lama.lebar, lama.aspek, lama.rim);
  const bBaru = hitungBan(baru.lebar, baru.aspek, baru.rim);
  if (!bLama || !bBaru) return null;
  const selisihPersen = (bBaru.diameter - bLama.diameter) / bLama.diameter * 100;
  return {
    lama: bLama, baru: bBaru, selisihPersen,
    speedoPada100: 100 * bLama.diameter / bBaru.diameter,
    nyataPada100: 100 * bBaru.diameter / bLama.diameter,
  };
}
utils.ukuranBan = hitungBan;

export const meta = {"id": "kalkulator-ukuran-ban", "name": "Kalkulator Ukuran Ban", "cat": "otomotif", "icon": "🛞", "desc": "Bandingkan ukuran ban lama dan baru: diameter, keliling, dan efek ke speedometer.", "keywords": "ban,ukuran ban,pelek,velg,diameter,keliling,speedometer,205,ring,mobil,motor", "since": "6.18.0"};
export function render(root) {
  const lLebar = T.input('text', 'cth: 205', '205'); lLebar.inputMode = 'decimal';
  const lAspek = T.input('text', 'cth: 55', '55'); lAspek.inputMode = 'decimal';
  const lRim = T.input('text', 'cth: 16', '16'); lRim.inputMode = 'decimal';
  const bLebar = T.input('text', 'cth: 215', '215'); bLebar.inputMode = 'decimal';
  const bAspek = T.input('text', 'cth: 55', '55'); bAspek.inputMode = 'decimal';
  const bRim = T.input('text', 'cth: 16', '16'); bRim.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const lama = { lebar: T.num(lLebar.value), aspek: T.num(lAspek.value), rim: T.num(lRim.value) };
    const baru = { lebar: T.num(bLebar.value), aspek: T.num(bAspek.value), rim: T.num(bRim.value) };
    const semua = [lama.lebar, lama.aspek, lama.rim, baru.lebar, baru.aspek, baru.rim];
    if (!semua.every((x) => isFinite(x) && x > 0)) {
      T.show(box, '<div class="err">Semua ukuran ban harus diisi angka lebih dari 0.</div>');
      return;
    }
    const r = bandingBan(lama, baru);
    if (!r) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Cek lagi yang kamu isi.</div>'); return; }
    const persen = r.selisihPersen;
    const persenTeks = (persen > 0 ? '+' : '') + persen.toFixed(2).replace('.', ',') + '%';
    const peringatan = Math.abs(persen) > 3
      ? '<p class="warn">Selisih diameter lebih dari 3%. Ban sebesar ini bisa mentok ke bodi atau mengubah handling. Konsultasikan ke bengkel sebelum pasang.</p>'
      : Math.abs(persen) > 0.01
        ? '<p class="info">Selisih diameter masih dalam batas wajar (di bawah 3%), aman untuk pemakaian harian.</p>'
        : '<p class="info">Ukurannya sama persis, tidak ada yang berubah.</p>';
    T.show(box,
      '<div class="big">' + persenTeks + '</div>' +
      '<p class="center mut">Selisih diameter ban baru dibanding ban lama.</p>' +
      kv('Diameter ban lama', T.fmt(Math.round(r.lama.diameter)) + ' mm') +
      kv('Diameter ban baru', T.fmt(Math.round(r.baru.diameter)) + ' mm') +
      kv('Keliling ban baru', T.fmt(Math.round(r.baru.keliling)) + ' mm') +
      kv('Speedometer saat kecepatan asli 100 km/jam', r.speedoPada100.toFixed(1).replace('.', ',') + ' km/jam') +
      kv('Kecepatan asli saat speedometer 100 km/jam', r.nyataPada100.toFixed(1).replace('.', ',') + ' km/jam') +
      peringatan +
      '<p class="hint">Kode ban dibaca dari dinding ban, contoh 205/55 R16: lebar 205 mm, tinggi dinding 55% dari lebar, pelek 16 inci. Ban yang diameternya membesar membuat speedometer membaca lebih lambat dari kecepatan asli.</p>');
  };
  [lLebar, lAspek, lRim, bLebar, bAspek, bRim].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Mau ganti ke ban yang lebih lebar atau pelek yang lebih besar? Bandingkan dulu ukurannya, supaya tahu seberapa jauh diameter berubah dan seberapa meleset speedometermu.</p>'));
  root.appendChild(T.el('<p style="font-weight:600;margin:8px 0 0">Ban lama (yang terpasang sekarang)</p>'));
  root.appendChild(T.grid2(
    T.field('Lebar ban (mm)', lLebar),
    T.field('Aspek / tinggi dinding (%)', lAspek)
  ));
  root.appendChild(T.field('Diameter pelek (inci)', lRim));
  root.appendChild(T.el('<p style="font-weight:600;margin:8px 0 0">Ban baru (yang mau dipasang)</p>'));
  root.appendChild(T.grid2(
    T.field('Lebar ban (mm)', bLebar),
    T.field('Aspek / tinggi dinding (%)', bAspek)
  ));
  root.appendChild(T.field('Diameter pelek (inci)', bRim));
  root.appendChild(box);
  hitung();
}
