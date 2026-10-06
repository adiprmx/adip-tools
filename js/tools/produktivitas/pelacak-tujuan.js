import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"pelacak-tujuan","name":"Pelacak Tujuan","cat":"produktivitas","icon":"🎯","desc":"Tulis tujuan tahunanmu, pecah jadi milestone, pantau bar progresnya.","keywords":"tujuan,goals,milestone,target,resolusi,progres,tahunan"};

export function render(root) {
  const KEY = 'adip-tools:tujuan';
  let goals = [];
  try { goals = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { goals = []; }
  if (!Array.isArray(goals)) goals = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(goals)); } catch (e) {} };
  const uid = () => 'g' + Date.now().toString(36) + Math.floor(Math.random() * 999);

  const box = T.el('<div></div>');

  const draw = () => {
    box.innerHTML = '';
    if (!goals.length) {
      box.appendChild(T.el('<p class="center mut">Belum ada tujuan. Tulis satu di atas — yang besar-besar sekalian. 🎯</p>'));
      return;
    }
    goals.forEach((g) => {
      g.milestones = Array.isArray(g.milestones) ? g.milestones : [];
      const done = g.milestones.filter((m) => m.done).length;
      const total = g.milestones.length;
      const pct = total ? Math.round(done / total * 100) : 0;
      const card = T.el(
        '<div class="card" style="margin-bottom:12px">' +
        '<b>' + T.esc(g.name) + '</b>' +
        (g.deadline ? '<div class="mut" style="font-size:12px;margin-top:2px">📅 Target: ' + T.esc(g.deadline) + '</div>' : '') +
        '</div>');

      const track = T.el('<div style="height:12px;border-radius:99px;background:#ffffff12;overflow:hidden;margin:8px 0 4px"></div>');
      const fill = T.el('<div style="height:100%;width:' + pct + '%;border-radius:99px;background:#fff;transition:width .4s"></div>');
      track.appendChild(fill);
      card.appendChild(track);
      card.appendChild(T.el('<div class="mut" style="font-size:12px;margin-bottom:8px">' + pct + '% · ' + done + '/' + total + ' milestone' + (pct === 100 && total ? ' — selesai! 🏁' : '') + '</div>'));

      const mlBox = T.el('<div style="margin-bottom:8px"></div>');
      g.milestones.forEach((m) => {
        const rowEl = T.el('<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #ffffff10"></div>');
        const cb = T.el('<input type="checkbox"' + (m.done ? ' checked' : '') + ' style="width:18px;height:18px;accent-color:#fff">');
        cb.addEventListener('change', () => { m.done = cb.checked; save(); draw(); });
        const lbl = T.el('<span style="flex:1;font-size:14px' + (m.done ? ';text-decoration:line-through;opacity:.55' : '') + '">' + T.esc(m.name) + '</span>');
        const del = T.el('<button class="btn ghost" style="padding:4px 10px;font-size:12px">✕</button>');
        del.addEventListener('click', () => {
          g.milestones = g.milestones.filter((x) => x.id !== m.id);
          save(); draw();
        });
        rowEl.appendChild(cb); rowEl.appendChild(lbl); rowEl.appendChild(del);
        mlBox.appendChild(rowEl);
      });
      card.appendChild(mlBox);

      const mInp = T.input('text', 'Milestone baru, mis. daftar gym…');
      mInp.style.fontSize = '14px';
      const addM = () => {
        const name = mInp.value.trim();
        if (!name) { T.toast('Isi milestone-nya dulu'); return; }
        g.milestones.push({ id: uid(), name, done: false });
        mInp.value = '';
        save(); draw();
      };
      mInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addM(); });
      card.appendChild(T.row(mInp, T.btn('+ Milestone', addM)));

      const delG = T.btn('Hapus tujuan', () => {
        if (confirm('Hapus tujuan "' + g.name + '" beserta milestone-nya?')) {
          goals = goals.filter((x) => x.id !== g.id);
          save(); draw();
        }
      });
      delG.classList.add('danger');
      const foot = T.el('<div style="margin-top:8px"></div>');
      foot.appendChild(delG);
      card.appendChild(foot);

      box.appendChild(card);
    });
  };

  const nameInp = T.input('text', 'Tujuan tahunan, mis. lari 10K tanpa berhenti');
  const dateInp = T.input('date', '');
  dateInp.style.minWidth = '0';
  const addG = () => {
    const name = nameInp.value.trim();
    if (!name) { T.toast('Isi tujuanmu dulu'); return; }
    goals.push({ id: uid(), name, deadline: dateInp.value || '', milestones: [] });
    nameInp.value = ''; dateInp.value = '';
    save(); draw();
    T.toast('Tujuan tercatat. Pecah jadi milestone biar jalan.');
  };
  nameInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addG(); });

  root.appendChild(T.el('<p class="hint">Tujuan besar terasa berat karena utuh. Pecah jadi milestone kecil, centang satu-satu, bar-nya jalan sendiri.</p>'));
  root.appendChild(T.field('Tujuan baru', nameInp));
  root.appendChild(T.field('Deadline (opsional)', dateInp));
  root.appendChild(T.row(T.btn('Tambah tujuan', addG, true)));
  root.appendChild(box);
  draw();
}
