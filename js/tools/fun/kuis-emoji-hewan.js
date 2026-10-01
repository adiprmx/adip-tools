import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id":"kuis-emoji-hewan","name":"Kuis Emoji Hewan","cat":"fun","icon":"🐾","desc":"Tebak hewan dari deretan emoji.","keywords":"kuis,emoji,hewan,tebak,game"};

// [deretan emoji, nama hewan] — emoji sudah dicek satu-satu
const HEWAN = [
  ['🦒', 'Jerapah'],
  ['🐘', 'Gajah'],
  ['🦘', 'Kanguru'],
  ['🐅', 'Harimau'],
  ['🦁', 'Singa'],
  ['🐻', 'Beruang'],
  ['🐼', 'Panda'],
  ['🐨', 'Koala'],
  ['🦍', 'Gorila'],
  ['🐧❄️', 'Pinguin'],
  ['🦉🌙', 'Burung hantu'],
  ['🦅', 'Elang'],
  ['🐢', 'Kura-kura'],
  ['🐊', 'Buaya'],
  ['🐍', 'Ular'],
  ['🦖', 'Dinosaurus'],
  ['🐳', 'Paus'],
  ['🦈', 'Hiu'],
  ['🐬', 'Lumba-lumba'],
  ['🦀', 'Kepiting'],
  ['🐙', 'Gurita'],
  ['🐝🍯', 'Lebah'],
  ['🦋', 'Kupu-kupu'],
  ['🐌', 'Siput'],
  ['🐸', 'Katak'],
  ['🦇', 'Kelelawar'],
  ['🦊', 'Rubah'],
  ['🦌', 'Rusa'],
  ['🦏', 'Badak'],
  ['🦛', 'Kuda nil'],
  ['🦓', 'Zebra'],
  ['🐫', 'Unta'],
];

const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i]] = [x[j]], [x[j]] = [x[i]];
  }
  return x;
};

export function render(root) {
  const box = T.out();
  const quiz = { list: [], idx: 0, score: 0, answered: false };

  const buatSoal = () => shuffle(HEWAN).slice(0, 10).map(([emoji, hewan]) => {
    const pengecoh = shuffle(HEWAN.filter((h) => h[1] !== hewan)).slice(0, 3).map((h) => h[1]);
    return { emoji, hewan, opsi: shuffle([hewan].concat(pengecoh)) };
  });

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari 10 &bull; Skor: ' + quiz.score + '</p>' +
      '<div class="center" style="font-size:52px;margin:8px 0">' + q.emoji + '</div>' +
      '<p class="center" style="font-size:17px">Hewan apa ini? 🐾</p>' +
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
    const ok = btn.textContent === q.hewan;
    if (ok) quiz.score++;
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari 10 &bull; Skor: ' + quiz.score;
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.hewan) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = b.textContent === q.hewan || b === btn ? '1' : '0.45';
    });
    const last = quiz.idx >= 9;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= 10) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    box.appendChild(next);
  };

  const finish = () => {
    const s = quiz.score;
    const msg = s === 10 ? 'Sempurna! Kamu pawang hewan sejati. 🐾✨'
      : s >= 8 ? 'Keren banget! Dikit lagi sempurna.'
      : s >= 6 ? 'Lumayan! Kebun binatang mana yang paling sering kamu datengin?'
      : s >= 4 ? 'Masih bisa diasah. Yang jebakan biasanya emoji mirip-mirip.'
      : 'Yah… waktunya main ke kebun binatang. 😅';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    T.show(box,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/10</span></div>' +
      '<p class="center">' + msg + '</p>'
    );
    box.appendChild(wrap);
  };

  const start = () => {
    quiz.list = buatSoal();
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };

  root.appendChild(T.el('<p class="hint">Tebak 10 hewan acak cuma dari deretan emojinya. Gampang-gampang susah, awas ketuker! 🐾</p>'));
  root.appendChild(box);
  start();
}
