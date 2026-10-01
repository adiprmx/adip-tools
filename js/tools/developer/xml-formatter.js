import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=4.2.0';

function xmlPretty(src) {
    const doc = new DOMParser().parseFromString(String(src || ''), 'text/xml');
    const perr = doc.querySelector('parsererror');
    if (perr) return { error: perr.textContent.replace(/\s+/g, ' ').trim() };
    let out = '';
    const ind = (n) => '  '.repeat(n);
    const attrs = (n) => {
      let a = '';
      for (let i = 0; i < n.attributes.length; i++) {
        const at = n.attributes[i];
        a += ' ' + at.name + '="' + at.value + '"';
      }
      return a;
    };
    const onlyText = (n) => {
      let t = 0, el = 0;
      for (let i = 0; i < n.childNodes.length; i++) {
        const c = n.childNodes[i];
        if (c.nodeType === 3 && c.nodeValue.trim()) t++;
        else if (c.nodeType === 1) el++;
      }
      return t === 1 && el === 0;
    };
    const walk = (n, depth) => {
      if (n.nodeType === 3) {
        if (n.nodeValue.trim()) out += ind(depth) + esc(n.nodeValue.trim()) + '\n';
        return;
      }
      if (n.nodeType !== 1) return;
      const open = '<' + n.tagName + attrs(n) + '>';
      const kids = Array.prototype.filter.call(n.childNodes, (c) => c.nodeType === 1 || (c.nodeType === 3 && c.nodeValue.trim()));
      if (!kids.length) { out += ind(depth) + open.replace(/>$/, '/>') + '\n'; return; }
      if (onlyText(n)) {
        const txt = Array.prototype.filter.call(n.childNodes, (c) => c.nodeType === 3).map((c) => c.nodeValue.trim()).join('');
        out += ind(depth) + open + esc(txt) + '</' + n.tagName + '>\n';
        return;
      }
      out += ind(depth) + open + '\n';
      for (let i = 0; i < n.childNodes.length; i++) walk(n.childNodes[i], depth + 1);
      out += ind(depth) + '</' + n.tagName + '>\n';
    };
    const root = doc.documentElement;
    if (root) walk(root, 0);
    const decl = /<\?xml[^?]*\?>/.exec(String(src || ''));
    return { xml: (decl ? decl[0] + '\n' : '') + out.trim() + '\n' };
  }

export const meta = {"id": "xml-formatter", "name": "XML Formatter", "cat": "developer", "icon": "📰", "desc": "Rapikan & validasi XML."};

export function render(root) {

    const ta = T.ta(8, 'Paste XML di sini…');
    const box = T.out();
    root.appendChild(T.field('Input XML', ta));
    root.appendChild(T.row(
      T.btn('Rapikan', () => {
        const raw = ta.value.trim();
        if (!raw) { T.show(box, errBox('Tempel dulu XML-nya.')); return; }
        const r = xmlPretty(raw);
        if (r.error) T.show(box, errBox('XML tidak valid: ' + r.error));
        else T.show(box, preHtml(r.xml));
      }, true),
      T.btn('Validasi', () => {
        const raw = ta.value.trim();
        if (!raw) { T.show(box, errBox('Tempel dulu XML-nya.')); return; }
        const r = xmlPretty(raw);
        T.show(box, r.error ? errBox('XML tidak valid: ' + r.error) : '<span class="ok">✓ XML valid.</span>');
      })
    ));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : '')));
  
}
