import { h as T, utils, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Efek Tilt-Shift: foto terlihat seperti miniatur. Satu pita horizontal
// tetap tajam, bagian atas dan bawah diburamkan secara bertahap, dan
// warnanya sedikit diperkuat, meniru foto lensa tilt-shift.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "efek-tilt-shift", "name": "Efek Tilt-Shift", "cat": "gambar", "icon": "🏙️", "desc": "Buat foto terlihat seperti miniatur: pita tajam di tengah, atas bawah blur.", "keywords": "tilt shift,miniatur,blur,selektif,efek foto", "since": "6.19.0"};


// Seberapa blur baris y: 0 di dalam pita tajam, 1 di luar pita.
// fokus 0..100 = posisi tengah pita (% dari atas),
// lebar 5..80 = lebar pita tajam (% dari tinggi foto).
export function maskBlurBaris(y, h, fokus, lebar) {
  const tengah = (Math.max(0, Math.min(100, fokus)) / 100) * h;
  const setengah = Math.max(1, (Math.max(5, Math.min(80, lebar)) / 100) * h / 2);
  const d = Math.abs(y + 0.5 - tengah) / setengah;
  if (d <= 1) return 0;
  const t = Math.min(1, (d - 1) / 1.5);
  return t * t * (3 - 2 * t);
}

// Tilt-shift pada data piksel RGBA. Kembalikan array baru.
// opsi: fokus (0..100), lebar (5..80), blur (1..20 radius),
// jenuh (0..100, tambahan kejenuhan warna di area tajam).
export function efekTiltShift(data, w, h, opsi) {
  const o = opsi || {};
  const blur = utils.blurKotak(data, w, h, o.blur == null ? 8 : o.blur);
  const jenuh = Math.max(0, Math.min(100, o.jenuh == null ? 30 : o.jenuh)) / 100;
  const keluar = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    const m = maskBlurBaris(y, h, o.fokus == null ? 50 : o.fokus, o.lebar == null ? 25 : o.lebar);
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const k = (y * w + x) * 3;
      const abu = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
      for (let c = 0; c < 3; c++) {
        const tajam = data[j + c] + (data[j + c] - abu) * jenuh;
        const campur = tajam + (blur[k + c] - tajam) * m;
        keluar[j + c] = campur;
      }
      keluar[j + 3] = data[j + 3];
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  function buatSlider(min, maks, nilai, satuan) {
    const r = T.input('range');
    r.min = String(min); r.max = String(maks); r.value = String(nilai);
    const v = T.el('<b>' + nilai + satuan + '</b>');
    const wrap = T.el('<div class="row" style="align-items:center"></div>');
    wrap.appendChild(r); wrap.appendChild(v);
    return { r, v, wrap, satuan };
  }
  const fokusS = buatSlider(0, 100, 50, '%');
  const lebarS = buatSlider(5, 80, 25, '%');
  const blurS = buatSlider(1, 20, 8, '');
  const jenuhS = buatSlider(0, 100, 30, '%');

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let tampilAsli = false;
  let raf = 0;

  function opsiAktif() {
    return {
      fokus: parseInt(fokusS.r.value, 10),
      lebar: parseInt(lebarS.r.value, 10),
      blur: parseInt(blurS.r.value, 10),
      jenuh: parseInt(jenuhS.r.value, 10)
    };
  }
  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    if (tampilAsli) {
      pratinjauCtx.putImageData(dataAsli, 0, 0);
      return;
    }
    const hasil = efekTiltShift(dataAsli.data, dataAsli.width, dataAsli.height, opsiAktif());
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  function kembaliKeHasil() {
    if (tampilAsli) { tampilAsli = false; lihatB.textContent = 'Lihat foto asli'; }
  }
  [fokusS, lebarS, blurS, jenuhS].forEach((s) => {
    s.r.addEventListener('input', () => { s.v.textContent = s.r.value + s.satuan; kembaliKeHasil(); jadwalPratinjau(); });
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
      const hasil = efekTiltShift(data.data, nw, nh, opsiAktif());
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(namaFile + '-tilt-shift.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
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

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Posisi pita tajam', fokusS.wrap, '0% paling atas, 100% paling bawah. Arahkan ke bagian foto yang ingin terlihat tajam.'));
  root.appendChild(T.field('Lebar pita tajam', lebarS.wrap, 'Pita sempit membuat kesan miniaturnya lebih kuat.'));
  root.appendChild(T.field('Seberapa blur sisanya', blurS.wrap, 'Nilai besar membuat atas dan bawah makin kabur.'));
  root.appendChild(T.field('Tambah kejenuhan warna', jenuhS.wrap, 'Warna sedikit diperkuat supaya kesan mainannya makin terasa.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
