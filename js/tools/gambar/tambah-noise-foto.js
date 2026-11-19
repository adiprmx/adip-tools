import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js';

// Tambah Noise Foto: tambahkan bintik acak ke foto (efek grain film).
// Dua jenis bintik: merata (seragam) dan halus (gauss, mirip grain film
// analog). Jumlahnya bisa diatur. Berguna untuk memberi tekstur ke foto
// yang terlalu bersih, atau menyamarkan area yang diedit.
export const meta = {"id": "tambah-noise-foto", "name": "Tambah Noise Foto", "cat": "gambar", "icon": "📺", "desc": "Tambah bintik grain film ke foto, atur jumlah dan jenis bintiknya.", "keywords": "noise,grain,bintik,film,tekstur,foto,analog", "since": "6.19.0"};

// Tambah noise ke data piksel RGBA. jumlah 0-100. rand() harus mengembalikan
// angka 0-1 (bisa diisi generator deterministik untuk pengujian).
// jenis 'seragam': nilai acak merata. 'gauss': distribusi normal (Box-Muller).
// Mengembalikan salinan baru. Fungsi murni.
export function tambahNoise(data, jumlah, jenis, rand) {
  const keluar = new Uint8ClampedArray(data);
  const acak = typeof rand === 'function' ? rand : Math.random;
  const kuat = Math.max(0, Math.min(100, jumlah)) * 2.55;
  if (kuat <= 0) return keluar;
  let sisaGauss = null;
  const gauss = () => {
    if (sisaGauss !== null) { const v = sisaGauss; sisaGauss = null; return v; }
    let u = 0;
    while (u <= 0) u = acak();
    const v = acak();
    const r = Math.sqrt(-2 * Math.log(u));
    const t = 2 * Math.PI * v;
    sisaGauss = r * Math.sin(t);
    return r * Math.cos(t);
  };
  for (let i = 0; i + 3 < keluar.length; i += 4) {
    // Satu nilai noise per piksel (monokrom) supaya hasilnya grain film,
    // bukan bintik warna.
    const n = jenis === 'gauss' ? gauss() * kuat * 0.6 : (acak() * 2 - 1) * kuat;
    keluar[i] += n;
    keluar[i + 1] += n;
    keluar[i + 2] += n;
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const jenisSel = T.select([['gauss', 'Halus (mirip grain film)'], ['seragam', 'Merata (bintik kasar)']], 'gauss');
  const jumlahR = T.input('range');
  jumlahR.min = '1'; jumlahR.max = '100'; jumlahR.value = '20';
  const jumlahV = T.el('<b>20</b>');
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block;margin:12px auto';
  const statusBox = T.out();
  const hasilBox = T.out();
  let img = null, nama = 'foto', off = null;

  function gambar() {
    if (!img) return;
    const skala = Math.min(1, 900 / img.naturalWidth);
    canvas.width = Math.max(1, Math.round(img.naturalWidth * skala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * skala));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasil = tambahNoise(d.data, parseInt(jumlahR.value, 10), jenisSel.value, Math.random);
    ctx.putImageData(new ImageData(hasil, canvas.width, canvas.height), 0, 0);
  }

  jumlahR.addEventListener('input', () => { jumlahV.textContent = jumlahR.value; gambar(); });
  jenisSel.addEventListener('change', gambar);

  const dlB = T.btn('Unduh foto (PNG)', async () => {
    if (!img) { T.toast('Pilih dulu fotonya.'); return; }
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const hasil = tambahNoise(d.data, parseInt(jumlahR.value, 10), jenisSel.value, Math.random);
    ctx.putImageData(new ImageData(hasil, c.width, c.height), 0, 0);
    const blob = await canvasToBlob(c, 'image/png');
    if (!blob) { T.toast('Gagal membuat PNG.'); return; }
    T.dl(`${nama}-noise.png`, blob, 'image/png');
  }, true);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nama = (f.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'foto';
      T.hide(statusBox);
      gambar();
      T.show(hasilBox, '');
      hasilBox.appendChild(canvas);
      hasilBox.appendChild(dlB);
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Coba file gambar lain (JPG, PNG, atau WebP).</div>');
    }
    fi.value = '';
  });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Bintik grain membuat foto digital terasa seperti foto film analog. Geser jumlahnya sampai terasa pas di pratinjau, lalu unduh.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Jenis bintik', jenisSel));
  root.appendChild(T.field('Jumlah bintik', T.row(jumlahR, jumlahV), '1 = hampir tidak terlihat, 100 = sangat kasar.'));
  root.appendChild(statusBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + '</p>'));
}
