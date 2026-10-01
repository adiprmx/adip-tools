import { h as T, todayISO } from '../../core.js?v=6.8.0';

export const meta = {"id":"prioritas-harian","name":"Prioritas Harian","cat":"produktivitas","icon":"🎯","desc":"Pilih top-3 tugas hari ini, coret satu per satu, pulang dengan tenang.","keywords":"prioritas,harian,todo,todolist,tugas,top 3,produktivitas,fokus"};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtTgl(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return (+m[3]) + ' ' + BULAN[(+m[2]) - 1] + ' ' + m[1];
}

export function render(root) {
  const KEY = 'adip-tools:prioritas-harian';
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { data = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };

  let tgl = todayISO();
  const tasks = () => {
    if (!Array.isArray(data[tgl])) data[tgl] = [];
    return data[tgl];
  };

  const listBox = T.el('<div></div>');
  const statBox = T.el('<p class="hint" style="margin:10px 0"></p>');

  const draw = () => {
    listBox.innerHTML = '';
    const ts = tasks();
    const done = ts.filter((t) => t.done).length;
    statBox.textContent = ts.length
      ? fmtTgl(tgl) + ' — ' + done + ' dari ' + ts.length + ' selesai' + (done === ts.length ? '. Mantap, istirahat sana. 🎉' : '.')
      : 'Belum ada tugas untuk ' + fmtTgl(tgl) + '. Tulis 1–3 hal terpenting hari ini.';
    if (!ts.length) {
      listBox.appendChild(T.el('<p class="center mut">Kosong. Hari ini milikmu — isi dengan yang paling penting.</p>'));
      return;
    }
    ts.forEach((t, i) => {
      const rowEl = T.el('<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px;padding:10px 12px;border:1px solid #ffffff14;border-radius:10px"></div>');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!t.done;
      cb.style.marginTop = '3px';
      cb.setAttribute('aria-label', 'Tandai selesai: ' + t.text);
      const label = T.el('<div style="flex:1;font-size:13.5px;line-height:1.5' + (t.done ? ';text-decoration:line-through;opacity:.55' : '') + '">' + T.esc(t.text) + '</div>');
      const del = T.btn('✕', () => { tasks().splice(i, 1); save(); draw(); });
      del.style.padding = '4px 10px';
      del.setAttribute('aria-label', 'Hapus tugas');
      cb.addEventListener('change', () => { t.done = cb.checked; save(); draw(); });
      rowEl.appendChild(cb);
      rowEl.appendChild(label);
      rowEl.appendChild(del);
      listBox.appendChild(rowEl);
    });
  };

  const dateInp = T.input('date', '', tgl);
  dateInp.addEventListener('change', () => {
    if (dateInp.value) { tgl = dateInp.value; newInp.value = ''; draw(); }
  });

  const newInp = T.input('text', 'Tugas paling penting hari ini... (Enter = tambah)');
  const add = () => {
    const text = newInp.value.trim();
    if (!text) { T.toast('Tulis dulu tugasnya'); return; }
    if (tasks().length >= 9) { T.toast('Cukup 9 dulu, sisanya besok 😄'); return; }
    tasks().push({ id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 99), text: text, done: false });
    newInp.value = '';
    save(); draw();
    newInp.focus();
  };
  newInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  const resetBtn = T.btn('Reset hari ini', () => {
    if (!tasks().length) { T.toast('Sudah kosong, nggak ada yang direset'); return; }
    if (confirm('Hapus semua tugas tanggal ' + fmtTgl(tgl) + '?')) {
      data[tgl] = [];
      save(); draw();
      T.toast('Hari ini direset. Mulai lagi dari nol 💪');
    }
  });

  root.appendChild(T.el('<p class="hint">Jangan kejar 20 tugas. Pilih yang paling ngefek hari ini, kerjain, coret. Data tersimpan per tanggal di HP kamu.</p>'));
  root.appendChild(T.field('Tanggal', dateInp));
  root.appendChild(T.field('Tugas baru', newInp));
  root.appendChild(T.row(T.btn('Tambah tugas', add, true), resetBtn));
  root.appendChild(statBox);
  root.appendChild(listBox);
  draw();
}
