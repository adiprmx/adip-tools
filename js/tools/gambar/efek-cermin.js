import { h as T, utils, beep, actx, onLeave, loadImage, fileInput, canvasToBlob, LOCAL_NOTE, errBox } from '../../core.js?v=6.8.0';

export const meta = {"id": "efek-cermin", "name": "Efek Cermin", "cat": "gambar", "icon": "🪞", "desc": "Bikin efek cermin/kaleidoskop sederhana dari foto.", "keywords": "cermin,mirror,foto,efek,kaleidoskop"};

// Fungsi murni (bisa diuji tanpa canvas): mode 'h' = cermin horizontal,
// 'v' = vertikal, 'hv' = keduanya (4 kuadran).
export function mirrorPixels(px, w, h, mode) {
  const out = new Uint8ClampedArray(px.length);
  const hw = Math.floor(w / 2), hh = Math.floor(h / 2);
  const src = (sx, sy) => {
    const x = Math.max(0, Math.min(w - 1, sx)), y = Math.max(0, Math.min(h - 1, sy));
    return (y * w + x) * 4;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sx = x, sy = y;
      if (mode === 'h' || mode === 'hv') sx = x < hw ? x : (w - 1 - x);
      if (mode === 'v' || mode === 'hv') sy = y < hh ? y : (h - 1 - y);
      const a = (y * w + x) * 4, b = src(sx, sy);
      out[a] = px[b]; out[a + 1] = px[b + 1]; out[a + 2] = px[b + 2]; out[a + 3] = px[b + 3];
    }
  }
  return out;
}

export function render(root) {
  const fi = fileInput('image/*');
  const box = T.out();
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;border-radius:10px;border:1px solid #ffffff20;display:block;margin-top:10px';
  const modeSel = T.select([['h', '↔ Horizontal (kiri-kanan)'], ['v', '↕ Vertikal (atas-bawah)'], ['hv', '✦ Keduanya (4 kuadran)']], 'h');
  let ada = false;

  const pilihBtn = T.btn('📁 Pilih Gambar', () => fi.click(), true);
  const dlBtn = T.btn('⬇ Unduh PNG', async () => {
    if (!ada) { T.toast('Pilih gambar dulu'); return; }
    const blob = await canvasToBlob(canvas, 'image/png');
    if (blob) T.dl('efek-cermin.png', blob, 'image/png');
  });

  async function proses() {
    const f = fi.files[0];
    if (!f) return;
    let img;
    try { img = await loadImage(f); } catch (e) { T.show(box, errBox('File bukan gambar yang valid.')); return; }
    const s = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * s));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * s));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasil = mirrorPixels(id.data, canvas.width, canvas.height, modeSel.value);
    ctx.putImageData(new ImageData(hasil, canvas.width, canvas.height), 0, 0);
    ada = true;
    T.show(box, '');
    box.appendChild(canvas);
    try { beep(660, 0.08, 'sine'); } catch (e) {}
  }

  fi.addEventListener('change', proses);
  modeSel.addEventListener('change', () => { if (fi.files[0]) proses(); });

  root.append(
    T.el('<p class="dim" style="font-size:13px">Upload foto, pilih arah cerminnya — hasilnya tampil langsung di bawah.</p>'),
    T.field('Mode cermin', modeSel),
    T.row(pilihBtn, dlBtn),
    box,
    T.el('<p class="dim" style="font-size:12px;margin-top:10px">🔒 ' + T.esc(LOCAL_NOTE) + '</p>')
  );
}
