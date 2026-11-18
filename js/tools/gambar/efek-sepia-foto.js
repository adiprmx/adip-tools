import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Efek Sepia Foto: nuansa cokelat klasik sepia murni yang bisa diatur
// intensitasnya 0-100%. BEDA dari Efek Vintage (efek-vintage.js): itu
// preset tetap sepia+vignette+grain yang tidak bisa diatur; di sini
// hanya sepia, dan kekuatannya bisa digeser sesuka hati.
export const meta = {"id": "efek-sepia-foto", "name": "Efek Sepia Foto", "cat": "gambar", "icon": "🟤", "desc": "Foto jadi nuansa cokelat klasik sepia. Atur seberapa kuat warnanya.", "keywords": "sepia,cokelat,foto jadul,efek,nuansa klasik", "since": "6.17.0"};

// Terapkan sepia ke ImageData (murni, bisa diuji tanpa DOM).
// intensitas 0..100: 0 = asli, 100 = sepia penuh.
export function terapkanSepia(data, intensitas) {
  const t = Math.max(0, Math.min(100, Number(intensitas) || 0)) / 100;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const sr = 0.393 * r + 0.769 * g + 0.189 * b;
    const sg = 0.349 * r + 0.686 * g + 0.168 * b;
    const sb = 0.272 * r + 0.534 * g + 0.131 * b;
    data[i] = r + (Math.min(255, sr) - r) * t;
    data[i + 1] = g + (Math.min(255, sg) - g) * t;
    data[i + 2] = b + (Math.min(255, sb) - b) * t;
  }
  return data;
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const statusBox = T.out();
  const box = T.out();

  const range = T.input('range');
  range.min = '0'; range.max = '100'; range.value = '100';
  const val = T.el('<b>100%</b>');
  const wrapGeser = T.el('<div class="row" style="align-items:center"></div>');
  wrapGeser.appendChild(range); wrapGeser.appendChild(val);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let raf = 0;

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    const salinan = new ImageData(new Uint8ClampedArray(dataAsli.data), dataAsli.width, dataAsli.height);
    terapkanSepia(salinan.data, parseInt(range.value, 10));
    pratinjauCtx.putImageData(salinan, 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  range.addEventListener('input', () => {
    val.textContent = range.value + '%';
    jadwalPratinjau();
  });

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
      resetB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
      resetB.disabled = true;
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
      terapkanSepia(data.data, parseInt(range.value, 10));
      ctx.putImageData(data, 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-sepia.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  function reset() {
    range.value = '100';
    range.dispatchEvent(new Event('input'));
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);
  const resetB = T.btn('Kembalikan Seperti Semula', reset, false, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Seberapa kuat warna sepianya', wrapGeser, 'Geser ke kiri untuk warna tipis, ke kanan untuk cokelat pekat.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(unduhB, resetB));
}
