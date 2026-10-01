import { h as T, p2 } from '../../core.js?v=6.7.0';

export const meta = {"id":"hitung-mundur-ujian","name":"Hitung Mundur Ujian","cat":"pelajar","icon":"⏳","desc":"Countdown live tiap ujian: hari, jam, menit, detik + label mepet.","keywords":"ujian,countdown,hitung mundur,jadwal,sekolah,kuliah,ulangan"};

const KEY = 'adip-tools-hitung-mundur-ujian';

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(d) ? d.filter((e) => e && e.nama && e.ts) : [];
  } catch (e) { return []; }
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* abaikan */ }
}
function fmtTanggal(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return String(ts); }
}
function urgensi(diff) {
  if (diff <= 0) return ['⏹️', 'sudah lewat'];
  if (diff < 24 * 3600 * 1000) return ['🔥', 'mepet banget!'];
  if (diff < 7 * 24 * 3600 * 1000) return ['😬', 'mepet!'];
  if (diff < 30 * 24 * 3600 * 1000) return ['🙂', 'waspada'];
  return ['😌', 'masih santai'];
}

export function render(root) {
  let exams = load();
  const listBox = T.el('<div></div>');
  const namaInp = T.input('text', 'mis. Ujian Matematika', '');
  const tglInp = T.input('datetime-local', '', '');
  let items = [];

  const tick = () => {
    const now = Date.now();
    items.forEach((it) => {
      const diff = it.ts - now;
      if (diff <= 0) {
        it.cdEl.textContent = '00:00:00:00';
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor(diff / 3600000) % 24;
        const m = Math.floor(diff / 60000) % 60;
        const s = Math.floor(diff / 1000) % 60;
        it.cdEl.textContent = p2(d) + ':' + p2(h) + ':' + p2(m) + ':' + p2(s);
      }
      const u = urgensi(diff);
      it.lbEl.textContent = u[0] + ' ' + u[1];
    });
  };

  const gambar = () => {
    listBox.innerHTML = '';
    items = [];
    if (!exams.length) {
      listBox.appendChild(T.el('<p class="hint center" style="margin-top:14px">Belum ada ujian. Tambah jadwal ujianmu di atas biar nggak kaget pas hari-H. 😄</p>'));
      return;
    }
    exams.slice().sort((a, b) => a.ts - b.ts).forEach((e) => {
      const cdEl = T.el('<div class="big" style="font-variant-numeric:tabular-nums">--:--:--:--</div>');
      const lbEl = T.el('<div class="dim"></div>');
      const hapus = T.btn('Hapus', () => {
        exams = exams.filter((x) => x.id !== e.id);
        save(exams);
        gambar();
        tick();
      });
      const card = T.el('<div style="border:1px solid #ffffff20;border-radius:10px;padding:12px;margin:10px 0"></div>');
      card.appendChild(T.el('<p style="font-size:15px;margin:0 0 2px"><b>' + T.esc(e.nama) + '</b></p>'));
      card.appendChild(T.el('<p class="dim" style="margin:0 0 8px;font-size:12.5px">' + T.esc(fmtTanggal(e.ts)) + '</p>'));
      card.appendChild(cdEl);
      card.appendChild(T.el('<p class="hint" style="margin:2px 0 8px;font-size:11.5px">hari : jam : menit : detik</p>'));
      card.appendChild(lbEl);
      card.appendChild(T.el('<div style="margin-top:8px"></div>')).appendChild(hapus);
      listBox.appendChild(card);
      items.push({ ts: e.ts, cdEl, lbEl });
    });
    tick();
  };

  const tambah = () => {
    const nama = namaInp.value.trim();
    const ts = new Date(tglInp.value).getTime();
    if (!nama) { T.toast('Isi nama mapelnya dulu'); return; }
    if (!tglInp.value || isNaN(ts)) { T.toast('Pilih tanggal & jam ujiannya'); return; }
    exams.push({ id: 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), nama, ts });
    save(exams);
    namaInp.value = '';
    tglInp.value = '';
    gambar();
    T.toast('Ujian ditambahkan. Semangat! 💪');
  };

  root.appendChild(T.el('<p class="hint">Catat semua jadwal ujianmu di sini. Countdown-nya jalan live tiap detik, lengkap sama label seberapa mepet waktumu.</p>'));
  root.appendChild(T.grid2(T.field('Nama mapel / ujian', namaInp), T.field('Tanggal & jam', tglInp)));
  root.appendChild(T.row(T.btn('Tambah ujian', tambah, true)));
  root.appendChild(listBox);
  gambar();

  const iv = setInterval(tick, 1000);
  T.onLeave(() => clearInterval(iv));
}
