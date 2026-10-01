import { h as T, utils, p2, todayISO } from '../../core.js?v=6.1.0';

export const meta = {"id": "water-tracker", "name": "Tracker Air Minum", "cat": "produktivitas", "icon": "💧", "desc": "Target minum harian.", "keywords": "air,minum,sehat,tracker"};
export function render(root) {

    const KEY = 'adip-tools:water';
    const load = () => {
      try {
        const d = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (d && d.date === todayISO()) return d;
      } catch (e) {}
      return { date: todayISO(), ml: 0, target: 2000 };
    };
    const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
    let st = load();
    const bar = T.el('<div style="background:#1c1c1e;border-radius:10px;height:26px;overflow:hidden;margin:10px 0"></div>');
    const fill = T.el('<div style="height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#0ea5e9);transition:width .3s;display:flex;align-items:center;justify-content:flex-end"></div>');
    const pctLbl = T.el('<span style="font-size:12px;font-weight:700;color:#001;padding-right:8px"></span>');
    fill.appendChild(pctLbl);
    bar.appendChild(fill);
    const info = T.el('<div class="center"></div>');
    const targetInp = T.input('number', 'Target harian (ml)', String(st.target));
    const beratInp = T.input('number', 'Berat badan (kg), untuk saran', '');
    const paint = () => {
      const pct = Math.min(100, Math.round((st.ml / st.target) * 100));
      fill.style.width = pct + '%';
      pctLbl.textContent = pct + '%';
      info.innerHTML = '<div class="big">' + T.fmt(st.ml) + ' <span class="dim" style="font-size:16px">/ ' + T.fmt(st.target) + ' ml</span></div>' +
        (st.ml >= st.target ? '<div class="ok">🎉 Target tercapai! Pertahankan!</div>' : '<div class="dim">Kurang ' + T.fmt(Math.max(0, st.target - st.ml)) + ' ml lagi</div>');
    };
    const tambah = (n) => { st.ml += n; save(st); paint(); T.beep(700, 0.1); };
    const saran = () => {
      const bb = T.num(beratInp.value);
      if (!(bb > 0)) { T.toast('Isi berat badan dulu'); return; }
      st.target = Math.round(bb * 30);
      targetInp.value = String(st.target);
      save(st); paint();
      T.toast('Target diset: ' + T.fmt(st.target) + ' ml');
    };
    root.appendChild(info);
    root.appendChild(bar);
    root.appendChild(T.row(T.btn('+250 ml', () => tambah(250), true), T.btn('+500 ml', () => tambah(500), true)));
    root.appendChild(T.row(T.btn('↺ Reset hari ini', () => { st = { date: todayISO(), ml: 0, target: st.target }; save(st); paint(); })));
    root.appendChild(T.el('<div class="dim" style="margin:12px 0 4px">Pengaturan</div>'));
    root.appendChild(T.grid2(T.field('Target harian (ml)', targetInp), T.field('Berat badan (kg)', beratInp, 'Saran: 30 ml × berat badan')));
    root.appendChild(T.row(
      T.btn('Simpan target', () => { const v = Math.round(T.num(targetInp.value)); if (v > 0) { st.target = v; save(st); paint(); T.toast('Target tersimpan'); } }),
      T.btn('Pakai saran 30×kg', saran),
    ));
    paint();
  
}
