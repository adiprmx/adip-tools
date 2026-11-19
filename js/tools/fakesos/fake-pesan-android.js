import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-pesan-android',
  name: 'Fake Pesan Android',
  cat: 'fakesos',
  icon: '💬',
  desc: 'Bikin mockup pesan teks Android gaya Google Messages dengan warna Material You + unduh PNG.',
  keywords: 'android,google messages,sms,rcs,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Google Messages: bubble keluar warna Material You (bisa diganti),
   bubble masuk abu muda, label "RCS" di bawah pesan keluar, status
   "Dibaca" + jam, reaksi menempel di atas bubble. */
const TEMA = {
  biru: { label: 'Biru', out: '#D3E3FD', outFg: '#041E49', aksen: '#0B57D0' },
  hijau: { label: 'Hijau', out: '#C4EED0', outFg: '#0B3D1C', aksen: '#146C2E' },
  ungu: { label: 'Ungu', out: '#E8DEF8', outFg: '#381E72', aksen: '#6B4EAB' },
  pink: { label: 'Pink', out: '#FAD2E0', outFg: '#571B38', aksen: '#B3266B' },
  oranye: { label: 'Oranye', out: '#FFE1C2', outFg: '#5C2300', aksen: '#C25100' },
};

const SAMPLE =
  'A|09:12: besok jadi futsal kan?\n' +
  'B|09:13|react=👍: jadi dong, jam 8 malem\n' +
  'A|09:14: jangan telat lagi ya\n' +
  'B|09:15|baca: aman, gue berangkat dari sekarang';

/* Format: A|09:12: teks | flag |react=👍 |baca (status Dibaca di bawah pesan). */
export function parseMsgs(text) {
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
    const side = parts[0].toUpperCase() === 'B' ? 'B' : 'A';
    let time = '', react = [], baca = false;
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^react=/i.test(p)) react = p.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
      else if (/^baca$/i.test(p)) baca = true;
    });
    out.push({ side, time, msg, react, baca });
  });
  return out;
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CALL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VID = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_PLUS = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 8v8M8 12h8"/></svg>';
const SVG_SMILE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.4 2.1 3.8 2.1 3.8-2.1 3.8-2.1"/><line x1="9.2" y1="9.4" x2="9.2" y2="9.4"/><line x1="14.8" y1="9.4" x2="14.8" y2="9.4"/></svg>';
const SVG_SEND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fpa-ctl{display:grid;gap:10px;margin-bottom:12px}
.fpa-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#FEFBFF;font-family:Roboto,"Segoe UI",system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fpa-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#FEFBFF;color:#1C1B1F}
.fpa-hd{display:flex;align-items:center;height:60px;padding:0 10px 0 2px;background:#FEFBFF}
.fpa-bk{background:none;border:0;padding:10px 6px 10px 10px;cursor:pointer;display:flex;align-items:center;color:#49454F}
.fpa-av{width:40px;height:40px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;overflow:hidden;flex:none}
.fpa-av img{width:100%;height:100%;object-fit:cover;display:block}
.fpa-nm{flex:1;min-width:0;margin-left:9px}
.fpa-nm b{display:block;font-size:17px;font-weight:500;color:#1C1B1F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpa-nm span{display:block;font-size:13px;color:#49454F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fpa-hic{display:flex;align-items:center;gap:22px;padding-right:10px;color:#49454F;flex:none}
.fpa-chat{display:flex;flex-direction:column;padding:10px 14px 12px;min-height:340px;background:#FEFBFF}
.fpa-chip{align-self:center;background:#F3EDF7;color:#49454F;font-size:12.5px;font-weight:500;padding:6px 12px;border-radius:12px;margin:6px 0 10px}
.fpa-bub{position:relative;max-width:78%;padding:9px 14px;border-radius:22px;font-size:15.5px;line-height:1.45;margin-top:4px;overflow-wrap:break-word;white-space:pre-wrap}
.fpa-in{align-self:flex-start;background:#F3EDF7;color:#1C1B1F;border-bottom-left-radius:6px}
.fpa-out{align-self:flex-end;border-bottom-right-radius:6px}
.fpa-meta{font-size:11.5px;color:#49454F;margin:3px 4px 2px;text-align:right}
.fpa-inmeta{text-align:left}
.fpa-react{position:absolute;top:-13px;right:10px;background:#fff;border:1px solid #E7E0EC;border-radius:12px;padding:2px 7px;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.fpa-in .fpa-react{right:auto;left:10px}
.fpa-ibar{display:flex;align-items:center;gap:8px;padding:8px 10px 10px;background:#FEFBFF}
.fpa-pill{flex:1;display:flex;align-items:center;background:#F3EDF7;border-radius:24px;min-height:48px;padding:0 12px;gap:8px}
.fpa-ph{flex:1;font-size:15.5px;color:#49454F;white-space:nowrap;overflow:hidden}
.fpa-send{width:44px;height:44px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center}
.fpa-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#FEFBFF}
.fpa-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fpa-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#FEFBFF}
.fpa-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fpa-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fpa-hint code{font-family:monospace;font-size:11.5px}
.fpa-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fpa-ctl"></div>');
  const inName = T.input('text', 'Nama kontak', 'Rizky');
  const inStatus = T.input('text', 'Status', 'RCS • Online');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'pixel');
  const selTema = T.select(Object.keys(TEMA).map((k) => [k, TEMA[k].label]), 'biru');
  const inChip = T.input('text', 'Teks chip tanggal', 'Hari ini');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: A|10:30: halo', SAMPLE);

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avatarUrl = null;
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { avatarUrl = URL.createObjectURL(fi.files[0]); draw(); }
  });
  const btnAvatar = T.btn('📷 Upload Avatar', () => fi.click());

  ctl.appendChild(T.field('Nama kontak', inName));
  ctl.appendChild(T.field('Status', inStatus));
  ctl.appendChild(T.field('Merk HP', selBrand));
  ctl.appendChild(T.field('Warna Material You', selTema));
  ctl.appendChild(T.field('Teks chip tanggal', inChip));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fpa-hint">Format: <code>A|10:30: halo</code>. <b>A</b>=masuk (kiri), <b>B</b>=keluar (kanan). Flag: <code>|react=👍</code> = reaksi di atas bubble, <code>|baca</code> = status "Dibaca" di bawah pesan keluar.</div>'));

  const phone = T.el('<div class="fpa-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inName.value = 'Rizky'; inStatus.value = 'RCS • Online'; selTema.value = 'biru';
      inChip.value = 'Hari ini'; taMsg.value = SAMPLE; avatarUrl = null;
      draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-pesan-android.png'), true)
  );

  function draw() {
    const th = TEMA[selTema.value] || TEMA.biru;
    const name = inName.value.trim() || 'Kontak';
    const status = inStatus.value.trim();
    const chipTxt = inChip.value.trim();
    const msgs = parseMsgs(taMsg.value);
    const initial = (name.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc(initial);

    let chatHtml = '';
    if (chipTxt) chatHtml += '<div class="fpa-chip">' + T.esc(chipTxt) + '</div>';
    msgs.forEach((m) => {
      const isOut = m.side === 'B';
      const reactHtml = m.react.length ? '<span class="fpa-react">' + m.react.map((r) => T.esc(r)).join(' ') + '</span>' : '';
      const metaHtml = (m.time || m.baca)
        ? '<div class="fpa-meta' + (isOut ? '' : ' fpa-inmeta') + '">' + (m.time ? T.esc(m.time) : '') + (m.baca ? ' • Dibaca' : '') + '</div>'
        : '';
      chatHtml += '<div class="fpa-bub ' + (isOut ? 'fpa-out' : 'fpa-in') + '"' +
        (isOut ? ' style="background:' + th.out + ';color:' + th.outFg + '"' : '') + '>' +
        reactHtml + T.esc(m.msg) + '</div>' + metaHtml;
    });

    const sbHtml = '<div class="fpa-sb">' + T.sysbar('android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fpa-hd"><button class="fpa-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<div class="fpa-av" style="background:' + utils.avaColor(name) + '">' + avHtml + '</div>' +
      '<div class="fpa-nm"><b>' + T.esc(name) + '</b>' + (status ? '<span>' + T.esc(status) + '</span>' : '') + '</div>' +
      '<div class="fpa-hic">' + SVG_VID + SVG_CALL + SVG_MORE + '</div></div>';
    const ibarHtml = '<div class="fpa-ibar"><span style="color:#49454F;display:flex">' + SVG_PLUS + '</span>' +
      '<div class="fpa-pill"><span class="fpa-ph">Kirim pesan RCS</span><span style="color:#49454F;display:flex">' + SVG_SMILE + '</span></div>' +
      '<div class="fpa-send" style="background:' + th.aksen + '">' + SVG_SEND + '</div></div>' +
      '<div class="fpa-nav"><i></i></div>';

    phone.className = 'fpa-phone';
    phone.innerHTML = sbHtml + hdHtml + '<div class="fpa-chat">' + chatHtml + '</div>' + ibarHtml +
      '<div class="fpa-pranktag-wrap"><span class="fpa-pranktag">palsu · cuma prank</span></div>';
  }

  [inName, inStatus, selBrand, selTema, inChip, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fpa-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan pesan Android asli.') + '</div>'));
  draw();
}
