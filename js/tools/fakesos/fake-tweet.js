import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.5';

/* Logo X resmi (path merek X, viewBox 24) — fill currentColor agar ikut
   warna teks tema situs (putih di tema gelap, hitam di tema terang). */
const X_LOGO_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';

export const meta = {
  id: 'fake-tweet',
  name: 'Fake Tweet X',
  cat: 'fakesos',
  icon: X_LOGO_SVG,
  desc: 'Bikin screenshot tweet X palsu + unduh PNG.',
  keywords: 'twitter,x,tweet,fake,palsu,screenshot,prank',
};

/* Palet X 2025–2026 (riset 2026-10-02):
   terang: border #EFF3F4 | redup(Dim): teks #E7E9EA | gelap(Lights out): teks #E7E9EA */
const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#0F1419', muted: '#536471', imgb: '#EFF3F4' },
  redup: { bg: '#15202B', fg: '#E7E9EA', muted: '#8899A6', imgb: '#38444D' },
  gelap: { bg: '#000000', fg: '#E7E9EA', muted: '#71767B', imgb: '#2F3336' },
};

const VER = { blue: '#1D9BF0', gold: '#FFD400', gray: '#829AAB' };
const VER_LABEL = { blue: 'Verified biru', gold: 'Verified emas', gray: 'Verified abu-abu' };

/* Ikon X asli = filled paths (bukan outline), 18px, viewBox 24 (badge 22).
   Path disalin dari X web (skill x-twitter-ui, verified live 2026-10-02). */
const ICO_REPLY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/></svg>';
const ICO_RT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/></svg>';
const ICO_LIKE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/></svg>';
const ICO_VIEW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>';
const ICO_BM = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"/></svg>';
const ICO_SHARE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>';
const ICO_MORE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>';

/* Badge verified X = segel scallop (bukan lingkaran polos) + centang putih.
   Path segel disalin dari X web; centang digambar terpisah agar selalu putih. */
const VER_SEAL = 'M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z';
const VER_TICK = 'M9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z';
function verBadge(ver) {
  return '<span class="ft-badge" title="' + T.esc(VER_LABEL[ver]) + '">' +
    '<svg width="18" height="18" viewBox="0 0 22 22" aria-hidden="true">' +
    '<path fill="' + VER[ver] + '" d="' + VER_SEAL + '"/>' +
    '<path fill="#fff" d="' + VER_TICK + '"/>' +
    '</svg></span>';
}

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

// Escape dulu, lalu warnai hashtag & mention ala X, lalu jaga baris baru.
function richText(src) {
  const e = T.esc(src);
  const linked = e
    .replace(/(^|[\s>])(https?:\/\/[^\s<]+|(?:www\.|(?:[a-z0-9-]+\.)+[a-z]{2,})[^\s<]*)/gi, '$1<span class="ft-link">$2</span>')
    .replace(/(^|[\s>])((?:#|@)[A-Za-z0-9_]+)/g, '$1<span class="ft-link">$2</span>');
  return linked.split('\n').join('<br>');
}

export function render(root) {
  const wrap = T.el('<div class="ft-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.ft-wrap{font-family:TwitterChirp,-apple-system,BlinkMacSystemFont,"system-ui","Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.ft-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.ft-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.ft-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.ft-card{width:100%;max-width:480px;background:var(--ft-bg);color:var(--ft-fg);text-align:left}' +
    '.ft-tweet{display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid var(--ft-imgb)}' +
    '.ft-ava{width:40px;height:40px;border-radius:50%;flex:0 0 40px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:17px;line-height:1}' +
    '.ft-main{flex:1;min-width:0}' +
    '.ft-top{display:flex;align-items:center}' +
    '.ft-namerow{display:flex;align-items:center;gap:4px;font-size:15px;line-height:20px;min-width:0;flex:1;overflow:hidden;white-space:nowrap}' +
    '.ft-name{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ft-badge{width:18px;height:18px;flex:0 0 18px;display:inline-flex;align-items:center;justify-content:center}' +
    '.ft-badge svg{display:block}' +
    '.ft-handle{color:var(--ft-muted);font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}' +
    '.ft-dot{color:var(--ft-muted);font-weight:400;flex:none}' +
    '.ft-time{color:var(--ft-muted);font-weight:400;flex:none;white-space:nowrap}' +
    '.ft-more{color:var(--ft-muted);flex:none;display:inline-flex;align-items:center;padding-left:8px}' +
    '.ft-more svg{display:block}' +
    '.ft-text{font-size:15px;line-height:20px;font-weight:400;margin:2px 0 0;overflow-wrap:break-word;white-space:normal}' +
    '.ft-link{color:#1D9BF0}' +
    '.ft-img{margin:12px 0 0}' +
    '.ft-img img{width:100%;height:auto;display:block;border-radius:16px;border:1px solid var(--ft-imgb)}' +
    '.ft-eng{display:flex;align-items:center;justify-content:space-between;max-width:425px;margin-top:12px}' +
    '.ft-e{display:flex;align-items:center;gap:4px;font-size:13px;line-height:16px;font-weight:400;color:var(--ft-muted);min-width:0}' +
    '.ft-e svg{display:block;flex:none}' +
    '.ft-eright{display:flex;align-items:center;gap:16px;color:var(--ft-muted);flex:none}' +
    '.ft-eright svg{display:block;flex:none}' +
    '.ft-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '.ft-sb{position:relative;display:flex;justify-content:space-between;align-items:center;padding:18px 24px 14px;color:var(--ft-fg)}' +
    '.ft-homebar{display:flex;justify-content:center;padding:9px 0 8px}' +
    '.ft-homebar span{width:134px;height:5px;border-radius:3px;background:var(--ft-fg);opacity:.85}' +
    '.ft-navpill{display:flex;justify-content:center;padding:10px 0 8px}' +
    '.ft-navpill span{width:108px;height:4px;border-radius:2px;background:var(--ft-fg);opacity:.85}' +
    '</style>';

  const nameI = T.input('text', 'Nama tampilan', 'Adip RMX');
  const handleI = T.input('text', 'Handle tanpa @', 'adiprmx');
  const verI = T.select([['none', 'Tanpa badge'], ['blue', 'Verified biru'], ['gold', 'Verified emas'], ['gray', 'Verified abu-abu']], 'blue');
  const timeI = T.input('text', 'cth: 2 jam', '2 jam');
  const textI = T.ta(4, 'Tulis isi tweet…', 'Akhirnya 300 tools selesai juga!\n\nCoba sendiri di tools.adipmusic.my.id #ADIPTools');
  const repI = T.input('text', 'cth: 12', '128');
  const rtI = T.input('text', 'cth: 34', '45');
  const likeI = T.input('text', 'cth: 567 / 2,1 rb', '2,1 rb');
  const viewI = T.input('text', 'cth: 8,9 rb', '18 rb');
  const themeI = T.select([['terang', 'Terang'], ['redup', 'Redup'], ['gelap', 'Gelap']], 'gelap');
  const platI = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  let imgUrl = null;
  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    if (f) { imgUrl = URL.createObjectURL(f); draw(); }
    fi.value = '';
  };

  const ctl = T.el('<div class="ft-ctl"></div>');
  ctl.appendChild(T.field('Nama tampilan', nameI));
  ctl.appendChild(T.field('Handle (tanpa @)', handleI));
  ctl.appendChild(T.field('Badge verified', verI));
  ctl.appendChild(T.field('Waktu', timeI, 'cth: 2 jam, Kemarin, 12 Agu 26'));
  ctl.appendChild(T.field('Isi tweet', textI));
  const mrow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  mrow.appendChild(T.field('Balasan', repI));
  mrow.appendChild(T.field('Repost', rtI));
  mrow.appendChild(T.field('Suka', likeI));
  mrow.appendChild(T.field('Tayangan', viewI));
  ctl.appendChild(mrow);
  ctl.appendChild(T.field('Platform', platI));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="ft-btns"></div>');
  btns.appendChild(T.btn('🖼️ Pilih gambar', () => fi.click()));
  btns.appendChild(T.btn('✕ Hapus gambar', () => { imgUrl = null; draw(); }));
  btns.appendChild(T.btn('🎲 Contoh', () => {
    nameI.value = 'Adip RMX'; handleI.value = 'adiprmx'; verI.value = 'blue';
    timeI.value = '2 jam';
    textI.value = 'Akhirnya 300 tools selesai juga!\n\nCoba sendiri di tools.adipmusic.my.id #ADIPTools';
    repI.value = '128'; rtI.value = '45'; likeI.value = '2,1 rb'; viewI.value = '18 rb';
    themeI.value = 'gelap'; draw(); T.scrollToPreview(card);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(card, 'fake-tweet.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="ft-prevbox"></div>');
  const card = T.el('<div class="ft-card"></div>');
  prevBox.appendChild(card);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="ft-note"></p>');
  note.textContent = LOCAL_NOTE;
  wrap.appendChild(note);

  function draw() {
    const th = THEMES[themeI.value] || THEMES.gelap;
    const isIPh = platI.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const sbHtml =
      '<div class="ft-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, themeI.value !== 'terang') + '</div>';
    const navHtml = isIPh
      ? '<div class="ft-homebar"><span></span></div>'
      : '<div class="ft-navpill"><span></span></div>';
    const name = nameI.value.trim() || 'Nama';
    const handle = (handleI.value.trim() || 'handle').replace(/^@+/, '');
    const ver = verI.value;
    const badge = ver !== 'none' ? verBadge(ver) : '';
    const initial = T.esc(name.trim().charAt(0).toUpperCase() || '?');
    const imgHtml = imgUrl
      ? '<div class="ft-img"><img src="' + T.esc(imgUrl) + '" alt="gambar tweet"></div>'
      : '';
    card.setAttribute('style',
      '--ft-bg:' + th.bg + ';--ft-fg:' + th.fg + ';--ft-muted:' + th.muted + ';--ft-imgb:' + th.imgb);
    card.innerHTML =
      sbHtml +
      '<div class="ft-tweet">' +
        '<div class="ft-ava" style="background:' + avaColor(name) + '">' + initial + '</div>' +
        '<div class="ft-main">' +
          '<div class="ft-top"><div class="ft-namerow"><span class="ft-name">' + T.esc(name) + '</span>' + badge +
          '<span class="ft-handle">@' + T.esc(handle) + '</span><span class="ft-dot">·</span>' +
          '<span class="ft-time">' + T.esc(timeI.value.trim() || 'baru saja') + '</span></div>' +
          '<span class="ft-more">' + ICO_MORE + '</span></div>' +
          '<div class="ft-text">' + richText(textI.value) + '</div>' +
          imgHtml +
          '<div class="ft-eng">' +
            '<span class="ft-e">' + ICO_REPLY + '<span>' + T.esc(repI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-e">' + ICO_RT + '<span>' + T.esc(rtI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-e">' + ICO_LIKE + '<span>' + T.esc(likeI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-e">' + ICO_VIEW + '<span>' + T.esc(viewI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-eright">' + ICO_BM + ICO_SHARE + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      navHtml;
  }

  [nameI, handleI, verI, timeI, textI, repI, rtI, likeI, viewI, themeI, platI, selBrand].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
