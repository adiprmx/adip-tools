// Analisis presisi struktur tools-*.js memakai AST (acorn).
// Output JSON: definisi top-level + tiap tool (metadata, render body, identifier refs).
const acorn = require('acorn');
const fs = require('fs');

const CORE_GLOBALS = new Set([
  'document','window','localStorage','sessionStorage','fetch','console','setTimeout',
  'setInterval','clearTimeout','clearInterval','requestAnimationFrame','URL','URLSearchParams',
  'Blob','FileReader','Image','Audio','AudioContext','navigator','location','history',
  'Intl','Math','JSON','Object','Array','String','Number','Boolean','Date','RegExp','Error',
  'Promise','Map','Set','WeakMap','Symbol','BigInt','parseInt','parseFloat','isNaN',
  'isFinite','encodeURIComponent','decodeURIComponent','encodeURI','decodeURI','btoa','atob',
  'alert','confirm','crypto','performance','queueMicrotask','MutationObserver',
  'IntersectionObserver','ResizeObserver','FormData','File','CanvasGradient','devicePixelRatio',
  'getComputedStyle','customElements','Worker','undefined','NaN','Infinity','globalThis','self',
]);

// identifier yang memang datang dari core.js via import
const CORE_IMPORTED = new Set(['T', 'tools', 'utils']);

function analyze(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'module', locations: false });

  const topDefs = [];   // {name, start, end}
  const tools = [];     // {id,name,cat,icon,desc, renderStart, renderEnd, refs[]}

  for (const node of ast.body) {
    if (node.type === 'VariableDeclaration') {
      for (const d of node.declarations) {
        if (d.id.type === 'Identifier') {
          topDefs.push({ name: d.id.name, start: node.start, end: node.end,
                         refs: [...collectRefs({ type: 'BlockStatement', body: [
                           { type: 'ExpressionStatement', expression: d.init || { type: 'Identifier', name: '__none__' } }
                         ] }, [])].filter(x => x !== d.id.name && x !== '__none__') });
        }
      }
    } else if (node.type === 'FunctionDeclaration') {
      const pn = node.params.map(p => p.type === 'Identifier' ? p.name : null).filter(Boolean);
      topDefs.push({ name: node.id.name, start: node.start, end: node.end,
                     refs: [...collectRefs(node.body, node.params)].filter(x => x !== node.id.name) });
    } else if (node.type === 'ExpressionStatement' &&
               node.expression.type === 'AssignmentExpression') {
      const lhs = node.expression.left;
      // utils.X = ...  atau  U.X = ...
      if (lhs.type === 'MemberExpression' && !lhs.computed &&
          lhs.object.type === 'Identifier' && lhs.property.type === 'Identifier' &&
          (lhs.object.name === 'utils' || lhs.object.name === 'U')) {
        const nm = (lhs.object.name === 'U' ? 'U.' : 'utils.') + lhs.property.name;
        topDefs.push({ name: nm, start: node.start, end: node.end,
                       refs: [...collectRefs({ type: 'BlockStatement', body: [
                         { type: 'ExpressionStatement', expression: node.expression.right }
                       ] }, [])].filter(x => x !== nm) });
      }
    } else if (node.type === 'ExpressionStatement' &&
               node.expression.type === 'CallExpression') {
      // IIFE top-level: (function(){ ... utils.X = ...; })();
      // Diperlakukan sebagai definisi untuk tiap utils yang didaftarkannya.
      const callee = node.expression.callee;
      if (callee.type === 'FunctionExpression' || callee.type === 'ArrowFunctionExpression') {
        const provided = [];
        (function walk(n) {
          if (!n || typeof n.type !== 'string') return;
          if (n.type === 'AssignmentExpression' && n.left.type === 'MemberExpression' && !n.left.computed &&
              n.left.object.type === 'Identifier' &&
              (n.left.object.name === 'utils' || n.left.object.name === 'U') &&
              n.left.property.type === 'Identifier') {
            provided.push((n.left.object.name === 'U' ? 'U.' : 'utils.') + n.left.property.name);
          }
          for (const k of Object.keys(n)) {
            if (k === 'type' || k === 'start' || k === 'end') continue;
            const v = n[k];
            if (Array.isArray(v)) v.forEach(c => { if (c && typeof c.type === 'string') walk(c); });
            else if (v && typeof v.type === 'string') walk(v);
          }
        })(callee.body);
        if (provided.length) {
          const refs = [...collectRefs(callee.body, callee.params)];
          for (const p of provided) {
            topDefs.push({ name: p, start: node.start, end: node.end,
                           refs: refs.filter(x => x !== p), iife: true });
          }
        }
      }
    }
    if (node.type === 'ExpressionStatement' &&
               node.expression.type === 'CallExpression' &&
               node.expression.callee.type === 'Identifier' &&
               node.expression.callee.name === 'R') {
      const args = node.expression.arguments;
      if (args.length < 6) throw new Error('R() args < 6 di ' + file);
      const str = (n) => {
        if (args[n].type !== 'Literal') throw new Error('R() arg bukan literal di ' + file);
        return args[n].value;
      };
      const renderFn = args[5];
      if (renderFn.type !== 'ArrowFunctionExpression') throw new Error('render bukan arrow di ' + file);
      const body = renderFn.body; // BlockStatement
      // kumpulkan identifier refs di dalam body (rekursif, hormati scope lokal)
      const refs = collectRefs(body, renderFn.params);
      tools.push({
        id: str(0), name: str(1), cat: str(2), icon: str(3), desc: str(4),
        renderStart: body.start + 1, renderEnd: body.end - 1, // isi dalam kurung kurawal
        refs: [...refs].sort(),
      });
    }
  }
  return { topDefs, tools };
}

// Kumpulkan identifier yang dirujuk tapi tidak dideklarasikan di scope lokal.
// Mengembalikan juga pola utils.X / U.X yang dipakai.
function collectRefs(blockNode, params) {
  const declared = new Set();
  for (const p of params) {
    if (p.type === 'Identifier') declared.add(p.name);
  }
  const refs = new Set();
  const utilsRefs = new Set();

  function declPattern(pat) {
    if (!pat) return;
    if (pat.type === 'Identifier') declared.add(pat.name);
    else if (pat.type === 'ArrayPattern') pat.elements.forEach(declPattern);
    else if (pat.type === 'ObjectPattern') pat.properties.forEach(pr => {
      if (pr.type === 'Property') declPattern(pr.value);
      else if (pr.type === 'RestElement') declPattern(pr.argument);
    });
    else if (pat.type === 'RestElement') declPattern(pat.argument);
    else if (pat.type === 'AssignmentPattern') declPattern(pat.left);
  }

  function walk(node, parent) {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'VariableDeclaration':
        for (const d of node.declarations) {
          if (d.init) walk(d.init, d);
          declPattern(d.id);
        }
        return;
      case 'FunctionDeclaration':
        if (node.id) declared.add(node.id.name);
        // fallthrough ke function umum
        break;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression': {
        const saved = new Set(declared);
        if (node.id && node.id.type === 'Identifier') declared.add(node.id.name);
        node.params.forEach(declPattern);
        walk(node.body, node);
        declared.clear(); for (const x of saved) declared.add(x);
        return;
      }
      case 'Identifier': {
        // abaikan property: obj.prop (prop bukan ref), tapi obj-nya ref
        const isProp = parent && parent.type === 'MemberExpression' && parent.property === node && !parent.computed;
        if (!isProp && !declared.has(node.name) && !CORE_GLOBALS.has(node.name) && !CORE_IMPORTED.has(node.name)) {
          refs.add(node.name);
        }
        // deteksi utils.X / U.X
        if (parent && parent.type === 'MemberExpression' && parent.object === node && !parent.computed &&
            (node.name === 'utils' || node.name === 'U') &&
            parent.property.type === 'Identifier') {
          utilsRefs.add(node.name + '.' + parent.property.name);
        }
        return;
      }
      case 'Property':
        // key bukan ref (kecuali computed), value adalah ref
        if (node.computed) walk(node.key, node);
        walk(node.value, node);
        return;
      case 'MemberExpression':
        walk(node.object, node);
        if (node.computed) walk(node.property, node);
        return;
      case 'CatchClause':
        declPattern(node.param);
        walk(node.body, node);
        return;
    }
    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'start' || k === 'end' || k === 'loc' || k === 'range') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach(c => { if (c && typeof c.type === 'string') walk(c, node); });
      else if (v && typeof v.type === 'string') walk(v, node);
    }
  }

  // Jangan hitung ulang deklarasi di dalam; walk dengan declared awal = params
  // (sedikit penyederhanaan: hoisting var/function diabaikan, cukup untuk analisis dependensi)
  const stmts = blockNode.body || [];
  // pass 1: daftarkan semua deklarasi level-atas body (fungsi hoist + var)
  for (const s of stmts) {
    if (s.type === 'FunctionDeclaration' && s.id) declared.add(s.id.name);
    if (s.type === 'VariableDeclaration' && s.kind === 'var') s.declarations.forEach(d => declPattern(d.id));
  }
  for (const s of stmts) walk(s, blockNode);

  // gabung: refs biasa + utils.X/U.X (tanpa prefix objek karena objeknya sudah di CORE_IMPORTED)
  const out = new Set(refs);
  for (const u of utilsRefs) out.add(u);
  out.delete('utils'); out.delete('U'); out.delete('T'); out.delete('tools');
  return out;
}

const out = {};
for (const b of ['a', 'b', 'c', 'd', 'e']) {
  out[b] = analyze(`/home/hatch/workspace/projects/adip-tools/js/tools-${b}.js`);
}
fs.writeFileSync('/tmp/split/analysis.json', JSON.stringify(out, null, 1));
console.log('OK, tools:', Object.values(out).reduce((n, x) => n + x.tools.length, 0));
