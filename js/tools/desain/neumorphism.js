import { h as T, utils, esc, preHtml } from '../../core.js?v=6.9.5';

export const meta = {"id": "neumorphism", "name": "Neumorphism Generator", "cat": "desain", "icon": "🫧", "desc": "Bayangan lembut ala neumorphism + kode CSS.", "keywords": "neumorphism,soft ui,bayangan,shadow,css,elegan"};
export function render(root) {

    const shapeSel = T.select([['flat', 'Flat (standar)'], ['convex', 'Convex (cembung)'], ['concave', 'Concave (cekung)'], ['pressed', 'Pressed (tertekan)']], 'flat');
    const base = T.el('<input type="color" value="#e0e5ec" style="width:52px;height:42px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
    const size = T.el('<input type="range" min="120" max="280" value="180" class="inp">');
    const sizeLbl = T.el('<span class="hint">180px</span>');
    const radius = T.el('<input type="range" min="0" max="80" value="24" class="inp">');
    const radiusLbl = T.el('<span class="hint">24px</span>');
    const dist = T.el('<input type="range" min="4" max="40" value="14" class="inp">');
    const distLbl = T.el('<span class="hint">14px</span>');
    const blur = T.el('<input type="range" min="4" max="60" value="28" class="inp">');
    const blurLbl = T.el('<span class="hint">28px</span>');
    const intense = T.el('<input type="range" min="10" max="60" value="30" class="inp">');
    const intenseLbl = T.el('<span class="hint">30%</span>');
    const stage = T.el('<div style="height:260px;border-radius:12px;border:1px solid #27272a;margin:12px 0;display:flex;align-items:center;justify-content:center"></div>');
    const el = T.el('<div></div>');
    stage.appendChild(el);
    const codeBox = T.out();

    const hexToRgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const mix = (rgb, t, amt) => rgb.map(c => Math.round(c + (t - c) * amt));
    const rgbStr = (rgb) => 'rgb(' + rgb.join(', ') + ')';
    const props = () => {
      const d = +dist.value, b = +blur.value, a = +intense.value / 100;
      const rgb = hexToRgb(base.value);
      const light = rgbStr(mix(rgb, 255, 0.85));
      const dark = rgbStr(mix(rgb, 0, 0.35));
      const lightShadow = light.replace('rgb(', 'rgba(').replace(')', ', ' + a + ')');
      const darkShadow = dark.replace('rgb(', 'rgba(').replace(')', ', ' + a + ')');
      const bgc = '#' + base.value.replace('#', '');
      const shape = shapeSel.value;
      if (shape === 'flat') return { background: bgc, boxShadow: d + 'px ' + d + 'px ' + b + 'px ' + darkShadow + ',\n    ' + (-d) + 'px ' + (-d) + 'px ' + b + 'px ' + lightShadow };
      if (shape === 'convex') return { background: 'linear-gradient(145deg, ' + light + ', ' + dark + ')', boxShadow: d + 'px ' + d + 'px ' + b + 'px ' + darkShadow + ',\n    ' + (-d) + 'px ' + (-d) + 'px ' + b + 'px ' + lightShadow };
      if (shape === 'concave') return { background: 'linear-gradient(145deg, ' + dark + ', ' + light + ')', boxShadow: d + 'px ' + d + 'px ' + b + 'px ' + darkShadow + ',\n    ' + (-d) + 'px ' + (-d) + 'px ' + b + 'px ' + lightShadow };
      return { background: bgc, boxShadow: 'inset ' + d + 'px ' + d + 'px ' + b + 'px ' + darkShadow + ',\n    inset ' + (-d) + 'px ' + (-d) + 'px ' + b + 'px ' + lightShadow };
    };
    const cssText = () => {
      const p = props();
      return '.neu {\n  width: ' + size.value + 'px;\n  height: ' + size.value + 'px;\n  background: ' + p.background + ';\n  border-radius: ' + radius.value + 'px;\n  box-shadow: ' + p.boxShadow + ';\n}';
    };
    const paint = () => {
      sizeLbl.textContent = size.value + 'px';
      radiusLbl.textContent = radius.value + 'px';
      distLbl.textContent = dist.value + 'px';
      blurLbl.textContent = blur.value + 'px';
      intenseLbl.textContent = intense.value + '%';
      stage.style.background = '#' + base.value.replace('#', '');
      const p = props();
      el.style.width = size.value + 'px';
      el.style.height = size.value + 'px';
      el.style.background = p.background;
      el.style.borderRadius = radius.value + 'px';
      el.style.boxShadow = p.boxShadow;
      T.show(codeBox, preHtml(cssText()));
    };
    const mkRow = (inp, lbl) => {
      const r = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      r.appendChild(inp); r.appendChild(lbl);
      return r;
    };
    base.addEventListener('input', paint);
    shapeSel.addEventListener('change', paint);
    [size, radius, dist, blur, intense].forEach(inp => inp.addEventListener('input', paint));

    root.appendChild(T.grid2(T.field('Bentuk', shapeSel), T.field('Warna dasar', base)));
    root.appendChild(T.grid2(T.field('Ukuran', mkRow(size, sizeLbl)), T.field('Radius sudut', mkRow(radius, radiusLbl))));
    root.appendChild(T.grid2(T.field('Jarak bayangan', mkRow(dist, distLbl)), T.field('Blur bayangan', mkRow(blur, blurLbl))));
    root.appendChild(T.field('Intensitas bayangan', mkRow(intense, intenseLbl)));
    root.appendChild(stage);
    root.appendChild(codeBox);
    root.appendChild(T.row(T.copyBtn(() => cssText(), 'Salin CSS')));
    paint();

}
