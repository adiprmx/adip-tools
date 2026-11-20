import { h as T, utils } from '../../core.js';

export const meta = {"id": "trivia-umum", "name": "Trivia Umum", "cat": "fun", "icon": "🧠", "desc": "Kuis 5 atau 10 soal pengetahuan umum: soal Indonesia atau soal dunia dari Open Trivia DB.", "keywords": "trivia,kuis,umum,pengetahuan,soal,dunia,indonesia,kuis trivia,ronde singkat,pilihan ganda", "since": "6.12.0"};

// Bank soal lokal (Bahasa Indonesia) — dipakai untuk mode "Soal Indonesia" dan
// sebagai cadangan otomatis bila soal dunia dari internet gagal dimuat.
// Semua jawaban sudah dicek kebenarannya.
const BANK_LOKAL = [
  // --- Indonesia ---
  { k: 'Indonesia', q: 'Apa ibukota provinsi Jawa Barat?', a: 'Bandung', w: ['Surabaya', 'Medan', 'Semarang'] },
  { k: 'Indonesia', q: 'Lagu kebangsaan Indonesia Raya diciptakan oleh siapa?', a: 'W. R. Supratman', w: ['Ismail Marzuki', 'H. Mutahar', 'Cornel Simanjuntak'] },
  { k: 'Indonesia', q: 'Candi Prambanan adalah candi agama apa?', a: 'Hindu', w: ['Buddha', 'Konghucu', 'Kristen'] },
  { k: 'Indonesia', q: 'Apa danau terbesar di Indonesia?', a: 'Danau Toba', w: ['Danau Maninjau', 'Danau Singkarak', 'Danau Poso'] },
  { k: 'Indonesia', q: 'Berapa jumlah provinsi di Indonesia saat ini?', a: '38', w: ['34', '35', '37'] },
  { k: 'Indonesia', q: 'Siapa presiden pertama Indonesia?', a: 'Soekarno', w: ['Soeharto', 'B. J. Habibie', 'Joko Widodo'] },
  { k: 'Indonesia', q: 'Pulau Bali terkenal dengan julukan apa?', a: 'Pulau Dewata', w: ['Pulau Komodo', 'Pulau Seram', 'Pulau Karimata'] },
  { k: 'Indonesia', q: 'Komodo bisa ditemukan di provinsi mana?', a: 'Nusa Tenggara Timur', w: ['Bali', 'Jawa Timur', 'Maluku'] },
  { k: 'Indonesia', q: 'Apa sungai terpanjang di Indonesia?', a: 'Sungai Kapuas', w: ['Sungai Mahakam', 'Sungai Barito', 'Sungai Musi'] },
  { k: 'Indonesia', q: 'Hari Kemerdekaan Indonesia diperingati setiap tanggal berapa?', a: '17 Agustus', w: ['20 Mei', '1 Juni', '10 November'] },
  // --- Dunia ---
  { k: 'Dunia', q: 'Apa ibukota Australia?', a: 'Canberra', w: ['Sydney', 'Melbourne', 'Perth'] },
  { k: 'Dunia', q: 'Negara mana yang penduduknya terbanyak di dunia?', a: 'India', w: ['Tiongkok', 'Amerika Serikat', 'Indonesia'] },
  { k: 'Dunia', q: 'Apa pulau terbesar di dunia?', a: 'Greenland', w: ['Madagaskar', 'Kalimantan', 'Sumatra'] },
  { k: 'Dunia', q: 'Apa mata uang Jepang?', a: 'Yen', w: ['Won', 'Yuan', 'Ringgit'] },
  { k: 'Dunia', q: 'Apa bahasa resmi Brasil?', a: 'Portugis', w: ['Spanyol', 'Prancis', 'Italia'] },
  { k: 'Dunia', q: 'Apa negara terkecil di dunia?', a: 'Vatikan', w: ['Monako', 'San Marino', 'Liechtenstein'] },
  { k: 'Dunia', q: 'Apa ibukota Kanada?', a: 'Ottawa', w: ['Toronto', 'Vancouver', 'Montreal'] },
  { k: 'Dunia', q: 'Apa gunung tertinggi di dunia?', a: 'Everest', w: ['K2', 'Kilimanjaro', 'Mont Blanc'] },
  { k: 'Dunia', q: 'Apa lautan terbesar di dunia?', a: 'Samudra Pasifik', w: ['Samudra Atlantik', 'Samudra Hindia', 'Samudra Arktik'] },
  { k: 'Dunia', q: 'Apa benua terbesar di dunia?', a: 'Asia', w: ['Afrika', 'Amerika Utara', 'Eropa'] },
  // --- Sains ---
  { k: 'Sains', q: 'Apa lambang kimia untuk emas?', a: 'Au', w: ['Ag', 'Fe', 'Pb'] },
  { k: 'Sains', q: 'Planet apa yang paling dekat dengan Matahari?', a: 'Merkurius', w: ['Venus', 'Bumi', 'Mars'] },
  { k: 'Sains', q: 'Apa rumus kimia air?', a: 'H2O', w: ['CO2', 'O2', 'NaCl'] },
  { k: 'Sains', q: 'Hewan apa yang paling cepat larinya di darat?', a: 'Cheetah', w: ['Singa', 'Kuda', 'Anjing greyhound'] },
  { k: 'Sains', q: 'Organ tubuh apa yang menghasilkan insulin?', a: 'Pankreas', w: ['Hati', 'Ginjal', 'Jantung'] },
  { k: 'Sains', q: 'Unsur apa yang paling banyak di alam semesta?', a: 'Hidrogen', w: ['Oksigen', 'Karbon', 'Helium'] },
  { k: 'Sains', q: 'Alat apa yang dipakai untuk mengukur suhu?', a: 'Termometer', w: ['Barometer', 'Amperemeter', 'Mikroskop'] },
  { k: 'Sains', q: 'Bintang apa yang paling dekat dengan Bumi?', a: 'Matahari', w: ['Sirius', 'Alpha Centauri', 'Betelgeuse'] },
  { k: 'Sains', q: 'Berapa kecepatan cahaya?', a: 'Sekitar 300.000 km/detik', w: ['Sekitar 150.000 km/detik', 'Sekitar 1.000.000 km/detik', 'Sekitar 30.000 km/detik'] },
  { k: 'Sains', q: 'Gas apa yang dihirup manusia untuk bernapas?', a: 'Oksigen', w: ['Karbon dioksida', 'Nitrogen', 'Helium'] },
  // --- Campuran ---
  { k: 'Campuran', q: 'Berapa pemain sepak bola dalam satu tim di lapangan?', a: '11', w: ['9', '10', '12'] },
  { k: 'Campuran', q: 'Sushi berasal dari negara mana?', a: 'Jepang', w: ['Korea Selatan', 'Tiongkok', 'Thailand'] },
  { k: 'Campuran', q: 'Siapa penemu bola lampu pijar?', a: 'Thomas Edison', w: ['Alexander Graham Bell', 'Isaac Newton', 'Albert Einstein'] },
  { k: 'Campuran', q: 'Tahun kabisat terjadi setiap berapa tahun?', a: '4 tahun', w: ['2 tahun', '5 tahun', '10 tahun'] },
  { k: 'Campuran', q: 'Apa warna bendera Indonesia?', a: 'Merah dan putih', w: ['Merah dan biru', 'Putih dan hijau', 'Merah dan kuning'] },
  { k: 'Campuran', q: 'Apa bunga nasional Indonesia (puspa bangsa)?', a: 'Melati', w: ['Anggrek bulan', 'Rafflesia', 'Kamboja'] },
  { k: 'Campuran', q: 'Apa mata uang Inggris?', a: 'Pound sterling', w: ['Euro', 'Dolar', 'Franc'] },
  { k: 'Campuran', q: 'Siapa penemu telepon?', a: 'Alexander Graham Bell', w: ['Thomas Edison', 'Guglielmo Marconi', 'Nikola Tesla'] },
  { k: 'Campuran', q: 'Berapa sisi yang dimiliki segitiga?', a: '3', w: ['4', '5', '6'] },
  { k: 'Campuran', q: 'Kota Paris adalah ibukota negara mana?', a: 'Prancis', w: ['Belgia', 'Swiss', 'Belanda'] },
];

// Kategori Open Trivia DB (id resmi dari opentdb.com/api_category.php)
const KAT_DUNIA = [
  ['0', 'Acak — semua topik'], ['9', 'Pengetahuan umum'], ['17', 'Sains & alam'],
  ['18', 'Komputer'], ['11', 'Film'], ['12', 'Musik'], ['15', 'Video game'],
  ['22', 'Geografi'], ['23', 'Sejarah'], ['27', 'Hewan'], ['25', 'Seni'], ['21', 'Olahraga'],
  ['10', 'Buku'], ['14', 'Televisi'], ['19', 'Matematika'], ['28', 'Kendaraan'],
];
// Panjang ronde dipilih user (diserap dari kuis-trivia, v6.21.0): 5 soal
// (ronde singkat) atau 10 soal. TOTAL_SOAL lama diganti jumlahSoal().
const PANJANG_RONDE = [5, 10];
const LS_KEY = 'trivia-umum-best';

// shuffle kanonis tinggal di utils (core.js).
// loadBestObj/saveBestObj kanonis tinggal di utils (core.js).
// Soal dari API mengandung HTML entities (&quot; dsb.) — decode dulu.
const decodeHtml = (s) => {
  const ta = document.createElement('textarea');
  ta.innerHTML = String(s);
  return ta.value;
};

export function render(root) {
  const box = T.out();
  const bestBox = T.el('<p class="hint center"></p>');
  const modeSel = T.select([['lokal', 'Soal Indonesia (Bahasa Indonesia)'], ['dunia', 'Soal Dunia — Open Trivia DB (English)']], 'lokal');
  const katLokalSel = T.select([['semua', 'Semua topik'], ['Indonesia', 'Indonesia'], ['Dunia', 'Dunia'], ['Sains', 'Sains'], ['Campuran', 'Campuran']], 'semua');
  const katDuniaSel = T.select(KAT_DUNIA, '0');
  const sulitSel = T.select([['acak', 'Acak — semua level'], ['easy', 'Mudah'], ['medium', 'Sedang'], ['hard', 'Sulit']], 'acak');
  const jumlahSel = T.select([['5', '5 soal (ronde singkat)'], ['10', '10 soal']], '10');
  const jumlahSoal = () => {
    const n = Number(jumlahSel.value);
    return PANJANG_RONDE.includes(n) ? n : 10;
  };
  const quiz = { list: [], idx: 0, score: 0, answered: false, sumber: 'lokal' };
  let best = utils.loadBestObj(LS_KEY);
  // Migrasi sekali jalan: skor terbaik lama tersimpan sebagai angka (dari 10).
  for (const k of ['lokal', 'dunia']) {
    if (typeof best[k] === 'number') best[k] = { s: best[k], t: 10 };
    if (!best[k] || typeof best[k].s !== 'number' || typeof best[k].t !== 'number') best[k] = { s: 0, t: 10 };
  }
  let memuat = false;

  const gambarBest = () => {
    bestBox.textContent = 'Skor terbaik — Indonesia: ' + best.lokal.s + '/' + best.lokal.t + ' · Dunia: ' + best.dunia.s + '/' + best.dunia.t;
  };

  const soalLokal = () => {
    const pool = katLokalSel.value === 'semua' ? BANK_LOKAL : BANK_LOKAL.filter((s) => s.k === katLokalSel.value);
    return utils.shuffle(pool).slice(0, jumlahSoal()).map((s) => ({
      q: s.q, kat: s.k, jawab: s.a, opsi: utils.shuffle([s.a].concat(s.w)),
    }));
  };

  const ambilSoalDunia = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      let url = 'https://opentdb.com/api.php?amount=' + jumlahSoal() + '&type=multiple';
      if (katDuniaSel.value !== '0') url += '&category=' + katDuniaSel.value;
      if (sulitSel.value !== 'acak') url += '&difficulty=' + sulitSel.value;
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data.results || !data.results.length) throw new Error('soal kosong');
      return data.results.map((r) => ({
        q: decodeHtml(r.question), kat: decodeHtml(r.category),
        jawab: decodeHtml(r.correct_answer),
        opsi: utils.shuffle([decodeHtml(r.correct_answer)].concat((r.incorrect_answers || []).map(decodeHtml))),
      }));
    } finally {
      clearTimeout(timer);
    }
  };

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + quiz.list.length + ' &bull; Skor: ' + quiz.score + ' &bull; ' + T.esc(q.kat) + '</p>' +
      '<p style="font-size:16px;line-height:1.6">' + T.esc(q.q) + '</p>' +
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
    const ok = btn.textContent === q.jawab;
    if (ok) { quiz.score++; T.beep(660, 0.1); } else { T.beep(180, 0.15, 'sawtooth'); }
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari ' + quiz.list.length + ' &bull; Skor: ' + quiz.score + ' &bull; ' + T.esc(q.kat);
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.jawab) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = b.textContent === q.jawab || b === btn ? '1' : '0.45';
    });
    const verdict = T.el('<p class="center" style="margin-top:12px;font-size:15px">' + (ok ? '✅ <b>Benar!</b>' : '❌ <b>Kurang tepat.</b> Jawaban yang benar: <b>' + T.esc(q.jawab) + '</b>') + '</p>');
    box.appendChild(verdict);
    const last = quiz.idx >= quiz.list.length - 1;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= quiz.list.length) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    box.appendChild(next);
  };

  const finish = () => {
    const s = quiz.score;
    const total = quiz.list.length;
    const key = quiz.sumber;
    let baru = '';
    // Rekor dibanding sebagai pecahan (ronde 5 dan 10 soal bisa dibanding),
    // seri dipecah ke total soal yang lebih besar.
    const lama = best[key];
    if (s / total > lama.s / lama.t || (s / total === lama.s / lama.t && total > lama.t)) {
      best[key] = { s, t: total };
      utils.saveBestObj(LS_KEY, best);
      baru = ' <b style="color:var(--acc)">Rekor baru!</b>';
    }
    gambarBest();
    const f = s / total;
    const msg = s === total ? 'Sempurna! Otak ensiklopedia berjalan. 🧠✨'
      : f >= 0.8 ? 'Keren! Wawasanmu luas banget.'
      : f >= 0.6 ? 'Lumayan! Beberapa soal memang menjebak.'
      : f >= 0.4 ? 'Masih bisa diasah. Coba lagi, soalnya beda tiap main.'
      : 'Yah… coba mode lain, siapa tahu topiknya lebih cocok. 😅';
    const teks = '🧠 Trivia Umum (' + (key === 'dunia' ? 'Soal Dunia' : 'Soal Indonesia') + '): aku dapat ' + s + '/' + quiz.list.length + '! Coba kalahin aku di Adip Tools.';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    wrap.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      wrap.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
    }
    T.show(box,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/' + quiz.list.length + '</span></div>' +
      '<p class="center">' + msg + baru + '</p>'
    );
    box.appendChild(wrap);
  };

  const start = async () => {
    if (memuat) return;
    quiz.idx = 0; quiz.score = 0;
    if (modeSel.value === 'lokal') {
      quiz.sumber = 'lokal';
      quiz.list = soalLokal();
      showQ();
      return;
    }
    // Mode dunia: ambil dari Open Trivia DB; gagal -> pakai bank lokal + beri tahu user.
    memuat = true;
    T.show(box, '<p class="center hint">Mengambil soal dari Open Trivia DB…</p>');
    try {
      quiz.list = await ambilSoalDunia();
      quiz.sumber = 'dunia';
    } catch (e) {
      quiz.list = soalLokal();
      quiz.sumber = 'lokal';
      T.toast('Soal dunia gagal dimuat, pakai soal Indonesia dulu ya');
    }
    memuat = false;
    showQ();
  };

  const aturPanel = () => {
    const dunia = modeSel.value === 'dunia';
    katLokalWrap.style.display = dunia ? 'none' : '';
    katDuniaWrap.style.display = dunia ? '' : 'none';
    sulitWrap.style.display = dunia ? '' : 'none';
  };
  const katLokalWrap = T.field('Topik', katLokalSel);
  const katDuniaWrap = T.field('Topik', katDuniaSel);
  const sulitWrap = T.field('Level', sulitSel);

  modeSel.addEventListener('change', () => { aturPanel(); start(); });
  katLokalSel.addEventListener('change', start);
  katDuniaSel.addEventListener('change', start);
  sulitSel.addEventListener('change', start);
  jumlahSel.addEventListener('change', start);

  root.appendChild(T.el('<p class="hint">5 atau 10 soal pilihan ganda. Mode Indonesia pakai soal Bahasa Indonesia; mode Dunia mengambil soal baru dari Open Trivia DB tiap main.</p>'));
  root.appendChild(T.field('Mode soal', modeSel));
  root.appendChild(T.field('Jumlah soal', jumlahSel));
  root.appendChild(katLokalWrap);
  root.appendChild(katDuniaWrap);
  root.appendChild(sulitWrap);
  root.appendChild(T.row(T.btn('Mulai kuis 🎲', start, true)));
  root.appendChild(box);
  root.appendChild(bestBox);
  aturPanel();
  gambarBest();
  start();
}
