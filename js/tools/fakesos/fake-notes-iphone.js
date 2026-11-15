import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.12.1';

export const meta = {
  id: 'fake-notes-iphone',
  name: 'Fake Catatan iPhone',
  cat: 'fakesos',
  icon: '📝',
  desc: 'Bikin screenshot aplikasi Catatan iPhone palsu: daftar catatan atau satu catatan + unduh PNG.',
  keywords: 'iphone,notes,catatan,apple,fake,palsu,screenshot,prank,ios',
  since: '6.12.0',
};

/* Tampilan Catatan iOS 26 (riset 15 Nov 2026): judul besar "Catatan", kolom
   cari di BAWAH layar, aksen kuning #E6A817 (terang) / #FFD60A (gelap),
   daftar = judul tebal + tanggal & cuplikan abu-abu. */
const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#000000', muted: '#8E8E93', hair: '#E5E5EA', accent: '#E6A817', bar: '#F2F2F7', search: '#E9E9EB' },
  gelap: { bg: '#000000', fg: '#FFFFFF', muted: '#8E8E93', hair: '#38383A', accent: '#FFD60A', bar: '#1C1C1E', search: '#2C2C2E' },
};

const SVG_CHEV = '<svg width="12" height="21" viewBox="0 0 13 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 3.5 4 12l6.5 8.5"/></svg>';
const SVG_SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
const SVG_SEARCH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const SVG_COMPOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
const SVG_MIC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><line x1="12" y1="18" x2="12" y2="21.5"/></svg>';
const SVG_CHECKLIST = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="6" r="2.4"/><circle cx="5" cy="12" r="2.4"/><circle cx="5" cy="18" r="2.4"/><path d="M11 6h10M11 12h10M11 18h10"/></svg>';
const SVG_TABLE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9.5 10v10M15.5 10v10"/></svg>';
const SVG_CAM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
const SVG_PEN = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>';

const SAMPLE_LIST =
  'Ide beat baru|15/11/2026|Coba chord Am - F - C - G, tempo 128...\n' +
  'Belanja minggu ini|14/11/2026|Susu, telur, roti, kopi...\n' +
  'Lirik lagu|12/11/2026|Di ujung malam yang sunyi...';
const SAMPLE_BODY =
  'Coba chord Am - F - C - G, tempo 128.\n' +
  '\n' +
  '[x] Bikin drum pattern\n' +
  '[x] Rekam melodi piano\n' +
  '[ ] Mixing & mastering\n' +
  '[ ] Upload ke SoundCloud';

/* Baris daftar: Judul|tanggal|cuplikan */
function parseList(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line.split('|').map((s) => s.trim());
    out.push({ title: parts[0] || 'Tanpa judul', date: parts[1] || '', prev: parts[2] || '' });
  });
  return out;
}

/* Isi catatan: baris "[ ] ..." / "[x] ..." jadi checklist. */
function bodyHtml(text, accent) {
  const lines = String(text == null ? '' : text).split('\n');
  let html = '', inList = false;
  lines.forEach((raw) => {
    const m = raw.match(/^\s*\[( |x|X)\]\s*(.*)$/);
    if (m) {
      if (!inList) { html += '<div style="margin:6px 0">'; inList = true; }
      const done = m[1].toLowerCase() === 'x';
      html += '<div style="display:flex;gap:10px;align-items:flex-start;padding:4px 0">' +
        '<span style="flex:none;width:22px;height:22px;border-radius:50%;margin-top:1px;display:inline-flex;align-items:center;justify-content:center;' +
        (done ? 'background:' + accent + ';color:#fff' : 'border:1.8px solid #8E8E93') + '">' +
        (done ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' : '') +
        '</span><span' + (done ? ' style="text-decoration:line-through;opacity:.55"' : '') + '>' + T.esc(m[2]) + '</span></div>';
    } else {
      if (inList) { html += '</div>'; inList = false; }
      html += raw.trim() === '' ? '<div style="height:12px"></div>' : '<div>' + T.esc(raw) + '</div>';
    }
  });
  if (inList) html += '</div>';
  return html;
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fni-ctl{display:grid;gap:10px;margin-bottom:12px}
.fni-phone{max-width:380px;margin:14px auto;border-radius:28px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fni-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 18px 0 26px}
.fni-bigtitle{font-size:34px;font-weight:700;letter-spacing:.2px;padding:6px 20px 0;line-height:1.1}
.fni-count{font-size:14px;padding:4px 20px 10px}
.fni-row{padding:11px 20px;display:block}
.fni-row + .fni-row{border-top:1px solid var(--fni-hair)}
.fni-rtitle{font-size:16px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fni-rsub{font-size:14px;line-height:1.35;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fni-rsub b{font-weight:500}
.fni-bottombar{display:flex;align-items:center;gap:10px;padding:10px 16px 6px}
.fni-search{flex:1;display:flex;align-items:center;gap:7px;border-radius:10px;padding:9px 12px;font-size:16px}
.fni-compose{flex:none;display:flex;align-items:center;justify-content:center;width:38px;height:38px}
.fni-home{display:flex;justify-content:center;align-items:center;height:22px}
.fni-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fni-dark .fni-home i{background:rgba(255,255,255,.4)}
.fni-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px}
.fni-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fni-topbar{display:flex;align-items:center;justify-content:space-between;padding:6px 14px 4px}
.fni-back{display:flex;align-items:center;gap:6px;font-size:17px}
.fni-tright{display:flex;align-items:center;gap:22px}
.fni-date{text-align:center;font-size:13px;padding:8px 20px 4px}
.fni-title{font-size:28px;font-weight:700;line-height:1.2;padding:6px 20px 2px;overflow-wrap:break-word}
.fni-body{font-size:17px;line-height:1.45;padding:8px 20px 16px;min-height:300px;overflow-wrap:break-word}
.fni-toolbar{display:flex;align-items:center;justify-content:space-around;padding:10px 20px 8px;border-top:1px solid var(--fni-hair)}
.fni-toolbar span{display:flex;align-items:center}
.fni-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fni-hint code{font-family:monospace;font-size:11.5px}
.fni-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fni-ctl"></div>');
  const selMode = T.select([['daftar', 'Daftar catatan'], ['satu', 'Satu catatan']], 'daftar');
  const selTheme = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const taList = T.ta(6, 'Judul|tanggal|cuplikan (satu baris = satu catatan)', SAMPLE_LIST);
  const inTitle = T.input('text', 'Judul catatan', 'Ide beat baru');
  const inDate = T.input('text', 'Tanggal & jam', '15 November 2026 pukul 09.41');
  const taBody = T.ta(8, 'Isi catatan… (pakai [ ] / [x] untuk checklist)', SAMPLE_BODY);

  const listField = T.field('Daftar catatan', taList, 'Format per baris: Judul|tanggal|cuplikan. Contoh: Ide beat baru|15/11/2026|Coba chord Am...');
  const titleField = T.field('Judul catatan', inTitle);
  const dateField = T.field('Tanggal & jam', inDate);
  const bodyField = T.field('Isi catatan', taBody, 'Baris "[ ] ..." jadi kotak checklist kosong, "[x] ..." jadi checklist tercoret.');
  ctl.appendChild(T.field('Tampilan', selMode));
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(listField);
  ctl.appendChild(titleField);
  ctl.appendChild(dateField);
  ctl.appendChild(bodyField);
  ctl.appendChild(T.el('<div class="fni-hint">iPhone saja — aplikasi Catatan memang khusus iPhone. Kolom cari tampil di bawah layar sesuai iOS 26.</div>'));

  const phone = T.el('<div class="fni-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      selMode.value = 'daftar'; selTheme.value = 'terang';
      taList.value = SAMPLE_LIST;
      inTitle.value = 'Ide beat baru';
      inDate.value = '15 November 2026 pukul 09.41';
      taBody.value = SAMPLE_BODY;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-notes-iphone.png'), true)
  );

  function draw() {
    const dark = selTheme.value === 'gelap';
    const th = dark ? THEMES.gelap : THEMES.terang;
    const isList = selMode.value === 'daftar';
    listField.style.display = isList ? '' : 'none';
    titleField.style.display = isList ? 'none' : '';
    dateField.style.display = isList ? 'none' : '';
    bodyField.style.display = isList ? 'none' : '';

    const sbHtml = '<div class="fni-sb" style="background:' + th.bg + ';color:' + th.fg + '">' +
      T.sysbar('iphone', null, dark) + '</div>';

    let body = '';
    if (isList) {
      const rows = parseList(taList.value);
      const rowsHtml = rows.map((r) =>
        '<div class="fni-row"><div class="fni-rtitle">' + T.esc(r.title) + '</div>' +
        '<div class="fni-rsub" style="color:' + th.muted + '">' +
        (r.date ? '<b style="color:' + th.fg + '">' + T.esc(r.date) + '</b>  ' : '') + T.esc(r.prev) + '</div></div>'
      ).join('') || '<div class="fni-row"><div class="fni-rsub" style="color:' + th.muted + '">Belum ada catatan</div></div>';
      body = '<div class="fni-bigtitle" style="color:' + th.fg + '">Catatan</div>' +
        '<div class="fni-count" style="color:' + th.muted + '">' + rows.length + ' Catatan</div>' +
        '<div style="padding:0 0 8px">' + rowsHtml + '</div>' +
        '<div class="fni-bottombar" style="background:' + th.bg + '">' +
        '<div class="fni-search" style="background:' + th.search + ';color:' + th.muted + '">' + SVG_SEARCH + '<span>Cari</span>' +
        '<span style="margin-left:auto;display:flex">' + SVG_MIC + '</span></div>' +
        '<span class="fni-compose" style="color:' + th.accent + '">' + SVG_COMPOSE + '</span></div>';
    } else {
      body = '<div class="fni-topbar" style="color:' + th.accent + '">' +
        '<span class="fni-back">' + SVG_CHEV + '<span>Catatan</span></span>' +
        '<span class="fni-tright"><span style="display:flex">' + SVG_SHARE + '</span><span style="display:flex;color:' + th.accent + '">' + SVG_MORE + '</span></span></div>' +
        '<div class="fni-date" style="color:' + th.muted + '">' + T.esc(inDate.value.trim() || 'Hari ini') + '</div>' +
        '<div class="fni-title" style="color:' + th.fg + '">' + T.esc(inTitle.value.trim() || 'Tanpa judul') + '</div>' +
        '<div class="fni-body" style="color:' + th.fg + '">' + bodyHtml(taBody.value, th.accent) + '</div>' +
        '<div class="fni-toolbar" style="color:' + th.muted + '"><span style="font-weight:700;font-size:17px">Aa</span>' +
        '<span>' + SVG_CHECKLIST + '</span><span>' + SVG_TABLE + '</span><span>' + SVG_CAM + '</span><span>' + SVG_PEN + '</span></div>';
    }

    phone.className = 'fni-phone' + (dark ? ' fni-dark' : '');
    phone.style.background = th.bg;
    phone.style.color = th.fg;
    phone.style.setProperty('--fni-hair', th.hair);
    phone.innerHTML = sbHtml + body + '<div class="fni-home" style="background:' + th.bg + '"><i></i></div>' + '<div class="fni-pranktag-wrap"><span class="fni-pranktag">palsu · cuma prank</span></div>';
  }

  [selMode, selTheme, taList, inTitle, inDate, taBody].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fni-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan catatan iPhone asli.') + '</div>'));
  draw();
}
