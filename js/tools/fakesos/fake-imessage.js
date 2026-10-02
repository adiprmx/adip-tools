import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.2';

export const meta = {
  id: 'fake-imessage',
  name: 'Fake iMessage',
  cat: 'fakesos',
  icon: '💙',
  desc: 'Bikin screenshot chat iMessage palsu + unduh PNG.',
  keywords: 'imessage,iphone,chat,fake,palsu,screenshot,prank',
};

const ICO_FT = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6.5" width="12.5" height="11" rx="3"/><path d="M14.5 10.5l7-3.5v10l-7-3.5"/></svg>';
const ICO_PHONE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const ICO_APP = '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="#0A84FF"/><path d="M14 7.5 18.5 21M14 7.5 9.5 21M11.2 16.2h5.6" stroke="#fff" stroke-width="2.1" stroke-linecap="round" fill="none"/></svg>';
const ICO_MIC = '<svg width="14" height="19" viewBox="0 0 14 19" fill="currentColor" aria-hidden="true"><rect x="5" y="0" width="4" height="9.5" rx="2"/><path d="M2.5 8.5a4.5 4.5 0 0 0 9 0H9.9a2.9 2.9 0 0 1-5.8 0zM6.2 14.4v3.1h1.6v-3.1z"/></svg>';

// Baris: "A: teks" = masuk (kiri), "B: teks" = keluar (kanan). "B|love: teks" = keluar + tapback ❤️.
function parse(src) {
  const out = [];
  String(src == null ? '' : src).split('\n').forEach((ln) => {
    const line = ln.replace(/\s+$/, '');
    if (!line.trim()) return;
    const m = line.match(/^([AB])(\|love)?\s*:\s*([\s\S]*)$/i);
    if (m) out.push({ dir: m[1].toUpperCase(), love: !!m[2], text: m[3] });
    else out.push({ dir: 'A', love: false, text: line.trim() });
  });
  return out;
}

function escBr(s) {
  return T.esc(s).split('\n').join('<br>');
}

function avaColor(name) {
  let hsh = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) % 360;
  return 'hsl(' + hsh + ',55%,45%)';
}

export function render(root) {
  const wrap = T.el('<div class="fi-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fi-wrap{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif}' +
    '.fi-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fi-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fi-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fi-phone{width:100%;max-width:380px;background:var(--fi-bg);color:var(--fi-fg);overflow:hidden;text-align:left;' +
      '--fi-bg:#FFFFFF;--fi-fg:#000000;--fi-inb:#E9E9EB;--fi-inf:#000000;--fi-pill:#FFFFFF;--fi-hair:#C6C6C8;--fi-tb:#E9E9EB;--fi-home:#000000}' +
    '.fi-phone[data-theme="gelap"]{--fi-bg:#000000;--fi-fg:#FFFFFF;--fi-inb:#26262B;--fi-inf:#FFFFFF;--fi-pill:#1C1C1E;--fi-hair:#38383A;--fi-tb:#3A3A3C;--fi-home:#FFFFFF}' +
    '.fi-status{position:relative;display:flex;align-items:center;justify-content:space-between;padding:18px 26px 16px}' +
    '.fi-head{display:flex;align-items:center;justify-content:space-between;padding:4px 12px 8px;position:relative}' +
    '.fi-back{color:#0A84FF;font-size:30px;line-height:1;display:flex;align-items:center;gap:3px;font-weight:400}' +
    '.fi-bcount{min-width:20px;height:20px;border-radius:10px;background:#0A84FF;color:#fff;font-size:12px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}' +
    '.fi-title{position:absolute;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;max-width:52%}' +
    '.fi-tava{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;margin-bottom:2px}' +
    '.fi-cname{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}' +
    '.fi-chev{color:#8E8E93;font-size:12px}' +
    '.fi-hicons{display:flex;align-items:center;gap:20px;color:#0A84FF}' +
    '.fi-hicons span{display:inline-flex}' +
    '.fi-hair{height:1px;background:var(--fi-hair)}' +
    '.fi-msgs{padding:10px 12px 4px;display:flex;flex-direction:column;min-height:120px}' +
    '.fi-div{text-align:center;font-size:12px;color:#8E8E93;margin:8px 0}' +
    '.fi-row{display:flex;margin:1.5px 0}' +
    '.fi-row.fi-out{justify-content:flex-end}' +
    '.fi-row.fi-in{justify-content:flex-start}' +
    '.fi-row.fi-rs{margin-top:10px}' +
    '.fi-bub{max-width:74%;padding:8px 12px;border-radius:18px;font-size:17px;line-height:1.35;position:relative;overflow-wrap:break-word;word-break:break-word}' +
    '.fi-row.fi-out .fi-bub{background:#0A84FF;color:#fff}' +
    '.fi-row.fi-in .fi-bub{background:var(--fi-inb);color:var(--fi-inf)}' +
    '.fi-row.fi-out.fi-f .fi-bub{border-radius:18px 18px 5px 18px}' +
    '.fi-row.fi-out.fi-m .fi-bub{border-radius:18px 5px 5px 18px}' +
    '.fi-row.fi-out.fi-l .fi-bub,.fi-row.fi-out.fi-s .fi-bub{border-radius:18px 18px 3px 18px}' +
    '.fi-row.fi-in.fi-f .fi-bub{border-radius:18px 18px 18px 5px}' +
    '.fi-row.fi-in.fi-m .fi-bub{border-radius:5px 18px 18px 5px}' +
    '.fi-row.fi-in.fi-l .fi-bub,.fi-row.fi-in.fi-s .fi-bub{border-radius:18px 18px 18px 3px}' +
    '.fi-row.fi-out.fi-tail .fi-bub::before{content:"";position:absolute;bottom:-1px;right:-10px;width:19px;height:13px;background:#0A84FF;border-bottom-right-radius:11px}' +
    '.fi-row.fi-out.fi-tail .fi-bub::after{content:"";position:absolute;bottom:-1px;right:-10px;width:10px;height:8px;background:var(--fi-bg);border-bottom-right-radius:8px}' +
    '.fi-row.fi-in.fi-tail .fi-bub::before{content:"";position:absolute;bottom:-1px;left:-10px;width:19px;height:13px;background:var(--fi-inb);border-bottom-left-radius:11px}' +
    '.fi-row.fi-in.fi-tail .fi-bub::after{content:"";position:absolute;bottom:-1px;left:-10px;width:10px;height:8px;background:var(--fi-bg);border-bottom-left-radius:8px}' +
    '.fi-tb{position:absolute;top:-13px;background:var(--fi-tb);border-radius:14px;padding:4px 9px;font-size:15px;line-height:1;box-shadow:0 1px 4px rgba(0,0,0,.25);z-index:1}' +
    '.fi-row.fi-out .fi-tb{right:-4px}' +
    '.fi-row.fi-in .fi-tb{left:-4px}' +
    '.fi-dstat{text-align:right;font-size:11.5px;color:#8E8E93;margin:3px 2px 0}' +
    '.fi-inputbar{display:flex;align-items:center;gap:8px;padding:8px 10px 4px}' +
    '.fi-plus{color:#8E8E93;font-size:30px;font-weight:300;line-height:1;flex:none}' +
    '.fi-app{flex:none;display:inline-flex}' +
    '.fi-pill{flex:1;display:flex;align-items:center;justify-content:space-between;background:var(--fi-pill);border:1px solid rgba(128,128,128,.28);border-radius:20px;padding:8px 12px;font-size:16px;color:#8E8E93;min-height:20px}' +
    '.fi-mic{color:#8E8E93;display:inline-flex}' +
    '.fi-send{width:32px;height:32px;border-radius:50%;background:#0A84FF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex:0 0 32px}' +
    '.fi-home{width:134px;height:5px;border-radius:3px;background:var(--fi-home);margin:8px auto 8px;opacity:.9}' +
    '.fi-navpill{display:flex;justify-content:center;padding:10px 0 8px}' +
    '.fi-navpill span{width:108px;height:4px;border-radius:2px;background:var(--fi-home);opacity:.9}' +
    '.fi-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const nameI = T.input('text', 'Nama kontak', 'Adip');
  const divI = T.input('text', 'cth: Today 10:30 (kosongkan = tanpa divider)', 'Today 10:30');
  const badgeI = T.input('number', 'Jumlah badge (opsional)', '');
  const statI = T.select([['', 'Tanpa status'], ['delivered', 'Delivered'], ['read', 'Read 10:30']], 'read');
  const chatI = T.ta(7, 'A: teks (masuk)\nB: teks (keluar)\nB|love: teks + tapback ❤️',
    'A: bro nanti jadi kan?\nB: jadi dong, jam 7 gue berangkat\nB|love: makasih ya udah dijemput\nA: aman, santai aja');
  const themeI = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'iphone');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['vivo', 'Vivo'], ['oppo', 'Oppo'], ['pixel', 'Pixel / Stock']], 'xiaomi');

  const ctl = T.el('<div class="fi-ctl"></div>');
  ctl.appendChild(T.field('Nama kontak', nameI));
  ctl.appendChild(T.field('Divider waktu (opsional)', divI));
  ctl.appendChild(T.field('Badge di tombol kembali (opsional)', badgeI));
  ctl.appendChild(T.field('Status kirim', statI, 'Muncul di bawah bubble keluar terakhir'));
  ctl.appendChild(T.field('Isi chat', chatI, 'Format: A: … = bubble kiri (masuk), B: … = bubble kanan (keluar). Tambah |love → tapback ❤️'));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fi-btns"></div>');
  btns.appendChild(T.btn('🎲 Contoh', () => {
    nameI.value = 'Adip';
    divI.value = 'Today 10:30';
    badgeI.value = '';
    statI.value = 'read';
    chatI.value = 'A: bro nanti jadi kan?\nB: jadi dong, jam 7 gue berangkat\nB|love: makasih ya udah dijemput\nA: aman, santai aja';
    themeI.value = 'terang';
    draw();
  }));
  btns.appendChild(T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-imessage.png'), true));
  wrap.appendChild(btns);

  const prevBox = T.el('<div class="fi-prevbox"></div>');
  const phone = T.el('<div class="fi-phone"></div>');
  prevBox.appendChild(phone);
  wrap.appendChild(prevBox);

  const note = T.el('<p class="fi-note"></p>');
  note.textContent = LOCAL_NOTE;
  wrap.appendChild(note);

  const STAT_TXT = { delivered: 'Delivered', read: 'Read 10:30' };

  function draw() {
    phone.setAttribute('data-theme', themeI.value === 'gelap' ? 'gelap' : 'terang');
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const cname = nameI.value.trim() || 'Kontak';
    const badgeN = parseInt(badgeI.value, 10);
    const badgeHtml = badgeN > 0 ? '<span class="fi-bcount">' + badgeN + '</span>' : '';
    const divTxt = divI.value.trim();
    const msgs = parse(chatI.value);
    const cinitial = T.esc(cname.trim().charAt(0).toUpperCase() || '?');

    let html = '<div class="fi-status">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value) + '</div>';

    html += '<div class="fi-head">' +
      '<span class="fi-back">‹' + badgeHtml + '</span>' +
      '<span class="fi-title"><span class="fi-tava" style="background:' + avaColor(cname) + '">' + cinitial + '</span>' +
      '<span><span class="fi-cname">' + T.esc(cname) + '</span> <span class="fi-chev">›</span></span></span>' +
      '<span class="fi-hicons"><span>' + ICO_FT + '</span><span>' + ICO_PHONE + '</span></span>' +
      '</div><div class="fi-hair"></div>';

    html += '<div class="fi-msgs">';
    if (divTxt) html += '<div class="fi-div">' + T.esc(divTxt) + '</div>';
    let lastOutIdx = -1;
    msgs.forEach((m, i) => { if (m.dir === 'B') lastOutIdx = i; });
    msgs.forEach((m, i) => {
      const prev = i > 0 ? msgs[i - 1].dir : null;
      const next = i < msgs.length - 1 ? msgs[i + 1].dir : null;
      const first = prev !== m.dir, last = next !== m.dir;
      const pos = first && last ? 's' : first ? 'f' : last ? 'l' : 'm';
      const tail = (pos === 'l' || pos === 's') ? ' fi-tail' : '';
      const rs = first && i > 0 ? ' fi-rs' : '';
      const tb = m.love ? '<span class="fi-tb">❤️</span>' : '';
      html += '<div class="fi-row fi-' + (m.dir === 'B' ? 'out' : 'in') + ' fi-' + pos + tail + rs + '">' +
        '<div class="fi-bub">' + tb + escBr(m.text || ' ') + '</div></div>';
      if (i === lastOutIdx && statI.value && STAT_TXT[statI.value]) {
        html += '<div class="fi-dstat">' + T.esc(STAT_TXT[statI.value]) + '</div>';
      }
    });
    html += '</div>';

    const hasText = msgs.length > 0;
    html += '<div class="fi-inputbar">' +
      '<span class="fi-plus">+</span>' +
      '<span class="fi-app">' + ICO_APP + '</span>' +
      '<span class="fi-pill"><span>iMessage</span>' + (hasText ? '' : '<span class="fi-mic">' + ICO_MIC + '</span>') + '</span>' +
      (hasText ? '<span class="fi-send">↑</span>' : '') +
      '</div>';
    if (isIPh) {
      html += '<div class="fi-home"></div>';
    } else {
      html += '<div class="fi-navpill"><span></span></div>';
    }

    phone.innerHTML = html;
  }

  [nameI, divI, badgeI, statI, chatI, selPlatform, selBrand, themeI].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
