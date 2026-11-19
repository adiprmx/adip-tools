import { h as T, utils, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Efek Glow: foto jadi bercahaya lembut. Caranya: foto diburamkan, lalu
// dicampur kembali dengan foto asli memakai rumus screen, jadi bagian
// terang terasa menyala tanpa menghilangkan detail.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "efek-glow", "name": "Efek Glow", "cat": "gambar", "icon": "✨", "desc": "Beri foto cahaya lembut yang bersinar, bagian terangnya terasa menyala.", "keywords": "glow,bersinar,cahaya,lembut,efek foto,bloom", "since": "6.19.0"};


// Glow pada data piksel RGBA. Kembalikan array baru.
// kekuatan 0..100: 0 = foto asli, 100 = cahaya penuh.
// radius 1..20: seberapa lebar sebaran cahayanya.
export function efekGlow(data, w, h, kekuatan, radius) {
  const s = Math.max(0, Math.min(100, kekuatan == null ? 60 : kekuatan)) / 100;
  const keluar = new Uint8ClampedArray(data.length);
  if (s === 0) { keluar.set(data); return keluar; }
  const blur = utils.blurKotak(data, w, h, radius == null ? 8 : radius);
  for (let i = 0; i < w * h; i++) {
    const j = i * 4;
    const k = i * 3;
    for (let c = 0; c < 3; c++) {
      const asli = data[j + c];
      const kabur = blur[k + c];
      const layar = 255 - ((255 - asli) * (255 - kabur)) / 255;
      keluar[j + c] = asli + (layar - asli) * s;
    }
    keluar[j + 3] = data[j + 3];
  }
  return keluar;
}

export function render(root) {
  const fi = fileInput('image/*');
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const kuatR = T.input('range');
  kuatR.min = '0'; kuatR.max = '100'; kuatR.value = '60';
  const kuatV = T.el('<b>60%</b>');
  const kuatWrap = T.el('<div class="row" style="align-items:center"></div>');
  kuatWrap.appendChild(kuatR); kuatWrap.appendChild(kuatV);

  const lebarR = T.input('range');
  lebarR.min = '1'; lebarR.max = '20'; lebarR.value = '8';
  const lebarV = T.el('<b>8</b>');
  const lebarWrap = T.el('<div class="row" style="align-items:center"></div>');
  lebarWrap.appendChild(lebarR); lebarWrap.appendChild(lebarV);

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
    const hasil = efekGlow(dataAsli.data, dataAsli.width, dataAsli.height, parseInt(kuatR.value, 10), parseInt(lebarR.value, 10));
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
  lebarR.addEventListener('input', () => { lebarV.textContent = lebarR.value; kembaliKeHasil(); jadwalPratinjau(); });

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
      const hasil = efekGlow(data.data, nw, nh, parseInt(kuatR.value, 10), parseInt(lebarR.value, 10));
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(namaFile + '-glow.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
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
  root.appendChild(T.field('Seberapa kuat cahayanya', kuatWrap, 'Geser ke kanan, cahayanya makin terasa. Di ujung kiri, fotonya tidak berubah.'));
  root.appendChild(T.field('Seberapa lebar sebaran cahaya', lebarWrap, 'Nilai besar membuat cahaya menyebar jauh dari bagian terang.'));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
