import { h as T, fileInput, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "svgalight", "name": "SVG ke Alight XML", "cat": "desain", "icon": "🎬", "desc": "Konversi SVG jadi project XML Alight Motion.", "keywords": "svg,alight motion,xml,vector,konversi,animasi"};

export function render(root) {

  const MAX_FILE = 2 * 1024 * 1024;

  /* ================= SVG -> path engine ================= */
  const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00', gray: '#808080', grey: '#808080', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', transparent: 'none' };
  function parseColor(s) {
    s = String(s || '').trim().toLowerCase();
    if (!s || s === 'none') return null;
    if (NAMED[s]) return parseColor(NAMED[s]);
    let m = /^#([0-9a-f]{3})$/.exec(s);
    if (m) return '#' + m[1].split('').map((c) => c + c).join('');
    m = /^#([0-9a-f]{6})$/.exec(s);
    if (m) return '#' + m[1];
    m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
    if (m) {
      const r = Math.max(0, Math.min(255, Math.round(+m[1]))), g = Math.max(0, Math.min(255, Math.round(+m[2]))), b = Math.max(0, Math.min(255, Math.round(+m[3]))), a = m[4] == null ? 1 : +m[4];
      return { hex: '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join(''), alpha: a };
    }
    return null;
  }
  function withAlpha(col, alpha) {
    const c = parseColor(col);
    if (!c) return null;
    const hex = typeof c === 'string' ? c : c.hex;
    const a = (typeof c === 'object' ? c.alpha : 1) * alpha;
    const ai = Math.round(Math.max(0, Math.min(1, a)) * 255);
    return '#' + ai.toString(16).padStart(2, '0').toUpperCase() + hex.slice(1).toUpperCase();
  }

  const IDENT = [1, 0, 0, 1, 0, 0];
  function mul(m1, m2) {
    return [
      m1[0] * m2[0] + m1[2] * m2[1], m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3], m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4], m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ];
  }
  const applyM = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

  function parseTransform(str) {
    let m = IDENT.slice();
    const re = /(\w+)\s*\(([^)]*)\)/g;
    let t;
    while ((t = re.exec(str || ''))) {
      const name = t[1], args = t[2].split(/[\s,]+/).filter(Boolean).map(Number);
      let n = IDENT.slice();
      if (name === 'translate') n = [1, 0, 0, 1, args[0] || 0, args[1] || 0];
      else if (name === 'scale') n = [args[0] == null ? 1 : args[0], 0, 0, args[1] == null ? (args[0] == null ? 1 : args[0]) : args[1], 0, 0];
      else if (name === 'rotate') {
        const a = (args[0] || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        n = [c, s, -s, c, 0, 0];
        if (args[1] != null) n = mul([1, 0, 0, 1, args[1], args[2] || 0], mul(n, [1, 0, 0, 1, -args[1], -(args[2] || 0)]));
      }
      else if (name === 'skewX') { const a = (args[0] || 0) * Math.PI / 180; n = [1, 0, Math.tan(a), 1, 0, 0]; }
      else if (name === 'skewY') { const a = (args[0] || 0) * Math.PI / 180; n = [1, Math.tan(a), 0, 1, 0, 0]; }
      else if (name === 'matrix' && args.length >= 6) n = args.slice(0, 6);
      m = mul(m, n);
    }
    return m;
  }

  function ellipsePath(cx, cy, rx, ry) {
    const k = 0.5522847498307936;
    const x1 = cx - rx, x2 = cx + rx, y1 = cy - ry, y2 = cy + ry;
    return 'M' + x1 + ',' + cy +
      'C' + x1 + ',' + (cy - k * ry) + ' ' + (cx - k * rx) + ',' + y1 + ' ' + cx + ',' + y1 +
      'C' + (cx + k * rx) + ',' + y1 + ' ' + x2 + ',' + (cy - k * ry) + ' ' + x2 + ',' + cy +
      'C' + x2 + ',' + (cy + k * ry) + ' ' + (cx + k * rx) + ',' + y2 + ' ' + cx + ',' + y2 +
      'C' + (cx - k * rx) + ',' + y2 + ' ' + x1 + ',' + (cy + k * ry) + ' ' + x1 + ',' + cy + 'Z';
  }

  function arcToCubics(x1, y1, rx, ry, rot, large, sweep, x2, y2) {
    const rad = (rot || 0) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    let x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
    rx = Math.abs(rx); ry = Math.abs(ry);
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let f = num / den;
    f = f < 0 ? 0 : Math.sqrt(f) * (large === sweep ? -1 : 1);
    const cxp = f * rx * y1p / ry, cyp = -f * ry * x1p / rx;
    const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => {
      const d = Math.hypot(ux, uy) * Math.hypot(vx, vy);
      let c = d === 0 ? 1 : (ux * vx + uy * vy) / d;
      c = Math.max(-1, Math.min(1, c));
      const a = Math.acos(c);
      return (ux * vy - uy * vx < 0) ? -a : a;
    };
    let t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && dt > 0) dt -= Math.PI * 2;
    if (sweep && dt < 0) dt += Math.PI * 2;
    const segs = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2)));
    const out = [];
    for (let i = 0; i < segs; i++) {
      const a1 = t1 + (dt * i) / segs, a2 = t1 + (dt * (i + 1)) / segs;
      const k = (4 / 3) * Math.tan((a2 - a1) / 4);
      const p = (a) => [cx + rx * (cos * Math.cos(a) - sin * Math.sin(a)), cy + ry * (sin * Math.cos(a) + cos * Math.sin(a))];
      const d1 = [-rx * (cos * Math.sin(a1) + sin * Math.cos(a1)), -ry * (sin * Math.sin(a1) - cos * Math.cos(a1))];
      const d2 = [-rx * (cos * Math.sin(a2) + sin * Math.cos(a2)), -ry * (sin * Math.sin(a2) - cos * Math.cos(a2))];
      const s0 = p(a1), e0 = p(a2);
      out.push([s0[0] + k * d1[0], s0[1] + k * d1[1], e0[0] - k * d2[0], e0[1] - k * d2[1], e0[0], e0[1]]);
    }
    return out;
  }

  function shapeToD(el) {
    const tag = el.localName.toLowerCase();
    const g = (n, d) => { const v = el.getAttribute(n); return v == null ? d : parseFloat(v) || 0; };
    if (tag === 'path') return el.getAttribute('d') || '';
    if (tag === 'rect') {
      const x = g('x', 0), y = g('y', 0), w = g('width', 0), h = g('height', 0), rx = Math.min(g('rx', g('ry', 0)), w / 2, h / 2), ry = Math.min(g('ry', g('rx', 0)), w / 2, h / 2);
      if (!rx && !ry) return 'M' + x + ',' + y + 'L' + (x + w) + ',' + y + 'L' + (x + w) + ',' + (y + h) + 'L' + x + ',' + (y + h) + 'Z';
      const k = 0.5522847498307936;
      return 'M' + (x + rx) + ',' + y +
        'L' + (x + w - rx) + ',' + y + 'C' + (x + w - rx + k * rx) + ',' + y + ' ' + (x + w) + ',' + (y + ry - k * ry) + ' ' + (x + w) + ',' + (y + ry) +
        'L' + (x + w) + ',' + (y + h - ry) + 'C' + (x + w) + ',' + (y + h - ry + k * ry) + ' ' + (x + w - rx + k * rx) + ',' + (y + h) + ' ' + (x + w - rx) + ',' + (y + h) +
        'L' + (x + rx) + ',' + (y + h) + 'C' + (x + rx - k * rx) + ',' + (y + h) + ' ' + x + ',' + (y + h - ry + k * ry) + ' ' + x + ',' + (y + h - ry) +
        'L' + x + ',' + (y + ry) + 'C' + x + ',' + (y + ry - k * ry) + ' ' + (x + rx - k * rx) + ',' + y + ' ' + (x + rx) + ',' + y + 'Z';
    }
    if (tag === 'circle') return ellipsePath(g('cx', 0), g('cy', 0), g('r', 0), g('r', 0));
    if (tag === 'ellipse') return ellipsePath(g('cx', 0), g('cy', 0), g('rx', 0), g('ry', 0));
    if (tag === 'line') return 'M' + g('x1', 0) + ',' + g('y1', 0) + 'L' + g('x2', 0) + ',' + g('y2', 0);
    if (tag === 'polygon' || tag === 'polyline') {
      const pts = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number);
      if (pts.length < 4) return '';
      let d = 'M' + pts[0] + ',' + pts[1];
      for (let i = 2; i + 1 < pts.length; i += 2) d += 'L' + pts[i] + ',' + pts[i + 1];
      return tag === 'polygon' ? d + 'Z' : d;
    }
    return '';
  }

  // normalisasi path -> hanya M,L,C,Q,Z absolut
  function normalizePath(d) {
    const toks = String(d).match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
    const ARG = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
    const segs = [];
    let i = 0, cmd = null;
    while (i < toks.length) {
      if (/[a-zA-Z]/.test(toks[i])) { cmd = toks[i++]; }
      else if (!cmd) { i++; continue; }
      const up = cmd.toUpperCase();
      const n = ARG[up];
      if (n == null) { i++; continue; }
      if (up === 'Z') { segs.push({ cmd: 'Z', a: [] }); cmd = null; continue; }
      if (i + n > toks.length) break;
      const a = toks.slice(i, i + n).map(Number);
      i += n;
      segs.push({ cmd, a });
      if (up === 'M') cmd = cmd === 'M' ? 'L' : 'l';
    }
    let x = 0, y = 0, sx = 0, sy = 0, pcx = null, pcy = null, pqx = null, pqy = null;
    const out = [];
    const P = (px, py, rel) => rel ? [x + px, y + py] : [px, py];
    for (const s of segs) {
      const rel = s.cmd !== s.cmd.toUpperCase(), c = s.cmd.toUpperCase(), a = s.a;
      if (c === 'M') { const [nx, ny] = P(a[0], a[1], rel); x = nx; y = ny; sx = x; sy = y; out.push('M' + r(x) + ',' + r(y)); pcx = pqx = null; }
      else if (c === 'L') { const [nx, ny] = P(a[0], a[1], rel); x = nx; y = ny; out.push('L' + r(x) + ',' + r(y)); pcx = pqx = null; }
      else if (c === 'H') { const [nx] = [rel ? x + a[0] : a[0]]; x = nx; out.push('L' + r(x) + ',' + r(y)); pcx = pqx = null; }
      else if (c === 'V') { const [ny] = [rel ? y + a[0] : a[0]]; y = ny; out.push('L' + r(x) + ',' + r(y)); pcx = pqx = null; }
      else if (c === 'C') {
        const [x1, y1] = P(a[0], a[1], rel), [x2, y2] = P(a[2], a[3], rel), [nx, ny] = P(a[4], a[5], rel);
        out.push('C' + r(x1) + ',' + r(y1) + ' ' + r(x2) + ',' + r(y2) + ' ' + r(nx) + ',' + r(ny));
        pcx = x2; pcy = y2; pqx = null; x = nx; y = ny;
      }
      else if (c === 'S') {
        const x1 = pcx == null ? x : 2 * x - pcx, y1 = pcy == null ? y : 2 * y - pcy;
        const [x2, y2] = P(a[0], a[1], rel), [nx, ny] = P(a[2], a[3], rel);
        out.push('C' + r(x1) + ',' + r(y1) + ' ' + r(x2) + ',' + r(y2) + ' ' + r(nx) + ',' + r(ny));
        pcx = x2; pcy = y2; pqx = null; x = nx; y = ny;
      }
      else if (c === 'Q') {
        const [x1, y1] = P(a[0], a[1], rel), [nx, ny] = P(a[2], a[3], rel);
        out.push('Q' + r(x1) + ',' + r(y1) + ' ' + r(nx) + ',' + r(ny));
        pqx = x1; pqy = y1; pcx = null; x = nx; y = ny;
      }
      else if (c === 'T') {
        const x1 = pqx == null ? x : 2 * x - pqx, y1 = pqy == null ? y : 2 * y - pqy;
        const [nx, ny] = P(a[0], a[1], rel);
        out.push('Q' + r(x1) + ',' + r(y1) + ' ' + r(nx) + ',' + r(ny));
        pqx = x1; pqy = y1; pcx = null; x = nx; y = ny;
      }
      else if (c === 'A') {
        const [rx, ry, rot, large, sweep, nx0, ny0] = a;
        const [nx, ny] = P(nx0, ny0, rel);
        const cubs = arcToCubics(x, y, rx, ry, rot, large, sweep, nx, ny);
        for (const cu of cubs) out.push('C' + r(cu[0]) + ',' + r(cu[1]) + ' ' + r(cu[2]) + ',' + r(cu[3]) + ' ' + r(cu[4]) + ',' + r(cu[5]));
        pcx = pqx = null; x = nx; y = ny;
      }
      else if (c === 'Z') { out.push('Z'); x = sx; y = sy; pcx = pqx = null; }
    }
    return out.join('');
    function r(n) { return (+n.toFixed(3)).toString(); }
  }

  function transformPath(d, m) {
    const toks = String(d).match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
    const out = [];
    let i = 0;
    while (i < toks.length) {
      const t = toks[i++];
      if (t === 'Z') { out.push('Z'); continue; }
      const cmd = t;
      const take = (n) => { const pts = []; for (let k = 0; k < n; k++) { const [px, py] = applyM(m, +toks[i++], +toks[i++]); pts.push(r6(px) + ',' + r6(py)); } return pts; };
      if (cmd === 'M' || cmd === 'L') out.push(cmd + take(1)[0]);
      else if (cmd === 'C') out.push('C' + take(3).join(' '));
      else if (cmd === 'Q') out.push('Q' + take(2).join(' '));
    }
    return out.join('');
    function r6(n) { return (+n.toFixed(3)).toString(); }
  }

  function pathBBox(d) {
    const nums = String(d).match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
    let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = +nums[i], y = +nums[i + 1];
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x0 > x1) return null;
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  // geser path agar bbox center di (0,0); kembalikan d + center lama
  function centerPath(d, bb) {
    const toks = String(d).match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
    const out = [];
    let i = 0;
    while (i < toks.length) {
      const t = toks[i++];
      if (t === 'Z') { out.push('Z'); continue; }
      const cmd = t;
      const n = cmd === 'M' || cmd === 'L' ? 1 : cmd === 'C' ? 3 : 2;
      const pts = [];
      for (let k = 0; k < n; k++) pts.push(r3(+toks[i++] - bb.cx) + ',' + r3(+toks[i++] - bb.cy));
      out.push(cmd + pts.join(' '));
    }
    return out.join('');
    function r3(n) { return (+n.toFixed(3)).toString(); }
  }

  /* ================= UI ================= */
  const fi = fileInput('.svg,image/svg+xml'); fi.style.margin = '6px 0';
  const modeSel = T.select([
    ['fidelity', 'Maximum Fidelity — struktur & urutan dipertahankan'],
    ['groups', 'Color Groups — shape sewarna digabung per layer'],
    ['cleanup', 'Small Patch Cleanup — buang serpihan kecil'],
  ], 'fidelity');
  const cwInp = T.input('number', 'Otomatis dari SVG', '');
  const chInp = T.input('number', 'Otomatis dari SVG', '');
  const thSel = T.select([['0.05', '0,05%'], ['0.15', '0,15%'], ['0.5', '0,5%'], ['1', '1%'], ['3', '3%']], '0.15');
  const projInp = T.input('text', 'Nama project', 'SVG Import');
  const box = T.out();
  const layerWrap = T.el('<div style="display:grid;gap:6px;margin:12px 0;max-height:260px;overflow:auto"></div>');
  const layerSec = T.el('<div hidden></div>');
  const prevTa = T.ta(10, 'Preview XML…', '');
  prevTa.style.fontFamily = 'monospace'; prevTa.style.fontSize = '11px'; prevTa.readOnly = true;
  const prevSec = T.el('<div hidden></div>');
  const noteBox = T.out();

  let shapes = []; // {label, d, paint:{kind:'color',argb}|{kind:'gradient',...}, bbox, tag}
  let svgW = 1080, svgH = 1080, fileBase = 'svg-alight';

  const escXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function collectShapes(svgDoc) {
    const out = [], notes = [];
    const grads = {};
    svgDoc.querySelectorAll('linearGradient').forEach((g) => {
      const id = g.getAttribute('id');
      if (id) grads['#' + id] = g;
    });
    const DRAW = ['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline'];
    let skipped = 0;
    const walk = (node, mat, paint, op) => {
      if (node.nodeType !== 1) return;
      const tag = node.localName.toLowerCase();
      if (node.getAttribute('display') === 'none') return;
      const nm = mul(mat, parseTransform(node.getAttribute('transform')));
      let nop = op;
      const oA = node.getAttribute('opacity');
      if (oA != null) nop *= Math.max(0, Math.min(1, parseFloat(oA) || 0));
      const np = Object.assign({}, paint);
      ['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width'].forEach((k) => {
        const v = node.getAttribute(k);
        if (v != null) np[k] = v;
      });
      if (tag === 'use') {
        const href = node.getAttribute('href') || node.getAttribute('xlink:href');
        const ref = href && href[0] === '#' ? svgDoc.getElementById(href.slice(1)) : null;
        if (ref) {
          const um = mul(nm, [1, 0, 0, 1, parseFloat(node.getAttribute('x')) || 0, parseFloat(node.getAttribute('y')) || 0]);
          walk(ref, um, np, nop);
        }
        return;
      }
      if (DRAW.includes(tag)) {
        try {
          let d = shapeToD(node);
          if (!d) { skipped++; return; }
          d = normalizePath(d);
          if (!d) { skipped++; return; }
          d = transformPath(d, nm);
          const bb = pathBBox(d);
          if (!bb || bb.w <= 0 || bb.h <= 0) { skipped++; return; }
          // paint final
          let fill = np['fill'] == null ? '#000000' : np['fill'];
          let fillOp = np['fill-opacity'] == null ? 1 : Math.max(0, Math.min(1, parseFloat(np['fill-opacity'])));
          let pkind = null, parg = null, gnote = null;
          const gradRef = /^url\(#([^)]+)\)$/.exec(String(fill).trim());
          if (gradRef && grads['#' + gradRef[1]]) {
            const g = grads['#' + gradRef[1]];
            const stops = [...g.querySelectorAll('stop')].map((s) => ({
              o: parseFloat(s.getAttribute('offset') || '0'),
              c: s.getAttribute('stop-color') || '#000000',
              so: s.getAttribute('stop-opacity') == null ? 1 : parseFloat(s.getAttribute('stop-opacity')),
            })).sort((a, b) => a.o - b.o);
            if (stops.length >= 2) {
              const gu = (g.getAttribute('gradientUnits') || 'objectBoundingBox');
              let sx = parseFloat(g.getAttribute('x1') == null ? 0 : g.getAttribute('x1')),
                sy = parseFloat(g.getAttribute('y1') == null ? 0 : g.getAttribute('y1')),
                ex = parseFloat(g.getAttribute('x2') == null ? 1 : g.getAttribute('x2')),
                ey = parseFloat(g.getAttribute('y2') == null ? 0 : g.getAttribute('y2'));
              if (gu !== 'objectBoundingBox' && bb.w > 0 && bb.h > 0) {
                sx = (sx - bb.x0) / bb.w; sy = (sy - bb.y0) / bb.h;
                ex = (ex - bb.x0) / bb.w; ey = (ey - bb.y0) / bb.h;
              }
              pkind = 'gradient';
              parg = {
                start: withAlpha(stops[0].c, stops[0].so * nop),
                end: withAlpha(stops[stops.length - 1].c, stops[stops.length - 1].so * nop),
                sxy: sx.toFixed(6) + ',' + sy.toFixed(6), exy: ex.toFixed(6) + ',' + ey.toFixed(6),
              };
              gnote = 'gradien disederhanakan ke 2 warna';
            }
          }
          if (!pkind) {
            if (String(fill).trim().toLowerCase() === 'none') {
              const st = np['stroke'];
              if (st && String(st).trim().toLowerCase() !== 'none') {
                const so = np['stroke-opacity'] == null ? 1 : Math.max(0, Math.min(1, parseFloat(np['stroke-opacity'])));
                pkind = 'color'; parg = withAlpha(st, so * nop);
                gnote = 'stroke digambar sebagai fill (ketebalan tidak dipertahankan)';
              } else { skipped++; return; }
            } else {
              pkind = 'color'; parg = withAlpha(fill, fillOp * nop);
            }
          }
          if (!parg) { skipped++; return; }
          out.push({ label: tag + ' ' + (out.length + 1), d, paint: { kind: pkind, arg: parg }, bbox: bb, gnote, tag });
        } catch (e) { skipped++; }
        return;
      }
      if (tag === 'g' || tag === 'svg' || tag === 'a' || tag === 'symbol' || tag === 'defs') {
        // defs: jangan walk isi (sudah di-cache sbg gradient)
        if (tag !== 'defs') [...node.children].forEach((c) => walk(c, nm, np, nop));
        return;
      }
      if (['text', 'image', 'foreignobject', 'filter', 'mask', 'clippath'].includes(tag)) { skipped++; return; }
      [...node.children].forEach((c) => walk(c, nm, np, nop));
    };
    const rootEl = svgDoc.documentElement;
    walk(rootEl, IDENT.slice(), {}, 1);
    if (skipped) notes.push(skipped + ' elemen tidak didukung dan dilewati (teks, gambar, filter, dsb).');
    return { list: out, notes };
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    if (f.size > MAX_FILE) { fi.value = ''; T.show(box, errBox('File terlalu besar. Maksimal 2 MB.')); return; }
    T.show(box, '<span class="dim">Menganalisis SVG…</span>');
    try {
      const text = await f.text();
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (doc.querySelector('parsererror') || !/^svg$/i.test(doc.documentElement.localName)) {
        T.show(box, errBox('File bukan SVG yang valid.')); return;
      }
      const vb = (doc.documentElement.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      const wA = parseFloat(doc.documentElement.getAttribute('width')), hA = parseFloat(doc.documentElement.getAttribute('height'));
      if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { svgW = vb[2]; svgH = vb[3]; }
      else if (wA > 0 && hA > 0) { svgW = wA; svgH = hA; }
      else { svgW = 1080; svgH = 1080; }
      fileBase = f.name.replace(/\.svg$/i, '') || 'svg-alight';
      const { list, notes } = collectShapes(doc);
      shapes = list;
      if (!shapes.length) { T.show(box, errBox('Tidak ada shape yang bisa dikonversi di SVG ini.')); return; }
      const colors = new Set(shapes.map((s) => s.paint.kind === 'color' ? s.paint.arg : 'gradient')).size;
      T.show(box, '<span class="ok">Ditemukan ' + shapes.length + ' shape · ' + colors + ' paint unik.</span>' +
        (notes.length ? '<div class="dim" style="margin-top:6px;font-size:12px">' + notes.map(T.esc).join('<br>') + '</div>' : ''));
      renderLayerList();
      layerSec.hidden = false;
      bGo.hidden = false;
    } catch (e) { T.show(box, errBox('Gagal membaca SVG: ' + e.message)); }
  });

  function renderLayerList() {
    layerWrap.innerHTML = '';
    shapes.forEach((s, i) => {
      const row = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:13px;cursor:pointer;border:1px solid #ffffff14;border-radius:8px;padding:8px 10px"></label>');
      const chk = T.el('<input type="checkbox" checked style="width:16px;height:16px;accent-color:#e07856">');
      chk.dataset.i = i;
      const sw = T.el('<span style="width:18px;height:18px;border-radius:5px;border:1px solid #ffffff30;flex-shrink:0"></span>');
      if (s.paint.kind === 'color') sw.style.background = '#' + s.paint.arg.slice(3).toLowerCase();
      else sw.style.background = 'linear-gradient(135deg,#888,#333)';
      row.appendChild(chk); row.appendChild(sw);
      row.appendChild(T.el('<span style="flex:1">' + T.esc(s.label) + (s.gnote ? ' <span class="dim">· ' + T.esc(s.gnote) + '</span>' : '') + '</span>'));
      layerWrap.appendChild(row);
    });
    const allRow = T.el('<div style="display:flex;gap:8px;margin-bottom:8px"></div>');
    const bAll = T.btn('Pilih semua', () => layerWrap.querySelectorAll('input').forEach((c) => { c.checked = true; }));
    const bNone = T.btn('Kosongkan', () => layerWrap.querySelectorAll('input').forEach((c) => { c.checked = false; }));
    bAll.classList.add('small'); bNone.classList.add('small');
    allRow.appendChild(bAll); allRow.appendChild(bNone);
    layerWrap.prepend(allRow);
  }

  const selectedShapes = () => {
    const chks = layerWrap.querySelectorAll('input[type=checkbox]');
    const sel = [];
    chks.forEach((c) => { if (c.checked) sel.push(shapes[+c.dataset.i]); });
    return sel.filter(Boolean);
  };

  const bGo = T.btn('Konversi ke XML', () => {
    const sel = selectedShapes();
    if (!sel.length) { T.show(noteBox, errBox('Pilih minimal 1 layer.')); return; }
    const mode = modeSel.value;
    const W2 = Math.round(+cwInp.value) || Math.round(svgW);
    const H2 = Math.round(+chInp.value) || Math.round(svgH);
    const sx = W2 / svgW, sy = H2 / svgH;
    const T2 = (d) => transformPath(d, [sx, 0, 0, sy, 0, 0]);

    let layers = []; // {label, paths:[{d,paint}], }
    const notes = [];
    if (mode === 'groups') {
      const map = new Map();
      sel.forEach((s) => {
        const key = s.paint.kind === 'color' ? 'c:' + s.paint.arg :
          'g:' + s.paint.arg.start + '>' + s.paint.arg.end;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
      });
      let li = 0;
      for (const [key, arr] of map) {
        // bbox gabungan utk location
        let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18;
        const items = arr.map((s) => {
          const d = T2(s.d); const bb = pathBBox(d);
          if (bb.x0 < x0) x0 = bb.x0; if (bb.y0 < y0) y0 = bb.y0;
          if (bb.x1 > x1) x1 = bb.x1; if (bb.y1 > y1) y1 = bb.y1;
          return { s, d, bb };
        });
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        layers.push({
          label: 'Warna ' + (++li),
          cx, cy,
          paths: items.map(({ s, d, bb }) => ({ d: recenter(d, bb, cx, cy), paint: s.paint })),
        });
      }
      notes.push('Color Groups: ' + sel.length + ' shape → ' + layers.length + ' layer warna (shape tetap terpisah di tiap layer).');
    } else {
      let work = sel.slice();
      if (mode === 'cleanup') {
        const th = +thSel.value / 100;
        let total = 0;
        const areas = work.map((s) => { const d = T2(s.d); const bb = pathBBox(d); const a = bb.w * bb.h; total += a; return { s, d, bb, a }; });
        const kept = areas.filter((x) => x.a >= total * th);
        notes.push('Small Patch Cleanup: ' + (areas.length - kept.length) + ' serpihan kecil dibuang (ambang ' + thSel.value + '%).');
        work = kept.map((x) => x.s);
      }
      layers = work.map((s, i) => {
        const d = T2(s.d); const bb = pathBBox(d);
        return { label: s.label, cx: bb.cx, cy: bb.cy, paths: [{ d: centerPath(d, bb), paint: s.paint }], gnote: s.gnote };
      });
      if (mode === 'cleanup' && !notes.length) notes.push('Tidak ada serpihan yang dibuang.');
    }
    const strokeNotes = sel.filter((s) => s.gnote).length;
    if (strokeNotes) notes.push(strokeNotes + ' shape memakai substitusi paint (lihat daftar layer).');

    let id = 0;
    const body = layers.map((L) => {
      const paths = L.paths.map((p) => {
        let inner = '';
        if (p.paint.kind === 'gradient') inner += '<fillColor value="' + p.paint.arg.start + '"/><gradient type="linear" startColor="' + p.paint.arg.start + '" endColor="' + p.paint.arg.end + '" start="' + p.paint.arg.sxy + '" end="' + p.paint.arg.exy + '"/>';
        else inner += '<fillColor value="' + p.paint.arg + '"/>';
        return inner + '<path d="' + escXml(p.d) + '"/>';
      }).join('');
      return '  <shape id="' + (++id) + '" label="' + escXml(L.label) + '" startTime="0" endTime="5000" fillType="color">' +
        '<transform><location value="' + L.cx.toFixed(6) + ',' + L.cy.toFixed(6) + ',0.000000"/></transform>' + paths + '</shape>';
    }).join('\n');

    const title = (projInp.value.trim() || 'SVG Import').slice(0, 80);
    const xml = '<?xml version=\'1.0\' encoding=\'UTF-8\' ?>\n' +
      '<scene title="' + escXml(title) + '" width="' + W2 + '" height="' + H2 + '" exportWidth="1920" exportHeight="1080" bgcolor="#00000000" totalTime="5000" fps="60" modifiedTime="' + Date.now() + '" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n' +
      '  <bookmark t="0"/>\n' + body + '\n</scene>\n';

    const head = xml.slice(0, 40000), tail = xml.length > 48000 ? xml.slice(-8000) : '';
    prevTa.value = head + (tail ? '\n…\n' + tail : '');
    prevSec.hidden = false;
    T.show(noteBox, (notes.length ? notes.map((n) => '<div style="font-size:13px;margin-bottom:6px">' + T.esc(n) + '</div>').join('') : '') +
      '<div class="kv"><span class="k">Layer</span><span class="v">' + layers.length + '</span></div>' +
      '<div class="kv"><span class="k">Ukuran XML</span><span class="v">' + (new Blob([xml]).size / 1024).toFixed(1) + ' KB</span></div>' +
      '<div class="dim" style="font-size:12px;margin-top:8px">Struktur XML mengikuti format project Alight Motion (scene/shape/path). Impor file XML ini lewat Alight Motion. Hasil visual bisa berbeda untuk SVG kompleks — cek pratinjau di aplikasi.</div>');
    const bDl = T.btn('Unduh XML', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([xml], { type: 'text/xml;charset=utf-8' }));
      a.download = fileBase + '-alight.xml';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, true);
    const old = noteBox.querySelector('[data-dl]');
    if (old) old.remove();
    const wrap = T.el('<div data-dl style="margin-top:10px"></div>');
    wrap.appendChild(bDl);
    noteBox.appendChild(wrap);
    prevSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, true);
  bGo.hidden = true;

  function recenter(d, bb, cx, cy) {
    const toks = String(d).match(/[MLCQZ]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) || [];
    const out = [];
    let i = 0;
    const trim3 = (n) => {
      const s = (+n).toFixed(3);
      return s.indexOf('.') >= 0 ? s.replace(/\.?0+$/, '') : s;
    };
    while (i < toks.length) {
      const t = toks[i++];
      if (t === 'Z') { out.push('Z'); continue; }
      const n = t === 'M' || t === 'L' ? 1 : t === 'C' ? 3 : 2;
      const pts = [];
      for (let k = 0; k < n; k++) pts.push(trim3(+toks[i++] - cx) + ',' + trim3(+toks[i++] - cy));
      out.push(t + pts.join(' '));
    }
    return out.join('');
  }

  const thRow = T.el('<div></div>');
  thRow.appendChild(T.field('Ambang serpihan (mode Cleanup)', thSel));
  modeSel.addEventListener('change', () => { thRow.hidden = modeSel.value !== 'cleanup'; });
  thRow.hidden = true;

  layerSec.appendChild(T.el('<div style="margin-bottom:4px"><b>Pilih layer</b> <span class="dim" style="font-size:12px">(hanya yang dicentang dikonversi)</span></div>'));
  layerSec.appendChild(layerWrap);
  prevSec.appendChild(T.el('<div style="margin:12px 0 4px"><b>Preview XML</b></div>'));
  prevSec.appendChild(prevTa);

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Konversi SVG menjadi project XML siap impor ke Alight Motion — 100% lokal di perangkatmu.</p>'));
  root.appendChild(T.el('<div style="margin-bottom:4px"><b>File SVG</b> <span class="dim" style="font-size:12px">· maks 2 MB</span></div>'));
  root.appendChild(fi);
  root.appendChild(box);
  root.appendChild(layerSec);
  root.appendChild(T.field('Mode konversi', modeSel));
  root.appendChild(thRow);
  root.appendChild(T.grid2(T.field('Lebar canvas (opsional)', cwInp), T.field('Tinggi canvas (opsional)', chInp)));
  root.appendChild(T.field('Nama project', projInp));
  root.appendChild(T.row(bGo));
  root.appendChild(noteBox);
  root.appendChild(prevSec);
}
