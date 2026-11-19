import { h as T, utils } from '../../core.js';

export const meta = { id: 'kalkulator-regresi-linear', name: 'Kalkulator Regresi Linear', cat: 'pelajar', icon: '📈', desc: 'Garis lurus terbaik yang melewati data X dan Y, lengkap dengan persamaan garis, kekuatan hubungan, dan perkiraan nilai baru.', keywords: 'regresi,regresi linear,garis tren,kuadrat terkecil,prediksi,statistik', since: '6.18.0' };

// Regresi linear kuadrat terkecil: y = a + b*x.
// Mengembalikan null bila datanya tidak bisa dihitung.
export function hitungRegresi(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 3) return null;
  const n = x.length;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const meanX = sx / n, meanY = sy / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX, dy = y[i] - meanY;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  const b = sxy / sxx;
  const a = meanY - b * meanX;
  const r = sxy / Math.sqrt(sxx * syy);
  // Galat baku kemiringan + nilai p kemiringan (uji apakah kemiringan nyata).
  let sse = 0;
  for (let i = 0; i < n; i++) { const e = y[i] - (a + b * x[i]); sse += e * e; }
  const df = n - 2;
  const seB = Math.sqrt((sse / df) / sxx);
  const t = seB === 0 ? (b === 0 ? 0 : Infinity) : b / seB;
  const p = seB === 0 ? (b === 0 ? 1 : 0) : 2 * (1 - utils.tCDF(Math.abs(t), df));
  return { n, a, b, r, r2: r * r, seB, t, df, p, meanX, meanY };
}

export function prediksiRegresi(model, x) {
  return model.a + model.b * x;
}

// fmtDes/fmtP/bacaDeret kanonis tinggal di utils (core.js).

function gambarSebar(x, y, model) {
  const W = 340, H = 190, P = 26;
  const minX = Math.min.apply(null, x), maxX = Math.max.apply(null, x);
  const minY = Math.min.apply(null, y), maxY = Math.max.apply(null, y);
  const padX = (maxX - minX || 1) * 0.1, padY = (maxY - minY || 1) * 0.1;
  const x0 = minX - padX, x1 = maxX + padX, y0 = minY - padY, y1 = maxY + padY;
  const sx = (v) => P + (v - x0) / (x1 - x0) * (W - 2 * P);
  const sy = (v) => H - P - (v - y0) / (y1 - y0) * (H - 2 * P);
  let dots = '';
  for (let i = 0; i < x.length; i++) {
    dots += '<circle cx="' + sx(x[i]).toFixed(1) + '" cy="' + sy(y[i]).toFixed(1) + '" r="3.5" fill="#ff6f61" />';
  }
  const yA = model.a + model.b * x0, yB = model.a + model.b * x1;
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:420px;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin-top:12px" role="img" aria-label="Grafik sebar data dengan garis regresi">' +
    '<line x1="' + sx(x0).toFixed(1) + '" y1="' + sy(yA).toFixed(1) + '" x2="' + sx(x1).toFixed(1) + '" y2="' + sy(yB).toFixed(1) + '" stroke="#e8ded0" stroke-width="2" />' +
    dots +
    '<text x="' + (W / 2) + '" y="' + (H - 4) + '" fill="#a89c88" font-size="10" text-anchor="middle">X</text>' +
    '<text x="8" y="' + (H / 2) + '" fill="#a89c88" font-size="10" text-anchor="middle" transform="rotate(-90 8 ' + (H / 2) + ')">Y</text></svg>';
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Regresi linear mencari garis lurus yang paling dekat dengan semua titik datamu. Garis itu lalu bisa dipakai memperkirakan nilai Y untuk X yang baru.</p>'));

  const xI = T.ta(4, 'cth:\n1, 2, 3, 4, 5', '1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  const yI = T.ta(4, 'cth:\n2, 4, 5, 4, 5', '2.1, 3.9, 6.2, 7.8, 10.1, 12.3, 13.9, 16.2, 18.1, 20.0');
  const predI = T.input('text', 'cth: 11 (boleh kosong)', ''); predI.inputMode = 'decimal';
  const box = T.out();
  let modelTerakhir = null, xTerakhir = null, yTerakhir = null;

  function hitung() {
    const x = utils.bacaDeret(xI), y = utils.bacaDeret(yI);
    if (!x || !x.length) { T.toast('Isi deret X dulu dengan angka (pisahkan dengan koma atau enter)'); return; }
    if (!y || !y.length) { T.toast('Isi deret Y dulu dengan angka (pisahkan dengan koma atau enter)'); return; }
    if (x.length !== y.length) { T.toast('Jumlah angka X dan Y harus sama (' + x.length + ' lawan ' + y.length + ')'); return; }
    if (x.length < 3) { T.toast('Butuh minimal 3 pasang angka'); return; }
    const m = hitungRegresi(x, y);
    if (!m) { T.toast('Salah satu deret tidak berubah sama sekali, jadi garisnya tidak bisa dihitung'); return; }
    modelTerakhir = m; xTerakhir = x; yTerakhir = y;
    const tandaB = m.b >= 0 ? ' + ' : ' − ';
    let predHtml = '';
    const xp = T.num(predI.value);
    if (predI.value.trim() !== '') {
      if (!isFinite(xp)) { T.toast('Nilai X untuk perkiraan harus angka'); return; }
      predHtml = '<p>Perkiraan untuk X = ' + utils.fmtDes(xp) + ': Y = ' + utils.fmtDes(prediksiRegresi(m, xp)) + '.</p>';
    }
    T.show(box,
      '<p class="big">Y = ' + utils.fmtDes(m.a) + tandaB + utils.fmtDes(Math.abs(m.b)) + 'X</p>' +
      '<p>Kemiringan ' + utils.fmtDes(m.b) + ': tiap X naik 1, Y berubah ' + utils.fmtDes(m.b) + '. Titik potong ' + utils.fmtDes(m.a) + ': nilai Y saat X = 0.</p>' +
      '<p>Kekuatan hubungan r = ' + utils.fmtDes(m.r) + ', R² = ' + utils.fmtDes(m.r2) + ' (sekitar ' + utils.fmtDes(m.r2 * 100, 1) + '% perubahan Y dijelaskan garis ini). Nilai p kemiringan = ' + utils.fmtP(m.p) + (m.p < 0.05 ? ', di bawah 0,05, jadi kemiringannya nyata.' : ', di atas 0,05, jadi belum cukup bukti kemiringannya nyata.') + '</p>' +
      predHtml +
      '<p class="hint">Dari ' + m.n + ' pasang angka. Perkiraan di luar rentang data X (' + utils.fmtDes(Math.min.apply(null, x)) + ' sampai ' + utils.fmtDes(Math.max.apply(null, x)) + ') kurang bisa dipegang.</p>' +
      gambarSebar(x, y, m));
  }

  root.append(
    T.field('Deret X', xI),
    T.field('Deret Y', yI),
    T.field('Perkirakan Y untuk X (opsional)', predI, 'Isi angka X yang baru kalau mau tahu perkiraan Y-nya.'),
    T.btn('Hitung regresi', hitung, true),
    box,
  );
}
