import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-call","name":"Fake Panggilan Masuk","cat":"fakesos","icon":"📞","desc":"Bikin screenshot layar panggilan masuk palsu + unduh PNG.","keywords":"telepon,call,panggilan,fake,palsu,screenshot,prank"};

const P = 'fkcl';

export function render(root) {
  const S = { gaya: 'android', nama: 'Mama', nomor: '+62 812-3456-7890', avatar: '' };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0}' +
    '.' + P + '-screen{width:360px;height:640px;max-width:100%;border-radius:18px;overflow:hidden;position:relative;font-family:-apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",Arial,sans-serif;color:#fff;box-shadow:0 10px 34px rgba(0,0,0,.4)}' +
    '.' + P + '-bg{position:absolute;inset:-34px;background-size:cover;background-position:center;filter:blur(38px) brightness(.5)}' +
    '.' + P + '-dim{position:absolute;inset:0}' +
    '.' + P + '-ct{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
    '.' + P + '-sb{display:flex;align-items:center;justify-content:space-between;padding:12px 18px 0;font-size:13px;font-weight:600}' +
    '.' + P + '-sb .tm{letter-spacing:.3px}' +
    '.' + P + '-sbic{display:flex;align-items:center;gap:6px}' +
    '.' + P + '-sig{display:inline-flex;align-items:flex-end;gap:2px;height:12px}' +
    '.' + P + '-sig i{width:3px;background:#fff;border-radius:1px;display:block}' +
    '.' + P + '-batt{width:24px;height:12px;border:1px solid rgba(255,255,255,.6);border-radius:3px;position:relative;display:inline-block}' +
    '.' + P + '-batt i{position:absolute;inset:1.5px;background:#fff;border-radius:1.5px;display:block;width:72%}' +
    '.' + P + '-batt:after{content:"";position:absolute;right:-4px;top:3px;width:2px;height:4px;background:rgba(255,255,255,.6);border-radius:0 2px 2px 0}' +
    '.' + P + '-island{width:104px;height:27px;background:#000;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}' +
    '.' + P + '-head{text-align:center;padding:34px 20px 0}' +
    '.' + P + '-lbl{font-size:14px;color:rgba(255,255,255,.85)}' +
    '.' + P + '-nm{font-size:28px;font-weight:500;margin-top:6px;word-break:break-word}' +
    '.' + P + '-no{font-size:15px;color:rgba(255,255,255,.62);margin-top:5px}' +
    '.' + P + '-avwrap{display:flex;justify-content:center;margin-top:30px}' +
    '.' + P + '-av{width:100px;height:100px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.16);color:#fff;font-size:38px;font-weight:600;box-shadow:0 4px 18px rgba(0,0,0,.35)}' +
    '.' + P + '-av img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-av.big{width:110px;height:110px;font-size:42px}' +
    '.' + P + '-sp{flex:1}' +
    '.' + P + '-btns{display:flex;justify-content:center;gap:72px;padding:0 0 52px}' +
    '.' + P + '-cbtn{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;border:0;cursor:default}' +
    '.' + P + '-cbtn.sm{width:60px;height:60px}' +
    '.' + P + '-no{background:#ff4b4b}' +
    '.' + P + '-yes{background:#34c759}' +
    '.' + P + '-and{background:linear-gradient(180deg,#1a1a2e 0%,#0b0b14 100%)}' +
    '.' + P + '-and .' + P + '-dim{background:linear-gradient(180deg,rgba(11,11,20,.42) 0%,rgba(11,11,20,.66) 100%)}' +
    '.' + P + '-wa{background:#0b141a}' +
    '.' + P + '-wa .' + P + '-dim{background:linear-gradient(180deg,rgba(11,20,26,.30) 0%,rgba(11,20,26,.55) 100%)}' +
    '.' + P + '-wa .' + P + '-lbl{font-size:13px;color:rgba(255,255,255,.6)}' +
    '.' + P + '-wa .' + P + '-nm{font-size:24px}' +
    '.' + P + '-wa .' + P + '-sub{font-size:14px;color:rgba(255,255,255,.62);margin-top:6px}' +
    '.' + P + '-pill{align-self:center;background:rgba(255,255,255,.13);border-radius:999px;padding:11px 22px;font-size:14px;color:#fff;margin-bottom:26px;white-space:nowrap}' +
    '.' + P + '-ios{background:#000}' +
    '.' + P + '-ios .' + P + '-lbl{font-size:13px;color:#8e8e93}' +
    '.' + P + '-ios .' + P + '-nm{font-size:34px;font-weight:600;margin-top:4px}' +
    '.' + P + '-iosrow{display:flex;justify-content:space-between;padding:0 44px;margin-bottom:30px;font-size:13px;color:#fff}' +
    '.' + P + '-iospill{align-self:center;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.16);border-radius:999px;padding:13px 26px;font-size:15px;color:#fff;margin-bottom:34px;white-space:nowrap}' +
    '.' + P + '-iospill .ph{font-size:20px}';
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
  function sbAndroid() {
    return '<div class="' + P + '-sb"><span class="tm">9:41</span>' + sbIcons() + '</div>';
  }
  function sbIos() {
    return '<div class="' + P + '-sb"><span class="tm">9:41</span><span class="' + P + '-island"></span>' + sbIcons() + '</div>';
  }

  function avHtml(big) {
    const inner = S.avatar
      ? '<img src="' + T.esc(S.avatar) + '" alt="">'
      : T.esc(initial(S.nama));
    return '<div class="' + P + '-avwrap"><div class="' + P + '-av' + (big ? ' big' : '') + '">' + inner + '</div></div>';
  }

  function bgBlur() {
    if (!S.avatar) return '';
    return '<div class="' + P + '-bg" style="background-image:url(\'' + T.esc(S.avatar) + '\')"></div>';
  }

  function draw() {
    let html = '';
    if (S.gaya === 'android') {
      html = '<div class="' + P + '-screen ' + P + '-and">' + bgBlur() +
        '<div class="' + P + '-dim"></div>' +
        '<div class="' + P + '-ct">' + sbAndroid() +
          '<div class="' + P + '-head">' +
            '<div class="' + P + '-lbl">Panggilan masuk</div>' +
            '<div class="' + P + '-nm">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-no">' + T.esc(S.nomor) + '</div>' +
          '</div>' + avHtml(false) +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-btns">' +
            '<div class="' + P + '-cbtn ' + P + '-no">✕</div>' +
            '<div class="' + P + '-cbtn ' + P + '-yes">📞</div>' +
          '</div>' +
        '</div></div>';
    } else if (S.gaya === 'whatsapp') {
      html = '<div class="' + P + '-screen ' + P + '-wa">' + bgBlur() +
        '<div class="' + P + '-dim"></div>' +
        '<div class="' + P + '-ct">' + sbAndroid() +
          '<div class="' + P + '-head">' +
            '<div class="' + P + '-lbl">🔒 WhatsApp</div>' +
            '<div class="' + P + '-nm">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-sub">Panggilan suara masuk</div>' +
          '</div>' + avHtml(true) +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-pill">Geser ke atas untuk menjawab</div>' +
          '<div class="' + P + '-btns" style="gap:64px;padding-bottom:44px">' +
            '<div class="' + P + '-cbtn sm ' + P + '-no">✕</div>' +
            '<div class="' + P + '-cbtn sm ' + P + '-yes">📞</div>' +
          '</div>' +
        '</div></div>';
    } else {
      html = '<div class="' + P + '-screen ' + P + '-ios">' +
        '<div class="' + P + '-ct">' + sbIos() +
          '<div class="' + P + '-head">' +
            '<div class="' + P + '-lbl">seluler</div>' +
            '<div class="' + P + '-nm">' + T.esc(S.nama) + '</div>' +
          '</div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-iosrow"><span>Ingatkan Saya</span><span>Pesan</span></div>' +
          '<div class="' + P + '-iospill"><span class="ph">📞</span><span>geser untuk menjawab</span></div>' +
          '<div class="' + P + '-btns">' +
            '<div class="' + P + '-cbtn ' + P + '-no">✕</div>' +
            '<div class="' + P + '-cbtn ' + P + '-yes">📞</div>' +
          '</div>' +
        '</div></div>';
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selGaya = T.select([['android', 'Android'], ['whatsapp', 'WhatsApp'], ['iphone', 'iPhone']], S.gaya);
  const inNama = T.input('text', 'Nama penelepon', S.nama);
  const inNomor = T.input('text', 'Nomor / label', S.nomor);
  const fi = fileInput('image/*');
  const fiField = T.field('Foto avatar (upload, opsional)', fi, 'Android & WhatsApp: foto juga dipakai sebagai latar blur. iPhone menyembunyikan avatar seperti aslinya.');

  function pull() {
    S.gaya = selGaya.value; S.nama = inNama.value; S.nomor = inNomor.value;
  }
  [selGaya, inNama, inNomor].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.avatar = URL.createObjectURL(fi.files[0]); draw(); }
  });

  const bContoh = T.btn('Contoh', () => {
    selGaya.value = 'android'; inNama.value = 'Mama'; inNomor.value = '+62 812-3456-7890';
    S.avatar = ''; fi.value = '';
    pull(); draw(); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-call.png'); }, true);

  wrap.appendChild(T.field('Gaya layar', selGaya));
  wrap.appendChild(T.field('Nama penelepon', inNama));
  wrap.appendChild(T.field('Nomor / label', inNomor));
  wrap.appendChild(fiField);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export. Efek blur latar tampil di layar; hasil PNG memakai latar redup.</p>'));
  root.appendChild(wrap);

  pull(); draw();
}
