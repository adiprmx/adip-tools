import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js';

export const meta = {
  id: 'fake-chat-twitch',
  name: 'Fake Chat Twitch',
  cat: 'fakesos',
  icon: '🎮',
  desc: 'Bikin mockup chat Twitch palsu: putar seperti live stream, latar green screen + unduh PNG.',
  keywords: 'twitch,chat,live,stream,fake,palsu,screenshot,prank,green screen',
  since: '6.19.0',
};

/* Twitch: latar gelap #18181B, username berwarna, badge mod/sub/vip, jam abu.
   Warna username default di-hash dari nama (palet Twitch). Tombol Putar
   memunculkan pesan satu per satu seperti live; latar hijau untuk chroma key.
   Ekspor video belum ada — unduh PNG saja (jujur di catatan bawah). */
const PALET = ['#FF0000', '#0000FF', '#008000', '#B22222', '#FF69B4', '#FF7F50', '#9ACD32', '#FF4500', '#2E8B57', '#DAA520', '#D2691E', '#5F9EA0', '#1E90FF', '#FF00FF', '#00FF7F'];

export function warnaUser(nama) {
  let hsh = 0;
  const s = String(nama || '?');
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) >>> 0;
  return PALET[hsh % PALET.length];
}

const SAMPLE =
  'rizkygaming|mod: W KONTENNYA BANG\n' +
  'dinaaa|sub: baru join, lagi main apa?\n' +
  'adip_rmx: gas ranked malam ini\n' +
  'kucingoren|vip|warna=#FF69B4: POGGERS\n' +
  'budi_88: ketawa dulu wkwkwk';

/* Format: nama|badge|warna=#hex: pesan — badge: mod / sub / vip (boleh kosong). */
export function parseChat(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const ci = line.search(/:(?!\d)/);
    if (ci < 0) return;
    const pre = line.slice(0, ci).trim();
    const msg = line.slice(ci + 1).trim();
    if (!msg) return;
    const parts = pre.split('|').map((s) => s.trim());
    const nama = parts[0] || 'user';
    let badge = '', warna = '';
    parts.slice(1).forEach((p) => {
      if (/^(mod|sub|vip)$/i.test(p)) badge = p.toLowerCase();
      else if (/^warna=#[0-9a-fA-F]{6}$/.test(p)) warna = p.slice(6);
    });
    out.push({ nama, badge, warna: warna || warnaUser(nama), msg });
  });
  return out;
}

const SVG_MOD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#00AD03" aria-hidden="true"><path d="M5 3l14 7-5 2-3 8-2-6-6-2z"/></svg>';
const SVG_SUB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#9146FF" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
const SVG_VIP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#E005B9" aria-hidden="true"><path d="M12 2L2 8l10 14L22 8z"/></svg>';
const BADGE = { mod: SVG_MOD, sub: SVG_SUB, vip: SVG_VIP };

export function render(root) {
  root.appendChild(T.el(`<style>
.fctw-ctl{display:grid;gap:10px;margin-bottom:12px}
.fctw-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#18181B;font-family:Roobert,"Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fctw-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#18181B;color:#EFEFF1}
.fctw-hd{display:flex;align-items:center;height:52px;padding:0 12px;background:#18181B;border-bottom:1px solid #26262C;color:#EFEFF1}
.fctw-hd b{font-size:15px;font-weight:600}
.fctw-live{display:inline-flex;align-items:center;gap:5px;background:#EB0400;color:#fff;font-size:12px;font-weight:700;padding:3px 8px;border-radius:4px;margin-left:10px}
.fctw-live i{width:7px;height:7px;border-radius:50%;background:#fff;display:block}
.fctw-view{margin-left:auto;font-size:13px;color:#ADADB8}
.fctw-chat{padding:10px 12px 12px;min-height:360px;background:#18181B}
.fctw-green .fctw-chat{background:#00B140}
.fctw-green .fctw-sb,.fctw-green .fctw-hd,.fctw-green .fctw-ibar,.fctw-green .fctw-nav,.fctw-green .fctw-home,.fctw-green .fctw-pranktag-wrap{background:#00B140;border-color:#00B140}
.fctw-msg{font-size:14.5px;line-height:1.55;color:#EFEFF1;padding:3px 0;overflow-wrap:break-word}
.fctw-msg .fctw-bdg{display:inline-flex;vertical-align:-3px;margin-right:5px}
.fctw-msg .fctw-time{color:#ADADB8;font-size:12.5px;margin-right:6px}
.fctw-msg b{font-weight:700}
.fctw-ibar{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;background:#18181B;border-top:1px solid #26262C}
.fctw-pill{flex:1;display:flex;align-items:center;background:#26262C;border:1px solid #464649;border-radius:8px;min-height:40px;padding:0 12px}
.fctw-ph{flex:1;font-size:14px;color:#ADADB8}
.fctw-send{width:36px;height:36px;flex:none;border-radius:6px;background:#9146FF;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.fctw-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#18181B}
.fctw-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(255,255,255,.4)}
.fctw-home{display:flex;justify-content:center;align-items:center;height:20px;background:#18181B}
.fctw-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(255,255,255,.4)}
.fctw-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#18181B}
.fctw-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fctw-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fctw-hint code{font-family:monospace;font-size:11.5px}
.fctw-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fctw-ctl"></div>');
  const inChannel = T.input('text', 'Nama channel', 'adip_rmx');
  const inView = T.input('text', 'Jumlah penonton', '1,2 rb');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const selJam = T.select([['1', 'Tampilkan jam'], ['0', 'Sembunyikan jam']], '1');
  const selBg = T.select([['gelap', 'Gelap (standar)'], ['hijau', 'Hijau (green screen)']], 'gelap');
  const selKecepatan = T.select([['700', 'Cepat (0,7 dtk)'], ['1200', 'Normal (1,2 dtk)'], ['2000', 'Lambat (2 dtk)']], '1200');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: nama: pesan', SAMPLE);

  ctl.appendChild(T.field('Nama channel', inChannel));
  ctl.appendChild(T.field('Jumlah penonton', inView));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Jam di tiap pesan', selJam));
  ctl.appendChild(T.field('Latar', selBg));
  ctl.appendChild(T.field('Kecepatan putar', selKecepatan));
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fctw-hint">Format: <code>nama: pesan</code>. Badge: <code>nama|mod: pesan</code>, <code>|sub</code>, <code>|vip</code>. Warna nama sendiri: <code>|warna=#FF69B4</code>. Tombol Putar memunculkan pesan satu per satu seperti live.</div>'));

  const phone = T.el('<div class="fctw-phone"></div>');
  let timer = null, tampil = -1;

  const btnPutar = T.btn('▶️ Putar', () => {
    const msgs = parseChat(taMsg.value);
    if (!msgs.length) return;
    if (timer) { clearInterval(timer); timer = null; btnPutar.textContent = '▶️ Putar'; return; }
    tampil = 0;
    draw();
    btnPutar.textContent = '⏸️ Berhenti';
    timer = setInterval(() => {
      tampil++;
      if (tampil >= msgs.length) { clearInterval(timer); timer = null; btnPutar.textContent = '▶️ Putar'; }
      draw();
    }, Number(selKecepatan.value) || 1200);
  });
  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inChannel.value = 'adip_rmx'; inView.value = '1,2 rb'; selJam.value = '1';
      selBg.value = 'gelap'; taMsg.value = SAMPLE; tampil = -1;
      if (timer) { clearInterval(timer); timer = null; btnPutar.textContent = '▶️ Putar'; }
      draw(); T.scrollToPreview(phone);
    }),
    btnPutar,
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-twitch.png'), true)
  );
  T.onLeave(() => { if (timer) clearInterval(timer); });

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const channel = inChannel.value.trim() || 'channel';
    const view = inView.value.trim() || '';
    const showJam = selJam.value === '1';
    const hijau = selBg.value === 'hijau';
    let msgs = parseChat(taMsg.value);
    if (tampil >= 0) msgs = msgs.slice(0, tampil);

    let chatHtml = '';
    msgs.forEach((m, i) => {
      const jam = showJam ? '<span class="fctw-time">' + String(21 + Math.floor(i / 60)).padStart(2, '0') + ':' + String(i % 60).padStart(2, '0') + '</span>' : '';
      const bdg = m.badge ? '<span class="fctw-bdg">' + BADGE[m.badge] + '</span>' : '';
      chatHtml += '<div class="fctw-msg">' + jam + bdg + '<b style="color:' + m.warna + '">' + T.esc(m.nama) + '</b><span style="color:#ADADB8">: </span>' + T.esc(m.msg) + '</div>';
    });

    const sbHtml = '<div class="fctw-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, true) + '</div>';
    const hdHtml = '<div class="fctw-hd"><b>' + T.esc(channel) + '</b><span class="fctw-live"><i></i>LIVE</span>' +
      (view ? '<span class="fctw-view">👁 ' + T.esc(view) + '</span>' : '') + '</div>';
    const ibarHtml = '<div class="fctw-ibar"><div class="fctw-pill"><span class="fctw-ph">Kirim chat</span></div>' +
      '<div class="fctw-send">Chat</div></div>' +
      (isIPh ? '<div class="fctw-home"><i></i></div>' : '<div class="fctw-nav"><i></i></div>');

    phone.className = 'fctw-phone' + (hijau ? ' fctw-green' : '');
    phone.innerHTML = sbHtml + hdHtml + '<div class="fctw-chat">' + chatHtml + '</div>' + ibarHtml +
      '<div class="fctw-pranktag-wrap"><span class="fctw-pranktag">palsu · cuma prank</span></div>';
  }

  [inChannel, inView, selPlatform, selBrand, selJam, selBg, selKecepatan, taMsg].forEach((el) => {
    el.addEventListener('input', () => { tampil = -1; draw(); });
    el.addEventListener('change', () => { tampil = -1; draw(); });
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fctw-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan chat Twitch asli. Ekspor video belum tersedia, unduh PNG saja.') + '</div>'));
  draw();
}
