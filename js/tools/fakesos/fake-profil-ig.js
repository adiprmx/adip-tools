import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {"id":"fake-profil-ig","name":"Fake Profil Instagram","cat":"fakesos","icon":"👤","desc":"Bikin screenshot profil Instagram palsu: foto, bio, jumlah pengikut, highlight, dan grid foto.","keywords":"instagram,profil,bio,pengikut,highlight,grid,fake,palsu,screenshot,prank","since": "6.18.0"};

const FP_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FP_BLUE = '#0095F6';
const FP_STORY_GRAD = 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)';
/* Segel verified IG: 12 gerigi (sama seperti fake-post-ig.js) */
const FP_SEAL_D = "M10.8 2.01Q12 1 13.2 2.01Q14.41 3.02 15.95 2.75Q17.5 2.47 18.04 3.95Q18.58 5.42 20.05 5.96Q21.53 6.5 21.25 8.05Q20.98 9.59 21.99 10.8Q23 12 21.99 13.2Q20.98 14.41 21.25 15.95Q21.53 17.5 20.05 18.04Q18.58 18.58 18.04 20.05Q17.5 21.53 15.95 21.25Q14.41 20.98 13.2 21.99Q12 23 10.8 21.99Q9.59 20.98 8.05 21.25Q6.5 21.53 5.96 20.05Q5.42 18.58 3.95 18.04Q2.47 17.5 2.75 15.95Q3.02 14.41 2.01 13.2Q1 12 2.01 10.8Q3.02 9.59 2.75 8.05Q2.47 6.5 3.95 5.96Q5.42 5.42 5.96 3.95Q6.5 2.47 8.05 2.75Q9.59 3.02 10.8 2.01Z";

const FP_PERSON = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="#b5b5b5" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';

const FP_GRADS = [
  'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
  'linear-gradient(135deg,#0095F6,#00D4FF)',
  'linear-gradient(135deg,#962FBF,#4F5BD5)',
];

/* Ikon outline gaya IG: 24x24, stroke 2, round caps/joins */
const FP_ST = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const FP_P = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  reels: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M4 9.3h16"/><path d="M8 4.6l1.7 4.7M13.2 4.6l1.7 4.7"/><path d="M10.3 12.3l4.6 2.6-4.6 2.6z" fill="currentColor" stroke="none"/>',
  tagged: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="10.5" r="3.2"/><path d="M7.5 18.5c.8-2.2 2.5-3.3 4.5-3.3s3.7 1.1 4.5 3.3"/>',
  bell: '<path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  more: '<circle cx="5.2" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.9" fill="currentColor" stroke="none"/>',
};

function fpIcon(name) {
  return '<svg viewBox="0 0 24 24" ' + FP_ST + ' aria-hidden="true">' + FP_P[name] + '</svg>';
}
function fpVerified() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="' + FP_BLUE + '" d="' + FP_SEAL_D + '"/><path d="M8.3 12.4l2.6 2.7 5-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

// Format jumlah ala IG: <1000 apa adanya, <1jt "1,2 rb", >=1jt "1,2 jt". Murni.
export function formatHitungan(n) {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  if (v < 1000) return String(v);
  if (v < 1000000) return (v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' rb';
  return (v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
}

const FP_CSS = `
.fp-app{background:#fff;color:#000;font-family:${FP_FONT};font-size:14px;line-height:1.4}
.fp-app.dk{background:#000;color:#f5f5f5}
.fp-head{display:flex;align-items:center;gap:6px;height:52px;padding:0 12px;flex:none}
.fp-back{font-size:24px;font-weight:300;line-height:1;padding:0 4px}
.fp-htitle{display:flex;align-items:center;gap:4px;font-size:17px;font-weight:600;min-width:0}
.fp-htitle span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fp-ver{width:14px;height:14px;flex:none;display:inline-flex}
.fp-ver svg{width:100%;height:100%;display:block}
.fp-hicons{margin-left:auto;display:flex;align-items:center;gap:20px}
.fp-ic24{width:24px;height:24px;display:inline-flex;flex:none;color:inherit}
.fp-ic24 svg{width:100%;height:100%;display:block}
.fp-profil{display:flex;align-items:center;gap:20px;padding:6px 16px 12px}
.fp-ring{width:86px;height:86px;border-radius:50%;background:${FP_STORY_GRAD};display:flex;align-items:center;justify-content:center;flex:none;padding:3px}
.fp-ringin{width:100%;height:100%;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:2px}
.fp-app.dk .fp-ringin{background:#000}
.fp-ava{width:100%;height:100%;border-radius:50%;background:#efefef;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fp-app.dk .fp-ava{background:#262626}
.fp-ava img{width:100%;height:100%;object-fit:cover;display:block}
.fp-stats{display:flex;flex:1;justify-content:space-around;text-align:center}
.fp-stat b{display:block;font-size:16px;font-weight:700}
.fp-stat span{font-size:13px}
.fp-bio{padding:0 16px 12px}
.fp-nama{font-weight:600;font-size:14px;margin:0 0 2px}
.fp-teks{font-size:14px;line-height:1.45;margin:0;white-space:pre-wrap;word-break:break-word}
.fp-aksi{display:flex;gap:8px;padding:0 16px 14px}
.fp-btn{flex:1;height:32px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:default;background:#0095F6;color:#fff}
.fp-btn2{flex:1;height:32px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:default;background:#efefef;color:#000}
.fp-app.dk .fp-btn2{background:#262626;color:#f5f5f5}
.fp-hl{display:flex;gap:16px;padding:4px 16px 16px;overflow:hidden}
.fp-hli{display:flex;flex-direction:column;align-items:center;gap:5px;width:60px;flex:none}
.fp-hling{width:58px;height:58px;border-radius:50%;border:1px solid #dbdbdb;display:flex;align-items:center;justify-content:center;background:#fafafa}
.fp-app.dk .fp-hling{border-color:#363636;background:#0a0a0a}
.fp-hlgrad{width:52px;height:52px;border-radius:50%}
.fp-hlnama{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px}
.fp-tabs{display:flex;border-top:1px solid #dbdbdb}
.fp-app.dk .fp-tabs{border-top-color:#262626}
.fp-tab{flex:1;height:46px;display:flex;align-items:center;justify-content:center;color:#737373}
.fp-app.dk .fp-tab{color:#a8a8a8}
.fp-tab.on{color:#000;border-top:1px solid #000;margin-top:-1px}
.fp-app.dk .fp-tab.on{color:#f5f5f5;border-top-color:#f5f5f5}
.fp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.fp-sel{aspect-ratio:1/1;background:#efefef;position:relative;overflow:hidden}
.fp-app.dk .fp-sel{background:#0a0a0a}
.fp-sel img{width:100%;height:100%;object-fit:cover;display:block}
.fp-selgrad{position:absolute;inset:0}
.fp-delphoto{font-size:12px;color:#ed4956;background:none;border:none;padding:0;cursor:pointer;margin-top:6px}
.fp-dev{max-width:430px;margin:14px auto;background:#0d0d0d;border-radius:42px;padding:11px;box-shadow:0 20px 55px rgba(0,0,0,.35),inset 0 0 0 2px #2b2b2b}
.fp-scr{border-radius:32px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.fp-scr.dk{background:#000}
.fp-sb{position:relative;display:flex;align-items:center;justify-content:space-between;padding:11px 22px 4px;font-size:15px;font-weight:600;flex:none;color:#111}
.fp-scr.dk .fp-sb{color:#f5f5f5}
.fp-home{width:134px;height:5px;border-radius:3px;background:#111;margin:10px auto 8px;flex:none}
.fp-scr.dk .fp-home{background:#f5f5f5}
.fp-anav{display:flex;justify-content:center;padding:8px 0 10px;flex:none}
.fp-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#111}
.fp-scr.dk .fp-anav i{background:#f5f5f5}
.fp-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;flex:none}
.fp-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
`;

function fpNum(v) {
  const n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FP_CSS;
  root.appendChild(style);

  let avatarUrl = null;
  let gridUrls = [];

  const userI = T.input('text', 'cth: adip.rmx', '');
  const verSel = T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak');
  const namaI = T.input('text', 'cth: Adip RMX', '');
  const bioI = T.ta(3, 'Tulis bio...', '');
  const postI = T.input('number', 'cth: 128', '');
  const followerI = T.input('number', 'cth: 12500', '');
  const followingI = T.input('number', 'cth: 350', '');
  const hlI = T.ta(3, 'Satu highlight per baris (maks 4)', '');
  const fiAvatar = fileInput('image/*');
  const fiGrid = fileInput('image/*');
  fiGrid.multiple = true;
  const delAvatar = T.el('<button type="button" class="fp-delphoto">Hapus foto profil</button>');
  delAvatar.style.display = 'none';
  const delGrid = T.el('<button type="button" class="fp-delphoto">Hapus foto grid</button>');
  delGrid.style.display = 'none';
  const themeSel = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const preview = T.out();

  fiAvatar.addEventListener('change', () => {
    if (fiAvatar.files[0]) { avatarUrl = URL.createObjectURL(fiAvatar.files[0]); delAvatar.style.display = ''; draw(); }
  });
  delAvatar.addEventListener('click', () => {
    avatarUrl = null; fiAvatar.value = ''; delAvatar.style.display = 'none'; draw();
  });
  fiGrid.addEventListener('change', () => {
    gridUrls = Array.from(fiGrid.files || []).slice(0, 9).map((f) => URL.createObjectURL(f));
    delGrid.style.display = gridUrls.length ? '' : 'none';
    draw();
  });
  delGrid.addEventListener('click', () => {
    gridUrls = []; fiGrid.value = ''; delGrid.style.display = 'none'; draw();
  });

  function draw() {
    const dark = themeSel.value === 'gelap';
    const plat = selPlatform.value;
    const isIPh = plat === 'iphone';
    brandField.style.display = (plat === 'android') ? '' : 'none';
    const uname = userI.value.trim() || 'username';
    const verified = verSel.value === 'ya';
    const nama = namaI.value.trim();
    const bio = bioI.value;
    const highlights = hlI.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 4);

    let h = '<div class="fp-head">'
      + '<span class="fp-back">←</span>'
      + '<span class="fp-htitle"><span>' + T.esc(uname) + '</span>' + (verified ? '<span class="fp-ver">' + fpVerified() + '</span>' : '') + '</span>'
      + '<span class="fp-hicons"><span class="fp-ic24">' + fpIcon('bell') + '</span>'
      + '<span class="fp-ic24">' + fpIcon('more') + '</span></span>'
      + '</div>';

    h += '<div class="fp-profil">'
      + '<div class="fp-ring"><div class="fp-ringin"><div class="fp-ava">'
      + (avatarUrl ? '<img src="' + T.esc(avatarUrl) + '" alt="">' : FP_PERSON)
      + '</div></div></div>'
      + '<div class="fp-stats">'
      + '<div class="fp-stat"><b>' + T.esc(formatHitungan(fpNum(postI.value))) + '</b><span>Postingan</span></div>'
      + '<div class="fp-stat"><b>' + T.esc(formatHitungan(fpNum(followerI.value))) + '</b><span>Pengikut</span></div>'
      + '<div class="fp-stat"><b>' + T.esc(formatHitungan(fpNum(followingI.value))) + '</b><span>Mengikuti</span></div>'
      + '</div></div>';

    h += '<div class="fp-bio">'
      + (nama ? '<p class="fp-nama">' + T.esc(nama) + '</p>' : '')
      + '<p class="fp-teks">' + T.esc(bio) + '</p>'
      + '</div>';

    h += '<div class="fp-aksi"><button type="button" class="fp-btn">Ikuti</button><button type="button" class="fp-btn2">Pesan</button></div>';

    if (highlights.length) {
      h += '<div class="fp-hl">' + highlights.map((namaHl, i) => {
        return '<div class="fp-hli"><div class="fp-hling"><div class="fp-hlgrad" style="background:' + FP_GRADS[i % FP_GRADS.length] + '"></div></div><span class="fp-hlnama">' + T.esc(namaHl) + '</span></div>';
      }).join('') + '</div>';
    }

    h += '<div class="fp-tabs">'
      + '<span class="fp-tab on"><span class="fp-ic24">' + fpIcon('grid') + '</span></span>'
      + '<span class="fp-tab"><span class="fp-ic24">' + fpIcon('reels') + '</span></span>'
      + '<span class="fp-tab"><span class="fp-ic24">' + fpIcon('tagged') + '</span></span>'
      + '</div>';

    let cells = '';
    for (let i = 0; i < 9; i++) {
      cells += '<div class="fp-sel">' + (gridUrls[i]
        ? '<img src="' + T.esc(gridUrls[i]) + '" alt="">'
        : '<div class="fp-selgrad" style="background:' + FP_GRADS[i % FP_GRADS.length] + '"></div>') + '</div>';
    }
    h += '<div class="fp-grid">' + cells + '</div>';

    T.show(preview, '<div class="fp-dev"><div class="fp-scr' + (dark ? ' dk' : '') + '">'
      + '<div class="fp-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>'
      + '<div class="fp-app' + (dark ? ' dk' : '') + '">' + h + '</div>'
      + (isIPh ? '<div class="fp-home"></div>' : '<div class="fp-anav"><i></i></div>')
      + '<div class="fp-pranktag-wrap"><span class="fp-pranktag">palsu · cuma prank</span></div>'
      + '</div></div>');
  }

  [userI, namaI, bioI, postI, followerI, followingI, hlI].forEach((elx) => elx.addEventListener('input', draw));
  [verSel, themeSel, selPlatform, selBrand].forEach((elx) => elx.addEventListener('change', draw));

  function contoh() {
    userI.value = 'adip.rmx'; verSel.value = 'ya'; namaI.value = 'Adip RMX';
    bioI.value = '🎵 Remix & musik\n📍 Jakarta\n📩 DM untuk kerja sama';
    postI.value = '128'; followerI.value = '12500'; followingI.value = '350';
    hlI.value = 'Musik\nKonser\nStudio\nCover';
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  const avWrap = T.el('<div></div>');
  avWrap.appendChild(fiAvatar);
  avWrap.appendChild(delAvatar);
  const gridWrap = T.el('<div></div>');
  gridWrap.appendChild(fiGrid);
  gridWrap.appendChild(delGrid);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Username', userI), T.field('Badge verified', verSel)));
  root.appendChild(T.field('Nama tampilan', namaI));
  root.appendChild(T.field('Bio', bioI));
  root.appendChild(T.grid2(T.field('Jumlah postingan', postI), T.field('Jumlah pengikut', followerI)));
  root.appendChild(T.field('Jumlah mengikuti', followingI));
  root.appendChild(T.field('Highlight (satu per baris, maks 4)', hlI));
  root.appendChild(T.grid2(T.field('Upload foto profil', avWrap), T.field('Upload foto grid (maks 9)', gridWrap)));
  root.appendChild(T.grid2(T.field('Tema', themeSel), T.field('Platform', selPlatform)));
  const brandField = T.field('Merk HP', selBrand);
  root.appendChild(brandField);
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-profil-ig.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
