import { h as T, utils, kv } from '../../core.js';

// Berat baja dari volume x massa jenis 7.850 kg/m3.
// Besi beton (batang bulat): berat per meter = pi/4 x d^2 x 7.850,
// dengan d dalam meter. Besi D10 jadi 0,617 kg/m, D12 jadi 0,888 kg/m,
// D16 jadi 1,578 kg/m — cocok dengan tabel berat besi beton standar.
// Plat: panjang x lebar x tebal x 7.850. Pipa: pi/4 x (D^2 - d^2) x
// panjang x 7.850, dengan d = D - 2 x tebal dinding.
const RHO = 7850;
export function beratBesiBeton(dMm, panjangM, jumlah) {
  const d = Math.max(0, Number(dMm) || 0) / 1000;
  const L = Math.max(0, Number(panjangM) || 0);
  const n = Math.max(0, Number(jumlah) || 0);
  const perMeter = Math.PI / 4 * d * d * RHO;
  return { perMeter, perBatang: perMeter * L, total: perMeter * L * n };
}
export function beratPlat(pM, lM, tMm, jumlah) {
  const kg = Math.max(0, Number(pM) || 0) * Math.max(0, Number(lM) || 0) * Math.max(0, Number(tMm) || 0) / 1000 * RHO;
  return { perLembar: kg, total: kg * Math.max(0, Number(jumlah) || 0) };
}
export function beratPipa(dMm, tebalMm, panjangM, jumlah) {
  const D = Math.max(0, Number(dMm) || 0) / 1000;
  const t = Math.min(D / 2, Math.max(0, Number(tebalMm) || 0) / 1000);
  const d = D - 2 * t;
  const L = Math.max(0, Number(panjangM) || 0);
  const n = Math.max(0, Number(jumlah) || 0);
  const perMeter = Math.PI / 4 * (D * D - d * d) * RHO;
  return { perMeter, perBatang: perMeter * L, total: perMeter * L * n };
}
utils.beratBaja = beratBesiBeton;

export const meta = {"id": "kalkulator-berat-baja-besi-beton", "name": "Kalkulator Berat Baja/Besi Beton", "cat": "rumah", "icon": "🔩", "desc": "Berat besi beton, plat, dan pipa baja dari ukuran dan jumlahnya. Buat hitung kebutuhan material dan ongkos angkut.", "keywords": "baja,besi beton,rebar,berat,plat,pipa,d10,d12,tulangan,material,bangunan", "since": "6.19.0"};
export function render(root) {
  const modeSel = T.select([['beton', 'Besi beton (tulangan)'], ['plat', 'Plat baja'], ['pipa', 'Pipa baja']], 'beton');
  const dSel = T.select([['6', 'D6'], ['8', 'D8'], ['10', 'D10'], ['12', 'D12'], ['16', 'D16'], ['19', 'D19'], ['22', 'D22'], ['25', 'D25'], ['28', 'D28'], ['32', 'D32'], ['custom', 'Diameter lain']], '10');
  const dCustomI = T.input('text', 'cth: 13', ''); dCustomI.inputMode = 'decimal';
  const panjangI = T.input('text', 'cth: 12', '12'); panjangI.inputMode = 'decimal';
  const jumlahI = T.input('text', 'cth: 10', '10'); jumlahI.inputMode = 'decimal';
  const platPI = T.input('text', 'cth: 2,4', ''); platPI.inputMode = 'decimal';
  const platLI = T.input('text', 'cth: 1,2', ''); platLI.inputMode = 'decimal';
  const tebalI = T.input('text', 'cth: 3', ''); tebalI.inputMode = 'decimal';
  const box = T.out();
  const fldD = T.field('Diameter besi', dSel);
  const fldDCustom = T.field('Diameter lain (mm)', dCustomI);
  fldDCustom.hidden = true;
  const fldPanjang = T.field('Panjang per batang (meter)', panjangI, 'Besi beton umumnya dijual 12 meter per batang');
  const fldJumlah = T.field('Jumlah batang', jumlahI);
  const fldPlatP = T.field('Panjang plat (meter)', platPI);
  const fldPlatL = T.field('Lebar plat (meter)', platLI);
  const fldTebal = T.field('Tebal (mm)', tebalI);
  fldPlatP.hidden = true; fldPlatL.hidden = true; fldTebal.hidden = true;

  const atur = () => {
    const m = modeSel.value;
    fldD.hidden = m === 'plat';
    fldD.querySelector('label').textContent = m === 'pipa' ? 'Diameter luar pipa' : 'Diameter besi';
    fldDCustom.hidden = m === 'plat' || dSel.value !== 'custom';
    fldPanjang.hidden = m === 'plat';
    fldPlatP.hidden = m !== 'plat';
    fldPlatL.hidden = m !== 'plat';
    fldTebal.hidden = m === 'beton';
    fldJumlah.querySelector('label').textContent = m === 'plat' ? 'Jumlah lembar' : 'Jumlah batang';
    hitung();
  };
  modeSel.addEventListener('change', atur);
  dSel.addEventListener('change', atur);

  const hitung = () => {
    const m = modeSel.value;
    const jumlah = T.num(jumlahI.value) || 0;
    const f = (x) => T.fmt(Math.round(x * 100) / 100);
    if (m === 'plat') {
      const r = beratPlat(T.num(platPI.value), T.num(platLI.value), T.num(tebalI.value), jumlah);
      if (!(r.total > 0)) { T.hide(box); return; }
      T.show(box,
        '<div class="big">' + f(r.total) + ' kg</div>' +
        '<p class="center mut">Total berat plat baja.</p>' +
        kv('Berat per lembar', f(r.perLembar) + ' kg') +
        kv('Massa jenis baja', '7.850 kg/m³') +
        '<p class="hint">Plat baja standar umumnya 1,2 x 2,4 meter (4 x 8 kaki). Tebal plat diukur dalam milimeter.</p>');
      return;
    }
    const d = dSel.value === 'custom' ? (T.num(dCustomI.value) || 0) : Number(dSel.value);
    const L = T.num(panjangI.value) || 0;
    if (!(d > 0) || !(L > 0) || !(jumlah > 0)) { T.hide(box); return; }
    if (m === 'pipa') {
      const r = beratPipa(d, T.num(tebalI.value), L, jumlah);
      if (!(r.total > 0)) { T.hide(box); return; }
      T.show(box,
        '<div class="big">' + f(r.total) + ' kg</div>' +
        '<p class="center mut">Total berat pipa baja.</p>' +
        kv('Berat per meter', f(r.perMeter) + ' kg/m') +
        kv('Berat per batang', f(r.perBatang) + ' kg') +
        kv('Massa jenis baja', '7.850 kg/m³') +
        '<p class="hint">Tebal dinding pipa diukur dari luar ke dalam. Pipa galvanis sedikit lebih berat karena lapisan sengnya, selisihnya kecil.</p>');
      return;
    }
    const r = beratBesiBeton(d, L, jumlah);
    T.show(box,
      '<div class="big">' + f(r.total) + ' kg</div>' +
      '<p class="center mut">Total berat besi beton.</p>' +
      kv('Berat per meter', f(r.perMeter) + ' kg/m') +
      kv('Berat per batang (' + f(L) + ' m)', f(r.perBatang) + ' kg') +
      kv('Massa jenis baja', '7.850 kg/m³') +
      '<p class="hint">Besi beton dijual per batang 12 meter dan per kilogram. Pedoman umum: D10 = 0,62 kg/m, D12 = 0,89 kg/m, D16 = 1,58 kg/m. Berat asli bisa beda sedikit antar pabrik karena toleransi diameter.</p>');
  };
  [dSel, dCustomI, panjangI, jumlahI, platPI, platLI, tebalI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">Belanja besi buat bangun rumah? Hitung dulu beratnya supaya tahu kebutuhan material dan ongkos angkutnya.</p>'));
  root.appendChild(T.field('Jenis baja', modeSel));
  root.appendChild(fldD);
  root.appendChild(fldDCustom);
  root.appendChild(fldPlatP);
  root.appendChild(fldPlatL);
  root.appendChild(fldTebal);
  root.appendChild(fldPanjang);
  root.appendChild(fldJumlah);
  root.appendChild(box);
  hitung();
}
