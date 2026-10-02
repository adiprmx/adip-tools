import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.3';

export const meta = {"id":"fake-story-ig","name":"Fake Story IG","cat":"fakesos","icon":"📱","desc":"Bikin screenshot Story Instagram palsu + unduh PNG.","keywords":"instagram,story,fake,palsu,screenshot,prank"};

const P = 'fsg4';

const GRADS = {
  sunset: 'linear-gradient(135deg,#feda75 0%,#fa7e1e 35%,#d62976 65%,#962fbf 100%)',
  ocean: 'linear-gradient(135deg,#38bdf8 0%,#0369a1 55%,#0f172a 100%)',
  ungu: 'linear-gradient(135deg,#c084fc 0%,#7c3aed 55%,#1e1b4b 100%)',
  hitam: 'linear-gradient(135deg,#1c1c1e 0%,#000000 100%)'
};

/* Ikon line-art gaya Instagram (24x24, stroke round) — ganti glyph emoji ♡✈✕🔗 */
const SW = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const SVG_DOTS = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>';
const SVG_X = '<svg width="22" height="22" viewBox="0 0 24 24" ' + SW + ' aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const SVG_HEART = '<svg width="26" height="26" viewBox="0 0 24 24" ' + SW + ' aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const SVG_PLANE = '<svg width="26" height="26" viewBox="0 0 24 24" ' + SW + ' aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
const SVG_LINK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

export function render(root) {
  const S = {
    username: 'adip.rmx', time: '2h', text: 'Contoh teks story',
    size: 24, color: '#ffffff', bg: 'sunset', photo: null, link: false
  };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0}' +
    '.' + P + '-frame{width:100%;max-width:430px;aspect-ratio:9/16;height:auto;border-radius:18px;overflow:hidden;position:relative;background:#000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.45)}' +
    '.' + P + '-bg{position:absolute;inset:0}' +
    '.' + P + '-bg img{width:100%;height:100%;object-fit:cover;display:block}' +
    /* scrim atas & bawah untuk keterbacaan chrome */
    '.' + P + '-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.38) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 68%,rgba(0,0,0,.42) 100%)}' +
    /* status bar (via T.sysbar) */
    '.' + P + '-sb{position:absolute;top:0;left:0;right:0;z-index:8;color:#fff}' +
    '.' + P + '-sbrow{display:flex;align-items:center;justify-content:space-between;padding:10px 18px 0}' +
    /* progress bar segmen */
    '.' + P + '-prog{position:absolute;left:10px;right:10px;display:flex;gap:4px;z-index:7}' +
    '.' + P + '-seg{flex:1;height:3px;border-radius:1.5px;background:rgba(255,255,255,.3);overflow:hidden}' +
    '.' + P + '-seg i{display:block;height:100%;background:#fff;border-radius:1.5px}' +
    '.' + P + '-frame.plat-iphone .' + P + '-prog{top:46px}' +
    '.' + P + '-frame.plat-android .' + P + '-prog{top:34px}' +
    /* header story: avatar + username + waktu ... kanan: (...) (X) */
    '.' + P + '-head{position:absolute;left:0;right:0;display:flex;align-items:center;gap:10px;padding:0 12px;z-index:7}' +
    '.' + P + '-frame.plat-iphone .' + P + '-head{top:60px}' +
    '.' + P + '-frame.plat-android .' + P + '-head{top:48px}' +
    '.' + P + '-av{width:32px;height:32px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;background:linear-gradient(135deg,#feda75,#d62976,#962fbf)}' +
    '.' + P + '-who{flex:1;min-width:0;font-size:14px;line-height:1.25;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px rgba(0,0,0,.55)}' +
    '.' + P + '-who b{font-weight:600}' +
    '.' + P + '-who span{color:rgba(255,255,255,.72);font-weight:400}' +
    '.' + P + '-hbtn{display:flex;align-items:center;justify-content:center;color:#fff;background:none;border:0;padding:4px;cursor:default;text-shadow:0 1px 3px rgba(0,0,0,.55)}' +
    '.' + P + '-hbtn svg{display:block}' +
    '.' + P + '-x{margin-left:4px}' +
    /* konten teks overlay */
    '.' + P + '-txt{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:26px;text-align:center;pointer-events:none;z-index:5}' +
    '.' + P + '-txt span{font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.9);line-height:1.35;word-break:break-word}' +
    /* footer: pill "Send message" + hati + paper plane */
    '.' + P + '-foot{position:absolute;left:12px;right:12px;bottom:16px;display:flex;align-items:center;gap:14px;z-index:7}' +
    '.' + P + '-pill{flex:1;height:44px;border:1px solid rgba(255,255,255,.5);border-radius:22px;background:rgba(0,0,0,.12);color:#fff;font-size:14px;display:flex;align-items:center;padding:0 16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-fic{color:#fff;flex:none;display:flex;text-shadow:0 1px 3px rgba(0,0,0,.5)}' +
    '.' + P + '-fic svg{display:block}' +
    /* stiker link ala IG */
    '.' + P + '-link{position:absolute;left:0;right:0;bottom:78px;display:flex;justify-content:center;z-index:7}' +
    '.' + P + '-link b{display:flex;align-items:center;gap:7px;background:#fff;color:#111;font-size:14px;font-weight:700;border-radius:999px;padding:9px 18px;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
    '.' + P + '-link svg{display:block;flex:none}' +
    /* home indicator / nav pill */
    '.' + P + '-home{position:absolute;left:50%;transform:translateX(-50%);bottom:6px;width:102px;height:4px;border-radius:2px;background:#fff;z-index:8;box-shadow:0 1px 3px rgba(0,0,0,.45)}' +
    '.' + P + '-navpill{position:absolute;left:50%;transform:translateX(-50%);bottom:6px;width:100px;height:4px;border-radius:2px;background:rgba(255,255,255,.85);z-index:8}' +
    '.' + P + '-note{font-size:12px;opacity:.65;margin-top:14px}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  const initial = (u) => (u || '?').trim().charAt(0).toUpperCase();

  function draw() {
    const plat = selPlatform.value;
    const isIph = plat === 'iphone';
    brandField.style.display = plat === 'android' ? '' : 'none';
    const sbHtml =
      '<div class="' + P + '-sb">' +
        '<div class="' + P + '-sbrow">' + T.sysbar(isIph ? 'iphone' : 'android', selBrand.value, true) + '</div>' +
      '</div>';
    const bgHtml = S.photo
      ? '<div class="' + P + '-bg"><img src="' + S.photo + '" alt=""></div>'
      : '<div class="' + P + '-bg" style="background:' + GRADS[S.bg] + '"></div>';
    frame = T.el(
      '<div class="' + P + '-frame plat-' + (isIph ? 'iphone' : 'android') + '">' +
        bgHtml +
        '<div class="' + P + '-shade"></div>' +
        sbHtml +
        '<div class="' + P + '-prog">' +
          '<div class="' + P + '-seg"><i style="width:100%"></i></div>' +
          '<div class="' + P + '-seg"><i style="width:60%"></i></div>' +
          '<div class="' + P + '-seg"></div>' +
        '</div>' +
        '<div class="' + P + '-head">' +
          '<div class="' + P + '-av">' + T.esc(initial(S.username)) + '</div>' +
          '<div class="' + P + '-who"><b>' + T.esc(S.username) + '</b> <span>' + T.esc(S.time) + '</span></div>' +
          '<span class="' + P + '-hbtn">' + SVG_DOTS + '</span>' +
          '<span class="' + P + '-hbtn ' + P + '-x">' + SVG_X + '</span>' +
        '</div>' +
        '<div class="' + P + '-txt"><span style="font-size:' + S.size + 'px;color:' + T.esc(S.color) + '">' + T.esc(S.text) + '</span></div>' +
        (S.link ? '<div class="' + P + '-link"><b>' + SVG_LINK + '<span>Lihat selengkapnya</span></b></div>' : '') +
        '<div class="' + P + '-foot">' +
          '<div class="' + P + '-pill">Send message</div>' +
          '<span class="' + P + '-fic">' + SVG_HEART + '</span>' +
          '<span class="' + P + '-fic">' + SVG_PLANE + '</span>' +
        '</div>' +
        (isIph ? '<div class="' + P + '-home"></div>' : '<div class="' + P + '-navpill"></div>') +
      '</div>'
    );
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const inUser = T.input('text', 'username', S.username);
  inUser.addEventListener('input', () => { S.username = inUser.value.trim() || 'username'; draw(); });
  const inTime = T.input('text', 'mis. 2h', S.time);
  inTime.addEventListener('input', () => { S.time = inTime.value.trim() || '2h'; draw(); });
  const inText = T.input('text', 'Teks overlay', S.text);
  inText.addEventListener('input', () => { S.text = inText.value; draw(); });

  const inSize = T.input('range', '', String(S.size));
  inSize.min = '12'; inSize.max = '44'; inSize.value = String(S.size);
  const fldSize = T.field('Ukuran teks (' + S.size + 'px)', inSize);
  const labSize = fldSize.querySelector('label');
  inSize.addEventListener('input', () => {
    S.size = Number(inSize.value);
    labSize.textContent = 'Ukuran teks (' + S.size + 'px)';
    draw();
  });

  const inColor = T.input('color', '', S.color);
  inColor.value = S.color;
  inColor.addEventListener('input', () => { S.color = inColor.value; draw(); });

  const selBg = T.select([['sunset', 'Sunset'], ['ocean', 'Ocean'], ['ungu', 'Ungu'], ['hitam', 'Hitam']], S.bg);
  selBg.addEventListener('change', () => { S.bg = selBg.value; S.photo = null; draw(); });

  const chkLink = T.input('checkbox');
  chkLink.checked = S.link;
  chkLink.addEventListener('change', () => { S.link = chkLink.checked; draw(); });

  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  selPlatform.addEventListener('change', draw);
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  selBrand.addEventListener('change', draw);
  const brandField = T.field('Merk HP', selBrand);

  const fi = fileInput('image/*');
  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    S.photo = URL.createObjectURL(f);
    draw();
  };
  const btnUp = T.btn('Upload foto', () => fi.click());
  const btnGrad = T.btn('Pakai gradient', () => { S.photo = null; draw(); });

  const btnEx = T.btn('🎲 Contoh', () => {
    S.username = 'adip.rmx'; S.time = '2h'; S.text = 'Baru rilis beat baru! 🔥';
    S.size = 26; S.color = '#ffffff'; S.bg = 'sunset'; S.photo = null; S.link = true;
    inUser.value = S.username; inTime.value = S.time; inText.value = S.text;
    inSize.value = String(S.size); labSize.textContent = 'Ukuran teks (' + S.size + 'px)';
    inColor.value = S.color; selBg.value = S.bg; chkLink.checked = S.link;
    draw();
    T.scrollToPreview(frame);
  });
  const btnDl = T.btn('⬇️ Unduh PNG', () => dlNodePng(frame, 'fake-story-ig.png'), true);

  wrap.append(
    T.field('Username', inUser),
    T.field('Waktu (mis. 2h)', inTime),
    T.field('Teks overlay', inText),
    fldSize,
    T.field('Warna teks', inColor),
    T.field('Background gradient', selBg),
    T.field('Foto background', T.row(btnUp, btnGrad)),
    T.field('Stiker link', chkLink),
    T.field('Platform', selPlatform),
    brandField,
    T.row(btnEx, btnDl),
    stage,
    T.el('<p class="' + P + '-note">' + T.esc(LOCAL_NOTE) + '</p>')
  );
  root.appendChild(wrap);
  draw();
}
