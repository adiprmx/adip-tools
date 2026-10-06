import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.9.5';

export const meta = {
  id: 'fake-spotify-wrapped',
  name: 'Fake Spotify Wrapped',
  cat: 'fakesos',
  icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.36.719 1.02.419 1.56-.299.421-1.02.599-1.56.3z"/></svg>',
  desc: 'Bikin kartu Spotify Wrapped palsu: nama, top artis, top lagu, menit dengar + unduh PNG.',
  keywords: 'spotify,wrapped,fake,palsu,prank,musik,top lagu,artis',
};

const THEMES = {
  wrapped: { bg: 'linear-gradient(160deg,#1DB954 0%,#0d6e35 55%,#121212 130%)', fg: '#ffffff', sub: '#e8f5ec', num: '#ffffff', acc: '#191414' },
  ungu: { bg: 'linear-gradient(160deg,#8D67AB 0%,#3B2764 60%,#14121c 130%)', fg: '#ffffff', sub: '#e9def6', num: '#ffffff', acc: '#1DB954' },
  senja: { bg: 'linear-gradient(160deg,#F59B23 0%,#E13300 55%,#191414 135%)', fg: '#ffffff', sub: '#ffe9d6', num: '#ffffff', acc: '#191414' },
  pink: { bg: 'linear-gradient(160deg,#F6CBD8 0%,#E89BB0 55%,#191414 135%)', fg: '#191414', sub: '#3d2a31', num: '#191414', acc: '#1DB954' },
};
const THEME_LABEL = { wrapped: 'Wrapped hijau', ungu: 'Ungu malam', senja: 'Senja oranye', pink: 'Pink pastel' };

function listTop(lines, clsNum) {
  const items = String(lines || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (!items.length) return '<div class="' + clsNum + '-empty">—</div>';
  return items.map((t, i) =>
    '<div class="fsw-row"><span class="fsw-num">' + (i + 1) + '</span>' +
    '<span class="fsw-txt">' + T.esc(t) + '</span></div>').join('');
}

export function render(root) {
  const wrap = T.el('<div class="fsw-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fsw-wrap{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
    '.fsw-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fsw-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fsw-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fsw-card{width:100%;max-width:420px;min-height:620px;padding:34px 28px 30px;display:flex;flex-direction:column;position:relative;overflow:hidden;text-align:left}' +
    '.fsw-kicker{font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.9;margin:0 0 4px}' +
    '.fsw-name{font-size:34px;font-weight:800;line-height:1.05;margin:0 0 2px;overflow-wrap:break-word}' +
    '.fsw-year{font-size:17px;font-weight:600;opacity:.95;margin:0 0 18px}' +
    '.fsw-statbox{background:rgba(0,0,0,.28);border-radius:14px;padding:16px 18px;margin:0 0 20px}' +
    '.fsw-min{font-size:44px;font-weight:800;line-height:1;letter-spacing:-1px}' +
    '.fsw-minlbl{font-size:13px;font-weight:600;opacity:.9;margin-top:4px}' +
    '.fsw-sect{font-size:15px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 10px;opacity:.95}' +
    '.fsw-row{display:flex;align-items:center;gap:12px;padding:7px 0}' +
    '.fsw-num{font-size:26px;font-weight:800;min-width:26px;opacity:.9}' +
    '.fsw-txt{font-size:17px;font-weight:700;line-height:1.25;overflow-wrap:break-word;min-width:0}' +
    '.fsw-empty{opacity:.6;font-size:14px}' +
    '.fsw-gap{height:20px}' +
    '.fsw-foot{margin-top:auto;padding-top:22px;display:flex;align-items:center;justify-content:space-between}' +
    '.fsw-brand{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:800;letter-spacing:.5px}' +
    '.fsw-prank{font-size:11px;font-weight:600;opacity:.75;background:rgba(0,0,0,.25);padding:5px 10px;border-radius:20px}' +
    '.fsw-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const nameI = T.input('text', 'Nama kamu', 'Adip');
  const minI = T.input('text', 'cth: 45.210', '45.210');
  const artisI = T.ta(5, 'Satu artis per baris…', 'Payung Teduh\nTulus\nColdplay\nPamungkas\nHindia');
  const laguI = T.ta(5, 'Satu lagu per baris…', 'Akad — Payung Teduh\nMonokrom — Tulus\nYellow — Coldplay\nFlying Solo — Pamungkas\nEvaluasi — Hindia');
  const themeI = T.select([['wrapped', 'Wrapped hijau'], ['ungu', 'Ungu malam'], ['senja', 'Senja oranye'], ['pink', 'Pink pastel']], 'wrapped');

  const ctl = T.el('<div class="fsw-ctl"></div>');
  ctl.appendChild(T.field('Nama', nameI));
  ctl.appendChild(T.field('Menit didengarkan tahun ini', minI, 'Angka bebas, cth: 45.210'));
  ctl.appendChild(T.field('Top 5 artis (1 per baris)', artisI));
  ctl.appendChild(T.field('Top 5 lagu (1 per baris)', laguI));
  ctl.appendChild(T.field('Tema kartu', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fsw-btns"></div>');
  const card = T.el('<div class="fsw-card"></div>');

  btns.appendChild(T.btn('🎲 Contoh', () => {
    nameI.value = 'Adip';
    minI.value = '45.210';
    artisI.value = 'Payung Teduh\nTulus\nColdplay\nPamungkas\nHindia';
    laguI.value = 'Akad — Payung Teduh\nMonokrom — Tulus\nYellow — Coldplay\nFlying Solo — Pamungkas\nEvaluasi — Hindia';
    themeI.value = 'wrapped';
    draw(); T.scrollToPreview(card);
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(card, 'fake-spotify-wrapped.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fsw-prevbox"></div>');
  prevBox.appendChild(card);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fsw-note"></p>');
  note.textContent = LOCAL_NOTE + ' Hanya untuk seru-seruan, bukan data asli Spotify.';
  wrap.appendChild(note);

  function draw() {
    const th = THEMES[themeI.value] || THEMES.wrapped;
    const name = nameI.value.trim() || 'Kamu';
    const menit = minI.value.trim() || '0';
    card.setAttribute('style', 'background:' + th.bg + ';color:' + th.fg);
    card.innerHTML =
      '<p class="fsw-kicker">Spotify Wrapped 2026</p>' +
      '<h2 class="fsw-name">' + T.esc(name) + '</h2>' +
      '<p class="fsw-year">Inilah tahunmu dalam musik 🎧</p>' +
      '<div class="fsw-statbox" style="color:' + th.sub + '">' +
        '<div class="fsw-min">' + T.esc(menit) + '</div>' +
        '<div class="fsw-minlbl">menit kamu habiskan untuk mendengarkan tahun ini</div>' +
      '</div>' +
      '<p class="fsw-sect">Artis top kamu</p>' +
      listTop(artisI.value, 'fsw') +
      '<div class="fsw-gap"></div>' +
      '<p class="fsw-sect">Lagu top kamu</p>' +
      listTop(laguI.value, 'fsw') +
      '<div class="fsw-foot">' +
        '<span class="fsw-brand">Spotify Wrapped</span>' +
        '<span class="fsw-prank">bikinan palsu · cuma prank</span>' +
      '</div>';
  }

  [nameI, minI, artisI, laguI, themeI].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
