import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js';

export const meta = {
  id: 'fake-screen-time-iphone',
  name: 'Fake Screen Time iPhone',
  cat: 'fakesos',
  icon: '📊',
  desc: 'Bikin screenshot Screen Time iPhone palsu: grafik harian/mingguan, aplikasi teratas, notifikasi + unduh PNG.',
  keywords: 'iphone,screen time,ios,apple,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Screen Time iOS: judul besar "Screen Time", rata-rata harian besar,
   grafik batang 7 hari, daftar aplikasi teratas dengan bar warna,
   jumlah angkat (pickup) + notifikasi, aksen biru #007AFF. */

// Parser + format durasi screen time tinggal di modul bersama
// js/screen-time.js (kanonis, G4 C1G4-R; dipakai Android + iOS).
import { parseApps, parseMinggu, totalMenit, fmtDurasi } from '../../screen-time.js';
export { parseApps, parseMinggu, totalMenit, fmtDurasi } from '../../screen-time.js';




const WARNA_APP = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5AC8FA', '#FFCC00', '#8E8E93'];
const SAMPLE_APPS =
  'TikTok|96\n' +
  'Instagram|74\n' +
  'YouTube|58\n' +
  'WhatsApp|42\n' +
  'Safari|21';
const SAMPLE_MINGGU =
  'S|204\n' +
  'S|268\n' +
  'R|189\n' +
  'K|312\n' +
  'J|245\n' +
  'S|398\n' +
  'M|356';

const SVG_CHEV = '<svg width="12" height="21" viewBox="0 0 13 24" fill="none" stroke="#007AFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5 4 12l6.5 8.5"/></svg>';
const SVG_HAND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>';
const SVG_BELL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
const SVG_CLOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fsti-ctl{display:grid;gap:10px;margin-bottom:12px}
.fsti-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#F2F2F7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fsti-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#F2F2F7;color:#000}
.fsti-hd{display:flex;align-items:center;height:44px;padding:0 14px;background:#F2F2F7;color:#007AFF;font-size:17px}
.fsti-hd span{margin-left:4px}
.fsti-title{font-size:32px;font-weight:700;color:#000;padding:2px 16px 8px}
.fsti-card{background:#fff;border-radius:12px;margin:0 14px 14px;padding:16px}
.fsti-card h3{font-size:13px;font-weight:600;color:#8E8E93;text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px}
.fsti-big{font-size:34px;font-weight:700;color:#000;line-height:1.1}
.fsti-sub{font-size:14px;color:#8E8E93;margin-top:3px}
.fsti-tabs{display:flex;background:#E9E9EB;border-radius:9px;padding:2px;margin:12px 0 4px}
.fsti-tab{flex:1;text-align:center;font-size:14px;font-weight:600;padding:6px 0;border-radius:7px;color:#000}
.fsti-tab.on{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.fsti-week{display:flex;align-items:flex-end;gap:8px;height:130px;padding:10px 2px 0}
.fsti-day{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.fsti-day i{display:block;width:100%;max-width:26px;border-radius:5px 5px 0 0;background:#007AFF}
.fsti-day span{font-size:11.5px;color:#8E8E93;margin-top:6px}
.fsti-app{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F2F2F7}
.fsti-app:last-child{border-bottom:0}
.fsti-dot{width:10px;height:10px;border-radius:3px;flex:none}
.fsti-app b{flex:1;font-size:15.5px;font-weight:400;color:#000;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fsti-app span{font-size:15px;color:#8E8E93;flex:none}
.fsti-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid #F2F2F7}
.fsti-row:last-child{border-bottom:0}
.fsti-row .fsti-ic{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;flex:none}
.fsti-row b{flex:1;font-size:15.5px;font-weight:400;color:#000}
.fsti-row span{font-size:15px;color:#8E8E93}
.fsti-link{color:#007AFF;font-size:15px;text-align:center;padding:4px 0 2px}
.fsti-home{display:flex;justify-content:center;align-items:center;height:20px;background:#F2F2F7}
.fsti-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fsti-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#F2F2F7}
.fsti-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fsti-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fsti-ctl"></div>');
  const selMode = T.select([['minggu', 'Minggu ini'], ['hari', 'Hari ini']], 'minggu');
  const inAngkat = T.input('text', 'Jumlah angkat (pickup)', '112');
  const inNotif = T.input('text', 'Jumlah notifikasi', '187');
  const taApps = T.ta(6, 'Satu baris = satu aplikasi. Format: Nama|menit', SAMPLE_APPS);
  const taMinggu = T.ta(7, 'Satu baris = satu hari. Format: Huruf|menit', SAMPLE_MINGGU);

  ctl.appendChild(T.field('Tampilan', selMode));
  ctl.appendChild(T.field('Jumlah angkat', inAngkat));
  ctl.appendChild(T.field('Jumlah notifikasi', inNotif));
  ctl.appendChild(T.field('Aplikasi (satu baris = satu)', taApps));
  ctl.appendChild(T.field('Mingguan (satu baris = satu hari)', taMinggu));

  const phone = T.el('<div class="fsti-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      selMode.value = 'minggu'; inAngkat.value = '112'; inNotif.value = '187';
      taApps.value = SAMPLE_APPS; taMinggu.value = SAMPLE_MINGGU;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-screen-time-iphone.png'), true)
  );

  function draw() {
    const mingguMode = selMode.value === 'minggu';
    const apps = parseApps(taApps.value);
    const minggu = parseMinggu(taMinggu.value);
    const totalHari = totalMenit(apps);
    const totalMinggu = minggu.reduce((a, b) => a + b.menit, 0);
    const rata = minggu.length ? Math.round(totalMinggu / minggu.length) : 0;
    const tampil = mingguMode ? rata : totalHari;
    const maxMinggu = Math.max(1, ...minggu.map((d) => d.menit));

    let appsHtml = '';
    apps.forEach((a, i) => {
      const c = WARNA_APP[i % WARNA_APP.length];
      appsHtml += '<div class="fsti-app"><span class="fsti-dot" style="background:' + c + '"></span><b>' + T.esc(a.nama) + '</b><span>' + fmtDurasi(a.menit) + '</span></div>';
    });
    let weekHtml = '';
    minggu.forEach((d) => {
      const h = Math.max(4, Math.round((d.menit / maxMinggu) * 92));
      weekHtml += '<div class="fsti-day"><i style="height:' + h + 'px"></i><span>' + T.esc(d.hari) + '</span></div>';
    });

    const sbHtml = '<div class="fsti-sb">' + T.sysbar('iphone', 'xiaomi', false) + '</div>';
    const hdHtml = '<div class="fsti-hd">' + SVG_CHEV + '<span>Pengaturan</span></div>';
    const bodyHtml = '<div class="fsti-title">Screen Time</div>' +
      '<div class="fsti-card"><h3>Rata-rata harian</h3><div class="fsti-big">' + fmtDurasi(tampil) + '</div>' +
      '<div class="fsti-sub">' + (mingguMode ? 'Minggu ini • total ' + fmtDurasi(totalMinggu) : 'Hari ini') + '</div>' +
      '<div class="fsti-tabs"><div class="fsti-tab' + (mingguMode ? '' : ' on') + '">Hari</div><div class="fsti-tab' + (mingguMode ? ' on' : '') + '">Minggu</div></div>' +
      '<div class="fsti-week">' + weekHtml + '</div></div>' +
      '<div class="fsti-card"><h3>Paling sering digunakan</h3>' + appsHtml + '</div>' +
      '<div class="fsti-card">' +
      '<div class="fsti-row"><span class="fsti-ic" style="background:#007AFF">' + SVG_HAND + '</span><b>Angkat</b><span>' + T.esc(inAngkat.value.trim() || '0') + '</span></div>' +
      '<div class="fsti-row"><span class="fsti-ic" style="background:#FF9500">' + SVG_BELL + '</span><b>Notifikasi</b><span>' + T.esc(inNotif.value.trim() || '0') + '</span></div>' +
      '<div class="fsti-row"><span class="fsti-ic" style="background:#34C759">' + SVG_CLOCK + '</span><b>Waktu layar hari ini</b><span>' + fmtDurasi(totalHari) + '</span></div></div>' +
      '<div class="fsti-link">Lihat Semua Aktivitas</div>';

    phone.className = 'fsti-phone';
    phone.innerHTML = sbHtml + hdHtml + bodyHtml +
      '<div class="fsti-home"><i></i></div>' +
      '<div class="fsti-pranktag-wrap"><span class="fsti-pranktag">palsu · cuma prank</span></div>';
  }

  [selMode, inAngkat, inNotif, taApps, taMinggu].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fsti-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan data Screen Time asli.') + '</div>'));
  draw();
}
