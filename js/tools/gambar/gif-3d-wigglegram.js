import { h as T, loadImage, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// GIF 3D (Wigglegram): dua foto dari sudut sedikit berbeda (mata
// kiri dan kanan) digabung jadi GIF yang berkedip cepat, sehingga
// terlihat 3D. BEDA dari GIF Maker (gif-maker.js) yang membuat GIF
// umum dari banyak foto dengan urutan bebas; di sini pasangannya
// selalu 2 foto stereo dengan geser penjajaran.
// Encoder GIF89a + LZW ditulis sendiri di file ini (pola yang sama
// dengan pdf-ke-gif.js B10, tanpa CDN), supaya jalan walau koneksi
// mati.
export const meta = {"id": "gif-3d-wigglegram", "name": "GIF 3D (Wigglegram)", "cat": "gambar", "icon": "👓", "desc": "Dua foto dari sudut beda jadi GIF 3D yang berkedip.", "keywords": "wigglegram,gif 3d,3d,stereo,foto 3d,animasi", "since": "6.19.0"};

// Encoder GIF89a animasi tinggal di modul bersama js/gif-encoder.js
// (kanonis, G4 C1G4-R; dikonsolidasi dari gif-3d-wigglegram.js +
// pdf-ke-gif.js).
import { GifEncoder } from '../../gif-encoder.js';
export { buatPalet, buatPencariPalet, lzwKompres, GifEncoder } from '../../gif-encoder.js';

export function render(root) {
  const fiKiri = fileInput('image/*');
  const fiKanan = fileInput('image/*');
  const kecepatanR = T.el('<input type="range" min="100" max="500" step="50" value="200" class="inp">');
  const kecepatanV = T.el('<span class="hint" style="min-width:64px;text-align:right">0,2 dtk</span>');
  const geserR = T.el('<input type="range" min="-30" max="30" value="0" class="inp">');
  const geserV = T.el('<span class="hint" style="min-width:44px;text-align:right">0px</span>');
  const lebarSel = T.select([['480', 'Sedang (lebar 480)'], ['320', 'Kecil (lebar 320)'], ['640', 'Besar (lebar 640)']], '480');
  const box = T.out();
  const infoBox = T.out();
  let imgKiri = null, imgKanan = null, gifBlob = null, gifUrl = null;

  function gambarFrame(img, lebar, tinggi, dx) {
    const c = document.createElement('canvas');
    c.width = lebar; c.height = tinggi;
    const ctx = c.getContext('2d');
    const s = Math.max(lebar / img.naturalWidth, tinggi / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (lebar - dw) / 2 + dx, (tinggi - dh) / 2, dw, dh);
    return ctx.getImageData(0, 0, lebar, tinggi);
  }

  async function make() {
    T.hide(infoBox); T.hide(box);
    if (!imgKiri || !imgKanan) { T.toast('Pilih kedua foto dulu'); return; }
    T.show(box, '<p class="center mut">Lagi membuat GIF 3D...</p>');
    await new Promise((r) => setTimeout(r, 30));
    const lebar = +lebarSel.value;
    const rasio = Math.min(imgKiri.naturalHeight / imgKiri.naturalWidth, imgKanan.naturalHeight / imgKanan.naturalWidth);
    const tinggi = Math.max(1, Math.round(lebar * rasio));
    const geser = +geserR.value;
    const enc = new GifEncoder(lebar, tinggi, { tundaMs: +kecepatanR.value });
    const f1 = gambarFrame(imgKiri, lebar, tinggi, -geser);
    const f2 = gambarFrame(imgKanan, lebar, tinggi, geser);
    enc.tambahFrame(f1.data, lebar, tinggi);
    enc.tambahFrame(f2.data, lebar, tinggi);
    const bytes = enc.selesai();
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    gifBlob = new Blob([bytes.buffer], { type: 'image/gif' });
    gifUrl = URL.createObjectURL(gifBlob);
    T.onLeave(() => { if (gifUrl) URL.revokeObjectURL(gifUrl); });
    T.show(box, '');
    const img = document.createElement('img');
    img.src = gifUrl;
    img.alt = 'GIF 3D wigglegram';
    img.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    box.appendChild(img);
    T.show(infoBox, '<div class="kv"><span>Ukuran GIF</span><b>' + lebar + 'x' + tinggi + ' px</b></div>' +
      '<div class="kv"><span>Ukuran file</span><b>' + fmtBytes(gifBlob.size) + '</b></div>' +
      '<div class="kv"><span>Frame</span><b>2 (kiri dan kanan, berulang)</b></div>');
    T.toast('GIF 3D jadi!');
  }

  const muatSatu = async (fi, sisi) => {
    if (!fi.files[0]) return;
    try {
      const im = await loadImage(fi.files[0]);
      if (sisi === 'kiri') imgKiri = im; else imgKanan = im;
      if (imgKiri && imgKanan) make();
    } catch (e) { T.toast('File itu bukan gambar. Pilih file gambar.'); }
  };

  const dlB = T.btn('Unduh GIF', () => {
    if (!gifBlob) { T.toast('Buat dulu GIF-nya'); return; }
    T.dl('wigglegram.gif', gifBlob, 'image/gif');
    T.toast('Berhasil diunduh');
  }, true);

  kecepatanR.addEventListener('input', () => {
    kecepatanV.textContent = (+kecepatanR.value / 1000).toString().replace('.', ',') + ' dtk';
    if (imgKiri && imgKanan) make();
  });
  geserR.addEventListener('input', () => {
    geserV.textContent = geserR.value + 'px';
    if (imgKiri && imgKanan) make();
  });
  lebarSel.addEventListener('change', () => { if (imgKiri && imgKanan) make(); });

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Foto yang sama dari dua sudut sedikit berbeda, lalu digabung jadi GIF yang berkedip cepat. Cara ambilnya: foto objek, geser HP sedikit ke kanan, foto lagi.</p>'));
  root.appendChild(T.grid2(T.field('Foto kiri (sudut pertama)', fiKiri), T.field('Foto kanan (sudut kedua)', fiKanan)));
  root.appendChild(T.grid2(T.field('Kecepatan kedip', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(kecepatanR); w.appendChild(kecepatanV); return w; })()), T.field('Geser penjajaran', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(geserR); w.appendChild(geserV); return w; })(), 'Geser bila kedua foto kurang sejajar.')));
  root.appendChild(T.field('Lebar hasil', lebarSel, 'GIF hanya punya 256 warna, jadi warna foto sedikit berubah.'));
  root.appendChild(T.row(T.btn('Buat GIF 3D', make, true), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fiKiri.addEventListener('change', () => muatSatu(fiKiri, 'kiri'));
  fiKanan.addEventListener('change', () => muatSatu(fiKanan, 'kanan'));
}
