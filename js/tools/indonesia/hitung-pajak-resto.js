import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "hitung-pajak-resto", "name": "Pajak Resto", "cat": "indonesia", "icon": "🍽️", "desc": "Hitung total bayar makan di resto + split bill patungan.", "keywords": "pajak,resto,restoran,split bill,patungan,service charge,tagihan"};

export function render(root) {
  const K = 'tool:hitung-pajak-resto';
  const load = () => { try { return JSON.parse(localStorage.getItem(K) || '{}'); } catch (e) { return {}; } };
  const sv = load();
  const save = () => { try { localStorage.setItem(K, JSON.stringify({ s: strukI.value, p: pajakI.value, c: serviceI.value, o: orangI.value })); } catch (e) {} };

  root.appendChild(T.el('<p class="hint">Total di struk jarang sama kayak yang dibayar — pajak 10% + service charge bikin melar. Hitung dulu di sini, biar patungannya nggak salah.</p>'));

  const strukI = T.input('text', 'Contoh: 350000', sv.s || '');
  const pajakI = T.input('text', 'Contoh: 10', sv.p || '10');
  const serviceI = T.input('text', 'Contoh: 5', sv.c || '5');
  const orangI = T.input('text', 'Contoh: 4', sv.o || '1');

  root.appendChild(T.field('Total di struk (Rp)', strukI, 'Sebelum pajak & service charge.'));
  root.appendChild(T.grid2(
    T.field('Pajak (%)', pajakI, 'Umumnya 10%.'),
    T.field('Service charge (%)', serviceI, 'Umumnya 5%.')
  ));
  root.appendChild(T.field('Patungan berapa orang?', orangI, 'Dibagi rata per orang.'));

  const box = T.out();
  root.appendChild(box);

  const hitung = () => {
    save();
    const struk = T.num(strukI.value);
    const pj = T.num(pajakI.value);
    const sc = T.num(serviceI.value);
    const org = Math.max(1, Math.floor(T.num(orangI.value) || 1));
    if (isNaN(struk) || struk < 0) { T.show(box, '<p class="mut center">Isi dulu total struknya.</p>'); return; }
    const pajak = struk * (isNaN(pj) ? 0 : pj) / 100;
    const service = struk * (isNaN(sc) ? 0 : sc) / 100;
    const total = struk + pajak + service;
    const perOrang = total / org;
    T.show(box,
      '<div class="big center">' + T.rp(total) + '</div>' +
      '<p class="center mut">total yang harus dibayar</p>' +
      '<div class="kv"><span class="k">Pajak (' + (isNaN(pj) ? 0 : pj) + '%)</span><span class="v">' + T.rp(pajak) + '</span></div>' +
      '<div class="kv"><span class="k">Service (' + (isNaN(sc) ? 0 : sc) + '%)</span><span class="v">' + T.rp(service) + '</span></div>' +
      '<div class="kv"><span class="k">Dibagi ' + org + ' orang</span><span class="v">' + T.rp(perOrang) + ' / orang</span></div>'
    );
  };
  [strukI, pajakI, serviceI, orangI].forEach((i) => i.addEventListener('input', hitung));
  hitung();
}
