import { h as T, utils, U, kv, money } from '../../core.js?v=6.2.0';

U.hitungPatungan = (total, pajakPct, servicePct, orang) => {
    total = +total || 0; pajakPct = +pajakPct || 0; servicePct = +servicePct || 0;
    orang = Math.max(1, Math.round(+orang) || 1);
    const pajak = total * pajakPct / 100;
    const service = total * servicePct / 100;
    const grandTotal = total + pajak + service;
    return { subtotal: total, pajak, service, grandTotal, perOrang: grandTotal / orang };
  };

export const meta = {"id": "patungan", "name": "Kalkulator Patungan", "cat": "indonesia", "icon": "🧾", "desc": "Split bill + pajak & service.", "keywords": "patungan,split,bill,bayar,bareng"};
export function render(root) {

    const total = money(null, 'cth: 150000'), pajak = money(null, 'cth: 10', '10'),
      svc = money(null, 'cth: 5', '5'), orang = T.input('number', 'cth: 4', '4');
    const bulat = T.select([['0', 'Tidak dibulatkan'], ['100', 'Ke atas ratusan terdekat'], ['1000', 'Ke atas ribuan terdekat']], '0');
    const box = T.out();
    const hitung = () => {
      const tot = T.num(total.value), pp = T.num(pajak.value) || 0, ps = T.num(svc.value) || 0;
      const n = Math.max(1, Math.round(T.num(orang.value)) || 1);
      if (!(tot > 0)) { T.show(box, '<p class="warn">Isi total tagihan dulu ya.</p>'); return; }
      const u = U.hitungPatungan(tot, pp, ps, n);
      let per = u.perOrang;
      const b = +bulat.value;
      if (b > 0) per = Math.ceil(per / b) * b;
      T.show(box,
        '<div class="big">' + T.rp(per) + ' <span class="mut" style="font-size:14px;font-weight:400">/ orang</span></div>' +
        kv('Subtotal', T.rp(u.subtotal)) +
        kv('Pajak (' + T.esc(String(pp)) + '%)', T.rp(u.pajak)) +
        kv('Service (' + T.esc(String(ps)) + '%)', T.rp(u.service)) +
        kv('Grand total', '<b>' + T.rp(u.grandTotal) + '</b>') +
        kv('Dibagi ' + n + ' orang', T.rp(u.perOrang) + (b > 0 ? ' → <b>' + T.rp(per) + '</b>' : '')) +
        (b > 0 ? '<p class="hint">Dibulatkan ke atas ke kelipatan Rp' + T.fmt(b) + '. Total terkumpul ' + T.rp(per * n) + '.</p>' : ''));
    };
    [total, pajak, svc, orang].forEach((i) => i.addEventListener('input', hitung));
    bulat.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Total tagihan', total, 'Sebelum pajak & service'),
      T.field('Pajak (%)', pajak),
      T.field('Service (%)', svc),
      T.field('Jumlah orang', orang)
    ));
    root.appendChild(T.field('Pembulatan', bulat, 'Biar gampang bayarnya, tanpa receh'));
    root.appendChild(T.row(T.btn('Hitung', hitung, true)));
    root.appendChild(box);
  
}
