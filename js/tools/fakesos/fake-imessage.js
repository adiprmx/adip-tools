import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.3';

export const meta = {
  id: 'fake-imessage',
  name: 'Fake iMessage',
  cat: 'fakesos',
  icon: '💙',
  desc: 'Bikin screenshot chat iMessage palsu + unduh PNG.',
  keywords: 'imessage,iphone,chat,fake,palsu,screenshot,prank',
};

// Ikon ala SF Symbols iOS (aproksimasi dari deskripsi + teknik mask repo referensi).
const ICO_CHEV = '<svg width="12" height="21" viewBox="0 0 13 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 3.5 4 12l6.5 8.5"/></svg>';
const ICO_CHEVR = '<svg width="7" height="12" viewBox="0 0 8 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 1.5 6.5 6.5 2 11.5"/></svg>';
const ICO_FT = '<svg width="27" height="27" viewBox="0 0 28 28" fill="currentColor" aria-hidden="true"><path d="M16.2 9.6 24.9 5c.6-.3 1.3.1 1.3.8v16.4c0 .7-.7 1.1-1.3.8l-8.7-4.6z"/><rect x="2.6" y="8" width="14.4" height="12" rx="3.4"/></svg>';
const ICO_PHONE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
const ICO_PLUS = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M8 2.5v11M2.5 8h11"/></svg>';
const ICO_SEND = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
const ICO_MIC = '<svg width="15" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true"><rect x="4.8" y="0.5" width="4.4" height="10" rx="2.2"/><path d="M2.6 9a4.4 4.4 0 0 0 8.8 0H9.8a2.8 2.8 0 0 1-5.6 0zM6.2 15.2v3.3h1.6v-3.3z"/></svg>';

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
    '.fi-phone{width:100%;max-width:380px;background:var(--fi-bg);color:var(--fi-fg);overflow:hidden;text-align:left;-webkit-font-smoothing:antialiased;' +
      '--fi-bg:#FFFFFF;--fi-fg:#000000;' +
      '--fi-inb:#E9E9EB;--fi-inf:#000000;' +
      '--fi-out1:#1FA2FF;--fi-out2:#0A7CFF;' +
      '--fi-blue:#007AFF;' +
      '--fi-pill:#FFFFFF;--fi-pillb:rgba(0,0,0,.15);--fi-ph:#8E8E93;' +
      '--fi-hair:#C6C6C8;--fi-tb:#FFFFFF;--fi-tbb:rgba(0,0,0,.12);' +
      '--fi-plus:#E9E9EB;--fi-plusfg:#3A3A3C;--fi-home:#000000}' +
    '.fi-phone[data-theme="gelap"]{--fi-bg:#000000;--fi-fg:#FFFFFF;' +
      '--fi-inb:#2C2C2E;--fi-inf:#FFFFFF;' +
      '--fi-out1:#1FA2FF;--fi-out2:#0A7CFF;' +
      '--fi-blue:#0A84FF;' +
      '--fi-pill:#1C1C1E;--fi-pillb:rgba(255,255,255,0);--fi-ph:#8E8E93;' +
      '--fi-hair:#38383A;--fi-tb:#2C2C2E;--fi-tbb:rgba(255,255,255,.14);' +
      '--fi-plus:#2C2C2E;--fi-plusfg:#EBEBF5;--fi-home:#FFFFFF}' +
    '.fi-status{position:relative;display:flex;align-items:center;justify-content:space-between;padding:18px 26px 16px}' +
    '.fi-head{display:flex;align-items:center;justify-content:space-between;padding:4px 12px 8px;position:relative}' +
    '.fi-back{color:var(--fi-blue);display:flex;align-items:center;gap:2px;line-height:1}' +
    '.fi-bcount{min-width:20px;height:20px;border-radius:10px;background:var(--fi-blue);color:#fff;font-size:12px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}' +
    '.fi-title{position:absolute;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;max-width:52%}' +
    '.fi-tava{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:15px;margin-bottom:2px}' +
    '.fi-cname{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}' +
    '.fi-namerow{display:flex;align-items:center;gap:2px;color:#8E8E93;max-width:100%}' +
    '.fi-hicons{display:flex;align-items:center;gap:20px;color:var(--fi-blue)}' +
    '.fi-hicons span{display:inline-flex}' +
    '.fi-hair{height:1px;background:var(--fi-hair)}' +
    '.fi-msgs{padding:10px 12px 4px;display:flex;flex-direction:column;min-height:120px}' +
    '.fi-div{text-align:center;font-size:12px;color:#8E8E93;margin:10px 0}' +
    '.fi-row{display:flex;margin:1px 0}' +
    '.fi-row.fi-out{justify-content:flex-end}' +
    '.fi-row.fi-in{justify-content:flex-start}' +
    '.fi-row.fi-rs{margin-top:12px}' +
    '.fi-bub{max-width:75%;padding:8px 12px;border-radius:18px;font-size:17px;line-height:1.35;position:relative;overflow-wrap:break-word;word-break:break-word}' +
    '.fi-row.fi-out .fi-bub{background:linear-gradient(to bottom,var(--fi-out1),var(--fi-out2));color:#fff}' +
    '.fi-row.fi-in .fi-bub{background:var(--fi-inb);color:var(--fi-inf)}' +
    '.fi-row.fi-out.fi-f .fi-bub{border-radius:18px 18px 4px 18px}' +
    '.fi-row.fi-out.fi-m .fi-bub{border-radius:18px 4px 4px 18px}' +
    '.fi-row.fi-out.fi-l .fi-bub,.fi-row.fi-out.fi-s .fi-bub{border-radius:18px 18px 5px 18px}' +
    '.fi-row.fi-in.fi-f .fi-bub{border-radius:18px 18px 18px 4px}' +
    '.fi-row.fi-in.fi-m .fi-bub{border-radius:4px 18px 18px 4px}' +
    '.fi-row.fi-in.fi-l .fi-bub,.fi-row.fi-in.fi-s .fi-bub{border-radius:18px 18px 18px 5px}' +
    '.fi-row.fi-out.fi-tail .fi-bub::before{content:"";position:absolute;right:-7px;bottom:0;width:20px;height:20px;background:var(--fi-out2);border-bottom-left-radius:16px 14px}' +
    '.fi-row.fi-out.fi-tail .fi-bub::after{content:"";position:absolute;right:-26px;bottom:0;width:26px;height:20px;background:var(--fi-bg);border-bottom-left-radius:10px}' +
    '.fi-row.fi-in.fi-tail .fi-bub::before{content:"";position:absolute;left:-7px;bottom:0;width:20px;height:20px;background:var(--fi-inb);border-bottom-right-radius:16px 14px}' +
    '.fi-row.fi-in.fi-tail .fi-bub::after{content:"";position:absolute;left:-26px;bottom:0;width:26px;height:20px;background:var(--fi-bg);border-bottom-right-radius:10px}' +
    '.fi-tb{position:absolute;top:-14px;height:22px;display:inline-flex;align-items:center;background:var(--fi-tb);border:0.5px solid var(--fi-tbb);border-radius:11px;padding:0 8px;font-size:15px;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.18);z-index:2;white-space:nowrap}' +
    '.fi-row.fi-out .fi-tb{right:-6px}' +
    '.fi-row.fi-in .fi-tb{left:-6px}' +
    '.fi-dstat{text-align:right;font-size:12px;color:#8E8E93;margin:4px 2px 0}' +
    '.fi-inputbar{display:flex;align-items:center;gap:8px;padding:8px 12px 6px}' +
    '.fi-plus{width:30px;height:30px;border-radius:50%;background:var(--fi-plus);color:var(--fi-plusfg);display:inline-flex;align-items:center;justify-content:center;flex:none}' +
    '.fi-pill{flex:1;display:flex;align-items:center;justify-content:space-between;background:var(--fi-pill);border:0.5px solid var(--fi-pillb);border-radius:20px;padding:8px 12px;font-size:17px;color:var(--fi-ph);min-height:20px}' +
    '.fi-mic{color:#8E8E93;display:inline-flex}' +
    '.fi-send{width:32px;height:32px;border-radius:50%;background:var(--fi-blue);color:#fff;display:flex;align-items:center;justify-content:center;flex:0 0 32px}' +
    '.fi-home{width:134px;height:5px;border-radius:3px;background:var(--fi-home);margin:8px auto 8px;opacity:.9}' +
    '.fi-navpill{display:flex;justify-content:center;padding:10px 0 8px}' +
    '.fi-navpill span{width:108px;height:4px;border-radius:2px;background:var(--fi-home);opacity:.9}' +
    '.fi-note{font-size:12px;color:#8b8b93;line-height:1.5}' +
    '</style>';

  const nameI = T.input('text', 'Nama kontak', 'Adip');
  const divI = T.input('text', 'cth: Today 9:41 AM (kosongkan = tanpa divider)', 'Today 9:41 AM');
  const badgeI = T.input('number', 'Jumlah badge (opsional)', '');
  const statI = T.select([['', 'Tanpa status'], ['delivered', 'Delivered'], ['read', 'Read 9:41 AM']], 'read');
  const chatI = T.ta(7, 'A: teks (masuk)\nB: teks (keluar)\nB|love: teks + tapback ❤️',
    'A: bro nanti jadi kan?\nB: jadi dong, jam 7 gue berangkat\nB|love: makasih ya udah dijemput\nA: aman, santai aja');
  const themeI = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'iphone');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

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
    divI.value = 'Today 9:41 AM';
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

  const STAT_TXT = { delivered: 'Delivered', read: 'Read 9:41 AM' };

  function draw() {
    const dark = themeI.value === 'gelap';
    phone.setAttribute('data-theme', dark ? 'gelap' : 'terang');
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const cname = nameI.value.trim() || 'Kontak';
    const badgeN = parseInt(badgeI.value, 10);
    const badgeHtml = badgeN > 0 ? '<span class="fi-bcount">' + badgeN + '</span>' : '';
    const divTxt = divI.value.trim();
    const msgs = parse(chatI.value);
    const cinitial = T.esc(cname.trim().charAt(0).toUpperCase() || '?');

    let html = '<div class="fi-status">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';

    html += '<div class="fi-head">' +
      '<span class="fi-back">' + ICO_CHEV + badgeHtml + '</span>' +
      '<span class="fi-title"><span class="fi-tava" style="background:' + avaColor(cname) + '">' + cinitial + '</span>' +
      '<span class="fi-namerow"><span class="fi-cname">' + T.esc(cname) + '</span>' + ICO_CHEVR + '</span></span>' +
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
      '<span class="fi-plus">' + ICO_PLUS + '</span>' +
      '<span class="fi-pill"><span>iMessage</span>' + (hasText ? '' : '<span class="fi-mic">' + ICO_MIC + '</span>') + '</span>' +
      (hasText ? '<span class="fi-send">' + ICO_SEND + '</span>' : '') +
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
