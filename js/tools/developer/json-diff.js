import { h as T, errBox, esc } from '../../core.js?v=6.13.0';

// Bandingkan dua JSON secara rekursif. Hasil: daftar jalur yang
// ditambah, dihapus, atau berubah nilainya, plus ringkasan jumlah.
function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function shortVal(v) {
  if (v === undefined) return 'tidak ada';
  const s = JSON.stringify(v);
  return s.length > 80 ? s.slice(0, 77) + '…' : s;
}

function diffWalk(a, b, path, out) {
  if (Object.is(a, b)) return;
  if (isObj(a) && isObj(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const p = path ? path + '.' + k : k;
      if (!(k in a)) out.push({ kind: 'add', path: p, b: b[k] });
      else if (!(k in b)) out.push({ kind: 'del', path: p, a: a[k] });
      else diffWalk(a[k], b[k], p, out);
    }
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const p = path + '[' + i + ']';
      if (i >= a.length) out.push({ kind: 'add', path: p, b: b[i] });
      else if (i >= b.length) out.push({ kind: 'del', path: p, a: a[i] });
      else diffWalk(a[i], b[i], p, out);
    }
    return;
  }
  out.push({ kind: 'chg', path: path || '(isi)', a, b });
}

export const meta = {"id": "json-diff", "name": "JSON Diff", "cat": "developer", "icon": "🔀", "desc": "Bandingkan dua JSON, lihat apa yang beda.", "keywords": "json,diff,banding,compare,beda", "since": "6.11.0"};
export function render(root) {

    const taA = T.ta(7, 'Tempel JSON pertama di sini…');
    const taB = T.ta(7, 'Tempel JSON kedua di sini…');
    taA.style.fontFamily = 'ui-monospace,monospace'; taB.style.fontFamily = 'ui-monospace,monospace';
    taA.spellcheck = false; taB.spellcheck = false;
    const onlyDiff = T.el('<label class="pick"><input type="checkbox" checked style="width:20px;height:20px"> <span>Hanya tampilkan yang beda</span></label>');
    const box = T.out();
    let lastText = '';

    const run = () => {
      let a, b;
      try { a = JSON.parse(taA.value); } catch (e) { T.show(box, errBox('JSON pertama tidak benar. Periksa penulisannya, lalu coba lagi.')); return; }
      try { b = JSON.parse(taB.value); } catch (e) { T.show(box, errBox('JSON kedua tidak benar. Periksa penulisannya, lalu coba lagi.')); return; }
      const out = [];
      diffWalk(a, b, '', out);
      const nAdd = out.filter((d) => d.kind === 'add').length;
      const nDel = out.filter((d) => d.kind === 'del').length;
      const nChg = out.filter((d) => d.kind === 'chg').length;
      if (!out.length) {
        lastText = 'Kedua JSON sama persis.';
        T.show(box, '<span class="ok">✓ Kedua JSON sama persis.</span>');
        return;
      }
      const showOnlyDiff = onlyDiff.querySelector('input').checked;
      const lines = out.map((d) => {
        if (d.kind === 'add') return { cls: 'diff-add', sign: '+', text: d.path + ' = ' + shortVal(d.b) };
        if (d.kind === 'del') return { cls: 'diff-del', sign: '−', text: d.path + ' = ' + shortVal(d.a) };
        return { cls: 'diff-del', sign: '≠', text: d.path + ': ' + shortVal(d.a) + ' → ' + shortVal(d.b) };
      });
      lastText = lines.map((l) => l.sign + ' ' + l.text).join('\n');
      const summary = '<div style="font-size:13px;margin-bottom:10px">' +
        '<span style="color:#a9e5bb">+ ' + nAdd + ' ditambah</span> &nbsp; ' +
        '<span style="color:#fca5a5">− ' + nDel + ' dihapus</span> &nbsp; ' +
        '<span>≠ ' + nChg + ' berubah</span></div>';
      // Tampilan berdampingan: kiri = JSON pertama, kanan = JSON kedua (rapi).
      const side = showOnlyDiff ? '' :
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
        '<div><div class="hint" style="margin-bottom:4px">JSON pertama</div><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:10px;font-size:12px;line-height:1.5;max-height:220px;overflow:auto">' + esc(JSON.stringify(a, null, 2)) + '</pre></div>' +
        '<div><div class="hint" style="margin-bottom:4px">JSON kedua</div><pre style="white-space:pre-wrap;word-break:break-word;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:10px;font-size:12px;line-height:1.5;max-height:220px;overflow:auto">' + esc(JSON.stringify(b, null, 2)) + '</pre></div>' +
        '</div>';
      T.show(box, summary + side +
        '<div class="diffbox">' + lines.map((l) => '<div class="' + l.cls + '">' + esc(l.sign + ' ' + l.text) + '</div>').join('') + '</div>' +
        '<div class="hint" style="margin-top:8px">Array dibandingkan per posisi (indeks ke-0 dengan ke-0, dan seterusnya).</div>');
    };

    root.appendChild(T.grid2(T.field('JSON pertama', taA), T.field('JSON kedua', taB)));
    root.appendChild(onlyDiff);
    root.appendChild(T.row(T.btn('Bandingkan', run, true), T.copyBtn(() => lastText, 'Salin Hasil')));
    root.appendChild(box);
  
}
