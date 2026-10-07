import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.9.5';

export const meta = {"id":"fake-dm-tiktok","name":"Fake DM TikTok","cat":"fakesos","icon":"🎵","desc":"Bikin screenshot chat DM TikTok palsu + unduh PNG.","keywords":"tiktok,dm,chat,direct message,fake,palsu,screenshot,prank,android,iphone"};

const FTT_FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FTT_RED = '#FE2C55';
const FTT_CYAN = '#25F4EE';
const FTT_BLACK = '#161823';
const FTT_IC = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="6" width="13" height="12" rx="3"/><path d="M14.5 10.5l6.5-3.5v10l-6.5-3.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3.5"/><circle cx="8.7" cy="8.7" r="1.6"/><path d="M21 15.2l-4.8-4.8L5 21.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="18" x2="12" y2="21.5"/></svg>',
  smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.7 2.3 3.8 2.3 3.8-2.3 3.8-2.3"/><line x1="9" y1="9.2" x2="9.01" y2="9.2"/><line x1="15" y1="9.2" x2="15.01" y2="9.2"/></svg>'
};

const FTT_CSS = `
.ftt-wrap{max-width:380px;margin:12px auto;background:#fff;color:${FTT_BLACK};border:1px solid #dbdbdb;border-radius:20px;overflow:hidden;font-family:${FTT_FONT};font-size:15px;line-height:1.35}
.ftt-wrap.dark{background:#000;color:#fff;border-color:#2b2b2b}
.ftt-status{position:relative;display:flex;justify-content:space-between;align-items:center;padding:12px 18px 2px;font-size:15px;font-weight:600}
.ftt-status.ios{padding:11px 22px 2px}
.ftt-head{display:flex;align-items:center;gap:6px;min-height:60px;padding:8px 10px;border-bottom:1px solid #efefef}
.ftt-wrap.dark .ftt-head{border-bottom-color:#262626}
.ftt-back{width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.ftt-ava{border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;width:38px;height:38px;font-size:20px;font-weight:700;background:linear-gradient(135deg,${FTT_CYAN} 0%,${FTT_RED} 100%);color:#fff;flex:none}
.ftt-hmeta{flex:1 1 0;display:flex;flex-direction:column;line-height:1.3;min-width:0}
.ftt-hname{display:block;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ftt-hsub{font-size:12.5px;color:#8e8e8e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ftt-wrap.dark .ftt-hsub{color:#a8a8a8}
.ftt-hicons{display:flex;align-items:center;gap:16px;padding-right:2px}
.ftt-ic{width:22px;height:22px;display:inline-flex;flex:none}
.ftt-ic svg{width:100%;height:100%}
.ftt-chat{padding:12px 12px 6px;min-height:300px}
.ftt-div{display:flex;justify-content:center;margin:8px 0 12px}
.ftt-div span{font-size:12px;color:#8e8e8e;background:#f1f1f2;padding:4px 12px;border-radius:12px}
.ftt-wrap.dark .ftt-div span{color:#a8a8a8;background:#232329}
.ftt-row{display:flex;margin:0 0 3px}
.ftt-row.b{justify-content:flex-end}
.ftt-row.grp{margin-bottom:10px}
.ftt-bub{position:relative;max-width:76%;padding:9px 14px;border-radius:20px;font-size:15.5px;line-height:1.4;word-break:break-word}
.ftt-row.b .ftt-bub{background:${FTT_BLACK};color:#fff}
.ftt-row.a .ftt-bub{background:#f1f1f2;color:${FTT_BLACK}}
.ftt-wrap.dark .ftt-row.b .ftt-bub{background:#fff;color:#000}
.ftt-wrap.dark .ftt-row.a .ftt-bub{background:#232329;color:#fff}
.ftt-like{position:absolute;bottom:-9px;font-size:14px;line-height:1;background:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.22)}
.ftt-row.b .ftt-like{right:6px}
.ftt-row.a .ftt-like{left:6px}
.ftt-wrap.dark .ftt-like{background:#1c1c1e}
.ftt-seen{display:flex;justify-content:flex-end;margin:2px 2px 6px;font-size:12px;color:#8e8e8e}
.ftt-wrap.dark .ftt-seen{color:#a8a8a8}
.ftt-time{display:flex;margin:1px 2px 6px;font-size:11px;color:#a8a8a8}
.ftt-row.b + .ftt-time, .ftt-time.r{justify-content:flex-end}
.ftt-input{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;border-top:1px solid #efefef}
.ftt-wrap.dark .ftt-input{border-top-color:#262626}
.ftt-pill{flex:1;display:flex;align-items:center;background:#f1f1f2;border-radius:22px;padding:8px 14px;min-width:0}
.ftt-wrap.dark .ftt-pill{background:#232329}
.ftt-ph{flex:1;font-size:15px;color:#8e8e8e;white-space:nowrap;overflow:hidden}
.ftt-wrap.dark .ftt-ph{color:#a8a8a8}
.ftt-tic{width:23px;height:23px;display:inline-flex;flex:none;margin-left:10px}
.ftt-tic svg{width:100%;height:100%}
.ftt-pranktag{display:block;text-align:center;font-size:11px;font-weight:700;color:#fff;background:${FTT_RED};padding:6px 8px;letter-spacing:.4px}
.ftt-home{display:flex;justify-content:center;padding:6px 0 8px}
.ftt-home i{display:block;width:134px;height:5px;border-radius:3px;background:#000}
.ftt-wrap.dark .ftt-home i{background:#fff}
.ftt-anav{display:flex;justify-content:center;padding:6px 0 8px}
.ftt-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#111}
.ftt-wrap.dark .ftt-anav i{background:#f5f5f5}
`;

function fttAvaChar(emoji, name) {
  if (emoji) return T.esc(emoji);
  const n = String(name || '').trim();
  return T.esc((n[0] || '?').toUpperCase());
}

/* Format: A: pesan (lawan, kiri) / B: pesan (sendiri, kanan).
   Flag: |like  ❤️ merah di bubble · |seen  "Dilihat" di B terakhir · |t=09.41  jam di grup pesan */
function fttParse(text) {
  const out = [];
  String(text || '').split('\n').forEach((ln) => {
    const m = ln.match(/^\s*([AB])((?:\|[^\s:]+)*)\s*:\s*([\s\S]*)$/i);
    if (!m) return;
    const flags = (m[2] || '').split('|').filter(Boolean);
    let time = '';
    flags.forEach((f) => { const tm = f.match(/^t=(.+)$/i); if (tm) time = tm[1]; });
    out.push({ who: m[1].toUpperCase(), text: m[3], like: flags.indexOf('like') > -1, seen: flags.indexOf('seen') > -1, time: time });
  });
  return out;
}

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FTT_CSS;
  root.appendChild(style);

  const namaI = T.input('text', 'cth: Rina Prameswari', 'Rina Prameswari');
  const unameI = T.input('text', 'cth: rinaa.prm', 'rinaa.prm');
  const emojiI = T.input('text', 'cth: 😎 (kosong = inisial)', '😎');
  const statusI = T.input('text', 'cth: Active now', 'Active now');
  const platSel = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const themeSel = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const divI = T.input('text', 'cth: Hari ini', 'Hari ini');
  const chatTa = T.ta(8, 'A: halo\nB|t=09.41|seen: halo juga', '');
  const preview = T.out();

  function draw() {
    const dark = themeSel.value === 'gelap';
    const isIPh = platSel.value === 'iphone';
    brandField.style.display = (platSel.value === 'android') ? '' : 'none';
    const nama = namaI.value.trim() || 'Nama TikTok';
    const uname = unameI.value.trim() || 'username';
    const statusTx = statusI.value.trim() || 'Active now';
    const msgs = fttParse(chatTa.value);
    let seenIdx = -1;
    msgs.forEach((m, i) => { if (m.who === 'B' && m.seen) seenIdx = i; });

    let h = '';
    h += '<div class="ftt-status' + (isIPh ? ' ios' : '') + '">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    h += '<div class="ftt-head">'
      + '<span class="ftt-back">' + FTT_IC.back + '</span>'
      + '<span class="ftt-ava">' + fttAvaChar(emojiI.value.trim(), nama) + '</span>'
      + '<span class="ftt-hmeta"><span class="ftt-hname">' + T.esc(nama) + '</span><span class="ftt-hsub">@' + T.esc(uname) + ' · ' + T.esc(statusTx) + '</span></span>'
      + '<span class="ftt-hicons"><span class="ftt-ic">' + FTT_IC.phone + '</span><span class="ftt-ic">' + FTT_IC.video + '</span></span>'
      + '</div>';
    h += '<div class="ftt-chat">';
    h += '<div class="ftt-div"><span>' + T.esc(divI.value.trim() || 'Hari ini') + '</span></div>';

    let i = 0;
    while (i < msgs.length) {
      const m = msgs[i];
      const side = m.who === 'A' ? 'a' : 'b';
      let j = i;
      while (j + 1 < msgs.length && msgs[j + 1].who === m.who) j++;
      let groupTime = '';
      for (let k = i; k <= j; k++) {
        const mk = msgs[k];
        if (mk.time) groupTime = mk.time;
        const like = mk.like ? '<span class="ftt-like">❤️</span>' : '';
        h += '<div class="ftt-row ' + side + (k === j ? ' grp' : '') + '"><div class="ftt-bub">' + T.esc(mk.text) + like + '</div></div>';
        if (k === seenIdx) h += '<div class="ftt-seen">Dilihat</div>';
      }
      if (groupTime) h += '<div class="ftt-time' + (side === 'b' ? ' r' : '') + '">' + T.esc(groupTime) + '</div>';
      i = j + 1;
    }
    h += '</div>';
    h += '<div class="ftt-input"><div class="ftt-pill">'
      + '<span class="ftt-ph">Kirim pesan...</span>'
      + '<span class="ftt-tic">' + FTT_IC.smile + '</span></div>'
      + '<span class="ftt-tic">' + FTT_IC.image + '</span>'
      + '<span class="ftt-tic">' + FTT_IC.mic + '</span></div>'
      + '<span class="ftt-pranktag">⚠️ PALSU · CUMA PRANK ⚠️</span>'
      + (isIPh ? '<div class="ftt-home"><i></i></div>' : '<div class="ftt-anav"><i></i></div>');

    T.show(preview, '<div class="ftt-wrap' + (dark ? ' dark' : '') + '">' + h + '</div>');
  }

  [namaI, unameI, emojiI, statusI, platSel, selBrand, themeSel, divI, chatTa].forEach((elx) => { elx.addEventListener('input', draw); elx.addEventListener('change', draw); });

  function contoh() {
    namaI.value = 'Rina Prameswari';
    unameI.value = 'rinaa.prm';
    emojiI.value = '💃';
    statusI.value = 'Active now';
    divI.value = 'Hari ini';
    chatTa.value = 'A|t=09.12: woyy, video lu FYP anjir 😭\nB|t=09.15: HAHAHA serius?? berapa views\nA|like: udah 2,1 jt views wkwk\nB|t=09.41|seen: gila sih, traktir kopi dong ☕';
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Nama lawan', namaI), T.field('Username lawan', unameI)));
  root.appendChild(T.grid2(T.field('Avatar (emoji/inisial)', emojiI, 'Isi emoji, mis. 😎. Kosongkan = pakai inisial nama.'), T.field('Status', statusI)));
  root.appendChild(T.grid2(T.field('Platform', platSel), T.field('Tema', themeSel)));
  const brandField = T.field('Merk HP', selBrand);
  root.appendChild(brandField);
  root.appendChild(T.field('Teks pembatas tanggal', divI));
  root.appendChild(T.field('Percakapan', chatTa, 'Format: A: pesan (lawan, kiri) / B: pesan (sendiri, kanan). Flag: |like = ❤️, |seen di baris B terakhir = "Dilihat", |t=09.41 = jam di grup pesan.'));
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-dm-tiktok.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
