import { h as T, utils, beep, actx, onLeave, kvRows, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "konversi-kecepatan", "name": "Konversi Kecepatan", "cat": "converter", "icon": "💨", "desc": "Konversi km/jam ↔ m/s ↔ mph ↔ knot.", "keywords": "kecepatan,km/jam,ms,mph,knot,konversi,lari,berkendara"};

export function render(root) {
    // Faktor ke m/s
    const UNITS = [
      ['kmh', 'Kilometer/jam (km/jam)', 1000 / 3600],
      ['mps', 'Meter/detik (m/s)', 1],
      ['mph', 'Mil/jam (mph)', 1609.344 / 3600],
      ['knot', 'Knot (mil laut/jam)', 1852 / 3600],
    ];
    const valInp = T.input('number', 'Nilai, misal: 90', 90);
    const unitSel = T.select(UNITS.map((u) => [u[0], u[1]]), 'kmh');
    const out = T.out();

    const fmtV = (v) => {
      if (!Number.isFinite(v)) return '—';
      let s = v >= 100 ? v.toFixed(2) : v.toFixed(4);
      s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
      const p = s.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return p.join(',');
    };

    const hitung = () => {
      const v = T.num(valInp.value);
      if (!Number.isFinite(v) || v < 0) { T.hide(out); return; }
      const unit = UNITS.find((u) => u[0] === unitSel.value);
      const mps = v * unit[2];
      const rows = UNITS.map((u) => [u[1], fmtV(mps / u[2])]);
      T.show(out,
        kvRows(rows) +
        '<div class="hint" style="margin-top:8px">1 knot = 1 mil laut (1.852 m) per jam — dipakai di kapal & pesawat. 1 mph = 1,60934 km/jam.</div>');
    };

    valInp.addEventListener('input', hitung);
    unitSel.addEventListener('change', hitung);
    root.appendChild(T.grid2(
      T.field('Nilai', valInp),
      T.field('Satuan asal', unitSel)
    ));
    root.appendChild(out);
    hitung();
}
