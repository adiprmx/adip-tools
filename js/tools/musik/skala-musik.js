import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "skala-musik", "name": "Skala Musik", "cat": "musik", "icon": "🎹", "desc": "Lihat & dengarkan nada-nada dalam tiap skala.", "keywords": "skala,scale,mayor,minor,pentatonik,blues,nada,musik"};

export function render(root) {

    const NADA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const SKALA = [
      ['mayor', 'Mayor', [0, 2, 4, 5, 7, 9, 11], 'Ceria & terang. Skala "bahagia" sejuta lagu pop.'],
      ['minor', 'Minor Natural', [0, 2, 3, 5, 7, 8, 10], 'Galau & sendu. Andalan lagu mellow dan ballad.'],
      ['penta-mayor', 'Pentatonik Mayor', [0, 2, 4, 7, 9], '5 nada, aman dimainkan — susah fals. Favorit solo gitar.'],
      ['penta-minor', 'Pentatonik Minor', [0, 3, 5, 7, 10], '5 nada versi galau. Senjata utama solo rock & blues.'],
      ['blues', 'Blues', [0, 3, 5, 6, 7, 10], 'Pentatonik minor + "blue note". Rasanya nendang.'],
    ];

    const selNada = T.select(NADA.map((n) => [n, n]), 'C');
    const selSkala = T.select(SKALA.map(([v, l]) => [v, l]), 'mayor');
    const box = T.out();

    let timerPutar = null;
    T.onLeave(() => { if (timerPutar) { clearInterval(timerPutar); timerPutar = null; } });

    // midi nada dasar di oktaf 4 (C4 = 60); A4 = 69 → 440 Hz ✔
    const midiDasar = (idx) => 60 + idx;
    const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

    const mainNada = (midi, tunda) => {
      try {
        const c = T.actx();
        const t = c.currentTime + (tunda || 0);
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = freq(midi);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 1);
      } catch (e) { /* abaikan */ }
    };

    const tampil = () => {
      const idxNada = NADA.indexOf(selNada.value);
      const [ , namaSkala, interval, info] = SKALA.find(([v]) => v === selSkala.value);
      const nada2 = interval.map((iv) => ({
        nama: NADA[(idxNada + iv) % 12],
        midi: midiDasar(idxNada) + iv,
        iv,
      }));
      T.show(box, '');
      box.appendChild(T.el('<p class="big center" style="font-size:20px">Skala ' + T.esc(selNada.value) + ' ' + T.esc(namaSkala) + '</p>'));
      box.appendChild(T.el('<p class="hint center">' + T.esc(info) + '</p>'));
      const grid = T.el('<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px;margin-top:12px"></div>');
      nada2.forEach((n, i) => {
        const b = T.el(
          '<button type="button" class="btn" style="padding:12px 4px;text-align:center">' +
          '<div style="font-size:18px;font-weight:700">' + T.esc(n.nama) + '</div>' +
          '<div class="mut" style="font-size:11px;margin-top:2px">nada ' + (i + 1) + '</div></button>');
        b.addEventListener('click', () => { mainNada(n.midi); });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      box.appendChild(T.el('<p class="hint center" style="margin-top:10px">Rumus interval: ' + interval.join(' – ') + ' semiton dari nada dasar.</p>'));
      const bar = T.el('<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center"></div>');
      bar.appendChild(T.btn('▶️ Putar Skala', () => {
        if (timerPutar) { clearInterval(timerPutar); timerPutar = null; }
        nada2.forEach((n, i) => mainNada(n.midi, i * 0.55));
      }, true));
      bar.appendChild(T.copyBtn(() => 'Skala ' + selNada.value + ' ' + namaSkala + ': ' + nada2.map((n) => n.nama).join(' – '), '📋 Salin Nada'));
      box.appendChild(bar);
    };

    selNada.addEventListener('change', tampil);
    selSkala.addEventListener('change', tampil);
    root.appendChild(T.grid2(
      T.field('Nada dasar', selNada),
      T.field('Jenis skala', selSkala)
    ));
    root.appendChild(box);
    tampil();

}
