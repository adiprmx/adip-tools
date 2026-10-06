import { h as T, utils, esc, preHtml } from '../../core.js?v=6.9.5';

export const meta = {"id": "animasi-css", "name": "Animasi CSS Generator", "cat": "desain", "icon": "🎞️", "desc": "Bikin @keyframes CSS (gerak, putar, skala, fade) + preview.", "keywords": "animasi,animation,keyframes,css,gerakan,transition"};
export function render(root) {

    const propSel = T.select([
      ['translateX', 'Geser (translateX)'],
      ['translateY', 'Geser (translateY)'],
      ['rotate', 'Putar (rotate)'],
      ['scale', 'Perbesar (scale)'],
      ['opacity', 'Fade (opacity)']
    ], 'translateX');
    const from = T.el('<input type="range" class="inp">');
    const fromLbl = T.el('<span class="hint"></span>');
    const to = T.el('<input type="range" class="inp">');
    const toLbl = T.el('<span class="hint"></span>');
    const dur = T.el('<input type="range" min="0.5" max="6" step="0.5" value="2" class="inp">');
    const durLbl = T.el('<span class="hint">2s</span>');
    const easeSel = T.select([['linear', 'Linear'], ['ease', 'Ease'], ['ease-in', 'Ease In'], ['ease-out', 'Ease Out'], ['ease-in-out', 'Ease In-Out']], 'ease-in-out');
    const modeSel = T.select([['infinite alternate', 'Bolak-balik'], ['infinite', 'Loop'], ['1', 'Sekali jalan']], 'infinite alternate');
    const stage = T.el('<div style="height:220px;border-radius:12px;border:1px solid #27272a;margin:12px 0;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#131316;position:relative"></div>');
    const box = T.el('<div style="width:72px;height:72px;border-radius:16px;background:#fff"></div>');
    stage.appendChild(box);
    const codeBox = T.out();
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);

    const ranges = {
      translateX: { min: -120, max: 120, unit: 'px', d: 0, k: 80 },
      translateY: { min: -120, max: 120, unit: 'px', d: 0, k: -60 },
      rotate: { min: -360, max: 360, unit: 'deg', d: 0, k: 180 },
      scale: { min: 0.2, max: 2, step: 0.1, d: 1, k: 1.5 },
      opacity: { min: 0, max: 1, step: 0.1, d: 0.2, k: 1 }
    };
    const fmt = (v) => {
      const p = propSel.value;
      if (p === 'opacity') return String(+v);
      if (p === 'scale') return String(+v);
      return v + ranges[p].unit;
    };
    const transformOf = (v) => {
      const p = propSel.value, f = fmt(v);
      if (p === 'opacity') return '';
      if (p === 'scale') return 'scale(' + f + ')';
      return p + '(' + f + ')';
    };
    const syncRanges = () => {
      const r = ranges[propSel.value];
      [['from', from, r.d], ['to', to, r.k]].forEach(([_, inp, def]) => {
        inp.min = r.min; inp.max = r.max;
        inp.step = r.step || 1;
        inp.value = def;
      });
    };
    const cssText = () => {
      const p = propSel.value;
      const key = p === 'opacity' ? 'opacity' : 'transform';
      return '@keyframes gerak {\n  0% { ' + key + ': ' + (p === 'opacity' ? fmt(from.value) : transformOf(from.value)) + '; }\n  100% { ' + key + ': ' + (p === 'opacity' ? fmt(to.value) : transformOf(to.value)) + '; }\n}\n\n.animated {\n  animation: gerak ' + dur.value + 's ' + easeSel.value + ' ' + modeSel.value + ';\n}';
    };
    const paint = () => {
      fromLbl.textContent = fmt(from.value);
      toLbl.textContent = fmt(to.value);
      durLbl.textContent = dur.value + 's';
      styleEl.textContent = cssText() + '\n.animated-prev { animation: gerak ' + dur.value + 's ' + easeSel.value + ' ' + modeSel.value + '; }';
      box.className = '';
      void box.offsetWidth;
      box.className = 'animated-prev';
      T.show(codeBox, preHtml(cssText()));
    };
    const fromRow = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    fromRow.appendChild(from); fromRow.appendChild(fromLbl);
    const toRow = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    toRow.appendChild(to); toRow.appendChild(toLbl);
    const durRow = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    durRow.appendChild(dur); durRow.appendChild(durLbl);

    root.appendChild(T.grid2(T.field('Properti', propSel), T.field('Easing', easeSel)));
    root.appendChild(T.grid2(T.field('Nilai awal', fromRow), T.field('Nilai akhir', toRow)));
    root.appendChild(T.grid2(T.field('Durasi', durRow), T.field('Mode putar', modeSel)));
    root.appendChild(stage);
    root.appendChild(codeBox);
    root.appendChild(T.row(T.copyBtn(() => cssText(), 'Salin CSS')));
    [propSel, easeSel, modeSel].forEach(el => el.addEventListener('change', () => { if (el === propSel) syncRanges(); paint(); }));
    [from, to].forEach(el => el.addEventListener('input', paint));
    dur.addEventListener('input', paint);
    syncRanges();
    paint();

}
