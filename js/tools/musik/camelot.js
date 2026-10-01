import { h as T, utils, U, _NI, _normAcc, kv } from '../../core.js?v=6.1.1';

const _MIN = { 1: 'Ab', 2: 'Eb', 3: 'Bb', 4: 'F', 5: 'C', 6: 'G', 7: 'D', 8: 'A', 9: 'E', 10: 'B', 11: 'F#', 12: 'Db' };

const _MAJ = { 1: 'B', 2: 'F#', 3: 'Db', 4: 'Ab', 5: 'Eb', 6: 'Bb', 7: 'F', 8: 'C', 9: 'G', 10: 'D', 11: 'A', 12: 'E' };

const _minByPc = {}, _majByPc = {};

U.camelotToKey = (code) => {
    const m = /^\s*(\d{1,2})\s*([ABab])\s*$/.exec(String(code));
    if (!m) return null;
    const n = +m[1];
    if (n < 1 || n > 12) return null;
    const isA = m[2].toUpperCase() === 'A';
    return (isA ? _MIN[n] : _MAJ[n]) + (isA ? ' minor' : ' major');
  };

U.keyToCamelot = (key) => {
    const m = /^\s*([A-Ga-g])([#b♯♭]?)\s*(minor|min|major|maj|m|M)?\s*$/.exec(String(key));
    if (!m) return null;
    const pc = _NI[m[1].toUpperCase() + _normAcc(m[2])];
    if (pc == null) return null;
    const mode = (m[3] || '').toLowerCase();
    const minor = mode === 'minor' || mode === 'min' || mode === 'm';
    const n = minor ? _minByPc[pc] : _majByPc[pc];
    if (n == null) return null;
    return n + (minor ? 'A' : 'B');
  };

export const meta = {"id": "camelot", "name": "Camelot Wheel", "cat": "musik", "icon": "🎧", "desc": "Kunci lagu untuk DJ mixing.", "keywords": "camelot,dj,kunci,mix"};
export function render(root) {

    const MIN = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db'];
    const MAJ = ['B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E'];
    const box = T.out();
    // bangun SVG roda: ring luar = major (B), ring dalam = minor (A)
    const seg = (cx, cy, r1, r2, a0, a1) => {
      const p = (r, a) => { const rad = (a - 90) * Math.PI / 180; return (cx + r * Math.cos(rad)).toFixed(1) + ' ' + (cy + r * Math.sin(rad)).toFixed(1); };
      return 'M' + p(r2, a0) + 'L' + p(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + p(r1, a1) + 'L' + p(r2, a1) + 'A' + r2 + ' ' + r2 + ' 0 0 0 ' + p(r2, a0) + 'Z';
    };
    const label = (cx, cy, r, a, txt, code) => {
      const rad = (a - 90) * Math.PI / 180;
      const x = (cx + r * Math.cos(rad)).toFixed(1), y = (cy + r * Math.sin(rad)).toFixed(1);
      return '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="700" fill="#fafafa" data-code="' + code + '" style="cursor:pointer">' + txt + '</text>';
    };
    let svg = '<svg class="wheel" viewBox="0 0 220 220" style="width:min(78vw,260px);height:auto">';
    const cx = 110, cy = 110;
    for (let n = 1; n <= 12; n++) {
      const a0 = (n - 1) * 30, a1 = n * 30, am = (a0 + a1) / 2;
      const codeB = n + 'B', codeA = n + 'A';
      svg += '<path d="' + seg(cx, cy, 62, 104, a0, a1) + '" fill="' + (n % 2 ? '#1c1c20' : '#232328') + '" stroke="#000" stroke-width="1" data-code="' + codeB + '" style="cursor:pointer"/>';
      svg += '<path d="' + seg(cx, cy, 22, 60, a0, a1) + '" fill="' + (n % 2 ? '#26262c' : '#1a1a1e') + '" stroke="#000" stroke-width="1" data-code="' + codeA + '" style="cursor:pointer"/>';
      svg += label(cx, cy, 83, am, codeB, codeB);
      svg += label(cx, cy, 41, am, codeA, codeA);
    }
    svg += '</svg>';
    const wheel = T.el(svg);
    let selected = null;
    const showKey = (code) => {
      selected = code;
      wheel.querySelectorAll('path').forEach((p) => { p.setAttribute('stroke', '#000'); p.setAttribute('stroke-width', '1'); });
      wheel.querySelectorAll('path[data-code="' + code + '"]').forEach((p) => { p.setAttribute('stroke', '#fff'); p.setAttribute('stroke-width', '2.5'); });
      const n = parseInt(code, 10), L = code.slice(-1);
      const other = n + (L === 'A' ? 'B' : 'A');
      const prev = (n === 1 ? 12 : n - 1) + L, next = (n === 12 ? 1 : n + 1) + L;
      const item = (c) => '<div class="kv"><span class="k">' + T.esc(c) + '</span><span class="v">' + T.esc(U.camelotToKey(c)) + '</span></div>';
      T.show(box,
        '<div class="big center">' + T.esc(code) + ' <span class="mut" style="font-size:15px">' + T.esc(U.camelotToKey(code)) + '</span></div>' +
        '<p class="mut" style="font-size:13px;margin:6px 0 2px">Kunci yang kompatibel (aman di-mix):</p>' +
        item(other) + item(prev) + item(next) +
        '<p class="hint">Aturan Camelot: kunci yang sama angka beda huruf (mis. 8A ↔ 8B), atau angka ±1 huruf sama (8A → 7A / 9A) terdengar mulus saat transisi.</p>');
    };
    wheel.querySelectorAll('[data-code]').forEach((elm) => {
      elm.addEventListener('click', () => showKey(elm.dataset.code));
    });
    // konverter
    const inKey = T.input('text', 'cth: A minor'), inCam = T.input('text', 'cth: 8A');
    const boxC = T.out();
    const conv = () => {
      const a = U.keyToCamelot(inKey.value), b = U.camelotToKey(inCam.value);
      let html = '';
      if (inKey.value.trim()) html += a ? kv('"' + inKey.value.trim() + '" → Camelot', '<b>' + T.esc(a) + '</b>') : '<p class="warn">Kunci "' + T.esc(inKey.value.trim()) + '" tidak dikenali.</p>';
      if (inCam.value.trim()) html += b ? kv('"' + inCam.value.trim() + '" → Kunci', '<b>' + T.esc(b) + '</b>') : '<p class="warn">Kode "' + T.esc(inCam.value.trim()) + '" tidak valid (1A-12B).</p>';
      if (html) T.show(boxC, html); else T.hide(boxC);
    };
    [inKey, inCam].forEach((i) => i.addEventListener('input', conv));
    // peta lengkap
    let mapHtml = '<div class="grid2" style="font-size:13px">';
    for (let n = 1; n <= 12; n++) mapHtml += '<div>' + kv(n + 'A', T.esc(U.camelotToKey(n + 'A'))) + '</div>';
    for (let n = 1; n <= 12; n++) mapHtml += '<div>' + kv(n + 'B', T.esc(U.camelotToKey(n + 'B'))) + '</div>';
    mapHtml += '</div>';
    const det = T.el('<details style="font-size:13px"><summary style="cursor:pointer;color:var(--mut)">Lihat peta 24 kunci</summary><div style="margin-top:8px">' + mapHtml + '</div></details>');
    root.appendChild(T.el('<p class="center mut" style="font-size:13px">Ketuk salah satu kunci di roda</p>'));
    root.appendChild(wheel);
    root.appendChild(box);
    root.appendChild(T.el('<h3 style="font-size:15px;margin-top:4px">Konverter notasi</h3>'));
    root.appendChild(T.grid2(T.field('Nama kunci → Camelot', inKey, 'cth: A minor, C major, F# minor'), T.field('Camelot → nama kunci', inCam, 'cth: 8A, 11B')));
    root.appendChild(boxC);
    root.appendChild(det);
    showKey('8A');
  
}
