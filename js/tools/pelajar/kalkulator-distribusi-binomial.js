import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-distribusi-binomial', name: 'Kalkulator Distribusi Binomial', cat: 'pelajar', icon: '🎲', desc: 'Peluang dapat sekian berhasil dari sekian percobaan, plus rata-rata, sebaran, dan tabel lengkap tiap kemungkinan.', keywords: 'binomial,distribusi binomial,peluang,probabilitas,percobaan,statistik', since: '6.18.0' };

// kombinasi / binomialPMF / binomialCDF kanonis tinggal di utils (core.js).

// Ringkasan distribusi: PMF, CDF dua arah, rata-rata, varians, simpangan baku.
export function hitungBinomial(n, p, k) {
  return {
    tepat: utils.binomialPMF(n, k, p),
    palingBanyak: utils.binomialCDF(n, k, p),
    palingSedikit: 1 - utils.binomialCDF(n, k - 1, p),
    rata: n * p,
    varians: n * p * (1 - p),
    sd: Math.sqrt(n * p * (1 - p)),
  };
}

// Tabel distribusi lengkap (k = 0..n) untuk n kecil.
export function tabelBinomial(n, p) {
  const rows = [];
  for (let k = 0; k <= n; k++) rows.push({ k, pmf: utils.binomialPMF(n, k, p) });
  return rows;
}

function fmtP(p) {
  if (!isFinite(p)) return 'di luar jangkauan';
  return String(Math.round(p * 1000000) / 10000).replace('.', ',') + '%';
}
function fmtDes(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  return String(Math.round(v * 10000) / 10000).replace('.', ',');
}

function gambarBatang(rows) {
  const W = 340, H = 150, P = 14;
  const maks = Math.max.apply(null, rows.map((r) => r.pmf));
  const bw = (W - 2 * P) / rows.length;
  let bars = '';
  rows.forEach((r, i) => {
    const h = maks > 0 ? r.pmf / maks * (H - 2 * P - 14) : 0;
    bars += '<rect x="' + (P + i * bw + 1).toFixed(1) + '" y="' + (H - P - 14 - h).toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="#ff6f61" rx="1" />';
  });
  let labels = '';
  rows.forEach((r, i) => {
    if (rows.length <= 16 || i % Math.ceil(rows.length / 8) === 0) {
      labels += '<text x="' + (P + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 2) + '" fill="#a89c88" font-size="9" text-anchor="middle">' + r.k + '</text>';
    }
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:420px;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin-top:12px" role="img" aria-label="Grafik batang distribusi binomial">' +
    bars + labels +
    '<text x="' + (W / 2) + '" y="10" fill="#a89c88" font-size="9" text-anchor="middle">jumlah berhasil (k)</text></svg>';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Binomial itu soal percobaan yang diulang: tiap percobaan cuma ada berhasil atau gagal, dan peluang berhasilnya sama tiap kali. Contoh: lempar koin 10 kali, berapa peluang dapat tepat 5 gambar?</p>'));

  const nI = T.input('number', 'cth: 10', '10');
  const pI = T.input('text', 'cth: 0,5 atau 50%', '0.5'); pI.inputMode = 'decimal';
  const kI = T.input('number', 'cth: 5', '5');
  const box = T.out();

  function hitung() {
    const n = T.num(nI.value), k = T.num(kI.value);
    let p = T.num(pI.value.replace('%', ''));
    if (!Number.isInteger(n) || n < 1 || n > 1000) { T.toast('Jumlah percobaan harus bilangan bulat 1 sampai 1000'); return; }
    if (!isFinite(p)) { T.toast('Isi peluang berhasilnya dulu'); return; }
    if (p > 1 && p <= 100) p = p / 100;
    if (p < 0 || p > 1) { T.toast('Peluang berhasil harus antara 0 dan 1 (atau 0% sampai 100%)'); return; }
    if (!Number.isInteger(k) || k < 0 || k > n) { T.toast('Jumlah berhasil harus bilangan bulat 0 sampai ' + n); return; }
    const h = hitungBinomial(n, p, k);
    let html =
      '<p class="big">Tepat ' + k + ' berhasil: ' + fmtP(h.tepat) + '</p>' +
      '<p>Paling banyak ' + k + ' berhasil: ' + fmtP(h.palingBanyak) + '. Paling sedikit ' + k + ' berhasil: ' + fmtP(h.palingSedikit) + '.</p>' +
      '<p>Rata-rata berhasil yang diharapkan: ' + fmtDes(h.rata) + ' dari ' + n + ' percobaan. Varians: ' + fmtDes(h.varians) + '. Simpangan baku: ' + fmtDes(h.sd) + '.</p>' +
      '<p class="hint">Kombinasi C(' + n + ',' + k + ') = ' + T.fmt(utils.kombinasi(n, k)) + ' cara.</p>';
    if (n <= 30) {
      const rows = tabelBinomial(n, p);
      html += gambarBatang(rows);
      html += '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Berhasil (k)</th><th style="text-align:right;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.15)">Peluang</th></tr></thead><tbody>' +
        rows.map((r) => '<tr' + (r.k === k ? ' style="background:rgba(255,111,97,.12)"' : '') + '><td style="padding:5px 8px">' + r.k + '</td><td style="text-align:right;padding:5px 8px">' + fmtP(r.pmf) + '</td></tr>').join('') +
        '</tbody></table>';
    } else {
      html += '<p class="hint">Tabel lengkap ditampilkan bila jumlah percobaan 30 atau kurang.</p>';
    }
    T.show(box, html);
  }

  root.append(
    T.field('Jumlah percobaan (n)', nI),
    T.field('Peluang berhasil tiap percobaan (p)', pI, 'Angka 0 sampai 1, atau persen. Contoh koin: 0,5.'),
    T.field('Jumlah berhasil yang dicari (k)', kI),
    T.btn('Hitung peluang', hitung, true),
    box,
  );
}
