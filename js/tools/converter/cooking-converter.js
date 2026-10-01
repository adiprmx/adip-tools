import { h as T, utils } from '../../core.js?v=6.3.0';

export const meta = {"id": "cooking-converter", "name": "Takaran Masak", "cat": "converter", "icon": "🍳", "desc": "Konversi sendok, cup, gram, ml.", "keywords": "masak,takaran,sendok,cup,gram,resep,dapur"};
export function render(root) {

    // gram per 1 cup (US, 240 ml) — nilai umum dapur
    const BAHAN = {
      air: ['Air', 240], susu: ['Susu cair', 245], minyak: ['Minyak goreng', 218],
      tepung: ['Tepung terigu', 120], gula: ['Gula pasir', 200], gulahalus: ['Gula halus', 120],
      mentega: ['Mentega / margarin', 227], madu: ['Madu', 340], garam: ['Garam', 273], cokelat: ['Cokelat bubuk', 100],
    };
    const VOL = { cup: ['Cup', 240], sdm: ['Sendok makan', 15], sdt: ['Sendok teh', 5], ml: ['Mililiter', 1], L: ['Liter', 1000] };
    const bahanSel = T.select(Object.keys(BAHAN).map((k) => [k, BAHAN[k][0] + ' (' + BAHAN[k][1] + ' g/cup)']).concat([['custom', 'Custom (isi g/ml sendiri)']]), 'tepung');
    const customWrap = T.el('<div></div>');
    const customInp = T.input('number', 'Berat jenis, misal: 0,5 (gram per ml)', '');
    customWrap.appendChild(T.field('Gram per ml', customInp));
    T.hide(customWrap);
    const dariSel = T.select(Object.keys(VOL).map((k) => [k, VOL[k][0]]), 'cup');
    const valInp = T.input('number', 'Jumlah, misal: 2', 2);
    const out = T.out();
    const gPerMl = () => {
      if (bahanSel.value === 'custom') {
        const v = T.num(customInp.value);
        return Number.isFinite(v) && v > 0 ? v : NaN;
      }
      return BAHAN[bahanSel.value][1] / 240;
    };
    const fmtH = (v) => String(Math.round(v * 100) / 100);
    const hitung = () => {
      const v = T.num(valInp.value);
      const d = gPerMl();
      if (!Number.isFinite(v) || v < 0) { T.hide(out); return; }
      if (!Number.isFinite(d)) { T.show(out, '<span class="err">Isi berat jenis (gram per ml) yang valid untuk bahan custom.</span>'); return; }
      const ml = v * VOL[dariSel.value][1];
      const gram = ml * d;
      const rows = Object.keys(VOL).map((k) =>
        '<div class="kv"><span class="k">' + VOL[k][0] + '</span><span class="v">' + fmtH(ml / VOL[k][1]) + '</span></div>'
      ).join('');
      T.show(out,
        '<div class="kv"><span class="k">Berat</span><span class="v big">' + fmtH(gram) + ' <span class="dim" style="font-size:14px">gram</span></span></div>' +
        '<div class="kv"><span class="k">Volume</span><span class="v">' + fmtH(ml) + ' ml</span></div>' +
        '<div class="hint" style="margin:8px 0 2px">Setara dengan:</div>' + rows);
    };
    bahanSel.addEventListener('change', () => { customWrap.hidden = bahanSel.value !== 'custom'; hitung(); });
    [dariSel, valInp, customInp].forEach((e) => e.addEventListener('input', hitung));
    dariSel.addEventListener('change', hitung);
    root.appendChild(T.field('Bahan', bahanSel));
    root.appendChild(customWrap);
    root.appendChild(T.grid2(T.field('Jumlah', valInp), T.field('Satuan', dariSel)));
    root.appendChild(out);
    hitung();
  
}
