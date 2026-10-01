import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {
  id: 'fake-chat-wa',
  name: 'Fake Chat WA',
  cat: 'fakesos',
  icon: '💬',
  desc: 'Bikin screenshot chat WhatsApp palsu + unduh PNG.',
  keywords: 'whatsapp,chat,fake,palsu,screenshot,prank'
};

const SAMPLE =
  'A|09:12: Besok jadi futsal kan?\n' +
  'B|09:13|blue: Jadi dong, jam 8 malem\n' +
  'A|09:14: Jangan telat lagi ya\n' +
  'B|09:15|2: Aman, gue berangkat dari sekarang\n' +
  'A|09:15: Sekarang masih jam 9 pagi woy\n' +
  'B|09:16|blue: ...';

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CALL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VID = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_MIC = '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
const SVG_SIG = '<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.7"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="0.7"/><rect x="9" y="3" width="3" height="9" rx="0.7"/><rect x="13.5" y="0" width="3" height="12" rx="0.7"/></svg>';
const SVG_WIFI = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 13 0"/><path d="M4 6.8a6.4 6.4 0 0 1 8 0"/><circle cx="8" cy="9.6" r="1.3" fill="currentColor" stroke="none"/></svg>';
const SVG_BAT = '<svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.45"/><rect x="2.5" y="2.5" width="14" height="7" rx="1.5" fill="currentColor"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.45"/></svg>';

function parseMsgs(text, defTicks) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const ci = line.indexOf(':');
    if (ci < 0) return;
    const pre = line.slice(0, ci).trim();
    const msg = line.slice(ci + 1).trim();
    if (!msg) return;
    const parts = pre.split('|').map((s) => s.trim());
    const side = parts[0].toUpperCase() === 'B' ? 'B' : 'A';
    let time = '';
    let tk = defTicks;
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^(1|satu)$/i.test(p)) tk = '1';
      else if (/^(2|dua|abu)$/i.test(p)) tk = '2';
      else if (/^(blue|biru)$/i.test(p)) tk = 'blue';
      else if (/^(0|none|tanpa)$/i.test(p)) tk = '0';
    });
    out.push({ side, time, tk, msg });
  });
  return out;
}

function ticksHtml(tk) {
  if (tk === '1') return '<span class="fcw-tk" style="color:#8696A0">✓</span>';
  if (tk === '2') return '<span class="fcw-tk" style="color:#8696A0">✓✓</span>';
  if (tk === 'blue') return '<span class="fcw-tk" style="color:#53BDEB">✓✓</span>';
  return '';
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fcw-ctl{display:grid;gap:10px;margin-bottom:12px}
.fcw-phone{max-width:380px;margin:14px auto;border-radius:20px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fcw-dark{background:#0B141A!important;border-color:rgba(255,255,255,.12)}
.fcw-sb{display:flex;justify-content:space-between;align-items:center;height:30px;padding:0 18px 0 22px;background:#FFFFFF;color:#111B21}
.fcw-dark .fcw-sb{background:#1F2C34;color:#E9EDEF}
.fcw-clock{font-size:14px;font-weight:700;letter-spacing:.3px}
.fcw-sicons{display:flex;align-items:center;gap:6px}
.fcw-hd{display:flex;align-items:center;height:62px;padding:0 10px 0 2px;background:#FFFFFF}
.fcw-dark .fcw-hd{background:#1F2C34}
.fcw-bk{background:none;border:0;padding:8px;cursor:pointer;color:#3B4A54;display:flex;align-items:center}
.fcw-dark .fcw-bk{color:#AEBAC1}
.fcw-av{width:42px;height:42px;border-radius:50%;background:#8696A0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;overflow:hidden;flex:none}
.fcw-av img{width:100%;height:100%;object-fit:cover;display:block}
.fcw-nm{flex:1;min-width:0;margin-left:9px}
.fcw-nm b{display:block;font-size:16px;font-weight:600;color:#111B21;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcw-dark .fcw-nm b{color:#E9EDEF}
.fcw-nm span{display:block;font-size:12.5px;color:#667781;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcw-dark .fcw-nm span{color:#8696A0}
.fcw-hic{display:flex;align-items:center;gap:20px;padding-right:8px;color:#3B4A54;flex:none}
.fcw-dark .fcw-hic{color:#AEBAC1}
.fcw-chat{display:flex;flex-direction:column;padding:10px 10px 12px;background:#EFEAE2;min-height:320px}
.fcw-dark .fcw-chat{background:#0B141A}
.fcw-chip{align-self:center;background:#F0F2F5;color:#54656F;font-size:12px;padding:6px 12px;border-radius:8px;margin:4px 0 8px}
.fcw-dark .fcw-chip{background:#182229;color:#8696A0}
.fcw-enc{align-self:center;max-width:94%;background:#FDF3C6;color:#54656F;font-size:12px;line-height:1.45;padding:7px 12px;border-radius:8px;text-align:center;margin:0 0 8px}
.fcw-dark .fcw-enc{background:#182229;color:#8696A0}
.fcw-bub{position:relative;max-width:78%;padding:7px 9px 8px;border-radius:8px;font-size:14.5px;line-height:1.4;margin-top:2px;overflow-wrap:break-word}
.fcw-grp{margin-top:9px}
.fcw-in{align-self:flex-start;background:#FFFFFF;color:#111B21;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.fcw-out{align-self:flex-end;background:#D9FDD3;color:#111B21;box-shadow:0 1px 1px rgba(0,0,0,.08)}
.fcw-dark .fcw-in{background:#1F2C34;color:#E9EDEF}
.fcw-dark .fcw-out{background:#005C4B;color:#E9EDEF}
.fcw-in.fcw-tail::before{content:"";position:absolute;left:-7px;top:0;border:8px solid transparent;border-top-color:#FFFFFF;border-left:0}
.fcw-out.fcw-tail::before{content:"";position:absolute;right:-7px;top:0;border:8px solid transparent;border-top-color:#D9FDD3;border-right:0}
.fcw-dark .fcw-in.fcw-tail::before{border-top-color:#1F2C34}
.fcw-dark .fcw-out.fcw-tail::before{border-top-color:#005C4B}
.fcw-meta{float:right;font-size:11px;color:#667781;margin:10px 0 0 10px;line-height:1;white-space:nowrap}
.fcw-dark .fcw-meta{color:#8696A0}
.fcw-tk{letter-spacing:-2px;font-size:13px}
.fcw-ibar{display:flex;align-items:center;gap:6px;padding:6px 8px 12px;background:#EFEAE2}
.fcw-dark .fcw-ibar{background:#0B141A}
.fcw-pill{flex:1;display:flex;align-items:center;background:#FFFFFF;border-radius:24px;padding:11px 6px 11px 16px;box-shadow:0 1px 1px rgba(0,0,0,.06)}
.fcw-dark .fcw-pill{background:#1F2C34}
.fcw-ph{flex:1;font-size:16px;color:#8696A0}
.fcw-pico{display:flex;gap:16px;padding-right:10px;font-size:20px;color:#8696A0;align-items:center}
.fcw-mic{width:48px;height:48px;flex:none;border-radius:50%;background:#00A884;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.fcw-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fcw-hint code{font-family:monospace;font-size:11.5px}
.fcw-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fcw-ctl"></div>');
  const inName = T.input('text', 'Nama kontak', 'Rizky');
  const inStatus = T.input('text', 'Status (online / last seen...)', 'online');
  const selTheme = T.select([['light', 'Terang'], ['dark', 'Gelap']], 'light');
  const selTicks = T.select([['blue', 'Dua biru (dibaca)'], ['2', 'Dua abu (terkirim)'], ['1', 'Satu abu'], ['0', 'Tanpa centang']], 'blue');
  const inChip = T.input('text', 'Teks chip tanggal', 'HARI INI');
  const selChip = T.select([['1', 'Tampilkan'], ['0', 'Sembunyikan']], '1');
  const selEnc = T.select([['1', 'Tampilkan'], ['0', 'Sembunyikan']], '1');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: A|10:30|blue: halo', SAMPLE);

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avatarUrl = null;
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) {
      avatarUrl = URL.createObjectURL(fi.files[0]);
      draw();
    }
  });
  const btnAvatar = T.btn('📷 Upload Avatar', () => fi.click());

  ctl.appendChild(T.field('Nama kontak', inName));
  ctl.appendChild(T.field('Status', inStatus));
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Centang default (pesan keluar)', selTicks));
  ctl.appendChild(T.field('Teks chip tanggal', inChip));
  ctl.appendChild(T.field('Chip tanggal', selChip));
  ctl.appendChild(T.field('Notifikasi enkripsi', selEnc));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fcw-hint">Format: <code>A|10:30|blue: halo</code> — <b>A</b>=masuk (kiri), <b>B</b>=keluar (kanan). Segmen opsional: jam <code>HH:MM</code>, centang <code>1</code>/satu, <code>2</code>/abu, <code>blue</code>/biru. Contoh: <code>B|10:31|blue: juga baik!</code></div>'));

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inName.value = 'Rizky';
      inStatus.value = 'online';
      selTheme.value = 'light';
      selTicks.value = 'blue';
      inChip.value = 'HARI INI';
      selChip.value = '1';
      selEnc.value = '1';
      taMsg.value = SAMPLE;
      avatarUrl = null;
      draw();
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-wa.png'), true)
  );

  const phone = T.el('<div class="fcw-phone"></div>');

  function draw() {
    const dark = selTheme.value === 'dark';
    const name = inName.value.trim() || 'Kontak';
    const status = inStatus.value.trim() || 'online';
    const chipTxt = inChip.value.trim();
    const showChip = selChip.value === '1';
    const showEnc = selEnc.value === '1';
    const msgs = parseMsgs(taMsg.value, selTicks.value);
    const initial = (name.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl
      ? '<img src="' + avatarUrl + '" alt="">'
      : T.esc(initial);

    let chatHtml = '';
    if (showChip && chipTxt) chatHtml += '<div class="fcw-chip">' + T.esc(chipTxt) + '</div>';
    if (showEnc) chatHtml += '<div class="fcw-enc">🔒 Pesan bersifat terenkripsi end-to-end. Tidak seorang pun di luar chat ini, bahkan WhatsApp, yang dapat membaca atau mendengarkannya.</div>';

    let prevSide = null;
    msgs.forEach((m) => {
      const first = m.side !== prevSide;
      prevSide = m.side;
      const cls = m.side === 'B' ? 'fcw-out' : 'fcw-in';
      let metaHtml = '';
      if (m.time) metaHtml += T.esc(m.time);
      if (m.side === 'B' && m.tk !== '0') metaHtml += ' ' + ticksHtml(m.tk);
      chatHtml += '<div class="fcw-bub ' + cls + (first ? ' fcw-grp fcw-tail' : '') + '">' +
        '<span>' + T.esc(m.msg) + '</span>' +
        (metaHtml ? '<span class="fcw-meta">' + metaHtml + '</span>' : '') +
        '</div>';
    });

    phone.className = 'fcw-phone' + (dark ? ' fcw-dark' : '');
    phone.innerHTML =
      '<div class="fcw-sb"><span class="fcw-clock">9:41</span>' +
      '<span class="fcw-sicons">' + SVG_SIG + SVG_WIFI + SVG_BAT + '</span></div>' +
      '<div class="fcw-hd"><button class="fcw-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<div class="fcw-av">' + avHtml + '</div>' +
      '<div class="fcw-nm"><b>' + T.esc(name) + '</b><span>' + T.esc(status) + '</span></div>' +
      '<div class="fcw-hic">' + SVG_VID + SVG_CALL + SVG_MORE + '</div></div>' +
      '<div class="fcw-chat">' + chatHtml + '</div>' +
      '<div class="fcw-ibar"><div class="fcw-pill"><span class="fcw-ph">Message</span>' +
      '<span class="fcw-pico"><span>😊</span><span>📎</span><span>📷</span></span></div>' +
      '<div class="fcw-mic">' + SVG_MIC + '</div></div>';
  }

  [inName, inStatus, selTheme, selTicks, inChip, selChip, selEnc, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fcw-note">' + T.esc(LOCAL_NOTE) + '</div>'));
  draw();
}
