import { h as T, _NI, tabs } from '../../core.js';

export const meta = {"id": "tebak-chord", "name": "Tebak Chord dari Nada", "cat": "musik", "icon": "🔍", "desc": "Ketik nada-nada, tebak nama chordnya, plus kuis dengar chord 3 level.", "keywords": "chord,nada,tebak,nama chord,identifikasi,interval,kuis,latihan telinga"};

const NS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PATTERNS = [
  { suf: '',      iv: [0, 4, 7],    label: 'mayor' },
  { suf: 'm',     iv: [0, 3, 7],    label: 'minor' },
  { suf: 'dim',   iv: [0, 3, 6],    label: 'diminished' },
  { suf: 'aug',   iv: [0, 4, 8],    label: 'augmented' },
  { suf: 'sus2',  iv: [0, 2, 7],    label: 'suspended 2' },
  { suf: 'sus4',  iv: [0, 5, 7],    label: 'suspended 4' },
  { suf: '5',     iv: [0, 7],       label: 'power chord' },
  { suf: '6',     iv: [0, 4, 7, 9], label: 'mayor 6' },
  { suf: 'm6',    iv: [0, 3, 7, 9], label: 'minor 6' },
  { suf: '7',     iv: [0, 4, 7, 10], label: 'dominan 7' },
  { suf: 'maj7',  iv: [0, 4, 7, 11], label: 'mayor 7' },
  { suf: 'm7',    iv: [0, 3, 7, 10], label: 'minor 7' },
  { suf: 'm(maj7)', iv: [0, 3, 7, 11], label: 'minor mayor 7' },
  { suf: 'dim7',  iv: [0, 3, 6, 9],  label: 'diminished 7' },
  { suf: 'm7b5',  iv: [0, 3, 6, 10], label: 'minor 7 flat 5 (half-diminished)' },
];
const QUIZ_LEVELS = [
  { id: 'mudah', label: 'Mudah — mayor, minor, 7, m7', sufs: ['', 'm', '7', 'm7'] },
  { id: 'sedang', label: 'Sedang — tambah dim, aug, sus, maj7', sufs: ['', 'm', '7', 'm7', 'dim', 'aug', 'sus2', 'sus4', 'maj7'] },
  { id: 'sulit', label: 'Sulit — semua 15 jenis chord', sufs: null },
];
const TOTAL_SOAL = 10;
const LS_KEY = 'tebak-chord-best-v2';

const pcFreq = (pc) => 440 * Math.pow(2, (pc - 9) / 12);
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

// Bunyikan chord sebagai arpeggio (nada satu-satu, lalu bareng).
function mainkanChord(rootPc, iv) {
  iv.forEach((step, i) => {
    try { T.beep(pcFreq((rootPc + step) % 12), 0.5, 'triangle', i * 0.28); } catch (e) {}
  });
  iv.forEach((step) => {
    try { T.beep(pcFreq((rootPc + step) % 12), 0.9, 'triangle', iv.length * 0.28 + 0.15); } catch (e) {}
  });
}

export function render(root) {
  // ============ TAB 1: Tebak dari Nada (identifikasi, seperti sebelumnya) ============
  const pIden = T.el('<div></div>');
  const normTok = (t) => {
    t = String(t || '').trim().replace(/♯/g, '#').replace(/♭/g, 'b');
    if (!t) return null;
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const sameSet = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  const inp = T.input('text', 'Contoh: C E G  atau  A C E', '');
  inp.autocapitalize = 'characters';
  const noteBar = T.el('<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>');
  NS.forEach((n) => {
    const b = T.btn(n, () => {
      inp.value = (inp.value ? inp.value.trim() + ' ' : '') + n;
      inp.focus();
    });
    b.style.padding = '8px 10px';
    b.style.fontSize = '13px';
    noteBar.appendChild(b);
  });
  const box = T.out();

  const dengarBtn = (rootName, iv) => T.btn('🔊 dengar', () => mainkanChord(rootName, iv));

  const tebak = () => {
    const toks = String(inp.value).split(/[\s,;]+/).filter(Boolean);
    if (!toks.length) {
      box.innerHTML = '<div style="color:#f59e0b;font-size:13px">Ketik dulu nada-nadanya, mis. <b>C E G</b> — atau ketuk tombol nada di atas.</div>';
      return;
    }
    const bad = [], pcs = [];
    toks.forEach((tk) => {
      const n = normTok(tk);
      const pc = n != null ? _NI[n] : undefined;
      if (pc == null) bad.push(tk);
      else if (!pcs.includes(pc)) pcs.push(pc);
    });
    if (bad.length) {
      box.innerHTML = '<div style="color:#ef4444;font-size:13px;line-height:1.6">Nada tidak dikenali: <b>' + bad.map((b) => T.esc(b)).join(', ') + '</b>.<br>Pakai nama nada seperti: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B.</div>';
      return;
    }
    if (pcs.length < 2) {
      box.innerHTML = '<div style="color:#f59e0b;font-size:13px">Butuh minimal 2 nada berbeda untuk menebak chord.</div>';
      return;
    }
    const found = [];
    pcs.forEach((rootPc) => {
      const iv = pcs.map((p) => (p - rootPc + 12) % 12).sort((a, b) => a - b);
      PATTERNS.forEach((p) => {
        if (sameSet(iv, p.iv)) found.push({ root: rootPc, suf: p.suf, label: p.label, iv: p.iv });
      });
    });
    if (!found.length) {
      box.innerHTML = '<div style="color:#f59e0b;font-size:13px;line-height:1.6">Tidak ada chord yang cocok dengan kombinasi <b>' + pcs.map((p) => NS[p]).join(' ') + '</b>.<br>Coba 2–4 nada yang membentuk interval umum, mis. <b>C E G</b> (= C mayor) atau <b>A C E</b> (= A minor).</div>';
      return;
    }
    const wrap = T.el('<div></div>');
    wrap.appendChild(T.el('<div style="font-size:13px;color:#a1a1aa;margin-bottom:8px">Nada: <b style="color:#fff">' + pcs.map((p) => NS[p]).join(' – ') + '</b> → kemungkinan chord:</div>'));
    found.forEach((c) => {
      const tones = c.iv.map((s) => NS[(c.root + s) % 12]).join(' ');
      const row = T.el('<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;margin-bottom:8px;background:#18181b"></div>');
      const nm = T.el('<div style="flex:1"><div style="font-size:20px;font-weight:800">' + NS[c.root] + c.suf + '</div><div style="font-size:12px;color:#a1a1aa">' + c.label + ' · ' + tones + '</div></div>');
      row.appendChild(nm);
      row.appendChild(dengarBtn(c.root, c.iv));
      wrap.appendChild(row);
    });
    box.innerHTML = '';
    box.appendChild(wrap);
  };

  const goBtn = T.btn('Tebak', tebak, true);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') tebak(); });
  pIden.appendChild(T.field('Nada-nada (pisahkan dengan spasi)', inp));
  pIden.appendChild(noteBar);
  pIden.appendChild(T.el('<div style="height:12px"></div>'));
  pIden.appendChild(T.row(goBtn));
  pIden.appendChild(box);

  // ============ TAB 2: Kuis Dengar Chord ============
  const pKuis = T.el('<div></div>');
  const kBox = T.out();
  const bestBox = T.el('<p class="hint center"></p>');
  const lvlSel = T.select(QUIZ_LEVELS.map((l) => [l.id, l.label]), 'mudah');
  const quiz = { list: [], idx: 0, score: 0, answered: false };
  let best = loadBest();

  const lvlLabel = () => (QUIZ_LEVELS.find((l) => l.id === lvlSel.value) || QUIZ_LEVELS[0]).label.split(' — ')[0];
  const gambarBest = () => {
    bestBox.textContent = 'Skor terbaik — ' + QUIZ_LEVELS.map((l) => l.label.split(' — ')[0] + ': ' + (best[l.id] || 0) + '/10').join(' · ');
  };
  const polaLevel = () => {
    const l = QUIZ_LEVELS.find((x) => x.id === lvlSel.value) || QUIZ_LEVELS[0];
    return l.sufs ? PATTERNS.filter((p) => l.sufs.includes(p.suf)) : PATTERNS;
  };

  const buatSoal = () => {
    const pola = polaLevel();
    const list = [];
    const dipakai = new Set();
    while (list.length < TOTAL_SOAL) {
      const p = pola[Math.floor(Math.random() * pola.length)];
      const r = Math.floor(Math.random() * 12);
      const nama = NS[r] + p.suf;
      if (dipakai.has(nama)) continue;
      dipakai.add(nama);
      // Pengecoh: root sama jenis beda, atau jenis sama root beda.
      const opsiSet = new Set([nama]);
      const calon = shuffle(pola.filter((x) => x.suf !== p.suf)).map((x) => NS[r] + x.suf)
        .concat(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((x) => x !== r)).map((x) => NS[x] + p.suf));
      for (const c of calon) { if (opsiSet.size >= 4) break; opsiSet.add(c); }
      list.push({ nama, root: r, iv: p.iv, label: p.label, opsi: shuffle([...opsiSet]) });
    }
    return list;
  };

  const showQ = () => {
    const q = quiz.list[quiz.idx];
    quiz.answered = false;
    T.show(kBox,
      '<p class="hint">Soal ' + (quiz.idx + 1) + ' dari ' + TOTAL_SOAL + ' &bull; Skor: ' + quiz.score + ' &bull; ' + lvlLabel() + '</p>' +
      '<p class="center" style="font-size:16px">Dengarkan chord ini, lalu tebak namanya:</p>' +
      '<div class="center" style="margin:8px 0"><button type="button" class="btn primary" id="btn-dengar" style="font-size:16px;padding:12px 28px">🔊 Putar chord</button></div>' +
      '<div class="row" style="flex-direction:column;align-items:stretch;gap:8px;margin-top:10px">' +
      q.opsi.map((o) => '<button type="button" class="btn opsi" style="font-size:17px;font-weight:700">' + T.esc(o) + '</button>').join('') +
      '</div>'
    );
    kBox.querySelector('#btn-dengar').addEventListener('click', () => mainkanChord(q.root, q.iv));
    const btns = kBox.querySelectorAll('.opsi');
    btns.forEach((b) => b.addEventListener('click', () => jawab(b, btns)));
    // Putar otomatis sekali saat soal muncul.
    try { mainkanChord(q.root, q.iv); } catch (e) { /* abaikan */ }
  };

  const jawab = (btn, btns) => {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.list[quiz.idx];
    const ok = btn.textContent === q.nama;
    if (ok) { quiz.score++; T.beep(660, 0.1); } else { T.beep(180, 0.15, 'sawtooth'); }
    btns.forEach((b) => {
      b.disabled = true;
      if (b.textContent === q.nama) { b.classList.add('primary'); }
      else if (b === btn) { b.style.borderColor = '#ef4444'; b.style.color = '#ef4444'; }
      b.style.opacity = b.textContent === q.nama || b === btn ? '1' : '0.45';
    });
    const info = T.el('<p class="hint center" style="margin-top:8px">Jawabannya <b>' + T.esc(q.nama) + '</b> (' + T.esc(q.label) + ') — nada: ' + q.iv.map((s) => NS[(q.root + s) % 12]).join(' ') + '</p>');
    kBox.appendChild(info);
    const last = quiz.idx >= TOTAL_SOAL - 1;
    const next = T.btn(last ? 'Lihat hasil 🏁' : 'Soal berikutnya ➡️', () => {
      quiz.idx++;
      if (quiz.idx >= TOTAL_SOAL) finish(); else showQ();
    }, true);
    next.style.marginTop = '12px';
    kBox.appendChild(next);
  };

  const finish = () => {
    const s = quiz.score;
    const key = lvlSel.value;
    let baru = '';
    if (s > (best[key] || 0)) { best[key] = s; saveBest(best); baru = ' <b style="color:var(--acc)">Rekor baru!</b>'; }
    gambarBest();
    const msg = s === 10 ? 'Telinga absolut! Kamu dengar chord kayak baca tulisan. 🎧✨'
      : s >= 8 ? 'Keren! Telinga musikmu tajam.'
      : s >= 6 ? 'Lumayan! Mayor-minor sudah kebaca, tinggal yang 7-an.'
      : s >= 4 ? 'Masih bisa dilatih. Coba level Mudah dulu sampai hafal bunyinya.'
      : 'Yah… coba dengarkan tiap chord berulang-ulang, nanti juga nempel. 😅';
    const teks = '🔍 Tebak Chord (' + lvlLabel() + '): aku dapat ' + s + '/10! Coba kalahin aku di Adip Tools.';
    const wrap = T.el('<div class="row center" style="margin-top:12px"></div>');
    wrap.appendChild(T.btn('Main lagi 🔄', start, true));
    wrap.appendChild(T.copyBtn(() => teks, '📋 Salin hasil'));
    if (typeof navigator !== 'undefined' && navigator.share) {
      wrap.appendChild(T.btn('📤 Bagikan', () => { navigator.share({ text: teks }).catch(() => {}); }));
    }
    T.show(kBox,
      '<div class="big center">' + s + '<span class="mut" style="font-size:15px">/' + TOTAL_SOAL + '</span></div>' +
      '<p class="center">' + msg + baru + '</p>'
    );
    kBox.appendChild(wrap);
  };

  const start = () => {
    quiz.list = buatSoal();
    quiz.idx = 0;
    quiz.score = 0;
    showQ();
  };

  lvlSel.addEventListener('change', start);
  pKuis.appendChild(T.el('<p class="hint">10 chord acak dibunyikan. Tebak namanya — makin sulit levelnya, makin banyak jenis chordnya. Nyalakan suara HP-mu! 🔊</p>'));
  pKuis.appendChild(T.field('Level', lvlSel));
  pKuis.appendChild(kBox);
  pKuis.appendChild(bestBox);
  gambarBest();
  start();

  root.appendChild(tabs([['Tebak dari Nada', 0], ['Kuis Dengar Chord', 1]], [pIden, pKuis]));
}
