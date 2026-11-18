import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Penyesuai Foto: atur kecerahan, kontras, dan saturasi foto dalam satu
// tempat. Pratinjau dihitung di canvas kecil supaya geserannya terasa
// langsung; hasil unduhan dihitung ulang di resolusi asli.
export const meta = {"id": "penyesuai-foto", "name": "Penyesuai Foto", "cat": "gambar", "icon": "🎚️", "desc": "Atur terang, kontras, dan warna foto dengan tiga geseran.", "keywords": "kecerahan,kontras,saturasi,terang,warna foto,edit foto", "since": "6.16.0"};

// Terapkan penyesuaian ke ImageData (murni, bisa diuji tanpa DOM).
// b, k, s masing-masing -100..100.
export function sesuaikanPiksel(data, b, k, s) {
  const fTerang = 1 + b / 100;
  const fKontras = 1 + k / 100;
  const fSaturasi = 1 + s / 100;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * fTerang;
    let g = data[i + 1] * fTerang;
    let bl = data[i + 2] * fTerang;
    r = (r - 128) * fKontras + 128;
    g = (g - 128) * fKontras + 128;
    bl = (bl - 128) * fKontras + 128;
    const abu = 0.299 * r + 0.587 * g + 0.114 * bl;
    r = abu + (r - abu) * fSaturasi;
    g = abu + (g - abu) * fSaturasi;
    bl = abu + (bl - abu) * fSaturasi;
    data[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    data[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
  }
  return data;
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['jpeg', 'JPG (ukuran kecil)'], ['png', 'PNG (tanpa pecah)']], 'jpeg');
  const statusBox = T.out();
  const box = T.out();

  const buatGeser = (label, nilaiAwal) => {
    const range = T.input('range');
    range.min = '-100'; range.max = '100'; range.value = String(nilaiAwal);
    const val = T.el(`<b>${nilaiAwal > 0 ? '+' : ''}${nilaiAwal}</b>`);
    const wrap = T.el('<div class="row" style="align-items:center"></div>');
    wrap.appendChild(range); wrap.appendChild(val);
    range.addEventListener('input', () => {
      const v = parseInt(range.value, 10);
      val.textContent = (v > 0 ? '+' : '') + v;
      jadwalPratinjau();
    });
    return { range, field: T.field(label, wrap) };
  };
  const terang = buatGeser('Terang', 0);
  const kontras = buatGeser('Kontras', 0);
  const saturasi = buatGeser('Warna', 0);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null; // canvas pratinjau (kecil)
  let pratinjauCtx = null;
  let dataAsli = null;  // ImageData pratinjau sebelum disesuaikan
  let raf = 0;

  function nilai() {
    return {
      b: parseInt(terang.range.value, 10),
      k: parseInt(kontras.range.value, 10),
      s: parseInt(saturasi.range.value, 10),
    };
  }

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    const salinan = new ImageData(new Uint8ClampedArray(dataAsli.data), dataAsli.width, dataAsli.height);
    const n = nilai();
    sesuaikanPiksel(salinan.data, n.b, n.k, n.s);
    pratinjauCtx.putImageData(salinan, 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }

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
      const n = nilai();
      sesuaikanPiksel(data.data, n.b, n.k, n.s);
      ctx.putImageData(data, 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-sesuai.${fmtSel.value === 'png' ? 'png' : 'jpg'}`, blob, mime);
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  function reset() {
    [terang, kontras, saturasi].forEach((g) => { g.range.value = '0'; g.range.dispatchEvent(new Event('input')); });
  }

  const unduhB = T.btn('Unduh Hasil', unduh, true, true);
  const resetB = T.btn('Kembalikan Seperti Semula', reset, false, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(terang.field);
  root.appendChild(kontras.field);
  root.appendChild(saturasi.field);
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(T.row(unduhB, resetB));
}
