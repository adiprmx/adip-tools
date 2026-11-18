import { h as T } from '../../core.js';

export const meta = { id: 'kalkulator-gradien-garis-slope', name: 'Kalkulator Gradien Garis (Slope)', cat: 'pelajar', icon: '📈', desc: 'Gradien garis dari dua titik, lengkap dengan persamaan garis dan gambar grafiknya.', keywords: 'gradien,slope,kemiringan garis,dua titik,persamaan garis,y=mx+c,matematika', since: '6.17.0' };

// Hitung gradien dari dua titik. Kembalikan { jenis, m, c, persamaan, langkah }.
// jenis: 'miring' | 'datar' | 'tegak' | 'sama' (dua titik sama).
export function hitungGradien(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return { jenis: 'sama', m: null, c: null, persamaan: null };
  if (dx === 0) return { jenis: 'tegak', m: null, c: null, persamaan: 'x = ' + fmtNum(x1) };
  const m = dy / dx;
  const c = y1 - m * x1;
  if (m === 0) return { jenis: 'datar', m: 0, c, persamaan: 'y = ' + fmtNum(c) };
  return { jenis: 'miring', m, c, persamaan: 'y = ' + fmtNum(m) + 'x' + (c === 0 ? '' : (c > 0 ? ' + ' + fmtNum(c) : ' − ' + fmtNum(Math.abs(c)))) };
}

function fmtNum(v) {
  if (!isFinite(v)) return 'di luar jangkauan';
  const r = Math.round(v * 10000) / 10000;
  return String(r).replace('.', ',');
}

export function render(root) {
  root.appendChild(T.el('<p class="hint">Masukkan dua titik, nanti ketahuan seberapa miring garis yang lewat kedua titik itu, plus persamaan dan gambarnya.</p>'));

  const x1 = T.input('number', 'x1', '1');
  const y1 = T.input('number', 'y1', '2');
  const x2 = T.input('number', 'x2', '4');
  const y2 = T.input('number', 'y2', '8');
  const box = T.out();

  function gambarGrafik(hasil, px1, py1, px2, py2) {
    const W = 340, H = 260, P = 28;
    const semuaX = [px1, px2, 0], semuaY = [py1, py2, 0];
    if (hasil.jenis === 'miring' || hasil.jenis === 'datar') {
      // Tambah ujung garis supaya garisnya kelihatan
      const xA = Math.min(...semuaX) - 1, xB = Math.max(...semuaX) + 1;
      semuaX.push(xA, xB);
      semuaY.push(hasil.m * xA + hasil.c, hasil.m * xB + hasil.c);
    }
    let minX = Math.min(...semuaX), maxX = Math.max(...semuaX);
    let minY = Math.min(...semuaY), maxY = Math.max(...semuaY);
    if (maxX - minX < 2) { maxX += 1; minX -= 1; }
    if (maxY - minY < 2) { maxY += 1; minY -= 1; }
    const sx = (v) => P + (v - minX) / (maxX - minX) * (W - 2 * P);
    const sy = (v) => H - P - (v - minY) / (maxY - minY) * (H - 2 * P);
    let garis = '';
    if (hasil.jenis === 'miring' || hasil.jenis === 'datar') {
      const xA = minX, xB = maxX;
      garis = '<line x1="' + sx(xA) + '" y1="' + sy(hasil.m * xA + hasil.c) + '" x2="' + sx(xB) + '" y2="' + sy(hasil.m * xB + hasil.c) + '" stroke="#ff6f61" stroke-width="2.5" />';
    } else if (hasil.jenis === 'tegak') {
      garis = '<line x1="' + sx(px1) + '" y1="' + P + '" x2="' + sx(px1) + '" y2="' + (H - P) + '" stroke="#ff6f61" stroke-width="2.5" />';
    }
    const sumbuX = minY <= 0 && maxY >= 0 ? '<line x1="' + P + '" y1="' + sy(0) + '" x2="' + (W - P) + '" y2="' + sy(0) + '" stroke="#5a5148" stroke-width="1" />' : '';
    const sumbuY = minX <= 0 && maxX >= 0 ? '<line x1="' + sx(0) + '" y1="' + P + '" x2="' + sx(0) + '" y2="' + (H - P) + '" stroke="#5a5148" stroke-width="1" />' : '';
    const titik = (x, y, label) => '<circle cx="' + sx(x) + '" cy="' + sy(y) + '" r="5" fill="#ffd166" stroke="#161311" stroke-width="1.5" /><text x="' + (sx(x) + 8) + '" y="' + (sy(y) - 8) + '" fill="#e8ded0" font-size="12">' + T.esc(label) + ' (' + fmtNum(x) + ', ' + fmtNum(y) + ')</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:420px;height:auto;display:block;background:#1e1a17;border:1px solid rgba(255,255,255,.12);border-radius:12px;margin-top:12px" role="img" aria-label="Grafik garis">' +
      sumbuX + sumbuY + garis + titik(px1, py1, 'A') + titik(px2, py2, 'B') + '</svg>';
  }

  function hitung() {
    const a = T.num(x1.value), b = T.num(y1.value), c2 = T.num(x2.value), d = T.num(y2.value);
    if ([a, b, c2, d].some((v) => !isFinite(v))) { T.toast('Isi keempat angka dulu, ya'); return; }
    const h = hitungGradien(a, b, c2, d);
    if (h.jenis === 'sama') { T.show(box, '<p>Kedua titiknya sama persis, jadi tidak ada garis yang bisa dibuat. Ubah salah satu titiknya.</p>'); return; }
    const dx = c2 - a, dy = d - b;
    let isi = '';
    if (h.jenis === 'tegak') {
      isi = '<p class="big">Garis tegak</p>' +
        '<p>Garisnya berdiri tegak lurus, jadi gradiennya tidak ada (pembaginya nol). Persamaan garisnya <b>' + T.esc(h.persamaan) + '</b>.</p>';
    } else {
      const arah = h.m > 0 ? 'naik ke kanan' : h.m < 0 ? 'turun ke kanan' : 'mendatar';
      isi = '<p class="big">Gradien: ' + fmtNum(h.m) + '</p>' +
        '<p>Persamaan garis: <b>' + T.esc(h.persamaan) + '</b></p>' +
        '<p class="hint">Garisnya ' + arah + '. Artinya, setiap geser 1 langkah ke kanan, garis ' + (h.m === 0 ? 'tetap di ketinggian yang sama' : (h.m > 0 ? 'naik ' : 'turun ') + fmtNum(Math.abs(h.m)) + ' langkah') + '.</p>' +
        '<p class="hint">Cara hitungnya: (' + fmtNum(d) + ' − ' + fmtNum(b) + ') ÷ (' + fmtNum(c2) + ' − ' + fmtNum(a) + ') = ' + fmtNum(dy) + ' ÷ ' + fmtNum(dx) + ' = ' + fmtNum(h.m) + '.</p>';
    }
    isi += gambarGrafik(h, a, b, c2, d);
    T.show(box, isi);
  }

  root.append(
    T.el('<p style="font-weight:700;margin:10px 0 2px">Titik pertama (A)</p>'),
    T.grid2(T.field('x1', x1), T.field('y1', y1)),
    T.el('<p style="font-weight:700;margin:10px 0 2px">Titik kedua (B)</p>'),
    T.grid2(T.field('x2', x2), T.field('y2', y2)),
    T.btn('Hitung gradien', hitung, true),
    box,
  );
}
