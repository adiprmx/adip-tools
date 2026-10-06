import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"perencana-mingguan","name":"Perencana Mingguan","cat":"produktivitas","icon":"🗓️","desc":"Susun blok waktu kegiatan untuk 7 hari ke depan, biar minggumu punya arah.","keywords":"perencana mingguan,weekly planner,time block,jadwal,minggu,planning,rencana"};

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function render(root) {
  const KEY = 'adip-tools:rencana-minggu';
  let blocks = [];
  try { blocks = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { blocks = []; }
  if (!Array.isArray(blocks)) blocks = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(blocks)); } catch (e) {} };
  const uid = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 999);

  const box = T.el('<div></div>');

  const draw = () => {
    box.innerHTML = '';
    const total = blocks.length;
    const today = (new Date().getDay() + 6) % 7; // 0 = Senin
    DAYS.forEach((day, di) => {
      const list = blocks.filter((b) => b.day === di).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      const card = T.el(
        '<div class="card" style="margin-bottom:10px' + (di === today ? ';border-color:#ffffff44' : '') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<b>' + day + (di === today ? ' <span style="font-size:11px;background:#ffffff22;border-radius:99px;padding:2px 8px">hari ini</span>' : '') + '</b>' +
        '<span class="mut" style="font-size:12px">' + list.length + ' blok</span>' +
        '</div></div>');
      if (!list.length) {
        card.appendChild(T.el('<p class="mut" style="font-size:13px;margin:4px 0">Belum ada rencana — hari kosong rawan diisi hal random.</p>'));
      }
      list.forEach((b) => {
        const rowEl = T.el('<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #ffffff10"></div>');
        rowEl.appendChild(T.el('<span class="mut" style="font-size:13px;min-width:52px">' + T.esc(b.time || '--:--') + '</span>'));
        rowEl.appendChild(T.el('<span style="flex:1;font-size:14px">' + T.esc(b.text) + '</span>'));
        const del = T.el('<button class="btn ghost" style="padding:4px 10px;font-size:12px">✕</button>');
        del.addEventListener('click', () => {
          blocks = blocks.filter((x) => x.id !== b.id);
          save(); draw();
        });
        rowEl.appendChild(del);
        card.appendChild(rowEl);
      });
      box.appendChild(card);
    });
    const clear = T.el('<div class="center" style="margin-top:4px"></div>');
    if (total) {
      const cb = T.btn('Hapus semua (' + total + ')', () => {
        if (confirm('Hapus seluruh rencana minggu ini?')) { blocks = []; save(); draw(); }
      });
      cb.classList.add('danger');
      cb.style.fontSize = '13px';
      clear.appendChild(cb);
    }
    box.appendChild(clear);
  };

  const daySel = T.select(DAYS.map((d, i) => [String(i), d]), String((new Date().getDay() + 6) % 7));
  const timeInp = T.input('time', '');
  const textInp = T.input('text', 'Kegiatan, mis. deep work skripsi');
  const add = () => {
    const text = textInp.value.trim();
    if (!text) { T.toast('Isi kegiatannya dulu'); return; }
    blocks.push({ id: uid(), day: Number(daySel.value), time: timeInp.value || '', text });
    textInp.value = '';
    save(); draw();
    T.toast('Blok waktu ditambahkan 🗓️');
  };
  textInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  root.appendChild(T.el('<p class="hint">Jangan biarkan minggumu jalan tanpa rencana. Isi blok waktu per hari — mulai dari yang paling penting.</p>'));
  root.appendChild(T.field('Hari', daySel));
  root.appendChild(T.field('Jam (opsional)', timeInp));
  root.appendChild(T.field('Kegiatan', textInp));
  root.appendChild(T.row(T.btn('Tambah blok', add, true)));
  root.appendChild(box);
  draw();
}
