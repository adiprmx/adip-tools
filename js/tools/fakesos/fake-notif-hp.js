import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.1';

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
    '.' + P + '-phone{width:380px;max-width:100%;height:680px;border-radius:30px;overflow:hidden;position:relative;flex:none;font-family:-apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",Arial,sans-serif;color:#fff;box-shadow:0 12px 40px rgba(0,0,0,.35)}' +
    '.' + P + '-wall-a{background:linear-gradient(160deg,#3d4c5d 0%,#1d2632 55%,#10151d 100%)}' +
    '.' + P + '-wall-i{background:linear-gradient(165deg,#5b5b8e 0%,#2c2c48 48%,#12121f 100%)}' +
    // status bar (isi via T.sysbar; island/punch absolute → container tetap relative)
    '.' + P + '-sba{display:flex;align-items:center;justify-content:space-between;padding:14px 22px 0;font-size:14px;font-weight:500;position:relative;z-index:1}' +
    '.' + P + '-sbi{display:flex;align-items:center;justify-content:space-between;padding:17px 27px 0;font-size:15px;font-weight:600;position:relative;z-index:1}' +
    // bottom chrome
    '.' + P + '-home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:123px;height:4px;border-radius:3px;background:rgba(255,255,255,.88);z-index:2}' +
    '.' + P + '-navpill{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:104px;height:4px;border-radius:3px;background:rgba(255,255,255,.55);z-index:2}' +
    // android notification card (Material You)
    '.' + P + '-acard{margin:12px 10px 0;background:#f7f8f7;border-radius:28px;padding:13px 16px 6px;box-shadow:0 6px 22px rgba(0,0,0,.28);position:relative;z-index:1}' +
    '.' + P + '-acard.dk{background:#232327}' +
    '.' + P + '-arow1{display:flex;align-items:center;gap:8px}' +
    '.' + P + '-smic{width:20px;height:20px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center}' +
    '.' + P + '-appname{font-size:13px;color:#5f6368;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-acard.dk .' + P + '-appname{color:#c4c7c5}' +
    '.' + P + '-atime{font-size:12px;color:#5f6368;white-space:nowrap}' +
    '.' + P + '-acard.dk .' + P + '-atime{color:#c4c7c5}' +
    '.' + P + '-arow2{display:flex;gap:12px;margin-top:9px;align-items:flex-start}' +
    '.' + P + '-abody{flex:1;min-width:0}' +
    '.' + P + '-atitle{font-size:15px;font-weight:500;color:#1f1f1f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;word-break:break-word}' +
    '.' + P + '-acard.dk .' + P + '-atitle{color:#e3e3e3}' +
    '.' + P + '-atext{font-size:14px;color:#444746;line-height:1.42;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}' +
    '.' + P + '-acard.dk .' + P + '-atext{color:#c4c7c5}' +
    '.' + P + '-lgic{width:52px;height:52px;border-radius:50%;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:21px}' +
    '.' + P + '-lgic img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-acts{display:flex;margin-top:4px}' +
    '.' + P + '-abtn{flex:1;text-align:center;font-size:14px;font-weight:500;padding:10px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-asep{width:1px;background:rgba(127,127,127,.4);margin:9px 0}' +
    // ios lock screen
    '.' + P + '-lockclock{text-align:center;padding:44px 0 0;position:relative;z-index:1}' +
    '.' + P + '-lockdate{font-size:14px;font-weight:500;color:rgba(255,255,255,.92)}' +
    '.' + P + '-locktime{font-size:64px;font-weight:200;color:#fff;line-height:1.15;margin-top:2px}' +
    '.' + P + '-ioscard{width:318px;max-width:calc(100% - 24px);margin:12px auto 0;background:rgba(250,250,252,.74);-webkit-backdrop-filter:blur(22px) saturate(180%);backdrop-filter:blur(22px) saturate(180%);border-radius:16px;padding:11px 14px;display:flex;gap:10px;box-shadow:0 4px 18px rgba(0,0,0,.16);position:relative;z-index:1}' +
    '.' + P + '-sq{width:27px;height:27px;border-radius:7px;flex:none;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;margin-top:1px}' +
    '.' + P + '-sq img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-icol{flex:1;min-width:0}' +
    '.' + P + '-itrow{display:flex;justify-content:space-between;align-items:baseline;gap:8px}' +
    '.' + P + '-ititle{font-size:12px;font-weight:700;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-inow{font-size:10px;color:#6e6e73;white-space:nowrap}' +
    '.' + P + '-ibody{font-size:12px;color:#1c1c1e;line-height:1.35;margin-top:1px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  const initial = (s) => (s || '?').trim().charAt(0).toUpperCase();

  function bellSvg(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="#fff"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';
  }

  function largeIcon() {
    const inner = S.ikon
      ? '<img src="' + T.esc(S.ikon) + '" alt="">'
      : T.esc(initial(S.judul));
    const bg = S.ikon ? '' : ' style="background:' + T.esc(S.warna) + '"';
    return '<div class="' + P + '-lgic"' + bg + '>' + inner + '</div>';
  }

  function squircleIcon() {
    const inner = S.ikon
      ? '<img src="' + T.esc(S.ikon) + '" alt="">'
      : T.esc(initial(S.app));
    const bg = S.ikon ? '' : ' style="background:' + T.esc(S.warna) + '"';
    return '<div class="' + P + '-sq"' + bg + '>' + inner + '</div>';
  }

  function draw() {
    brandField.style.display = (S.platform === 'android') ? '' : 'none';
    let html = '';
    if (S.platform === 'android') {
      const dark = S.tema === 'gelap';
      const acts = (S.aksi1.trim() || S.aksi2.trim())
        ? '<div class="' + P + '-acts">' +
          (S.aksi1.trim() ? '<div class="' + P + '-abtn" style="color:' + T.esc(S.warna) + '">' + T.esc(S.aksi1.trim()) + '</div>' : '') +
          ((S.aksi1.trim() && S.aksi2.trim()) ? '<div class="' + P + '-asep"></div>' : '') +
          (S.aksi2.trim() ? '<div class="' + P + '-abtn" style="color:' + T.esc(S.warna) + '">' + T.esc(S.aksi2.trim()) + '</div>' : '') +
          '</div>'
        : '';
      html = '<div class="' + P + '-phone ' + P + '-wall-a">' +
        '<div class="' + P + '-sba">' + T.sysbar('android', selBrand.value) + '</div>' +
        '<div class="' + P + '-acard' + (dark ? ' dk' : '') + '">' +
          '<div class="' + P + '-arow1">' +
            '<div class="' + P + '-smic" style="background:' + T.esc(S.warna) + '">' + bellSvg(12) + '</div>' +
            '<div class="' + P + '-appname">' + T.esc(S.app) + '</div>' +
            '<div class="' + P + '-atime">' + T.esc(S.waktu) + '</div>' +
          '</div>' +
          '<div class="' + P + '-arow2">' +
            '<div class="' + P + '-abody">' +
              '<div class="' + P + '-atitle">' + T.esc(S.judul) + '</div>' +
              '<div class="' + P + '-atext">' + T.esc(S.isi) + '</div>' +
            '</div>' +
            largeIcon() +
          '</div>' + acts +
        '</div>' +
        '<div class="' + P + '-navpill"></div>' +
      '</div>';
    } else {
      html = '<div class="' + P + '-phone ' + P + '-wall-i">' +
        '<div class="' + P + '-sbi">' + T.sysbar('iphone') + '</div>' +
        '<div class="' + P + '-lockclock">' +
          '<div class="' + P + '-lockdate">Jumat, 2 Oktober</div>' +
          '<div class="' + P + '-locktime">11:13</div>' +
        '</div>' +
        '<div class="' + P + '-ioscard">' +
          squircleIcon() +
          '<div class="' + P + '-icol">' +
            '<div class="' + P + '-itrow">' +
              '<div class="' + P + '-ititle">' + T.esc(S.judul) + '</div>' +
              '<div class="' + P + '-inow">' + T.esc(S.waktu) + '</div>' +
            '</div>' +
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
  const selBrand = T.select([['xiaomi','Xiaomi'],['samsung','Samsung'],['vivo','Vivo'],['oppo','Oppo'],['pixel','Pixel / Stock']], 'xiaomi');
  const inApp = T.input('text', 'Nama aplikasi', S.app);
  const inJudul = T.input('text', 'Judul notifikasi', S.judul);
  const inIsi = T.ta(3, 'Isi pesan', S.isi);
  const inWaktu = T.input('text', 'now', S.waktu);
  const selTema = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], S.tema);
  const inWarna = T.input('color', '', S.warna);
  const inAksi1 = T.input('text', 'cth: Balas', S.aksi1);
  const inAksi2 = T.input('text', 'cth: Tandai dibaca', S.aksi2);
  const fi = fileInput('image/*');
  const fiField = T.field('Ikon / foto kontak (upload, opsional)', fi, 'Kalau kosong, dipakai huruf inisial + warna aksen.');

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
    pull(); syncVis(); draw(); T.toast('Contoh dimuat');
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
