import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.5';

export const meta = {"id":"fake-komen-tiktok","name":"Fake Komen TikTok","cat":"fakesos","icon":"🎶","desc":"Bikin screenshot komentar TikTok palsu + unduh PNG.","keywords":"tiktok,komentar,fake,palsu,screenshot,prank"};

const P = 'fkt5';

const AV_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ec4899'];

/* Ikon SVG ala TikTok (outline tipis, tanpa emoji/karakter) */
const IC = {
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  heartSm: '<svg width="11" height="11" viewBox="0 0 24 24" fill="#FE2C55"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  pin: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 2.6a1 1 0 0 1 1.4 0l4.5 4.5a1 1 0 0 1 0 1.4l-1.7 1.7-5.2 5.2.4 4.9a1 1 0 0 1-1.7.8l-2-2-6.1 6.1a1 1 0 0 1-1.4-1.4l6.1-6.1-2-2a1 1 0 0 1 .8-1.7l4.9.4 5.2-5.2 1.7-1.7a1 1 0 0 1 0-1.4l-4.5-4.5a1 1 0 0 1 0-1.4z" transform="rotate(12 12 12)"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#20D5EC"/><path d="M4.2 7.2l2 2 3.6-4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.6 14.2c.9 1.1 2.1 1.7 3.4 1.7s2.5-.6 3.4-1.7"/><circle cx="9" cy="9.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
  send: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.7 21.3l18.6-9.3a1 1 0 0 0 0-1.8L2.7 2.7a1 1 0 0 0-1.4 1.3l2.5 5.6a1 1 0 0 0 .6.6l9.4 2-9.4 2a1 1 0 0 0-.6.6l-2.5 5.6a1 1 0 0 0 1.4 1.3z"/></svg>',
  person: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c.6-4.2 4-6.8 8.5-6.8s7.9 2.6 8.5 6.8a1 1 0 0 1-1 1.1h-15a1 1 0 0 1-1-1.1z"/></svg>'
};

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
    '.' + P + '-phone{position:relative;width:380px;max-width:100%;aspect-ratio:380/660;height:auto;border-radius:22px;overflow:hidden;background:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.45)}' +
    '.' + P + '-backdrop{position:absolute;top:0;left:0;right:0;height:170px;background:radial-gradient(120% 90% at 50% 0%,#2a2a33 0%,#101014 60%,#060607 100%)}' +
    '.' + P + '-sb{position:absolute;top:0;left:0;right:0;z-index:20;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}' +
    '.' + P + '-sbrow{display:flex;align-items:center;justify-content:space-between;padding:9px 18px 0}' +
    '.' + P + '-navpill{position:absolute;left:50%;transform:translateX(-50%);bottom:5px;width:100px;height:4px;border-radius:2px;background:rgba(255,255,255,.7);z-index:20}' +
    /* bottom sheet 75% viewport, radius 12pt hanya sudut atas, bg #161823 */
    '.' + P + '-sheet{position:absolute;left:0;right:0;bottom:0;height:75%;border-radius:12px 12px 0 0;background:var(--' + P + '-bg);color:var(--' + P + '-tx);display:flex;flex-direction:column;z-index:10}' +
    /* header 48pt: grabber 36x4, judul 17/600, X kanan */
    '.' + P + '-head{position:relative;height:48px;flex:none;display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-pinbadge{display:inline-flex;align-items:center;gap:3px;background:var(--' + P + '-fld);color:var(--' + P + '-sub);font-size:11px;font-weight:600;line-height:1;padding:4px 7px;border-radius:5px;margin-right:6px;vertical-align:2px;white-space:nowrap}' +
    '.' + P + '-title{font-size:17px;font-weight:600;color:var(--' + P + '-tx)}' +
    '.' + P + '-x{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:var(--' + P + '-sub);background:none;border:0;padding:8px;cursor:default;line-height:0;display:flex;align-items:center}' +
    /* daftar komentar */
    '.' + P + '-list{flex:1;min-height:0;overflow-y:auto;padding:2px 0 8px}' +
    '.' + P + '-c{display:flex;gap:10px;padding:12px 16px;align-items:flex-start}' +
    '.' + P + '-av{width:36px;height:36px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700}' +
    '.' + P + '-mid{flex:1;min-width:0}' +
    '.' + P + '-uname{font-size:14px;font-weight:700;display:flex;align-items:center;gap:5px;color:var(--' + P + '-tx)}' +
    '.' + P + '-vb{display:inline-flex;flex:none;line-height:0}' +
    '.' + P + '-txt{font-size:14px;line-height:1.45;margin-top:2px;word-break:break-word;font-weight:400;color:var(--' + P + '-tx)}' +
    '.' + P + '-meta{font-size:12px;color:var(--' + P + '-sub);margin-top:6px;display:flex;align-items:center;gap:14px}' +
    '.' + P + '-crlab{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--' + P + '-sub);margin-top:4px}' +
    '.' + P + '-like{display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:12px;flex:none;min-width:40px;color:var(--' + P + '-sub)}' +
    '.' + P + '-heart{line-height:0}' +
    '.' + P + '-n{font-size:12px;color:var(--' + P + '-sub)}' +
    /* compose bar: avatar + field 44pt bg #2F2F2F radius 18 + @ + emoji + panah kirim abu */
    '.' + P + '-compose{flex:none;display:flex;align-items:center;gap:10px;padding:8px 12px 16px}' +
    '.' + P + '-meav{width:36px;height:36px;border-radius:50%;flex:none;background:var(--' + P + '-fld);color:var(--' + P + '-sub);display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-field{flex:1;height:44px;background:var(--' + P + '-fld);border-radius:18px;display:flex;align-items:center;padding:0 14px;font-size:14px;color:var(--' + P + '-sub)}' +
    '.' + P + '-icobtn{flex:none;color:var(--' + P + '-sub);line-height:0;display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-at{font-size:21px;font-weight:600;color:var(--' + P + '-sub);line-height:1;padding:0 2px}' +
    '.' + P + '-send{flex:none;color:var(--' + P + '-sub);line-height:0;display:flex;align-items:center;opacity:.85}' +
    '.' + P + '-hint{font-size:12px;opacity:.65;line-height:1.6}' +
    '.' + P + '-note{font-size:12px;opacity:.65;margin-top:14px}';
  root.appendChild(css);

  const THEMES = {
    dark: { bg: '#161823', tx: '#ffffff', sub: '#999999', grab: '#4c4c55', fld: '#2F2F2F' },
    light: { bg: '#ffffff', tx: '#161823', sub: '#8a8b93', grab: '#d8d8dc', fld: '#F1F1F2' }
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
    brandField.style.display = isIPh ? 'none' : '';
    const sbHtml = '<div class="' + P + '-sb">' +
      '<div class="' + P + '-sbrow">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div></div>';
    const lines = S.rows.split('\n').map((l) => l.trim()).filter(Boolean).map(parseLine);
    const rowsHtml = lines.map((c) => {
      const badge = c.v ? '<span class="' + P + '-vb">' + IC.check + '</span>' : '';
      const pin = c.pin ? '<span class="' + P + '-pinbadge">' + IC.pin + '<span>Disematkan</span></span>' : '';
      const cr = c.creator ? '<div class="' + P + '-crlab">' + IC.heartSm + '<span>Disukai oleh kreator</span></div>' : '';
      return '<div class="' + P + '-c">' +
        '<div class="' + P + '-av" style="background:' + avColor(c.user) + '">' + T.esc(c.user.charAt(0).toUpperCase() || '?') + '</div>' +
        '<div class="' + P + '-mid">' +
          '<div class="' + P + '-uname"><span>' + T.esc(c.user) + '</span>' + badge + '</div>' +
          '<div class="' + P + '-txt">' + pin + T.esc(c.text) + '</div>' +
          '<div class="' + P + '-meta"><span>' + T.esc(c.time) + '</span><span>Balas</span></div>' +
          cr +
        '</div>' +
        '<div class="' + P + '-like"><div class="' + P + '-heart">' + IC.heart + '</div><div class="' + P + '-n">' + T.esc(c.likes) + '</div></div>' +
      '</div>';
    }).join('');

    panel = T.el(
      '<div class="' + P + '-panel ' + S.theme + '" style="--' + P + '-bg:' + th.bg + ';--' + P + '-tx:' + th.tx + ';--' + P + '-sub:' + th.sub + ';--' + P + '-grab:' + th.grab + ';--' + P + '-fld:' + th.fld + '">' +
        '<div class="' + P + '-phone">' +
          '<div class="' + P + '-backdrop"></div>' +
          sbHtml +
          '<div class="' + P + '-sheet">' +
            '<div class="' + P + '-head">' +
              '<span class="' + P + '-title">' + T.esc(S.count) + ' komentar</span>' +
              '<button class="' + P + '-x" tabindex="-1">' + IC.x + '</button></div>' +
            '<div class="' + P + '-list">' +
              (rowsHtml || '<div class="' + P + '-c"><div class="' + P + '-mid" style="text-align:center;color:var(--' + P + '-sub);font-size:13px">Belum ada komentar</div></div>') +
            '</div>' +
            '<div class="' + P + '-compose">' +
              '<div class="' + P + '-meav">' + IC.person + '</div>' +
              '<div class="' + P + '-field">Tambahkan komentar...</div>' +
              '<span class="' + P + '-at">@</span>' +
              '<span class="' + P + '-icobtn">' + IC.emoji + '</span>' +
              '<span class="' + P + '-send">' + IC.send + '</span>' +
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
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  selBrand.addEventListener('change', () => { draw(); });
  const brandField = T.field('Merk HP', selBrand);

  const btnEx = T.btn('🎲 Contoh', () => {
    S.count = '1.234';
    S.rows = 'adip.rmx|2h|1,2 rb|v|pin: Beatnya gila sih 🔥🔥\nbudi.santoso|45m|856: Kapan rilis fullnya bang?\nsiti.aja|1h|2,1 rb|v|creator: Ditunggu ya, minggu depan rilis!';
    inCount.value = S.count; taRows.value = S.rows;
    draw();
    T.scrollToPreview(panel);
  });
  const btnDl = T.btn('⬇️ Unduh PNG', () => dlNodePng(panel, 'fake-komen-tiktok.png'), true);

  wrap.append(
    T.field('Jumlah komentar (judul)', inCount),
    T.field('Komentar (satu baris satu komentar)', taRows,
      'Format: username|waktu|like|v|pin|creator: teks — contoh: adip.rmx|2h|1,2 rb|v|pin: Keren bang!'),
    T.field('Platform', selPlatform),
    brandField,
    T.field('Tema', selTheme),
    T.row(btnEx, btnDl),
    stage,
    T.el('<p class="' + P + '-note">' + T.esc(LOCAL_NOTE) + '</p>')
  );
  root.appendChild(wrap);
  draw();
}
