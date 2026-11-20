import { h as T, utils, errBox, esc, preHtml } from '../../core.js';

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
        // Nilai atribut WAJIB di-escape (& < > " ') — kalau tidak,
        // nilai berisi '"' atau '<' merusak output.
        a += ' ' + at.name + '="' + esc(at.value) + '"';
      }
      return a;
    };
    // Anak yang "berisi": elemen, teks tak-kosong, komentar, CDATA,
    // processing-instruction. Komentar/CDATA/PI ikut dihitung supaya
    // induknya tidak jadi self-closing dan isinya tidak hilang.
    const anakBerisi = (n) => {
      const out = [];
      for (let i = 0; i < n.childNodes.length; i++) {
        const c = n.childNodes[i];
        if (c.nodeType === 1 || c.nodeType === 4 || c.nodeType === 7 || c.nodeType === 8) out.push(c);
        else if (c.nodeType === 3 && c.nodeValue.trim()) out.push(c);
      }
      return out;
    };
    const onlyText = (n) => {
      const kids = anakBerisi(n);
      return kids.length === 1 && kids[0].nodeType === 3;
    };
    const walk = (n, depth) => {
      if (n.nodeType === 3) {
        if (n.nodeValue.trim()) out += ind(depth) + esc(n.nodeValue.trim()) + '\n';
        return;
      }
      // Komentar dipertahankan apa adanya (isinya tidak di-escape).
      if (n.nodeType === 8) { out += ind(depth) + '<!--' + n.nodeValue + '-->\n'; return; }
      // CDATA dipertahankan apa adanya (isinya tidak di-escape).
      if (n.nodeType === 4) { out += ind(depth) + '<![CDATA[' + n.nodeValue + ']]>\n'; return; }
      // Processing instruction, termasuk deklarasi <?xml ...?>.
      // (Di browser, DOMParser menelan deklarasi xml sehingga tidak
      // muncul di sini — deklarasi diambil lagi lewat regex di bawah.
      // Cabang ini menangani PI lain; PI 'xml' dilewati supaya tidak
      // ganda bila suatu parser menampilkannya.)
      if (n.nodeType === 7) {
        if (n.target === 'xml') return;
        out += ind(depth) + '<?' + n.target + (n.data ? ' ' + n.data : '') + '?>\n';
        return;
      }
      if (n.nodeType !== 1) return;
      const open = '<' + n.tagName + attrs(n) + '>';
      const kids = anakBerisi(n);
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
    // Jalan di SEMUA anak dokumen (bukan cuma elemen akar) supaya
    // komentar / processing-instruction di luar akar ikut selamat.
    // Deklarasi <?xml ...?> diambil lagi lewat regex karena DOMParser
    // menelannya (tidak muncul sebagai node).
    for (let i = 0; i < doc.childNodes.length; i++) walk(doc.childNodes[i], 0);
    const decl = /<\?xml[^?]*\?>/.exec(String(src || ''));
    return { xml: (decl ? decl[0] + '\n' : '') + out.trim() + '\n' };
  }

export { xmlPretty };

export const meta = {"id": "xml-formatter", "name": "XML Formatter", "cat": "developer", "icon": "📰", "desc": "Rapikan & validasi XML.", "keywords": "xml,format"};
export function render(root) {

    const ta = T.ta(8, 'Paste XML di sini…');
    const box = T.out();
    root.appendChild(T.field('Input XML', ta, 'Komentar, CDATA, dan petunjuk pemrosesan (<?...?>) dipertahankan.'));
    root.appendChild(T.row(
      T.btn('Rapikan', () => {
        const raw = ta.value.trim();
        if (!raw) { T.show(box, errBox('Tempel dulu XML-nya.')); return; }
        const r = xmlPretty(raw);
        if (r.error) T.show(box, errBox('XML-nya tidak benar: ' + r.error));
        else T.show(box, preHtml(r.xml));
      }, true),
      T.btn('Validasi', () => {
        const raw = ta.value.trim();
        if (!raw) { T.show(box, errBox('Tempel dulu XML-nya.')); return; }
        const r = xmlPretty(raw);
        T.show(box, r.error ? errBox('XML-nya tidak benar: ' + r.error) : '<span class="ok">✓ XML sudah benar.</span>');
      })
    ));
    root.appendChild(box);
    root.appendChild(T.row(T.copyBtn(() => box.querySelector('pre') ? box.querySelector('pre').textContent : '')));
  
}
