import { h as T } from '../../core.js?v=5.0.0';

export const meta = {"id": "clamp", "name": "CSS Clamp Generator", "cat": "desain", "icon": "📏", "desc": "Font responsif fluid dengan clamp()."};

export function render(root) {

    const minF = T.input('number', 'cth: 16', '16'); minF.inputMode = 'decimal';
    const maxF = T.input('number', 'cth: 32', '32'); maxF.inputMode = 'decimal';
    const minV = T.input('number', 'cth: 360', '360'); minV.inputMode = 'numeric';
    const maxV = T.input('number', 'cth: 1280', '1280'); maxV.inputMode = 'numeric';
    const simR = T.input('range'); simR.min = '320'; simR.max = '1440'; simR.value = '768';
    const simV = T.el('<b>768px</b>');
    const box = T.out();
    const prevWrap = T.el('<div style="border:1px solid #ffffff20;border-radius:12px;padding:16px;margin-top:12px;overflow:hidden"></div>');
    const prevText = T.el('<div style="font-weight:700;line-height:1.2">Judul responsif yang membesar mulus</div>');
    const prevSub = T.el('<div style="opacity:.65;margin-top:6px">Paragraf contoh — ukurannya ikut skala clamp().</div>');
    prevWrap.appendChild(prevText); prevWrap.appendChild(prevSub);

    simR.addEventListener('input', () => { simV.textContent = simR.value + 'px'; hitung(); });

    const hitung = () => {
      const mn = parseFloat(minF.value), mx = parseFloat(maxF.value);
      const v0 = parseFloat(minV.value), v1 = parseFloat(maxV.value);
      if (!(mn > 0) || !(mx > mn) || !(v0 > 0) || !(v1 > v0)) {
        T.show(box, '<p class="warn">Isi angka yang valid: font maks &gt; min, viewport maks &gt; min.</p>');
        return;
      }
      const slope = (mx - mn) / (v1 - v0);
      const yAxis = mn - slope * v0;
      const vw = (slope * 100);
      const cssPx = 'clamp(' + mn + 'px, ' + yAxis.toFixed(2) + 'px + ' + vw.toFixed(3) + 'vw, ' + mx + 'px)';
      const r = (n) => (n / 16).toFixed(3).replace(/\.?0+$/, '') ;
      const cssRem = 'clamp(' + r(mn) + 'rem, ' + r(yAxis) + 'rem + ' + vw.toFixed(3) + 'vw, ' + r(mx) + 'rem)';

      // Preview: hitung ukuran pada lebar simulasi
      const simW = parseFloat(simR.value);
      const fluidPx = Math.min(mx, Math.max(mn, yAxis + slope * simW));
      prevText.style.fontSize = fluidPx + 'px';
      prevSub.style.fontSize = Math.max(12, fluidPx * 0.45) + 'px';
      prevWrap.style.maxWidth = simW + 'px';

      T.show(box,
        '<div class="kv"><span>CSS (px)</span></div>' +
        '<pre style="white-space:pre-wrap;word-break:break-all;font-size:13px;background:#ffffff08;padding:10px;border-radius:8px;user-select:all">font-size: ' + T.esc(cssPx) + ';</pre>' +
        '<div class="kv"><span>CSS (rem)</span></div>' +
        '<pre style="white-space:pre-wrap;word-break:break-all;font-size:13px;background:#ffffff08;padding:10px;border-radius:8px;user-select:all">font-size: ' + T.esc(cssRem) + ';</pre>' +
        '<div class="kv"><span>Ukuran pada ' + simW + 'px</span><b>' + fluidPx.toFixed(1) + 'px</b></div>' +
        '<p class="hint">Rumus: slope = (maks−min) ÷ (vpMaks−vpMin); intercept = min − slope × vpMin. Di bawah ' + v0 + 'px terkunci ' + mn + 'px, di atas ' + v1 + 'px terkunci ' + mx + 'px.</p>');
      box.appendChild(T.row(
        T.copyBtn(() => 'font-size: ' + cssPx + ';', 'Salin px'),
        T.copyBtn(() => 'font-size: ' + cssRem + ';', 'Salin rem')
      ));
    };
    [minF, maxF, minV, maxV].forEach((i) => i.addEventListener('input', hitung));

    root.appendChild(T.grid2(
      T.field('Font min (px)', minF, 'Ukuran di layar kecil'),
      T.field('Font maks (px)', maxF, 'Ukuran di layar besar')
    ));
    root.appendChild(T.grid2(
      T.field('Viewport min (px)', minV, 'Mulai membesar dari sini'),
      T.field('Viewport maks (px)', maxV, 'Berhenti membesar di sini')
    ));
    const sRow = T.el('<div class="row"></div>');
    sRow.appendChild(simR); sRow.appendChild(simV);
    root.appendChild(T.field('Simulasi lebar layar', sRow, 'Geser untuk lihat preview'));
    root.appendChild(prevWrap);
    root.appendChild(box);
    hitung();

}
