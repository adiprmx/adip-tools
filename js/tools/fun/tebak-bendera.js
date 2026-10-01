import { h as T, utils } from '../../core.js?v=6.5.0';

export const meta = {"id":"tebak-bendera","name":"Tebak Bendera","cat":"fun","icon":"🏳️","desc":"Kuis 10 soal acak: tebak negara dari emoji benderanya.","keywords":"bendera,negara,kuis,flag,geografi,dunia"};

// [nama Indonesia, kode ISO] — emoji bendera dihitung dari kode ISO (regional indicator), dijamin benar.
const NEGARA = [
  ['Indonesia', 'ID'], ['Malaysia', 'MY'], ['Singapura', 'SG'], ['Thailand', 'TH'],
  ['Filipina', 'PH'], ['Vietnam', 'VN'], ['Jepang', 'JP'], ['Korea Selatan', 'KR'],
  ['China', 'CN'], ['India', 'IN'], ['Australia', 'AU'], ['Selandia Baru', 'NZ'],
  ['Amerika Serikat', 'US'], ['Inggris', 'GB'], ['Prancis', 'FR'], ['Jerman', 'DE'],
  ['Italia', 'IT'], ['Spanyol', 'ES'], ['Belanda', 'NL'], ['Brasil', 'BR'],
  ['Argentina', 'AR'], ['Meksiko', 'MX'], ['Kanada', 'CA'], ['Mesir', 'EG'],
  ['Afrika Selatan', 'ZA'], ['Nigeria', 'NG'], ['Turki', 'TR'], ['Arab Saudi', 'SA'],
  ['Uni Emirat Arab', 'AE'], ['Rusia', 'RU'], ['Ukraina', 'UA'], ['Portugal', 'PT'],
  ['Yunani', 'GR'], ['Swiss', 'CH'], ['Swedia', 'SE'], ['Norwegia', 'NO'],
];

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

export function render(root) {
  const box = T.out();
  const quiz = { list: [], idx: 0, score: 0, answered: false };

  const buatSoal = () => shuffle(NEGARA).slice(0, 10).map(([nama, iso]) => {
    const pengecoh = shuffle(NEGARA.filter((n) => n[0] !== nama)).slice(0, 3).map((n) => n[0]);
    return { nama, iso, emoji: flag(iso), opsi: shuffle([nama].concat(pengecoh)) };
  });

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari 10 &bull; Skor: ' + quiz.score + '</p>' +
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
    if (ok) quiz.score++;
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.nama) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = b.textContent === q.nama || b === btn ? '1' : '0.45';
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
    const msg = s === 10 ? 'Sempurna! Kamu layak jadi duta besar. 🏳️✨'
      : s >= 8 ? 'Keren! Wawasan duniamu luas.'
      : s >= 6 ? 'Lumayan! Beberapa bendera memang mirip-mirip.'
      : s >= 4 ? 'Masih bisa diasah. Coba perhatikan warna & polanya.'
      : 'Yah… waktunya nonton kuis geografi lagi. 😅';
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

  root.appendChild(T.el('<p class="hint">10 soal acak dari 36 negara. Perhatikan baik-baik benderanya! 🏳️</p>'));
  root.appendChild(box);
  start();
}
