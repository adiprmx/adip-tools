import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id":"matriks-eisenhower","name":"Matriks Eisenhower","cat":"produktivitas","icon":"🎯","desc":"Pilah tugas: kerjakan, jadwalkan, delegasikan, atau buang.","keywords":"eisenhower,matriks,prioritas,tugas,penting,mendesak,produktivitas"};

const QUADS = [
  { id: 'q1', label: 'Kerjakan', sub: 'Penting + mendesak — gas sekarang' },
  { id: 'q2', label: 'Jadwalkan', sub: 'Penting, tidak mendesak — atur waktunya' },
  { id: 'q3', label: 'Delegasikan', sub: 'Mendesak, tidak penting — lempar ke orang lain' },
  { id: 'q4', label: 'Hapus', sub: 'Tidak penting + tidak mendesak — buang aja' },
];

export function render(root) {
  const KEY = 'adip-tools:eisenhower';
  let tasks = [];
  try { tasks = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { tasks = []; }
  if (!Array.isArray(tasks)) tasks = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) {} };

  const listBox = T.el('<div></div>');

  const draw = () => {
    listBox.innerHTML = '';
    QUADS.forEach((q, qi) => {
      const sec = T.el(
        '<div class="card" style="margin-bottom:10px">' +
        '<div class="h3">' + (qi + 1) + '. ' + T.esc(q.label) + '</div>' +
        '<p class="hint" style="margin:0 0 8px">' + T.esc(q.sub) + '</p>' +
        '</div>');
      const items = tasks.filter((t) => t.q === q.id);
      if (!items.length) sec.appendChild(T.el('<p class="mut" style="font-size:12px;margin:0">Kosong — santai.</p>'));
      items.forEach((t) => {
        const line = T.el('<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap"></div>');
        const txt = T.el('<span style="flex:1;min-width:110px;font-size:13.5px;' + (t.done ? 'text-decoration:line-through;opacity:.5' : '') + '">' + T.esc(t.text) + '</span>');
        const doneBtn = T.btn(t.done ? '↩ Batal' : '✓ Selesai', () => { t.done = !t.done; save(); draw(); });
        const mover = T.select(QUADS.map((x) => [x.id, x.label]), t.q);
        mover.title = 'Pindah kuadran';
        mover.addEventListener('change', () => { t.q = mover.value; save(); draw(); });
        const del = T.btn('✕', () => { tasks = tasks.filter((x) => x.id !== t.id); save(); draw(); });
        line.appendChild(txt); line.appendChild(doneBtn); line.appendChild(mover); line.appendChild(del);
        sec.appendChild(line);
      });
      listBox.appendChild(sec);
    });
  };

  const inp = T.input('text', 'Contoh: bayar tagihan listrik');
  const sel = T.select(QUADS.map((q) => [q.id, q.label + ' — ' + q.sub]), 'q1');
  const add = () => {
    const text = inp.value.trim();
    if (!text) { T.toast('Tulis tugasnya dulu'); return; }
    tasks.push({ id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 99), text, q: sel.value, done: false });
    inp.value = '';
    save(); draw();
    T.toast('Tugas masuk matriks!');
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  root.appendChild(T.el('<p class="hint">Metode Eisenhower: pilah tugas berdasarkan penting &amp; mendesak, biar nggak semua dikerjain sekarang.</p>'));
  root.appendChild(T.field('Tugas baru', inp));
  root.appendChild(T.field('Masuk kuadran', sel));
  root.appendChild(T.row(T.btn('Tambah tugas', add, true)));
  root.appendChild(listBox);
  draw();
}
