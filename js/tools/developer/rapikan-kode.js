import { h as T, errBox, esc } from '../../core.js?v=6.12.2';

// Rapikan JSON, HTML, dan CSS secara ringan, tanpa pustaka berat.
// JavaScript sengaja TIDAK didukung: formatter JS yang benar butuh
// parser penuh (bobotnya besar untuk tool sekali pakai). Itu ditulis
// jujur di UI, bukan disembunyikan.
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TAGS = new Set(['script', 'style', 'pre', 'textarea']);

function formatJson(raw, indent) {
  return JSON.stringify(JSON.parse(raw), null, indent);
}

function tagName(tag) {
  const m = /^<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(tag);
  return m ? m[1].toLowerCase() : '';
}

function formatHtml(raw, indent) {
  const pad = ' '.repeat(indent);
  // Blok <script>/<style> diamankan dulu sebagai placeholder: isinya
  // sering mengandung "<" (misal if (a<b)) yang merusak tokenizer tag.
  const rawBlocks = [];
  const stashed = String(raw).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, (m) => {
    rawBlocks.push(m);
    return '\n<!--@@RAW' + (rawBlocks.length - 1) + '@@-->\n';
  });
  const tokens = stashed.split(/(<[^>]*>)/g).filter((t) => t !== '');
  const lines = [];
  let depth = 0, rawTag = null;
  for (const tok of tokens) {
    if (rawTag) {
      // Isi <script>/<style>/<pre>: jaga apa adanya, beri indent sekali.
      if (tok.startsWith('</') && tagName(tok) === rawTag) {
        depth = Math.max(0, depth - 1);
        lines.push(pad.repeat(depth) + tok.trim());
        rawTag = null;
      } else if (tok.trim()) {
        for (const l of tok.split('\n')) {
          if (l.trim()) lines.push(pad.repeat(depth) + l.trim());
        }
      }
      continue;
    }
    if (tok.startsWith('<')) {
      const t = tok.trim();
      if (!t) continue;
      const closing = t.startsWith('</');
      const name = tagName(t);
      const selfClose = /\/\s*>$/.test(t) || VOID_TAGS.has(name);
      const special = t.startsWith('<!') || t.startsWith('<?');
      if (closing) depth = Math.max(0, depth - 1);
      lines.push(pad.repeat(depth) + t);
      if (!closing && !selfClose && !special) {
        depth++;
        if (RAW_TAGS.has(name)) rawTag = name;
      }
    } else {
      const text = tok.replace(/\s+/g, ' ').trim();
      if (text) lines.push(pad.repeat(depth) + text);
    }
  }
  // Kembalikan blok script/style: baris pertama & terakhir sejajar indent,
  // isi di tengah diberi satu tingkat indent tambahan.
  return lines.join('\n').replace(/^(\s*)<!--@@RAW(\d+)@@-->$/gm, (_, ind, idx) => {
    const parts = rawBlocks[+idx].split('\n');
    if (parts.length === 1) return ind + parts[0].trim();
    return parts.map((p, i) => {
      if (!p.trim()) return '';
      if (i === 0 || i === parts.length - 1) return ind + p.trim();
      return ind + pad + p.trim();
    }).filter((l) => l !== '').join('\n');
  });
}

function formatCss(raw, indent) {
  const pad = ' '.repeat(indent);
  // Hapus komentar tapi simpan posisinya sebagai baris sendiri.
  const comments = [];
  const noComments = String(raw).replace(/\/\*[\s\S]*?\*\//g, (m) => {
    comments.push(m.trim());
    return '\n/*@@' + (comments.length - 1) + '@@*/\n';
  });
  let out = '', depth = 0, line = '', inStr = null;
  const flush = () => {
    const t = line.trim();
    if (t) {
      const m = /^\/\*@@(\d+)@@\*\/$/.exec(t);
      out += pad.repeat(depth) + (m ? comments[+m[1]] : t) + '\n';
    }
    line = '';
  };
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    if (inStr) {
      line += ch;
      if (ch === inStr && noComments[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = ch; line += ch; continue; }
    if (ch === '{') {
      line = line.trim() + ' {';
      flush();
      depth++;
      continue;
    }
    if (ch === '}') {
      // Deklarasi tanpa titik koma sebelum } diberi titik koma.
      const t = line.trim();
      if (t && t.includes(':') && !t.endsWith(';')) line = t + ';';
      flush();
      depth = Math.max(0, depth - 1);
      out += pad.repeat(depth) + '}\n';
      continue;
    }
    if (ch === ';') { line += ';'; flush(); continue; }
    if (ch === '\n' || ch === '\r') { line += ' '; continue; }
    line += ch;
  }
  flush();
  // Rapikan spasi ganda & spasi setelah titik dua di deklarasi.
  // Jaga indentasi awal baris: hanya isi baris yang dirapikan.
  return out.split('\n').map((l) => {
    const m = /^(\s*)(.*)$/.exec(l);
    let body = m[2].replace(/\s{2,}/g, ' ').replace(/\s+;/g, ';').replace(/\s+\{/g, ' {');
    // Spasi setelah titik dua hanya untuk deklarasi (berakhir ;),
    // bukan selector seperti a:hover atau @media (max-width: 600px).
    if (body.endsWith(';')) body = body.replace(/:\s*/, ': ');
    return m[1] + body;
  }).join('\n').replace(/\n{2,}/g, '\n').trim() + '\n';
}

export const meta = {"id": "rapikan-kode", "name": "Rapikan Kode", "cat": "developer", "icon": "✨", "desc": "Rapikan indentasi JSON, HTML & CSS.", "keywords": "format,rapi,json,html,css,indentasi,prettier", "since": "6.11.0"};
export function render(root) {

    const fmtSel = T.select([['json', 'JSON'], ['html', 'HTML'], ['css', 'CSS']], 'json');
    const indSel = T.select([['2', 'Indent 2 spasi'], ['4', 'Indent 4 spasi']], '2');
    const inp = T.ta(8, 'Tempel kode di sini…');
    inp.style.fontFamily = 'ui-monospace,monospace';
    inp.spellcheck = false;
    const outp = T.ta(8, 'Hasil rapi muncul di sini…');
    outp.style.fontFamily = 'ui-monospace,monospace';
    outp.readOnly = true;
    const status = T.out();
    let lastResult = '';

    const run = () => {
      const raw = inp.value;
      if (!raw.trim()) { T.show(status, errBox('Tempel dulu kodenya.')); return; }
      const ind = +indSel.value;
      try {
        if (fmtSel.value === 'json') lastResult = formatJson(raw, ind);
        else if (fmtSel.value === 'html') lastResult = formatHtml(raw, ind);
        else lastResult = formatCss(raw, ind);
        outp.value = lastResult;
        T.show(status, '<span class="ok">✓ Sudah rapi.</span>');
      } catch (e) {
        lastResult = '';
        T.show(status, errBox(fmtSel.value === 'json' ? 'JSON-nya tidak benar. Periksa penulisannya, lalu coba lagi.' : 'Tidak bisa dirapikan. Periksa kodenya, lalu coba lagi.'));
      }
    };

    root.appendChild(T.grid2(T.field('Jenis kode', fmtSel), T.field('Indentasi', indSel)));
    root.appendChild(T.field('Input', inp));
    root.appendChild(T.row(T.btn('Rapikan', run, true), T.copyBtn(() => lastResult, 'Salin Hasil')));
    root.appendChild(status);
    root.appendChild(T.field('Hasil', outp));
    root.appendChild(T.el('<div class="hint" style="margin-top:12px">Rapikan di sini bersifat ringan: indentasi dibuat konsisten dan struktur dibuat mudah dibaca. Isi &lt;script&gt;, &lt;style&gt;, dan &lt;pre&gt; dijaga apa adanya. JavaScript belum didukung karena formatter JS yang benar butuh parser berat yang tidak muat di tool ringan seperti ini.</div>'));
  
}
