import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "ukuran-cincin", "name": "Ukuran Cincin", "cat": "converter", "icon": "💍", "desc": "Konversi ukuran cincin internasional.", "keywords": "cincin,ukuran,ring,size"};
export function render(root) {

    // Tabel standar internasional, cross-check beberapa panduan jeweler.
    // [US, UK, JP, EU/FR (keliling mm), diameter mm, keliling mm]
    const TABEL = [
      [4, 'H', 7, 46.8, 14.9, 46.8],
      [5, 'J', 9, 49.3, 15.7, 49.3],
      [6, 'M', 12, 51.8, 16.5, 51.8],
      [7, 'N', 14, 54.4, 17.3, 54.4],
      [8, 'P', 17, 57.0, 18.1, 57.0],
      [9, 'R', 19, 59.5, 18.9, 59.5],
      [10, 'T', 22, 62.1, 19.7, 62.1],
      [11, 'V', 24, 64.6, 20.5, 64.6],
      [12, 'Y', 27, 67.2, 21.3, 67.2],
      [13, 'Z', 29, 69.7, 22.1, 69.7],
    ];
    const UI = { us: 0, uk: 1, jp: 2, eu: 3, dia: 4, circ: 5 };
    const unitSel = T.select([
      ['us', 'US'], ['uk', 'UK'], ['jp', 'Jepang'], ['eu', 'Eropa (FR)'],
      ['dia', 'Diameter dalam (mm)'], ['circ', 'Keliling dalam (mm)'],
    ], 'us');
    const numInp = T.input('number', 'Ukuran, misal: 7', 7);
    const ukSel = T.select(TABEL.map((r) => [r[1], 'UK ' + r[1]]), 'N');
    const inpWrap = T.el('<div></div>');
    const out = T.out();

    const hitung = () => {
      const u = unitSel.value;
      const dariUk = u === 'uk';
      inpWrap.innerHTML = '';
      inpWrap.appendChild(T.field(dariUk ? 'Ukuran UK' : 'Ukuran ' + unitSel.options[unitSel.selectedIndex].textContent, dariUk ? ukSel : numInp));
      let row;
      if (dariUk) {
        row = TABEL.find((r) => r[1] === ukSel.value);
      } else {
        const v = T.num(numInp.value);
        if (!Number.isFinite(v)) { T.hide(out); return; }
        let bd = Infinity;
        TABEL.forEach((r) => {
          const d = Math.abs(r[UI[u]] - v);
          if (d < bd) { bd = d; row = r; }
        });
        var pas = bd < 1e-9;
      }
      if (!row) { T.hide(out); return; }
      const kv = (k, val) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v big">' + T.esc(val) + '</span></div>';
      T.show(out,
        ((dariUk || pas) ? '' : '<div class="hint" style="margin-bottom:8px">Nggak ada yang pas banget — ini padanan paling dekat:</div>') +
        kv('US', 'US ' + row[0]) + kv('UK', 'UK ' + row[1]) + kv('Jepang', 'JP ' + row[2]) +
        kv('Eropa (FR)', 'EU ' + row[3]) + kv('Diameter dalam', row[4] + ' mm') + kv('Keliling dalam', row[5] + ' mm') +
        '<div class="hint" style="margin-top:8px">Kalau mau ukur sendiri: lilitkan benang di jari, tandai, lalu ukur panjangnya = keliling dalam (mm). Ukur sore/malam biar nggak kekecilan. Cincin lebar (>6 mm) biasanya enak naik setengah ukuran.</div>');
    };
    unitSel.addEventListener('change', hitung);
    numInp.addEventListener('input', hitung);
    ukSel.addEventListener('change', hitung);
    root.appendChild(T.field('Sistem ukuranmu', unitSel));
    root.appendChild(inpWrap);
    root.appendChild(out);
    hitung();

}
