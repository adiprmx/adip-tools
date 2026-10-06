import { h as T } from '../../core.js?v=6.9.5';

export const meta = {"id": "diagram-chord", "name": "Diagram Chord Gitar", "cat": "musik", "icon": "🎶", "desc": "Lihat diagram jari chord gitar + dengar bunyinya.", "keywords": "chord,gitar,diagram,jari,kunci,posisi"};
export function render(root) {

    const OPEN_F = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]; // E A D G B e
    const STR_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
    // shape: fret per senar (rendah→tinggi), -1 = mute; fingers: 0 = lepas/bunyi bebas
    const CHORDS = {
      'E':  { shape: [0, 2, 2, 1, 0, 0],   fingers: [0, 2, 3, 1, 0, 0] },
      'Em': { shape: [0, 2, 2, 0, 0, 0],   fingers: [0, 2, 3, 0, 0, 0] },
      'E7': { shape: [0, 2, 0, 1, 0, 0],   fingers: [0, 2, 0, 1, 0, 0] },
      'A':  { shape: [-1, 0, 2, 2, 2, 0],  fingers: [0, 0, 1, 2, 3, 0] },
      'Am': { shape: [-1, 0, 2, 2, 1, 0],  fingers: [0, 0, 2, 3, 1, 0] },
      'A7': { shape: [-1, 0, 2, 0, 2, 0],  fingers: [0, 0, 2, 0, 3, 0] },
      'D':  { shape: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
      'Dm': { shape: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
      'D7': { shape: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 3, 1, 2] },
      'G':  { shape: [3, 2, 0, 0, 0, 3],    fingers: [3, 2, 0, 0, 0, 4] },
      'G7': { shape: [3, 2, 0, 0, 0, 1],   fingers: [3, 2, 0, 0, 0, 1] },
      'C':  { shape: [-1, 3, 2, 0, 1, 0],  fingers: [0, 3, 2, 0, 1, 0] },
      'C7': { shape: [-1, 3, 2, 3, 1, 0],  fingers: [0, 3, 2, 4, 1, 0] },
      'F':  { shape: [1, 3, 3, 2, 1, 1],   fingers: [1, 3, 4, 2, 1, 1] },
      'F7': { shape: [1, 3, 1, 2, 1, 1],   fingers: [1, 3, 1, 2, 1, 1] },
      'Bm': { shape: [-1, 2, 4, 4, 3, 2],  fingers: [0, 1, 3, 4, 2, 1] },
      'B7': { shape: [-1, 2, 1, 2, 0, 2],  fingers: [0, 2, 1, 3, 0, 4] },
    };
    const NAMES = ['E', 'A', 'D', 'G', 'C', 'Am', 'Em', 'Dm', 'F', 'Bm'];
    const NAMES_ALL = Object.keys(CHORDS);

    const sel = T.select(NAMES_ALL.map((c) => [c, c]), 'E');
    const diag = T.el('<div style="max-width:360px;margin:0 auto"></div>');
    const legend = T.el('<div style="font-size:12px;color:#71717a;line-height:1.7" class="center">Nomor jari: 1 = telunjuk · 2 = tengah · 3 = manis · 4 = kelingking<br>○ = senar lepas · ✕ = senar tidak dibunyikan</div>');

    const cell = (inner, extra) => '<div style="height:46px;display:flex;align-items:center;justify-content:center;border-left:1px solid #3f3f46;border-right:1px solid #3f3f46;position:relative;' + (extra || '') + '">' + inner + '</div>';
    const dot = (n) => '<span style="width:30px;height:30px;border-radius:50%;background:#fff;color:#000;font-weight:800;font-size:15px;display:inline-flex;align-items:center;justify-content:center;z-index:1">' + n + '</span>';

    const paint = () => {
      const ch = CHORDS[sel.value];
      let html = '<div style="display:grid;grid-template-columns:26px repeat(6,1fr);margin-top:14px">';
      html += '<div></div>';
      for (let s = 0; s < 6; s++) {
        const fr = ch.shape[s];
        html += cell(fr === -1 ? '<span style="color:#71717a;font-weight:700">✕</span>' : '<span style="color:#e4e4e7;font-size:18px">○</span>', 'height:30px;border-left:none;border-right:none');
      }
      for (let r = 1; r <= 5; r++) {
        html += '<div style="display:flex;align-items:center;justify-content:center;font-size:11px;color:#71717a">' + r + '</div>';
        for (let s = 0; s < 6; s++) {
          const fr = ch.shape[s], fg = ch.fingers[s];
          const top = r === 1 ? 'border-top:4px solid #e4e4e7;' : 'border-top:1px solid #3f3f46;';
          const bot = r === 5 ? 'border-bottom:1px solid #3f3f46;' : '';
          const first = s === 0 ? 'border-left:1px solid #3f3f46;' : '';
          const last = s === 5 ? 'border-right:1px solid #3f3f46;' : '';
          const inner = (fr === r && fg > 0) ? dot(fg) : '';
          html += '<div style="height:46px;display:flex;align-items:center;justify-content:center;position:relative;' + top + bot + first + last + '">' + inner + '</div>';
        }
      }
      html += '<div></div>';
      for (let s = 0; s < 6; s++) {
        html += '<div style="text-align:center;font-size:12px;color:#a1a1aa;padding-top:6px">' + STR_NAMES[s] + '</div>';
      }
      html += '</div>';
      diag.innerHTML = html;
    };

    const bunyiBtn = T.btn('🔊 Bunyi', () => {
      const ch = CHORDS[sel.value];
      let i = 0;
      for (let s = 0; s < 6; s++) {
        const fr = ch.shape[s];
        if (fr < 0) continue;
        const f = OPEN_F[s] * Math.pow(2, fr / 12);
        try { T.beep(f, 0.35, 'triangle', i * 0.16); } catch (e) {}
        i++;
      }
    });

    sel.addEventListener('change', paint);
    paint();
    root.appendChild(T.field('Pilih chord', sel));
    root.appendChild(diag);
    root.appendChild(T.el('<div style="height:10px"></div>'));
    root.appendChild(T.row(bunyiBtn));
    root.appendChild(T.el('<div style="height:10px"></div>'));
    root.appendChild(legend);
    // referensi cepat chord dasar
    const quick = T.el('<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px"></div>');
    NAMES.forEach((c) => {
      const b = T.btn(c, () => { sel.value = c; paint(); });
      quick.appendChild(b);
    });
    root.appendChild(quick);
  
}
