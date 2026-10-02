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
    '.' + P + '-stage{max-width:400px;margin:14px 0}' +
    /* frame HP: video gelap di atas, bottom sheet menempel di bawah */
    '.' + P + '-phone{position:relative;width:380px;height:660px;border-radius:22px;overflow:hidden;background:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.45)}' +
    '.' + P + '-backdrop{position:absolute;top:0;left:0;right:0;height:170px;background:radial-gradient(120% 90% at 50% 0%,#2a2a33 0%,#101014 60%,#060607 100%)}' +
    '.' + P + '-sb{position:absolute;top:0;left:0;right:0;z-index:20;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}' +
    '.' + P + '-sbrow{display:flex;align-items:center;justify-content:space-between;padding:9px 18px 0}' +
    '.' + P + '-clock{font-size:13px;font-weight:600;letter-spacing:.2px}' +
    '.' + P + '-sicons{display:inline-flex;align-items:center;gap:5px}' +
    '.' + P + '-island{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:150px;height:26px;background:#000;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}' +
    '.' + P + '-punch{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;background:rgba(0,0,0,.92);box-shadow:inset 0 0 2px #2a4a68}' +
    '.' + P + '-navpill{position:absolute;left:50%;transform:translateX(-50%);bottom:5px;width:100px;height:4px;border-radius:2px;background:rgba(255,255,255,.7);z-index:20}' +
    /* bottom sheet 75% viewport, radius 12pt hanya sudut atas */
    '.' + P + '-sheet{position:absolute;left:0;right:0;bottom:0;height:75%;border-radius:12px 12px 0 0;background:var(--' + P + '-bg);color:var(--' + P + '-tx);display:flex;flex-direction:column;z-index:10}' +
    /* header 48pt: grabber 36x4, judul 17/600, X kanan */
    '.' + P + '-head{position:relative;height:48px;flex:none;display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-grab{position:absolute;top:7px;left:50%;transform:translateX(-50%);width:36px;height:4px;border-radius:2px;background:var(--' + P + '-sub);opacity:.6}' +
    '.' + P + '-title{font-size:17px;font-weight:600;color:#fff}' +
    '.' + P + '-panel.light .' + P + '-title{color:#161823}' +
    '.' + P + '-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--' + P + '-sub);background:none;border:0;padding:6px;cursor:default;line-height:1}' +
    /* daftar komentar */
    '.' + P + '-list{flex:1;min-height:0;overflow-y:auto;padding:2px 0 8px}' +
    '.' + P + '-c{display:flex;gap:10px;padding:11px 16px;align-items:flex-start}' +
    '.' + P + '-av{width:36px;height:36px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700}' +
    '.' + P + '-mid{flex:1;min-width:0}' +
    '.' + P + '-pin{font-size:12px;color:#8a8b93;font-weight:500;margin-bottom:3px}' +
    '.' + P + '-uname{font-size:14px;font-weight:700;display:flex;align-items:center;gap:5px}' +
    '.' + P + '-vb{width:14px;height:14px;border-radius:50%;background:#20d5ec;color:#fff;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.' + P + '-txt{font-size:14px;line-height:1.45;margin-top:2px;word-break:break-word;font-weight:400}' +
    '.' + P + '-meta{font-size:12px;color:var(--' + P + '-sub);margin-top:5px}' +
    '.' + P + '-crlab{font-size:12px;color:var(--' + P + '-sub);margin-top:2px}' +
    '.' + P + '-like{display:flex;flex-direction:column;align-items:center;gap:3px;padding-top:14px;flex:none;min-width:34px}' +
    '.' + P + '-heart{font-size:18px;line-height:1;color:var(--' + P + '-sub)}' +
    '.' + P + '-n{font-size:12px;color:var(--' + P + '-sub)}' +
    /* compose bar: field 44pt bg #2F2F2F radius 4, tombol kirim pink */
    '.' + P + '-compose{flex:none;display:flex;align-items:center;gap:10px;padding:10px 14px 16px}' +
    '.' + P + '-field{flex:1;height:44px;background:var(--' + P + '-fld);border-radius:4px;display:flex;align-items:center;padding:0 14px;font-size:14px;color:var(--' + P + '-sub)}' +
    '.' + P + '-send{width:38px;height:38px;border-radius:50%;background:#FE2C55;color:#fff;border:0;flex:none;font-size:17px;line-height:1;cursor:default;display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-hint{font-size:12px;opacity:.65;line-height:1.6}' +
    '.' + P + '-note{font-size:12px;opacity:.65;margin-top:14px}';
  root.appendChild(css);

  const THEMES = {
    dark: { bg: '#161823', tx: '#f1f1f1', sub: '#a1a1a1', fld: '#2F2F2F' },
    light: { bg: '#ffffff', tx: '#161823', sub: '#72727c', fld: '#f1f1f2' }
  };

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let panel = null;

  const avColor = (u) => {
    let hsh = 0;
    for (let i = 0; i < u.length; i++) hsh = (hsh * 31 + u.charCodeAt(i)) >>> 0;
    return AV_COLORS[hsh % AV_COLORS.length];
  };

  function draw() {
    const th = THEMES[S.theme] || THEMES.dark;
    const isIPh = selPlatform.value === 'iphone';
    const chrome = isIPh ? '<span class="' + P + '-island"></span>' : '<span class="' + P + '-punch"></span>';
    const sbHtml = '<div class="' + P + '-sb">' + chrome +
      '<div class="' + P + '-sbrow"><span class="' + P + '-clock">9:41</span>' +
      '<span class="' + P + '-sicons">' + ICO_SIG + ICO_WIFI + ICO_BAT + '</span></div></div>';
    const lines = S.rows.split('\n').map((l) => l.trim()).filter(Boolean).map(parseLine);
    const rowsHtml = lines.map((c) => {
      const badge = c.v ? '<span class="' + P + '-vb">✓</span>' : '';
      const pin = c.pin ? '<div class="' + P + '-pin">Pinned</div>' : '';
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
      '<div class="' + P + '-panel ' + S.theme + '" style="--' + P + '-bg:' + th.bg + ';--' + P + '-tx:' + th.tx + ';--' + P + '-sub:' + th.sub + ';--' + P + '-fld:' + th.fld + '">' +
        '<div class="' + P + '-phone">' +
          '<div class="' + P + '-backdrop"></div>' +
          sbHtml +
          '<div class="' + P + '-sheet">' +
            '<div class="' + P + '-head"><span class="' + P + '-grab"></span>' +
              '<span class="' + P + '-title">Comments (' + T.esc(S.count) + ')</span>' +
              '<button class="' + P + '-x" tabindex="-1">✕</button></div>' +
            '<div class="' + P + '-list">' +
              (rowsHtml || '<div class="' + P + '-c"><div class="' + P + '-mid" style="text-align:center;color:var(--' + P + '-sub);font-size:13px">Belum ada komentar</div></div>') +
            '</div>' +
            '<div class="' + P + '-compose">' +
              '<div class="' + P + '-field">Add comment...</div>' +
              '<button class="' + P + '-send" tabindex="-1">➤</button>' +
            '</div>' +
          '</div>' +
          '<div class="' + P + '-navpill"></div>' +
        '</div>' +
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

  const btnEx = T.btn('🎲 Contoh', () => {
    S.count = '1.234';
    S.rows = 'adip.rmx|2h|1,2 rb|v|pin: Beatnya gila sih 🔥🔥\nbudi.santoso|45m|856: Kapan rilis fullnya bang?\nsiti.aja|1h|2,1 rb|v|creator: Ditunggu ya, minggu depan rilis!';
    inCount.value = S.count; taRows.value = S.rows;
    draw();
  });
  const btnDl = T.btn('⬇️ Unduh PNG', () => dlNodePng(panel, 'fake-komen-tiktok.png'), true);

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
