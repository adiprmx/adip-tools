import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js';

export const meta = {
  id: 'fake-screen-time-android',
  name: 'Fake Screen Time Android',
  cat: 'fakesos',
  icon: '⏱️',
  desc: 'Bikin screenshot Digital Wellbeing Android palsu: cincin screen time, unlock, dashboard mingguan + unduh PNG.',
  keywords: 'android,screen time,digital wellbeing,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Digital Wellbeing Android: cincin progres (SVG stroke-dasharray),
   total waktu layar hari ini, jumlah buka kunci + notifikasi, daftar
   aplikasi dengan bar, grafik batang mingguan. Warna Material teal. */

// Parser + format durasi screen time tinggal di modul bersama
// js/screen-time.js (kanonis, G4 C1G4-R; dipakai Android + iOS).
import { parseApps, parseMinggu, totalMenit, fmtDurasi } from '../../screen-time.js';
export { parseApps, parseMinggu, totalMenit, fmtDurasi } from '../../screen-time.js';




const WARNA_APP = ['#0B57D0', '#146C2E', '#B3266B', '#C25100', '#6B4EAB', '#006A6A', '#8C4A03', '#3C4043'];
const SAMPLE_APPS =
  'TikTok|96\n' +
  'Instagram|74\n' +
  'YouTube|58\n' +
  'WhatsApp|42\n' +
  'Chrome|21';
const SAMPLE_MINGGU =
  'Sen|204\n' +
  'Sel|268\n' +
  'Rab|189\n' +
  'Kam|312\n' +
  'Jum|245\n' +
  'Sab|398\n' +
  'Min|356';

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_UNLOCK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.9-1"/></svg>';
const SVG_BELL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fsta-ctl{display:grid;gap:10px;margin-bottom:12px}
.fsta-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#FEFBFF;font-family:Roboto,"Segoe UI",system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fsta-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#FEFBFF;color:#1C1B1F}
.fsta-hd{display:flex;align-items:center;height:56px;padding:0 10px 0 2px;background:#FEFBFF;color:#1C1B1F}
.fsta-bk{background:none;border:0;padding:10px 6px 10px 10px;cursor:pointer;display:flex;align-items:center;color:#1C1B1F}
.fsta-hd b{flex:1;font-size:20px;font-weight:500}
.fsta-hic{display:flex;align-items:center;gap:18px;padding-right:8px;flex:none}
.fsta-body{padding:4px 16px 12px}
.fsta-ring{display:flex;flex-direction:column;align-items:center;padding:10px 0 6px;position:relative}
.fsta-ringtxt{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
.fsta-ringtxt b{display:block;font-size:30px;font-weight:500;color:#1C1B1F}
.fsta-ringtxt span{display:block;font-size:13px;color:#49454F}
.fsta-tgl{text-align:center;font-size:13.5px;color:#49454F;margin-top:2px}
.fsta-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
.fsta-card{background:#F3EDF7;border-radius:16px;padding:14px}
.fsta-card .fsta-ic{color:#0B57D0;display:flex;margin-bottom:8px}
.fsta-card b{display:block;font-size:22px;font-weight:500;color:#1C1B1F}
.fsta-card span{font-size:13px;color:#49454F}
.fsta-sec{margin-top:20px}
.fsta-sec h3{font-size:15px;font-weight:500;color:#1C1B1F;margin:0 0 10px}
.fsta-app{display:flex;align-items:center;gap:12px;padding:7px 0}
.fsta-dot{width:12px;height:12px;border-radius:50%;flex:none}
.fsta-app b{flex:1;font-size:15px;font-weight:400;color:#1C1B1F;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fsta-app span{font-size:14px;color:#49454F;flex:none}
.fsta-bar{height:6px;border-radius:3px;background:#E7E0EC;margin:0 0 4px 24px;overflow:hidden}
.fsta-bar i{display:block;height:100%;border-radius:3px}
.fsta-week{display:flex;align-items:flex-end;gap:10px;height:120px;padding:8px 4px 0;border-bottom:1px solid #E7E0EC}
.fsta-day{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
.fsta-day i{display:block;width:100%;max-width:28px;border-radius:6px 6px 0 0;background:#0B57D0}
.fsta-day span{font-size:11.5px;color:#49454F;margin-top:6px;padding-bottom:6px}
.fsta-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#FEFBFF}
.fsta-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fsta-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#FEFBFF}
.fsta-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fsta-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fsta-ctl"></div>');
  const inTgl = T.input('text', 'Tanggal', 'Kamis, 19 November');
  const inTarget = T.input('text', 'Target harian (menit)', '240');
  const inUnlock = T.input('text', 'Jumlah buka kunci', '87');
  const inNotif = T.input('text', 'Jumlah notifikasi', '142');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'pixel');
  const taApps = T.ta(6, 'Satu baris = satu aplikasi. Format: Nama|menit', SAMPLE_APPS);
  const taMinggu = T.ta(7, 'Satu baris = satu hari. Format: Hari|menit', SAMPLE_MINGGU);

  ctl.appendChild(T.field('Tanggal', inTgl));
  ctl.appendChild(T.field('Target harian (menit)', inTarget));
  ctl.appendChild(T.field('Jumlah buka kunci', inUnlock));
  ctl.appendChild(T.field('Jumlah notifikasi', inNotif));
  ctl.appendChild(T.field('Merk HP', selBrand));
  ctl.appendChild(T.field('Aplikasi (satu baris = satu)', taApps));
  ctl.appendChild(T.field('Mingguan (satu baris = satu hari)', taMinggu));

  const phone = T.el('<div class="fsta-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inTgl.value = 'Kamis, 19 November'; inTarget.value = '240';
      inUnlock.value = '87'; inNotif.value = '142';
      taApps.value = SAMPLE_APPS; taMinggu.value = SAMPLE_MINGGU;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-screen-time-android.png'), true)
  );

  function draw() {
    const apps = parseApps(taApps.value);
    const minggu = parseMinggu(taMinggu.value);
    const total = totalMenit(apps);
    const target = Math.max(1, Number(inTarget.value) || 240);
    const persen = Math.min(100, Math.round((total / target) * 100));
    const maxMinggu = Math.max(1, ...minggu.map((d) => d.menit));
    const maxApp = Math.max(1, ...apps.map((a) => a.menit));
    const C = 2 * Math.PI * 78;
    const dash = (C * persen) / 100;

    let appsHtml = '';
    apps.forEach((a, i) => {
      const w = Math.round((a.menit / maxApp) * 100);
      const c = WARNA_APP[i % WARNA_APP.length];
      appsHtml += '<div class="fsta-app"><span class="fsta-dot" style="background:' + c + '"></span><b>' + T.esc(a.nama) + '</b><span>' + fmtDurasi(a.menit) + '</span></div>' +
        '<div class="fsta-bar"><i style="width:' + w + '%;background:' + c + '"></i></div>';
    });
    let weekHtml = '';
    minggu.forEach((d) => {
      const h = Math.max(4, Math.round((d.menit / maxMinggu) * 84));
      weekHtml += '<div class="fsta-day"><i style="height:' + h + 'px"></i><span>' + T.esc(d.hari) + '</span></div>';
    });

    const sbHtml = '<div class="fsta-sb">' + T.sysbar('android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fsta-hd"><button class="fsta-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<b>Digital Wellbeing</b><div class="fsta-hic">' + SVG_MORE + '</div></div>';
    const bodyHtml = '<div class="fsta-body">' +
      '<div class="fsta-ring"><svg width="180" height="180" viewBox="0 0 180 180">' +
      '<circle cx="90" cy="90" r="78" fill="none" stroke="#E7E0EC" stroke-width="14"/>' +
      '<circle cx="90" cy="90" r="78" fill="none" stroke="#0B57D0" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 90 90)"/>' +
      '</svg><div class="fsta-ringtxt"><b>' + fmtDurasi(total) + '</b><span>waktu layar</span></div></div>' +
      '<div class="fsta-tgl">' + T.esc(inTgl.value.trim() || 'Hari ini') + ' • ' + persen + '% dari target ' + fmtDurasi(target) + '</div>' +
      '<div class="fsta-cards">' +
      '<div class="fsta-card"><span class="fsta-ic">' + SVG_UNLOCK + '</span><b>' + T.esc(inUnlock.value.trim() || '0') + '</b><span>kali buka kunci</span></div>' +
      '<div class="fsta-card"><span class="fsta-ic">' + SVG_BELL + '</span><b>' + T.esc(inNotif.value.trim() || '0') + '</b><span>notifikasi</span></div></div>' +
      '<div class="fsta-sec"><h3>Aplikasi teratas</h3>' + appsHtml + '</div>' +
      '<div class="fsta-sec"><h3>Minggu ini</h3><div class="fsta-week">' + weekHtml + '</div></div></div>';

    phone.className = 'fsta-phone';
    phone.innerHTML = sbHtml + hdHtml + bodyHtml +
      '<div class="fsta-nav"><i></i></div>' +
      '<div class="fsta-pranktag-wrap"><span class="fsta-pranktag">palsu · cuma prank</span></div>';
  }

  [inTgl, inTarget, inUnlock, inNotif, selBrand, taApps, taMinggu].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fsta-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan data Digital Wellbeing asli.') + '</div>'));
  draw();
}
