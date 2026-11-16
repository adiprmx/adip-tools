import { h as T, utils, onLeave } from '../../core.js?v=6.12.2';

export const meta = {"id": "kuis-matematika-cepat", "name": "Kuis Matematika Cepat", "cat": "fun", "icon": "🧮", "desc": "10 soal hitung-hitungan acak lawan waktu. Makin cepat jawab, makin besar skor.", "keywords": "matematika,hitung,kuis,cepat,angka,latihan,otak", "since": "6.12.0"};

// Soal dibuat acak tiap main (tidak ada bank soal yang bisa dihafal).
const LEVELS = [
  { id: 'santai', label: 'Santai — tambah & kurang, angka 2–20', max: 20, ops: ['+', '-'], detik: 15 },
  { id: 'cepat', label: 'Cepat — tambah, kurang & kali, angka 2–50', max: 50, ops: ['+', '-', '×'], detik: 12 },
  { id: 'kilat', label: 'Kilat — semua operasi, angka 2–99', max: 99, ops: ['+', '-', '×', '÷'], detik: 10 },
];
const TOTAL_SOAL = 10;
const LS_KEY = 'kuis-matematika-cepat-best';

const acak = (mn, mx) => mn + Math.floor(Math.random() * (mx - mn + 1));
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
  const lvlSel = T.select(LEVELS.map((l) => [l.id, l.label]), 'santai');
  const quiz = { list: [], idx: 0, benar: 0, skor: 0, answered: false };
  let best = loadBest();
  let timer = null, sisa = 0;

  const level = () => LEVELS.find((l) => l.id === lvlSel.value) || LEVELS[0];
  const lvlLabel = () => level().label.split(' — ')[0];
  const gambarBest = () => {
    bestBox.textContent = 'Skor terbaik — ' + LEVELS.map((l) => l.label.split(' — ')[0] + ': ' + (best[l.id] || 0)).join(' · ');
  };
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
  onLeave(stopTimer);

  const buatSoal = () => {
    const lv = level();
    const list = [];
    for (let i = 0; i < TOTAL_SOAL; i++) {
      const op = lv.ops[Math.floor(Math.random() * lv.ops.length)];
      let a, b, jawab, teks;
      if (op === '+') { a = acak(2, lv.max); b = acak(2, lv.max); jawab = a + b; teks = a + ' + ' + b; }
      else if (op === '-') { a = acak(2, lv.max); b = acak(2, a); jawab = a - b; teks = a + ' − ' + b; }
      else if (op === '×') { a = acak(2, Math.min(12, lv.max)); b = acak(2, Math.min(12, lv.max)); jawab = a * b; teks = a + ' × ' + b; }
      else { b = acak(2, 12); jawab = acak(2, 12); a = b * jawab; teks = a + ' ÷ ' + b; }
      // Pengecoh: jawaban benar ±1..±10 atau salah digit, selalu unik & tidak negatif.
      const opsiSet = new Set([jawab]);
      let coba = 0;
      while (opsiSet.size < 4 && coba < 40) {
        coba++;
        const d = acak(1, 10) * (Math.random() < 0.5 ? -1 : 1);
        const v = jawab + d;
        if (v >= 0) opsiSet.add(v);
      }
      while (opsiSet.size < 4) opsiSet.add(jawab + opsiSet.size + 3);
      list.push({ teks, jawab, opsi: shuffle([...opsiSet]) });
    }
    return list;
  };

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    const lv = level();
    quiz.answered = false;
    sisa = lv.detik;
    T.show(box,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Benar: ' + quiz.benar + ' &bull; Skor: ' + quiz.skor + ' &bull; ' + lvlLabel() + '</p>' +
      '<div style="height:8px;border-radius:99px;background:var(--line);overflow:hidden;margin:6px 0 12px"><div id="bar-waktu" style="height:100%;width:100%;background:#fff;transition:width .2s linear"></div></div>' +
      '<p class="center" style="font-size:13px">Sisa waktu: <b id="txt-waktu">' + sisa + '</b> detik</p>' +
      '<div class="big center" style="font-size:42px;margin:6px 0">' + T.esc(q.teks) + ' = ?</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">' +
      q.opsi.map((o) => '<button type="button" class="btn opsi" style="font-size:19px;font-weight:700;padding:14px 0">' + o + '</button>').join('') +
      '</div>'
    );
    const bar = box.querySelector('#bar-waktu');
    const txt = box.querySelector('#txt-waktu');
    const btns = box.querySelectorAll('.opsi');
    btns.forEach((b) => b.addEventListener('click', () => jawab(b, btns)));
    stopTimer();
    timer = setInterval(() => {
      sisa -= 0.2;
      if (bar) bar.style.width = Math.max(0, sisa / lv.detik * 100) + '%';
      if (txt) txt.textContent = Math.max(0, Math.ceil(sisa));
      if (sisa <= 0) {
        stopTimer();
        habisWaktu(btns);
      }
    }, 200);
  };

  const kunciTombol = (btns, q, pilih) => {
    btns.forEach((b) => {
      b.disabled = true;
      const v = parseInt(b.textContent, 10);
      if (v === q.jawab) { b.classList.add('primary'); }
      else if (b === pilih) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = v === q.jawab || b === pilih ? '1' : '0.45';
    });
  };
  const tombolLanjut = () => {
    const last = quiz.idx >= TOTAL_SOAL - 1;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= TOTAL_SOAL) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    box.appendChild(next);
  };

  const jawab = (btn, btns) => {
    if (quiz.answered) return;
    quiz.answered = true;
    stopTimer();
    const q = quiz.list[quiz.idx];
    const ok = parseInt(btn.textContent, 10) === q.jawab;
    if (ok) {
      quiz.benar++;
      // Bonus kecepatan: 100 poin dasar + 10 per detik tersisa.
      quiz.skor += 100 + Math.max(0, Math.ceil(sisa)) * 10;
      T.beep(660, 0.1);
    } else {
      T.beep(180, 0.15, 'sawtooth');
    }
    // status diperbarui langsung biar skor tidak tampak reset
    const hint = box.querySelector('.hint');
    if (hint) hint.innerHTML = 'Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Benar: ' + quiz.benar + ' &bull; Skor: ' + quiz.skor + ' &bull; ' + lvlLabel();
    const verdict = T.el('<p class="center" style="margin-top:12px;font-size:15px">' + (ok ? '✅ <b>Benar!</b>' : '❌ <b>Kurang tepat.</b> Jawaban yang benar: <b>' + q.jawab + '</b>') + '</p>');
    box.appendChild(verdict);
    kunciTombol(btns, q, btn);
    tombolLanjut();
  };

  const habisWaktu = (btns) => {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    T.beep(180, 0.2, 'sawtooth');
    kunciTombol(btns, q, null);
    const info = T.el('<p class="center hint" style="margin-top:8px">Waktunya habis! Jawabannya <b>' + q.jawab + '</b>.</p>');
    box.appendChild(info);
    tombolLanjut();
  };

  const finish = () => {
    stopTimer();
    const s = quiz.skor, b = quiz.benar;
    const key = lvlSel.value;
    let baru = '';
    if (s > (best[key] || 0)) { best[key] = s; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
    gambarBest();
    const msg = b === TOTAL_SOAL ? 'Sempurna & cepat! Otak kalkulatormu panas. 🧮✨'
      : b >= 8 ? 'Keren! Hitunganmu cepat dan akurat.'
      : b >= 6 ? 'Lumayan! Kecepatan oke, ketelitian masih bisa diasah.'
      : b >= 4 ? 'Masih bisa dilatih. Coba level Santai dulu sampai lancar.'
      : 'Yah… jangan buru-buru, baca soalnya baik-baik dulu. 😅';
    const teks = '🧮 Kuis Matematika Cepat (' + lvlLabel() + '): ' + b + '/' + TOTAL_SOAL + ' benar, skor ' + s + '! Coba kalahin aku di Adip Tools.';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    wrap.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      wrap.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
    }
    T.show(box,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px"> poin</span></div>' +
      '<p class="center">' + b + ' dari ' + TOTAL_SOAL + ' soal benar</p>' +
      '<p class="center">' + msg + baru + '</p>'
    );
    box.appendChild(wrap);
  };

  const start = () => {
    stopTimer();
    quiz.list = buatSoal();
    quiz.idx = 0; quiz.benar = 0; quiz.skor = 0;
    showQ();
  };

  lvlSel.addEventListener('change', start);
  root.appendChild(T.el('<p class="hint">10 soal hitung-hitungan acak — tidak ada soal yang sama tiap main. Jawab benar secepat mungkin: makin cepat, makin besar skornya.</p>'));
  root.appendChild(T.field('Level', lvlSel));
  root.appendChild(box);
  root.appendChild(bestBox);
  gambarBest();
  start();
}
