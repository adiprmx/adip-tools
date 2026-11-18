import { h as T, kv } from '../../core.js';

export const meta = {"id": "kalkulator-ctr", "name": "Kalkulator CTR", "cat": "bisnis", "icon": "👆", "desc": "Click-through rate: berapa persen yang mengeklik setelah melihat iklan atau tautanmu.", "keywords": "ctr,click-through rate,klik,tayang,rasio klik,iklan", "since": "6.17.0"};

// CTR = klik / tayang x 100%.
export function hitungCTR(klik, tayang) {
  const k = Number(klik), t = Number(tayang);
  if (![k, t].every(isFinite) || k < 0 || t <= 0 || k > t) return null;
  const ctr = (k / t) * 100;
  return Number.isFinite(ctr) ? ctr : null;
}

const fmtPersen = (x) => x.toFixed(2).replace('.', ',') + '%';

export function render(root) {
  const kI = T.input('text', 'cth: 250', '');
  const tI = T.input('text', 'cth: 10000', '');
  const box = T.out();

  const hitung = () => {
    const k = T.num(kI.value);
    const t = T.num(tI.value);
    if (!isFinite(k) || k < 0) { T.show(box, '<div class="err">Jumlah klik harus diisi angka 0 atau lebih.</div>'); return; }
    if (!isFinite(t) || t <= 0) { T.show(box, '<div class="err">Jumlah tayang harus diisi angka lebih dari 0.</div>'); return; }
    if (k > t) { T.show(box, '<div class="err">Klik tidak bisa lebih banyak dari tayang.</div>'); return; }
    const ctr = hitungCTR(k, t);
    if (ctr === null) { T.show(box, '<div class="err">Angkanya tidak bisa dihitung. Periksa lagi isianmu.</div>'); return; }
    T.show(box,
      '<div class="big center">' + fmtPersen(ctr) + '</div>' +
      '<p class="center">click-through rate (CTR)</p>' +
      kv('Total klik', T.fmt(k)) +
      kv('Total tayang', T.fmt(t)) +
      kv('Dari 1.000 tayang', T.fmt(Math.round(ctr * 10)) + ' klik') +
      '<p class="hint">CTR rendah biasanya artinya gambar atau judul iklanmu kurang menarik, bukan produknya yang jelek. Coba ganti gambar dan kalimat pembukanya dulu.</p>');
  };

  root.appendChild(T.el('<p class="note">CTR mengukur seberapa menarik iklan atau tautanmu: dari semua orang yang melihatnya, berapa persen yang akhirnya mengeklik.</p>'));
  root.appendChild(T.field('Jumlah klik', kI, 'Berapa kali iklan atau tautan diklik.'));
  root.appendChild(T.field('Jumlah tayang', tI, 'Berapa kali iklan atau tautan tampil.'));
  root.appendChild(T.row(T.btn('Hitung CTR', hitung, true)));
  root.appendChild(box);
}
