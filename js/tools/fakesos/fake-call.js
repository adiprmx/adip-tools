import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.3';

export const meta = {"id":"fake-call","name":"Fake Panggilan Masuk","cat":"fakesos","icon":"📞","desc":"Bikin screenshot layar panggilan masuk palsu + unduh PNG.","keywords":"telepon,call,panggilan,fake,palsu,screenshot,prank"};

const P = 'fkcl';

/* Ikon garis ala WhatsApp (stroke 2px, 24x24). Gagang tutup telepon asli WA =
   gagang biasa diputar 135° (tanpa garis coret). */
const IC = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5"/><path d="M15 20h5v-5"/><path d="M4 4l6.5 6.5"/><path d="M20 20l-6.5-6.5"/></svg>',
  padd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.6"/><path d="M3.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8.2" r="4.2"/><path d="M3.5 20.5c.8-4.3 4.3-6.8 8.5-6.8s7.7 2.5 8.5 6.8z"/></svg>'
};
const ic = (n, rot) => '<span class="' + P + '-ic' + (rot ? ' ' + P + '-rot' : '') + '">' + IC[n] + '</span>';

/* Pola doodle generik samar (bukan artwork WhatsApp) untuk latar panggilan berlangsung. */
const doodle = '<svg class="' + P + '-doodle" width="100%" height="100%" aria-hidden="true">' +
  '<defs><pattern id="' + P + '-dd" width="150" height="150" patternUnits="userSpaceOnUse">' +
  '<g fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round">' +
  '<circle cx="24" cy="34" r="7"/>' +
  '<path d="M72 22v16M64 30h16"/>' +
  '<path d="M112 62q8-10 16 0t16 0"/>' +
  '<path d="M26 98l10 10 10-10 10 10"/>' +
  '<path d="M126 128l12-12M138 128l-12-12"/>' +
  '<circle cx="104" cy="116" r="2.6" fill="#fff" stroke="none"/>' +
  '<circle cx="52" cy="130" r="2.6" fill="#fff" stroke="none"/>' +
  '<circle cx="140" cy="30" r="2.6" fill="#fff" stroke="none"/>' +
  '</g></pattern></defs>' +
  '<rect width="100%" height="100%" fill="url(#' + P + '-dd)"/></svg>';

export function render(root) {
  const S = { platform: 'android', tipe: 'masuk', media: 'audio', nama: 'Mama', avatar: '' };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0;padding:26px 12px;background:#101014;border-radius:14px}' +
    '.' + P + '-screen{width:360px;height:640px;max-width:100%;border-radius:26px;overflow:hidden;position:relative;flex:none;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#e9edef;background:#0b141a;box-shadow:0 12px 40px rgba(0,0,0,.5)}' +
    '.' + P + '-doodle{position:absolute;inset:0;opacity:.05;pointer-events:none}' +
    '.' + P + '-ct{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
    // status bar (isi via T.sysbar)
    '.' + P + '-sba{display:flex;align-items:center;justify-content:space-between;padding:14px 22px 0;font-size:14px;font-weight:500;position:relative;z-index:1}' +
    '.' + P + '-sbi{display:flex;align-items:center;justify-content:space-between;padding:17px 27px 0;font-size:15px;font-weight:600;position:relative;z-index:1}' +
    // bottom chrome
    '.' + P + '-home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:123px;height:4px;border-radius:3px;background:rgba(255,255,255,.88);z-index:2}' +
    '.' + P + '-navpill{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:104px;height:4px;border-radius:3px;background:rgba(255,255,255,.55);z-index:2}' +
    // ikon
    '.' + P + '-ic{display:inline-flex;flex:none;vertical-align:middle}' +
    '.' + P + '-ic svg{width:100%;height:100%;display:block}' +
    '.' + P + '-rot{display:inline-block;transform:rotate(135deg)}' +
    // avatar
    '.' + P + '-avwrap{display:flex;justify-content:center}' +
    '.' + P + '-av{width:120px;height:120px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#3b4a54;color:#8696a0}' +
    '.' + P + '-av img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-av .' + P + '-ic{width:56px;height:56px}' +
    '.' + P + '-av.lg{width:140px;height:140px}' +
    '.' + P + '-av.lg .' + P + '-ic{width:66px;height:66px}' +
    // incoming
    '.' + P + '-inhead{text-align:center;padding:64px 24px 0}' +
    '.' + P + '-nm{font-size:24px;font-weight:600;color:#e9edef;margin-top:18px;word-break:break-word}' +
    '.' + P + '-callabel{font-size:15px;color:#8696a0;margin-top:8px}' +
    '.' + P + '-sp{flex:1}' +
    '.' + P + '-inbtns{display:flex;justify-content:space-between;align-items:center;margin:0 30px 70px}' +
    '.' + P + '-roundbtn{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-roundbtn .' + P + '-ic{width:28px;height:28px}' +
    '.' + P + '-accept{background:#25d366}' +
    '.' + P + '-decline{background:#ea0038}' +
    // ongoing — header
    '.' + P + '-onbar{display:grid;grid-template-columns:46px 1fr 46px;align-items:center;padding:10px 14px 0}' +
    '.' + P + '-hbtn{width:46px;height:46px;border-radius:50%;background:#202c33;display:flex;align-items:center;justify-content:center;color:#e9edef}' +
    '.' + P + '-hbtn .' + P + '-ic{width:22px;height:22px}' +
    '.' + P + '-onid{text-align:center;min-width:0;padding:0 6px}' +
    '.' + P + '-onnm{font-size:20px;font-weight:700;color:#e9edef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-lockrow{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;font-size:13px;color:#8696a0;white-space:nowrap}' +
    '.' + P + '-lockrow .' + P + '-ic{width:12px;height:12px}' +
    // ongoing — avatar + timer
    '.' + P + '-onav{margin-top:44px}' +
    '.' + P + '-ontimer{text-align:center;font-size:15px;color:#8696a0;margin-top:14px}' +
    // ongoing — island + end
    '.' + P + '-islandbar{align-self:center;display:flex;align-items:center;gap:14px;background:rgba(32,44,51,.85);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-radius:999px;padding:10px 14px;margin-bottom:18px}' +
    '.' + P + '-ctl{width:50px;height:50px;border-radius:50%;border:1.5px solid rgba(255,255,255,.32);display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-ctl .' + P + '-ic{width:22px;height:22px}' +
    '.' + P + '-endrow{display:flex;justify-content:center;margin-bottom:66px}' +
    '.' + P + '-endbtn{width:68px;height:68px;border-radius:50%;background:#ea0038;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-endbtn .' + P + '-ic{width:30px;height:30px}' +
    // FIX C (PNG export): html2canvas abaikan backdrop-filter — saat class png-export
    // dipasang core.js/dlNodePng, island bar pakai solid gelap pekat (#202c33 = rgb(32,44,51) dari rgba(32,44,51,.85)).
    '.png-export .' + P + '-islandbar{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#202c33!important}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  function sb() {
    const isIPh = S.platform === 'iphone';
    return '<div class="' + P + '-' + (isIPh ? 'sbi' : 'sba') + '">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>';
  }
  function bottomChrome() {
    return S.platform === 'iphone'
      ? '<div class="' + P + '-home"></div>'
      : '<div class="' + P + '-navpill"></div>';
  }

  function avHtml(lg) {
    const inner = S.avatar
      ? '<img src="' + T.esc(S.avatar) + '" alt="">'
      : ic('person');
    return '<div class="' + P + '-avwrap' + (lg ? ' ' + P + '-onav' : '') + '"><div class="' + P + '-av' + (lg ? ' lg' : '') + '">' + inner + '</div></div>';
  }

  function draw() {
    brandField.style.display = (S.platform === 'android') ? '' : 'none';
    let html = '';
    if (S.tipe === 'masuk') {
      const lbl = S.media === 'video' ? 'Panggilan video WhatsApp' : 'Panggilan suara WhatsApp';
      html = '<div class="' + P + '-screen">' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-inhead">' + avHtml(false) +
            '<div class="' + P + '-nm">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-callabel">' + lbl + '</div>' +
          '</div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-inbtns">' +
            '<div class="' + P + '-roundbtn ' + P + '-decline" title="Tolak">' + ic('phone', true) + '</div>' +
            '<div class="' + P + '-roundbtn ' + P + '-accept" title="Jawab">' + ic('phone') + '</div>' +
          '</div>' +
        '</div>' + bottomChrome() + '</div>';
    } else {
      html = '<div class="' + P + '-screen">' + doodle +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-onbar">' +
            '<div class="' + P + '-hbtn">' + ic('minimize') + '</div>' +
            '<div class="' + P + '-onid">' +
              '<div class="' + P + '-onnm">' + T.esc(S.nama) + '</div>' +
              '<div class="' + P + '-lockrow">' + ic('lock') + '<span>Terenkripsi secara end-to-end</span></div>' +
            '</div>' +
            '<div class="' + P + '-hbtn">' + ic('padd') + '</div>' +
          '</div>' +
          avHtml(true) +
          '<div class="' + P + '-ontimer">0:00</div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-islandbar">' +
            '<div class="' + P + '-ctl">' + ic('mic') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('video') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('speaker') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('more') + '</div>' +
          '</div>' +
          '<div class="' + P + '-endrow"><div class="' + P + '-endbtn">' + ic('phone', true) + '</div></div>' +
        '</div>' + bottomChrome() + '</div>';
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], S.platform);
  const selBrand = T.select([['xiaomi','Xiaomi'],['samsung','Samsung'],['oppo','Oppo'],['vivo','Vivo'],['realme','Realme'],['oneplus','OnePlus'],['infinix','Infinix'],['tecno','Tecno'],['motorola','Motorola'],['nothing','Nothing'],['pixel','Pixel'],['huawei','Huawei'],['honor','Honor']], 'xiaomi');
  const selTipe = T.select([['masuk', 'Panggilan masuk'], ['berlangsung', 'Panggilan berlangsung']], S.tipe);
  const selMedia = T.select([['audio', 'Audio'], ['video', 'Video']], S.media);
  const inNama = T.input('text', 'Nama kontak', S.nama);
  const fi = fileInput('image/*');
  const fiField = T.field('Foto avatar (upload, opsional)', fi, 'Foto tampil sebagai foto profil lingkaran di layar panggilan.');

  function pull() {
    S.platform = selPlatform.value; S.tipe = selTipe.value;
    S.media = selMedia.value; S.nama = inNama.value;
  }
  [selPlatform, selBrand, selTipe, selMedia, inNama].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); draw(); });
    elm.addEventListener('change', () => { pull(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.avatar = URL.createObjectURL(fi.files[0]); draw(); }
  });

  const bContoh = T.btn('🎲 Contoh', () => {
    selTipe.value = 'masuk'; selMedia.value = 'audio'; inNama.value = 'Mama';
    S.avatar = ''; fi.value = '';
    pull(); draw(); T.scrollToPreview(frame); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('⬇️ Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-call.png'); }, true);

  wrap.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  wrap.appendChild(brandField);
  wrap.appendChild(T.field('Tipe panggilan', selTipe));
  wrap.appendChild(T.field('Audio / Video', selMedia));
  wrap.appendChild(T.field('Nama kontak', inNama));
  wrap.appendChild(fiField);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export.</p>'));
  root.appendChild(wrap);

  pull(); draw();
}
