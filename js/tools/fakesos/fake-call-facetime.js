import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {
  id: 'fake-call-facetime',
  name: 'Fake Panggilan FaceTime',
  cat: 'fakesos',
  icon: '📹',
  desc: 'Bikin screenshot panggilan FaceTime palsu: masuk, keluar, atau sedang berlangsung + unduh PNG.',
  keywords: 'facetime,iphone,apple,call,panggilan,video,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* FaceTime iOS: latar gelap blur, avatar besar di tengah, nama + "FaceTime
   Video", tombol tolak merah / terima hijau (iPhone), mode berlangsung =
   area video + kontrol melayang. Selalu iPhone (FaceTime memang iOS). */
const P = 'fcf';

const IC = {
  phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/><path d="M17 2l3 3-3 3"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8.2" r="4.2"/><path d="M3.5 20.5c.8-4.3 4.3-6.8 8.5-6.8s7.7 2.5 8.5 6.8z"/></svg>',
  msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
};
const ic = (n, rot) => '<span class="' + P + '-ic' + (rot ? ' ' + P + '-rot' : '') + '">' + IC[n] + '</span>';

export function render(root) {
  const S = { tipe: 'masuk', media: 'video', nama: 'Mama', durasi: '12:34', avatar: '' };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0;padding:26px 12px;background:#101014;border-radius:14px}' +
    '.' + P + '-screen{width:360px;height:640px;max-width:100%;border-radius:26px;overflow:hidden;position:relative;flex:none;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Arial,sans-serif;color:#fff;background:linear-gradient(180deg,#1C1C22 0%,#0A0A0E 100%);box-shadow:0 12px 40px rgba(0,0,0,.5)}' +
    '.' + P + '-vid{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,#3A3A44 0%,#17171C 55%,#0A0A0E 100%)}' +
    '.' + P + '-vid img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-ct{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
    '.' + P + '-sbi{display:flex;align-items:center;justify-content:space-between;padding:17px 27px 0;font-size:15px;font-weight:600;position:relative;z-index:1}' +
    '.' + P + '-home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:123px;height:4px;border-radius:3px;background:rgba(255,255,255,.88);z-index:2}' +
    '.' + P + '-pranktag{position:absolute;bottom:12px;left:12px;font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px;z-index:9}' +
    '.' + P + '-ic{display:inline-flex;flex:none;vertical-align:middle}' +
    '.' + P + '-ic svg{width:100%;height:100%;display:block}' +
    '.' + P + '-rot{display:inline-block;transform:rotate(135deg)}' +
    '.' + P + '-inhead{text-align:center;padding:56px 24px 0}' +
    '.' + P + '-av{width:104px;height:104px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#3A3A44;color:#8E8E93;margin:0 auto}' +
    '.' + P + '-av img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-av .' + P + '-ic{width:52px;height:52px}' +
    '.' + P + '-nm{font-size:32px;font-weight:700;margin-top:20px;word-break:break-word}' +
    '.' + P + '-lbl{font-size:16px;color:#AEAEB2;margin-top:6px}' +
    '.' + P + '-sp{flex:1}' +
    '.' + P + '-minirow{display:flex;justify-content:center;gap:56px;margin-bottom:26px;color:#fff}' +
    '.' + P + '-mini{display:flex;flex-direction:column;align-items:center;gap:7px;font-size:12px;color:#E5E5EA}' +
    '.' + P + '-mini .' + P + '-ic{width:24px;height:24px}' +
    '.' + P + '-inbtns{display:flex;justify-content:space-between;align-items:center;margin:0 34px 64px}' +
    '.' + P + '-roundbtn{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-roundbtn .' + P + '-ic{width:30px;height:30px}' +
    '.' + P + '-accept{background:#30D158}' +
    '.' + P + '-decline{background:#FF3B30}' +
    '.' + P + '-endrow{display:flex;justify-content:center;margin-bottom:64px}' +
    '.' + P + '-onbar{display:flex;justify-content:space-between;align-items:center;padding:12px 18px 0}' +
    '.' + P + '-onnm{font-size:17px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.6)}' +
    '.' + P + '-ontimer{font-size:14px;color:#E5E5EA;text-shadow:0 1px 4px rgba(0,0,0,.6)}' +
    '.' + P + '-pip{position:absolute;top:96px;right:16px;width:104px;height:144px;border-radius:14px;overflow:hidden;background:#2C2C30;display:flex;align-items:center;justify-content:center;color:#8E8E93;z-index:2;border:1px solid rgba(255,255,255,.25)}' +
    '.' + P + '-pip img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-pip .' + P + '-ic{width:40px;height:40px}' +
    '.' + P + '-ctlrow{display:flex;justify-content:center;gap:16px;margin-bottom:18px}' +
    '.' + P + '-ctl{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-ctl .' + P + '-ic{width:24px;height:24px}' +
    '.png-export .' + P + '-ctl{background:#4A4A52!important}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  function sb() {
    return '<div class="' + P + '-sbi">' + T.sysbar('iphone', 'xiaomi', true) + '</div>';
  }
  function avHtml() {
    const inner = S.avatar ? '<img src="' + T.esc(S.avatar) + '" alt="">' : ic('person');
    return '<div class="' + P + '-av">' + inner + '</div>';
  }

  function draw() {
    const lbl = S.media === 'video' ? 'FaceTime Video' : 'FaceTime Audio';
    let html = '';
    if (S.tipe === 'berlangsung') {
      html = '<div class="' + P + '-screen"><div class="' + P + '-vid">' + (S.avatar ? '<img src="' + T.esc(S.avatar) + '" alt="">' : '') + '</div>' +
        '<div class="' + P + '-pip">' + ic('person') + '</div>' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-onbar"><div class="' + P + '-onnm">' + T.esc(S.nama) + '</div>' +
          '<div class="' + P + '-ontimer">' + T.esc(S.durasi) + '</div></div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-ctlrow">' +
            '<div class="' + P + '-ctl">' + ic('mic') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('video') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('speaker') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('flip') + '</div>' +
          '</div>' +
          '<div class="' + P + '-endrow"><div class="' + P + '-roundbtn ' + P + '-decline">' + ic('phone', true) + '</div></div>' +
        '</div><div class="' + P + '-home"></div><span class="' + P + '-pranktag">palsu · cuma prank</span></div>';
    } else {
      const status = S.tipe === 'keluar' ? 'Memanggil...' : lbl;
      html = '<div class="' + P + '-screen">' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-inhead">' + avHtml() +
            '<div class="' + P + '-nm">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-lbl">' + T.esc(status) + '</div>' +
          '</div>' +
          '<div class="' + P + '-sp"></div>' +
          (S.tipe === 'masuk'
            ? '<div class="' + P + '-minirow"><div class="' + P + '-mini">' + ic('bell') + '<span>Ingatkan Saya</span></div>' +
              '<div class="' + P + '-mini">' + ic('msg') + '<span>Pesan</span></div></div>' +
              '<div class="' + P + '-inbtns">' +
              '<div class="' + P + '-roundbtn ' + P + '-decline">' + ic('phone', true) + '</div>' +
              '<div class="' + P + '-roundbtn ' + P + '-accept">' + ic('phone') + '</div></div>'
            : '<div class="' + P + '-endrow"><div class="' + P + '-roundbtn ' + P + '-decline">' + ic('phone', true) + '</div></div>') +
        '</div><div class="' + P + '-home"></div><span class="' + P + '-pranktag">palsu · cuma prank</span></div>';
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selTipe = T.select([['masuk', 'Panggilan masuk'], ['keluar', 'Panggilan keluar'], ['berlangsung', 'Panggilan berlangsung']], S.tipe);
  const selMedia = T.select([['video', 'Video'], ['audio', 'Audio']], S.media);
  const inNama = T.input('text', 'Nama kontak', S.nama);
  const inDurasi = T.input('text', 'Durasi (berlangsung)', S.durasi);
  const fi = fileInput('image/*');
  const fiField = T.field('Foto (upload, opsional)', fi, 'Foto tampil sebagai avatar / latar video panggilan.');

  function pull() {
    S.tipe = selTipe.value; S.media = selMedia.value; S.nama = inNama.value; S.durasi = inDurasi.value;
  }
  [selTipe, selMedia, inNama, inDurasi].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); draw(); });
    elm.addEventListener('change', () => { pull(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.avatar = URL.createObjectURL(fi.files[0]); draw(); }
  });

  const bContoh = T.btn('🎲 Contoh', () => {
    selTipe.value = 'masuk'; selMedia.value = 'video'; inNama.value = 'Mama'; inDurasi.value = '12:34';
    S.avatar = ''; fi.value = '';
    pull(); draw(); T.scrollToPreview(frame); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('⬇️ Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-call-facetime.png'); }, true);

  wrap.appendChild(T.field('Tipe panggilan', selTipe));
  wrap.appendChild(T.field('Video / Audio', selMedia));
  wrap.appendChild(T.field('Nama kontak', inNama));
  wrap.appendChild(T.field('Durasi', inDurasi));
  wrap.appendChild(fiField);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export.</p>'));
  root.appendChild(wrap);

  pull(); draw();
}
