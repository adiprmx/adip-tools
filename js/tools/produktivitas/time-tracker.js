import { h as T, p2 } from '../../core.js?v=6.7.0';

export const meta = {"id":"time-tracker","name":"Time Tracker","cat":"produktivitas","icon":"⏱️","desc":"Catat waktu kerjamu per tugas — start, stop, ketahuan totalnya.","keywords":"time tracker,timer,tugas,waktu kerja,produktivitas,stopwatch,catat waktu"};
export function render(root) {

    const KEY = 'adip-tools:timetrack';

    let state = { tasks: [], sessions: [] };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p.tasks)) {
          state.tasks = p.tasks
            .filter((t) => t && t.id && typeof t.name === 'string')
            .map((t) => ({
              id: String(t.id),
              name: t.name,
              total: Math.max(0, Number(t.total) || 0),
              running: !!t.running,
              startTs: Number(t.startTs) || 0,
            }));
        }
        if (Array.isArray(p.sessions)) {
          state.sessions = p.sessions
            .filter((s) => s && typeof s.name === 'string' && s.start)
            .slice(0, 100);
        }
      }
    } catch (e) { /* mulai dari kosong kalau penyimpanan bermasalah */ }

    const save = () => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { /* penyimpanan penuh / diblokir — tracker tetap jalan sesi ini */ }
    };

    const fmtDur = (s) => {
      s = Math.max(0, Math.round(s));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), d = s % 60;
      if (h > 0) return h + 'j ' + m + 'mnt';
      if (m > 0) return d > 0 ? m + 'mnt ' + d + 'dtk' : m + 'mnt';
      return d + 'dtk';
    };
    const elapsedOf = (t) => t.total + (t.running && t.startTs ? (Date.now() - t.startTs) / 1000 : 0);
    const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

    const totalHariIni = () => {
      let s = state.sessions
        .filter((x) => isToday(x.start))
        .reduce((a, x) => a + (Number(x.dur) || 0), 0);
      state.tasks.forEach((t) => {
        if (t.running && t.startTs && isToday(t.startTs)) s += (Date.now() - t.startTs) / 1000;
      });
      return s;
    };

    const finishSession = (t) => {
      if (!t.running || !t.startTs) { t.running = false; t.startTs = 0; return; }
      const dur = (Date.now() - t.startTs) / 1000;
      t.total += dur;
      t.running = false;
      if (dur >= 1) {
        state.sessions.unshift({ id: 's' + Date.now().toString(36), name: t.name, start: t.startTs, dur: Math.round(dur) });
        state.sessions = state.sessions.slice(0, 100);
      }
      t.startTs = 0;
    };

    const startTask = (id) => {
      state.tasks.forEach((t) => { if (t.running && t.id !== id) finishSession(t); });
      const t = state.tasks.find((x) => x.id === id);
      if (!t || t.running) return;
      t.running = true;
      t.startTs = Date.now();
      save();
      paintTasks();
    };
    const stopTask = (id) => {
      const t = state.tasks.find((x) => x.id === id);
      if (!t || !t.running) return;
      finishSession(t);
      save();
      paintTasks();
      paintHistory();
      paintTotal();
    };
    const delTask = (id) => {
      const t = state.tasks.find((x) => x.id === id);
      if (t && t.running) finishSession(t);
      state.tasks = state.tasks.filter((x) => x.id !== id);
      save();
      paintTasks();
      paintHistory();
      paintTotal();
    };

    // ---- UI ----
    const totalEl = T.el('<div class="big center" style="font-variant-numeric:tabular-nums">0dtk</div>');
    const totalLbl = T.el('<p class="center mut" style="margin-top:0">total waktu hari ini</p>');

    const tasksBox = T.el('<div style="margin:12px 0"></div>');
    let timeEls = {};
    const paintTasks = () => {
      tasksBox.innerHTML = '';
      timeEls = {};
      if (!state.tasks.length) {
        tasksBox.appendChild(T.el('<p class="hint center">Belum ada tugas — tambah satu di atas.</p>'));
        return;
      }
      state.tasks.forEach((t) => {
        const card = T.el('<div style="background:#12100d;border:1px solid #2e2823;border-radius:10px;padding:10px;margin-bottom:8px"></div>');
        const head = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
        const nm = T.el('<div style="flex:1;font-weight:600;font-size:14px;word-break:break-word"></div>');
        nm.textContent = t.name;
        if (t.running) {
          const live = T.el('<span class="info" style="font-size:11px;margin-left:6px">● jalan</span>');
          nm.appendChild(live);
        }
        const tm = T.el('<div class="mut" style="font-size:12.5px;font-variant-numeric:tabular-nums;white-space:nowrap"></div>');
        tm.textContent = fmtDur(elapsedOf(t));
        timeEls[t.id] = tm;
        head.appendChild(nm);
        head.appendChild(tm);
        card.appendChild(head);
        const acts = T.row(
          t.running
            ? T.btn('⏹ Stop', () => stopTask(t.id), true)
            : T.btn('▶ Start', () => startTask(t.id), true),
          T.btn('✕', () => delTask(t.id))
        );
        acts.style.marginTop = '8px';
        card.appendChild(acts);
        tasksBox.appendChild(card);
      });
    };

    const histBox = T.el('<div></div>');
    const paintHistory = () => {
      histBox.innerHTML = '';
      if (!state.sessions.length) {
        histBox.appendChild(T.el('<p class="hint center">Belum ada sesi tercatat.</p>'));
        return;
      }
      state.sessions.forEach((s) => {
        const d = new Date(s.start);
        const jam = p2(d.getHours()) + ':' + p2(d.getMinutes());
        const tgl = isToday(s.start) ? 'hari ini' : d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
        const rowEl = T.el('<div style="display:flex;gap:8px;align-items:baseline;padding:7px 0;border-bottom:1px solid #251f18;font-size:13px"></div>');
        const nm = T.el('<div style="flex:1;word-break:break-word"></div>');
        nm.textContent = s.name;
        rowEl.appendChild(nm);
        rowEl.appendChild(T.el('<div class="mut" style="font-size:12px;white-space:nowrap">' + T.esc(tgl + ' ' + jam) + '</div>'));
        rowEl.appendChild(T.el('<div style="font-weight:600;white-space:nowrap">' + T.esc(fmtDur(s.dur)) + '</div>'));
        histBox.appendChild(rowEl);
      });
    };

    const paintTotal = () => { totalEl.textContent = fmtDur(totalHariIni()); };

    const inp = T.input('text', 'cth: Ngerjain laporan', '');
    const addB = T.btn('＋ Tambah tugas', () => {
      const n = inp.value.trim();
      if (!n) { T.toast('Tulis dulu nama tugasnya'); return; }
      state.tasks.push({
        id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e6),
        name: n, total: 0, running: false, startTs: 0,
      });
      inp.value = '';
      inp.focus();
      save();
      paintTasks();
    }, true);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addB.click(); });

    const iv = setInterval(() => {
      Object.keys(timeEls).forEach((id) => {
        const t = state.tasks.find((x) => x.id === id);
        if (t) timeEls[id].textContent = fmtDur(elapsedOf(t));
      });
      paintTotal();
    }, 1000);
    T.onLeave(() => clearInterval(iv));

    root.appendChild(T.el('<p class="note">Satu timer jalan dalam satu waktu — kalau kamu start tugas lain, yang lama otomatis ke-stop dan kecatat.</p>'));
    root.appendChild(totalEl);
    root.appendChild(totalLbl);
    const form = T.el('<div style="display:flex;gap:6px;margin-bottom:4px"></div>');
    inp.style.flex = '1';
    form.appendChild(inp);
    form.appendChild(addB);
    root.appendChild(form);
    root.appendChild(tasksBox);
    root.appendChild(T.el('<div style="font-weight:600;margin:14px 0 6px">🕘 Riwayat sesi</div>'));
    root.appendChild(histBox);
    root.appendChild(T.row(T.btn('🗑 Hapus riwayat', () => {
      state.sessions = [];
      save();
      paintHistory();
      paintTotal();
      T.toast('Riwayat dihapus');
    })));
    paintTasks();
    paintHistory();
    paintTotal();

}
