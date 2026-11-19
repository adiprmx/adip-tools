import { h as T, LOCAL_NOTE, dlNodePng, utils } from '../../core.js';

export const meta = {
  id: 'fake-pesan-discord',
  name: 'Fake Pesan Discord',
  cat: 'fakesos',
  icon: '🎮',
  desc: 'Bikin mockup pesan channel server Discord palsu: warna role, balasan, reaksi + unduh PNG.',
  keywords: 'discord,server,channel,role,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* DEDUP (G4 B15): BUKAN duplikat fake-dm-discord (6.12.0). Tool lama = DM
   1 lawan 1 (blok sambutan "awal riwayat DM", tab bar, tanpa role).
   Tool ini = pesan di CHANNEL SERVER: header #channel + nama server,
   banyak pengirim dengan WARNA ROLE, kutipan balasan, reaksi. Input dan
   tampilannya beda; preseden D-G4-08/D-G4-14. */
const ROLE = {
  admin: { label: 'Admin', color: '#ED4245' },
  mod: { label: 'Moderator', color: '#57F287' },
  member: { label: 'Member', color: '#F2F3F5' },
  vip: { label: 'VIP', color: '#FEE75C' },
  bot: { label: 'BOT', color: '#5865F2' },
  booster: { label: 'Booster', color: '#EB459E' },
};

const SAMPLE =
  'rizky|admin|09:12: @semua pengumuman: event minggu ini pindah ke hari Sabtu\n' +
  'dina|mod|09:13|r=@semua pengumuman: event minggu ini pindah ke hari Sabtu: siap, gue update jadwalnya\n' +
  'budi|member|09:14|react=🔥,🎉: GASSS\n' +
  'adip|booster|09:15: gue bawa snack ya\n' +
  'mee6|bot|09:15: Selamat datang di server!';

/* Format: nama|role|09:12: teks — role: admin/mod/member/vip/bot/booster.
   Flag: |r=teks yang dibalas |react=🔥,🎉 |warna=#hex (warna nama sendiri). */
export function parseMsgs(text) {
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
    const nama = parts[0] || 'user';
    let role = 'member', time = '', reply = '', react = [], warna = '';
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^r=/i.test(p)) reply = p.slice(2);
      else if (/^react=/i.test(p)) react = p.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
      else if (/^warna=#[0-9a-fA-F]{6}$/.test(p)) warna = p.slice(6);
      else if (ROLE[p.toLowerCase()]) role = p.toLowerCase();
    });
    out.push({ nama, role, time, msg, reply, react, warna: warna || ROLE[role].color });
  });
  return out;
}

const SVG_HASH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 3L7 21M17 3l-2 18M4 8h17M3 16h17"/></svg>';
const SVG_BELL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
const SVG_PIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>';
const SVG_USERS = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const SVG_PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const SVG_GIFT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
const SVG_EMOJI = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.4 2.1 3.8 2.1 3.8-2.1 3.8-2.1"/><line x1="9.2" y1="9.4" x2="9.2" y2="9.4"/><line x1="14.8" y1="9.4" x2="14.8" y2="9.4"/></svg>';

const THEMES = {
  gelap: { bg: '#313338', fg: '#DBDEE1', name: '#F2F3F5', muted: '#949BA4', hdBg: '#313338', inputBg: '#1E1F22', inputPh: '#87898C', bdr: '#3F4147' },
  terang: { bg: '#FFFFFF', fg: '#313338', name: '#060607', muted: '#6D6F78', hdBg: '#FFFFFF', inputBg: '#EBEDEF', inputPh: '#6D6F78', bdr: '#E3E5E8' },
};

export function render(root) {
  root.appendChild(T.el(`<style>
.fpdc-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpdc-phone{max-width:400px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#313338;font-family:"gg sans","Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpdc-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px}
.fpdc-hd{display:flex;align-items:center;height:52px;padding:0 12px;gap:8px;border-bottom:1px solid var(--fpdc-bdr)}
.fpdc-hd b{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpdc-hd span{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpdc-hic{display:flex;align-items:center;gap:18px;margin-left:auto;flex:none}
.fpdc-chat{padding:8px 0 10px;min-height:330px}
.fpdc-welcome{padding:16px 16px 6px}
.fpdc-welcome .fpdc-hash{width:68px;height:68px;border-radius:50%;background:#41434A;display:flex;align-items:center;justify-content:center;color:#DBDEE1;margin-bottom:10px}
.fpdc-welcome b{font-size:24px;font-weight:700}
.fpdc-welcome p{font-size:14px;line-height:1.5;margin:6px 0 0}
.fpdc-div{display:flex;align-items:center;gap:10px;padding:10px 16px 6px}
.fpdc-div::before,.fpdc-div::after{content:"";flex:1;height:1px;background:var(--fpdc-bdr)}
.fpdc-div span{font-size:12px;font-weight:700;white-space:nowrap}
.fpdc-msg{display:flex;gap:12px;padding:2px 16px;margin-top:14px}
.fpdc-msg.fpdc-cont{margin-top:1px}
.fpdc-msg.fpdc-cont .fpdc-mav{visibility:hidden}
.fpdc-mav{width:40px;height:40px;border-radius:50%;flex:none;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:600;overflow:hidden}
.fpdc-mbody{flex:1;min-width:0}
.fpdc-reply{display:flex;align-items:center;gap:6px;font-size:13.5px;margin-bottom:2px;opacity:.85}
.fpdc-reply i{font-style:normal;font-weight:600}
.fpdc-reply span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpdc-mhead{display:flex;align-items:baseline;gap:8px;line-height:1.3;flex-wrap:wrap}
.fpdc-mhead b{font-size:16px;font-weight:600}
.fpdc-mhead span{font-size:12px}
.fpdc-bot{background:#5865F2;color:#fff;font-size:10.5px;font-weight:700;padding:2px 5px;border-radius:4px;vertical-align:2px}
.fpdc-mtext{font-size:16px;line-height:1.35;margin-top:1px;overflow-wrap:break-word;white-space:pre-wrap}
.fpdc-reacts{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.fpdc-react{display:inline-flex;align-items:center;gap:5px;border-radius:8px;padding:4px 8px;font-size:14px;border:1px solid rgba(88,101,242,.45);background:rgba(88,101,242,.16)}
.fpdc-react b{font-size:13px;font-weight:600}
.fpdc-ibar{display:flex;align-items:center;gap:6px;padding:8px 12px 10px}
.fpdc-plus{width:32px;height:32px;flex:none;border-radius:50%;background:#B5BAC1;color:#313338;display:flex;align-items:center;justify-content:center}
.fpdc-pill{flex:1;display:flex;align-items:center;border-radius:22px;min-height:44px;padding:0 12px;gap:10px}
.fpdc-ph{flex:1;font-size:16px;white-space:nowrap;overflow:hidden}
.fpdc-nav{display:flex;justify-content:center;padding:4px 0 9px}
.fpdc-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(255,255,255,.4)}
.fpdc-home{display:flex;justify-content:center;align-items:center;height:20px}
.fpdc-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(255,255,255,.4)}
.fpdc-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px}
.fpdc-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fpdc-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fpdc-hint code{font-family:monospace;font-size:11.5px}
.fpdc-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fpdc-ctl"></div>');
  const inServer = T.input('text', 'Nama server', 'ADIP RMX Official');
  const inChannel = T.input('text', 'Nama channel (tanpa #)', 'pengumuman');
  const inTopik = T.input('text', 'Topik channel', 'Info & pengumuman server');
  const selTheme = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const inDiv = T.input('text', 'Pembatas tanggal', '19 November 2026');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: nama|role|10:30: halo', SAMPLE);

  ctl.appendChild(T.field('Nama server', inServer));
  ctl.appendChild(T.field('Nama channel', inChannel));
  ctl.appendChild(T.field('Topik channel', inTopik));
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Pembatas tanggal', inDiv));
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fpdc-hint">Format: <code>nama|role|10:30: pesan</code>. Role: <code>admin</code>, <code>mod</code>, <code>member</code>, <code>vip</code>, <code>bot</code>, <code>booster</code>. Flag: <code>|r=teks yang dibalas</code>, <code>|react=🔥,🎉</code>, <code>|warna=#hex</code>.</div>'));

  const phone = T.el('<div class="fpdc-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inServer.value = 'ADIP RMX Official'; inChannel.value = 'pengumuman';
      inTopik.value = 'Info & pengumuman server'; selTheme.value = 'gelap';
      inDiv.value = '19 November 2026'; taMsg.value = SAMPLE;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-pesan-discord.png'), true)
  );

  function draw() {
    const th = THEMES[selTheme.value] || THEMES.gelap;
    const dark = selTheme.value !== 'terang';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const server = inServer.value.trim() || 'Server';
    const channel = inChannel.value.trim() || 'umum';
    const topik = inTopik.value.trim();
    const divTxt = inDiv.value.trim();
    const msgs = parseMsgs(taMsg.value);

    let chatHtml = '<div class="fpdc-welcome"><div class="fpdc-hash">' + SVG_HASH + '</div>' +
      '<b style="color:' + th.name + '">Selamat datang di #' + T.esc(channel) + '!</b>' +
      '<p style="color:' + th.muted + '">Ini awal channel #' + T.esc(channel) + ' di server ' + T.esc(server) + '.</p></div>';
    if (divTxt) chatHtml += '<div class="fpdc-div"><span style="color:' + th.muted + '">' + T.esc(divTxt) + '</span></div>';

    let prevNama = null;
    msgs.forEach((m) => {
      const cont = m.nama === prevNama && !m.reply;
      prevNama = m.nama;
      const botTag = m.role === 'bot' ? '<span class="fpdc-bot">BOT</span>' : '';
      const headHtml = cont ? '' :
        '<div class="fpdc-mhead"><b style="color:' + m.warna + '">' + T.esc(m.nama) + '</b>' + botTag +
        (m.time ? '<span style="color:' + th.muted + '">Hari ini pukul ' + T.esc(m.time) + '</span>' : '') + '</div>';
      const replyHtml = m.reply
        ? '<div class="fpdc-reply" style="color:' + th.muted + '"><span>↩</span><i style="color:' + th.name + '">Membalas</i><span>' + T.esc(m.reply) + '</span></div>'
        : '';
      const reactHtml = m.react.length
        ? '<div class="fpdc-reacts">' + m.react.map((r) => '<span class="fpdc-react">' + T.esc(r) + '<b style="color:' + th.name + '">1</b></span>').join('') + '</div>'
        : '';
      chatHtml += '<div class="fpdc-msg' + (cont ? ' fpdc-cont' : '') + '">' +
        '<div class="fpdc-mav" style="background:' + utils.avaColor(m.nama) + '">' + T.esc((m.nama[0] || '?').toUpperCase()) + '</div>' +
        '<div class="fpdc-mbody">' + replyHtml + headHtml +
        '<div class="fpdc-mtext" style="color:' + th.fg + '">' + T.esc(m.msg) + '</div>' + reactHtml +
        '</div></div>';
    });

    const sbHtml = '<div class="fpdc-sb" style="background:' + th.hdBg + ';color:' + th.name + '">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    const hdHtml = '<div class="fpdc-hd" style="background:' + th.hdBg + ';color:' + th.name + '">' +
      '<span style="color:' + th.muted + ';display:flex">' + SVG_HASH + '</span>' +
      '<b>' + T.esc(channel) + '</b>' +
      (topik ? '<span style="color:' + th.muted + '">| ' + T.esc(topik) + '</span>' : '') +
      '<div class="fpdc-hic" style="color:' + th.muted + '">' + SVG_BELL + SVG_PIN + SVG_USERS + '</div></div>';
    const ibarHtml = '<div class="fpdc-ibar" style="background:' + th.bg + '">' +
      '<span class="fpdc-plus">' + SVG_PLUS + '</span>' +
      '<div class="fpdc-pill" style="background:' + th.inputBg + '">' +
      '<span class="fpdc-ph" style="color:' + th.inputPh + '">Kirim pesan ke #' + T.esc(channel) + '</span>' +
      '<span style="color:' + th.muted + ';display:flex">' + SVG_GIFT + '</span>' +
      '<span style="color:' + th.muted + ';display:flex">' + SVG_EMOJI + '</span></div></div>';

    phone.className = 'fpdc-phone';
    phone.style.background = th.bg;
    phone.style.color = th.fg;
    phone.style.setProperty('--fpdc-bdr', th.bdr);
    phone.innerHTML = sbHtml + hdHtml + '<div class="fpdc-chat">' + chatHtml + '</div>' + ibarHtml +
      (isIPh ? '<div class="fpdc-home" style="background:' + th.bg + '"><i></i></div>' : '<div class="fpdc-nav" style="background:' + th.bg + '"><i></i></div>') +
      '<div class="fpdc-pranktag-wrap" style="background:' + th.bg + '"><span class="fpdc-pranktag">palsu · cuma prank</span></div>';
  }

  [inServer, inChannel, inTopik, selTheme, selPlatform, selBrand, inDiv, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fpdc-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan pesan Discord asli.') + '</div>'));
  draw();
}
