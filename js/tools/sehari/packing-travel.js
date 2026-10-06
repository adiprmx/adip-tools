import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "packing-travel", "name": "Checklist Packing Traveling", "cat": "sehari", "icon": "🧳", "desc": "Daftar bawaan traveling, tersimpan otomatis.", "keywords": "packing,traveling,checklist,koper,liburan", "file": "tools/sehari/packing-travel.js"};

const LS_KEY = 'adip-packing';
const DEFAULTS = [
  { icon: '📄', name: 'Dokumen', items: ['KTP', 'Tiket / boarding pass', 'Kartu ATM & uang tunai', 'Itinerary & pesanan hotel', 'Paspor (bila ke luar negeri)'] },
  { icon: '👕', name: 'Pakaian', items: ['Baju secukupnya', 'Celana', 'Pakaian dalam', 'Jaket / sweater', 'Piyama', 'Sandal & sepatu cadangan', 'Handuk'] },
  { icon: '🔌', name: 'Elektronik', items: ['HP + charger', 'Power bank', 'Earphone / headset', 'Colokan universal / adaptor'] },
  { icon: '💊', name: 'Obat & Toiletries', items: ['Sikat gigi + pasta gigi', 'Sabun & sampo (travel size)', 'Obat pribadi', 'Minyak angin / tolak angin', 'Tissue basah & kering', 'Deodoran'] },
  { icon: '🎒', name: 'Lainnya', items: ['Botol minum', 'Payung / jas hujan', 'Snack', 'Tas belanja lipat'] },
];

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.cats) && d.cats.length) return d;
    }
  } catch (e) { /* abaikan */ }
  return { cats: DEFAULTS.map((c) => ({ icon: c.icon, name: c.name, items: c.items.map((t) => ({ t, c: false })) })) };
}
function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ }
}

export function render(root) {
  const state = loadState();

  const progWrap = T.el('<div style="margin-bottom:12px"></div>');
  const progLabel = T.el('<div class="mut" style="font-size:13px;margin-bottom:6px"></div>');
  const progBar = T.el('<div style="height:10px;border-radius:6px;background:rgba(127,127,127,.18);overflow:hidden"></div>');
  const progFill = T.el('<div style="height:100%;width:0%;border-radius:6px;background:#4ade80;transition:width .25s"></div>');
  progBar.appendChild(progFill);
  progWrap.appendChild(progLabel);
  progWrap.appendChild(progBar);

  const listBox = T.el('<div></div>');

  const updateProgress = () => {
    let done = 0, all = 0;
    state.cats.forEach((c) => c.items.forEach((it) => { all++; if (it.c) done++; }));
    progLabel.textContent = all ? (done + ' / ' + all + ' terbawa') : 'Belum ada item';
    progFill.style.width = (all ? Math.round(done / all * 100) : 0) + '%';
    progFill.style.background = done === all && all > 0 ? '#4ade80' : '#38bdf8';
  };

  const draw = () => {
    listBox.innerHTML = '';
    state.cats.forEach((cat) => {
      const doneIn = cat.items.filter((it) => it.c).length;
      const sec = T.el('<div style="margin-bottom:14px"></div>');
      const head = T.el('<div class="fld" style="margin-bottom:6px"><label style="font-weight:700">' +
        T.esc(cat.icon + ' ' + cat.name) + ' <span class="mut" style="font-weight:400;font-size:12px">' +
        doneIn + '/' + cat.items.length + '</span></label></div>');
      sec.appendChild(head);

      cat.items.forEach((it) => {
        const rowEl = T.el('<div style="display:flex;gap:10px;align-items:center;padding:8px 4px;border-bottom:1px solid rgba(127,127,127,.15)"></div>');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!it.c;
        cb.style.cssText = 'width:18px;height:18px;flex:none;accent-color:#38bdf8';
        const label = T.el('<span style="flex:1;font-size:14px;word-break:break-word"></span>');
        label.textContent = it.t;
        const paint = () => {
          label.style.textDecoration = it.c ? 'line-through' : 'none';
          label.style.opacity = it.c ? '.55' : '1';
        };
        paint();
        cb.addEventListener('change', () => { it.c = cb.checked; paint(); saveState(state); updateProgress(); head.querySelector('span').textContent = ' ' + cat.items.filter((x) => x.c).length + '/' + cat.items.length; });
        const del = T.btn('✕', () => {
          cat.items = cat.items.filter((x) => x !== it);
          saveState(state); draw();
        });
        del.style.cssText = 'flex:none;padding:4px 10px;font-size:12px;opacity:.6';
        rowEl.appendChild(cb); rowEl.appendChild(label); rowEl.appendChild(del);
        sec.appendChild(rowEl);
      });

      const addRow = T.el('<div style="display:flex;gap:8px;margin-top:8px"></div>');
      const addInp = T.input('text', 'Tambah item…', '');
      addInp.style.flex = '1';
      const addBtn = T.btn('＋', () => {
        const v = addInp.value.trim();
        if (!v) return;
        cat.items.push({ t: v, c: false });
        addInp.value = '';
        saveState(state); draw();
      });
      addInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });
      addRow.appendChild(addInp); addRow.appendChild(addBtn);
      sec.appendChild(addRow);
      listBox.appendChild(sec);
    });
    updateProgress();
  };

  const copyBtn = T.copyBtn(() => {
    const lines = [];
    state.cats.forEach((c) => {
      const rest = c.items.filter((it) => !it.c);
      if (rest.length) {
        lines.push('[' + c.name + ']');
        rest.forEach((it) => lines.push('☐ ' + it.t));
      }
    });
    return lines.length ? '🧳 Packing (belum terbawa):\n' + lines.join('\n') : '🧳 Semua bawaan sudah terbawa. Selamat jalan! ✈️';
  }, 'Salin yang belum terbawa');

  const resetBtn = T.btn('Reset checklist', () => {
    if (!confirm('Kembalikan ke daftar bawaan awal? Centang & item tambahan akan hilang.')) return;
    state.cats = DEFAULTS.map((c) => ({ icon: c.icon, name: c.name, items: c.items.map((t) => ({ t, c: false })) }));
    saveState(state); draw();
    T.toast('Checklist di-reset.');
  });

  root.appendChild(progWrap);
  root.appendChild(listBox);
  root.appendChild(T.row(copyBtn, resetBtn));
  root.appendChild(T.el('<p class="hint">Tersimpan otomatis di HP ini (localStorage). Centang saat barang masuk koper.</p>'));
  draw();
}
