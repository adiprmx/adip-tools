import { h as T, utils } from '../../core.js?v=4.2.0';

export const meta = {"id": "unit-converter", "name": "Konverter Satuan", "cat": "converter", "icon": "📏", "desc": "Panjang, berat, suhu, volume, kecepatan."};

export function render(root) {

    const DEFS = {
      panjang: { label: 'Panjang', units: { m: ['Meter', 1], km: ['Kilometer', 1000], cm: ['Sentimeter', 0.01], mm: ['Milimeter', 0.001], mi: ['Mil', 1609.344], yd: ['Yard', 0.9144], ft: ['Kaki', 0.3048], in: ['Inci', 0.0254] } },
      berat: { label: 'Berat', units: { kg: ['Kilogram', 1], g: ['Gram', 0.001], mg: ['Miligram', 1e-6], ton: ['Ton', 1000], lb: ['Pound', 0.45359237], oz: ['Ons', 0.0283495231] } },
      volume: { label: 'Volume', units: { L: ['Liter', 1], ml: ['Mililiter', 0.001], m3: ['Meter kubik', 1000], gal: ['Galon (US)', 3.785411784], floz: ['Fluid ounce (US)', 0.0295735296], cup: ['Cup (US)', 0.2365882365] } },
      kecepatan: { label: 'Kecepatan', units: { 'm/s': ['Meter/detik', 1], 'km/h': ['Kilometer/jam', 1 / 3.6], mph: ['Mil/jam', 0.44704], knot: ['Knot', 0.514444] } },
      suhu: { label: 'Suhu', units: { C: ['Celcius (°C)', 0], F: ['Fahrenheit (°F)', 0], K: ['Kelvin (K)', 0] } },
    };
    const catSel = T.select(Object.keys(DEFS).map((k) => [k, DEFS[k].label]), 'panjang');
    const fromSel = T.select([], '');
    const toSel = T.select([], '');
    const valInp = T.input('number', 'Nilai, misal: 100', 1);
    const out = T.out();

    const isiUnit = () => {
      const d = DEFS[catSel.value];
      const pairs = Object.keys(d.units).map((k) => [k, d.units[k][0]]);
      fromSel.innerHTML = ''; toSel.innerHTML = '';
      pairs.forEach(([v, l]) => {
        const o1 = document.createElement('option'); o1.value = v; o1.textContent = l; fromSel.appendChild(o1);
        const o2 = document.createElement('option'); o2.value = v; o2.textContent = l; toSel.appendChild(o2);
      });
      toSel.selectedIndex = Math.min(1, pairs.length - 1);
      hitung();
    };
    const keC = (v, u) => (u === 'C' ? v : u === 'F' ? (v - 32) * 5 / 9 : v - 273.15);
    const dariC = (v, u) => (u === 'C' ? v : u === 'F' ? v * 9 / 5 + 32 : v + 273.15);
    const fmtH = (v) => {
      if (!Number.isFinite(v)) return '-';
      const a = Math.abs(v);
      if (a !== 0 && (a >= 1e12 || a < 1e-6)) return v.toExponential(6);
      return String(Math.round(v * 1e6) / 1e6);
    };
    const hitung = () => {
      const v = Number(valInp.value);
      if (!Number.isFinite(v)) { T.hide(out); return; }
      let hasil;
      if (catSel.value === 'suhu') {
        hasil = dariC(keC(v, fromSel.value), toSel.value);
      } else {
        const d = DEFS[catSel.value];
        hasil = (v * d.units[fromSel.value][1]) / d.units[toSel.value][1];
      }
      const nm = (s) => DEFS[catSel.value].units[s][0];
      T.show(out,
        '<div class="kv"><span class="k">' + T.fmt(v) + ' ' + T.esc(nm(fromSel.value)) + '</span><span class="v big">' + fmtH(hasil) + ' <span class="dim" style="font-size:14px">' + T.esc(nm(toSel.value)) + '</span></span></div>');
    };
    catSel.addEventListener('change', isiUnit);
    [fromSel, toSel].forEach((s) => s.addEventListener('change', hitung));
    valInp.addEventListener('input', hitung);
    root.appendChild(T.field('Jenis satuan', catSel));
    root.appendChild(T.grid2(T.field('Dari', fromSel), T.field('Ke', toSel)));
    root.appendChild(T.field('Nilai', valInp));
    root.appendChild(T.row(T.btn('⇅ Tukar', () => {
      const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; hitung();
    })));
    root.appendChild(out);
    isiUnit();
  
}
