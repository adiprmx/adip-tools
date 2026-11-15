import { h as T, utils } from '../../core.js?v=6.12.1';

export const meta = {"id": "tebak-angka", "name": "Tebak Angka", "cat": "fun", "icon": "🔢", "desc": "Komputer mikir satu angka. 3 level: 1-50, 1-100, 1-500.", "keywords": "tebak,angka,game,kuis,skor,level"};

const LEVELS = [
  { id: 'santai', label: 'Santai (1–50)', min: 1, max: 50 },
  { id: 'normal', label: 'Normal (1–100)', min: 1, max: 100 },
  { id: 'gila', label: 'Gila (1–500)', min: 1, max: 500 },
];
const LS_KEY = 'tebak-angka-best-v2';
function loadBest() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (e) { return {}; }
}
function saveBest(b) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(b)); } catch (e) { /* abaikan */ }
}

export function render(root) {
  let level = LEVELS[1];
  let target = 1, attempts = 0, lo = 1, hi = 100, done = false;
  let history = [];
  let best = loadBest();

  const lvlSel = T.select(LEVELS.map((l) => [l.id, l.label]), 'normal');
  const inp = T.input('number', 'Tebak angkanya', '');
  const msg = T.out();
  const histBox = T.out();
  const bestBox = T.el('<p class="hint center"></p>');
  const shareBox = T.out();

  const bestTxt = () => {
    const parts = LEVELS.map((l) => l.label.split(' ')[0] + ': ' + (best[l.id] || 0));
    return 'Skor terbaik — ' + parts.join(' · ');
  };
  const gambarBest = () => { bestBox.textContent = bestTxt(); };

  const score = () => Math.max(100, 1000 - (attempts - 1) * 100);

  const renderHist = () => {
    if (!history.length) { T.hide(histBox); return; }
    T.show(histBox, '<div class="center" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">' +
      history.map((g) => '<span style="border:1px solid var(--line);border-radius:8px;padding:4px 10px;font-size:12.5px;font-family:monospace">' + g + '</span>').join('') +
      '</div><p class="hint center">Petunjuk: angkanya di antara ' + lo + ' – ' + hi + '</p>');
  };

  const tebak = () => {
    if (done) return;
    const g = parseInt(inp.value, 10);
    if (isNaN(g) || g < level.min || g > level.max) {
      T.show(msg, '<p class="center" style="color:var(--warn);font-size:13px">Isi angka ' + level.min + ' sampai ' + level.max + ' dulu.</p>');
      return;
    }
    attempts++;
    history.push(g);
    if (g === target) {
      done = true;
      const sc = score();
      let baru = '';
      if (sc > (best[level.id] || 0)) { best[level.id] = sc; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
      gambarBest();
      T.show(msg, '<div class="center" style="padding:6px 0">' +
        '<div style="font-size:34px">🎉</div>' +
        '<p style="font-size:15px;font-weight:700;margin:6px 0">BENER! Angkanya ' + target + '.</p>' +
        '<p class="hint">Ketebak dalam ' + attempts + ' percobaan · level ' + level.label + ' · skor <b>' + sc + '</b>' + baru + '</p></div>');
      const teks = '🔢 Tebak Angka (' + level.label + '): aku nebak ' + target + ' dalam ' + attempts + ' percobaan, skor ' + sc + '! Coba kalahin aku di Adip Tools.';
      const w = T.el('<div class="row center" style="margin-top:6px"></div>');
      w.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
      if (typeof navigator !== 'undefined' && navigator.share) {
        w.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
      }
      T.show(shareBox, '');
      shareBox.appendChild(w);
      T.beep(523, 0.12); T.beep(659, 0.12, 'sine', 0.12); T.beep(784, 0.2, 'sine', 0.24);
    } else if (g < target) {
      lo = Math.max(lo, g + 1);
      T.show(msg, '<p class="center" style="font-size:14px">Kekecilan! Angkanya lebih <b>gede</b> dari ' + g + '.</p>');
      T.beep(220, 0.1, 'square');
    } else {
      hi = Math.min(hi, g - 1);
      T.show(msg, '<p class="center" style="font-size:14px">Kegedean! Turunin <b>dikit</b> dari ' + g + '.</p>');
      T.beep(180, 0.1, 'square');
    }
    renderHist();
    inp.value = '';
    inp.focus();
  };

  const mainLagi = () => {
    target = level.min + Math.floor(Math.random() * (level.max - level.min + 1));
    attempts = 0; lo = level.min; hi = level.max; done = false; history = [];
    inp.min = String(level.min); inp.max = String(level.max);
    inp.placeholder = 'Tebak angka ' + level.min + '–' + level.max;
    T.hide(histBox); T.hide(shareBox);
    inp.value = '';
    T.show(msg, '<p class="center hint">Udah diacak lagi (' + level.label + '). Gas, tebak!</p>');
    inp.focus();
  };

  lvlSel.addEventListener('change', () => {
    level = LEVELS.find((l) => l.id === lvlSel.value) || LEVELS[1];
    mainLagi();
  });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tebak(); });

  root.appendChild(T.el('<p class="center hint">Aku lagi mikirin satu angka.<br>Coba tebak — makin dikit tebakanmu, makin gede skormu.</p>'));
  root.appendChild(T.field('Level', lvlSel));
  root.appendChild(T.field('Tebakanmu', inp));
  root.appendChild(T.row(T.btn('Tebak!', tebak, true), T.btn('Main Lagi', mainLagi)));
  root.appendChild(msg);
  root.appendChild(histBox);
  root.appendChild(shareBox);
  root.appendChild(bestBox);
  gambarBest();
  mainLagi();
}
