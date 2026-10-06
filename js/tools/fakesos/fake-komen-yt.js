import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.5';

export const meta = {
  id: 'fake-komen-yt',
  name: 'Fake Komen YouTube',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
  desc: 'Bikin screenshot komentar YouTube palsu + unduh PNG.',
  keywords: 'youtube,komen,komentar,fake,palsu,screenshot,prank',
};

const THEMES = {
  gelap: { bg: '#0f0f0f', fg: '#f1f1f1', muted: '#aaa', chip: '#272727', bdr: '#ffffff14' },
  terang: { bg: '#ffffff', fg: '#0f0f0f', muted: '#606060', chip: '#f2f2f2', bdr: '#00000014' },
};

/* Badge verified YouTube: lingkaran abu + centang. */
const VER_BADGE = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="#aaa" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
const ICO_LIKE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 10v12H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm2-7l6.5 6.5c.8.8.8 2 0 2.8L12 16H20a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 18.6 27H9V10z" transform="translate(0,-3)"/></svg>';
const ICO_DISLIKE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="transform:rotate(180deg)"><path d="M7 10v12H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm2-7l6.5 6.5c.8.8.8 2 0 2.8L12 16H20a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 18.6 27H9V10z" transform="translate(0,-3)"/></svg>';

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

export function render(root) {
  const wrap = T.el('<div class="fy-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fy-wrap{font-family:Roboto,Arial,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.fy-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fy-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fy-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fy-card{width:100%;max-width:480px;background:var(--fy-bg);color:var(--fy-fg);text-align:left}' +
    '.fy-cmt{display:flex;gap:14px;padding:16px}' +
    '.fy-ava{width:40px;height:40px;border-radius:50%;flex:0 0 40px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:17px;overflow:hidden}' +
    '.fy-ava img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.fy-main{flex:1;min-width:0}' +
    '.fy-top{display:flex;align-items:center;gap:6px;font-size:13px;line-height:18px;margin-bottom:2px;flex-wrap:wrap}' +
    '.fy-name{font-weight:500;overflow-wrap:break-word}' +
    '.fy-ver{display:inline-flex;align-items:center}' +
    '.fy-time{color:var(--fy-muted);font-weight:400}' +
    '.fy-text{font-size:14px;line-height:20px;font-weight:400;overflow-wrap:break-word;white-space:pre-wrap;margin:0 0 6px}' +
    '.fy-act{display:flex;align-items:center;gap:6px;color:var(--fy-fg);font-size:12px}' +
    '.fy-a{display:inline-flex;align-items:center;gap:6px;padding:6px}' +
    '.fy-like{font-weight:500}' +
    '.fy-reply{font-weight:500;padding:6px 8px;border-radius:18px}' +
    '.fy-reply:hover{background:var(--fy-chip)}' +
    '.fy-heart{display:flex;align-items:center;gap:6px;margin-top:6px;background:var(--fy-chip);border-radius:16px;padding:4px 10px 4px 4px;width:max-content;max-width:100%}' +
    '.fy-heart .fy-ava{width:20px;height:20px;flex-basis:20px;font-size:10px}' +
    '.fy-heart span:last-child{font-size:12px;color:var(--fy-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.fy-repcount{display:flex;align-items:center;gap:8px;margin:4px 0 0 54px;font-size:14px;font-weight:500;color:#3ea6ff;padding:8px 0}' +
    '.fy-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const nameI = T.input('text', 'Nama channel', 'Adip RMX');
  const verI = T.select([['ya', 'Ada badge ✓'], ['tidak', 'Tanpa badge']], 'ya');
  const timeI = T.input('text', 'cth: 2 jam yang lalu', '2 jam yang lalu');
  const textI = T.ta(4, 'Tulis komentar…', 'Akhirnya nemu channel yang ngebahas ini dengan jelas. Auto subscribe! 🔥');
  const likeI = T.input('text', 'cth: 1,2 rb', '1,2 rb');
  const repI = T.input('text', 'cth: 18', '18');
  const heartI = T.select([['ya', '❤️ Disukai kreator'], ['tidak', 'Tidak']], 'ya');
  const themeI = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');

  const fi = fileInput('image/*');
  let imgUrl = null;
  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    if (f) { imgUrl = URL.createObjectURL(f); draw(); }
    fi.value = '';
  };

  const ctl = T.el('<div class="fy-ctl"></div>');
  ctl.appendChild(T.field('Nama channel', nameI));
  ctl.appendChild(T.field('Badge verified', verI));
  ctl.appendChild(T.field('Waktu', timeI, 'cth: 2 jam yang lalu, 3 hari yang lalu'));
  ctl.appendChild(T.field('Komentar', textI));
  const mrow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  mrow.appendChild(T.field('Jumlah like', likeI));
  mrow.appendChild(T.field('Jumlah balasan', repI));
  ctl.appendChild(mrow);
  ctl.appendChild(T.field('Disukai oleh kreator', heartI));
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fy-btns"></div>');
  const card = T.el('<div class="fy-card"></div>');

  btns.appendChild(T.btn('🖼️ Pilih avatar', () => fi.click()));
  btns.appendChild(T.btn('✕ Hapus avatar', () => { imgUrl = null; draw(); }));
  btns.appendChild(T.btn('🎲 Contoh', () => {
    nameI.value = 'Adip RMX'; verI.value = 'ya'; timeI.value = '2 jam yang lalu';
    textI.value = 'Akhirnya nemu channel yang ngebahas ini dengan jelas. Auto subscribe! 🔥';
    likeI.value = '1,2 rb'; repI.value = '18'; heartI.value = 'ya'; themeI.value = 'gelap';
    draw(); T.scrollToPreview(card);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(card, 'fake-komen-yt.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fy-prevbox"></div>');
  prevBox.appendChild(card);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fy-note"></p>');
  note.textContent = LOCAL_NOTE + ' Hanya untuk prank, bukan komentar asli.';
  wrap.appendChild(note);

  function draw() {
    const th = THEMES[themeI.value] || THEMES.gelap;
    const name = nameI.value.trim() || 'Channel';
    const initial = T.esc(name.charAt(0).toUpperCase() || '?');
    const ava = imgUrl
      ? '<div class="fy-ava"><img src="' + T.esc(imgUrl) + '" alt="avatar"></div>'
      : '<div class="fy-ava" style="background:' + avaColor(name) + '">' + initial + '</div>';
    const badge = verI.value === 'ya' ? '<span class="fy-ver">' + VER_BADGE + '</span>' : '';
    const heart = heartI.value === 'ya'
      ? '<div class="fy-heart"><div class="fy-ava" style="background:#c00;color:#fff">♥</div><span>Disukai oleh kreator</span></div>'
      : '';
    const repN = repI.value.trim();
    const repRow = repN && repN !== '0'
      ? '<div class="fy-repcount"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>' + T.esc(repN) + ' balasan</div>'
      : '';
    card.setAttribute('style', '--fy-bg:' + th.bg + ';--fy-fg:' + th.fg + ';--fy-muted:' + th.muted + ';--fy-chip:' + th.chip);
    card.innerHTML =
      '<div class="fy-cmt">' +
        ava +
        '<div class="fy-main">' +
          '<div class="fy-top"><span class="fy-name">' + T.esc(name) + '</span>' + badge +
          '<span class="fy-time">' + T.esc(timeI.value.trim() || 'baru saja') + '</span></div>' +
          '<p class="fy-text">' + T.esc(textI.value) + '</p>' +
          '<div class="fy-act">' +
            '<span class="fy-a">' + ICO_LIKE + '</span><span class="fy-like">' + T.esc(likeI.value.trim() || '0') + '</span>' +
            '<span class="fy-a">' + ICO_DISLIKE + '</span>' +
            '<span class="fy-reply">Balas</span>' +
          '</div>' +
          heart +
        '</div>' +
      '</div>' +
      repRow;
  }

  [nameI, verI, timeI, textI, likeI, repI, heartI, themeI].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
