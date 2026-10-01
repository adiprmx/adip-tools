import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id":"checklist-backup","name":"Checklist Backup","cat":"keamanan","icon":"💾","desc":"Checklist backup 3-2-1 + pengingat jadwal.","keywords":"backup,checklist,3-2-1,data,aman,pengingat"};

const KEY = 'adip-tools:checklist-backup:v1';

const ITEMS = [
  ['foto', 'Foto & video HP', 'Jangan cuma di galeri — pindahin ke cloud atau hardisk.'],
  ['dokumen', 'Dokumen penting', 'KTP, KK, ijazah, sertifikat — scan/fotoin semuanya.'],
  ['wa', 'Chat WhatsApp', 'Backup ke Google Drive, cek tanggal backup terakhir.'],
  ['sandi', 'Password manager', 'Ekspor file terenkripsi, simpan satu salinan offline.'],
  ['kontak', 'Kontak', 'Pastikan sinkron ke akun Google, bukan cuma di SIM.'],
  ['kerja', 'File kerja & proyek', 'Repo + arsip, minimal di 2 tempat berbeda.'],
  ['email', 'Email penting', 'Arsipkan atau teruskan ke email cadangan.'],
];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch (e) { return {}; }
}
function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); }
  catch (e) { /* penyimpanan tidak tersedia */ }
}
function fmtDate(d) {
  try {
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return d.toDateString();
  }
}

export function render(root) {
  const state = load();
  if (!state.items) state.items = {};
  if (!state.freq) state.freq = 'mingguan';

  root.appendChild(T.el(
    '<div class="card" style="margin-bottom:14px"><p style="font-weight:700;margin:0 0 6px">Prinsip 3-2-1</p>' +
    '<p class="hint" style="margin:0">3 salinan data · 2 media berbeda (mis. HP + hardisk) · 1 salinan di luar rumah (cloud atau tempat lain). Kalau satu hilang, masih ada cadangan.</p></div>'
  ));

  // progress
  const progWrap = T.el('<div style="margin-bottom:12px"></div>');
  const progLabel = T.el('<p class="hint" style="margin:0 0 6px"></p>');
  const progBar = T.el('<div style="height:8px;border-radius:99px;background:var(--line-soft);overflow:hidden"></div>');
  const progFill = T.el('<div style="height:100%;width:0%;border-radius:99px;background:var(--acc);transition:width .3s"></div>');
  progBar.appendChild(progFill);
  progWrap.appendChild(progLabel);
  progWrap.appendChild(progBar);
  root.appendChild(progWrap);

  const updateProgress = () => {
    const done = ITEMS.filter(([id]) => state.items[id]).length;
    progFill.style.width = Math.round(done / ITEMS.length * 100) + '%';
    progLabel.textContent = done + ' dari ' + ITEMS.length + ' beres' + (done === ITEMS.length ? ' — mantap, datamu aman!' : '');
    save(state);
  };

  // checklist
  const list = T.el('<div></div>');
  ITEMS.forEach(([id, label, hint]) => {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!state.items[id];
    cb.style.cssText = 'width:20px;height:20px;accent-color:var(--acc);flex-shrink:0;margin-top:2px';
    cb.addEventListener('change', () => {
      state.items[id] = cb.checked;
      updateProgress();
    });
    const row = T.el('<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 4px;border-bottom:1px solid var(--line);cursor:pointer"></label>');
    row.appendChild(cb);
    const tx = T.el('<span><span style="font-weight:650;font-size:14px">' + T.esc(label) + '</span><br><span class="hint">' + T.esc(hint) + '</span></span>');
    row.appendChild(tx);
    list.appendChild(row);
  });
  root.appendChild(list);

  // jadwal
  root.appendChild(T.el('<p class="hint" style="margin-top:18px">Pengingat jadwal backup</p>'));
  const freq = T.select([['mingguan', 'Mingguan'], ['bulanan', 'Bulanan']], state.freq);
  const lastInp = T.input('date', 'Terakhir backup');
  if (state.last) lastInp.value = state.last;
  const nextBox = T.out();

  const updateNext = () => {
    if (!state.last) {
      T.show(nextBox, '<p class="hint center">Belum ada jadwal — tandai kapan terakhir kamu backup.</p>');
      return;
    }
    const last = new Date(state.last + 'T00:00:00');
    const next = new Date(last);
    next.setDate(next.getDate() + (state.freq === 'mingguan' ? 7 : 30));
    const now = new Date();
    const late = next < now;
    T.show(nextBox,
      '<p class="center" style="font-size:13px">Backup berikutnya: <b style="color:' + (late ? '#ef4444' : 'var(--ok)') + '">' + T.esc(fmtDate(next)) + '</b>' +
      (late ? '<br><span class="hint">Udah lewat jadwal nih — gas backup sekarang.</span>' : '') + '</p>');
  };

  freq.addEventListener('change', () => { state.freq = freq.value; save(state); updateNext(); });
  lastInp.addEventListener('change', () => { state.last = lastInp.value || ''; save(state); updateNext(); });

  root.appendChild(T.grid2(
    T.field('Frekuensi', freq),
    T.field('Terakhir backup', lastInp)
  ));
  root.appendChild(T.row(T.btn('Tandai backup hari ini', () => {
    const t = new Date();
    const iso = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    state.last = iso;
    lastInp.value = iso;
    save(state);
    updateNext();
    T.toast('Dicatat! Sampai jumpa di backup berikutnya.');
  }, true)));
  root.appendChild(nextBox);

  updateProgress();
  updateNext();
}
