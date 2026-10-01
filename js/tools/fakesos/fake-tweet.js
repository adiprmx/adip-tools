import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {
  id: 'fake-tweet',
  name: 'Fake Tweet X',
  cat: 'fakesos',
  icon: '✖️',
  desc: 'Bikin screenshot tweet X palsu + unduh PNG.',
  keywords: 'twitter,x,tweet,fake,palsu,screenshot,prank',
};

const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#0F1419', muted: '#536471', imgb: '#EFF3F4' },
  redup: { bg: '#15202B', fg: '#FFFFFF', muted: '#8899A6', imgb: '#38444D' },
  gelap: { bg: '#000000', fg: '#E7E9EA', muted: '#71767B', imgb: '#2F3336' },
};

const VER = { blue: '#1D9BF0', gold: '#CBA135', gray: '#829AAB' };
const VER_LABEL = { blue: 'Verified biru', gold: 'Verified emas', gray: 'Verified abu-abu' };

const CHECK = '<svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true"><path fill="#fff" d="M9.55 15.9 6 12.35l1.4-1.4 2.15 2.15 5.1-5.1 1.4 1.4z"/></svg>';

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

// Escape dulu, lalu warnai hashtag & mention ala X, lalu jaga baris baru.
function richText(src) {
  const e = T.esc(src);
  const linked = e.replace(/(^|[\s>])((?:#|@)[A-Za-z0-9_]+)/g, '$1<span class="ft-link">$2</span>');
  return linked.split('\n').join('<br>');
}

export function render(root) {
  const wrap = T.el('<div class="ft-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.ft-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}' +
    '.ft-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.ft-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.ft-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.ft-card{width:100%;max-width:480px;padding:16px;background:var(--ft-bg);color:var(--ft-fg);text-align:left}' +
    '.ft-tweet{display:flex;gap:12px}' +
    '.ft-ava{width:46px;height:46px;border-radius:50%;flex:0 0 46px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;line-height:1}' +
    '.ft-main{flex:1;min-width:0}' +
    '.ft-namerow{display:flex;align-items:center;gap:4px;font-size:15px;line-height:1.3;flex-wrap:wrap}' +
    '.ft-name{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}' +
    '.ft-badge{width:16px;height:16px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:0 0 16px}' +
    '.ft-handle{color:var(--ft-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.ft-text{font-size:16px;line-height:1.45;margin:4px 0 12px;overflow-wrap:break-word;white-space:normal}' +
    '.ft-link{color:#1D9BF0}' +
    '.ft-img{margin:0 0 4px}' +
    '.ft-img img{width:100%;height:auto;display:block;border-radius:16px;border:1px solid var(--ft-imgb)}' +
    '.ft-metrics{display:flex;gap:28px;margin-top:12px;flex-wrap:wrap}' +
    '.ft-m{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ft-muted)}' +
    '.ft-ic{font-size:15px;line-height:1}' +
    '.ft-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
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
  mrow.appendChild(T.field('Balasan 💬', repI));
  mrow.appendChild(T.field('Repost 🔁', rtI));
  mrow.appendChild(T.field('Suka ❤️', likeI));
  mrow.appendChild(T.field('Tayangan 📊', viewI));
  ctl.appendChild(mrow);
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="ft-btns"></div>');
  btns.appendChild(T.btn('🖼️ Pilih gambar', () => fi.click()));
  btns.appendChild(T.btn('✕ Hapus gambar', () => { imgUrl = null; draw(); }));
  btns.appendChild(T.btn('Contoh', () => {
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
      '<div class="ft-tweet">' +
        '<div class="ft-ava" style="background:' + avaColor(name) + '">' + initial + '</div>' +
        '<div class="ft-main">' +
          '<div class="ft-namerow"><span class="ft-name">' + T.esc(name) + '</span>' + badge +
          '<span class="ft-handle">@' + T.esc(handle) + ' · ' + T.esc(timeI.value.trim() || 'baru saja') + '</span></div>' +
          '<div class="ft-text">' + richText(textI.value) + '</div>' +
          imgHtml +
          '<div class="ft-metrics">' +
            '<span class="ft-m"><span class="ft-ic">💬</span><span>' + T.esc(repI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-m"><span class="ft-ic">🔁</span><span>' + T.esc(rtI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-m"><span class="ft-ic">❤️</span><span>' + T.esc(likeI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-m"><span class="ft-ic">📊</span><span>' + T.esc(viewI.value.trim() || '0') + '</span></span>' +
            '<span class="ft-m"><span class="ft-ic">🔖</span></span>' +
            '<span class="ft-m"><span class="ft-ic">⤴️</span></span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  [nameI, handleI, verI, timeI, textI, repI, rtI, likeI, viewI, themeI].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
