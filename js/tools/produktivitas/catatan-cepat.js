import { h as T, utils } from '../../core.js?v=6.3.0';

export const meta = {"id":"catatan-cepat","name":"Catatan Cepat","cat":"produktivitas","icon":"📝","desc":"Catat ide secepat kilat, cari lagi kapan pun.","keywords":"catatan,notes,ide,cepat,memo"};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtTs(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return d.getDate() + ' ' + BULAN[d.getMonth()] + ' ' + d.getFullYear() + ', ' + p(d.getHours()) + '.' + p(d.getMinutes());
}

export function render(root) {
  const KEY = 'adip-tools:notes';
  let notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { notes = []; }
  if (!Array.isArray(notes)) notes = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) {} };

  let query = '';
  const box = T.el('<div></div>');

  const draw = () => {
    box.innerHTML = '';
    const q = query.trim().toLowerCase();
    const shown = notes
      .filter((n) => !q || String(n.text || '').toLowerCase().includes(q))
      .slice()
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (!notes.length) {
      box.appendChild(T.el('<p class="center mut">Belum ada catatan. Tulis yang pertama di atas. ✍️</p>'));
      return;
    }
    if (!shown.length) {
      box.appendChild(T.el('<p class="center mut">Nggak ketemu yang cocok dengan &ldquo;' + T.esc(query.trim()) + '&rdquo;.</p>'));
      return;
    }
    shown.forEach((n) => {
      const card = T.el(
        '<div class="card" style="margin-bottom:8px">' +
        '<div class="mut" style="font-size:11.5px;margin-bottom:4px">' + T.esc(fmtTs(n.ts)) + '</div>' +
        '<div style="white-space:pre-wrap;font-size:13.5px;line-height:1.55">' + T.esc(n.text) + '</div>' +
        '</div>');
      const del = T.btn('Hapus', () => {
        notes = notes.filter((x) => x.id !== n.id);
        save(); draw();
      });
      card.appendChild(T.row(del));
      box.appendChild(card);
    });
  };

  const area = T.ta(4, 'Tulis ide, pengingat, atau apa pun di sini...');
  const add = () => {
    const text = area.value.trim();
    if (!text) { T.toast('Catatannya masih kosong'); return; }
    notes.push({ id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 99), text, ts: Date.now() });
    area.value = '';
    save(); draw();
    T.toast('Tersimpan!');
  };

  const search = T.input('text', '🔍 Cari catatan...');
  search.addEventListener('input', () => { query = search.value; draw(); });

  const clearAll = T.btn('Hapus semua', () => {
    if (!notes.length) return;
    if (confirm('Hapus SEMUA ' + notes.length + ' catatan? Nggak bisa dibalikin loh.')) {
      notes = [];
      save(); draw();
      T.toast('Semua catatan dihapus');
    }
  });
  clearAll.classList.add('danger');

  root.appendChild(T.el('<p class="hint">Ide datang tiba-tiba — tangkap dulu, urusin belakangan. Semua tersimpan otomatis di HP kamu.</p>'));
  root.appendChild(T.field('Catatan baru', area));
  root.appendChild(T.row(T.btn('Simpan catatan', add, true)));
  root.appendChild(T.field('Cari', search));
  root.appendChild(T.row(clearAll));
  root.appendChild(box);
  draw();
}
