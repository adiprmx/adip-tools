import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id": "generator-env", "name": "Generator .env", "cat": "developer", "icon": "⚙️", "desc": "Susun file .env dari template: Node.js, Laravel, Django, Next.js.", "keywords": "env,environment variable,dotenv,config,node,laravel,django,nextjs"};
export function render(root) {
  const TEMPLATES = {
    'node': {
      label: 'Node.js',
      rows: [
        ['PORT', '3000'],
        ['NODE_ENV', 'development'],
        ['DATABASE_URL', 'postgresql://user:password@localhost:5432/mydb'],
        ['JWT_SECRET', 'ganti-dengan-secret-acak-anda'],
        ['REDIS_URL', 'redis://localhost:6379']
      ]
    },
    'laravel': {
      label: 'Laravel',
      rows: [
        ['APP_NAME', 'Laravel'],
        ['APP_ENV', 'local'],
        ['APP_KEY', 'base64:isi-dengan-app-key-anda'],
        ['APP_DEBUG', 'true'],
        ['APP_URL', 'http://localhost'],
        ['DB_CONNECTION', 'mysql'],
        ['DB_HOST', '127.0.0.1'],
        ['DB_PORT', '3306'],
        ['DB_DATABASE', 'laravel'],
        ['DB_USERNAME', 'root'],
        ['DB_PASSWORD', '']
      ]
    },
    'django': {
      label: 'Django',
      rows: [
        ['DEBUG', 'True'],
        ['SECRET_KEY', 'ganti-dengan-django-secret-key-anda'],
        ['ALLOWED_HOSTS', 'localhost,127.0.0.1'],
        ['DATABASE_URL', 'sqlite:///db.sqlite3']
      ]
    },
    'nextjs': {
      label: 'Next.js',
      rows: [
        ['NEXT_PUBLIC_APP_URL', 'http://localhost:3000'],
        ['DATABASE_URL', 'postgresql://user:password@localhost:5432/mydb'],
        ['NEXTAUTH_SECRET', 'ganti-dengan-secret-acak-anda'],
        ['NEXTAUTH_URL', 'http://localhost:3000']
      ]
    }
  };

  const sel = T.select(Object.keys(TEMPLATES).map((k) => [k, TEMPLATES[k].label]), 'node');
  const rowsBox = T.el('<div style="display:flex;flex-direction:column;gap:8px;margin:10px 0"></div>');
  const out = T.out();

  const addRow = (k, v) => {
    const row = T.el('<div style="display:flex;gap:8px;align-items:center"></div>');
    const key = T.input('text', 'KEY', k || '');
    const val = T.input('text', 'value', v == null ? '' : v);
    key.style.fontFamily = 'monospace';
    key.style.flex = '1';
    val.style.flex = '2';
    const del = T.btn('✕', () => { row.remove(); });
    del.style.flexShrink = '0';
    row.appendChild(key);
    row.appendChild(val);
    row.appendChild(del);
    rowsBox.appendChild(row);
  };

  const loadTemplate = () => {
    rowsBox.innerHTML = '';
    TEMPLATES[sel.value].rows.forEach(([k, v]) => addRow(k, v));
  };

  const readRows = () => {
    const outRows = [];
    rowsBox.querySelectorAll('div').forEach((row) => {
      const ins = row.querySelectorAll('input');
      if (ins.length < 2) return;
      const k = ins[0].value.trim();
      const v = ins[1].value;
      if (k) outRows.push([k, v]);
    });
    return outRows;
  };

  const needQuote = (v) => /[\s#'"`]/.test(v) || v === '';
  const quoteVal = (v) => {
    if (!needQuote(v)) return v;
    return '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  };
  const buildEnv = () => readRows().map(([k, v]) => k + '=' + quoteVal(v)).join('\n');

  const showOutput = () => {
    const content = buildEnv();
    if (!content.trim()) { T.toast('Isi dulu minimal satu baris key=value'); return; }
    T.show(out, '');
    const pre = T.el('<pre style="white-space:pre-wrap;word-break:break-all;background:#12100d;border:1px solid #2e2823;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;font-family:monospace;max-height:260px;overflow:auto"></pre>');
    pre.textContent = content;
    out.appendChild(pre);
    out.appendChild(T.row(
      T.copyBtn(() => content, 'Salin'),
      T.dlBtn('.env', () => content, 'text/plain;charset=utf-8', 'Unduh .env')
    ));
    out.appendChild(T.el('<p class="hint">Jangan commit file .env ke git — masukkan ke .gitignore.</p>'));
  };

  sel.addEventListener('change', () => { loadTemplate(); T.hide(out); });

  root.appendChild(T.field('Template', sel, 'Semua nilai cuma contoh placeholder, ganti dengan punyamu sendiri.'));
  root.appendChild(T.el('<p class="hint" style="margin:4px 0 0">Daftar key=value:</p>'));
  root.appendChild(rowsBox);
  root.appendChild(T.row(
    T.btn('＋ Tambah baris', () => addRow('', '')),
    T.btn('Generate .env', showOutput, true)
  ));
  root.appendChild(out);
  loadTemplate();
}
