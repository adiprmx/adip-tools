import { h as T, utils, kv } from '../../core.js?v=6.5.0';

export const meta = {
  id: 'kalkulator-komisi',
  name: 'Kalkulator Komisi',
  cat: 'bisnis',
  icon: '🤝',
  desc: 'Hitung komisi bertingkat (marginal): makin gede omzet, makin gede persennya.',
  keywords: 'komisi,bonus,sales,tier,omzet,insentif,marketing',
};

export function render(root) {
  // Tier: [batas atas (Rp), persen]. Tier terakhir = "di atas batas".
  const b1 = T.input('text', 'cth: 50000000', '50000000');
  const p1 = T.input('number', 'cth: 5', '5');
  const b2 = T.input('text', 'cth: 100000000', '100000000');
  const p2 = T.input('number', 'cth: 7', '7');
  const p3 = T.input('number', 'cth: 10', '10');
  [b1, b2].forEach((i) => { i.inputMode = 'decimal'; });
  [p1, p2, p3].forEach((i) => { i.min = '0'; i.max = '100'; i.step = '0.5'; i.style.maxWidth = '92px'; });

  const omzetI = T.input('text', 'cth: 75000000', '');
  omzetI.inputMode = 'decimal';
  const box = T.out();

  const hitung = () => {
    const omzet = T.num(omzetI.value);
    if (!(omzet > 0)) { T.show(box, '<p class="warn">Isi dulu omzetnya (Rp).</p>'); return; }
    const bb1 = T.num(b1.value), bb2 = T.num(b2.value);
    const pp1 = T.num(p1.value) || 0, pp2 = T.num(p2.value) || 0, pp3 = T.num(p3.value) || 0;
    if (!(bb1 > 0) || !(bb2 > bb1)) {
      T.show(box, '<p class="warn">Batas tier-nya belum bener: batas 2 harus lebih besar dari batas 1, dan dua-duanya di atas 0.</p>');
      return;
    }

    // Marginal: tiap tier cuma "makan" porsi omzet di rentangnya sendiri.
    const t1 = Math.min(omzet, bb1);
    const t2 = Math.min(Math.max(omzet - bb1, 0), bb2 - bb1);
    const t3 = Math.max(omzet - bb2, 0);
    const k1 = t1 * pp1 / 100, k2 = t2 * pp2 / 100, k3 = t3 * pp3 / 100;
    const total = k1 + k2 + k3;
    const efektif = (total / omzet) * 100;

    const baris = (rentang, porsi, pct, kom) =>
      kv(rentang + ' <span class="mut">(' + T.esc(String(pct)) + '%)</span>',
        T.rp(porsi) + ' → <b>' + T.rp(kom) + '</b>');

    T.show(box,
      '<div class="big center">' + T.rp(total) + '</div>' +
      '<p class="center mut">total komisi (' + efektif.toFixed(2) + '% efektif dari omzet)</p>' +
      baris('Rp0 – ' + T.rp(bb1), t1, pp1, k1) +
      baris(T.rp(bb1) + ' – ' + T.rp(bb2), t2, pp2, k2) +
      baris('Di atas ' + T.rp(bb2), t3, pp3, k3) +
      kv('Omzet', T.rp(omzet)) +
      kv('Total komisi', '<b>' + T.rp(total) + '</b>') +
      kv('% efektif', efektif.toFixed(2) + '%') +
      '<p class="hint">Komisi dihitung marginal: omzet Rp75jt dengan tier di atas = 5% × Rp50jt + 7% × Rp25jt. ' +
      'Bukan 7% flat atas semuanya — itu namanya tekor bandar.</p>');
  };

  const tierRow = (label, batasI, pctI, tail) => {
    const w = T.el('<div class="row" style="align-items:center;margin-bottom:6px"></div>');
    w.appendChild(T.el('<span style="font-size:14px;min-width:150px">' + T.esc(label) + '</span>'));
    if (batasI) { batasI.style.flex = '1'; w.appendChild(batasI); }
    else w.appendChild(T.el('<span style="flex:1"></span>'));
    w.appendChild(pctI);
    w.appendChild(T.el('<span class="mut" style="font-size:14px">%</span>'));
    if (tail) w.appendChild(T.el('<span class="mut" style="font-size:12px">' + T.esc(tail) + '</span>'));
    return w;
  };

  root.appendChild(T.el('<p class="note">Skema komisi yang adil itu bertingkat: makin gede omzet yang kamu bawa, makin gede persen yang kamu kantongi. Atur batas & persen tiap tier sesukamu.</p>'));
  root.appendChild(T.el('<div class="fld"><label>Tier komisi (editable)</label></div>'));
  root.appendChild(tierRow('Tier 1: Rp0 s.d.', b1, p1));
  root.appendChild(tierRow('Tier 2: s.d.', b2, p2));
  root.appendChild(tierRow('Tier 3: di atasnya', null, p3, 'tanpa batas atas'));
  root.appendChild(T.field('Omzet (Rp)', omzetI, 'Total penjualan yang jadi dasar komisi.'));
  root.appendChild(T.row(T.btn('Hitung Komisi', hitung, true)));
  root.appendChild(box);
  [b1, p1, b2, p2, p3, omzetI].forEach((i) => i.addEventListener('input', hitung));
}
