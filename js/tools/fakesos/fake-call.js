import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js?v=6.9.0';

export const meta = {"id":"fake-call","name":"Fake Panggilan Masuk","cat":"fakesos","icon":"📞","desc":"Bikin screenshot layar panggilan masuk palsu + unduh PNG.","keywords":"telepon,call,panggilan,fake,palsu,screenshot,prank"};

const P = 'fkcl';

export function render(root) {
  const S = { platform: 'android', tipe: 'masuk', media: 'audio', nama: 'Mama', avatar: '' };

  const css = document.createElement('style');
  css.textContent =
    '.' + P + '-wrap{max-width:560px}' +
    '.' + P + '-stage{display:flex;justify-content:center;margin:14px 0;padding:26px 12px;background:#101014;border-radius:14px}' +
    '.' + P + '-screen{width:360px;height:640px;max-width:100%;border-radius:26px;overflow:hidden;position:relative;flex:none;font-family:-apple-system,BlinkMacSystemFont,Roboto,"Segoe UI",Arial,sans-serif;color:#fff;background:#0b141a;box-shadow:0 12px 40px rgba(0,0,0,.5)}' +
    '.' + P + '-bg{position:absolute;inset:-40px;background-size:cover;background-position:center;filter:blur(42px) brightness(.45)}' +
    '.' + P + '-dim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,16,.22) 0%,rgba(8,12,16,.62) 100%)}' +
    '.' + P + '-ct{position:relative;z-index:1;height:100%;display:flex;flex-direction:column}' +
    // status bar android
    '.' + P + '-sba{display:flex;align-items:center;justify-content:space-between;padding:14px 22px 0;font-size:14px;font-weight:500}' +
    '.' + P + '-punch{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:13px;height:13px;border-radius:50%;background:#000;box-shadow:inset 0 0 3px 1px rgba(70,70,95,.9);z-index:2}' +
    // status bar iphone + dynamic island
    '.' + P + '-sbi{display:flex;align-items:center;justify-content:space-between;padding:17px 27px 0;font-size:15px;font-weight:600}' +
    '.' + P + '-island{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:208px;height:28px;background:#000;border-radius:40px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.16);z-index:2}' +
    '.' + P + '-sbic{display:flex;align-items:center;gap:7px}' +
    '.' + P + '-sig{display:inline-flex;align-items:flex-end;gap:2.5px;height:12px}' +
    '.' + P + '-sig i{width:3px;background:#fff;border-radius:1.5px;display:block}' +
    '.' + P + '-wifi{display:inline-block;vertical-align:-1px}' +
    '.' + P + '-batt{width:25px;height:12px;border:1px solid rgba(255,255,255,.5);border-radius:4px;position:relative;display:inline-block}' +
    '.' + P + '-batt i{position:absolute;top:2px;left:2px;bottom:2px;background:#fff;border-radius:2px;display:block;width:70%}' +
    '.' + P + '-batt:after{content:"";position:absolute;right:-4px;top:3.5px;width:2px;height:4px;background:rgba(255,255,255,.5);border-radius:0 2px 2px 0}' +
    // bottom chrome
    '.' + P + '-home{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);width:123px;height:4px;border-radius:3px;background:rgba(255,255,255,.88);z-index:2}' +
    '.' + P + '-navpill{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);width:104px;height:4px;border-radius:3px;background:rgba(255,255,255,.55);z-index:2}' +
    // avatar
    '.' + P + '-avwrap{display:flex;justify-content:center}' +
    '.' + P + '-av{width:124px;height:124px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.14);color:#fff;font-size:46px;font-weight:600;box-shadow:0 6px 24px rgba(0,0,0,.4)}' +
    '.' + P + '-av img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.' + P + '-av.lg{width:152px;height:152px;font-size:56px}' +
    // incoming
    '.' + P + '-inhead{text-align:center;padding:60px 24px 0}' +
    '.' + P + '-inhead .' + P + '-avwrap{margin-bottom:4px}' +
    '.' + P + '-nm{font-size:28px;font-weight:500;margin-top:20px;word-break:break-word}' +
    '.' + P + '-callabel{font-size:15px;color:rgba(255,255,255,.72);margin-top:8px}' +
    '.' + P + '-sp{flex:1}' +
    '.' + P + '-inbtns{display:flex;justify-content:center;gap:52px;padding:0 0 66px}' +
    '.' + P + '-pillbtn{min-width:104px;height:56px;padding:0 26px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:9px;font-size:16px;font-weight:600;color:#fff}' +
    '.' + P + '-accept{background:#25d366;box-shadow:0 6px 22px rgba(37,211,102,.45)}' +
    '.' + P + '-decline{background:#f04438;box-shadow:0 6px 22px rgba(240,68,56,.42)}' +
    '.' + P + '-ph{font-size:24px;line-height:1}' +
    '.' + P + '-ph.down{transform:rotate(135deg);display:inline-block}' +
    '.' + P + '-phlg{font-size:32px}' +
    // ongoing
    '.' + P + '-onhead{text-align:center;padding:48px 24px 0}' +
    '.' + P + '-onnm{font-size:24px;font-weight:600;word-break:break-word}' +
    '.' + P + '-ontimer{font-size:14px;color:rgba(255,255,255,.66);margin-top:7px;letter-spacing:1.5px}' +
    '.' + P + '-onhead + .' + P + '-avwrap{margin-top:36px}' +
    '.' + P + '-islandbar{align-self:center;display:flex;align-items:center;gap:15px;background:rgba(22,26,33,.55);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:10px 18px;margin-top:38px}' +
    '.' + P + '-ctl{width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,.42);display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff}' +
    '.' + P + '-endrow{display:flex;justify-content:center;padding:28px 0 0}' +
    '.' + P + '-endbtn{width:74px;height:74px;border-radius:50%;background:#ff3b30;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(255,59,48,.55)}';
  root.appendChild(css);

  const wrap = T.el('<div class="' + P + '-wrap"></div>');
  const stage = T.el('<div class="' + P + '-stage"></div>');
  let frame = null;

  const initial = (s) => (s || '?').trim().charAt(0).toUpperCase();

  function sbIcons() {
    return '<span class="' + P + '-sbic">' +
      '<span class="' + P + '-sig"><i style="height:4px"></i><i style="height:6px"></i><i style="height:9px"></i><i style="height:12px"></i></span>' +
      '<svg class="' + P + '-wifi" viewBox="0 0 16 13" width="16" height="13" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"><path d="M1.8 4.6a9.2 9.2 0 0 1 12.4 0"/><path d="M4.4 7.4a5.6 5.6 0 0 1 7.2 0"/><circle cx="8" cy="10.4" r="1.15" fill="#fff" stroke="none"/></svg>' +
      '<span class="' + P + '-batt"><i></i></span>' +
    '</span>';
  }
  function sb() {
    if (S.platform === 'iphone') {
      return '<div class="' + P + '-sbi"><span>9:41</span>' + sbIcons() + '</div><div class="' + P + '-island"></div>';
    }
    return '<div class="' + P + '-sba"><span>9:41</span>' + sbIcons() + '</div><div class="' + P + '-punch"></div>';
  }
  function bottomChrome() {
    return S.platform === 'iphone'
      ? '<div class="' + P + '-home"></div>'
      : '<div class="' + P + '-navpill"></div>';
  }

  function avHtml(size) {
    const inner = S.avatar
      ? '<img src="' + T.esc(S.avatar) + '" alt="">'
      : T.esc(initial(S.nama));
    return '<div class="' + P + '-avwrap"><div class="' + P + '-av' + (size ? ' ' + size : '') + '">' + inner + '</div></div>';
  }

  function bgBlur() {
    if (!S.avatar) return '';
    return '<div class="' + P + '-bg" style="background-image:url(\'' + T.esc(S.avatar) + '\')"></div>';
  }

  function draw() {
    let html = '';
    if (S.tipe === 'masuk') {
      const lbl = S.media === 'video' ? 'WhatsApp Video' : 'WhatsApp Audio';
      html = '<div class="' + P + '-screen">' + bgBlur() +
        '<div class="' + P + '-dim"></div>' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-inhead">' + avHtml('') +
            '<div class="' + P + '-nm">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-callabel">' + lbl + '</div>' +
          '</div>' +
          '<div class="' + P + '-sp"></div>' +
          '<div class="' + P + '-inbtns">' +
            '<div class="' + P + '-pillbtn ' + P + '-decline"><span class="' + P + '-ph ' + P + '-down">✆</span><span>Tolak</span></div>' +
            '<div class="' + P + '-pillbtn ' + P + '-accept"><span class="' + P + '-ph">✆</span><span>Jawab</span></div>' +
          '</div>' +
        '</div>' + bottomChrome() + '</div>';
    } else {
      html = '<div class="' + P + '-screen">' + bgBlur() +
        '<div class="' + P + '-dim"></div>' +
        '<div class="' + P + '-ct">' + sb() +
          '<div class="' + P + '-onhead">' +
            '<div class="' + P + '-onnm">' + T.esc(S.nama) + '</div>' +
            '<div class="' + P + '-ontimer">00:00</div>' +
          '</div>' + avHtml('lg') +
          '<div class="' + P + '-islandbar">' +
            '<div class="' + P + '-ctl">🎤</div>' +
            '<div class="' + P + '-ctl">📹</div>' +
            '<div class="' + P + '-ctl">🔊</div>' +
            '<div class="' + P + '-ctl">⤓</div>' +
            '<div class="' + P + '-ctl">⋮</div>' +
          '</div>' +
          '<div class="' + P + '-endrow"><div class="' + P + '-endbtn"><span class="' + P + '-ph ' + P + '-down ' + P + '-phlg">✆</span></div></div>' +
          '<div class="' + P + '-sp"></div>' +
        '</div>' + bottomChrome() + '</div>';
    }
    frame = T.el(html);
    stage.innerHTML = '';
    stage.appendChild(frame);
  }

  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], S.platform);
  const selTipe = T.select([['masuk', 'Panggilan masuk'], ['berlangsung', 'Panggilan berlangsung']], S.tipe);
  const selMedia = T.select([['audio', 'Audio'], ['video', 'Video']], S.media);
  const inNama = T.input('text', 'Nama kontak', S.nama);
  const fi = fileInput('image/*');
  const fiField = T.field('Foto avatar (upload, opsional)', fi, 'Foto juga dipakai sebagai latar blur di belakang layar panggilan.');

  function pull() {
    S.platform = selPlatform.value; S.tipe = selTipe.value;
    S.media = selMedia.value; S.nama = inNama.value;
  }
  [selPlatform, selTipe, selMedia, inNama].forEach((elm) => {
    elm.addEventListener('input', () => { pull(); draw(); });
    elm.addEventListener('change', () => { pull(); draw(); });
  });
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { S.avatar = URL.createObjectURL(fi.files[0]); draw(); }
  });

  const bContoh = T.btn('🎲 Contoh', () => {
    selTipe.value = 'masuk'; selMedia.value = 'audio'; inNama.value = 'Mama';
    S.avatar = ''; fi.value = '';
    pull(); draw(); T.toast('Contoh dimuat');
  });
  const bDl = T.btn('⬇️ Unduh PNG', () => { if (frame) dlNodePng(frame, 'fake-call.png'); }, true);

  wrap.appendChild(T.field('Platform', selPlatform));
  wrap.appendChild(T.field('Tipe panggilan', selTipe));
  wrap.appendChild(T.field('Audio / Video', selMedia));
  wrap.appendChild(T.field('Nama kontak', inNama));
  wrap.appendChild(fiField);
  wrap.appendChild(T.row(bContoh, bDl));
  wrap.appendChild(stage);
  wrap.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  wrap.appendChild(T.el('<p class="hint">Tips: export PNG butuh koneksi internet sekali untuk memuat pustaka export. Efek blur latar tampil di layar; hasil PNG memakai latar redup.</p>'));
  root.appendChild(wrap);

  pull(); draw();
}
