import { h as T, utils } from '../../core.js?v=6.8.0';
import { loadImage, fileInput, canvasToBlob, fmtBytes, LOCAL_NOTE } from '../../core.js?v=6.8.0';

export const meta = {"id":"crop-pas-foto","name":"Crop Pas Foto","cat":"gambar","icon":"🪪","desc":"Crop foto sesuai rasio pas foto resmi.","keywords":"pas foto,crop,ktp,lamaran,rasio"};

/* Crop pas foto: bingkai rasio tetap (2:3 / 3:4 / 4:6), fotonya bisa
   digeser pakai jari di dalam bingkai. Saat unduh, area bingkai dihitung
   ulang ke resolusi asli foto. */
const RATIOS = [
  ['2x3', '2 × 3', 2, 3],
  ['3x4', '3 × 4', 3, 4],
  ['4x6', '4 × 6', 4, 6],
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

  const wrap = T.el('<div style="max-width:320px;margin:0 auto"></div>');
  const frame = T.el('<div style="position:relative;overflow:hidden;border-radius:10px;border:1px solid #ffffff20;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;background:#18181b"></div>');
  const im = document.createElement('img');
  im.draggable = false;
  im.style.cssText = 'position:absolute;top:0;left:0;max-width:none;pointer-events:none';
  const hint = T.el('<p class="mut" style="text-align:center;font-size:13px;margin:10px 0 0">👆 Geser fotonya biar pas di bingkai</p>');
  const box = T.out();
  const infoBox = T.out();

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

  const muat = async () => {
    if (!fi.files[0]) { T.toast('Pilih foto dulu'); return; }
    try { img = await loadImage(fi.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    nw = img.naturalWidth; nh = img.naturalHeight;
    im.src = img.src;
    T.show(box, '');
    box.appendChild(wrap);
    wrap.appendChild(frame);
    frame.appendChild(im);
    wrap.appendChild(hint);
    applyRatio();
    T.hide(infoBox);
    T.toast('Foto dimuat — geser biar wajahnya pas');
  };

  const unduh = async () => {
    if (!img) { T.toast('Muat foto dulu'); return; }
    const rw = ratio[2], rh = ratio[3];
    const outW = 1200, outH = Math.round(1200 * rh / rw);
    // bingkai -> koordinat asli foto
    const sc = nw / imgW;
    let bx = Math.round(-ox * sc), by = Math.round(-oy * sc);
    let bw = Math.round(fw * sc), bh = Math.round(fh * sc);
    bx = Math.max(0, Math.min(nw - 1, bx)); by = Math.max(0, Math.min(nh - 1, by));
    bw = Math.min(bw, nw - bx); bh = Math.min(bh, nh - by);
    const out = document.createElement('canvas'); out.width = outW; out.height = outH;
    const oc = out.getContext('2d');
    oc.fillStyle = '#ffffff'; oc.fillRect(0, 0, outW, outH);
    oc.drawImage(img, bx, by, bw, bh, 0, 0, outW, outH);
    const blob = await canvasToBlob(out, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    T.show(infoBox, '<div class="kv"><span>Hasil</span><b>' + outW + '×' + outH + ' px (' + fmtBytes(blob.size) + ') — rasio ' + ratio[1] + '</b></div>');
    const base = (fi.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-pasfoto-' + ratio[0] + '.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
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

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Buat pas foto sendiri: pilih rasio resmi (2×3, 3×4, 4×6), lalu <b>geser fotonya</b> di dalam bingkai sampai wajahnya pas di tengah.</p>'));
  root.appendChild(T.field('Pilih foto', fi));
  root.appendChild(T.row(T.btn('Muat foto', muat, true)));
  root.appendChild(T.field('Rasio', ratioRow));
  root.appendChild(T.row(T.btn('Unduh Hasil PNG', unduh, true)));
  root.appendChild(infoBox);
  root.appendChild(box);
  fi.addEventListener('change', muat);
}
