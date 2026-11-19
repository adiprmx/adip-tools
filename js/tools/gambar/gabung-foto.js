import { h as T, loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js';

// Gabung Foto (Stitch): sambung 2-10 foto jadi satu strip panjang,
// mendatar atau menurun, tanpa dipotong. BEDA dari Kolase Foto
// (kolase-foto.js) yang menaruh foto ke template grid di kanvas
// berasio tetap dengan crop cover; di sini foto disambung ujung ke
// ujung seperti menyambung tangkapan layar.
export const meta = {"id": "gabung-foto", "name": "Gabung Foto (Stitch)", "cat": "gambar", "icon": "🧵", "desc": "Sambung 2-10 foto jadi satu strip panjang, mendatar atau menurun.", "keywords": "gabung foto,stitch,sambung foto,strip,foto panjang,screenshot", "since": "6.19.0"};

const MAKS_FOTO = 10;
const MAKS_SISI = 8000;

// Hitung tata letak strip dari ukuran tiap foto (murni, bisa diuji
// tanpa DOM). samakan: 'kecil' = semua diskala ke sisi terkecil,
// 'besar' = ke sisi terbesar, 'asli' = tanpa skala. Arah mendatar
// menyamakan tinggi, arah menurun menyamakan lebar.
export function tataLetakStitch(ukuran, arah, samakan, jarak) {
  const n = ukuran.length;
  if (!n) return { lebar: 0, tinggi: 0, penempatan: [] };
  const g = Math.max(0, jarak || 0);
  const sisi = arah === 'menurun'
    ? ukuran.map((u) => u.lebar)
    : ukuran.map((u) => u.tinggi);
  let target;
  if (samakan === 'kecil') target = Math.min(...sisi);
  else if (samakan === 'besar') target = Math.max(...sisi);
  else target = null;
  const skala = ukuran.map((u, i) => (target ? target / sisi[i] : 1));
  const w = ukuran.map((u, i) => Math.max(1, Math.round(u.lebar * skala[i])));
  const h = ukuran.map((u, i) => Math.max(1, Math.round(u.tinggi * skala[i])));
  const penempatan = [];
  if (arah === 'menurun') {
    const lebar = Math.max(...w);
    let y = 0;
    for (let i = 0; i < n; i++) {
      penempatan.push({ x: Math.round((lebar - w[i]) / 2), y, w: w[i], h: h[i] });
      y += h[i] + g;
    }
    return { lebar, tinggi: y - g, penempatan };
  }
  const tinggi = Math.max(...h);
  let x = 0;
  for (let i = 0; i < n; i++) {
    penempatan.push({ x, y: Math.round((tinggi - h[i]) / 2), w: w[i], h: h[i] });
    x += w[i] + g;
  }
  return { lebar: x - g, tinggi, penempatan };
}

export function render(root) {
  const fi = fileInput('image/*');
  fi.multiple = true;
  const arahSel = T.select([['mendatar', 'Mendatar (kiri ke kanan)'], ['menurun', 'Menurun (atas ke bawah)']], 'menurun');
  const samakanSel = T.select([
    ['kecil', 'Samakan ke yang terkecil'],
    ['besar', 'Samakan ke yang terbesar'],
    ['asli', 'Ukuran asli tiap foto'],
  ], 'kecil');
  const jarakR = T.el('<input type="range" min="0" max="40" value="0" class="inp">');
  const jarakV = T.el('<span class="hint" style="min-width:44px;text-align:right">0px</span>');
  const warnaI = T.el('<input type="color" value="#ffffff" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let imgs = [];

  function make() {
    T.hide(infoBox); T.hide(box);
    if (imgs.length < 2) return;
    const ukuran = imgs.map((im) => ({ lebar: im.naturalWidth, tinggi: im.naturalHeight }));
    const t = tataLetakStitch(ukuran, arahSel.value, samakanSel.value, +jarakR.value);
    const s = Math.min(1, MAKS_SISI / Math.max(t.lebar, t.tinggi));
    cv.width = Math.max(1, Math.round(t.lebar * s));
    cv.height = Math.max(1, Math.round(t.tinggi * s));
    const ctx = cv.getContext('2d');
    ctx.fillStyle = warnaI.value;
    ctx.fillRect(0, 0, cv.width, cv.height);
    t.penempatan.forEach((p, i) => {
      ctx.drawImage(imgs[i], Math.round(p.x * s), Math.round(p.y * s), Math.max(1, Math.round(p.w * s)), Math.max(1, Math.round(p.h * s)));
    });
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, '<div class="kv"><span>Foto digabung</span><b>' + imgs.length + ' foto</b></div>' +
      '<div class="kv"><span>Ukuran hasil</span><b>' + cv.width + 'x' + cv.height + ' px</b></div>' +
      (s < 1 ? '<p class="hint">Hasil diperkecil supaya sisi terpanjang mentok ' + MAKS_SISI + ' px.</p>' : ''));
  }

  async function onPick() {
    T.hide(infoBox); T.hide(box);
    const files = [...(fi.files || [])].filter((f) => /^image\//.test(f.type));
    if (!files.length) { T.toast('Pilih foto dulu'); return; }
    if (files.length < 2) { T.toast('Minimal 2 foto biar bisa disambung'); return; }
    if (files.length > MAKS_FOTO) T.toast('Maksimal 10 foto, yang dipakai 10 pertama aja ya');
    try { imgs = await Promise.all(files.slice(0, MAKS_FOTO).map(loadImage)); }
    catch (e) { T.toast('Ada file yang bukan gambar valid'); return; }
    make();
    T.toast('Foto tersambung!');
  }

  const dlB = T.btn('Unduh PNG', async () => {
    if (imgs.length < 2) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    T.dl('gabung-foto.png', blob, 'image/png');
    T.toast('Berhasil diunduh (' + fmtBytes(blob.size) + ')');
  }, true);

  arahSel.addEventListener('change', make);
  samakanSel.addEventListener('change', make);
  jarakR.addEventListener('input', () => { jarakV.textContent = jarakR.value + 'px'; make(); });
  warnaI.addEventListener('input', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih 2-10 foto sekaligus. Foto disambung ujung ke ujung tanpa dipotong, urutannya sama seperti urutan kamu milih.</p>'));
  root.appendChild(T.field('Pilih 2-10 foto (bisa multi-select)', fi, 'Di HP: tahan dan pilih beberapa foto sekaligus.'));
  root.appendChild(T.grid2(T.field('Arah sambung', arahSel), T.field('Samakan ukuran', samakanSel)));
  root.appendChild(T.grid2(T.field('Jarak antar foto', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(jarakR); w.appendChild(jarakV); return w; })()), T.field('Warna latar sela', warnaI)));
  root.appendChild(T.row(T.btn('Pilih ulang foto', () => fi.click()), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', onPick);
}
