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

// Varian saldo rata-rata (praktik standar laporan keuangan: laba setahun
// penuh dibagi rata-rata saldo awal & akhir tahun, bukan saldo akhir saja).
// Mengembalikan rasio + saldo rata-rata yang dipakai.
export function hitungRoeRoaRataRata(labaBersih, ekuitasAwal, ekuitasAkhir, asetAwal, asetAkhir) {
  const laba = Number(labaBersih);
  const eAwal = Number(ekuitasAwal), eAkhir = Number(ekuitasAkhir);
  const aAwal = Number(asetAwal), aAkhir = Number(asetAkhir);
  if (![laba, eAwal, eAkhir, aAwal, aAkhir].every(isFinite)) return null;
  if (eAwal < 0 || eAkhir < 0 || aAwal < 0 || aAkhir < 0) return null;
  const eRata = (eAwal + eAkhir) / 2;
  const aRata = (aAwal + aAkhir) / 2;
  if (eRata <= 0 || aRata <= 0) return null;
  const hasil = hitungRoeRoa(laba, eRata, aRata);
  if (hasil === null) return null;
  return { ...hasil, ekuitasRata: eRata, asetRata: aRata };
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const modeS = T.select([
    ['akhir', 'Saldo akhir periode (sederhana)'],
    ['rata', 'Saldo rata-rata awal & akhir (standar laporan keuangan)'],
  ], 'akhir');
  const labaI = T.input('text', 'cth: 50000000000', '');
  const eI = T.input('text', 'cth: 300000000000', '');
  const aI = T.input('text', 'cth: 500000000000', '');
  const eAwalI = T.input('text', 'cth: 280000000000', '');
  const eAkhirI = T.input('text', 'cth: 320000000000', '');
  const aAwalI = T.input('text', 'cth: 470000000000', '');
  const aAkhirI = T.input('text', 'cth: 530000000000', '');
  const box = T.out();

  const fldE = T.field('Total ekuitas (Rp)', eI, 'Modal pemilik: total aset dikurangi total utang.');
  const fldA = T.field('Total aset (Rp)', aI, 'Semua yang dimiliki perusahaan.');
  const grupRata = T.el('<div></div>');
  grupRata.appendChild(T.grid2(
    T.field('Ekuitas awal tahun (Rp)', eAwalI, 'Saldo di awal tahun laporan.'),
    T.field('Ekuitas akhir tahun (Rp)', eAkhirI, 'Saldo di akhir tahun laporan.')
  ));
  grupRata.appendChild(T.grid2(
    T.field('Total aset awal tahun (Rp)', aAwalI, 'Saldo di awal tahun laporan.'),
    T.field('Total aset akhir tahun (Rp)', aAkhirI, 'Saldo di akhir tahun laporan.')
  ));
  grupRata.hidden = true;

  const aturMode = () => {
    const rata = modeS.value === 'rata';
    fldE.hidden = rata;
    fldA.hidden = rata;
    grupRata.hidden = !rata;
    hitung();
  };
  modeS.addEventListener('change', aturMode);

  const hitung = () => {
    const laba = T.num(labaI.value);
    if (!isFinite(laba)) { T.show(box, '<div class="err">Laba bersih harus diisi angka. Boleh negatif kalau perusahaan rugi.</div>'); return; }
    if (modeS.value === 'rata') {
      const eAwal = T.num(eAwalI.value), eAkhir = T.num(eAkhirI.value);
      const aAwal = T.num(aAwalI.value), aAkhir = T.num(aAkhirI.value);
      if (![eAwal, eAkhir, aAwal, aAkhir].every((v) => isFinite(v) && v >= 0)) {
        T.show(box, '<div class="err">Semua saldo awal & akhir harus diisi angka 0 atau lebih.</div>'); return;
      }
      const hasil = hitungRoeRoaRataRata(laba, eAwal, eAkhir, aAwal, aAkhir);
      if (hasil === null) { T.show(box, '<div class="err">Saldo rata-rata harus lebih dari 0 — isi saldo awal atau akhirnya.</div>'); return; }
      T.show(box,
        '<div class="big center">' + fmtPersen(hasil.roe) + '</div>' +
        '<p class="center">return on equity (ROE) — saldo rata-rata</p>' +
        kv('Return on assets (ROA)', fmtPersen(hasil.roa)) +
        kv('Laba bersih', T.rp(laba)) +
        kv('Ekuitas rata-rata', T.rp(hasil.ekuitasRata) + ' <span class="dim">(awal ' + T.rp(eAwal) + ' + akhir ' + T.rp(eAkhir) + ') ÷ 2</span>') +
        kv('Aset rata-rata', T.rp(hasil.asetRata) + ' <span class="dim">(awal ' + T.rp(aAwal) + ' + akhir ' + T.rp(aAkhir) + ') ÷ 2</span>') +
        '<p class="hint">ROE mengukur laba dari modal pemilik, ROA mengukur laba dari semua aset termasuk yang dibiayai utang. Saldo rata-rata dipakai karena laba dikumpulkan sepanjang tahun, jadi pembaginya juga harus mewakili sepanjang tahun. Kalau ROE jauh lebih tinggi dari ROA, perusahaan memakai banyak utang untuk mengungkit laba.</p>');
      return;
    }
    const e = T.num(eI.value);
    const a = T.num(aI.value);
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
      '<p class="hint">ROE mengukur laba dari modal pemilik, ROA mengukur laba dari semua aset termasuk yang dibiayai utang. Kalau ROE jauh lebih tinggi dari ROA, perusahaan memakai banyak utang untuk mengungkit laba. Laporan keuangan umumnya memakai saldo rata-rata awal & akhir tahun — pilih mode itu di atas bila kamu punya kedua saldonya.</p>');
  };

  // Hitung-live (Q4 v6.21.0): hasil ikut berubah saat mengetik.
  [labaI, eI, aI, eAwalI, eAkhirI, aAwalI, aAkhirI].forEach((i) => i.addEventListener('input', hitung));

  root.appendChild(T.el('<p class="note">ROE dan ROA mengukur seberapa bagus perusahaan mengubah modal dan aset jadi laba. Keduanya dari laporan keuangan tahun yang sama.</p>'));
  root.appendChild(T.field('Cara hitung saldo', modeS, 'Saldo akhir lebih gampang; saldo rata-rata lebih tepat karena laba dikumpulkan sepanjang tahun.'));
  root.appendChild(T.field('Laba bersih setahun (Rp)', labaI, 'Laba bersih perusahaan dalam satu tahun. Boleh negatif kalau rugi.'));
  root.appendChild(fldE);
  root.appendChild(fldA);
  root.appendChild(grupRata);
  root.appendChild(T.row(T.btn('Hitung ROE & ROA', hitung, true)));
  root.appendChild(box);
}
