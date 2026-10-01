import { h as T, utils, errBox, esc, preHtml } from '../../core.js?v=6.0.1';

export const meta = {"id": "robots-generator", "name": "Robots.txt Generator", "cat": "developer", "icon": "🤖", "desc": "Susun file robots.txt.", "keywords": "robots,seo,txt"};
export function render(root) {

    const rules = [];
    const ua = T.input('text', 'User-agent, misal: * atau Googlebot', '*');
    const pType = T.select([['disallow', 'Disallow (larang)'], ['allow', 'Allow (izinkan)']], 'disallow');
    const pPath = T.input('text', 'Path, misal: /admin/ atau /rahasia.pdf', '/');
    const listBox = T.el('<div style="margin:10px 0"></div>');
    const sitemap = T.input('text', 'https://contoh.com/sitemap.xml', '');
    const outBox = T.out();
    const paintList = () => {
      listBox.innerHTML = '';
      if (!rules.length) { listBox.appendChild(T.el('<div class="hint">Belum ada aturan. Tambahkan di atas.</div>')); return; }
      rules.forEach((r, i) => {
        const row = T.el('<div style="display:flex;align-items:center;gap:8px;background:#131316;border:1px solid #27272a;border-radius:8px;padding:8px 12px;margin-bottom:6px;font-size:13px;font-family:monospace"></div>');
        row.appendChild(T.el('<span style="flex:1">' + esc(r.ua) + ' → ' + esc(r.type) + ': ' + esc(r.path) + '</span>'));
        const del = T.btn('✕', () => { rules.splice(i, 1); paintList(); });
        del.style.padding = '4px 10px';
        row.appendChild(del);
        listBox.appendChild(row);
      });
    };
    const build = () => {
      const L = [];
      let lastUa = null;
      rules.forEach((r) => {
        if (r.ua !== lastUa) { if (L.length) L.push(''); L.push('User-agent: ' + r.ua); lastUa = r.ua; }
        L.push((r.type === 'allow' ? 'Allow: ' : 'Disallow: ') + r.path);
      });
      const sm = sitemap.value.trim();
      if (sm) { if (L.length) L.push(''); L.push('Sitemap: ' + sm); }
      return L.join('\n');
    };
    root.appendChild(T.grid2(T.field('User-agent', ua), T.field('Jenis', pType)));
    root.appendChild(T.field('Path', pPath));
    root.appendChild(T.row(T.btn('Tambah Aturan', () => {
      const path = pPath.value.trim() || '/';
      rules.push({ ua: ua.value.trim() || '*', type: pType.value, path });
      pPath.value = '';
      paintList();
    }, true)));
    root.appendChild(listBox);
    root.appendChild(T.field('Sitemap URL (opsional)', sitemap));
    root.appendChild(T.row(T.btn('Generate', () => {
      const c = build();
      if (!c) { T.show(outBox, errBox('Tambahkan minimal satu aturan dulu.')); return; }
      T.show(outBox, preHtml(c));
    }, true), T.copyBtn(() => build() || ''), T.dlBtn('robots.txt', () => build() || '', 'text/plain', 'Unduh robots.txt')));
    root.appendChild(outBox);
    paintList();
  
}
