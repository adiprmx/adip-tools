import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {"id":"fake-postingan-tiktok","name":"Fake Postingan TikTok","cat":"fakesos","icon":"🎬","desc":"Bikin screenshot postingan TikTok palsu + unduh PNG.","keywords":"tiktok,postingan,video,feed,fake,palsu,screenshot,prank","since":"6.18.0"};

const FPT_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FPT_PINK = '#FE2C55';
const FPT_CYAN = '#25F4EE';
const FPT_CHECK = '#20D5EC';

/* Format angka ala TikTok Indonesia: 999, 1 rb, 12,5 rb, 1 jt, 1,5 jt */
export function formatHitungan(n) {
  const v = Math.floor(Math.abs(Number(n)) || 0);
  if (v >= 1000000) return (v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (v >= 1000) return (v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
  return String(v);
}

function fptNum(v) {
  const n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

/* Ikon outline gaya TikTok: 24x24, stroke 2, round caps/joins */
const FPT_ST = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const FPT_P = {
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  comment: '<path d="M12 3.8c-4.8 0-8.3 3.3-8.3 7.6 0 2.4 1.2 4.5 3 5.9l-1.4 3.2 3.9-1.9c.9.3 1.8.4 2.8.4 4.8 0 8.3-3.3 8.3-7.6S16.8 3.8 12 3.8z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  share: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  search: '<circle cx="11" cy="11" r="6.8"/><path d="M15.8 15.8l4.7 4.7"/>',
  home: '<path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/>',
  friends: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.4 3.2-5.2 6.5-5.2s5.9 1.8 6.5 5.2"/><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6"/><path d="M17.5 14.9c2.1.6 3.5 2.2 4 5.1"/>',
  inbox: '<path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6"/>'
};
const FPT_MUSIC = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 17.6V6l11-2v11.6"/><circle cx="6.8" cy="17.6" r="2.4"/><circle cx="17.8" cy="15.6" r="2.4"/></svg>';
const FPT_PERSON = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="#8a8a8a" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';

function fptIcon(name) {
  return '<svg viewBox="0 0 24 24" ' + FPT_ST + ' aria-hidden="true">' + FPT_P[name] + '</svg>';
}
function fptHeart(liked) {
  return liked
    ? '<svg viewBox="0 0 24 24" fill="' + FPT_PINK + '" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    : fptIcon('heart');
}
function fptVerified() {
  return '<svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="' + FPT_CHECK + '"/><path d="M4.2 7.2l2 2 3.6-4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

const FPT_GRADS = {
  senja: 'linear-gradient(160deg,#2b1055 0%,#7597de 55%,#f7b267 100%)',
  neon: 'linear-gradient(160deg,#0f2027 0%,#203a43 50%,#2c5364 100%)',
  laut: 'linear-gradient(160deg,#141e30 0%,#243b55 100%)'
};

const FPT_CSS = `
.fpt-dev{max-width:430px;margin:14px auto;background:#0d0d0d;border-radius:42px;padding:11px;box-shadow:0 20px 55px rgba(0,0,0,.35),inset 0 0 0 2px #2b2b2b}
.fpt-scr{border-radius:32px;overflow:hidden;background:#000;display:flex;flex-direction:column}
.fpt-sb{position:relative;display:flex;align-items:center;justify-content:space-between;padding:11px 22px 4px;font-size:15px;font-weight:600;flex:none;color:#fff}
.fpt-video{position:relative;width:100%;aspect-ratio:9/16;background:#111;overflow:hidden;font-family:${FPT_FONT}}
.fpt-video img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.fpt-grad{position:absolute;inset:0}
.fpt-shade{position:absolute;left:0;right:0;bottom:0;height:45%;background:linear-gradient(to top,rgba(0,0,0,.55),rgba(0,0,0,0));pointer-events:none}
.fpt-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:18px;padding:10px 14px;color:#fff;font-size:16px}
.fpt-tab{color:rgba(255,255,255,.75);font-weight:500}
.fpt-tab.on{color:#fff;font-weight:700}
.fpt-tab.on u{text-decoration:none;border-bottom:2px solid #fff;padding-bottom:2px}
.fpt-search{position:absolute;right:14px;top:10px;width:24px;height:24px;color:#fff;display:inline-flex}
.fpt-search svg{width:100%;height:100%;display:block}
.fpt-rail{position:absolute;right:8px;bottom:14px;display:flex;flex-direction:column;align-items:center;gap:18px;color:#fff}
.fpt-ava{position:relative;width:44px;height:44px;margin-bottom:2px}
.fpt-avac{width:44px;height:44px;border-radius:50%;background:#3a3a3a;border:1px solid rgba(255,255,255,.6);overflow:hidden;display:flex;align-items:center;justify-content:center}
.fpt-plus{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);width:18px;height:18px;border-radius:50%;background:${FPT_PINK};color:#fff;font-size:15px;font-weight:700;line-height:16px;text-align:center}
.fpt-act{display:flex;flex-direction:column;align-items:center;gap:3px}
.fpt-ic{width:30px;height:30px;display:inline-flex;color:#fff;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6))}
.fpt-ic svg{width:100%;height:100%;display:block}
.fpt-n{font-size:12px;font-weight:600;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.fpt-info{position:absolute;left:12px;right:74px;bottom:14px;color:#fff}
.fpt-urow{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.fpt-uname{font-size:16px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.fpt-ver{width:14px;height:14px;flex:none;display:inline-flex}
.fpt-ver svg{width:100%;height:100%;display:block}
.fpt-follow{background:${FPT_PINK};color:#fff;border:none;border-radius:4px;padding:4px 14px;font-size:13px;font-weight:600;font-family:${FPT_FONT};cursor:default}
.fpt-cap{font-size:14px;line-height:1.45;margin:8px 0 0;white-space:pre-wrap;word-break:break-word;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.fpt-music{display:flex;align-items:center;gap:6px;font-size:14px;margin-top:10px;text-shadow:0 1px 3px rgba(0,0,0,.7)}
.fpt-music .fpt-note{width:14px;height:14px;flex:none;display:inline-flex}
.fpt-music .fpt-note svg{width:100%;height:100%;display:block}
.fpt-song{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpt-nav{display:flex;align-items:flex-end;justify-content:space-around;background:#000;padding:6px 6px 8px;flex:none}
.fpt-navit{display:flex;flex-direction:column;align-items:center;gap:2px;color:#fff;font-size:10px;font-family:${FPT_FONT};flex:none}
.fpt-navit .fpt-nic{width:24px;height:24px;display:inline-flex}
.fpt-navit .fpt-nic svg{width:100%;height:100%;display:block}
.fpt-create{width:46px;height:30px;border-radius:8px;background:#fff;border-left:3px solid ${FPT_CYAN};border-right:3px solid ${FPT_PINK};display:flex;align-items:center;justify-content:center;color:#000;font-size:22px;font-weight:400;line-height:1;margin-bottom:2px}
.fpt-home{width:134px;height:5px;border-radius:3px;background:#fff;margin:8px auto 8px;flex:none}
.fpt-anav{display:flex;justify-content:center;padding:6px 0 8px;flex:none}
.fpt-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#fff}
.fpt-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;flex:none}
.fpt-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fpt-delphoto{font-size:12px;color:#ed4956;background:none;border:none;padding:0;cursor:pointer;margin-top:6px}
`;

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FPT_CSS;
  root.appendChild(style);

  let photoUrl = null;

  const userInp = T.input('text', 'cth: adip.rmx', '');
  const verSel = T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak');
  const capTa = T.ta(3, 'Tulis caption...', '');
  const songInp = T.input('text', 'cth: suara asli - adip.rmx', '');
  const likesInp = T.input('number', 'cth: 1234', '');
  const comInp = T.input('number', 'cth: 48', '');
  const shareInp = T.input('number', 'cth: 96', '');
  const saveInp = T.input('number', 'cth: 210', '');
  const fi = fileInput('image/*');
  const gradSel = T.select([['senja', 'Senja'], ['neon', 'Neon'], ['laut', 'Laut']], 'neon');
  const likeSel = T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const delPhoto = T.el('<button type="button" class="fpt-delphoto">Hapus foto sendiri</button>');
  delPhoto.style.display = 'none';
  const preview = T.out();

  fi.addEventListener('change', () => {
    if (fi.files[0]) { photoUrl = URL.createObjectURL(fi.files[0]); delPhoto.style.display = ''; draw(); }
  });
  delPhoto.addEventListener('click', () => {
    photoUrl = null; fi.value = ''; delPhoto.style.display = 'none'; draw();
  });

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = (selPlatform.value === 'android') ? '' : 'none';
    const uname = userInp.value.trim() || 'username';
    const verified = verSel.value === 'ya';
    const liked = likeSel.value === 'ya';
    const cap = capTa.value;
    const song = songInp.value.trim();
    const bg = photoUrl
      ? '<img src="' + T.esc(photoUrl) + '" alt="">'
      : '<div class="fpt-grad" style="background:' + FPT_GRADS[gradSel.value] + '"></div>';

    const rail = '<div class="fpt-rail">'
      + '<div class="fpt-ava"><div class="fpt-avac">' + FPT_PERSON + '</div><span class="fpt-plus">+</span></div>'
      + '<div class="fpt-act"><span class="fpt-ic">' + fptHeart(liked) + '</span><span class="fpt-n">' + T.esc(formatHitungan(fptNum(likesInp.value))) + '</span></div>'
      + '<div class="fpt-act"><span class="fpt-ic">' + fptIcon('comment') + '</span><span class="fpt-n">' + T.esc(formatHitungan(fptNum(comInp.value))) + '</span></div>'
      + '<div class="fpt-act"><span class="fpt-ic">' + fptIcon('bookmark') + '</span><span class="fpt-n">' + T.esc(formatHitungan(fptNum(saveInp.value))) + '</span></div>'
      + '<div class="fpt-act"><span class="fpt-ic">' + fptIcon('share') + '</span><span class="fpt-n">' + T.esc(formatHitungan(fptNum(shareInp.value))) + '</span></div>'
      + '</div>';

    const info = '<div class="fpt-info">'
      + '<div class="fpt-urow"><span class="fpt-uname">@' + T.esc(uname) + '</span>'
      + (verified ? '<span class="fpt-ver">' + fptVerified() + '</span>' : '')
      + '<button type="button" class="fpt-follow">Ikuti</button></div>'
      + (cap.trim() ? '<div class="fpt-cap">' + T.esc(cap) + '</div>' : '')
      + (song ? '<div class="fpt-music"><span class="fpt-note">' + FPT_MUSIC + '</span><span class="fpt-song">' + T.esc(song) + '</span></div>' : '')
      + '</div>';

    const nav = '<div class="fpt-nav">'
      + '<span class="fpt-navit"><span class="fpt-nic">' + fptIcon('home') + '</span>Beranda</span>'
      + '<span class="fpt-navit"><span class="fpt-nic">' + fptIcon('friends') + '</span>Teman</span>'
      + '<span class="fpt-create">+</span>'
      + '<span class="fpt-navit"><span class="fpt-nic">' + fptIcon('inbox') + '</span>Kotak Masuk</span>'
      + '<span class="fpt-navit"><span class="fpt-nic">' + fptIcon('profile') + '</span>Profil</span>'
      + '</div>';

    T.show(preview, '<div class="fpt-dev"><div class="fpt-scr">'
      + '<div class="fpt-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>'
      + '<div class="fpt-video">' + bg + '<div class="fpt-shade"></div>'
      + '<div class="fpt-top"><span class="fpt-tab">Mengikuti</span><span class="fpt-tab on"><u>Untuk Anda</u></span>'
      + '<span class="fpt-search">' + fptIcon('search') + '</span></div>'
      + rail + info
      + '</div>'
      + nav
      + (isIPh ? '<div class="fpt-home"></div>' : '<div class="fpt-anav"><i></i></div>')
      + '<div class="fpt-pranktag-wrap"><span class="fpt-pranktag">palsu · cuma prank</span></div>'
      + '</div></div>');
  }

  [userInp, capTa, songInp, likesInp, comInp, shareInp, saveInp].forEach((elx) => elx.addEventListener('input', draw));
  [verSel, gradSel, likeSel, selPlatform, selBrand].forEach((elx) => elx.addEventListener('change', draw));

  function contoh() {
    userInp.value = 'adip.rmx';
    verSel.value = 'ya';
    capTa.value = 'Beat baru, full minggu depan 🔥 #remix #fyp';
    songInp.value = 'suara asli - adip.rmx';
    likesInp.value = '1234';
    comInp.value = '48';
    shareInp.value = '96';
    saveInp.value = '210';
    gradSel.value = 'neon';
    likeSel.value = 'ya';
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  const fiWrap = T.el('<div></div>');
  fiWrap.appendChild(fi);
  fiWrap.appendChild(delPhoto);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Username', userInp), T.field('Badge verified', verSel)));
  root.appendChild(T.field('Caption', capTa));
  root.appendChild(T.field('Lagu', songInp, 'Tampil kecil di bawah caption, bersama ikon not.'));
  root.appendChild(T.grid2(T.field('Jumlah suka', likesInp), T.field('Jumlah komentar', comInp)));
  root.appendChild(T.grid2(T.field('Jumlah dibagikan', shareInp), T.field('Jumlah disimpan', saveInp)));
  root.appendChild(T.grid2(T.field('Platform', selPlatform), T.field('Tampilkan sebagai disukai', likeSel)));
  const brandField = T.field('Merk HP', selBrand);
  root.appendChild(brandField);
  root.appendChild(T.grid2(T.field('Upload foto/video', fiWrap), T.field('Atau pakai latar', gradSel)));
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-postingan-tiktok.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
