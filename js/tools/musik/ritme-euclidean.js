import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "ritme-euclidean", "name": "Generator Ritme Euclidean", "cat": "musik", "icon": "🥁", "desc": "Pola ritme algoritmik E(k,n) ala Bjorklund + preview.", "keywords": "euclidean,ritme,bjorklund,pola,algoritma,drum,generator"};

/* Algoritma Bjorklund — menyebar k hit semerata mungkin ke n langkah.
   Fungsi murni, bisa diuji tanpa DOM. E(3,8) -> [1,0,0,1,0,0,1,0]. */
export function euclid(k, n) {
  k = Math.floor(k); n = Math.floor(n);
  if (!(n > 0)) return [];
  if (k <= 0) return Array(n).fill(0);
  if (k >= n) return Array(n).fill(1);
  const counts = [], remainders = [];
  let divisor = n - k, level = 0;
  remainders.push(k);
  while (true) {
    counts.push(Math.floor(divisor / remainders[level]));
    remainders.push(divisor % remainders[level]);
    divisor = remainders[level];
    level++;
    if (remainders[level] <= 1) break;
  }
  counts.push(divisor);
  const out = [];
  const build = (l) => {
    if (l === -1) out.push(0);
    else if (l === -2) out.push(1);
    else {
      for (let i = 0; i < counts[l]; i++) build(l - 1);
      if (remainders[l] !== 0) build(l - 2);
    }
  };
  build(level);
  return out.reverse();
}
/* Geser pola s langkah ke kiri (s negatif = ke kanan). */
export function rotatePattern(pola, s) {
  if (!pola.length) return pola;
  const n = pola.length;
  const d = ((s % n) + n) % n;
  return pola.slice(d).concat(pola.slice(0, d));
}

export function render(root) {

    root.appendChild(T.el('<p class="hint" style="margin-bottom:12px;line-height:1.6">Ritme Euclidean menyebar <b>k</b> hit semerata mungkin ke <b>n</b> langkah pakai algoritma Bjorklund — rumus di balik pola musik dunia seperti tresillo kuba E(3,8). Beda dari drum-machine: pola dibuat otomatis oleh algoritma, bukan diisi manual per step.</p>'));

    const iHits = T.input('number', 'cth: 5', '5');
    const iSteps = T.input('number', 'cth: 16', '16');
    const iBpm = T.input('number', 'cth: 120', '120');
    const iNilai = T.select([['4', '1/4 (ketuk)'], ['8', '1/8'], ['16', '1/16']], '16');
    root.appendChild(T.grid2(
      T.field('Hits (k)', iHits, 'Jumlah pukulan.'),
      T.field('Steps (n)', iSteps, 'Jumlah langkah, maks 64.')
    ));
    root.appendChild(T.grid2(
      T.field('Tempo preview (BPM)', iBpm),
      T.field('Nilai tiap step', iNilai)
    ));

    const grid = T.el('<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 12px"></div>');
    const box = T.out();
    root.appendChild(grid);
    root.appendChild(box);

    let pola = [], geser = 0;
    let timer = null, nextTime = 0, step = 0, running = false, cellEls = [];

    const getK = () => Math.min(64, Math.max(0, Math.floor(T.num(iHits.value)) || 0));
    const getN = () => Math.min(64, Math.max(1, Math.floor(T.num(iSteps.value)) || 16));
    const getBpm = () => Math.min(240, Math.max(30, Math.round(T.num(iBpm.value)) || 120));
    const stepDur = () => (60 / getBpm()) * (4 / +iNilai.value);

    const bangunPola = () => {
      geser = 0;
      pola = euclid(getK(), getN());
      gambar();
    };

    const gambar = () => {
      grid.innerHTML = '';
      cellEls = [];
      const n = pola.length;
      pola.forEach((v, i) => {
        const c = T.el('<span style="width:30px;height:30px;border-radius:8px;background:' +
          (v ? '#fff' : '#27272a') + ';border:1px solid #3f3f46;display:inline-flex;align-items:center;justify-content:center;font-size:10px;color:#a1a1aa"></span>');
        c.textContent = i + 1;
        c.title = 'Step ' + (i + 1) + (v ? ' (hit)' : '');
        c.dataset.i = i;
        grid.appendChild(c);
        cellEls.push(c);
      });
      const bin = pola.join('');
      T.show(box,
        '<p class="center" style="font-family:monospace;font-size:15px;letter-spacing:2px;margin-bottom:4px">' + T.esc(bin) + '</p>' +
        '<p class="center hint">E(' + getK() + ',' + getN() + ')' + (geser ? ' · digeser ' + geser + ' langkah' : '') + ' · ' + getK() + ' hit / ' + getN() + ' step</p>');
      const salin = T.copyBtn(() => bin, 'Salin pola');
      const wr = T.el('<div class="center" style="margin-top:8px"></div>');
      wr.appendChild(salin);
      box.appendChild(wr);
    };

    const sorot = (i) => {
      cellEls.forEach((c) => {
        const aktif = pola[+c.dataset.i] === 1;
        c.style.background = +c.dataset.i === i ? '#38bdf8' : (aktif ? '#fff' : '#27272a');
      });
    };

    const bunyi = (t, aksen) => {
      try {
        const c = T.actx();
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.value = aksen ? 320 : 180;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.6, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.12);
      } catch (e) { /* audio tidak tersedia */ }
    };

    const scheduler = () => {
      try {
        const c = T.actx();
        while (nextTime < c.currentTime + 0.12) {
          const cur = step % pola.length;
          if (pola[cur] === 1) bunyi(nextTime, cur === 0);
          const sShow = cur;
          setTimeout(() => { if (running) sorot(sShow); }, Math.max(0, (nextTime - c.currentTime) * 1000));
          nextTime += stepDur();
          step++;
        }
      } catch (e) { stop(); }
    };

    const stop = () => {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      playBtn.textContent = '▶ Play';
      cellEls.forEach((c) => { c.style.background = pola[+c.dataset.i] === 1 ? '#fff' : '#27272a'; });
    };

    const start = () => {
      if (!pola.length || !pola.includes(1)) { T.toast('Pola kosong — tambah hits (k) dulu'); return; }
      try {
        const c = T.actx();
        running = true;
        step = 0;
        nextTime = c.currentTime + 0.06;
        timer = setInterval(scheduler, 25);
        playBtn.textContent = '⏹ Stop';
      } catch (e) { T.toast('Audio tidak tersedia di perangkat ini'); }
    };

    const playBtn = T.btn('▶ Play', () => { running ? stop() : start(); }, true);
    const rotBtn = T.btn('⟳ Putar pola', () => {
      stop();
      geser = (geser + 1) % (pola.length || 1);
      pola = rotatePattern(pola, 1);
      gambar();
    });
    root.appendChild(T.row(playBtn, rotBtn));
    T.onLeave(stop);

    [iHits, iSteps].forEach((i) => i.addEventListener('input', () => { stop(); bangunPola(); }));
    iNilai.addEventListener('change', () => { if (running) { stop(); start(); } });

    bangunPola();

}
