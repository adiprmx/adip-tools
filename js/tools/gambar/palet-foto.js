import { h as T, loadImage, fileInput, LOCAL_NOTE } from '../../core.js?v=6.6.0';

export const meta = {"id": "palet-foto", "name": "Palet Warna dari Foto", "cat": "gambar", "icon": "🎨", "desc": "Ambil 6 warna dominan dari fotomu.", "keywords": "palet,warna,foto,hex,dominan,swatch,desain"};

const toHex = (r, g, b) => '#' + [r, g, b]
  .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

export function render(root) {
  const fi = fileInput('image/*');
  const box = T.out();

  const ambil = async () => {
    T.hide(box);
    const f = fi.files[0];
    if (!f) { T.toast('Pilih foto dulu'); return; }
    let img;
    try { img = await loadImage(f); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
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
    const colors = top.map((b) => toHex(b.r / b.n, b.g / b.n, b.bl / b.n));
    T.show(box, '<p class="hint center">Ketuk warna buat menyalin kode hex-nya.</p>' +
      '<div class="sws" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"></div>');
    const wrap = box.querySelector('.sws');
    colors.forEach((hex) => {
      const sw = T.el('<div style="flex:1 1 90px;height:96px;border-radius:12px;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;border:1px solid #ffffff20;background:' + hex + '">' +
        '<span style="font-size:11px;font-family:monospace;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:20px;margin-bottom:8px">' + hex + '</span></div>');
      sw.addEventListener('click', () => T.copy(hex));
      wrap.appendChild(sw);
    });
  };

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.row(T.btn('Ambil palet warna', ambil, true)));
  root.appendChild(box);
}
