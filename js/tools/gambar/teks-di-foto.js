import { h as T, utils } from '../../core.js?v=6.6.0';
import { loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js?v=6.6.0';

export const meta = {"id":"teks-di-foto","name":"Teks di Foto","cat":"gambar","icon":"🔤","desc":"Tambahkan tulisan ke foto.","keywords":"teks,foto,caption,meme,tulisan"};

function lsGet(k, d) { try { const v = localStorage.getItem('adip:teks-di-foto:' + k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('adip:teks-di-foto:' + k, v); } catch (e) {} }

/* Tambah tulisan ke foto: render langsung di canvas, teks digambar
   per baris (mendukung enter), dengan outline opsional biar kebaca
   di atas foto yang ramai. */
function drawText(img, opts) {
  const maxSide = 1600;
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);
  const teks = (opts.teks || '').trim();
  if (teks) {
    const fs = Math.max(12, opts.size);
    x.font = '700 ' + fs + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const lines = teks.split('\n');
    const lh = fs * 1.25;
    const pad = fs * 0.9;
    const totalH = lines.length * lh;
    const cy = opts.pos === 'top' ? pad + totalH / 2
      : opts.pos === 'mid' ? h / 2
      : h - pad - totalH / 2;
    x.lineJoin = 'round';
    lines.forEach((ln, i) => {
      const y = cy - totalH / 2 + lh / 2 + i * lh;
      if (opts.outline) {
        x.lineWidth = Math.max(2, Math.round(fs / 14));
        x.strokeStyle = 'rgba(0,0,0,0.85)';
        x.strokeText(ln, w / 2, y);
      }
      x.fillStyle = opts.color;
      x.fillText(ln, w / 2, y);
    });
  }
  return c;
}

export function render(root) {
  const fi = fileInput('image/*');
  const teksI = T.input('text', 'cth: Liburan seru!', lsGet('teks', ''));
  const posSel = T.select([['top', 'Atas'], ['mid', 'Tengah'], ['bot', 'Bawah']], lsGet('pos', 'bot'));
  const sizeR = T.input('range'); sizeR.min = '16'; sizeR.max = '160'; sizeR.value = lsGet('size', '64');
  const sizeV = T.el('<b>' + T.esc(sizeR.value) + ' px</b>');
  const colorI = T.input('color'); colorI.value = lsGet('color', '#ffffff');
  colorI.style.cssText = 'width:56px;height:38px;padding:2px;border:1px solid #ffffff20;border-radius:8px;background:transparent;cursor:pointer';
  const outC = T.input('checkbox'); outC.checked = lsGet('outline', '1') === '1';
  outC.style.cssText = 'width:22px;height:22px;accent-color:#fff;flex:none';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block;margin-top:12px';
  const box = T.out();
  const infoBox = T.out();
  let img = null, resCanvas = null;

  function redraw() {
    if (!img) return;
    resCanvas = drawText(img, {
      teks: teksI.value,
      pos: posSel.value,
      size: parseInt(sizeR.value, 10) || 64,
      color: colorI.value || '#ffffff',
      outline: outC.checked,
    });
    const ctx2 = canvas.getContext('2d');
    // tampilkan di kanvas preview (skala CSS saja, resolusi tetap penuh)
    canvas.width = resCanvas.width; canvas.height = resCanvas.height;
    ctx2.drawImage(resCanvas, 0, 0);
    T.show(box, '');
    if (!box.contains(canvas)) box.appendChild(canvas);
    T.hide(infoBox);
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    redraw();
    T.toast('Foto dimuat — ketik tulisannya');
  };

  const unduh = async () => {
    if (!img) { T.toast('Muat foto dulu'); return; }
    redraw();
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + resCanvas.width + '×' + resCanvas.height + ' px (' + fmtBytes(blob.size) + ')</b></div>');
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-teks.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  };

  const save = () => {
    lsSet('teks', teksI.value); lsSet('pos', posSel.value);
    lsSet('size', sizeR.value); lsSet('color', colorI.value);
    lsSet('outline', outC.checked ? '1' : '0');
  };
  teksI.addEventListener('input', () => { save(); redraw(); });
  posSel.addEventListener('change', () => { save(); redraw(); });
  sizeR.addEventListener('input', () => { sizeV.textContent = sizeR.value + ' px'; save(); redraw(); });
  colorI.addEventListener('input', () => { save(); redraw(); });
  outC.addEventListener('change', () => { save(); redraw(); });

  const sizeRow = T.el('<div style="display:flex;gap:10px;align-items:center"></div>');
  sizeRow.appendChild(sizeR); sizeRow.appendChild(sizeV);
  const outRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;cursor:pointer"></label>');
  outRow.appendChild(outC);
  outRow.appendChild(T.el('<span>Outline hitam — biar tulisan kebaca di foto ramai</span>'));

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Bikin caption atau meme: ketik tulisan, pilih posisi, atur ukuran dan warnanya. Enter buat baris baru.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.row(T.btn('Muat foto', muat, true)));
  root.appendChild(T.field('Tulisan', teksI));
  root.appendChild(T.field('Posisi', posSel));
  root.appendChild(T.field('Ukuran huruf', sizeRow));
  root.appendChild(T.field('Warna huruf', colorI));
  root.appendChild(T.field('Opsi', outRow));
  root.appendChild(T.row(T.btn('Unduh PNG', unduh, true)));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
