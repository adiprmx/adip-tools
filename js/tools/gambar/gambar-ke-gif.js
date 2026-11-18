import { h as T, loadImage, fileInput, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Gambar ke GIF: foto JPG/PNG/WebP jadi file GIF statis (satu gambar,
// bukan animasi). Browser tidak bisa menyimpan GIF lewat canvas, jadi
// encoding-nya memakai gifenc (murni JavaScript, sama seperti GIF Maker).
export const meta = {"id": "gambar-ke-gif", "name": "Gambar ke GIF", "cat": "gambar", "icon": "🖼️", "desc": "Foto JPG atau PNG jadi file GIF. Cocok buat tempat yang cuma terima GIF.", "keywords": "gif,jpg ke gif,png ke gif,ubah format,gambar", "since": "6.17.0"};

const GIFENC_CDN = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';

export function render(root) {
  const fi = fileInput('image/*');
  const lebarSel = T.select([['asli', 'Ukuran asli foto'], ['800', 'Lebar 800'], ['480', 'Lebar 480'], ['320', 'Lebar 320']], 'asli');
  const statusBox = T.out();
  const box = T.out();
  const hasilBox = T.out();

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let gifencSiap = null;

  const muatGifenc = () => {
    if (!gifencSiap) {
      gifencSiap = import(/* @vite-ignore */ GIFENC_CDN).then((m) => {
        if (typeof m.GIFEncoder !== 'function' || typeof m.quantize !== 'function' || typeof m.applyPalette !== 'function') {
          throw new Error('api gifenc tidak lengkap');
        }
        return m;
      }).catch((e) => { gifencSiap = null; throw e; });
    }
    return gifencSiap;
  };

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(hasilBox); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      const url = URL.createObjectURL(f);
      T.onLeave(() => URL.revokeObjectURL(url));
      const im = document.createElement('img');
      im.src = url; im.alt = 'Foto yang dipilih';
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(im);
      box.appendChild(T.el(`<p class="dim">${nw} × ${nh}, ${fmtBytes(f.size)}.</p>`));
      buatB.disabled = false;
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      buatB.disabled = true;
    }
  });

  async function buat() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    T.hide(hasilBox);
    buatB.disabled = true;
    T.show(statusBox, '<span class="dim">Memuat pembuat GIF… (perlu internet sekali saja)</span>');
    let lib;
    try {
      lib = await muatGifenc();
    } catch (e) {
      T.show(statusBox, '<div class="err">Pembuat GIF gagal dimuat. Cek koneksi internetmu lalu coba lagi.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
      buatB.disabled = false;
      return;
    }
    try {
      const targetLebar = lebarSel.value === 'asli' ? null : parseInt(lebarSel.value, 10);
      const skala = targetLebar ? Math.min(1, targetLebar / nw) : 1;
      const W = Math.max(2, Math.round(nw * skala));
      const H = Math.max(2, Math.round(nh * skala));
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      const palet = lib.quantize(data, 256);
      const indeks = lib.applyPalette(data, palet);
      const gif = lib.GIFEncoder();
      gif.writeFrame(indeks, W, H, { palette: palet, delay: 100 });
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      T.onLeave(() => URL.revokeObjectURL(url));
      T.hide(statusBox);
      T.show(hasilBox, '');
      const im = document.createElement('img');
      im.src = url; im.alt = 'GIF hasil';
      im.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      hasilBox.appendChild(im);
      hasilBox.appendChild(T.el(`<p class="dim">Ukuran file GIF: ${fmtBytes(blob.size)}.</p>`));
      hasilBox.appendChild(T.btn('Unduh GIF', () => { T.dl(`${namaFile}.gif`, blob, 'image/gif'); T.toast('Berhasil diunduh'); }, true));
      T.scrollToPreview(hasilBox);
    } catch (e) {
      T.show(statusBox, '<div class="err">Gagal membuat GIF. Coba pilih ukuran lebih kecil.</div> <button class="btn" type="button">Coba lagi</button>');
      statusBox.querySelector('button').addEventListener('click', buat);
    } finally {
      buatB.disabled = false;
    }
  }

  const buatB = T.btn('Buat GIF', buat, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Ukuran GIF', lebarSel, 'Ukuran asli bikin file GIF besar. GIF cuma muat 256 warna, jadi foto yang warnanya ramai akan sedikit berubah.'));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(buatB);
  root.appendChild(hasilBox);
}
