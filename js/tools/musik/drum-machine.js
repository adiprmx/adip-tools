import { h as T, utils } from '../../core.js?v=5.0.1';

export const meta = {"id": "drum-machine", "name": "Drum Machine", "cat": "musik", "icon": "🎛️", "desc": "Step sequencer drum sederhana."};

export function render(root) {

    const TRACKS = [
      { name: 'Kick', play: (c, t, nb) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.3);
      } },
      { name: 'Snare', play: (c, t, nb) => {
        const s = c.createBufferSource(); s.buffer = nb;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
        const g = c.createGain(); g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.2);
        const o = c.createOscillator(), g2 = c.createGain();
        o.type = 'triangle'; o.frequency.value = 190;
        g2.gain.setValueAtTime(0.4, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g2); g2.connect(c.destination); o.start(t); o.stop(t + 0.12);
      } },
      { name: 'Hihat', play: (c, t, nb) => {
        const s = c.createBufferSource(); s.buffer = nb;
        const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
        const g = c.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.08);
      } },
      { name: 'Clap', play: (c, t, nb) => {
        const s = c.createBufferSource(); s.buffer = nb;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2;
        const g = c.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.18);
      } },
    ];
    const STEPS = 16;
    const state = TRACKS.map(() => Array(STEPS).fill(false));
    const bpmIn = T.input('number', 'BPM', '120');
    const grid = T.el('<div class="drumgrid" style="grid-template-columns:52px repeat(16,1fr)"></div>');
    const cellRefs = [];
    TRACKS.forEach((tr, r) => {
      grid.appendChild(T.el('<div class="mut" style="font-size:12px;display:flex;align-items:center">' + T.esc(tr.name) + '</div>'));
      cellRefs.push([]);
      for (let s = 0; s < STEPS; s++) {
        const cell = T.el('<div class="cell' + (s % 4 === 0 ? ' play' : '') + '" style="' + (s % 4 === 0 ? '' : '') + '"></div>');
        if (s % 4 === 0) cell.style.borderColor = '#52525b';
        cell.addEventListener('click', () => { state[r][s] = !state[r][s]; cell.classList.toggle('on', state[r][s]); });
        grid.appendChild(cell);
        cellRefs[r].push(cell);
      }
    });
    let noiseBuf = null;
    const getNoise = (c) => {
      if (!noiseBuf) {
        noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return noiseBuf;
    };
    let timer = null, step = 0, nextTime = 0, playing = false;
    const mark = (s) => {
      cellRefs.forEach((row) => row.forEach((cell, i) => {
        cell.style.outline = i === s ? '2px solid var(--info)' : '';
      }));
    };
    const scheduler = () => {
      const c = T.actx(), nb = getNoise(c);
      const spb = 60 / Math.min(220, Math.max(40, +bpmIn.value || 120)) / 4;
      while (nextTime < c.currentTime + 0.12) {
        const cur = step % STEPS;
        TRACKS.forEach((tr, r) => { if (state[r][cur]) tr.play(c, nextTime, nb); });
        setTimeout(((cc) => () => mark(cc))(cur), Math.max(0, (nextTime - c.currentTime) * 1000));
        nextTime += spb;
        step++;
      }
    };
    const stop = () => {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
      playBtn.textContent = 'Play';
      cellRefs.forEach((row) => row.forEach((cell) => { cell.style.outline = ''; }));
    };
    const playBtn = T.btn('Play', () => {
      if (playing) { stop(); return; }
      T.actx(); playing = true; step = 0; nextTime = T.actx().currentTime + 0.06;
      timer = setInterval(scheduler, 25);
      playBtn.textContent = 'Stop';
    }, true);
    T.onLeave(stop);
    const preset = () => {
      state.forEach((r) => r.fill(false));
      [0, 4, 8, 12].forEach((s) => { state[0][s] = true; });
      [4, 12].forEach((s) => { state[1][s] = true; state[3][s] = true; });
      for (let s = 0; s < 16; s += 2) state[2][s] = true;
      paint();
    };
    const clear = () => { state.forEach((r) => r.fill(false)); paint(); };
    const paint = () => cellRefs.forEach((row, r) => row.forEach((cell, s) => cell.classList.toggle('on', state[r][s])));
    preset();
    root.appendChild(T.field('Tempo (BPM)', bpmIn));
    root.appendChild(grid);
    root.appendChild(T.row(playBtn, T.btn('Pola dasar', preset), T.btn('Bersihkan', clear)));
    root.appendChild(T.el('<p class="hint">Ketuk kotak untuk mengaktifkan/mematikan suara. Semua suara disintesis langsung, tanpa sample.</p>'));
  
}
