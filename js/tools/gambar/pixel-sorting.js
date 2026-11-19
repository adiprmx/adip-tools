import { h as T, loadImage, fileInput, canvasToBlob, imgEl, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Pixel Sorting: piksel di tiap baris (atau kolom) diurutkan menurut
// terangnya, dengan piksel gelap/terang sebagai pembatas, sehingga
// muncul coretan warna khas glitch art. BEDA dari efek lain di
// folder ini (dithering, duotone, emboss) yang mengubah warna tiap
// piksel di tempat; di sini posisi piksel yang berpindah.
export const meta = {"id": "pixel-sorting", "name": "Pixel Sorting", "cat": "gambar", "icon": "🌈", "desc": "Urutkan piksel foto jadi coretan warna glitch art.", "keywords": "pixel sorting,glitch,sortir,piksel,efek,coretan", "since": "6.19.0"};

function terang(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Urutkan piksel menurut terang di tiap baris/kolom (murni, bisa
// diuji tanpa DOM). Hanya interval piksel yang lolos ambang yang
// diurutkan; piksel yang tidak lolos jadi pembatas antar interval.
// arah: 'baris' atau 'kolom'. mode: 'terang' = urutkan piksel yang
// lebih terang dari ambang, 'gelap' = yang lebih gelap.
export function pixelSort(data, lebar, tinggi, arah, ambang, mode) {
  const keluar = new Uint8ClampedArray(data);
  const t = Math.max(0, Math.min(255, ambang || 0));
  const lolos = (v) => (mode === 'gelap' ? v < t : v > t);
  const ambil = (x, y) => {
    const i = (y * lebar + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const taruh = (x, y, p) => {
    const i = (y * lebar + x) * 4;
    keluar[i] = p[0]; keluar[i + 1] = p[1]; keluar[i + 2] = p[2]; keluar[i + 3] = p[3];
  };
  const urutInterval = (mulai, selesai, garis, isKolom) => {
    if (selesai - mulai < 2) return;
    const daftar = [];
    for (let k = mulai; k < selesai; k++) {
      const p = isKolom ? ambil(garis, k) : ambil(k, garis);
      daftar.push({ p, terang: terang(p[0], p[1], p[2]) });
    }
    daftar.sort((a, b) => a.terang - b.terang);
    daftar.forEach((d, j) => {
      if (isKolom) taruh(garis, mulai + j, d.p);
      else taruh(mulai + j, garis, d.p);
    });
  };
  if (arah === 'kolom') {
    for (let x = 0; x < lebar; x++) {
      let mulai = -1;
      for (let y = 0; y <= tinggi; y++) {
        const ok = y < tinggi && lolos(terang(data[(y * lebar + x) * 4], data[(y * lebar + x) * 4 + 1], data[(y * lebar + x) * 4 + 2]));
        if (ok && mulai < 0) mulai = y;
        if (!ok && mulai >= 0) { urutInterval(mulai, y, x, true); mulai = -1; }
      }
    }
  } else {
    for (let y = 0; y < tinggi; y++) {
      let mulai = -1;
      for (let x = 0; x <= lebar; x++) {
        const ok = x < lebar && lolos(terang(data[(y * lebar + x) * 4], data[(y * lebar + x) * 4 + 1], data[(y * lebar + x) * 4 + 2]));
        if (ok && mulai < 0) mulai = x;
        if (!ok && mulai >= 0) { urutInterval(mulai, x, y, false); mulai = -1; }
      }
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const arahSel = T.select([['baris', 'Mendatar (per baris)'], ['kolom', 'Menurun (per kolom)']], 'baris');
  const modeSel = T.select([
    ['terang', 'Urutkan bagian terang'],
    ['gelap', 'Urutkan bagian gelap'],
  ], 'terang');
  const ambangR = T.el('<input type="range" min="0" max="255" value="100" class="inp">');
  const ambangV = T.el('<span class="hint" style="min-width:44px;text-align:right">100</span>');
  const box = T.out();
  const infoBox = T.out();
  let img = null, resCanvas = null;

  function make() {
    T.hide(infoBox); T.hide(box);
    if (!img) return;
    const maksSisi = 1400;
    const s = Math.min(1, maksSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tx = tmp.getContext('2d');
    tx.drawImage(img, 0, 0, w, h);
    const data = tx.getImageData(0, 0, w, h).data;
    const hasil = pixelSort(data, w, h, arahSel.value, +ambangR.value, modeSel.value);
    resCanvas = document.createElement('canvas');
    resCanvas.width = w; resCanvas.height = h;
    resCanvas.getContext('2d').putImageData(new ImageData(hasil, w, h), 0, 0);
    canvasToBlob(resCanvas, 'image/png').then((blob) => {
      T.show(box, '');
      const origURL = URL.createObjectURL(fi.files[0]);
      const resURL = URL.createObjectURL(blob);
      T.onLeave(() => { URL.revokeObjectURL(origURL); URL.revokeObjectURL(resURL); });
      const grid = T.grid2(
        T.el('<div><div class="hint" style="margin-bottom:6px">Sebelum</div></div>'),
        T.el('<div><div class="hint" style="margin-bottom:6px">Sesudah, pixel sorting</div></div>')
      );
      grid.children[0].appendChild(imgEl(origURL, 'Foto asli'));
      grid.children[1].appendChild(imgEl(resURL, 'Hasil pixel sorting'));
      box.appendChild(grid);
      T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + w + 'x' + h + ' px (' + fmtBytes(blob.size) + ')</b></div>' +
        '<div class="kv"><span>Arah</span><b>' + (arahSel.value === 'kolom' ? 'Menurun' : 'Mendatar') + '</b></div>');
    });
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Pixel sorting jadi!');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Proses dulu fotonya'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Filenya tidak bisa dibuat. Coba lagi.'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-pixel-sorting.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  arahSel.addEventListener('change', make);
  modeSel.addEventListener('change', make);
  ambangR.addEventListener('input', () => { ambangV.textContent = ambangR.value; make(); });

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Piksel diurutkan menurut terangnya sampai muncul coretan warna. Geser ambang untuk mengatur bagian mana yang ikut terurut.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Arah urutan', arahSel), T.field('Bagian yang diurutkan', modeSel)));
  root.appendChild(T.field('Ambang terang', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(ambangR); w.appendChild(ambangV); return w; })(), 'Ambang rendah = hampir semua piksel ikut terurut.'));
  root.appendChild(T.row(T.btn('Urutkan Piksel', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
