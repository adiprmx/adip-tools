import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {
  id: 'fake-profil-hinge',
  name: 'Fake Profil Hinge',
  cat: 'fakesos',
  icon: '💜',
  desc: 'Bikin screenshot profil Hinge palsu: foto, prompt, jawaban + unduh PNG.',
  keywords: 'hinge,profil,dating,prompt,fake,palsu,screenshot,prank',
  since: '6.19.0',
};

/* Hinge: foto rounded 20px, kartu prompt putih ("Prompt" kecil + jawaban
   besar), nama + umur + lokasi, tombol hati "Kirim suka" melayang di bawah.
   Aksen ungu gelap #655CFF. */
const GRAD_FOTO = 'linear-gradient(160deg,#655CFF,#B04DFF,#FF6B9D)';

export function parsePrompt(text) {
  const out = [];
  String(text).split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const p = line.indexOf('|');
    if (p < 0) { out.push({ prompt: '', jawab: line }); return; }
    out.push({ prompt: line.slice(0, p).trim(), jawab: line.slice(p + 1).trim() });
  });
  return out;
}

const SVG_HEART = '<svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
const SVG_X = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#655CFF" stroke-width="2.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
const SVG_BACK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';
const SVG_MORE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';

export function render(root) {
  root.appendChild(T.el(`<style>
.fph-ctl{display:grid;gap:10px;margin-bottom:12px}
.fph-phone{max-width:380px;margin:14px auto;border-radius:22px;overflow:hidden;border:1px solid rgba(0,0,0,.14);background:#F6F4F0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
.fph-sb{position:relative;display:flex;justify-content:space-between;align-items:center;height:48px;padding:0 16px 0 22px;background:#F6F4F0;color:#000}
.fph-hd{display:flex;align-items:center;height:48px;padding:0 12px 0 4px;background:#F6F4F0;color:#000}
.fph-bk{background:none;border:0;padding:8px;cursor:pointer;display:flex;align-items:center;color:#000}
.fph-hd b{flex:1;font-size:17px;font-weight:800;text-align:center;letter-spacing:-.3px}
.fph-body{padding:8px 14px 12px}
.fph-foto{position:relative;height:380px;border-radius:20px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.fph-foto img{width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0}
.fph-fototxt{position:relative;z-index:1;color:#fff;font-size:56px;font-weight:800;text-shadow:0 2px 14px rgba(0,0,0,.35)}
.fph-foto::after{content:"";position:absolute;left:0;right:0;bottom:0;height:110px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.5))}
.fph-ident{position:absolute;left:16px;bottom:14px;z-index:2;color:#fff}
.fph-ident b{font-size:28px;font-weight:800;display:block;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.fph-ident span{font-size:14px;display:block;margin-top:2px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.fph-card{background:#fff;border-radius:16px;padding:16px;margin-top:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.fph-card .fph-p{font-size:13px;font-weight:700;color:#655CFF;margin:0 0 6px}
.fph-card .fph-j{font-size:17px;line-height:1.45;color:#111;margin:0;overflow-wrap:break-word;white-space:pre-wrap}
.fph-vitals{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.fph-vital{background:#fff;border:1px solid #E8E4DE;border-radius:20px;padding:7px 13px;font-size:13.5px;color:#333}
.fph-actions{display:flex;justify-content:center;gap:14px;padding:16px 0 6px}
.fph-x{width:54px;height:54px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center}
.fph-like{display:flex;align-items:center;gap:8px;background:#655CFF;color:#fff;font-size:15px;font-weight:700;border-radius:28px;padding:0 22px;height:54px;box-shadow:0 4px 12px rgba(101,92,255,.4)}
.fph-nav{display:flex;justify-content:center;padding:4px 0 9px;background:#F6F4F0}
.fph-nav i{display:block;width:112px;height:4px;border-radius:2px;background:rgba(0,0,0,.3)}
.fph-home{display:flex;justify-content:center;align-items:center;height:20px;background:#F6F4F0}
.fph-home i{display:block;width:134px;height:5px;border-radius:3px;background:rgba(0,0,0,.35)}
.fph-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;background:#F6F4F0}
.fph-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fph-note{font-size:11.5px;color:#8696A0;margin-top:10px;line-height:1.5}
</style>`));

  const ctl = T.el('<div class="fph-ctl"></div>');
  const inNama = T.input('text', 'Nama', 'Dina');
  const inUmur = T.input('text', 'Umur', '23');
  const inLokasi = T.input('text', 'Lokasi', 'Jakarta');
  const taPrompt = T.ta(6, 'Satu baris = satu prompt. Format: Prompt|Jawaban', 'Hal sederhana yang bikin aku senang|Kopi pagi sambil dengerin lagu lama\nKencan ideal versi aku|Jalan sore, makan enak, ngobrol sampai lupa waktu\nFakta random tentang aku|Bisa main 3 alat musik');
  const taVital = T.ta(3, 'Satu baris = satu info singkat', '175 cm\nPekerjaan: Desainer\nTidak merokok');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');

  const fi = fileInput('image/*');
  fi.style.display = 'none';
  let fotoUrl = null;
  fi.addEventListener('change', () => { if (fi.files && fi.files[0]) { fotoUrl = URL.createObjectURL(fi.files[0]); draw(); } });
  const btnFoto = T.btn('📷 Upload Foto', () => fi.click());

  ctl.appendChild(T.field('Nama', inNama));
  ctl.appendChild(T.field('Umur', inUmur));
  ctl.appendChild(T.field('Lokasi', inLokasi));
  ctl.appendChild(T.field('Prompt & jawaban (satu baris = satu)', taPrompt));
  ctl.appendChild(T.field('Info singkat (satu baris = satu)', taVital));
  ctl.appendChild(T.field('Platform', selPlatform));
  const brandField = T.field('Merk HP', selBrand);
  ctl.appendChild(brandField);
  ctl.appendChild(btnFoto);

  const phone = T.el('<div class="fph-phone"></div>');

  const btnRow = T.row(
    T.btn('🎲 Contoh', () => {
      inNama.value = 'Dina'; inUmur.value = '23'; inLokasi.value = 'Jakarta';
      taPrompt.value = 'Hal sederhana yang bikin aku senang|Kopi pagi sambil dengerin lagu lama\nKencan ideal versi aku|Jalan sore, makan enak, ngobrol sampai lupa waktu\nFakta random tentang aku|Bisa main 3 alat musik';
      taVital.value = '175 cm\nPekerjaan: Desainer\nTidak merokok';
      fotoUrl = null; draw(); T.scrollToPreview(phone);
    }),
    T.btn('⬇️ Unduh PNG', () => dlNodePng(phone, 'fake-profil-hinge.png'), true)
  );

  function draw() {
    const isIPh = selPlatform.value === 'iphone';
    brandField.style.display = isIPh ? 'none' : '';
    const nama = inNama.value.trim() || 'Pengguna';
    const umur = inUmur.value.trim();
    const lokasi = inLokasi.value.trim();
    const prompts = parsePrompt(taPrompt.value);
    const vitals = String(taVital.value).split('\n').map((s) => s.trim()).filter(Boolean);

    let cardsHtml = '';
    prompts.forEach((p) => {
      cardsHtml += '<div class="fph-card">' +
        (p.prompt ? '<p class="fph-p">' + T.esc(p.prompt) + '</p>' : '') +
        '<p class="fph-j">' + T.esc(p.jawab) + '</p></div>';
    });
    const vitalsHtml = vitals.length
      ? '<div class="fph-vitals">' + vitals.map((v) => '<span class="fph-vital">' + T.esc(v) + '</span>').join('') + '</div>'
      : '';

    const sbHtml = '<div class="fph-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, false) + '</div>';
    const hdHtml = '<div class="fph-hd"><button class="fph-bk" type="button" tabindex="-1">' + SVG_BACK + '</button>' +
      '<b>Hinge</b><span style="display:flex">' + SVG_MORE + '</span></div>';
    const bodyHtml = '<div class="fph-body"><div class="fph-foto" style="background:' + GRAD_FOTO + '">' +
      (fotoUrl ? '<img src="' + fotoUrl + '" alt="">' : '<span class="fph-fototxt">' + T.esc((nama[0] || '?').toUpperCase()) + '</span>') +
      '<div class="fph-ident"><b>' + T.esc(nama) + (umur ? ', ' + T.esc(umur) : '') + '</b>' +
      (lokasi ? '<span>📍 ' + T.esc(lokasi) + '</span>' : '') + '</div></div>' +
      vitalsHtml + cardsHtml +
      '<div class="fph-actions"><div class="fph-x">' + SVG_X + '</div><div class="fph-like">' + SVG_HEART + ' Kirim suka</div></div></div>';

    phone.className = 'fph-phone';
    phone.innerHTML = sbHtml + hdHtml + bodyHtml +
      (isIPh ? '<div class="fph-home"><i></i></div>' : '<div class="fph-nav"><i></i></div>') +
      '<div class="fph-pranktag-wrap"><span class="fph-pranktag">palsu · cuma prank</span></div>';
  }

  [inNama, inUmur, inLokasi, taPrompt, taVital, selPlatform, selBrand].forEach((el) => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  root.appendChild(ctl);
  root.appendChild(btnRow);
  root.appendChild(fi);
  root.appendChild(phone);
  root.appendChild(T.el('<div class="fph-note">' + T.esc(LOCAL_NOTE + ' Hanya untuk prank, bukan profil Hinge asli.') + '</div>'));
  draw();
}
