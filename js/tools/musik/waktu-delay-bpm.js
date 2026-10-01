import { h as T } from '../../core.js?v=6.7.0';

export const meta = {"id": "waktu-delay-bpm", "name": "Delay/Reverb Time dari BPM", "cat": "musik", "icon": "🎛️", "desc": "Waktu delay & reverb yang nempel sama BPM.", "keywords": "delay,reverb,bpm,waktu,ms,daw,tempo,musik,echo"};

const ROWS = [
  ['1/2', 2],
  ['1/4', 1],
  ['1/8 dot', 0.75],
  ['1/8', 0.5],
  ['1/8 trip', 2 / 3],
  ['1/16', 0.25],
  ['1/32', 0.125],
];

export function render(root) {
  const bpmI = T.input('number', 'cth: 120', '120');
  bpmI.inputMode = 'decimal';
  bpmI.min = '1';
  const box = T.out();

  const hitung = () => {
    const bpm = T.num(bpmI.value);
    if (!(bpm > 0) || bpm > 999) { T.show(box, '<p class="center mut">Isi BPM yang valid dulu ya (1–999).</p>'); return; }
    const beat = 60000 / bpm;
    const rows = ROWS.map(([label, mul]) => {
      const ms = (beat * mul).toFixed(1);
      return '<tr class="drow" data-ms="' + ms + '">' +
        '<td style="padding:9px 8px;color:#c9bda9;border-bottom:1px solid #251f18">' + label + '</td>' +
        '<td class="mono" style="padding:9px 8px;text-align:right;border-bottom:1px solid #251f18"><b>' + ms + ' ms</b></td></tr>';
    }).join('');
    T.show(box,
      '<p class="center mut">1 ketuk = <b>' + beat.toFixed(1) + ' ms</b> @ ' + T.esc(String(bpm).replace(/\.0+$/, '')) + ' BPM</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px">' + rows + '</table>' +
      '<p class="hint center">Ketuk salah satu nilai buat menyalin angkanya.</p>');
    box.querySelectorAll('.drow').forEach((tr) => {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => T.copy(tr.dataset.ms + ' ms'));
    });
  };

  bpmI.addEventListener('input', hitung);
  root.appendChild(T.field('Tempo (BPM)', bpmI, 'Buat setting delay / reverb / echo di DAW biar nempel sama beat lagu.'));
  root.appendChild(box);
  hitung();
}
