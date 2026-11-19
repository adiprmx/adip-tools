import { h as T, utils, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Filter Digicam Y2K: foto jadi seperti hasil kamera digital tahun 2000-an.
// Warna sensor CCD yang pekat, kilat flash dari depan, noise kasar, dan
// pilihan resolusi rendah yang membuat foto sedikit kotak-kotak.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "filter-digicam-y2k", "name": "Filter Digicam Y2K", "cat": "gambar", "icon": "📸", "desc": "Ubah foto jadi hasil kamera digital 2000-an: warna CCD, flash, noise.", "keywords": "digicam,y2k,kamera digital,2000-an,ccd,flash,noise,foto jadul", "since": "6.19.0"};

// PRNG kecil yang bisa diulang (mulberry32) supaya noise deterministis.
// Memakai utils.mulberry32; biji null/undefined tetap jadi 1 seperti
// sebelum migrasi (kanon memakai 0; kanonis, G4 C1G4-R).
export function buatAcak(biji) { return utils.mulberry32(biji == null ? 1 : biji); }

// Filter Digicam pada data piksel RGBA. Kembalikan array baru.
// kilat 0..100 (terang flash dari tengah atas), noise 0..100,
// biji angka untuk pola noise (sama = pola sama).
export function filterDigicam(data, w, h, opsi) {
  const o = opsi || {};
  const kilat = Math.max(0, Math.min(100, o.kilat == null ? 55 : o.kilat)) / 100;
  const noise = Math.max(0, Math.min(100, o.noise == null ? 50 : o.noise)) / 100;
  const acak = buatAcak(o.biji == null ? 2004 : o.biji);
  const keluar = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const dx = (x + 0.5) / w - 0.5;
      const dy = (y + 0.5) / h - 0.28;
      const d = Math.sqrt(dx * dx * 1.4 + dy * dy * 1.4);
      const flash = 1 + kilat * 0.45 * Math.max(0, 1 - d * 1.3);
      const abu = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
      const n = (acak() - 0.5) * 22 * noise;
      const r = data[j] + (data[j] - abu) * 0.35;
      const g = data[j + 1] + (data[j + 1] - abu) * 0.35;
      const b = data[j + 2] + (data[j + 2] - abu) * 0.35;
      keluar[j] = (r * 1.02 + n) * flash;
      keluar[j + 1] = (g * 0.99 + n) * flash;
      keluar[j + 2] = (b * 1.06 + n) * flash;
      keluar[j + 3] = data[j + 3];
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const kecilSel = T.select([['1', 'Tajam (resolusi penuh)'], ['2', 'Agak kotak (setengah)'], ['4', 'Kotak jelas (seperempat)']], '2');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const kilatR = T.input('range');
  kilatR.min = '0'; kilatR.max = '100'; kilatR.value = '55';
  const kilatV = T.el('<b>55%</b>');
  const kilatWrap = T.el('<div class="row" style="align-items:center"></div>');
  kilatWrap.appendChild(kilatR); kilatWrap.appendChild(kilatV);

  const noiseR = T.input('range');
  noiseR.min = '0'; noiseR.max = '100'; noiseR.value = '50';
  const noiseV = T.el('<b>50%</b>');
  const noiseWrap = T.el('<div class="row" style="align-items:center"></div>');
  noiseWrap.appendChild(noiseR); noiseWrap.appendChild(noiseV);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let tampilAsli = false;
  let raf = 0;

  function opsiAktif() {
    return { kilat: parseInt(kilatR.value, 10), noise: parseInt(noiseR.value, 10), biji: 2004 };
  }

  // Gambar foto ke canvas dengan efek resolusi rendah: kecilkan lalu
  // besarkan lagi tanpa penghalusan, jadi pikselnya kotak-kotak.
  function gambarDasar(ctx, w, h) {
    const bagi = parseInt(kecilSel.value, 10);
    if (bagi <= 1) {
      ctx.drawImage(img, 0, 0, w, h);
      return;
    }
    const kecil = document.createElement('canvas');
    kecil.width = Math.max(1, Math.round(w / bagi));
    kecil.height = Math.max(1, Math.round(h / bagi));
    kecil.getContext('2d').drawImage(img, 0, 0, kecil.width, kecil.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(kecil, 0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
  }

  function muatUlangDataPratinjau() {
    if (!pratinjau || !img) return;
    const w = pratinjau.width, h = pratinjau.height;
    pratinjauCtx.clearRect(0, 0, w, h);
    gambarDasar(pratinjauCtx, w, h);
    dataAsli = pratinjauCtx.getImageData(0, 0, w, h);
  }

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    if (tampilAsli) {
      pratinjauCtx.putImageData(dataAsli, 0, 0);
      return;
    }
    const hasil = filterDigicam(dataAsli.data, dataAsli.width, dataAsli.height, opsiAktif());
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  function kembaliKeHasil() {
    if (tampilAsli) { tampilAsli = false; lihatB.textContent = 'Lihat foto asli'; }
  }
  kilatR.addEventListener('input', () => { kilatV.textContent = kilatR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  noiseR.addEventListener('input', () => { noiseV.textContent = noiseR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  kecilSel.addEventListener('change', () => { kembaliKeHasil(); muatUlangDataPratinjau(); jadwalPratinjau(); });

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
      muatUlangDataPratinjau();
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
      gambarDasar(ctx, nw, nh);
      const data = ctx.getImageData(0, 0, nw, nh);
      const hasil = filterDigicam(data.data, nw, nh, opsiAktif());
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(namaFile + '-digicam-y2k.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
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
  root.appendChild(T.field('Seberapa kuat kilat flash', kilatWrap, 'Cahaya flash dari depan, paling terang di tengah foto.'));
  root.appendChild(T.field('Seberapa kasar noise-nya', noiseWrap, 'Bintik kasar khas sensor kamera digital lama.'));
  root.appendChild(T.field('Ketajaman foto', kecilSel, 'Kamera lama resolusinya kecil, fotonya agak kotak-kotak.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
