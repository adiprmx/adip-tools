import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.12.0';

export const meta = {
  id: 'fake-reddit-post',
  name: 'Fake Postingan Reddit',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm5.04 10.38l-.8 2.35a3.4 3.4 0 0 1-3.03 2.27h-.1a4.6 4.6 0 0 1-2.11.5 4.6 4.6 0 0 1-2.11-.5h-.1a3.4 3.4 0 0 1-3.03-2.27l-.8-2.35a1.5 1.5 0 0 1 2.83-.96l.4 1.18a2.6 2.6 0 0 0 1.1-.62 1.2 1.2 0 1 1 1.7 1.66 1.1 1.1 0 0 1-.78.32 1.1 1.1 0 0 1-.78-.32 2.5 2.5 0 0 0-1.4.74 1.9 1.9 0 0 0 1.4.62h.1a3.1 3.1 0 0 0 1.4-.34 1.2 1.2 0 1 1 1.7-1.66 1.1 1.1 0 0 1-.78-.32 2.5 2.5 0 0 0-.62-1.1l.4-1.18a1.5 1.5 0 0 1 2.83.96zM8.5 9.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm7 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/></svg>',
  desc: 'Bikin screenshot postingan Reddit palsu + unduh PNG.',
  keywords: 'reddit,postingan,subreddit,upvote,fake,palsu,screenshot,prank',
  since: '6.12.0',
};

/* Palet Reddit aplikasi (riset 15 Nov 2026): oranye #FF4500, upvote aktif
   #FF8717/#FF4500, downvote #7193FF, gelap bg #1A1A1B, teks #D7DAD2. */
const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#1A1A1B', muted: '#7C7C7C', pill: '#F6F7F8', pillB: '#EDEFF1', bdr: '#EDEFF1', chip: '#F6F7F8', bar: '#FFFFFF', join: '#24A0ED' },
  gelap: { bg: '#1A1A1B', fg: '#D7DAD2', muted: '#818384', pill: '#272729', pillB: '#343536', bdr: '#343536', chip: '#272729', bar: '#1A1A1B', join: '#24A0ED' },
};

const UP = '#FF4500', DOWN = '#7193FF';

/* Snoo sederhana (kepala + antena) untuk avatar komunitas default. */
function snooSvg(bg) {
  return '<svg width="100%" height="100%" viewBox="0 0 40 40" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="20" fill="' + bg + '"/>' +
    '<circle cx="20" cy="12" r="2.4" fill="#fff"/><path d="M20 14.4V19" stroke="#fff" stroke-width="2"/>' +
    '<ellipse cx="20" cy="24" rx="11" ry="9" fill="#fff"/>' +
    '<circle cx="15.5" cy="23" r="1.8" fill="#FF4500"/><circle cx="24.5" cy="23" r="1.8" fill="#FF4500"/>' +
    '<path d="M15 28.5c1.8 1.8 8.2 1.8 10 0" stroke="#FF4500" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '</svg>';
}

const ICO_UP = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
const ICO_DOWN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
const ICO_CMT = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
const ICO_SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>';
const ICO_BM = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
const ICO_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
const ICO_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const ICO_HOME = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>';
const ICO_COMM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
const ICO_PLUS = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>';
const ICO_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
const ICO_BELL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
const ICO_SEARCH = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const ICO_AWARD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z"/></svg>';

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

export function render(root) {
  const wrap = T.el('<div class="fr-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fr-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.fr-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fr-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fr-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fr-phone{width:100%;max-width:420px;background:var(--fr-bg);color:var(--fr-fg);text-align:left;overflow:hidden}' +
    '.fr-sb{position:relative;display:flex;justify-content:space-between;align-items:center;padding:14px 20px 10px;color:var(--fr-fg)}' +
    '.fr-topbar{display:flex;align-items:center;gap:10px;padding:2px 12px 10px;border-bottom:1px solid var(--fr-bdr)}' +
    '.fr-topbar .fr-bk{color:var(--fr-fg);display:flex;flex:none}' +
    '.fr-search{flex:1;display:flex;align-items:center;gap:8px;background:var(--fr-pill);border-radius:999px;padding:8px 14px;color:var(--fr-muted);font-size:14px}' +
    '.fr-post{padding:12px 14px 6px}' +
    '.fr-subrow{display:flex;align-items:center;gap:8px}' +
    '.fr-subav{width:28px;height:28px;border-radius:50%;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700}' +
    '.fr-subav img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.fr-sub{font-size:13px;font-weight:600}' +
    '.fr-time{font-size:12px;color:var(--fr-muted)}' +
    '.fr-join{margin-left:auto;flex:none;background:var(--fr-join);color:#fff;border:0;border-radius:999px;padding:6px 14px;font-size:13px;font-weight:700;cursor:default}' +
    '.fr-user{font-size:12px;color:var(--fr-muted);margin:4px 0 0 36px}' +
    '.fr-title{font-size:17px;line-height:1.35;font-weight:600;margin:8px 0 0;overflow-wrap:break-word}' +
    '.fr-flair{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;border-radius:4px;margin:8px 0 0;background:var(--fr-chip);color:var(--fr-fg)}' +
    '.fr-flair.fr-nsfw{background:#FF4500;color:#fff}' +
    '.fr-body{font-size:14px;line-height:1.5;margin:8px 0 0;overflow-wrap:break-word;white-space:pre-wrap}' +
    '.fr-img{margin:10px 0 0}' +
    '.fr-img img{width:100%;height:auto;display:block;border-radius:12px;border:1px solid var(--fr-bdr)}' +
    '.fr-awards{display:flex;align-items:center;gap:4px;margin:10px 0 0;color:#FFD700;font-size:12px}' +
    '.fr-awards span{color:var(--fr-muted)}' +
    '.fr-actions{display:flex;align-items:center;gap:6px;margin:12px 0 4px;flex-wrap:nowrap}' +
    '.fr-pill{display:inline-flex;align-items:center;gap:6px;background:var(--fr-pill);border:1px solid var(--fr-pillb);border-radius:999px;padding:7px 10px;font-size:13px;font-weight:700;color:var(--fr-fg);min-height:32px;white-space:nowrap}' +
    '.fr-pill svg{display:block}' +
    '.fr-votepill{padding:6px 10px}' +
    '.fr-votepill .fr-sep{width:1px;height:16px;background:var(--fr-pillb)}' +
    '.fr-icobtn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;color:var(--fr-muted);flex:none}' +
    '.fr-icobtn svg{display:block}' +
    '.fr-cbar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--fr-bdr)}' +
    '.fr-cava{width:30px;height:30px;border-radius:50%;background:var(--fr-pill);display:flex;align-items:center;justify-content:center;color:var(--fr-muted);flex:none;font-size:14px;font-weight:700}' +
    '.fr-cfield{flex:1;background:var(--fr-pill);border-radius:999px;padding:9px 14px;font-size:14px;color:var(--fr-muted)}' +
    '.fr-tabbar{display:flex;align-items:center;justify-content:space-around;padding:8px 0 6px;border-top:1px solid var(--fr-bdr);color:var(--fr-muted)}' +
    '.fr-tab{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;font-weight:600}' +
    '.fr-tab.fr-on{color:var(--fr-fg)}' +
    '.fr-homebar{display:flex;justify-content:center;padding:6px 0 8px}' +
    '.fr-homebar span{width:134px;height:5px;border-radius:3px;background:var(--fr-fg);opacity:.85}' +
    '.fr-navpill{display:flex;justify-content:center;padding:8px 0}' +
    '.fr-navpill span{width:108px;height:4px;border-radius:2px;background:var(--fr-fg);opacity:.85}' +
    '.fr-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const subI = T.input('text', 'Nama komunitas tanpa r/', 'indonesia');
  const userI = T.input('text', 'Username tanpa u/', 'adip_rmx');
  const timeI = T.input('text', 'cth: 2 jam lalu', '2 jam lalu');
  const titleI = T.ta(2, 'Judul postingan…', 'Akhirnya beat remix pertama gue tembus 100rb play di SoundCloud!');
  const flairI = T.input('text', 'Flair (kosongkan = tanpa flair)', 'Pencapaian');
  const nsfwI = T.select([['tidak', 'Tidak'], ['ya', 'Ya, tandai NSFW']], 'tidak');
  const bodyI = T.ta(3, 'Isi postingan (opsional)…', 'Setelah 3 bulan ngulik tiap malam, akhirnya ada yang dengerin juga. Makasih buat yang udah support 🙏');
  const upI = T.input('text', 'cth: 2,4 rb', '2,4 rb');
  const cmtI = T.input('text', 'cth: 312', '312');
  const awardI = T.input('text', 'cth: 3 (kosong = tanpa award)', '3');
  const voteI = T.select([['none', 'Belum vote'], ['up', 'Sudah upvote'], ['down', 'Sudah downvote']], 'up');
  const themeI = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'gelap');
  const platI = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  let imgUrl = null;
  fi.onchange = () => { const f = fi.files && fi.files[0]; if (f) { imgUrl = URL.createObjectURL(f); draw(); } fi.value = ''; };
  const fiAv = fileInput('image/*');
  let avUrl = null;
  fiAv.onchange = () => { const f = fiAv.files && fiAv.files[0]; if (f) { avUrl = URL.createObjectURL(f); draw(); } fiAv.value = ''; };

  const ctl = T.el('<div class="fr-ctl"></div>');
  ctl.appendChild(T.field('Komunitas (tanpa r/)', subI));
  ctl.appendChild(T.field('Username (tanpa u/)', userI));
  ctl.appendChild(T.field('Waktu', timeI));
  ctl.appendChild(T.field('Judul', titleI));
  ctl.appendChild(T.field('Isi postingan (opsional)', bodyI));
  const mrow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  mrow.appendChild(T.field('Flair', flairI));
  mrow.appendChild(T.field('Tag NSFW', nsfwI));
  mrow.appendChild(T.field('Jumlah upvote', upI));
  mrow.appendChild(T.field('Jumlah komentar', cmtI));
  mrow.appendChild(T.field('Jumlah award', awardI));
  mrow.appendChild(T.field('Status vote kamu', voteI));
  ctl.appendChild(mrow);
  ctl.appendChild(T.field('Platform', platI));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fr-btns"></div>');
  btns.appendChild(T.btn('🖼️ Pilih gambar postingan', () => fi.click()));
  btns.appendChild(T.btn('✕ Hapus gambar', () => { imgUrl = null; draw(); }));
  btns.appendChild(T.btn('🖼️ Pilih avatar komunitas', () => fiAv.click()));
  btns.appendChild(T.btn('🎲 Contoh', () => {
    subI.value = 'indonesia'; userI.value = 'adip_rmx'; timeI.value = '2 jam lalu';
    titleI.value = 'Akhirnya beat remix pertama gue tembus 100rb play di SoundCloud!';
    flairI.value = 'Pencapaian'; nsfwI.value = 'tidak';
    bodyI.value = 'Setelah 3 bulan ngulik tiap malam, akhirnya ada yang dengerin juga. Makasih buat yang udah support 🙏';
    upI.value = '2,4 rb'; cmtI.value = '312'; awardI.value = '3'; voteI.value = 'up'; themeI.value = 'gelap';
    imgUrl = null; avUrl = null; draw(); T.scrollToPreview(card);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(card, 'fake-reddit-post.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fr-prevbox"></div>');
  const card = T.el('<div class="fr-phone"></div>');
  prevBox.appendChild(card);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fr-note"></p>');
  note.textContent = LOCAL_NOTE + ' Hanya untuk prank, bukan postingan asli.';
  wrap.appendChild(note);

  function draw() {
    const th = THEMES[themeI.value] || THEMES.gelap;
    const isIPh = platI.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const sub = subI.value.trim() || 'subreddit';
    const user = (userI.value.trim() || 'user').replace(/^u\//, '');
    const vote = voteI.value;
    const upColor = vote === 'up' ? UP : 'var(--fr-muted)';
    const downColor = vote === 'down' ? DOWN : 'var(--fr-muted)';
    const countColor = vote === 'up' ? UP : vote === 'down' ? DOWN : 'var(--fr-fg)';
    const flair = flairI.value.trim();
    const awards = parseInt((awardI.value || '').replace(/\D/g, ''), 10) || 0;
    const avHtml = avUrl
      ? '<img src="' + T.esc(avUrl) + '" alt="">'
      : snooSvg(avaColor(sub));
    const imgHtml = imgUrl
      ? '<div class="fr-img"><img src="' + T.esc(imgUrl) + '" alt="gambar postingan"></div>'
      : '';
    const flairHtml = (nsfwI.value === 'ya' ? '<span class="fr-flair fr-nsfw">NSFW</span>' : '') +
      (flair ? '<span class="fr-flair">' + T.esc(flair) + '</span>' : '');
    const awardHtml = awards > 0
      ? '<div class="fr-awards">' + ICO_AWARD + '<span>' + awards + ' Award</span></div>'
      : '';
    const body = bodyI.value.trim();
    card.setAttribute('style',
      '--fr-bg:' + th.bg + ';--fr-fg:' + th.fg + ';--fr-muted:' + th.muted + ';--fr-pill:' + th.pill +
      ';--fr-pillb:' + th.pillB + ';--fr-bdr:' + th.bdr + ';--fr-chip:' + th.chip + ';--fr-join:' + th.join);
    card.innerHTML =
      '<div class="fr-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, themeI.value !== 'terang') + '</div>' +
      '<div class="fr-topbar"><span class="fr-bk">' + ICO_BACK + '</span>' +
        '<div class="fr-search">' + ICO_SEARCH + '<span>Cari di Reddit</span></div></div>' +
      '<div class="fr-post">' +
        '<div class="fr-subrow"><div class="fr-subav">' + avHtml + '</div>' +
          '<span class="fr-sub">r/' + T.esc(sub) + '</span>' +
          '<span class="fr-time">· ' + T.esc(timeI.value.trim() || 'baru saja') + '</span>' +
          '<button class="fr-join" type="button" tabindex="-1">Gabung</button></div>' +
        '<div class="fr-user">u/' + T.esc(user) + '</div>' +
        '<h2 class="fr-title">' + T.esc(titleI.value.trim() || 'Judul postingan') + '</h2>' +
        flairHtml +
        (body ? '<p class="fr-body">' + T.esc(body) + '</p>' : '') +
        imgHtml + awardHtml +
        '<div class="fr-actions">' +
          '<span class="fr-pill fr-votepill"><span style="color:' + upColor + ';display:flex">' + ICO_UP + '</span>' +
          '<span style="color:' + countColor + '">' + T.esc(upI.value.trim() || '0') + '</span>' +
          '<span class="fr-sep"></span>' +
          '<span style="color:' + downColor + ';display:flex">' + ICO_DOWN + '</span></span>' +
          '<span class="fr-pill">' + ICO_CMT + '<span>' + T.esc(cmtI.value.trim() || '0') + '</span></span>' +
          '<span class="fr-pill">' + ICO_SHARE + '<span>Bagikan</span></span>' +
          '<span class="fr-icobtn">' + ICO_BM + '</span>' +
          '<span class="fr-icobtn">' + ICO_MORE + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="fr-cbar"><div class="fr-cava">A</div><div class="fr-cfield">Tambahkan komentar</div></div>' +
      '<div class="fr-tabbar">' +
        '<span class="fr-tab fr-on">' + ICO_HOME + '<span>Beranda</span></span>' +
        '<span class="fr-tab">' + ICO_COMM + '<span>Komunitas</span></span>' +
        '<span class="fr-tab">' + ICO_PLUS + '<span>Buat</span></span>' +
        '<span class="fr-tab">' + ICO_CHAT + '<span>Obrolan</span></span>' +
        '<span class="fr-tab">' + ICO_BELL + '<span>Kotak Masuk</span></span>' +
      '</div>' +
      (isIPh ? '<div class="fr-homebar"><span></span></div>' : '<div class="fr-navpill"><span></span></div>');
  }

  [subI, userI, timeI, titleI, flairI, nsfwI, bodyI, upI, cmtI, awardI, voteI, themeI, platI, selBrand].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
