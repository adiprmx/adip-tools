import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"kalender-konten","name":"Kalender Konten","cat":"produktivitas","icon":"📅","desc":"Jadwalkan ide konten per tanggal & platform.","keywords":"kalender,konten,content,tiktok,instagram,youtube,ide,jadwal,sosmed"};

const PLATFORM = [
  ['tiktok', '🎵 TikTok'],
  ['instagram', '📸 Instagram'],
  ['youtube', '▶️ YouTube'],
  ['x', '𝕏 X (Twitter)'],
  ['facebook', '📘 Facebook'],
];
const labelPlatform = (v) => (PLATFORM.find((p) => p[0] === v) || PLATFORM[0])[1];
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function p2(n) { return String(n).padStart(2, '0'); }

export function render(root) {
  const KEY = 'adip-tools:kalender-konten';
  let ide = [];
  try { ide = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { ide = []; }
  if (!Array.isArray(ide)) ide = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ide)); } catch (e) {} };

  const now = new Date();
  let viewY = now.getFullYear(), viewM = now.getMonth();

  root.appendChild(T.el('<p class="hint">Ide konten yang cuma numpuk di kepala pasti lupa. Tulis di sini, tempel ke tanggalnya, pilih platformnya. 📝</p>'));

  const tgl = T.input('date');
  tgl.value = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate());
  const ideInp = T.input('text', 'Contoh: tutorial mix lagu viral versi remix');
  const plat = T.select(PLATFORM);

  const tambah = () => {
    if (!tgl.value) { T.toast('Pilih tanggalnya dulu'); return; }
    const teks = ideInp.value.trim();
    if (!teks) { T.toast('Tulis dulu ide kontennya'); return; }
    ide.push({
      id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 999),
      tanggal: tgl.value,
      ide: teks,
      platform: plat.value,
    });
    ideInp.value = '';
    save(); draw();
    T.toast('Ide kesimpan, gas eksekusi!');
  };
  ideInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tambah(); });

  root.appendChild(T.field('Tanggal', tgl));
  root.appendChild(T.field('Ide konten', ideInp));
  root.appendChild(T.field('Platform', plat));
  root.appendChild(T.btn('Simpan ide', tambah, true));
  root.appendChild(T.el('<div style="height:14px"></div>'));

  const calBox = T.el('<div></div>');
  root.appendChild(calBox);

  const draw = () => {
    const ym = viewY + '-' + p2(viewM + 1);
    const bulanIni = ide.filter((x) => String(x.tanggal || '').slice(0, 7) === ym)
      .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));

    // Kalender mini: tandai tanggal yang ada idenya
    const set = {};
    bulanIni.forEach((x) => { set[x.tanggal] = (set[x.tanggal] || 0) + 1; });
    const first = new Date(viewY, viewM, 1);
    const startDow = (first.getDay() + 6) % 7; // Senin=0
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const todayISO = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate());

    let cells = '';
    for (let i = 0; i < startDow; i++) cells += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = viewY + '-' + p2(viewM + 1) + '-' + p2(d);
      const n = set[iso] || 0;
      const isToday = iso === todayISO;
      cells += '<div class="center" style="padding:6px 2px;border-radius:8px;font-size:12px;' +
        (isToday ? 'border:1px solid #4ade80;' : '') + '">' +
        '<div>' + d + '</div>' +
        (n ? '<div style="font-size:10px" class="ok">●' + (n > 1 ? ' ' + n : '') + '</div>' : '<div style="font-size:10px">&nbsp;</div>') +
        '</div>';
    }

    calBox.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
      '<button type="button" class="btn" id="kPrev">◀</button>' +
      '<b>' + NAMA_BULAN[viewM] + ' ' + viewY + '</b>' +
      '<button type="button" class="btn" id="kNext">▶</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:12px">' +
      ['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((x) => '<div class="center mut" style="font-size:10px;padding:4px">' + x + '</div>').join('') +
      cells + '</div>' +
      '<div id="kList"></div>';
    calBox.querySelector('#kPrev').addEventListener('click', () => {
      viewM--; if (viewM < 0) { viewM = 11; viewY--; }
      draw();
    });
    calBox.querySelector('#kNext').addEventListener('click', () => {
      viewM++; if (viewM > 11) { viewM = 0; viewY++; }
      draw();
    });

    const list = calBox.querySelector('#kList');
    if (!bulanIni.length) {
      list.appendChild(T.el('<p class="center mut">Belum ada ide di bulan ini. Tambahin di atas biar jadwal kontenmu rapi. 📌</p>'));
      return;
    }
    bulanIni.forEach((x) => {
      const card = T.el('<div class="card" style="margin-bottom:8px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start"></div>');
      const tglN = (x.tanggal || '').split('-');
      card.appendChild(T.el('<div class="center" style="flex-shrink:0;min-width:44px"><div style="font-size:18px;font-weight:700">' + T.esc(tglN[2] || '') + '</div><div class="mut" style="font-size:10px">' + NAMA_BULAN[Number(tglN[1]) - 1].slice(0, 3) + '</div></div>'));
      const mid = T.el('<div style="flex:1;min-width:0"></div>');
      mid.appendChild(T.el('<div style="font-size:13px;line-height:1.5">' + T.esc(x.ide) + '</div>'));
      mid.appendChild(T.el('<div class="mut" style="font-size:11px;margin-top:4px">' + T.esc(labelPlatform(x.platform)) + '</div>'));
      card.appendChild(mid);
      const del = T.btn('✕', () => {
        if (confirm('Hapus ide ini?')) {
          ide = ide.filter((y) => y.id !== x.id);
          save(); draw();
        }
      });
      del.style.cssText = 'padding:4px 9px;flex-shrink:0';
      card.appendChild(del);
      list.appendChild(card);
    });
  };

  draw();
}
