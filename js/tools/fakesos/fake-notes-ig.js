import { h as T, LOCAL_NOTE, dlNodePng, fileInput, utils } from '../../core.js';

export const meta = {
  id: 'fake-notes-ig',
  name: 'Fake Notes Instagram',
  cat: 'fakesos',
  icon: '💭',
  desc: 'Bikin mockup Instagram Notes palsu: bubble di atas inbox DM, notes musik, notes terbuka + unduh PNG.',
  keywords: 'instagram,notes,dm,inbox,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* IG Notes: bubble putih di atas avatar di baris atas inbox DM; notes musik
   ada ikon nada + judul lagu; mode Terbuka menampilkan satu note besar
   dengan tombol balas. Beda dari Fake Catatan iPhone (itu aplikasi Notes). */
const SAMPLE =
  'Adip|lagi ngerjain beat baru 🎧\n' +
  'Rizky|♪ Midnight City - M83\n' +
  'Dina|besok futsal jam 8, jangan telat!\n' +
  'Sari|ada yang mau nonton konser?';

/* Format: Nama|isi note — awali isi dengan ♪ untuk notes musik. */
export function parseNotes(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const p = line.indexOf('|');
    if (p < 0) return;
    const nama = line.slice(0, p).trim();
    const isi = line.slice(p + 1).trim();
    if (!nama || !isi) return;
    const musik = isi.startsWith('♪');
    out.push({ nama, isi: musik ? isi.slice(1).trim() : isi, musik });
  });
  return out;
}

const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_CHEV = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>';
const SVG_NOTE = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';
const SVG_CAM = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
const SVG_EDIT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
const SVG_HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_SEND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fnig-ctl{display:grid;gap:10px;margin-bottom:12px}
.fnig-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fnig-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#fff;color:#000}
.fnig-hd{display:flex;align-items:center;height:52px;padding:0 12px 0 4px;background:#fff}
.fnig-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center;color:#000}
.fnig-nm{flex:1;min-width:0;margin-left:4px}
.fnig-nm b{display:block;font-size:17px;font-weight:700;color:#000}
.fnig-hic{display:flex;align-items:center;gap:20px;padding-right:4px;color:#000;flex:none}
.fnig-search{margin:2px 14px 10px;background:#EFEFEF;border-radius:10px;padding:8px 12px;font-size:15px;color:#8E8E8E;display:flex;align-items:center;gap:8px}
.fnig-notes{display:flex;gap:14px;padding:8px 12px 14px;overflow:hidden;background:#fff}
.fnig-ncol{width:76px;flex:none;display:flex;flex-direction:column;align-items:center;position:relative}
.fnig-bub{position:relative;background:#fff;border:1px solid #EFEFEF;box-shadow:0 2px 8px rgba(0,0,0,.12);border-radius:16px;padding:8px 10px;font-size:12.5px;line-height:1.35;color:#000;text-align:center;min-height:44px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;overflow-wrap:break-word;width:100%}
.fnig-bub::after{content:"";position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);width:14px;height:14px;background:#fff;border-right:1px solid #EFEFEF;border-bottom:1px solid #EFEFEF;transform:translateX(-50%) rotate(45deg)}
.fnig-bub.fnig-musik{flex-direction:column;gap:2px}
.fnig-bub .fnig-song{font-size:11px;color:#737373;display:flex;align-items:center;gap:3px}
.fnig-av{width:64px;height:64px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;overflow:hidden;flex:none}
.fnig-av img{width:100%;height:100%;object-fit:cover;display:block}
.fnig-who{font-size:12px;color:#737373;margin-top:5px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:76px}
.fnig-dm{padding:4px 0 10px;background:#fff}
.fnig-dmrow{display:flex;align-items:center;gap:12px;padding:9px 14px}
.fnig-dav{width:56px;height:56px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;overflow:hidden;flex:none}
.fnig-dav img{width:100%;height:100%;object-fit:cover;display:block}
.fnig-dtxt{flex:1;min-width:0}
.fnig-dtxt b{display:block;font-size:15px;font-weight:600;color:#000}
.fnig-dtxt span{display:block;font-size:14px;color:#737373;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fnig-open{padding:26px 20px 30px;background:#fff;min-height:380px;display:flex;flex-direction:column;align-items:center}
.fnig-obub{position:relative;background:#fff;border:1px solid #EFEFEF;box-shadow:0 4px 16px rgba(0,0,0,.14);border-radius:20px;padding:18px 20px;font-size:17px;line-height:1.45;color:#000;text-align:center;max-width:300px;margin-bottom:16px}
.fnig-obub::after{content:"";position:absolute;left:50%;bottom:-8px;transform:translateX(-50%) rotate(45deg);width:16px;height:16px;background:#fff;border-right:1px solid #EFEFEF;border-bottom:1px solid #EFEFEF}
.fnig-oav{width:88px;height:88px;border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:600;overflow:hidden}
.fnig-oav img{width:100%;height:100%;object-fit:cover;display:block}
.fnig-oname{font-size:17px;font-weight:700;color:#000;margin-top:12px}
.fnig-otime{font-size:13px;color:#737373;margin-top:3px}
.fnig-reply{margin-top:auto;width:100%;display:flex;align-items:center;gap:10px;border:1px solid #DBDBDB;border-radius:24px;padding:10px 14px;color:#737373;font-size:15px}
.fnig-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#fff}
.fnig-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fnig-home{display:flex;justify-content:center;align-items:center;height:20px;background:#fff}
.fnig-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fnig-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#fff}
.fnig-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fnig-hint{font-size:12px;color:#8696A0;line-height:1.6;background:rgba(127,127,127,.08);border-radius:8px;padding:8px 10px}
.fnig-hint code{font-family:monospace;font-size:11.5px}
.fnig-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fnig-ctl"></div>');
  const selMode = T.select([['inbox', 'Inbox (baris notes)'], ['terbuka', 'Notes terbuka']], 'inbox');
  const inUser = T.input('text', 'Username kamu', 'adip.rmx');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const inPesan = T.input('text', 'Cuplikan DM di bawah notes', 'Aktif 12 mnt lalu');
  const taNotes = T.ta(6, 'Satu baris = satu note. Format: Nama|isi note', SAMPLE);

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let avatarUrl = null;
  fi.addEventListener('change', () => {
    if (fi.files && fi.files[0]) { avatarUrl = URL.createObjectURL(fi.files[0]); draw(); }
  });
  const btnAvatar = T.btn('📷 Upload Foto Profil', () => fi.click());

  ctl.appendChild(T.field('Tampilan', selMode));
  ctl.appendChild(T.field('Username kamu', inUser));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(T.field('Cuplikan DM', inPesan));
  ctl.appendChild(btnAvatar);
  ctl.appendChild(T.field('Notes (satu baris = satu note)', taNotes));
  ctl.appendChild(T.el('<div class="fnig-hint">Format: <code>Nama|isi note</code>. Awali isi dengan <code>♪</code> untuk notes musik, misal <code>Rizky|♪ Midnight City - M83</code>. Baris pertama = notemu sendiri.</div>'));

  const phone = T.el('<div class="fnig-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      selMode.value = 'inbox'; inUser.value = 'adip.rmx'; inPesan.value = 'Aktif 12 mnt lalu';
      taNotes.value = SAMPLE; avatarUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-notes-ig.png'), true)
  );

  function draw() {
    const terbuka = selMode.value === 'terbuka';
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const user = inUser.value.trim() || 'kamu';
    const pesan = inPesan.value.trim();
    const notes = parseNotes(taNotes.value);

    let bodyHtml = '';
    if (terbuka) {
      const n = notes[0] || { nama: user, isi: 'Tulis notemu di sini', musik: false };
      const avHtml = avatarUrl ? '<img src="' + avatarUrl + '" alt="">' : T.esc((n.nama[0] || '?').toUpperCase());
      bodyHtml = '<div class="fnig-open"><div class="fnig-obub">' +
        (n.musik ? '<span style="display:flex;align-items:center;justify-content:center;gap:5px;font-size:13px;color:#737373;margin-bottom:6px">' + SVG_NOTE + 'Lagu</span>' : '') +
        T.esc(n.isi) + '</div>' +
        '<div class="fnig-oav" style="background:' + utils.avaColor(n.nama) + '">' + avHtml + '</div>' +
        '<div class="fnig-oname">' + T.esc(n.nama) + '</div>' +
        '<div class="fnig-otime">2 jam lalu</div>' +
        '<div class="fnig-reply"><span style="flex:1">Balas note...</span><span style="display:flex;color:#000">' + SVG_HEART + '</span><span style="display:flex;color:#0095F6">' + SVG_SEND + '</span></div></div>';
    } else {
      let notesHtml = '';
      notes.forEach((n, i) => {
        const avHtml = (i === 0 && avatarUrl) ? '<img src="' + avatarUrl + '" alt="">' : T.esc((n.nama[0] || '?').toUpperCase());
        const bub = n.musik
          ? '<div class="fnig-bub fnig-musik"><span>' + T.esc(n.isi) + '</span><span class="fnig-song">' + SVG_NOTE + 'Musik</span></div>'
          : '<div class="fnig-bub">' + T.esc(n.isi) + '</div>';
        notesHtml += '<div class="fnig-ncol">' + bub +
          '<div class="fnig-av" style="background:' + utils.avaColor(n.nama) + '">' + avHtml + '</div>' +
          '<div class="fnig-who">' + (i === 0 ? 'Notemu' : T.esc(n.nama)) + '</div></div>';
      });
      let dmHtml = '';
      notes.slice(1).forEach((n) => {
        dmHtml += '<div class="fnig-dmrow"><div class="fnig-dav" style="background:' + utils.avaColor(n.nama) + '">' + T.esc((n.nama[0] || '?').toUpperCase()) + '</div>' +
          '<div class="fnig-dtxt"><b>' + T.esc(n.nama) + '</b><span>' + T.esc(pesan) + '</span></div>' +
          '<span style="display:flex;color:#000">' + SVG_CAM + '</span></div>';
      });
      bodyHtml = '<div class="fnig-search"><span>🔍</span><span>Cari</span></div>' +
        '<div class="fnig-notes">' + notesHtml + '</div>' +
        '<div class="fnig-dm">' + dmHtml + '</div>';
    }

    const sbHtml = '<div class="fnig-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fnig-hd"><button class="fnig-bk" type="button" tabindex="-1">' + (isIPh ? SVG_CHEV : SVG_BACK) + '</button>' +
      '<div class="fnig-nm"><b>' + T.esc(user) + ' ▾</b></div>' +
      '<div class="fnig-hic">' + SVG_EDIT + '</div></div>';

    phone.className = 'fnig-phone';
    phone.innerHTML = sbHtml + hdHtml + bodyHtml +
      (isIPh ? '<div class="fnig-home"><i></i></div>' : '<div class="fnig-nav"><i></i></div>') +
      '<div class="fnig-pranktag-wrap"><span class="fnig-pranktag">palsu · cuma prank</span></div>';
  }

  [selMode, inUser, selPlatform, selBrand, inPesan, taNotes].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fnig-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan Notes Instagram asli.') + '</div>'));
  draw();
}
