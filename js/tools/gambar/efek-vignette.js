import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Efek Vignette: gelapkan pinggir foto secara bertahap supaya mata
// tertuju ke tengah. Kekuatan, kelembutan peralihan, dan bentuknya
// bisa diatur. Berbeda dari efek vintage yang vignette-nya terkunci
// sebagai satu paket dengan sepia dan grain.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "efek-vignette", "name": "Efek Vignette", "cat": "gambar", "icon": "◉", "desc": "Gelapkan pinggir foto supaya fokus tertuju ke tengah.", "keywords": "vignette,gelap pinggir,fokus,efek foto,buram tepi", "since": "6.19.0"};

// Faktor kegelapan di satu piksel (1 = tidak berubah, 0 = hitam total).
// kuat 0..100, lembut 0..100 (0 = tepi tegas, 100 = peralihan sangat halus),
// bentuk 'bundar' (elips) atau 'persegi' (mengikuti sisi foto).
export function faktorVignette(x, y, w, h, kuat, lembut, bentuk) {
  const cx = (x + 0.5) / w - 0.5;
  const cy = (y + 0.5) / h - 0.5;
  let d;
  if (bentuk === 'persegi') {
    d = Math.max(Math.abs(cx), Math.abs(cy)) * 2;
  } else {
    d = Math.sqrt(cx * cx + cy * cy) * 2;
  }
  const dalam = 1 - (Math.max(0, Math.min(100, lembut)) / 100) * 0.9;
  const t = Math.max(0, Math.min(1, (d - dalam) / Math.max(0.001, 1 - dalam)));
  const halus = t * t * (3 - 2 * t);
  return 1 - (Math.max(0, Math.min(100, kuat)) / 100) * halus;
}

// Vignette pada data piksel RGBA. Kembalikan array baru.
export function efekVignette(data, w, h, kuat, lembut, bentuk) {
  const keluar = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const f = faktorVignette(x, y, w, h, kuat, lembut, bentuk);
      keluar[j] = data[j] * f;
      keluar[j + 1] = data[j + 1] * f;
      keluar[j + 2] = data[j + 2] * f;
      keluar[j + 3] = data[j + 3];
    }
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const bentukSel = T.select([['bundar', 'Bundar (elips)'], ['persegi', 'Persegi (mengikuti sisi)']], 'bundar');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const kuatR = T.input('range');
  kuatR.min = '0'; kuatR.max = '100'; kuatR.value = '60';
  const kuatV = T.el('<b>60%</b>');
  const kuatWrap = T.el('<div class="row" style="align-items:center"></div>');
  kuatWrap.appendChild(kuatR); kuatWrap.appendChild(kuatV);

  const lembutR = T.input('range');
  lembutR.min = '0'; lembutR.max = '100'; lembutR.value = '60';
  const lembutV = T.el('<b>60%</b>');
  const lembutWrap = T.el('<div class="row" style="align-items:center"></div>');
  lembutWrap.appendChild(lembutR); lembutWrap.appendChild(lembutV);

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
    const hasil = efekVignette(dataAsli.data, dataAsli.width, dataAsli.height, parseInt(kuatR.value, 10), parseInt(lembutR.value, 10), bentukSel.value);
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
  lembutR.addEventListener('input', () => { lembutV.textContent = lembutR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  bentukSel.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });

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
      const hasil = efekVignette(data.data, nw, nh, parseInt(kuatR.value, 10), parseInt(lembutR.value, 10), bentukSel.value);
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
      T.dl(namaFile + '-vignette.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
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
  root.appendChild(T.field('Seberapa gelap pinggirnya', kuatWrap, 'Geser ke kanan, pinggirnya makin gelap. Di ujung kiri, fotonya tidak berubah.'));
  root.appendChild(T.field('Seberapa halus peralihannya', lembutWrap, 'Nilai kecil membuat batas gelapnya tegas, nilai besar membuat gelapnya merata dari tengah.'));
  root.appendChild(T.field('Bentuk gelapnya', bentukSel));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
