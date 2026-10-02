import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.3';

export const meta = {"id":"fake-dm-ig","name":"Fake DM Instagram","cat":"fakesos","icon":"📩","desc":"Bikin screenshot DM Instagram palsu + unduh PNG.","keywords":"instagram,dm,chat,fake,palsu,screenshot,prank,android,iphone"};

const FDM_FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FDM_PERSON = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="#b5b5b5" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';
const FDM_IC = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="6" width="13" height="12" rx="3"/><path d="M14.5 10.5l6.5-3.5v10l-6.5-3.5"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><line x1="12" y1="11" x2="12" y2="16.5"/><line x1="12" y1="7.6" x2="12.01" y2="7.6"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3.5"/><circle cx="8.7" cy="8.7" r="1.6"/><path d="M21 15.2l-4.8-4.8L5 21.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="18" x2="12" y2="21.5"/></svg>',
  sticker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h11.5a2 2 0 0 1 2 2V15l-4.2 5.5H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/><path d="M18.5 15H15a1.5 1.5 0 0 0-1.5 1.5v3.2"/><circle cx="9.2" cy="10" r="1.15" fill="currentColor" stroke="none"/><circle cx="14.3" cy="10" r="1.15" fill="currentColor" stroke="none"/><path d="M8.8 13.6s1.6 1.7 3.7 1.7 3.2-1.7 3.2-1.7"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>'
};
const FDM_BACK_AND = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
const FDM_BACK_IOS = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';

const FDM_CSS = `
.fdm-wrap{max-width:380px;margin:12px auto;background:#fff;color:#0f0f0f;border:1px solid #dbdbdb;border-radius:20px;overflow:hidden;font-family:${FDM_FONT};font-size:15px;line-height:1.35}
.fdm-wrap.dark{background:#000;color:#f5f5f5;border-color:#2b2b2b}
.fdm-status{position:relative;display:flex;justify-content:space-between;align-items:center;padding:12px 18px 2px;font-size:15px;font-weight:600}
.fdm-status.ios{padding:11px 22px 2px}
.fdm-home{display:flex;justify-content:center;padding:6px 0 8px}
.fdm-home i{display:block;width:134px;height:5px;border-radius:3px;background:#000}
.fdm-wrap.dark .fdm-home i{background:#fff}
.fdm-anav{display:flex;justify-content:center;padding:6px 0 8px}
.fdm-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#111}
.fdm-wrap.dark .fdm-anav i{background:#f5f5f5}
.fdm-head{display:flex;align-items:center;gap:12px;min-height:62px;padding:8px 12px;border-bottom:1px solid #efefef}
.fdm-wrap.dark .fdm-head{border-bottom-color:#262626}
.fdm-back{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;flex:none;color:#262626}
.fdm-wrap.dark .fdm-back{color:#f5f5f5}
.fdm-hava{position:relative;flex:none}
.fdm-dot{position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;background:#31a24c;border:2.5px solid #fff}
.fdm-wrap.dark .fdm-dot{border-color:#000}
.fdm-hmeta{display:flex;flex-direction:column;line-height:1.3;min-width:0}
.fdm-hname{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fdm-hsub{font-size:12.5px;color:#8e8e8e}
.fdm-wrap.dark .fdm-hsub{color:#a8a8a8}
.fdm-hicons{margin-left:auto;display:flex;align-items:center;gap:22px;padding-right:4px}
.fdm-ic{width:24px;height:24px;display:inline-flex;flex:none;color:#262626}
.fdm-wrap.dark .fdm-ic{color:#f5f5f5}
.fdm-ic svg{width:100%;height:100%}
.fdm-ava{border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;background:#efefef}
.fdm-wrap.dark .fdm-ava{background:#262626}
.fdm-ava img{width:100%;height:100%;object-fit:cover;display:block}
.fdm-chat{padding:12px 12px 8px;min-height:300px}
.fdm-div{display:flex;justify-content:center;margin:8px 0 12px}
.fdm-div span{font-size:12.5px;color:#8e8e8e}
.fdm-wrap.dark .fdm-div span{color:#a8a8a8}
.fdm-row{display:flex;align-items:flex-end;margin:0 0 2px}
.fdm-row.b{justify-content:flex-end}
.fdm-row.grp{margin-bottom:9px}
.fdm-bub{position:relative;max-width:76%;padding:9px 14px;border-radius:22px;font-size:15.5px;line-height:1.4;word-break:break-word}
.fdm-row.b .fdm-bub{background:linear-gradient(180deg,#B43BD6 0%,#7B3FE4 45%,#0098EA 100%);color:#fff}
.fdm-row.a .fdm-bub{background:#efefef;color:#262626}
.fdm-wrap.dark .fdm-row.a .fdm-bub{background:#262626;color:#f5f5f5}
.fdm-like{position:absolute;bottom:-9px;font-size:15px;line-height:1;background:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.22)}
.fdm-row.b .fdm-like{right:6px}
.fdm-row.a .fdm-like{left:6px}
.fdm-wrap.dark .fdm-like{background:#1c1c1c}
.fdm-seen{display:flex;justify-content:flex-end;margin:3px 2px 5px;font-size:12px;color:#8e8e8e}
.fdm-wrap.dark .fdm-seen{color:#a8a8a8}
.fdm-input{display:flex;align-items:center;gap:10px;padding:8px 10px 12px}
.fdm-pill{flex:1;display:flex;align-items:center;gap:11px;background:#efefef;border-radius:26px;padding:6px 13px 6px 6px;min-width:0}
.fdm-wrap.dark .fdm-pill{background:#262626}
.fdm-cam{width:32px;height:32px;border-radius:50%;background:linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF);display:inline-flex;align-items:center;justify-content:center;flex:none}
.fdm-cam svg{width:17px;height:17px;display:block}
.fdm-ph{flex:1;font-size:15px;color:#8e8e8e;white-space:nowrap;overflow:hidden}
.fdm-wrap.dark .fdm-ph{color:#a8a8a8}
.fdm-tic{width:24px;height:24px;display:inline-flex;flex:none;color:#262626}
.fdm-wrap.dark .fdm-tic{color:#f5f5f5}
.fdm-tic svg{width:100%;height:100%}
.fdm-heartbtn{width:27px;height:27px;display:inline-flex;flex:none;color:#262626}
.fdm-wrap.dark .fdm-heartbtn{color:#f5f5f5}
.fdm-heartbtn svg{width:100%;height:100%}
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
  const statusInp = T.input('text', 'cth: Active now', 'Active now');
  const fiA = fileInput('image/*');
  const fiB = fileInput('image/*');
  const platSel = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const themeSel = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const divInp = T.input('text', 'cth: Today', 'Today');
  const chatTa = T.ta(8, 'A: halo\nB|seen: halo juga', '');
  const preview = T.out();

  fiA.addEventListener('change', () => { if (fiA.files[0]) { avaA = URL.createObjectURL(fiA.files[0]); draw(); } });
  fiB.addEventListener('change', () => { if (fiB.files[0]) { avaB = URL.createObjectURL(fiB.files[0]); draw(); } });

  function draw() {
    const dark = themeSel.value === 'gelap';
    const isIPh = platSel.value === 'iphone';
    brandField.style.display = (platSel.value === 'android') ? '' : 'none';
    const unameA = userA.value.trim() || 'username';
    const statusTx = statusInp.value.trim() || 'Active now';
    const showDot = /active now/i.test(statusTx) || /aktif/i.test(statusTx);
    const msgs = fdmParse(chatTa.value);
    let seenIdx = -1;
    msgs.forEach((m, i) => { if (m.who === 'B' && m.seen) seenIdx = i; });

    let h = '';
    h += '<div class="fdm-status' + (isIPh ? ' ios' : '') + '">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    h += '<div class="fdm-head">'
      + '<span class="fdm-back">' + (isIPh ? FDM_BACK_IOS : FDM_BACK_AND) + '</span>'
      + '<span class="fdm-hava">' + fdmAva(avaA, 36) + (showDot ? '<span class="fdm-dot"></span>' : '') + '</span>'
      + '<span class="fdm-hmeta"><span class="fdm-hname">' + T.esc(unameA) + '</span><span class="fdm-hsub">' + T.esc(statusTx) + '</span></span>'
      + '<span class="fdm-hicons"><span class="fdm-ic">' + FDM_IC.phone + '</span><span class="fdm-ic">' + FDM_IC.video + '</span><span class="fdm-ic">' + FDM_IC.info + '</span></span>'
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
          h += '<div class="fdm-row a' + (k === j ? ' grp' : '') + '"><div class="fdm-bub">' + T.esc(mk.text) + like + '</div></div>';
        }
        i = j + 1;
      } else {
        let j = i;
        while (j + 1 < msgs.length && msgs[j + 1].who === 'B') j++;
        for (let k = i; k <= j; k++) {
          const mk = msgs[k];
          const like = mk.like ? '<span class="fdm-like">❤️</span>' : '';
          h += '<div class="fdm-row b' + (k === j ? ' grp' : '') + '"><div class="fdm-bub">' + T.esc(mk.text) + like + '</div></div>';
          if (k === seenIdx) h += '<div class="fdm-seen">Seen</div>';
        }
        i = j + 1;
      }
    }
    h += '</div>';
    h += '<div class="fdm-input"><div class="fdm-pill">'
      + '<span class="fdm-cam">' + FDM_IC.cam + '</span>'
      + '<span class="fdm-ph">Message...</span>'
      + '<span class="fdm-tic">' + FDM_IC.mic + '</span>'
      + '<span class="fdm-tic">' + FDM_IC.image + '</span>'
      + '<span class="fdm-tic">' + FDM_IC.sticker + '</span></div>'
      + '<span class="fdm-heartbtn">' + FDM_IC.heart + '</span></div>'
      + (isIPh ? '<div class="fdm-home"><i></i></div>' : '<div class="fdm-anav"><i></i></div>');

    T.show(preview, '<div class="fdm-wrap' + (dark ? ' dark' : '') + '">' + h + '</div>');
  }

  [userA, userB, statusInp, platSel, selBrand, themeSel, divInp, chatTa].forEach((elx) => { elx.addEventListener('input', draw); elx.addEventListener('change', draw); });

  function contoh() {
    userA.value = 'rinaa.prm';
    userB.value = 'adip.rmx';
    statusInp.value = 'Active now';
    divInp.value = 'Today';
    chatTa.value = 'A: woyy, jadi kan nongkrong nanti?\nB: jadi dong, jam 7 ya\nA|like: oke gas! gue bawa cemilan\nB|seen: wkwk parah 😂 bawa yang banyak';
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Username lawan', userA), T.field('Username sendiri', userB)));
  root.appendChild(T.grid2(T.field('Avatar lawan', fiA), T.field('Avatar sendiri', fiB)));
  root.appendChild(T.grid2(T.field('Platform', platSel), T.field('Tema', themeSel)));
  const brandField = T.field('Merk HP', selBrand);
  root.appendChild(brandField);
  root.appendChild(T.grid2(T.field('Status', statusInp), T.field('Teks pembatas tanggal', divInp)));
  root.appendChild(T.field('Percakapan', chatTa, 'Format: A: pesan (lawan, kiri) / B: pesan (sendiri, kanan). Tambah |like untuk ❤️, |seen di baris B terakhir untuk tanda dibaca.'));
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-dm-ig.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
