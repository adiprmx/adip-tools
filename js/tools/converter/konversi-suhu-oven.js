import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "konversi-suhu-oven", "name": "Suhu Oven", "cat": "converter", "icon": "🔥", "desc": "Konversi suhu oven °C/°F/Gas Mark.", "keywords": "oven,suhu,gas mark,masak,resep"};
export function render(root) {

    // Tabel Gas Mark standar UK: [gas, °C, °F]
    const GAS = [
      [1, 140, 275], [2, 150, 300], [3, 170, 325], [4, 180, 350], [5, 190, 375],
      [6, 200, 400], [7, 220, 425], [8, 230, 450], [9, 240, 475],
    ];
    const unitSel = T.select([['c', 'Celcius (°C)'], ['f', 'Fahrenheit (°F)'], ['gas', 'Gas Mark']], 'c');
    const numInp = T.input('number', 'Suhu, misal: 180', 180);
    const gasSel = T.select(GAS.map((g) => [g[0], 'Gas ' + g[0] + ' — ' + g[1] + '°C / ' + g[2] + '°F']), 4);
    const inpWrap = T.el('<div></div>');
    const out = T.out();
    const bulat = (v) => Math.round(v * 10) / 10;

    const hitung = () => {
      const u = unitSel.value;
      const dariGas = u === 'gas';
      inpWrap.innerHTML = '';
      inpWrap.appendChild(T.field(dariGas ? 'Gas Mark' : 'Suhu (' + unitSel.options[unitSel.selectedIndex].textContent + ')', dariGas ? gasSel : numInp));
      let c, f, g, gLabel;
      if (dariGas) {
        const r = GAS.find((x) => x[0] === T.num(gasSel.value));
        c = r[1]; f = r[2]; g = r[0]; gLabel = 'Gas ' + r[0];
      } else {
        const v = T.num(numInp.value);
        if (!Number.isFinite(v)) { T.hide(out); return; }
        c = u === 'c' ? v : (v - 32) * 5 / 9;
        f = u === 'f' ? v : v * 9 / 5 + 32;
        let bd = Infinity;
        GAS.forEach((r) => {
          const d = Math.abs(r[1] - c);
          if (d < bd) { bd = d; g = r[0]; }
        });
        gLabel = bd < 1e-9 ? 'Gas ' + g : '≈ Gas ' + g + ' (paling dekat)';
      }
      const kv = (k, val) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v big">' + T.esc(val) + '</span></div>';
      T.show(out,
        kv('Celcius', bulat(c) + ' °C') + kv('Fahrenheit', bulat(f) + ' °F') + kv('Gas Mark', gLabel) +
        '<div class="hint" style="margin-top:8px">Oven kipas (fan/convection)? Kurangi 20°C dari angka di atas. Gas Mark itu sistem Inggris — makanya angkanya "aneh" kayak 275, bukan angka bulat.</div>');
    };
    unitSel.addEventListener('change', hitung);
    numInp.addEventListener('input', hitung);
    gasSel.addEventListener('change', hitung);
    root.appendChild(T.field('Satuan yang kamu punya', unitSel));
    root.appendChild(inpWrap);
    root.appendChild(out);
    hitung();

}
