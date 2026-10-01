import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"habit-tracker","name":"Habit Tracker","cat":"produktivitas","icon":"✅","desc":"Bangun kebiasaan baik & pantau streak harianmu.","keywords":"habit,kebiasaan,streak,rutinitas,produktif,target"};

function isoLocal(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function render(root) {
  const KEY = 'adip-tools:habit';
  let habits = [];
  try { habits = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { habits = []; }
  if (!Array.isArray(habits)) habits = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(habits)); } catch (e) {} };

  const today = isoLocal(new Date());

  // Streak: hitung mundur dari hari ini (atau kemarin kalau hari ini belum check-in).
  // Putus begitu nemu satu hari kosong.
  const streak = (days) => {
    const set = new Set(days || []);
    const d = new Date();
    if (!set.has(today)) d.setDate(d.getDate() - 1);
    let s = 0;
    while (set.has(isoLocal(d))) { s++; d.setDate(d.getDate() - 1); }
    return s;
  };

  const box = T.el('<div></div>');

  const draw = () => {
    box.innerHTML = '';
    if (!habits.length) {
      box.appendChild(T.el('<p class="center mut">Belum ada habit. Tambah satu di atas buat mulai. 🌱</p>'));
      return;
    }
    habits.forEach((h) => {
      h.days = Array.isArray(h.days) ? h.days : [];
      const doneToday = h.days.includes(today);
      const st = streak(h.days);
      const card = T.el(
        '<div class="card" style="margin-bottom:10px">' +
        '<b>' + T.esc(h.name) + '</b>' +
        '<div class="mut" style="font-size:12px;margin:2px 0 8px">🔥 ' + st + ' hari beruntun · ' + h.days.length + ' total check-in</div>' +
        '</div>');
      const toggle = T.btn(doneToday ? '✔ Sudah check-in hari ini' : 'Check-in hari ini', () => {
        if (doneToday) h.days = h.days.filter((x) => x !== today);
        else h.days.push(today);
        save(); draw();
      }, !doneToday);
      const del = T.btn('Hapus', () => {
        if (confirm('Hapus habit "' + h.name + '" beserta riwayatnya?')) {
          habits = habits.filter((x) => x.id !== h.id);
          save(); draw();
        }
      });
      del.classList.add('danger');
      card.appendChild(T.row(toggle, del));
      box.appendChild(card);
    });
  };

  const inp = T.input('text', 'Contoh: baca buku 10 menit');
  const add = () => {
    const name = inp.value.trim();
    if (!name) { T.toast('Isi nama habit-nya dulu'); return; }
    habits.push({ id: 'h' + Date.now().toString(36) + Math.floor(Math.random() * 999), name, days: [] });
    inp.value = '';
    save(); draw();
    T.toast('Habit ditambah, semangat!');
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  root.appendChild(T.el('<p class="hint">Satu habit, satu check-in sehari. Streak 🔥 dihitung dari hari beruntun — kelewat sehari, mulai lagi dari nol.</p>'));
  root.appendChild(T.field('Habit baru', inp));
  root.appendChild(T.row(T.btn('Tambah habit', add, true)));
  root.appendChild(box);
  draw();
}
