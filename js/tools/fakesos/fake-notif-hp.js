import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-notif-hp","name":"Fake Notifikasi HP","cat":"fakesos","icon":"🔔","desc":"Bikin screenshot notifikasi HP palsu + unduh PNG.","keywords":"notifikasi,notification,fake,palsu,screenshot,prank"};

const P = 'fnhp';

export function render(root) {
  const S = {
    gaya: 'android', app: 'WhatsApp', judul: 'Mama', isi: 'Nak, pulang jam berapa?\nMama masak rendang nih',
    waktu: 'now', tema: 'terang', warna: '#25D366', aksi1: '', aksi2: '', ikon: ''
  };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0;padding:22px 12px;background:#eef0f2;border-radius:14px}' +
    '.' + P + '-stage.dk{background:#0a0a0c}' +
    '.' + P + '-and{width:380px;max-width:100%;background:#ffffff;border-radius:28px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.20);font-family:-apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",Arial,sans-serif}' +
    '.' + P + '-and.dark{background:#1c1b1f;box-shadow:0 10px 30px rgba(0,0,0,.55)}' +
    '.' + P + '-top{display:flex;gap:12px}' +
    '.' + P + '-ico{width:44px;height:44px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;overflow:hidden}' +
    '.' + P + '-ico img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-mid{flex:1;min-width:0}' +
    '.' + P + '-arow{display:flex;justify-content:space-between;align-items:baseline;gap:10px}' +
    '.' + P + '-app{font-size:13px;color:#5f6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-and.dark .' + P + '-app{color:#c4c7c5}' +
    '.' + P + '-tm{font-size:12px;color:#5f6368;white-space:nowrap}' +
    '.' + P + '-and.dark .' + P + '-tm{color:#c4c7c5}' +
    '.' + P + '-ti{font-size:15px;font-weight:500;color:#1f1f1f;margin-top:3px;word-break:break-word}' +
    '.' + P + '-and.dark .' + P + '-ti{color:#e3e3e3}' +
    '.' + P + '-bd{font-size:14px;color:#444746;margin-top:3px;line-height:1.45;white-space:pre-wrap;word-break:break-word}' +
    '.' + P + '-and.dark .' + P + '-bd{color:#c4c7c5}' +
    '.' + P + '-acts{display:flex;align-items:center;margin-top:10px;padding-top:4px}' +
    '.' + P + '-abtn{flex:1;text-align:center;color:#0b57d0;font-size:14px;font-weight:500;padding:8px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-asep{color:#c4c7c5;font-size:14px}' +
    '.' + P + '-ipstage{width:380px;max-width:100%;border-radius:26px;overflow:hidden;background:linear-gradient(165deg,#4a4a6e 0%,#23232f 45%,#101018 100%);padding:8px 10px 30px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35)}' +
    '.' + P + '-sb{display:flex;align-items:center;justify-content:space-between;color:#fff;padding:8px 16px 10px;font-size:14px;font-weight:600}' +
    '.' + P + '-island{width:112px;height:29px;background:#000;border-radius:17px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}' +
    '.' + P + '-sbic{display:flex;align-items:center;gap:6px}' +
    '.' + P + '-sig{display:inline-flex;align-items:flex-end;gap:2px;height:12px}' +
    '.' + P + '-sig i{width:3px;background:#fff;border-radius:1px;display:block}' +
    '.' + P + '-batt{width:24px;height:12px;border:1px solid rgba(255,255,255,.55);border-radius:3px;position:relative;display:inline-block}' +
    '.' + P + '-batt i{position:absolute;inset:1.5px;background:#fff;border-radius:1.5px;display:block;width:70%}' +
    '.' + P + '-batt:after{content:"";position:absolute;right:-4px;top:3px;width:2px;height:4px;background:rgba(255,255,255,.55);border-radius:0 2px 2px 0}' +
    '.' + P + '-iosbanner{background:#f2f2f7;border-radius:22px;padding:12px 16px;display:flex;gap:12px}' +
    '@supports ((-webkit-backdrop-filter:blur(1px)) or (backdrop-filter:blur(1px))){' +
      '.' + P + '-iosbanner{background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%)}' +
    '}' +
    '.' + P + '-ico2{width:40px;height:40px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;overflow:hidden}' +
    '.' + P + '-ico2 img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-iapp{font-size:12px;color:#6e6e73;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.' + P + '-ititle{font-size:14px;font-weight:600;color:#111;margin-top:2px;word-break:break-word}' +
    '.' + P + '-ibody{font-size:14px;color:#111;margin-top:2px;line-height:1.4;white-space:pre-wrap;word-break:break-word}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  const initial = (s) => (s || '?').trim().charAt(0).toUpperCase();

  function sbIcons() {
    return '<span class="' + P + '-sbic">' +
      '<span class="' + P + '-sig"><i style="height:4px"></i><i style="height:6px"></i><i style="height:9px"></i><i style="height:12px"></i></span>' +
      '<span class="' + P + '-batt"><i></i></span>' +
    '</span>';
  }

  function iconHtml(cls, size) {
    if (S.ikon) return '<div class="' + cls + '"><img src="' + T.esc(S.ikon) + '" alt=""></div>';
    return '<div class="' + cls + '" style="background:' + T.esc(S.warna) + '">' + T.esc(initial(S.app)) + '</div>';
  }

  function draw() {
    let html = '';
    if (S.gaya === 'android') {
      const dark = S.tema === 'gelap';
      const acts = (S.aksi1.trim() || S.aksi2.trim())
        ? '<div class="' + P + '-acts">' +
          (S.aksi1.trim() ? '<div class="' + P + '-abtn">' + T.esc(S.aksi1.trim()) + '</div>' : '') +
          ((S.aksi1.trim() && S.aksi2.trim()) ? '<div class="' + P + '-asep">|</div>' : '') +
          (S.aksi2.trim() ? '<div class="' + P + '-abtn">' + T.esc(S.aksi2.trim()) + '</div>' : '') +
          '</div>'
        : '';
      html = '<div class="' + P + '-and' + (dark ? ' dark' : '') + '">' +
        '<div class="' + P + '-top">' +
          iconHtml(P + '-ico') +
          '<div class="' + P + '-mid">' +
            '<div class="' + P + '-arow"><div class="' + P + '-app">' + T.esc(S.app) + '</div><div class="' + P + '-tm">' + T.esc(S.waktu) + '</div></div>' +
            '<div class="' + P + '-ti">' + T.esc(S.judul) + '</div>' +
            '<div class="' + P + '-bd">' + T.esc(S.isi) + '</div>' +
          '</div>' +
        '</div>' + acts +
      '</div>';
      stage.classList.toggle('dk', dark);
    } else {
      html = '<div class="' + P + '-ipstage">' +
        '<div class="' + P + '-sb"><span>9:41</span><span class="' + P + '-island"></span>' + sbIcons() + '</div>' +
        '<div class="' + P + '-iosbanner">' +
          iconHtml(P + '-ico2') +
          '<div class="' + P + '-mid">' +
            '<div class="' + P + '-arow"><div class="' + P + '-iapp">' + T.esc(S.app.toUpperCase()) + '</div><div class="' + P + '-tm" style="font-size:12px;color:#6e6e73;white-space:nowrap">' + T.esc(S.waktu) + '</div></div>' +
            '<div class="' + P + '-ititle">' + T.esc(S.judul) + '</div>' +
            '<div class="' + P + '-ibody">' + T.esc(S.isi) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
      stage.classList.remove('dk');
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selGaya = T.select([['android', 'Android'], ['iphone', 'iPhone']], S.gaya);
  const inApp = T.input('text', 'Nama aplikasi', S.app);
  const inJudul = T.input('text', 'Judul notifikasi', S.judul);
  const inIsi = T.ta(3, 'Isi pesan', S.isi);
  const inWaktu = T.input('text', 'now', S.waktu);
  const selTema = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], S.tema);
  const inWarna = T.input('color', '', S.warna);
  const inAksi1 = T.input('text', 'Tombol aksi 1 (opsional)', S.aksi1);
  const inAksi2 = T.input('text', 'Tombol aksi 2 (opsional)', S.aksi2);
  const fi = fileInput('image/*');
  const fiField = T.field('Ikon aplikasi (upload, opsional)', fi, 'Kalau kosong, dipakai huruf inisial + warna di bawah.');

  const temaField = T.field('Tema', selTema, 'Hanya berlaku untuk gaya Android.');
  const aksiField = T.el('<div></div>');
  aksiField.appendChild(T.field('Tombol aksi 1 (Android)', inAksi1));
  aksiField.appendChild(T.field('Tombol aksi 2 (Android)', inAksi2));

  function syncVis() {
    const and = selGaya.value === 'android';
    temaField.hidden = !and;
    aksiField.hidden = !and;
  }

  function pull() {
    S.gaya = selGaya.value; S.app = inApp.value; S.judul = inJudul.value;
    S.isi = inIsi.value; S.waktu = inWaktu.value || 'now'; S.tema = selTema.value;
    S.warna = inWarna.value; S.aksi1 = inAksi1.value; S.aksi2 = inAksi2.value;
  }

  [selGaya, inApp, inJudul, inIsi, inWaktu, selTema, inWarna, inAksi1, inAksi2].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); syncVis(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.ikon = URL.createObjectURL(fi.files[0]); draw(); }
  });

  const bContoh = T.btn('Contoh', () => {
    selGaya.value = 'android'; inApp.value = 'WhatsApp'; inJudul.value = 'Mama';
    inIsi.value = 'Nak, pulang jam berapa?\nMama masak rendang nih'; inWaktu.value = 'now';
    selTema.value = 'terang'; inWarna.value = '#25D366';
    inAksi1.value = 'Balas'; inAksi2.value = 'Tandai dibaca';
    S.ikon = ''; fi.value = '';
    pull(); syncVis(); draw(); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-notif-hp.png'); }, true);

  wrap.appendChild(T.field('Gaya notifikasi', selGaya));
  wrap.appendChild(T.field('Nama aplikasi', inApp));
  wrap.appendChild(T.field('Judul', inJudul));
  wrap.appendChild(T.field('Isi pesan', inIsi));
  wrap.appendChild(T.field('Waktu', inWaktu));
  wrap.appendChild(temaField);
  wrap.appendChild(fiField);
  wrap.appendChild(T.field('Warna inisial (kalau tanpa upload ikon)', inWarna));
  wrap.appendChild(aksiField);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export. Di iPhone, efek kaca buram tampil di layar; hasil PNG memakai latar solid.</p>'));
  root.appendChild(wrap);

  pull(); syncVis(); draw();
}
