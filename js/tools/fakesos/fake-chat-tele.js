import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.12.0';

export const meta = {
  id: 'fake-chat-tele',
  name: 'Fake Chat Telegram',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  desc: 'Bikin screenshot chat Telegram palsu + unduh PNG.',
  keywords: 'telegram,chat,fake,palsu,screenshot,prank,android,iphone',
  since: '6.12.0',
};

/* Palet Telegram asli (riset 15 Nov 2026, telegram-desktop colors.palette):
   terang: keluar #effdde, masuk #ffffff | gelap (Night): keluar #2b5278, masuk #182533,
   latar gelap #0e1621, aksen #2aabee, centang dibaca hijau #5dc452 (terang) / biru #7da8d9 (gelap). */
const THEMES = {
  terang: { bg: '#DCE6EC', inB: '#FFFFFF', outB: '#EFFDDE', fg: '#000000', hdBg: '#FFFFFF', hdFg: '#000000', sub: '#707579', on: '#2AABEE', timeIn: '#999999', timeOut: '#3A8E26', check: '#5DC452', chipBg: 'rgba(0,0,0,.30)', inputBg: '#FFFFFF', inputFg: '#000000', ph: '#999999', pat: 'rgba(0,0,0,0.045)' },
  gelap: { bg: '#0E1621', inB: '#182533', outB: '#2B5278', fg: '#FFFFFF', hdBg: '#17212B', hdFg: '#FFFFFF', sub: '#7F91A4', on: '#6EB5FF', timeIn: '#6D7F8F', timeOut: '#7DA8D9', check: '#7DA8D9', chipBg: 'rgba(255,255,255,.14)', inputBg: '#17212B', inputFg: '#FFFFFF', ph: '#6D7F8F', pat: 'rgba(255,255,255,0.03)' },
};

const AVA_COLORS = ['#FF845E', '#D97E00', '#35A857', '#2AABEE', '#7F66D9', '#E15D8F', '#E15D8F'];
function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) >>> 0;
  return AVA_COLORS[hsh % AVA_COLORS.length];
}

/* Pola wallpaper default Telegram (rekreasi, tile samar). */
function telePattern(color) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">' +
    '<g fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="20" cy="22" r="9"/><path d="M15 22h10M20 17v10"/>' +
    '<path d="M78 16l4 8 8 4-8 4-4 8-4-8-8-4 8-4z"/>' +
    '<rect x="14" y="66" width="22" height="16" rx="8"/><path d="M22 82l-3 7 8-7"/>' +
    '<path d="M88 70c-4-6-12-2-8 5l8 7 8-7c4-7-4-11-8-5z"/>' +
    '<path d="M52 44c6-7 11 7 17 0s11 7 17 0"/>' +
    '<circle cx="100" cy="102" r="3"/><circle cx="30" cy="104" r="3"/>' +
    '<path d="M60 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' +
    '</g></svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CHEV = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
const SVG_PHONE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VIDEO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_SEARCH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_CLIP = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
const SVG_SMILE = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.4 2.1 3.8 2.1 3.8-2.1 3.8-2.1"/><line x1="9.2" y1="9.4" x2="9.2" y2="9.4"/><line x1="14.8" y1="9.4" x2="14.8" y2="9.4"/></svg>';
const SVG_SEND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
const SVG_VER = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#2AABEE" d="M12 1.8l2.5 1 2.7-.3 1.5 2.3 2.3 1.5-.3 2.7 1 2.5-1 2.5.3 2.7-2.3 1.5-1.5 2.3-2.7-.3-2.5 1-2.5-1-2.7.3-1.5-2.3-2.3-1.5.3-2.7-1-2.5 1-2.5-.3-2.7 2.3-1.5 1.5-2.3 2.7.3z"/><path fill="#fff" d="M10.6 15.6l-3-3 1.4-1.4 1.6 1.6 4.4-4.8 1.4 1.3z"/></svg>';

const SAMPLE =
  'A|09:12: bro, file beatnya udah gue kirim\n' +
  'B|09:13|blue: mantap, gue cek dulu\n' +
  'A|09:14: jangan lupa di-save ya\n' +
  'B|09:15|2|r=jangan lupa di-save ya: aman, udah gue backup\n' +
  'A|09:15: sip 👍';

/* Format: A|09:12: teks | B|09:13|blue: teks | flag r=... = balasan (quote). */
function parseMsgs(text, defTicks) {
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
    let time = '', tk = defTicks, reply = '';
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^(1|satu)$/i.test(p)) tk = '1';
      else if (/^(2|dua|abu)$/i.test(p)) tk = '2';
      else if (/^(blue|biru)$/i.test(p)) tk = 'blue';
      else if (/^(0|none|tanpa)$/i.test(p)) tk = '0';
      else if (/^r=/i.test(p)) reply = p.slice(2);
    });
    out.push({ side, time, tk, msg, reply });
  });
  return out;
}

function ticksHtml(tk, checkColor, muted) {
  const c = tk === 'blue' ? checkColor : muted;
  if (tk === '1') return '<svg width="14" height="10" viewBox="0 0 15 11" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-left:3px"><path d="M1.6 5.8l3.4 3.4L13.4 1.4"/></svg>';
  if (tk === '2' || tk === 'blue') return '<svg width="18" height="10" viewBox="0 0 19 11" fill="none" stroke="' + c + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-left:3px"><path d="M1.2 5.8l3.4 3.4L12 1.6"/><path d="M7.4 5.8l3.4 3.4L17.8 1.6"/></svg>';
  return '';
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fct-ctl{display:grid;gap:10px;margin-bottom:12px}
.fct-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:Roboto,"Segoe UI",system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fct-phone.fct-ios{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.fct-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px}
.fct-hd{display:flex;align-items:center;height:60px;padding:0 10px 0 2px}
.fct-bk{background:none;border:0;padding:10px 6px 10px 10px;cursor:pointer;display:flex;align-items:center}
.fct-av{width:42px;height:42px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:600;overflow:hidden;flex:none}
.fct-av img{width:100%;height:100%;object-fit:cover;display:block}
.fct-nm{flex:1;min-width:0;margin-left:9px}
.fct-nm b{display:flex;align-items:center;gap:5px;font-size:17px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fct-nm b .fct-v{display:inline-flex;flex:none}
.fct-nm span{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fct-hic{display:flex;align-items:center;gap:22px;padding-right:8px;flex:none}
.fct-chat{display:flex;flex-direction:column;padding:8px 10px 12px;min-height:340px}
.fct-chip{align-self:center;color:#fff;font-size:13px;font-weight:500;padding:6px 12px;border-radius:12px;margin:6px 0 10px;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.fct-bub{position:relative;max-width:82%;padding:7px 10px 8px;border-radius:18px;font-size:16px;line-height:21px;margin-top:2px;overflow-wrap:break-word;box-shadow:0 1px 1px rgba(0,0,0,.12)}
.fct-ios .fct-bub{font-size:17px;line-height:22px}
.fct-grp{margin-top:10px}
.fct-in{align-self:flex-start}
.fct-out{align-self:flex-end}
.fct-in.fct-f{border-bottom-left-radius:6px}
.fct-in.fct-m{border-top-left-radius:6px;border-bottom-left-radius:6px}
.fct-out.fct-f{border-bottom-right-radius:6px}
.fct-out.fct-m{border-top-right-radius:6px;border-bottom-right-radius:6px}
/* ekor Telegram ada di BAWAH bubble terakhir grup */
.fct-in.fct-tail::before{content:"";position:absolute;left:-7px;bottom:0;width:14px;height:18px;background:inherit;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='18' viewBox='0 0 14 18'%3E%3Cpath d='M14 0C8 0 2 5 0 18c4-1 9-4 11-8 1.5-3 2.5-6 3-10z'/%3E%3C/svg%3E") no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='18' viewBox='0 0 14 18'%3E%3Cpath d='M14 0C8 0 2 5 0 18c4-1 9-4 11-8 1.5-3 2.5-6 3-10z'/%3E%3C/svg%3E") no-repeat}
.fct-out.fct-tail::before{content:"";position:absolute;right:-7px;bottom:0;width:14px;height:18px;background:inherit;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='18' viewBox='0 0 14 18'%3E%3Cpath d='M0 0C6 0 12 5 14 18c-4-1-9-4-11-8-1.5-3-2.5-6-3-10z'/%3E%3C/svg%3E") no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='18' viewBox='0 0 14 18'%3E%3Cpath d='M0 0C6 0 12 5 14 18c-4-1-9-4-11-8-1.5-3-2.5-6-3-10z'/%3E%3C/svg%3E") no-repeat}
.fct-meta{float:right;font-size:11px;margin:10px -1px 0 8px;line-height:1;white-space:nowrap}
.fct-reply{border-left:2px solid #2AABEE;padding-left:8px;margin:1px 0 4px}
.fct-reply b{display:block;font-size:13px;color:#2AABEE;font-weight:600;line-height:1.3}
.fct-reply span{display:block;font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.75}
.fct-tdots{display:inline-flex;gap:5px;align-items:center;padding:5px 3px}
.fct-tdots i{width:7px;height:7px;border-radius:50%;background:#8696A0;animation:fct-tb 1.1s infinite}
.fct-tdots i:nth-child(2){animation-delay:.18s}
.fct-tdots i:nth-child(3){animation-delay:.36s}
@keyframes fct-tb{0%,60%,100%{transform:none;opacity:.55}30%{transform:translateY(-3px);opacity:1}}
.fct-ibar{display:flex;align-items:center;gap:8px;padding:7px 10px 9px}
.fct-pill{flex:1;display:flex;align-items:center;border-radius:24px;min-height:48px;padding:0 12px}
.fct-ph{flex:1;font-size:16px;margin:0 6px;white-space:nowrap;overflow:hidden}
.fct-send{width:48px;height:48px;flex:none;border-radius:50%;background:#2AABEE;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.fct-send svg{margin-left:-2px}
.fct-nav{display:flex;justify-content:center;padding:4px 0 9px}
.fct-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fct-home{display:flex;justify-content:center;align-items:center;height:20px}
.fct-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fct-dark .fct-nav i,.fct-dark .fct-home i{background:rgba(255,255,255,.4)}
.fct-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fct-hint code{font-family:monospace;font-size:11.5px}
.fct-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fct-ctl"></div>');
  const inName = T.input('text', 'Nama kontak', 'Rizky');
  const inStatus = T.input('text', 'Status (online / last seen...)', 'online');
  const selVer = T.select([['tidak', 'Tanpa centang'], ['ya', 'Ada centang biru']], 'tidak');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const selTheme = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selTicks = T.select([['blue', 'Dua hijau/biru (dibaca)'], ['2', 'Dua abu (diterima)'], ['1', 'Satu abu (terkirim)'], ['0', 'Tanpa centang']], 'blue');
  const inChip = T.input('text', 'Teks chip tanggal', 'Hari ini');
  const selChip = T.select([['1', 'Tampilkan'], ['0', 'Sembunyikan']], '1');
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
  ctl.appendChild(T.field('Centang verifikasi', selVer));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Centang default (pesan keluar)', selTicks));
  ctl.appendChild(T.field('Teks chip tanggal', inChip));
  ctl.appendChild(T.field('Chip tanggal', selChip));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fct-hint">Format: <code>A|10:30: halo</code> — <b>A</b>=masuk (kiri), <b>B</b>=keluar (kanan). Segmen opsional: jam <code>HH:MM</code>, centang <code>1</code>, <code>2</code>, <code>blue</code>, balasan <code>r=teks yang dibalas</code>. Contoh: <code>B|10:31|blue|r=halo: halo juga</code>. Ketik <code>...</code> untuk gelembung "sedang mengetik".</div>'));

  const phone = T.el('<div class="fct-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inName.value = 'Rizky'; inStatus.value = 'online'; selVer.value = 'tidak';
      selTheme.value = 'terang'; selTicks.value = 'blue'; inChip.value = 'Hari ini';
      selChip.value = '1'; taMsg.value = SAMPLE; avatarUrl = null;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-tele.png'), true)
  );

  function draw() {
    const dark = selTheme.value === 'gelap';
    const th = dark ? THEMES.gelap : THEMES.terang;
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const name = inName.value.trim() || 'Kontak';
    const status = inStatus.value.trim() || 'online';
    const chipTxt = inChip.value.trim();
    const showChip = selChip.value === '1';
    const msgs = parseMsgs(taMsg.value, selTicks.value);
    const initial = (name.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc(initial);
    const online = /^online$/i.test(status);
    const statusHtml = '<span style="color:' + (online ? th.on : th.sub) + '">' + T.esc(status) + '</span>';
    const verHtml = selVer.value === 'ya' ? '<span class="fct-v">' + SVG_VER + '</span>' : '';

    let chatHtml = '';
    if (showChip && chipTxt) chatHtml += '<div class="fct-chip" style="background:' + th.chipBg + '">' + T.esc(chipTxt) + '</div>';

    msgs.forEach((m, i) => {
      const prev = i > 0 ? msgs[i - 1].side : null;
      const next = i < msgs.length - 1 ? msgs[i + 1].side : null;
      const first = prev !== m.side, last = next !== m.side;
      const pos = first && last ? 's' : first ? 'f' : last ? 'l' : 'm';
      const cls = m.side === 'B' ? 'fct-out' : 'fct-in';
      const typing = m.msg.trim() === '...';
      const bg = m.side === 'B' ? th.outB : th.inB;
      let metaHtml = '';
      if (!typing && m.time) metaHtml += '<span style="color:' + (m.side === 'B' ? th.timeOut : th.timeIn) + '">' + T.esc(m.time) + '</span>';
      if (!typing && m.side === 'B' && m.tk !== '0') metaHtml += ticksHtml(m.tk, th.check, m.side === 'B' ? th.timeOut : th.timeIn);
      const replyHtml = (!typing && m.reply)
        ? '<div class="fct-reply"><b>' + T.esc(m.side === 'B' ? name : 'Kamu') + '</b><span>' + T.esc(m.reply) + '</span></div>'
        : '';
      chatHtml += '<div class="fct-bub ' + cls + ' fct-' + pos + (first ? ' fct-grp' : '') + (last ? ' fct-tail' : '') + '" style="background:' + bg + ';color:' + th.fg + '">' +
        replyHtml +
        (typing ? '<span class="fct-tdots"><i></i><i></i><i></i></span>' : '<span>' + T.esc(m.msg) + '</span>') +
        (metaHtml ? '<span class="fct-meta">' + metaHtml + '</span>' : '') +
        '</div>';
    });

    const sbHtml = '<div class="fct-sb" style="background:' + th.hdBg + ';color:' + th.hdFg + '">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    const hdHtml = isIPh
      ? '<div class="fct-hd" style="background:' + th.hdBg + ';color:' + th.hdFg + '"><button class="fct-bk" type="button" tabindex="-1" style="color:#2AABEE">' + SVG_CHEV + '</button>' +
        '<div class="fct-av" style="background:' + avaColor(name) + '">' + avHtml + '</div>' +
        '<div class="fct-nm"><b>' + T.esc(name) + verHtml + '</b>' + statusHtml + '</div>' +
        '<div class="fct-hic" style="color:#2AABEE">' + SVG_VIDEO + SVG_PHONE + '</div></div>'
      : '<div class="fct-hd" style="background:' + th.hdBg + ';color:' + th.hdFg + '"><button class="fct-bk" type="button" tabindex="-1" style="color:' + th.sub + '">' + SVG_BACK + '</button>' +
        '<div class="fct-av" style="background:' + avaColor(name) + '">' + avHtml + '</div>' +
        '<div class="fct-nm"><b>' + T.esc(name) + verHtml + '</b>' + statusHtml + '</div>' +
        '<div class="fct-hic" style="color:' + th.sub + '">' + SVG_PHONE + SVG_SEARCH + SVG_MORE + '</div></div>';

    const ibarHtml = '<div class="fct-ibar" style="background:' + th.hdBg + '">' +
      '<div class="fct-pill" style="background:' + th.inputBg + ';color:' + th.inputFg + ';border:1px solid ' + (dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)') + '">' +
      '<span style="color:' + th.sub + ';display:flex">' + SVG_CLIP + '</span>' +
      '<span class="fct-ph" style="color:' + th.ph + '">Pesan</span>' +
      '<span style="color:' + th.sub + ';display:flex">' + SVG_SMILE + '</span></div>' +
      '<div class="fct-send">' + SVG_SEND + '</div></div>' +
      (isIPh ? '<div class="fct-home" style="background:' + th.hdBg + '"><i></i></div>' : '<div class="fct-nav" style="background:' + th.hdBg + '"><i></i></div>');

    phone.className = 'fct-phone fct-' + (isIPh ? 'ios' : 'droid') + (dark ? ' fct-dark' : '');
    phone.style.background = th.bg;
    phone.style.color = th.fg;
    phone.innerHTML = sbHtml + hdHtml +
      '<div class="fct-chat" style="background:' + telePattern(th.pat) + ',' + th.bg + '">' + chatHtml + '</div>' + ibarHtml;
  }

  [inName, inStatus, selVer, selPlatform, selBrand, selTheme, selTicks, inChip, selChip, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fct-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan chat Telegram asli.') + '</div>'));
  draw();
}
