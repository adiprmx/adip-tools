import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.9.5';

export const meta = {
  id: 'fake-achievement',
  name: 'Fake Achievement Unlock',
  cat: 'fakesos',
  icon: '🏆',
  desc: 'Notifikasi achievement palsu ala Xbox / Steam / PlayStation + unduh PNG.',
  keywords: 'achievement,xbox,steam,playstation,ps,trophy,fake,palsu,prank,gamer,gamerscore',
};

/* Ikon trofi sederhana (digambar sendiri, bukan aset merek). */
const ICO_TROPHY = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>';
const ICO_XBOX = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.6c-.8.8-3.5 1-4.6 1s-3.8-.2-4.6-1c-.3-.3-.4-.7-.3-1.1l1.6-7.9c.2-.8 1-1.2 1.8-.9.4.2 3.5 2.9 3.5 2.9s3.1-2.7 3.5-2.9c.8-.3 1.6.1 1.8.9l1.6 7.9c.1.4 0 .8-.3 1.1z"/></svg>';

export function render(root) {
  const wrap = T.el('<div class="fa-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fa-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.fa-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fa-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fa-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fa-screen{width:100%;max-width:480px;min-height:340px;background:#0c0d10;border-radius:10px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:left}' +
    '.fa-bgwords{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:64px;font-weight:800;letter-spacing:6px;color:#ffffff0d;user-select:none}' +
    /* Xbox: toast gelap tengah-atas */
    '.fa-xbox{position:absolute;top:22px;left:50%;transform:translateX(-50%);width:min(88%,400px);background:#107C10;border-radius:8px;display:flex;align-items:center;gap:12px;padding:12px 14px;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.55)}' +
    '.fa-xbox .fa-ava{width:52px;height:52px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:#0e5c0e}' +
    '.fa-xbox .fa-main{min-width:0;flex:1}' +
    '.fa-xbox .fa-kicker{font-size:13px;font-weight:700;letter-spacing:.4px;margin:0 0 3px;opacity:.95}' +
    '.fa-xbox .fa-title{font-size:16px;font-weight:700;margin:0;overflow-wrap:break-word}' +
    '.fa-xbox .fa-sub{font-size:12.5px;margin:2px 0 0;opacity:.9;overflow-wrap:break-word}' +
    '.fa-xbox .fa-score{flex:none;font-size:20px;font-weight:800;background:#0a5a0a;border-radius:6px;padding:6px 9px;min-width:34px;text-align:center}' +
    /* Steam: toast kanan-bawah ala client desktop */
    '.fa-steam{position:absolute;right:18px;bottom:18px;width:min(80%,340px);background:#1b2838;border:1px solid #2a3f5a;border-radius:6px;display:flex;gap:12px;padding:12px 14px;color:#c7d5e0;box-shadow:0 8px 28px rgba(0,0,0,.6)}' +
    '.fa-steam .fa-tic{flex:none;width:44px;height:44px;border-radius:6px;background:#2a3f5a;display:flex;align-items:center;justify-content:center;color:#a4d007}' +
    '.fa-steam .fa-main{min-width:0;flex:1}' +
    '.fa-steam .fa-kicker{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a4d007;margin:0 0 3px}' +
    '.fa-steam .fa-title{font-size:15px;font-weight:700;color:#fff;margin:0;overflow-wrap:break-word}' +
    '.fa-steam .fa-sub{font-size:12.5px;margin:2px 0 0;color:#8f98a0;overflow-wrap:break-word}' +
    /* PS: toast kanan-atas */
    '.fa-ps{position:absolute;top:22px;right:18px;width:min(78%,330px);background:#003791;border-radius:8px;display:flex;gap:12px;padding:12px 14px;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.55)}' +
    '.fa-ps .fa-tic{flex:none;width:44px;height:44px;border-radius:8px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center}' +
    '.fa-ps .fa-main{min-width:0;flex:1}' +
    '.fa-ps .fa-kicker{font-size:12px;font-weight:700;letter-spacing:.6px;margin:0 0 3px;opacity:.95}' +
    '.fa-ps .fa-title{font-size:15px;font-weight:700;margin:0;overflow-wrap:break-word}' +
    '.fa-ps .fa-sub{font-size:12.5px;margin:2px 0 0;opacity:.85;overflow-wrap:break-word}' +
    '.fa-ps .fa-score{flex:none;font-size:13px;font-weight:800;background:rgba(255,255,255,.16);border-radius:6px;padding:5px 8px;align-self:flex-start}' +
    '.fa-pranktag{position:absolute;bottom:12px;left:12px;font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}' +
    '.fa-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const titleI = T.input('text', 'cth: Raja Begadang', 'Raja Begadang');
  const descI = T.ta(3, 'Deskripsi achievement…', 'Main sampai jam 3 pagi tanpa sadar waktu');
  const scoreI = T.input('text', 'cth: 100', '100');
  const gayaI = T.select([['xbox', 'Xbox'], ['steam', 'Steam'], ['ps', 'PlayStation']], 'xbox');

  const ctl = T.el('<div class="fa-ctl"></div>');
  ctl.appendChild(T.field('Gaya notifikasi', gayaI));
  ctl.appendChild(T.field('Judul achievement', titleI));
  ctl.appendChild(T.field('Deskripsi', descI));
  ctl.appendChild(T.field('Gamerscore / poin', scoreI, 'Xbox & PlayStation; Steam tidak pakai poin'));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fa-btns"></div>');
  const screen = T.el('<div class="fa-screen"></div>');

  btns.appendChild(T.btn('🎲 Contoh', () => {
    titleI.value = 'Raja Begadang'; descI.value = 'Main sampai jam 3 pagi tanpa sadar waktu';
    scoreI.value = '100'; gayaI.value = 'xbox';
    draw(); T.scrollToPreview(screen);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(screen, 'fake-achievement.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fa-prevbox"></div>');
  prevBox.appendChild(screen);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fa-note"></p>');
  note.textContent = LOCAL_NOTE + ' Hanya untuk prank, bukan achievement asli.';
  wrap.appendChild(note);

  function draw() {
    const title = T.esc(titleI.value.trim() || 'Achievement');
    const desc = T.esc(descI.value.trim());
    const score = T.esc(scoreI.value.trim() || '0');
    const gaya = gayaI.value;
    let toast = '';
    if (gaya === 'xbox') {
      toast = '<div class="fa-xbox">' +
        '<div class="fa-ava">' + ICO_XBOX + '</div>' +
        '<div class="fa-main"><p class="fa-kicker">Achievement unlocked</p>' +
        '<p class="fa-title">' + title + '</p>' +
        (desc ? '<p class="fa-sub">' + desc + '</p>' : '') + '</div>' +
        '<div class="fa-score">' + score + '</div></div>';
    } else if (gaya === 'steam') {
      toast = '<div class="fa-steam">' +
        '<div class="fa-tic">' + ICO_TROPHY + '</div>' +
        '<div class="fa-main"><p class="fa-kicker">Achievement Unlocked!</p>' +
        '<p class="fa-title">' + title + '</p>' +
        (desc ? '<p class="fa-sub">' + desc + '</p>' : '') + '</div></div>';
    } else {
      toast = '<div class="fa-ps">' +
        '<div class="fa-tic">' + ICO_TROPHY + '</div>' +
        '<div class="fa-main"><p class="fa-kicker">Trophy earned!</p>' +
        '<p class="fa-title">' + title + '</p>' +
        (desc ? '<p class="fa-sub">' + desc + '</p>' : '') + '</div>' +
        '<div class="fa-score">' + score + '</div></div>';
    }
    screen.innerHTML = '<div class="fa-bgwords">PRANK</div>' + toast +
      '<span class="fa-pranktag">palsu · cuma prank</span>';
  }

  [titleI, descI, scoreI, gayaI].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
