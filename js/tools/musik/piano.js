import { h as T, utils } from '../../core.js?v=5.0.1';

export const meta = {"id": "piano", "name": "Piano Browser", "cat": "musik", "icon": "🎹", "desc": "Main piano di browser."};

export function render(root) {

    const wrap = T.el('<div class="piano"></div>');
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const BLACK = new Set([1, 3, 6, 8, 10]);
    const playNote = (midi) => {
      try {
        const c = T.actx();
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        const t = c.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 1.2);
      } catch (e) { /* abaikan */ }
    };
    for (let midi = 60; midi <= 83; midi++) { // C4 – B5
      const pc = midi % 12;
      const isBlack = BLACK.has(pc);
      const key = T.el('<div class="pkey' + (isBlack ? ' black' : '') + '">' + (isBlack ? '' : NAMES[pc] + Math.floor(midi / 12) - 1) + '</div>');
      key.addEventListener('pointerdown', (e) => { e.preventDefault(); playNote(midi); key.style.transform = 'scale(.95)'; setTimeout(() => { key.style.transform = ''; }, 120); });
      wrap.appendChild(key);
    }
    // peta keyboard fisik (opsional)
    const kb = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ';': 76 };
    const onKey = (e) => {
      if (e.repeat || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const m = kb[e.key.toLowerCase()];
      if (m != null) playNote(m);
    };
    document.addEventListener('keydown', onKey);
    T.onLeave(() => document.removeEventListener('keydown', onKey));
    root.appendChild(wrap);
    root.appendChild(T.el('<p class="hint">Ketuk tutsnya, atau pakai keyboard: A W S E D F T G Y H U J K (oktaf bawah)…</p>'));
  
}
