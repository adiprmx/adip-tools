import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.6.0';

export const meta = {"id":"twibbon-maker","name":"Twibbon Maker","cat":"gambar","icon":"🖼️","desc":"Bikin twibbon: bingkai + pita teks buat fotomu.","keywords":"twibbon,bingkai,frame,foto,kampanye,pita,teks"};

const SIZE = 1080;

const TEMPLATES = [
  ['lingkaran', '⭕ Bingkai Lingkaran'],
  ['bingkai', '🟥 Bingkai Tebal'],
  ['pita', '🎀 Pita Bawah + Teks'],
  ['lingkaran-pita', '🎗️ Lingkaran + Pita'],
];

function getLS(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : v; } catch (e) { return fb; } }
function setLS(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* abaikan */ } }

/* Gambar foto cover-fit dengan offset & zoom ke dalam area persegi. */
function drawCover(x, img, ox, oy, zoom, cx, cy, half) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max((half * 2) / iw, (half * 2) / ih); // skala cover dasar
  const s = base * zoom;
  const dw = iw * s, dh = ih * s;
  x.drawImage(img, cx + ox - dw / 2, cy + oy - dh / 2, dw, dh);
}

function fitFont(x, text, maxW, basePx, family) {
  let px = basePx;
  x.font = '700 ' + px + 'px ' + family;
  while (x.measureText(text).width > maxW && px > 20) { px -= 4; x.font = '700 ' + px + 'px ' + family; }
  return px;
}

export function render(root) {
  const fileI = fileInput('image/*');
  const tmplS = T.select(TEMPLATES, getLS('tw-color') ? getLS('tw-tmpl', 'pita') : 'pita');
  const colorI = T.input('color'); colorI.value = getLS('tw-color', '#16a34a');
  colorI.style.cssText = 'width:100%;height:44px;padding:2px;border:1px solid #ffffff20;border-radius:10px;background:#12100d;cursor:pointer';
  const textI = T.input('text', 'Teks di pita…', getLS('tw-text', 'Dukung Acaranya!'));
  const zoomR = T.input('range'); zoomR.min = '1'; zoomR.max = '3'; zoomR.step = '0.01'; zoomR.value = '1';
  const zoomV = T.el('<b>100%</b>');
  const box = T.out();

  const cv = document.createElement('canvas');
  cv.width = SIZE; cv.height = SIZE;
  cv.style.cssText = 'width:100%;height:auto;border-radius:12px;border:1px solid #ffffff20;display:block;touch-action:none;cursor:grab;background:#12100d';
  const x = cv.getContext('2d');

  let img = null;
  let zoom = 1, ox = 0, oy = 0; // offset dalam px kanvas
  let template = tmplS.value || 'pita';
  let frameColor = colorI.value;
  let ribbonText = textI.value || '';

  const cx = SIZE / 2, cy = SIZE / 2, half = SIZE / 2;

  function draw() {
    x.clearRect(0, 0, SIZE, SIZE);
    x.fillStyle = '#12100d'; x.fillRect(0, 0, SIZE, SIZE);
    const isCircle = template === 'lingkaran' || template === 'lingkaran-pita';

    if (img) {
      x.save();
      if (isCircle) { x.beginPath(); x.arc(cx, cy, half - 60, 0, Math.PI * 2); x.clip(); }
      else if (template === 'pita') { x.beginPath(); x.rect(0, 0, SIZE, SIZE - 200); x.clip(); }
      drawCover(x, img, ox, oy, zoom, cx, isCircle ? cy : (SIZE - 200) / 2, isCircle ? half - 60 : half);
      x.restore();
    } else {
      x.fillStyle = '#8a8073'; x.font = '28px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('Upload fotomu dulu…', cx, cy);
    }

    // Bingkai (digambar via canvas, bukan gambar eksternal)
    x.strokeStyle = frameColor;
    if (template === 'lingkaran' || template === 'lingkaran-pita') {
      x.lineWidth = 70;
      x.beginPath(); x.arc(cx, cy, half - 60, 0, Math.PI * 2); x.stroke();
      x.lineWidth = 10; x.strokeStyle = '#ffffff';
      x.globalAlpha = 0.85;
      x.beginPath(); x.arc(cx, cy, half - 110, 0, Math.PI * 2); x.stroke();
      x.globalAlpha = 1; x.strokeStyle = frameColor;
    } else if (template === 'bingkai') {
      x.lineWidth = 90;
      x.strokeRect(45, 45, SIZE - 90, SIZE - 90);
      x.lineWidth = 8; x.strokeStyle = '#ffffff'; x.globalAlpha = 0.85;
      x.strokeRect(110, 110, SIZE - 220, SIZE - 220);
      x.globalAlpha = 1;
    }

    // Pita bawah + teks
    if (template === 'pita' || template === 'lingkaran-pita') {
      const ph = 210;
      x.fillStyle = frameColor;
      x.fillRect(0, SIZE - ph, SIZE, ph);
      x.fillStyle = 'rgba(255,255,255,.9)';
      x.fillRect(0, SIZE - ph, SIZE, 8); // garis aksen atas pita
      if (ribbonText.trim()) {
        x.fillStyle = '#ffffff';
        x.textAlign = 'center'; x.textBaseline = 'middle';
        const px = fitFont(x, ribbonText.trim(), SIZE - 140, 84, 'system-ui, sans-serif');
        x.fillText(ribbonText.trim(), cx, SIZE - ph / 2 + 6, SIZE - 120);
        x.font = '28px system-ui'; // reset ringan
      }
    }
  }

  /* Drag untuk geser foto */
  let dragging = false, sx = 0, sy = 0, sox = 0, soy = 0;
  cv.addEventListener('pointerdown', (e) => {
    if (!img) return;
    dragging = true; sx = e.clientX; sy = e.clientY; sox = ox; soy = oy;
    cv.setPointerCapture(e.pointerId);
    cv.style.cursor = 'grabbing';
  });
  cv.addEventListener('pointermove', (e) => {
    if (!dragging || !img) return;
    const r = cv.getBoundingClientRect();
    const k = SIZE / r.width; // skala css -> kanvas
    ox = sox + (e.clientX - sx) * k;
    oy = soy + (e.clientY - sy) * k;
    const lim = SIZE / 2;
    ox = Math.max(-lim, Math.min(lim, ox));
    oy = Math.max(-lim, Math.min(lim, oy));
    draw();
  });
  const endDrag = () => { dragging = false; cv.style.cursor = 'grab'; };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  zoomR.addEventListener('input', () => {
    zoom = parseFloat(zoomR.value) || 1;
    zoomV.textContent = Math.round(zoom * 100) + '%';
    draw();
  });
  tmplS.addEventListener('change', () => { template = tmplS.value; setLS('tw-tmpl', template); draw(); });
  colorI.addEventListener('input', () => { frameColor = colorI.value; setLS('tw-color', frameColor); draw(); });
  textI.addEventListener('input', () => { ribbonText = textI.value; setLS('tw-text', ribbonText); draw(); });
  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try { img = await loadImage(fileI.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    zoom = 1; ox = 0; oy = 0;
    zoomR.value = '1'; zoomV.textContent = '100%';
    draw();
    T.toast('Foto kepasang! Geser / zoom biar pas');
  });

  const dlB = T.btn('Unduh PNG', async () => {
    if (!img) { T.toast('Upload foto dulu'); return; }
    const blob = await canvasToBlob(cv, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fileI.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-twibbon.png', blob, 'image/png');
    T.toast('Twibbon siap disebar!');
  }, true);

  const zoomRow = T.el('<div style="display:flex;gap:10px;align-items:center"></div>');
  zoomRow.appendChild(zoomR); zoomRow.appendChild(zoomV);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Bikin twibbon kampanye / event tanpa buka Photoshop. Upload foto, pilih bingkai, <b>geser langsung di gambarnya</b> buat atur posisi, zoom pakai slider, tulis teks di pita — jadi.</p>'));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.grid2(
    T.field('Model bingkai', tmplS),
    T.field('Warna bingkai & pita', colorI)
  ));
  root.appendChild(T.field('Teks di pita', textI, 'Cuma kepakai di model yang ada pitanya.'));
  root.appendChild(T.field('Zoom foto', zoomRow, 'Atau geser langsung fotonya di kanvas buat mindahin posisi.'));
  T.show(box, '');
  box.appendChild(cv);
  root.appendChild(box);
  root.appendChild(T.row(dlB));
  draw();
}
