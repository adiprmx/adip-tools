import { h as T, utils } from '../../core.js?v=4.2.0';

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }

utils.simplifyRatio = function (w, h) {
    w = Math.round(Number(w)); h = Math.round(Number(h));
    if (!w || !h || w < 0 || h < 0) return '';
    const g = gcd(w, h);
    return (w / g) + ':' + (h / g);
  };

export const meta = {"id": "aspect-ratio", "name": "Kalkulator Rasio", "cat": "gambar", "icon": "📐", "desc": "Rasio aspek & resolusi."};

export function render(root) {

      const wI = T.input('number', 'Lebar', '1920');
      const hI = T.input('number', 'Tinggi', '1080');
      const rI = T.input('text', 'Rasio, cth: 16:9', '16:9');
      const sideSel = T.select([['w', 'Lebar diketahui'], ['h', 'Tinggi diketahui']], 'w');
      const sideI = T.input('number', 'Nilai sisi', '1920');
      const box = T.out();

      function calc1() {
        const w = parseFloat(wI.value), h = parseFloat(hI.value);
        if (!w || !h || w <= 0 || h <= 0) { T.toast('Isi lebar & tinggi yang valid'); return; }
        const r = utils.simplifyRatio(w, h);
        T.show(box,
          `<div class="kv"><span>Rasio</span><b>${T.esc(r)}</b></div>` +
          `<div class="kv"><span>Desimal</span><b>${(w / h).toFixed(4)} : 1</b></div>` +
          `<div class="kv"><span>Total piksel</span><b>${T.fmt(Math.round(w * h))} px</b></div>`);
      }

      function calc2() {
        const m = String(rI.value).trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
        if (!m) { T.toast('Format rasio: angka:angka, cth 16:9'); return; }
        const a = parseFloat(m[1]), b = parseFloat(m[2]);
        const v = parseFloat(sideI.value);
        if (!v || v <= 0) { T.toast('Isi nilai sisi yang valid'); return; }
        let w, h;
        if (sideSel.value === 'w') { w = v; h = v * b / a; }
        else { h = v; w = v * a / b; }
        T.show(box,
          `<div class="kv"><span>Lebar</span><b>${T.fmt(Math.round(w))} px</b></div>` +
          `<div class="kv"><span>Tinggi</span><b>${T.fmt(Math.round(h))} px</b></div>` +
          `<div class="kv"><span>Rasio</span><b>${T.esc(utils.simplifyRatio(w, h))}</b></div>`);
      }

      const sec1 = T.el('<div class="card"></div>');
      sec1.appendChild(T.el('<b>Mode 1: dari lebar & tinggi</b>'));
      sec1.appendChild(T.grid2(T.field('Lebar (px)', wI), T.field('Tinggi (px)', hI)));
      sec1.appendChild(T.btn('Hitung Rasio', calc1, true));

      const sec2 = T.el('<div class="card"></div>');
      sec2.appendChild(T.el('<b>Mode 2: dari rasio + satu sisi</b>'));
      sec2.appendChild(T.grid2(T.field('Rasio', rI), T.field('Sisi diketahui', sideSel)));
      sec2.appendChild(T.field('Nilai sisi (px)', sideI));
      sec2.appendChild(T.btn('Hitung Sisi Lain', calc2, true));

      root.appendChild(sec1);
      root.appendChild(sec2);
      root.appendChild(box);
    
}
