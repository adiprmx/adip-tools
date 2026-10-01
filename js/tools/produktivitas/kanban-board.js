import { h as T } from '../../core.js?v=6.8.0';

export const meta = {"id":"kanban-board","name":"Kanban Board","cat":"produktivitas","icon":"🗂️","desc":"Atur kerjaanmu: Todo → Doing → Done. Tersimpan otomatis di HP.","keywords":"kanban,todo,task,kerjaan,produktivitas,board,doing,done"};
export function render(root) {

    const KEY = 'adip-tools:kanban';
    const COLS = [
      ['todo', '📝 Todo'],
      ['doing', '🚧 Doing'],
      ['done', '✅ Done'],
    ];

    let state = { todo: [], doing: [], done: [] };
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        COLS.forEach(([k]) => {
          if (Array.isArray(p[k])) state[k] = p[k].filter((c) => c && typeof c.text === 'string' && c.text.trim());
        });
      }
    } catch (e) { /* mulai dari kosong kalau penyimpanan bermasalah */ }

    const save = () => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) { /* penyimpanan penuh / diblokir — board tetap jalan sesi ini */ }
    };

    const move = (col, id, dir) => {
      const i = COLS.findIndex(([k]) => k === col);
      const j = i + dir;
      if (j < 0 || j >= COLS.length) return;
      const k = state[col].findIndex((c) => c.id === id);
      if (k < 0) return;
      const [card] = state[col].splice(k, 1);
      state[COLS[j][0]].push(card);
      save();
      paint();
    };

    const del = (col, id) => {
      state[col] = state[col].filter((c) => c.id !== id);
      save();
      paint();
    };

    const cardEl = (col, ci, card) => {
      const c = T.el('<div style="background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:8px;margin-bottom:6px"></div>');
      const tx = T.el('<div style="font-size:13px;line-height:1.45;margin-bottom:6px;word-break:break-word"></div>');
      tx.textContent = card.text;
      c.appendChild(tx);
      const acts = T.el('<div style="display:flex;gap:4px"></div>');
      if (ci > 0) {
        const b = T.btn('←', () => move(col, card.id, -1));
        b.style.padding = '2px 10px';
        b.style.fontSize = '12px';
        b.title = 'Pindah ke kiri';
        acts.appendChild(b);
      }
      if (ci < COLS.length - 1) {
        const b = T.btn('→', () => move(col, card.id, 1));
        b.style.padding = '2px 10px';
        b.style.fontSize = '12px';
        b.title = 'Pindah ke kanan';
        acts.appendChild(b);
      }
      const sp = T.el('<div style="flex:1"></div>');
      acts.appendChild(sp);
      const x = T.btn('✕', () => del(col, card.id));
      x.style.padding = '2px 10px';
      x.style.fontSize = '12px';
      x.title = 'Hapus kartu';
      acts.appendChild(x);
      c.appendChild(acts);
      return c;
    };

    const lists = {};
    const board = T.el('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px;overflow-x:auto"></div>');
    COLS.forEach(([k, label]) => {
      const col = T.el('<div style="min-width:0"></div>');
      col.appendChild(T.el('<div class="center" style="font-weight:600;font-size:13px;margin-bottom:8px">' + T.esc(label) + '</div>'));
      const list = T.el('<div></div>');
      lists[k] = list;
      col.appendChild(list);
      board.appendChild(col);
    });

    const paint = () => {
      COLS.forEach(([k], ci) => {
        const list = lists[k];
        list.innerHTML = '';
        if (!state[k].length) {
          list.appendChild(T.el('<p class="hint center" style="font-size:12px">Kosong.</p>'));
        }
        state[k].forEach((card) => list.appendChild(cardEl(k, ci, card)));
      });
    };

    const inp = T.input('text', 'Tulis kerjaan baru…', '');
    const sel = T.select(COLS.map(([k, l]) => [k, l]), 'todo');
    const tambah = () => {
      const t = inp.value.trim();
      if (!t) { T.toast('Tulis dulu kerjaannya'); return; }
      state[sel.value].push({
        id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1e6),
        text: t,
        ts: Date.now(),
      });
      inp.value = '';
      inp.focus();
      save();
      paint();
    };
    const addB = T.btn('＋ Tambah', tambah, true);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tambah(); });

    root.appendChild(T.el('<p class="note">Satu kerjaan satu kartu. Geser kanan kalau mulai dikerjain, geser lagi kalau beres. Semua tersimpan otomatis.</p>'));
    const form = T.el('<div style="display:flex;gap:6px"></div>');
    inp.style.flex = '1';
    form.appendChild(inp);
    form.appendChild(sel);
    form.appendChild(addB);
    root.appendChild(form);
    root.appendChild(board);
    paint();

}
