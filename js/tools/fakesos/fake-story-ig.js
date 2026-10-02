import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-story-ig","name":"Fake Story IG","cat":"fakesos","icon":"📱","desc":"Bikin screenshot Story Instagram palsu + unduh PNG.","keywords":"instagram,story,fake,palsu,screenshot,prank"};

const P = 'fsg4';

const GRADS = {
  sunset: 'linear-gradient(135deg,#feda75 0%,#fa7e1e 35%,#d62976 65%,#962fbf 100%)',
  ocean: 'linear-gradient(135deg,#38bdf8 0%,#0369a1 55%,#0f172a 100%)',
  ungu: 'linear-gradient(135deg,#c084fc 0%,#7c3aed 55%,#1e1b4b 100%)',
  hitam: 'linear-gradient(135deg,#1c1c1e 0%,#000000 100%)'
};

export function render(root) {
  const S = {
    username: 'adip.rmx', time: '2h', text: 'Contoh teks story',
    size: 24, color: '#ffffff', bg: 'sunset', photo: null, link: false
  };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0}' +
    '.' + P + '-frame{width:300px;height:534px;border-radius:18px;overflow:hidden;position:relative;background:#000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.45)}' +
    '.' + P + '-bg{position:absolute;inset:0}' +
    '.' + P + '-bg img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.38) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 68%,rgba(0,0,0,.42) 100%)}' +
    '.' + P + '-prog{position:absolute;top:0;left:0;right:0;display:flex;gap:5px;padding:12px 12px 0}' +
    '.' + P + '-seg{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.38);overflow:hidden}' +
    '.' + P + '-seg i{display:block;height:100%;background:#fff;border-radius:2px}' +
    '.' + P + '-head{position:absolute;top:22px;left:0;right:0;display:flex;align-items:center;gap:9px;padding:6px 12px}' +
    '.' + P + '-av{width:32px;height:32px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;background:linear-gradient(135deg,#feda75,#d62976,#962fbf)}' +
    '.' + P + '-who{flex:1;min-width:0;font-size:14px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-who b{font-weight:700}' +
    '.' + P + '-who span{color:rgba(255,255,255,.75);font-weight:400}' +
    '.' + P + '-ic{color:#fff;font-size:20px;line-height:1;background:none;border:0;padding:2px;cursor:default}' +
    '.' + P + '-txt{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:26px;text-align:center;pointer-events:none}' +
    '.' + P + '-txt span{font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.85),0 0 2px rgba(0,0,0,.9);line-height:1.35;word-break:break-word}' +
    '.' + P + '-foot{position:absolute;left:0;right:0;bottom:0;padding:12px;display:flex;align-items:center;gap:12px}' +
    '.' + P + '-pill{flex:1;border:1px solid rgba(255,255,255,.92);border-radius:999px;background:rgba(0,0,0,.25);color:#fff;font-size:14px;padding:11px 16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-fic{color:#fff;font-size:26px;line-height:1}' +
    '.' + P + '-link{position:absolute;left:0;right:0;bottom:74px;display:flex;justify-content:center}' +
    '.' + P + '-link b{background:#fff;color:#111;font-size:14px;font-weight:700;border-radius:999px;padding:9px 20px;box-shadow:0 4px 14px rgba(0,0,0,.35)}' +
    '.' + P + '-note{font-size:12px;opacity:.65;margin-top:14px}' +
    '.' + P + '-sb{position:absolute;top:0;left:0;right:0;height:30px;display:flex;align-items:center;justify-content:space-between;padding:8px 18px 0;font-size:12.5px;font-weight:600;color:#fff;z-index:6;background:linear-gradient(180deg,rgba(0,0,0,.5),rgba(0,0,0,0));text-shadow:0 1px 3px rgba(0,0,0,.65)}' +
    '.' + P + '-sb .' + P + '-sic{display:inline-flex;align-items:center;gap:6px}' +
    '.' + P + '-sb svg{width:16px;height:11px;display:block}' +
    '.' + P + '-island{width:92px;height:24px;background:#000;border-radius:13px;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09)}' +
    '.' + P + '-punch{width:10px;height:10px;border-radius:50%;background:rgba(0,0,0,.9);flex:none;box-shadow:inset 0 0 2px #1a3a5c}' +
    '.' + P + '-frame.plat-and .' + P + '-prog{top:28px}' +
    '.' + P + '-frame.plat-and .' + P + '-head{top:50px}' +
    '.' + P + '-frame.plat-iph .' + P + '-prog{top:34px}' +
    '.' + P + '-frame.plat-iph .' + P + '-head{top:56px}' +
    '.' + P + '-home{position:absolute;left:50%;transform:translateX(-50%);bottom:7px;width:110px;height:5px;border-radius:3px;background:#fff;z-index:6;box-shadow:0 1px 3px rgba(0,0,0,.45)}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  const initial = (u) => (u || '?').trim().charAt(0).toUpperCase();

  const SB_SIG = '<svg viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>';
  const SB_WIFI = '<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.2a10 10 0 0 1 13 0"/><path d="M4.2 7a6.2 6.2 0 0 1 7.6 0"/><circle cx="8" cy="9.8" r="1.4" fill="currentColor" stroke="none"/></svg>';
  const SB_BAT = '<svg viewBox="0 0 25 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="20" height="11" rx="3.2" stroke="currentColor" opacity=".55"/><rect x="2.4" y="2.4" width="14" height="7.2" rx="1.6" fill="currentColor"/><path d="M22.8 3.8v4.4a2.2 2.2 0 0 0 0-4.4z" fill="currentColor" opacity=".55"/></svg>';

  function draw() {
    const plat = selPlatform.value;
    const sbMid = plat === 'iphone'
      ? '<span class="' + P + '-island"></span>'
      : '<span class="' + P + '-punch"></span>';
    const sbHtml = '<div class="' + P + '-sb"><span>9:41</span>' + sbMid +
      '<span class="' + P + '-sic">' + SB_SIG + SB_WIFI + SB_BAT + '</span></div>';
    const bgHtml = S.photo
      ? '<div class="' + P + '-bg"><img src="' + S.photo + '" alt=""></div>'
      : '<div class="' + P + '-bg" style="background:' + GRADS[S.bg] + '"></div>';
    frame = T.el(
      '<div class="' + P + '-frame plat-' + plat + '">' +
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
          '<button class="' + P + '-ic" tabindex="-1">⋯</button>' +
          '<button class="' + P + '-ic" tabindex="-1">✕</button>' +
        '</div>' +
        '<div class="' + P + '-txt"><span style="font-size:' + S.size + 'px;color:' + T.esc(S.color) + '">' + T.esc(S.text) + '</span></div>' +
        (S.link ? '<div class="' + P + '-link"><b>🔗 Lihat selengkapnya</b></div>' : '') +
        '<div class="' + P + '-foot">' +
          '<div class="' + P + '-pill">Send message</div>' +
          '<div class="' + P + '-fic">♡</div>' +
          '<div class="' + P + '-fic">➤</div>' +
        '</div>' +
        (plat === 'iphone' ? '<div class="' + P + '-home"></div>' : '') +
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

  const fi = fileInput('image/*');
  fi.onchange = () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    S.photo = URL.createObjectURL(f);
    draw();
  };
  const btnUp = T.btn('Upload foto', () => fi.click());
  const btnGrad = T.btn('Pakai gradient', () => { S.photo = null; draw(); });

  const btnEx = T.btn('Contoh', () => {
    S.username = 'adip.rmx'; S.time = '2h'; S.text = 'Baru rilis beat baru! 🔥';
    S.size = 26; S.color = '#ffffff'; S.bg = 'sunset'; S.photo = null; S.link = true;
    inUser.value = S.username; inTime.value = S.time; inText.value = S.text;
    inSize.value = String(S.size); labSize.textContent = 'Ukuran teks (' + S.size + 'px)';
    inColor.value = S.color; selBg.value = S.bg; chkLink.checked = S.link;
    draw();
  });
  const btnDl = T.btn('Unduh PNG', () => dlNodePng(frame, 'fake-story-ig.png'), true);

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
    T.row(btnEx, btnDl),
    stage,
    T.el('<p class="' + P + '-note">' + T.esc(LOCAL_NOTE) + '</p>')
  );
  root.appendChild(wrap);
  draw();
}
