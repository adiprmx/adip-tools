import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {
  id: 'fake-call-ig',
  name: 'Fake Panggilan Instagram',
  cat: 'fakesos',
  icon: '📱',
  desc: 'Bikin screenshot panggilan video/audio Instagram palsu dengan fotomu + unduh PNG.',
  keywords: 'instagram,panggilan,call,video,audio,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Panggilan IG: layar video gelap, nama + durasi di atas, video sendiri
   (PiP) di pojok, bar kontrol bawah: mic, kamera, balik kamera, akhiri
   merah. Mode audio = avatar besar di tengah. */
const P = 'fcig';

const IC = {
  phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
  flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/><path d="M17 2l3 3-3 3"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8.2" r="4.2"/><path d="M3.5 20.5c.8-4.3 4.3-6.8 8.5-6.8s7.7 2.5 8.5 6.8z"/></svg>',
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.6"/><path d="M3.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5"/><path d="M15 20h5v-5"/><path d="M4 4l6.5 6.5"/><path d="M20 20l-6.5-6.5"/></svg>',
};
const ic = (n, rot) => '<span class="' + P + '-ic' + (rot ? ' ' + P + '-rot' : '') + '">' + IC[n] + '</span>';

export function render(root) {
  const S = { tipe: 'berlangsung', media: 'video', nama: 'rizky.png', durasi: '04:12', foto: '', fotoku: '' };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0;padding:26px 12px;background:#101014;border-radius:14px}' +
    '.' + P + '-screen{width:360px;height:640px;max-width:100%;border-radius:26px;overflow:hidden;position:relative;flex:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#fff;background:#262626;box-shadow:0 12px 40px rgba(0,0,0,.5)}' +
    '.' + P + '-vid{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,#4A4A4A 0%,#262626 55%,#121212 100%);display:flex;align-items:center;justify-content:center;color:#8E8E8E}' +
    '.' + P + '-vid img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-vid .' + P + '-ic{width:96px;height:96px}' +
    '.' + P + '-ct{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
    '.' + P + '-sbi{display:flex;align-items:center;justify-content:space-between;padding:17px 27px 0;font-size:15px;font-weight:600;position:relative;z-index:1}' +
    '.' + P + '-home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:123px;height:4px;border-radius:3px;background:rgba(255,255,255,.88);z-index:2}' +
    '.' + P + '-pranktag{position:absolute;bottom:12px;left:12px;font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px;z-index:9}' +
    '.' + P + '-ic{display:inline-flex;flex:none;vertical-align:middle}' +
    '.' + P + '-ic svg{width:100%;height:100%;display:block}' +
    '.' + P + '-rot{display:inline-block;transform:rotate(135deg)}' +
    '.' + P + '-topbar{display:flex;justify-content:space-between;align-items:center;padding:12px 16px 0;text-shadow:0 1px 4px rgba(0,0,0,.7)}' +
    '.' + P + '-topbar .' + P + '-ic{width:22px;height:22px}' +
    '.' + P + '-id{text-align:center}' +
    '.' + P + '-nm{font-size:17px;font-weight:700}' +
    '.' + P + '-tm{font-size:13px;color:#E5E5EA;margin-top:2px}' +
    '.' + P + '-pip{position:absolute;top:104px;right:14px;width:96px;height:132px;border-radius:12px;overflow:hidden;background:#3A3A3A;display:flex;align-items:center;justify-content:center;color:#8E8E8E;z-index:2;border:1px solid rgba(255,255,255,.3)}' +
    '.' + P + '-pip img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-pip .' + P + '-ic{width:36px;height:36px}' +
    '.' + P + '-sp{flex:1}' +
    '.' + P + '-ctlrow{display:flex;justify-content:center;gap:14px;margin-bottom:16px}' +
    '.' + P + '-ctl{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-ctl .' + P + '-ic{width:24px;height:24px}' +
    '.' + P + '-endrow{display:flex;justify-content:center;margin-bottom:64px}' +
    '.' + P + '-endbtn{width:68px;height:68px;border-radius:50%;background:#FF3B30;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-endbtn .' + P + '-ic{width:28px;height:28px}' +
    '.' + P + '-inhead{text-align:center;padding:88px 24px 0}' +
    '.' + P + '-av{width:112px;height:112px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#3A3A3A;color:#8E8E8E;margin:0 auto}' +
    '.' + P + '-av img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-av .' + P + '-ic{width:56px;height:56px}' +
    '.' + P + '-inname{font-size:26px;font-weight:700;margin-top:20px;word-break:break-word}' +
    '.' + P + '-inlbl{font-size:15px;color:#AEAEB2;margin-top:6px}' +
    '.' + P + '-inbtns{display:flex;justify-content:space-between;align-items:center;margin:0 36px 64px}' +
    '.' + P + '-roundbtn{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.' + P + '-roundbtn .' + P + '-ic{width:29px;height:29px}' +
    '.' + P + '-accept{background:#30D158}' +
    '.' + P + '-decline{background:#FF3B30}' +
    '.png-export .' + P + '-ctl{background:#555!important}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  function sb() {
    return '<div class="' + P + '-sbi">' + T.sysbar('iphone', 'xiaomi', true) + '</div>';
  }

  function draw() {
    const fotoHtml = S.foto ? '<img src="' + T.esc(S.foto) + '" alt="">' : ic('person');
    let html = '';
    if (S.tipe === 'masuk') {
      const lbl = S.media === 'video' ? 'Panggilan video Instagram' : 'Panggilan suara Instagram';
      html = '<div class="' + P + '-screen">' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-inhead"><div class="' + P + '-av">' + fotoHtml + '</div>' +
            '<div class="' + P + '-inname">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-inlbl">' + lbl + '</div></div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-inbtns">' +
            '<div class="' + P + '-roundbtn ' + P + '-decline">' + ic('phone', true) + '</div>' +
            '<div class="' + P + '-roundbtn ' + P + '-accept">' + ic('phone') + '</div></div>' +
        '</div><div class="' + P + '-home"></div><span class="' + P + '-pranktag">palsu · cuma prank</span></div>';
    } else if (S.tipe === 'keluar') {
      const lbl = S.media === 'video' ? 'Memanggil video…' : 'Memanggil…';
      html = '<div class="' + P + '-screen">' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-inhead"><div class="' + P + '-av">' + fotoHtml + '</div>' +
            '<div class="' + P + '-inname">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-inlbl">' + lbl + '</div></div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-inbtns" style="justify-content:center">' +
            '<div class="' + P + '-roundbtn ' + P + '-decline">' + ic('phone', true) + '</div></div>' +
        '</div><div class="' + P + '-home"></div><span class="' + P + '-pranktag">palsu · cuma prank</span></div>';
    } else if (S.media === 'audio') {
      html = '<div class="' + P + '-screen">' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-topbar">' + ic('minimize') +
            '<div class="' + P + '-id"><div class="' + P + '-nm">' + T.esc(S.nama) + '</div><div class="' + P + '-tm">' + T.esc(S.durasi) + '</div></div>' +
            ic('add') + '</div>' +
          '<div class="' + P + '-inhead" style="padding-top:64px"><div class="' + P + '-av">' + fotoHtml + '</div></div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-ctlrow"><div class="' + P + '-ctl">' + ic('mic') + '</div></div>' +
          '<div class="' + P + '-endrow"><div class="' + P + '-endbtn">' + ic('phone', true) + '</div></div>' +
        '</div><div class="' + P + '-home"></div><span class="' + P + '-pranktag">palsu · cuma prank</span></div>';
    } else {
      html = '<div class="' + P + '-screen"><div class="' + P + '-vid">' + fotoHtml + '</div>' +
        '<div class="' + P + '-pip">' + (S.fotoku ? '<img src="' + T.esc(S.fotoku) + '" alt="">' : ic('person')) + '</div>' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-topbar">' + ic('minimize') +
            '<div class="' + P + '-id"><div class="' + P + '-nm">' + T.esc(S.nama) + '</div><div class="' + P + '-tm">' + T.esc(S.durasi) + '</div></div>' +
            ic('add') + '</div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-ctlrow">' +
            '<div class="' + P + '-ctl">' + ic('mic') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('video') + '</div>' +
            '<div class="' + P + '-ctl">' + ic('flip') + '</div>' +
          '</div>' +
          '<div class="' + P + '-endrow"><div class="' + P + '-endbtn">' + ic('phone', true) + '</div></div>' +
        '</div><div class="' + P + '-home"></div><span class="' + P + '-pranktag">palsu · cuma prank</span></div>';
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selTipe = T.select([['berlangsung', 'Panggilan berlangsung'], ['masuk', 'Panggilan masuk'], ['keluar', 'Panggilan keluar']], S.tipe);
  const selMedia = T.select([['video', 'Video'], ['audio', 'Audio']], S.media);
  const inNama = T.input('text', 'Username', S.nama);
  const inDurasi = T.input('text', 'Durasi', S.durasi);
  const fi = fileInput('image/*');
  const fi2 = fileInput('image/*');
  const fiField = T.field('Foto lawan bicara (upload, opsional)', fi);
  const fi2Field = T.field('Foto kamu / PiP (upload, opsional)', fi2);

  function pull() {
    S.tipe = selTipe.value; S.media = selMedia.value; S.nama = inNama.value; S.durasi = inDurasi.value;
  }
  [selTipe, selMedia, inNama, inDurasi].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); draw(); });
    elm.addEventListener('change', () => { pull(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.foto = URL.createObjectURL(fi.files[0]); draw(); }
  });
  fi2.addEventListener('change', () => {
    if (fi2.files && fi2.files[0]) { S.fotoku = URL.createObjectURL(fi2.files[0]); draw(); }
  });

  const bContoh = T.btn('🎲 Contoh', () => {
    selTipe.value = 'berlangsung'; selMedia.value = 'video'; inNama.value = 'rizky.png'; inDurasi.value = '04:12';
    S.foto = ''; S.fotoku = ''; fi.value = ''; fi2.value = '';
    pull(); draw(); T.scrollToPreview(frame); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('⬇️ Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-call-ig.png'); }, true);

  wrap.appendChild(T.field('Tipe panggilan', selTipe));
  wrap.appendChild(T.field('Video / Audio', selMedia));
  wrap.appendChild(T.field('Username', inNama));
  wrap.appendChild(T.field('Durasi', inDurasi));
  wrap.appendChild(fiField);
  wrap.appendChild(fi2Field);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🎭 Hanya untuk prank, bukan panggilan Instagram asli. Jangan dipakai untuk menipu orang.</p>'));
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export.</p>'));
  root.appendChild(wrap);

  pull(); draw();
}
