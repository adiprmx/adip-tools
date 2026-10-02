import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.5';

export const meta = {"id":"fake-notif-hp","name":"Fake Notifikasi HP","cat":"fakesos","icon":"🔔","desc":"Bikin screenshot notifikasi HP palsu + unduh PNG.","keywords":"notifikasi,notification,fake,palsu,screenshot,prank"};

const P = 'fnhp';

export function render(root) {
  const S = {
    platform: 'android', app: 'WhatsApp', judul: 'Mama', isi: 'Nak, pulang jam berapa?\nMama masak rendang nih',
    waktu: 'now', tema: 'terang', warna: '#25D366', aksi1: '', aksi2: '', ikon: ''
  };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0}' +
    '.' + P + '-phone{width:380px;max-width:100%;height:680px;border-radius:30px;overflow:hidden;position:relative;flex:none;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.35)}' +
    '.' + P + '-wall-a{background:linear-gradient(160deg,#3d4c5d 0%,#1d2632 55%,#10151d 100%);font-family:Roboto,"Segoe UI",Arial,sans-serif}' +
    '.' + P + '-wall-i{background:linear-gradient(165deg,#5b5b8e 0%,#2c2c48 48%,#12121f 100%);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Arial,sans-serif}' +
    // status bar (isi via T.sysbar; island/punch absolute → container tetap relative)
    '.' + P + '-sba{display:flex;align-items:center;justify-content:space-between;padding:14px 22px 0;font-size:14px;font-weight:500;position:relative;z-index:1}' +
    '.' + P + '-sbi{display:flex;align-items:center;justify-content:space-between;padding:17px 27px 0;font-size:15px;font-weight:600;position:relative;z-index:1}' +
    // bottom chrome
    '.' + P + '-home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:130px;height:5px;border-radius:3px;background:rgba(255,255,255,.92);z-index:2}' +
    '.' + P + '-navpill{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:104px;height:4px;border-radius:3px;background:rgba(255,255,255,.55);z-index:2}' +
    // ---- Android: kartu notifikasi Material You (stock Pixel, Android 12+) ----
    // radius 28dp (M3 extra-large), margin samping 8dp, bg surface M3
    '.' + P + '-acard{margin:10px 8px 0;background:#FDF8FD;border-radius:28px;padding:12px 16px 4px;box-shadow:0 6px 22px rgba(0,0,0,.28);position:relative;z-index:1}' +
    '.' + P + '-acard.dk{background:#1D1B20}' +
    '.' + P + '-arow1{display:flex;align-items:center;gap:8px}' +
    '.' + P + '-smic{width:20px;height:20px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-appname{font-size:12px;color:#49454F;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-acard.dk .' + P + '-appname{color:#CAC4D0}' +
    '.' + P + '-atime{font-size:12px;color:#49454F;white-space:nowrap}' +
    '.' + P + '-acard.dk .' + P + '-atime{color:#CAC4D0}' +
    '.' + P + '-achev{width:16px;height:16px;flex:none;color:#49454F;display:flex}' +
    '.' + P + '-acard.dk .' + P + '-achev{color:#CAC4D0}' +
    '.' + P + '-arow2{display:flex;gap:12px;margin-top:10px;align-items:flex-start}' +
    '.' + P + '-abody{flex:1;min-width:0}' +
    '.' + P + '-atitle{font-size:14px;font-weight:500;color:#1C1B1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-acard.dk .' + P + '-atitle{color:#E6E0E9}' +
    '.' + P + '-atext{font-size:14px;color:#49454F;line-height:1.42;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}' +
    '.' + P + '-acard.dk .' + P + '-atext{color:#CAC4D0}' +
    '.' + P + '-lgic{width:40px;height:40px;border-radius:50%;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:500;font-size:17px}' +
    '.' + P + '-lgic img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-adiv{height:1px;background:#CAC4D0;margin:8px -16px 0}' +
    '.' + P + '-acard.dk .' + P + '-adiv{background:#49454F}' +
    '.' + P + '-acts{display:flex}' +
    '.' + P + '-abtn{flex:1;text-align:center;font-size:14px;font-weight:500;padding:10px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-asep{width:1px;background:#CAC4D0;margin:8px 0}' +
    '.' + P + '-acard.dk .' + P + '-asep{background:#49454F}' +
    // ---- iOS: lock screen (iPhone) ----
    // jam: SF Pro Display ~96pt semibold; tanggal 16pt medium — proporsional ke frame 380px (≈393pt)
    '.' + P + '-lockclock{text-align:center;padding:52px 0 0;position:relative;z-index:1}' +
    '.' + P + '-lockdate{font-size:16px;font-weight:500;color:#fff;letter-spacing:.1px}' +
    '.' + P + '-locktime{font-size:93px;font-weight:600;color:#fff;line-height:1.08;margin-top:2px;letter-spacing:-1px}' +
    // kartu notif: komponen banner Apple (Figma kit) — radius 18pt, ikon squircle 36pt,
    // judul 13pt bold / isi 13pt regular / "now" 11pt, material kaca gelap (wallpaper gelap)
    '.' + P + '-ioscard{margin:16px 15px 0;background:rgba(44,44,46,.62);-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);border-radius:18px;padding:12px 12px 14px 15px;display:flex;gap:8px;box-shadow:0 4px 18px rgba(0,0,0,.25);position:relative;z-index:1}' +
    '.' + P + '-sq{width:36px;height:36px;border-radius:9px;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px}' +
    '.' + P + '-sq img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-icol{flex:1;min-width:0}' +
    '.' + P + '-ihead{display:flex;justify-content:space-between;align-items:baseline;gap:8px}' +
    '.' + P + '-iapp{font-size:12px;font-weight:600;color:rgba(255,255,255,.92);letter-spacing:.3px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-inow{font-size:12px;color:rgba(235,235,245,.6);white-space:nowrap}' +
    '.' + P + '-isender{font-size:15px;font-weight:700;color:#fff;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}' +
    '.' + P + '-ibody{font-size:15px;color:#fff;line-height:19px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;letter-spacing:-.1px;margin-top:1px}' +
    // FIX C (PNG export): html2canvas abaikan backdrop-filter — saat class png-export
    // dipasang core.js/dlNodePng, kartu iOS pakai background solid abu frosted gelap.
    '.png-export .' + P + '-ioscard{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#5e5e63!important}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  const initial = (s) => (s || '?').trim().charAt(0).toUpperCase();

  function bellSvg(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="#fff"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';
  }

  function chevSvg() {
    return '<span class="' + P + '-achev"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg></span>';
  }

  function largeIcon() {
    const inner = S.ikon
      ? '<img src="' + T.esc(S.ikon) + '" alt="">'
      : T.esc(initial(S.judul));
    const bg = S.ikon ? '' : ' style="background:' + T.esc(S.warna) + '"';
    return '<div class="' + P + '-lgic"' + bg + '>' + inner + '</div>';
  }

  // Logo WhatsApp resmi (glyph putih) — ikon default kartu iPhone, bukan tile huruf.
  function waSvg() {
    return '<svg width="22" height="22" viewBox="0 0 448 512" fill="#fff" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
  }

  function squircleIcon() {
    const inner = S.ikon
      ? '<img src="' + T.esc(S.ikon) + '" alt="">'
      : waSvg();
    const bg = S.ikon ? '' : ' style="background:' + T.esc(S.warna) + '"';
    return '<div class="' + P + '-sq"' + bg + '>' + inner + '</div>';
  }

  function draw() {
    brandField.style.display = (S.platform === 'android') ? '' : 'none';
    let html = '';
    if (S.platform === 'android') {
      const dark = S.tema === 'gelap';
      const acts = (S.aksi1.trim() || S.aksi2.trim())
        ? '<div class="' + P + '-adiv"></div><div class="' + P + '-acts">' +
          (S.aksi1.trim() ? '<div class="' + P + '-abtn" style="color:' + T.esc(S.warna) + '">' + T.esc(S.aksi1.trim()) + '</div>' : '') +
          ((S.aksi1.trim() && S.aksi2.trim()) ? '<div class="' + P + '-asep"></div>' : '') +
          (S.aksi2.trim() ? '<div class="' + P + '-abtn" style="color:' + T.esc(S.warna) + '">' + T.esc(S.aksi2.trim()) + '</div>' : '') +
          '</div>'
        : '';
      html = '<div class="' + P + '-phone ' + P + '-wall-a">' +
        '<div class="' + P + '-sba">' + T.sysbar('android', selBrand.value, dark) + '</div>' +
        '<div class="' + P + '-acard' + (dark ? ' dk' : '') + '">' +
          '<div class="' + P + '-arow1">' +
            '<div class="' + P + '-smic" style="background:' + T.esc(S.warna) + '">' + bellSvg(12) + '</div>' +
            '<div class="' + P + '-appname">' + T.esc(S.app) + '</div>' +
            '<div class="' + P + '-atime">' + T.esc(S.waktu) + '</div>' +
            chevSvg() +
          '</div>' +
          '<div class="' + P + '-arow2">' +
            largeIcon() +
            '<div class="' + P + '-abody">' +
              '<div class="' + P + '-atitle">' + T.esc(S.judul) + '</div>' +
              '<div class="' + P + '-atext">' + T.esc(S.isi) + '</div>' +
            '</div>' +
          '</div>' + acts +
        '</div>' +
        '<div class="' + P + '-navpill"></div>' +
      '</div>';
    } else {
      html = '<div class="' + P + '-phone ' + P + '-wall-i">' +
        '<div class="' + P + '-sbi">' + T.sysbar('iphone', null, true) + '</div>' +
        '<div class="' + P + '-lockclock">' +
          '<div class="' + P + '-lockdate">Jumat, 2 Oktober</div>' +
          '<div class="' + P + '-locktime">11:13</div>' +
        '</div>' +
        '<div class="' + P + '-ioscard">' +
          squircleIcon() +
          '<div class="' + P + '-icol">' +
            '<div class="' + P + '-ihead">' +
              '<div class="' + P + '-iapp">' + T.esc(S.app) + '</div>' +
              '<div class="' + P + '-inow">' + T.esc(S.waktu) + '</div>' +
            '</div>' +
            '<div class="' + P + '-isender">' + T.esc(S.judul) + '</div>' +
            '<div class="' + P + '-ibody">' + T.esc(S.isi) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="' + P + '-home"></div>' +
      '</div>';
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], S.platform);
  const selBrand = T.select([['xiaomi','Xiaomi'],['samsung','Samsung'],['oppo','Oppo'],['vivo','Vivo'],['realme','Realme'],['oneplus','OnePlus'],['infinix','Infinix'],['tecno','Tecno'],['motorola','Motorola'],['nothing','Nothing'],['pixel','Pixel'],['huawei','Huawei'],['honor','Honor']], 'xiaomi');
  const inApp = T.input('text', 'Nama aplikasi', S.app);
  const inJudul = T.input('text', 'Judul notifikasi', S.judul);
  const inIsi = T.ta(3, 'Isi pesan', S.isi);
  const inWaktu = T.input('text', 'now', S.waktu);
  const selTema = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], S.tema);
  const inWarna = T.input('color', '', S.warna);
  const inAksi1 = T.input('text', 'cth: Balas', S.aksi1);
  const inAksi2 = T.input('text', 'cth: Tandai dibaca', S.aksi2);
  const fi = fileInput('image/*');
  const fiField = T.field('Ikon / foto kontak (upload, opsional)', fi, 'iPhone: ikon aplikasi — default logo WhatsApp. Android: foto kontak — default huruf inisial + warna aksen.');

  const temaField = T.field('Tema', selTema, 'Hanya berlaku untuk gaya Android.');
  const aksiField = T.el('<div></div>');
  aksiField.appendChild(T.field('Tombol aksi 1 (Android)', inAksi1));
  aksiField.appendChild(T.field('Tombol aksi 2 (Android)', inAksi2));

  function syncVis() {
    const and = selPlatform.value === 'android';
    temaField.hidden = !and;
    aksiField.hidden = !and;
  }

  function pull() {
    S.platform = selPlatform.value; S.app = inApp.value; S.judul = inJudul.value;
    S.isi = inIsi.value; S.waktu = inWaktu.value || 'now'; S.tema = selTema.value;
    S.warna = inWarna.value; S.aksi1 = inAksi1.value; S.aksi2 = inAksi2.value;
  }

  [selPlatform, selBrand, inApp, inJudul, inIsi, inWaktu, selTema, inWarna, inAksi1, inAksi2].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); syncVis(); draw(); });
    elm.addEventListener('change', () => { pull(); syncVis(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.ikon = URL.createObjectURL(fi.files[0]); draw(); }
  });

  const bContoh = T.btn('🎲 Contoh', () => {
    inApp.value = 'WhatsApp'; inJudul.value = 'Mama';
    inIsi.value = 'Nak, pulang jam berapa?\nMama masak rendang nih'; inWaktu.value = 'now';
    selTema.value = 'terang'; inWarna.value = '#25D366';
    inAksi1.value = 'Balas'; inAksi2.value = 'Tandai dibaca';
    S.ikon = ''; fi.value = '';
    pull(); syncVis(); draw(); T.scrollToPreview(frame); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('⬇️ Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-notif-hp.png'); }, true);

  wrap.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  wrap.appendChild(brandField);
  wrap.appendChild(T.field('Nama aplikasi', inApp));
  wrap.appendChild(T.field('Judul', inJudul));
  wrap.appendChild(T.field('Isi pesan', inIsi));
  wrap.appendChild(T.field('Waktu', inWaktu));
  wrap.appendChild(temaField);
  wrap.appendChild(fiField);
  wrap.appendChild(T.field('Warna aksen (inisial ikon & tombol aksi)', inWarna));
  wrap.appendChild(aksiField);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export. Di iPhone, efek kaca buram tampil di layar; hasil PNG memakai latar solid.</p>'));
  root.appendChild(wrap);

  pull(); syncVis(); draw();
}
