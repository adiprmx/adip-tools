import { h as T, utils, kv } from '../../core.js?v=6.3.0';

export const meta = {
  id: 'kalkulator-emas',
  name: 'Kalkulator Emas',
  cat: 'indonesia',
  icon: '🪙',
  desc: 'Hitung harga emas dari berat, atau berat emas dari budget-mu.',
  keywords: 'emas,harga emas,gram,logam mulia,antam,investasi',
};

export function render(root) {
  let harga = 1400000;
  try {
    const s = localStorage.getItem('kalkulator-emas-harga');
    if (s != null && T.num(s) > 0) harga = T.num(s);
  } catch (e) { /* abaikan */ }

  const hargaI = T.input('text', 'cth: 1400000', String(harga));
  hargaI.inputMode = 'decimal';

  const modeSel = T.select([
    ['gram-ke-rp', 'Berat (gram) → Harga (Rp)'],
    ['rp-ke-gram', 'Budget (Rp) → Dapat (gram)'],
  ], 'gram-ke-rp');

  const beratI = T.input('text', 'cth: 2,5 (bisa desimal)', '');
  beratI.inputMode = 'decimal';
  const budgetI = T.input('text', 'cth: 5000000', '');
  budgetI.inputMode = 'decimal';

  const box = T.out();

  const wrapBerat = T.field('Berat emas (gram)', beratI, 'Pakai koma untuk desimal, cth: 0,5 atau 2,5.');
  const wrapBudget = T.field('Budget (Rp)', budgetI, 'Uang yang mau dibelikan emas.');

  const hitung = () => {
    const h = T.num(hargaI.value);
    try { localStorage.setItem('kalkulator-emas-harga', String(h)); } catch (e) { /* abaikan */ }
    if (!(h > 0)) { T.show(box, '<p class="warn">Isi dulu harga emas per gramnya.</p>'); return; }

    if (modeSel.value === 'gram-ke-rp') {
      const g = T.num(beratI.value);
      if (!(g > 0)) { T.show(box, '<p class="warn">Isi dulu berat emasnya (gram).</p>'); return; }
      const total = g * h;
      T.show(box,
        '<div class="big center">' + T.rp(total) + '</div>' +
        '<p class="center mut">untuk ' + T.esc(String(g)) + ' gram emas</p>' +
        kv('Harga / gram', T.rp(h)) +
        kv('Berat', T.esc(String(g)) + ' gram') +
        kv('Total', '<b>' + T.rp(total) + '</b>') +
        '<p class="hint">Harga emas naik-turun tiap hari. Cek harga terkini di toko emas / aplikasi favoritmu sebelum beli.</p>');
    } else {
      const b = T.num(budgetI.value);
      if (!(b > 0)) { T.show(box, '<p class="warn">Isi dulu budget-mu (Rp).</p>'); return; }
      const g = b / h;
      const keping = Math.floor(g);
      T.show(box,
        '<div class="big center">' + g.toFixed(3) + ' <span class="mut" style="font-size:15px">gram</span></div>' +
        '<p class="center mut">emas yang bisa kamu dapat</p>' +
        kv('Budget', T.rp(b)) +
        kv('Harga / gram', T.rp(h)) +
        kv('Dapat', '<b>' + g.toFixed(3) + ' gram</b>') +
        '<p class="hint">Emas batangan dijual per keping (0,5 / 1 / 2 / 3 / 5 gram…). ' +
        'Keping bulat terbesar yang kebeli dengan budgetmu: <b>' +
        (keping >= 1 ? keping + ' gram ≈ ' + T.rp(keping * h) : '0,5 gram ≈ ' + T.rp(0.5 * h)) + '</b>.</p>');
    }
  };

  const aturMode = () => {
    wrapBerat.hidden = modeSel.value !== 'gram-ke-rp';
    wrapBudget.hidden = modeSel.value !== 'rp-ke-gram';
    hitung();
  };

  root.appendChild(T.el('<p class="note">Mau nabung emas? Hitung dulu di sini — dari berat ke harga, atau dari budget ke berat. Biar nggak kaget di depan etalase.</p>'));
  root.appendChild(T.field('Harga emas per gram (Rp)', hargaI, 'Default Rp1.400.000 — ganti sesuai harga hari ini.'));
  root.appendChild(T.field('Mode hitung', modeSel));
  root.appendChild(wrapBerat);
  root.appendChild(wrapBudget);
  root.appendChild(T.row(T.btn('Hitung', hitung, true)));
  root.appendChild(box);
  [hargaI, modeSel, beratI, budgetI].forEach((i) => {
    i.addEventListener('input', hitung);
    i.addEventListener('change', hitung);
  });
  modeSel.addEventListener('change', aturMode);
  aturMode();
}
