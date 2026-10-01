import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "tebak-angka", "name": "Tebak Angka", "cat": "fun", "icon": "🔢", "desc": "Komputer mikir angka 1-100. Berani nebak?", "keywords": "tebak,angka,game,kuis,skor"};

const LS_KEY = 'tebak-angka-best';
function loadBest() {
  try {
    const v = parseInt(localStorage.getItem(LS_KEY), 10);
    return isNaN(v) ? 0 : v;
  } catch (e) { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem(LS_KEY, String(v)); } catch (e) { /* abaikan */ }
}

export function render(root) {
  let target = 1 + Math.floor(Math.random() * 100);
  let attempts = 0, lo = 1, hi = 100, done = false;
  let history = [];
  let best = loadBest();

  const inp = T.input('number', 'Tebak angka 1-100', '');
  inp.min = '1'; inp.max = '100';
  const msg = T.out();
  const histBox = T.out();
  const bestBox = T.el('<p class="hint center">Skor terbaikmu: <b>' + best + '</b></p>');

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
    if (isNaN(g) || g < 1 || g > 100) {
      T.show(msg, '<p class="center" style="color:var(--warn);font-size:13px">Isi angka 1 sampai 100 dulu.</p>');
      return;
    }
    attempts++;
    history.push(g);
    if (g === target) {
      done = true;
      const sc = score();
      let baru = '';
      if (sc > best) { best = sc; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
      bestBox.innerHTML = 'Skor terbaikmu: <b>' + best + '</b>';
      T.show(msg, '<div class="center" style="padding:6px 0">' +
        '<div style="font-size:34px">🎉</div>' +
        '<p style="font-size:15px;font-weight:700;margin:6px 0">BENER! Angkanya ' + target + '.</p>' +
        '<p class="hint">Ketebak dalam ' + attempts + ' percobaan · skor <b>' + sc + '</b>' + baru + '</p></div>');
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
    target = 1 + Math.floor(Math.random() * 100);
    attempts = 0; lo = 1; hi = 100; done = false; history = [];
    T.hide(msg); T.hide(histBox);
    inp.value = '';
    T.show(msg, '<p class="center hint">Udah diacak lagi. Gas, tebak!</p>');
    inp.focus();
  };

  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tebak(); });

  root.appendChild(T.el('<p class="center hint">Aku lagi mikirin satu angka dari 1 sampai 100.<br>Coba tebak — makin dikit tebakanmu, makin gede skormu.</p>'));
  root.appendChild(T.field('Tebakanmu', inp));
  root.appendChild(T.row(T.btn('Tebak!', tebak, true), T.btn('Main Lagi', mainLagi)));
  root.appendChild(msg);
  root.appendChild(histBox);
  root.appendChild(bestBox);
}
