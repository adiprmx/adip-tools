import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-dm-ig","name":"Fake DM Instagram","cat":"fakesos","icon":"📩","desc":"Bikin screenshot DM Instagram palsu + unduh PNG.","keywords":"instagram,dm,chat,fake,palsu,screenshot,prank,android,iphone"};

const FDM_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FDM_PERSON = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="#b5b5b5" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';
const FDM_IC = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
};
const FDM_BACK_AND = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const FDM_SB = {
  signal: '<svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.8"/><rect x="4.3" y="5.5" width="3" height="6.5" rx="0.8"/><rect x="8.6" y="3" width="3" height="9" rx="0.8"/><rect x="12.9" y="0.5" width="3" height="11.5" rx="0.8"/></svg>',
  wifi: '<svg width="15" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.5a10 10 0 0 1 13 0"/><path d="M4 7.2a6.4 6.4 0 0 1 8 0"/><circle cx="8" cy="10" r="1.3" fill="currentColor" stroke="none"/></svg>',
  batt: '<svg width="23" height="11" viewBox="0 0 24 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="currentColor" stroke-width="1.2" opacity="0.45"/><rect x="2.6" y="2.6" width="14" height="6.8" rx="1.2" fill="currentColor"/><rect x="22" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.45"/></svg>'
};

const FDM_CSS = `
.fdm-wrap{max-width:380px;margin:12px auto;background:#fff;color:#111;border:1px solid #dbdbdb;border-radius:20px;overflow:hidden;font-family:${FDM_FONT};font-size:14px;line-height:1.4}
.fdm-wrap.dark{background:#000;color:#f5f5f5;border-color:#2b2b2b}
.fdm-status{display:flex;justify-content:space-between;align-items:center;padding:12px 18px 2px;font-size:12.5px;font-weight:600}
.fdm-status.ios{padding:14px 22px 2px}
.fdm-island{width:100px;height:25px;border-radius:13px;background:#000;flex:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09)}
.fdm-back svg{width:26px;height:26px;display:block}
.fdm-home{display:flex;justify-content:center;padding:4px 0 10px}
.fdm-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.3)}
.fdm-wrap.dark .fdm-home i{background:rgba(255,255,255,.35)}
.fdm-sicons{display:flex;align-items:center;gap:6px}
.fdm-head{display:flex;align-items:center;gap:10px;min-height:56px;padding:6px 10px;border-bottom:1px solid #efefef}
.fdm-wrap.dark .fdm-head{border-bottom-color:#262626}
.fdm-back{font-size:30px;line-height:1;font-weight:300;padding:0 2px}
.fdm-hmeta{display:flex;flex-direction:column;line-height:1.3;min-width:0}
.fdm-hname{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fdm-hsub{font-size:12px;color:#8e8e8e}
.fdm-hicons{margin-left:auto;display:flex;align-items:center;gap:20px;padding-right:8px}
.fdm-ic{width:24px;height:24px;display:inline-flex;flex:none;color:#262626}
.fdm-wrap.dark .fdm-ic{color:#f5f5f5}
.fdm-ic svg{width:100%;height:100%}
.fdm-ic.sm{width:20px;height:20px;color:#8e8e8e}
.fdm-ava{border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;background:#efefef}
.fdm-wrap.dark .fdm-ava{background:#262626}
.fdm-ava img{width:100%;height:100%;object-fit:cover;display:block}
.fdm-chat{padding:10px 12px;min-height:300px}
.fdm-div{display:flex;justify-content:center;margin:6px 0 10px}
.fdm-div span{font-size:12px;color:#737373;background:#efefef;padding:5px 14px;border-radius:14px}
.fdm-wrap.dark .fdm-div span{background:#262626;color:#a8a8a8}
.fdm-row{display:flex;align-items:flex-end;margin:3px 0}
.fdm-row.b{justify-content:flex-end}
.fdm-avasp{width:28px;height:28px;flex:none;margin-right:8px}
.fdm-row.a .fdm-ava{margin-right:8px}
.fdm-bub{position:relative;max-width:75%;padding:8px 14px;border-radius:20px;font-size:14.5px;line-height:1.42;word-break:break-word}
.fdm-row.b .fdm-bub{background:#3797f0;color:#fff}
.fdm-row.a .fdm-bub{background:#efefef;color:#262626}
.fdm-wrap.dark .fdm-row.a .fdm-bub{background:#262626;color:#f5f5f5}
.fdm-like{position:absolute;bottom:-9px;right:2px;font-size:16px;line-height:1;background:#fff;border-radius:50%;padding:1px;box-shadow:0 1px 2px rgba(0,0,0,.18)}
.fdm-wrap.dark .fdm-like{background:#1a1a1a}
.fdm-seen{display:flex;justify-content:flex-end;margin:4px 0 2px}
.fdm-input{display:flex;align-items:center;gap:12px;padding:8px 12px 20px}
.fdm-pill{flex:1;display:flex;align-items:center;gap:8px;background:#efefef;border-radius:24px;padding:11px 14px}
.fdm-wrap.dark .fdm-pill{background:#262626}
.fdm-ph{font-size:14px;color:#8e8e8e}
`;

function fdmAva(url, size) {
  const inner = url ? '<img src="' + T.esc(url) + '" alt="">' : FDM_PERSON;
  return '<div class="fdm-ava" style="width:' + size + 'px;height:' + size + 'px">' + inner + '</div>';
}

function fdmParse(text) {
  const out = [];
  String(text || '').split('\n').forEach((ln) => {
    const m = ln.match(/^\s*([AB])((?:\|[a-z]+)*)\s*:\s*([\s\S]*)$/i);
    if (!m) return;
    const flags = (m[2] || '').toLowerCase().split('|').filter(Boolean);
    out.push({ who: m[1].toUpperCase(), text: m[3], like: flags.indexOf('like') > -1, seen: flags.indexOf('seen') > -1 });
  });
  return out;
}

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FDM_CSS;
  root.appendChild(style);

  let avaA = null, avaB = null;

  const userA = T.input('text', 'cth: rinaa.prm', '');
  const userB = T.input('text', 'cth: adip.rmx', '');
  const fiA = fileInput('image/*');
  const fiB = fileInput('image/*');
  const platSel = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const themeSel = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const divInp = T.input('text', 'cth: Today', 'Today');
  const chatTa = T.ta(8, 'A: halo\nB|seen: halo juga', '');
  const preview = T.out();

  fiA.addEventListener('change', () => { if (fiA.files[0]) { avaA = URL.createObjectURL(fiA.files[0]); draw(); } });
  fiB.addEventListener('change', () => { if (fiB.files[0]) { avaB = URL.createObjectURL(fiB.files[0]); draw(); } });

  function draw() {
    const dark = themeSel.value === 'gelap';
    const isIPh = platSel.value === 'iphone';
    const unameA = userA.value.trim() || 'username';
    const msgs = fdmParse(chatTa.value);
    let seenIdx = -1;
    msgs.forEach((m, i) => { if (m.who === 'B' && m.seen) seenIdx = i; });

    let h = '';
    h += isIPh
      ? '<div class="fdm-status ios"><span>09:41</span><span class="fdm-island"></span><span class="fdm-sicons">' + FDM_SB.signal + FDM_SB.wifi + FDM_SB.batt + '</span></div>'
      : '<div class="fdm-status"><span>09:41</span><span class="fdm-sicons">' + FDM_SB.signal + FDM_SB.wifi + FDM_SB.batt + '</span></div>';
    h += '<div class="fdm-head">'
      + (isIPh ? '<span class="fdm-back">‹</span>' : '<span class="fdm-back">' + FDM_BACK_AND + '</span>')
      + fdmAva(avaA, 34)
      + '<span class="fdm-hmeta"><span class="fdm-hname">' + T.esc(unameA) + '</span><span class="fdm-hsub">Active now</span></span>'
      + '<span class="fdm-hicons"><span class="fdm-ic">' + FDM_IC.phone + '</span><span class="fdm-ic">' + FDM_IC.video + '</span></span>'
      + '</div>';
    h += '<div class="fdm-chat">';
    h += '<div class="fdm-div"><span>' + T.esc(divInp.value.trim() || 'Today') + '</span></div>';

    let i = 0;
    while (i < msgs.length) {
      const m = msgs[i];
      if (m.who === 'A') {
        let j = i;
        while (j + 1 < msgs.length && msgs[j + 1].who === 'A') j++;
        for (let k = i; k <= j; k++) {
          const mk = msgs[k];
          const like = mk.like ? '<span class="fdm-like">❤️</span>' : '';
          h += '<div class="fdm-row a">'
            + (k === j ? fdmAva(avaA, 28) : '<span class="fdm-avasp"></span>')
            + '<div class="fdm-bub">' + T.esc(mk.text) + like + '</div>'
            + '</div>';
        }
        i = j + 1;
      } else {
        const like = m.like ? '<span class="fdm-like">❤️</span>' : '';
        h += '<div class="fdm-row b"><div class="fdm-bub">' + T.esc(m.text) + like + '</div></div>';
        if (i === seenIdx) h += '<div class="fdm-seen">' + fdmAva(avaA, 16) + '</div>';
        i++;
      }
    }
    h += '</div>';
    h += '<div class="fdm-input"><div class="fdm-pill"><span class="fdm-ic sm">' + FDM_IC.image + '</span><span class="fdm-ph">Message...</span></div>'
      + '<span class="fdm-ic">' + FDM_IC.mic + '</span><span class="fdm-ic">' + FDM_IC.smile + '</span></div>'
      + (isIPh ? '<div class="fdm-home"><i></i></div>' : '');

    preview.innerHTML = '<div class="fdm-wrap' + (dark ? ' dark' : '') + '">' + h + '</div>';
  }

  [userA, userB, platSel, themeSel, divInp, chatTa].forEach((elx) => { elx.addEventListener('input', draw); elx.addEventListener('change', draw); });

  function contoh() {
    userA.value = 'rinaa.prm';
    userB.value = 'adip.rmx';
    divInp.value = 'Today';
    chatTa.value = 'A: woyy, jadi kan nongkrong nanti?\nB: jadi dong, jam 7 ya\nA|like: oke gas! gue bawa cemilan\nB|seen: wkwk parah 😂 bawa yang banyak';
    draw();
    T.toast('Contoh dimuat');
  }

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Username lawan', userA), T.field('Username sendiri', userB)));
  root.appendChild(T.grid2(T.field('Avatar lawan', fiA), T.field('Avatar sendiri', fiB)));
  root.appendChild(T.grid2(T.field('Platform', platSel), T.field('Tema', themeSel)));
  root.appendChild(T.field('Teks pembatas tanggal', divInp));
  root.appendChild(T.field('Percakapan', chatTa, 'Format: A: pesan (lawan, kiri) / B: pesan (sendiri, kanan). Tambah |like untuk ❤️, |seen di baris B terakhir untuk tanda dibaca.'));
  root.appendChild(T.row(
    T.btn('Contoh', contoh),
    T.btn('Unduh PNG', () => { dlNodePng(preview, 'fake-dm-ig.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
