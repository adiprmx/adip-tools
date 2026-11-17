import { h as T, utils } from '../../core.js';
import { loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

export const meta = {"id":"crop-pas-foto","name":"Crop Pas Foto","cat":"gambar","icon":"🪪","desc":"Crop pas foto, ganti latar, lembar cetak 4R, cek kelayakan.","keywords":"pas foto,crop,ktp,lamaran,rasio,latar merah,lembar cetak"};

/* Crop pas foto: bingkai rasio tetap (2:3 / 3:4 / 4:6), fotonya bisa
   digeser pakai jari di dalam bingkai. Saat unduh, area bingkai dihitung
   ulang ke resolusi asli foto. */
const RATIOS = [
  ['2x3', '2 × 3', 2, 3],
  ['3x4', '3 × 4', 3, 4],
  ['4x6', '4 × 6', 4, 6],
];
const LATAR = [
  ['asli', 'Asli (tidak diganti)', null],
  ['merah', 'Merah', '#FF0000'],
  ['biru', 'Biru', '#0000FF'],
  ['putih', 'Putih', '#FFFFFF'],
];

export function render(root) {
  const fi = fileInput('image/*');
  let ratio = RATIOS[1]; // default 3x4
  let img = null;        // HTMLImageElement
  let nw = 0, nh = 0;    // ukuran asli foto
  let fw = 300, fh = 400; // ukuran bingkai (px layar)
  let imgW = 0, imgH = 0; // ukuran foto yang ditampilkan
  let ox = 0, oy = 0;     // posisi kiri-atas foto di dalam bingkai
  let dragging = false, sx = 0, sy = 0, sox = 0, soy = 0;
  let dpi = 300;
  let latar = 'asli';
  let maskCanvas = null; // masker orang (resolusi asli foto)
  let latarProses = false;

  const wrap = T.el('<div style="max-width:320px;margin:0 auto"></div>');
  const frame = T.el('<div style="position:relative;overflow:hidden;border-radius:10px;border:1px solid #ffffff20;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#18181b"></div>');
  const im = document.createElement('img');
  im.draggable = false;
  im.style.cssText = 'position:absolute;top:0;left:0;max-width:none;pointer-events:none';
  const hint = T.el('<p class="mut" style="text-align:center;font-size:13px;margin:10px 0 0">👆 Geser fotonya biar pas di bingkai</p>');
  const box = T.out();
  const infoBox = T.out();
  const latarBox = T.out();
  const cekBox = T.out();

  function applyRatio() {
    const rw = ratio[2], rh = ratio[3];
    frame.style.aspectRatio = rw + '/' + rh;
    const avail = Math.min(300, wrap.clientWidth || 300);
    fw = avail; fh = Math.round(avail * rh / rw);
    frame.style.width = fw + 'px';
    if (img) fit();
  }

  function fit() {
    const sc = Math.max(fw / nw, fh / nh); // cover: bingkai selalu penuh
    imgW = nw * sc; imgH = nh * sc;
    im.style.width = imgW + 'px';
    im.style.height = imgH + 'px';
    ox = (fw - imgW) / 2; oy = (fh - imgH) / 2;
    apply();
  }

  function apply() {
    ox = Math.min(0, Math.max(fw - imgW, ox));
    oy = Math.min(0, Math.max(fh - imgH, oy));
    im.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
  }

  frame.addEventListener('pointerdown', (e) => {
    if (!img) return;
    dragging = true; sx = e.clientX; sy = e.clientY; sox = ox; soy = oy;
    frame.setPointerCapture(e.pointerId);
    frame.style.cursor = 'grabbing';
  });
  frame.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    ox = sox + (e.clientX - sx); oy = soy + (e.clientY - sy);
    apply();
  });
  const endDrag = () => { dragging = false; frame.style.cursor = 'grab'; };
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);

  /* ---- Ganti latar: segmentasi orang (MediaPipe, pin versi) ---- */
  const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.js';
  const MP_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/';
  let mpSiap = null, seg = null;
  async function loadSeg() {
    if (seg) return seg;
    if (!mpSiap) mpSiap = T.loadScript(MP_CDN).then((ok) => ok && !!window.SelfieSegmentation);
    const ok = await mpSiap;
    if (!ok) throw new Error('cdn');
    seg = new window.SelfieSegmentation({ locateFile: (f) => MP_BASE + f });
    seg.setOptions({ modelSelection: 1 });
    return seg;
  }
  async function prosesLatar() {
    if (!img || latar === 'asli') return;
    if (latarProses) return;
    latarProses = true;
    T.show(latarBox, '<p class="center mut">Memisahkan orang dari latar... (pertama kali butuh internet untuk mengunduh model)</p>');
    try {
      const s = await loadSeg();
      const hasil = await new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error('timeout')), 90000);
        s.onResults((res) => { clearTimeout(to); resolve(res); });
        s.send({ image: img }).catch((e) => { clearTimeout(to); reject(e); });
      });
      if (!hasil || !hasil.segmentationMask) throw new Error('mask');
      const m = document.createElement('canvas'); m.width = nw; m.height = nh;
      const mx = m.getContext('2d');
      if ('filter' in mx) mx.filter = 'blur(2px)';
      mx.drawImage(hasil.segmentationMask, 0, 0, nw, nh);
      if ('filter' in mx) mx.filter = 'none';
      maskCanvas = m;
      T.show(latarBox, '<p class="hint">Latar sudah diganti jadi ' + T.esc(LATAR.find(([v]) => v === latar)[1].toLowerCase()) + '. Hasilnya bisa dilihat setelah diunduh.</p>');
    } catch (e) {
      maskCanvas = null;
      T.show(latarBox, '<span class="err">Ganti latar gagal. Cek koneksi internetmu lalu pilih latarnya lagi. Foto yang dipakai sebaiknya menampilkan orang dengan jelas.</span>');
    } finally {
      latarProses = false;
    }
  }

  // Koordinat bingkai dalam piksel foto asli
  function daerahCrop() {
    const sc = nw / imgW;
    let bx = Math.round(-ox * sc), by = Math.round(-oy * sc);
    let bw = Math.round(fw * sc), bh = Math.round(fh * sc);
    bx = Math.max(0, Math.min(nw - 1, bx)); by = Math.max(0, Math.min(nh - 1, by));
    bw = Math.min(bw, nw - bx); bh = Math.min(bh, nh - by);
    return { bx, by, bw, bh };
  }
  function ukuranCetak() {
    const rw = ratio[2], rh = ratio[3];
    return { w: Math.round(rw / 2.54 * dpi), h: Math.round(rh / 2.54 * dpi) };
  }
  // Gambar hasil crop (dengan latar pilihan) ke kanvas ukuran cetak
  function gambarHasil() {
    const { w: outW, h: outH } = ukuranCetak();
    const { bx, by, bw, bh } = daerahCrop();
    const out = document.createElement('canvas'); out.width = outW; out.height = outH;
    const oc = out.getContext('2d');
    const warnaLatar = (LATAR.find(([v]) => v === latar) || [])[2];
    oc.fillStyle = warnaLatar || '#ffffff';
    oc.fillRect(0, 0, outW, outH);
    if (warnaLatar && maskCanvas) {
      // orang saja (dipotong masker), di atas latar warna
      const fg = document.createElement('canvas'); fg.width = nw; fg.height = nh;
      const fx = fg.getContext('2d');
      fx.drawImage(img, 0, 0);
      fx.globalCompositeOperation = 'destination-in';
      fx.drawImage(maskCanvas, 0, 0);
      fx.globalCompositeOperation = 'source-over';
      oc.drawImage(fg, bx, by, bw, bh, 0, 0, outW, outH);
    } else {
      oc.drawImage(img, bx, by, bw, bh, 0, 0, outW, outH);
    }
    return out;
  }

  function cekKelaiakan(outW, outH, blob) {
    const { bw } = daerahCrop();
    const item = [];
    // resolusi sumber cukup (tidak banyak diperbesar)
    const cukup = bw >= outW * 0.8;
    item.push([cukup, 'Resolusi foto ' + (cukup ? 'cukup untuk ukuran cetak ini' : 'agak kecil, hasil bisa kurang tajam. Coba foto yang lebih besar')]);
    item.push([true, 'Rasio ' + ratio[1] + ' sudah sesuai ukuran pas foto']);
    const targetKB = T.num(targetI.value);
    if (targetKB > 0) {
      item.push([blob.size <= targetKB * 1024, 'Ukuran file ' + fmtBytes(blob.size) + (blob.size <= targetKB * 1024 ? ' (di bawah batas ' + targetKB + ' KB)' : ' (melebihi batas ' + targetKB + ' KB)')]);
    } else {
      item.push([true, 'Ukuran file ' + fmtBytes(blob.size)]);
    }
    // latar seragam: bila latar diganti, sudah pasti rata; bila asli, cek 4 sudut
    if (latar !== 'asli' && maskCanvas) {
      item.push([true, 'Latar ' + LATAR.find(([v]) => v === latar)[1].toLowerCase() + ' rata']);
      // Posisi orang di dalam bingkai, dari kotak pembatas masker.
      const kb = kotakMasker();
      if (kb) {
        const { bx, by, bw: cw, bh: ch } = daerahCrop();
        const ix0 = Math.max(kb.x0, bx), ix1 = Math.min(kb.x1, bx + cw);
        const iy0 = Math.max(kb.y0, by), iy1 = Math.min(kb.y1, by + ch);
        const persen = Math.round(Math.max(0, iy1 - iy0) / ch * 100);
        const tengahX = ((ix0 + ix1) / 2 - bx) / cw * 100;
        item.push([persen >= 55 && persen <= 98, 'Orang mengisi ' + persen + '% tinggi bingkai' + (persen < 55 ? ' (terlalu kecil — pakai foto yang lebih dekat)' : persen > 98 ? ' (kepala atau bahu terpotong)' : '')]);
        item.push([tengahX >= 35 && tengahX <= 65, 'Posisi orang ' + (tengahX >= 35 && tengahX <= 65 ? 'di tengah bingkai' : 'miring ke ' + (tengahX < 50 ? 'kiri' : 'kanan') + ' — geser fotonya')]);
      }
    } else if (latar === 'asli') {
      item.push([null, 'Latar asli: pastikan latar fotomu polos dan tidak ramai']);
    }
    T.show(cekBox,
      '<h3 style="font-size:13px;margin:14px 0 6px;color:#e4e4e7">Cek kelayakan</h3>' +
      item.map(([ok, teks]) => '<div style="font-size:13px;line-height:1.5;padding:4px 0">' +
        (ok === null ? '<span style="color:#facc15">!</span> ' : ok ? '<span style="color:#86efac">✓</span> ' : '<span style="color:#fca5a5">✗</span> ') +
        T.esc(teks) + '</div>').join(''));
  }

  // Kotak pembatas orang dari masker, dalam koordinat foto asli (atau null).
  function kotakMasker() {
    if (!maskCanvas) return null;
    const s = Math.min(1, 200 / Math.max(nw, nh));
    const sw = Math.max(1, Math.round(nw * s)), sh = Math.max(1, Math.round(nh * s));
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const cx = c.getContext('2d');
    cx.drawImage(maskCanvas, 0, 0, sw, sh);
    let d;
    try { d = cx.getImageData(0, 0, sw, sh).data; } catch (e) { return null; }
    let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (d[(y * sw + x) * 4] > 128) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null;
    return { x0: x0 / s, y0: y0 / s, x1: (x1 + 1) / s, y1: (y1 + 1) / s };
  }

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    nw = img.naturalWidth; nh = img.naturalHeight;
    maskCanvas = null;
    im.src = img.src;
    T.show(box, '');
    box.appendChild(wrap);
    wrap.appendChild(frame);
    frame.appendChild(im);
    wrap.appendChild(hint);
    applyRatio();
    T.hide(infoBox); T.hide(cekBox);
    T.toast('Foto dimuat. Geser biar wajahnya pas');
    if (latar !== 'asli') prosesLatar();
  };

  async function keBlob(out) {
    const format = formatSel.value;
    if (format === 'png') return { blob: await canvasToBlob(out, 'image/png'), format: 'png' };
    const targetKB = T.num(targetI.value);
    if (!(targetKB > 0)) return { blob: await canvasToBlob(out, 'image/jpeg', 0.92), format: 'jpg' };
    // cari kualitas JPG tertinggi yang muat di batas ukuran
    let lo = 0.1, hi = 0.95, best = null;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const b = await canvasToBlob(out, 'image/jpeg', q);
      if (!b) break;
      if (b.size <= targetKB * 1024) { best = b; lo = q; }
      else hi = q;
    }
    if (!best) best = await canvasToBlob(out, 'image/jpeg', 0.1);
    return { blob: best, format: 'jpg' };
  }

  const unduh = async () => {
    if (!img) { T.toast('Muat foto dulu'); return; }
    if (latar !== 'asli' && !maskCanvas) {
      if (latarProses) { T.toast('Tunggu ganti latar selesai dulu'); return; }
      T.toast('Ganti latar belum berhasil, coba pilih latarnya lagi');
      return;
    }
    const out = gambarHasil();
    const { blob, format } = await keBlob(out);
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const { w: outW, h: outH } = ukuranCetak();
    T.show(infoBox, '<div class="kv"><span>Hasil</span><b>' + outW + '×' + outH + ' px (' + fmtBytes(blob.size) + '), rasio ' + ratio[1] + ', ' + dpi + ' DPI</b></div>');
    cekKelaiakan(outW, outH, blob);
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-pasfoto-' + ratio[0] + '.' + format, blob, format === 'png' ? 'image/png' : 'image/jpeg');
    T.toast('Berhasil diunduh');
  };

  const KERTAS = [
    ['4R', '4R (4x6 inci)', 1200, 1800],
    ['3R', '3R (3,5x5 inci)', 1050, 1500],
  ];
  const kertasSel = T.select(KERTAS.map(([v, l]) => [v, l]), '4R');

  const unduhLembar = async () => {
    if (!img) { T.toast('Muat foto dulu'); return; }
    if (latar !== 'asli' && !maskCanvas) {
      if (latarProses) { T.toast('Tunggu ganti latar selesai dulu'); return; }
      T.toast('Ganti latar belum berhasil, coba pilih latarnya lagi');
      return;
    }
    // Kertas pada 300 DPI: 4R = 1200x1800 px, 3R = 1050x1500 px
    const kertas = KERTAS.find(([v]) => v === kertasSel.value) || KERTAS[0];
    const W = kertas[2], H = kertas[3], gap = 24, margin = 48;
    const satu = gambarHasil();
    const sw = satu.width, sh = satu.height;
    const cols = Math.max(1, Math.floor((W - margin * 2 + gap) / (sw + gap)));
    const rows = Math.max(1, Math.floor((H - margin * 2 + gap) / (sh + gap)));
    const gridW = cols * sw + (cols - 1) * gap;
    const gridH = rows * sh + (rows - 1) * gap;
    const x0 = Math.round((W - gridW) / 2), y0 = Math.round((H - gridH) / 2);
    const lembar = document.createElement('canvas'); lembar.width = W; lembar.height = H;
    const lx = lembar.getContext('2d');
    lx.fillStyle = '#ffffff';
    lx.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        lx.drawImage(satu, x0 + c * (sw + gap), y0 + r * (sh + gap));
      }
    }
    // Garis potong putus-putus di sekeliling tiap foto
    lx.strokeStyle = '#999999';
    lx.lineWidth = 2;
    lx.setLineDash([10, 8]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        lx.strokeRect(x0 + c * (sw + gap) - 1, y0 + r * (sh + gap) - 1, sw + 2, sh + 2);
      }
    }
    lx.setLineDash([]);
    const blob = await canvasToBlob(lembar, 'image/jpeg', 0.92);
    if (!blob) { T.toast('Gagal membuat lembar cetak'); return; }
    T.show(infoBox, '<div class="kv"><span>Lembar cetak</span><b>' + (cols * rows) + ' foto (' + cols + 'x' + rows + ') di kertas ' + kertas[0] + ', ' + fmtBytes(blob.size) + '</b></div>');
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-lembar-cetak-' + kertas[0] + '.jpg', blob, 'image/jpeg');
    T.toast('Lembar cetak berhasil diunduh');
  };

  const ratioBtns = RATIOS.map(([v, l]) => {
    const b = T.btn(l, () => { ratio = RATIOS.find((r) => r[0] === v); refreshRatio(); applyRatio(); });
    b.dataset.ratio = v;
    return b;
  });
  const refreshRatio = () => ratioBtns.forEach((b) => b.classList.toggle('primary', b.dataset.ratio === ratio[0]));
  refreshRatio();
  const ratioRow = T.el('<div style="display:flex;gap:8px"></div>');
  ratioBtns.forEach((b) => { b.style.flex = '1'; ratioRow.appendChild(b); });

  const latarSel = T.select(LATAR.map(([v, l]) => [v, l]), 'asli');
  latarSel.addEventListener('change', () => {
    latar = latarSel.value;
    if (!img) return;
    if (latar === 'asli') { maskCanvas = null; T.hide(latarBox); return; }
    prosesLatar();
  });
  const dpiSel = T.select([['300', '300 DPI (cetak, tajam)'], ['150', '150 DPI (standar)'], ['72', '72 DPI (layar saja)']], '300');
  dpiSel.addEventListener('change', () => { dpi = +dpiSel.value; });
  const formatSel = T.select([['jpg', 'JPG (kecil, buat upload)'], ['png', 'PNG (kualitas penuh)']], 'jpg');
  const targetI = T.input('text', 'Kosongkan bila tidak ada batas', '');
  targetI.inputMode = 'decimal';

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Buat pas foto sendiri: pilih rasio resmi (2×3, 3×4, 4×6), lalu <b>geser fotonya</b> di dalam bingkai sampai wajahnya pas di tengah.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.row(T.btn('Muat foto', muat, true)));
  root.appendChild(T.field('Rasio', ratioRow));
  root.appendChild(T.grid2(T.field('Latar belakang', latarSel), T.field('Kualitas cetak (DPI)', dpiSel)));
  root.appendChild(latarBox);
  root.appendChild(T.grid2(T.field('Format file', formatSel), T.field('Batas ukuran file (KB)', targetI, 'Hanya untuk JPG. Kosongkan bila tidak ada batas.')));
  root.appendChild(T.field('Kertas lembar cetak', kertasSel, 'Lembar cetak dilengkapi garis potong putus-putus di sekeliling tiap foto.'));
  root.appendChild(T.row(T.btn('Unduh Pas Foto', unduh, true), T.btn('Unduh Lembar Cetak', unduhLembar)));
  root.appendChild(infoBox);
  root.appendChild(cekBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
