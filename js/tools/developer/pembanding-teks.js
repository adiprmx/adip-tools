import { h as T, utils, errBox, beep, actx, onLeave } from '../../core.js';

export const meta = {"id": "pembanding-teks", "name": "Pembanding Teks & Kode", "cat": "developer", "icon": "🔀", "desc": "Bandingkan dua teks baris per baris, lihat bedanya.", "keywords": "diff,teks,bandingkan,perbandingan,kode,cepat"};

// Diff baris-per-baris ala LCS. Tiap item: {t:'='|'-'|'+', x:teks}
// '=' sama di kedua, '-' hanya di teks A, '+' hanya di teks B.
// diffLines kanonis tinggal di utils (core.js).

// Batas diff (pola banding-file.js): diff LCS O(n×m) tanpa batas bisa
// membekukan tab — 10.000×10.000 baris = tabel 190,8 MB. Tolak bila salah
// satu sisi > 2.000 baris atau > 200 KB. Mengembalikan pesan penolakan
// jujur, atau null bila kedua sisi masih dalam batas.
export const BATAS_BARIS_DIFF = 2000;
export const BATAS_BYTE_DIFF = 200000;
export function cekBatasDiff(a, b) {
  const barisA = String(a).split('\n').length, barisB = String(b).split('\n').length;
  if (barisA > BATAS_BARIS_DIFF || barisB > BATAS_BARIS_DIFF) return 'Teks terlalu panjang untuk dibandingkan baris per baris (lebih dari ' + BATAS_BARIS_DIFF + ' baris di salah satu sisi). Potong dulu teksnya, atau bandingkan per bagian.';
  if (String(a).length > BATAS_BYTE_DIFF || String(b).length > BATAS_BYTE_DIFF) return 'Teks terlalu besar untuk dibandingkan (lebih dari 200 KB di salah satu sisi). Potong dulu teksnya, atau bandingkan per bagian.';
  return null;
}

export function render(root) {
  const taA = T.ta(8, 'Tempel teks pertama di sini…', '');
  const taB = T.ta(8, 'Tempel teks kedua di sini…', '');
  const box = T.out();

  function bandingkan() {
    if (!taA.value && !taB.value) { T.show(box, '<div class="hint">Kedua teks kosong.</div>'); return; }
    const batas = cekBatasDiff(taA.value, taB.value);
    if (batas) { T.show(box, errBox(batas)); return; }
    const diff = utils.diffLines(taA.value, taB.value);
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
    const batas = cekBatasDiff(taA.value, taB.value);
    if (batas) { T.show(box, errBox(batas)); return ''; }
    const diff = utils.diffLines(taA.value, taB.value);
    return diff.map((d) => (d.t === '=' ? ' ' : d.t) + ' ' + d.x).join('\n');
  }, 'Salin hasil');

  root.append(
    T.el('<p class="dim" style="font-size:13px">Tempel dua versi teks (atau potongan kode), lihat baris mana yang sama, dihapus, atau ditambah. Maksimal 2.000 baris per sisi.</p>'),
    T.grid2(T.field('Teks A (lama)', taA), T.field('Teks B (baru)', taB)),
    T.row(bGo, bTukar, bSalin),
    box
  );
}
