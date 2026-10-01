import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {
  id: 'fake-profil-wa',
  name: 'Fake Profil WA',
  cat: 'fakesos',
  icon: '👤',
  desc: 'Bikin screenshot profil WhatsApp palsu + unduh PNG.',
  keywords: 'whatsapp,profil,fake,palsu,screenshot,prank'
};

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CALL = '<svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VID = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_SEARCH = '<svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>';
const SVG_SIG = '<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="0.7"/><rect x="4.5" y="5.5" width="3" height="6.5" rx="0.7"/><rect x="9" y="3" width="3" height="9" rx="0.7"/><rect x="13.5" y="0" width="3" height="12" rx="0.7"/></svg>';
const SVG_WIFI = '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 13 0"/><path d="M4 6.8a6.4 6.4 0 0 1 8 0"/><circle cx="8" cy="9.6" r="1.3" fill="currentColor" stroke="none"/></svg>';
const SVG_BAT = '<svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.45"/><rect x="2.5" y="2.5" width="14" height="7" rx="1.5" fill="currentColor"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.45"/></svg>';

const THUMB_GRADS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)'
];

export function render(root) {
  root.appendChild(T.el(`<style>
.fpw-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpw-phone{max-width:380px;margin:14px auto;border-radius:20px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpw-dark{background:#0B141A!important;border-color:rgba(255,255,255,.12)}
.fpw-sb{display:flex;justify-content:space-between;align-items:center;height:30px;padding:0 18px 0 22px;background:#FFFFFF;color:#111B21}
.fpw-dark .fpw-sb{background:#0B141A;color:#E9EDEF}
.fpw-clock{font-size:14px;font-weight:700;letter-spacing:.3px}
.fpw-sicons{display:flex;align-items:center;gap:6px}
.fpw-hd{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 12px 0 2px;background:#FFFFFF}
.fpw-dark .fpw-hd{background:#0B141A}
.fpw-bk{background:none;border:0;padding:8px;cursor:pointer;color:#3B4A54;display:flex;align-items:center}
.fpw-dark .fpw-bk{color:#AEBAC1}
.fpw-hic{display:flex;align-items:center;gap:24px;color:#3B4A54}
.fpw-dark .fpw-hic{color:#AEBAC1}
.fpw-hero{text-align:center;padding:6px 20px 4px}
.fpw-av{width:140px;height:140px;border-radius:50%;background:#8696A0;color:#fff;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:500;margin:0 auto;overflow:hidden}
.fpw-av img{width:100%;height:100%;object-fit:cover;display:block}
.fpw-name{font-size:22px;font-weight:500;color:#111B21;margin:12px 0 0}
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
.fpw-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fpw-ctl"></div>');
  const inName = T.input('text', 'Nama kontak', 'Budi Santoso');
  const inNum = T.input('text', 'Nomor telepon', '+62 812-3456-7890');
  const inSeen = T.input('text', 'Last seen', 'last seen today at 10.30');
  const inAbout = T.input('text', 'About', 'Hey there! I am using WhatsApp.');
  const selTheme = T.select([['light', 'Terang'], ['dark', 'Gelap']], 'light');

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
  ctl.appendChild(T.field('Nomor telepon', inNum));
  ctl.appendChild(T.field('Last seen', inSeen));
  ctl.appendChild(T.field('About', inAbout));
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(btnAvatar);

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inName.value = 'Budi Santoso';
      inNum.value = '+62 812-3456-7890';
      inSeen.value = 'last seen today at 10.30';
      inAbout.value = 'Hey there! I am using WhatsApp.';
      selTheme.value = 'light';
      avatarUrl = null;
      draw();
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-wa.png'), true)
  );

  const phone = T.el('<div class="fpw-phone"></div>');

  function draw() {
    const dark = selTheme.value === 'dark';
    const name = inName.value.trim() || 'Kontak';
    const num = inNum.value.trim() || '+62 812-3456-7890';
    const seen = inSeen.value.trim();
    const about = inAbout.value.trim() || 'Hey there! I am using WhatsApp.';
    const initial = (name.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc(initial);
    const thumbs = THUMB_GRADS.map((g) =>
      '<div class="fpw-th" style="' + (avatarUrl
        ? 'background-image:url(' + avatarUrl + ')'
        : 'background:' + g) + '"></div>'
    ).join('');

    phone.className = 'fpw-phone' + (dark ? ' fpw-dark' : '');
    phone.innerHTML =
      '<div class="fpw-sb"><span class="fpw-clock">9:41</span>' +
      '<span class="fpw-sicons">' + SVG_SIG + SVG_WIFI + SVG_BAT + '</span></div>' +
      '<div class="fpw-hd"><button class="fpw-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<div class="fpw-hic">' + SVG_VID + SVG_CALL + '</div></div>' +
      '<div class="fpw-hero">' +
      '<div class="fpw-av">' + avHtml + '</div>' +
      '<div class="fpw-name">' + T.esc(name) + '</div>' +
      '<div class="fpw-num">' + T.esc(num) + '</div>' +
      (seen ? '<div class="fpw-seen">' + T.esc(seen) + '</div>' : '') +
      '</div>' +
      '<div class="fpw-acts">' +
      '<div class="fpw-act"><div class="fpw-actc">' + SVG_CALL + '</div><span>Audio</span></div>' +
      '<div class="fpw-act"><div class="fpw-actc">' + SVG_VID + '</div><span>Video</span></div>' +
      '<div class="fpw-act"><div class="fpw-actc">' + SVG_SEARCH + '</div><span>Cari</span></div>' +
      '</div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-sec"><div class="fpw-lbl">About</div><div class="fpw-about">' + T.esc(about) + '</div></div>' +
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
      '<div class="fpw-row"><div class="fpw-ric">🔒</div>' +
      '<div class="fpw-rtx"><b>Enkripsi</b><span>Pesan dan panggilan terenkripsi secara end-to-end. Ketuk untuk verifikasi.</span></div></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-red"><div class="fpw-ric">🚫</div><span>Blokir ' + T.esc(name) + '</span></div>' +
      '<div class="fpw-div"></div>' +
      '<div class="fpw-red"><div class="fpw-ric">⚠️</div><span>Laporkan ' + T.esc(name) + '</span></div>' +
      '<div style="height:18px"></div>';

    const sw = phone.querySelector('.fpw-sw');
    if (sw) sw.addEventListener('click', () => {
      const off = sw.classList.toggle('off');
      sw.setAttribute('aria-checked', off ? 'false' : 'true');
    });
  }

  [inName, inNum, inSeen, inAbout, selTheme].forEach((el) => {
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
