import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-roe-roa", "name": "Kalkulator ROE & ROA", "cat": "bisnis", "icon": "📈", "desc": "Seberapa bagus perusahaan menghasilkan laba dari modal dan dari asetnya.", "keywords": "roe,roa,return on equity,return on assets,laba,ekuitas,profitabilitas", "since": "6.17.0"};

// ROE = laba bersih / ekuitas x 100%.
// ROA = laba bersih / total aset x 100%.
export function hitungRoeRoa(labaBersih, ekuitas, totalAset) {
  const laba = Number(labaBersih), e = Number(ekuitas), a = Number(totalAset);
  if (![laba, e, a].every(isFinite) || e <= 0 || a <= 0) return null;
  const roe = (laba / e) * 100;
  const roa = (laba / a) * 100;
  if (![roe, roa].every(isFinite)) return null;
  return { roe, roa };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const labaI = T.input('text', 'cth: 50000000000', '');
  const eI = T.input('text', 'cth: 300000000000', '');
  const aI = T.input('text', 'cth: 500000000000', '');
  const box = T.out();

  const hitung = () => {
    const laba = T.num(labaI.value);
    const e = T.num(eI.value);
    const a = T.num(aI.value);
    if (!isFinite(laba)) { T.show(box, '<div class="err">Laba bersih harus diisi angka. Boleh negatif kalau perusahaan rugi.</div>'); return; }
    if (!isFinite(e) || e <= 0) { T.show(box, '<div class="err">Total ekuitas harus diisi angka lebih dari 0.</div>'); return; }
    if (!isFinite(a) || a <= 0) { T.show(box, '<div class="err">Total aset harus diisi angka lebih dari 0.</div>'); return; }
    const hasil = hitungRoeRoa(laba, e, a);
    if (hasil === null) { T.show(box, '<div class="err">Angkanya terlalu besar untuk dihitung. Coba pakai angka yang lebih kecil.</div>'); return; }
    T.show(box,
      '<div class="big center">' + fmtPersen(hasil.roe) + '</div>' +
      '<p class="center">return on equity (ROE)</p>' +
      kv('Return on assets (ROA)', fmtPersen(hasil.roa)) +
      kv('Laba bersih', T.rp(laba)) +
      kv('Total ekuitas', T.rp(e)) +
      kv('Total aset', T.rp(a)) +
      '<p class="hint">ROE mengukur laba dari modal pemilik, ROA mengukur laba dari semua aset termasuk yang dibiayai utang. Kalau ROE jauh lebih tinggi dari ROA, perusahaan memakai banyak utang untuk mengungkit laba.</p>');
  };

  root.appendChild(T.el('<p class="note">ROE dan ROA mengukur seberapa bagus perusahaan mengubah modal dan aset jadi laba. Keduanya dari laporan keuangan tahun yang sama.</p>'));
  root.appendChild(T.field('Laba bersih setahun (Rp)', labaI, 'Laba bersih perusahaan dalam satu tahun. Boleh negatif kalau rugi.'));
  root.appendChild(T.field('Total ekuitas (Rp)', eI, 'Modal pemilik: total aset dikurangi total utang.'));
  root.appendChild(T.field('Total aset (Rp)', aI, 'Semua yang dimiliki perusahaan.'));
  root.appendChild(T.row(T.btn('Hitung ROE & ROA', hitung, true)));
  root.appendChild(box);
}
