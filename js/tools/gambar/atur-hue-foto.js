import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Atur Hue Foto: geser corak warna foto. Pratinjau dihitung di canvas
// kecil supaya geserannya terasa langsung; hasil unduhan dihitung ulang
// di resolusi asli.
export const meta = {"id": "atur-hue-foto", "name": "Atur Hue Foto", "cat": "gambar", "icon": "🌈", "desc": "Geser corak warna foto: merah jadi hijau, hijau jadi biru, dan seterusnya.", "keywords": "hue,corak warna,geser warna,foto,edit foto,roda warna", "since": "6.18.0"};

// RGB (0..255) ke HSL: h 0..360, s 0..1, l 0..1. Fungsi murni.
export function rgbKeHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const maks = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (maks + min) / 2;
  if (maks === min) return [0, 0, l];
  const d = maks - min;
  const s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);
  let h;
  if (maks === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (maks === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

// HSL ke RGB (0..255). Fungsi murni.
export function hslKeRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hitung = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hitung(h + 1 / 3) * 255),
    Math.round(hitung(h) * 255),
    Math.round(hitung(h - 1 / 3) * 255),
  ];
}

// Geser hue tiap piksel sejauh `derajat` (-180..180). Murni, bisa diuji
// tanpa DOM. derajat 0 mengembalikan piksel yang sama (toleransi +-1
// karena pembulatan).
export function geserHue(data, derajat) {
  const d = Number(derajat) || 0;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbKeHsl(data[i], data[i + 1], data[i + 2]);
    const [r, g, b] = hslKeRgb(h + d, s, l);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return data;
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const statusBox = T.out();
  const box = T.out();

  const range = T.input('range');
  range.min = '-180'; range.max = '180'; range.value = '0';
  const val = T.el('<b>0°</b>');
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
    geserHue(salinan.data, parseInt(range.value, 10));
    pratinjauCtx.putImageData(salinan, 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  range.addEventListener('input', () => {
    const v = parseInt(range.value, 10);
    val.textContent = (v > 0 ? '+' : '') + v + '°';
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
      geserHue(data.data, parseInt(range.value, 10));
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
      T.dl(`${namaFile}-hue.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  function reset() {
    range.value = '0';
    range.dispatchEvent(new Event('input'));
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);
  const resetB = T.btn('Kembalikan Seperti Semula', reset, false, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Geser corak warna', wrapGeser, 'Geser ke kanan untuk memutar warnanya searah jarum jam di roda warna, ke kiri untuk sebaliknya.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(unduhB, resetB));
}
