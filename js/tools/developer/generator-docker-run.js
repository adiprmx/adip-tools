import { h as T, utils } from '../../core.js?v=6.8.0';

export const meta = {"id": "generator-docker-run", "name": "Docker Run Builder", "cat": "developer", "icon": "🐳", "desc": "Rakit perintah docker run + docker-compose setara lewat form.", "keywords": "docker,container,compose,docker run,devops,deployment"};
export function render(root) {
  const image = T.input('text', 'mis. nginx:alpine', '');
  const cname = T.input('text', 'mis. web-saya (opsional)', '');

  const mkPairBox = (ph1, ph2) => {
    const box = T.el('<div style="display:flex;flex-direction:column;gap:8px"></div>');
    const add = (a, b) => {
      const row = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
      const i1 = T.input('text', ph1, a || ''); i1.style.flex = '1'; i1.style.fontFamily = 'monospace';
      const i2 = T.input('text', ph2, b || ''); i2.style.flex = '1'; i2.style.fontFamily = 'monospace';
      const del = T.btn('✕', () => row.remove()); del.style.flexShrink = '0';
      row.appendChild(i1); row.appendChild(i2); row.appendChild(del);
      box.appendChild(row);
    };
    return { box, add, read: () => {
      const rows = [];
      box.querySelectorAll('div').forEach((r) => {
        const ins = r.querySelectorAll('input');
        if (ins.length < 2) return;
        const a = ins[0].value.trim(), b = ins[1].value.trim();
        if (a && b) rows.push([a, b]);
      });
      return rows;
    }};
  };

  const ports = mkPairBox('host: 8080', 'container: 80');
  const vols = mkPairBox('host: /data', 'container: /app/data');
  const envs = mkPairBox('KEY', 'value');
  ports.add('8080', '80');

  const chk = (labelText, checked) => {
    const lb = T.el('<label style="display:flex;gap:8px;align-items:center;font-size:13.5px;cursor:pointer"></label>');
    const c = document.createElement('input');
    c.type = 'checkbox'; c.checked = !!checked;
    lb.appendChild(c);
    lb.appendChild(T.el('<span>' + T.esc(labelText) + '</span>'));
    return { lb, c };
  };
  const detach = chk('Jalan di background (-d)', true);
  const it = chk('Mode interaktif + TTY (-it)', false);
  const rm = chk('Hapus container setelah berhenti (--rm)', false);
  const restart = T.select([['no', 'no'], ['on-failure', 'on-failure'], ['always', 'always'], ['unless-stopped', 'unless-stopped']], 'no');

  const out = T.out();

  const sh = (s) => {
    s = String(s);
    if (/^[a-zA-Z0-9_@%+=:,./-]+$/.test(s) && s) return s;
    return "'" + s.replace(/'/g, "'\\''") + "'";
  };
  const svcName = (n) => n.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'app';

  const build = () => {
    const img = image.value.trim();
    if (!img) { T.show(out, '<div style="color:#ef4444;font-size:13px">Isi dulu image-nya, mis. <code>nginx:alpine</code>.</div>'); return; }
    const name = cname.value.trim();
    const P = ports.read(), V = vols.read(), E = envs.read();

    const parts = ['docker', 'run'];
    if (detach.c.checked) parts.push('-d');
    if (it.c.checked) parts.push('-it');
    if (rm.c.checked) parts.push('--rm');
    if (name) parts.push('--name', sh(name));
    if (restart.value !== 'no') parts.push('--restart', restart.value);
    P.forEach(([a, b]) => parts.push('-p', sh(a + ':' + b)));
    V.forEach(([a, b]) => parts.push('-v', sh(a + ':' + b)));
    E.forEach(([a, b]) => parts.push('-e', sh(a + '=' + b)));
    parts.push(sh(img));
    const cmd = parts.join(' ');

    const svc = svcName(name || img.split(':')[0]);
    const y = ['services:', '  ' + svc + ':', '    image: ' + img];
    if (name) y.push('    container_name: ' + name);
    if (detach.c.checked) y.push('    stdin_open: false');
    if (it.c.checked) { y.push('    stdin_open: true', '    tty: true'); }
    if (P.length) { y.push('    ports:'); P.forEach(([a, b]) => y.push('      - "' + a + ':' + b + '"')); }
    if (V.length) { y.push('    volumes:'); V.forEach(([a, b]) => y.push('      - "' + a + ':' + b + '"')); }
    if (E.length) { y.push('    environment:'); E.forEach(([a, b]) => y.push('      - ' + a + '=' + b)); }
    if (restart.value !== 'no') y.push('    restart: ' + restart.value);
    const compose = y.join('\n');

    const preCss = 'white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;font-family:monospace;overflow:auto';
    T.show(out, '');
    out.appendChild(T.el('<p class="hint" style="margin:0 0 4px">Perintah docker run:</p>'));
    const p1 = T.el('<pre style="' + preCss + '"></pre>'); p1.textContent = cmd; out.appendChild(p1);
    out.appendChild(T.row(T.copyBtn(() => cmd, 'Salin perintah')));
    out.appendChild(T.el('<p class="hint" style="margin:14px 0 4px">docker-compose.yml setara:</p>'));
    const p2 = T.el('<pre style="' + preCss + '"></pre>'); p2.textContent = compose; out.appendChild(p2);
    out.appendChild(T.row(T.copyBtn(() => compose, 'Salin compose')));
  };

  root.appendChild(T.field('Image *', image, 'Wajib diisi, mis. nginx:alpine atau postgres:16'));
  root.appendChild(T.field('Nama container', cname, 'Opsional — kalau kosong Docker yang kasih nama acak.'));
  root.appendChild(T.el('<p class="hint" style="margin:12px 0 4px">Port mapping (host → container):</p>'));
  root.appendChild(ports.box);
  root.appendChild(T.row(T.btn('＋ Tambah port', () => ports.add('', ''))));
  root.appendChild(T.el('<p class="hint" style="margin:12px 0 4px">Volume (host → container):</p>'));
  root.appendChild(vols.box);
  root.appendChild(T.row(T.btn('＋ Tambah volume', () => vols.add('', ''))));
  root.appendChild(T.el('<p class="hint" style="margin:12px 0 4px">Environment variable:</p>'));
  root.appendChild(envs.box);
  root.appendChild(T.row(T.btn('＋ Tambah env', () => envs.add('', ''))));
  root.appendChild(T.el('<p class="hint" style="margin:12px 0 4px">Opsi:</p>'));
  root.appendChild(T.row(detach.lb, it.lb, rm.lb));
  root.appendChild(T.field('Restart policy', restart));
  root.appendChild(T.row(T.btn('Generate', build, true)));
  root.appendChild(out);
}
