import { h as T, utils, errBox, esc } from '../../core.js?v=6.5.0';

export const meta = {"id": "regex-tester", "name": "Regex Tester", "cat": "developer", "icon": "🔍", "desc": "Tes regex + highlight hasil.", "keywords": "regex,tes,pola"};
export function render(root) {

    const pat = T.input('text', 'Pattern, misal: \\d{4}-\\d{2}-\\d{2}', '');
    const mkFlag = (f, label) => T.el('<label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" value="' + f + '"' + (f === 'g' ? ' checked' : '') + '> ' + label + '</label>');
    const fG = mkFlag('g', 'global'), fI = mkFlag('i', 'abaikan kapital'), fM = mkFlag('m', 'multiline'), fS = mkFlag('s', 'dotAll');
    const txt = T.ta(6, 'Teks untuk diuji…');
    const box = T.out();
    const run = () => {
      const flags = [fG, fI, fM, fS].filter((c) => c.querySelector('input').checked).map((c) => c.querySelector('input').value).join('');
      let re;
      try { re = new RegExp(pat.value, flags); }
      catch (e) { T.show(box, errBox('Regex tidak valid: ' + e.message)); return; }
      const src = txt.value;
      if (!re.global) {
        const m = re.exec(src);
        if (!m) { T.show(box, '<span class="warn">Tidak ada yang cocok.</span>'); return; }
        T.show(box, hl(src, [m]) + grpHtml([m]));
        return;
      }
      const matches = [];
      re.lastIndex = 0;
      let m, guard = 0;
      while ((m = re.exec(src)) !== null && guard++ < 500) {
        matches.push(m);
        if (m[0] === '') re.lastIndex++;
      }
      if (!matches.length) { T.show(box, '<span class="warn">Tidak ada yang cocok.</span>'); return; }
      T.show(box, hl(src, matches) + grpHtml(matches));
    };
    const hl = (src, matches) => {
      let out = '', last = 0;
      matches.forEach((m) => {
        const s = m.index, e = s + m[0].length;
        out += esc(src.slice(last, s));
        out += '<mark style="background:#eab308;color:#000;border-radius:3px;padding:0 2px">' + esc(m[0] || '∅') + '</mark>';
        last = e;
      });
      out += esc(src.slice(last));
      return '<div style="white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.7;background:#0d0d0f;border:1px solid #27272a;border-radius:8px;padding:12px;margin-bottom:10px">' + out + '</div>';
    };
    const grpHtml = (matches) => {
      let html = '<div class="hint" style="margin-bottom:6px">' + matches.length + ' cocok ditemukan</div>';
      matches.slice(0, 20).forEach((m, i) => {
        const groups = [];
        for (let g = 1; g < m.length; g++) groups.push('g' + g + '=' + JSON.stringify(m[g]));
        if (m.groups) Object.keys(m.groups).forEach((k) => groups.push(k + '=' + JSON.stringify(m.groups[k])));
        html += '<div style="font-size:12px;font-family:monospace;background:#131316;border:1px solid #27272a;border-radius:6px;padding:6px 10px;margin-bottom:6px">#' + (i + 1) + ' @' + m.index + ': ' + esc(JSON.stringify(m[0])) + (groups.length ? '<br><span class="dim">groups: </span>' + esc(groups.join(', ')) : '') + '</div>';
      });
      if (matches.length > 20) html += '<div class="hint">…dan ' + (matches.length - 20) + ' lagi</div>';
      return html;
    };
    root.appendChild(T.field('Pattern regex', pat));
    root.appendChild(T.row(fG, fI, fM, fS));
    root.appendChild(T.field('Teks uji', txt));
    root.appendChild(T.row(T.btn('Tes', run, true)));
    root.appendChild(box);
  
}
