import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Efek Emboss: beri foto efek timbul seperti ukiran (konvolusi 3x3).
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli. Semua kernel berjumlah 0, jadi foto yang datar jadi
// abu-abu netral (128) pada kekuatan penuh.
export const meta = {"id": "efek-emboss", "name": "Efek Emboss", "cat": "gambar", "icon": "🗿", "desc": "Beri foto efek timbul seperti ukiran, bisa diatur kuatnya.", "keywords": "emboss,timbul,ukiran,relief,efek foto,ukir", "since": "6.18.0"};

// Kernel emboss 3x3 per arah cahaya (baris atas dulu). Tiap kernel
// berjumlah 0: area datar jadi 128 (abu-abu netral), tepi yang menghadap
// cahaya jadi terang, tepi sebaliknya jadi gelap.
export const KERNEL_EMBOSS = {
  'kiri-atas': [-1, -1, 0, -1, 0, 1, 0, 1, 1],
  'kanan-atas': [0, -1, -1, 1, 0, -1, 1, 1, 0],
  'kanan-bawah': [1, 1, 0, 1, 0, -1, 0, -1, -1],
  'kiri-bawah': [0, 1, 1, -1, 0, 1, -1, -1, 0]
};

export function kernelEmboss(arah) {
  return KERNEL_EMBOSS[arah] || KERNEL_EMBOSS['kiri-atas'];
}

// Emboss pada data piksel RGBA. Kembalikan array baru.
// kekuatan 0..100: 0 = foto asli, 100 = efek penuh.
// abu true = hasil abu-abu (dihitung dari terang-gelap foto).
export function efekEmboss(data, w, h, kekuatan, arah, abu) {
  const k = kernelEmboss(arah);
  const s = Math.max(0, Math.min(100, kekuatan == null ? 100 : kekuatan)) / 100;
  const keluar = new Uint8ClampedArray(data.length);
  const abuArr = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const j = i * 4;
    abuArr[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      keluar[j + 3] = data[j + 3];
      const tepi = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      for (let c = 0; c < 3; c++) {
        const asli = abu ? abuArr[y * w + x] : data[j + c];
        let timbul = 128;
        if (!tepi) {
          let total = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const p = (y + ky) * w + (x + kx);
              const nilai = abu ? abuArr[p] : data[p * 4 + c];
              total += nilai * k[(ky + 1) * 3 + (kx + 1)];
            }
          }
          timbul = total + 128;
        }
        keluar[j + c] = asli * (1 - s) + timbul * s;
      }
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const arahSel = T.select([
    ['kiri-atas', 'Kiri atas'],
    ['kanan-atas', 'Kanan atas'],
    ['kanan-bawah', 'Kanan bawah'],
    ['kiri-bawah', 'Kiri bawah']
  ], 'kiri-atas');
  const warnaSel = T.select([['warna', 'Berwarna'], ['abu', 'Abu-abu']], 'warna');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const kuatR = T.input('range');
  kuatR.min = '0'; kuatR.max = '100'; kuatR.value = '70';
  const kuatV = T.el('<b>70%</b>');
  const kuatWrap = T.el('<div class="row" style="align-items:center"></div>');
  kuatWrap.appendChild(kuatR); kuatWrap.appendChild(kuatV);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let tampilAsli = false;
  let raf = 0;

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    if (tampilAsli) {
      pratinjauCtx.putImageData(dataAsli, 0, 0);
      return;
    }
    const hasil = efekEmboss(dataAsli.data, dataAsli.width, dataAsli.height, parseInt(kuatR.value, 10), arahSel.value, warnaSel.value === 'abu');
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  function kembaliKeHasil() {
    if (tampilAsli) { tampilAsli = false; lihatB.textContent = 'Lihat foto asli'; }
  }
  kuatR.addEventListener('input', () => { kuatV.textContent = kuatR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  arahSel.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });
  warnaSel.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });

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
      tampilAsli = false;
      lihatB.textContent = 'Lihat foto asli';
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(pratinjau);
      unduhB.disabled = false;
      lihatB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
      lihatB.disabled = true;
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
      const hasil = efekEmboss(data.data, nw, nh, parseInt(kuatR.value, 10), arahSel.value, warnaSel.value === 'abu');
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      // JPEG tidak punya transparansi: timpa di atas latar putih supaya
      // bagian tembus pandang tidak jadi hitam (pola banding-foto).
      let sumber = c;
      if (mime === 'image/jpeg') {
        const putih = document.createElement('canvas');
        putih.width = c.width; putih.height = c.height;
        const px = putih.getContext('2d');
        px.fillStyle = '#ffffff'; px.fillRect(0, 0, c.width, c.height);
        px.drawImage(c, 0, 0);
        sumber = putih;
      }
      const blob = await canvasToBlob(sumber, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-emboss.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const lihatB = T.btn('Lihat foto asli', () => {
    if (!img) return;
    tampilAsli = !tampilAsli;
    lihatB.textContent = tampilAsli ? 'Lihat hasil' : 'Lihat foto asli';
    gambarPratinjau();
  }, false, true);
  const unduhB = T.btn('Unduh Hasil', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Seberapa kuat efeknya', kuatWrap, 'Geser ke kanan, ukirannya makin tegas. Di ujung kiri, fotonya tidak berubah.'));
  root.appendChild(T.grid2(T.field('Arah cahaya', arahSel), T.field('Warna hasil', warnaSel)));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
