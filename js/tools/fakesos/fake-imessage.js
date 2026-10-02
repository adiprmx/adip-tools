import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {
  id: 'fake-imessage',
  name: 'Fake iMessage',
  cat: 'fakesos',
  icon: '💙',
  desc: 'Bikin screenshot chat iMessage palsu + unduh PNG.',
  keywords: 'imessage,iphone,chat,fake,palsu,screenshot,prank',
};

const SIG_SVG = '<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="4.8" width="3" height="6.2" rx="1"/><rect x="9" y="2.4" width="3" height="8.6" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>';
const WIFI_SVG = '<svg width="16" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 10.6 5.9 8.5a3 3 0 0 1 4.2 0zM3.9 6.5a5.8 5.8 0 0 1 8.2 0L10.7 7.9a3.9 3.9 0 0 0-5.4 0zM1.2 3.8a9.6 9.6 0 0 1 13.6 0l-1.4 1.4a7.6 7.6 0 0 0-10.8 0z"/></svg>';
const BAT_SVG = '<svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor"/><path d="M23.5 4v4a2.2 2.2 0 0 0 0-4z" fill="currentColor" opacity="0.4"/></svg>';
const NAV_BACK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 4 8 12l9 8z"/></svg>';
const NAV_HOME = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>';
const NAV_RECENT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>';

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

export function render(root) {
  const wrap = T.el('<div class="fi-wrap"></div>');
  wrap.innerHTML = '<style>' +
    '.fi-wrap{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,sans-serif}' +
    '.fi-ctl{display:grid;gap:10px;margin-bottom:14px}' +
    '.fi-btns{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}' +
    '.fi-prevbox{display:flex;justify-content:center;padding:18px 10px;background:#101014;border:1px solid #ffffff14;border-radius:12px;margin-bottom:14px}' +
    '.fi-phone{width:100%;max-width:380px;background:var(--fi-bg);color:var(--fi-fg);overflow:hidden;text-align:left;' +
      '--fi-bg:#FFFFFF;--fi-fg:#000000;--fi-inb:#E9E9EB;--fi-inf:#000000;--fi-pill:#F2F2F7;--fi-hair:#C6C6C8;--fi-tb:#E9E9EB;--fi-home:#000000}' +
    '.fi-phone[data-theme="gelap"]{--fi-bg:#000000;--fi-fg:#FFFFFF;--fi-inb:#26262B;--fi-inf:#FFFFFF;--fi-pill:#1C1C1E;--fi-hair:#38383A;--fi-tb:#3A3A3C;--fi-home:#FFFFFF}' +
    '.fi-status{display:flex;align-items:center;justify-content:space-between;padding:16px 24px 4px}' +
    '.fi-time{font-size:14px;font-weight:600;letter-spacing:-0.2px}' +
    '.fi-island{width:100px;height:26px;background:#000;border-radius:14px}' +
    '.fi-sicons{display:flex;align-items:center;gap:6px}' +
    '.fi-head{display:flex;align-items:center;min-height:44px;padding:4px 10px 6px;position:relative}' +
    '.fi-back{color:#0A84FF;font-size:30px;line-height:1;display:flex;align-items:center;gap:3px;font-weight:400}' +
    '.fi-bcount{min-width:20px;height:20px;border-radius:10px;background:#0A84FF;color:#fff;font-size:12px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;padding:0 6px}' +
    '.fi-title{position:absolute;left:50%;transform:translateX(-50%);text-align:center;max-width:60%}' +
    '.fi-cname{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.fi-chev{color:#8E8E93;font-size:13px}' +
    '.fi-hair{height:1px;background:var(--fi-hair)}' +
    '.fi-msgs{padding:12px 12px 6px;display:flex;flex-direction:column;gap:5px;min-height:120px}' +
    '.fi-div{text-align:center;font-size:12px;color:#8E8E93;margin:8px 0}' +
    '.fi-row{display:flex}' +
    '.fi-row.out{justify-content:flex-end}' +
    '.fi-row.in{justify-content:flex-start}' +
    '.fi-bub{max-width:72%;padding:8px 13px;border-radius:18px;font-size:16px;line-height:1.35;position:relative;overflow-wrap:break-word}' +
    '.fi-row.out .fi-bub{background:#0A84FF;color:#fff}' +
    '.fi-row.in .fi-bub{background:var(--fi-inb);color:var(--fi-inf)}' +
    '.fi-tb{position:absolute;top:-14px;background:var(--fi-tb);border-radius:12px;padding:3px 8px;font-size:14px;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.28)}' +
    '.fi-row.out .fi-tb{left:-8px}' +
    '.fi-row.in .fi-tb{right:-8px}' +
    '.fi-dstat{text-align:right;font-size:11px;color:#8E8E93;margin-top:3px;padding-right:2px}' +
    '.fi-inputbar{display:flex;align-items:center;gap:9px;padding:8px 12px 6px}' +
    '.fi-plus{font-size:26px;color:#8E8E93;line-height:1;font-weight:300}' +
    '.fi-pill{flex:1;background:var(--fi-pill);border-radius:20px;padding:9px 14px;font-size:14px;color:#8E8E93}' +
    '.fi-send{width:30px;height:30px;border-radius:50%;background:#0A84FF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;flex:0 0 30px}' +
    '.fi-home{width:134px;height:5px;border-radius:3px;background:var(--fi-home);margin:6px auto 9px;opacity:.85}' +
    '.fi-punch{width:13px;height:13px;background:#000;border-radius:50%}' +
    '.fi-nav{display:flex;align-items:center;justify-content:space-evenly;padding:8px 30px 14px}' +
    '.fi-navbtn{color:var(--fi-fg);display:inline-flex;opacity:.85}' +
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

  const ctl = T.el('<div class="fi-ctl"></div>');
  ctl.appendChild(T.field('Nama kontak', nameI));
  ctl.appendChild(T.field('Divider waktu (opsional)', divI));
  ctl.appendChild(T.field('Badge di tombol kembali (opsional)', badgeI));
  ctl.appendChild(T.field('Status kirim', statI, 'Muncul di bawah bubble keluar terakhir'));
  ctl.appendChild(T.field('Isi chat', chatI, 'Format: A: … = bubble kiri (masuk), B: … = bubble kanan (keluar). Tambah |love → tapback ❤️'));
  ctl.appendChild(T.field('Platform', selPlatform));
  ctl.appendChild(T.field('Tema', themeI));
  wrap.appendChild(ctl);

  const btns = T.el('<div class="fi-btns"></div>');
  btns.appendChild(T.btn('Contoh', () => {
    nameI.value = 'Adip';
    divI.value = 'Today 10:30';
    badgeI.value = '';
    statI.value = 'read';
    chatI.value = 'A: bro nanti jadi kan?\nB: jadi dong, jam 7 gue berangkat\nB|love: makasih ya udah dijemput\nA: aman, santai aja';
    selPlatform.value = 'iphone';
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
    const cname = nameI.value.trim() || 'Kontak';
    const badgeN = parseInt(badgeI.value, 10);
    const badgeHtml = badgeN > 0 ? '<span class="fi-bcount">' + badgeN + '</span>' : '';
    const divTxt = divI.value.trim();
    const msgs = parse(chatI.value);

    let html = '<div class="fi-status">' +
      '<span class="fi-time">9:41</span>' +
      (isIPh ? '<span class="fi-island"></span>' : '<span class="fi-punch"></span>') +
      '<span class="fi-sicons">' + SIG_SVG + WIFI_SVG + BAT_SVG + '</span></div>';

    html += '<div class="fi-head">' +
      '<span class="fi-back">‹' + badgeHtml + '</span>' +
      '<span class="fi-title"><span class="fi-cname">' + T.esc(cname) + '</span> <span class="fi-chev">›</span></span>' +
      '</div><div class="fi-hair"></div>';

    html += '<div class="fi-msgs">';
    if (divTxt) html += '<div class="fi-div">' + T.esc(divTxt) + '</div>';
    let lastOutIdx = -1;
    msgs.forEach((m, i) => { if (m.dir === 'B') lastOutIdx = i; });
    msgs.forEach((m, i) => {
      const tb = m.love ? '<span class="fi-tb">❤️</span>' : '';
      html += '<div class="fi-row ' + (m.dir === 'B' ? 'out' : 'in') + '">' +
        '<div class="fi-bub">' + tb + escBr(m.text || ' ') + '</div></div>';
      if (i === lastOutIdx && statI.value && STAT_TXT[statI.value]) {
        html += '<div class="fi-dstat">' + T.esc(STAT_TXT[statI.value]) + '</div>';
      }
    });
    html += '</div>';

    html += '<div class="fi-inputbar">' +
      '<span class="fi-plus">⊕</span>' +
      '<span class="fi-pill">iMessage</span>' +
      '<span class="fi-send">↑</span></div>';
    if (isIPh) {
      html += '<div class="fi-home"></div>';
    } else {
      html += '<div class="fi-nav">' +
        '<span class="fi-navbtn">' + NAV_BACK + '</span>' +
        '<span class="fi-navbtn">' + NAV_HOME + '</span>' +
        '<span class="fi-navbtn">' + NAV_RECENT + '</span></div>';
    }

    phone.innerHTML = html;
  }

  [nameI, divI, badgeI, statI, chatI, selPlatform, themeI].forEach((elx) => {
    elx.addEventListener('input', draw);
    elx.addEventListener('change', draw);
  });

  draw();
  root.appendChild(wrap);
}
