import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage, fmtBytes } from '../../core.js';

// Saluran RGB Foto: pisah foto jadi tiga saluran warna (merah, hijau,
// biru). Tiap saluran bisa dilihat sendiri dan diunduh sebagai PNG.
// Mode "warna" menampilkan saluran dengan warnanya sendiri, mode
// "abu-abu" menampilkan terang-gelap saluran itu.
export const meta = {"id": "saluran-rgb-foto", "name": "Saluran RGB Foto", "cat": "gambar", "icon": "🔴", "desc": "Pisah foto jadi saluran merah, hijau, dan biru, lalu unduh tiap salurannya.", "keywords": "rgb,saluran,channel,merah,hijau,biru,warnna,pisah warna", "since": "6.19.0"};

// Ambil satu saluran dari data piksel RGBA. Mengembalikan salinan baru.
// mode 'warna': saluran lain dinolkan. mode 'abu': nilai saluran disalin
// ke R, G, dan B (terang-gelap). Alpha tidak diubah. Fungsi murni.
export function ambilSaluran(data, kanal, mode) {
  const keluar = new Uint8ClampedArray(data);
  const idx = kanal === 'g' ? 1 : kanal === 'b' ? 2 : 0;
  for (let i = 0; i + 3 < keluar.length; i += 4) {
    const v = keluar[i + idx];
    if (mode === 'abu') {
      keluar[i] = v; keluar[i + 1] = v; keluar[i + 2] = v;
    } else {
      keluar[i] = idx === 0 ? v : 0;
      keluar[i + 1] = idx === 1 ? v : 0;
      keluar[i + 2] = idx === 2 ? v : 0;
    }
  }
  return keluar;
}

// Rata-rata tiap saluran (0-255), untuk info di layar. Fungsi murni.
export function rataSaluran(data) {
  let r = 0, g = 0, b = 0; const n = Math.floor(data.length / 4);
  if (!n) return { r: 0, g: 0, b: 0 };
  for (let i = 0; i < n * 4; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
  return { r: r / n, g: g / n, b: b / n };
}

const SALURAN = [
  ['r', 'Merah', '#ef4444'],
  ['g', 'Hijau', '#22c55e'],
  ['b', 'Biru', '#3b82f6'],
];

export function render(root) {
  const fi = fileInput('image/*');
  const modeSel = T.select([['warna', 'Warna asli saluran'], ['abu', 'Abu-abu (terang-gelap)']], 'warna');
  const infoBox = T.out();
  const hasilBox = T.out();
  const statusBox = T.out();
  let img = null, nama = 'foto';

  function gambarSaluran(kanal, mode, kecil) {
    const c = document.createElement('canvas');
    const skala = kecil ? Math.min(1, 360 / img.naturalWidth) : 1;
    c.width = Math.max(1, Math.round(img.naturalWidth * skala));
    c.height = Math.max(1, Math.round(img.naturalHeight * skala));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height);
    const hasil = ambilSaluran(d.data, kanal, mode);
    ctx.putImageData(new ImageData(hasil, c.width, c.height), 0, 0);
    return c;
  }

  function tampilkan() {
    T.show(hasilBox, '');
    const mode = modeSel.value;
    const rata = (() => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      return rataSaluran(ctx.getImageData(0, 0, c.width, c.height).data);
    })();
    const fmt1 = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
    T.show(infoBox, `<p class="dim" style="font-size:13px">Foto ${img.naturalWidth}×${img.naturalHeight}. Rata-rata merah ${fmt1(rata.r)}, hijau ${fmt1(rata.g)}, biru ${fmt1(rata.b)} (dari 255).</p>`);
    SALURAN.forEach(([kanal, label, warna]) => {
      const kartu = T.el('<div style="margin:12px 0"></div>');
      const judul = T.el(`<p style="margin:0 0 6px"><b style="color:${warna}">●</b> <b>Saluran ${label}</b></p>`);
      const cv = gambarSaluran(kanal, mode, true);
      cv.style.cssText = 'max-width:100%;height:auto;border-radius:12px;display:block';
      const dlB = T.btn(`Unduh ${label} (PNG)`, async () => {
        const penuh = gambarSaluran(kanal, mode, false);
        const blob = await canvasToBlob(penuh, 'image/png');
        if (!blob) { T.toast('Gagal membuat PNG.'); return; }
        T.dl(`${nama}-${label.toLowerCase()}.png`, blob, 'image/png');
      });
      dlB.classList.add('small');
      kartu.appendChild(judul); kartu.appendChild(cv); kartu.appendChild(dlB);
      hasilBox.appendChild(kartu);
    });
    const semuaB = T.btn('Unduh ketiganya', async () => {
      for (const [kanal, label] of SALURAN) {
        const penuh = gambarSaluran(kanal, mode, false);
        const blob = await canvasToBlob(penuh, 'image/png');
        if (blob) T.dl(`${nama}-${label.toLowerCase()}.png`, blob, 'image/png');
        await new Promise((r) => setTimeout(r, 300));
      }
    });
    hasilBox.appendChild(semuaB);
  }

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(hasilBox); T.hide(infoBox);
    T.show(statusBox, '<span class="dim">Membuka foto…</span>');
    try {
      img = await loadImage(f);
      nama = (f.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim() || 'foto';
      T.hide(statusBox);
      tampilkan();
    } catch (e) {
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Coba file gambar lain (JPG, PNG, atau WebP).</div>');
    }
    fi.value = '';
  });
  modeSel.addEventListener('change', () => { if (img) tampilkan(); });

  root.appendChild(T.el('<p class="dim" style="font-size:13px;line-height:1.6">Setiap foto warna tersusun dari tiga saluran: merah, hijau, dan biru. Lihat tiap saluran sendiri-sendiri, lalu unduh yang kamu butuhkan.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Tampilan saluran', modeSel));
  root.appendChild(statusBox);
  root.appendChild(infoBox);
  root.appendChild(hasilBox);
  root.appendChild(T.el('<p class="dim" style="font-size:12px">' + LOCAL_NOTE + '</p>'));
}
