import { h as T, loadImage, fileInput, LOCAL_NOTE, canvasToBlob } from '../../core.js?v=6.12.1';

export const meta = {"id": "palet-foto", "name": "Palet Warna dari Foto", "cat": "gambar", "icon": "🎨", "desc": "Ambil 6 warna dominan dari fotomu, atau klik piksel mana pun.", "keywords": "palet,warna,foto,hex,dominan,swatch,desain,eyedropper"};

const toHex = (r, g, b) => '#' + [r, g, b]
  .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export function render(root) {
  const fi = fileInput('image/*');
  const box = T.out();
  const fotoBox = T.out();
  const ambilBox = T.out();
  const cvFoto = document.createElement('canvas');
  cvFoto.style.cssText = 'max-width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:block;cursor:crosshair;touch-action:manipulation';
  let imgNow = null;
  let dominan = [];
  let dipetik = [];

  function kartuWarna(hex, kecil) {
    const num = parseInt(hex.slice(1), 16);
    const rgb = 'RGB ' + ((num >> 16) & 255) + ', ' + ((num >> 8) & 255) + ', ' + (num & 255);
    const sw = T.el('<div style="flex:1 1 90px;height:' + (kecil ? 72 : 96) + 'px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;border:1px solid #ffffff20;background:' + hex + '">' +
      '<span style="font-size:11px;font-family:monospace;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:20px;margin-bottom:4px">' + hex + '</span>' +
      '<span style="font-size:10px;font-family:monospace;background:rgba(0,0,0,.55);color:#e4e4e7;padding:2px 8px;border-radius:20px;margin-bottom:8px">' + rgb + '</span></div>');
    sw.addEventListener('click', () => T.copy(hex));
    return sw;
  }

  function gambarPetik() {
    if (!dipetik.length) { T.hide(ambilBox); return; }
    T.show(ambilBox, '<p class="hint center" style="margin-top:14px">Warna yang kamu petik dari foto (ketuk untuk salin):</p>' +
      '<div class="sws" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>');
    const wrap = ambilBox.querySelector('.sws');
    dipetik.forEach((hex) => wrap.appendChild(kartuWarna(hex, true)));
  }

  function pasangFoto() {
    const s = Math.min(1, 640 / Math.max(imgNow.naturalWidth, imgNow.naturalHeight));
    cvFoto.width = Math.max(1, Math.round(imgNow.naturalWidth * s));
    cvFoto.height = Math.max(1, Math.round(imgNow.naturalHeight * s));
    const ctx = cvFoto.getContext('2d');
    ctx.drawImage(imgNow, 0, 0, cvFoto.width, cvFoto.height);
    T.show(fotoBox, '<p class="hint center" style="margin-top:14px">Ketuk bagian foto mana pun untuk mengambil warnanya persis di titik itu.</p>');
    fotoBox.appendChild(cvFoto);
  }

  cvFoto.addEventListener('click', (e) => {
    if (!imgNow) return;
    const r = cvFoto.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) * (cvFoto.width / r.width));
    const y = Math.floor((e.clientY - r.top) * (cvFoto.height / r.height));
    const ctx = cvFoto.getContext('2d');
    let d;
    try { d = ctx.getImageData(Math.max(0, Math.min(cvFoto.width - 1, x)), Math.max(0, Math.min(cvFoto.height - 1, y)), 1, 1).data; }
    catch (err) { T.toast('Gagal membaca pixel gambar'); return; }
    const hex = toHex(d[0], d[1], d[2]);
    if (!dipetik.includes(hex)) {
      dipetik.unshift(hex);
      if (dipetik.length > 8) dipetik.length = 8;
    }
    gambarPetik();
    T.copy(hex);
    T.toast('Warna ' + hex + ' disalin');
  });

  const ambil = async () => {
    T.hide(box); T.hide(fotoBox); T.hide(ambilBox);
    const f = fi.files[0];
    if (!f) { T.toast('Pilih foto dulu'); return; }
    let img;
    try { img = await loadImage(f); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    imgNow = img;
    dipetik = [];
    const S = 64;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    if (!ctx) { T.toast('Browser tidak mendukung canvas'); return; }
    ctx.drawImage(img, 0, 0, S, S);
    let data;
    try { data = ctx.getImageData(0, 0, S, S).data; }
    catch (e) { T.toast('Gagal membaca pixel gambar'); return; }
    // Kuantisasi: 3 bit per channel -> 512 bucket, ambil 6 teratas lalu rata-ratakan
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const key = ((data[i] >> 5) << 6) | ((data[i + 1] >> 5) << 3) | (data[i + 2] >> 5);
      let b = buckets.get(key);
      if (!b) { b = { n: 0, r: 0, g: 0, bl: 0 }; buckets.set(key, b); }
      b.n++; b.r += data[i]; b.g += data[i + 1]; b.bl += data[i + 2];
    }
    const top = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 6);
    if (!top.length) { T.toast('Tidak ada warna yang terbaca'); return; }
    dominan = top.map((b) => toHex(b.r / b.n, b.g / b.n, b.bl / b.n));
    T.show(box, '<p class="hint center">Warna dominan di foto ini (ketuk warna buat menyalin kode hex-nya).</p>' +
      '<div class="sws" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>');
    const wrap = box.querySelector('.sws');
    dominan.forEach((hex) => wrap.appendChild(kartuWarna(hex, false)));
    pasangFoto();
  };

  const simpanKartu = async () => {
    const semua = [...dominan, ...dipetik.filter((h) => !dominan.includes(h))];
    if (!semua.length) { T.toast('Ambil palet dulu dari foto'); return; }
    const W = 1080, pad = 48, gap = 16;
    const n = semua.length;
    const swW = Math.floor((W - pad * 2 - gap * (n - 1)) / n);
    const H = 360;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    if (!x) { T.toast('Browser tidak mendukung canvas'); return; }
    x.fillStyle = '#141414';
    x.fillRect(0, 0, W, H);
    x.font = '600 34px system-ui, sans-serif';
    x.fillStyle = '#fafafa';
    x.fillText('Palet warna', pad, 64);
    x.font = '400 22px system-ui, sans-serif';
    x.fillStyle = '#a1a1aa';
    x.fillText(semua.length + ' warna dari foto', pad, 100);
    const y0 = 140, swH = 130;
    semua.forEach((hex, i) => {
      const px = pad + i * (swW + gap);
      x.fillStyle = hex;
      if (typeof x.roundRect === 'function') {
        x.beginPath();
        x.roundRect(px, y0, swW, swH, 14);
        x.fill();
      } else {
        x.fillRect(px, y0, swW, swH);
      }
      const num = parseInt(hex.slice(1), 16);
      const lum = (0.299 * ((num >> 16) & 255) + 0.587 * ((num >> 8) & 255) + 0.114 * (num & 255)) / 255;
      x.fillStyle = lum > 0.6 ? '#111111' : '#ffffff';
      x.font = '600 24px monospace';
      x.textAlign = 'center';
      x.fillText(hex.toUpperCase(), px + swW / 2, y0 + swH / 2 + 9);
      x.textAlign = 'left';
    });
    const blob = await canvasToBlob(c, 'image/png');
    if (!blob) { T.toast('Gagal membuat kartu'); return; }
    T.dl('palet-warna.png', blob, 'image/png');
    T.toast('Kartu palet berhasil diunduh');
  };

  const salinSemua = () => {
    const semua = [...dominan, ...dipetik.filter((h) => !dominan.includes(h))];
    if (!semua.length) { T.toast('Ambil palet dulu dari foto'); return; }
    T.copy(semua.join('\n'));
    T.toast(semua.length + ' kode warna disalin');
  };

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.row(T.btn('Ambil palet warna', ambil, true), T.btn('Simpan kartu PNG', simpanKartu), T.btn('Salin semua kode', salinSemua)));
  root.appendChild(box);
  root.appendChild(fotoBox);
  root.appendChild(ambilBox);
  fi.addEventListener('change', ambil);
}
