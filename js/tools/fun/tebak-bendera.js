import { h as T, utils } from '../../core.js?v=6.12.2';

export const meta = {"id":"tebak-bendera","name":"Tebak Bendera","cat":"fun","icon":"🏳️","desc":"Kuis 10 soal acak: tebak negara dari emoji benderanya. 64 negara, 2 level.","keywords":"bendera,negara,kuis,flag,geografi,dunia,level"};

// [nama Indonesia, kode ISO] — emoji bendera dihitung dari kode ISO (regional indicator), dijamin benar.
// level: 'mudah' = negara yang umum dikenal, 'sulit' = tambahan yang lebih jarang.
const NEGARA = [
  // --- mudah (36) ---
  ['Indonesia', 'ID', 'mudah'], ['Malaysia', 'MY', 'mudah'], ['Singapura', 'SG', 'mudah'], ['Thailand', 'TH', 'mudah'],
  ['Filipina', 'PH', 'mudah'], ['Vietnam', 'VN', 'mudah'], ['Jepang', 'JP', 'mudah'], ['Korea Selatan', 'KR', 'mudah'],
  ['China', 'CN', 'mudah'], ['India', 'IN', 'mudah'], ['Australia', 'AU', 'mudah'], ['Selandia Baru', 'NZ', 'mudah'],
  ['Amerika Serikat', 'US', 'mudah'], ['Inggris', 'GB', 'mudah'], ['Prancis', 'FR', 'mudah'], ['Jerman', 'DE', 'mudah'],
  ['Italia', 'IT', 'mudah'], ['Spanyol', 'ES', 'mudah'], ['Belanda', 'NL', 'mudah'], ['Brasil', 'BR', 'mudah'],
  ['Argentina', 'AR', 'mudah'], ['Meksiko', 'MX', 'mudah'], ['Kanada', 'CA', 'mudah'], ['Mesir', 'EG', 'mudah'],
  ['Afrika Selatan', 'ZA', 'mudah'], ['Nigeria', 'NG', 'mudah'], ['Turki', 'TR', 'mudah'], ['Arab Saudi', 'SA', 'mudah'],
  ['Uni Emirat Arab', 'AE', 'mudah'], ['Rusia', 'RU', 'mudah'], ['Ukraina', 'UA', 'mudah'], ['Portugal', 'PT', 'mudah'],
  ['Yunani', 'GR', 'mudah'], ['Swiss', 'CH', 'mudah'], ['Swedia', 'SE', 'mudah'], ['Norwegia', 'NO', 'mudah'],
  // --- sulit (28) ---
  ['Denmark', 'DK', 'sulit'], ['Finlandia', 'FI', 'sulit'], ['Irlandia', 'IE', 'sulit'], ['Polandia', 'PL', 'sulit'],
  ['Austria', 'AT', 'sulit'], ['Belgia', 'BE', 'sulit'], ['Ceko', 'CZ', 'sulit'], ['Hungaria', 'HU', 'sulit'],
  ['Rumania', 'RO', 'sulit'], ['Kroasia', 'HR', 'sulit'], ['Islandia', 'IS', 'sulit'], ['Nepal', 'NP', 'sulit'],
  ['Sri Lanka', 'LK', 'sulit'], ['Bangladesh', 'BD', 'sulit'], ['Pakistan', 'PK', 'sulit'], ['Myanmar', 'MM', 'sulit'],
  ['Kamboja', 'KH', 'sulit'], ['Laos', 'LA', 'sulit'], ['Brunei', 'BN', 'sulit'], ['Chile', 'CL', 'sulit'],
  ['Peru', 'PE', 'sulit'], ['Kolombia', 'CO', 'sulit'], ['Kuba', 'CU', 'sulit'], ['Jamaika', 'JM', 'sulit'],
  ['Kenya', 'KE', 'sulit'], ['Maroko', 'MA', 'sulit'], ['Qatar', 'QA', 'sulit'], ['Oman', 'OM', 'sulit'],
];
const TOTAL_SOAL = 10;
const LS_KEY = 'tebak-bendera-best-v2';

const flag = (iso) => String.fromCodePoint.apply(null,
  iso.toUpperCase().split('').map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));

const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};
function loadBest() {
  try { const v = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
  catch (e) { return {}; }
}
function saveBest(b) { try { localStorage.setItem(LS_KEY, JSON.stringify(b)); } catch (e) { /* abaikan */ } }

export function render(root) {
  const box = T.out();
  const bestBox = T.el('<p class="hint center"></p>');
  const lvlSel = T.select([['mudah', 'Mudah — 36 negara terkenal'], ['semua', 'Sulit — semua 64 negara']], 'mudah');
  const quiz = { list: [], idx: 0, score: 0, answered: false };
  let best = loadBest();

  const lvlLabel = () => lvlSel.value === 'semua' ? 'Sulit' : 'Mudah';
  const gambarBest = () => {
    bestBox.textContent = 'Skor terbaik — Mudah: ' + (best.mudah || 0) + '/10 · Sulit: ' + (best.semua || 0) + '/10';
  };

  const buatSoal = () => {
    const pool = lvlSel.value === 'semua' ? NEGARA : NEGARA.filter((n) => n[2] === 'mudah');
    return shuffle(pool).slice(0, TOTAL_SOAL).map(([nama, iso]) => {
      const pengecoh = shuffle(pool.filter((n) => n[0] !== nama)).slice(0, 3).map((n) => n[0]);
      return { nama, iso, emoji: flag(iso), opsi: shuffle([nama].concat(pengecoh)) };
    });
  };

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score + ' &bull; ' + lvlLabel() + '</p>' +
      '<p class="center" style="font-size:18px">Bendera negara apa ini?</p>' +
      '<div class="big center" style="font-size:64px;line-height:1.4">' + q.emoji + '</div>' +
      '<div class="row" style="flex-direction:column;align-items:stretch;gap:8px;margin-top:10px">' +
      q.opsi.map((o) => '<button type="button" class="btn opsi">' + T.esc(o) + '</button>').join('') +
      '</div>'
    );
    const btns = box.querySelectorAll('.opsi');
    btns.forEach((b) => b.addEventListener('click', () => jawab(b, btns)));
  };

  const jawab = (btn, btns) => {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = btn.textContent === q.nama;
    if (ok) { quiz.score++; T.beep(660, 0.1); } else { T.beep(180, 0.15, 'sawtooth'); }
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score + ' &bull; ' + lvlLabel();
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.nama) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = b.textContent === q.nama || b === btn ? '1' : '0.45';
    });
    const verdict = T.el('<p class="center" style="margin-top:12px;font-size:15px">' + (ok ? '✅ <b>Benar!</b>' : '❌ <b>Kurang tepat.</b> Jawaban yang benar: <b>' + T.esc(q.nama) + '</b>') + '</p>');
    box.appendChild(verdict);
    const last = quiz.idx >= TOTAL_SOAL - 1;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= TOTAL_SOAL) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    box.appendChild(next);
  };

  const finish = () => {
    const s = quiz.score;
    const key = lvlSel.value;
    let baru = '';
    if (s > (best[key] || 0)) { best[key] = s; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
    gambarBest();
    const msg = s === 10 ? 'Sempurna! Kamu layak jadi duta besar. 🏳️✨'
      : s >= 8 ? 'Keren! Wawasan duniamu luas.'
      : s >= 6 ? 'Lumayan! Beberapa bendera memang mirip-mirip.'
      : s >= 4 ? 'Masih bisa diasah. Coba perhatikan warna & polanya.'
      : 'Yah… waktunya nonton kuis geografi lagi. 😅';
    const teks = '🏳️ Tebak Bendera (' + lvlLabel() + '): aku dapat ' + s + '/10! Coba kalahin aku di Adip Tools.';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    wrap.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      wrap.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
    }
    T.show(box,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/' + TOTAL_SOAL + '</span></div>' +
      '<p class="center">' + msg + baru + '</p>'
    );
    box.appendChild(wrap);
  };

  const start = () => {
    quiz.list = buatSoal();
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };

  lvlSel.addEventListener('change', start);
  root.appendChild(T.el('<p class="hint">10 soal acak. Perhatikan baik-baik benderanya! 🏳️</p>'));
  root.appendChild(T.field('Level', lvlSel));
  root.appendChild(box);
  root.appendChild(bestBox);
  gambarBest();
  start();
}
