import { h as T, kv } from '../../core.js?v=6.2.0';

export const meta = {"id": "margin-markup", "name": "Margin vs Markup", "cat": "bisnis", "icon": "📊", "desc": "Bedain margin & markup, plus cari harga jual dari target.", "keywords": "margin,markup,modal,harga jual,profit,untung"};
export function render(root) {

    const modeSel = T.select([
      ['m1', 'Modal + harga jual → margin & markup'],
      ['m2', 'Modal + target margin → harga jual'],
      ['m3', 'Modal + target markup → harga jual']
    ], 'm1');
    const modalI = T.input('text', 'Modal, cth: 80000', '');
    const jualI = T.input('text', 'Harga jual, cth: 100000', '');
    const marginI = T.input('text', 'Target margin %, cth: 30', '');
    const markupI = T.input('text', 'Target markup %, cth: 40', '');
    const box = T.out();

    const calc = () => {
      const modal = T.num(modalI.value);
      if (!isFinite(modal) || modal <= 0) { T.toast('Isi modal yang valid dulu'); return; }
      if (modeSel.value === 'm1') {
        const jual = T.num(jualI.value);
        if (!isFinite(jual) || jual <= 0) { T.toast('Isi modal & harga jual yang valid'); return; }
        const untung = jual - modal;
        const margin = (untung / jual) * 100;
        const markup = (untung / modal) * 100;
        T.show(box,
          kv('Margin', margin.toFixed(1) + '%') +
          kv('Markup', markup.toFixed(1) + '%') +
          kv('Profit / pcs', T.rp(untung)) +
          '<p class="hint">Margin dibagi harga jual, markup dibagi modal — makanya markup selalu kelihatan lebih gede.</p>');
      } else if (modeSel.value === 'm2') {
        const mp = T.num(marginI.value);
        if (!isFinite(mp) || mp < 0 || mp >= 100) { T.toast('Isi modal & target margin yang valid (margin < 100%)'); return; }
        const jual = modal / (1 - mp / 100);
        T.show(box,
          '<div class="big center">' + T.rp(jual) + '</div>' +
          '<p class="center">harga jual biar margin ' + mp + '%</p>' +
          kv('Profit / pcs', T.rp(jual - modal)) +
          '<p class="hint">Rumus: modal ÷ (1 − margin). Ini cara yang bener — bukan modal + 30%.</p>');
      } else {
        const mk = T.num(markupI.value);
        if (!isFinite(mk) || mk < 0) { T.toast('Isi modal & target markup yang valid'); return; }
        const jual = modal * (1 + mk / 100);
        T.show(box,
          '<div class="big center">' + T.rp(jual) + '</div>' +
          '<p class="center">harga jual biar markup ' + mk + '%</p>' +
          kv('Profit / pcs', T.rp(jual - modal)) +
          '<p class="hint">Rumus: modal × (1 + markup). Ingat, markup ' + mk + '% ≠ margin ' + mk + '%.</p>');
      }
    };

    const toggle = () => {
      const v = modeSel.value;
      jualI.closest('.fld').style.display = v === 'm1' ? '' : 'none';
      marginI.closest('.fld').style.display = v === 'm2' ? '' : 'none';
      markupI.closest('.fld').style.display = v === 'm3' ? '' : 'none';
      T.hide(box);
    };
    modeSel.addEventListener('change', toggle);

    root.appendChild(T.el('<p class="note">Bedanya simpel: <b>margin</b> = untung ÷ harga jual, <b>markup</b> = untung ÷ modal. Contoh: modal Rp80.000, jual Rp100.000 → untung Rp20.000 → margin 20%, markup 25%. Beda pembaginya — itu aja.</p>'));
    root.appendChild(T.field('Mode', modeSel));
    root.appendChild(T.field('Modal (Rp)', modalI));
    root.appendChild(T.field('Harga jual (Rp)', jualI));
    root.appendChild(T.field('Target margin (%)', marginI));
    root.appendChild(T.field('Target markup (%)', markupI));
    root.appendChild(T.row(T.btn('Hitung', calc, true)));
    root.appendChild(box);
    toggle();

}
