import { h as T, utils } from '../../core.js?v=6.3.0';

export const meta = {"id":"flashcard","name":"Flashcard","cat":"pelajar","icon":"🃏","desc":"Hafalkan apa pun dengan kartu bolak-balik.","keywords":"flashcard,kartu,hafalan,belajar,kuis,memori"};

// Contoh bawaan — cuma di memori, TIDAK ditulis ke localStorage otomatis.
const CONTOH = [
  { front: 'Ibukota Jepang', back: 'Tokyo' },
  { front: 'H₂O adalah rumus kimia dari…', back: 'Air' },
  { front: '7 × 8 = …', back: '56' },
];

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function render(root) {
  const KEY = 'adip-tools:flashcard';
  let userCards = [];
  try { userCards = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { userCards = []; }
  if (!Array.isArray(userCards)) userCards = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(userCards)); } catch (e) {} };

  const cards = () => (userCards.length ? userCards : CONTOH);
  const isContoh = () => userCards.length === 0;

  // ---------- Mode belajar ----------
  let idx = 0, order = [], flipped = false, shuffleMode = false;
  const studyCard = T.el(
    '<div class="card tapzone" style="min-height:130px;display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;margin-bottom:8px"></div>');
  const counter = T.el('<p class="center mut" style="font-size:12.5px"></p>');
  const studyBox = T.el('<div></div>');

  const resetOrder = () => {
    const n = cards().length;
    order = acak(Array.from({ length: n }, (_, i) => i));
    if (!shuffleMode) order = Array.from({ length: n }, (_, i) => i);
    idx = 0; flipped = false;
  };

  const drawStudy = () => {
    studyBox.innerHTML = '';
    if (!cards().length) {
      studyBox.appendChild(T.el('<p class="center mut">Belum ada kartu. Bikin dulu di bawah. 🃏</p>'));
      return;
    }
    if (idx >= order.length) resetOrder();
    const c = cards()[order[idx]];
    studyCard.innerHTML = '';
    studyCard.appendChild(T.el('<div class="center">' + T.esc(flipped ? c.back : c.front) + '</div>'));
    studyCard.style.transform = '';
    counter.textContent = 'kartu ' + (idx + 1) + '/' + order.length + (isContoh() ? ' · contoh' : '');
    const next = T.btn('Lanjut →', () => {
      idx++;
      if (idx >= order.length) resetOrder();
      else flipped = false;
      drawStudy();
    }, true);
    const shuffleBtn = T.btn(shuffleMode ? '🔀 Acak: ON' : '🔀 Acak: OFF', () => {
      shuffleMode = !shuffleMode;
      resetOrder();
      drawStudy();
    });
    studyBox.appendChild(studyCard);
    studyBox.appendChild(counter);
    studyBox.appendChild(T.row(next, shuffleBtn));
    studyBox.appendChild(T.el('<p class="hint center">Ketuk kartunya buat balik depan ↔ belakang.</p>'));
  };
  studyCard.addEventListener('click', () => {
    flipped = !flipped;
    T.beep(520, 0.05, 'sine');
    drawStudy();
  });

  // ---------- Daftar & tambah kartu ----------
  const listBox = T.el('<div></div>');

  const drawList = () => {
    listBox.innerHTML = '';
    if (isContoh()) {
      listBox.appendChild(T.el('<p class="hint">Di bawah ini 3 kartu contoh biar langsung bisa dicoba. Begitu kamu tambah kartumu sendiri, contohnya diganti punyamu.</p>'));
    }
    cards().forEach((c, i) => {
      const line = T.el('<div class="card" style="margin-bottom:8px"><b style="font-size:13px">' + T.esc(c.front) + '</b><div class="mut" style="font-size:12.5px;margin-top:2px">→ ' + T.esc(c.back) + '</div></div>');
      if (!isContoh()) {
        const del = T.btn('Hapus', () => {
          userCards = userCards.filter((_, j) => j !== i);
          save();
          resetOrder();
          drawList(); drawStudy();
        });
        line.appendChild(T.row(del));
      }
      listBox.appendChild(line);
    });
  };

  const fInp = T.input('text', 'Sisi depan — mis. pertanyaan');
  const bInp = T.input('text', 'Sisi belakang — mis. jawaban');
  const add = () => {
    const front = fInp.value.trim(), back = bInp.value.trim();
    if (!front || !back) { T.toast('Isi depan & belakangnya dulu'); return; }
    userCards.push({ front, back });
    fInp.value = ''; bInp.value = '';
    save();
    resetOrder();
    drawList(); drawStudy();
    T.toast('Kartu ditambah!');
  };
  bInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

  root.appendChild(T.el('<div class="h3">📖 Mode belajar</div>'));
  root.appendChild(studyBox);
  root.appendChild(T.el('<div class="h3" style="margin-top:16px">➕ Kartu baru</div>'));
  root.appendChild(T.field('Sisi depan', fInp));
  root.appendChild(T.field('Sisi belakang', bInp));
  root.appendChild(T.row(T.btn('Tambah kartu', add, true)));
  root.appendChild(T.el('<div class="h3" style="margin-top:16px">🗂️ Semua kartu</div>'));
  root.appendChild(listBox);

  resetOrder();
  drawList();
  drawStudy();
}
