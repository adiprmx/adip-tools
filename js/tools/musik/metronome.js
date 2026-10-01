import { h as T, utils } from '../../core.js?v=5.1.0';

export const meta = {"id": "metronome", "name": "Metronom", "cat": "musik", "icon": "🥁", "desc": "Metronom dengan birama."};

export function render(root) {

    const bpmNum = T.input('number', 'BPM', '120');
    const bpmRange = T.el('<input type="range" class="inp" min="40" max="240" value="120">');
    const birama = T.select([['2/4', '2/4'], ['3/4', '3/4'], ['4/4', '4/4'], ['6/8', '6/8']], '4/4');
    const dots = T.el('<div class="center" style="display:flex;gap:10px;justify-content:center"></div>');
    const box = T.out();
    let timer = null, nextTime = 0, beat = 0, running = false;
    const getBpm = () => Math.min(240, Math.max(40, Math.round(+bpmNum.value) || 120));
    const beatsPerBar = () => +birama.value.split('/')[0];
    const beatDur = () => (birama.value.endsWith('/8') ? (60 / getBpm()) / 2 : 60 / getBpm());
    const paintDots = () => {
      dots.innerHTML = '';
      for (let i = 0; i < beatsPerBar(); i++) {
        const d = T.el('<span style="width:16px;height:16px;border-radius:50%;background:#27272a;display:inline-block;transition:background .05s"></span>');
        d.dataset.i = i;
        dots.appendChild(d);
      }
    };
    const blip = (t, accent) => {
      try {
        const c = T.actx();
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'square';
        o.frequency.value = accent === 2 ? 1200 : accent === 1 ? 900 : 650;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.1);
      } catch (e) { /* abaikan */ }
    };
    const scheduler = () => {
      const c = T.actx();
      while (nextTime < c.currentTime + 0.12) {
        const bpb = beatsPerBar();
        const cur = beat % bpb;
        const acc = cur === 0 ? 2 : (birama.value === '6/8' && cur === 3 ? 1 : 0);
        blip(nextTime, acc);
        const showBeat = cur;
        setTimeout(() => {
          [...dots.children].forEach((d) => { d.style.background = +d.dataset.i === showBeat ? '#fff' : '#27272a'; });
        }, Math.max(0, (nextTime - c.currentTime) * 1000));
        nextTime += beatDur();
        beat++;
      }
    };
    const stop = () => {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      startBtn.textContent = 'Start';
      [...dots.children].forEach((d) => { d.style.background = '#27272a'; });
      T.show(box, '');
    };
    const start = () => {
      const c = T.actx();
      running = true;
      beat = 0;
      nextTime = c.currentTime + 0.06;
      timer = setInterval(scheduler, 25);
      startBtn.textContent = 'Stop';
    };
    const startBtn = T.btn('Start', () => { running ? stop() : start(); }, true);
    T.onLeave(stop);
    const sync = (v) => { bpmNum.value = v; bpmRange.value = v; };
    bpmNum.addEventListener('input', () => sync(getBpm()));
    bpmRange.addEventListener('input', () => sync(bpmRange.value));
    birama.addEventListener('change', paintDots);
    // tap tempo
    let tapTimes = [];
    const tapBtn = T.btn('Tap tempo', () => {
      const now = performance.now();
      if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000) tapTimes = [];
      tapTimes.push(now);
      if (tapTimes.length > 6) tapTimes.shift();
      if (tapTimes.length >= 2) {
        const iv = [];
        for (let i = 1; i < tapTimes.length; i++) iv.push(tapTimes[i] - tapTimes[i - 1]);
        sync(Math.round(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length)));
      }
    });
    root.appendChild(T.grid2(
      T.field('Tempo (BPM)', bpmNum),
      T.field('Birama', birama)
    ));
    root.appendChild(T.field('Geser tempo', bpmRange));
    root.appendChild(dots);
    root.appendChild(T.row(startBtn, tapBtn));
    root.appendChild(box);
    paintDots();
  
}
