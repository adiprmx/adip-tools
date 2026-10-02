import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.5';

export const meta = {
  id: 'fake-chat-wa',
  name: 'Fake Chat WA',
  cat: 'fakesos',
  icon: '💬',
  desc: 'Bikin screenshot chat WhatsApp palsu + unduh PNG.',
  keywords: 'whatsapp,chat,fake,palsu,screenshot,prank,android,iphone'
};

const SAMPLE =
  'A|09:12: Besok jadi futsal kan?\n' +
  'B|09:13|blue: Jadi dong, jam 8 malem\n' +
  'A|09:14: Jangan telat lagi ya\n' +
  'B|09:15|2: Aman, gue berangkat dari sekarang\n' +
  'A|09:15: Sekarang masih jam 9 pagi woy';

// Tema obrolan ala WhatsApp: warna bubble keluar + wallpaper (terang/gelap).
const CHAT_THEMES = {
  default: { label: 'Default (Biru)', out: '#D3E5FD', outD: '#1D4FD7', wall: 'linear-gradient(165deg,#3a4a7a 0%,#7b5ea7 38%,#d67fa1 68%,#f7b267 100%)', wallD: 'linear-gradient(165deg,#101736 0%,#2c2350 45%,#4a2b52 75%,#5c3a3a 100%)' },
  klasik: { label: 'Klasik (Hijau)', out: '#D9FDD3', outD: '#005C4B', wall: '#EFEAE2', wallD: '#0B1014' },
  biru: { label: 'Biru', out: '#CDE3FC', outD: '#0B57D0', wall: 'linear-gradient(165deg,#e8f1fd,#c9defb)', wallD: 'linear-gradient(165deg,#0a1c38,#0f2c5c)' },
  toska: { label: 'Toska', out: '#C2EBDF', outD: '#0D7A6E', wall: 'linear-gradient(165deg,#e6faf4,#bfe9db)', wallD: 'linear-gradient(165deg,#06302b,#0a4a43)' },
  ungu: { label: 'Ungu', out: '#E2D4FB', outD: '#7C3AED', wall: 'linear-gradient(165deg,#f3e8ff,#d9c6f7 45%,#e9a8f2)', wallD: 'linear-gradient(165deg,#2a1065,#4c1d95 60%,#6d28d9)' },
  pink: { label: 'Pink', out: '#FAD2E6', outD: '#C026D3', wall: 'linear-gradient(165deg,#fdeef6,#f9c6de 50%,#f5a3c8)', wallD: 'linear-gradient(165deg,#4a0f2e,#7e1c4e)' },
  oranye: { label: 'Oranye', out: '#FFE0C0', outD: '#EA580C', wall: 'linear-gradient(165deg,#fff3e2,#ffd9ad 55%,#ffb877)', wallD: 'linear-gradient(165deg,#3d1c07,#7c2d12)' },
  pantai: { label: 'Pantai', out: '#BDE7DB', outD: '#0F766E', wall: 'linear-gradient(165deg,#a8e0d4 0%,#7fd4c1 35%,#f6d9a8 70%,#f2b8c6 100%)', wallD: 'linear-gradient(165deg,#07332d,#0b4f47 60%,#3f2b3a)' },
  merah: { label: 'Merah', out: '#FBD3D3', outD: '#DC2626', wall: 'linear-gradient(165deg,#fdecec,#f9c9c9)', wallD: 'linear-gradient(165deg,#3f0a0a,#7f1d1d)' },
  kuning: { label: 'Kuning', out: '#FFF0B8', outD: '#CA8A04', wall: 'linear-gradient(165deg,#fffbe8,#fdf0b8 60%,#fde68a)', wallD: 'linear-gradient(165deg,#3a2a05,#713f12)' },
};

// Pola doodle khas wallpaper default WhatsApp (rekreasi, tile 100px, ~2x lebih rapat).
function doodleTile(stroke) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
    '<g fill="none" stroke="' + stroke + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="11" y="10" width="20" height="14" rx="7"/><path d="M18 24l-4 6 7-6"/>' +
    '<path d="M70 14l1.7 4.3 4.3 1.7-4.3 1.7-1.7 4.3-1.7-4.3-4.3-1.7 4.3-1.7z"/>' +
    '<path d="M10 47c5-6.5 9.3 6.5 14.3 0s9.3 6.5 14.3 0"/>' +
    '<circle cx="76" cy="49" r="7"/>' +
    '<path d="M37 76c-3.6-5-10.7-2.1-7.9 3.6l7.9 6.4 7.9-6.4c2.8-5.7-4.3-8.6-7.9-3.6z"/>' +
    '<path d="M83 71l3.6 8.6M88.6 69.3l-2.1 10"/>' +
    '<circle cx="21" cy="80" r="2.8"/>' +
    '<path d="M48 31h10M53 26v10"/>' +
    '<path d="M60 88l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/>' +
    '<circle cx="8" cy="88" r="2.2"/>' +
    '<path d="M52 60c3-4 6 4 9 0"/>' +
    '<path d="M90 30c-2.5-3.5-7.5-1.5-5.5 2.5l5.5 4.5 5.5-4.5c2-4-3-6-5.5-2.5z"/>' +
    '</g></svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}
const DOODLE_L = doodleTile('#D8D1C3');
const DOODLE_D = doodleTile('rgba(255,255,255,0.055)');

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CHEV = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
const SVG_CALL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VID = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_MIC = '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
const SVG_SMILEY = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.4 2.1 3.8 2.1 3.8-2.1 3.8-2.1"/><line x1="9.2" y1="9.4" x2="9.2" y2="9.4"/><line x1="14.8" y1="9.4" x2="14.8" y2="9.4"/></svg>';
const SVG_CLIP = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.4 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
const SVG_CAMIN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
const SVG_LOCK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px;margin-right:4px"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z"/></svg>';

function parseMsgs(text, defTicks) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    // Pisah header & pesan pada ':' pertama yang BUKAN bagian jam (jam = HH:MM mengandung ':').
    // Cth: "B|09:13|blue: halo" -> header "B|09:13|blue", pesan "halo".
    const ci = line.search(/:(?!\d)/);
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

// Centang ala WhatsApp: path kustom (bukan karakter ✓). Abu mengikuti tema, biru #53BDEB.
function ticksHtml(tk, dark) {
  const c = tk === 'blue' ? '#53BDEB' : (dark ? '#8696A0' : '#667781');
  if (tk === '1') return '<svg class="fcw-tk" width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.6 5.8l3.4 3.4L13.4 1.4"/></svg>';
  if (tk === '2' || tk === 'blue') return '<svg class="fcw-tk" width="19" height="11" viewBox="0 0 19 11" fill="none" stroke="' + c + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1.2 5.8l3.4 3.4L12 1.6"/><path d="M7.4 5.8l3.4 3.4L17.8 1.6"/></svg>';
  return '';
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fcw-ctl{display:grid;gap:10px;margin-bottom:12px}
.fcw-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#FFFFFF;font-family:Roboto,"Segoe UI",system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fcw-phone.fcw-ios{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.fcw-dark{background:#0B1014!important;border-color:rgba(255,255,255,.12)}
/* ---- status bar (system chrome, via T.sysbar) ---- */
.fcw-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#F0F2F5;color:#111B21}
.fcw-dark .fcw-sb{background:#1F2C34;color:#E9EDEF}
/* ---- header ---- */
.fcw-hd{display:flex;align-items:center;height:60px;padding:0 8px 0 0;background:#F0F2F5}
.fcw-dark .fcw-hd{background:#1F2C34}
.fcw-bk{background:none;border:0;padding:8px 6px 8px 8px;cursor:pointer;color:#3B4A54;display:flex;align-items:center}
.fcw-dark .fcw-bk{color:#AEBAC1}
.fcw-av{width:40px;height:40px;border-radius:50%;background:#8696A0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:600;overflow:hidden;flex:none}
.fcw-av img{width:100%;height:100%;object-fit:cover;display:block}
.fcw-nm{flex:1;min-width:0;margin-left:8px}
.fcw-nm b{display:block;font-size:17px;font-weight:500;color:#111B21;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcw-ios .fcw-nm b{font-weight:600}
.fcw-dark .fcw-nm b{color:#E9EDEF}
.fcw-nm span{display:block;font-size:13px;color:#667781;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcw-dark .fcw-nm span{color:#8696A0}
.fcw-nm span.fcw-on{color:#00A884}
.fcw-hic{display:flex;align-items:center;gap:24px;padding-right:12px;color:#3B4A54;flex:none}
.fcw-dark .fcw-hic{color:#AEBAC1}
/* header iPhone: chevron + identitas rata kiri (bukan tengah) */
.fcw-bkios{background:none;border:0;padding:8px 2px 8px 6px;cursor:pointer;color:#3B4A54;display:flex;align-items:center;flex:none}
.fcw-dark .fcw-bkios{color:#AEBAC1}
/* ---- area chat ---- */
.fcw-chat{display:flex;flex-direction:column;padding:8px 12px 12px;background:var(--fcw-di,none),var(--fcw-wall,#EFEAE2);min-height:340px}
.fcw-dark .fcw-chat{background:var(--fcw-did,none),var(--fcw-walld,#0B1014)}
.fcw-chip{align-self:center;background:#F0F2F5;color:#667781;font-size:12px;font-weight:500;letter-spacing:.4px;padding:6px 12px;border-radius:8px;margin:6px 0 10px}
.fcw-dark .fcw-chip{background:#182229;color:#8696A0}
.fcw-enc{align-self:center;max-width:94%;background:#FDF3C6;color:#54656F;font-size:12.5px;line-height:1.5;padding:7px 12px;border-radius:8px;text-align:center;margin:0 0 8px}
.fcw-dark .fcw-enc{background:#182229;color:#8696A0}
/* bubble: ekor di sudut atas sisi pengirim */
.fcw-bub{position:relative;max-width:80%;padding:7px 9px 8px;border-radius:8px;font-size:16px;line-height:21px;margin-top:2px;overflow-wrap:break-word;box-shadow:0 1px 0.5px rgba(0,0,0,.08)}
.fcw-ios .fcw-bub{font-size:17px;line-height:22px}
.fcw-grp{margin-top:10px}
.fcw-in{align-self:flex-start;background:#FFFFFF;color:#111B21}
.fcw-out{align-self:flex-end;background:var(--fcw-out,#D9FDD3);color:#111B21}
.fcw-dark .fcw-in{background:#1F2C34;color:#E9EDEF}
.fcw-dark .fcw-out{background:var(--fcw-outd,#005C4B);color:#E9EDEF}
/* bubble berekor melengkung ala WhatsApp: ekor = mask SVG (bukan segitiga tajam) */
.fcw-in.fcw-tail{border-top-left-radius:2px}
.fcw-out.fcw-tail{border-top-right-radius:2px}
.fcw-in.fcw-tail::before{content:"";position:absolute;left:-8px;top:0;width:12px;height:16px;background:#FFFFFF;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='16' viewBox='0 0 12 16'%3E%3Cpath d='M8 0H4C1.5 0 0 2 0 5C0 9.5 3.5 12.5 8 14Z'/%3E%3C/svg%3E") no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='16' viewBox='0 0 12 16'%3E%3Cpath d='M8 0H4C1.5 0 0 2 0 5C0 9.5 3.5 12.5 8 14Z'/%3E%3C/svg%3E") no-repeat}
.fcw-out.fcw-tail::before{content:"";position:absolute;right:-8px;top:0;width:12px;height:16px;background:var(--fcw-out,#D9FDD3);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='16' viewBox='0 0 12 16'%3E%3Cpath d='M4 0H8C10.5 0 12 2 12 5C12 9.5 8.5 12.5 4 14Z'/%3E%3C/svg%3E") no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='16' viewBox='0 0 12 16'%3E%3Cpath d='M4 0H8C10.5 0 12 2 12 5C12 9.5 8.5 12.5 4 14Z'/%3E%3C/svg%3E") no-repeat}
.fcw-dark .fcw-in.fcw-tail::before{background:#1F2C34}
.fcw-dark .fcw-out.fcw-tail::before{background:var(--fcw-outd,#005C4B)}
.fcw-meta{float:right;font-size:11px;color:#667781;margin:10px -1px 0 8px;line-height:1;white-space:nowrap}
.fcw-dark .fcw-meta{color:#8696A0}
.fcw-tk{vertical-align:-1px;margin-left:3px}
.fcw-tdots{display:inline-flex;gap:5px;align-items:center;padding:5px 3px}
.fcw-tdots i{width:7px;height:7px;border-radius:50%;background:#8696A0;animation:fcw-tb 1.1s infinite}
.fcw-tdots i:nth-child(2){animation-delay:.18s}
.fcw-tdots i:nth-child(3){animation-delay:.36s}
@keyframes fcw-tb{0%,60%,100%{transform:none;opacity:.55}30%{transform:translateY(-3px);opacity:1}}
/* ---- kolom input ---- */
.fcw-ibar{display:flex;align-items:center;gap:6px;padding:6px 8px 8px;background:#F0F2F5}
.fcw-dark .fcw-ibar{background:#1F2C34}
.fcw-pill{flex:1;display:flex;align-items:center;background:#FFFFFF;border-radius:24px;min-height:50px;padding:0 10px 0 12px}
.fcw-dark .fcw-pill{background:#2A3942}
.fcw-ph{flex:1;font-size:17px;color:#8696A0;margin:0 6px;white-space:nowrap;overflow:hidden}
.fcw-pico{display:flex;align-items:center;gap:14px;color:#8696A0;flex:none}
.fcw-mic{width:48px;height:48px;flex:none;border-radius:50%;background:#00A884;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.fcw-plus{width:32px;height:32px;flex:none;border:0;background:none;color:#8696A0;font-size:30px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.fcw-cam{flex:none;display:flex;align-items:center;color:#8696A0;padding:0 2px}
/* nav bawah: Android pill gesture / iPhone home indicator */
.fcw-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#F0F2F5}
.fcw-dark .fcw-nav{background:#1F2C34}
.fcw-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fcw-dark .fcw-nav i{background:rgba(255,255,255,.4)}
.fcw-home{display:flex;justify-content:center;align-items:center;height:20px;background:#F0F2F5}
.fcw-dark .fcw-home{background:#1F2C34}
.fcw-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fcw-dark .fcw-home i{background:rgba(255,255,255,.4)}
.fcw-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fcw-hint code{font-family:monospace;font-size:11.5px}
.fcw-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fcw-ctl"></div>');
  const inName = T.input('text', 'Nama kontak', 'Rizky');
  const inStatus = T.input('text', 'Status (online / last seen...)', 'online');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const selTheme = T.select([['light', 'Terang'], ['dark', 'Gelap']], 'light');
  const selChatTheme = T.select(Object.keys(CHAT_THEMES).map((k) => [k, CHAT_THEMES[k].label]), 'klasik');
  const selTicks = T.select([['blue', 'Dua biru (dibaca)'], ['2', 'Dua abu (diterima)'], ['1', 'Satu abu (terkirim)'], ['0', 'Tanpa centang']], 'blue');
  const inChip = T.input('text', 'Teks chip tanggal', 'Hari ini');
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
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Tema obrolan', selChatTheme));
  ctl.appendChild(T.field('Centang default (pesan keluar)', selTicks));
  ctl.appendChild(T.field('Teks chip tanggal', inChip));
  ctl.appendChild(T.field('Chip tanggal', selChip));
  ctl.appendChild(T.field('Notifikasi enkripsi', selEnc));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fcw-hint">Format: <code>A|10:30|blue: halo</code> — <b>A</b>=masuk (kiri), <b>B</b>=keluar (kanan). Segmen opsional: jam <code>HH:MM</code>, centang <code>1</code>/satu (terkirim), <code>2</code>/abu (diterima), <code>blue</code>/biru (dibaca). Contoh: <code>B|10:31|blue: juga baik!</code></div>'));

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inName.value = 'Rizky';
      inStatus.value = 'online';
      selTheme.value = 'light';
      selTicks.value = 'blue';
      inChip.value = 'Hari ini';
      selChip.value = '1';
      selEnc.value = '1';
      taMsg.value = SAMPLE;
      avatarUrl = null;
      draw();
      T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-wa.png'), true)
  );

  const phone = T.el('<div class="fcw-phone"></div>');

  function draw() {
    const dark = selTheme.value === 'dark';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
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
    const online = /^online$/i.test(status);
    const statusHtml = '<span' + (online ? ' class="fcw-on"' : '') + '>' + T.esc(status) + '</span>';

    let chatHtml = '';
    if (showChip && chipTxt) chatHtml += '<div class="fcw-chip">' + T.esc(chipTxt) + '</div>';
    if (showEnc) chatHtml += '<div class="fcw-enc">' + SVG_LOCK + 'Pesan dan panggilan terenkripsi secara end-to-end. Tidak seorang pun di luar chat ini, termasuk WhatsApp, yang dapat membaca atau mendengarkannya.</div>';

    let prevSide = null;
    msgs.forEach((m) => {
      const first = m.side !== prevSide;
      prevSide = m.side;
      const cls = m.side === 'B' ? 'fcw-out' : 'fcw-in';
      const typing = m.msg.trim() === '...';
      let metaHtml = '';
      if (!typing && m.time) metaHtml += T.esc(m.time);
      if (!typing && m.side === 'B' && m.tk !== '0') metaHtml += ticksHtml(m.tk, dark);
      chatHtml += '<div class="fcw-bub ' + cls + (first ? ' fcw-grp fcw-tail' : '') + '">' +
        (typing ? '<span class="fcw-tdots"><i></i><i></i><i></i></span>' : '<span>' + T.esc(m.msg) + '</span>') +
        (metaHtml ? '<span class="fcw-meta">' + metaHtml + '</span>' : '') +
        '</div>';
    });

    let sbHtml = T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark);
    // core.js menggambar fill baterai dengan lebar hardcoded yang tidak pas 77% dari
    // track dalamnya (77% terbaca ~56%). Koreksi di sini tanpa mengubah core.js:
    // iPhone: track 17 -> 13.1 | pill: track 19 -> 14.6 | outline: track 17 -> 13.1 | samsung: track 18.2 -> 14
    sbHtml = sbHtml
      .replace('x="2.5" y="2.5" width="14" height="7" rx="1.5"', 'x="2.5" y="2.5" width="13.1" height="7" rx="1.5"')
      .replace('x="2.5" y="2.5" width="14" height="7" rx="3.5"', 'x="2.5" y="2.5" width="14.6" height="7" rx="3.5"')
      .replace('x="2.5" y="2.5" width="13" height="7" rx="1.2"', 'x="2.5" y="2.5" width="13.1" height="7" rx="1.2"')
      .replace('x="3" y="3" width="13" height="7" rx="2"', 'x="3" y="3" width="14" height="7" rx="2"');
    sbHtml = '<div class="fcw-sb">' + sbHtml + '</div>';

    const hdHtml = isIPh
      ? '<div class="fcw-hd fcw-hdios"><button class="fcw-bkios" type="button" tabindex="-1">' + SVG_CHEV + '</button>' +
        '<div class="fcw-av">' + avHtml + '</div>' +
        '<div class="fcw-nm"><b>' + T.esc(name) + '</b>' + statusHtml + '</div>' +
        '<div class="fcw-hic">' + SVG_VID + SVG_CALL + '</div></div>'
      : '<div class="fcw-hd"><button class="fcw-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
        '<div class="fcw-av">' + avHtml + '</div>' +
        '<div class="fcw-nm"><b>' + T.esc(name) + '</b>' + statusHtml + '</div>' +
        '<div class="fcw-hic">' + SVG_VID + SVG_CALL + SVG_MORE + '</div></div>';

    const ibarHtml = isIPh
      ? '<div class="fcw-ibar"><button class="fcw-plus" type="button" tabindex="-1">+</button>' +
        '<div class="fcw-pill"><span class="fcw-ph">Pesan</span>' +
        '<span class="fcw-pico">' + SVG_SMILEY + '</span></div>' +
        '<span class="fcw-cam">' + SVG_CAMIN + '</span><div class="fcw-mic">' + SVG_MIC + '</div></div>' +
        '<div class="fcw-home"><i></i></div>'
      : '<div class="fcw-ibar"><div class="fcw-pill"><span class="fcw-pico">' + SVG_SMILEY + '</span>' +
        '<span class="fcw-ph">Pesan</span>' +
        '<span class="fcw-pico">' + SVG_CLIP + SVG_CAMIN + '</span></div>' +
        '<div class="fcw-mic">' + SVG_MIC + '</div></div>' +
        '<div class="fcw-nav"><i></i></div>';

    phone.className = 'fcw-phone fcw-' + (isIPh ? 'ios' : 'droid') + (dark ? ' fcw-dark' : '');
    const ct = CHAT_THEMES[selChatTheme.value] || CHAT_THEMES.default;
    phone.style.setProperty('--fcw-wall', ct.wall);
    phone.style.setProperty('--fcw-walld', ct.wallD);
    phone.style.setProperty('--fcw-out', ct.out);
    phone.style.setProperty('--fcw-outd', ct.outD);
    if (selChatTheme.value === 'klasik') {
      phone.style.setProperty('--fcw-di', DOODLE_L);
      phone.style.setProperty('--fcw-did', DOODLE_D);
    } else {
      phone.style.setProperty('--fcw-di', 'none');
      phone.style.setProperty('--fcw-did', 'none');
    }
    phone.innerHTML = sbHtml + hdHtml + '<div class="fcw-chat">' + chatHtml + '</div>' + ibarHtml;
  }

  [inName, inStatus, selPlatform, selBrand, selTheme, selChatTheme, selTicks, inChip, selChip, selEnc, taMsg].forEach((el) => {
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
