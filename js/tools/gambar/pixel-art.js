import { h as T, utils } from '../../core.js?v=6.7.0';
import { loadImage, fileInput, canvasToBlob, imgEl, fmtBytes, LOCAL_NOTE } from '../../core.js?v=6.7.0';

export const meta = {"id":"pixel-art","name":"Pixel Art","cat":"gambar","icon":"👾","desc":"Ubah foto jadi pixel art retro.","keywords":"pixel,pixelate,retro,foto,efek"};

function lsGet(k, d) { try { const v = localStorage.getItem('adip:pixel-art:' + k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('adip:pixel-art:' + k, v); } catch (e) {} }

/* Pixelate klasik: gambar diperkecil lalu dibesarkan lagi tanpa smoothing,
   jadi tiap "kotak" tetap tajam seperti sprite game jadul. */
function pixelate(img, px) {
  const maxSide = 1400;
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const sw = Math.max(1, Math.round(w / px));
  const sh = Math.max(1, Math.round(h / px));
  const small = document.createElement('canvas'); small.width = sw; small.height = sh;
  const sx = small.getContext('2d');
  sx.imageSmoothingEnabled = false;
  sx.drawImage(img, 0, 0, sw, sh);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ox = out.getContext('2d');
  ox.imageSmoothingEnabled = false;
  ox.drawImage(small, 0, 0, w, h);
  return out;
}

export function render(root) {
  const fi = fileInput('image/*');
  const pxR = T.input('range'); pxR.min = '2'; pxR.max = '40'; pxR.value = lsGet('px', '12');
  const pxV = T.el('<b>' + T.esc(pxR.value) + ' px</b>');
  const box = T.out();
  const infoBox = T.out();
  let img = null, resCanvas = null;

  function process() {
    T.hide(infoBox); T.hide(box);
    if (!fi.files[0] || !img) { T.toast('Pilih foto dulu'); return; }
    const px = Math.max(2, parseInt(pxR.value, 10) || 12);
    resCanvas = pixelate(img, px);
    canvasToBlob(resCanvas, 'image/png').then((blob) => {
      T.show(box, '');
      const origURL = URL.createObjectURL(fi.files[0]);
      const resURL = URL.createObjectURL(blob);
      T.onLeave(() => { URL.revokeObjectURL(origURL); URL.revokeObjectURL(resURL); });
      const grid = T.grid2(
        T.el('<div><div class="hint" style="margin-bottom:6px">Sebelum</div></div>'),
        T.el('<div><div class="hint" style="margin-bottom:6px">Sesudah — pixel art</div></div>')
      );
      grid.children[0].appendChild(imgEl(origURL, 'Foto asli'));
      grid.children[1].appendChild(imgEl(resURL, 'Hasil pixel art'));
      box.appendChild(grid);
      T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + resCanvas.width + '×' + resCanvas.height + ' px (' + fmtBytes(blob.size) + ')</b></div>' +
        '<div class="kv"><span>Ukuran piksel</span><b>' + px + ' px</b></div>');
    });
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    process();
    T.toast('Jadi! Berasa main game jadul');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Proses dulu fotonya'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-pixel.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  pxR.addEventListener('input', () => { pxV.textContent = pxR.value + ' px'; lsSet('px', pxR.value); if (img) process(); });

  const pxRow = T.el('<div style="display:flex;gap:10px;align-items:center"></div>');
  pxRow.appendChild(pxR); pxRow.appendChild(pxV);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Ubah foto jadi pixel art ala game retro. Geser slider buat atur seberapa besar kotaknya — makin besar makin abstrak.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Ukuran piksel (2–40)', pxRow, 'Kecil = detail masih kelihatan, besar = makin kotak-kotak.'));
  root.appendChild(T.row(T.btn('Jadiin Pixel Art', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
