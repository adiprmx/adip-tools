import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE } from '../../core.js';

// Hapus Background Warna: hapus latar satu warna (chroma key) jadi
// transparan. Pilih warnanya atau ketuk langsung di foto, atur toleransi
// untuk warna yang hampir sama. BEDA dari Remove BG (removebg.js) yang
// memakai AI untuk memisahkan orang/barang; di sini yang dihapus adalah
// satu warna latar saja, misalnya layar hijau atau dinding putih.
// Hasilnya PNG transparan.
export const meta = {"id": "hapus-background-warna", "name": "Hapus Background Warna", "cat": "gambar", "icon": "🟩", "desc": "Hapus latar satu warna jadi transparan. Cocok buat foto dengan layar hijau atau dinding polos.", "keywords": "hapus background,chroma key,layar hijau,transparan,green screen", "since": "6.17.0"};

// Hapus piksel yang warnanya dekat dengan warna target (murni, tanpa DOM).
// toleransi 0..100 (jarak warna yang ikut terhapus), lembut 0..100
// (tepi yang dihaluskan supaya tidak kasar).
export function hapusWarna(data, tr, tg, tb, toleransi, lembut) {
  const tol = Math.max(0, Math.min(100, Number(toleransi) || 0));
  const lem = Math.max(0, Math.min(100, Number(lembut) || 0));
  // Jarak maksimum antar warna RGB = akar(3*255^2) ~ 441.
  const jarakTol = (tol / 100) * 441;
  const jarakLembut = (lem / 100) * 120;
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - tr, dg = data[i + 1] - tg, db = data[i + 2] - tb;
    const jarak = Math.sqrt(dr * dr + dg * dg + db * db);
    if (jarak <= jarakTol) {
      data[i + 3] = 0;
    } else if (jarakLembut > 0 && jarak <= jarakTol + jarakLembut) {
      const f = (jarak - jarakTol) / jarakLembut;
      data[i + 3] = Math.round(data[i + 3] * f);
    }
  }
  return data;
}

// '#rrggbb' -> [r, g, b]. Return null bila tidak valid.
export function hexKeRgb(hex) {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function render(root) {
  const fi = fileInput('image/*');
  const warnaInp = T.input('color');
  warnaInp.value = '#00ff00';
  const statusBox = T.out();
  const box = T.out();
  const infoBox = T.out();

  const buatGeser = (label, awal, hint) => {
    const range = T.input('range');
    range.min = '0'; range.max = '100'; range.value = String(awal);
    const val = T.el(`<b>${awal}%</b>`);
    const wrap = T.el('<div class="row" style="align-items:center"></div>');
    wrap.appendChild(range); wrap.appendChild(val);
    range.addEventListener('input', () => {
      val.textContent = range.value + '%';
      jadwalPratinjau();
    });
    return { range, field: T.field(label, wrap, hint) };
  };
  const toleransi = buatGeser('Toleransi warna', 25, 'Makin besar, makin banyak warna mirip yang ikut terhapus.');
  const lembut = buatGeser('Haluskan tepi', 40, 'Bikin pinggiran hasil tidak kasar.');

  let img = null;
  let nw = 0, nh = 0;
  let namaFile = 'foto';
  let pratinjau = null;
  let pratinjauCtx = null;
  let dataAsli = null;
  let raf = 0;

  function warnaTarget() {
    return hexKeRgb(warnaInp.value) || [0, 255, 0];
  }

  function gambarPratinjau() {
    if (!pratinjau || !dataAsli) return;
    const salinan = new ImageData(new Uint8ClampedArray(dataAsli.data), dataAsli.width, dataAsli.height);
    const [r, g, b] = warnaTarget();
    hapusWarna(salinan.data, r, g, b, parseInt(toleransi.range.value, 10), parseInt(lembut.range.value, 10));
    pratinjauCtx.clearRect(0, 0, pratinjau.width, pratinjau.height);
    pratinjauCtx.putImageData(salinan, 0, 0);
    const total = salinan.data.length / 4;
    let hilang = 0;
    for (let i = 3; i < salinan.data.length; i += 4) if (salinan.data[i] === 0) hilang++;
    const persen = Math.round((hilang / total) * 100);
    T.show(infoBox, `<div class="kv"><span>Bagian yang jadi transparan</span><b>${persen}% dari foto</b></div>`);
  }
  function jadwalPratinjau() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(gambarPratinjau);
  }
  warnaInp.addEventListener('input', jadwalPratinjau);

  // Ketuk foto untuk mengambil warna di titik itu.
  function pasangPemilih() {
    if (!pratinjau) return;
    pratinjau.style.cursor = 'crosshair';
    pratinjau.addEventListener('click', (e) => {
      if (!dataAsli) return;
      const b = pratinjau.getBoundingClientRect();
      const x = Math.floor((e.clientX - b.left) * (pratinjau.width / b.width));
      const y = Math.floor((e.clientY - b.top) * (pratinjau.height / b.height));
      const i = (y * dataAsli.width + x) * 4;
      const keHex = (v) => v.toString(16).padStart(2, '0');
      warnaInp.value = '#' + keHex(dataAsli.data[i]) + keHex(dataAsli.data[i + 1]) + keHex(dataAsli.data[i + 2]);
      jadwalPratinjau();
      T.toast('Warna diambil dari foto');
    });
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(infoBox); T.hide(statusBox);
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
      // Papan catur abu-abu di belakang: bagian transparan jadi kelihatan.
      pratinjau.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background-image:linear-gradient(45deg,#3a332c 25%,transparent 25%),linear-gradient(-45deg,#3a332c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a332c 75%),linear-gradient(-45deg,transparent 75%,#3a332c 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0;background-color:#221e19';
      pratinjauCtx = pratinjau.getContext('2d', { willReadFrequently: true });
      pratinjauCtx.drawImage(img, 0, 0, w, h);
      dataAsli = pratinjauCtx.getImageData(0, 0, w, h);
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(pratinjau);
      pasangPemilih();
      unduhB.disabled = false;
      gambarPratinjau();
    } catch (e) {
      img = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
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
      const [r, g, b] = warnaTarget();
      hapusWarna(data.data, r, g, b, parseInt(toleransi.range.value, 10), parseInt(lembut.range.value, 10));
      ctx.putImageData(data, 0, 0);
      const blob = await canvasToBlob(c, 'image/png');
      if (!blob) throw new Error('gagal');
      T.dl(`${namaFile}-tanpa-latar.png`, blob, 'image/png');
      T.toast('Berhasil diunduh');
    } catch (e) {
      T.toast('Gagal membuat hasil, coba lagi');
    } finally {
      T.hide(statusBox);
      unduhB.disabled = false;
    }
  }

  const unduhB = T.btn('Unduh PNG Transparan', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Warna latar yang mau dihapus', warnaInp, 'Ketuk langsung di foto untuk mengambil warnanya, atau pilih di sini.'));
  root.appendChild(toleransi.field);
  root.appendChild(lembut.field);
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(infoBox);
  root.appendChild(unduhB);
}
