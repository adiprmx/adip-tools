import { h as T, fileInput, errBox } from '../../core.js?v=6.9.20';

export const meta = {"id": "svgalight", "name": "SVG ke Alight XML", "cat": "desain", "icon": "🎬", "desc": "Konversi SVG jadi project XML Alight Motion.", "keywords": "svg,alight motion,xml,vector,konversi,animasi"};

/* ================= SVG -> path engine (tanpa DOM kecuali parse) ================= */
const NAMED = { black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00', gray: '#808080', grey: '#808080', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', transparent: 'none' };
export function parseColor(s) {
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
export function withAlpha(col, alpha) {
  const c = parseColor(col);
  if (!c) return null;
  const hex = typeof c === 'string' ? c : c.hex;
  const a = (typeof c === 'object' ? c.alpha : 1) * alpha;
  const ai = Math.round(Math.max(0, Math.min(1, a)) * 255);
  return '#' + ai.toString(16).padStart(2, '0') + hex.slice(1).toLowerCase();
}

const IDENT = [1, 0, 0, 1, 0, 0];
export function mul(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1], m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3], m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4], m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}
const applyM = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

export function parseTransform(str) {
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
export function normalizePath(d) {
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

export function transformPath(d, m) {
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

export function pathBBox(d) {
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

// recenter: geser path sejauh (cx,cy) — dipakai untuk local-coords di sekitar location
export function recenter(d, bb, cx, cy) {
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

export const escXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Parse teks SVG -> Document. Throw bila bukan SVG valid. */
export function parseSvgDocument(text) {
  const doc = new DOMParser().parseFromString(String(text), 'image/svg+xml');
  if (doc.querySelector('parsererror') || !/^svg$/i.test(doc.documentElement.localName)) throw new Error('svg-invalid');
  return doc;
}

/** Kumpulkan shape drawable dari Document SVG.
    Return { list:[{label,d,paint,bbox,gnote,tag,prim,gops}], notes:[], tree }.
    tree = pohon grup untuk mode Nested Groups. */
export function collectShapes(svgDoc) {
  const out = [], notes = [];
  const grads = {};
  svgDoc.querySelectorAll('linearGradient').forEach((g) => {
    const id = g.getAttribute('id');
    if (id) grads['#' + id] = g;
  });
  const DRAW = ['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline'];
  const DRAWSET = new Set(DRAW);
  let skipped = 0, clipCount = 0;
  const ownOpacity = (node) => {
    const oA = node.getAttribute('opacity');
    return oA == null ? 1 : Math.max(0, Math.min(1, parseFloat(oA) || 0));
  };
  // Syarat <g> "bermakna" -> jadi <embedScene>: punya >=1 shape drawable
  // turunan DAN (>=2 anak elemen ATAU punya atribut transform/opacity/
  // clip-path/id/data-name/aria-label). Grup wrapper transparan beranak-satu
  // tanpa atribut di-flatten (anak naik ke induk).
  const hasDrawableDesc = (el, seen) => {
    if (seen.has(el)) return false;
    seen.add(el);
    const ch = el.children || [];
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      if (c.nodeType !== 1 || c.getAttribute('display') === 'none') continue;
      const t = c.localName.toLowerCase();
      if (t === 'defs') continue;
      if (DRAWSET.has(t)) return true;
      if (t === 'use') {
        const href = c.getAttribute('href') || c.getAttribute('xlink:href');
        const ref = href && href[0] === '#' ? svgDoc.getElementById(href.slice(1)) : null;
        if (ref && (DRAWSET.has(ref.localName.toLowerCase()) || hasDrawableDesc(ref, seen))) return true;
        continue;
      }
      if (hasDrawableDesc(c, seen)) return true;
    }
    return false;
  };
  const gQualifies = (el) => {
    const kids = [...el.children].filter((c) => c.nodeType === 1);
    if (!kids.length || el.getAttribute('display') === 'none') return false;
    const hasAttr = el.getAttribute('transform') != null || el.getAttribute('opacity') != null ||
      el.getAttribute('clip-path') != null || el.getAttribute('id') != null ||
      el.getAttribute('data-name') != null || el.getAttribute('aria-label') != null;
    if (!hasDrawableDesc(el, new Set())) return false;
    return kids.length >= 2 || hasAttr;
  };
  // Pohon grup untuk mode Nested: frame {kind:'g', el, op, kids:[]} /
  // {kind:'root', kids:[]}; anak = {kind:'s', shape} | frame. gops = rantai
  // opasitas grup-grup EmbedScene leluhur (tidak di-bake, ditulis di layer grup).
  const rootFrame = { kind: 'root', kids: [] };
  const walk = (node, mat, paint, op, frame, gops) => {
    if (node.nodeType !== 1) return;
    const tag = node.localName.toLowerCase();
    if (node.getAttribute('display') === 'none') return;
    if (node.getAttribute('clip-path') != null) clipCount++;
    const nm = mul(mat, parseTransform(node.getAttribute('transform')));
    const oOwn = ownOpacity(node);
    const nop = op * oOwn;
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
        walk(ref, um, np, nop, frame, gops);
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
        // Rantai penamaan: id -> data-name -> aria-label,
        // fallback "Shape_001" (underscore + 3-digit zero-padded), max 80 char
        const rawName = node.getAttribute('id') || node.getAttribute('data-name') || node.getAttribute('aria-label');
        const label = (rawName && rawName.trim() ? rawName.trim().slice(0, 80) : 'Shape_' + String(out.length + 1).padStart(3, '0'));
        // Deteksi primitive — rect tanpa rounding & tanpa rotasi/skew,
        // circle dengan skala uniform, paint warna solid. Geometri SVG-space
        // + matriks node disimpan untuk encoding native AM (s=".rect"/".circle").
        let prim = null;
        if (tag === 'rect' && pkind === 'color') {
          const px = parseFloat(node.getAttribute('x') || '0') || 0, py = parseFloat(node.getAttribute('y') || '0') || 0;
          const pw = parseFloat(node.getAttribute('width') || '0') || 0, ph = parseFloat(node.getAttribute('height') || '0') || 0;
          const rx0 = parseFloat(node.getAttribute('rx') || '0') || 0, ry0 = parseFloat(node.getAttribute('ry') || '0') || 0;
          if (pw > 0 && ph > 0 && !rx0 && !ry0 && Math.abs(nm[1]) < 1e-9 && Math.abs(nm[2]) < 1e-9)
            prim = { kind: 'rect', x: px, y: py, w: pw, h: ph, m: nm.slice() };
        } else if (tag === 'circle' && pkind === 'color') {
          const ccx = parseFloat(node.getAttribute('cx') || '0') || 0, ccy = parseFloat(node.getAttribute('cy') || '0') || 0;
          const cr = parseFloat(node.getAttribute('r') || '0') || 0;
          if (cr > 0 && Math.abs(Math.abs(nm[0]) - Math.abs(nm[3])) < 1e-9 && Math.abs(nm[1]) < 1e-9 && Math.abs(nm[2]) < 1e-9)
            prim = { kind: 'circle', cx: ccx, cy: ccy, r: cr, m: nm.slice() };
        }
        out.push({ label, d, paint: { kind: pkind, arg: parg }, bbox: bb, gnote, tag, prim, gops: gops.slice() });
        frame.kids.push({ kind: 's', shape: out[out.length - 1] });
      } catch (e) { skipped++; }
      return;
    }
    if (tag === 'g') {
      // Grup bermakna -> frame EmbedScene (opasitasnya TIDAK di-bake,
      // ditulis di layer grup); grup wrapper -> flatten (opasitas di-bake)
      if (gQualifies(node)) {
        const fr = { kind: 'g', el: node, op: oOwn, kids: [] };
        frame.kids.push(fr);
        [...node.children].forEach((c) => walk(c, nm, np, nop, fr, [...gops, oOwn]));
      } else {
        [...node.children].forEach((c) => walk(c, nm, np, nop, frame, gops));
      }
      return;
    }
    if (tag === 'svg' || tag === 'a' || tag === 'symbol') {
      [...node.children].forEach((c) => walk(c, nm, np, nop, frame, gops));
      return;
    }
    if (tag === 'defs') return; // isi defs sudah di-cache (gradien); shape di defs hanya via <use>
    if (['text', 'image', 'foreignobject', 'filter', 'mask', 'clippath'].includes(tag)) { skipped++; return; }
    [...node.children].forEach((c) => walk(c, nm, np, nop, frame, gops));
  };
  const rootEl = svgDoc.documentElement;
  walk(rootEl, IDENT.slice(), {}, 1, rootFrame, []);
  if (skipped) notes.push(skipped + ' elemen tidak didukung dan dilewati (teks, gambar, filter, dsb).');
  if (clipCount) notes.push(clipCount + ' elemen memakai clip-path — kliping tidak dipetakan ke format Alight Motion dan diabaikan (shape tetap diekspor).');
  return { list: out, notes, tree: rootFrame };
}

// Petakan primitive ke ruang kanvas akhir. Primitif native AM berunit
// 100x100 berpusat di location. Kembalikan null bila hasil akhir tidak
// axis-aligned / tidak uniform.
export function primFinal(p, t2m) {
  const m = mul(t2m, p.m);
  if (Math.abs(m[1]) > 1e-9 || Math.abs(m[2]) > 1e-9) return null;
  if (p.kind === 'rect') {
    const cs = [[p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]]
      .map(([x, y]) => applyM(m, x, y));
    const xs = cs.map((q) => q[0]), ys = cs.map((q) => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = x1 - x0, h = y1 - y0;
    if (!(w > 0 && h > 0)) return null;
    return { s: 'rect', cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, sx: w / 100, sy: h / 100 };
  }
  if (Math.abs(Math.abs(m[0]) - Math.abs(m[3])) > 1e-9) return null; // circle: wajib uniform
  const [ccx, ccy] = applyM(m, p.cx, p.cy);
  const r = Math.abs(p.r * m[0]);
  if (!(r > 0)) return null;
  return { s: 'circle', cx: ccx, cy: ccy, sx: (2 * r) / 100, sy: (2 * r) / 100 };
}

/** Hitung kanvas + matriks pemetaan SVG->kanvas.
    ratio: 'asli' | 'custom' | '1:1' | '16:9' | ... Preset memakai skala
    uniform xMidYMid meet; 'asli'/'custom' memakai skala independen per sumbu. */
export function computeCanvas(svgW, svgH, ratio, cw, ch) {
  let W, H, t2m;
  if (ratio !== 'asli' && ratio !== 'custom') {
    const parts = String(ratio).split(':');
    const rw = +parts[0] || 1, rh = +parts[1] || 1;
    W = Math.min(8192, Math.max(1, Math.round(svgW)));
    H = Math.min(8192, Math.max(1, Math.round(svgW * rh / rw)));
    const sc = Math.min(W / svgW, H / svgH);
    const ox = (W - svgW * sc) / 2, oy = (H - svgH * sc) / 2;
    t2m = [sc, 0, 0, sc, ox, oy];
  } else {
    W = Math.min(8192, Math.max(1, Math.round(+cw) || Math.round(svgW)));
    H = Math.min(8192, Math.max(1, Math.round(+ch) || Math.round(svgH)));
    t2m = [W / svgW, 0, 0, H / svgH, 0, 0];
  }
  return { W, H, t2m, T: (d) => transformPath(d, t2m) };
}

// Profil versi scene mengikuti hasil reverse-engineering aplikasi
// Alight Motion v5.0.273 (format project normal: ffver=106; 107 = preset).
const AM = {
  amver: '1028425', ffver: '106',
  am: 'com.alightcreative.motion/5.0.273.1028425',
  amplatform: 'ios',
};

/** Konversi penuh SVG -> XML project Alight Motion (murni, tanpa DOM UI).
    o = { shapes, tree, W, H, t2m, fps, totalMs, mode:'fidelity'|'groups'|'cleanup',
          nested:bool, patchPct, thinPct, primOn, title, modifiedTime }
    Return { xml, notes, stats:{shapes,layers,groups,prims} }. */
export function convertSvgToXml(o) {
  const { shapes, tree, W, H, t2m, fps, totalMs, mode, primOn } = o;
  const nested = !!o.nested && mode !== 'groups';
  const title = (o.title || 'SVG Import').slice(0, 80);
  const modifiedTime = o.modifiedTime != null ? o.modifiedTime : Date.now();
  const T2 = (d) => transformPath(d, t2m);
  const notes = [];
  const sel = shapes.slice();

  // cache geometri kanvas per shape (dipakai ulang emisi flat & nested)
  sel.forEach((s) => { const d = T2(s.d); s._cd = d; s._cbb = pathBBox(d); });

  // Kembalikan alpha yang berasal dari opasitas grup-grup EmbedScene leluhur
  // (ditulis sekali di <opacity> layer grup — anti double-apply).
  const unbakeArg = (argb, g) => {
    if (!(g < 1)) return argb;
    const a = parseInt(String(argb).slice(1, 3), 16);
    const na = Math.max(0, Math.min(255, Math.round(a / g)));
    return '#' + na.toString(16).padStart(2, '0') + String(argb).slice(3);
  };
  const unbakedPaint = (s) => {
    const gops = s.gops || [];
    const g = gops.reduce((a, b) => a * b, 1);
    if (!(g < 1)) return s.paint;
    if (s.paint.kind === 'gradient') {
      const pa = s.paint.arg;
      return { kind: 'gradient', arg: { start: unbakeArg(pa.start, g), end: unbakeArg(pa.end, g), sxy: pa.sxy, exy: pa.exy } };
    }
    return { kind: 'color', arg: unbakeArg(s.paint.arg, g) };
  };
  const paintFor = (s) => (nested ? unbakedPaint(s) : s.paint);

  let layers = []; // {label, cx, cy, paths:[{d,paint}], srcItems:[{s,d,bb}]}
  let workFinal = sel;
  const makeLayer = (label, items) => {
    // bbox gabungan utk location; tiap source shape TETAP terpisah (tanpa merge geometri)
    let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18;
    items.forEach(({ bb }) => {
      if (bb.x0 < x0) x0 = bb.x0; if (bb.y0 < y0) y0 = bb.y0;
      if (bb.x1 > x1) x1 = bb.x1; if (bb.y1 > y1) y1 = bb.y1;
    });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return {
      label, cx, cy, srcItems: items,
      paths: items.map(({ s, d, bb }) => ({ d: recenter(d, bb, cx, cy), paint: paintFor(s) })),
    };
  };
  const pushLayer = (label, arr) => {
    layers.push(makeLayer(label, arr.map((s) => ({ s, d: s._cd, bb: s._cbb }))));
  };
  if (mode === 'groups') {
    // HANYA warna solid yang digroup (1 warna = 1 layer);
    // shape ber-gradien masing-masing jadi 1 layer sendiri, geometri tidak dilebur
    const cmap = new Map(), solo = [];
    sel.forEach((s) => {
      if (s.paint.kind === 'color') {
        const key = s.paint.arg;
        if (!cmap.has(key)) cmap.set(key, []);
        cmap.get(key).push(s);
      } else solo.push(s);
    });
    let li = 0;
    for (const arr of cmap.values()) pushLayer('Warna ' + (++li), arr);
    solo.forEach((s) => pushLayer(s.label, [s]));
    // audit z-order/overlap — pasangan layer yang bbox-nya tumpang tindih
    let overlapPairs = 0;
    for (let a = 0; a < layers.length; a++) {
      for (let b = a + 1; b < layers.length; b++) {
        let hit = false;
        for (const ia of layers[a].srcItems) {
          for (const ib of layers[b].srcItems) {
            if (ia.bb.x0 < ib.bb.x1 && ia.bb.x1 > ib.bb.x0 && ia.bb.y0 < ib.bb.y1 && ia.bb.y1 > ib.bb.y0) { hit = true; break; }
          }
          if (hit) break;
        }
        if (hit) overlapPairs++;
      }
    }
    if (overlapPairs) notes.push('Audit z-order: ' + overlapPairs + ' pasangan layer saling tumpang tindih — urutan tumpuk bisa berubah setelah grouping warna.');
    notes.push('Color Groups: ' + sel.length + ' shape → ' + layers.length + ' layer (hanya warna solid digroup; gradien 1 layer per shape; geometri tidak dilebur).');
  } else {
    let work = sel.slice();
    if (mode === 'cleanup') {
      // Semantik: patchAreaPercent thd LUAS KANVAS (default 0.01, 0–0.25)
      // + proteksi detail tipis (default 2.0, 0–100)
      let pPct = parseFloat(o.patchPct);
      pPct = isNaN(pPct) ? 0.01 : Math.min(0.25, Math.max(0, pPct));
      let tPct = parseFloat(o.thinPct);
      tPct = isNaN(tPct) ? 2.0 : Math.min(100, Math.max(0, tPct));
      const th = (W * H) * pPct / 100;
      const items = work.map((s) => { const d = T2(s.d); const bb = pathBBox(d); return { s, d, bb, a: bb.w * bb.h }; });
      const kept = items.filter((x) => {
        if (x.a >= th) return true;
        if (tPct > 0 && x.bb.w > 0 && x.bb.h > 0) {
          const thinRatio = Math.min(x.bb.w, x.bb.h) / Math.max(x.bb.w, x.bb.h) * 100;
          if (thinRatio < tPct) return true; // detail tipis dilindungi
        }
        return false;
      });
      notes.push('Small Patch Cleanup: ' + (items.length - kept.length) + ' serpihan dibuang (ambang ' + pPct + '% luas kanvas, proteksi detail tipis ' + tPct + '%).');
      work = kept.map((x) => x.s);
    }
    layers = [];
    if (!nested) work.forEach((s) => pushLayer(s.label, [s]));
    workFinal = work;
    if (mode === 'cleanup' && !notes.length) notes.push('Tidak ada serpihan yang dibuang.');
  }
  const strokeNotes = sel.filter((s) => s.gnote).length;
  if (strokeNotes) notes.push(strokeNotes + ' shape memakai substitusi paint (lihat daftar layer).');

  let id = 0, primEncoded = 0, groupCount = 0, groupOpCount = 0, statLayers = layers.length;
  // Emisi shape mengikuti format project Alight Motion v5.0.273:
  // shape impor (non-live) memakai <parameter><contour d="..."/></parameter>,
  // BUKAN <path>; layer gradien memakai fillType="gradient".
  const layerXml = (L, ind) => {
    // Shape primitif kompatibel (1 shape per layer, paint solid) ->
    // primitif native AM (s=".rect"/".circle", unit 100x100, tanpa contour)
    const s0 = (L.srcItems.length === 1 && L.paths.length === 1) ? L.srcItems[0].s : null;
    let pf = null;
    if (primOn && s0 && s0.prim && s0.paint.kind === 'color') pf = primFinal(s0.prim, t2m);
    if (pf) {
      primEncoded++;
      const parg = L.paths[0].paint;
      const fc = parg.kind === 'color' ? parg.arg : s0.paint.arg;
      return ind + '<shape id="' + (++id) + '" label="' + escXml(L.label) + '" startTime="0" endTime="' + totalMs + '" fillType="color" s=".' + pf.s + '">' +
        '<transform><location value="' + pf.cx.toFixed(6) + ',' + pf.cy.toFixed(6) + ',0.000000"/><scale value="' + pf.sx.toFixed(6) + ',' + pf.sy.toFixed(6) + '"/></transform>' +
        '<fillColor value="' + fc + '"/></shape>';
    }
    const contours = L.paths.map((p) => '<contour d="' + escXml(p.d) + '"/>').join('');
    const head = L.paths.map((p) => {
      if (p.paint.kind === 'gradient')
        return { ft: 'gradient', inner: '<fillColor value="' + p.paint.arg.start + '"/><gradient type="linear" startColor="' + p.paint.arg.start + '" endColor="' + p.paint.arg.end + '" start="' + p.paint.arg.sxy + '" end="' + p.paint.arg.exy + '"/>' };
      return { ft: 'color', inner: '<fillColor value="' + p.paint.arg + '"/>' };
    });
    // satu layer satu fillType: gradien bila ada path gradien, else color
    const ft = head.some((h) => h.ft === 'gradient') ? 'gradient' : 'color';
    const inner = head[0].inner;
    return ind + '<shape id="' + (++id) + '" label="' + escXml(L.label) + '" startTime="0" endTime="' + totalMs + '" fillType="' + ft + '">' +
      '<transform><location value="' + L.cx.toFixed(6) + ',' + L.cy.toFixed(6) + ',0.000000"/></transform>' + inner +
      '<parameter>' + contours + '</parameter></shape>';
  };
  let body;
  if (!nested) {
    body = layers.map((L) => layerXml(L, '  ')).join('\n');
    if (mode === 'groups') notes.push('Struktur Flat (mode Color Groups selalu flat).');
  } else {
    // Nested Groups — <g> bermakna -> <embedScene> berisi <scene> inline.
    // Format kanonis aplikasi: tanpa fillType/fillColor di embedScene;
    // transform location=pivot=pusat bbox isi grup (identitas: render =
    // location + (P - pivot) = P, persis mode Flat). Inner <scene> memakai
    // atribut kanonis (bgcolor transparan, tanpa modifiedTime/precompose/retime).
    // id unik dialokasikan pre-order (dokumen = z-order).
    const selSet = new Set(workFinal);
    let gN = 0;
    const glabel = (el) => {
      const raw = el.getAttribute('id') || el.getAttribute('data-name') || el.getAttribute('aria-label');
      return (raw && raw.trim() ? raw.trim().slice(0, 80) : 'Group_' + String(++gN).padStart(3, '0'));
    };
    // saring pohon sesuai shape terpilih/dibersihkan; grup yang anaknya
    // habis ikut hilang (fallback implisit ke flat untuk grup itu)
    const keepKids = (kids) => {
      const outk = [];
      kids.forEach((k) => {
        if (k.kind === 's') { if (selSet.has(k.shape)) outk.push(k); }
        else { const kk = keepKids(k.kids); if (kk.length) { k._kept = kk; outk.push(k); } }
      });
      return outk;
    };
    const unionBb = (kids) => {
      let x0 = 1e18, y0 = 1e18, x1 = -1e18, y1 = -1e18, any = false;
      const acc = (bb) => { any = true; if (bb.x0 < x0) x0 = bb.x0; if (bb.y0 < y0) y0 = bb.y0; if (bb.x1 > x1) x1 = bb.x1; if (bb.y1 > y1) y1 = bb.y1; };
      kids.forEach((k) => { if (k.kind === 's') acc(k.shape._cbb); else if (k._bb) acc(k._bb); });
      return any ? { x0, y0, x1, y1 } : null;
    };
    const innerOpen = '<scene title="" width="' + W + '" height="' + H + '" exportWidth="1920" exportHeight="1080" bgcolor="#00000000" totalTime="' + totalMs + '" fps="' + fps + '" ffver="' + AM.ffver + '" amver="' + AM.amver + '" am="' + AM.am + '" amplatform="' + AM.amplatform + '">';
    const emitKids = (kids, ind) => kids.map((k) => {
      if (k.kind === 's') return layerXml(makeLayer(k.shape.label, [{ s: k.shape, d: k.shape._cd, bb: k.shape._cbb }]), ind);
      const inner = emitKids(k._kept, ind + '    ');
      const bb = unionBb(k._kept);
      const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
      k._bb = bb;
      groupCount++;
      if (k.op < 1) groupOpCount++;
      return ind + '<embedScene id="' + (++id) + '" label="' + escXml(glabel(k.el)) + '" startTime="0" endTime="' + totalMs + '">\n' +
        ind + '  <transform><location value="' + cx.toFixed(6) + ',' + cy.toFixed(6) + ',0.000000"/><pivot value="' + cx.toFixed(6) + ',' + cy.toFixed(6) + '"/>' +
        (k.op < 1 ? '<opacity value="' + k.op.toFixed(6) + '"/>' : '') + '</transform>\n' +
        ind + '  ' + innerOpen + '\n' + inner + '\n' +
        ind + '  </scene>\n' +
        ind + '</embedScene>';
    }).join('\n');
    const topKids = keepKids((tree && tree.kids) || []);
    body = emitKids(topKids, '  ');
    statLayers = topKids.length;
    if (groupCount) notes.push('Struktur Nested Groups: ' + groupCount + ' grup <g> → ' + groupCount + ' EmbedScene (hierarki dipertahankan; transform grup di-bake ke path anak sehingga render identik dengan mode Flat).');
    else notes.push('Tidak ada grup <g> yang memenuhi syarat — output setara mode Flat.');
    if (groupOpCount) notes.push(groupOpCount + ' grup memakai opacity — dipetakan ke opacity layer EmbedScene (tidak di-bake ke shape).');
  }
  if (primOn && primEncoded) notes.push('Primitive native: ' + primEncoded + ' shape (rect/circle kompatibel) diekspor sebagai primitif AM (s=".rect"/".circle").');

  const xml = '<?xml version=\'1.0\' encoding=\'UTF-8\' ?>\n' +
    '<scene title="' + escXml(title) + '" width="' + W + '" height="' + H + '" exportWidth="1920" exportHeight="1080" bgcolor="#00000000" totalTime="' + totalMs + '" fps="' + fps + '" modifiedTime="' + modifiedTime + '" amver="' + AM.amver + '" ffver="' + AM.ffver + '" am="' + AM.am + '" amplatform="' + AM.amplatform + '" precompose="dynamicResolution" retime="off">\n' +
    '  <bookmark t="0"/>\n' + body + '\n</scene>\n';
  return { xml, notes, stats: { shapes: sel.length, layers: statLayers, groups: groupCount, prims: primEncoded } };
}

/* ================= UI ================= */
export function render(root) {
const MAX_FILE = 2 * 1024 * 1024;
const fi = fileInput('.svg,image/svg+xml'); fi.style.margin = '6px 0';
const modeSel = T.select([
  ['fidelity', 'Maximum Fidelity — struktur & urutan dipertahankan'],
  ['groups', 'Color Groups — shape sewarna digabung per layer'],
  ['cleanup', 'Small Patch Cleanup — buang serpihan kecil'],
], 'fidelity');
const cwInp = T.input('number', 'Otomatis dari SVG', '');
const chInp = T.input('number', 'Otomatis dari SVG', '');
const projInp = T.input('text', 'Nama project', 'SVG Import');
const fpsSel = T.select([['24', '24 fps'], ['30', '30 fps'], ['60', '60 fps'], ['120', '120 fps']], '30');
const durInp = T.input('number', 'Durasi (detik)', '2');
durInp.min = '0.1'; durInp.max = '600'; durInp.step = '0.1';
const patchInp = T.input('number', '0,01', '0.01');
patchInp.min = '0'; patchInp.max = '0.25'; patchInp.step = '0.001';
const thinInp = T.input('number', '2,0', '2.0');
thinInp.min = '0'; thinInp.max = '100'; thinInp.step = '0.1';
const ratioSel = T.select([['asli', 'Asli (dari SVG)'], ['1:1', '1 : 1'], ['16:9', '16 : 9'], ['9:16', '9 : 16'], ['4:5', '4 : 5'], ['4:3', '4 : 3'], ['custom', 'Custom — isi W×H manual']], 'asli');
const structSel = T.select([
  ['nested', 'Nested Groups (EmbedScene) — hierarki grup dipertahankan'],
  ['flat', 'Flat — semua shape sejajar'],
], 'nested');
const structNote = T.el('<div class="dim" style="font-size:12px;margin:2px 0 8px">Mode Color Groups selalu memakai struktur Flat (opsi grouping tidak dipakai di mode ini).</div>');
structNote.hidden = true;
const fnameInp = T.input('text', 'nama-file', 'svg-alight');
fnameInp.maxLength = 80;
const primRow = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer;margin:8px 0"></label>');
const primChk = T.el('<input type="checkbox" checked style="width:16px;height:16px;accent-color:#e07856">');
primRow.appendChild(primChk);
primRow.appendChild(T.el('<span>Deteksi primitive <span class="dim">(rect/circle kompatibel → primitif native AM)</span></span>'));
const box = T.out();
const layerWrap = T.el('<div style="display:grid;gap:6px;margin:12px 0;max-height:260px;overflow:auto"></div>');
const layerSec = T.el('<div hidden></div>');
const prevTa = T.ta(10, 'Preview XML…', '');
prevTa.style.fontFamily = 'monospace'; prevTa.style.fontSize = '11px'; prevTa.readOnly = true;
const prevSec = T.el('<div hidden></div>');
const noteBox = T.out();

let shapes = []; // {label, d, paint, bbox, tag, ...}
let shapeTree = null;
let svgDoc = null;
let svgW = 1080, svgH = 1080, fileBase = 'svg-alight';

fi.addEventListener('change', async () => {
  const f = fi.files && fi.files[0];
  if (!f) return;
  if (f.size > MAX_FILE) { fi.value = ''; T.show(box, errBox('File terlalu besar. Maksimal 2 MB.')); return; }
  T.show(box, '<span class="dim">Menganalisis SVG…</span>');
  try {
    const text = await f.text();
    const doc = parseSvgDocument(text);
    const vb = (doc.documentElement.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const wA = parseFloat(doc.documentElement.getAttribute('width')), hA = parseFloat(doc.documentElement.getAttribute('height'));
    if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { svgW = vb[2]; svgH = vb[3]; }
    else if (wA > 0 && hA > 0) { svgW = wA; svgH = hA; }
    else { svgW = 1080; svgH = 1080; }
    fileBase = f.name.replace(/\.svg$/i, '') || 'svg-alight';
    fnameInp.value = fileBase;
    const { list, notes, tree } = collectShapes(doc);
    shapes = list;
    shapeTree = tree;
    svgDoc = doc;
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
  const bInv = T.btn('Balik', () => layerWrap.querySelectorAll('input').forEach((c) => { c.checked = !c.checked; }));
  bAll.classList.add('small'); bNone.classList.add('small'); bInv.classList.add('small');
  allRow.appendChild(bAll); allRow.appendChild(bNone); allRow.appendChild(bInv);
  layerWrap.prepend(allRow);
}

const selectedShapes = () => {
  const chks = layerWrap.querySelectorAll('input[type=checkbox]');
  const sel = [];
  chks.forEach((c) => { if (c.checked) sel.push(shapes[+c.dataset.i]); });
  return sel.filter(Boolean);
};

let lastXml = '';
const bGo = T.btn('Konversi ke XML', () => {
  const sel = selectedShapes();
  if (!sel.length) { T.show(noteBox, errBox('Pilih minimal 1 layer.')); return; }
  const mode = modeSel.value;
  const fps = [24, 30, 60, 120].indexOf(+fpsSel.value) >= 0 ? +fpsSel.value : 30;
  const durS = Math.min(600, Math.max(0.1, parseFloat(durInp.value) || 2));
  const totalMs = Math.round(durS * 1000);
  const canvas = computeCanvas(svgW, svgH, ratioSel.value, cwInp.value, chInp.value);
  const { W, H, t2m } = canvas;
  const nested = structSel.value === 'nested' && mode !== 'groups';
  const title = (projInp.value.trim() || 'SVG Import').slice(0, 80);
  let conv;
  try {
    conv = convertSvgToXml({
      shapes: sel, tree: shapeTree, W, H, t2m, fps, totalMs, mode, nested,
      patchPct: patchInp.value, thinPct: thinInp.value,
      primOn: primChk.checked !== false, title, modifiedTime: Date.now(),
    });
  } catch (e) {
    T.show(noteBox, errBox('Konversi gagal: ' + e.message)); return;
  }
  const xml = conv.xml;
  lastXml = xml;

  const MARK = '<!-- NEXORA: preview dipotong agar render tetap ringan -->';
  let fullPrev = false;
  const renderPreview = () => {
    if (fullPrev || xml.length <= 48000) prevTa.value = xml;
    else prevTa.value = xml.slice(0, 40000) + '\n' + MARK + '\n' + xml.slice(-8000);
  };
  renderPreview();
  prevSec.hidden = false;
  T.show(noteBox, (conv.notes.length ? conv.notes.map((n) => '<div style="font-size:13px;margin-bottom:6px">' + T.esc(n) + '</div>').join('') : '') +
    '<div class="kv"><span class="k">Timeline</span><span class="v">' + fps + ' fps · ' + durS + ' dtk</span></div>' +
    '<div class="kv"><span class="k">Layer</span><span class="v">' + conv.stats.layers + '</span></div>' +
    '<div class="kv"><span class="k">Ukuran XML</span><span class="v">' + (xml.length / 1024).toFixed(1) + ' KB</span></div>' +
    '<div class="dim" style="font-size:12px;margin-top:8px">Struktur XML mengikuti format project Alight Motion (scene/shape/contour). Impor file XML ini lewat Alight Motion. Hasil visual bisa berbeda untuk SVG kompleks — cek pratinjau di aplikasi.</div>');
  const bFull = T.btn('Tampilkan penuh', () => {
    fullPrev = !fullPrev;
    bFull.textContent = fullPrev ? 'Ringkas preview' : 'Tampilkan penuh';
    renderPreview();
  });
  const bCopy = T.copyBtn(() => lastXml, 'Salin XML');
  prevBtnRow.innerHTML = '';
  prevBtnRow.appendChild(bFull); prevBtnRow.appendChild(bCopy);
  const bDl = T.btn('Unduh XML', () => {
    let fn = (fnameInp.value.trim() || fileBase || 'svg-alight').slice(0, 80);
    fn = fn.replace(/[\\\/:*?"<>|]/g, '').trim() || 'svg-alight';
    if (!/\.xml$/i.test(fn)) fn += '.xml';
    T.dl(fn, xml, 'text/xml;charset=utf-8');
  }, true);
  const old = noteBox.querySelector('[data-dl]');
  if (old) old.remove();
  const wrap = T.el('<div data-dl style="margin-top:10px"></div>');
  wrap.appendChild(bDl);
  noteBox.appendChild(wrap);
  prevSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}, true);
bGo.hidden = true;

const thRow = T.el('<div></div>');
thRow.appendChild(T.grid2(
  T.field('Ambang serpihan (% luas kanvas)', patchInp, 'Default 0,01 — serpihan di bawah ambang ini dibuang'),
  T.field('Proteksi detail tipis (%)', thinInp, 'Default 2,0 — garis/detail tipis tidak ikut dibuang')
));
modeSel.addEventListener('change', () => {
  thRow.hidden = modeSel.value !== 'cleanup';
  const gm = modeSel.value === 'groups';
  structSel.disabled = gm;
  structNote.hidden = !gm;
});
thRow.hidden = true;

layerSec.appendChild(T.el('<div style="margin-bottom:4px"><b>Pilih layer</b> <span class="dim" style="font-size:12px">(hanya yang dicentang dikonversi)</span></div>'));
layerSec.appendChild(layerWrap);
const prevBtnRow = T.el('<div style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap"></div>');
prevSec.appendChild(T.el('<div style="margin:12px 0 4px"><b>Preview XML</b></div>'));
prevSec.appendChild(prevBtnRow);
prevSec.appendChild(prevTa);

root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Konversi SVG menjadi project XML siap impor ke Alight Motion — 100% lokal di perangkatmu.</p>'));
root.appendChild(T.el('<div style="margin-bottom:4px"><b>File SVG</b> <span class="dim" style="font-size:12px">· maks 2 MB</span></div>'));
root.appendChild(fi);
root.appendChild(box);
root.appendChild(layerSec);
root.appendChild(T.field('Mode konversi', modeSel));
root.appendChild(thRow);
root.appendChild(T.field('Struktur export', structSel, 'Nested Groups = hierarki <g> jadi EmbedScene (default, mengikuti tool asli).'));
root.appendChild(structNote);
root.appendChild(T.field('Rasio kanvas', ratioSel, 'Preset mengatur W×H otomatis (xMidYMid meet). Pilih Custom untuk isi W×H manual di bawah.'));
root.appendChild(T.grid2(T.field('Lebar canvas (opsional)', cwInp), T.field('Tinggi canvas (opsional)', chInp)));
root.appendChild(T.grid2(T.field('FPS', fpsSel), T.field('Durasi (detik)', durInp, '0,1 – 600 detik')));
root.appendChild(T.field('Nama project', projInp));
root.appendChild(T.field('Nama file XML', fnameInp, 'Bisa diedit bebas, maks 80 karakter'));
root.appendChild(primRow);
root.appendChild(T.row(bGo));
root.appendChild(noteBox);
root.appendChild(prevSec);
}
