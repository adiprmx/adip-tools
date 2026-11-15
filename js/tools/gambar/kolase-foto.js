import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, imgEl, loadImage } from '../../core.js?v=6.11.5';

export const meta = {"id":"kolase-foto","name":"Kolase Foto","cat":"gambar","icon":"🖼️","desc":"Gabung 2-6 foto jadi satu kanvas, template + rasio sosmed.","keywords":"kolase,foto,gabung,grid,instagram,story,feed"};

const RASIO = [
  ['1:1', 'Persegi 1:1 (feed)', 1080, 1080],
  ['4:5', 'Potret 4:5 (feed)', 1080, 1350],
  ['9:16', 'Story 9:16', 1080, 1920],
  ['16:9', 'Lanskap 16:9', 1920, 1080],
  ['3:2', 'Lanskap 3:2', 1620, 1080],
];

// Template per jumlah foto: fungsi (W, H, gap) -> daftar [x, y, w, h]
const TEMPLATE = {
  2: [
    ['side2', 'Berdampingan', (W, H, g) => { const h = (W - g) / 2; return [[0, 0, h, H], [h + g, 0, h, H]]; }],
    ['stack2', 'Atas bawah', (W, H, g) => { const h = (H - g) / 2; return [[0, 0, W, h], [0, h + g, W, h]]; }],
  ],
  3: [
    ['big2', '1 besar + 2 kecil', (W, H, g) => { const h = (W - g) / 2, v = (H - g) / 2; return [[0, 0, h, H], [h + g, 0, h, v], [h + g, v + g, h, v]]; }],
    ['col3', '3 kolom', (W, H, g) => { const w = (W - 2 * g) / 3; return [[0, 0, w, H], [w + g, 0, w, H], [2 * (w + g), 0, w, H]]; }],
    ['row3', '3 baris', (W, H, g) => { const h = (H - 2 * g) / 3; return [[0, 0, W, h], [0, h + g, W, h], [0, 2 * (h + g), W, h]]; }],
  ],
  4: [
    ['grid4', 'Grid 2x2', (W, H, g) => { const w = (W - g) / 2, h = (H - g) / 2; return [[0, 0, w, h], [w + g, 0, w, h], [0, h + g, w, h], [w + g, h + g, w, h]]; }],
    ['big3', '1 besar + 3 kecil', (W, H, g) => { const w = (W - g) / 2, h = (H - 2 * g) / 3; return [[0, 0, w, H], [w + g, 0, w, h], [w + g, h + g, w, h], [w + g, 2 * (h + g), w, h]]; }],
    ['col4', '4 kolom', (W, H, g) => { const w = (W - 3 * g) / 4; return [0, 1, 2, 3].map((i) => [i * (w + g), 0, w, H]); }],
  ],
  5: [
    ['grid5', '2 atas + 3 bawah', (W, H, g) => { const h = (H - g) / 2, w2 = (W - g) / 2, w3 = (W - 2 * g) / 3; return [[0, 0, w2, h], [w2 + g, 0, w2, h], [0, h + g, w3, h], [w3 + g, h + g, w3, h], [2 * (w3 + g), h + g, w3, h]]; }],
    ['big4', '1 besar + 4 kecil', (W, H, g) => { const w = (W - g) / 2, cw = (w - g) / 2, ch = (H - g) / 2, x0 = w + g; return [[0, 0, w, H], [x0, 0, cw, ch], [x0 + cw + g, 0, cw, ch], [x0, ch + g, cw, ch], [x0 + cw + g, ch + g, cw, ch]]; }],
  ],
  6: [
    ['grid6a', 'Grid 3x2', (W, H, g) => { const w = (W - 2 * g) / 3, h = (H - g) / 2; return [0, 1, 2, 3, 4, 5].map((i) => [(i % 3) * (w + g), Math.floor(i / 3) * (h + g), w, h]); }],
    ['grid6b', 'Grid 2x3', (W, H, g) => { const w = (W - g) / 2, h = (H - 2 * g) / 3; return [0, 1, 2, 3, 4, 5].map((i) => [(i % 2) * (w + g), Math.floor(i / 2) * (h + g), w, h]); }],
  ],
};

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
  const gapR = T.el('<input type="range" min="0" max="40" value="10" class="inp">');
  const gapV = T.el('<span class="hint" style="min-width:44px;text-align:right">10px</span>');
  const rasioSel = T.select(RASIO.map(([v, l]) => [v, l]), '1:1');
  const templateSel = T.select([['', 'Pilih foto dulu']], '');
  const box = T.out();
  const infoBox = T.out();
  const cv = document.createElement('canvas');
  let imgs = [];
  let rasio = RASIO[0];

  function templateAktif() {
    const daftar = TEMPLATE[imgs.length] || [];
    return daftar.find(([id]) => id === templateSel.value) || daftar[0];
  }

  function isiTemplate() {
    const daftar = TEMPLATE[imgs.length] || [];
    templateSel.innerHTML = '';
    daftar.forEach(([id, label]) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = label;
      templateSel.appendChild(o);
    });
    if (!daftar.length) {
      const o = document.createElement('option');
      o.value = ''; o.textContent = 'Pilih foto dulu';
      templateSel.appendChild(o);
    }
  }

  function make() {
    const n = imgs.length;
    if (!n) return;
    const t = templateAktif();
    if (!t) return;
    const W = rasio[2], H = rasio[3], gap = +gapR.value;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = gapColor.value;
    ctx.fillRect(0, 0, W, H);
    t[2](W, H, gap).forEach(([x, y, w, h], i) => {
      if (imgs[i] && w > 0 && h > 0) drawCover(ctx, imgs[i], x, y, w, h);
    });
    cv.style.cssText = 'max-width:100%;height:auto;border-radius:10px;border:1px solid #ffffff20;display:block';
    T.show(box, '');
    box.appendChild(cv);
    T.show(infoBox, '<div class="kv"><span>Template</span><b>' + T.esc(t[1]) + '</b></div>' +
      '<div class="kv"><span>Ukuran</span><b>' + W + 'x' + H + ' px (' + T.esc(rasio[1]) + ')</b></div>');
  }

  async function onPick() {
    T.hide(infoBox); T.hide(box);
    const files = [...(fileI.files || [])].filter((f) => /^image\//.test(f.type));
    if (!files.length) { T.toast('Pilih foto dulu'); return; }
    if (files.length < 2) { T.toast('Minimal 2 foto biar jadi kolase'); return; }
    if (files.length > 6) T.toast('Maksimal 6 foto, yang dipakai 6 pertama aja ya');
    try { imgs = await Promise.all(files.slice(0, 6).map(loadImage)); }
    catch (e) { T.toast('Ada file yang bukan gambar valid'); return; }
    isiTemplate();
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
  gapR.addEventListener('input', () => { gapV.textContent = gapR.value + 'px'; make(); });
  rasioSel.addEventListener('change', () => { rasio = RASIO.find(([v]) => v === rasioSel.value) || RASIO[0]; make(); });
  templateSel.addEventListener('change', make);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Pilih 2-6 foto sekaligus, lalu pilih template dan rasionya. Urutan foto = urutan kamu milih.</p>'));
  root.appendChild(T.field('Pilih 2-6 foto (bisa multi-select)', fileI, 'Di HP: tahan & pilih beberapa foto sekaligus.'));
  root.appendChild(T.grid2(T.field('Template', templateSel), T.field('Rasio', rasioSel)));
  root.appendChild(T.grid2(T.field('Warna garis pembatas', gapColor), T.field('Lebar garis', (() => { const w = T.el('<div style="display:flex;gap:8px;align-items:center"></div>'); w.appendChild(gapR); w.appendChild(gapV); return w; })())));
  root.appendChild(T.row(T.btn('Pilih ulang foto', () => fileI.click()), dlB));
  root.appendChild(infoBox);
  root.appendChild(box);
  fileI.addEventListener('change', onPick);
}
