import { h as T, utils } from '../../core.js?v=5.2.0';

utils.waFormat = function (text, kind) {
    const s = String(text == null ? '' : text);
    const wrap = { bold: '*', italic: '_', strike: '~', mono: '```' };
    const m = wrap[kind];
    if (!m) return s;
    return m + s + m;
  };

export const meta = {"id": "wa-formatter", "name": "WA Text Formatter", "cat": "teks", "icon": "✍️", "desc": "Teks biasa jadi format WhatsApp.", "keywords": "whatsapp,wa,format,teks,bold"};
export function render(root) {

      const taIn = T.ta(6, 'Ketik atau tempel teks di sini…');
      const fmtSel = T.select([['bold', '*Bold*'], ['italic', '_Italic_'], ['strike', '~Coret~'], ['mono', '```Mono```']], 'bold');
      const box = T.out();
      let last = '';

      function apply() {
        const txt = taIn.value;
        if (!txt) { T.toast('Tulis teks dulu'); return; }
        const kind = fmtSel.value;
        const s = taIn.selectionStart, e = taIn.selectionEnd;
        if (s != null && e != null && e > s) {
          const sel = txt.slice(s, e);
          last = txt.slice(0, s) + utils.waFormat(sel, kind) + txt.slice(e);
          taIn.value = last;
        } else {
          last = txt.split('\n').map((ln) => ln.trim() ? utils.waFormat(ln, kind) : ln).join('\n');
          taIn.value = last;
        }
        T.show(box, `<div class="hint">Hasil (format aktif saat ditempel ke WhatsApp):</div><pre class="pre">${T.esc(last)}</pre>`);
      }

      root.appendChild(T.el('<p class="note">Pilih sebagian teks (blok) untuk memformat bagian itu saja, atau biarkan tanpa blok untuk memformat semua baris.</p>'));
      root.appendChild(T.field('Teks', taIn));
      root.appendChild(T.row(
        fmtSel,
        T.btn('Terapkan', apply, true),
        T.copyBtn(() => taIn.value || last, 'Salin')
      ));
      root.appendChild(box);
    
}
