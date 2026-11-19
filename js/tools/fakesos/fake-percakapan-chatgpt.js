import { h as T, LOCAL_NOTE, dlNodePng } from '../../core.js';

export const meta = {"id":"fake-percakapan-chatgpt","name":"Fake Percakapan ChatGPT","cat":"fakesos","icon":"💬","desc":"Bikin screenshot percakapan ChatGPT palsu: tambah pesan sendiri dan pesan ChatGPT, lalu unduh PNG.","keywords":"chatgpt,ai,percakapan,chat,fake,palsu,screenshot,prank","since": "6.18.0"};

const FC_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FC_DARK_BG = '#212121';
const FC_DARK_BUBBLE = '#2f2f2f';
const FC_LIGHT_BG = '#ffffff';
const FC_LIGHT_BUBBLE = '#f4f4f4';

/* Logo ChatGPT (knot) disederhanakan: 6 kelopak segienam diputar. */
function fcLogo(warna) {
  let petal = '';
  for (let i = 0; i < 6; i++) {
    petal += '<path d="M12 2.2 L15.6 4.3 L15.6 8.6 L12 10.7 L8.4 8.6 L8.4 4.3 Z" transform="rotate(' + (i * 60) + ' 12 12)"/>';
  }
  return '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="' + warna + '" aria-hidden="true">' + petal + '</svg>';
}

// Tambah pesan ke daftar. Teks kosong = tidak ada perubahan. Murni.
export function tambahPesan(daftar, dari, teks) {
  const t = String(teks == null ? '' : teks).trim();
  if (!t) return daftar;
  return [...daftar, { dari, teks: t }];
}

// Hapus pesan ke-i dari daftar. Murni.
export function hapusPesan(daftar, i) {
  return daftar.filter((_, j) => j !== i);
}

const FC_CSS = `
.fc-app{font-family:${FC_FONT};font-size:15px;line-height:1.5}
.fc-app.dk{background:${FC_DARK_BG};color:#ececec}
.fc-app.lt{background:${FC_LIGHT_BG};color:#1a1a1a}
.fc-head{display:flex;align-items:center;gap:10px;height:52px;padding:0 14px;border-bottom:1px solid #00000014}
.fc-app.dk .fc-head{border-bottom-color:#ffffff14}
.fc-model{font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
.fc-model span{font-size:11px;font-weight:400;opacity:.6}
.fc-share{margin-left:auto;font-size:13px;color:#0d0d0d;border:1px solid #0000001a;background:#fff;border-radius:20px;padding:6px 12px}
.fc-app.dk .fc-share{color:#ececec;border-color:#ffffff26;background:transparent}
.fc-body{padding:18px 14px 8px;display:flex;flex-direction:column;gap:18px}
.fc-msg{display:flex;gap:12px;align-items:flex-start}
.fc-av{width:30px;height:30px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:3px}
.fc-av.ai{background:#10a37f}
.fc-av.me{background:#565f89;color:#fff;font-weight:600;font-size:13px;padding:0}
.fc-tek{flex:1;min-width:0;white-space:pre-wrap;word-break:break-word;padding-top:4px}
.fc-tek.me{background:${FC_LIGHT_BUBBLE};border-radius:18px;padding:9px 14px;max-width:78%;margin-left:auto}
.fc-app.dk .fc-tek.me{background:${FC_DARK_BUBBLE}}
.fc-me{display:flex;justify-content:flex-end}
.fc-kosong{text-align:center;color:#8e8e8e;font-size:13px;padding:40px 10px}
.fc-inputbar{margin:6px 14px 14px;border:1px solid #0000001a;border-radius:26px;padding:10px 14px;display:flex;align-items:center;gap:10px;color:#8e8e8e;font-size:14px}
.fc-app.dk .fc-inputbar{border-color:#ffffff26;color:#8e8e8e}
.fc-plus{width:26px;height:26px;border:1px solid #0000001a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex:none;line-height:1}
.fc-app.dk .fc-plus{border-color:#ffffff26}
.fc-mic{margin-left:auto;font-size:18px}
.fc-dev{max-width:430px;margin:14px auto;background:#0d0d0d;border-radius:42px;padding:11px;box-shadow:0 20px 55px rgba(0,0,0,.35),inset 0 0 0 2px #2b2b2b}
.fc-scr{border-radius:32px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.fc-scr.dk{background:${FC_DARK_BG}}
.fc-sb{position:relative;display:flex;align-items:center;justify-content:space-between;padding:11px 22px 4px;font-size:15px;font-weight:600;flex:none;color:#111}
.fc-scr.dk .fc-sb{color:#f5f5f5}
.fc-home{width:134px;height:5px;border-radius:3px;background:#111;margin:10px auto 8px;flex:none}
.fc-scr.dk .fc-home{background:#f5f5f5}
.fc-anav{display:flex;justify-content:center;padding:8px 0 10px;flex:none}
.fc-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#111}
.fc-scr.dk .fc-anav i{background:#f5f5f5}
.fc-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;flex:none}
.fc-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
.fc-item{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid #27272a;border-radius:10px;margin-bottom:8px;background:#18181b}
.fc-item .fc-dari{font-size:11px;font-weight:600;flex:none;padding:2px 8px;border-radius:20px;margin-top:1px}
.fc-item .fc-dari.ai{background:#10a37f;color:#fff}
.fc-item .fc-dari.me{background:#3b82f6;color:#fff}
.fc-item .fc-isi{flex:1;font-size:13px;white-space:pre-wrap;word-break:break-word;min-width:0}
.fc-del{font-size:11px;color:#ed4956;background:none;border:none;cursor:pointer;flex:none;padding:2px 0}
`;

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FC_CSS;
  root.appendChild(style);

  let daftar = [];
  let namaSaya = 'Saya';

  const namaI = T.input('text', 'cth: Adip', 'Adip');
  const modelSel = T.select([['ChatGPT 5', 'ChatGPT 5'], ['ChatGPT 4o', 'ChatGPT 4o'], ['ChatGPT 4.5', 'ChatGPT 4.5']], 'ChatGPT 5');
  const dariSel = T.select([['me', 'Saya'], ['ai', 'ChatGPT']], 'me');
  const teksI = T.ta(3, 'Tulis isi pesan...', '');
  const themeSel = T.select([['gelap', 'Gelap'], ['terang', 'Terang']], 'gelap');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const daftarBox = T.out();
  const preview = T.out();
  const tambahB = T.btn('Tambah Pesan', tambah, true);
  const hapusSemuaB = T.btn('Hapus Semua', () => { daftar = []; gambarDaftar(); draw(); });

  function tambah() {
    const sebelum = daftar.length;
    daftar = tambahPesan(daftar, dariSel.value, teksI.value);
    if (daftar.length === sebelum) { T.toast('Isi pesan dulu'); return; }
    teksI.value = '';
    gambarDaftar();
    draw();
  }

  function gambarDaftar() {
    if (!daftar.length) {
      T.show(daftarBox, '<p class="hint" style="margin:8px 0">Belum ada pesan. Tambah pesan di atas, atau tekan "Contoh" untuk mengisi contoh.</p>');
      return;
    }
    T.show(daftarBox, '');
    daftar.forEach((msg, i) => {
      const item = T.el('<div class="fc-item"></div>');
      const dari = T.el('<span class="fc-dari ' + msg.dari + '">' + (msg.dari === 'ai' ? 'ChatGPT' : T.esc(namaSaya)) + '</span>');
      const isi = T.el('<span class="fc-isi"></span>');
      isi.textContent = msg.teks;
      const del = T.el('<button type="button" class="fc-del">Hapus</button>');
      del.addEventListener('click', () => { daftar = hapusPesan(daftar, i); gambarDaftar(); draw(); });
      item.appendChild(dari); item.appendChild(isi); item.appendChild(del);
      daftarBox.appendChild(item);
    });
  }

  function draw() {
    const dark = themeSel.value === 'gelap';
    const plat = selPlatform.value;
    const isIPh = plat === 'iphone';
    brandField.style.display = (plat === 'android') ? '' : 'none';
    namaSaya = namaI.value.trim() || 'Saya';

    let isi = '';
    if (!daftar.length) {
      isi = '<div class="fc-kosong">Belum ada pesan di percakapan ini.</div>';
    } else {
      isi = daftar.map((msg) => {
        if (msg.dari === 'ai') {
          return '<div class="fc-msg"><div class="fc-av ai">' + fcLogo('#fff') + '</div><div class="fc-tek">' + T.esc(msg.teks) + '</div></div>';
        }
        const inisial = namaSaya.charAt(0).toUpperCase();
        return '<div class="fc-me"><div class="fc-msg" style="flex-direction:row-reverse"><div class="fc-av me">' + T.esc(inisial) + '</div><div class="fc-tek me">' + T.esc(msg.teks) + '</div></div></div>';
      }).join('');
    }

    const h = '<div class="fc-head">'
      + '<span class="fc-model">' + T.esc(modelSel.value) + ' <span>⌄</span></span>'
      + '<span class="fc-share">Bagikan</span>'
      + '</div>'
      + '<div class="fc-body">' + isi + '</div>'
      + '<div class="fc-inputbar"><span class="fc-plus">+</span><span>Tanyakan apa saja</span><span class="fc-mic">🎤</span></div>';

    T.show(preview, '<div class="fc-dev"><div class="fc-scr' + (dark ? ' dk' : '') + '">'
      + '<div class="fc-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>'
      + '<div class="fc-app ' + (dark ? 'dk' : 'lt') + '">' + h + '</div>'
      + (isIPh ? '<div class="fc-home"></div>' : '<div class="fc-anav"><i></i></div>')
      + '<div class="fc-pranktag-wrap"><span class="fc-pranktag">palsu · cuma prank</span></div>'
      + '</div></div>');
  }

  function contoh() {
    daftar = [
      { dari: 'me', teks: 'Halo! Boleh minta tolong?' },
      { dari: 'ai', teks: 'Halo! Tentu, silakan. Ada yang bisa saya bantu hari ini?' },
      { dari: 'me', teks: 'Jelaskan rasio emas dengan bahasa sederhana.' },
      { dari: 'ai', teks: 'Rasio emas itu perbandingan sekitar 1 banding 1,618. Banyak dipakai di desain karena enak dilihat mata: misalnya, kalau lebarnya 100, tingginya sekitar 162.' },
    ];
    gambarDaftar();
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  namaI.addEventListener('input', () => { namaSaya = namaI.value.trim() || 'Saya'; gambarDaftar(); draw(); });
  [modelSel, themeSel, selPlatform, selBrand].forEach((elx) => elx.addEventListener('change', draw));

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.grid2(T.field('Nama kamu (tampil di avatar)', namaI), T.field('Model ChatGPT', modelSel)));
  root.appendChild(T.field('Pesan dari', dariSel));
  root.appendChild(T.field('Isi pesan', teksI));
  root.appendChild(T.row(tambahB, hapusSemuaB));
  root.appendChild(T.el('<div class="hint" style="margin:14px 0 4px;font-weight:600">Daftar pesan</div>'));
  root.appendChild(daftarBox);
  root.appendChild(T.grid2(T.field('Tema', themeSel), T.field('Platform', selPlatform)));
  const brandField = T.field('Merk HP', selBrand);
  root.appendChild(brandField);
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-chatgpt.png'); }, true)
  ));
  root.appendChild(preview);
  gambarDaftar();
  draw();
}
