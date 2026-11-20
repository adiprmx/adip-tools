import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-status-wa',
  name: 'Fake Status WA',
  cat: 'fakesos',
  icon: '🟢',
  desc: 'Bikin mockup status WhatsApp palsu: penonton, like, balasan status + unduh PNG.',
  keywords: 'whatsapp,status,story,penonton,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Status WA (viewer milik sendiri): foto/latar teks penuh layar, bar
   progres di atas, header avatar + nama + waktu, kolom balas + hati,
   lembar penonton (daftar nama + jumlah like). */
const GRADASI = {
  hijau: { label: 'Hijau WA', bg: 'linear-gradient(160deg,#075E54,#128C7E,#25D366)' },
  senja: { label: 'Senja', bg: 'linear-gradient(160deg,#F59E0B,#EF4444,#7C3AED)' },
  laut: { label: 'Laut', bg: 'linear-gradient(160deg,#06B6D4,#2563EB,#1E1B4B)' },
  gelap: { label: 'Gelap', bg: 'linear-gradient(160deg,#374151,#111827)' },
};

export function parsePenonton(text) {
  return String(text).split('\n').map((s) => s.trim()).filter(Boolean);
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_HEART = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_EYE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fswa-ctl{display:grid;gap:10px;margin-bottom:12px}
.fswa-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#000;font-family:Roboto,"Segoe UI",system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fswa-sb{position:absolute;top:0;left:0;right:0;z-index:3;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;color:#fff}
.fswa-stage{position:relative;height:600px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.fswa-stage img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fswa-teks{position:relative;z-index:1;color:#fff;font-size:28px;font-weight:700;text-align:center;padding:0 28px;line-height:1.35;text-shadow:0 2px 12px rgba(0,0,0,.4);overflow-wrap:break-word}
.fswa-prog{position:absolute;top:52px;left:10px;right:10px;z-index:3;display:flex;gap:4px}
.fswa-prog i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.4);display:block;overflow:hidden}
.fswa-prog i b{display:block;height:100%;background:#fff}
.fswa-hd{position:absolute;top:64px;left:0;right:0;z-index:3;display:flex;align-items:center;padding:0 10px 0 4px}
.fswa-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center}
.fswa-av{width:38px;height:38px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;overflow:hidden;flex:none;border:2px solid #25D366}
.fswa-av img{width:100%;height:100%;object-fit:cover;display:block}
.fswa-nm{flex:1;min-width:0;margin-left:9px;color:#fff}
.fswa-nm b{display:block;font-size:16px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fswa-nm span{display:block;font-size:13px;color:rgba(255,255,255,.85);text-shadow:0 1px 4px rgba(0,0,0,.6)}
.fswa-bot{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:12px}
.fswa-reply{display:flex;align-items:center;gap:10px}
.fswa-pill{flex:1;border:1px solid rgba(255,255,255,.5);border-radius:24px;min-height:46px;display:flex;align-items:center;padding:0 16px;color:#fff;font-size:15px}
.fswa-views{margin-top:12px;text-align:center;color:#fff;font-size:13.5px;display:flex;align-items:center;justify-content:center;gap:6px;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.fswa-sheet{background:#111B21;color:#E9EDEF;padding:14px 16px 10px}
.fswa-sheet h3{font-size:14px;font-weight:600;margin:0 0 4px;display:flex;align-items:center;gap:6px}
.fswa-sheet .fswa-like{font-size:13px;color:#8696A0;margin:0 0 10px}
.fswa-viewer{display:flex;align-items:center;gap:11px;padding:7px 0}
.fswa-vav{width:40px;height:40px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;overflow:hidden;flex:none}
.fswa-viewer b{flex:1;font-size:15.5px;font-weight:400;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fswa-viewer span{font-size:13px;color:#8696A0}
.fswa-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#111B21}
.fswa-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(255,255,255,.4)}
.fswa-home{display:flex;justify-content:center;align-items:center;height:20px;background:#111B21}
.fswa-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(255,255,255,.4)}
.fswa-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#111B21}
.fswa-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fswa-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fswa-ctl"></div>');
  const inNama = T.input('text', 'Nama pemilik status', 'Adip');
  const inWaktu = T.input('text', 'Waktu posting', '2 jam lalu');
  const inTeks = T.input('text', 'Teks status', 'Beat baru rilis minggu ini! 🎧');
  const inLike = T.input('text', 'Jumlah like', '24');
  const inSeg = T.input('number', 'Jumlah story (1-8)', '3');
  inSeg.min = '1'; inSeg.max = '8';
  const inAktif = T.input('number', 'Story yang sedang dibuka', '1');
  inAktif.min = '1';
  const inProg = T.input('range', '', '65');
  inProg.min = '0'; inProg.max = '100';
  const fldProg = T.field('Story ini sudah jalan (65%)', inProg, 'Seberapa jauh story yang sedang dibuka sudah berjalan.');
  const labProg = fldProg.querySelector('label');
  const selGrad = T.select(Object.keys(GRADASI).map((k) => [k, GRADASI[k].label]), 'hijau');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const taPenonton = T.ta(6, 'Satu baris = satu penonton', 'Rizky\nDina\nSari\nBudi\nMama');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let fotoUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { fotoUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  const btnFoto = T.btn('📷 Upload Foto Status', () => fi.click());

  ctl.appendChild(T.field('Nama pemilik status', inNama));
  ctl.appendChild(T.field('Waktu posting', inWaktu));
  ctl.appendChild(T.field('Teks status', inTeks, 'Teks tampil di tengah layar, di atas foto bila ada.'));
  ctl.appendChild(T.field('Jumlah like', inLike));
  ctl.appendChild(T.field('Latar (bila tanpa foto)', selGrad));
  const segRow = T.el('<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>');
  segRow.appendChild(T.field('Jumlah story', inSeg, '1 sampai 8 segmen.'));
  segRow.appendChild(T.field('Story yang dibuka', inAktif, 'Dihitung dari kiri. Bila melebihi jumlah, dipakai yang terakhir.'));
  ctl.appendChild(segRow);
  ctl.appendChild(fldProg);
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Penonton (satu baris = satu)', taPenonton));
  ctl.appendChild(btnFoto);

  const phone = T.el('<div class="fswa-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNama.value = 'Adip'; inWaktu.value = '2 jam lalu';
      inTeks.value = 'Beat baru rilis minggu ini! 🎧'; inLike.value = '24';
      selGrad.value = 'hijau'; inSeg.value = '3'; inAktif.value = '1'; inProg.value = '65';
      labProg.textContent = 'Story ini sudah jalan (65%)';
      taPenonton.value = 'Rizky\nDina\nSari\nBudi\nMama';
      fotoUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-status-wa.png'), true)
  );

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nama = inNama.value.trim() || 'Kamu';
    const waktu = inWaktu.value.trim();
    const teks = inTeks.value.trim();
    const like = inLike.value.trim() || '0';
    const grad = GRADASI[selGrad.value] || GRADASI.hijau;
    const penonton = parsePenonton(taPenonton.value);
    const totalSeg = Math.max(1, Math.min(8, parseInt(inSeg.value, 10) || 3));
    const segAktif = Math.max(1, Math.min(totalSeg, parseInt(inAktif.value, 10) || 1));
    const progPersen = Math.max(0, Math.min(100, parseInt(inProg.value, 10) || 0));
    let progHtml = '<div class="fswa-prog">';
    for (let i = 1; i <= totalSeg; i++) {
      const w = i < segAktif ? 100 : (i === segAktif ? progPersen : 0);
      progHtml += '<i>' + (w > 0 ? '<b style="width:' + w + '%"></b>' : '') + '</i>';
    }
    progHtml += '</div>';

    let viewersHtml = '';
    penonton.forEach((p) => {
      viewersHtml += '<div class="fswa-viewer"><div class="fswa-vav" style="background:' + utils.avaColor(p) + '">' + T.esc((p[0] || '?').toUpperCase()) + '</div>' +
        '<b>' + T.esc(p) + '</b><span>❤️</span></div>';
    });

    const sbHtml = '<div class="fswa-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>';
    const stageHtml = '<div class="fswa-stage" style="background:' + grad.bg + '">' +
      (fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : '') +
      (teks ? '<div class="fswa-teks">' + T.esc(teks) + '</div>' : '') +
      sbHtml +
      progHtml +
      '<div class="fswa-hd"><button class="fswa-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<div class="fswa-av" style="background:' + utils.avaColor(nama) + '">' + T.esc((nama[0] || '?').toUpperCase()) + '</div>' +
      '<div class="fswa-nm"><b>' + T.esc(nama) + '</b>' + (waktu ? '<span>' + T.esc(waktu) + '</span>' : '') + '</div>' +
      '<span style="display:flex">' + SVG_MORE + '</span></div>' +
      '<div class="fswa-bot"><div class="fswa-reply"><div class="fswa-pill">Balas</div><span style="display:flex">' + SVG_HEART + '</span></div>' +
      '<div class="fswa-views">' + SVG_EYE + ' Dilihat oleh ' + penonton.length + ' orang</div></div></div>';
    const sheetHtml = '<div class="fswa-sheet"><h3>' + SVG_EYE + ' Dilihat oleh ' + penonton.length + ' orang</h3>' +
      '<p class="fswa-like">❤️ ' + T.esc(like) + ' suka</p>' + viewersHtml + '</div>';

    phone.className = 'fswa-phone';
    phone.innerHTML = stageHtml + sheetHtml +
      (isIPh ? '<div class="fswa-home"><i></i></div>' : '<div class="fswa-nav"><i></i></div>') +
      '<div class="fswa-pranktag-wrap"><span class="fswa-pranktag">palsu · cuma prank</span></div>';
  }

  [inNama, inWaktu, inTeks, inLike, selGrad, selPlatform, selBrand, taPenonton, inSeg, inAktif, inProg].forEach((el) => {
    el.addEventListener('input', () => { labProg.textContent = 'Story ini sudah jalan (' + (parseInt(inProg.value, 10) || 0) + '%)'; draw(); });
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fswa-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan status WhatsApp asli.') + '</div>'));
  draw();
}
