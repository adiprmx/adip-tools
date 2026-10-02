import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.2';

export const meta = {
  id: 'fake-tweet',
  name: 'Fake Tweet X',
  cat: 'fakesos',
  icon: '✖️',
  desc: 'Bikin screenshot tweet X palsu + unduh PNG.',
  keywords: 'twitter,x,tweet,fake,palsu,screenshot,prank',
};

const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#0F1419', muted: '#536471', imgb: '#CFD9DE' },
  redup: { bg: '#15202B', fg: '#FFFFFF', muted: '#8899A6', imgb: '#38444D' },
  gelap: { bg: '#000000', fg: '#E6E9EA', muted: '#71767B', imgb: '#2F3336' },
};

const VER = { blue: '#1D9BF0', gold: '#FFD400', gray: '#829AAB' };
const VER_LABEL = { blue: 'Verified biru', gold: 'Verified emas', gray: 'Verified abu-abu' };

const CHECK = '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="#fff" d="M9.55 15.9 6 12.35l1.4-1.4 2.15 2.15 5.1-5.1 1.4 1.4z"/></svg>';

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

// Ikon engagement bar ala X (stroke, 18px)
const ICO_REPLY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
const ICO_RT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
const ICO_LIKE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const ICO_VIEW = '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><rect x="1" y="11" width="3" height="6" rx="0.8"/><rect x="5.5" y="7.5" width="3" height="9.5" rx="0.8"/><rect x="10" y="4" width="3" height="13" rx="0.8"/><rect x="14.5" y="1" width="3" height="16" rx="0.8"/></svg>';
const ICO_BM = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
const ICO_SHARE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';

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
    '.ft-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
    '.ft-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.ft-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.ft-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.ft-card{width:100%;max-width:480px;background:var(--ft-bg);color:var(--ft-fg);text-align:left}' +
    '.ft-tweet{display:flex;gap:12px;padding:12px 16px}' +
    '.ft-ava{width:40px;height:40px;border-radius:50%;flex:0 0 40px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:17px;line-height:1}' +
    '.ft-main{flex:1;min-width:0}' +
    '.ft-top{display:flex;align-items:flex-start}' +
    '.ft-namerow{display:flex;align-items:center;gap:4px;font-size:15px;line-height:1.3;min-width:0;flex:1;overflow:hidden;white-space:nowrap}' +
    '.ft-name{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ft-badge{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:0 0 18px}' +
    '.ft-handle{color:var(--ft-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:400}' +
    '.ft-more{color:var(--ft-muted);font-size:16px;letter-spacing:2px;line-height:1;padding-left:8px;flex:none}' +
    '.ft-text{font-size:15px;line-height:20px;font-weight:400;margin:2px 0 12px;overflow-wrap:break-word;white-space:normal}' +
    '.ft-link{color:#1D9BF0}' +
    '.ft-img{margin:0 0 4px}' +
    '.ft-img img{width:100%;height:auto;display:block;border-radius:16px;border:1px solid var(--ft-imgb)}' +
    '.ft-eng{display:flex;align-items:center;margin-top:12px}' +
    '.ft-e{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:400;color:var(--ft-muted);flex:1 1 0;min-width:0}' +
    '.ft-e svg{display:block;flex:none}' +
    '.ft-eright{display:flex;align-items:center;justify-content:flex-end;gap:20px;color:var(--ft-muted);flex:1 1 0;min-width:0}' +
    '.ft-eright svg{display:block}' +
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
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['vivo', 'Vivo'], ['oppo', 'Oppo'], ['pixel', 'Pixel / Stock']], 'xiaomi');

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
    themeI.value = 'gelap'; draw();
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
      '<div class="ft-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value) + '</div>';
    const navHtml = isIPh
      ? '<div class="ft-homebar"><span></span></div>'
      : '<div class="ft-navpill"><span></span></div>';
    const name = nameI.value.trim() || 'Nama';
    const handle = (handleI.value.trim() || 'handle').replace(/^@+/, '');
    const ver = verI.value;
    const badge = ver !== 'none'
      ? '<span class="ft-badge" title="' + T.esc(VER_LABEL[ver]) + '" style="background:' + VER[ver] + '">' + CHECK + '</span>'
      : '';
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
          '<span class="ft-handle">@' + T.esc(handle) + ' · ' + T.esc(timeI.value.trim() || 'baru saja') + '</span></div>' +
          '<span class="ft-more">···</span></div>' +
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
