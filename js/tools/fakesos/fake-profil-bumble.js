import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-profil-bumble',
  name: 'Fake Profil Bumble',
  cat: 'fakesos',
  icon: '🐝',
  desc: 'Bikin screenshot profil Bumble palsu: foto, About me, basics, interests + unduh PNG.',
  keywords: 'bumble,profil,dating,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Bumble: aksen kuning #FFC629, foto besar rounded, nama + umur tebal,
   badge terverifikasi, About me, Basics (pekerjaan, pendidikan, tinggi,
   dll.), Interests sebagai chip, tombol aksi bawah (X, bintang, hati). */
const GRAD_FOTO = 'linear-gradient(160deg,#FFC629,#FF8A00,#FF5A5F)';

export function parseBaris(text) {
  return String(text).split('\n').map((s) => s.trim()).filter(Boolean);
}

const SVG_X = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" stroke-width="2.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const SVG_STAR = '<svg width="24" height="24" viewBox="0 0 24 24" fill="#FFC629"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
const SVG_HEART = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#00D26A"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_VER = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#0095F6"/><path d="M8.3 12.4l2.6 2.7 5-5.9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_FLAG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fpbm-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpbm-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpbm-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#FFC629;color:#000}
.fpbm-hd{display:flex;align-items:center;height:48px;padding:0 12px 0 4px;background:#FFC629;color:#000}
.fpbm-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center;color:#000}
.fpbm-hd b{flex:1;font-size:16px;font-weight:700;text-align:center}
.fpbm-foto{position:relative;height:400px;background:#EFEFEF;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fpbm-foto img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fpbm-fototxt{position:relative;z-index:1;color:#fff;font-size:52px;font-weight:800;text-shadow:0 2px 14px rgba(0,0,0,.35)}
.fpbm-foto::after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.55))}
.fpbm-ident{position:absolute;left:16px;bottom:14px;z-index:2;color:#fff}
.fpbm-ident b{font-size:30px;font-weight:800;display:flex;align-items:center;gap:7px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.fpbm-ident span{font-size:14.5px;display:block;margin-top:2px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.fpbm-body{padding:16px}
.fpbm-sec{margin-bottom:16px}
.fpbm-sec h3{font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#767676;margin:0 0 8px}
.fpbm-sec p{font-size:15.5px;line-height:1.55;color:#111;margin:0;white-space:pre-wrap;overflow-wrap:break-word}
.fpbm-basics{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fpbm-basic{background:#F7F7F7;border-radius:10px;padding:9px 12px;font-size:14px;color:#111}
.fpbm-basic b{display:block;font-size:11.5px;color:#767676;font-weight:600;margin-bottom:2px}
.fpbm-chips{display:flex;flex-wrap:wrap;gap:8px}
.fpbm-chip{border:1.5px solid #E5E5E5;border-radius:20px;padding:7px 13px;font-size:14px;color:#111}
.fpbm-actions{display:flex;justify-content:center;gap:18px;padding:12px 0 6px}
.fpbm-act{width:56px;height:56px;border-radius:50%;background:#fff;border:1px solid #EDEDED;box-shadow:0 2px 8px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center}
.fpbm-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fpbm-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fpbm-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fpbm-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fpbm-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fpbm-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fpbm-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fpbm-ctl"></div>');
  const inNama = T.input('text', 'Nama', 'Rizky');
  const inUmur = T.input('text', 'Umur', '24');
  const inKota = T.input('text', 'Kota / jarak', 'Jakarta • 5 km');
  const selVer = T.select([['ya', 'Terverifikasi'], ['tidak', 'Tanpa verifikasi']], 'ya');
  const inAbout = T.input('text', 'About me', 'Suka musik, kopi, dan jalan sore. Cari teman ngobrol yang seru.');
  const taBasics = T.ta(4, 'Satu baris = satu basic. Format: Label|Isi', 'Pekerjaan|Produser musik\nPendidikan|S1 Desain\nTinggi|175 cm\nZodiak|Pisces');
  const taMinat = T.ta(3, 'Satu baris = satu minat', 'Musik\nKopi\nTraveling\nFotografi\nFutsal');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let fotoUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { fotoUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  const btnFoto = T.btn('📷 Upload Foto', () => fi.click());

  ctl.appendChild(T.field('Nama', inNama));
  ctl.appendChild(T.field('Umur', inUmur));
  ctl.appendChild(T.field('Kota / jarak', inKota));
  ctl.appendChild(T.field('Verifikasi', selVer));
  ctl.appendChild(T.field('About me', inAbout));
  ctl.appendChild(T.field('Basics (satu baris = satu)', taBasics));
  ctl.appendChild(T.field('Interests (satu baris = satu)', taMinat));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(btnFoto);

  const phone = T.el('<div class="fpbm-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNama.value = 'Rizky'; inUmur.value = '24'; inKota.value = 'Jakarta • 5 km';
      selVer.value = 'ya'; inAbout.value = 'Suka musik, kopi, dan jalan sore. Cari teman ngobrol yang seru.';
      taBasics.value = 'Pekerjaan|Produser musik\nPendidikan|S1 Desain\nTinggi|175 cm\nZodiak|Pisces';
      taMinat.value = 'Musik\nKopi\nTraveling\nFotografi\nFutsal';
      fotoUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-bumble.png'), true)
  );

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nama = inNama.value.trim() || 'Pengguna';
    const umur = inUmur.value.trim();
    const kota = inKota.value.trim();
    const about = inAbout.value.trim();
    const basics = parseBaris(taBasics.value);
    const minat = parseBaris(taMinat.value);
    const verHtml = selVer.value === 'ya' ? SVG_VER : '';

    let basicsHtml = '';
    basics.forEach((b) => {
      const p = b.indexOf('|');
      const lbl = p < 0 ? '' : b.slice(0, p).trim();
      const isi = p < 0 ? b : b.slice(p + 1).trim();
      basicsHtml += '<div class="fpbm-basic">' + (lbl ? '<b>' + T.esc(lbl) + '</b>' : '') + T.esc(isi) + '</div>';
    });
    const chipsHtml = minat.map((m) => '<span class="fpbm-chip">' + T.esc(m) + '</span>').join('');

    const sbHtml = '<div class="fpbm-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fpbm-hd"><button class="fpbm-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<b>bumble</b><span style="display:flex">' + SVG_FLAG + '</span></div>';
    const fotoHtml = '<div class="fpbm-foto" style="background:' + GRAD_FOTO + '">' +
      (fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : '<span class="fpbm-fototxt">' + T.esc((nama[0] || '?').toUpperCase()) + '</span>') +
      '<div class="fpbm-ident"><b>' + T.esc(nama) + (umur ? ', ' + T.esc(umur) : '') + ' ' + verHtml + '</b>' +
      (kota ? '<span>📍 ' + T.esc(kota) + '</span>' : '') + '</div></div>';
    const bodyHtml = '<div class="fpbm-body">' +
      (about ? '<div class="fpbm-sec"><h3>About me</h3><p>' + T.esc(about) + '</p></div>' : '') +
      (basicsHtml ? '<div class="fpbm-sec"><h3>My basics</h3><div class="fpbm-basics">' + basicsHtml + '</div></div>' : '') +
      (chipsHtml ? '<div class="fpbm-sec"><h3>My interests</h3><div class="fpbm-chips">' + chipsHtml + '</div></div>' : '') +
      '<div class="fpbm-actions"><div class="fpbm-act">' + SVG_X + '</div><div class="fpbm-act">' + SVG_STAR + '</div><div class="fpbm-act">' + SVG_HEART + '</div></div></div>';

    phone.className = 'fpbm-phone';
    phone.innerHTML = sbHtml + hdHtml + fotoHtml + bodyHtml +
      (isIPh ? '<div class="fpbm-home"><i></i></div>' : '<div class="fpbm-nav"><i></i></div>') +
      '<div class="fpbm-pranktag-wrap"><span class="fpbm-pranktag">palsu · cuma prank</span></div>';
  }

  [inNama, inUmur, inKota, selVer, inAbout, taBasics, taMinat, selPlatform, selBrand].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fpbm-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan profil Bumble asli.') + '</div>'));
  draw();
}
