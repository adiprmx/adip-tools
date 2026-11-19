import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-chat-snapchat',
  name: 'Fake Chat Snapchat',
  cat: 'fakesos',
  icon: '👻',
  desc: 'Bikin mockup chat Snapchat palsu: chat, snap, pesan tersimpan, peringatan screenshot + unduh PNG.',
  keywords: 'snapchat,chat,snap,fake,palsu,screenshot,prank,android,iphone',
  since: '6.19.0',
};

/* Snapchat: nama pengirim berwarna (bukan bubble), snap = kotak merah (foto) /
   ungu (video), pesan tersimpan berlatar abu, peringatan screenshot baris abu.
   Kuning khas #FFFC00. */
const WARNA_A = '#E60023';
const WARNA_B = '#0D7CF2';

const SAMPLE =
  'A|09:12: woy, liat snap gue\n' +
  'A|snap|09:12\n' +
  'B|09:13: udah, keren banget tempatnya\n' +
  'A|09:13|simpan: jangan lupa besok jam 8 ya\n' +
  'B|09:14: siap, gue ingetin\n' +
  'A|ss';

/* Format per baris: A|09:12: teks | A|snap|09:12 (snap foto) | A|snapv|09:12
   (snap video) | A|ss (peringatan screenshot) | flag |simpan = pesan tersimpan. */
export function parseChat(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const ci = line.search(/:(?!\d)/);
    const pre = ci < 0 ? line : line.slice(0, ci).trim();
    const msg = ci < 0 ? '' : line.slice(ci + 1).trim();
    const parts = pre.split('|').map((s) => s.trim());
    const side = parts[0].toUpperCase() === 'B' ? 'B' : 'A';
    let time = '', kind = 'chat', simpan = false;
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^snapv$/i.test(p)) kind = 'snapv';
      else if (/^snap$/i.test(p)) kind = 'snap';
      else if (/^ss$/i.test(p)) kind = 'ss';
      else if (/^simpan$/i.test(p)) simpan = true;
    });
    if (kind === 'chat' && !msg) return;
    out.push({ side, time, kind, msg, simpan });
  });
  return out;
}

const SVG_GHOST = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="#000" stroke-width="1.1" aria-hidden="true"><path d="M12 2.5c-3.6 0-6.5 3-6.5 6.9 0 2.6-1.4 4.5-2.2 5.6-.4.6-.2 1.3.4 1.5.9.3 1.8-.4 2.4-1.2.3 1 .9 1.9 1.8 2.5.4.3.9.1 1-.4l.3-1.2c.6.3 1.3.5 2 .6l.3 1.3c.1.5.7.7 1.1.3.3-.3.5-.7.6-1.1l.2-.9c.7-.1 1.4-.3 2-.6l.3 1.2c.1.5.6.7 1 .4.9-.6 1.5-1.5 1.8-2.5.6.8 1.5 1.5 2.4 1.2.6-.2.8-.9.4-1.5-.8-1.1-2.2-3-2.2-5.6 0-3.9-2.9-6.9-6.5-6.9zM8.6 9.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zm6.8 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z"/></svg>';
const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_PHONE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#000"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VIDEO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_CAM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
const SVG_SS = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><rect x="8" y="8" width="8" height="8" rx="1.5"/></svg>';
const SVG_SNAP_R = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#EE2C4A"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';
const SVG_SNAP_P = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#7B61FF"><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fcsn-ctl{display:grid;gap:10px;margin-bottom:12px}
.fcsn-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:Roboto,"Segoe UI",system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fcsn-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#FFFC00;color:#000}
.fcsn-hd{display:flex;align-items:center;height:56px;padding:0 12px 0 4px;background:#FFFC00}
.fcsn-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center;color:#000}
.fcsn-av{width:38px;height:38px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;overflow:hidden;flex:none;border:1px solid rgba(0,0,0,.15)}
.fcsn-av img{width:100%;height:100%;object-fit:cover;display:block}
.fcsn-nm{flex:1;min-width:0;margin-left:9px}
.fcsn-nm b{display:block;font-size:17px;font-weight:700;color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcsn-nm span{display:block;font-size:12.5px;color:rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcsn-hic{display:flex;align-items:center;gap:20px;padding-right:4px;flex:none}
.fcsn-chat{padding:10px 14px 12px;min-height:340px;background:#fff}
.fcsn-dark .fcsn-chat{background:#121212}
.fcsn-chip{text-align:center;color:#8E8E93;font-size:12px;font-weight:600;margin:6px 0 12px}
.fcsn-msg{padding:6px 4px;border-left:3px solid transparent}
.fcsn-msg.fcsn-simpan{background:#F0F0F0;border-radius:8px}
.fcsn-dark .fcsn-msg.fcsn-simpan{background:#262626}
.fcsn-who{font-size:14px;font-weight:700;line-height:1.3}
.fcsn-txt{font-size:15.5px;line-height:1.45;color:#000;overflow-wrap:break-word;white-space:pre-wrap}
.fcsn-dark .fcsn-txt{color:#F5F5F5}
.fcsn-time{font-size:11.5px;color:#8E8E93;margin-top:1px}
.fcsn-snap{display:flex;align-items:center;gap:9px;padding:8px 4px;font-size:15px;font-weight:600;color:#000}
.fcsn-dark .fcsn-snap{color:#F5F5F5}
.fcsn-snap span{font-size:12px;color:#8E8E93;font-weight:400}
.fcsn-ss{display:flex;align-items:center;justify-content:center;gap:6px;background:#F0F0F0;color:#636366;font-size:13px;font-weight:600;padding:8px;border-radius:8px;margin:8px 0}
.fcsn-dark .fcsn-ss{background:#262626;color:#AEAEB2}
.fcsn-ibar{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;background:#fff;border-top:1px solid #EDEDEF}
.fcsn-dark .fcsn-ibar{background:#121212;border-top-color:#262626}
.fcsn-pill{flex:1;display:flex;align-items:center;background:#F2F2F2;border-radius:24px;min-height:44px;padding:0 14px}
.fcsn-dark .fcsn-pill{background:#262626}
.fcsn-ph{flex:1;font-size:15.5px;color:#8E8E93}
.fcsn-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fcsn-dark .fcsn-nav{background:#121212}
.fcsn-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fcsn-dark .fcsn-nav i{background:rgba(255,255,255,.4)}
.fcsn-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fcsn-dark .fcsn-home{background:#121212}
.fcsn-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fcsn-dark .fcsn-home i{background:rgba(255,255,255,.4)}
.fcsn-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fcsn-dark .fcsn-pranktag-wrap{background:#121212}
.fcsn-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fcsn-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fcsn-hint code{font-family:monospace;font-size:11.5px}
.fcsn-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fcsn-ctl"></div>');
  const inNameA = T.input('text', 'Nama teman', 'Rizky');
  const inNameB = T.input('text', 'Namamu', 'Adip');
  const inUser = T.input('text', 'Username teman', 'rizky.png');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const selTheme = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const inChip = T.input('text', 'Teks chip tanggal', 'Hari ini');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: A|10:30: halo', SAMPLE);

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avatarUrl = null;
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { avatarUrl = URL.createObjectURL(fi.files[0]); draw(); }
  });
  const btnAvatar = T.btn('📷 Upload Avatar', () => fi.click());

  ctl.appendChild(T.field('Nama teman', inNameA));
  ctl.appendChild(T.field('Namamu', inNameB));
  ctl.appendChild(T.field('Username teman', inUser));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Teks chip tanggal', inChip));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fcsn-hint">Format: <code>A|10:30: halo</code>. <b>A</b>=teman, <b>B</b>=kamu. <code>|snap</code> = snap foto, <code>|snapv</code> = snap video, <code>|simpan</code> = pesan tersimpan, <code>A|ss</code> = baris peringatan screenshot.</div>'));

  const phone = T.el('<div class="fcsn-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNameA.value = 'Rizky'; inNameB.value = 'Adip'; inUser.value = 'rizky.png';
      selTheme.value = 'terang'; inChip.value = 'Hari ini'; taMsg.value = SAMPLE;
      avatarUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-snapchat.png'), true)
  );

  function draw() {
    const dark = selTheme.value === 'gelap';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nameA = inNameA.value.trim() || 'Teman';
    const nameB = inNameB.value.trim() || 'Kamu';
    const user = inUser.value.trim() || '';
    const chipTxt = inChip.value.trim();
    const msgs = parseChat(taMsg.value);
    const initial = (nameA.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc(initial);

    let chatHtml = '';
    if (chipTxt) chatHtml += '<div class="fcsn-chip">' + T.esc(chipTxt) + '</div>';
    msgs.forEach((m) => {
      const who = m.side === 'A' ? nameA : nameB;
      const col = m.side === 'A' ? WARNA_A : WARNA_B;
      if (m.kind === 'ss') {
        chatHtml += '<div class="fcsn-ss">' + SVG_SS + T.esc(who) + ' mengambil screenshot!</div>';
        return;
      }
      if (m.kind === 'snap' || m.kind === 'snapv') {
        chatHtml += '<div class="fcsn-snap">' + (m.kind === 'snap' ? SVG_SNAP_R : SVG_SNAP_P) +
          '<div>' + T.esc(who) + ' mengirim Snap' + (m.time ? ' <span>• ' + T.esc(m.time) + '</span>' : '') + '</div></div>';
        return;
      }
      chatHtml += '<div class="fcsn-msg' + (m.simpan ? ' fcsn-simpan' : '') + '">' +
        '<div class="fcsn-who" style="color:' + col + '">' + T.esc(who) + '</div>' +
        '<div class="fcsn-txt">' + T.esc(m.msg) + '</div>' +
        (m.time ? '<div class="fcsn-time">' + T.esc(m.time) + (m.simpan ? ' • Tersimpan' : '') + '</div>' : '') +
        '</div>';
    });

    const sbHtml = '<div class="fcsn-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fcsn-hd"><button class="fcsn-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<div class="fcsn-av" style="background:' + utils.avaColor(nameA) + ';color:#fff">' + avHtml + '</div>' +
      '<div class="fcsn-nm"><b>' + T.esc(nameA) + '</b><span>' + (user ? '@' + T.esc(user) : 'Snapchat') + '</span></div>' +
      '<div class="fcsn-hic">' + SVG_GHOST + SVG_PHONE + SVG_VIDEO + '</div></div>';
    const ibarHtml = '<div class="fcsn-ibar"><div class="fcsn-pill"><span class="fcsn-ph">Kirim chat</span></div>' +
      '<span style="display:flex">' + SVG_CAM + '</span></div>' +
      (isIPh ? '<div class="fcsn-home"><i></i></div>' : '<div class="fcsn-nav"><i></i></div>');

    phone.className = 'fcsn-phone' + (dark ? ' fcsn-dark' : '');
    phone.innerHTML = sbHtml + hdHtml + '<div class="fcsn-chat">' + chatHtml + '</div>' + ibarHtml +
      '<div class="fcsn-pranktag-wrap"><span class="fcsn-pranktag">palsu · cuma prank</span></div>';
  }

  [inNameA, inNameB, inUser, selPlatform, selBrand, selTheme, inChip, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fcsn-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan chat Snapchat asli.') + '</div>'));
  draw();
}
