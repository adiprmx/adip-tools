import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.12.2';

export const meta = {
  id: 'fake-dm-discord',
  name: 'Fake DM Discord',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z"/></svg>',
  desc: 'Bikin screenshot DM Discord palsu + unduh PNG.',
  keywords: 'discord,dm,chat,fake,palsu,screenshot,prank,android,iphone',
  since: '6.12.0',
};

/* Palet Discord (riset 15 Nov 2026, support.discord.com + DESIGN.md):
   Dark chat #313338, Onyx #111214, Light #FFFFFF, Blurple #5865F2,
   teks #DBDEE1, username #F2F3F5, waktu #949BA4, online #23A55A. */
const THEMES = {
  gelap: { bg: '#313338', fg: '#DBDEE1', name: '#F2F3F5', muted: '#949BA4', hdBg: '#313338', inputBg: '#1E1F22', inputPh: '#87898C', bdr: '#3F4147', navBg: '#2B2D31', navFg: '#B5BAC1', reactBg: 'rgba(88,101,242,.16)', reactBd: 'rgba(88,101,242,.45)' },
  onyx: { bg: '#111214', fg: '#DBDEE1', name: '#F2F3F5', muted: '#949BA4', hdBg: '#111214', inputBg: '#1E1F22', inputPh: '#87898C', bdr: '#232428', navBg: '#111214', navFg: '#B5BAC1', reactBg: 'rgba(88,101,242,.16)', reactBd: 'rgba(88,101,242,.45)' },
  terang: { bg: '#FFFFFF', fg: '#313338', name: '#060607', muted: '#6D6F78', hdBg: '#FFFFFF', inputBg: '#EBEDEF', inputPh: '#6D6F78', bdr: '#E3E5E8', navBg: '#F2F3F5', navFg: '#6D6F78', reactBg: 'rgba(88,101,242,.12)', reactBd: 'rgba(88,101,242,.4)' },
};
const STATUS = {
  online: { label: 'Online', color: '#23A55A' },
  idle: { label: 'Idle', color: '#F0B232' },
  dnd: { label: 'Do Not Disturb', color: '#F23F43' },
  offline: { label: 'Offline', color: '#80848E' },
};

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CHEV = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
const SVG_PHONE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VIDEO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const SVG_GIFT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
const SVG_EMOJI = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.4 2.1 3.8 2.1 3.8-2.1 3.8-2.1"/><line x1="9.2" y1="9.4" x2="9.2" y2="9.4"/><line x1="14.8" y1="9.4" x2="14.8" y2="9.4"/></svg>';
const SVG_MIC = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="18" x2="12" y2="21.5"/></svg>';
const SVG_HOME = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5l9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/></svg>';
const SVG_GRID = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
const SVG_BELL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

const SAMPLE =
  'A|09:12: woy, servernya udah jadi\n' +
  'A|09:12: cek channel #pengumuman\n' +
  'B|09:13: OTW cek\n' +
  'B|09:14|react=🔥: GILA keren banget\n' +
  'A|09:15: wkwk makasih, semalem begadang bikinnya';

/* Format: A|09:12: teks | B|09:13|react=🔥,😂: teks */
function parseMsgs(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const ci = line.search(/:(?!\d)/);
    if (ci < 0) return;
    const pre = line.slice(0, ci).trim();
    const msg = line.slice(ci + 1).trim();
    if (!msg) return;
    const parts = pre.split('|').map((s) => s.trim());
    const side = parts[0].toUpperCase() === 'B' ? 'B' : 'A';
    let time = '', react = [];
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^react=/i.test(p)) react = p.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
    });
    out.push({ side, time, msg, react });
  });
  return out;
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fdd-ctl{display:grid;gap:10px;margin-bottom:12px}
.fdd-phone{max-width:400px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#313338;font-family:"gg sans","Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fdd-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px}
.fdd-hd{display:flex;align-items:center;height:56px;padding:0 10px 0 2px}
.fdd-bk{background:none;border:0;padding:10px 6px 10px 10px;cursor:pointer;display:flex;align-items:center}
.fdd-avwrap{position:relative;flex:none}
.fdd-av{width:36px;height:36px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;overflow:hidden}
.fdd-av img{width:100%;height:100%;object-fit:cover;display:block}
.fdd-dot{position:absolute;right:-1px;bottom:-1px;width:13px;height:13px;border-radius:50%;border:3px solid #313338}
.fdd-dot.fdd-dnd::after{content:"";position:absolute;left:1px;top:4px;width:6px;height:2.5px;border-radius:1px;background:#313338}
.fdd-dot.fdd-idle::after{content:"";position:absolute;left:1px;top:1px;width:7px;height:7px;border-radius:50%;background:#313338}
.fdd-nm{flex:1;min-width:0;margin-left:9px}
.fdd-nm b{display:block;font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fdd-nm span{display:block;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fdd-hic{display:flex;align-items:center;gap:20px;padding-right:8px;flex:none}
.fdd-chat{padding:6px 0 10px;min-height:320px}
.fdd-welcome{padding:18px 16px 8px}
.fdd-wav{width:80px;height:80px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700;overflow:hidden;margin-bottom:12px}
.fdd-wav img{width:100%;height:100%;object-fit:cover;display:block}
.fdd-wname{font-size:22px;font-weight:700;margin:0 0 4px}
.fdd-whandle{font-size:14px;margin:0 0 8px}
.fdd-wtext{font-size:14px;line-height:1.5;margin:0}
.fdd-div{display:flex;align-items:center;gap:10px;padding:10px 16px 6px}
.fdd-div::before,.fdd-div::after{content:"";flex:1;height:1px;background:var(--fdd-bdr)}
.fdd-div span{font-size:12px;font-weight:700;white-space:nowrap}
.fdd-msg{display:flex;gap:12px;padding:2px 16px;margin-top:14px}
.fdd-msg.fdd-cont{margin-top:1px}
.fdd-msg.fdd-cont .fdd-mav{visibility:hidden}
.fdd-mav{width:40px;height:40px;border-radius:50%;flex:none;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:600;overflow:hidden}
.fdd-mav img{width:100%;height:100%;object-fit:cover;display:block}
.fdd-mbody{flex:1;min-width:0}
.fdd-mhead{display:flex;align-items:baseline;gap:8px;line-height:1.3}
.fdd-mhead b{font-size:16px;font-weight:600}
.fdd-mhead span{font-size:12px}
.fdd-mtext{font-size:16px;line-height:1.35;margin-top:1px;overflow-wrap:break-word;white-space:pre-wrap}
.fdd-reacts{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.fdd-react{display:inline-flex;align-items:center;gap:5px;border-radius:8px;padding:4px 8px;font-size:14px;border:1px solid var(--fdd-rbd);background:var(--fdd-rbg)}
.fdd-react b{font-size:13px;font-weight:600}
.fdd-ibar{display:flex;align-items:center;gap:6px;padding:8px 12px 10px}
.fdd-plus{width:32px;height:32px;flex:none;border-radius:50%;background:#B5BAC1;color:#313338;display:flex;align-items:center;justify-content:center}
.fdd-pill{flex:1;display:flex;align-items:center;border-radius:22px;min-height:44px;padding:0 12px;gap:10px}
.fdd-ph{flex:1;font-size:16px;white-space:nowrap;overflow:hidden}
.fdd-tic{flex:none;display:flex;align-items:center}
.fdd-tabbar{display:flex;align-items:center;justify-content:space-around;padding:10px 8px 8px}
.fdd-tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:600}
.fdd-tab.fdd-on{color:#F2F3F5}
.fdd-tab .fdd-tav{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;overflow:hidden}
.fdd-tab .fdd-tav img{width:100%;height:100%;object-fit:cover;display:block}
.fdd-nav{display:flex;justify-content:center;padding:4px 0 9px}
.fdd-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(255,255,255,.4)}
.fdd-home{display:flex;justify-content:center;align-items:center;height:20px}
.fdd-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(255,255,255,.4)}
.fdd-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px}
.fdd-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fdd-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fdd-hint code{font-family:monospace;font-size:11.5px}
.fdd-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fdd-ctl"></div>');
  const inNameA = T.input('text', 'Username lawan', 'rizky.png');
  const inNameB = T.input('text', 'Username sendiri', 'adip.rmx');
  const selStatus = T.select([['online', 'Online (hijau)'], ['idle', 'Idle (kuning)'], ['dnd', 'Do Not Disturb (merah)'], ['offline', 'Offline (abu-abu)']], 'online');
  const selTheme = T.select([['gelap', 'Gelap (Dark)'], ['onyx', 'Onyx (hitam pekat)'], ['terang', 'Terang']], 'gelap');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const inDiv = T.input('text', 'Pembatas tanggal', '15 November 2026');
  const selWelcome = T.select([['1', 'Tampilkan'], ['0', 'Sembunyikan']], '1');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: A|10:30: halo', SAMPLE);

  const fiA = fileInput('image/*');
  fiA.style.display = 'none';
  const fiB = fileInput('image/*');
  fiB.style.display = 'none';
  let avA = null, avB = null;
  fiA.addEventListener('change', () => { if (fiA.files && fiA.files[0]) { avA = URL.createObjectURL(fiA.files[0]); draw(); } });
  fiB.addEventListener('change', () => { if (fiB.files && fiB.files[0]) { avB = URL.createObjectURL(fiB.files[0]); draw(); } });

  ctl.appendChild(T.field('Username lawan', inNameA));
  ctl.appendChild(T.field('Username sendiri', inNameB));
  ctl.appendChild(T.field('Status lawan', selStatus));
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Pembatas tanggal', inDiv));
  ctl.appendChild(T.field('Blok sambutan awal DM', selWelcome));
  ctl.appendChild(T.row(T.btn('📷 Avatar lawan', () => fiA.click()), T.btn('📷 Avatar sendiri', () => fiB.click())));
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fdd-hint">Format: <code>A|10:30: halo</code> — <b>A</b>=lawan, <b>B</b>=kamu. Flag: <code>|react=🔥,😂</code> = reaksi di bawah pesan. Pesan berurutan dari orang yang sama otomatis dikelompokkan seperti Discord asli.</div>'));

  const phone = T.el('<div class="fdd-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNameA.value = 'rizky.png'; inNameB.value = 'adip.rmx'; selStatus.value = 'online';
      selTheme.value = 'gelap'; inDiv.value = '15 November 2026'; selWelcome.value = '1';
      taMsg.value = SAMPLE; avA = null; avB = null;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-dm-discord.png'), true)
  );

  function draw() {
    const th = THEMES[selTheme.value] || THEMES.gelap;
    const dark = selTheme.value !== 'terang';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nameA = inNameA.value.trim() || 'user';
    const nameB = inNameB.value.trim() || 'aku';
    const st = STATUS[selStatus.value] || STATUS.online;
    const divTxt = inDiv.value.trim();
    const showWelcome = selWelcome.value === '1';
    const msgs = parseMsgs(taMsg.value);
    const avHtmlA = avA ? '<img src="' + avA + '" alt="">' : T.esc((nameA[0] || '?').toUpperCase());
    const avHtmlB = avB ? '<img src="' + avB + '" alt="">' : T.esc((nameB[0] || '?').toUpperCase());
    const dotCls = selStatus.value === 'dnd' ? ' fdd-dnd' : selStatus.value === 'idle' ? ' fdd-idle' : '';

    let chatHtml = '';
    if (showWelcome) {
      chatHtml += '<div class="fdd-welcome">' +
        '<div class="fdd-wav" style="background:' + avaColor(nameA) + '">' + avHtmlA + '</div>' +
        '<p class="fdd-wname" style="color:' + th.name + '">' + T.esc(nameA) + '</p>' +
        '<p class="fdd-whandle" style="color:' + th.muted + '">@' + T.esc(nameA) + '</p>' +
        '<p class="fdd-wtext" style="color:' + th.muted + '">Ini awal riwayat DM kamu dengan <b style="color:' + th.name + '">@' + T.esc(nameA) + '</b>.</p>' +
        '</div>';
    }
    if (divTxt) chatHtml += '<div class="fdd-div"><span style="color:' + th.muted + '">' + T.esc(divTxt) + '</span></div>';

    let prevSide = null;
    msgs.forEach((m) => {
      const cont = m.side === prevSide;
      prevSide = m.side;
      const isA = m.side === 'A';
      const uname = isA ? nameA : nameB;
      const avHtml = isA ? avHtmlA : avHtmlB;
      const avBg = avaColor(uname);
      const headHtml = cont ? '' :
        '<div class="fdd-mhead"><b style="color:' + th.name + '">' + T.esc(uname) + '</b>' +
        (m.time ? '<span style="color:' + th.muted + '">Hari ini pukul ' + T.esc(m.time) + '</span>' : '') + '</div>';
      const reactHtml = m.react.length
        ? '<div class="fdd-reacts">' + m.react.map((r) => '<span class="fdd-react">' + T.esc(r) + '<b style="color:' + th.name + '">1</b></span>').join('') + '</div>'
        : '';
      chatHtml += '<div class="fdd-msg' + (cont ? ' fdd-cont' : '') + '">' +
        '<div class="fdd-mav" style="background:' + avBg + '">' + avHtml + '</div>' +
        '<div class="fdd-mbody">' + headHtml +
        '<div class="fdd-mtext" style="color:' + th.fg + '">' + T.esc(m.msg) + '</div>' + reactHtml +
        '</div></div>';
    });

    const sbHtml = '<div class="fdd-sb" style="background:' + th.hdBg + ';color:' + th.name + '">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    const hdHtml = '<div class="fdd-hd" style="background:' + th.hdBg + ';color:' + th.name + '">' +
      '<button class="fdd-bk" type="button" tabindex="-1" style="color:' + th.muted + '">' + (isIPh ? SVG_CHEV : SVG_BACK) + '</button>' +
      '<div class="fdd-avwrap"><div class="fdd-av" style="background:' + avaColor(nameA) + '">' + avHtmlA + '</div>' +
      '<span class="fdd-dot' + dotCls + '" style="background:' + st.color + ';border-color:' + th.hdBg + '"></span></div>' +
      '<div class="fdd-nm"><b>' + T.esc(nameA) + '</b><span style="color:' + st.color + '">' + T.esc(st.label) + '</span></div>' +
      '<div class="fdd-hic" style="color:' + th.muted + '">' + SVG_PHONE + SVG_VIDEO + '</div></div>';

    const ibarHtml = '<div class="fdd-ibar" style="background:' + th.bg + '">' +
      '<span class="fdd-plus">' + SVG_PLUS + '</span>' +
      '<div class="fdd-pill" style="background:' + th.inputBg + '">' +
      '<span class="fdd-ph" style="color:' + th.inputPh + '">Kirim pesan ke @' + T.esc(nameA) + '</span>' +
      '<span class="fdd-tic" style="color:' + th.muted + '">' + SVG_GIFT + '</span>' +
      '<span class="fdd-tic" style="color:' + th.muted + ';font-weight:700;font-size:13px">GIF</span>' +
      '<span class="fdd-tic" style="color:' + th.muted + '">' + SVG_EMOJI + '</span></div>' +
      '<span class="fdd-tic" style="color:' + th.muted + '">' + SVG_MIC + '</span></div>';

    const tabHtml = '<div class="fdd-tabbar" style="background:' + th.navBg + ';color:' + th.navFg + '">' +
      '<span class="fdd-tab fdd-on" style="color:' + th.name + '">' + SVG_HOME + '<span>Beranda</span></span>' +
      '<span class="fdd-tab">' + SVG_GRID + '<span>Server</span></span>' +
      '<span class="fdd-tab">' + SVG_BELL + '<span>Notifikasi</span></span>' +
      '<span class="fdd-tab"><span class="fdd-tav" style="background:' + avaColor(nameB) + '">' + avHtmlB + '</span><span>Kamu</span></span></div>' +
      (isIPh ? '<div class="fdd-home" style="background:' + th.navBg + '"><i></i></div>' : '<div class="fdd-nav" style="background:' + th.navBg + '"><i></i></div>');

    phone.className = 'fdd-phone';
    phone.style.background = th.bg;
    phone.style.color = th.fg;
    phone.style.setProperty('--fdd-bdr', th.bdr);
    phone.style.setProperty('--fdd-rbg', th.reactBg);
    phone.style.setProperty('--fdd-rbd', th.reactBd);
    phone.innerHTML = sbHtml + hdHtml + '<div class="fdd-chat">' + chatHtml + '</div>' + ibarHtml + tabHtml + '<div class="fdd-pranktag-wrap" style="background:' + th.navBg + '"><span class="fdd-pranktag">palsu · cuma prank</span></div>';
  }

  [inNameA, inNameB, selStatus, selTheme, selPlatform, selBrand, inDiv, selWelcome, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fiA);
  root.appendChild(fiB);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fdd-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan DM Discord asli.') + '</div>'));
  draw();
}
