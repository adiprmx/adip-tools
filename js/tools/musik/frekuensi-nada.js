import { h as T, utils, beep, actx, onLeave, kvRows, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "frekuensi-nada", "name": "Frekuensi Nada", "cat": "musik", "icon": "🎵", "desc": "Hitung frekuensi Hz dari nama nada + dengarkan.", "keywords": "frekuensi,nada,hz,audio,tuning,musik,oktaf,440"};

export function render(root) {
    const OFFSET = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
    const NAMA = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // --- audio: oscillator manual, dibersihkan via onLeave ---
    let osc = null, gainN = null;
    const hentikan = () => {
      try { if (osc) { osc.stop(); osc.disconnect(); gainN.disconnect(); } } catch (e) { /* sudah berhenti */ }
      osc = null; gainN = null;
    };
    onLeave(hentikan);

    const midiKeHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const fmtHz = (f) => {
      let s = f.toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
      const p = s.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return p.join(',') + ' Hz';
    };

    const inp = T.input('text', 'Contoh: A4, C#5, Bb3', 'A4');
    const out = T.out();

    const parse = (txt) => {
      const m = /^\s*([a-gA-G])\s*([#b\u266f\u266d]?)\s*(-?\d+)\s*$/.exec(txt || '');
      if (!m) return null;
      const aks = m[2];
      let semi = OFFSET[m[1].toLowerCase()];
      if (aks === '#' || aks === '\u266f') semi += 1;
      else if (aks === 'b' || aks === '\u266d') semi -= 1;
      const okt = parseInt(m[3], 10);
      if (!Number.isFinite(okt) || okt < -1 || okt > 9) return null;
      return { midi: (okt + 1) * 12 + semi, label: m[1].toUpperCase() + aks + okt };
    };

    const hitung = () => {
      const p = parse(inp.value);
      if (!p) {
        T.show(out, errBox('Format nada tidak dikenali. Contoh valid: A4, C#5, Bb3, F2.'));
        return;
      }
      const hz = midiKeHz(p.midi);
      const dgr = T.btn('🔊 Dengarkan', () => {
        hentikan();
        try {
          const c = actx(), t = c.currentTime;
          osc = c.createOscillator(); gainN = c.createGain();
          osc.type = 'sine'; osc.frequency.value = hz;
          gainN.gain.setValueAtTime(0.0001, t);
          gainN.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
          gainN.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
          osc.connect(gainN); gainN.connect(c.destination);
          osc.start(t); osc.stop(t + 1.3);
          osc.onended = () => { osc = null; gainN = null; };
        } catch (e) { /* audio tidak tersedia */ }
      }, true);
      T.show(out,
        kvRows([
          ['Nada', p.label],
          ['Nomor MIDI', String(p.midi)],
          ['Frekuensi', fmtHz(hz)],
        ]) +
        '<div style="margin-top:10px"></div>' +
        '<div class="hint" style="margin-top:8px">Rumus: 440 × 2<sup>(midi−69)/12</sup>, A4 = 440 Hz sebagai acuan standar.</div>');
      const slot = out.querySelector('div[style^="margin-top:10px"]');
      if (slot) slot.appendChild(dgr);
      else out.appendChild(dgr);
    };

    inp.addEventListener('input', hitung);
    root.appendChild(T.field('Nama nada', inp, 'Huruf A–G + kres (#) atau mol (b) + oktaf'));
    root.appendChild(out);

    // Tabel referensi oktaf 4 (C4–B4)
    const rows = NAMA.map((n, i) => {
      const midi = 60 + i;
      return [n + '4', fmtHz(midiKeHz(midi))];
    });
    root.appendChild(T.el('<div style="margin-top:14px;font-size:13px;opacity:.7">Referensi oktaf 4:</div>'));
    const ref = T.out();
    T.show(ref, kvRows(rows));
    root.appendChild(ref);

    hitung();
}
