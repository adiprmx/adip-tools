import { h as T, utils } from '../../core.js';

export const meta = {"id": "persentil-kuartil", "name": "Persentil & Kuartil", "cat": "pelajar", "icon": "📊", "desc": "Cari kuartil, persentil, dan rentang antar-kuartil dari deret angka, lengkap dengan diagram kotak.", "keywords": "persentil,kuartil,median,iqr,statistik,box plot,diagram kotak,data", "since": "6.19.0"};

const n0 = (v) => (Object.is(v, -0) ? 0 : v);

// parseDeret memakai utils.parseDeret (kanonis, G4 C1G4-R).
export const parseDeret = utils.parseDeret;

// Persentil dengan interpolasi linear (metode yang sama dengan Excel
// PERCENTILE.INC dan R tipe 7). data HARUS sudah terurut menaik.
export function persentil(urut, p) {
  if (!urut.length) return null;
  const n = urut.length;
  if (n === 1) return urut[0];
  const pp = Math.max(0, Math.min(100, p));
  const h = ((n - 1) * pp) / 100;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  if (lo === hi) return n0(urut[lo]);
  return n0(urut[lo] + (h - lo) * (urut[hi] - urut[lo]));
}

export function ringkasanKuartil(data) {
  if (!data.length) return null;
  const urut = data.slice().sort((a, b) => a - b);
  const q1 = persentil(urut, 25);
  const med = persentil(urut, 50);
  const q3 = persentil(urut, 75);
  return {
    n: data.length, urut,
    min: urut[0], maks: urut[urut.length - 1],
    q1, median: med, q3,
    iqr: n0(q3 - q1),
    p10: persentil(urut, 10), p90: persentil(urut, 90),
    rentang: n0(urut[urut.length - 1] - urut[0]),
  };
}

const fmt = (v) => T.fmt(n0(Number(utils.r4(v))));

function boxPlot(r) {
  // Diagram kotak horizontal sederhana (SVG).
  const W = 340, H = 64, pad = 8;
  const span = r.maks - r.min;
  const x = (v) => span === 0 ? W / 2 : pad + ((v - r.min) / span) * (W - pad * 2);
  const y = 30;
  return '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" style="display:block" role="img" aria-label="Diagram kotak">' +
    '<line x1="' + x(r.min) + '" y1="' + y + '" x2="' + x(r.maks) + '" y2="' + y + '" stroke="#8a7f6d" stroke-width="2"/>' +
    '<line x1="' + x(r.min) + '" y1="' + (y - 8) + '" x2="' + x(r.min) + '" y2="' + (y + 8) + '" stroke="#8a7f6d" stroke-width="2"/>' +
    '<line x1="' + x(r.maks) + '" y1="' + (y - 8) + '" x2="' + x(r.maks) + '" y2="' + (y + 8) + '" stroke="#8a7f6d" stroke-width="2"/>' +
    '<rect x="' + x(r.q1) + '" y="' + (y - 14) + '" width="' + Math.max(1, x(r.q3) - x(r.q1)) + '" height="28" fill="none" stroke="#f5f0e6" stroke-width="2"/>' +
    '<line x1="' + x(r.median) + '" y1="' + (y - 14) + '" x2="' + x(r.median) + '" y2="' + (y + 14) + '" stroke="#ff7a66" stroke-width="3"/>' +
    '<text x="' + x(r.min) + '" y="' + (H - 4) + '" font-size="10" fill="#8a7f6d" text-anchor="middle">' + T.esc(fmt(r.min)) + '</text>' +
    '<text x="' + x(r.q1) + '" y="' + (H - 4) + '" font-size="10" fill="#8a7f6d" text-anchor="middle">Q1</text>' +
    '<text x="' + x(r.median) + '" y="' + (H - 4) + '" font-size="10" fill="#ff7a66" text-anchor="middle">Median</text>' +
    '<text x="' + x(r.q3) + '" y="' + (H - 4) + '" font-size="10" fill="#8a7f6d" text-anchor="middle">Q3</text>' +
    '<text x="' + x(r.maks) + '" y="' + (H - 4) + '" font-size="10" fill="#8a7f6d" text-anchor="middle">' + T.esc(fmt(r.maks)) + '</text>' +
    '</svg>';
}

export function render(root) {
  const ta = T.ta(4, 'mis.\n7, 8, 9, 6, 10\natau pisahkan dengan spasi / enter', '1 2 3 4 5 6 7 8 9 10');
  const pI = T.input('number', 'Persentil yang dicari (0–100)', '90');
  const box = T.out();

  const hitung = () => {
    const data = parseDeret(ta.value);
    if (!data.length) {
      T.show(box, '<p class="dim">Isi deret angkanya dulu. Pisahkan dengan spasi, koma, atau enter.</p>');
      return;
    }
    const r = ringkasanKuartil(data);
    const p = Math.max(0, Math.min(100, T.num(pI.value) || 0));
    const pVal = persentil(r.urut, p);
    let h = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">';
    [['Q1 (25%)', r.q1], ['Median (Q2)', r.median], ['Q3 (75%)', r.q3], ['IQR (Q3 − Q1)', r.iqr]].forEach(([label, v]) => {
      h += '<div style="flex:1;min-width:70px;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.15);text-align:center"><div class="dim" style="font-size:11px">' + label + '</div><div style="font-size:19px;font-weight:700">' + fmt(v) + '</div></div>';
    });
    h += '</div>';
    h += boxPlot(r);
    h += '<div class="kv"><span class="k">Jumlah data</span><span class="v">' + r.n + ' angka</span></div>';
    h += '<div class="kv"><span class="k">Data terurut</span><span class="v">' + r.urut.map(fmt).join(', ') + '</span></div>';
    h += '<div class="kv"><span class="k">Nilai terkecil – terbesar</span><span class="v">' + fmt(r.min) + ' – ' + fmt(r.maks) + ' (rentang ' + fmt(r.rentang) + ')</span></div>';
    h += '<div class="kv"><span class="k">Persentil ke-10 (P10)</span><span class="v">' + fmt(r.p10) + '</span></div>';
    h += '<div class="kv"><span class="k">Persentil ke-90 (P90)</span><span class="v">' + fmt(r.p90) + '</span></div>';
    h += '<div class="kv"><span class="k">Persentil ke-' + p + '</span><span class="v"><b>' + fmt(pVal) + '</b></span></div>';
    h += '<p class="hint">Persentil ke-' + p + ' = ' + fmt(pVal) + ' artinya sekitar ' + p + '% datamu bernilai ' + fmt(pVal) + ' atau kurang. Kuartil membagi data jadi 4 bagian sama besar; IQR menunjukkan sebaran 50% data di tengah. Metode hitung: interpolasi linear (sama seperti Excel PERCENTILE.INC).</p>';
    T.show(box, h);
  };

  const tombol = T.btn('Hitung', hitung, true);
  ta.addEventListener('input', hitung);
  pI.addEventListener('input', hitung);

  root.appendChild(T.el('<p class="note">Tempel deret angkamu. Kuartil, persentil, dan diagram kotaknya langsung muncul.</p>'));
  root.appendChild(T.field('Deret angka', ta));
  root.appendChild(T.grid2(T.field('Persentil yang dicari (0–100)', pI)));
  root.appendChild(tombol);
  root.appendChild(box);
  hitung();
}
