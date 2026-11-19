import { h as T, utils } from '../../core.js';

export const meta = { id: 'barisan-bilangan', name: 'Kalkulator Barisan Bilangan', cat: 'pelajar', icon: '🔢', desc: 'Cari suku berikutnya dan jumlah barisan aritmetika atau geometri, lengkap dengan langkahnya.', keywords: 'barisan,aritmetika,geometri,suku,deret,matematika,urutan bilangan', since: '6.19.0' };

// Kebijakan -0 (D-G4-04): nol negatif tampil sebagai 0.
const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// Barisan aritmetika: suku ke-n = a1 + (n-1)d; jumlah = n/2 × (2a1 + (n-1)d).
export function aritmetika(a1, d, n) {
  const suku = [];
  for (let i = 0; i < n; i++) suku.push(n0(a1 + i * d));
  const sukuKeN = n0(a1 + (n - 1) * d);
  const jumlah = n0((n / 2) * (2 * a1 + (n - 1) * d));
  return { suku, sukuKeN, jumlah };
}

// Barisan geometri: suku ke-n = a1 × r^(n-1); jumlah = a1(r^n - 1)/(r - 1),
// r = 1 berarti semua suku sama.
export function geometri(a1, r, n) {
  const suku = [];
  for (let i = 0; i < n; i++) suku.push(n0(a1 * Math.pow(r, i)));
  const sukuKeN = n0(a1 * Math.pow(r, n - 1));
  let jumlah;
  if (r === 1) jumlah = a1 * n;
  else jumlah = (a1 * (Math.pow(r, n) - 1)) / (r - 1);
  return { suku, sukuKeN, jumlah: n0(jumlah) };
}

const fmtSuku = (x) => {
  if (!Number.isFinite(x)) return 'di luar jangkauan';
  return utils.fmtDes(x, 4);
};

export function render(root) {
  root.appendChild(T.el('<p class="hint">Barisan aritmetika bertambah dengan selisih tetap (misal 2, 5, 8, 11). Barisan geometri dikali dengan rasio tetap (misal 3, 6, 12, 24).</p>'));

  const jenis = T.select([
    ['aritmetika', 'Aritmetika (tambah tetap)'],
    ['geometri', 'Geometri (kali tetap)'],
  ], 'aritmetika');
  const a1I = T.input('number', 'cth: 2', '2');
  const bedaI = T.input('number', 'cth: 3', '3');
  const nI = T.input('number', 'cth: 10', '10');
  const box = T.out();

  const aturLabel = () => {
    const lbl = jenis.value === 'aritmetika' ? 'Selisih (beda)' : 'Rasio (pengali)';
    const f = bedaI.closest('.fld');
    if (f) { const l = f.querySelector('label'); if (l) l.textContent = lbl; }
  };
  jenis.addEventListener('change', () => { aturLabel(); hitung(); });

  function hitung() {
    const a1 = T.num(a1I.value);
    const beda = T.num(bedaI.value);
    const n = T.num(nI.value);
    if (!Number.isFinite(a1) || !Number.isFinite(beda) || !Number.isInteger(n) || n < 1 || n > 100) {
      T.show(box, '<p class="dim">Isi suku pertama, selisih/rasio, dan jumlah suku (1 sampai 100).</p>');
      return;
    }
    const hasil = jenis.value === 'aritmetika' ? aritmetika(a1, beda, n) : geometri(a1, beda, n);
    if (!hasil.suku.every(Number.isFinite) || !Number.isFinite(hasil.jumlah)) {
      T.show(box, '<p>Angkanya terlalu besar untuk dihitung. Coba rasio atau suku yang lebih kecil.</p>');
      return;
    }
    const rumus = jenis.value === 'aritmetika'
      ? 'Suku ke-n = ' + fmtSuku(a1) + ' + (' + n + ' − 1) × ' + fmtSuku(beda) + ' = ' + fmtSuku(hasil.sukuKeN) + '<br>Jumlah = ' + n + ' ÷ 2 × (2 × ' + fmtSuku(a1) + ' + (' + n + ' − 1) × ' + fmtSuku(beda) + ') = ' + fmtSuku(hasil.jumlah)
      : 'Suku ke-n = ' + fmtSuku(a1) + ' × ' + fmtSuku(beda) + '<sup>' + (n - 1) + '</sup> = ' + fmtSuku(hasil.sukuKeN) + '<br>Jumlah = ' + fmtSuku(a1) + ' × (' + fmtSuku(beda) + '<sup>' + n + '</sup> − 1) ÷ (' + fmtSuku(beda) + ' − 1) = ' + fmtSuku(hasil.jumlah);
    T.show(box,
      '<p class="big">Suku ke-' + n + ' = ' + fmtSuku(hasil.sukuKeN) + '</p>' +
      '<p class="big">Jumlah ' + n + ' suku = ' + fmtSuku(hasil.jumlah) + '</p>' +
      '<p style="word-break:break-all;line-height:1.9">' + hasil.suku.map(fmtSuku).join(', ') + '</p>' +
      '<p class="hint"><b>Langkah:</b><br>' + rumus + '</p>');
  }

  root.append(
    T.field('Jenis barisan', jenis),
    T.grid2(T.field('Suku pertama', a1I), T.field('Selisih (beda)', bedaI)),
    T.field('Jumlah suku yang mau dihitung', nI, 'Maksimal 100 suku.'),
    T.btn('Hitung', hitung, true),
    box,
  );
  aturLabel();
  hitung();
}
