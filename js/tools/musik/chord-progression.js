import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "chord-progression", "name": "Chord Progression", "cat": "musik", "icon": "🎼", "desc": "Progresi akor sesuai nada dasar & mood, bisa dibunyikan.", "keywords": "chord,akor,progresi,musik,gitar,piano,nada"};
export function render(root) {

    const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const KEYS = [
      { id: 'C', pc: 0, minor: false, names: SHARP }, { id: 'D', pc: 2, minor: false, names: SHARP },
      { id: 'E', pc: 4, minor: false, names: SHARP }, { id: 'F', pc: 5, minor: false, names: FLAT },
      { id: 'G', pc: 7, minor: false, names: SHARP }, { id: 'A', pc: 9, minor: false, names: SHARP },
      { id: 'B', pc: 11, minor: false, names: SHARP },
      { id: 'Am', pc: 9, minor: true, names: SHARP }, { id: 'Bm', pc: 11, minor: true, names: SHARP },
      { id: 'Cm', pc: 0, minor: true, names: FLAT }, { id: 'Dm', pc: 2, minor: true, names: FLAT },
      { id: 'Em', pc: 4, minor: true, names: SHARP }, { id: 'F#m', pc: 6, minor: true, names: SHARP },
      { id: 'Gm', pc: 7, minor: true, names: FLAT },
    ];
    const MOODS = [
      { id: 'ceria', label: '😄 Ceria', desc: 'Progresi sejuta lagu pop. Dijamin bikin angguk-angguk sendiri.' },
      { id: 'sedih', label: '😢 Sedih', desc: 'Buat lagu patah hati, atau teman hujan-hujanan di kamar.' },
      { id: 'galau', label: '💔 Galau', desc: 'Nanggung: nggak sedih-sedih amat, tapi nggak bahagia juga. Kayak chat cuma dibaca doang.' },
      { id: 'epik', label: '⚔️ Epik', desc: 'Rasanya kayak soundtrack film perang. Cocok buat intro yang megah.' },
    ];
    // derajat 1–7 per mood (mayor / minor)
    const PROG = {
      ceria: { maj: [1, 5, 6, 4],           min: [1, 6, 3, 7] },
      sedih: { maj: [6, 4, 1, 5],           min: [1, 7, 6, 7] },
      galau: { maj: [2, 5, 1, 6],           min: [1, 4, 7, 3] },
      epik:  { maj: [1, 5, 6, 3, 4, 1, 4, 5], min: [1, 7, 6, 5, 1, 7, 6, 7] },
    };
    const MAJ_STEPS = [0, 2, 4, 5, 7, 9, 11], MIN_STEPS = [0, 2, 3, 5, 7, 8, 10];
    const MAJ_Q = ['', 'm', 'm', '', '', 'm', 'dim'], MAJ_R = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    const MIN_Q = ['m', 'dim', '', 'm', 'm', '', ''], MIN_R = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

    const bunyiAkor = (key, deg) => {
      const steps = key.minor ? MIN_STEPS : MAJ_STEPS;
      const q = (key.minor ? MIN_Q : MAJ_Q)[deg - 1];
      const rootPc = (key.pc + steps[deg - 1]) % 12;
      const iv = q === '' ? [0, 4, 7, 12] : q === 'm' ? [0, 3, 7, 12] : [0, 3, 6, 12];
      const dasar = 48 + rootPc; // sekitar oktaf 3
      try {
        const c = T.actx(), t = c.currentTime;
        iv.forEach((s) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'triangle';
          o.frequency.value = 440 * Math.pow(2, (dasar + s - 69) / 12);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
          o.connect(g); g.connect(c.destination);
          o.start(t); o.stop(t + 1.5);
        });
      } catch (e) { /* audio tidak tersedia */ }
    };

    let keyId = 'C', moodId = 'ceria';
    try {
      keyId = localStorage.getItem('chordProg.key') || 'C';
      moodId = localStorage.getItem('chordProg.mood') || 'ceria';
    } catch (e) { /* abaikan */ }
    if (!KEYS.some((k) => k.id === keyId)) keyId = 'C';
    if (!PROG[moodId]) moodId = 'ceria';

    const selKey = T.select(KEYS.map((k) => [k.id, k.id]), keyId);
    const selMood = T.select(MOODS.map((m) => [m.id, m.label]), moodId);
    const box = T.out();
    let timerMain = null;
    T.onLeave(() => { if (timerMain) clearTimeout(timerMain); });

    const namaAkor = (key, deg) => {
      const steps = key.minor ? MIN_STEPS : MAJ_STEPS;
      return key.names[(key.pc + steps[deg - 1]) % 12] + (key.minor ? MIN_Q : MAJ_Q)[deg - 1];
    };
    const romawi = (key, deg) => (key.minor ? MIN_R : MAJ_R)[deg - 1];

    const tampilkan = () => {
      if (timerMain) { clearTimeout(timerMain); timerMain = null; }
      const key = KEYS.find((k) => k.id === selKey.value);
      const mood = MOODS.find((m) => m.id === selMood.value);
      try {
        localStorage.setItem('chordProg.key', key.id);
        localStorage.setItem('chordProg.mood', mood.id);
      } catch (e) { /* abaikan */ }
      const degs = PROG[mood.id][key.minor ? 'min' : 'maj'];
      let html = '<p class="center mut">' + T.esc(mood.label) + ' · nada dasar ' + T.esc(key.id) + '</p>' +
        '<p class="center hint">' + T.esc(mood.desc) + '</p><div style="display:grid;gap:10px">';
      degs.forEach((d, i) => {
        html += '<div class="row" style="justify-content:space-between;align-items:center;border:1px solid #ffffff20;border-radius:10px;padding:10px 12px">' +
          '<div><div class="big" style="font-size:22px">' + T.esc(namaAkor(key, d)) + '</div>' +
          '<div class="mut" style="font-size:12px">derajat ' + T.esc(romawi(key, d)) + '</div></div>' +
          '<button type="button" class="btn" data-i="' + i + '">▶ Play</button></div>';
      });
      html += '</div>';
      T.show(box, html);
      box.querySelectorAll('button[data-i]').forEach((b) => {
        b.addEventListener('click', () => bunyiAkor(key, degs[+b.dataset.i]));
      });
      const putarSemua = T.btn('▶ Putar Semua', () => {
        let i = 0;
        const next = () => {
          if (i >= degs.length) { timerMain = null; return; }
          bunyiAkor(key, degs[i]);
          const kartu = box.querySelectorAll('button[data-i]')[i];
          if (kartu) { kartu.classList.add('primary'); setTimeout(() => kartu.classList.remove('primary'), 500); }
          i++;
          timerMain = setTimeout(next, 900);
        };
        next();
      });
      box.appendChild(T.row(putarSemua));
      box.appendChild(T.el('<p class="hint">Contoh bacanya: ' + T.esc(namaAkor(key, degs[0])) + ' → ' +
        degs.slice(1).map((d) => namaAkor(key, d)).join(' → ') + '</p>'));
    };

    selKey.addEventListener('change', tampilkan);
    selMood.addEventListener('change', tampilkan);
    root.appendChild(T.field('Nada dasar', selKey));
    root.appendChild(T.field('Mood', selMood, 'Hasilnya langsung berubah tiap pilihan diganti.'));
    root.appendChild(box);
    tampilkan();

}
