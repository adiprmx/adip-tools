import { h as T, utils } from '../../core.js?v=5.2.0';

utils.diffLines = function (a, b) {
    const A = String(a == null ? '' : a).split('\n');
    const B = String(b == null ? '' : b).split('\n');
    const n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ops.push({ t: 'same', line: A[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'del', line: A[i] }); i++; }
      else { ops.push({ t: 'add', line: B[j] }); j++; }
    }
    while (i < n) { ops.push({ t: 'del', line: A[i] }); i++; }
    while (j < m) { ops.push({ t: 'add', line: B[j] }); j++; }
    return ops;
  };

export const meta = {"id": "text-diff", "name": "Pembanding Teks", "cat": "teks", "icon": "🔀", "desc": "Bandingkan dua teks.", "keywords": "diff,banding,teks"};
export function render(root) {

      const taA = T.ta(6, 'Teks pertama (asli)…');
      const taB = T.ta(6, 'Teks kedua (pembanding)…');
      const box = T.out();

      function diff() {
        const ops = utils.diffLines(taA.value, taB.value);
        let add = 0, del = 0, same = 0;
        const html = ops.map((o) => {
          if (o.t === 'add') { add++; return `<div class="diff-add">+ ${T.esc(o.line) || '&nbsp;'}</div>`; }
          if (o.t === 'del') { del++; return `<div class="diff-del">− ${T.esc(o.line) || '&nbsp;'}</div>`; }
          same++;
          return `<div class="diff-same">&nbsp;&nbsp;${T.esc(o.line) || '&nbsp;'}</div>`;
        }).join('');
        T.show(box,
          `<div class="kv"><span>Baris tambah</span><b style="color:#4ade80">${add}</b></div>` +
          `<div class="kv"><span>Baris hapus</span><b style="color:#f87171">${del}</b></div>` +
          `<div class="kv"><span>Baris sama</span><b>${same}</b></div>` +
          `<div class="diffbox">${html || '<div class="hint">Kedua teks kosong.</div>'}</div>`);
      }

      root.appendChild(T.field('Teks pertama', taA));
      root.appendChild(T.field('Teks kedua', taB));
      root.appendChild(T.btn('Bandingkan', diff, true));
      root.appendChild(box);
    
}
