import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.9.5';

export const meta = {
  id: 'fake-notif-tele',
  name: 'Fake Notif Telegram',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  desc: 'Notifikasi Telegram palsu di layar kunci HP + unduh PNG. Buat prank.',
  keywords: 'telegram,notif,notifikasi,fake,palsu,prank,screenshot,layar kunci',
};

const WALLS = {
  malam: 'linear-gradient(165deg,#0f2027 0%,#203a43 55%,#2c5364 100%)',
  senja: 'linear-gradient(165deg,#3b1d5e 0%,#b23a48 55%,#f6a35c 100%)',
  laut: 'linear-gradient(165deg,#004e92 0%,#000428 100%)',
  hutan: 'linear-gradient(165deg,#134e5e 0%,#71b280 100%)',
};
const WALL_LABEL = { malam: 'Malam biru', senja: 'Senja', laut: 'Laut gelap', hutan: 'Hutan' };

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',60%,42%)';
}

export function render(root) {
  const wrap = T.el('<div class="fnt-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fnt-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.fnt-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fnt-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fnt-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fnt-screen{width:100%;max-width:400px;min-height:520px;display:flex;flex-direction:column;color:#fff;text-align:left;overflow:hidden}' +
    '.fnt-sb{position:relative;display:flex;justify-content:space-between;align-items:center;padding:16px 22px 10px;color:#fff}' +
    '.fnt-clock{text-align:center;padding:26px 0 6px}' +
    '.fnt-clock .t{font-size:64px;font-weight:200;letter-spacing:-2px;line-height:1}' +
    '.fnt-clock .d{font-size:14px;font-weight:500;margin-top:4px;opacity:.95}' +
    '.fnt-notifwrap{flex:1;padding:10px 12px 0;display:flex;flex-direction:column;gap:10px}' +
    '.fnt-notif{background:rgba(30,30,34,.82);border-radius:18px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 6px 24px rgba(0,0,0,.4)}' +
    '.fnt-app{width:44px;height:44px;border-radius:12px;flex:0 0 44px;background:#229ED9;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.fnt-main{flex:1;min-width:0}' +
    '.fnt-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:2px}' +
    '.fnt-appname{font-size:13px;font-weight:600;opacity:.85}' +
    '.fnt-when{font-size:12px;opacity:.7;flex:none}' +
    '.fnt-sender{font-size:15px;font-weight:700;margin:0 0 1px;overflow-wrap:break-word}' +
    '.fnt-msg{font-size:14px;line-height:1.4;margin:0;opacity:.95;overflow-wrap:break-word;white-space:pre-wrap}' +
    '.fnt-homebar{display:flex;justify-content:center;padding:12px 0 10px;margin-top:auto}' +
    '.fnt-homebar span{width:134px;height:5px;border-radius:3px;background:#fff;opacity:.9}' +
    '.fnt-navpill{display:flex;justify-content:center;padding:12px 0 10px;margin-top:auto}' +
    '.fnt-navpill span{width:108px;height:4px;border-radius:2px;background:#fff;opacity:.9}' +
    '.fnt-pranktag{text-align:center;font-size:11px;font-weight:600;color:#ffffffaa;padding:6px 0 4px}' +
    '.fnt-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const senderI = T.input('text', 'Nama pengirim', 'Mama');
  const msgI = T.ta(3, 'Isi pesan…', 'Nak, pulang sekarang! Ada kejutan buat kamu 🎁');
  const whenI = T.input('text', 'cth: sekarang, 09.41', 'sekarang');
  const dateI = T.input('text', 'cth: Rabu, 7 Oktober', 'Rabu, 7 Oktober');
  const wallI = T.select([['malam', 'Malam biru'], ['senja', 'Senja'], ['laut', 'Laut gelap'], ['hutan', 'Hutan']], 'malam');
  const platI = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const ctl = T.el('<div class="fnt-ctl"></div>');
  ctl.appendChild(T.field('Nama pengirim', senderI));
  ctl.appendChild(T.field('Isi pesan', msgI));
  const mrow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  mrow.appendChild(T.field('Waktu notif', whenI));
  mrow.appendChild(T.field('Tanggal layar kunci', dateI));
  ctl.appendChild(mrow);
  ctl.appendChild(T.field('Wallpaper', wallI));
  ctl.appendChild(T.field('Platform', platI));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fnt-btns"></div>');
  const screen = T.el('<div class="fnt-screen"></div>');

  btns.appendChild(T.btn('🎲 Contoh', () => {
    senderI.value = 'Mama'; msgI.value = 'Nak, pulang sekarang! Ada kejutan buat kamu 🎁';
    whenI.value = 'sekarang'; dateI.value = 'Rabu, 7 Oktober'; wallI.value = 'malam';
    platI.value = 'android'; draw(); T.scrollToPreview(screen);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(screen, 'fake-notif-tele.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fnt-prevbox"></div>');
  prevBox.appendChild(screen);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fnt-note"></p>');
  note.textContent = LOCAL_NOTE + ' Hanya untuk prank, bukan notifikasi asli.';
  wrap.appendChild(note);

  function draw() {
    const isIPh = platI.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const sender = senderI.value.trim() || 'Telegram';
    const initial = T.esc(sender.charAt(0).toUpperCase() || 'T');
    screen.setAttribute('style', 'background:' + (WALLS[wallI.value] || WALLS.malam));
    screen.innerHTML =
      '<div class="fnt-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>' +
      '<div class="fnt-clock"><div class="t">9:41</div><div class="d">' + T.esc(dateI.value.trim() || 'Hari ini') + '</div></div>' +
      '<div class="fnt-notifwrap">' +
        '<div class="fnt-notif">' +
          '<div class="fnt-app"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div>' +
          '<div class="fnt-main">' +
            '<div class="fnt-head"><span class="fnt-appname">Telegram</span><span class="fnt-when">' + T.esc(whenI.value.trim() || 'sekarang') + '</span></div>' +
            '<p class="fnt-sender">' + T.esc(sender) + '</p>' +
            '<p class="fnt-msg">' + T.esc(msgI.value) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="fnt-pranktag">notifikasi palsu · cuma prank</div>' +
      '</div>' +
      (isIPh ? '<div class="fnt-homebar"><span></span></div>' : '<div class="fnt-navpill"><span></span></div>');
  }

  [senderI, msgI, whenI, dateI, wallI, platI, selBrand].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
