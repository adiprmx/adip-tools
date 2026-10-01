import { h as T, utils, esc, preHtml } from '../../core.js?v=5.1.0';

export const meta = {"id": "gradient", "name": "Gradient Generator", "cat": "desain", "icon": "🌈", "desc": "Bikin gradient CSS + preview."};

export function render(root) {

    const typeSel = T.select([['linear', 'Linear'], ['radial', 'Radial']], 'linear');
    const angle = T.el('<input type="range" min="0" max="360" value="135" class="inp">');
    const angleLbl = T.el('<span class="hint">135°</span>');
    const stopsBox = T.el('<div></div>');
    const stops = [
      { color: '#3b82f6', pos: 0 },
      { color: '#a855f7', pos: 50 },
      { color: '#ec4899', pos: 100 }
    ];
    const preview = T.el('<div style="height:180px;border-radius:12px;border:1px solid #27272a;margin:12px 0"></div>');
    const codeBox = T.out();
    const cssText = () => {
      const ss = stops.map((s) => s.color + ' ' + s.pos + '%').join(', ');
      return typeSel.value === 'linear'
        ? 'background: linear-gradient(' + angle.value + 'deg, ' + ss + ');'
        : 'background: radial-gradient(circle, ' + ss + ');';
    };
    const paintStops = () => {
      stopsBox.innerHTML = '';
      stops.forEach((s, i) => {
        const row = T.el('<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"></div>');
        const c = T.el('<input type="color" value="' + s.color + '" style="width:48px;height:40px;border:1px solid #27272a;border-radius:8px;background:none;padding:2px;cursor:pointer">');
        const p = T.el('<input type="range" min="0" max="100" value="' + s.pos + '" class="inp" style="flex:1">');
        const lbl = T.el('<span class="hint" style="min-width:44px;text-align:right">' + s.pos + '%</span>');
        const del = T.btn('✕', () => { if (stops.length > 2) { stops.splice(i, 1); paintStops(); paint(); } else T.toast('Minimal 2 warna'); });
        del.style.padding = '6px 10px';
        c.addEventListener('input', () => { s.color = c.value; paint(); });
        p.addEventListener('input', () => { s.pos = +p.value; lbl.textContent = s.pos + '%'; paint(); });
        row.appendChild(c); row.appendChild(p); row.appendChild(lbl); row.appendChild(del);
        stopsBox.appendChild(row);
      });
    };
    const paint = () => {
      preview.style.background = cssText().replace(/^background:\s*/, '').replace(/;$/, '');
      T.show(codeBox, preHtml(cssText()));
    };
    angle.addEventListener('input', () => { angleLbl.textContent = angle.value + '°'; paint(); });
    typeSel.addEventListener('change', () => { paint(); });
    const fldSudut = T.el('<div class="fld"><label>Sudut</label><div style="display:flex;gap:8px;align-items:center"></div></div>');
    fldSudut.querySelector('div').appendChild(angle);
    fldSudut.querySelector('div').appendChild(angleLbl);
    root.appendChild(T.grid2(T.field('Tipe', typeSel), fldSudut));
    root.appendChild(T.el('<div class="hint" style="margin:10px 0 4px">Warna (2-5 stop):</div>'));
    root.appendChild(stopsBox);
    root.appendChild(T.row(T.btn('+ Tambah Warna', () => {
      if (stops.length >= 5) { T.toast('Maksimal 5 warna'); return; }
      stops.push({ color: '#22c55e', pos: 100 });
      paintStops(); paint();
    })));
    root.appendChild(preview);
    root.appendChild(codeBox);
    root.appendChild(T.row(T.copyBtn(() => cssText(), 'Salin CSS')));
    paintStops();
    paint();
  
}
