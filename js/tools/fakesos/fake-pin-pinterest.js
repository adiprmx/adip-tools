import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-pin-pinterest',
  name: 'Fake Pin Pinterest',
  cat: 'fakesos',
  icon: '📌',
  desc: 'Bikin mockup pin Pinterest palsu: judul, kreator, reaksi, tombol Save + unduh PNG.',
  keywords: 'pinterest,pin,save,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Pin Pinterest: gambar rasio 2:3 (upload atau gradasi + teks), tombol Save
   merah #E60023, judul + deskripsi, kreator + Follow, reaksi + komentar,
   bar bawah ala aplikasi. */
const GRADASI = {
  senja: { label: 'Senja', bg: 'linear-gradient(160deg,#F59E0B,#EF4444,#7C3AED)', teks: 'Ide Ruang Kerja Minimalis' },
  laut: { label: 'Laut', bg: 'linear-gradient(160deg,#06B6D4,#2563EB,#1E1B4B)', teks: 'Inspirasi Liburan Pantai' },
  hutan: { label: 'Hutan', bg: 'linear-gradient(160deg,#4ADE80,#15803D,#052E16)', teks: 'Tanaman Hias untuk Rumah' },
  mawar: { label: 'Mawar', bg: 'linear-gradient(160deg,#F9A8D4,#DB2777,#4A044E)', teks: 'Ide Dekorasi Kamar' },
};

// formatHitungan memakai utils.formatHitungan (kanonis, G4 C1G4-R).
export const formatHitungan = utils.formatHitungan;

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_CHAT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>';
const SVG_SHARE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_HOME = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.5l9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/></svg>';
const SVG_SEARCH = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
const SVG_PLUS = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const SVG_BELL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fpin-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpin-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpin-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#fff;color:#111}
.fpin-hd{display:flex;align-items:center;height:52px;padding:0 12px 0 4px;background:#fff;color:#111}
.fpin-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center;color:#111}
.fpin-hd b{flex:1;font-size:16px;font-weight:600;text-align:center}
.fpin-hic{display:flex;align-items:center;gap:18px;padding-right:4px;flex:none}
.fpin-img{position:relative;margin:0 12px;border-radius:16px;overflow:hidden;aspect-ratio:2/3;background:#EFEFEF;display:flex;align-items:center;justify-content:center}
.fpin-img img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fpin-imgtxt{position:relative;z-index:1;color:#fff;font-size:26px;font-weight:700;text-align:center;padding:0 24px;line-height:1.3;text-shadow:0 2px 12px rgba(0,0,0,.35)}
.fpin-save{position:absolute;top:12px;right:12px;z-index:2;background:#E60023;color:#fff;font-size:15px;font-weight:700;border-radius:24px;padding:10px 18px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.fpin-body{padding:14px 16px 8px}
.fpin-title{font-size:20px;font-weight:700;color:#111;line-height:1.3;overflow-wrap:break-word}
.fpin-desc{font-size:14.5px;line-height:1.5;color:#111;margin-top:8px;overflow-wrap:break-word;white-space:pre-wrap}
.fpin-creator{display:flex;align-items:center;gap:10px;margin-top:14px}
.fpin-av{width:44px;height:44px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;overflow:hidden;flex:none}
.fpin-av img{width:100%;height:100%;object-fit:cover;display:block}
.fpin-cname{flex:1;min-width:0}
.fpin-cname b{display:block;font-size:15px;font-weight:600;color:#111}
.fpin-cname span{display:block;font-size:13px;color:#767676}
.fpin-follow{background:#EFEFEF;color:#111;font-size:14px;font-weight:700;border-radius:24px;padding:9px 16px}
.fpin-stats{display:flex;align-items:center;gap:22px;margin-top:16px;padding-top:12px;border-top:1px solid #EFEFEF;color:#111}
.fpin-stat{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:600}
.fpin-tabbar{display:flex;align-items:center;justify-content:space-around;padding:10px 8px 8px;background:#fff;border-top:1px solid #EFEFEF;color:#111}
.fpin-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fpin-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fpin-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fpin-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fpin-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fpin-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fpin-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fpin-ctl"></div>');
  const inJudul = T.input('text', 'Judul pin', 'Ide Ruang Kerja Minimalis');
  const inDesc = T.input('text', 'Deskripsi', 'Ruang kerja yang rapi bikin fokus lebih lama. Simpan buat inspirasi nanti!');
  const inKreator = T.input('text', 'Nama kreator', 'Ruang Ide');
  const inFollow = T.input('text', 'Pengikut kreator', '128000');
  const inSuka = T.input('text', 'Jumlah suka', '4521');
  const inKomen = T.input('text', 'Jumlah komentar', '128');
  const inSimpan = T.input('text', 'Jumlah disimpan', '8930');
  const selGrad = T.select(Object.keys(GRADASI).map((k) => [k, GRADASI[k].label]), 'senja');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  const fiAv = fileInput('image/*');
  fiAv.style.display = 'none';
  let fotoUrl = null, avUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { fotoUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  fiAv.addEventListener('change', () => { if (fiAv.files && fiAv.files[0]) { avUrl = URL.createObjectURL(fiAv.files[0]); draw(); } });

  ctl.appendChild(T.field('Judul pin', inJudul));
  ctl.appendChild(T.field('Deskripsi', inDesc));
  ctl.appendChild(T.field('Nama kreator', inKreator));
  ctl.appendChild(T.field('Pengikut kreator', inFollow));
  ctl.appendChild(T.field('Jumlah suka', inSuka));
  ctl.appendChild(T.field('Jumlah komentar', inKomen));
  ctl.appendChild(T.field('Jumlah disimpan', inSimpan));
  ctl.appendChild(T.field('Latar gambar (bila tanpa foto)', selGrad));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.row(T.btn('📷 Upload Gambar Pin', () => fi.click()), T.btn('📷 Upload Avatar', () => fiAv.click())));

  const phone = T.el('<div class="fpin-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inJudul.value = 'Ide Ruang Kerja Minimalis';
      inDesc.value = 'Ruang kerja yang rapi bikin fokus lebih lama. Simpan buat inspirasi nanti!';
      inKreator.value = 'Ruang Ide'; inFollow.value = '128000'; inSuka.value = '4521';
      inKomen.value = '128'; inSimpan.value = '8930'; selGrad.value = 'senja';
      fotoUrl = null; avUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-pin-pinterest.png'), true)
  );

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const judul = inJudul.value.trim() || 'Pin tanpa judul';
    const desc = inDesc.value.trim();
    const kreator = inKreator.value.trim() || 'Kreator';
    const grad = GRADASI[selGrad.value] || GRADASI.senja;
    const avHtml = avUrl ? '<img src="' + avUrl + '" alt="">' : T.esc((kreator[0] || '?').toUpperCase());
    const imgHtml = fotoUrl
      ? '<img src="' + fotoUrl + '" alt="">'
      : '<div class="fpin-imgtxt">' + T.esc(judul) + '</div>';

    const sbHtml = '<div class="fpin-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fpin-hd"><button class="fpin-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<b>Pin</b><div class="fpin-hic">' + SVG_SHARE + SVG_MORE + '</div></div>';
    const bodyHtml = '<div class="fpin-img" style="background:' + grad.bg + '">' + imgHtml +
      '<div class="fpin-save">Save</div></div>' +
      '<div class="fpin-body"><div class="fpin-title">' + T.esc(judul) + '</div>' +
      (desc ? '<div class="fpin-desc">' + T.esc(desc) + '</div>' : '') +
      '<div class="fpin-creator"><div class="fpin-av" style="background:' + utils.avaColor(kreator) + '">' + avHtml + '</div>' +
      '<div class="fpin-cname"><b>' + T.esc(kreator) + '</b><span>' + formatHitungan(inFollow.value) + ' pengikut</span></div>' +
      '<div class="fpin-follow">Ikuti</div></div>' +
      '<div class="fpin-stats">' +
      '<span class="fpin-stat">' + SVG_HEART + ' ' + formatHitungan(inSuka.value) + '</span>' +
      '<span class="fpin-stat">' + SVG_CHAT + ' ' + formatHitungan(inKomen.value) + '</span>' +
      '<span class="fpin-stat">📌 ' + formatHitungan(inSimpan.value) + ' disimpan</span></div></div>';
    const tabHtml = '<div class="fpin-tabbar">' + SVG_HOME + SVG_SEARCH + SVG_PLUS + SVG_BELL +
      '<span class="fpin-av" style="width:28px;height:28px;font-size:12px;background:' + utils.avaColor(kreator) + '">' + avHtml + '</span></div>' +
      (isIPh ? '<div class="fpin-home"><i></i></div>' : '<div class="fpin-nav"><i></i></div>');

    phone.className = 'fpin-phone';
    phone.innerHTML = sbHtml + hdHtml + bodyHtml + tabHtml +
      '<div class="fpin-pranktag-wrap"><span class="fpin-pranktag">palsu · cuma prank</span></div>';
  }

  [inJudul, inDesc, inKreator, inFollow, inSuka, inKomen, inSimpan, selGrad, selPlatform, selBrand].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(fiAv);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fpin-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan pin Pinterest asli.') + '</div>'));
  draw();
}
