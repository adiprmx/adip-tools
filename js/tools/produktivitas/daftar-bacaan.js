import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"daftar-bacaan","name":"Daftar Bacaan","cat":"produktivitas","icon":"📚","desc":"Kumpulkan buku & artikel yang mau dibaca, lacak statusnya sampai selesai.","keywords":"bacaan,buku,artikel,reading list,read later,antrean baca,literasi"};

const STATUS = [
  ['antri', '📥 Antri'],
  ['dibaca', '📖 Sedang dibaca'],
  ['selesai', '✅ Selesai']
];
const TYPE = ['Buku', 'Artikel', 'E-book', 'Komik', 'Lainnya'];

export function render(root) {
  const KEY = 'adip-tools:bacaan';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { items = []; }
  if (!Array.isArray(items)) items = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  const uid = () => 'b' + Date.now().toString(36) + Math.floor(Math.random() * 999);
  const stLabel = (s) => (STATUS.find((x) => x[0] === s) || STATUS[0])[1];

  let filter = 'semua';
  const box = T.el('<div></div>');

  const draw = () => {
    box.innerHTML = '';
    const counts = { antri: 0, dibaca: 0, selesai: 0 };
    items.forEach((i) => { if (counts[i.status] !== undefined) counts[i.status]++; });
    const chips = T.el('<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"></div>');
    [['semua', 'Semua (' + items.length + ')'], ['antri', '📥 Antri (' + counts.antri + ')'], ['dibaca', '📖 Dibaca (' + counts.dibaca + ')'], ['selesai', '✅ Selesai (' + counts.selesai + ')']]
      .forEach(([val, label]) => {
        const b = T.btn(label, () => { filter = val; draw(); }, filter === val);
        b.style.padding = '6px 12px';
        b.style.fontSize = '13px';
        chips.appendChild(b);
      });
    box.appendChild(chips);

    const shown = items.filter((i) => filter === 'semua' || i.status === filter);
    if (!shown.length) {
      box.appendChild(T.el('<p class="center mut">' + (items.length ? 'Tidak ada yang cocok dengan filter ini.' : 'Daftar masih kosong. Tambah bacaan pertama di atas. 📚') + '</p>'));
      return;
    }
    shown.forEach((i) => {
      const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
      card.appendChild(T.el(
        '<b>' + T.esc(i.title) + '</b>' +
        '<div class="mut" style="font-size:12px;margin:2px 0 6px">' + T.esc(i.type || 'Buku') + (i.author ? ' · ' + T.esc(i.author) : '') + '</div>'));
      const sel = T.select(STATUS, i.status);
      sel.style.fontSize = '13px';
      sel.addEventListener('change', () => { i.status = sel.value; save(); draw(); });
      const del = T.el('<button class="btn ghost danger" style="padding:6px 12px;font-size:13px">Hapus</button>');
      del.addEventListener('click', () => {
        if (confirm('Hapus "' + i.title + '" dari daftar?')) {
          items = items.filter((x) => x.id !== i.id);
          save(); draw();
        }
      });
      card.appendChild(T.row(sel, del));
      box.appendChild(card);
    });
  };

  const titleInp = T.input('text', 'Judul buku/artikel');
  const authorInp = T.input('text', 'Penulis (opsional)');
  const typeSel = T.select(TYPE.map((t) => [t, t]), TYPE[0]);
  const stSel = T.select(STATUS, 'antri');
  const add = () => {
    const title = titleInp.value.trim();
    if (!title) { T.toast('Isi judulnya dulu'); return; }
    items.unshift({ id: uid(), title, author: authorInp.value.trim(), type: typeSel.value, status: stSel.value });
    titleInp.value = ''; authorInp.value = '';
    save(); draw();
    T.toast('Masuk daftar bacaan 📚');
  };
  titleInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  root.appendChild(T.el('<p class="hint">Semua tab artikel & rekomendasi buku yang selama ini cuma numpuk di kepala — taruh di sini biar beneran dibaca.</p>'));
  root.appendChild(T.field('Judul', titleInp));
  const authorField = T.field('Penulis', authorInp);
  root.appendChild(authorField);
  root.appendChild(T.field('Jenis', typeSel));
  root.appendChild(T.field('Status awal', stSel));
  root.appendChild(T.row(T.btn('Tambah bacaan', add, true)));
  root.appendChild(box);
  draw();
}
