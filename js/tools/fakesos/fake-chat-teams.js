import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-chat-teams',
  name: 'Fake Chat Teams',
  cat: 'fakesos',
  icon: '💼',
  desc: 'Bikin mockup chat Microsoft Teams palsu: grup atau 1 lawan 1, reaksi, pesan penting + unduh PNG.',
  keywords: 'teams,microsoft,chat,fake,palsu,screenshot,prank,android,iphone',
  since: '6.19.0',
};

/* Teams: aksen ungu #6264A7, pesan masuk putih / keluar ungu muda #E2E2F6,
   avatar lingkaran, nama + jam di atas pesan, reaksi menempel di bawah
   bubble, pesan penting berbingkai merah + label PENTING. */
const SAMPLE =
  'A|Rizky|09:12: deck presentasi udah gue upload ke Files\n' +
  'B|09:13|react=👍,❤️: mantap, gue cek habis ini\n' +
  'A|Dina|09:14|penting: reminder: deadline besok jam 10 pagi, jangan telat\n' +
  'B|09:15: siap, noted';

/* Format: A|Nama|09:12: teks (grup) atau A|09:12: teks (1-1, nama dari field).
   Flag: |react=👍,❤️ |penting */
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
    const side = parts[0].toUpperCase() === 'B' ? 'B' : 'A';
    let time = '', nama = '', react = [], penting = false;
    parts.slice(1).forEach((p) => {
      if (/^\d{1,2}:\d{2}$/.test(p)) time = p;
      else if (/^react=/i.test(p)) react = p.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
      else if (/^penting$/i.test(p)) penting = true;
      else if (!nama) nama = p;
    });
    out.push({ side, time, nama, msg, react, penting });
  });
  return out;
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CHEV = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
const SVG_PHONE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_VIDEO = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const SVG_PLUS = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const SVG_SMILE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.2s1.4 2.1 3.8 2.1 3.8-2.1 3.8-2.1"/><line x1="9.2" y1="9.4" x2="9.2" y2="9.4"/><line x1="14.8" y1="9.4" x2="14.8" y2="9.4"/></svg>';
const SVG_SEND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fctm-ctl{display:grid;gap:10px;margin-bottom:12px}
.fctm-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#F5F5F5;font-family:"Segoe UI",Roboto,system-ui,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fctm-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#fff;color:#242424}
.fctm-hd{display:flex;align-items:center;height:56px;padding:0 10px 0 2px;background:#fff;border-bottom:1px solid #EDEBE9}
.fctm-bk{background:none;border:0;padding:10px 6px 10px 10px;cursor:pointer;display:flex;align-items:center;color:#424242}
.fctm-av{width:38px;height:38px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;overflow:hidden;flex:none}
.fctm-av img{width:100%;height:100%;object-fit:cover;display:block}
.fctm-nm{flex:1;min-width:0;margin-left:9px}
.fctm-nm b{display:block;font-size:16px;font-weight:600;color:#242424;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fctm-nm span{display:block;font-size:12.5px;color:#616161;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fctm-hic{display:flex;align-items:center;gap:20px;padding-right:8px;color:#424242;flex:none}
.fctm-chat{padding:12px 12px 12px;min-height:340px;background:#F5F5F5}
.fctm-chip{text-align:center;color:#8A8886;font-size:12px;font-weight:600;margin:4px 0 12px}
.fctm-row{display:flex;gap:9px;margin-top:14px;align-items:flex-start}
.fctm-row.fctm-me{flex-direction:row-reverse}
.fctm-mav{width:32px;height:32px;border-radius:50%;flex:none;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;overflow:hidden}
.fctm-mav img{width:100%;height:100%;object-fit:cover;display:block}
.fctm-mbody{max-width:78%;min-width:0}
.fctm-mhead{font-size:13px;color:#616161;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fctm-mhead b{color:#242424;font-weight:600}
.fctm-bub{position:relative;background:#fff;color:#242424;font-size:15px;line-height:1.45;padding:8px 12px;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,.08);overflow-wrap:break-word;white-space:pre-wrap}
.fctm-me .fctm-bub{background:#E2E2F6}
.fctm-bub.fctm-penting{border:1.5px solid #C50F1F}
.fctm-imp{display:flex;align-items:center;gap:5px;color:#C50F1F;font-size:11.5px;font-weight:700;letter-spacing:.4px;margin-bottom:4px}
.fctm-imp i{width:15px;height:15px;border-radius:50%;background:#C50F1F;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-style:normal;flex:none}
.fctm-reacts{display:flex;gap:5px;margin-top:5px;flex-wrap:wrap}
.fctm-react{display:inline-flex;align-items:center;gap:4px;background:#fff;border:1px solid #EDEBE9;border-radius:12px;padding:2px 8px;font-size:13px;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.fctm-react b{font-size:12px;color:#616161;font-weight:600}
.fctm-ibar{display:flex;align-items:center;gap:8px;padding:8px 10px 10px;background:#fff;border-top:1px solid #EDEBE9}
.fctm-pill{flex:1;display:flex;align-items:center;border:1px solid #EDEBE9;border-radius:22px;min-height:44px;padding:0 12px;background:#fff}
.fctm-ph{flex:1;font-size:15px;color:#8A8886;margin:0 6px;white-space:nowrap;overflow:hidden}
.fctm-send{width:40px;height:40px;flex:none;border-radius:50%;background:#6264A7;display:flex;align-items:center;justify-content:center}
.fctm-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fctm-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fctm-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fctm-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fctm-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fctm-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fctm-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fctm-hint code{font-family:monospace;font-size:11.5px}
.fctm-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fctm-ctl"></div>');
  const selMode = T.select([['grup', 'Grup'], ['satu', '1 lawan 1']], 'grup');
  const inJudul = T.input('text', 'Nama grup / kontak', 'Tim Proyek Q3');
  const inSub = T.input('text', 'Subjudul header', 'Rizky, Dina, Adip');
  const inNameB = T.input('text', 'Namamu', 'Adip');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const inChip = T.input('text', 'Teks chip tanggal', 'Hari ini');
  const taMsg = T.ta(8, 'Satu baris = satu pesan. Format: A|Nama|10:30: halo', SAMPLE);

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avatarUrl = null;
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { avatarUrl = URL.createObjectURL(fi.files[0]); draw(); }
  });
  const btnAvatar = T.btn('📷 Upload Avatar', () => fi.click());

  ctl.appendChild(T.field('Jenis chat', selMode));
  ctl.appendChild(T.field('Nama grup / kontak', inJudul));
  ctl.appendChild(T.field('Subjudul header', inSub));
  ctl.appendChild(T.field('Namamu', inNameB));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Teks chip tanggal', inChip));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Pesan (satu baris = satu pesan)', taMsg));
  ctl.appendChild(T.el('<div class="fctm-hint">Format: <code>A|Nama|10:30: halo</code>. <b>A</b>=orang lain, <b>B</b>=kamu. Di grup, nama per pesan ditulis di barisnya; di 1 lawan 1, nama diambil dari field atas. Flag: <code>|react=👍,❤️</code> = reaksi, <code>|penting</code> = pesan penting.</div>'));

  const phone = T.el('<div class="fctm-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      selMode.value = 'grup'; inJudul.value = 'Tim Proyek Q3'; inSub.value = 'Rizky, Dina, Adip';
      inNameB.value = 'Adip'; inChip.value = 'Hari ini'; taMsg.value = SAMPLE;
      avatarUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-chat-teams.png'), true)
  );

  function draw() {
    const grup = selMode.value === 'grup';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const judul = inJudul.value.trim() || (grup ? 'Grup' : 'Kontak');
    const sub = inSub.value.trim();
    const nameB = inNameB.value.trim() || 'Kamu';
    const chipTxt = inChip.value.trim();
    const msgs = parseChat(taMsg.value);
    const initial = (judul.trim()[0] || '?').toUpperCase();
    const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc(initial);

    let chatHtml = '';
    if (chipTxt) chatHtml += '<div class="fctm-chip">' + T.esc(chipTxt) + '</div>';
    let prevSide = null, prevNama = null;
    msgs.forEach((m) => {
      const isMe = m.side === 'B';
      const nama = isMe ? nameB : (m.nama || judul);
      const same = isMe ? prevSide === 'B' : (prevSide === 'A' && prevNama === nama);
      prevSide = m.side; prevNama = nama;
      const reactHtml = m.react.length
        ? '<div class="fctm-reacts">' + m.react.map((r) => '<span class="fctm-react">' + T.esc(r) + '<b>1</b></span>').join('') + '</div>'
        : '';
      const impHtml = m.penting ? '<div class="fctm-imp"><i>!</i>PENTING</div>' : '';
      chatHtml += '<div class="fctm-row' + (isMe ? ' fctm-me' : '') + '">' +
        '<div class="fctm-mav" style="background:' + utils.avaColor(nama) + ';' + (same ? 'visibility:hidden' : '') + '">' + T.esc((nama[0] || '?').toUpperCase()) + '</div>' +
        '<div class="fctm-mbody">' +
        (same ? '' : '<div class="fctm-mhead"><b>' + T.esc(nama) + '</b>' + (m.time ? ' ' + T.esc(m.time) : '') + '</div>') +
        '<div class="fctm-bub' + (m.penting ? ' fctm-penting' : '') + '">' + impHtml + T.esc(m.msg) + '</div>' +
        reactHtml + '</div></div>';
    });

    const sbHtml = '<div class="fctm-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fctm-hd"><button class="fctm-bk" type="button" tabindex="-1">' + (isIPh ? SVG_CHEV : SVG_BACK) + '</button>' +
      '<div class="fctm-av" style="background:' + utils.avaColor(judul) + '">' + avHtml + '</div>' +
      '<div class="fctm-nm"><b>' + T.esc(judul) + '</b>' + (sub ? '<span>' + T.esc(sub) + '</span>' : '') + '</div>' +
      '<div class="fctm-hic">' + SVG_VIDEO + SVG_PHONE + SVG_MORE + '</div></div>';
    const ibarHtml = '<div class="fctm-ibar"><span style="color:#6264A7;display:flex">' + SVG_PLUS + '</span>' +
      '<div class="fctm-pill"><span class="fctm-ph">Ketik pesan</span><span style="color:#8A8886;display:flex">' + SVG_SMILE + '</span></div>' +
      '<div class="fctm-send">' + SVG_SEND + '</div></div>' +
      (isIPh ? '<div class="fctm-home"><i></i></div>' : '<div class="fctm-nav"><i></i></div>');

    phone.className = 'fctm-phone';
    phone.innerHTML = sbHtml + hdHtml + '<div class="fctm-chat">' + chatHtml + '</div>' + ibarHtml +
      '<div class="fctm-pranktag-wrap"><span class="fctm-pranktag">palsu · cuma prank</span></div>';
  }

  [selMode, inJudul, inSub, inNameB, selPlatform, selBrand, inChip, taMsg].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fctm-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan chat Teams asli.') + '</div>'));
  draw();
}
