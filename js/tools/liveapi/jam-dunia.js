import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id":"jam-dunia","name":"Jam Dunia","cat":"liveapi","icon":"🌍","desc":"Jam realtime 8 kota dunia.","keywords":"jam,dunia,timezone,waktu,kota"};

const KOTA_DEFAULT = [
  ['Jakarta', '🇮🇩', 'Asia/Jakarta'],
  ['Singapura', '🇸🇬', 'Asia/Singapore'],
  ['Tokyo', '🇯🇵', 'Asia/Tokyo'],
  ['Dubai', '🇦🇪', 'Asia/Dubai'],
  ['London', '🇬🇧', 'Europe/London'],
  ['New York', '🇺🇸', 'America/New_York'],
  ['Los Angeles', '🇺🇸', 'America/Los_Angeles'],
  ['Sydney', '🇦🇺', 'Australia/Sydney'],
];

const KOTA_TAMBAHAN = [
  ['Kuala Lumpur', '🇲🇾', 'Asia/Kuala_Lumpur'],
  ['Bangkok', '🇹🇭', 'Asia/Bangkok'],
  ['Denpasar (WITA)', '🇮🇩', 'Asia/Makassar'],
  ['Jayapura (WIT)', '🇮🇩', 'Asia/Jayapura'],
  ['Seoul', '🇰🇷', 'Asia/Seoul'],
  ['Shanghai', '🇨🇳', 'Asia/Shanghai'],
  ['Hong Kong', '🇭🇰', 'Asia/Hong_Kong'],
  ['Mumbai', '🇮🇳', 'Asia/Kolkata'],
  ['Riyadh', '🇸🇦', 'Asia/Riyadh'],
  ['Paris', '🇫🇷', 'Europe/Paris'],
  ['Berlin', '🇩🇪', 'Europe/Berlin'],
  ['Amsterdam', '🇳🇱', 'Europe/Amsterdam'],
  ['Roma', '🇮🇹', 'Europe/Rome'],
  ['Moskow', '🇷🇺', 'Europe/Moscow'],
  ['Kairo', '🇪🇬', 'Africa/Cairo'],
  ['Chicago', '🇺🇸', 'America/Chicago'],
  ['Toronto', '🇨🇦', 'America/Toronto'],
  ['São Paulo', '🇧🇷', 'America/Sao_Paulo'],
  ['Mexico City', '🇲🇽', 'America/Mexico_City'],
  ['Honolulu', '🇺🇸', 'Pacific/Honolulu'],
  ['Auckland', '🇳🇿', 'Pacific/Auckland'],
];

// Cache formatter biar tick tiap detik tetap ringan
const _fc = {};
const F = (tz, opts) => {
  const k = tz + '|' + JSON.stringify(opts);
  if (!_fc[k]) _fc[k] = new Intl.DateTimeFormat('id-ID', Object.assign({ timeZone: tz }, opts));
  return _fc[k];
};

// Selisih offset menit suatu timezone terhadap UTC, dihitung dari jam HP
const offsetMenit = (tz, now) => {
  try {
    const a = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
    const b = new Date(now.toLocaleString('en-US', { timeZone: tz })).getTime();
    return Math.round((b - a) / 60000);
  } catch (e) { return 0; }
};

const selisihWIB = (tz, now) => {
  const d = offsetMenit(tz, now) - offsetMenit('Asia/Jakarta', now);
  if (d === 0) return 'sama dengan WIB';
  const a = Math.abs(d);
  const j = Math.floor(a / 60), m = a % 60;
  const kata = (j && m) ? j + ' jam ' + m + ' mnt' : (j ? j + ' jam' : m + ' mnt');
  return (d > 0 ? '+' : '-') + kata + ' dari WIB';
};

const jamKe = (tz, now) => {
  try {
    const h = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now));
    return ((h % 24) + 24) % 24;
  } catch (e) { return 12; }
};

export function render(root) {
  const KEY = 'adip-tools:jam-dunia';
  const loadCustom = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(d) ? d.filter((x) => typeof x === 'string') : [];
    } catch (e) { return []; }
  };
  const saveCustom = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };

  const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0"></div>');
  const sel = T.select(KOTA_TAMBAHAN.map((k) => [k[2], k[1] + ' ' + k[0]]), KOTA_TAMBAHAN[0][2]);
  let timer = null;
  let refs = [];

  const semuaKota = () => {
    const custom = loadCustom().map((tz) => {
      const info = KOTA_TAMBAHAN.find((k) => k[2] === tz);
      return info ? [info[0], info[1], info[2], true] : null;
    }).filter(Boolean);
    return KOTA_DEFAULT.map((k) => [k[0], k[1], k[2], false]).concat(custom);
  };

  const tick = () => {
    const now = new Date();
    refs.forEach((r) => {
      try {
        r.jam.textContent = F(r.tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
        r.tgl.textContent = F(r.tz, { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
      } catch (e) { r.jam.textContent = '--:--:--'; r.tgl.textContent = ''; }
      r.diff.textContent = selisihWIB(r.tz, now);
      const h = jamKe(r.tz, now);
      r.icon.textContent = (h >= 6 && h < 18) ? '☀️' : '🌙';
    });
  };

  const bangun = () => {
    if (timer) clearInterval(timer);
    grid.innerHTML = '';
    refs = [];
    semuaKota().forEach(([nama, bendera, tz, bisaHapus]) => {
      const kartu = T.el('<div style="background:#141416;border:1px solid #ffffff14;border-radius:12px;padding:12px;position:relative"></div>');
      const badge = tz === 'Asia/Jakarta'
        ? ' <span style="font-size:10px;background:#ffffff1a;border-radius:6px;padding:2px 6px;white-space:nowrap">📍 WIB</span>' : '';
      kartu.innerHTML =
        '<div style="font-size:13px;font-weight:600">' + T.esc(bendera) + ' ' + T.esc(nama) + badge + '</div>' +
        '<div class="jam" style="font-size:25px;font-weight:700;margin:6px 0 2px;font-variant-numeric:tabular-nums;letter-spacing:0.5px">--:--:--</div>' +
        '<div style="font-size:12px"><span class="tgl dim"></span> <span class="icon"></span></div>' +
        '<div class="diff dim" style="font-size:11px;margin-top:4px"></div>';
      if (bisaHapus) {
        const x = T.el('<button type="button" aria-label="Hapus kota" style="position:absolute;top:6px;right:8px;background:none;border:none;color:#71717a;font-size:14px;cursor:pointer;padding:2px">✕</button>');
        x.addEventListener('click', () => {
          saveCustom(loadCustom().filter((t) => t !== tz));
          bangun();
          T.toast('Kota dihapus');
        });
        kartu.appendChild(x);
      }
      grid.appendChild(kartu);
      refs.push({
        tz,
        jam: kartu.querySelector('.jam'),
        tgl: kartu.querySelector('.tgl'),
        diff: kartu.querySelector('.diff'),
        icon: kartu.querySelector('.icon'),
      });
    });
    tick();
    timer = setInterval(tick, 1000);
  };

  const tambah = () => {
    const tz = sel.value;
    const cur = loadCustom();
    if (cur.indexOf(tz) !== -1) { T.toast('Kota itu sudah ada di daftar'); return; }
    cur.push(tz);
    saveCustom(cur);
    bangun();
    T.toast('Kota ditambahkan 🌍');
  };

  root.appendChild(T.el('<p class="hint">Jam di bawah jalan <b>realtime</b>, dihitung langsung dari HP kamu — tanpa internet pun tetap jalan selama jam HP-mu bener. 😄</p>'));
  root.appendChild(grid);
  root.appendChild(T.el('<div class="dim" style="margin:14px 0 6px"><b>➕ Tambah kota lain</b></div>'));
  root.appendChild(T.grid2(T.field('Pilih kota', sel)));
  root.appendChild(T.row(T.btn('＋ Tambah kota', tambah, true)));
  T.onLeave(() => { if (timer) clearInterval(timer); });
  bangun();
}
