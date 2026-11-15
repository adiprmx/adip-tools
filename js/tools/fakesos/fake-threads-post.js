import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.12.0';

export const meta = {
  id: 'fake-threads-post',
  name: 'Fake Postingan Threads',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M20.2 10.6c-.5-3.8-3.7-6.8-7.7-7.1C8.3 3.1 5 6.2 5 10.4c0 4.3 3.3 7.5 7.5 7.5 2.1 0 3.9-.8 5.1-2.1"/><circle cx="12.2" cy="12.3" r="2.6"/><path d="M20.2 10.6c.3 2 .2 3.8-.6 5.3"/></svg>',
  desc: 'Bikin screenshot postingan Threads palsu + unduh PNG.',
  keywords: 'threads,postingan,thread,fake,palsu,screenshot,prank,meta',
  since: '6.12.0',
};

/* Palet Threads (riset 15 Nov 2026, teardown threads.com 2026-08-29):
   kanvas hitam murni #000 / putih #fff, ikon engagement abu #CCC (gelap) /
   #777 (terang), suka aktif #FE0169, repost aktif #22C55E, badge #0095F6. */
const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#000000', muted: '#777777', icon: '#777777', bdr: '#E5E5E5', line: '#D5D5D5', tab: '#000000' },
  gelap: { bg: '#000000', fg: '#F3F5F7', muted: '#777777', icon: '#CCCCCC', bdr: '#262626', line: '#333333', tab: '#F3F5F7' },
};

/* Glyph Threads (rekreasi @ spiral). */
const THREADS_GLYPH = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M20.2 10.6c-.5-3.8-3.7-6.8-7.7-7.1C8.3 3.1 5 6.2 5 10.4c0 4.3 3.3 7.5 7.5 7.5 2.1 0 3.9-.8 5.1-2.1"/><circle cx="12.2" cy="12.3" r="2.6"/><path d="M20.2 10.6c.3 2 .2 3.8-.6 5.3"/></svg>';
const VER_BADGE = '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#0095F6"/><path d="M8.3 12.4l2.6 2.7 5-5.9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const ICO_HEART = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const ICO_HEART_FILL = '<svg width="21" height="21" viewBox="0 0 24 24" fill="#FE0169" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const ICO_REPLY = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
const ICO_REPOST = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
const ICO_SHARE = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
const ICO_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';
const ICO_HOME = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5l9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/></svg>';
const ICO_SEARCH = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const ICO_COMPOSE = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>';
const ICO_ACTIVITY = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

function richText(src) {
  const e = T.esc(src);
  const linked = e
    .replace(/(^|[\s>])((?:#|@)[A-Za-z0-9_.]+)/g, '$1<span class="fth-link">$2</span>');
  return linked.split('\n').join('<br>');
}

export function render(root) {
  const wrap = T.el('<div class="fth-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fth-wrap{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.fth-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fth-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fth-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fth-phone{width:100%;max-width:420px;background:var(--fth-bg);color:var(--fth-fg);text-align:left;overflow:hidden}' +
    '.fth-sb{position:relative;display:flex;justify-content:space-between;align-items:center;padding:14px 20px 8px;color:var(--fth-fg)}' +
    '.fth-topbar{display:flex;align-items:center;justify-content:center;padding:4px 0 8px;color:var(--fth-fg)}' +
    '.fth-tabs{display:flex;justify-content:center;gap:0;border-bottom:1px solid var(--fth-bdr)}' +
    '.fth-tab{flex:1;text-align:center;font-size:15px;font-weight:600;padding:10px 0 12px;color:var(--fth-muted);position:relative}' +
    '.fth-tab.fr-on{color:var(--fth-fg)}' +
    '.fth-tab.fr-on::after{content:"";position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:56px;height:2px;border-radius:2px;background:var(--fth-fg)}' +
    '.fth-post{display:flex;gap:11px;padding:14px 16px 4px}' +
    '.fth-col{flex:none;display:flex;flex-direction:column;align-items:center}' +
    '.fth-ava{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:16px;overflow:hidden;flex:none}' +
    '.fth-ava img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.fth-line{width:2px;flex:1;background:var(--fth-line);border-radius:2px;margin:6px 0}' +
    '.fth-main{flex:1;min-width:0;padding-bottom:12px}' +
    '.fth-top{display:flex;align-items:center;gap:5px}' +
    '.fth-name{font-size:15px;font-weight:600;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.fth-ver{display:inline-flex;flex:none}' +
    '.fth-time{font-size:14px;color:var(--fth-muted);flex:none;white-space:nowrap}' +
    '.fth-more{margin-left:auto;color:var(--fth-muted);flex:none;display:flex;padding-left:8px}' +
    '.fth-text{font-size:15px;line-height:1.4;margin:3px 0 0;overflow-wrap:break-word}' +
    '.fth-link{color:#0095F6}' +
    '.fth-img{margin:10px 0 0}' +
    '.fth-img img{width:100%;height:auto;display:block;border-radius:10px;border:1px solid var(--fth-bdr)}' +
    '.fth-eng{display:flex;align-items:center;gap:16px;margin-top:10px;color:var(--fth-icon)}' +
    '.fth-eng span{display:inline-flex;align-items:center}' +
    '.fth-counts{font-size:14px;color:var(--fth-muted);margin:8px 0 0}' +
    '.fth-div{height:1px;background:var(--fth-bdr);margin:0 16px}' +
    '.fth-tabbar{display:flex;align-items:center;justify-content:space-around;padding:12px 16px 8px;color:var(--fth-tab)}' +
    '.fth-tabbar .fth-pava{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;overflow:hidden}' +
    '.fth-tabbar .fth-pava img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.fth-homebar{display:flex;justify-content:center;padding:6px 0 8px}' +
    '.fth-homebar span{width:134px;height:5px;border-radius:3px;background:var(--fth-fg);opacity:.85}' +
    '.fth-navpill{display:flex;justify-content:center;padding:8px 0}' +
    '.fth-navpill span{width:108px;height:4px;border-radius:2px;background:var(--fth-fg);opacity:.85}' +
    '.fth-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const userI = T.input('text', 'Username', 'adip.rmx');
  const verI = T.select([['ya', 'Ada badge ✓'], ['tidak', 'Tanpa badge']], 'ya');
  const timeI = T.input('text', 'cth: 2 jam', '2 jam');
  const textI = T.ta(3, 'Tulis isi postingan…', 'Beat baru udah rilis! Dengerin di SoundCloud ya 🎧\n\nLink di bio #remix #adip');
  const text2I = T.ta(2, 'Lanjutan thread (opsional, kosong = satu postingan)…', '');
  const repI = T.input('text', 'cth: 128', '128');
  const likeI = T.input('text', 'cth: 2,1 rb', '2,1 rb');
  const likedI = T.select([['tidak', 'Belum suka'], ['ya', 'Sudah suka (hati merah)']], 'ya');
  const repostedI = T.select([['tidak', 'Tidak'], ['ya', 'Sudah repost (ikon hijau)']], 'tidak');
  const themeI = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');
  const platI = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  let imgUrl = null;
  fi.onchange = () => { const f = fi.files && fi.files[0]; if (f) { imgUrl = URL.createObjectURL(f); draw(); } fi.value = ''; };
  const fiAv = fileInput('image/*');
  let avUrl = null;
  fiAv.onchange = () => { const f = fiAv.files && fiAv.files[0]; if (f) { avUrl = URL.createObjectURL(f); draw(); } fiAv.value = ''; };

  const ctl = T.el('<div class="fth-ctl"></div>');
  ctl.appendChild(T.field('Username', userI));
  ctl.appendChild(T.field('Badge verified', verI));
  ctl.appendChild(T.field('Waktu', timeI));
  ctl.appendChild(T.field('Isi postingan', textI));
  ctl.appendChild(T.field('Lanjutan thread (opsional)', text2I, 'Kalau diisi, muncul postingan kedua dari penulis yang sama dengan garis penghubung khas Threads.'));
  const mrow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  mrow.appendChild(T.field('Jumlah balasan', repI));
  mrow.appendChild(T.field('Jumlah suka', likeI));
  mrow.appendChild(T.field('Status suka', likedI));
  mrow.appendChild(T.field('Status repost', repostedI));
  ctl.appendChild(mrow);
  ctl.appendChild(T.field('Platform', platI));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fth-btns"></div>');
  btns.appendChild(T.btn('🖼️ Pilih gambar', () => fi.click()));
  btns.appendChild(T.btn('✕ Hapus gambar', () => { imgUrl = null; draw(); }));
  btns.appendChild(T.btn('🖼️ Pilih avatar', () => fiAv.click()));
  btns.appendChild(T.btn('🎲 Contoh', () => {
    userI.value = 'adip.rmx'; verI.value = 'ya'; timeI.value = '2 jam';
    textI.value = 'Beat baru udah rilis! Dengerin di SoundCloud ya 🎧\n\nLink di bio #remix #adip';
    text2I.value = 'Yang nanya presetnya: gue pake FL Studio Mobile, semua dari nol 🔥';
    repI.value = '128'; likeI.value = '2,1 rb'; likedI.value = 'ya'; repostedI.value = 'tidak';
    themeI.value = 'gelap'; imgUrl = null; avUrl = null; draw(); T.scrollToPreview(card);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(card, 'fake-threads-post.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fth-prevbox"></div>');
  const card = T.el('<div class="fth-phone"></div>');
  prevBox.appendChild(card);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fth-note"></p>');
  note.textContent = LOCAL_NOTE + ' Hanya untuk prank, bukan postingan asli.';
  wrap.appendChild(note);

  function postHtml(opts) {
    const avInner = avUrl ? '<img src="' + T.esc(avUrl) + '" alt="">' : T.esc(opts.initial);
    const avBg = avUrl ? '' : ' style="background:' + opts.avColor + '"';
    const badge = opts.ver ? '<span class="fth-ver">' + VER_BADGE + '</span>' : '';
    const heart = opts.liked ? ICO_HEART_FILL : ICO_HEART;
    const repostColor = opts.reposted ? ' style="color:#22C55E"' : '';
    const imgHtml = opts.img
      ? '<div class="fth-img"><img src="' + T.esc(opts.img) + '" alt="gambar postingan"></div>'
      : '';
    const countsHtml = opts.counts
      ? '<div class="fth-counts">' + T.esc(opts.rep) + ' balasan · ' + T.esc(opts.like) + ' suka</div>'
      : '';
    return '<div class="fth-post">' +
      '<div class="fth-col"><div class="fth-ava"' + avBg + '>' + avInner + '</div>' +
      (opts.connector ? '<div class="fth-line"></div>' : '') + '</div>' +
      '<div class="fth-main">' +
        '<div class="fth-top"><span class="fth-name">' + T.esc(opts.user) + '</span>' + badge +
        '<span class="fth-time">' + T.esc(opts.time) + '</span>' +
        '<span class="fth-more">' + ICO_MORE + '</span></div>' +
        '<div class="fth-text">' + richText(opts.text) + '</div>' +
        imgHtml +
        '<div class="fth-eng"><span>' + heart + '</span><span>' + ICO_REPLY + '</span><span' + repostColor + '>' + ICO_REPOST + '</span><span>' + ICO_SHARE + '</span></div>' +
        countsHtml +
      '</div></div>';
  }

  function draw() {
    const th = THEMES[themeI.value] || THEMES.gelap;
    const isIPh = platI.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const user = userI.value.trim() || 'username';
    const initial = T.esc(user.charAt(0).toUpperCase() || '?');
    const has2 = text2I.value.trim() !== '';
    const pavaInner = avUrl ? '<img src="' + T.esc(avUrl) + '" alt="">' : initial;
    const pavaBg = avUrl ? '' : ' style="background:' + avaColor(user) + '"';
    card.setAttribute('style',
      '--fth-bg:' + th.bg + ';--fth-fg:' + th.fg + ';--fth-muted:' + th.muted + ';--fth-icon:' + th.icon +
      ';--fth-bdr:' + th.bdr + ';--fth-line:' + th.line + ';--fth-tab:' + th.tab);
    card.innerHTML =
      '<div class="fth-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, themeI.value !== 'terang') + '</div>' +
      '<div class="fth-topbar">' + THREADS_GLYPH + '</div>' +
      '<div class="fth-tabs"><span class="fth-tab fr-on">Untuk Anda</span><span class="fth-tab">Mengikuti</span></div>' +
      postHtml({ user, initial, avColor: avaColor(user), ver: verI.value === 'ya', time: timeI.value.trim() || 'baru saja',
        text: textI.value.trim() || 'Isi postingan', img: imgUrl, connector: has2, counts: true,
        rep: repI.value.trim() || '0', like: likeI.value.trim() || '0',
        liked: likedI.value === 'ya', reposted: repostedI.value === 'ya' }) +
      (has2 ? postHtml({ user, initial, avColor: avaColor(user), ver: verI.value === 'ya', time: timeI.value.trim() || 'baru saja',
        text: text2I.value.trim(), img: null, connector: false, counts: false,
        rep: '', like: '', liked: false, reposted: false }) : '') +
      '<div class="fth-div"></div>' +
      '<div class="fth-tabbar">' +
        '<span>' + ICO_HOME + '</span><span>' + ICO_SEARCH + '</span><span>' + ICO_COMPOSE + '</span><span>' + ICO_ACTIVITY + '</span>' +
        '<span class="fth-pava"' + pavaBg + '>' + pavaInner + '</span>' +
      '</div>' +
      (isIPh ? '<div class="fth-homebar"><span></span></div>' : '<div class="fth-navpill"><span></span></div>');
  }

  [userI, verI, timeI, textI, text2I, repI, likeI, likedI, repostedI, themeI, platI, selBrand].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
