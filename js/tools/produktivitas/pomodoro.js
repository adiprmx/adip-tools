import { h as T, utils, p2 } from '../../core.js?v=6.7.0';

export const meta = {"id": "pomodoro", "name": "Pomodoro Timer", "cat": "produktivitas", "icon": "🍅", "desc": "Timer fokus 25/5.", "keywords": "pomodoro,fokus,timer,belajar"};
export function render(root) {

    const dur = { focus: 25, short: 5, long: 15 };
    const label = { focus: 'Fokus', short: 'Istirahat', long: 'Istirahat Panjang' };
    let mode = 'focus', total = dur.focus * 60, left = total, iv = null, running = false, siklus = 0;
    const judulAsli = document.title;
    const disp = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">25:00</div>');
    const modeLbl = T.el('<div class="center dim" style="margin-bottom:6px">🍅 Mode: <b>Fokus</b></div>');
    const cycBox = T.out();
    const inF = T.input('number', 'Fokus', '25');
    const inS = T.input('number', 'Istirahat', '5');
    const inL = T.input('number', 'Istirahat panjang', '15');
    const fmtT = (s) => p2(Math.floor(s / 60)) + ':' + p2(s % 60);
    const paintSiklus = () => {
      T.show(cycBox, '<div class="center dim">Sesi fokus selesai: <b>' + siklus + '</b> 🍅' +
        (siklus > 0 && siklus % 4 === 0 ? '<br><span class="info">Sudah 4 sesi, saatnya istirahat panjang!</span>' : '') + '</div>');
    };
    const setMode = (m, resetTimer) => {
      mode = m; total = Math.max(1, Math.round(Number(dur[m]))) * 60; left = total;
      disp.textContent = fmtT(left);
      modeLbl.innerHTML = '🍅 Mode: <b>' + label[m] + '</b>';
      document.title = label[m] + ' ' + fmtT(left) + ' · ' + judulAsli;
      if (resetTimer && iv) { clearInterval(iv); iv = null; running = false; }
    };
    const selesai = () => {
      clearInterval(iv); iv = null; running = false;
      if (mode === 'focus') siklus++;
      T.beep(880, 0.2); T.beep(880, 0.2, 'sine', 0.3); T.beep(1320, 0.4, 'sine', 0.6);
      document.title = '⏰ ' + label[mode] + ' selesai! · ' + judulAsli;
      T.toast(label[mode] + ' selesai!');
      paintSiklus();
    };
    const tick = () => {
      left--;
      if (left <= 0) { disp.textContent = '00:00'; selesai(); return; }
      disp.textContent = fmtT(left);
      document.title = label[mode] + ' ' + fmtT(left) + ' · ' + judulAsli;
    };
    const start = () => {
      if (running) return;
      running = true;
      iv = setInterval(tick, 1000);
    };
    const jeda = () => { if (iv) clearInterval(iv); iv = null; running = false; };
    const resetT = () => { jeda(); left = total; disp.textContent = fmtT(left); document.title = judulAsli; };
    T.onLeave(() => { if (iv) clearInterval(iv); document.title = judulAsli; });
    const tabs = T.row(
      T.btn('🍅 Fokus', () => setMode('focus', true)),
      T.btn('☕ 5 mnt', () => setMode('short', true)),
      T.btn('🌴 15 mnt', () => setMode('long', true)),
    );
    const terapkan = () => {
      const f = Math.round(T.num(inF.value)), s = Math.round(T.num(inS.value)), l = Math.round(T.num(inL.value));
      if (!(f > 0) || !(s > 0) || !(l > 0)) { T.toast('Durasi harus angka positif'); return; }
      dur.focus = f; dur.short = s; dur.long = l;
      setMode(mode, true);
      T.toast('Durasi diperbarui');
    };
    root.appendChild(tabs);
    root.appendChild(modeLbl);
    root.appendChild(disp);
    root.appendChild(T.row(T.btn('▶ Mulai', start, true), T.btn('⏸ Jeda', jeda), T.btn('↺ Reset', resetT)));
    root.appendChild(cycBox);
    T.hide(cycBox);
    root.appendChild(T.el('<div class="dim" style="margin:12px 0 4px">Atur durasi (menit)</div>'));
    root.appendChild(T.grid2(T.field('Fokus', inF), T.field('Istirahat', inS), T.field('Istirahat panjang', inL)));
    root.appendChild(T.btn('Terapkan durasi', terapkan));
    paintSiklus();
  
}
