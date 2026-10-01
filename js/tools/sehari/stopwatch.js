import { h as T, utils, p2 } from '../../core.js?v=6.0.1';

export const meta = {"id": "stopwatch", "name": "Stopwatch", "cat": "sehari", "icon": "🏁", "desc": "Stopwatch + catat lap.", "keywords": "stopwatch,waktu,lap,timer"};
export function render(root) {

    const disp = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">00:00.00</div>');
    const lapBox = T.out();
    let startTs = 0, acc = 0, running = false, iv = null, laps = [];
    const now = () => acc + (running ? performance.now() - startTs : 0);
    const fmt = (ms) => {
      ms = Math.max(0, Math.floor(ms));
      return p2(Math.floor(ms / 60000)) + ':' + p2(Math.floor(ms / 1000) % 60) + '.' + p2(Math.floor(ms / 10) % 100);
    };
    const paintLaps = () => {
      if (!laps.length) { T.hide(lapBox); return; }
      let html = '';
      laps.forEach((l, i) => {
        html += '<div class="kv"><span class="k">Lap ' + (i + 1) + '</span><span class="v">' + fmt(l.t) +
          ' <span class="dim">(+' + fmt(l.d) + ')</span></span></div>';
      });
      T.show(lapBox, html);
    };
    const start = () => {
      if (running) return;
      running = true; startTs = performance.now();
      iv = setInterval(() => { disp.textContent = fmt(now()); }, 47);
      T.toast('Berjalan…');
    };
    const stop = () => {
      if (!running) return;
      acc = now(); running = false;
      clearInterval(iv); iv = null;
      disp.textContent = fmt(acc);
    };
    const reset = () => { stop(); acc = 0; laps = []; disp.textContent = '00:00.00'; T.hide(lapBox); };
    const lap = () => {
      if (!running) { T.toast('Jalankan dulu stopwatch-nya'); return; }
      const t = now();
      laps.push({ t, d: laps.length ? t - laps[laps.length - 1].t : t });
      paintLaps();
    };
    T.onLeave(() => { if (iv) clearInterval(iv); });
    root.appendChild(disp);
    root.appendChild(T.row(T.btn('▶ Start', start, true), T.btn('⏸ Stop', stop), T.btn('↺ Reset', reset)));
    root.appendChild(T.row(T.btn('🏁 Lap', lap)));
    root.appendChild(lapBox);
  
}
