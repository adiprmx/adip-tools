import { h as T, utils } from '../../core.js?v=6.0.0';

function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return '#' + to(f(0)) + to(f(8)) + to(f(4));
  }

export const meta = {"id": "palette", "name": "Color Palette Generator", "cat": "desain", "icon": "🎨", "desc": "Palet warna harmonis sekali klik.", "keywords": "palette,palet,warna,harmonis"};
export function render(root) {

    const modeSel = T.select([
      ['analogous', 'Analogous (bersebelahan)'],
      ['complementary', 'Complementary (berlawanan)'],
      ['triadic', 'Triadic (segitiga)'],
      ['tetradic', 'Tetradic (persegi)'],
      ['mono', 'Monokromatik']
    ], 'analogous');
    const wrap = T.el('<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0"></div>');
    const state = { base: Math.floor(Math.random() * 360), locks: [false, false, false, false, false], colors: [] };
    const harmony = (mode, base) => {
      const offs = { analogous: [-40, -20, 0, 20, 40], complementary: [0, 180, 15, 195, 0], triadic: [0, 120, 240, 30, 150], tetradic: [0, 90, 180, 270, 45], mono: [0, 0, 0, 0, 0] }[mode];
      return offs.map((o, i) => {
        const h = (base + o + 360) % 360;
        const s = mode === 'mono' ? 65 : 65 + ((i * 7) % 15);
        const l = mode === 'mono' ? 30 + i * 10 : 55 + ((i % 2) * 6 - 3);
        return hslToHex(h, s, l);
      });
    };
    const swatches = [];
    const paint = () => {
      state.colors = harmony(modeSel.value, state.base).map((c, i) => state.locks[i] && state.colors[i] ? state.colors[i] : c);
      wrap.innerHTML = '';
      swatches.length = 0;
      state.colors.forEach((hex, i) => {
        const sw = T.el('<div style="border-radius:10px;overflow:hidden;border:1px solid #27272a;cursor:pointer;position:relative"></div>');
        sw.innerHTML =
          '<div style="height:86px;background:' + hex + '"></div>' +
          '<div style="padding:6px 4px;text-align:center;font-size:11px;font-family:monospace;background:#131316">' + hex.toUpperCase() + '</div>' +
          '<button type="button" title="' + (state.locks[i] ? 'Buka kunci' : 'Kunci warna') + '" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,.55);border:none;border-radius:6px;font-size:13px;padding:2px 6px;cursor:pointer">' + (state.locks[i] ? '🔒' : '🔓') + '</button>';
        sw.addEventListener('click', (e) => {
          if (e.target.tagName === 'BUTTON') {
            state.locks[i] = !state.locks[i];
            paint();
          } else T.copy(hex);
        });
        wrap.appendChild(sw);
        swatches.push(sw);
      });
    };
    const gen = () => { state.base = Math.floor(Math.random() * 360); paint(); };
    root.appendChild(T.field('Mode harmoni', modeSel));
    root.appendChild(T.row(T.btn('🎲 Generate Palet', gen, true), T.btn('Buka Semua Kunci', () => { state.locks = [false, false, false, false, false]; paint(); })));
    root.appendChild(wrap);
    root.appendChild(T.el('<div class="hint">Klik warna untuk salin HEX · klik 🔓 untuk mengunci warna supaya tidak berubah saat generate.</div>'));
    modeSel.addEventListener('change', paint);
    paint();
  
}
