import { h as T, utils } from '../../core.js?v=6.12.2';

export const meta = {"id": "piano", "name": "Piano Browser", "cat": "musik", "icon": "🎹", "desc": "Main piano di browser.", "keywords": "piano,main,musik"};
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
    // Peta tuts -> huruf keyboard fisik (dipakai peta keyboard di bawah + label tuts).
    const KEY_LETTER = { 60: 'A', 61: 'W', 62: 'S', 63: 'E', 64: 'D', 65: 'F', 66: 'T', 67: 'G', 68: 'Y', 69: 'H', 70: 'U', 71: 'J', 72: 'K', 73: 'O', 74: 'L', 75: 'P', 76: ';' };
    const noteName = (midi) => NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
    // Nama tuts untuk screen reader: "C#" dibaca "C kres" (istilah Indonesia).
    const ariaName = (midi) => 'Tuts ' + noteName(midi).replace('#', ' kres ');
    const pressKey = (midi, key) => {
      playNote(midi);
      key.style.transform = 'scale(.95)';
      setTimeout(() => { key.style.transform = ''; }, 120);
    };
    for (let midi = 60; midi <= 83; midi++) { // C4 – B5
      const pc = midi % 12;
      const isBlack = BLACK.has(pc);
      const letter = KEY_LETTER[midi] || '';
      const label = isBlack
        ? '<span style="display:flex;flex-direction:column;align-items:center;line-height:1.3"><span style="font-size:10px">' + noteName(midi) + '</span>' + (letter ? '<span style="font-size:9px;font-weight:600;opacity:.6">' + letter + '</span>' : '') + '</span>'
        : '<span style="display:flex;flex-direction:column;align-items:center;line-height:1.35"><span>' + noteName(midi) + '</span>' + (letter ? '<span style="font-size:10px;font-weight:600;opacity:.65">' + letter + '</span>' : '') + '</span>';
      const key = T.el('<button type="button" class="pkey' + (isBlack ? ' black' : '') + '" style="font-family:inherit" aria-label="' + ariaName(midi) + (letter ? ', tombol keyboard ' + (letter === ';' ? 'titik koma' : letter) : '') + '">' + label + '</button>');
      key.addEventListener('pointerdown', (e) => { e.preventDefault(); pressKey(midi, key); });
      // Klik keyboard (Enter/Spasi) punya detail 0; klik mouse sudah
      // ditangani pointerdown di atas, jadi jangan bunyikan dua kali.
      key.addEventListener('click', (e) => { if (e.detail === 0) pressKey(midi, key); });
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
    root.appendChild(T.el('<p class="hint">Ketuk tutsnya, atau pakai keyboard: A W S E D F T G Y H U J K (oktaf bawah)… Tuts juga bisa dipilih pakai Tab, lalu dibunyikan dengan Enter atau Spasi.</p>'));
  
}
