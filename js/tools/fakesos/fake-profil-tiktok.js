import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-profil-tiktok',
  name: 'Fake Profil TikTok',
  cat: 'fakesos',
  icon: '🎵',
  desc: 'Bikin mockup profil TikTok palsu: follower, like, video tersemat, jumlah view + unduh PNG.',
  keywords: 'tiktok,profil,follower,like,video,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Profil TikTok: avatar bulat, @handle + nama, statistik Mengikuti /
   Pengikut / Suka, tombol Edit profil + Bagikan, tab grid video dengan
   jumlah view + pin di video tersemat. */
const GRAD_VID = [
  'linear-gradient(160deg,#25F4EE,#000000)',
  'linear-gradient(160deg,#FE2C55,#000000)',
  'linear-gradient(160deg,#7C3AED,#25F4EE)',
  'linear-gradient(160deg,#F59E0B,#FE2C55)',
  'linear-gradient(160deg,#059669,#25F4EE)',
  'linear-gradient(160deg,#DB2777,#7C3AED)',
];

// formatHitungan memakai utils.formatHitungan (kanonis, G4 C1G4-R).
export const formatHitungan = utils.formatHitungan;

/* Baris video: Judul|1234 view — awali dengan 📌 untuk tersemat. */
export function parseVideo(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    let pin = false;
    let s = line;
    if (s.startsWith('📌')) { pin = true; s = s.slice(2).trim(); }
    const p = s.lastIndexOf('|');
    const judul = p < 0 ? s : s.slice(0, p).trim();
    const view = p < 0 ? 0 : Number(String(s.slice(p + 1)).replace(/[^0-9]/g, '')) || 0;
    if (judul) out.push({ judul, view, pin });
  });
  return out;
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>';
const SVG_PLAY = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
const SVG_GRID = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
const SVG_HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_VER = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#20D5EC"/><path d="M8.3 12.4l2.6 2.7 5-5.9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fptt-ctl{display:grid;gap:10px;margin-bottom:12px}
.fptt-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fptt-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#fff;color:#000}
.fptt-hd{display:flex;align-items:center;height:48px;padding:0 12px 0 4px;background:#fff;color:#000}
.fptt-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center;color:#000}
.fptt-hd b{flex:1;font-size:17px;font-weight:700;text-align:center}
.fptt-hic{display:flex;align-items:center;gap:18px;padding-right:4px;flex:none}
.fptt-profil{display:flex;flex-direction:column;align-items:center;padding:8px 16px 4px;text-align:center}
.fptt-av{width:96px;height:96px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;overflow:hidden}
.fptt-av img{width:100%;height:100%;object-fit:cover;display:block}
.fptt-handle{font-size:17px;font-weight:700;color:#000;margin-top:10px;display:flex;align-items:center;gap:5px}
.fptt-nama{font-size:14px;color:#161823;margin-top:2px}
.fptt-stats{display:flex;gap:26px;margin-top:14px}
.fptt-stat b{display:block;font-size:17px;font-weight:700;color:#161823;text-align:center}
.fptt-stat span{display:block;font-size:13px;color:#737373;text-align:center}
.fptt-bio{font-size:14.5px;line-height:1.5;color:#161823;margin-top:12px;white-space:pre-wrap;overflow-wrap:break-word}
.fptt-btns{display:flex;gap:8px;margin-top:14px;width:100%}
.fptt-btn{flex:1;background:#F1F1F2;color:#161823;font-size:15px;font-weight:600;border-radius:6px;padding:10px 0;text-align:center}
.fptt-tabs{display:flex;border-bottom:1px solid #EFEFEF;margin-top:14px}
.fptt-tab{flex:1;display:flex;justify-content:center;padding:10px 0;color:#161823;border-bottom:2px solid transparent}
.fptt-tab.on{border-bottom-color:#161823}
.fptt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding-top:2px}
.fptt-vid{position:relative;aspect-ratio:3/4;display:flex;align-items:flex-end;overflow:hidden}
.fptt-vid img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fptt-vid .fptt-vw{position:relative;z-index:1;display:flex;align-items:center;gap:4px;color:#fff;font-size:12.5px;font-weight:600;padding:6px;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.fptt-vid .fptt-pin{position:absolute;top:6px;left:6px;z-index:1;background:rgba(0,0,0,.55);color:#FE2C55;font-size:11px;font-weight:700;padding:3px 7px;border-radius:10px}
.fptt-vid .fptt-vt{position:absolute;bottom:24px;left:6px;right:6px;z-index:1;color:#fff;font-size:11.5px;line-height:1.3;text-shadow:0 1px 4px rgba(0,0,0,.7);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.fptt-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fptt-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fptt-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fptt-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fptt-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fptt-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fptt-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fptt-ctl"></div>');
  const inHandle = T.input('text', 'Username (tanpa @)', 'adip.rmx');
  const inNama = T.input('text', 'Nama tampil', 'Adip RMX');
  const selVer = T.select([['tidak', 'Tanpa verifikasi'], ['ya', 'Terverifikasi']], 'tidak');
  const inBio = T.input('text', 'Bio', 'Produser musik 🎧 | Beat & remix setiap minggu');
  const inMengikuti = T.input('text', 'Mengikuti', '312');
  const inPengikut = T.input('text', 'Pengikut', '128400');
  const inSuka = T.input('text', 'Suka', '2400000');
  const taVideo = T.ta(6, 'Satu baris = satu video. Format: Judul|jumlah view', '📌 Beat remix terbaru|1250000\nCover lagu viral|856000\nBehind the scenes studio|342000\nTutorial mixing 5 menit|198000\nQ&A bareng fans|97000\nVlog hari ini|54000');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { avUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  const btnAvatar = T.btn('📷 Upload Avatar', () => fi.click());

  ctl.appendChild(T.field('Username', inHandle));
  ctl.appendChild(T.field('Nama tampil', inNama));
  ctl.appendChild(T.field('Verifikasi', selVer));
  ctl.appendChild(T.field('Bio', inBio));
  ctl.appendChild(T.field('Mengikuti', inMengikuti));
  ctl.appendChild(T.field('Pengikut', inPengikut));
  ctl.appendChild(T.field('Suka', inSuka));
  ctl.appendChild(T.field('Video (satu baris = satu)', taVideo));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(btnAvatar);

  const phone = T.el('<div class="fptt-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inHandle.value = 'adip.rmx'; inNama.value = 'Adip RMX'; selVer.value = 'tidak';
      inBio.value = 'Produser musik 🎧 | Beat & remix setiap minggu';
      inMengikuti.value = '312'; inPengikut.value = '128400'; inSuka.value = '2400000';
      taVideo.value = '📌 Beat remix terbaru|1250000\nCover lagu viral|856000\nBehind the scenes studio|342000\nTutorial mixing 5 menit|198000\nQ&A bareng fans|97000\nVlog hari ini|54000';
      avUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-tiktok.png'), true)
  );

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const handle = inHandle.value.trim() || 'user';
    const nama = inNama.value.trim() || handle;
    const bio = inBio.value.trim();
    const videos = parseVideo(taVideo.value);
    const avHtml = avUrl ? '<img src="' + avUrl + '" alt="">' : T.esc((nama[0] || '?').toUpperCase());
    const verHtml = selVer.value === 'ya' ? SVG_VER : '';

    let gridHtml = '';
    videos.forEach((v, i) => {
      gridHtml += '<div class="fptt-vid" style="background:' + GRAD_VID[i % GRAD_VID.length] + '">' +
        (v.pin ? '<span class="fptt-pin">📌 Tersemat</span>' : '') +
        '<span class="fptt-vt">' + T.esc(v.judul) + '</span>' +
        '<span class="fptt-vw">' + SVG_PLAY + ' ' + formatHitungan(v.view) + '</span></div>';
    });

    const sbHtml = '<div class="fptt-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fptt-hd"><button class="fptt-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<b>' + T.esc(handle) + '</b><div class="fptt-hic">' + SVG_SHARE + SVG_MORE + '</div></div>';
    const profilHtml = '<div class="fptt-profil">' +
      '<div class="fptt-av" style="background:' + utils.avaColor(nama) + '">' + avHtml + '</div>' +
      '<div class="fptt-handle">@' + T.esc(handle) + ' ' + verHtml + '</div>' +
      '<div class="fptt-nama">' + T.esc(nama) + '</div>' +
      '<div class="fptt-stats">' +
      '<span class="fptt-stat"><b>' + formatHitungan(inMengikuti.value) + '</b><span>Mengikuti</span></span>' +
      '<span class="fptt-stat"><b>' + formatHitungan(inPengikut.value) + '</b><span>Pengikut</span></span>' +
      '<span class="fptt-stat"><b>' + formatHitungan(inSuka.value) + '</b><span>Suka</span></span></div>' +
      (bio ? '<div class="fptt-bio">' + T.esc(bio) + '</div>' : '') +
      '<div class="fptt-btns"><div class="fptt-btn">Edit profil</div><div class="fptt-btn">Bagikan profil</div></div></div>' +
      '<div class="fptt-tabs"><div class="fptt-tab on">' + SVG_GRID + '</div><div class="fptt-tab">' + SVG_HEART + '</div></div>' +
      '<div class="fptt-grid">' + gridHtml + '</div>';

    phone.className = 'fptt-phone';
    phone.innerHTML = sbHtml + hdHtml + profilHtml +
      (isIPh ? '<div class="fptt-home"><i></i></div>' : '<div class="fptt-nav"><i></i></div>') +
      '<div class="fptt-pranktag-wrap"><span class="fptt-pranktag">palsu · cuma prank</span></div>';
  }

  [inHandle, inNama, selVer, inBio, inMengikuti, inPengikut, inSuka, taVideo, selPlatform, selBrand].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fptt-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan profil TikTok asli.') + '</div>'));
  draw();
}
