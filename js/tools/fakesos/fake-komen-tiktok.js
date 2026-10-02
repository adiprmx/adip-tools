import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-komen-tiktok","name":"Fake Komen TikTok","cat":"fakesos","icon":"🎶","desc":"Bikin screenshot komentar TikTok palsu + unduh PNG.","keywords":"tiktok,komentar,fake,palsu,screenshot,prank"};

const P = 'fkt4';

const AV_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899'];

const ICO_SIG = '<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.7"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="0.7"/><rect x="9" y="3" width="3" height="9" rx="0.7"/><rect x="13.5" y="0" width="3" height="12" rx="0.7"/></svg>';
const ICO_WIFI = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 13 0"/><path d="M4 6.8a6.4 6.4 0 0 1 8 0"/><circle cx="8" cy="9.6" r="1.3" fill="currentColor" stroke="none"/></svg>';
const ICO_BAT = '<svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.45"/><rect x="2.5" y="2.5" width="14" height="7" rx="1.5" fill="currentColor"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.45"/></svg>';

function parseLine(line) {
  const c = { user: 'user', time: '2h', likes: '0', v: false, pin: false, creator: false, text: '' };
  const ci = line.indexOf(':');
  let head = '', text = line;
  if (ci >= 0) { head = line.slice(0, ci); text = line.slice(ci + 1); }
  else { head = ''; }
  c.text = text.trim();
  const segs = head.split('|').map((s) => s.trim()).filter(Boolean);
  if (segs.length) c.user = segs[0];
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i].toLowerCase();
    if (s === 'v') c.v = true;
    else if (s === 'pin') c.pin = true;
    else if (s === 'creator') c.creator = true;
    else if (/^\d+\s*(d|h|m|s|mnt|jam|hari|mgg|minggu|bln|thn|detik|dtk)/i.test(segs[i])) c.time = segs[i];
    else if (/\d/.test(segs[i])) c.likes = segs[i];
  }
  if (!c.text) c.text = '';
  return c;
}

export function render(root) {
  const S = {
    count: '1.234',
    theme: 'dark',
    rows: 'adip.rmx|2h|1,2 rb|v|pin: Beatnya gila sih 🔥🔥\nbudi.santoso|45m|856: Kapan rilis fullnya bang?\nsiti.aja|1h|2,1 rb|v|creator: Ditunggu ya, minggu depan rilis!'
  };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-panel{max-width:380px;border-radius:14px;overflow:hidden;margin:14px 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;border:1px solid var(--' + P + '-line);background:var(--' + P + '-bg);color:var(--' + P + '-tx)}' +
    '.' + P + '-head{position:relative;text-align:center;padding:14px 44px 12px;font-size:15px;font-weight:700;border-bottom:1px solid var(--' + P + '-line)}' +
    '.' + P + '-x{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--' + P + '-sub);background:none;border:0;padding:4px;cursor:default}' +
    '.' + P + '-c{display:flex;gap:10px;padding:12px 14px;align-items:flex-start}' +
    '.' + P + '-av{width:42px;height:42px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:700}' +
    '.' + P + '-mid{flex:1;min-width:0}' +
    '.' + P + '-pinlab{font-size:11px;color:var(--' + P + '-sub);margin-bottom:3px}' +
    '.' + P + '-uname{font-size:14px;font-weight:700;display:flex;align-items:center;gap:5px}' +
    '.' + P + '-vb{width:14px;height:14px;border-radius:50%;background:#20d5ec;color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.' + P + '-txt{font-size:14.5px;line-height:1.45;margin-top:2px;word-break:break-word}' +
    '.' + P + '-meta{font-size:12px;color:var(--' + P + '-sub);margin-top:5px}' +
    '.' + P + '-crlab{font-size:11px;color:var(--' + P + '-sub);margin-top:2px}' +
    '.' + P + '-like{display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:16px;flex:none;min-width:34px}' +
    '.' + P + '-heart{font-size:22px;line-height:1;color:var(--' + P + '-sub)}' +
    '.' + P + '-n{font-size:12px;color:var(--' + P + '-sub)}' +
    '.' + P + '-hint{font-size:12px;opacity:.65;line-height:1.6}' +
    '.' + P + '-note{font-size:12px;opacity:.65;margin-top:14px}' +
    '.' + P + '-sb{display:flex;justify-content:space-between;align-items:center;height:30px;padding:0 16px 0 20px;color:var(--' + P + '-tx)}' +
    '.' + P + '-sb.ios{height:38px;padding:0 20px 0 24px}' +
    '.' + P + '-clock{font-size:13px;font-weight:700;letter-spacing:.3px}' +
    '.' + P + '-sicons{display:flex;align-items:center;gap:5px}' +
    '.' + P + '-island{width:100px;height:26px;border-radius:14px;background:#000;flex:none}' +
    '.' + P + '-punch{width:12px;height:12px;border-radius:50%;background:#000;flex:none;box-shadow:0 0 0 2px rgba(128,128,128,.28)}' +
    '.' + P + '-homebar{display:flex;justify-content:center;padding:8px 0 7px}' +
    '.' + P + '-homebar span{width:134px;height:5px;border-radius:3px;background:var(--' + P + '-sub);opacity:.55}';
  root.appendChild(css);

  const THEMES = {
    dark: { bg: '#000000', tx: '#f1f1f1', sub: '#a1a1a1', line: '#2a2a2a' },
    light: { bg: '#ffffff', tx: '#161616', sub: '#727272', line: '#e8e8e8' }
  };

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  let panel = null;

  const avColor = (u) => {
    let hsh = 0;
    for (let i = 0; i < u.length; i++) hsh = (hsh * 31 + u.charCodeAt(i)) >>> 0;
    return AV_COLORS[hsh % AV_COLORS.length];
  };

  function draw() {
    const th = THEMES[S.theme] || THEMES.dark;
    const isIPh = selPlatform.value === 'iphone';
    const sbHtml = isIPh
      ? '<div class="' + P + '-sb ios"><span class="' + P + '-clock">9:41</span><span class="' + P + '-island"></span><span class="' + P + '-sicons">' + ICO_SIG + ICO_WIFI + ICO_BAT + '</span></div>'
      : '<div class="' + P + '-sb"><span class="' + P + '-clock">9:41</span><span class="' + P + '-punch"></span><span class="' + P + '-sicons">' + ICO_SIG + ICO_WIFI + ICO_BAT + '</span></div>';
    const homeHtml = isIPh ? '<div class="' + P + '-homebar"><span></span></div>' : '';
    const lines = S.rows.split('\n').map((l) => l.trim()).filter(Boolean).map(parseLine);
    const rowsHtml = lines.map((c) => {
      const badge = c.v ? '<span class="' + P + '-vb">✓</span>' : '';
      const pin = c.pin ? '<div class="' + P + '-pinlab">📌 Disematkan</div>' : '';
      const cr = c.creator ? '<div class="' + P + '-crlab">❤️ oleh kreator</div>' : '';
      return '<div class="' + P + '-c">' +
        '<div class="' + P + '-av" style="background:' + avColor(c.user) + '">' + T.esc(c.user.charAt(0).toUpperCase() || '?') + '</div>' +
        '<div class="' + P + '-mid">' +
          pin +
          '<div class="' + P + '-uname">' + T.esc(c.user) + badge + '</div>' +
          '<div class="' + P + '-txt">' + T.esc(c.text) + '</div>' +
          '<div class="' + P + '-meta">' + T.esc(c.time) + ' · Balas</div>' +
          cr +
        '</div>' +
        '<div class="' + P + '-like"><div class="' + P + '-heart">♡</div><div class="' + P + '-n">' + T.esc(c.likes) + '</div></div>' +
      '</div>';
    }).join('');

    panel = T.el(
      '<div class="' + P + '-panel" style="--' + P + '-bg:' + th.bg + ';--' + P + '-tx:' + th.tx + ';--' + P + '-sub:' + th.sub + ';--' + P + '-line:' + th.line + '">' +
        sbHtml +
        '<div class="' + P + '-head">Komentar • ' + T.esc(S.count) + '<button class="' + P + '-x" tabindex="-1">✕</button></div>' +
        (rowsHtml || '<div class="' + P + '-c"><div class="' + P + '-mid" style="text-align:center;color:var(--' + P + '-sub);font-size:13px">Belum ada komentar</div></div>') +
        homeHtml +
      '</div>'
    );
    stage.innerHTML = '';
    stage.appendChild(panel);
  }

  const inCount = T.input('text', 'mis. 1.234', S.count);
  inCount.addEventListener('input', () => { S.count = inCount.value.trim() || '0'; draw(); });
  const taRows = T.ta(6, 'username|2h|1,2 rb|v|pin: teks komentar', S.rows);
  taRows.addEventListener('input', () => { S.rows = taRows.value; draw(); });
  const selTheme = T.select([['dark', 'Gelap'], ['light', 'Terang']], S.theme);
  selTheme.addEventListener('change', () => { S.theme = selTheme.value; draw(); });
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  selPlatform.addEventListener('change', () => { draw(); });

  const btnEx = T.btn('Contoh', () => {
    S.count = '1.234';
    S.rows = 'adip.rmx|2h|1,2 rb|v|pin: Beatnya gila sih 🔥🔥\nbudi.santoso|45m|856: Kapan rilis fullnya bang?\nsiti.aja|1h|2,1 rb|v|creator: Ditunggu ya, minggu depan rilis!';
    inCount.value = S.count; taRows.value = S.rows;
    selPlatform.value = 'android';
    draw();
  });
  const btnDl = T.btn('Unduh PNG', () => dlNodePng(panel, 'fake-komen-tiktok.png'), true);

  const stage = T.el('<div></div>');

  wrap.append(
    T.field('Jumlah komentar (judul)', inCount),
    T.field('Komentar (satu baris satu komentar)', taRows,
      'Format: username|waktu|like|v|pin|creator: teks — contoh: adip.rmx|2h|1,2 rb|v|pin: Keren bang!'),
    T.field('Platform', selPlatform),
    T.field('Tema', selTheme),
    T.row(btnEx, btnDl),
    stage,
    T.el('<p class="' + P + '-note">' + T.esc(LOCAL_NOTE) + '</p>')
  );
  root.appendChild(wrap);
  draw();
}
