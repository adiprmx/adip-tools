import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.12.2';

export const meta = {
  id: 'fake-chat-messenger',
  name: 'Fake Chat Messenger',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.54.96 4.86 2.54 6.61L3 22l3.66-1.4A11.9 11.9 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.4 13.36l-1.9-2.5-3.6 2.5c-.3.2-.7.2-1 0l-3.1-2.2-1.6 2.2c-.2.3-.6.4-.9.2-.3-.2-.4-.6-.2-.9l2.3-3.2c.2-.3.6-.4.9-.2l3.1 2.2 3.6-2.5c.3-.2.7-.2 1 0l1.9 2.5c.2.3.2.7 0 1-.2.3-.3.5-.5.8z"/></svg>',
  desc: 'Bikin screenshot chat Facebook Messenger palsu + unduh PNG.',
  keywords: 'messenger,facebook,chat,fake,palsu,screenshot,prank,android,iphone',
  since: '6.12.0',
};

/* Palet Messenger (riset 15 Nov 2026): bubble keluar gradasi biru (flat = Lite),
   masuk #F0F0F0 terang / #303030 gelap, aksen #0084FF, titik aktif #31A24C. */
const CHAT_THEMES = {
  biru: { label: 'Biru (default)', grad: 'linear-gradient(180deg,#0099FF 0%,#0084FF 60%,#0064E0 100%)', accent: '#0084FF' },
  ungu: { label: 'Ungu ke biru', grad: 'linear-gradient(180deg,#A033FF 0%,#7B5CFF 45%,#0084FF 100%)', accent: '#7B5CFF' },
  merah: { label: 'Merah', grad: 'linear-gradient(180deg,#FF5F6D 0%,#FF3B30 100%)', accent: '#FF3B30' },
  pink: { label: 'Pink', grad: 'linear-gradient(180deg,#FF6EB4 0%,#FF2E7E 100%)', accent: '#FF2E7E' },
};
const MODES = {
  terang: { bg: '#FFFFFF', fg: '#050505', sub: '#65676B', inB: '#F0F0F0', inFg: '#050505', hdBg: '#FFFFFF', inputBg: '#F0F0F2', ph: '#65676B', nav: '#050505' },
  gelap: { bg: '#0A0A0A', fg: '#E4E6EB', sub: '#B0B3B8', inB: '#303030', inFg: '#E4E6EB', hdBg: '#0A0A0A', inputBg: '#3A3B3C', ph: '#B0B3B8', nav: '#E4E6EB' },
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
const SVG_PLUS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const SVG_CAM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
const SVG_IMG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3.5"/><circle cx="8.7" cy="8.7" r="1.6"/><path d="M21 15.2l-4.8-4.8L5 21.5"/></svg>';
const SVG_MIC = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="18" x2="12" y2="21.5"/></svg>';
const THUMB_PATH = 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';

const SAMPLE =
  'A|09:12: woyy, jadi kan nongkrong nanti?\n' +
  'B|09:13: jadi dong, jam 7 ya\n' +
  'A|09:14|react=❤️: oke gas! gue bawa cemilan\n' +
  'B|09:15|seen: 👍';

/* Format: A|09:12: teks | B|09:13|seen: teks | flag react=❤️ | teks "👍" = stiker jempol. */
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
    let time = '', react = '', seen = false;
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^seen$/i.test(p)) seen = true;
      else if (/^react=/i.test(p)) react = p.slice(6);
    });
    out.push({ side, time, msg, react, seen });
  });
  return out;
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fcm-ctl{display:grid;gap:10px;margin-bottom:12px}
.fcm-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fcm-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px}
.fcm-hd{display:flex;align-items:center;height:60px;padding:0 10px 0 2px}
.fcm-bk{background:none;border:0;padding:10px 6px 10px 10px;cursor:pointer;display:flex;align-items:center}
.fcm-avwrap{position:relative;flex:none}
.fcm-av{width:40px;height:40px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;overflow:hidden}
.fcm-av img{width:100%;height:100%;object-fit:cover;display:block}
.fcm-dot{position:absolute;right:0;bottom:0;width:13px;height:13px;border-radius:50%;background:#31A24C;border:2.5px solid #fff}
.fcm-dark .fcm-dot{border-color:#0A0A0A}
.fcm-nm{flex:1;min-width:0;margin-left:9px}
.fcm-nm b{display:block;font-size:17px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcm-nm span{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcm-hic{display:flex;align-items:center;gap:22px;padding-right:8px;flex:none}
.fcm-chat{display:flex;flex-direction:column;padding:8px 10px 12px;min-height:320px}
.fcm-div{align-self:center;font-size:12.5px;font-weight:500;margin:8px 0 10px}
.fcm-row{display:flex;align-items:flex-end;margin-top:2px}
.fcm-row.fcm-b{justify-content:flex-end}
.fcm-row.fcm-grp{margin-top:10px}
.fcm-mini{width:28px;height:28px;border-radius:50%;flex:none;margin-right:7px;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;overflow:hidden}
.fcm-mini img{width:100%;height:100%;object-fit:cover;display:block}
.fcm-mini.fcm-blank{visibility:hidden}
.fcm-bub{position:relative;max-width:74%;padding:8px 12px;border-radius:18px;font-size:16px;line-height:21px;overflow-wrap:break-word}
.fcm-row.fcm-a.fcm-f .fcm-bub{border-bottom-left-radius:6px}
.fcm-row.fcm-a.fcm-m .fcm-bub{border-top-left-radius:6px;border-bottom-left-radius:6px}
.fcm-row.fcm-b.fcm-f .fcm-bub{border-bottom-right-radius:6px}
.fcm-row.fcm-b.fcm-m .fcm-bub{border-top-right-radius:6px;border-bottom-right-radius:6px}
.fcm-react{position:absolute;bottom:-10px;font-size:13px;line-height:1;background:#fff;border-radius:999px;padding:3px 6px;box-shadow:0 1px 3px rgba(0,0,0,.25);white-space:nowrap;z-index:2}
.fcm-row.fcm-b .fcm-react{right:8px}
.fcm-row.fcm-a .fcm-react{left:8px}
.fcm-dark .fcm-react{background:#3A3B3C}
.fcm-thumb{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.fcm-thumb svg{width:34px;height:34px;display:block}
.fcm-seen{display:flex;justify-content:flex-end;margin:4px 2px 0}
.fcm-seen .fcm-mini{width:15px;height:15px;margin:0;font-size:8px}
.fcm-time{align-self:center;font-size:11.5px;margin:3px 0 6px}
.fcm-tdots{display:inline-flex;gap:5px;align-items:center;padding:5px 3px}
.fcm-tdots i{width:7px;height:7px;border-radius:50%;background:#8696A0;animation:fcm-tb 1.1s infinite}
.fcm-tdots i:nth-child(2){animation-delay:.18s}
.fcm-tdots i:nth-child(3){animation-delay:.36s}
@keyframes fcm-tb{0%,60%,100%{transform:none;opacity:.55}30%{transform:translateY(-3px);opacity:1}}
.fcm-ibar{display:flex;align-items:center;gap:8px;padding:8px 10px 10px}
.fcm-plus{width:32px;height:32px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center}
.fcm-pill{flex:1;display:flex;align-items:center;border-radius:24px;min-height:38px;padding:0 12px}
.fcm-ph{flex:1;font-size:16px;white-space:nowrap;overflow:hidden}
.fcm-tic{flex:none;display:flex;align-items:center}
.fcm-like{width:36px;height:36px;flex:none;display:flex;align-items:center;justify-content:center}
.fcm-nav{display:flex;justify-content:center;padding:4px 0 9px}
.fcm-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fcm-home{display:flex;justify-content:center;align-items:center;height:20px}
.fcm-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fcm-dark .fcm-nav i,.fcm-dark .fcm-home i{background:rgba(255,255,255,.4)}
.fcm-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px}
.fcm-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fcm-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fcm-hint code{font-family:monospace;font-size:11.5px}
.fcm-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fcm-ctl"></div>');
  const inName = T.input('text', 'Nama kontak', 'Rina Prameswari');
  const inStatus = T.input('text', 'Status (Active now / Aktif...)', 'Active now');
  const selTheme = T.select(Object.keys(CHAT_THEMES).map((k) => [k, CHAT_THEMES[k].label]), 'biru');
  const selMode = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const inDiv = T.input('text', 'Teks pembatas tanggal', 'Hari ini 09.41');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: A|10:30: halo', SAMPLE);

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avatarUrl = null;
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { avatarUrl = URL.createObjectURL(fi.files[0]); draw(); }
  });
  const btnAvatar = T.btn('📷 Upload Avatar', () => fi.click());

  ctl.appendChild(T.field('Nama kontak', inName));
  ctl.appendChild(T.field('Status', inStatus));
  ctl.appendChild(T.field('Tema chat', selTheme));
  ctl.appendChild(T.field('Mode', selMode));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Teks pembatas tanggal', inDiv));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fcm-hint">Format: <code>A|10:30: halo</code> — <b>A</b>=masuk (kiri), <b>B</b>=keluar (kanan). Flag: <code>|react=❤️</code> = reaksi emoji, <code>|seen</code> di baris B = tanda dibaca. Pesan <code>👍</code> jadi stiker jempol biru khas Messenger. Ketik <code>...</code> untuk gelembung "sedang mengetik".</div>'));

  const phone = T.el('<div class="fcm-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inName.value = 'Rina Prameswari'; inStatus.value = 'Active now';
      selTheme.value = 'biru'; selMode.value = 'terang'; inDiv.value = 'Hari ini 09.41';
      taMsg.value = SAMPLE; avatarUrl = null;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-messenger.png'), true)
  );

  function draw() {
    const dark = selMode.value === 'gelap';
    const md = dark ? MODES.gelap : MODES.terang;
    const ct = CHAT_THEMES[selTheme.value] || CHAT_THEMES.biru;
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const name = inName.value.trim() || 'Kontak';
    const status = inStatus.value.trim() || 'Active now';
    const divTxt = inDiv.value.trim();
    const msgs = parseMsgs(taMsg.value);
    const initial = (name.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc(initial);
    const showDot = /active now/i.test(status) || /aktif/i.test(status);

    let chatHtml = '';
    if (divTxt) chatHtml += '<div class="fcm-div" style="color:' + md.sub + '">' + T.esc(divTxt) + '</div>';

    msgs.forEach((m, i) => {
      const prev = i > 0 ? msgs[i - 1].side : null;
      const next = i < msgs.length - 1 ? msgs[i + 1].side : null;
      const first = prev !== m.side, last = next !== m.side;
      const pos = first && last ? 's' : first ? 'f' : last ? 'l' : 'm';
      const typing = m.msg.trim() === '...';
      const isThumb = m.msg.trim() === '👍' || m.msg.trim().toLowerCase() === '[jempol]';
      const sideCls = m.side === 'B' ? 'fcm-b' : 'fcm-a';
      const miniHtml = m.side === 'A'
        ? '<div class="fcm-mini' + (last ? '' : ' fcm-blank') + '" style="background:' + avaColor(name) + '">' + avHtml + '</div>'
        : '';
      let inner = '';
      if (isThumb) {
        inner = '<div class="fcm-thumb" style="background:' + ct.grad + '"><svg viewBox="0 0 24 24" fill="#fff"><path d="' + THUMB_PATH + '"/></svg></div>';
      } else {
        const bg = m.side === 'B' ? ct.grad : md.inB;
        const fg = m.side === 'B' ? '#FFFFFF' : md.inFg;
        const reactHtml = (!typing && m.react) ? '<span class="fcm-react">' + T.esc(m.react) + '</span>' : '';
        inner = '<div class="fcm-bub" style="background:' + bg + ';color:' + fg + '">' +
          (typing ? '<span class="fcm-tdots"><i></i><i></i><i></i></span>' : T.esc(m.msg)) + reactHtml + '</div>';
      }
      chatHtml += '<div class="fcm-row ' + sideCls + ' fcm-' + pos + (first ? ' fcm-grp' : '') + '">' + miniHtml + inner + '</div>';
      if (m.seen && m.side === 'B') {
        chatHtml += '<div class="fcm-seen"><div class="fcm-mini" style="background:' + avaColor(name) + '">' + avHtml + '</div></div>';
      } else if (m.time && last && !typing) {
        chatHtml += '<div class="fcm-time" style="color:' + md.sub + ';align-self:' + (m.side === 'B' ? 'flex-end' : 'flex-start') + '">' + T.esc(m.time) + '</div>';
      }
    });

    const sbHtml = '<div class="fcm-sb" style="background:' + md.hdBg + ';color:' + md.fg + '">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    const hdHtml = '<div class="fcm-hd" style="background:' + md.hdBg + ';color:' + md.fg + '">' +
      '<button class="fcm-bk" type="button" tabindex="-1" style="color:' + ct.accent + '">' + (isIPh ? SVG_CHEV : SVG_BACK) + '</button>' +
      '<div class="fcm-avwrap"><div class="fcm-av" style="background:' + avaColor(name) + '">' + avHtml + '</div>' +
      (showDot ? '<span class="fcm-dot"></span>' : '') + '</div>' +
      '<div class="fcm-nm"><b>' + T.esc(name) + '</b><span style="color:' + md.sub + '">' + T.esc(status) + '</span></div>' +
      '<div class="fcm-hic" style="color:' + ct.accent + '">' + SVG_PHONE + SVG_VIDEO + '</div></div>';

    const ibarHtml = '<div class="fcm-ibar" style="background:' + md.hdBg + '">' +
      '<span class="fcm-plus" style="background:' + md.inputBg + ';color:' + ct.accent + '">' + SVG_PLUS + '</span>' +
      '<span class="fcm-tic" style="color:' + ct.accent + '">' + SVG_CAM + '</span>' +
      '<span class="fcm-tic" style="color:' + ct.accent + '">' + SVG_IMG + '</span>' +
      '<div class="fcm-pill" style="background:' + md.inputBg + '"><span class="fcm-ph" style="color:' + md.ph + '">Aa</span>' +
      '<span class="fcm-tic" style="color:' + ct.accent + '">' + SVG_MIC + '</span></div>' +
      '<span class="fcm-like" style="color:' + ct.accent + '"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="' + THUMB_PATH + '"/></svg></span></div>' +
      (isIPh ? '<div class="fcm-home" style="background:' + md.hdBg + '"><i></i></div>' : '<div class="fcm-nav" style="background:' + md.hdBg + '"><i></i></div>');

    phone.className = 'fcm-phone' + (dark ? ' fcm-dark' : '');
    phone.style.background = md.bg;
    phone.style.color = md.fg;
    phone.innerHTML = sbHtml + hdHtml + '<div class="fcm-chat" style="background:' + md.bg + '">' + chatHtml + '</div>' + ibarHtml + '<div class="fcm-pranktag-wrap" style="background:' + md.hdBg + '"><span class="fcm-pranktag">palsu · cuma prank</span></div>';
  }

  [inName, inStatus, selTheme, selMode, selPlatform, selBrand, inDiv, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fcm-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan chat Messenger asli.') + '</div>'));
  draw();
}
