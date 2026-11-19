import { h as T, loadImage, fileInput, canvasToBlob, imgEl, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Hapus Noise Foto: filter median yang menghilangkan bintik-bintik
// acak (noise garam-merica) tanpa mengaburkan tepi foto. BEDA dari
// Blur Foto (blur-foto.js) yang mengaburkan seluruh foto termasuk
// tepinya, dan dari Tajamkan Foto (tajamkan-foto.js) yang justru
// menonjolkan noise.
export const meta = {"id": "hapus-noise-foto", "name": "Hapus Noise Foto", "cat": "gambar", "icon": "🧹", "desc": "Hilangkan bintik-bintik noise dari foto tanpa mengaburkan tepinya.", "keywords": "noise,foto,bersihkan,bintik,median,denoise", "since": "6.19.0"};

// Filter median per kanal pada data piksel RGBA (murni, bisa diuji
// tanpa DOM). ukuran jendela 3 atau 5. Alpha tidak diubah.
export function medianFilter(data, lebar, tinggi, ukuran) {
  const k = ukuran === 5 ? 5 : 3;
  const r = (k - 1) / 2;
  const keluar = new Uint8ClampedArray(data.length);
  const jendela = new Array(k * k);
  for (let y = 0; y < tinggi; y++) {
    for (let x = 0; x < lebar; x++) {
      const o = (y * lebar + x) * 4;
      for (let c = 0; c < 3; c++) {
        let n = 0;
        for (let dy = -r; dy <= r; dy++) {
          const yy = Math.min(tinggi - 1, Math.max(0, y + dy));
          for (let dx = -r; dx <= r; dx++) {
            const xx = Math.min(lebar - 1, Math.max(0, x + dx));
            jendela[n++] = data[(yy * lebar + xx) * 4 + c];
          }
        }
        jendela.length = n;
        jendela.sort((a, b) => a - b);
        keluar[o + c] = jendela[Math.floor(n / 2)];
      }
      keluar[o + 3] = data[o + 3];
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const jendelaSel = T.select([['3', 'Ringan (jendela 3x3)'], ['5', 'Kuat (jendela 5x5)']], '3');
  const ulangSel = T.select([['1', '1 kali'], ['2', '2 kali']], '1');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let img = null, resCanvas = null;

  function make() {
    T.hide(infoBox); T.hide(box);
    if (!img) return;
    const maksSisi = 1600;
    const s = Math.min(1, maksSisi / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s));
    const h = Math.max(1, Math.round(img.naturalHeight * s));
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tx = tmp.getContext('2d');
    tx.drawImage(img, 0, 0, w, h);
    let data = tx.getImageData(0, 0, w, h).data;
    const ulang = +ulangSel.value;
    for (let i = 0; i < ulang; i++) data = medianFilter(data, w, h, +jendelaSel.value);
    resCanvas = document.createElement('canvas');
    resCanvas.width = w; resCanvas.height = h;
    const rx = resCanvas.getContext('2d');
    rx.putImageData(new ImageData(data, w, h), 0, 0);
    canvasToBlob(resCanvas, 'image/png').then((blob) => {
      T.show(box, '');
      const origURL = URL.createObjectURL(fi.files[0]);
      const resURL = URL.createObjectURL(blob);
      T.onLeave(() => { URL.revokeObjectURL(origURL); URL.revokeObjectURL(resURL); });
      const grid = T.grid2(
        T.el('<div><div class="hint" style="margin-bottom:6px">Sebelum</div></div>'),
        T.el('<div><div class="hint" style="margin-bottom:6px">Sesudah, noise hilang</div></div>')
      );
      grid.children[0].appendChild(imgEl(origURL, 'Foto asli'));
      grid.children[1].appendChild(imgEl(resURL, 'Hasil hapus noise'));
      box.appendChild(grid);
      T.show(infoBox, '<div class="kv"><span>Ukuran hasil</span><b>' + w + 'x' + h + ' px (' + fmtBytes(blob.size) + ')</b></div>' +
        '<div class="kv"><span>Filter</span><b>Median ' + jendelaSel.value + 'x' + jendelaSel.value + ', ' + ulang + ' kali</b></div>');
    });
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); return; }
    make();
    T.toast('Noise dibersihkan!');
  };

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Proses dulu fotonya'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Filenya tidak bisa dibuat. Coba lagi.'); return; }
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-bersih.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  jendelaSel.addEventListener('change', make);
  ulangSel.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Bintik-bintik putih dan hitam yang muncul karena foto gelap atau ISO tinggi dihilangkan satu per satu. Tepi foto tetap tajam.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.grid2(T.field('Kekuatan filter', jendelaSel, 'Kuat untuk noise yang parah, tapi detail halus bisa ikut hilang.'), T.field('Ulangi', ulangSel)));
  root.appendChild(T.row(T.btn('Bersihkan Noise', muat, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
