import { h as T, utils, beep, actx, onLeave } from '../../core.js?v=6.8.0';

export const meta = {"id": "pembanding-teks", "name": "Pembanding Teks", "cat": "developer", "icon": "🔀", "desc": "Bandingkan dua teks baris per baris, lihat bedanya.", "keywords": "diff,teks,bandingkan,perbandingan,kode"};

// Diff baris-per-baris ala LCS. Tiap item: {t:'='|'-'|'+', x:teks}
// '=' sama di kedua, '-' hanya di teks A, '+' hanya di teks B.
export function diffLines(a, b) {
  const A = String(a).split('\n'), B = String(b).split('\n');
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ t: '=', x: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ t: '-', x: A[i] }); i++; }
    else { out.push({ t: '+', x: B[j] }); j++; }
  }
  while (i < n) out.push({ t: '-', x: A[i++] });
  while (j < m) out.push({ t: '+', x: B[j++] });
  return out;
}

export function render(root) {
  const taA = T.ta(8, 'Tempel teks pertama di sini…', '');
  const taB = T.ta(8, 'Tempel teks kedua di sini…', '');
  const box = T.out();

  function bandingkan() {
    const diff = diffLines(taA.value, taB.value);
    const sama = diff.filter((d) => d.t === '=').length;
    const del = diff.filter((d) => d.t === '-').length;
    const add = diff.filter((d) => d.t === '+').length;
    let html = '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font-size:12.5px">' +
      '<span class="dim">Sama: <b style="color:#fff">' + sama + '</b></span>' +
      '<span style="color:#ef4444">Dihapus: <b>' + del + '</b></span>' +
      '<span style="color:#22c55e">Ditambah: <b>' + add + '</b></span></div>';
    html += '<div style="border:1px solid #ffffff20;border-radius:10px;overflow:hidden;font-family:monospace;font-size:12.5px">';
    diff.forEach((d) => {
      const bg = d.t === '-' ? 'rgba(239,68,68,.12)' : d.t === '+' ? 'rgba(34,197,94,.12)' : 'transparent';
      const mark = d.t === '=' ? ' ' : d.t;
      const col = d.t === '-' ? '#ef4444' : d.t === '+' ? '#22c55e' : '#8a8a93';
      html += '<div style="background:' + bg + ';padding:4px 10px;white-space:pre-wrap;word-break:break-word;border-bottom:1px solid #ffffff10">' +
        '<span style="color:' + col + ';display:inline-block;width:14px">' + mark + '</span>' + T.esc(d.x || ' ') + '</div>';
    });
    html += '</div>';
    T.show(box, html);
  }

  const bGo = T.btn('🔀 Bandingkan', bandingkan, true);
  const bTukar = T.btn('⇄ Tukar', () => { const v = taA.value; taA.value = taB.value; taB.value = v; bandingkan(); });
  const bSalin = T.copyBtn(() => {
    const diff = diffLines(taA.value, taB.value);
    return diff.map((d) => (d.t === '=' ? ' ' : d.t) + ' ' + d.x).join('\n');
  }, 'Salin hasil');

  root.append(
    T.el('<p class="dim" style="font-size:13px">Tempel dua versi teks (atau potongan kode), lihat baris mana yang sama, dihapus, atau ditambah.</p>'),
    T.grid2(T.field('Teks A (lama)', taA), T.field('Teks B (baru)', taB)),
    T.row(bGo, bTukar, bSalin),
    box
  );
}
