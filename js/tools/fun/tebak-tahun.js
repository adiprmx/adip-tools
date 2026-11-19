import { h as T, utils } from '../../core.js';

export const meta = {"id": "tebak-tahun", "name": "Tebak Tahun Peristiwa", "cat": "fun", "icon": "📅", "desc": "Kuis 10 soal acak: di tahun berapa peristiwa ini terjadi? Indonesia & dunia.", "keywords": "tahun,sejarah,peristiwa,kuis,trivia,indonesia,dunia", "since": "6.12.0"};

// Semua tahun sudah dicek kebenarannya (sumber: Wikipedia/ensiklopedia umum).
const PERISTIWA = [
  // --- Indonesia ---
  { k: 'Indonesia', e: 'Proklamasi Kemerdekaan Indonesia', th: 1945 },
  { k: 'Indonesia', e: 'Sumpah Pemuda dibacakan', th: 1928 },
  { k: 'Indonesia', e: 'Konferensi Asia-Afrika di Bandung', th: 1955 },
  { k: 'Indonesia', e: 'Pemilihan umum pertama Indonesia', th: 1955 },
  { k: 'Indonesia', e: 'Peristiwa Gerakan 30 September (G30S)', th: 1965 },
  { k: 'Indonesia', e: 'ASEAN berdiri lewat Deklarasi Bangkok', th: 1967 },
  { k: 'Indonesia', e: 'Indonesia pertama kali jadi tuan rumah SEA Games', th: 1979 },
  { k: 'Indonesia', e: 'Reformasi — Presiden Soeharto mundur', th: 1998 },
  { k: 'Indonesia', e: 'Tsunami besar di Aceh', th: 2004 },
  { k: 'Indonesia', e: 'Gempa besar Yogyakarta', th: 2006 },
  { k: 'Indonesia', e: 'Asian Games Jakarta–Palembang', th: 2018 },
  { k: 'Indonesia', e: 'MRT Jakarta mulai beroperasi', th: 2019 },
  { k: 'Indonesia', e: 'Balapan MotoGP pertama di Sirkuit Mandalika', th: 2022 },
  { k: 'Indonesia', e: 'Kereta Cepat Whoosh mulai beroperasi', th: 2023 },
  { k: 'Indonesia', e: 'Letusan dahsyat Gunung Krakatau', th: 1883 },
  { k: 'Indonesia', e: 'Letusan Gunung Tambora', th: 1815 },
  // --- Dunia ---
  { k: 'Dunia', e: 'Manusia pertama mendarat di Bulan', th: 1969 },
  { k: 'Dunia', e: 'Perang Dunia II berakhir', th: 1945 },
  { k: 'Dunia', e: 'Tembok Berlin runtuh', th: 1989 },
  { k: 'Dunia', e: 'Kapal Titanic tenggelam', th: 1912 },
  { k: 'Dunia', e: 'Wright bersaudara terbang dengan pesawat pertama', th: 1903 },
  { k: 'Dunia', e: 'PBB (Perserikatan Bangsa-Bangsa) didirikan', th: 1945 },
  { k: 'Dunia', e: 'YouTube didirikan', th: 2005 },
  { k: 'Dunia', e: 'Facebook didirikan', th: 2004 },
  { k: 'Dunia', e: 'Google didirikan', th: 1998 },
  { k: 'Dunia', e: 'iPhone pertama diluncurkan', th: 2007 },
  { k: 'Dunia', e: 'Instagram diluncurkan', th: 2010 },
  { k: 'Dunia', e: 'COVID-19 dinyatakan pandemi oleh WHO', th: 2020 },
  { k: 'Dunia', e: 'Yuri Gagarin, manusia pertama ke luar angkasa', th: 1961 },
  { k: 'Dunia', e: 'Perang Dunia I berakhir', th: 1918 },
  { k: 'Dunia', e: 'Piala Dunia sepak bola pertama', th: 1930 },
  { k: 'Dunia', e: 'World Wide Web (WWW) diciptakan', th: 1989 },
];
const TOTAL_SOAL = 10;
const LS_KEY = 'tebak-tahun-best';

// shuffle kanonis tinggal di utils (core.js).
function loadBest() {
  try { const v = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
  catch (e) { return {}; }
}
function saveBest(b) { try { localStorage.setItem(LS_KEY, JSON.stringify(b)); } catch (e) { /* abaikan */ } }

// Pengecoh tahun: dekat-dekat tahun benar (selisih 1–20 tahun) agar menjebak.
const pengecohTahun = (th) => {
  const s = new Set();
  const selisih = utils.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20]);
  for (const d of selisih) {
    if (s.size >= 3) break;
    const v = Math.random() < 0.5 ? th - d : th + d;
    if (v > 1500 && v <= 2026) s.add(v);
  }
  let x = th + 25;
  while (s.size < 3) { s.add(x); x += 7; }
  return [...s];
};

export function render(root) {
  const box = T.out();
  const bestBox = T.el('<p class="hint center"></p>');
  const katSel = T.select([['semua', 'Semua — Indonesia & Dunia'], ['Indonesia', 'Indonesia saja'], ['Dunia', 'Dunia saja']], 'semua');
  const quiz = { list: [], idx: 0, score: 0, answered: false };
  let best = loadBest();

  const katLabel = () => katSel.value === 'semua' ? 'Semua' : katSel.value;
  const gambarBest = () => {
    bestBox.textContent = 'Skor terbaik — Semua: ' + (best.semua || 0) + '/10 · Indonesia: ' + (best.Indonesia || 0) + '/10 · Dunia: ' + (best.Dunia || 0) + '/10';
  };

  const buatSoal = () => {
    const pool = katSel.value === 'semua' ? PERISTIWA : PERISTIWA.filter((p) => p.k === katSel.value);
    return utils.shuffle(pool).slice(0, TOTAL_SOAL).map((p) => ({
      e: p.e, k: p.k, th: p.th,
      opsi: utils.shuffle([p.th].concat(pengecohTahun(p.th))).sort((a, b) => a - b),
    }));
  };

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score + ' &bull; ' + T.esc(q.k) + '</p>' +
      '<p class="center" style="font-size:17px;line-height:1.6;margin:12px 0">Di tahun berapa peristiwa ini terjadi?</p>' +
      '<p class="center" style="font-size:19px;font-weight:700;line-height:1.5">' + T.esc(q.e) + '</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px">' +
      q.opsi.map((o) => '<button type="button" class="btn opsi" style="font-size:19px;font-weight:700;padding:14px 0;font-family:monospace">' + o + '</button>').join('') +
      '</div>'
    );
    const btns = box.querySelectorAll('.opsi');
    btns.forEach((b) => b.addEventListener('click', () => jawab(b, btns)));
  };

  const jawab = (btn, btns) => {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = parseInt(btn.textContent, 10) === q.th;
    if (ok) { quiz.score++; T.beep(660, 0.1); } else { T.beep(180, 0.15, 'sawtooth'); }
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score + ' &bull; ' + T.esc(q.k);
    btns.forEach((b) => {
      b.disabled = true;
      const v = parseInt(b.textContent, 10);
      if (v === q.th) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = v === q.th || b === btn ? '1' : '0.45';
    });
    const verdict = T.el('<p class="center" style="margin-top:12px;font-size:15px">' + (ok ? '✅ <b>Benar!</b>' : '❌ <b>Kurang tepat.</b> Jawaban yang benar: <b>' + q.th + '</b>') + '</p>');
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
    const key = katSel.value;
    let baru = '';
    if (s > (best[key] || 0)) { best[key] = s; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
    gambarBest();
    const msg = s === 10 ? 'Sempurna! Kamu mesin waktu berjalan. 📅✨'
      : s >= 8 ? 'Keren! Ingatan sejarahmu tajam.'
      : s >= 6 ? 'Lumayan! Beberapa tahun memang gampang ketukar.'
      : s >= 4 ? 'Masih bisa diasah. Coba hafalkan tahun-tahun besarnya dulu.'
      : 'Yah… sejarah memang penuh angka. Coba lagi! 😅';
    const teks = '📅 Tebak Tahun (' + katLabel() + '): aku dapat ' + s + '/10! Coba kalahin aku di Adip Tools.';
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

  katSel.addEventListener('change', start);
  root.appendChild(T.el('<p class="hint">' + PERISTIWA.length + ' peristiwa, 10 soal acak tiap main. Pilihan tahunnya berdekatan — jangan asal tebak!</p>'));
  root.appendChild(T.field('Kategori', katSel));
  root.appendChild(box);
  root.appendChild(bestBox);
  gambarBest();
  start();
}
