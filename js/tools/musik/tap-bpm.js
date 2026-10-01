import { h as T, utils } from '../../core.js?v=6.4.0';

export const meta = {"id": "tap-bpm", "name": "Tap BPM", "cat": "musik", "icon": "👆", "desc": "Ketuk layar untuk deteksi tempo.", "keywords": "bpm,tempo,ketuk,dj"};
export function render(root) {

    const zone = T.el('<div class="tapzone">Ketuk di sini mengikuti beat</div>');
    const box = T.out();
    let taps = [];
    const labelTempo = (bpm) => {
      if (bpm < 40) return 'Sangat lambat';
      if (bpm < 60) return 'Largo: lambat & lebar';
      if (bpm < 66) return 'Larghetto: agak lambat';
      if (bpm < 76) return 'Adagio: tenang';
      if (bpm < 108) return 'Andante: seperti langkah kaki';
      if (bpm < 120) return 'Moderato: sedang';
      if (bpm < 156) return 'Allegro: cepat & ceria';
      if (bpm < 168) return 'Vivace: hidup';
      if (bpm < 200) return 'Presto: sangat cepat';
      return 'Prestissimo: secepat mungkin';
    };
    const render = () => {
      if (taps.length < 2) { T.show(box, '<p class="center mut">Ketuk minimal 2 kali untuk mulai mengukur.</p>'); return; }
      const iv = [];
      for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
      const avg = iv.reduce((a, b) => a + b, 0) / iv.length;
      const bpm = Math.round(60000 / avg);
      T.show(box,
        '<div class="big center">' + bpm + ' <span class="mut" style="font-size:15px">BPM</span></div>' +
        '<p class="center">' + T.esc(labelTempo(bpm)) + '</p>' +
        '<p class="center hint">' + taps.length + ' ketukan dihitung</p>');
    };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
      taps.push(now);
      if (taps.length > 16) taps.shift();
      T.beep(660, 0.06, 'square');
      render();
    });
    root.appendChild(zone);
    root.appendChild(T.row(T.btn('Reset', () => { taps = []; render(); })));
    root.appendChild(box);
    render();
  
}
