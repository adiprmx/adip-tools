import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.5';

export const meta = {
  id: 'fake-profil-wa',
  name: 'Fake Profil WA',
  cat: 'fakesos',
  icon: '👤',
  desc: 'Bikin screenshot profil WhatsApp palsu: Info Kontak / Profil Saya, Android / iPhone + unduh PNG.',
  keywords: 'whatsapp,profil,fake,palsu,screenshot,prank,android,iphone'
};

/* ============================================================
   Ikon gaya WhatsApp (outline, stroke 1.8, round caps) — 2026
   ============================================================ */
function svgIcon(inner, size, sw) {
  return '<svg width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
}
const P = {
  back: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  video: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  search: '<circle cx="11" cy="11" r="7.5"/><path d="M21 21l-4.3-4.3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  bellOff: '<path d="M8.7 3A6 6 0 0 1 18 8c0 4 .7 6.6 1.6 8"/><path d="M6.3 6.3C6.1 6.9 6 7.4 6 8c0 7-3 9-3 9h14"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/><path d="M3 3l18 18"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="M21 15l-5-5L5 21"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9.5V13l2.5 1.8"/><path d="M9.5 2.5h5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  block: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  report: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17.5v.01"/>',
  star: '<path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3 1.1-6.5L2.6 9.3l6.5-.9z"/>',
  person: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.9-3.8 3.9-5.7 7.5-5.7s6.6 1.9 7.5 5.7"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8v.01"/>',
  at: '<circle cx="12" cy="12" r="3.6"/><path d="M15.5 12a3.5 3.5 0 1 0-5 3.2c.8.4 1.9.6 3 .4 2.6-.5 4.1-2.3 4.1-5.5 0-3.6-2.6-6.3-6.2-6.3-4 0-7.2 3.2-7.2 7.4 0 4.1 2.9 7 6.7 7 2 0 3.6-.8 4.7-2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  note: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  palette: '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12.5" cy="8" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><path d="M12 20.5c-1.8 0-3.4-.6-4.6-1.6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  avatar: '<circle cx="12" cy="8.2" r="4.2" fill="currentColor" stroke="none"/><path d="M3.5 20.5c1-4.2 4-6.8 8.5-6.8s7.5 2.6 8.5 6.8" fill="currentColor" stroke="none"/>'
};
const IC = {};
Object.keys(P).forEach((k) => { IC[k] = (s, sw) => svgIcon(P[k], s, sw); });

/* Thumbnail dummy (bila tak ada avatar, media strip pakai pola senada WA) */
const THUMB_GRADS = [
  'linear-gradient(135deg,#7a8b99,#54656f)',
  'linear-gradient(135deg,#00a884,#02735e)',
  'linear-gradient(135deg,#8696a0,#667781)',
  'linear-gradient(135deg,#53bdeb,#2a7f9e)'
];

const CSS = `
.fpw-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpw-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.fpw-dark{background:#0B141A!important;border-color:rgba(255,255,255,.12)}
/* ---- status bar: system chrome via T.sysbar ---- */
.fpw-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 18px 0 22px;background:#FFFFFF;color:#111B21}
.fpw-dark .fpw-sb{background:#0B141A;color:#E9EDEF}
/* nav bawah */
.fpw-navb{display:flex;justify-content:center;padding:6px 0 10px;background:#FFFFFF}
.fpw-dark .fpw-navb{background:#0B141A}
.fpw-navb i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fpw-dark .fpw-navb i{background:rgba(255,255,255,.4)}
.fpw-home{display:flex;justify-content:center;align-items:center;height:22px;background:#F2F2F7}
.fpw-dark .fpw-home{background:#000000}
.fpw-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fpw-dark .fpw-home i{background:rgba(255,255,255,.4)}

/* ================= INFO KONTAK — ANDROID (2026) ================= */
.fpw-hd{display:flex;align-items:center;height:60px;padding:0 10px 0 2px;background:#FFFFFF}
.fpw-dark .fpw-hd{background:#0B141A}
.fpw-bk{background:none;border:0;padding:10px;cursor:pointer;color:#3B4A54;display:flex;align-items:center}
.fpw-dark .fpw-bk{color:#AEBAC1}
.fpw-htitle{flex:1;font-size:20px;font-weight:500;color:#111B21;margin-left:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.1px}
.fpw-dark .fpw-htitle{color:#E9EDEF}
.fpw-hd .fpw-hact{flex:none;display:flex;align-items:center;justify-content:center;width:48px;height:48px;color:#3B4A54}
.fpw-dark .fpw-hd .fpw-hact{color:#AEBAC1}
.fpw-hero{text-align:center;padding:6px 24px 0}
.fpw-av{width:150px;height:150px;border-radius:50%;background:#8696A0;color:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;margin:0 auto;overflow:hidden}
.fpw-av svg{width:92px;height:92px}
.fpw-av img{width:100%;height:100%;object-fit:cover;display:block}
.fpw-name{font-size:24px;font-weight:700;color:#111B21;margin:14px 0 0;letter-spacing:.1px}
.fpw-dark .fpw-name{color:#E9EDEF}
.fpw-num{font-size:15px;color:#667781;margin:6px 0 0}
.fpw-dark .fpw-num{color:#8696A0}
.fpw-seen{font-size:14px;color:#667781;margin:4px 0 0}
.fpw-dark .fpw-seen{color:#8696A0}
/* tombol aksi: squircle outline + ikon hijau (gaya 2026) */
.fpw-acts{display:flex;gap:12px;padding:22px 24px 10px}
.fpw-act{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid #E3E6E8;border-radius:18px;padding:14px 0 12px;background:transparent}
.fpw-dark .fpw-act{border-color:rgba(255,255,255,.16)}
.fpw-act .ai{color:#00A884;display:flex}
.fpw-act span{font-size:13px;color:#3B4A54}
.fpw-dark .fpw-act span{color:#AEBAC1}
.fpw-div{height:1px;background:rgba(0,0,0,.07)}
.fpw-dark .fpw-div{background:rgba(255,255,255,.09)}
.fpw-sec{padding:16px 24px}
.fpw-lbl{font-size:13px;color:#667781}
.fpw-dark .fpw-lbl{color:#8696A0}
.fpw-about{font-size:16px;color:#111B21;margin-top:8px;line-height:1.45}
.fpw-dark .fpw-about{color:#E9EDEF}
.fpw-mhead{display:flex;justify-content:space-between;align-items:center;padding:16px 24px 12px}
.fpw-mhead b{font-size:16px;font-weight:400;color:#111B21}
.fpw-dark .fpw-mhead b{color:#E9EDEF}
.fpw-mhead span{font-size:14px;color:#667781;display:flex;align-items:center;gap:2px}
.fpw-dark .fpw-mhead span{color:#8696A0}
.fpw-thumbs{display:flex;gap:8px;padding:0 24px 18px}
.fpw-th{width:72px;height:72px;border-radius:12px;flex:none;background-size:cover;background-position:center}
.fpw-row{display:flex;align-items:center;gap:18px;padding:14px 24px}
.fpw-ric{color:#8696A0;flex:none;display:flex}
.fpw-rtx{flex:1;min-width:0}
.fpw-rtx b{display:block;font-size:16px;font-weight:400;color:#111B21}
.fpw-dark .fpw-rtx b{color:#E9EDEF}
.fpw-rtx span{display:block;font-size:14px;color:#667781;margin-top:3px;line-height:1.4}
.fpw-dark .fpw-rtx span{color:#8696A0}
/* switch Material 3 */
.fpw-sw{width:52px;height:32px;border-radius:16px;background:#00A884;position:relative;flex:none;cursor:pointer;transition:background .2s;border:2px solid transparent}
.fpw-sw::after{content:"";position:absolute;top:50%;right:4px;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:right .18s}
.fpw-sw.off{background:#E2E4E6;border-color:#E2E4E6}
.fpw-dark .fpw-sw.off{background:#2A373F;border-color:#2A373F}
.fpw-sw.off::after{right:24px;background:#fff}
.fpw-dark .fpw-sw.off::after{background:#8696A0}
.fpw-red{display:flex;align-items:center;gap:18px;padding:14px 24px;color:#EA0038;font-size:16px}
.fpw-red .fpw-ric{color:#EA0038}

/* ================= INFO KONTAK — iPhone (2026, Liquid Glass) ================= */
.fii-wrap{background:#F2F2F7}
.fpw-dark .fii-wrap{background:#000000}
.fii-nav{position:relative;display:flex;align-items:center;height:66px;padding:0 14px;background:transparent}
.fii-glass{background:rgba(255,255,255,.62);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6);box-shadow:0 1px 8px rgba(0,0,0,.06)}
.fpw-dark .fii-glass{background:rgba(38,38,40,.55);box-shadow:0 1px 8px rgba(0,0,0,.3)}
/* FIX C (PNG export): html2canvas abaikan backdrop-filter — saat class png-export
   dipasang core.js/dlNodePng, tombol nav Liquid Glass pakai background solid tanpa blur. */
.png-export .fii-glass{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(28,28,32,.94)!important}
.fii-back{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#111B21;z-index:1}
.fpw-dark .fii-back{color:#fff}
.fii-title{position:absolute;left:0;right:0;text-align:center;font-size:17px;font-weight:600;color:#000;pointer-events:none;letter-spacing:-.2px}
.fpw-dark .fii-title{color:#fff}
.fii-edit{margin-left:auto;z-index:1;font-size:15px;font-weight:500;color:#111B21;padding:10px 18px;border-radius:22px}
.fpw-dark .fii-edit{color:#fff}
.fii-hero{text-align:center;padding:8px 24px 2px}
.fii-av{width:120px;height:120px;border-radius:50%;background:#8E8E93;color:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;margin:0 auto;overflow:hidden}
.fii-av svg{width:74px;height:74px}
.fii-av img{width:100%;height:100%;object-fit:cover;display:block}
.fii-name{font-size:22px;font-weight:700;color:#000;margin:12px 0 0;letter-spacing:-.2px}
.fpw-dark .fii-name{color:#fff}
.fii-sub{font-size:15px;color:#8E8E93;margin:5px 0 0}
.fpw-dark .fii-sub{color:#98989F}
.fii-seen{font-size:14px;color:#8E8E93;margin:3px 0 0}
.fpw-dark .fii-seen{color:#98989F}
.fii-acts{display:flex;gap:12px;padding:18px 20px 4px}
.fii-act{flex:1;background:#FFFFFF;border-radius:18px;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 0 14px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.fpw-dark .fii-act{background:#1C1C1E;box-shadow:none}
.fii-act .ai{color:#00A884;display:flex}
.fii-act span{font-size:13px;color:#111B21}
.fpw-dark .fii-act span{color:#E9EDEF}
.fii-sec{background:#FFFFFF;border-radius:18px;margin:14px 16px 0;overflow:hidden}
.fpw-dark .fii-sec{background:#1C1C1E}
.fii-row{display:flex;align-items:center;gap:14px;padding:14px 18px}
.fii-row+.fii-row{border-top:.5px solid rgba(0,0,0,.08)}
.fpw-dark .fii-row+.fii-row{border-top-color:rgba(255,255,255,.1)}
.fii-ric{color:#111B21;flex:none;display:flex}
.fpw-dark .fii-ric{color:#E9EDEF}
.fii-tx{flex:1;min-width:0}
.fii-tx b{display:block;font-size:16px;font-weight:400;color:#000}
.fpw-dark .fii-tx b{color:#fff}
.fii-val{font-size:15px;color:#8E8E93;white-space:nowrap}
.fpw-dark .fii-val{color:#98989F}
.fii-chev{color:#C7C7CC;flex:none;display:flex}
.fpw-dark .fii-chev{color:#48484A}
.fii-about{padding:14px 18px}
.fii-about .fii-lab{font-size:13px;color:#8E8E93;margin-bottom:6px}
.fpw-dark .fii-about .fii-lab{color:#98989F}
.fii-about .fii-tx2{font-size:16px;color:#000;line-height:1.4}
.fpw-dark .fii-about .fii-tx2{color:#fff}
.fii-thumbs{display:flex;gap:8px;padding:2px 18px 16px}
.fii-red{color:#FF3B30!important}
.fpw-dark .fii-red{color:#FF453A!important}
.fii-foot{height:20px}

/* ================= PROFIL SAYA — ANDROID (2026) ================= */
.fsa-head{display:flex;align-items:center;height:60px;padding:0 10px 0 2px;background:#FFFFFF}
.fpw-dark .fsa-head{background:#0B141A}
.fsa-title{font-size:20px;font-weight:600;color:#111B21;margin-left:2px;letter-spacing:.1px}
.fpw-dark .fsa-title{color:#E9EDEF}
.fsa-avwrap{width:150px;margin:22px auto 0}
.fsa-av{width:150px;height:150px;border-radius:50%;background:#8696A0;color:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;overflow:hidden}
.fsa-av svg{width:92px;height:92px}
.fsa-av img{width:100%;height:100%;object-fit:cover;display:block}
.fsa-edit{text-align:center;font-size:14px;font-weight:500;color:#00A884;margin-top:10px}
.fsa-rows{padding:10px 0 34px}
.fsa-row{display:flex;gap:24px;align-items:flex-start;padding:14px 26px}
.fsa-ic{color:#8696A0;flex:none;display:flex;margin-top:1px}
.fsa-lb{font-size:16px;font-weight:500;color:#111B21;letter-spacing:.1px}
.fpw-dark .fsa-lb{color:#E9EDEF}
.fsa-vl{font-size:14px;color:#667781;margin-top:3px;line-height:1.4}
.fpw-dark .fsa-vl{color:#8696A0}
.fsa-ph{font-size:14px;color:#00A884;margin-top:3px}

/* ================= PROFIL SAYA — iPhone (2026) ================= */
.fsi-wrap{background:#F2F2F7;min-height:560px}
.fpw-dark .fsi-wrap{background:#000000}
.fsi-nav{position:relative;display:flex;align-items:center;height:66px;padding:0 14px;background:transparent}
.fsi-avwrap{width:130px;margin:14px auto 0}
.fsi-av{width:130px;height:130px;border-radius:50%;background:#8E8E93;color:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;overflow:hidden}
.fsi-av svg{width:80px;height:80px}
.fsi-av img{width:100%;height:100%;object-fit:cover;display:block}
.fsi-edit{text-align:center;font-size:15px;font-weight:500;color:#00A884;margin-top:10px}
.fsi-sec{background:#FFFFFF;border-radius:18px;margin:16px 16px 0;overflow:hidden}
.fpw-dark .fsi-sec{background:#1C1C1E}
.fsi-row{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;gap:10px}
.fsi-row+.fsi-row{border-top:.5px solid rgba(0,0,0,.08)}
.fpw-dark .fsi-row+.fsi-row{border-top-color:rgba(255,255,255,.1)}
.fsi-lab{font-size:13px;color:#8E8E93;margin-bottom:3px}
.fpw-dark .fsi-lab{color:#98989F}
.fsi-val{font-size:17px;color:#000}
.fpw-dark .fsi-val{color:#fff}
.fsi-val.fsi-ph{color:#00A884}
.fsi-chev{color:#C7C7CC;flex:none;display:flex}
.fpw-dark .fsi-chev{color:#48484A}
.fsi-foot{height:24px}
.fpw-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
`;

export function render(root) {
  root.appendChild(T.el('<style>' + CSS + '</style>'));

  const ctl = T.el('<div class="fpw-ctl"></div>');
  const selTipe = T.select([['info', 'Info Kontak (layar info nomor orang)'], ['saya', 'Profil Saya (layar profil sendiri)']], 'info');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const selTheme = T.select([['light', 'Terang'], ['dark', 'Gelap']], 'light');
  const inName = T.input('text', 'Nama', 'Budi Santoso');
  const inNum = T.input('text', 'Nomor telepon', '+62 812-3456-7890');
  const inSeen = T.input('text', 'Last seen (khusus Info Kontak)', 'terakhir dilihat hari ini pukul 10.30');
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
        inSeen.value = 'terakhir dilihat hari ini pukul 10.30';
        inAbout.value = 'Hey there! I am using WhatsApp.';
        inUser.value = '';
      }
      avatarUrl = null;
      draw();
      T.scrollToPreview(phone);
      T.toast('Contoh dimuat');
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-wa.png'), true)
  );

  const phone = T.el('<div class="fpw-phone"></div>');

  const sbAndroid = () =>
    '<div class="fpw-sb">' + T.sysbar('android', selBrand.value, selTheme.value === 'dark') + '</div>';
  const sbIOS = () =>
    '<div class="fpw-sb">' + T.sysbar('iphone', null, selTheme.value === 'dark') + '</div>';

  const bkBtn = '<button class="fpw-bk" type="button" tabindex="-1">' + IC.back(24, 2.2) + '</button>';
  const chevR = IC.chevR(18, 2);

  function thumbs(d) {
    return THUMB_GRADS.map((g) =>
      '<div class="fpw-th" style="' + (d.avatar
        ? 'background-image:url(' + d.avatar + ')'
        : 'background:' + g) + '"></div>'
    ).join('');
  }

  /* ---------- INFO KONTAK · ANDROID ---------- */
  function infoAndroid(d) {
    const row = (icon, title, sub) =>
      '<div class="fpw-row"><div class="fpw-ric">' + icon + '</div>' +
      '<div class="fpw-rtx"><b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div></div>';
    return sbAndroid() +
      '<div class="fpw-hd">' + bkBtn + '<span class="fpw-htitle">Info kontak</span>' +
      '<span class="fpw-hact">' + IC.phone(24) + '</span>' +
      '<span class="fpw-hact">' + IC.video(24) + '</span></div>' +
      '<div class="fpw-hero">' +
      '<div class="fpw-av">' + d.av + '</div>' +
      '<div class="fpw-name">' + d.name + '</div>' +
      '<div class="fpw-num">' + d.num + '</div>' +
      (d.seen ? '<div class="fpw-seen">' + d.seen + '</div>' : '') +
      '</div>' +
      '<div class="fpw-acts">' +
      '<div class="fpw-act"><div class="ai">' + IC.phone(26) + '</div><span>Audio</span></div>' +
      '<div class="fpw-act"><div class="ai">' + IC.video(26) + '</div><span>Video</span></div>' +
      '<div class="fpw-act"><div class="ai">' + IC.search(26) + '</div><span>Cari</span></div>' +
      '</div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-sec"><div class="fpw-lbl">Tentang</div><div class="fpw-about">' + d.about + '</div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-mhead"><b>Media, tautan, dan dokumen</b><span>12 ' + chevR + '</span></div>' +
      '<div class="fpw-thumbs">' + thumbs(d) + '</div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-row"><div class="fpw-ric">' + IC.bellOff(24) + '</div>' +
      '<div class="fpw-rtx"><b>Bisukan notifikasi</b></div>' +
      '<div class="fpw-sw" role="switch" aria-checked="true"></div></div>' +
      '<div class="fpw-div"></div>' +
      row(IC.note(24), 'Notifikasi khusus', '') +
      '<div class="fpw-div"></div>' +
      row(IC.image(24), 'Visibilitas media', 'Tampilkan media yang baru diunduh dari chat ini di galeri perangkat Anda') +
      '<div class="fpw-div"></div>' +
      row(IC.timer(24), 'Pesan sementara', 'Mati') +
      '<div class="fpw-div"></div>' +
      row(IC.lock(24), 'Enkripsi', 'Pesan dan panggilan terenkripsi secara end-to-end. Ketuk untuk verifikasi.') +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-red"><div class="fpw-ric">' + IC.block(24) + '</div><span>Blokir ' + d.name + '</span></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-red"><div class="fpw-ric">' + IC.report(24) + '</div><span>Laporkan ' + d.name + '</span></div>' +
      '<div class="fpw-navb"><i></i></div>';
  }

  /* ---------- INFO KONTAK · iPhone (Liquid Glass, 2026) ---------- */
  function infoIPhone(d) {
    const sec = (inner) => '<div class="fii-sec">' + inner + '</div>';
    const row = (icon, title, val) =>
      '<div class="fii-row"><div class="fii-ric">' + icon + '</div>' +
      '<div class="fii-tx"><b>' + title + '</b></div>' +
      (val ? '<span class="fii-val">' + val + '</span>' : '') +
      '<span class="fii-chev">' + chevR + '</span></div>';
    return '<div class="fii-wrap">' + sbIOS() +
      '<div class="fii-nav"><span class="fii-back fii-glass">' + IC.chevL(22, 2.2) + '</span>' +
      '<span class="fii-title">Info kontak</span>' +
      '<span class="fii-edit fii-glass">Edit</span></div>' +
      '<div class="fii-hero">' +
      '<div class="fii-av">' + d.av + '</div>' +
      '<div class="fii-name">' + d.name + '</div>' +
      '<div class="fii-sub">' + d.num + '</div>' +
      (d.seen ? '<div class="fii-seen">' + d.seen + '</div>' : '') +
      '</div>' +
      '<div class="fii-acts">' +
      '<div class="fii-act"><div class="ai">' + IC.phone(26) + '</div><span>Audio</span></div>' +
      '<div class="fii-act"><div class="ai">' + IC.video(26) + '</div><span>Video</span></div>' +
      '<div class="fii-act"><div class="ai">' + IC.search(26) + '</div><span>Cari</span></div>' +
      '</div>' +
      sec('<div class="fii-about"><div class="fii-lab">Tentang</div><div class="fii-tx2">' + d.about + '</div></div>') +
      sec(
        '<div class="fii-row"><div class="fii-ric">' + IC.image(24) + '</div>' +
        '<div class="fii-tx"><b>Media, tautan, dan dokumen</b></div>' +
        '<span class="fii-val">12</span><span class="fii-chev">' + chevR + '</span></div>' +
        '<div class="fii-thumbs">' + thumbs(d) + '</div>' +
        '<div class="fii-row"><div class="fii-ric">' + IC.star(24) + '</div>' +
        '<div class="fii-tx"><b>Berbintang</b></div>' +
        '<span class="fii-val">Tidak ada</span><span class="fii-chev">' + chevR + '</span></div>'
      ) +
      sec(
        row(IC.bell(24), 'Notifikasi', '') +
        row(IC.palette(24), 'Tema chat', '') +
        row(IC.download(24), 'Simpan ke Foto', 'Default')
      ) +
      sec(
        row(IC.timer(24), 'Pesan sementara', 'Mati') +
        row(IC.lock(24), 'Enkripsi', '')
      ) +
      sec(
        '<div class="fii-row"><div class="fii-tx"><b class="fii-red">Blokir ' + d.name + '</b></div></div>' +
        '<div class="fii-row"><div class="fii-tx"><b class="fii-red">Laporkan ' + d.name + '</b></div></div>'
      ) +
      '<div class="fii-foot"></div><div class="fpw-home"><i></i></div></div>';
  }

  /* ---------- PROFIL SAYA · ANDROID ---------- */
  function sayaAndroid(d) {
    const rowSA = (icon, label, value, placeholder) => {
      const v = value
        ? '<div class="fsa-vl">' + value + '</div>'
        : '<div class="fsa-ph">' + placeholder + '</div>';
      return '<div class="fsa-row"><div class="fsa-ic">' + icon + '</div>' +
        '<div><div class="fsa-lb">' + label + '</div>' + v + '</div></div>';
    };
    return sbAndroid() +
      '<div class="fsa-head">' + bkBtn + '<span class="fsa-title">Profil</span></div>' +
      '<div class="fsa-avwrap"><div class="fsa-av">' + d.av + '</div></div>' +
      '<div class="fsa-edit">Edit</div>' +
      '<div class="fsa-rows">' +
      rowSA(IC.person(24), 'Nama', d.name, '') +
      rowSA(IC.info(24), 'Tentang', d.aboutRaw || '', 'Atur Tentang') +
      rowSA(IC.phone(24), 'Telepon', d.num, '') +
      rowSA(IC.at(24), 'Nama pengguna', d.userRaw || '', 'Pesan nama pengguna') +
      rowSA(IC.link(24), 'Tautan', '', 'Tambah tautan') +
      '</div>' +
      '<div class="fpw-navb"><i></i></div>';
  }

  /* ---------- PROFIL SAYA · iPhone ---------- */
  function sayaIPhone(d) {
    const rowSI = (label, value, placeholder) => {
      const v = value ? '<div class="fsi-val">' + value + '</div>' : '<div class="fsi-val fsi-ph">' + placeholder + '</div>';
      return '<div class="fsi-row"><div><div class="fsi-lab">' + label + '</div>' + v + '</div>' +
        '<span class="fsi-chev">' + chevR + '</span></div>';
    };
    return '<div class="fsi-wrap">' + sbIOS() +
      '<div class="fsi-nav"><span class="fii-back fii-glass">' + IC.chevL(22, 2.2) + '</span>' +
      '<span class="fii-title">Profil</span></div>' +
      '<div class="fsi-avwrap"><div class="fsi-av">' + d.av + '</div></div>' +
      '<div class="fsi-edit">Edit</div>' +
      '<div class="fsi-sec">' +
      rowSI('Nama', d.name, '') +
      rowSI('Tentang', d.aboutRaw || '', 'Atur Tentang') +
      rowSI('Nomor telepon', d.num, '') +
      rowSI('Nama pengguna', d.userRaw || '', 'Pesan nama pengguna') +
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
    const av = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : IC.avatar();
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
    phone.querySelectorAll('.fpw-sw').forEach((sw) => {
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
