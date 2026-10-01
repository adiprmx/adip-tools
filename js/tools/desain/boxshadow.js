import { h as T, utils, esc, preHtml } from '../../core.js?v=5.1.0';

export const meta = {"id": "boxshadow", "name": "Box-Shadow Generator", "cat": "desain", "icon": "🌓", "desc": "Atur bayangan visual + copy CSS."};

export function render(root) {

    const mk = (label, min, max, val) => {
      const r = T.el('<input type="range" min="' + min + '" max="' + max + '" value="' + val + '" class="inp">');
      const v = T.el('<span class="hint" style="min-width:52px;text-align:right">' + val + 'px</span>');
      const f = T.el('<div class="fld"><label>' + label + '</label><div style="display:flex;gap:8px;align-items:center"></div></div>');
      f.querySelector('div').appendChild(r);
      f.querySelector('div').appendChild(v);
      r.addEventListener('input', () => { v.textContent = r.value + 'px'; paint(); });
      return { r, f };
    };
    const hexA = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    };
    const cssText = () => 'box-shadow: ' + (insetCb.checked ? 'inset ' : '') +
      sX.r.value + 'px ' + sY.r.value + 'px ' + sB.r.value + 'px ' + sS.r.value + 'px ' + hexA(color.value, opacity.value / 100) + ';';
    const paint = () => {
      boxEl.style.boxShadow = cssText().replace(/^box-shadow:\s*/, '').replace(/;$/, '');
      T.show(codeBox, preHtml(cssText()));
    };
    const sX = mk('Geser X', -100, 100, 0), sY = mk('Geser Y', -100, 100, 12),
      sB = mk('Blur', 0, 150, 32), sS = mk('Spread', -60, 60, 0);
    const color = T.el('<input type="color" value="#000000" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const opacity = T.el('<input type="range" min="0" max="100" value="45" class="inp">');
    const opLbl = T.el('<span class="hint">45%</span>');
    opacity.addEventListener('input', () => { opLbl.textContent = opacity.value + '%'; paint(); });
    color.addEventListener('input', paint);
    const insetLab = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-top:4px"><input type="checkbox"> Inset (bayangan ke dalam)</label>');
    const insetCb = insetLab.querySelector('input');
    insetCb.addEventListener('change', paint);
    const preview = T.el('<div style="display:flex;justify-content:center;align-items:center;padding:40px 16px;background:#18181b;border-radius:12px;border:1px solid #27272a;margin:12px 0;overflow:hidden"></div>');
    const boxEl = T.el('<div style="width:140px;height:140px;background:#fafafa;border-radius:16px"></div>');
    preview.appendChild(boxEl);
    const codeBox = T.out();
    root.appendChild(sX.f); root.appendChild(sY.f); root.appendChild(sB.f); root.appendChild(sS.f);
    const fldWarna = T.el('<div class="fld"><label>Warna</label></div>');
    fldWarna.appendChild(color);
    const fldTrans = T.el('<div class="fld"><label>Transparansi</label><div style="display:flex;gap:8px;align-items:center"></div></div>');
    fldTrans.querySelector('div').appendChild(opacity);
    fldTrans.querySelector('div').appendChild(opLbl);
    root.appendChild(T.grid2(fldWarna, fldTrans));
    root.appendChild(insetLab);
    root.appendChild(preview);
    root.appendChild(codeBox);
    root.appendChild(T.row(T.copyBtn(() => cssText(), 'Salin CSS')));
    paint();
  
}
