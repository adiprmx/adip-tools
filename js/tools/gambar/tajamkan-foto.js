import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Tajamkan Foto: pertajam detail foto yang agak buram dengan konvolusi
// sharpen 3x3. Intensitas 0% = foto asli, 100% = tajam penuh. Kebalikan
// dari Blur Foto. Pratinjau dihitung di canvas kecil; hasil unduhan
// dihitung ulang di resolusi asli.
export const meta = {"id": "tajamkan-foto", "name": "Tajamkan Foto", "cat": "gambar", "icon": "🔍", "desc": "Pertajam detail foto yang agak buram. Atur seberapa kuat efeknya.", "keywords": "tajam,sharpen,buram,detail,foto,pertajam", "since": "6.17.0"};

// Terapkan sharpen ke ImageData (murni, bisa diuji tanpa DOM).
// Kernel 3x3 [0 -1 0; -1 5 -1; 0 -1 0], dicampur dengan asli sesuai
// intensitas 0..100. Tepi gambar dibiarkan apa adanya.
export function terapkanTajam(data, w, h, intensitas) {
  const t = Math.max(0, Math.min(100, Number(intensitas) || 0)) / 100;
  if (t === 0 || w < 3 || h < 3) return data;
  const asli = new Uint8ClampedArray(data);
  const at = (x, y, c) => asli[(y * w + x) * 4 + c];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        const tajam = 5 * at(x, y, c) - at(x - 1, y, c) - at(x + 1, y, c) - at(x, y - 1, c) - at(x, y + 1, c);
        const i = (y * w + x) * 4 + c;
        const campur = asli[i] + (tajam - asli[i]) * t;
        data[i] = campur < 0 ? 0 : campur > 255 ? 255 : campur;
      }
    }
  }
  return data;
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const statusBox = T.out();
  const box = T.out();

  const range = T.input('range');
  range.min = '0'; range.max = '100'; range.value = '60';
  const val = T.el('<b>60%</b>');
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
    terapkanTajam(salinan.data, salinan.width, salinan.height, parseInt(range.value, 10));
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
      terapkanTajam(data.data, nw, nh, parseInt(range.value, 10));
      ctx.putImageData(data, 0, 0);
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
      T.dl(`${namaFile}-tajam.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  function reset() {
    range.value = '60';
    range.dispatchEvent(new Event('input'));
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);
  const resetB = T.btn('Kembalikan Seperti Semula', reset, false, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Seberapa kuat efek tajamnya', wrapGeser, 'Terlalu kuat bikin foto kelihatan kasar. Foto yang sudah sangat buram tidak bisa jadi tajam sempurna.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(unduhB, resetB));
}
