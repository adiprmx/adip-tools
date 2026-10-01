import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, fmtBytes, imgEl, loadImage } from '../../core.js?v=6.4.0';

export const meta = {"id":"foto-sketca","name":"Foto ke Sketsa","cat":"gambar","icon":"✏️","desc":"Ubah foto jadi sketsa pensil.","keywords":"sketsa,pensil,foto,efek,grayscale,hitam putih"};

/* Efek sketsa klasik: grayscale -> (invert + blur) -> blend color-dodge.
   Jalur cepat pakai ctx.filter; kalau browser tidak mendukung, pakai
   fallback piksel manual (grayscale -> invert -> box blur -> color-dodge). */
function filterOK() {
  try {
    return typeof document.createElement('canvas').getContext('2d').filter === 'string';
  } catch (e) { return false; }
}

function sketchFast(img, blurPx, maxDim) {
  const s = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const base = document.createElement('canvas'); base.width = w; base.height = h;
  const bx = base.getContext('2d');
  bx.filter = 'grayscale(1)';
  bx.drawImage(img, 0, 0, w, h);
  bx.filter = 'none';
  const res = document.createElement('canvas'); res.width = w; res.height = h;
  const rx = res.getContext('2d');
  rx.drawImage(base, 0, 0);
  rx.globalCompositeOperation = 'color-dodge';
  rx.filter = 'invert(1) blur(' + blurPx + 'px)';
  rx.drawImage(base, 0, 0);
  rx.filter = 'none';
  rx.globalCompositeOperation = 'source-over';
  return res;
}

function boxBlur(src, w, h, r) {
  const tmp = new Uint8ClampedArray(src.length);
  const out = new Uint8ClampedArray(src.length);
  const n = 2 * r + 1;
  let sr, sg, sb, j;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    sr = sg = sb = 0;
    for (let k = -r; k <= r; k++) {
      const cx = Math.min(w - 1, Math.max(0, x + k));
      j = (y * w + cx) * 4;
      sr += src[j]; sg += src[j + 1]; sb += src[j + 2];
    }
    j = (y * w + x) * 4;
    tmp[j] = sr / n; tmp[j + 1] = sg / n; tmp[j + 2] = sb / n; tmp[j + 3] = 255;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    sr = sg = sb = 0;
    for (let k = -r; k <= r; k++) {
      const cy = Math.min(h - 1, Math.max(0, y + k));
      j = (cy * w + x) * 4;
      sr += tmp[j]; sg += tmp[j + 1]; sb += tmp[j + 2];
    }
    j = (y * w + x) * 4;
    out[j] = sr / n; out[j + 1] = sg / n; out[j + 2] = sb / n; out[j + 3] = 255;
  }
  return out;
}

function sketchManual(img, blurPx) {
  const maxW = 480;
  const s = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  const inv = new Uint8ClampedArray(p.length);
  for (let i = 0; i < p.length; i += 4) {
    const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    p[i] = p[i + 1] = p[i + 2] = g;
    inv[i] = inv[i + 1] = inv[i + 2] = 255 - g;
    inv[i + 3] = 255;
  }
  const r = Math.max(1, Math.min(4, Math.round(blurPx / 4)));
  const blur = boxBlur(inv, w, h, r);
  for (let i = 0; i < p.length; i += 4) {
    const g = p[i], b = blur[i];
    const v = b >= 255 ? 255 : Math.min(255, (g * 255) / (255 - b));
    p[i] = p[i + 1] = p[i + 2] = v;
    p[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c;
}

export function render(root) {
  const fileI = fileInput('image/*');
  const blurR = T.input('range'); blurR.min = '2'; blurR.max = '20'; blurR.value = '8';
  const blurV = T.el('<b>8px</b>');
  const box = T.out();
  const infoBox = T.out();
  const fast = filterOK();
  let img = null, resCanvas = null;

  blurR.addEventListener('input', () => { blurV.textContent = blurR.value + 'px'; });

  async function process() {
    T.hide(infoBox); T.hide(box);
    if (!fileI.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fileI.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    T.toast('Lagi menggambar…');
    await new Promise((r) => setTimeout(r, 30)); // kasih napas biar toast tampil
    const blurPx = parseInt(blurR.value, 10) || 8;
    resCanvas = fast ? sketchFast(img, blurPx, 1600) : sketchManual(img, blurPx);
    const blob = await canvasToBlob(resCanvas, 'image/png');
    T.show(box, '');
    const origURL = URL.createObjectURL(fileI.files[0]);
    const resURL = URL.createObjectURL(blob);
    T.onLeave(() => { URL.revokeObjectURL(origURL); URL.revokeObjectURL(resURL); });
    const grid = T.grid2(
      T.el('<div><div class="hint" style="margin-bottom:6px">Sebelum</div></div>'),
      T.el('<div><div class="hint" style="margin-bottom:6px">Sesudah — sketsa pensil</div></div>')
    );
    grid.children[0].appendChild(imgEl(origURL, 'Foto asli'));
    grid.children[1].appendChild(imgEl(resURL, 'Hasil sketsa'));
    box.appendChild(grid);
    T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + resCanvas.width + '×' + resCanvas.height + ' px (' + fmtBytes(blob.size) + ')</b></div>' +
      '<div class="kv"><span>Mode</span><b>' + (fast ? 'Akselerasi canvas' : 'Kompatibilitas') + '</b></div>');
    T.toast('Jadi! Mirip sketsa pensil kan');
  }

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Proses dulu fotonya'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fileI.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-sketsa.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  const blurRow = T.el('<div style="display:flex;gap:10px;align-items:center"></div>');
  blurRow.appendChild(blurR); blurRow.appendChild(blurV);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Upload foto apa aja — selfie, pemandangan, kucing — terus sulap jadi sketsa pensil. Makin besar blur, makin halus garisnya.</p>'));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.field('Kehalusan garis (blur)', blurRow, 'Kecil = tegas kayak sketsa kasar, besar = lembut.'));
  root.appendChild(T.row(T.btn('Jadiin Sketsa', process, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fileI.addEventListener('change', () => { if (fileI.files[0]) process(); });
}
