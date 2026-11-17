import { h as T, utils, onLeave } from '../../core.js';

export const meta = {"id": "kalkulator-umum", "name": "Kalkulator Umum", "cat": "pelajar", "icon": "🧮", "desc": "Hitung biasa sampai ilmiah: tambah kurang kali bagi, persen, sin cos tan, log, akar, pangkat, plus riwayat.", "keywords": "kalkulator,hitung,matematika,ilmiah,sin,cos,tan,log,ln,akar,pangkat,faktorial,persen,derajat,radian", "since": "6.11.0"};

// Parser ekspresi sendiri, tanpa memakai eval: tokenizer, AST, evaluator.
const FN_NAMES = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'log', 'ln', 'sqrt'];

function tokenize(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if ((c >= '0' && c <= '9') || c === '.') {
      let j = i, dot = false;
      while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.')) {
        if (s[j] === '.') {
          if (dot) throw new Error('Angkanya tidak benar.');
          dot = true;
        }
        j++;
      }
      const raw = s.slice(i, j);
      if (raw === '.') throw new Error('Angkanya tidak benar.');
      out.push({ t: 'num', v: parseFloat(raw) });
      i = j;
      continue;
    }
    if (c >= 'a' && c <= 'z') {
      let j = i;
      while (j < s.length && s[j] >= 'a' && s[j] <= 'z') j++;
      out.push({ t: 'id', v: s.slice(i, j) });
      i = j;
      continue;
    }
    if ('+-*/^%!()'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    throw new Error('Ada karakter yang tidak dikenali di hitungan.');
  }
  return out;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expectOp = (ch) => {
    const t = next();
    if (!t || t.t !== 'op' || t.v !== ch) throw new Error('Hitungannya belum lengkap, cek lagi ya.');
  };

  function parseExpr() {
    let left = parseTerm();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || (t.v !== '+' && t.v !== '-')) return left;
      next();
      const right = parseTerm();
      left = { t: t.v === '+' ? 'add' : 'sub', a: left, b: right };
    }
  }
  function parseTerm() {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (!t) return left;
      if (t.t === 'op' && (t.v === '*' || t.v === '/')) {
        next();
        const right = parseUnary();
        left = { t: t.v === '*' ? 'mul' : 'div', a: left, b: right };
        continue;
      }
      // Perkalian tanpa tanda: 2(3), 2pi, 3sin(30).
      if (t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '(')) {
        const right = parseUnary();
        left = { t: 'mul', a: left, b: right };
        continue;
      }
      return left;
    }
  }
  function parseUnary() {
    const t = peek();
    if (t && t.t === 'op' && t.v === '-') { next(); return { t: 'neg', x: parseUnary() }; }
    if (t && t.t === 'op' && t.v === '+') { next(); return parseUnary(); }
    return parsePower();
  }
  function parsePower() {
    const base = parsePostfix();
    const t = peek();
    if (t && t.t === 'op' && t.v === '^') {
      next();
      return { t: 'pow', a: base, b: parseUnary() };
    }
    return base;
  }
  function parsePostfix() {
    let node = parsePrimary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op' || (t.v !== '!' && t.v !== '%')) return node;
      next();
      node = { t: t.v === '!' ? 'fact' : 'pct', x: node };
    }
  }
  function parsePrimary() {
    const t = next();
    if (!t) throw new Error('Hitungannya belum lengkap, cek lagi ya.');
    if (t.t === 'num') return { t: 'num', v: t.v };
    if (t.t === 'op' && t.v === '(') {
      const inner = parseExpr();
      expectOp(')');
      return inner;
    }
    if (t.t === 'id') {
      if (t.v === 'pi') return { t: 'num', v: Math.PI };
      if (t.v === 'e') return { t: 'num', v: Math.E };
      if (FN_NAMES.includes(t.v)) {
        expectOp('(');
        const arg = parseExpr();
        expectOp(')');
        return { t: 'fn', name: t.v, x: arg };
      }
      throw new Error('Fungsi "' + t.v + '" tidak dikenal.');
    }
    throw new Error('Ada yang belum beres di hitungannya.');
  }

  const tree = parseExpr();
  if (pos < tokens.length) throw new Error('Ada yang belum beres di hitungannya.');
  return tree;
}

function factorial(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function evalTree(n, deg) {
  switch (n.t) {
    case 'num': return n.v;
    case 'neg': return -evalTree(n.x, deg);
    case 'add':
    case 'sub': {
      const a = evalTree(n.a, deg);
      // Persen setelah tambah/kurang dihitung dari angka sebelumnya: 100-25% = 75.
      const b = n.b.t === 'pct' ? a * evalTree(n.b.x, deg) / 100 : evalTree(n.b, deg);
      return n.t === 'add' ? a + b : a - b;
    }
    case 'mul': return evalTree(n.a, deg) * evalTree(n.b, deg);
    case 'div': {
      const d = evalTree(n.b, deg);
      if (d === 0) throw new Error('Tidak bisa membagi dengan nol.');
      return evalTree(n.a, deg) / d;
    }
    case 'pow': {
      const a = evalTree(n.a, deg), b = evalTree(n.b, deg);
      const r = Math.pow(a, b);
      if (!isFinite(r) || isNaN(r)) throw new Error('Pangkat ini tidak ada hasilnya.');
      return r;
    }
    case 'pct': return evalTree(n.x, deg) / 100;
    case 'fact': {
      const v = evalTree(n.x, deg);
      if (!Number.isInteger(v) || v < 0 || v > 170) throw new Error('Faktorial hanya untuk angka bulat 0 sampai 170.');
      return factorial(v);
    }
    case 'fn': {
      const x = evalTree(n.x, deg);
      switch (n.name) {
        case 'sin': return Math.sin(deg ? x * Math.PI / 180 : x);
        case 'cos': return Math.cos(deg ? x * Math.PI / 180 : x);
        case 'tan': {
          // tan 90 derajat (dan kelipatannya) tidak ada hasilnya; cegah angka raksasa dari float.
          if (deg && (((x % 180) + 180) % 180) === 90) throw new Error('Tan tidak ada hasilnya di sudut ini.');
          const r = Math.tan(deg ? x * Math.PI / 180 : x);
          if (!isFinite(r)) throw new Error('Tan tidak ada hasilnya di sudut ini.');
          return r;
        }
        case 'asin':
        case 'acos': {
          if (x < -1 || x > 1) throw new Error('Angkanya harus antara -1 dan 1 untuk fungsi ini.');
          const r = n.name === 'asin' ? Math.asin(x) : Math.acos(x);
          return deg ? r * 180 / Math.PI : r;
        }
        case 'atan': {
          const r = Math.atan(x);
          return deg ? r * 180 / Math.PI : r;
        }
        case 'log':
        case 'ln': {
          if (!(x > 0)) throw new Error('Logaritma hanya untuk angka lebih dari 0.');
          return n.name === 'log' ? Math.log10(x) : Math.log(x);
        }
        case 'sqrt': {
          if (x < 0) throw new Error('Akar dari angka negatif tidak ada hasilnya.');
          return Math.sqrt(x);
        }
      }
      throw new Error('Fungsi tidak dikenal.');
    }
  }
  throw new Error('Ada yang belum beres di hitungannya.');
}

function evaluate(expr, deg) {
  try {
    if (!expr || !expr.trim()) return { ok: false, error: 'Belum ada hitungan.' };
    const v = evalTree(parse(tokenize(expr)), deg);
    if (typeof v !== 'number' || isNaN(v)) return { ok: false, error: 'Hitungan ini tidak ada hasilnya.' };
    if (!isFinite(v)) return { ok: false, error: 'Hasilnya terlalu besar untuk ditampilkan.' };
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false, error: 'Ada yang belum beres di hitungannya.' };
  }
}

// Format angka gaya Indonesia: ribuan pakai titik, desimal pakai koma.
function fmtPlain(s) {
  let neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  const parts = s.split('.');
  const ig = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-' : '') + ig + (parts[1] ? ',' + parts[1] : '');
}
function fmtExp(v) {
  const parts = v.toExponential(6).split('e');
  return fmtPlain(String(parseFloat(parts[0]))) + ' × 10^' + parseInt(parts[1], 10);
}
function fmtResult(v) {
  if (Object.is(v, -0)) v = 0;
  const av = Math.abs(v);
  if (av !== 0 && (av >= 1e15 || av < 1e-9)) return fmtExp(v);
  const r = Math.round(v * 1e10) / 1e10;
  if (String(r).includes('e')) return fmtExp(v);
  return fmtPlain(String(r));
}

// Ekspresi internal (ASCII) jadi tampilan: × ÷ −, koma desimal, π, √, sin⁻¹.
function fmtExpr(s) {
  return s
    .replace(/asin\(/g, 'sin⁻¹(').replace(/acos\(/g, 'cos⁻¹(').replace(/atan\(/g, 'tan⁻¹(')
    .replace(/sqrt\(/g, '√(')
    .replace(/pi/g, 'π')
    .replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−')
    .replace(/\./g, ',');
}

// Angka hasil jadi teks input lagi; notasi 1e+21 diurai ke desimal biasa.
function numToInput(v) {
  if (!isFinite(v)) return '';
  const r = Math.round(v * 1e10) / 1e10;
  let s = String(r);
  if (!s.includes('e')) return s;
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  const parts = s.split('e');
  const exp = parseInt(parts[1], 10);
  const digits = parts[0].replace('.', '');
  const point = parts[0].includes('.') ? parts[0].indexOf('.') : parts[0].length;
  const np = point + exp;
  let out;
  if (np <= 0) out = '0.' + '0'.repeat(-np) + digits;
  else if (np >= digits.length) out = digits + '0'.repeat(np - digits.length);
  else out = digits.slice(0, np) + '.' + digits.slice(np);
  return (neg ? '-' : '') + out;
}

// Kait uji logika, pola yang sama seperti utils.invoiceCalc.
utils.kalkulatorUmumEval = evaluate;
utils.kalkulatorUmumFmt = fmtResult;
utils.kalkulatorUmumFmtExpr = fmtExpr;

export function render(root) {
  const HIST_KEY = 'at-kalkulator-umum-history-v1';
  const MODE_KEY = 'at-kalkulator-umum-mode-v1';
  const ANGLE_KEY = 'at-kalkulator-umum-angle-v1';

  const loadHist = () => {
    try {
      const l = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
      if (!Array.isArray(l)) return [];
      return l.filter((x) => x && typeof x.e === 'string' && typeof x.r === 'string' && typeof x.v === 'number');
    } catch (e) { return []; }
  };
  const saveHist = (l) => { try { localStorage.setItem(HIST_KEY, JSON.stringify(l.slice(0, 50))); } catch (e) {} };
  const loadPref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const savePref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  let expr = '';
  let lastValue = null;
  let copyValue = null;
  let justEq = false;
  let mode = loadPref(MODE_KEY, 'basic') === 'sci' ? 'sci' : 'basic';
  let angleDeg = loadPref(ANGLE_KEY, 'deg') !== 'rad';
  let hist = loadHist();

  const st = document.createElement('style');
  st.textContent =
    '.ku-wrap{max-width:520px;margin:0 auto}' +
    '.ku-intro{font-size:14px;line-height:1.55;color:var(--mut);margin:0 0 4px}' +
    '.ku-seg{display:flex;gap:6px;background:var(--deep);border:1px solid var(--line-soft);border-radius:12px;padding:4px;margin:12px 0}' +
    '.ku-seg button{flex:1;min-height:44px;border:0;background:transparent;color:var(--mut);border-radius:9px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}' +
    '.ku-seg button[aria-pressed="true"]{background:var(--surface-2);color:var(--txt)}' +
    '.ku-seg button:focus-visible{outline:2px solid var(--txt);outline-offset:2px}' +
    '.ku-angle-hint{font-size:12.5px;color:var(--faint);margin:-6px 0 12px}' +
    '.ku-disp{background:var(--deep);border:1px solid var(--line-soft);border-radius:16px;padding:16px 18px;margin:0 0 12px}' +
    '.ku-expr{font-family:var(--font-m);font-size:22px;line-height:1.35;text-align:right;white-space:nowrap;overflow-x:auto;min-height:30px;color:var(--txt);scrollbar-width:none}' +
    '.ku-expr::-webkit-scrollbar{display:none}' +
    '.ku-res{font-family:var(--font-m);font-size:30px;font-weight:800;line-height:1.3;text-align:right;min-height:40px;word-break:break-all}' +
    '.ku-res.prev{font-size:18px;font-weight:600;color:var(--faint)}' +
    '.ku-res.err{font-size:15px;font-weight:600;color:var(--err);font-family:inherit}' +
    '.ku-keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}' +
    '.ku-keys.sci{margin-bottom:8px}' +
    '.ku-k{min-height:56px;border:1px solid var(--line-soft);background:var(--surface);color:var(--txt);border-radius:12px;font:inherit;font-size:20px;font-weight:650;cursor:pointer;touch-action:manipulation;transition:transform .08s ease,background .12s}' +
    '.ku-k:active{transform:scale(.96)}' +
    '.ku-k:focus-visible{outline:2px solid var(--txt);outline-offset:2px}' +
    '.ku-k.op{background:var(--surface-2);font-size:22px}' +
    '.ku-k.fn{font-size:15px;min-height:48px}' +
    '.ku-k.eq{background:var(--txt);color:var(--bg);border-color:var(--txt);font-size:22px}' +
    '.ku-k.clr{color:var(--err)}' +
    '.btn.ku-copy{width:100%;background:var(--txt);color:var(--bg);border-color:var(--txt);margin-bottom:12px}' +
    '.btn.ku-mini{min-height:44px;padding:8px 14px;font-size:13px}' +
    '.ku-hist{margin-top:22px}' +
    '.ku-hrow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:4px}' +
    '.ku-htitle{font-size:15px;font-weight:800;margin:0}' +
    '.ku-hitem{display:block;width:100%;text-align:left;background:transparent;border:0;border-bottom:1px dashed var(--line);padding:10px 4px;cursor:pointer;font:inherit;color:var(--txt)}' +
    '.ku-hitem:active{background:var(--surface-2)}' +
    '.ku-hitem:focus-visible{outline:2px solid var(--txt);outline-offset:2px}' +
    '.ku-he{font-family:var(--font-m);font-size:13px;color:var(--faint);word-break:break-all}' +
    '.ku-hr{font-family:var(--font-m);font-size:17px;font-weight:700;word-break:break-all}' +
    '.ku-hempty{font-size:13.5px;color:var(--faint);line-height:1.5;margin:8px 0}' +
    '@media (max-width:380px){.ku-k{font-size:18px;min-height:52px}.ku-k.fn{font-size:13.5px}.ku-expr{font-size:20px}.ku-res{font-size:27px}}' +
    '@media (prefers-reduced-motion:reduce){.ku-k{transition:none}}';
  root.appendChild(st);

  const wrap = T.el('<div class="ku-wrap"></div>');
  root.appendChild(wrap);

  wrap.appendChild(T.el('<p class="ku-intro">Hitung apa saja, dari belanjaan sampai soal matematika. Ketuk tombolnya, atau ketik langsung dari keyboard.</p>'));

  const segMode = T.el('<div class="ku-seg"></div>');
  const btnBasic = document.createElement('button');
  btnBasic.type = 'button'; btnBasic.textContent = 'Biasa';
  const btnSci = document.createElement('button');
  btnSci.type = 'button'; btnSci.textContent = 'Ilmiah';
  segMode.append(btnBasic, btnSci);
  wrap.appendChild(segMode);

  const angleWrap = T.el('<div></div>');
  const segAngle = T.el('<div class="ku-seg"></div>');
  const btnDeg = document.createElement('button');
  btnDeg.type = 'button'; btnDeg.textContent = 'Derajat';
  const btnRad = document.createElement('button');
  btnRad.type = 'button'; btnRad.textContent = 'Radian';
  segAngle.append(btnDeg, btnRad);
  const angleHint = T.el('<p class="ku-angle-hint"></p>');
  angleWrap.append(segAngle, angleHint);
  wrap.appendChild(angleWrap);

  const disp = T.el('<div class="ku-disp"></div>');
  const exprEl = T.el('<div class="ku-expr">0</div>');
  const resEl = T.el('<div class="ku-res"></div>');
  resEl.setAttribute('aria-live', 'polite');
  disp.append(exprEl, resEl);
  wrap.appendChild(disp);

  const copyBtn = T.btn('Salin hasil', () => {
    if (copyValue === null) return;
    T.copy(fmtResult(copyValue));
  });
  copyBtn.classList.add('ku-copy');
  copyBtn.disabled = true;
  wrap.appendChild(copyBtn);

  const sciGrid = T.el('<div class="ku-keys sci"></div>');
  const basicGrid = T.el('<div class="ku-keys"></div>');
  wrap.appendChild(sciGrid);
  wrap.appendChild(basicGrid);

  wrap.appendChild(T.el('<p class="hint" style="margin-top:12px">Dari keyboard: angka, + - * / dan Enter untuk =. Esc untuk hapus semua.</p>'));

  const histSec = T.el('<div class="ku-hist"></div>');
  const histRow = T.el('<div class="ku-hrow"></div>');
  histRow.appendChild(T.el('<p class="ku-htitle">Riwayat</p>'));
  const clearHistBtn = T.btn('Hapus', () => {
    hist = [];
    saveHist(hist);
    renderHist();
    T.toast('Riwayat sudah dihapus.');
  });
  clearHistBtn.classList.add('small', 'danger', 'ku-mini');
  histRow.appendChild(clearHistBtn);
  const histEmpty = T.el('<p class="ku-hempty">Belum ada riwayat. Hitungan yang selesai akan tersimpan di sini. Ketuk salah satu riwayat untuk memakai hasilnya lagi.</p>');
  const histList = T.el('<div></div>');
  histSec.append(histRow, histEmpty, histList);
  wrap.appendChild(histSec);

  const endsOperand = () => /[\d)!.%]$/.test(expr) || expr.endsWith('pi') || expr.endsWith('e');
  const hasOperator = (s) => /[+\-*/^%!()]/.test(s) || /sin|cos|tan|log|ln|sqrt/.test(s);
  const currentSegment = () => {
    const m = expr.match(/(\d+\.?\d*|\.\d*)$/);
    return m ? m[0] : '';
  };

  function refresh() {
    exprEl.textContent = expr ? fmtExpr(expr) : '0';
    exprEl.scrollLeft = exprEl.scrollWidth;
    copyValue = null;
    if (justEq && lastValue !== null) {
      resEl.textContent = fmtResult(lastValue);
      resEl.className = 'ku-res';
      copyValue = lastValue;
      copyBtn.disabled = false;
      return;
    }
    if (expr) {
      const r = evaluate(expr, angleDeg);
      if (r.ok) {
        copyValue = r.value;
        if (hasOperator(expr)) {
          resEl.textContent = '= ' + fmtResult(r.value);
          resEl.className = 'ku-res prev';
          copyBtn.disabled = false;
          return;
        }
      }
    } else {
      copyValue = lastValue;
    }
    resEl.textContent = '';
    resEl.className = 'ku-res';
    copyBtn.disabled = copyValue === null;
  }

  function renderHist() {
    histList.innerHTML = '';
    clearHistBtn.hidden = hist.length === 0;
    histEmpty.hidden = hist.length !== 0;
    hist.forEach((h) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ku-hitem';
      b.setAttribute('aria-label', 'Pakai hasil ' + h.r);
      const e = document.createElement('div');
      e.className = 'ku-he';
      e.textContent = h.e;
      const r = document.createElement('div');
      r.className = 'ku-hr';
      r.textContent = '= ' + h.r;
      b.append(e, r);
      b.addEventListener('click', () => {
        expr = numToInput(h.v);
        lastValue = h.v;
        justEq = false;
        refresh();
        T.toast('Hasilnya dipakai lagi.');
      });
      histList.appendChild(b);
    });
  }

  function afterInput() { refresh(); }

  function pressDigit(d) {
    if (justEq) { expr = ''; justEq = false; }
    if (currentSegment() === '0') expr = expr.slice(0, -1) + d;
    else expr += d;
    afterInput();
  }
  function pressDot() {
    if (justEq) { expr = ''; justEq = false; }
    const seg = currentSegment();
    if (seg.includes('.')) return;
    expr += seg ? '.' : '0.';
    afterInput();
  }
  function pressOp(op) {
    if (justEq) { expr = numToInput(lastValue); justEq = false; }
    if (!expr) { if (op === '-') { expr = '-'; afterInput(); } return; }
    if (/[+\-*/^]$/.test(expr)) {
      // Boleh angka negatif setelah operator: 5x-3.
      if (op === '-' && !expr.endsWith('-')) { expr += '-'; afterInput(); return; }
      expr = expr.slice(0, -1) + op;
      afterInput();
      return;
    }
    if (expr.endsWith('(')) { if (op === '-') { expr += '-'; afterInput(); } return; }
    expr += op;
    afterInput();
  }
  function pressFn(name) {
    if (justEq) { expr = ''; justEq = false; }
    if (endsOperand()) expr += '*';
    expr += name;
    afterInput();
  }
  function pressConst(c) {
    if (justEq) { expr = ''; justEq = false; }
    if (endsOperand()) expr += '*';
    expr += c;
    afterInput();
  }
  function pressParen(p) {
    if (p === '(') {
      if (justEq) { expr = ''; justEq = false; }
      if (endsOperand()) expr += '*';
      expr += '(';
      afterInput();
      return;
    }
    const open = (expr.match(/\(/g) || []).length;
    const close = (expr.match(/\)/g) || []).length;
    if (open > close && endsOperand()) { expr += ')'; afterInput(); }
  }
  function pressPost(kind) {
    if (justEq) { expr = numToInput(lastValue); justEq = false; }
    if (endsOperand()) { expr += kind; afterInput(); }
  }
  function pressSquare() {
    if (justEq) { expr = numToInput(lastValue); justEq = false; }
    if (endsOperand()) { expr += '^2'; afterInput(); }
  }
  function pressNegate() {
    if (justEq) { expr = numToInput(lastValue); justEq = false; }
    if (!expr) { expr = '-'; afterInput(); return; }
    const m = expr.match(/(\d+\.?\d*|\.\d+)$/);
    if (!m) {
      if (/[+\-*/^(]$/.test(expr)) { expr += '-'; afterInput(); }
      return;
    }
    const num = m[0];
    const before = expr.slice(0, -num.length);
    // Minus di depan angka ini unary bila di awal atau setelah operator: lepas saja.
    if (before.endsWith('-') && (before.length === 1 || /[+\-*/^(]/.test(before[before.length - 2]))) {
      expr = before.slice(0, -1) + num;
    } else {
      expr = before + '-' + num;
    }
    afterInput();
  }
  function pressBack() {
    if (justEq) { expr = numToInput(lastValue); justEq = false; }
    if (!expr) return;
    const tails = ['asin(', 'acos(', 'atan(', 'sqrt(', 'sin(', 'cos(', 'tan(', 'log(', 'ln('];
    for (const t of tails) {
      if (expr.endsWith(t)) { expr = expr.slice(0, -t.length); afterInput(); return; }
    }
    if (expr.endsWith('pi')) { expr = expr.slice(0, -2); afterInput(); return; }
    expr = expr.slice(0, -1);
    afterInput();
  }
  function pressClear() {
    expr = '';
    lastValue = null;
    justEq = false;
    refresh();
  }
  function evaluateNow() {
    if (!expr) return;
    const r = evaluate(expr, angleDeg);
    if (!r.ok) {
      resEl.textContent = r.error;
      resEl.className = 'ku-res err';
      return;
    }
    lastValue = r.value;
    justEq = true;
    hist.unshift({ e: fmtExpr(expr), r: fmtResult(r.value), v: r.value });
    hist = hist.slice(0, 50);
    saveHist(hist);
    renderHist();
    refresh();
  }

  function setMode(m) {
    mode = m;
    savePref(MODE_KEY, m);
    btnBasic.setAttribute('aria-pressed', String(m === 'basic'));
    btnSci.setAttribute('aria-pressed', String(m === 'sci'));
    sciGrid.hidden = m !== 'sci';
    angleWrap.hidden = m !== 'sci';
  }
  function setAngle(deg) {
    angleDeg = deg;
    savePref(ANGLE_KEY, deg ? 'deg' : 'rad');
    btnDeg.setAttribute('aria-pressed', String(deg));
    btnRad.setAttribute('aria-pressed', String(!deg));
    angleHint.textContent = deg ? 'Sudut dihitung dalam derajat.' : 'Sudut dihitung dalam radian.';
    refresh();
  }
  btnBasic.addEventListener('click', () => setMode('basic'));
  btnSci.addEventListener('click', () => setMode('sci'));
  btnDeg.addEventListener('click', () => setAngle(true));
  btnRad.addEventListener('click', () => setAngle(false));

  function key(label, fn, cls, aria) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ku-k' + (cls ? ' ' + cls : '');
    b.textContent = label;
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', (e) => {
      fn();
      // Klik mouse melepas fokus supaya spasi tidak menekan tombol yang sama lagi.
      if (e.detail !== 0) b.blur();
    });
    return b;
  }

  [
    [key('sin', () => pressFn('sin('), 'fn'), key('cos', () => pressFn('cos('), 'fn'),
     key('tan', () => pressFn('tan('), 'fn'), key('(', () => pressParen('('), 'fn')],
    [key('sin⁻¹', () => pressFn('asin('), 'fn', 'sin invers'), key('cos⁻¹', () => pressFn('acos('), 'fn', 'cos invers'),
     key('tan⁻¹', () => pressFn('atan('), 'fn', 'tan invers'), key(')', () => pressParen(')'), 'fn')],
    [key('log', () => pressFn('log('), 'fn'), key('ln', () => pressFn('ln('), 'fn'),
     key('√', () => pressFn('sqrt('), 'fn', 'akar'), key('!', () => pressPost('!'), 'fn', 'faktorial')],
    [key('x²', pressSquare, 'fn', 'pangkat dua'), key('xʸ', () => pressOp('^'), 'fn', 'pangkat'),
     key('π', () => pressConst('pi'), 'fn', 'pi'), key('e', () => pressConst('e'), 'fn', 'konstanta e')],
  ].forEach((row) => row.forEach((b) => sciGrid.appendChild(b)));

  [
    [key('C', pressClear, 'clr', 'Hapus semua'), key('⌫', pressBack, '', 'Hapus satu karakter'),
     key('%', () => pressPost('%'), 'op', 'persen'), key('÷', () => pressOp('/'), 'op', 'bagi')],
    [key('7', () => pressDigit('7')), key('8', () => pressDigit('8')),
     key('9', () => pressDigit('9')), key('×', () => pressOp('*'), 'op', 'kali')],
    [key('4', () => pressDigit('4')), key('5', () => pressDigit('5')),
     key('6', () => pressDigit('6')), key('−', () => pressOp('-'), 'op', 'kurang')],
    [key('1', () => pressDigit('1')), key('2', () => pressDigit('2')),
     key('3', () => pressDigit('3')), key('+', () => pressOp('+'), 'op', 'tambah')],
    [key('±', pressNegate, '', 'ubah tanda'), key('0', () => pressDigit('0')),
     key(',', pressDot, '', 'koma'), key('=', evaluateNow, 'eq', 'hitung')],
  ].forEach((row) => row.forEach((b) => basicGrid.appendChild(b)));

  function onKey(e) {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const k = e.key;
    // Enter/spasi di atas tombol biarkan klik aslinya yang jalan.
    if (t && t.tagName === 'BUTTON' && (k === 'Enter' || k === ' ')) return;
    if (/^[0-9]$/.test(k)) pressDigit(k);
    else if (k === '.' || k === ',') pressDot();
    else if (k === '+' || k === '-') pressOp(k);
    else if (k === '*' || k === 'x' || k === 'X') pressOp('*');
    else if (k === '/') { e.preventDefault(); pressOp('/'); }
    else if (k === '%') pressPost('%');
    else if (k === '^') pressOp('^');
    else if (k === '!') pressPost('!');
    else if (k === '(') pressParen('(');
    else if (k === ')') pressParen(')');
    else if (k === 'Enter' || k === '=') { e.preventDefault(); evaluateNow(); }
    else if (k === 'Backspace') { e.preventDefault(); pressBack(); }
    else if (k === 'Escape' || k === 'Delete') pressClear();
  }
  document.addEventListener('keydown', onKey);
  onLeave(() => document.removeEventListener('keydown', onKey));

  setMode(mode);
  setAngle(angleDeg);
  renderHist();
  refresh();
}
