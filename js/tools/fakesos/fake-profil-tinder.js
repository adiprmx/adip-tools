import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {
  id: 'fake-profil-tinder',
  name: 'Fake Profil Tinder',
  cat: 'fakesos',
  icon: '🔥',
  desc: 'Bikin kartu profil Tinder palsu atau layar "It\'s a Match!" + unduh PNG.',
  keywords: 'tinder,profil,match,dating,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Tinder: mode Kartu (foto + nama/umur + bio + passions + tombol aksi
   X/bintang/hati) dan mode Match ("It's a Match!" gradasi pink-oranye,
   dua avatar bersilangan, tombol Kirim pesan). */
const GRAD_FOTO = 'linear-gradient(160deg,#FD267D,#FF7854)';
const GRAD_MATCH = 'linear-gradient(180deg,#FD267D 0%,#FF6037 60%,#FF7854 100%)';

const SVG_X = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FD267D" stroke-width="2.8" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const SVG_STAR = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#0AB4FF"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
const SVG_HEART = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#2DF2A5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_FLAME = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#FD267D" aria-hidden="true"><path d="M12 2c1 4-3 5.5-3 9.5a3 3 0 0 0 6 .4C15 10 13.5 8.5 13.5 6c2.5 1.5 5 4.5 5 8a7 7 0 0 1-14 0c0-5 5-8.5 7.5-12z"/></svg>';
const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_VER = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#0AB4FF"/><path d="M8.3 12.4l2.6 2.7 5-5.9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fptd-ctl{display:grid;gap:10px;margin-bottom:12px}
.fptd-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fptd-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#fff;color:#000}
.fptd-sb.fptd-m{background:transparent;color:#fff;position:absolute;top:0;left:0;right:0;z-index:3}
.fptd-hd{display:flex;align-items:center;height:48px;padding:0 14px;background:#fff}
.fptd-hd b{flex:1;font-size:17px;font-weight:800;color:#FD267D}
.fptd-card{margin:6px 12px 4px;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.14);background:#fff}
.fptd-foto{position:relative;height:380px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.fptd-foto img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fptd-fototxt{position:relative;z-index:1;color:#fff;font-size:56px;font-weight:800;text-shadow:0 2px 14px rgba(0,0,0,.35)}
.fptd-foto::after{content:"";position:absolute;left:0;right:0;bottom:0;height:110px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.55))}
.fptd-ident{position:absolute;left:16px;bottom:14px;z-index:2;color:#fff}
.fptd-ident b{font-size:28px;font-weight:800;display:flex;align-items:center;gap:7px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.fptd-ident span{font-size:14px;display:block;margin-top:2px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.fptd-info{padding:14px 16px}
.fptd-info p{font-size:15.5px;line-height:1.55;color:#111;margin:0 0 12px;white-space:pre-wrap;overflow-wrap:break-word}
.fptd-pass{display:flex;flex-wrap:wrap;gap:8px}
.fptd-chip{border:1.5px solid #E5E5E5;border-radius:20px;padding:7px 13px;font-size:14px;color:#111}
.fptd-actions{display:flex;justify-content:center;gap:16px;padding:12px 0 8px}
.fptd-act{width:58px;height:58px;border-radius:50%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center}
.fptd-match{position:relative;min-height:620px;background:${GRAD_MATCH};display:flex;flex-direction:column;align-items:center;padding:64px 20px 30px;color:#fff;text-align:center}
.fptd-match h2{font-size:44px;font-weight:800;font-style:italic;margin:8px 0 6px;line-height:1.1}
.fptd-match p{font-size:15.5px;line-height:1.5;margin:0;opacity:.95}
.fptd-avatars{display:flex;align-items:center;justify-content:center;margin:26px 0 20px}
.fptd-mav{width:110px;height:110px;border-radius:50%;border:3px solid #fff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;overflow:hidden;background:#00000033}
.fptd-mav img{width:100%;height:100%;object-fit:cover;display:block}
.fptd-mav:last-child{margin-left:-28px}
.fptd-sendmsg{margin-top:auto;background:#fff;color:#FD267D;font-size:16px;font-weight:700;border-radius:28px;padding:14px 34px;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.fptd-keep{margin-top:16px;font-size:15px;font-weight:600;color:#fff}
.fptd-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fptd-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fptd-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fptd-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fptd-navm{display:flex;justify-content:center;padding:4px 0 9px;background:#FF7854}
.fptd-navm i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(255,255,255,.6)}
.fptd-homem{display:flex;justify-content:center;align-items:center;height:20px;background:#FF7854}
.fptd-homem i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(255,255,255,.6)}
.fptd-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fptd-pranktag-wrap.fptd-m{background:#FF7854}
.fptd-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fptd-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fptd-ctl"></div>');
  const selMode = T.select([['kartu', 'Kartu profil'], ['match', "It's a Match!"]], 'kartu');
  const inNama = T.input('text', 'Nama', 'Dina');
  const inUmur = T.input('text', 'Umur', '23');
  const inJarak = T.input('text', 'Jarak / kota', '5 km dari sini');
  const selVer = T.select([['ya', 'Terverifikasi'], ['tidak', 'Tanpa verifikasi']], 'ya');
  const inBio = T.input('text', 'Bio', 'Suka kopi, musik, dan jalan sore. Swipe kanan kalau suka ngobrol!');
  const taPass = T.ta(3, 'Satu baris = satu passion', 'Musik\nKopi\nTraveling\nFotografi');
  const inNamaku = T.input('text', 'Namamu (mode Match)', 'Adip');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  const fi2 = fileInput('image/*');
  fi2.style.display = 'none';
  let fotoUrl = null, fotoKu = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { fotoUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  fi2.addEventListener('change', () => { if (fi2.files && fi2.files[0]) { fotoKu = URL.createObjectURL(fi2.files[0]); draw(); } });

  ctl.appendChild(T.field('Tampilan', selMode));
  ctl.appendChild(T.field('Nama', inNama));
  ctl.appendChild(T.field('Umur', inUmur));
  ctl.appendChild(T.field('Jarak / kota', inJarak));
  ctl.appendChild(T.field('Verifikasi', selVer));
  ctl.appendChild(T.field('Bio', inBio));
  ctl.appendChild(T.field('Passions (satu baris = satu)', taPass));
  ctl.appendChild(T.field('Namamu (mode Match)', inNamaku));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.row(T.btn('📷 Upload Foto Profil', () => fi.click()), T.btn('📷 Upload Fotoku', () => fi2.click())));

  const phone = T.el('<div class="fptd-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      selMode.value = 'kartu'; inNama.value = 'Dina'; inUmur.value = '23';
      inJarak.value = '5 km dari sini'; selVer.value = 'ya';
      inBio.value = 'Suka kopi, musik, dan jalan sore. Swipe kanan kalau suka ngobrol!';
      taPass.value = 'Musik\nKopi\nTraveling\nFotografi'; inNamaku.value = 'Adip';
      fotoUrl = null; fotoKu = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-tinder.png'), true)
  );

  function draw() {
    const match = selMode.value === 'match';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nama = inNama.value.trim() || 'Pengguna';
    const umur = inUmur.value.trim();
    const jarak = inJarak.value.trim();
    const bio = inBio.value.trim();
    const namaku = inNamaku.value.trim() || 'Kamu';
    const pass = String(taPass.value).split('\n').map((s) => s.trim()).filter(Boolean);
    const verHtml = selVer.value === 'ya' ? SVG_VER : '';

    let bodyHtml = '';
    if (match) {
      const av1 = fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : T.esc((nama[0] || '?').toUpperCase());
      const av2 = fotoKu ? '<img src="' + fotoKu + '" alt="">' : T.esc((namaku[0] || '?').toUpperCase());
      bodyHtml = '<div style="position:relative"><div class="fptd-sb fptd-m">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>' +
        '<div class="fptd-match">' + SVG_FLAME +
        '<h2>It\'s a Match!</h2><p>Kamu dan ' + T.esc(nama) + ' saling suka.</p>' +
        '<div class="fptd-avatars"><div class="fptd-mav">' + av2 + '</div><div class="fptd-mav">' + av1 + '</div></div>' +
        '<div class="fptd-sendmsg">Kirim pesan</div><div class="fptd-keep">Terus swipe</div></div>' +
        (isIPh ? '<div class="fptd-homem"><i></i></div>' : '<div class="fptd-navm"><i></i></div>') +
        '<div class="fptd-pranktag-wrap fptd-m"><span class="fptd-pranktag">palsu · cuma prank</span></div></div>';
      phone.className = 'fptd-phone';
      phone.innerHTML = bodyHtml;
      return;
    }

    const chipsHtml = pass.map((p) => '<span class="fptd-chip">' + T.esc(p) + '</span>').join('');
    const sbHtml = '<div class="fptd-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fptd-hd"><b>tinder</b><span style="display:flex">' + SVG_FLAME + '</span></div>';
    bodyHtml = '<div class="fptd-card"><div class="fptd-foto" style="background:' + GRAD_FOTO + '">' +
      (fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : '<span class="fptd-fototxt">' + T.esc((nama[0] || '?').toUpperCase()) + '</span>') +
      '<div class="fptd-ident"><b>' + T.esc(nama) + (umur ? ', ' + T.esc(umur) : '') + ' ' + verHtml + '</b>' +
      (jarak ? '<span>📍 ' + T.esc(jarak) + '</span>' : '') + '</div></div>' +
      '<div class="fptd-info">' + (bio ? '<p>' + T.esc(bio) + '</p>' : '') +
      (chipsHtml ? '<div class="fptd-pass">' + chipsHtml + '</div>' : '') + '</div></div>' +
      '<div class="fptd-actions"><div class="fptd-act">' + SVG_X + '</div><div class="fptd-act">' + SVG_STAR + '</div><div class="fptd-act">' + SVG_HEART + '</div></div>';

    phone.className = 'fptd-phone';
    phone.innerHTML = sbHtml + hdHtml + bodyHtml +
      (isIPh ? '<div class="fptd-home"><i></i></div>' : '<div class="fptd-nav"><i></i></div>') +
      '<div class="fptd-pranktag-wrap"><span class="fptd-pranktag">palsu · cuma prank</span></div>';
  }

  [selMode, inNama, inUmur, inJarak, selVer, inBio, taPass, inNamaku, selPlatform, selBrand].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(fi2);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fptd-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan profil Tinder asli.') + '</div>'));
  draw();
}
