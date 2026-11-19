import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-molaritas', name: 'Kalkulator Molaritas', cat: 'sains', icon: '🧪', desc: 'Molaritas larutan dari jumlah zat dan volume, atau balikannya: cari jumlah zat dan massa yang dibutuhkan.', keywords: 'molaritas,mol,konsentrasi,larutan,kimia,molar', since: '6.18.0' };

// Molaritas (mol/L) = mol zat / volume liter.
export function hitungMolaritas(mol, liter) {
  if (!(liter > 0) || !(mol >= 0)) return null;
  return mol / liter;
}

// Mol zat = molaritas x volume liter.
export function hitungMol(molaritas, liter) {
  if (!(liter > 0) || !(molaritas >= 0)) return null;
  return molaritas * liter;
}

// Massa (gram) = molaritas x volume liter x berat molekul (g/mol).
export function hitungMassa(molaritas, liter, mr) {
  if (!(liter > 0) || !(molaritas >= 0) || !(mr > 0)) return null;
  return molaritas * liter * mr;
}

function fmtDes(v, des) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const d = des == null ? 4 : des;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Molaritas itu seberapa pekat larutan: jumlah mol zat dalam tiap liter larutan. 1 M artinya 1 mol zat dalam 1 liter larutan.</p>'));

  const mode = T.select([
    ['molaritas', 'Cari molaritas (dari mol dan volume)'],
    ['mol', 'Cari jumlah mol (dari molaritas dan volume)'],
    ['massa', 'Cari massa zat (dari molaritas, volume, dan berat molekul)'],
  ], 'molaritas');
  const aI = T.input('text', 'cth: 0,5', '0.5'); aI.inputMode = 'decimal';
  const vI = T.input('text', 'cth: 250', '250'); vI.inputMode = 'decimal';
  const satuan = T.select([['ml', 'mL'], ['l', 'liter']], 'ml');
  const mrI = T.input('text', 'cth: 58,44 (NaCl)', '58.44'); mrI.inputMode = 'decimal';
  const box = T.out();

  const labelA = T.el('<div></div>');
  const wrapMr = T.el('<div></div>');
  wrapMr.appendChild(T.field('Berat molekul zat (g/mol)', mrI, 'Contoh: NaCl 58,44. Bisa dihitung di Kalkulator Berat Molekul.'));

  function aturTampil() {
    const m = mode.value;
    wrapMr.hidden = m !== 'massa';
    const label = m === 'molaritas' ? 'Jumlah zat (mol)' : 'Molaritas yang diinginkan (M)';
    labelA.innerHTML = '';
    labelA.appendChild(T.field(label, aI));
  }
  mode.addEventListener('change', aturTampil);
  aturTampil();

  function hitung() {
    const a = T.num(aI.value);
    const v = T.num(vI.value);
    if (!isFinite(a) || a < 0) { T.toast('Isi angka pertamanya dulu dengan angka 0 atau lebih'); return; }
    if (!isFinite(v) || v <= 0) { T.toast('Isi volumenya dulu dengan angka lebih dari 0'); return; }
    const liter = satuan.value === 'ml' ? v / 1000 : v;
    if (mode.value === 'molaritas') {
      const m = hitungMolaritas(a, liter);
      T.show(box,
        '<p class="big">' + fmtDes(m) + ' M</p>' +
        '<p>' + fmtDes(a) + ' mol zat dalam ' + fmtDes(v) + ' ' + (satuan.value === 'ml' ? 'mL' : 'liter') + ' larutan = ' + fmtDes(m) + ' mol per liter.</p>');
    } else if (mode.value === 'mol') {
      const mol = hitungMol(a, liter);
      T.show(box,
        '<p class="big">' + fmtDes(mol) + ' mol</p>' +
        '<p>Larutan ' + fmtDes(a) + ' M sebanyak ' + fmtDes(v) + ' ' + (satuan.value === 'ml' ? 'mL' : 'liter') + ' mengandung ' + fmtDes(mol) + ' mol zat.</p>');
    } else {
      const mr = T.num(mrI.value);
      if (!isFinite(mr) || mr <= 0) { T.toast('Isi berat molekulnya dulu dengan angka lebih dari 0'); return; }
      const g = hitungMassa(a, liter, mr);
      T.show(box,
        '<p class="big">' + fmtDes(g) + ' gram</p>' +
        '<p>Untuk membuat ' + fmtDes(v) + ' ' + (satuan.value === 'ml' ? 'mL' : 'liter') + ' larutan ' + fmtDes(a) + ' M, timbang ' + fmtDes(g) + ' gram zat (berat molekul ' + fmtDes(mr) + ' g/mol), lalu larutkan sampai volumenya pas.</p>');
    }
  }

  root.append(
    T.field('Yang mau dicari', mode),
    labelA,
    T.grid2(T.field('Volume larutan', vI), T.field('Satuan volume', satuan)),
    wrapMr,
    T.btn('Hitung', hitung, true),
    box,
  );
}
