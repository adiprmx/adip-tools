import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "ukuran-sepatu", "name": "Ukuran Sepatu", "cat": "converter", "icon": "👟", "desc": "Konversi ukuran sepatu US/UK/EU/JP.", "keywords": "sepatu,ukuran,size,us,uk,eu"};
export function render(root) {

    // Tabel patokan umum (gaya Nike — banyak dipakai brand sport).
    // Pria: UK = US - 0.5, JP(cm) = US + 18. Wanita: UK = US - 2.5, JP(cm) = US + 17.
    const PRIA = [
      [6, 5.5, 38.5, 24], [6.5, 6, 39, 24.5], [7, 6.5, 39.5, 25], [7.5, 7, 40, 25.5],
      [8, 7.5, 40.5, 26], [8.5, 8, 41, 26.5], [9, 8.5, 42, 27], [9.5, 9, 42.5, 27.5],
      [10, 9.5, 43, 28], [10.5, 10, 43.5, 28.5], [11, 10.5, 44, 29], [11.5, 11, 44.5, 29.5],
      [12, 11.5, 45, 30], [12.5, 12, 46, 30.5], [13, 12.5, 47.5, 31],
    ];
    const WANITA = [
      [5, 2.5, 35.5, 22], [5.5, 3, 36, 22.5], [6, 3.5, 36.5, 23], [6.5, 4, 37.5, 23.5],
      [7, 4.5, 38, 24], [7.5, 5, 38.5, 24.5], [8, 5.5, 39, 25], [8.5, 6, 40, 25.5],
      [9, 6.5, 40.5, 26], [9.5, 7, 41, 26.5], [10, 7.5, 42, 27], [10.5, 8, 42.5, 27.5],
      [11, 8.5, 43, 28], [11.5, 9, 44, 28.5], [12, 9.5, 44.5, 29],
    ];
    const UNITS = [['us', 'US'], ['uk', 'UK'], ['eu', 'EU'], ['jp', 'JP (cm)']];
    const genderSel = T.select([['pria', 'Pria'], ['wanita', 'Wanita']], 'pria');
    const unitSel = T.select(UNITS, 'us');
    const valInp = T.input('number', 'Ukuran, misal: 9', 9);
    const out = T.out();

    const tabel = () => (genderSel.value === 'pria' ? PRIA : WANITA);
    const hitung = () => {
      const v = T.num(valInp.value);
      if (!Number.isFinite(v)) { T.hide(out); return; }
      const rows = tabel();
      const ui = { us: 0, uk: 1, eu: 2, jp: 3 }[unitSel.value];
      let best = rows[0], bd = Infinity;
      rows.forEach((r) => {
        const d = Math.abs(r[ui] - v);
        if (d < bd) { bd = d; best = r; }
      });
      const pas = bd < 1e-9;
      const nm = (s) => UNITS.find((u) => u[0] === s)[1];
      const kv = (k, val) => '<div class="kv"><span class="k">' + T.esc(k) + '</span><span class="v big">' + T.esc(val) + '</span></div>';
      T.show(out,
        (pas ? '' : '<div class="hint" style="margin-bottom:8px">Nggak ada yang pas banget — ini padanan paling dekat:</div>') +
        kv('US', String(best[0])) + kv('UK', String(best[1])) + kv('EU', String(best[2])) + kv('JP', best[3] + ' cm') +
        '<div class="hint" style="margin-top:8px">Patokan umum aja — tiap merek bisa beda ±0,5, apalagi yang modelnya sempit. Kalau ragu, ambil yang agak longgar.</div>');
    };
    genderSel.addEventListener('change', hitung);
    unitSel.addEventListener('change', hitung);
    valInp.addEventListener('input', hitung);
    root.appendChild(T.grid2(T.field('Untuk', genderSel), T.field('Satuan ukuranmu', unitSel)));
    root.appendChild(T.field('Ukurannya', valInp));
    root.appendChild(out);
    hitung();

}
