import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-post-ig","name":"Fake Postingan IG","cat":"fakesos","icon":"🖼️","desc":"Bikin screenshot postingan Instagram palsu + unduh PNG.","keywords":"instagram,postingan,feed,fake,palsu,screenshot,prank"};

const FPI_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FPI_PERSON = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="#b5b5b5" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';
const FPI_VERIFIED = '<svg viewBox="0 0 24 24" width="14" height="14" style="flex:none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#0095F6"/><path d="M10.6 15.6l-3.1-3.1 1.4-1.4 1.7 1.7 4.9-4.9 1.4 1.4z" fill="#fff"/></svg>';
const FPI_GRADS = {
  sunset: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF)',
  ocean: 'linear-gradient(135deg,#0095F6,#00D4FF)',
  ungu: 'linear-gradient(135deg,#962FBF,#4F5BD5)'
};
const FPI_PATHS = {
  comment: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  repost: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'
};

const FPI_CSS = `
.fpi-card{max-width:420px;margin:12px auto;background:#fff;color:#111;border:1px solid #dbdbdb;border-radius:12px;overflow:hidden;font-family:${FPI_FONT};font-size:14px;line-height:1.4}
.fpi-card.dark{background:#000;color:#f5f5f5;border-color:#2b2b2b}
.fpi-head{display:flex;align-items:center;gap:10px;min-height:58px;padding:6px 12px}
.fpi-ava{width:38px;height:38px;border-radius:50%;background:#efefef;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center}
.fpi-card.dark .fpi-ava{background:#262626}
.fpi-hmeta{display:flex;flex-direction:column;line-height:1.35;min-width:0}
.fpi-urow{display:flex;align-items:center;gap:5px;min-width:0}
.fpi-uname{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpi-loc{font-size:12px;color:#8e8e8e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpi-dots{margin-left:auto;font-size:20px;letter-spacing:1px;line-height:1;flex:none}
.fpi-photo{width:100%;aspect-ratio:1/1;background:#eee;position:relative;overflow:hidden}
.fpi-photo img{width:100%;height:100%;object-fit:cover;display:block}
.fpi-grad{position:absolute;inset:0}
.fpi-actions{display:flex;align-items:center;gap:13px;min-height:46px;padding:4px 12px}
.fpi-ic{width:26px;height:26px;display:inline-flex;flex:none;color:#262626}
.fpi-card.dark .fpi-ic{color:#f5f5f5}
.fpi-ic svg{width:100%;height:100%}
.fpi-save{margin-left:auto}
.fpi-body{padding:2px 12px 14px}
.fpi-likes{font-size:14px;margin:2px 0 6px}
.fpi-likes b{font-weight:700}
.fpi-cap{font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}
.fpi-comments{font-size:14px;color:#8e8e8e;margin-top:6px}
.fpi-addc{display:flex;align-items:center;gap:8px;margin-top:10px}
.fpi-cava{width:28px;height:28px;border-radius:50%;background:#efefef;flex:none;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fpi-card.dark .fpi-cava{background:#262626}
.fpi-cph{flex:1;font-size:14px;color:#8e8e8e}
.fpi-cemo{font-size:14px;line-height:1}
.fpi-time{font-size:11px;color:#8e8e8e;letter-spacing:1px;margin-top:10px}
.fpi-delphoto{font-size:12px;color:#ed4956;background:none;border:none;padding:0;cursor:pointer;margin-top:6px}
.fpi-dev{max-width:430px;margin:14px auto;background:#0d0d0d;border-radius:42px;padding:11px;box-shadow:0 20px 55px rgba(0,0,0,.35),inset 0 0 0 2px #2b2b2b}
.fpi-scr{border-radius:32px;overflow:hidden;background:#fff;color:#111}
.fpi-scr.dk{background:#000;color:#f5f5f5}
.fpi-sb{display:flex;align-items:center;justify-content:space-between;padding:11px 22px 4px;font-size:15px;font-weight:600}
.fpi-sb .fpi-sic{display:inline-flex;align-items:center;gap:6px}
.fpi-sb svg{width:17px;height:12px;display:block}
.fpi-island{width:122px;height:32px;background:#000;border-radius:22px;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.fpi-punch{width:11px;height:11px;border-radius:50%;background:#0a0a0a;flex:none;box-shadow:inset 0 0 3px #274a6e}
.fpi-scr.dk .fpi-punch{background:#000;box-shadow:inset 0 0 3px #2c4e78,0 0 0 1px #1e1e1e}
.fpi-home{width:134px;height:5px;border-radius:3px;background:#111;margin:10px auto 8px}
.fpi-scr.dk .fpi-home{background:#f5f5f5}
.fpi-anav{display:flex;justify-content:center;padding:8px 0 10px}
.fpi-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#111}
.fpi-scr.dk .fpi-anav i{background:#f5f5f5}
.fpi-scr .fpi-card{margin:0;max-width:none;border:none;border-radius:0}
`;

function fpiFmt(v) {
  const n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10);
  return (isNaN(n) ? 0 : n).toLocaleString('id-ID');
}
function fpiNum(v) {
  const n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}
function fpiIcon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + FPI_PATHS[name] + '</svg>';
}
function fpiHeart(liked) {
  return liked
    ? '<svg viewBox="0 0 24 24" fill="#FF3040" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
}
const FPI_SBICON = {
  sig: '<svg viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
  wifi: '<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.2a10 10 0 0 1 13 0"/><path d="M4.2 7a6.2 6.2 0 0 1 7.6 0"/><circle cx="8" cy="9.8" r="1.4" fill="currentColor" stroke="none"/></svg>',
  bat: '<svg viewBox="0 0 25 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="20" height="11" rx="3.2" stroke="currentColor" opacity=".45"/><rect x="2.4" y="2.4" width="14" height="7.2" rx="1.6" fill="currentColor"/><path d="M22.8 3.8v4.4a2.2 2.2 0 0 0 0-4.4z" fill="currentColor" opacity=".45"/></svg>'
};
function fpiStatusBar(plat) {
  const mid = plat === 'iphone' ? '<span class="fpi-island"></span>' : '<span class="fpi-punch"></span>';
  return '<div class="fpi-sb"><span>9:41</span>' + mid +
    '<span class="fpi-sic">' + FPI_SBICON.sig + FPI_SBICON.wifi + FPI_SBICON.bat + '</span></div>';
}

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FPI_CSS;
  root.appendChild(style);

  let photoUrl = null;

  const userInp = T.input('text', 'cth: adip.rmx', '');
  const verSel = T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak');
  const locInp = T.input('text', 'cth: Jakarta, Indonesia', '');
  const capTa = T.ta(3, 'Tulis caption...', '');
  const likesInp = T.input('number', 'cth: 1234', '');
  const comInp = T.input('number', 'cth: 48', '');
  const timeInp = T.input('text', 'cth: 2 HOURS AGO', '2 HOURS AGO');
  const fi = fileInput('image/*');
  const gradSel = T.select([['sunset', 'Sunset'], ['ocean', 'Ocean'], ['ungu', 'Ungu']], 'sunset');
  const likeSel = T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak');
  const themeSel = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const delPhoto = T.el('<button type="button" class="fpi-delphoto">Hapus foto sendiri</button>');
  delPhoto.style.display = 'none';
  const preview = T.out();

  fi.addEventListener('change', () => {
    if (fi.files[0]) { photoUrl = URL.createObjectURL(fi.files[0]); delPhoto.style.display = ''; draw(); }
  });
  delPhoto.addEventListener('click', () => {
    photoUrl = null; fi.value = ''; delPhoto.style.display = 'none'; draw();
  });

  function draw() {
    const dark = themeSel.value === 'gelap';
    const plat = selPlatform.value;
    const isIPh = plat === 'iphone';
    const uname = userInp.value.trim() || 'username';
    const loc = locInp.value.trim();
    const verified = verSel.value === 'ya';
    const liked = likeSel.value === 'ya';
    const nLikes = fpiNum(likesInp.value);
    const cCount = fpiNum(comInp.value);
    const cap = capTa.value;
    const timeT = timeInp.value.trim() || '2 HOURS AGO';
    const photo = photoUrl
      ? '<img src="' + T.esc(photoUrl) + '" alt="">'
      : '<div class="fpi-grad" style="background:' + FPI_GRADS[gradSel.value] + '"></div>';

    let h = '<div class="fpi-head">'
      + '<div class="fpi-ava">' + FPI_PERSON + '</div>'
      + '<div class="fpi-hmeta"><span class="fpi-urow"><span class="fpi-uname">' + T.esc(uname) + '</span>' + (verified ? FPI_VERIFIED : '') + '</span>'
      + (loc ? '<span class="fpi-loc">' + T.esc(loc) + '</span>' : '')
      + '</div>'
      + '<span class="fpi-dots">⋯</span>'
      + '</div>';
    h += '<div class="fpi-photo">' + photo + '</div>';
    h += '<div class="fpi-actions">'
      + '<span class="fpi-ic">' + fpiHeart(liked) + '</span>'
      + '<span class="fpi-ic">' + fpiIcon('comment') + '</span>'
      + '<span class="fpi-ic">' + fpiIcon('repost') + '</span>'
      + '<span class="fpi-ic">' + fpiIcon('send') + '</span>'
      + '<span class="fpi-ic fpi-save">' + fpiIcon('bookmark') + '</span>'
      + '</div>';
    h += '<div class="fpi-body">';
    if (nLikes > 0) h += '<div class="fpi-likes">Liked by <b>' + T.esc(uname) + '</b> and <b>' + T.esc(fpiFmt(nLikes)) + '</b> others</div>';
    if (cap.trim()) h += '<div class="fpi-cap"><b>' + T.esc(uname) + '</b> ' + T.esc(cap) + '</div>';
    if (cCount > 0) h += '<div class="fpi-comments">View all ' + T.esc(fpiFmt(cCount)) + ' comments</div>';
    h += '<div class="fpi-addc"><div class="fpi-cava">' + FPI_PERSON + '</div>'
      + '<span class="fpi-cph">Add a comment...</span>'
      + '<span class="fpi-cemo">❤️</span><span class="fpi-cemo">🙌</span><span class="fpi-cemo">➕</span></div>';
    h += '<div class="fpi-time">' + T.esc(timeT) + '</div>';
    h += '</div>';

    preview.innerHTML = '<div class="fpi-dev"><div class="fpi-scr' + (dark ? ' dk' : '') + '">'
      + fpiStatusBar(plat)
      + '<div class="fpi-card' + (dark ? ' dark' : '') + '">' + h + '</div>'
      + (isIPh ? '<div class="fpi-home"></div>' : '<div class="fpi-anav"><i></i></div>')
      + '</div></div>';
  }

  [userInp, locInp, capTa, likesInp, comInp, timeInp].forEach((elx) => elx.addEventListener('input', draw));
  [verSel, gradSel, likeSel, themeSel, selPlatform].forEach((elx) => elx.addEventListener('change', draw));

  function contoh() {
    userInp.value = 'adip.rmx';
    verSel.value = 'ya';
    locInp.value = 'Jakarta, Indonesia';
    capTa.value = 'Sunset hari ini 🌅 #senja #goldenhour';
    likesInp.value = '1234';
    comInp.value = '48';
    timeInp.value = '2 HOURS AGO';
    gradSel.value = 'sunset';
    likeSel.value = 'ya';
    draw();
    T.toast('Contoh dimuat');
  }

  const fiWrap = T.el('<div></div>');
  fiWrap.appendChild(fi);
  fiWrap.appendChild(delPhoto);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Username', userInp), T.field('Badge verified', verSel)));
  root.appendChild(T.field('Lokasi', locInp, 'Opsional, tampil kecil abu di bawah username.'));
  root.appendChild(T.field('Caption', capTa));
  root.appendChild(T.grid2(T.field('Jumlah likes', likesInp), T.field('Jumlah komentar', comInp)));
  root.appendChild(T.grid2(T.field('Teks waktu', timeInp), T.field('Platform', selPlatform)));
  root.appendChild(T.grid2(T.field('Tema', themeSel), T.field('Tampilkan sebagai disukai', likeSel)));
  root.appendChild(T.grid2(T.field('Upload foto sendiri', fiWrap), T.field('Atau pakai gradient', gradSel)));
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-post-ig.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
