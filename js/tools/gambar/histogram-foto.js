import { h as T, loadImage, fileInput, canvasToBlob, LOCAL_NOTE, kvRows } from '../../core.js';

// Histogram Foto: grafik sebaran terang-gelap dan warna foto.
// Dihitung dari piksel foto yang dipilih, 100% lokal.
export const meta = {"id": "histogram-foto", "name": "Histogram Foto", "cat": "gambar", "icon": "📊", "desc": "Lihat grafik sebaran terang-gelap dan warna di fotomu.", "keywords": "histogram,foto,sebaran warna,terang gelap,grafik,eksposur", "since": "6.18.0"};

// Hitung histogram per kanal (bins kotak, default 256). Murni.
export function hitungHistogram(data, bins) {
  const n = bins || 256;
  const r = new Array(n).fill(0);
  const g = new Array(n).fill(0);
  const b = new Array(n).fill(0);
  const lum = new Array(n).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const kr = Math.min(n - 1, Math.floor(data[i] * n / 256));
    const kg = Math.min(n - 1, Math.floor(data[i + 1] * n / 256));
    const kb = Math.min(n - 1, Math.floor(data[i + 2] * n / 256));
    const kl = Math.min(n - 1, Math.floor((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) * n / 256));
    r[kr]++; g[kg]++; b[kb]++; lum[kl]++;
  }
  return { r, g, b, lum, total: data.length / 4 };
}

// Ringkasan angka dari histogram: rata-rata tiap kanal dan sebaran terang.
// Murni.
export function ringkasanHistogram(hist) {
  const n = hist.r.length;
  const rata = (arr) => {
    let jumlah = 0, total = 0;
    for (let i = 0; i < n; i++) { jumlah += arr[i] * (i + 0.5) * 256 / n; total += arr[i]; }
    return total ? jumlah / total : 0;
  };
  let gelap = 0, terang = 0;
  for (let i = 0; i < n; i++) {
    const nilai = (i + 0.5) * 256 / n;
    if (nilai < 64) gelap += hist.lum[i];
    if (nilai >= 192) terang += hist.lum[i];
  }
  const total = hist.total || 1;
  return {
    rataR: rata(hist.r),
    rataG: rata(hist.g),
    rataB: rata(hist.b),
    rataLum: rata(hist.lum),
    persenGelap: (gelap / total) * 100,
    persenTerang: (terang / total) * 100,
  };
}

const WARNA_GARIS = { r: '#ff6f61', g: '#4ade80', b: '#60a5fa', lum: '#e4e4e7' };

export function render(root) {
  const fi = fileInput('image/*');
  const kanalSel = T.select([
    ['semua', 'Semua warna sekaligus'],
    ['lum', 'Terang-gelap saja'],
    ['r', 'Merah saja'],
    ['g', 'Hijau saja'],
    ['b', 'Biru saja'],
  ], 'semua');
  const statusBox = T.out();
  const box = T.out();
  const statBox = T.out();

  const grafik = document.createElement('canvas');
  grafik.width = 720; grafik.height = 280;
  grafik.style.cssText = 'max-width:100%;height:auto;border-radius:10px;display:block;background:#121212';

  let hist = null;
  let namaFile = 'foto';

  function gambarGrafik() {
    if (!hist) return;
    const ctx = grafik.getContext('2d');
    if (!ctx) return;
    const W = grafik.width, H = grafik.height;
    const padKiri = 12, padKanan = 12, padAtas = 16, padBawah = 30;
    const gw = W - padKiri - padKanan, gh = H - padAtas - padBawah;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, W, H);
    const kanal = kanalSel.value === 'semua' ? ['lum', 'r', 'g', 'b'] : [kanalSel.value];
    let maks = 0;
    kanal.forEach((k) => { hist[k].forEach((v) => { if (v > maks) maks = v; }); });
    if (!maks) return;
    // Garis bantu mendatar.
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = padAtas + (gh / 4) * i;
      ctx.beginPath(); ctx.moveTo(padKiri, y); ctx.lineTo(W - padKanan, y); ctx.stroke();
    }
    const n = hist.r.length;
    kanal.forEach((k) => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = padKiri + (i / (n - 1)) * gw;
        const y = padAtas + gh - (hist[k][i] / maks) * gh;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = WARNA_GARIS[k];
      ctx.lineWidth = k === 'lum' && kanal.length > 1 ? 1.5 : 2;
      ctx.stroke();
    });
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Gelap', padKiri, H - 8);
    ctx.textAlign = 'right';
    ctx.fillText('Terang', W - padKanan, H - 8);
    ctx.textAlign = 'center';
    ctx.fillText(kanalSel.value === 'semua' ? 'Merah, hijau, biru, dan terang-gelap' : '', W / 2, H - 8);
  }

  function gambarStat() {
    if (!hist) return;
    const s = ringkasanHistogram(hist);
    // Rata-rata memakai pusat bin, jadi bisa 255,5 untuk warna murni —
    // clamp ke 255 supaya tidak tampil "255,5 dari 255" yang membingungkan.
    const fmt1 = (v) => Math.min(255, v).toFixed(1).replace('.', ',');
    T.show(statBox, kvRows([
      ['Rata-rata terang', fmt1(s.rataLum) + ' dari 255'],
      ['Rata-rata merah', fmt1(s.rataR) + ' dari 255'],
      ['Rata-rata hijau', fmt1(s.rataG) + ' dari 255'],
      ['Rata-rata biru', fmt1(s.rataB) + ' dari 255'],
      ['Piksel gelap', fmt1(s.persenGelap) + '%'],
      ['Piksel terang', fmt1(s.persenTerang) + '%'],
    ]));
  }

  kanalSel.addEventListener('change', gambarGrafik);

  fi.addEventListener('change', async () => {
    const f = fi.files && fi.files[0];
    if (!f) return;
    T.hide(box); T.hide(statBox); T.hide(statusBox);
    T.show(statusBox, '<span class="dim">Membaca foto…</span>');
    try {
      const img = await loadImage(f);
      namaFile = (f.name || 'foto').replace(/\.[^.]*$/, '');
      const skala = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * skala));
      const h = Math.max(1, Math.round(img.naturalHeight * skala));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      hist = hitungHistogram(data, 256);
      T.hide(statusBox);
      T.show(box, '');
      box.appendChild(grafik);
      gambarGrafik();
      gambarStat();
      unduhB.disabled = false;
    } catch (e) {
      hist = null;
      T.show(statusBox, '<div class="err">Foto tidak bisa dibuka. Pastikan filenya gambar yang benar (JPG/PNG/WebP).</div>');
      unduhB.disabled = true;
    }
  });

  async function unduh() {
    if (!hist) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(grafik, 'image/png');
    if (!blob) { T.toast('Gagal membuat gambar'); return; }
    T.dl(`${namaFile}-histogram.png`, blob, 'image/png');
    T.toast('Berhasil diunduh');
  }

  const unduhB = T.btn('Unduh Grafik PNG', unduh, true, true);

  root.appendChild(T.el(`<p class="note">🔒 ${LOCAL_NOTE}</p>`));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.field('Yang ditampilkan', kanalSel));
  root.appendChild(statusBox);
  root.appendChild(box);
  root.appendChild(statBox);
  root.appendChild(T.row(unduhB));
  root.appendChild(T.el('<p class="hint">Puncak di kiri berarti fotonya cenderung gelap, puncak di kanan berarti cenderung terang.</p>'));
}
