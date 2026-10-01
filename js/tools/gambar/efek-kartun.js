import { h as T, utils } from '../../core.js?v=6.6.0';
import { loadImage, fileInput, canvasToBlob, imgEl, fmtBytes, LOCAL_NOTE } from '../../core.js?v=6.6.0';

export const meta = {"id":"efek-kartun","name":"Efek Kartun","cat":"gambar","icon":"🎨","desc":"Ubah foto jadi efek kartun/poster.","keywords":"kartun,poster,foto,efek,filter"};

function lsGet(k, d) { try { const v = localStorage.getItem('adip:efek-kartun:' + k); return v == null ? d : v; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('adip:efek-kartun:' + k, v); } catch (e) {} }

/* Posterize tiap channel RGB ke N level, lalu opsional edge sederhana
   (Sobel di grayscale, piksel dengan gradien besar digelapkan) biar
   garisnya tegas kayak kartun. */
function cartoonize(img, levels, withEdge) {
  const maxSide = 1400;
  const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  const steps = Math.max(2, levels) - 1;
  const q = 255 / steps;
  for (let i = 0; i < p.length; i += 4) {
    p[i]     = Math.round(Math.round(p[i] / 255 * steps) * q);
    p[i + 1] = Math.round(Math.round(p[i + 1] / 255 * steps) * q);
    p[i + 2] = Math.round(Math.round(p[i + 2] / 255 * steps) * q);
  }
  if (withEdge) {
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
    const TH = 90;
    for (let y = 1; y < h - 1; y++) for (let xx = 1; xx < w - 1; xx++) {
      const i = y * w + xx;
      const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
      const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
      if (Math.abs(gx) + Math.abs(gy) > TH) { const j = i * 4; p[j] = p[j + 1] = p[j + 2] = 25; }
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

export function render(root) {
  const fi = fileInput('image/*');
  const lvlR = T.input('range'); lvlR.min = '2'; lvlR.max = '8'; lvlR.value = lsGet('level', '5');
  const lvlV = T.el('<b>' + T.esc(lvlR.value) + '</b>');
  const edgeC = T.input('checkbox'); edgeC.checked = lsGet('edge', '1') === '1';
  edgeC.style.cssText = 'width:22px;height:22px;accent-color:#fff;flex:none';
  const box = T.out();
  const infoBox = T.out();
  let img = null, resCanvas = null;

  lvlR.addEventListener('input', () => { lvlV.textContent = lvlR.value; lsSet('level', lvlR.value); if (img) process(); });
  edgeC.addEventListener('change', () => { lsSet('edge', edgeC.checked ? '1' : '0'); if (img) process(); });

  function process() {
    T.hide(infoBox); T.hide(box);
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    T.toast('Lagi menggambar kartun…');
    lsSet('edge', edgeC.checked ? '1' : '0');
    const levels = parseInt(lvlR.value, 10) || 5;
    const doEdge = edgeC.checked;
    // kasih napas biar toast tampil sebelum loop piksel yang berat
    setTimeout(() => {
      resCanvas = cartoonize(img, levels, doEdge);
      canvasToBlob(resCanvas, 'image/png').then((blob) => {
        T.show(box, '');
        const origURL = URL.createObjectURL(fi.files[0]);
        const resURL = URL.createObjectURL(blob);
        T.onLeave(() => { URL.revokeObjectURL(origURL); URL.revokeObjectURL(resURL); });
        const grid = T.grid2(
          T.el('<div><div class="hint" style="margin-bottom:6px">Sebelum</div></div>'),
          T.el('<div><div class="hint" style="margin-bottom:6px">Sesudah — efek kartun</div></div>')
        );
        grid.children[0].appendChild(imgEl(origURL, 'Foto asli'));
        grid.children[1].appendChild(imgEl(resURL, 'Hasil kartun'));
        box.appendChild(grid);
        T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + resCanvas.width + '×' + resCanvas.height + ' px (' + fmtBytes(blob.size) + ')</b></div>' +
          '<div class="kv"><span>Level warna</span><b>' + levels + '</b></div>');
        T.toast('Jadi! Lucu kan hasilnya');
      });
    }, 30);
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    process();
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Proses dulu fotonya'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-kartun.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  const lvlRow = T.el('<div style="display:flex;gap:10px;align-items:center"></div>');
  lvlRow.appendChild(lvlR); lvlRow.appendChild(lvlV);
  const edgeRow = T.el('<label style="display:flex;gap:10px;align-items:center;font-size:14px;cursor:pointer"></label>');
  edgeRow.appendChild(edgeC);
  edgeRow.appendChild(T.el('<span>Garis tepi (edge) — bikin kontur lebih tegas</span>'));

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Upload foto apa aja — selfie, pemandangan, kucing — terus sulap jadi kartun. Makin sedikit level warnanya, makin berasa efek posternya.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Level warna (2–8)', lvlRow, 'Kecil = flat kayak poster, besar = mendekati foto asli.'));
  root.appendChild(T.field('Opsi', edgeRow));
  root.appendChild(T.row(T.btn('Jadiin Kartun', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
