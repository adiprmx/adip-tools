import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, imgEl, loadImage } from '../../core.js?v=6.4.0';

export const meta = {"id":"kolase-foto","name":"Kolase Foto","cat":"gambar","icon":"🖼️","desc":"Gabung 2–4 foto jadi satu kanvas.","keywords":"kolase,foto,gabung,grid,instagram"};

const S = 1080; // kanvas keluaran

function layout(n, gap) {
  const g = gap, half = (S - g) / 2;
  if (n === 2) return [[0, 0, half, S], [half + g, 0, half, S]];
  if (n === 3) return [[0, 0, half, S], [half + g, 0, half, half], [half + g, half + g, half, half]];
  return [[0, 0, half, half], [half + g, 0, half, half], [0, half + g, half, half], [half + g, half + g, half, half]];
}

function drawCover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const sc = Math.max(w / iw, h / ih);
  const dw = iw * sc, dh = ih * sc;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function render(root) {
  const fileI = fileInput('image/*');
  fileI.multiple = true;
  const gapColor = T.el('<input type="color" value="#ffffff" style="width:100%;height:44px;border:1px solid #27272a;border-radius:8px;background:none;padding:4px;cursor:pointer">');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  let imgs = [];

  function make() {
    const n = imgs.length;
    if (!n) return;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = gapColor.value;
    ctx.fillRect(0, 0, S, S);
    layout(n, 10).forEach(([x, y, w, h], i) => drawCover(ctx, imgs[i], x, y, w, h));
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    const nama = { 2: '2 kolom', 3: '1 besar + 2 kecil', 4: 'grid 2×2' }[n];
    T.show(infoBox, '<div class="kv"><span>Template</span><b>' + nama + '</b></div>' +
      '<div class="kv"><span>Ukuran</span><b>1080×1080 px — pas buat feed</b></div>');
  }

  async function onPick() {
    T.hide(infoBox); T.hide(box);
    const files = [...(fileI.files || [])].filter((f) => /^image\//.test(f.type));
    if (!files.length) { T.toast('Pilih foto dulu'); return; }
    if (files.length < 2) { T.toast('Minimal 2 foto biar jadi kolase'); return; }
    if (files.length > 4) T.toast('Maksimal 4 foto — yang dipakai 4 pertama aja ya');
    try { imgs = await Promise.all(files.slice(0, 4).map(loadImage)); }
    catch (e) { T.toast('Ada file yang bukan gambar valid'); return; }
    make();
    T.toast('Kolase jadi!');
  }

  const dlB = T.btn('Unduh PNG', async () => {
    if (!imgs.length) { T.toast('Pilih foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    T.dl('kolase-foto.png', blob, 'image/png');
    T.toast('Berhasil diunduh');
  }, true);

  gapColor.addEventListener('input', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih 2–4 foto sekaligus, template-nya otomatis ngikutin jumlahnya. Urutan foto = urutan kamu milih.</p>'));
  root.appendChild(T.field('Pilih 2–4 foto (bisa multi-select)', fileI, 'Di HP: tahan & pilih beberapa foto sekaligus.'));
  root.appendChild(T.field('Warna garis pembatas', gapColor));
  root.appendChild(T.row(T.btn('Pilih ulang foto', () => fileI.click()), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fileI.addEventListener('change', onPick);
}
