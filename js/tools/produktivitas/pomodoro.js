import { h as T, utils, p2 } from '../../core.js';

export const meta = {"id": "pomodoro", "name": "Timer Fokus", "cat": "produktivitas", "icon": "🍅", "desc": "Timer fokus: Pomodoro 25/5, metode 52-17, atau durasi sendiri. Siklus bisa jalan otomatis.", "keywords": "pomodoro,fokus,timer,belajar,52-17,istirahat,produktivitas,kerja,deep work,konsentrasi"};
export function render(root) {

    const PRESET = {
      pomodoro: { focus: 25, short: 5, long: 15 },
      '5217': { focus: 52, short: 17, long: 17 },
    };
    const dur = { focus: 25, short: 5, long: 15 };
    const label = { focus: 'Fokus', short: 'Istirahat', long: 'Istirahat Panjang' };
    let preset = 'pomodoro';
    let mode = 'focus', total = dur.focus * 60, left = total, endAt = 0, iv = null, running = false;
    // Hitungan siklus tersimpan (pindahan dari metode-52-17 ikut dibaca sekali).
    const CKEY = 'adip-tools:pomodoro:siklus';
    let siklus = 0;
    try {
      const s = localStorage.getItem(CKEY);
      if (s != null) siklus = parseInt(s, 10) || 0;
      else siklus = parseInt(localStorage.getItem('adip-tools:metode-52-17:siklus') || '0', 10) || 0;
    } catch (e) { siklus = 0; }
    const simpanSiklus = () => { try { localStorage.setItem(CKEY, String(siklus)); } catch (e) {} };
    const judulAsli = document.title;
    const disp = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">25:00</div>');
    const modeLbl = T.el('<div class="center dim" style="margin-bottom:6px">🍅 Mode: <b>Fokus</b></div>');
    const barWrap = T.el('<div style="height:8px;border-radius:99px;background:#ffffff14;margin:14px 0 6px;overflow:hidden"></div>');
    const bar = T.el('<div style="height:100%;width:0%;border-radius:99px;background:#fff;transition:width .5s"></div>');
    barWrap.appendChild(bar);
    const cycBox = T.out();
    const presetSel = T.select([
      ['pomodoro', 'Pomodoro — 25 menit fokus, 5 menit istirahat'],
      ['5217', 'Metode 52-17 — 52 menit fokus, 17 menit istirahat'],
      ['kustom', 'Kustom — atur durasi sendiri di bawah'],
    ], 'pomodoro');
    const autoCek = document.createElement('input');
    autoCek.type = 'checkbox'; autoCek.id = 'pomodoro-auto';
    const inF = T.input('number', 'Fokus', '25');
    const inS = T.input('number', 'Istirahat', '5');
    const inL = T.input('number', 'Istirahat panjang', '15');
    const fmtT = (s) => p2(Math.floor(s / 60)) + ':' + p2(s % 60);
    const paintSiklus = () => {
      T.show(cycBox, '<div class="center dim">Sesi fokus selesai: <b>' + siklus + '</b> 🍅' +
        (preset !== '5217' && siklus > 0 && siklus % 4 === 0 ? '<br><span class="info">Sudah 4 sesi, saatnya istirahat panjang!</span>' : '') + '</div>');
    };
    const paint = () => {
      disp.textContent = fmtT(left);
      modeLbl.innerHTML = '🍅 Mode: <b>' + label[mode] + '</b>';
      modeLbl.style.color = mode === 'focus' ? '#6ee7b7' : '#93c5fd';
      bar.style.width = Math.min(100, Math.max(0, ((total - left) / total) * 100)) + '%';
      document.title = label[mode] + ' ' + fmtT(left) + ' · ' + judulAsli;
    };
    const tabsBox = T.el('<div></div>');
    const paintTabs = () => {
      tabsBox.innerHTML = '';
      const tabs = [T.btn('🍅 Fokus', () => setMode('focus', true)), T.btn('☕ ' + dur.short + ' mnt', () => setMode('short', true))];
      if (preset !== '5217') tabs.push(T.btn('🌴 ' + dur.long + ' mnt', () => setMode('long', true)));
      tabsBox.appendChild(T.row(...tabs));
    };
    const editorBox = T.el('<div></div>');
    const paintEditor = () => {
      editorBox.innerHTML = '';
      const fields = [T.field('Fokus', inF), T.field('Istirahat', inS)];
      if (preset !== '5217') fields.push(T.field('Istirahat panjang', inL));
      editorBox.appendChild(T.grid2(...fields));
    };
    const setMode = (m, resetTimer) => {
      mode = m; total = Math.max(1, Math.round(Number(dur[m]))) * 60; left = total;
      paint();
      if (resetTimer && iv) { clearInterval(iv); iv = null; running = false; }
    };
    const bunyi = (nada) => nada.forEach((f, i) => T.beep(f, 0.18, 'sine', i * 0.28));
    const selesai = () => {
      clearInterval(iv); iv = null; running = false;
      const habisFokus = mode === 'focus';
      if (habisFokus) { siklus++; simpanSiklus(); }
      if (autoCek.checked) {
        // Siklus otomatis ala 52-17: pindah fase sendiri lalu lanjut jalan.
        let next;
        if (habisFokus) {
          next = (preset !== '5217' && siklus % 4 === 0) ? 'long' : 'short';
          bunyi([880, 880, 880]);
          T.toast('Fokus beres. Istirahat ' + dur[next] + ' menit, jauhin dulu kerjaannya.');
        } else {
          next = 'focus';
          bunyi([523, 659, 784]);
          T.toast('Istirahat selesai. Balik fokus.');
        }
        setMode(next, false);
        paintSiklus();
        start();
        return;
      }
      T.beep(880, 0.2); T.beep(880, 0.2, 'sine', 0.3); T.beep(1320, 0.4, 'sine', 0.6);
      document.title = '⏰ ' + label[mode] + ' selesai! · ' + judulAsli;
      T.toast(label[mode] + ' selesai!');
      paintSiklus();
    };
    const tick = () => {
      left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      if (left <= 0) { disp.textContent = '00:00'; bar.style.width = '100%'; selesai(); return; }
      paint();
    };
    const start = () => {
      if (running) return;
      running = true;
      endAt = Date.now() + left * 1000;
      clearInterval(iv);
      iv = setInterval(tick, 1000);
    };
    const jeda = () => { if (!running) return; if (iv) clearInterval(iv); iv = null; running = false; left = Math.max(0, Math.round((endAt - Date.now()) / 1000)); paint(); };
    const resetT = () => { jeda(); left = total; disp.textContent = fmtT(left); bar.style.width = '0%'; document.title = judulAsli; };
    T.onLeave(() => { if (iv) clearInterval(iv); document.title = judulAsli; });
    const terapkanPreset = () => {
      preset = presetSel.value;
      if (PRESET[preset]) {
        dur.focus = PRESET[preset].focus; dur.short = PRESET[preset].short; dur.long = PRESET[preset].long;
        inF.value = String(dur.focus); inS.value = String(dur.short); inL.value = String(dur.long);
      }
      paintTabs();
      paintEditor();
      setMode('focus', true);
      paintSiklus();
    };
    presetSel.addEventListener('change', terapkanPreset);
    const terapkan = () => {
      const f = Math.round(T.num(inF.value)), s = Math.round(T.num(inS.value)), l = Math.round(T.num(inL.value));
      if (!(f > 0) || !(s > 0) || (preset !== '5217' && !(l > 0))) { T.toast('Durasi harus angka positif'); return; }
      dur.focus = f; dur.short = s;
      if (preset !== '5217') dur.long = l;
      if (presetSel.value !== 'kustom') { presetSel.value = 'kustom'; preset = 'kustom'; }
      paintTabs();
      setMode(mode, true);
      T.toast('Durasi diperbarui');
    };
    const autoLbl = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:14px;margin:10px 0"></label>');
    autoLbl.appendChild(autoCek);
    autoLbl.appendChild(document.createTextNode('Siklus otomatis — pindah fokus/istirahat sendiri sampai kamu berhenti'));
    root.appendChild(T.field('Metode timer', presetSel, 'Pomodoro cocok buat tugas pendek, 52-17 buat kerja lama.'));
    root.appendChild(tabsBox);
    root.appendChild(modeLbl);
    root.appendChild(disp);
    root.appendChild(barWrap);
    root.appendChild(T.row(T.btn('▶ Mulai', start, true), T.btn('⏸ Jeda', jeda), T.btn('↺ Reset', resetT)));
    root.appendChild(autoLbl);
    root.appendChild(cycBox);
    root.appendChild(T.el('<div class="dim" style="margin:12px 0 4px">Atur durasi (menit)</div>'));
    root.appendChild(editorBox);
    root.appendChild(T.btn('Terapkan durasi', terapkan));
    paintTabs();
    paintEditor();
    paintSiklus();
    paint();

}
