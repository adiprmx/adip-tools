import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-story-facebook',
  name: 'Fake Story Facebook',
  cat: 'fakesos',
  icon: '📘',
  desc: 'Bikin mockup story Facebook palsu: foto/latar teks, progress bar, kolom balasan + unduh PNG.',
  keywords: 'facebook,story,fb,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Story FB: foto/latar teks penuh layar, progress bar di atas, header
   avatar + nama + waktu, kolom balas + reaksi cepat (❤️😆😮😢😡👍),
   jumlah penonton. Beda dari Fake Story IG (itu tampilan Instagram). */
const GRADASI = {
  biru: { label: 'Biru FB', bg: 'linear-gradient(160deg,#1877F2,#0A4DB3,#081F4D)' },
  senja: { label: 'Senja', bg: 'linear-gradient(160deg,#F59E0B,#EF4444,#7C3AED)' },
  hutan: { label: 'Hutan', bg: 'linear-gradient(160deg,#4ADE80,#15803D,#052E16)' },
  mawar: { label: 'Mawar', bg: 'linear-gradient(160deg,#F9A8D4,#DB2777,#4A044E)' },
};
const REAKSI = ['❤️', '😆', '😮', '😢', '😡', '👍'];

const SVG_CLOSE = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_HEART = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_SEND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
const SVG_EYE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fsfb-ctl{display:grid;gap:10px;margin-bottom:12px}
.fsfb-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#000;font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fsfb-sb{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;color:#fff}
.fsfb-stage{position:relative;height:640px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.fsfb-stage img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fsfb-teks{position:relative;z-index:1;color:#fff;font-size:30px;font-weight:700;text-align:center;padding:0 28px;line-height:1.35;text-shadow:0 2px 12px rgba(0,0,0,.4);overflow-wrap:break-word}
.fsfb-prog{position:absolute;top:52px;left:10px;right:10px;z-index:3;display:flex;gap:4px}
.fsfb-prog i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.4);display:block;overflow:hidden}
.fsfb-prog i b{display:block;height:100%;background:#fff}
.fsfb-hd{position:absolute;top:64px;left:0;right:0;z-index:3;display:flex;align-items:center;padding:0 10px 0 12px}
.fsfb-av{width:40px;height:40px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;overflow:hidden;flex:none;border:2px solid #1877F2}
.fsfb-av img{width:100%;height:100%;object-fit:cover;display:block}
.fsfb-nm{flex:1;min-width:0;margin-left:10px;color:#fff}
.fsfb-nm b{display:block;font-size:16px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fsfb-nm span{display:block;font-size:13px;color:rgba(255,255,255,.85);text-shadow:0 1px 4px rgba(0,0,0,.6)}
.fsfb-hic{display:flex;align-items:center;gap:16px;flex:none}
.fsfb-bot{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:12px}
.fsfb-views{display:flex;align-items:center;gap:6px;color:#fff;font-size:13.5px;margin-bottom:10px;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.fsfb-reaksi{display:flex;gap:10px;margin-bottom:12px}
.fsfb-reaksi span{font-size:26px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))}
.fsfb-reply{display:flex;align-items:center;gap:10px}
.fsfb-pill{flex:1;border:1px solid rgba(255,255,255,.6);border-radius:24px;min-height:46px;display:flex;align-items:center;padding:0 16px;color:#fff;font-size:15px}
.fsfb-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#000}
.fsfb-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(255,255,255,.4)}
.fsfb-home{display:flex;justify-content:center;align-items:center;height:20px;background:#000}
.fsfb-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(255,255,255,.4)}
.fsfb-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#000}
.fsfb-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fsfb-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fsfb-ctl"></div>');
  const inNama = T.input('text', 'Nama pemilik story', 'Adip RMX');
  const inWaktu = T.input('text', 'Waktu posting', '3 jam lalu');
  const inTeks = T.input('text', 'Teks story', 'Akhirnya beat baru selesai! 🎧');
  const inLihat = T.input('text', 'Jumlah penonton', '312');
  const inSeg = T.input('number', 'Jumlah story (1-8)', '3');
  inSeg.min = '1'; inSeg.max = '8';
  const inAktif = T.input('number', 'Story yang sedang dibuka', '1');
  inAktif.min = '1';
  const inProg = T.input('range', '', '45');
  inProg.min = '0'; inProg.max = '100';
  const fldProg = T.field('Story ini sudah jalan (45%)', inProg, 'Seberapa jauh story yang sedang dibuka sudah berjalan.');
  const labProg = fldProg.querySelector('label');
  const selGrad = T.select(Object.keys(GRADASI).map((k) => [k, GRADASI[k].label]), 'biru');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let fotoUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { fotoUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  const btnFoto = T.btn('📷 Upload Foto Story', () => fi.click());

  ctl.appendChild(T.field('Nama pemilik story', inNama));
  ctl.appendChild(T.field('Waktu posting', inWaktu));
  ctl.appendChild(T.field('Teks story', inTeks, 'Teks tampil di tengah layar, di atas foto bila ada.'));
  ctl.appendChild(T.field('Jumlah penonton', inLihat));
  ctl.appendChild(T.field('Latar (bila tanpa foto)', selGrad));
  const segRow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  segRow.appendChild(T.field('Jumlah story', inSeg, '1 sampai 8 segmen.'));
  segRow.appendChild(T.field('Story yang dibuka', inAktif, 'Dihitung dari kiri. Bila melebihi jumlah, dipakai yang terakhir.'));
  ctl.appendChild(segRow);
  ctl.appendChild(fldProg);
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(btnFoto);

  const phone = T.el('<div class="fsfb-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNama.value = 'Adip RMX'; inWaktu.value = '3 jam lalu';
      inTeks.value = 'Akhirnya beat baru selesai! 🎧'; inLihat.value = '312';
      selGrad.value = 'biru'; inSeg.value = '3'; inAktif.value = '1'; inProg.value = '45';
      labProg.textContent = 'Story ini sudah jalan (45%)';
      fotoUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-story-facebook.png'), true)
  );

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nama = inNama.value.trim() || 'Pengguna';
    const waktu = inWaktu.value.trim();
    const teks = inTeks.value.trim();
    const lihat = inLihat.value.trim() || '0';
    const grad = GRADASI[selGrad.value] || GRADASI.biru;
    const totalSeg = Math.max(1, Math.min(8, parseInt(inSeg.value, 10) || 3));
    const segAktif = Math.max(1, Math.min(totalSeg, parseInt(inAktif.value, 10) || 1));
    const progPersen = Math.max(0, Math.min(100, parseInt(inProg.value, 10) || 0));
    let progHtml = '<div class="fsfb-prog">';
    for (let i = 1; i <= totalSeg; i++) {
      const w = i < segAktif ? 100 : (i === segAktif ? progPersen : 0);
      progHtml += '<i>' + (w > 0 ? '<b style="width:' + w + '%"></b>' : '') + '</i>';
    }
    progHtml += '</div>';

    const sbHtml = '<div class="fsfb-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>';
    const stageHtml = '<div class="fsfb-stage" style="background:' + grad.bg + '">' +
      (fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : '') +
      (teks ? '<div class="fsfb-teks">' + T.esc(teks) + '</div>' : '') +
      sbHtml +
      progHtml +
      '<div class="fsfb-hd"><div class="fsfb-av" style="background:' + utils.avaColor(nama) + '">' + T.esc((nama[0] || '?').toUpperCase()) + '</div>' +
      '<div class="fsfb-nm"><b>' + T.esc(nama) + '</b>' + (waktu ? '<span>' + T.esc(waktu) + '</span>' : '') + '</div>' +
      '<div class="fsfb-hic"><span style="display:flex">' + SVG_MORE + '</span><span style="display:flex">' + SVG_CLOSE + '</span></div></div>' +
      '<div class="fsfb-bot"><div class="fsfb-views">' + SVG_EYE + ' Dilihat ' + T.esc(lihat) + ' kali</div>' +
      '<div class="fsfb-reaksi">' + REAKSI.map((r) => '<span>' + r + '</span>').join('') + '</div>' +
      '<div class="fsfb-reply"><div class="fsfb-pill">Balas...</div><span style="display:flex">' + SVG_HEART + '</span><span style="display:flex">' + SVG_SEND + '</span></div></div></div>';

    phone.className = 'fsfb-phone';
    phone.innerHTML = stageHtml +
      (isIPh ? '<div class="fsfb-home"><i></i></div>' : '<div class="fsfb-nav"><i></i></div>') +
      '<div class="fsfb-pranktag-wrap"><span class="fsfb-pranktag">palsu · cuma prank</span></div>';
  }

  [inNama, inWaktu, inTeks, inLihat, selGrad, selPlatform, selBrand, inSeg, inAktif, inProg].forEach((el) => {
    el.addEventListener('input', () => { labProg.textContent = 'Story ini sudah jalan (' + (parseInt(inProg.value, 10) || 0) + '%)'; draw(); });
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fsfb-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan story Facebook asli.') + '</div>'));
  draw();
}
