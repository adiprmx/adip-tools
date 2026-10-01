import { h as T, utils } from '../../core.js?v=5.1.0';

utils.hargaJual = function (modal, marginPct) {
    modal = Number(modal); marginPct = Number(marginPct);
    if (!isFinite(modal) || !isFinite(marginPct) || modal < 0 || marginPct < 0 || marginPct >= 100) return NaN;
    return modal / (1 - marginPct / 100);
  };

utils.marginAktual = function (modal, jual) {
    modal = Number(modal); jual = Number(jual);
    if (!isFinite(modal) || !isFinite(jual) || jual <= 0) return NaN;
    return ((jual - modal) / jual) * 100;
  };

export const meta = {"id": "harga-jual", "name": "Kalkulator Harga Jual", "cat": "bisnis", "icon": "💰", "desc": "Modal + margin jadi harga jual."};

export function render(root) {

      const modeSel = T.select([['m1', 'Modal + margin → harga jual'], ['m2', 'Modal + harga jual → margin']], 'm1');
      const modalI = T.input('text', 'Modal, cth: 50000', '');
      const marginI = T.input('text', 'Target margin %, cth: 30', '');
      const jualI = T.input('text', 'Harga jual, cth: 75000', '');
      const box = T.out();

      function calc() {
        const modal = T.num(modalI.value);
        if (modeSel.value === 'm1') {
          const mp = T.num(marginI.value);
          const jual = utils.hargaJual(modal, mp);
          if (!isFinite(jual)) { T.toast('Isi modal & margin yang valid (margin < 100%)'); return; }
          T.show(box,
            `<div class="kv"><span>Harga jual</span><b>${T.rp(jual)}</b></div>` +
            `<div class="kv"><span>Profit per pcs</span><b>${T.rp(jual - modal)}</b></div>` +
            `<div class="kv"><span>Margin</span><b>${mp}% dari harga jual</b></div>`);
        } else {
          const jual = T.num(jualI.value);
          const mp = utils.marginAktual(modal, jual);
          if (!isFinite(mp)) { T.toast('Isi modal & harga jual yang valid'); return; }
          T.show(box,
            `<div class="kv"><span>Margin aktual</span><b>${mp.toFixed(1)}%</b></div>` +
            `<div class="kv"><span>Profit per pcs</span><b>${T.rp(jual - modal)}</b></div>`);
        }
      }

      function toggle() {
        const m1 = modeSel.value === 'm1';
        marginI.closest('.fld').style.display = m1 ? '' : 'none';
        jualI.closest('.fld').style.display = m1 ? 'none' : '';
        T.hide(box);
      }
      modeSel.addEventListener('change', toggle);

      root.appendChild(T.el('<p class="note">Margin dihitung <b>dari harga jual</b> (bukan dari modal), standar dagang yang bener.</p>'));
      root.appendChild(T.field('Mode', modeSel));
      root.appendChild(T.field('Modal (Rp)', modalI));
      root.appendChild(T.field('Target margin (%)', marginI));
      root.appendChild(T.field('Harga jual (Rp)', jualI));
      root.appendChild(T.btn('Hitung', calc, true));
      root.appendChild(box);
      toggle();
    
}
