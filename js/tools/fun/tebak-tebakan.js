import { h as T, tabs } from '../../core.js?v=6.8.0';

export const meta = {"id": "tebak-tebakan", "name": "Tebak-tebakan Receh", "cat": "fun", "icon": "🤣", "desc": "45 tebak-tebakan receh + mode kuis 10 soal.", "keywords": "tebak-tebakan,teka-teki,lucu,receh,kuis,game,hiburan"};

const SOAL = [
  { q: "Ayah Budi punya 5 anak: Sasa, Sisi, Susu, Soso. Siapa anak kelimanya?", a: "Budi" },
  { q: "Apa yang selalu naik tapi tidak pernah turun?", a: "umur" },
  { q: "Buah apa yang paling durhaka?", a: "melon kundang" },
  { q: "Hewan apa yang paling kaya raya?", a: "beruang" },
  { q: "Bulan apa yang punya 28 hari?", a: "semua bulan" },
  { q: "Apa yang punya kaki tapi tidak bisa berjalan?", a: "meja" },
  { q: "Apa yang punya leher tapi tidak punya kepala?", a: "botol" },
  { q: "Makin diambil makin besar. Apakah itu?", a: "lubang" },
  { q: "Apa yang selalu datang tapi tidak pernah tiba?", a: "besok" },
  { q: "Hewan apa yang huruf depan dan huruf belakangnya sama?", a: "katak" },
  { q: "Binatang apa yang siang makan nasi, kalau malam minum susu?", a: "belalang kupu-kupu" },
  { q: "Kenapa air laut rasanya asin?", a: "karena ikannya keringatan", ak: ["karena ikan keringatan", "ikannya keringatan"] },
  { q: "Apa yang bisa terbang tapi tidak punya sayap?", a: "waktu" },
  { q: "Apa yang jadi basah saat mengeringkan sesuatu?", a: "handuk" },
  { q: "Kata apa yang selalu salah diucapkan orang?", a: "salah" },
  { q: "Apa yang punya banyak kunci tapi tidak bisa membuka pintu?", a: "piano" },
  { q: "Apa yang berjalan tanpa kaki dan menangis tanpa mata?", a: "awan" },
  { q: "Apa yang bisa mengisi ruangan tapi tidak memakan tempat?", a: "cahaya" },
  { q: "Aku punya kota tapi tidak punya rumah, punya gunung tapi tidak punya pohon. Siapakah aku?", a: "peta" },
  { q: "Apa yang naik ke atas saat hujan turun?", a: "payung" },
  { q: "Apa yang selalu ada di depanmu tapi tidak bisa kamu lihat?", a: "masa depan" },
  { q: "Apa yang bisa kamu tangkap tapi tidak bisa kamu lempar?", a: "pilek" },
  { q: "Binatang apa yang tidak pernah rugi?", a: "laba-laba" },
  { q: "Kenapa matahari tenggelam tiap sore?", a: "karena tidak bisa berenang", ak: ["tidak bisa berenang", "nggak bisa berenang"] },
  { q: "Apa yang tidak bisa kamu makan saat sarapan?", a: "makan siang dan makan malam" },
  { q: "Benda apa yang makin lama makin pendek?", a: "lilin" },
  { q: "Apa yang punya kepala dan ekor tapi tidak punya badan?", a: "koin" },
  { q: "Burung apa yang tidak bisa terbang tapi jago berenang?", a: "pinguin", ak: ["penguin"] },
  { q: "Apa yang selalu ikut ke mana pun kamu pergi?", a: "bayangan" },
  { q: "Apa yang pecah sebelum digunakan?", a: "telur" },
  { q: "Apa yang ada di ujung pelangi?", a: "huruf i", ak: ["i"] },
  { q: "Apa yang dibeli untuk dimakan tapi tidak pernah dimakan?", a: "piring" },
  { q: "Apa yang punya mata tapi tidak bisa melihat?", a: "jarum" },
  { q: "Apa yang naik turun tapi tidak pernah bergerak?", a: "tangga" },
  { q: "Apa yang selalu basah meski di tempat kering?", a: "lidah" },
  { q: "Ikan apa yang paling berat?", a: "ikan paus" },
  { q: "Apa yang punya gigi tapi tidak bisa menggigit?", a: "gergaji" },
  { q: "Benda apa yang kalau dipukul malah bunyi?", a: "bedug" },
  { q: "Kenapa zombie kalau jalan selalu bareng-bareng?", a: "karena kalau sendiri namanya zomblo", ak: ["zomblo"] },
  { q: "Minuman apa yang paling pahit?", a: "kenyataan" },
  { q: "Apa yang lari tapi tidak punya kaki?", a: "air" },
  { q: "Apa yang punya daun tapi bukan tumbuhan?", a: "buku" },
  { q: "Apa yang punya jantung tapi tidak punya darah?", a: "jantung pisang" },
  { q: "Kenapa orang botak tidak pernah ketombean?", a: "karena tidak punya rambut" },
  { q: "Hewan apa yang jalannya paling lambat tapi tetap sampai?", a: "kura-kura" },
];

const norm = (s) => String(s == null ? '' : s).toLowerCase().trim()
  .replace(/-/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const benar = (soal, jawab) => [soal.a].concat(soal.ak || []).some((k) => norm(k) === norm(jawab) && norm(jawab) !== '');
const shuffle = (a) => {
  const x = a.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export function render(root) {
  // ---- Mode Acak ----
  const pAcak = T.el('<div></div>');
  const qBox = T.out();
  const aBox = T.out();
  let cur = null;
  const next = () => {
    cur = SOAL[Math.floor(Math.random() * SOAL.length)];
    T.show(qBox, '<p style="font-size:17px;line-height:1.65">' + T.esc(cur.q) + '</p>');
    T.hide(aBox);
  };
  const lihat = () => {
    if (!cur) return;
    T.show(aBox, '<p class="center" style="font-size:16px">Jawabannya: <b>' + T.esc(cur.a) + '</b></p>');
  };
  pAcak.appendChild(qBox);
  pAcak.appendChild(T.row(T.btn('Lihat jawaban', lihat), T.btn('Soal lain', next, true)));
  pAcak.appendChild(aBox);
  next();

  // ---- Mode Kuis ----
  const pKuis = T.el('<div></div>');
  const kBox = T.out();
  const feedBox = T.out();
  const ansInput = T.input('text', 'Ketik jawabanmu di sini...');
  const quiz = { list: [], idx: 0, score: 0, answered: false };
  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(kBox,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari 10 &bull; Skor: ' + quiz.score + '</p>' +
      '<p style="font-size:17px;line-height:1.65">' + T.esc(q.q) + '</p>');
    ansInput.value = '';
    T.hide(feedBox);
    try { ansInput.focus(); } catch (e) { /* abaikan */ }
  };
  const finish = () => {
    const s = quiz.score;
    const msg = s === 10 ? 'Sempurna! Otak kamu encer banget. 🧠✨'
      : s >= 7 ? 'Keren! Dikit lagi sempurna.'
      : s >= 4 ? 'Lumayan, masih bisa diasah lagi.'
      : 'Yah... coba lagi, siapa tahu hoki. 😅';
    T.show(kBox,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/10</span></div>' +
      '<p class="center">' + msg + '</p>');
    T.hide(feedBox);
    kBox.appendChild(T.row(T.btn('Main lagi', startQuiz, true)));
  };
  const jawab = () => {
    if (quiz.answered || quiz.idx >= quiz.list.length) return;
    if (!ansInput.value.trim()) { T.toast('Isi jawabannya dulu'); return; }
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = benar(q, ansInput.value);
    if (ok) quiz.score++;
    T.show(feedBox, ok
      ? '<p class="center" style="font-size:15px"><b style="color:#22c55e">Benar! 🎉</b></p>'
      : '<p class="center" style="font-size:15px">Kurang tepat. Jawabannya: <b>' + T.esc(q.a) + '</b></p>');
    const last = quiz.idx >= 9;
    feedBox.appendChild(T.row(T.btn(last ? 'Lihat hasil' : 'Soal berikutnya', () => {
      quiz.idx++;
      if (quiz.idx >= 10) finish(); else showQ();
    }, true)));
  };
  const startQuiz = () => {
    quiz.list = shuffle(SOAL).slice(0, 10);
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };
  ansInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') jawab(); });
  pKuis.appendChild(kBox);
  pKuis.appendChild(T.field('Jawabanmu', ansInput));
  pKuis.appendChild(T.row(T.btn('Jawab', jawab, true), T.btn('Acak ulang kuis', startQuiz)));
  pKuis.appendChild(feedBox);
  startQuiz();

  root.appendChild(tabs([['Acak', 0], ['Kuis', 1]], [pAcak, pKuis]));
}
