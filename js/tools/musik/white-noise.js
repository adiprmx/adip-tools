import { h as T, utils } from '../../core.js?v=6.6.0';

export const meta = {"id": "white-noise", "name": "White Noise", "cat": "musik", "icon": "🌧️", "desc": "Suara fokus & tidur.", "keywords": "noise,tidur,fokus,suara,hujan"};
export function render(root) {

    const jenis = T.select([
      ['hujan', 'Hujan: rintik menenangkan'],
      ['kafe', 'Kafe: dengung ramai yang jauh'],
      ['api', 'Api unggun: hangat + letupan'],
      ['putih', 'White noise: desis datar'],
      ['pink', 'Pink noise: lembut untuk tidur'],
    ], 'hujan');
    const vol = T.el('<input type="range" class="inp" min="0" max="100" value="60">');
    const box = T.out();
    let nodes = null, crackleTimer = null;
    const mkNoise = (c, kind) => {
      const len = c.sampleRate * 2;
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      if (kind === 'brown') {
        let last = 0;
        for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      } else if (kind === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
          b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
      } else {
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      return b;
    };
    const stop = () => {
      if (crackleTimer) { clearInterval(crackleTimer); crackleTimer = null; }
      if (nodes) {
        try { nodes.src.stop(); } catch (e) {}
        try { nodes.master.disconnect(); } catch (e) {}
        nodes = null;
      }
      playBtn.textContent = 'Putar';
      T.hide(box);
    };
    const start = () => {
      stop();
      const c = T.actx();
      const kind = jenis.value;
      const master = c.createGain();
      master.gain.value = (+vol.value / 100) * 0.6;
      master.connect(c.destination);
      const src = c.createBufferSource();
      src.loop = true;
      let label = '';
      if (kind === 'hujan') {
        src.buffer = mkNoise(c, 'white');
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        src.connect(f); f.connect(master); label = 'Hujan';
      } else if (kind === 'kafe') {
        src.buffer = mkNoise(c, 'brown');
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
        src.connect(f); f.connect(master); label = 'Kafe';
      } else if (kind === 'api') {
        src.buffer = mkNoise(c, 'brown');
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
        const g = c.createGain(); g.gain.value = 0.7;
        src.connect(f); f.connect(g); g.connect(master); label = 'Api unggun';
        // letupan acak
        const pop = () => {
          try {
            const t = c.currentTime;
            const o = c.createBufferSource(); o.buffer = mkNoise(c, 'white');
            const bf = c.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 1500 + Math.random() * 2500; bf.Q.value = 2;
            const og = c.createGain();
            og.gain.setValueAtTime(0.25 + Math.random() * 0.3, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.05 + Math.random() * 0.08);
            o.connect(bf); bf.connect(og); og.connect(master);
            o.start(t); o.stop(t + 0.2);
          } catch (e) {}
        };
        crackleTimer = setInterval(() => { if (Math.random() < 0.75) pop(); }, 260);
      } else if (kind === 'putih') {
        src.buffer = mkNoise(c, 'white');
        src.connect(master); label = 'White noise';
      } else {
        src.buffer = mkNoise(c, 'pink');
        src.connect(master); label = 'Pink noise';
      }
      src.start();
      nodes = { src, master };
      playBtn.textContent = 'Stop';
      T.show(box, '<p class="center mut">' + T.esc(label) + ' sedang diputar…</p>');
    };
    const playBtn = T.btn('Putar', () => { nodes ? stop() : start(); }, true);
    vol.addEventListener('input', () => { if (nodes) nodes.master.gain.value = (+vol.value / 100) * 0.6; });
    jenis.addEventListener('change', () => { if (nodes) start(); });
    T.onLeave(stop);
    root.appendChild(T.field('Jenis suara', jenis));
    root.appendChild(T.field('Volume', vol));
    root.appendChild(T.row(playBtn));
    root.appendChild(box);
    root.appendChild(T.el('<p class="hint">Cocok untuk fokus kerja, menenangkan bayi, atau pengantar tidur. Matikan tab/keluar halaman untuk berhenti total.</p>'));
  
}
