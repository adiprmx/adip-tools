import { h as T, LOCAL_NOTE, canvasToBlob, fileInput, loadImage } from '../../core.js?v=6.7.0';

export const meta = {"id":"efek-polaroid","name":"Efek Polaroid","cat":"gambar","icon":"📸","desc":"Foto jadi polaroid klasik + caption tulisan tangan.","keywords":"polaroid,foto,efek,vintage,retro,caption,klasik"};

const PAD = 90;      // border putih samping/atas
const PAD_BOTTOM = 300; // area bawah (lebih tebal) buat caption

function getLS(k, fb) { try { const v = localStorage.getItem(k); return v == null ? fb : v; } catch (e) { return fb; } }
function setLS(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* abaikan */ } }

function makePolaroid(img, caption, maxW) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const s = Math.min(1, maxW / iw);
  const pw = Math.max(1, Math.round(iw * s));
  const ph = Math.max(1, Math.round(ih * s));
  const W = pw + PAD * 2, H = ph + PAD + PAD_BOTTOM;

  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');

  // Kertas polaroid putih + bayangan halus
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#f7f5f0';
  x.fillRect(0, 0, W, 10); // kilau atas tipis

  // Foto
  x.drawImage(img, PAD, PAD, pw, ph);

  // Garis dalam tipis (kesan cetakan)
  x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2;
  x.strokeRect(PAD, PAD, pw, ph);

  // Caption tulisan tangan-ish (font cursive sistem)
  const cap = String(caption || '').trim();
  if (cap) {
    x.fillStyle = '#2b2b2b';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const fam = '"Segoe Script","Comic Sans MS","Chalkboard SE",cursive';
    let px = 64;
    x.font = 'italic ' + px + 'px ' + fam;
    while (x.measureText(cap).width > W - PAD * 2 && px > 24) {
      px -= 4;
      x.font = 'italic ' + px + 'px ' + fam;
    }
    // miring dikit biar kesan tulisan tangan
    x.save();
    x.translate(W / 2, PAD + ph + (PAD_BOTTOM - PAD) / 2);
    x.rotate(-0.02);
    x.fillText(cap, 0, 0, W - PAD * 2);
    x.restore();
  }
  return c;
}

export function render(root) {
  const fileI = fileInput('image/*');
  const capI = T.input('text', 'Tulis caption…', getLS('pl-caption', 'kenangan indah ♡'));
  const box = T.out();
  let img = null, resCanvas = null;

  function update() {
    if (!img) { T.hide(box); resCanvas = null; return; }
    const cap = capI.value;
    setLS('pl-caption', cap);
    resCanvas = makePolaroid(img, cap, 1200);
    T.show(box, '');
    const cap2 = T.el('<div class="hint" style="margin-bottom:6px">Pratinjau polaroid</div>');
    box.appendChild(cap2);
    const im = document.createElement('img');
    im.alt = 'Hasil polaroid';
    im.style.cssText = 'max-width:100%;height:auto;border-radius:4px;display:block;box-shadow:0 8px 24px rgba(0,0,0,.45)';
    canvasToBlob(resCanvas, 'image/png').then((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      im.src = url;
      T.onLeave(() => URL.revokeObjectURL(url));
    });
    box.appendChild(im);
  }

  fileI.addEventListener('change', async () => {
    if (!fileI.files[0]) return;
    try { img = await loadImage(fileI.files[0]); }
    catch (e) { T.toast('File bukan gambar yang valid'); return; }
    T.toast('Kepasang! Tulis caption sesukamu');
    update();
  });
  capI.addEventListener('input', update);

  const dlB = T.btn('Unduh PNG', async () => {
    if (!resCanvas) { T.toast('Upload foto dulu'); return; }
    const blob = await canvasToBlob(resCanvas, 'image/png');
    if (!blob) { T.toast('Gagal membuat file'); return; }
    const base = (fileI.files[0] && fileI.files[0].name || 'foto').replace(/\.[^.]*$/, '');
    T.dl(base + '-polaroid.png', blob, 'image/png');
    T.toast('Polaroidnya jadi, siap dipajang!');
  }, true);

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<p class="mut" style="font-size:13.5px;line-height:1.6">Kangen zaman foto cetak? Upload foto, kasih caption ala tulisan tangan di bagian bawahnya yang lebar itu — hasilnya polaroid klasik siap diunduh.</p>'));
  root.appendChild(T.field('Pilih foto', fileI));
  root.appendChild(T.field('Caption', capI, 'Tampil di area putih bawah, font-nya gaya tulisan tangan.'));
  root.appendChild(T.row(dlB));
  root.appendChild(box);
}
