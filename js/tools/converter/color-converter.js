import { h as T, utils } from '../../core.js?v=5.2.0';

export const meta = {"id": "color-converter", "name": "Konverter Warna", "cat": "converter", "icon": "🎨", "desc": "Konversi HEX, RGB, HSL + preview.", "keywords": "warna,color,hex,rgb,hsl"};
export function render(root) {

    const inp = T.input('text', '#ff6b6b  atau  255,107,107  atau  hsl(0,100%,65%)', '#ff6b6b');
    inp.autocapitalize = 'none'; inp.spellcheck = false;
    const prev = T.el('<div style="width:100%;height:96px;border-radius:12px;border:1px solid #3f3f46;margin:12px 0"></div>');
    const out = T.out();

    function parse(str) {
      str = String(str).trim().toLowerCase();
      let m;
      if ((m = str.match(/^#?([0-9a-f]{3})$/))) {
        const h = m[1];
        return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16) };
      }
      if ((m = str.match(/^#?([0-9a-f]{6})$/))) {
        return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) };
      }
      if ((m = str.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/))) {
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      if ((m = str.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/))) {
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      if ((m = str.match(/^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%/))) {
        return hslToRgb(+m[1], +m[2], +m[3]);
      }
      if ((m = str.match(/^(\d{1,3}(?:\.\d+)?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%\s*[, ]\s*(\d{1,3}(?:\.\d+)?)%$/))) {
        return hslToRgb(+m[1], +m[2], +m[3]);
      }
      return null;
    }
    function hslToRgb(h, s, l) {
      h = ((h % 360) + 360) % 360; s = Math.min(100, Math.max(0, s)) / 100; l = Math.min(100, Math.max(0, l)) / 100;
      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
    }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (mx + mn) / 2;
      if (mx !== mn) {
        const d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    const hex2 = (n) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');

    const go = () => {
      const c = parse(inp.value);
      if (!c || [c.r, c.g, c.b].some((v) => v < 0 || v > 255 || Number.isNaN(v))) {
        T.show(out, '<span class="err">Format tidak dikenali. Coba: <b>#ff6b6b</b>, <b>255, 107, 107</b>, atau <b>hsl(0, 100%, 65%)</b>.</span>');
        return;
      }
      const hex = '#' + hex2(c.r) + hex2(c.g) + hex2(c.b);
      const rgb = 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
      const hsl = rgbToHsl(c.r, c.g, c.b);
      const hslS = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
      prev.style.background = hex;
      T.show(out,
        '<div class="kv"><span class="k">HEX</span><span class="v" class="monoall">' + hex + '</span></div>' +
        '<div class="kv"><span class="k">RGB</span><span class="v" class="monoall">' + rgb + '</span></div>' +
        '<div class="kv"><span class="k">HSL</span><span class="v" class="monoall">' + hslS + '</span></div>' +
        '<div class="hint">Klik tombol untuk menyalin tiap format.</div>');
      const vals = [hex, rgb, hslS];
      const names = ['HEX', 'RGB', 'HSL'];
      const btns = T.el('<div style="margin-top:10px"></div>');
      vals.forEach((v, i) => {
        const b = T.btn('Salin ' + names[i], () => T.copy(v));
        b.classList.add('small'); b.style.margin = '0 6px 6px 0';
        btns.appendChild(b);
      });
      out.appendChild(btns);
    };
    root.appendChild(T.field('Warna (HEX / RGB / HSL)', inp));
    root.appendChild(T.row(T.btn('Konversi', go, true)));
    root.appendChild(prev);
    root.appendChild(out);
    go();
  
}
