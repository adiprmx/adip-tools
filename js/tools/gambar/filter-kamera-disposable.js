import { h as T, utils, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Filter Kamera Disposable: foto jadi seperti hasil kamera sekali pakai.
// Warna film (hangat di terang, kehijauan di gelap), grain kasar,
// bocor cahaya oranye dari pojok, gelap tipis di pinggir, plus stempel
// tanggal oranye ala kamera film. Stempel tanggalnya opsional dan
// tanggalnya bisa diubah.
// Pratinjau dihitung di canvas kecil; hasil unduhan dihitung ulang di
// resolusi asli.
export const meta = {"id": "filter-kamera-disposable", "name": "Filter Kamera Disposable", "cat": "gambar", "icon": "🎞️", "desc": "Beri foto tampilan kamera sekali pakai: warna film, grain, flash, stempel tanggal.", "keywords": "disposable,kamera sekali pakai,film,analog,grain,light leak,stempel tanggal", "since": "6.19.0"};

// PRNG kecil yang bisa diulang (mulberry32) supaya grain deterministis.
// Memakai utils.mulberry32; biji null/undefined tetap jadi 1 seperti
// sebelum migrasi (kanon memakai 0; kanonis, G4 C1G4-R).
export function buatAcak(biji) { return utils.mulberry32(biji == null ? 1 : biji); }

// Filter Disposable pada data piksel RGBA. Kembalikan array baru.
// grain 0..100 (kasar bintik film), leak 0..100 (kuat bocor cahaya),
// biji angka untuk pola grain (sama = pola sama).
export function filterDisposable(data, w, h, opsi) {
  const o = opsi || {};
  const grainK = Math.max(0, Math.min(100, o.grain == null ? 60 : o.grain)) / 100;
  const leakK = Math.max(0, Math.min(100, o.leak == null ? 50 : o.leak)) / 100;
  const acak = buatAcak(o.biji == null ? 1998 : o.biji);
  const keluar = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      const nx = (x + 0.5) / w;
      const ny = (y + 0.5) / h;
      const cx = nx - 0.5;
      const cy = ny - 0.5;
      const d = Math.sqrt(cx * cx + cy * cy) * 2;
      const vig = 1 - 0.16 * Math.max(0, Math.min(1, (d - 0.55) / 0.45));
      const dl = Math.sqrt(Math.pow(nx - 0.92, 2) + Math.pow(ny - 0.08, 2));
      const bocor = Math.max(0, 1 - dl * 1.6) * leakK;
      const grain = (acak() - 0.5) * 24 * grainK;
      const r0 = data[j];
      const g0 = data[j + 1];
      const b0 = data[j + 2];
      const terang = (r0 + g0 + b0) / 3 / 255;
      const hangat = terang * 10;
      const sejuk = (1 - terang) * 6;
      keluar[j] = ((r0 + hangat + bocor * 55 + grain) * vig);
      keluar[j + 1] = ((g0 + hangat * 0.3 + sejuk * 0.5 + bocor * 18 + grain) * vig);
      keluar[j + 2] = ((b0 - hangat * 0.4 + sejuk + grain) * vig);
      keluar[j + 3] = data[j + 3];
    }
  }
  return keluar;
}

// Format tanggal stempel ala kamera film: "12 03 2026".
export function formatStempel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return m[3] + ' ' + m[2] + ' ' + m[1];
}

export function render(root) {
  const fi = fileInput('image/*');
  const stempelSel = T.select([['ya', 'Ya, pakai stempel'], ['tidak', 'Tidak, tanpa stempel']], 'ya');
  const tglInp = T.input('date', '', new Date().toISOString().slice(0, 10));
  const fmtSel = T.select([['png', 'PNG (tanpa pecah)'], ['jpeg', 'JPG (ukuran kecil)']], 'png');
  const statusBox = T.out();
  const box = T.out();

  const grainR = T.input('range');
  grainR.min = '0'; grainR.max = '100'; grainR.value = '60';
  const grainV = T.el('<b>60%</b>');
  const grainWrap = T.el('<div class="row" style="align-items:center"></div>');
  grainWrap.appendChild(grainR); grainWrap.appendChild(grainV);

  const leakR = T.input('range');
  leakR.min = '0'; leakR.max = '100'; leakR.value = '50';
  const leakV = T.el('<b>50%</b>');
  const leakWrap = T.el('<div class="row" style="align-items:center"></div>');
  leakWrap.appendChild(leakR); leakWrap.appendChild(leakV);

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let tampilAsli = false;
  let raf = 0;

  function opsiAktif() {
    return { grain: parseInt(grainR.value, 10), leak: parseInt(leakR.value, 10), biji: 1998 };
  }

  function gambarStempel(ctx, w, h) {
    const teks = formatStempel(tglInp.value);
    if (!teks) return;
    const ukuran = Math.max(14, Math.round(w * 0.045));
    ctx.font = '700 ' + ukuran + 'px ui-monospace, "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255, 122, 26, 0.92)';
    ctx.fillText(teks, w - Math.round(w * 0.04), h - Math.round(h * 0.035));
  }

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    if (tampilAsli) {
      pratinjauCtx.putImageData(dataAsli, 0, 0);
      return;
    }
    const hasil = filterDisposable(dataAsli.data, dataAsli.width, dataAsli.height, opsiAktif());
    pratinjauCtx.putImageData(new ImageData(new Uint8ClampedArray(hasil), dataAsli.width, dataAsli.height), 0, 0);
    if (stempelSel.value === 'ya') gambarStempel(pratinjauCtx, dataAsli.width, dataAsli.height);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  function kembaliKeHasil() {
    if (tampilAsli) { tampilAsli = false; lihatB.textContent = 'Lihat foto asli'; }
  }
  grainR.addEventListener('input', () => { grainV.textContent = grainR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  leakR.addEventListener('input', () => { leakV.textContent = leakR.value + '%'; kembaliKeHasil(); jadwalPratinjau(); });
  stempelSel.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });
  tglInp.addEventListener('change', () => { kembaliKeHasil(); jadwalPratinjau(); });

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
      const hasil = filterDisposable(data.data, nw, nh, opsiAktif());
      ctx.putImageData(new ImageData(new Uint8ClampedArray(hasil), nw, nh), 0, 0);
      if (stempelSel.value === 'ya') gambarStempel(ctx, nw, nh);
      const mime = fmtSel.value === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await canvasToBlob(c, mime, 0.92);
      if (!blob) throw new Error('gagal');
      T.dl(namaFile + '-disposable.' + (fmtSel.value === 'png' ? 'png' : 'jpg'), blob, mime);
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
  root.appendChild(T.field('Seberapa kasar grain film', grainWrap, 'Bintik film khas kamera sekali pakai.'));
  root.appendChild(T.field('Seberapa kuat bocor cahaya', leakWrap, 'Semburat oranye dari pojok kanan atas, seperti film yang kena cahaya.'));
  root.appendChild(T.grid2(T.field('Stempel tanggal oranye', stempelSel), T.field('Tanggal di stempel', tglInp)));
  root.appendChild(T.field('Format hasil', fmtSel));
  root.appendChild(statusBox);
  T.show(box, '<span class="dim">Pilih foto dulu, hasilnya muncul di sini.</span>');
  root.appendChild(box);
  root.appendChild(T.row(lihatB, unduhB));
}
