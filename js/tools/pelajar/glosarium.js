import { h as T, utils } from '../../core.js?v=6.9.5';

export const meta = {"id":"glosarium","name":"Glosarium Pribadi","cat":"pelajar","icon":"📖","desc":"Kamus istilah pribadimu: simpan, cari, dan hapus definisi.","keywords":"glosarium,kamus,istilah,definisi,hafalan,kosakata"};

const KEY = 'adip-tools:glosarium';
const uid = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}
function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

export function render(root) {
  let items = load();

  root.appendChild(T.el('<p class="mut">Catat istilah + definisinya di sini. Tersimpan otomatis di HP ini, bisa dicari kapan pun.</p>'));

  const istilahInp = T.input('text', 'Istilah, mis. Fotosintesis', '');
  const defTa = T.ta(3, 'Definisi / penjelasan…', '');
  const searchInp = T.input('text', '🔍 Cari istilah atau definisi…', '');
  const countEl = T.el('<p class="dim" style="font-size:13px"></p>');
  const listEl = T.el('<div></div>');
  const outBox = T.out();

  const draw = () => {
    const q = searchInp.value.trim().toLowerCase();
    const hasil = items
      .filter((it) => !q || it.istilah.toLowerCase().includes(q) || it.definisi.toLowerCase().includes(q))
      .sort((a, b) => a.istilah.localeCompare(b.istilah, 'id'));
    countEl.textContent = items.length
      ? (q ? hasil.length + ' dari ' + items.length + ' istilah cocok' : items.length + ' istilah tersimpan')
      : 'Belum ada istilah. Tambah yang pertama di atas. 📖';
    listEl.innerHTML = '';
    if (q && !hasil.length) listEl.appendChild(T.el('<p class="center mut">Tidak ketemu. Coba kata kunci lain. 🔎</p>'));
    hasil.forEach((it) => {
      const card = T.el('<div class="card" style="margin-bottom:10px"></div>');
      const head = T.el('<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"></div>');
      head.appendChild(T.el('<div style="font-weight:700;font-size:15px">' + T.esc(it.istilah) + '</div>'));
      const del = T.btn('✕', () => {
        items = items.filter((x) => x.id !== it.id);
        save(items); draw();
      });
      head.appendChild(del);
      card.appendChild(head);
      card.appendChild(T.el('<div style="font-size:14px;margin-top:6px;line-height:1.55">' + T.esc(it.definisi) + '</div>'));
      listEl.appendChild(card);
    });
  };

  const tambah = () => {
    const istilah = istilahInp.value.trim();
    const definisi = defTa.value.trim();
    if (!istilah || !definisi) { T.show(outBox, '<span class="err">Isi istilah dan definisinya dulu.</span>'); return; }
    if (items.some((x) => x.istilah.toLowerCase() === istilah.toLowerCase())) {
      T.show(outBox, '<span class="warn">Istilah "' + T.esc(istilah) + '" sudah ada. Hapus dulu kalau mau mengganti.</span>');
      return;
    }
    items.push({ id: uid(), istilah, definisi });
    save(items);
    istilahInp.value = ''; defTa.value = '';
    T.hide(outBox); draw();
    T.toast('Istilah ditambahkan 📖');
  };

  root.appendChild(T.grid2(T.field('Istilah', istilahInp), T.el('<div></div>')));
  root.appendChild(T.field('Definisi', defTa));
  root.appendChild(T.row(T.btn('＋ Tambah istilah', tambah, true)));
  root.appendChild(outBox);
  root.appendChild(T.el('<h4 style="margin:16px 0 8px">Koleksiku</h4>'));
  root.appendChild(T.field('Cari', searchInp));
  searchInp.addEventListener('input', draw);
  root.appendChild(countEl);
  root.appendChild(listEl);
  draw();
}
