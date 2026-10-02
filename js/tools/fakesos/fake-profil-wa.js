import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.1';

export const meta = {
  id: 'fake-profil-wa',
  name: 'Fake Profil WA',
  cat: 'fakesos',
  icon: '👤',
  desc: 'Bikin screenshot profil WhatsApp palsu: Info Kontak / Profil Saya, Android / iPhone + unduh PNG.',
  keywords: 'whatsapp,profil,fake,palsu,screenshot,prank,android,iphone'
};

/* ---------- ikon ---------- */
const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CALL = '<svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VID = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_SEARCH = '<svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>';
const SVG_CAM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.2"/></svg>';
const IC = {
  person: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>',
  info: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  at: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="3.4"/><path d="M15.4 12a3.4 3.4 0 1 0-4.9 3.05c.8.4 1.9.6 3 .4 2.5-.5 4-2.2 4-5.4 0-3.5-2.5-6.1-6-6.1-3.9 0-7 3.1-7 7.2 0 4 2.8 6.8 6.5 6.8 1.9 0 3.5-.7 4.6-1.9"/></svg>',
  phone: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  link: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  chevR: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  chevL: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
};

const THUMB_GRADS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)'
];

const CSS = `
.fpw-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpw-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpw-dark{background:#0B141A!important;border-color:rgba(255,255,255,.12)}
/* ---- status bar (system chrome) ---- */
.fpw-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 18px 0 22px;background:#FFFFFF;color:#111B21}
.fpw-dark .fpw-sb{background:#0B141A;color:#E9EDEF}
/* nav bawah: Android pill gesture / iPhone home indicator */
.fpw-navb{display:flex;justify-content:center;padding:6px 0 10px;background:#FFFFFF}
.fpw-dark .fpw-navb{background:#0B141A}
.fpw-navb i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fpw-dark .fpw-navb i{background:rgba(255,255,255,.4)}
.fpw-home{display:flex;justify-content:center;align-items:center;height:22px;background:#F2F2F7}
.fpw-dark .fpw-home{background:#000000}
.fpw-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fpw-dark .fpw-home i{background:rgba(255,255,255,.4)}
/* ===== INFO KONTAK — ANDROID ===== */
.fpw-hd{display:flex;align-items:center;height:58px;padding:0 12px 0 2px;background:#FFFFFF}
.fpw-dark .fpw-hd{background:#0B141A}
.fpw-bk{background:none;border:0;padding:8px;cursor:pointer;color:#3B4A54;display:flex;align-items:center}
.fpw-dark .fpw-bk{color:#AEBAC1}
.fpw-htitle{font-size:18px;font-weight:600;color:#111B21;margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpw-dark .fpw-htitle{color:#E9EDEF}
.fpw-hero{text-align:center;padding:4px 20px 4px}
.fpw-av{width:140px;height:140px;border-radius:50%;background:#8696A0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:500;margin:0 auto;overflow:hidden}
.fpw-av img{width:100%;height:100%;object-fit:cover;display:block}
.fpw-name{font-size:22px;font-weight:700;color:#111B21;margin:12px 0 0}
.fpw-dark .fpw-name{color:#E9EDEF}
.fpw-num{font-size:15px;color:#667781;margin:5px 0 0}
.fpw-dark .fpw-num{color:#8696A0}
.fpw-seen{font-size:13px;color:#667781;margin:3px 0 0}
.fpw-dark .fpw-seen{color:#8696A0}
.fpw-acts{display:flex;justify-content:center;gap:38px;margin:20px 0 16px}
.fpw-act{display:flex;flex-direction:column;align-items:center;gap:7px}
.fpw-actc{width:52px;height:52px;border-radius:50%;background:#F0F2F5;display:flex;align-items:center;justify-content:center;color:#00A884}
.fpw-dark .fpw-actc{background:#1F2C34}
.fpw-act span{font-size:13px;color:#667781}
.fpw-dark .fpw-act span{color:#8696A0}
.fpw-div{height:1px;background:rgba(0,0,0,.08);margin:0}
.fpw-dark .fpw-div{background:rgba(255,255,255,.08)}
.fpw-sec{padding:14px 20px}
.fpw-lbl{font-size:13px;color:#667781}
.fpw-dark .fpw-lbl{color:#8696A0}
.fpw-about{font-size:16px;color:#111B21;margin-top:6px;line-height:1.4}
.fpw-dark .fpw-about{color:#E9EDEF}
.fpw-mhead{display:flex;justify-content:space-between;align-items:center;padding:14px 20px 10px}
.fpw-mhead b{font-size:15px;font-weight:400;color:#111B21}
.fpw-dark .fpw-mhead b{color:#E9EDEF}
.fpw-mhead span{font-size:14px;color:#667781}
.fpw-dark .fpw-mhead span{color:#8696A0}
.fpw-thumbs{display:flex;gap:6px;padding:0 20px 16px}
.fpw-th{width:76px;height:76px;border-radius:8px;flex:none;background-size:cover;background-position:center}
.fpw-row{display:flex;align-items:center;gap:16px;padding:13px 20px}
.fpw-ric{font-size:22px;width:30px;text-align:center;flex:none}
.fpw-rtx{flex:1;min-width:0}
.fpw-rtx b{display:block;font-size:16px;font-weight:400;color:#111B21}
.fpw-dark .fpw-rtx b{color:#E9EDEF}
.fpw-rtx span{display:block;font-size:14px;color:#667781;margin-top:2px;line-height:1.35}
.fpw-dark .fpw-rtx span{color:#8696A0}
.fpw-sw{width:46px;height:27px;border-radius:14px;background:#00A884;position:relative;flex:none;cursor:pointer;transition:background .2s}
.fpw-sw::after{content:"";position:absolute;top:2.5px;right:2.5px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:right .2s}
.fpw-sw.off{background:#8696A0}
.fpw-sw.off::after{right:21.5px}
.fpw-red{display:flex;align-items:center;gap:16px;padding:13px 20px;color:#EA0038;font-size:16px}
/* ===== INFO KONTAK — iPhone ===== */
.fii-wrap{background:#F2F2F7}
.fpw-dark .fii-wrap{background:#000000}
.fii-nav{position:relative;display:flex;align-items:center;height:52px;padding:0 10px;background:#F2F2F7}
.fpw-dark .fii-nav{background:#000000}
.fii-back{display:flex;align-items:center;color:#007AFF;padding-left:2px;z-index:1}
.fii-title{position:absolute;left:0;right:0;text-align:center;font-size:17px;font-weight:600;color:#000;pointer-events:none}
.fpw-dark .fii-title{color:#fff}
.fii-hero{background:#FFFFFF;text-align:center;padding:10px 20px 6px}
.fpw-dark .fii-hero{background:#1C1C1E}
.fii-av{width:120px;height:120px;border-radius:50%;background:#8E8E93;color:#fff;display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:500;margin:0 auto;overflow:hidden}
.fii-av img{width:100%;height:100%;object-fit:cover;display:block}
.fii-name{font-size:22px;font-weight:700;color:#000;margin:10px 0 0}
.fpw-dark .fii-name{color:#fff}
.fii-sub{font-size:14px;color:#8E8E93;margin:4px 0 0}
.fii-acts{display:flex;justify-content:center;gap:42px;background:#FFFFFF;padding:16px 0 18px}
.fpw-dark .fii-acts{background:#1C1C1E}
.fii-act{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:#8E8E93}
.fii-actc{width:54px;height:54px;border-radius:50%;background:#F2F2F7;display:flex;align-items:center;justify-content:center;color:#007AFF}
.fpw-dark .fii-actc{background:#2C2C2E}
.fii-sec{background:#FFFFFF;border-radius:12px;margin:16px 14px 0;overflow:hidden}
.fpw-dark .fii-sec{background:#1C1C1E}
.fii-row{display:flex;align-items:center;gap:12px;padding:13px 16px}
.fii-row+.fii-row{border-top:.5px solid rgba(0,0,0,.1)}
.fpw-dark .fii-row+.fii-row{border-top-color:rgba(255,255,255,.12)}
.fii-ric{font-size:22px;width:30px;text-align:center;flex:none}
.fii-tx{flex:1;min-width:0}
.fii-tx b{display:block;font-size:16px;font-weight:400;color:#000}
.fpw-dark .fii-tx b{color:#fff}
.fii-tx span{display:block;font-size:13px;color:#8E8E93;margin-top:2px;line-height:1.35}
.fii-sw{width:51px;height:31px;border-radius:16px;background:#34C759;position:relative;flex:none;cursor:pointer}
.fii-sw::after{content:"";position:absolute;top:2px;right:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,.25);transition:right .18s}
.fii-sw.off{background:rgba(120,120,128,.32)}
.fii-sw.off::after{right:22px}
.fii-red{color:#FF3B30!important}
.fii-foot{height:22px}
/* ===== PROFIL SAYA — ANDROID ===== */
.fsa-head{display:flex;align-items:center;gap:18px;padding:12px 14px;background:#FFFFFF}
.fpw-dark .fsa-head{background:#0B141A}
.fsa-head .fpw-bk{color:#3B4A54}
.fpw-dark .fsa-head .fpw-bk{color:#AEBAC1}
.fsa-title{font-size:20px;font-weight:700;color:#111B21}
.fpw-dark .fsa-title{color:#E9EDEF}
.fsa-avwrap{position:relative;width:150px;margin:24px auto 0}
.fsa-av{width:150px;height:150px;border-radius:50%;background:#8696A0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:68px;font-weight:500;overflow:hidden}
.fsa-av img{width:100%;height:100%;object-fit:cover;display:block}
.fsa-cam{position:absolute;right:0;bottom:8px;width:52px;height:52px;border-radius:50%;background:#00A884;display:flex;align-items:center;justify-content:center;border:3px solid #FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.fpw-dark .fsa-cam{border-color:#0B141A}
.fsa-rows{padding:30px 0 34px}
.fsa-row{display:flex;gap:28px;align-items:flex-start;padding:17px 34px}
.fsa-ic{color:#8696A0;flex:none;margin-top:1px}
.fsa-lb{font-size:17px;font-weight:700;color:#111B21}
.fpw-dark .fsa-lb{color:#E9EDEF}
.fsa-vl{font-size:15.5px;color:#667781;margin-top:4px;line-height:1.4}
.fpw-dark .fsa-vl{color:#8696A0}
.fsa-ph{font-size:15.5px;color:#00A884;margin-top:4px}
/* ===== PROFIL SAYA — iPhone ===== */
.fsi-wrap{background:#F2F2F7;min-height:560px}
.fpw-dark .fsi-wrap{background:#000000}
.fsi-nav{position:relative;display:flex;align-items:center;justify-content:center;height:54px;background:#F2F2F7;border-bottom:.5px solid rgba(0,0,0,.12)}
.fpw-dark .fsi-nav{background:#000;border-color:rgba(255,255,255,.14)}
.fsi-back{position:absolute;left:6px;display:flex;align-items:center;color:#007AFF;font-size:17px}
.fsi-title{font-size:17px;font-weight:600;color:#000}
.fpw-dark .fsi-title{color:#fff}
.fsi-avwrap{position:relative;width:130px;margin:26px auto 0}
.fsi-av{width:130px;height:130px;border-radius:50%;background:#8E8E93;color:#fff;display:flex;align-items:center;justify-content:center;font-size:58px;font-weight:500;overflow:hidden}
.fsi-av img{width:100%;height:100%;object-fit:cover;display:block}
.fsi-cam{position:absolute;right:-2px;bottom:6px;width:44px;height:44px;border-radius:50%;background:#007AFF;display:flex;align-items:center;justify-content:center;border:3px solid #F2F2F7}
.fpw-dark .fsi-cam{border-color:#000}
.fsi-sec{background:#FFFFFF;border-radius:12px;margin:20px 14px 0;overflow:hidden}
.fpw-dark .fsi-sec{background:#1C1C1E}
.fsi-row{display:flex;align-items:center;justify-content:space-between;padding:12px 16px}
.fsi-row+.fsi-row{border-top:.5px solid rgba(0,0,0,.1)}
.fpw-dark .fsi-row+.fsi-row{border-top-color:rgba(255,255,255,.12)}
.fsi-lab{font-size:12.5px;color:#8E8E93;margin-bottom:3px}
.fsi-val{font-size:17px;color:#000}
.fpw-dark .fsi-val{color:#fff}
.fsi-val.fsi-ph{color:#8E8E93}
.fsi-chev{color:#C7C7CC;flex:none}
.fsi-foot{height:26px}
.fpw-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
`;

export function render(root) {
  root.appendChild(T.el('<style>' + CSS + '</style>'));

  const ctl = T.el('<div class="fpw-ctl"></div>');
  const selTipe = T.select([['info', 'Info Kontak (layar info nomor orang)'], ['saya', 'Profil Saya (layar profil sendiri)']], 'info');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['vivo', 'Vivo'], ['oppo', 'Oppo'], ['pixel', 'Pixel / Stock']], 'xiaomi');
  const selTheme = T.select([['light', 'Terang'], ['dark', 'Gelap']], 'light');
  const inName = T.input('text', 'Nama', 'Budi Santoso');
  const inNum = T.input('text', 'Nomor telepon', '+62 812-3456-7890');
  const inSeen = T.input('text', 'Last seen (khusus Info Kontak)', 'last seen today at 10.30');
  const inAbout = T.input('text', 'About / Tentang', 'Hey there! I am using WhatsApp.');
  const inUser = T.input('text', 'Nama pengguna (khusus Profil Saya)', '');

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

  ctl.appendChild(T.field('Tipe layar', selTipe));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Nama', inName));
  ctl.appendChild(T.field('Nomor telepon', inNum));
  ctl.appendChild(T.field('Last seen', inSeen, 'Hanya dipakai di tipe Info Kontak.'));
  ctl.appendChild(T.field('About / Tentang', inAbout));
  ctl.appendChild(T.field('Nama pengguna', inUser, 'Hanya dipakai di tipe Profil Saya. Kosongkan untuk tampil "Pesan nama pengguna".'));
  ctl.appendChild(btnAvatar);

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      if (selTipe.value === 'saya') {
        inName.value = 'Adip RMX';
        inNum.value = '+62 812-3456-7890';
        inAbout.value = 'Hey there! I am using WhatsApp.';
        inUser.value = 'adip.rmx';
      } else {
        inName.value = 'Budi Santoso';
        inNum.value = '+62 812-3456-7890';
        inSeen.value = 'last seen today at 10.30';
        inAbout.value = 'Hey there! I am using WhatsApp.';
        inUser.value = '';
      }
      avatarUrl = null;
      draw();
      T.toast('Contoh dimuat');
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-wa.png'), true)
  );

  const phone = T.el('<div class="fpw-phone"></div>');

  const sbAndroid = () =>
    '<div class="fpw-sb">' + T.sysbar('android', selBrand.value) + '</div>';
  const sbIOS = () =>
    '<div class="fpw-sb">' + T.sysbar('iphone', selBrand.value) + '</div>';

  function infoAndroid(d) {
    const thumbs = THUMB_GRADS.map((g) =>
      '<div class="fpw-th" style="' + (d.avatar
        ? 'background-image:url(' + d.avatar + ')'
        : 'background:' + g) + '"></div>'
    ).join('');
    return sbAndroid() +
      '<div class="fpw-hd"><button class="fpw-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<span class="fpw-htitle">Contact info</span></div>' +
      '<div class="fpw-hero">' +
      '<div class="fpw-av">' + d.av + '</div>' +
      '<div class="fpw-name">' + d.name + '</div>' +
      '<div class="fpw-num">' + d.num + '</div>' +
      (d.seen ? '<div class="fpw-seen">' + d.seen + '</div>' : '') +
      '</div>' +
      '<div class="fpw-acts">' +
      '<div class="fpw-act"><div class="fpw-actc">' + SVG_CALL + '</div><span>Audio</span></div>' +
      '<div class="fpw-act"><div class="fpw-actc">' + SVG_VID + '</div><span>Video</span></div>' +
      '<div class="fpw-act"><div class="fpw-actc">' + SVG_SEARCH + '</div><span>Cari</span></div>' +
      '</div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-sec"><div class="fpw-lbl">About</div><div class="fpw-about">' + d.about + '</div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-mhead"><b>Media, links, and docs</b><span>12 ›</span></div>' +
      '<div class="fpw-thumbs">' + thumbs + '</div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-row"><div class="fpw-ric">🔕</div>' +
      '<div class="fpw-rtx"><b>Bisukan notifikasi</b></div>' +
      '<div class="fpw-sw" role="switch" aria-checked="true"></div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-row"><div class="fpw-ric">🖼️</div>' +
      '<div class="fpw-rtx"><b>Visibilitas media</b><span>Tampilkan media yang baru diunduh dari chat ini di galeri perangkatmu</span></div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-row"><div class="fpw-ric">⏱️</div>' +
      '<div class="fpw-rtx"><b>Pesan sementara</b><span>Mati</span></div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-row"><div class="fpw-ric">🔒</div>' +
      '<div class="fpw-rtx"><b>Enkripsi</b><span>Pesan dan panggilan terenkripsi secara end-to-end. Ketuk untuk verifikasi.</span></div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-red"><div class="fpw-ric">🚫</div><span>Blokir ' + d.name + '</span></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-red"><div class="fpw-ric">⚠️</div><span>Laporkan ' + d.name + '</span></div>' +
      '<div class="fpw-navb"><i></i></div>';
  }

  function infoIPhone(d) {
    const thumbs = THUMB_GRADS.map((g) =>
      '<div class="fpw-th" style="' + (d.avatar
        ? 'background-image:url(' + d.avatar + ')'
        : 'background:' + g) + '"></div>'
    ).join('');
    const sec = (inner) => '<div class="fii-sec">' + inner + '</div>';
    const row = (icon, title, sub) =>
      '<div class="fii-row"><div class="fii-ric">' + icon + '</div>' +
      '<div class="fii-tx"><b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div></div>';
    return '<div class="fii-wrap">' + sbIOS() +
      '<div class="fii-nav"><span class="fii-back">' + IC.chevL + '</span>' +
      '<span class="fii-title">Contact Info</span></div>' +
      '<div class="fii-hero">' +
      '<div class="fii-av">' + d.av + '</div>' +
      '<div class="fii-name">' + d.name + '</div>' +
      '<div class="fii-sub">' + d.num + '</div>' +
      (d.seen ? '<div class="fii-sub">' + d.seen + '</div>' : '') +
      '</div>' +
      '<div class="fii-acts">' +
      '<div class="fii-act"><div class="fii-actc">' + SVG_CALL + '</div><span>Audio</span></div>' +
      '<div class="fii-act"><div class="fii-actc">' + SVG_VID + '</div><span>Video</span></div>' +
      '<div class="fii-act"><div class="fii-actc">' + SVG_SEARCH + '</div><span>Search</span></div>' +
      '</div>' +
      sec(row('', 'About', d.aboutRaw)) +
      sec('<div class="fii-row"><div class="fii-tx"><b>Media, Links, and Docs</b></div>' +
        '<span style="color:#8E8E93;font-size:15px">12 ›</span></div>' +
        '<div style="padding:2px 16px 14px"><div class="fpw-thumbs" style="padding:0">' + thumbs + '</div></div>') +
      sec(
        '<div class="fii-row"><div class="fii-ric">🔕</div><div class="fii-tx"><b>Mute Notifications</b></div>' +
        '<div class="fii-sw" role="switch" aria-checked="true"></div></div>' +
        row('🖼️', 'Media Visibility', 'Show newly downloaded media from this chat in your device gallery') +
        row('⏱️', 'Disappearing Messages', 'Off') +
        row('🔒', 'Encryption', 'Messages and calls are end-to-end encrypted. Tap to verify.')
      ) +
      sec(
        '<div class="fii-row"><div class="fii-tx"><b class="fii-red">Block ' + d.name + '</b></div></div>' +
        '<div class="fii-row"><div class="fii-tx"><b class="fii-red">Report ' + d.name + '</b></div></div>'
      ) +
      '<div class="fii-foot"></div><div class="fpw-home"><i></i></div></div>';
  }

  function sayaAndroid(d) {
    const rowSA = (icon, label, value, placeholder) => {
      const v = value
        ? '<div class="fsa-vl">' + value + '</div>'
        : '<div class="fsa-ph">' + placeholder + '</div>';
      return '<div class="fsa-row"><div class="fsa-ic">' + icon + '</div>' +
        '<div><div class="fsa-lb">' + label + '</div>' + v + '</div></div>';
    };
    return sbAndroid() +
      '<div class="fsa-head"><button class="fpw-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<span class="fsa-title">Profil</span></div>' +
      '<div class="fsa-avwrap"><div class="fsa-av">' + d.av + '</div>' +
      '<div class="fsa-cam">' + SVG_CAM + '</div></div>' +
      '<div class="fsa-rows">' +
      rowSA(IC.person, 'Nama', d.name, '') +
      rowSA(IC.info, 'Tentang', d.aboutRaw || '', 'Atur isi Tentang') +
      rowSA(IC.at, 'Nama pengguna', d.userRaw || '', 'Pesan nama pengguna') +
      rowSA(IC.phone, 'Telepon', d.num, '') +
      rowSA(IC.link, 'Tautan', '', 'Tambah tautan') +
      '</div>' +
      '<div class="fpw-navb"><i></i></div>';
  }

  function sayaIPhone(d) {
    const rowSI = (label, value, placeholder) => {
      const v = value ? '<div class="fsi-val">' + value + '</div>' : '<div class="fsi-val fsi-ph">' + placeholder + '</div>';
      return '<div class="fsi-row"><div><div class="fsi-lab">' + label + '</div>' + v + '</div>' +
        '<span class="fsi-chev">' + IC.chevR + '</span></div>';
    };
    return '<div class="fsi-wrap">' + sbIOS() +
      '<div class="fsi-nav"><span class="fsi-back">' + IC.chevL + '<span>Settings</span></span>' +
      '<span class="fsi-title">Profile</span></div>' +
      '<div class="fsi-avwrap"><div class="fsi-av">' + d.av + '</div>' +
      '<div class="fsi-cam">' + SVG_CAM + '</div></div>' +
      '<div class="fsi-sec">' +
      rowSI('Name', d.name, '') +
      rowSI('About', d.aboutRaw || '', 'Set your about') +
      rowSI('Phone Number', d.num, '') +
      '</div>' +
      '<div class="fsi-foot"></div><div class="fpw-home"><i></i></div></div>';
  }

  function draw() {
    const tipe = selTipe.value;
    const plat = selPlatform.value;
    const dark = selTheme.value === 'dark';
    brandField.style.display = plat === 'android' ? '' : 'none';
    const name = inName.value.trim() || 'Kontak';
    const num = inNum.value.trim() || '+62 812-3456-7890';
    const seen = inSeen.value.trim();
    const about = inAbout.value.trim();
    const aboutRaw = about ? T.esc(about) : '';
    const userRaw = inUser.value.trim() ? T.esc(inUser.value.trim()) : '';
    const initial = T.esc((name.trim()[0] || '?').toUpperCase());
    const av = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : initial;
    const d = {
      name: T.esc(name), num: T.esc(num), seen: seen ? T.esc(seen) : '',
      about: aboutRaw || T.esc('Hey there! I am using WhatsApp.'),
      aboutRaw, userRaw, av, avatar: avatarUrl
    };
    let html;
    if (tipe === 'info') html = plat === 'android' ? infoAndroid(d) : infoIPhone(d);
    else html = plat === 'android' ? sayaAndroid(d) : sayaIPhone(d);
    phone.className = 'fpw-phone' + (dark ? ' fpw-dark' : '');
    phone.innerHTML = html;
    phone.querySelectorAll('.fpw-sw,.fii-sw').forEach((sw) => {
      sw.addEventListener('click', () => {
        const off = sw.classList.toggle('off');
        sw.setAttribute('aria-checked', off ? 'false' : 'true');
      });
    });
  }

  [selTipe, selPlatform, selBrand, selTheme, inName, inNum, inSeen, inAbout, inUser].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fpw-note">' + T.esc(LOCAL_NOTE) + '</div>'));
  draw();
}
