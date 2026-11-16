import { h as T, utils, esc, preHtml } from '../../core.js?v=6.12.2';

export const meta = {"id": "boxshadow", "name": "Box-Shadow Generator", "cat": "desain", "icon": "🌓", "desc": "Atur bayangan visual, preset siap pakai, multi-layer + copy CSS.", "keywords": "box,shadow,bayangan,css,preset,layer"};
export function render(root) {

    const hexA = (hex, a) => {
      const n = parseInt(String(hex).slice(1), 16) || 0;
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    };
    const lapisBaru = (o) => Object.assign({ x: 0, y: 12, blur: 32, spread: 0, color: '#000000', opacity: 45, inset: false }, o || {});
    const state = { layers: [lapisBaru()], aktif: 0 };

    const PRESET = [
      ['Lembut', [lapisBaru({ x: 0, y: 8, blur: 24, spread: 0, opacity: 18 })]],
      ['Melayang', [lapisBaru({ x: 0, y: 20, blur: 45, spread: -12, opacity: 35 })]],
      ['Tajam', [lapisBaru({ x: 6, y: 6, blur: 0, spread: 0, opacity: 90 })]],
      ['Dalam', [lapisBaru({ x: 0, y: 2, blur: 4, spread: 0, opacity: 20 }), lapisBaru({ x: 0, y: 16, blur: 32, spread: 0, opacity: 25 })]],
      ['Kartu', [lapisBaru({ x: 0, y: 1, blur: 3, spread: 0, opacity: 12 }), lapisBaru({ x: 0, y: 4, blur: 12, spread: 0, opacity: 8 })]],
      ['Cahaya putih', [lapisBaru({ x: 0, y: 0, blur: 32, spread: 0, color: '#ffffff', opacity: 35 })]],
      ['Ke dalam', [lapisBaru({ x: 0, y: 2, blur: 8, spread: 0, opacity: 30, inset: true })]],
    ];

    const layerBar = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;align-items:center"></div>');
    const mk = (label, min, max, get, set) => {
      const r = T.el('<input type="range" min="' + min + '" max="' + max + '" value="' + get() + '" class="inp">');
      const v = T.el('<span class="hint" style="min-width:52px;text-align:right">' + get() + 'px</span>');
      const f = T.el('<div class="fld"><label>' + label + '</label><div style="display:flex;gap:8px;align-items:center"></div></div>');
      f.querySelector('div').appendChild(r);
      f.querySelector('div').appendChild(v);
      r.addEventListener('input', () => { set(+r.value); v.textContent = r.value + 'px'; paint(); });
      return { r, v, f, sync: () => { r.value = get(); v.textContent = get() + 'px'; } };
    };
    const aktif = () => state.layers[state.aktif];
    const sX = mk('Geser X', -100, 100, () => aktif().x, (v) => { aktif().x = v; });
    const sY = mk('Geser Y', -100, 100, () => aktif().y, (v) => { aktif().y = v; });
    const sB = mk('Blur', 0, 150, () => aktif().blur, (v) => { aktif().blur = v; });
    const sS = mk('Spread', -60, 60, () => aktif().spread, (v) => { aktif().spread = v; });
    const color = T.el('<input type="color" value="#000000" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
    const opacity = T.el('<input type="range" min="0" max="100" value="45" class="inp">');
    const opLbl = T.el('<span class="hint">45%</span>');
    opacity.addEventListener('input', () => { aktif().opacity = +opacity.value; opLbl.textContent = opacity.value + '%'; paint(); });
    color.addEventListener('input', () => { aktif().color = color.value; paint(); });
    const insetLab = T.el('<label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-top:4px"><input type="checkbox"> Inset (bayangan ke dalam)</label>');
    const insetCb = insetLab.querySelector('input');
    insetCb.addEventListener('change', () => { aktif().inset = insetCb.checked; paint(); });

    const cssSatu = (L) => (L.inset ? 'inset ' : '') +
      L.x + 'px ' + L.y + 'px ' + L.blur + 'px ' + L.spread + 'px ' + hexA(L.color, L.opacity / 100);
    const cssText = () => 'box-shadow: ' + state.layers.map(cssSatu).join(', ') + ';';
    const preview = T.el('<div style="display:flex;justify-content:center;align-items:center;padding:40px 16px;background:#18181b;border-radius:12px;border:1px solid #27272a;margin:12px 0;overflow:hidden"></div>');
    const boxEl = T.el('<div style="width:140px;height:140px;background:#fafafa;border-radius:16px"></div>');
    preview.appendChild(boxEl);
    const codeBox = T.out();

    const gambarLayer = () => {
      layerBar.innerHTML = '';
      state.layers.forEach((L, i) => {
        const b = T.btn('Lapisan ' + (i + 1), () => { state.aktif = i; sinkron(); gambarLayer(); });
        b.classList.toggle('primary', i === state.aktif);
        layerBar.appendChild(b);
      });
      if (state.layers.length < 4) {
        layerBar.appendChild(T.btn('+ Tambah lapisan', () => {
          state.layers.push(lapisBaru({ x: 0, y: 4, blur: 8, spread: 0, opacity: 20 }));
          state.aktif = state.layers.length - 1;
          sinkron(); gambarLayer(); paint();
        }));
      }
      if (state.layers.length > 1) {
        layerBar.appendChild(T.btn('Hapus lapisan ini', () => {
          state.layers.splice(state.aktif, 1);
          state.aktif = Math.max(0, state.aktif - 1);
          sinkron(); gambarLayer(); paint();
        }));
      }
    };
    const sinkron = () => {
      const L = aktif();
      [sX, sY, sB, sS].forEach((s) => s.sync());
      color.value = L.color;
      opacity.value = L.opacity;
      opLbl.textContent = L.opacity + '%';
      insetCb.checked = !!L.inset;
    };
    const paint = () => {
      boxEl.style.boxShadow = state.layers.map(cssSatu).join(', ');
      T.show(codeBox, preHtml(cssText()));
    };

    const presetBar = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"></div>');
    PRESET.forEach(([nama, layers]) => {
      presetBar.appendChild(T.btn(nama, () => {
        state.layers = layers.map((L) => Object.assign({}, L));
        state.aktif = 0;
        sinkron(); gambarLayer(); paint();
      }));
    });

    root.appendChild(T.el('<p class="hint" style="margin-bottom:10px">Mulai dari preset, lalu atur tiap lapisan bayangannya. Bisa sampai 4 lapisan ditumpuk.</p>'));
    root.appendChild(T.field('Preset siap pakai', presetBar));
    root.appendChild(layerBar);
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
    gambarLayer();
    paint();
  
}
