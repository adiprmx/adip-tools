import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js?v=6.12.2';

export const meta = {
  id: 'fake-call-history-iphone',
  name: 'Fake Riwayat Panggilan iPhone',
  cat: 'fakesos',
  icon: '🕘',
  desc: 'Bikin screenshot daftar panggilan terakhir iPhone palsu (tata letak Klasik) + unduh PNG.',
  keywords: 'iphone,telepon,call history,riwayat panggilan,recents,apple,fake,palsu,screenshot,prank,ios',
  since: '6.12.0',
};

/* Tampilan Phone > Recents iOS 26 tata letak Klasik (riset 15 Nov 2026):
   judul besar "Terbaru", segmen Semua/Tak Terjawab, panggilan tak terjawab
   merah, panah masuk/keluar kecil, tombol info (i), tab bar 5 tab. */
const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#000000', muted: '#8E8E93', hair: '#E5E5EA', blue: '#007AFF', red: '#FF3B30', seg: '#767680', segBg: '#E9E9EB' },
  gelap: { bg: '#000000', fg: '#FFFFFF', muted: '#8E8E93', hair: '#38383A', blue: '#0A84FF', red: '#FF453A', seg: '#767680', segBg: '#2C2C2E' },
};

/* Panah kecil ala iOS: masuk = panah ke bawah-kiri, keluar = ke atas-kanan. */
const ARROW_IN = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 5L5 19"/><path d="M5 9v10h10"/></svg>';
const ARROW_OUT = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19L19 5"/><path d="M9 5h10v10"/></svg>';
const INFO_BTN = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="10"/><text x="12" y="16.5" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor" stroke="none" font-family="-apple-system,BlinkMacSystemFont,sans-serif">i</text></svg>';
const SVG_FILTER = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';
const SVG_STAR = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>';
const SVG_CLOCK = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/></svg>';
const SVG_PERSON = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';
const SVG_KEYPAD = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="6" cy="6" r="2.2"/><circle cx="12" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="18" cy="12" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="12" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/></svg>';
const SVG_VOICEMAIL = '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="6.5" cy="12" r="3.5"/><circle cx="17.5" cy="12" r="3.5"/><path d="M10 12h4"/></svg>';

const SAMPLE =
  'Mama|masuk|09.41|ponsel|2\n' +
  'Rizky|keluar|09.15|ponsel\n' +
  '0812-3456-7890|tak terjawab|Kemarin|ponsel\n' +
  'Dika|masuk|Kemarin|FaceTime Video\n' +
  'Kakak|tak terjawab|13/11/2026|ponsel|3\n' +
  'Budi Santoso|keluar|13/11/2026|WhatsApp';

/* Baris: Nama|masuk/keluar/tak terjawab|waktu|label|jumlah */
function parseRows(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line.split('|').map((s) => s.trim());
    const typeRaw = (parts[1] || 'masuk').toLowerCase();
    const type = /tak|miss|tidak/i.test(typeRaw) ? 'missed' : /keluar|out/i.test(typeRaw) ? 'out' : 'in';
    const n = parseInt(parts[4], 10);
    out.push({
      name: parts[0] || 'Tidak dikenal',
      type,
      time: parts[2] || '',
      label: parts[3] || 'ponsel',
      count: n > 1 ? n : 0,
    });
  });
  return out;
}

export function render(root) {
  root.appendChild(T.el(`<style>
.fch-ctl{display:grid;gap:10px;margin-bottom:12px}
.fch-phone{max-width:380px;margin:14px auto;border-radius:28px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fch-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 18px 0 26px}
.fch-navtop{display:flex;align-items:center;justify-content:space-between;padding:2px 16px 0}
.fch-navtop .fch-edit{font-size:17px}
.fch-bigtitle{font-size:34px;font-weight:700;letter-spacing:.2px;padding:2px 20px 8px;line-height:1.1}
.fch-seg{display:flex;justify-content:center;padding:0 20px 10px}
.fch-segbox{display:inline-flex;border-radius:9px;padding:2px;gap:2px}
.fch-segbox span{font-size:13px;font-weight:500;padding:6px 22px;border-radius:7px;white-space:nowrap}
.fch-segbox span.fch-on{background:#fff;color:#000;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.fch-dark .fch-segbox span.fch-on{background:#636366;color:#fff}
.fch-row{display:flex;align-items:center;gap:10px;padding:9px 16px 9px 20px;min-height:56px}
.fch-row + .fch-row{border-top:1px solid var(--fch-hair)}
.fch-rmain{flex:1;min-width:0}
.fch-rname{font-size:17px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fch-rsub{display:flex;align-items:center;gap:5px;font-size:14px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fch-rtime{font-size:15px;flex:none;white-space:nowrap}
.fch-info{flex:none;display:flex;align-items:center}
.fch-tabbar{display:flex;align-items:center;justify-content:space-around;padding:8px 6px 4px;border-top:1px solid var(--fch-hair)}
.fch-tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;font-weight:500;min-width:52px}
.fch-tab svg{display:block}
.fch-home{display:flex;justify-content:center;align-items:center;height:22px}
.fch-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fch-dark .fch-home i{background:rgba(255,255,255,.4)}
.fch-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px}
.fch-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fch-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fch-hint code{font-family:monospace;font-size:11.5px}
.fch-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fch-ctl"></div>');
  const selTheme = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selFilter = T.select([['semua', 'Semua'], ['missed', 'Tak terjawab saja']], 'semua');
  const taRows = T.ta(8, 'Nama|masuk/keluar/tak terjawab|waktu|label|jumlah', SAMPLE);

  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Filter tampilan', selFilter, 'Segmen di atas daftar ikut berubah: Semua / Tak Terjawab.'));
  ctl.appendChild(T.field('Daftar panggilan', taRows, 'Format per baris: Nama|masuk/keluar/tak terjawab|waktu|label|jumlah. Contoh: Mama|masuk|09.41|ponsel|2 — jumlah (2) muncul bila lebih dari 1. Label bebas: ponsel, FaceTime Video, WhatsApp, dll.'));
  ctl.appendChild(T.el('<div class="fch-hint">iPhone saja — tata letak Klasik iOS 26 (tab Terbaru). Panggilan tak terjawab tampil merah seperti aslinya.</div>'));

  const phone = T.el('<div class="fch-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      selTheme.value = 'terang'; selFilter.value = 'semua'; taRows.value = SAMPLE;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-call-history-iphone.png'), true)
  );

  function draw() {
    const dark = selTheme.value === 'gelap';
    const th = dark ? THEMES.gelap : THEMES.terang;
    const onlyMissed = selFilter.value === 'missed';
    const rows = parseRows(taRows.value).filter((r) => !onlyMissed || r.type === 'missed');

    const rowsHtml = rows.map((r) => {
      const missed = r.type === 'missed';
      const arrow = r.type === 'out' ? ARROW_OUT : ARROW_IN;
      const nameColor = missed ? th.red : th.fg;
      const countHtml = r.count > 1 ? ' (' + r.count + ')' : '';
      return '<div class="fch-row">' +
        '<div class="fch-rmain">' +
          '<div class="fch-rname" style="color:' + nameColor + '">' + T.esc(r.name) + countHtml + '</div>' +
          '<div class="fch-rsub" style="color:' + th.muted + '"><span style="display:inline-flex">' + arrow + '</span><span>' + T.esc(r.label) + '</span></div>' +
        '</div>' +
        '<span class="fch-rtime" style="color:' + th.muted + '">' + T.esc(r.time) + '</span>' +
        '<span class="fch-info" style="color:' + th.blue + '">' + INFO_BTN + '</span>' +
      '</div>';
    }).join('') || '<div class="fch-row"><div class="fch-rmain"><div class="fch-rsub" style="color:' + th.muted + '">Tidak ada panggilan</div></div></div>';

    const sbHtml = '<div class="fch-sb" style="background:' + th.bg + ';color:' + th.fg + '">' +
      T.sysbar('iphone', null, dark) + '</div>';

    phone.className = 'fch-phone' + (dark ? ' fch-dark' : '');
    phone.style.background = th.bg;
    phone.style.color = th.fg;
    phone.style.setProperty('--fch-hair', th.hair);
    phone.innerHTML = sbHtml +
      '<div class="fch-navtop" style="color:' + th.blue + '"><span class="fch-edit">Edit</span><span style="display:flex">' + SVG_FILTER + '</span></div>' +
      '<div class="fch-bigtitle" style="color:' + th.fg + '">Terbaru</div>' +
      '<div class="fch-seg"><div class="fch-segbox" style="background:' + th.segBg + '"><span class="' + (!onlyMissed ? 'fch-on' : '') + '" style="color:' + (!onlyMissed ? '' : th.fg) + '">Semua</span><span class="' + (onlyMissed ? 'fch-on' : '') + '" style="color:' + (onlyMissed ? '' : th.fg) + '">Tak Terjawab</span></div></div>' +
      '<div style="padding-bottom:6px">' + rowsHtml + '</div>' +
      '<div class="fch-tabbar" style="color:' + th.muted + '">' +
        '<span class="fch-tab">' + SVG_STAR + '<span>Favorit</span></span>' +
        '<span class="fch-tab" style="color:' + th.blue + '">' + SVG_CLOCK + '<span>Terbaru</span></span>' +
        '<span class="fch-tab">' + SVG_PERSON + '<span>Kontak</span></span>' +
        '<span class="fch-tab">' + SVG_KEYPAD + '<span>Tombol</span></span>' +
        '<span class="fch-tab">' + SVG_VOICEMAIL + '<span>Pesan Suara</span></span>' +
      '</div>' +
      '<div class="fch-home" style="background:' + th.bg + '"><i></i></div>' +
      '<div class="fch-pranktag-wrap"><span class="fch-pranktag">palsu · cuma prank</span></div>';
  }

  [selTheme, selFilter, taRows].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fch-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan riwayat panggilan asli.') + '</div>'));
  draw();
}
