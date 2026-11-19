import { h as T, utils } from '../../core.js';

export const meta = { id: 'elastisitas-harga', name: 'Kalkulator Elastisitas Harga', cat: 'pelajar', icon: '📈', desc: 'Hitung seberapa peka jumlah yang dibeli terhadap perubahan harga, dengan cara titik tengah dan cara sederhana.', keywords: 'elastisitas,harga,permintaan,ekonomi,midpoint,elastis,inelastis', since: '6.19.0' };

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// Elastisitas harga permintaan, cara titik tengah (arc):
// (% perubahan jumlah) / (% perubahan harga), memakai rata-rata sebagai dasar.
export function elastisitasMidpoint(p1, p2, q1, q2) {
  if (![p1, p2, q1, q2].every(Number.isFinite) || p1 <= 0 || p2 <= 0 || q1 < 0 || q2 < 0) return null;
  const dq = q2 - q1, dp = p2 - p1;
  const qTengah = (q1 + q2) / 2, pTengah = (p1 + p2) / 2;
  if (qTengah === 0 || dp === 0) return null;
  return n0((dq / qTengah) / (dp / pTengah));
}

// Cara sederhana (point): memakai nilai awal sebagai dasar.
export function elastisitasSederhana(p1, p2, q1, q2) {
  if (![p1, p2, q1, q2].every(Number.isFinite) || p1 <= 0 || q1 <= 0 || p2 <= 0 || q2 < 0) return null;
  if (p2 === p1) return null;
  return n0(((q2 - q1) / q1) / ((p2 - p1) / p1));
}

// Tafsir dari nilai mutlak elastisitas.
export function tafsirElastisitas(e) {
  const a = Math.abs(e);
  if (a > 1) return 'Elastis: pembeli peka terhadap harga. Harga naik sedikit, jumlah yang dibeli turun banyak.';
  if (a < 1) return 'Inelastis: pembeli tidak terlalu peka terhadap harga. Harga berubah, jumlah yang dibeli tidak banyak berubah.';
  return 'Elastisitas satuan: perubahan harga dan perubahan jumlah yang dibeli sebanding.';
}

const f = (x) => utils.fmtDes(x, 4);
const fp = (x) => utils.fmtDes(x * 100, 2) + '%';

export function render(root) {
  root.appendChild(T.el('<p class="hint">Elastisitas mengukur seberapa peka pembeli terhadap harga. Kalau harga naik 10% dan yang dibeli turun 20%, elastisitasnya 2 (elastis). Nilainya biasanya negatif karena harga naik membuat jumlah yang dibeli turun.</p>'));

  const p1I = T.input('number', 'cth: 10000', '10000');
  const p2I = T.input('number', 'cth: 12000', '12000');
  const q1I = T.input('number', 'cth: 100', '100');
  const q2I = T.input('number', 'cth: 80', '80');
  const box = T.out();

  function hitung() {
    const p1 = T.num(p1I.value), p2 = T.num(p2I.value);
    const q1 = T.num(q1I.value), q2 = T.num(q2I.value);
    if (![p1, p2, q1, q2].every(Number.isFinite) || p1 <= 0 || p2 <= 0 || q1 < 0 || q2 < 0) {
      T.show(box, '<p class="dim">Isi harga awal, harga baru (lebih dari 0), jumlah awal, dan jumlah baru (0 atau lebih).</p>');
      return;
    }
    if (p1 === p2) {
      T.show(box, '<p>Harga awal dan harga baru sama, jadi tidak ada perubahan harga yang bisa diukur.</p>');
      return;
    }
    const eMid = elastisitasMidpoint(p1, p2, q1, q2);
    const eSdr = elastisitasSederhana(p1, p2, q1, q2);
    const persenQ = (q2 - q1) / ((q1 + q2) / 2);
    const persenP = (p2 - p1) / ((p1 + p2) / 2);
    T.show(box,
      '<p class="big">Elastisitas (titik tengah) = ' + f(eMid) + '</p>' +
      '<p>' + tafsirElastisitas(eMid) + '</p>' +
      '<p class="hint"><b>Langkah (titik tengah):</b><br>' +
      'Perubahan jumlah: (' + T.fmt(q2) + ' − ' + T.fmt(q1) + ') ÷ ' + f((q1 + q2) / 2) + ' = ' + fp(persenQ) +
      '<br>Perubahan harga: (' + T.fmt(p2) + ' − ' + T.fmt(p1) + ') ÷ ' + f((p1 + p2) / 2) + ' = ' + fp(persenP) +
      '<br>Elastisitas = ' + fp(persenQ) + ' ÷ ' + fp(persenP) + ' = ' + f(eMid) + '</p>' +
      (eSdr != null ? '<p class="hint">Cara sederhana (pakai nilai awal sebagai dasar): ' + f(eSdr) + '. Cara titik tengah lebih sering dipakai di soal karena hasilnya sama walau arah perubahannya dibalik.</p>' : ''));
  }

  root.append(
    T.grid2(T.field('Harga awal (Rp)', p1I), T.field('Harga baru (Rp)', p2I)),
    T.grid2(T.field('Jumlah dibeli awal', q1I), T.field('Jumlah dibeli baru', q2I)),
    T.btn('Hitung', hitung, true),
    box,
  );
  hitung();
}
