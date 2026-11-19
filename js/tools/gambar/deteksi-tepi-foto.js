import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Deteksi Tepi Foto: tampilkan hanya garis bentuk dari foto (operator
// Sobel). Pratinjau dihitung di canvas kecil; hasil unduhan dihitung
// ulang di resolusi asli.
export const meta = {"id": "deteksi-tepi-foto", "name": "Deteksi Tepi Foto", "cat": "gambar", "icon": "✏️", "desc": "Ubah foto jadi gambar garis: hanya tepi dan bentuknya yang terlihat.", "keywords": "deteksi tepi,edge detection,sobel,garis bentuk,sketsa garis,foto", "since": "6.18.0"};

// Deteksi tepi Sobel pada data piksel RGBA. Kembalikan array baru:
// piksel tepi bernilai 255 (atau 0 bila balik), sisanya kebalikannya.
// ambang 0..255: makin kecil, makin banyak garis yang muncul.
export function deteksiTepi(data, w, h, ambang, balik) {
  const keluar = new Uint8ClampedArray(data.length);
  const abu = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const j = i * 4;
    abu[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }
  const tepi = balik ? 0 : 255;
  const latar = balik ? 255 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      keluar[j + 3] = 255;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        keluar[j] = keluar[j + 1] = keluar[j + 2] = latar;
        continue;
      }
      const gx =
        -abu[(y - 1) * w + x - 1] - 2 * abu[y * w + x - 1] - abu[(y + 1) * w + x - 1]
        + abu[(y - 1) * w + x + 1] + 2 * abu[y * w + x + 1] + abu[(y + 1) * w + x + 1];
      const gy =
        -abu[(y - 1) * w + x - 1] - 2 * abu[(y - 1) * w + x] - abu[(y - 1) * w + x + 1]
        + abu[(y + 1) * w + x - 1] + 2 * abu[(y + 1) * w + x] + abu[(y + 1) * w + x + 1];
      const kuat = Math.sqrt(gx * gx + gy * gy);
      const v = kuat >= ambang ? tepi : latar;
      keluar[j] = v; keluar[j + 1] = v; keluar[j + 2] = v;
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const gayaSel = T.select([['putih', 'Garis putih di latar hitam'], ['hitam', 'Garis hitam di latar putih']], 'putih');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const ambR = T.input('range');
  ambR.min = '0'; ambR.max = '255'; ambR.value = '60';
  const ambV = T.el('<b>60</b>');
  const ambWrap = T.el('<div class="row" style="align-items:center"></div>');
  ambWrap.appendChild(ambR); ambWrap.appendChild(ambV);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let raf = 0;

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    const hasil = deteksiTepi(dataAsli.data, dataAsli.width, dataAsli.height, parseInt(ambR.value, 10), gayaSel.value === 'hitam');
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  ambR.addEventListener('input', () => { ambV.textContent = ambR.value; jadwalPratinjau(); });
  gayaSel.addEventListener('change', jadwalPratinjau);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nw = img.naturalWidth; nh = img.naturalHeight;
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      const skala = Math.min(1, 800 / Math.max(nw, nh));
      const w = Math.max(1, Math.round(nw * skala));
      const h = Math.max(1, Math.round(nh * skala));
      pratinjau = document.createElement('canvas');
      pratinjau.width = w; pratinjau.height = h;
      pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block';
      pratinjauCtx = pratinjau.getContext('2d', { willReadFrequently: true });
      pratinjauCtx.drawImage(img, 0, 0, w, h);
      dataAsli = pratinjauCtx.getImageData(0, 0, w, h);
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(pratinjau);
      unduhB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
    }
  });

  async function unduh() {
    if (!img) { T.toast('Pilih foto dulu'); return; }
    unduhB.disabled = true;
    T.show(statusBox, '<span class="dim">Menyiapkan hasil…</span>');
    try {
      const c = document.createElement('canvas');
      c.width = nw; c.height = nh;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, nw, nh);
      const data = ctx.getImageData(0, 0, nw, nh);
      const hasil = deteksiTepi(data.data, nw, nh, parseInt(ambR.value, 10), gayaSel.value === 'hitam');
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-tepi.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Seberapa peka garisnya', ambWrap, 'Nilai kecil menangkap garis halus (tapi juga noise), nilai besar hanya garis yang tegas.'));
  root.appendChild(T.field('Warna garis', gayaSel));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(unduhB));
}
