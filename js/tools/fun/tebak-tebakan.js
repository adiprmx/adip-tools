import { h as T, tabs } from '../../core.js?v=6.12.1';

export const meta = {"id": "tebak-tebakan", "name": "Tebak-tebakan Receh", "cat": "fun", "icon": "🤣", "desc": "71 tebak-tebakan + mode kuis, 5 kategori: logika, hewan, benda, kata, receh.", "keywords": "tebak-tebakan,teka-teki,lucu,receh,kuis,game,hiburan,kategori"};

// k = kategori: logika | hewan | benda | kata | receh
const SOAL = [
  { k: 'logika', q: "Ayah Budi punya 5 anak: Sasa, Sisi, Susu, Soso. Siapa anak kelimanya?", a: "Budi" },
  { k: 'logika', q: "Apa yang selalu naik tapi tidak pernah turun?", a: "umur" },
  { k: 'receh', q: "Buah apa yang paling durhaka?", a: "melon kundang" },
  { k: 'hewan', q: "Hewan apa yang paling kaya raya?", a: "beruang" },
  { k: 'logika', q: "Bulan apa yang punya 28 hari?", a: "semua bulan" },
  { k: 'benda', q: "Apa yang punya kaki tapi tidak bisa berjalan?", a: "meja" },
  { k: 'benda', q: "Apa yang punya leher tapi tidak punya kepala?", a: "botol" },
  { k: 'logika', q: "Makin diambil makin besar. Apakah itu?", a: "lubang" },
  { k: 'logika', q: "Apa yang selalu datang tapi tidak pernah tiba?", a: "besok" },
  { k: 'hewan', q: "Hewan apa yang huruf depan dan huruf belakangnya sama?", a: "katak" },
  { k: 'hewan', q: "Binatang apa yang siang makan nasi, kalau malam minum susu?", a: "belalang kupu-kupu" },
  { k: 'receh', q: "Kenapa air laut rasanya asin?", a: "karena ikannya keringatan", ak: ["karena ikan keringatan", "ikannya keringatan"] },
  { k: 'logika', q: "Apa yang bisa terbang tapi tidak punya sayap?", a: "waktu" },
  { k: 'benda', q: "Apa yang jadi basah saat mengeringkan sesuatu?", a: "handuk" },
  { k: 'kata', q: "Kata apa yang selalu salah diucapkan orang?", a: "salah" },
  { k: 'benda', q: "Apa yang punya banyak kunci tapi tidak bisa membuka pintu?", a: "piano" },
  { k: 'logika', q: "Apa yang berjalan tanpa kaki dan menangis tanpa mata?", a: "awan" },
  { k: 'logika', q: "Apa yang bisa mengisi ruangan tapi tidak memakan tempat?", a: "cahaya" },
  { k: 'logika', q: "Aku punya kota tapi tidak punya rumah, punya gunung tapi tidak punya pohon. Siapakah aku?", a: "peta" },
  { k: 'benda', q: "Apa yang naik ke atas saat hujan turun?", a: "payung" },
  { k: 'logika', q: "Apa yang selalu ada di depanmu tapi tidak bisa kamu lihat?", a: "masa depan" },
  { k: 'receh', q: "Apa yang bisa kamu tangkap tapi tidak bisa kamu lempar?", a: "pilek" },
  { k: 'hewan', q: "Binatang apa yang tidak pernah rugi?", a: "laba-laba" },
  { k: 'receh', q: "Kenapa matahari tenggelam tiap sore?", a: "karena tidak bisa berenang", ak: ["tidak bisa berenang", "nggak bisa berenang"] },
  { k: 'logika', q: "Apa yang tidak bisa kamu makan saat sarapan?", a: "makan siang dan makan malam" },
  { k: 'benda', q: "Benda apa yang makin lama makin pendek?", a: "lilin" },
  { k: 'benda', q: "Apa yang punya kepala dan ekor tapi tidak punya badan?", a: "koin" },
  { k: 'hewan', q: "Burung apa yang tidak bisa terbang tapi jago berenang?", a: "pinguin", ak: ["penguin"] },
  { k: 'logika', q: "Apa yang selalu ikut ke mana pun kamu pergi?", a: "bayangan" },
  { k: 'logika', q: "Apa yang pecah sebelum digunakan?", a: "telur" },
  { k: 'kata', q: "Apa yang ada di ujung pelangi?", a: "huruf i", ak: ["i"] },
  { k: 'benda', q: "Apa yang dibeli untuk dimakan tapi tidak pernah dimakan?", a: "piring" },
  { k: 'benda', q: "Apa yang punya mata tapi tidak bisa melihat?", a: "jarum" },
  { k: 'benda', q: "Apa yang naik turun tapi tidak pernah bergerak?", a: "tangga" },
  { k: 'logika', q: "Apa yang selalu basah meski di tempat kering?", a: "lidah" },
  { k: 'hewan', q: "Ikan apa yang paling berat?", a: "ikan paus" },
  { k: 'benda', q: "Apa yang punya gigi tapi tidak bisa menggigit?", a: "gergaji" },
  { k: 'benda', q: "Benda apa yang kalau dipukul malah bunyi?", a: "bedug" },
  { k: 'receh', q: "Kenapa zombie kalau jalan selalu bareng-bareng?", a: "karena kalau sendiri namanya zomblo", ak: ["zomblo"] },
  { k: 'receh', q: "Minuman apa yang paling pahit?", a: "kenyataan" },
  { k: 'logika', q: "Apa yang lari tapi tidak punya kaki?", a: "air" },
  { k: 'benda', q: "Apa yang punya daun tapi bukan tumbuhan?", a: "buku" },
  { k: 'receh', q: "Apa yang punya jantung tapi tidak punya darah?", a: "jantung pisang" },
  { k: 'receh', q: "Kenapa orang botak tidak pernah ketombean?", a: "karena tidak punya rambut" },
  { k: 'hewan', q: "Hewan apa yang jalannya paling lambat tapi tetap sampai?", a: "kura-kura" },
  // --- tambahan v6.12.0 (26 soal) ---
  { k: 'logika', q: "Apa yang jalan dengan 4 kaki di pagi hari, 2 kaki di siang hari, dan 3 kaki di malam hari?", a: "manusia", ak: ["orang"] },
  { k: 'logika', q: "Aku berjalan tanpa kaki, punya tempat tidur tapi tidak pernah tidur. Siapakah aku?", a: "sungai" },
  { k: 'logika', q: "Benda apa yang selalu ada di depan mata tapi tidak pernah kamu lihat?", a: "hidung" },
  { k: 'logika', q: "Ada 5 apel di meja. Kamu mengambil 3. Berapa apel yang kamu punya?", a: "3", ak: ["tiga", "3 apel"] },
  { k: 'hewan', q: "Hewan apa yang paling suka bersih-bersih?", a: "ikan sapu-sapu", ak: ["sapu-sapu"] },
  { k: 'hewan', q: "Hewan apa yang paling rajin menabung?", a: "semut" },
  { k: 'kata', q: "Apa yang selalu ada di akhir setiap kalimat?", a: "titik" },
  { k: 'kata', q: "Apa yang ada di tengah-tengah kata 'laut'?", a: "huruf u", ak: ["u"] },
  { k: 'kata', q: "Apa yang ada di antara langit dan bumi?", a: "dan", ak: ["kata dan"] },
  { k: 'benda', q: "Apa yang punya banyak gigi tapi tidak bisa mengunyah?", a: "sisir" },
  { k: 'benda', q: "Apa yang bisa menulis tapi tidak bisa membaca?", a: "pena", ak: ["pulpen", "pensil"] },
  { k: 'logika', q: "Apa yang ada di satu tempat tapi bisa dilihat dari mana saja?", a: "bulan" },
  { k: 'kata', q: "Kata apa yang dibaca dari depan atau belakang tetap sama, dan berarti waktu gelap?", a: "malam" },
  { k: 'logika', q: "Apa yang selalu ada di dalam air tapi tidak pernah basah?", a: "bayangan" },
  { k: 'logika', q: "Apa yang selalu lapar tapi tidak pernah makan?", a: "api" },
  { k: 'hewan', q: "Hewan apa yang paling suka ngobrol?", a: "burung beo", ak: ["beo"] },
  { k: 'benda', q: "Apa yang punya banyak halaman tapi tidak pernah dibaca sampai habis?", a: "kalender" },
  { k: 'benda', q: "Apa yang selalu ada di depan pintu tapi tidak pernah masuk rumah?", a: "keset" },
  { k: 'benda', q: "Apa yang punya dua tangan tapi tidak bisa bertepuk?", a: "jam", ak: ["jam dinding", "jam tangan"] },
  { k: 'logika', q: "Apa yang bisa berbicara semua bahasa?", a: "gema" },
  { k: 'benda', q: "Apa yang bisa keliling dunia tanpa meninggalkan tempatnya?", a: "perangko" },
  { k: 'logika', q: "Apa yang selalu muncul setelah hujan reda?", a: "pelangi" },
  { k: 'hewan', q: "Hewan apa yang paling pendiam?", a: "ikan" },
  { k: 'logika', q: "Apa yang bisa mengisi botol tanpa dituang?", a: "udara" },
  { k: 'kata', q: "Apa yang selalu ada di awal kata 'akhir'?", a: "huruf a", ak: ["a"] },
  { k: 'logika', q: "Apa yang bisa kamu hitung tapi tidak bisa kamu sentuh?", a: "waktu" },
];

const KATS = [
  ['semua', 'Semua kategori'],
  ['logika', 'Logika'],
  ['hewan', 'Hewan'],
  ['benda', 'Benda'],
  ['kata', 'Main kata'],
  ['receh', 'Receh'],
];
const LS_KEY = 'tebak-tebakan-best';
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
function loadBest() {
  try { const v = parseInt(localStorage.getItem(LS_KEY), 10); return isNaN(v) ? 0 : v; }
  catch (e) { return 0; }
}
function saveBest(v) { try { localStorage.setItem(LS_KEY, String(v)); } catch (e) { /* abaikan */ } }

export function render(root) {
  const katSel = T.select(KATS, 'semua');
  const pool = () => katSel.value === 'semua' ? SOAL : SOAL.filter((s) => s.k === katSel.value);
  let best = loadBest();

  // ---- Mode Acak ----
  const pAcak = T.el('<div></div>');
  const qBox = T.out();
  const aBox = T.out();
  let cur = null;
  const next = () => {
    const p = pool();
    cur = p[Math.floor(Math.random() * p.length)];
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
  const bestBox = T.el('<p class="hint center">Skor terbaikmu: <b>' + best + '</b>/10</p>');
  const ansInput = T.input('text', 'Ketik jawabanmu di sini...');
  const quiz = { list: [], idx: 0, score: 0, answered: false };
  const total = () => quiz.list.length;
  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(kBox,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + total() + ' &bull; Skor: ' + quiz.score + '</p>' +
      '<p style="font-size:17px;line-height:1.65">' + T.esc(q.q) + '</p>');
    ansInput.value = '';
    T.hide(feedBox);
    try { ansInput.focus(); } catch (e) { /* abaikan */ }
  };
  const finish = () => {
    const s = quiz.score;
    const t = total();
    let baru = '';
    if (t === 10 && s > best) { best = s; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
    bestBox.innerHTML = 'Skor terbaikmu: <b>' + best + '</b>/10';
    const msg = s === t ? 'Sempurna! Otak kamu encer banget. 🧠✨'
      : s >= Math.ceil(t * 0.7) ? 'Keren! Dikit lagi sempurna.'
      : s >= Math.ceil(t * 0.4) ? 'Lumayan, masih bisa diasah lagi.'
      : 'Yah... coba lagi, siapa tahu hoki. 😅';
    const teks = '🤣 Tebak-tebakan Receh: aku dapat ' + s + '/' + t + '! Coba kalahin aku di Adip Tools.';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi', startQuiz, true));
    wrap.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      wrap.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
    }
    T.show(kBox,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/' + t + '</span></div>' +
      '<p class="center">' + msg + baru + '</p>');
    kBox.appendChild(wrap);
    T.hide(feedBox);
  };
  const jawab = () => {
    if (quiz.answered || quiz.idx >= quiz.list.length) return;
    if (!ansInput.value.trim()) { T.toast('Isi jawabannya dulu'); return; }
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = benar(q, ansInput.value);
    if (ok) { quiz.score++; T.beep(660, 0.1); } else { T.beep(180, 0.15, 'sawtooth'); }
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = kBox.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari ' + total() + ' &bull; Skor: ' + quiz.score;
    T.show(feedBox, ok
      ? '<p class="center" style="font-size:15px"><b style="color:#22c55e">Benar! 🎉</b></p>'
      : '<p class="center" style="font-size:15px">Kurang tepat. Jawabannya: <b>' + T.esc(q.a) + '</b></p>');
    const last = quiz.idx >= total() - 1;
    feedBox.appendChild(T.row(T.btn(last ? 'Lihat hasil' : 'Soal berikutnya', () => {
      quiz.idx++;
      if (quiz.idx >= total()) finish(); else showQ();
    }, true)));
  };
  const startQuiz = () => {
    quiz.list = shuffle(pool()).slice(0, 10);
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };
  ansInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') jawab(); });
  pKuis.appendChild(kBox);
  pKuis.appendChild(T.field('Jawabanmu', ansInput));
  pKuis.appendChild(T.row(T.btn('Jawab', jawab, true), T.btn('Acak ulang kuis', startQuiz)));
  pKuis.appendChild(feedBox);
  pKuis.appendChild(bestBox);
  startQuiz();

  katSel.addEventListener('change', () => { next(); startQuiz(); });
  root.appendChild(T.el('<p class="hint center">' + SOAL.length + ' tebak-tebakan. Pilih kategori, lalu main acak atau mode kuis.</p>'));
  root.appendChild(T.field('Kategori', katSel));
  root.appendChild(tabs([['Acak', 0], ['Kuis', 1]], [pAcak, pKuis]));
}
