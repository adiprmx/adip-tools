import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-post-bluesky',
  name: 'Fake Postingan Bluesky',
  cat: 'fakesos',
  icon: '🦋',
  desc: 'Bikin mockup postingan Bluesky palsu: handle, grid gambar, jumlah interaksi + unduh PNG.',
  keywords: 'bluesky,post,handle,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Bluesky: aksen biru #0085FF, tiga tema (terang #FFFFFF, redup #212D3B,
   gelap #161E27), avatar bulat, handle @nama.bsky.social, grid gambar
   1-4, bar interaksi balas/repost/suka. */
const THEMES = {
  terang: { bg: '#FFFFFF', fg: '#0F1419', muted: '#536471', hair: '#EFF3F4', imgBg: '#E8F0FE' },
  redup: { bg: '#212D3B', fg: '#FFFFFF', muted: '#8B98A5', hair: '#2F3F4F', imgBg: '#2F3F4F' },
  gelap: { bg: '#161E27', fg: '#E7E9EA', muted: '#8B98A5', hair: '#2F3336', imgBg: '#2F3336' },
};
const GRAD_IMG = [
  'linear-gradient(135deg,#0085FF,#00C2FF)',
  'linear-gradient(135deg,#7C3AED,#DB2777)',
  'linear-gradient(135deg,#059669,#34D399)',
  'linear-gradient(135deg,#EA580C,#F59E0B)',
];

// formatHitungan memakai utils.formatHitungan (kanonis, G4 C1G4-R).
export const formatHitungan = utils.formatHitungan;

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_REPLY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>';
const SVG_REPOST = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
const SVG_LIKE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_BM = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
const SVG_SHARE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>';
const SVG_BUTTERFLY = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#0085FF" aria-hidden="true"><path d="M12 10.8C10.9 7.5 8.9 4.7 6.3 4.7c-2.2 0-3.7 1.7-3.7 3.9 0 2.7 2.3 4.5 4.6 5.4-1.9.8-3.3 2.2-3.3 4 0 1.9 1.4 3.3 3.2 3.3 2.2 0 3.9-1.8 4.9-4.5 1 2.7 2.7 4.5 4.9 4.5 1.8 0 3.2-1.4 3.2-3.3 0-1.8-1.4-3.2-3.3-4 2.3-.9 4.6-2.7 4.6-5.4 0-2.2-1.5-3.9-3.7-3.9-2.6 0-4.6 2.8-5.7 6.1z"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fpb-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpb-phone{max-width:400px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpb-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px}
.fpb-hd{display:flex;align-items:center;height:52px;padding:0 12px 0 4px;border-bottom:1px solid var(--fpb-hair)}
.fpb-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center}
.fpb-hd b{flex:1;font-size:17px;font-weight:700;text-align:center}
.fpb-post{padding:14px 16px 12px}
.fpb-head{display:flex;align-items:center;gap:10px}
.fpb-av{width:48px;height:48px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700;overflow:hidden;flex:none}
.fpb-av img{width:100%;height:100%;object-fit:cover;display:block}
.fpb-who{flex:1;min-width:0}
.fpb-who b{display:block;font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpb-who span{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpb-text{font-size:17px;line-height:1.45;margin-top:10px;overflow-wrap:break-word;white-space:pre-wrap}
.fpb-grid{display:grid;gap:4px;margin-top:12px;border-radius:14px;overflow:hidden}
.fpb-grid.g1{grid-template-columns:1fr}
.fpb-grid.g2{grid-template-columns:1fr 1fr}
.fpb-grid.g3{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.fpb-grid.g3 .fpb-cell:first-child{grid-row:span 2}
.fpb-grid.g4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.fpb-cell{position:relative;min-height:120px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;font-weight:700;overflow:hidden}
.fpb-grid.g1 .fpb-cell{min-height:220px}
.fpb-cell img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fpb-time{font-size:14px;margin-top:12px}
.fpb-counts{display:flex;gap:18px;padding:12px 0;border-top:1px solid var(--fpb-hair);border-bottom:1px solid var(--fpb-hair);margin-top:12px;font-size:14.5px}
.fpb-counts b{font-weight:700}
.fpb-actions{display:flex;justify-content:space-between;padding:12px 8px 4px}
.fpb-act{display:flex;align-items:center;gap:6px;font-size:14px}
.fpb-nav{display:flex;justify-content:center;padding:4px 0 9px}
.fpb-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(127,127,127,.5)}
.fpb-home{display:flex;justify-content:center;align-items:center;height:20px}
.fpb-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(127,127,127,.5)}
.fpb-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px}
.fpb-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fpb-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fpb-ctl"></div>');
  const inNama = T.input('text', 'Nama tampil', 'Adip RMX');
  const inHandle = T.input('text', 'Handle', 'adip-rmx.bsky.social');
  const inWaktu = T.input('text', 'Waktu posting', '19 Nov 2026, 14:30');
  const inTeks = T.input('text', 'Isi postingan', 'Beat baru udah rilis! Dengerin dan kasih tau pendapat kalian 🎧');
  const selGambar = T.select([['0', 'Tanpa gambar'], ['1', '1 gambar'], ['2', '2 gambar'], ['3', '3 gambar'], ['4', '4 gambar']], '1');
  const inBalas = T.input('text', 'Jumlah balasan', '42');
  const inRepost = T.input('text', 'Jumlah repost', '128');
  const inSuka = T.input('text', 'Jumlah suka', '1204');
  const selTheme = T.select([['terang', 'Terang'], ['redup', 'Redup'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  const fiG = fileInput('image/*');
  fiG.style.display = 'none';
  let avUrl = null, gUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { avUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  fiG.addEventListener('change', () => { if (fiG.files && fiG.files[0]) { gUrl = URL.createObjectURL(fiG.files[0]); draw(); } });

  ctl.appendChild(T.field('Nama tampil', inNama));
  ctl.appendChild(T.field('Handle', inHandle));
  ctl.appendChild(T.field('Waktu posting', inWaktu));
  ctl.appendChild(T.field('Isi postingan', inTeks));
  ctl.appendChild(T.field('Jumlah gambar', selGambar));
  ctl.appendChild(T.field('Jumlah balasan', inBalas));
  ctl.appendChild(T.field('Jumlah repost', inRepost));
  ctl.appendChild(T.field('Jumlah suka', inSuka));
  ctl.appendChild(T.field('Tema', selTheme));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.row(T.btn('📷 Upload Avatar', () => fi.click()), T.btn('📷 Upload Gambar', () => fiG.click())));

  const phone = T.el('<div class="fpb-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNama.value = 'Adip RMX'; inHandle.value = 'adip-rmx.bsky.social';
      inWaktu.value = '19 Nov 2026, 14:30';
      inTeks.value = 'Beat baru udah rilis! Dengerin dan kasih tau pendapat kalian 🎧';
      selGambar.value = '1'; inBalas.value = '42'; inRepost.value = '128'; inSuka.value = '1204';
      selTheme.value = 'terang'; avUrl = null; gUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-post-bluesky.png'), true)
  );

  function draw() {
    const th = THEMES[selTheme.value] || THEMES.terang;
    const dark = selTheme.value !== 'terang';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nama = inNama.value.trim() || 'Pengguna';
    const handle = inHandle.value.trim() || 'user.bsky.social';
    const waktu = inWaktu.value.trim();
    const teks = inTeks.value.trim();
    const nG = Number(selGambar.value) || 0;
    const avHtml = avUrl ? '<img src="' + avUrl + '" alt="">' : T.esc((nama[0] || '?').toUpperCase());

    let gridHtml = '';
    if (nG > 0) {
      let cells = '';
      for (let i = 0; i < nG; i++) {
        const inner = (i === 0 && gUrl) ? '<img src="' + gUrl + '" alt="">' : '<span>🦋</span>';
        cells += '<div class="fpb-cell" style="background:' + GRAD_IMG[i % GRAD_IMG.length] + '">' + inner + '</div>';
      }
      gridHtml = '<div class="fpb-grid g' + nG + '">' + cells + '</div>';
    }

    const sbHtml = '<div class="fpb-sb" style="background:' + th.bg + ';color:' + th.fg + '">' +
      T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>';
    const hdHtml = '<div class="fpb-hd" style="background:' + th.bg + ';color:' + th.fg + '">' +
      '<button class="fpb-bk" type="button" tabindex="-1" style="color:' + th.fg + '">' + SVG_BACK + '</button>' +
      '<b>Post</b><span style="display:flex">' + SVG_BUTTERFLY + '</span></div>';
    const postHtml = '<div class="fpb-post" style="background:' + th.bg + ';color:' + th.fg + '">' +
      '<div class="fpb-head"><div class="fpb-av" style="background:' + utils.avaColor(nama) + '">' + avHtml + '</div>' +
      '<div class="fpb-who"><b>' + T.esc(nama) + '</b><span style="color:' + th.muted + '">@' + T.esc(handle) + '</span></div></div>' +
      (teks ? '<div class="fpb-text">' + T.esc(teks) + '</div>' : '') + gridHtml +
      (waktu ? '<div class="fpb-time" style="color:' + th.muted + '">' + T.esc(waktu) + '</div>' : '') +
      '<div class="fpb-counts"><span><b>' + formatHitungan(inRepost.value) + '</b> <span style="color:' + th.muted + '">Repost</span></span>' +
      '<span><b>' + formatHitungan(inSuka.value) + '</b> <span style="color:' + th.muted + '">Suka</span></span></div>' +
      '<div class="fpb-actions" style="color:' + th.muted + '">' +
      '<span class="fpb-act">' + SVG_REPLY + ' ' + formatHitungan(inBalas.value) + '</span>' +
      '<span class="fpb-act">' + SVG_REPOST + ' ' + formatHitungan(inRepost.value) + '</span>' +
      '<span class="fpb-act">' + SVG_LIKE + ' ' + formatHitungan(inSuka.value) + '</span>' +
      '<span class="fpb-act">' + SVG_BM + '</span><span class="fpb-act">' + SVG_SHARE + '</span></div></div>';

    phone.className = 'fpb-phone';
    phone.style.background = th.bg;
    phone.style.color = th.fg;
    phone.style.setProperty('--fpb-hair', th.hair);
    phone.innerHTML = sbHtml + hdHtml + postHtml +
      (isIPh ? '<div class="fpb-home" style="background:' + th.bg + '"><i></i></div>' : '<div class="fpb-nav" style="background:' + th.bg + '"><i></i></div>') +
      '<div class="fpb-pranktag-wrap" style="background:' + th.bg + '"><span class="fpb-pranktag">palsu · cuma prank</span></div>';
  }

  [inNama, inHandle, inWaktu, inTeks, selGambar, inBalas, inRepost, inSuka, selTheme, selPlatform, selBrand].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(fiG);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fpb-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan postingan Bluesky asli.') + '</div>'));
  draw();
}
